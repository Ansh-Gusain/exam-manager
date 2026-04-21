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
        $data = getBody();
        $this->validate($data);

        $rows = (int)($data['rowsCount'] ?? 6);
        $cols = (int)($data['colsCount'] ?? 8);
        $newCapacity = $rows * $cols;

        $db   = getDB();
        $stmt = $db->prepare('
            UPDATE rooms SET room_number=?, building=?, floor=?, capacity=?,
            rows_count=?, cols_count=?, has_projector=?, is_available=?
            WHERE id=?
        ');
        $stmt->execute([
            $data['roomNumber'], $data['building'], $data['floor'] ?? 0,
            $newCapacity,
            $rows, $cols,
            isset($data['hasProjector']) ? (int)$data['hasProjector'] : 0,
            isset($data['isAvailable']) ? (int)$data['isAvailable'] : 1,
            $params['id']
        ]);

        // If layout changed, clear stale seating allocations for this room
        if ((int)$existing['rows_count'] !== $rows || (int)$existing['cols_count'] !== $cols) {
            $db->prepare('DELETE FROM seating_allocations WHERE room_id = ?')->execute([$params['id']]);
            $db->prepare('DELETE FROM invigilation_allocations WHERE room_id = ?')->execute([$params['id']]);
        }

        jsonResponse($this->findOrFail($params['id']));
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

