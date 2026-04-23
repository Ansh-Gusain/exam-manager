<?php
require_once __DIR__ . '/../helpers/response.php';

class AttendanceController {
    public function index(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $where  = [];
        $values = [];

        foreach (['exam_id','room_id','student_id','status'] as $field) {
            $key = lcfirst(str_replace('_', '', ucwords($field, '_')));
            if (!empty($q[$key])) {
                $where[]  = "ar.$field = ?";
                $values[] = $q[$key];
            }
        }

        $sql = '
            SELECT ar.*, s.name AS student_name, s.roll_number,
                   r.room_number, r.building, e.name AS exam_name
            FROM attendance_records ar
            JOIN students s ON ar.student_id = s.id
            JOIN rooms r    ON ar.room_id    = r.id
            JOIN exams e    ON ar.exam_id    = e.id
        ';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY ar.room_id, s.branch, s.roll_number';

        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['signature'] = (bool)$r['signature'];
        }
        jsonResponse($rows);
    }

    public function generate(array $params): void {
        $data = getBody();
        if (empty($data['examId'])) errorResponse('examId is required');

        $db = getDB();

        // If roomId provided, generate for ALL exams that have students in this room
        // This handles the case where 2 exams share a room
        if (!empty($data['roomId'])) {
            // Find all exam_ids that have seating in this room
            $stmt = $db->prepare('
                SELECT DISTINCT exam_id FROM seating_allocations WHERE room_id = ?
            ');
            $stmt->execute([$data['roomId']]);
            $examIdsInRoom = array_column($stmt->fetchAll(), 'exam_id');
        } else {
            $examIdsInRoom = [$data['examId']];
        }

        // Get all seating allocations for these exams in this room
        $allSeats = [];
        foreach ($examIdsInRoom as $eid) {
            $where  = ['sa.exam_id = ?'];
            $values = [$eid];
            if (!empty($data['roomId'])) {
                $where[]  = 'sa.room_id = ?';
                $values[] = $data['roomId'];
            }
            $stmt = $db->prepare('
                SELECT sa.exam_id, sa.room_id, sa.student_id
                FROM seating_allocations sa
                JOIN students s ON sa.student_id = s.id
                WHERE ' . implode(' AND ', $where) . '
                ORDER BY s.branch, s.roll_number
            ');
            $stmt->execute($values);
            $allSeats = array_merge($allSeats, $stmt->fetchAll());
        }

        if (empty($allSeats)) {
            errorResponse('No seating allocations found. Run seating allocation first.');
        }

        // Remove existing attendance for this room (all exams)
        if (!empty($data['roomId'])) {
            $ph = implode(',', array_fill(0, count($examIdsInRoom), '?'));
            $db->prepare("DELETE FROM attendance_records WHERE room_id = ? AND exam_id IN ($ph)")
               ->execute([$data['roomId'], ...$examIdsInRoom]);
        } else {
            $db->prepare('DELETE FROM attendance_records WHERE exam_id = ?')->execute([$data['examId']]);
        }

        $stmt = $db->prepare('
            INSERT INTO attendance_records (exam_id, room_id, student_id, status, signature)
            VALUES (?, ?, ?, "not-marked", 0)
        ');

        $db->beginTransaction();
        foreach ($allSeats as $seat) {
            $stmt->execute([$seat['exam_id'], $seat['room_id'], $seat['student_id']]);
        }
        $db->commit();

        jsonResponse(['message' => count($allSeats) . ' attendance records generated', 'count' => count($allSeats)]);
    }

    public function update(array $params): void {
        $data   = getBody();
        $db     = getDB();
        $status = $data['status'] ?? 'not-marked';

        // Validate status enum
        if (!in_array($status, ['present', 'absent', 'not-marked'], true)) {
            errorResponse('Invalid status value');
        }

        $stmt = $db->prepare('SELECT id FROM attendance_records WHERE id = ?');
        $stmt->execute([$params['id']]);
        if (!$stmt->fetch()) errorResponse('Attendance record not found', 404);

        $stmt = $db->prepare('UPDATE attendance_records SET status=?, signature=? WHERE id=?');
        $stmt->execute([$status, isset($data['signature']) ? (int)(bool)$data['signature'] : 0, $params['id']]);

        $stmt = $db->prepare('SELECT * FROM attendance_records WHERE id = ?');
        $stmt->execute([$params['id']]);
        $row = $stmt->fetch();
        $row['signature'] = (bool)$row['signature'];
        jsonResponse($row);
    }

    public function markAllPresent(array $params): void {
        $data = getBody();
        if (empty($data['examId'])) errorResponse('examId is required');

        $db = getDB();

        if (!empty($data['roomId'])) {
            // Mark all students in this room present (across all exams sharing the room)
            $stmt = $db->prepare('
                UPDATE attendance_records SET status = "present", signature = 1
                WHERE room_id = ?
            ');
            $stmt->execute([$data['roomId']]);
        } else {
            $stmt = $db->prepare('UPDATE attendance_records SET status = "present", signature = 1 WHERE exam_id = ?');
            $stmt->execute([$data['examId']]);
        }

        jsonResponse(['message' => 'All students marked present with signature', 'updated' => $stmt->rowCount()]);
    }
}
