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
            SELECT ia.*, f.name AS faculty_name, f.phone, f.department,
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

        // Load faculty already assigned to same date AND same shift only
        // (faculty CAN be assigned to same date but different shift)
        $stmt = $db->prepare('
            SELECT DISTINCT ia.faculty_id
            FROM invigilation_allocations ia
            JOIN exams e ON ia.exam_id = e.id
            WHERE e.date = ? AND e.shift = ? AND ia.exam_id != ?
        ');
        $stmt->execute([$exam['date'], $exam['shift'] ?? 'Shift 1 (Morning)', $data['examId']]);
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
            errorResponse("Not enough available faculty. Need $facultyNeeded (2 per room Ã— $roomsCount rooms) but only " . count($available) . " available on this date.");
        }

        // Decrement duties for existing faculty before clearing
        $db->prepare('
            UPDATE faculty f
            JOIN invigilation_allocations ia ON ia.faculty_id = f.id
            SET f.total_duties = GREATEST(0, f.total_duties - 1)
            WHERE ia.exam_id = ?
        ')->execute([$data['examId']]);
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
            'message' => "$allocated invigilators assigned ($roomsCount rooms Ã— 2 faculty each)",
            'count'   => $allocated,
            'rooms'   => $roomsCount,
        ]);
    }

    public function clearByExam(array $params): void {
        $db = getDB();
        // Decrement duties for all faculty assigned to this exam before deleting
        $db->prepare('
            UPDATE faculty f
            JOIN invigilation_allocations ia ON ia.faculty_id = f.id
            SET f.total_duties = GREATEST(0, f.total_duties - 1)
            WHERE ia.exam_id = ?
        ')->execute([$params['examId']]);
        $db->prepare('DELETE FROM invigilation_allocations WHERE exam_id = ?')->execute([$params['examId']]);
        jsonResponse(['message' => 'Invigilation allocations cleared']);
    }

    // Update both faculty for a room at once
    public function updateRoom(array $params): void {
        $data = getBody();
        if (empty($data['roomId']) || empty($data['examId'])) errorResponse('roomId and examId are required');

        $db = getDB();

        // Get existing assignments for this room+exam
        $stmt = $db->prepare('SELECT * FROM invigilation_allocations WHERE room_id = ? AND exam_id = ?');
        $stmt->execute([$data['roomId'], $data['examId']]);
        $existing = $stmt->fetchAll();

        $db->beginTransaction();

        foreach (['chief', 'assistant'] as $role) {
            $newId = $data[$role . 'FacultyId'] ?? null;
            if (!$newId) continue;

            $current = array_values(array_filter($existing, fn($r) => $r['role'] === $role))[0] ?? null;

            if ($current) {
                // Decrement old faculty duties
                $db->prepare('UPDATE faculty SET total_duties = GREATEST(0, total_duties - 1) WHERE id = ?')
                   ->execute([$current['faculty_id']]);
                // Update to new faculty
                $db->prepare('UPDATE invigilation_allocations SET faculty_id = ? WHERE id = ?')
                   ->execute([$newId, $current['id']]);
            } else {
                // Insert new record
                $db->prepare('INSERT INTO invigilation_allocations (exam_id, room_id, faculty_id, role) VALUES (?, ?, ?, ?)')
                   ->execute([$data['examId'], $data['roomId'], $newId, $role]);
            }
            // Increment new faculty duties
            $db->prepare('UPDATE faculty SET total_duties = total_duties + 1 WHERE id = ?')->execute([$newId]);
        }

        $db->commit();

        // Return updated assignments
        $stmt = $db->prepare('
            SELECT ia.*, f.name AS faculty_name, f.phone, f.department
            FROM invigilation_allocations ia
            JOIN faculty f ON ia.faculty_id = f.id
            WHERE ia.room_id = ? AND ia.exam_id = ?
        ');
        $stmt->execute([$data['roomId'], $data['examId']]);
        jsonResponse($stmt->fetchAll());
    }

    // Update a single invigilation assignment (replace faculty)
    public function updateAssignment(array $params): void {
        $data = getBody();
        if (empty($data['facultyId'])) errorResponse('facultyId is required');

        $db = getDB();

        // Get existing assignment
        $stmt = $db->prepare('SELECT * FROM invigilation_allocations WHERE id = ?');
        $stmt->execute([$params['id']]);
        $existing = $stmt->fetch();
        if (!$existing) errorResponse('Assignment not found', 404);

        // Verify new faculty exists and is available
        $stmt = $db->prepare('SELECT * FROM faculty WHERE id = ? AND is_available = 1');
        $stmt->execute([$data['facultyId']]);
        $newFaculty = $stmt->fetch();
        if (!$newFaculty) errorResponse('Faculty not found or unavailable', 404);

        // Decrement old faculty duties, increment new faculty duties
        $db->prepare('UPDATE faculty SET total_duties = GREATEST(0, total_duties - 1) WHERE id = ?')
           ->execute([$existing['faculty_id']]);
        $db->prepare('UPDATE faculty SET total_duties = total_duties + 1 WHERE id = ?')
           ->execute([$data['facultyId']]);

        // Update the assignment
        $db->prepare('UPDATE invigilation_allocations SET faculty_id = ? WHERE id = ?')
           ->execute([$data['facultyId'], $params['id']]);

        // Return updated record with faculty info
        $stmt = $db->prepare('
            SELECT ia.*, f.name AS faculty_name, f.phone, f.department,
                   r.room_number, e.name AS exam_name
            FROM invigilation_allocations ia
            JOIN faculty f ON ia.faculty_id = f.id
            JOIN rooms r   ON ia.room_id    = r.id
            JOIN exams e   ON ia.exam_id    = e.id
            WHERE ia.id = ?
        ');
        $stmt->execute([$params['id']]);
        jsonResponse($stmt->fetch());
    }

    // Assign 2 faculty per room for ALL exams on a given date
    public function allocateByDate(array $params): void {
        $data = getBody();
        if (empty($data['date'])) errorResponse('date is required');
        $date = $data['date'];

        $db = getDB();

        // Load all exams on this date
        $stmt = $db->prepare("SELECT * FROM exams WHERE date = ? AND status != 'completed' ORDER BY id");
        $stmt->execute([$date]);
        $exams = $stmt->fetchAll();
        if (empty($exams)) errorResponse("No exams found on $date");

        // Decrement duties for all faculty currently assigned to these exams
        $ph = implode(',', array_fill(0, count($examIds), '?'));
        $db->prepare("
            UPDATE faculty f
            JOIN invigilation_allocations ia ON ia.faculty_id = f.id
            SET f.total_duties = GREATEST(0, f.total_duties - 1)
            WHERE ia.exam_id IN ($ph)
        ")->execute($examIds);
        // Clear existing invigilation for all exams on this date
        $db->prepare("DELETE FROM invigilation_allocations WHERE exam_id IN ($ph)")->execute($examIds);

        // Load faculty sorted by total_duties ASC (load balancing)
        $stmt = $db->prepare('SELECT * FROM faculty WHERE is_available = 1 ORDER BY total_duties ASC, RAND()');
        $stmt->execute();
        $allFaculty = $stmt->fetchAll();

        $insertStmt = $db->prepare('INSERT IGNORE INTO invigilation_allocations (exam_id, room_id, faculty_id, role) VALUES (?, ?, ?, ?)');
        $dutyUpdate = $db->prepare('UPDATE faculty SET total_duties = total_duties + 1 WHERE id = ?');

        $db->beginTransaction();
        $totalAssigned = 0;

        // Group exams by shift — each shift gets independent faculty pool
        $byShift = [];
        foreach ($exams as $exam) {
            $byShift[$exam['shift'] ?? 'Shift 1 (Morning)'][] = $exam;
        }

        foreach ($byShift as $shift => $shiftExams) {
            $assignedShift = []; // only block within same shift

            foreach ($shiftExams as $exam) {
                $stmt = $db->prepare('SELECT DISTINCT room_id FROM seating_allocations WHERE exam_id = ?');
                $stmt->execute([$exam['id']]);
                $roomIds = array_column($stmt->fetchAll(), 'room_id');

                // Pool: all available faculty not yet assigned in THIS shift
                $pool = array_values(array_filter($allFaculty, fn($f) => !isset($assignedShift[$f['id']])));
                $fi   = 0;

                foreach ($roomIds as $roomId) {
                    while ($fi < count($pool) && isset($assignedShift[$pool[$fi]['id']])) $fi++;
                    if ($fi >= count($pool)) break;
                    $chief = $pool[$fi++];
                    $insertStmt->execute([$exam['id'], $roomId, $chief['id'], 'chief']);
                    $dutyUpdate->execute([$chief['id']]);
                    $assignedShift[$chief['id']] = true;
                    $totalAssigned++;

                    while ($fi < count($pool) && isset($assignedShift[$pool[$fi]['id']])) $fi++;
                    if ($fi >= count($pool)) break;
                    $asst = $pool[$fi++];
                    $insertStmt->execute([$exam['id'], $roomId, $asst['id'], 'assistant']);
                    $dutyUpdate->execute([$asst['id']]);
                    $assignedShift[$asst['id']] = true;
                    $totalAssigned++;
                }
            }
        }

        $db->commit();

        jsonResponse([
            'message' => "$totalAssigned invigilators assigned across all exams on $date",
            'count'   => $totalAssigned,
            'date'    => $date,
        ]);
    }
}

