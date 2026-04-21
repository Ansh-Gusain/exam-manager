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

        // ── Layout changed: re-seat same students with new grid, keep same faculty ──

        // Get all exam_ids that had allocations in this room
        $stmt = $db->prepare('SELECT DISTINCT exam_id FROM seating_allocations WHERE room_id = ?');
        $stmt->execute([$params['id']]);
        $examIds = array_column($stmt->fetchAll(), 'exam_id');

        if (empty($examIds)) {
            jsonResponse($this->findOrFail($params['id']));
            return;
        }

        // Remember existing faculty assignments for this room BEFORE deleting
        $stmt = $db->prepare('SELECT exam_id, faculty_id, role FROM invigilation_allocations WHERE room_id = ?');
        $stmt->execute([$params['id']]);
        $existingFaculty = $stmt->fetchAll(); // keep these exactly

        $db->beginTransaction();

        $insertSeat = $db->prepare('INSERT INTO seating_allocations (exam_id, room_id, student_id, seat_number) VALUES (?, ?, ?, ?)');

        $COLS    = max(2, $cols);
        if ($COLS % 2 !== 0) $COLS--;
        $numRows = (int)ceil($newCapacity / $COLS);

        // Collect ALL students across ALL exams in this room, grouped by exam then branch
        // This preserves the original pairing: ExamA branch on even cols, ExamB branch on odd cols
        $examStudents = []; // examId => [branch => [students]]
        foreach ($examIds as $examId) {
            $stmt = $db->prepare('
                SELECT s.* FROM seating_allocations sa
                JOIN students s ON sa.student_id = s.id
                WHERE sa.exam_id = ? AND sa.room_id = ?
                ORDER BY s.branch, s.roll_number
            ');
            $stmt->execute([$examId, $params['id']]);
            $studs = $stmt->fetchAll();
            $byBranch = [];
            foreach ($studs as $s) { $byBranch[$s['branch']][] = $s; }
            $examStudents[$examId] = $byBranch;
        }

        // Delete old seating for this room (keep invigilation for now)
        $db->prepare('DELETE FROM seating_allocations WHERE room_id = ?')->execute([$params['id']]);

        // Determine ExamA and ExamB (same pairing as original)
        $examIdA = $examIds[0];
        $examIdB = isset($examIds[1]) ? $examIds[1] : null;

        $branchKeysA = array_values(array_keys($examStudents[$examIdA] ?? []));
        $branchKeysB = $examIdB ? array_values(array_keys($examStudents[$examIdB] ?? [])) : [];

        // Use first branch from each exam (this room had 1 branch per exam)
        $studA = !empty($branchKeysA) ? array_values($examStudents[$examIdA][$branchKeysA[0]]) : [];
        $studB = ($examIdB && !empty($branchKeysB)) ? array_values($examStudents[$examIdB][$branchKeysB[0]]) : [];

        // Build grid: even cols = ExamA, odd cols = ExamB
        $grid = array_fill(0, $numRows, array_fill(0, $COLS, null));
        $pA = 0; $pB = 0;
        for ($col = 0; $col < $COLS; $col++) {
            $isA = ($col % 2 === 0);
            for ($row = 0; $row < $numRows; $row++) {
                if ($isA && $pA < count($studA)) {
                    $grid[$row][$col] = ['eid' => $examIdA, 'student' => $studA[$pA++]];
                } elseif (!$isA && $pB < count($studB)) {
                    $grid[$row][$col] = ['eid' => $examIdB, 'student' => $studB[$pB++]];
                }
            }
        }

        // Insert new seat allocations
        $seatNum = 1;
        for ($row = 0; $row < $numRows; $row++) {
            for ($col = 0; $col < $COLS; $col++) {
                if ($seatNum > $newCapacity) break;
                $cell = $grid[$row][$col];
                if ($cell !== null) {
                    $insertSeat->execute([$cell['eid'], $params['id'], $cell['student']['id'], $seatNum]);
                }
                $seatNum++;
            }
        }

        // Restore the SAME faculty (delete and re-insert to avoid duplicates)
        $db->prepare('DELETE FROM invigilation_allocations WHERE room_id = ?')->execute([$params['id']]);
        if (!empty($existingFaculty)) {
            $reInsert = $db->prepare('INSERT IGNORE INTO invigilation_allocations (exam_id, room_id, faculty_id, role) VALUES (?, ?, ?, ?)');
            foreach ($existingFaculty as $f) {
                $reInsert->execute([$f['exam_id'], $params['id'], $f['faculty_id'], $f['role']]);
            }
        }

        $db->commit();

        $room = $this->findOrFail($params['id']);
        $room['reallocated'] = count($examIds);
        jsonResponse($room);
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
    }
}

