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
        $sql .= ' ORDER BY ar.room_id, ar.id';

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

        $where  = ['sa.exam_id = ?'];
        $values = [$data['examId']];

        if (!empty($data['roomId'])) {
            $where[]  = 'sa.room_id = ?';
            $values[] = $data['roomId'];
        }

        $stmt = $db->prepare('
            SELECT sa.exam_id, sa.room_id, sa.student_id
            FROM seating_allocations sa
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY sa.room_id, sa.seat_number
        ');
        $stmt->execute($values);
        $seats = $stmt->fetchAll();

        if (empty($seats)) {
            errorResponse('No seating allocations found. Run seating allocation first.');
        }

        // Remove existing attendance for this exam/room
        $delWhere  = ['exam_id = ?'];
        $delValues = [$data['examId']];
        if (!empty($data['roomId'])) {
            $delWhere[]  = 'room_id = ?';
            $delValues[] = $data['roomId'];
        }
        $db->prepare('DELETE FROM attendance_records WHERE ' . implode(' AND ', $delWhere))->execute($delValues);

        $stmt = $db->prepare('
            INSERT INTO attendance_records (exam_id, room_id, student_id, status, signature)
            VALUES (?, ?, ?, "not-marked", 0)
        ');

        $db->beginTransaction();
        foreach ($seats as $seat) {
            $stmt->execute([$seat['exam_id'], $seat['room_id'], $seat['student_id']]);
        }
        $db->commit();

        jsonResponse(['message' => count($seats) . ' attendance records generated', 'count' => count($seats)]);
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

        $db     = getDB();
        $where  = ['exam_id = ?'];
        $values = [$data['examId']];

        if (!empty($data['roomId'])) {
            $where[]  = 'room_id = ?';
            $values[] = $data['roomId'];
        }

        $stmt = $db->prepare('UPDATE attendance_records SET status = "present" WHERE ' . implode(' AND ', $where));
        $stmt->execute($values);

        jsonResponse(['message' => 'All students marked present', 'updated' => $stmt->rowCount()]);
    }
}
