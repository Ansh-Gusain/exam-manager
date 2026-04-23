<?php
require_once __DIR__ . '/../helpers/response.php';

class RoomController {
    public function index(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $where  = [];
        $values = [];

        if (!empty($q['building'])) {
            $where[]  = 'building = ?';
            $values[] = $q['building'];
        }
        if (isset($q['isAvailable'])) {
            $where[]  = 'is_available = ?';
            $values[] = $q['isAvailable'] === 'true' ? 1 : 0;
        }
        if (isset($q['hasProjector'])) {
            $where[]  = 'has_projector = ?';
            $values[] = $q['hasProjector'] === 'true' ? 1 : 0;
        }

        $sql = 'SELECT * FROM rooms';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY building, room_number';

        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['is_available']  = (bool)$r['is_available'];
            $r['has_projector'] = (bool)$r['has_projector'];
            $r['capacity']      = (int)$r['capacity'];
            $r['floor']         = (int)$r['floor'];
            $r['rowsCount']     = (int)($r['rows_count'] ?? 6);
            $r['colsCount']     = (int)($r['cols_count'] ?? 8);
        }
        jsonResponse($rows);
    }

    public function show(array $params): void {
        jsonResponse($this->findOrFail($params['id']));
    }

    public function store(array $params): void {
        $data = getBody();
        $this->validate($data);

        $rows = (int)($data['rowsCount'] ?? 6);
        $cols = (int)($data['colsCount'] ?? 8);

        $db   = getDB();
        $stmt = $db->prepare('
            INSERT INTO rooms (room_number, building, floor, capacity, rows_count, cols_count, has_projector, is_available)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        ');
        $stmt->execute([
            $data['roomNumber'], $data['building'], $data['floor'] ?? 0,
            $rows * $cols,
            $rows, $cols,
            isset($data['hasProjector']) ? (int)$data['hasProjector'] : 0
        ]);

        jsonResponse($this->findOrFail($db->lastInsertId()), 201);
    }

    public function update(array $params): void {
        $existing = $this->findOrFail($params['id']);
        $data     = getBody();
        $this->validate($data);

        $rows        = (int)($data['rowsCount'] ?? 6);
        $cols        = (int)($data['colsCount'] ?? 8);
        $newCapacity = $rows * $cols;
        $layoutChanged = (int)$existing['rows_count'] !== $rows || (int)$existing['cols_count'] !== $cols;

        $db = getDB();

        // Update the room dimensions
        $db->prepare('
            UPDATE rooms SET room_number=?, building=?, floor=?, capacity=?,
            rows_count=?, cols_count=?, has_projector=?, is_available=?
            WHERE id=?
        ')->execute([
            $data['roomNumber'], $data['building'], $data['floor'] ?? 0,
            $newCapacity, $rows, $cols,
            isset($data['hasProjector']) ? (int)$data['hasProjector'] : 0,
            isset($data['isAvailable']) ? (int)$data['isAvailable'] : 1,
            $params['id']
        ]);

        if (!$layoutChanged) {
            jsonResponse($this->findOrFail($params['id']));
            return;
        }

        // Layout changed — find all dates that had allocations in this room
        // and trigger a full re-allocation for each date+shift combination
        $stmt = $db->prepare('
            SELECT DISTINCT e.date, e.shift
            FROM seating_allocations sa
            JOIN exams e ON sa.exam_id = e.id
            WHERE sa.room_id = ?
            ORDER BY e.date, e.shift
        ');
        $stmt->execute([$params['id']]);
        $affectedShifts = $stmt->fetchAll();

        if (empty($affectedShifts)) {
            $room = $this->findOrFail($params['id']);
            $room['reallocated'] = false;
            jsonResponse($room);
            return;
        }

        // Re-run full allocateByDate for each affected date+shift
        $reallocatedDates = [];
        foreach ($affectedShifts as $ds) {
            $this->reallocateShift($db, $ds['date'], $ds['shift']);
            $reallocatedDates[] = "{$ds['date']} {$ds['shift']}";
        }

        $room = $this->findOrFail($params['id']);
        $room['reallocated']      = true;
        $room['reallocatedShifts'] = $reallocatedDates;
        jsonResponse($room);
    }

    // Full re-allocation for a date+shift: seating + invigilation
    private function reallocateShift(PDO $db, string $date, string $shift): void {
        // Load exams for this date+shift
        $stmt = $db->prepare("SELECT * FROM exams WHERE date = ? AND shift = ? AND status != 'completed' ORDER BY id");
        $stmt->execute([$date, $shift]);
        $exams = $stmt->fetchAll();
        if (empty($exams)) return;

        foreach ($exams as &$e) {
            $e['branches']    = json_decode($e['branches'], true) ?? [];
            $e['course_code'] = $e['course_code'] ?? $e['subject'];
        }
        unset($e);

        $stmt = $db->prepare('SELECT * FROM rooms WHERE is_available = 1 ORDER BY room_number');
        $stmt->execute();
        $rooms = $stmt->fetchAll();
        if (empty($rooms)) return;

        // Clear existing seating + invigilation for these exams
        $examIds = array_column($exams, 'id');
        $ph = implode(',', array_fill(0, count($examIds), '?'));

        // Decrement duties before clearing invigilation
        $db->prepare("
            UPDATE faculty f
            JOIN invigilation_allocations ia ON ia.faculty_id = f.id
            SET f.total_duties = GREATEST(0, f.total_duties - 1)
            WHERE ia.exam_id IN ($ph)
        ")->execute($examIds);
        $db->prepare("DELETE FROM invigilation_allocations WHERE exam_id IN ($ph)")->execute($examIds);
        $db->prepare("DELETE FROM seating_allocations WHERE exam_id IN ($ph)")->execute($examIds);

        $insertSeat = $db->prepare('INSERT INTO seating_allocations (exam_id, room_id, student_id, seat_number) VALUES (?, ?, ?, ?)');

        // Group exams by shift (only one shift here)
        $byShift = [$shift => $exams];

        $db->beginTransaction();
        $roomIndex = 0;

        foreach ($byShift as $shiftName => $shiftExams) {
            $examStudents = [];
            foreach ($shiftExams as $exam) {
                if (empty($exam['branches'])) continue;
                $ph2    = implode(',', array_fill(0, count($exam['branches']), '?'));
                $params = [...$exam['branches'], $exam['semester']];
                $extra  = '';
                if (!empty($exam['batch'])) {
                    $extra    = ' AND batch = ?';
                    $params[] = $exam['batch'];
                }
                $s = $db->prepare("SELECT * FROM students WHERE branch IN ($ph2) AND semester = ?$extra ORDER BY branch, roll_number");
                $s->execute($params);
                $examStudents[$exam['id']] = $s->fetchAll();
            }

            $examIds2  = array_keys($examStudents);
            $codeOf    = [];
            $subjectOf = [];
            foreach ($shiftExams as $ex) {
                $codeOf[$ex['id']]    = strtoupper(trim($ex['course_code'] ?? $ex['subject']));
                $subjectOf[$ex['id']] = strtolower(trim($ex['subject']));
            }

            $paired = [];
            $used   = [];
            foreach ($examIds2 as $idA) {
                if (isset($used[$idA])) continue;
                $pw = null;
                foreach ($examIds2 as $idB) {
                    if ($idB === $idA || isset($used[$idB])) continue;
                    if ($codeOf[$idA] !== $codeOf[$idB] && $subjectOf[$idA] !== $subjectOf[$idB]) {
                        $pw = $idB; $used[$idB] = true; break;
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

                    $ptrA = 0; $ptrB = 0;
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
                                    $insertSeat->execute([$cell['eid'], $room['id'], $cell['student']['id'], $seatNum]);
                                }
                                $seatNum++;
                            }
                        }
                    }
                }
            }
        }

        $db->commit();

        // Re-assign invigilation
        $invigilInsert = $db->prepare('INSERT IGNORE INTO invigilation_allocations (exam_id, room_id, faculty_id, role) VALUES (?, ?, ?, ?)');
        $dutyUpdate    = $db->prepare('UPDATE faculty SET total_duties = total_duties + 1 WHERE id = ?');

        $shiftExamIds = array_column($exams, 'id');
        $ph3 = implode(',', array_fill(0, count($shiftExamIds), '?'));
        $stmt = $db->prepare("
            SELECT sa.room_id, MIN(sa.exam_id) as primary_exam_id
            FROM seating_allocations sa
            WHERE sa.exam_id IN ($ph3)
            GROUP BY sa.room_id ORDER BY sa.room_id
        ");
        $stmt->execute($shiftExamIds);
        $shiftRooms = $stmt->fetchAll();

        $stmt = $db->prepare('SELECT * FROM faculty WHERE is_available = 1 ORDER BY total_duties ASC, RAND()');
        $stmt->execute();
        $allFac = $stmt->fetchAll();

        $db->beginTransaction();
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
        $db->commit();
    }

    public function destroy(array $params): void {
        $this->findOrFail($params['id']);
        getDB()->prepare('DELETE FROM rooms WHERE id = ?')->execute([$params['id']]);
        jsonResponse(['message' => 'Room deleted']);
    }

    private function findOrFail(int|string $id): array {
        $stmt = getDB()->prepare('SELECT * FROM rooms WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) errorResponse('Room not found', 404);
        $row['is_available']  = (bool)$row['is_available'];
        $row['has_projector'] = (bool)$row['has_projector'];
        $row['capacity']      = (int)$row['capacity'];
        $row['floor']         = (int)$row['floor'];
        $row['rowsCount']     = (int)($row['rows_count'] ?? 6);
        $row['colsCount']     = (int)($row['cols_count'] ?? 8);
        return $row;
    }

    private function validate(array $data): void {
        foreach (['roomNumber','building'] as $f) {
            if (empty($data[$f])) errorResponse("Field '$f' is required");
        }
        if (empty($data['rowsCount']) || empty($data['colsCount'])) {
            errorResponse("Rows and columns are required");
        }
        $cols = (int)$data['colsCount'];
        if ($cols < 2) errorResponse("Columns must be at least 2");
        if ($cols % 2 !== 0) errorResponse("Columns must be an even number (for exam A/B alternating layout)");
        $rows = (int)$data['rowsCount'];
        if ($rows < 1) errorResponse("Rows must be at least 1");
    }
}

