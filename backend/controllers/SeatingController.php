<?php
require_once __DIR__ . '/../helpers/response.php';

class SeatingController {
    public function index(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $where  = [];
        $values = [];

        if (!empty($q['examId'])) {
            $where[]  = 'sa.exam_id = ?';
            $values[] = $q['examId'];
        }
        if (!empty($q['roomId'])) {
            $where[]  = 'sa.room_id = ?';
            $values[] = $q['roomId'];
        }

        $sql = '
            SELECT sa.*, s.name AS student_name, s.roll_number,
                   r.room_number, r.building, e.name AS exam_name
            FROM seating_allocations sa
            JOIN students s ON sa.student_id = s.id
            JOIN rooms r    ON sa.room_id    = r.id
            JOIN exams e    ON sa.exam_id    = e.id
        ';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY sa.room_id, sa.seat_number';

        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        jsonResponse($stmt->fetchAll());
    }

    // Helper: load students for an exam, filtering by branch + semester + batch (if set)
    private function loadStudentsForExam(PDO $db, array $exam, mixed $examIdTag): array {
        if (empty($exam['branches'])) return [];
        $ph     = implode(',', array_fill(0, count($exam['branches']), '?'));
        $params = [$examIdTag, ...$exam['branches'], $exam['semester']];
        $extra  = '';
        if (!empty($exam['batch'])) {
            $extra    = ' AND batch = ?';
            $params[] = $exam['batch'];
        }
        $stmt = $db->prepare("
            SELECT *, ? AS exam_id_tag FROM students
            WHERE branch IN ($ph) AND semester = ?$extra
            ORDER BY roll_number
        ");
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function allocate(array $params): void {
        $data = getBody();
        if (empty($data['examId'])) errorResponse('examId is required');

        $db = getDB();

        // Load the requested exam
        $stmt = $db->prepare('SELECT * FROM exams WHERE id = ?');
        $stmt->execute([$data['examId']]);
        $exam = $stmt->fetch();
        if (!$exam) errorResponse('Exam not found', 404);
        $exam['branches'] = json_decode($exam['branches'], true) ?? [];

        // Find a partner exam: same date + same shift, different id
        $stmt = $db->prepare("
            SELECT * FROM exams
            WHERE date = ? AND shift = ? AND id != ? AND status != 'completed'
            ORDER BY id
            LIMIT 1
        ");
        $stmt->execute([$exam['date'], $exam['shift'] ?? '', $exam['id']]);
        $partnerExam = $stmt->fetch() ?: null;
        if ($partnerExam) {
            $partnerExam['branches'] = json_decode($partnerExam['branches'], true) ?? [];
        }

        // Load eligible students — filtered by branch + semester + batch
        $examAStudents = $this->loadStudentsForExam($db, $exam, $exam['id']);
        $examBStudents = $partnerExam ? $this->loadStudentsForExam($db, $partnerExam, $partnerExam['id']) : [];

        if (empty($examAStudents)) {
            errorResponse('No eligible students found for this exam');
        }

        // Load available rooms
        $stmt = $db->prepare('SELECT * FROM rooms WHERE is_available = 1 ORDER BY room_number');
        $stmt->execute();
        $rooms = $stmt->fetchAll();

        $totalCapacity = array_sum(array_column($rooms, 'capacity'));
        if ($totalCapacity < count($examAStudents)) {
            errorResponse("Insufficient room capacity for " . count($examAStudents) . " students.");
        }

        // Clear existing allocations for THIS exam
        $db->prepare('DELETE FROM seating_allocations WHERE exam_id = ?')->execute([$exam['id']]);

        $insertStmt = $db->prepare('
            INSERT INTO seating_allocations (exam_id, room_id, student_id, seat_number)
            VALUES (?, ?, ?, ?)
        ');

        $db->beginTransaction();
        $allocated  = 0;
        $ptrA       = 0;
        $ptrB       = 0;
        $hasPartner = !empty($examBStudents);

        foreach ($rooms as $room) {
            if ($ptrA >= count($examAStudents)) break;

            $COLS    = max(2, (int)($room['cols_count'] ?? 8));
            if ($COLS % 2 !== 0) $COLS--;
            $capacity = (int)$room['capacity'];
            $numRows  = (int)ceil($capacity / $COLS);

            $grid = array_fill(0, $numRows, array_fill(0, $COLS, null));

            for ($col = 0; $col < $COLS; $col++) {
                $isExamACol = ($col % 2 === 0);
                for ($row = 0; $row < $numRows; $row++) {
                    if ($isExamACol) {
                        if ($ptrA < count($examAStudents)) {
                            $grid[$row][$col] = ['student' => $examAStudents[$ptrA], 'exam_id' => $exam['id']];
                            $ptrA++;
                        }
                    } else {
                        if ($hasPartner && $ptrB < count($examBStudents)) {
                            $grid[$row][$col] = ['student' => $examBStudents[$ptrB], 'exam_id' => $partnerExam['id']];
                            $ptrB++;
                        }
                    }
                }
            }

            $seatNumber = 1;
            for ($row = 0; $row < $numRows; $row++) {
                for ($col = 0; $col < $COLS; $col++) {
                    if ($seatNumber > $capacity) break;
                    $cell = $grid[$row][$col];
                    if ($cell !== null) {
                        if ((int)$cell['exam_id'] === (int)$exam['id']) {
                            $insertStmt->execute([$exam['id'], $room['id'], $cell['student']['id'], $seatNumber]);
                            $allocated++;
                        } elseif ($partnerExam && (int)$cell['exam_id'] === (int)$partnerExam['id']) {
                            $insertStmt->execute([$partnerExam['id'], $room['id'], $cell['student']['id'], $seatNumber]);
                        }
                    }
                    $seatNumber++;
                }
            }
        }
        $db->commit();

        $stmt = $db->prepare('
            SELECT sa.*, s.roll_number, s.branch
            FROM seating_allocations sa
            JOIN students s ON sa.student_id = s.id
            WHERE sa.exam_id = ?
            ORDER BY sa.room_id, sa.seat_number
        ');
        $stmt->execute([$exam['id']]);
        $allocations = $stmt->fetchAll();

        $msg = $partnerExam
            ? "$allocated students allocated. Rooms shared with '{$partnerExam['subject']}' ({$partnerExam['name']})."
            : "$allocated students allocated (single exam, empty adjacent seats).";

        jsonResponse([
            'message'     => $msg,
            'count'       => $allocated,
            'partnerExam' => $partnerExam ? $partnerExam['subject'] : null,
            'allocations' => $allocations,
        ]);
    }

    public function clearByExam(array $params): void {
        $db = getDB();
        $db->prepare('DELETE FROM seating_allocations WHERE exam_id = ?')->execute([$params['examId']]);
        jsonResponse(['message' => 'Seating allocations cleared']);
    }

    public function clearByDate(array $params): void {
        $db    = getDB();
        $date  = $params['date'];
        $shift = getQuery()['shift'] ?? null;

        // Decrement duties for faculty assigned to these exams before cascade-delete
        if ($shift) {
            $db->prepare("
                UPDATE faculty f
                JOIN invigilation_allocations ia ON ia.faculty_id = f.id
                JOIN exams e ON ia.exam_id = e.id
                SET f.total_duties = GREATEST(0, f.total_duties - 1)
                WHERE e.date = ? AND e.shift = ?
            ")->execute([$date, $shift]);

            $stmt = $db->prepare('
                DELETE sa FROM seating_allocations sa
                JOIN exams e ON sa.exam_id = e.id
                WHERE e.date = ? AND e.shift = ?
            ');
            $stmt->execute([$date, $shift]);
        } else {
            $db->prepare("
                UPDATE faculty f
                JOIN invigilation_allocations ia ON ia.faculty_id = f.id
                JOIN exams e ON ia.exam_id = e.id
                SET f.total_duties = GREATEST(0, f.total_duties - 1)
                WHERE e.date = ?
            ")->execute([$date]);

            $stmt = $db->prepare('
                DELETE sa FROM seating_allocations sa
                JOIN exams e ON sa.exam_id = e.id
                WHERE e.date = ?
            ');
            $stmt->execute([$date]);
        }
        jsonResponse(['message' => 'Seating allocations cleared']);
    }

    // Allocate ALL exams on a given date across shifts
    public function allocateByDate(array $params): void {
        $data  = getBody();
        if (empty($data['date'])) errorResponse('date is required (YYYY-MM-DD)');
        $date  = $data['date'];
        $shift = $data['shift'] ?? null;

        $db = getDB();

        if ($shift) {
            $stmt = $db->prepare("SELECT * FROM exams WHERE date = ? AND shift = ? AND status != 'completed' ORDER BY id");
            $stmt->execute([$date, $shift]);
        } else {
            $stmt = $db->prepare("SELECT * FROM exams WHERE date = ? AND status != 'completed' ORDER BY shift, id");
            $stmt->execute([$date]);
        }
        $exams = $stmt->fetchAll();
        if (empty($exams)) errorResponse("No scheduled exams found on $date");

        foreach ($exams as &$e) {
            $e['branches']    = json_decode($e['branches'], true) ?? [];
            $e['course_code'] = $e['course_code'] ?? $e['subject'];
        }
        unset($e);

        $stmt = $db->prepare('SELECT * FROM rooms WHERE is_available = 1 ORDER BY room_number');
        $stmt->execute();
        $rooms = $stmt->fetchAll();
        if (empty($rooms)) errorResponse('No available rooms');

        $byShift = [];
        foreach ($exams as $e) {
            $byShift[$e['shift'] ?? 'Shift 1 (Morning)'][] = $e;
        }

        $examIds = array_column($exams, 'id');
        if (!empty($examIds)) {
            $ph = implode(',', array_fill(0, count($examIds), '?'));
            $db->prepare("DELETE FROM seating_allocations WHERE exam_id IN ($ph)")->execute($examIds);
        }

        $insertStmt = $db->prepare('INSERT INTO seating_allocations (exam_id, room_id, student_id, seat_number) VALUES (?, ?, ?, ?)');
        $totalCount = 0;
        $summary    = [];

        $db->beginTransaction();
        $roomIndex = 0;

        foreach ($byShift as $shiftName => $shiftExams) {

            // Load eligible students per exam — filtered by branch + semester + batch
            $examStudents = [];
            foreach ($shiftExams as $exam) {
                if (empty($exam['branches'])) continue;
                $ph     = implode(',', array_fill(0, count($exam['branches']), '?'));
                $params = [...$exam['branches'], $exam['semester']];
                $extra  = '';
                if (!empty($exam['batch'])) {
                    $extra    = ' AND batch = ?';
                    $params[] = $exam['batch'];
                }
                $s = $db->prepare("SELECT * FROM students WHERE branch IN ($ph) AND semester = ?$extra ORDER BY branch, roll_number");
                $s->execute($params);
                $examStudents[$exam['id']] = $s->fetchAll();
            }

            // Pair exams: both course_code AND subject must differ to share a room
            $examIds   = array_keys($examStudents);
            $codeOf    = [];
            $subjectOf = [];
            foreach ($shiftExams as $ex) {
                $codeOf[$ex['id']]    = strtoupper(trim($ex['course_code'] ?? $ex['subject']));
                $subjectOf[$ex['id']] = strtolower(trim($ex['subject']));
            }

            $paired = [];
            $used   = [];
            foreach ($examIds as $idA) {
                if (isset($used[$idA])) continue;
                $pw = null;
                foreach ($examIds as $idB) {
                    if ($idB === $idA || isset($used[$idB])) continue;
                    if ($codeOf[$idA] !== $codeOf[$idB] && $subjectOf[$idA] !== $subjectOf[$idB]) {
                        $pw = $idB;
                        $used[$idB] = true;
                        break;
                    }
                }
                $used[$idA] = true;
                $paired[]   = [$idA, $pw];
            }

            foreach ($paired as [$examIdA, $examIdB]) {
                $studentsA = $examStudents[$examIdA] ?? [];
                $studentsB = $examIdB ? ($examStudents[$examIdB] ?? []) : [];
                $hasB      = !empty($studentsB);

                $branchesA = [];
                foreach ($studentsA as $s) { $branchesA[$s['branch']][] = $s; }
                $branchesB = [];
                foreach ($studentsB as $s) { $branchesB[$s['branch']][] = $s; }

                $branchKeysA = array_values(array_keys($branchesA));
                $branchKeysB = array_values(array_keys($branchesB));
                $maxBranches = max(count($branchKeysA), count($branchKeysB) ?: 0);

                for ($bi = 0; $bi < $maxBranches; $bi++) {
                    $branchA  = $branchKeysA[$bi] ?? null;
                    $branchB  = $hasB ? ($branchKeysB[$bi] ?? null) : null;
                    $colStudA = $branchA ? $branchesA[$branchA] : [];
                    $colStudB = $branchB ? $branchesB[$branchB] : [];

                    if (empty($colStudA) && empty($colStudB)) continue;

                    $ptrA = 0;
                    $ptrB = 0;

                    while ($ptrA < count($colStudA) || $ptrB < count($colStudB)) {
                        if ($roomIndex >= count($rooms)) break;
                        $room     = $rooms[$roomIndex++];
                        $capacity = (int)$room['capacity'];
                        $COLS     = max(2, (int)($room['cols_count'] ?? 8));
                        if ($COLS % 2 !== 0) $COLS--;
                        $numRows  = (int)ceil($capacity / $COLS);

                        $grid = array_fill(0, $numRows, array_fill(0, $COLS, null));
                        for ($col = 0; $col < $COLS; $col++) {
                            $isA = ($col % 2 === 0);
                            for ($row = 0; $row < $numRows; $row++) {
                                if ($isA && $ptrA < count($colStudA)) {
                                    $grid[$row][$col] = ['eid' => $examIdA, 'student' => $colStudA[$ptrA++]];
                                } elseif (!$isA && $ptrB < count($colStudB)) {
                                    $grid[$row][$col] = ['eid' => $examIdB, 'student' => $colStudB[$ptrB++]];
                                }
                            }
                        }

                        $seatNum = 1;
                        for ($row = 0; $row < $numRows; $row++) {
                            for ($col = 0; $col < $COLS; $col++) {
                                if ($seatNum > $capacity) break;
                                $cell = $grid[$row][$col];
                                if ($cell !== null) {
                                    $insertStmt->execute([$cell['eid'], $room['id'], $cell['student']['id'], $seatNum]);
                                    $totalCount++;
                                }
                                $seatNum++;
                            }
                        }
                    }
                }

                $exA = array_values(array_filter($shiftExams, fn($e) => $e['id'] == $examIdA))[0] ?? null;
                $exB = $examIdB ? array_values(array_filter($shiftExams, fn($e) => $e['id'] == $examIdB))[0] ?? null : null;
                $summary[] = [
                    'shift'  => $shiftName,
                    'examA'  => $exA ? "{$exA['course_code']} - {$exA['subject']}" : null,
                    'examB'  => $exB ? "{$exB['course_code']} - {$exB['subject']}" : null,
                    'paired' => $exB !== null,
                    'countA' => count($studentsA),
                    'countB' => count($studentsB),
                ];
            }
        }

        $db->commit();

        // Assign exactly 2 faculty per ROOM per SHIFT
        $invigilInsert = $db->prepare('INSERT IGNORE INTO invigilation_allocations (exam_id, room_id, faculty_id, role) VALUES (?, ?, ?, ?)');
        $dutyUpdate    = $db->prepare('UPDATE faculty SET total_duties = total_duties + 1 WHERE id = ?');

        $examIds = array_column($exams, 'id');
        if (!empty($examIds)) {
            $ph = implode(',', array_fill(0, count($examIds), '?'));
            // Decrement duties before clearing
            $db->prepare("
                UPDATE faculty f
                JOIN invigilation_allocations ia ON ia.faculty_id = f.id
                SET f.total_duties = GREATEST(0, f.total_duties - 1)
                WHERE ia.exam_id IN ($ph)
            ")->execute($examIds);
            $db->prepare("DELETE FROM invigilation_allocations WHERE exam_id IN ($ph)")->execute($examIds);
        }

        $db->beginTransaction();

        foreach ($byShift as $shiftName => $shiftExams) {
            $shiftExamIds = array_column($shiftExams, 'id');
            $ph2 = implode(',', array_fill(0, count($shiftExamIds), '?'));
            $stmt = $db->prepare("
                SELECT sa.room_id, MIN(sa.exam_id) as primary_exam_id
                FROM seating_allocations sa
                WHERE sa.exam_id IN ($ph2)
                GROUP BY sa.room_id
                ORDER BY sa.room_id
            ");
            $stmt->execute($shiftExamIds);
            $shiftRooms = $stmt->fetchAll();

            $stmt = $db->prepare('SELECT * FROM faculty WHERE is_available = 1 ORDER BY total_duties ASC, RAND()');
            $stmt->execute();
            $allFac = $stmt->fetchAll();

            $assignedThisShift = [];
            $fi = 0;

            foreach ($shiftRooms as $roomRow) {
                $roomId        = $roomRow['room_id'];
                $primaryExamId = $roomRow['primary_exam_id'];

                while ($fi < count($allFac) && isset($assignedThisShift[$allFac[$fi]['id']])) $fi++;
                if ($fi >= count($allFac)) break;
                $chief = $allFac[$fi++];
                $invigilInsert->execute([$primaryExamId, $roomId, $chief['id'], 'chief']);
                $dutyUpdate->execute([$chief['id']]);
                $assignedThisShift[$chief['id']] = true;

                while ($fi < count($allFac) && isset($assignedThisShift[$allFac[$fi]['id']])) $fi++;
                if ($fi >= count($allFac)) break;
                $asst = $allFac[$fi++];
                $invigilInsert->execute([$primaryExamId, $roomId, $asst['id'], 'assistant']);
                $dutyUpdate->execute([$asst['id']]);
                $assignedThisShift[$asst['id']] = true;
            }
        }

        $db->commit();

        jsonResponse([
            'message' => "Allocated $totalCount students and assigned invigilators across all exams on $date",
            'date'    => $date,
            'count'   => $totalCount,
            'summary' => $summary,
        ]);
    }
}
