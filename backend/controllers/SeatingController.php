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

    public function allocate(array $params): void {
        $data = getBody();
        if (empty($data['examId'])) errorResponse('examId is required');

        $db = getDB();

        // ── Load the requested exam ───────────────────────────────────────────
        $stmt = $db->prepare('SELECT * FROM exams WHERE id = ?');
        $stmt->execute([$data['examId']]);
        $exam = $stmt->fetch();
        if (!$exam) errorResponse('Exam not found', 404);
        $exam['branches'] = json_decode($exam['branches'], true) ?? [];

        // ── Find a partner exam: same date + same shift, different id ─────────
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

        // ── Load eligible students for THIS exam ──────────────────────────────
        $placeholders = implode(',', array_fill(0, count($exam['branches']), '?'));
        $stmt = $db->prepare("
            SELECT *, ? AS exam_id_tag FROM students
            WHERE branch IN ($placeholders) AND semester = ?
            ORDER BY roll_number
        ");
        $stmt->execute([$exam['id'], ...$exam['branches'], $exam['semester']]);
        $examAStudents = $stmt->fetchAll();

        // ── Load eligible students for PARTNER exam (if exists) ───────────────
        $examBStudents = [];
        if ($partnerExam) {
            $ph2 = implode(',', array_fill(0, count($partnerExam['branches']), '?'));
            $stmt = $db->prepare("
                SELECT *, ? AS exam_id_tag FROM students
                WHERE branch IN ($ph2) AND semester = ?
                ORDER BY roll_number
            ");
            $stmt->execute([$partnerExam['id'], ...$partnerExam['branches'], $partnerExam['semester']]);
            $examBStudents = $stmt->fetchAll();
        }

        if (empty($examAStudents)) {
            errorResponse('No eligible students found for this exam');
        }

        // ── Load available rooms ──────────────────────────────────────────────
        $stmt = $db->prepare('SELECT * FROM rooms WHERE is_available = 1 ORDER BY room_number');
        $stmt->execute();
        $rooms = $stmt->fetchAll();

        $totalCapacity = array_sum(array_column($rooms, 'capacity'));
        $totalStudents = count($examAStudents) + count($examBStudents);
        if ($totalCapacity < count($examAStudents)) {
            errorResponse("Insufficient room capacity for " . count($examAStudents) . " students.");
        }

        // ── Clear existing allocations for THIS exam ──────────────────────────
        $db->prepare('DELETE FROM seating_allocations WHERE exam_id = ?')->execute([$exam['id']]);

        // ── Layout constants ──────────────────────────────────────────────────
        // 6 columns per row: col 0,2,4 = Exam A  |  col 1,3,5 = Exam B (or empty)
        $COLS = 6;

        $insertStmt = $db->prepare('
            INSERT INTO seating_allocations (exam_id, room_id, student_id, seat_number)
            VALUES (?, ?, ?, ?)
        ');

        $db->beginTransaction();
        $allocated = 0;
        $ptrA = 0; // pointer into examAStudents
        $ptrB = 0; // pointer into examBStudents

        $hasPartner = !empty($examBStudents);

        foreach ($rooms as $room) {
            // Stop if all exam-A students placed
            if ($ptrA >= count($examAStudents)) break;

            $capacity = (int)$room['capacity'];
            $numRows  = (int)ceil($capacity / $COLS);

            // Build grid [row][col] — null = empty seat
            $grid = array_fill(0, $numRows, array_fill(0, $COLS, null));

            for ($col = 0; $col < $COLS; $col++) {
                $isExamACol = ($col % 2 === 0); // cols 0,2,4 → Exam A

                for ($row = 0; $row < $numRows; $row++) {
                    if ($isExamACol) {
                        // Place Exam A student
                        if ($ptrA < count($examAStudents)) {
                            $grid[$row][$col] = [
                                'student'  => $examAStudents[$ptrA],
                                'exam_id'  => $exam['id'],
                            ];
                            $ptrA++;
                        }
                    } else {
                        // Place Exam B student (or leave empty if no partner)
                        if ($hasPartner && $ptrB < count($examBStudents)) {
                            $grid[$row][$col] = [
                                'student'  => $examBStudents[$ptrB],
                                'exam_id'  => $partnerExam['id'],
                            ];
                            $ptrB++;
                        }
                        // else: null = empty gap seat
                    }
                }
            }

            // Insert row-by-row, seat numbers 1..capacity
            $seatNumber = 1;
            for ($row = 0; $row < $numRows; $row++) {
                for ($col = 0; $col < $COLS; $col++) {
                    if ($seatNumber > $capacity) break;
                    $cell = $grid[$row][$col];
                    if ($cell !== null) {
                        // Only insert for THIS exam (partner exam handles its own allocation)
                        if ((int)$cell['exam_id'] === (int)$exam['id']) {
                            $insertStmt->execute([
                                $exam['id'],
                                $room['id'],
                                $cell['student']['id'],
                                $seatNumber
                            ]);
                            $allocated++;
                        }
                        // Also insert partner exam students so the room grid is complete
                        elseif ($partnerExam && (int)$cell['exam_id'] === (int)$partnerExam['id']) {
                            // Check if partner already allocated in this room/seat
                            $insertStmt->execute([
                                $partnerExam['id'],
                                $room['id'],
                                $cell['student']['id'],
                                $seatNumber
                            ]);
                        }
                    }
                    $seatNumber++;
                }
            }
        }
        $db->commit();

        // ── Return allocations for THIS exam ──────────────────────────────────
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
        $db   = getDB();
        $stmt = $db->prepare('
            DELETE sa FROM seating_allocations sa
            JOIN exams e ON sa.exam_id = e.id
            WHERE e.date = ?
        ');
        $stmt->execute([$params['date']]);
        jsonResponse(['message' => 'Seating allocations cleared for date ' . $params['date']]);
    }

    // ── Allocate ALL exams on a given date across shifts ─────────────────────
    public function allocateByDate(array $params): void {
        $data = getBody();
        if (empty($data['date'])) errorResponse('date is required (YYYY-MM-DD)');
        $date = $data['date'];

        $db = getDB();

        // Load all scheduled exams on this date
        $stmt = $db->prepare("
            SELECT * FROM exams
            WHERE date = ? AND status != 'completed'
            ORDER BY shift, id
        ");
        $stmt->execute([$date]);
        $exams = $stmt->fetchAll();

        if (empty($exams)) errorResponse("No scheduled exams found on $date");

        foreach ($exams as &$e) {
            $e['branches']   = json_decode($e['branches'], true) ?? [];
            $e['course_code'] = $e['course_code'] ?? $e['subject'];
        }
        unset($e);

        // Load available rooms
        $stmt = $db->prepare('SELECT * FROM rooms WHERE is_available = 1 ORDER BY room_number');
        $stmt->execute();
        $rooms = $stmt->fetchAll();
        if (empty($rooms)) errorResponse('No available rooms');

        // ── Group exams by shift ──────────────────────────────────────────────
        $byShift = [];
        foreach ($exams as $e) {
            $byShift[$e['shift'] ?? 'Shift 1 (Morning)'][] = $e;
        }

        // ── Clear all existing allocations for this date ──────────────────────
        $db->prepare('
            DELETE sa FROM seating_allocations sa
            JOIN exams e ON sa.exam_id = e.id
            WHERE e.date = ?
        ')->execute([$date]);

        $insertStmt = $db->prepare('
            INSERT INTO seating_allocations (exam_id, room_id, student_id, seat_number)
            VALUES (?, ?, ?, ?)
        ');

        $COLS       = 6;
        $totalCount = 0;
        $summary    = [];

        $db->beginTransaction();

        foreach ($byShift as $shift => $shiftExams) {
            $roomIndex = 0; // reset per shift, shared across all pairs in this shift

            // ── Load eligible students per exam ───────────────────────────────
            $examStudents = []; // examId => [students]
            foreach ($shiftExams as $exam) {
                if (empty($exam['branches'])) continue;
                $ph = implode(',', array_fill(0, count($exam['branches']), '?'));
                $s  = $db->prepare("SELECT * FROM students WHERE branch IN ($ph) AND semester = ? ORDER BY roll_number");
                $s->execute([...$exam['branches'], $exam['semester']]);
                $examStudents[$exam['id']] = $s->fetchAll();
            }

            // ── Pair exams with DIFFERENT course codes ────────────────────────
            // Rule: two exams can share a room only if their course_code differs.
            // If same course code → each exam gets its own rooms (empty adjacent seats).
            $examIds  = array_keys($examStudents);
            $paired   = [];   // [[examIdA, examIdB|null], ...]
            $used     = [];

            // Build a lookup: examId → course_code and subject
            $codeOf    = [];
            $subjectOf = [];
            foreach ($shiftExams as $ex) {
                $codeOf[$ex['id']]    = strtoupper(trim($ex['course_code'] ?? $ex['subject']));
                $subjectOf[$ex['id']] = strtolower(trim($ex['subject']));
            }

            foreach ($examIds as $idA) {
                if (isset($used[$idA])) continue;
                $paired_with = null;
                foreach ($examIds as $idB) {
                    if ($idB === $idA || isset($used[$idB])) continue;
                    // Pair only if BOTH course code AND course name are different
                    $codeDiffers    = $codeOf[$idA]    !== $codeOf[$idB];
                    $subjectDiffers = $subjectOf[$idA] !== $subjectOf[$idB];
                    if ($codeDiffers && $subjectDiffers) {
                        $paired_with = $idB;
                        $used[$idB]  = true;
                        break;
                    }
                }
                $used[$idA] = true;
                $paired[]   = [$idA, $paired_with];
            }

            // ── Allocate each pair into rooms ─────────────────────────────────
            // $roomIndex is shared across ALL pairs so rooms are never reused

            foreach ($paired as [$examIdA, $examIdB]) {
                $studentsA = $examStudents[$examIdA] ?? [];
                $studentsB = $examIdB ? ($examStudents[$examIdB] ?? []) : [];
                $hasB      = !empty($studentsB);

                // ── Split each exam's students by branch ──────────────────────
                // Each room gets exactly 1 branch from examA + 1 branch from examB
                // (or 1 branch from examA with empty adjacent if no examB)
                $branchesA = [];
                foreach ($studentsA as $s) {
                    $branchesA[$s['branch']][] = $s;
                }
                $branchesB = [];
                foreach ($studentsB as $s) {
                    $branchesB[$s['branch']][] = $s;
                }

                $branchKeysA = array_values(array_keys($branchesA));
                $branchKeysB = array_values(array_keys($branchesB));

                // Pair one branch from A with one branch from B per room
                $maxPairs = max(count($branchKeysA), count($branchKeysB) ?: 0);

                for ($bi = 0; $bi < count($branchKeysA); $bi++) {
                    $branchA   = $branchKeysA[$bi];
                    $branchB   = $hasB ? ($branchKeysB[$bi] ?? null) : null;
                    $colStudA  = $branchesA[$branchA];
                    $colStudB  = $branchB ? $branchesB[$branchB] : [];

                    $ptrA = 0;
                    $ptrB = 0;

                    // Fill rooms until this branch-pair is exhausted
                    while ($ptrA < count($colStudA)) {
                        if ($roomIndex >= count($rooms)) break;
                        $room     = $rooms[$roomIndex++];
                        $capacity = (int)$room['capacity'];
                        $numRows  = (int)ceil($capacity / $COLS);

                        // col 0,2,4 → branchA of examA
                        // col 1,3,5 → branchB of examB (or empty)
                        $grid = array_fill(0, $numRows, array_fill(0, $COLS, null));

                        for ($col = 0; $col < $COLS; $col++) {
                            $isA = ($col % 2 === 0);
                            for ($row = 0; $row < $numRows; $row++) {
                                if ($isA) {
                                    if ($ptrA < count($colStudA)) {
                                        $grid[$row][$col] = ['eid' => $examIdA, 'student' => $colStudA[$ptrA++]];
                                    }
                                } else {
                                    if (!empty($colStudB) && $ptrB < count($colStudB)) {
                                        $grid[$row][$col] = ['eid' => $examIdB, 'student' => $colStudB[$ptrB++]];
                                    }
                                }
                            }
                        }

                        // Insert row-by-row
                        $seatNum = 1;
                        for ($row = 0; $row < $numRows; $row++) {
                            for ($col = 0; $col < $COLS; $col++) {
                                if ($seatNum > $capacity) break;
                                $cell = $grid[$row][$col];
                                if ($cell !== null) {
                                    $insertStmt->execute([
                                        $cell['eid'],
                                        $room['id'],
                                        $cell['student']['id'],
                                        $seatNum
                                    ]);
                                    $totalCount++;
                                }
                                $seatNum++;
                            }
                        }
                    }

                    // If examB has more branches than examA, handle overflow
                    if ($hasB && isset($branchKeysB[$bi]) && $branchB === null) {
                        // extra branchB branches get their own rooms with empty adjacent
                        $colStudBExtra = $branchesB[$branchKeysB[$bi]];
                        $ptrBx = 0;
                        while ($ptrBx < count($colStudBExtra)) {
                            if ($roomIndex >= count($rooms)) break;
                            $room     = $rooms[$roomIndex++];
                            $capacity = (int)$room['capacity'];
                            $numRows  = (int)ceil($capacity / $COLS);
                            $grid     = array_fill(0, $numRows, array_fill(0, $COLS, null));
                            for ($col = 0; $col < $COLS; $col += 2) {
                                for ($row = 0; $row < $numRows; $row++) {
                                    if ($ptrBx < count($colStudBExtra)) {
                                        $grid[$row][$col] = ['eid' => $examIdB, 'student' => $colStudBExtra[$ptrBx++]];
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
                }

                // Handle extra branches in examB that have no examA counterpart
                for ($bi = count($branchKeysA); $bi < count($branchKeysB); $bi++) {
                    $colStudBExtra = $branchesB[$branchKeysB[$bi]];
                    $ptrBx = 0;
                    while ($ptrBx < count($colStudBExtra)) {
                        if ($roomIndex >= count($rooms)) break;
                        $room     = $rooms[$roomIndex++];
                        $capacity = (int)$room['capacity'];
                        $numRows  = (int)ceil($capacity / $COLS);
                        $grid     = array_fill(0, $numRows, array_fill(0, $COLS, null));
                        for ($col = 0; $col < $COLS; $col += 2) {
                            for ($row = 0; $row < $numRows; $row++) {
                                if ($ptrBx < count($colStudBExtra)) {
                                    $grid[$row][$col] = ['eid' => $examIdB, 'student' => $colStudBExtra[$ptrBx++]];
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

                // Find exam objects for summary
                $exA = array_values(array_filter($shiftExams, fn($e) => $e['id'] == $examIdA))[0] ?? null;
                $exB = $examIdB ? array_values(array_filter($shiftExams, fn($e) => $e['id'] == $examIdB))[0] ?? null : null;
                $summary[] = [
                    'shift'   => $shift,
                    'examA'   => $exA ? "{$exA['course_code']} — {$exA['subject']}" : null,
                    'examB'   => $exB ? "{$exB['course_code']} — {$exB['subject']}" : null,
                    'paired'  => $exB !== null,
                    'countA'  => count($studentsA),
                    'countB'  => count($studentsB),
                ];
            }
        }

        $db->commit();

        // ── Auto-assign 2 faculty per room for each exam on this date ──────────
        // Load faculty sorted by total_duties (load balancing), randomised within same duty count
        $stmt = $db->prepare('SELECT * FROM faculty WHERE is_available = 1 ORDER BY total_duties ASC, RAND()');
        $stmt->execute();
        $allFaculty = $stmt->fetchAll();

        // Faculty already busy on this date (assigned to other dates' exams — not this date)
        // We'll track who we assign within this date to avoid double-booking
        $assignedToday = []; // facultyId => true

        $invigilInsert = $db->prepare('
            INSERT IGNORE INTO invigilation_allocations (exam_id, room_id, faculty_id, role)
            VALUES (?, ?, ?, ?)
        ');
        $dutyUpdate = $db->prepare('UPDATE faculty SET total_duties = total_duties + 1 WHERE id = ?');

        // Clear existing invigilation for all exams on this date
        $examIds = array_column($exams, 'id');
        if (!empty($examIds)) {
            $ph = implode(',', array_fill(0, count($examIds), '?'));
            $db->prepare("DELETE FROM invigilation_allocations WHERE exam_id IN ($ph)")->execute($examIds);
        }

        $db->beginTransaction();

        foreach ($exams as $exam) {
            // Get rooms used by this exam
            $stmt = $db->prepare('
                SELECT DISTINCT room_id FROM seating_allocations WHERE exam_id = ?
            ');
            $stmt->execute([$exam['id']]);
            $examRoomIds = array_column($stmt->fetchAll(), 'room_id');

            // Build available faculty pool (not yet assigned today)
            $pool = array_values(array_filter($allFaculty, fn($f) => !isset($assignedToday[$f['id']])));

            $fi = 0;
            foreach ($examRoomIds as $roomId) {
                // Chief
                while ($fi < count($pool) && isset($assignedToday[$pool[$fi]['id']])) $fi++;
                if ($fi >= count($pool)) break;
                $chief = $pool[$fi++];
                $invigilInsert->execute([$exam['id'], $roomId, $chief['id'], 'chief']);
                $dutyUpdate->execute([$chief['id']]);
                $assignedToday[$chief['id']] = true;

                // Assistant
                while ($fi < count($pool) && isset($assignedToday[$pool[$fi]['id']])) $fi++;
                if ($fi >= count($pool)) break;
                $asst = $pool[$fi++];
                $invigilInsert->execute([$exam['id'], $roomId, $asst['id'], 'assistant']);
                $dutyUpdate->execute([$asst['id']]);
                $assignedToday[$asst['id']] = true;
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
