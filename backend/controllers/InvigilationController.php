<?php
require_once __DIR__ . '/../helpers/response.php';

class InvigilationController {
    public function index(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $where  = [];
        $values = [];

        if (!empty($q['examId'])) {
            $where[]  = 'ia.exam_id = ?';
            $values[] = $q['examId'];
        }
        if (!empty($q['facultyId'])) {
            $where[]  = 'ia.faculty_id = ?';
            $values[] = $q['facultyId'];
        }

        $sql = '
            SELECT ia.*, f.name AS faculty_name, f.employee_id,
                   r.room_number, r.building, e.name AS exam_name
            FROM invigilation_allocations ia
            JOIN faculty f ON ia.faculty_id = f.id
            JOIN rooms r   ON ia.room_id    = r.id
            JOIN exams e   ON ia.exam_id    = e.id
        ';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY ia.exam_id, ia.room_id';

        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        jsonResponse($stmt->fetchAll());
    }

    public function allocate(array $params): void {
        $data = getBody();
        if (empty($data['examId'])) errorResponse('examId is required');

        $db = getDB();

        // Load exam
        $stmt = $db->prepare('SELECT * FROM exams WHERE id = ?');
        $stmt->execute([$data['examId']]);
        $exam = $stmt->fetch();
        if (!$exam) errorResponse('Exam not found', 404);

        // Load rooms that actually have seating allocations for this exam
        $stmt = $db->prepare('
            SELECT DISTINCT r.*
            FROM rooms r
            JOIN seating_allocations sa ON sa.room_id = r.id
            WHERE sa.exam_id = ? AND r.is_available = 1
            ORDER BY r.room_number
        ');
        $stmt->execute([$data['examId']]);
        $rooms = $stmt->fetchAll();

        if (empty($rooms)) {
            errorResponse('No rooms with seating allocations found for this exam. Run seating allocation first.');
        }

        $roomsCount   = count($rooms);
        $facultyNeeded = $roomsCount * 2; // 2 per room (1 chief + 1 assistant)

        // Load faculty already assigned to ANY exam on the SAME date
        // (a faculty cannot invigilate two rooms at the same time)
        $stmt = $db->prepare('
            SELECT DISTINCT ia.faculty_id
            FROM invigilation_allocations ia
            JOIN exams e ON ia.exam_id = e.id
            WHERE e.date = ? AND ia.exam_id != ?
        ');
        $stmt->execute([$exam['date'], $data['examId']]);
        $busyOnDate = array_flip(array_column($stmt->fetchAll(), 'faculty_id'));

        // Load faculty available, not busy on this date, sorted by total_duties (load balance)
        $stmt = $db->prepare('
            SELECT * FROM faculty
            WHERE is_available = 1
            ORDER BY total_duties ASC, RAND()
        ');
        $stmt->execute();
        $allFaculty = $stmt->fetchAll();

        // Filter out faculty busy on this date
        $available = array_values(array_filter($allFaculty, fn($f) => !isset($busyOnDate[$f['id']])));

        if (count($available) < $facultyNeeded) {
            errorResponse("Not enough available faculty. Need $facultyNeeded (2 per room × $roomsCount rooms) but only " . count($available) . " available on this date.");
        }

        // Clear existing allocations for this exam
        $db->prepare('DELETE FROM invigilation_allocations WHERE exam_id = ?')->execute([$data['examId']]);

        $insertStmt   = $db->prepare('
            INSERT INTO invigilation_allocations (exam_id, room_id, faculty_id, role)
            VALUES (?, ?, ?, ?)
        ');
        $updateDuties = $db->prepare('UPDATE faculty SET total_duties = total_duties + 1 WHERE id = ?');

        $db->beginTransaction();
        $allocated    = 0;
        $facultyIndex = 0;

        foreach ($rooms as $room) {
            // Assign chief invigilator
            $chief = $available[$facultyIndex++];
            $insertStmt->execute([$data['examId'], $room['id'], $chief['id'], 'chief']);
            $updateDuties->execute([$chief['id']]);

            // Assign assistant invigilator
            $assistant = $available[$facultyIndex++];
            $insertStmt->execute([$data['examId'], $room['id'], $assistant['id'], 'assistant']);
            $updateDuties->execute([$assistant['id']]);

            $allocated += 2;
        }
        $db->commit();

        jsonResponse([
            'message' => "$allocated invigilators assigned ($roomsCount rooms × 2 faculty each)",
            'count'   => $allocated,
            'rooms'   => $roomsCount,
        ]);
    }

    public function clearByExam(array $params): void {
        getDB()->prepare('DELETE FROM invigilation_allocations WHERE exam_id = ?')->execute([$params['examId']]);
        jsonResponse(['message' => 'Invigilation allocations cleared']);
    }
}
