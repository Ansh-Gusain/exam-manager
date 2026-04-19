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
        }
        jsonResponse($rows);
    }

    public function show(array $params): void {
        jsonResponse($this->findOrFail($params['id']));
    }

    public function store(array $params): void {
        $data = getBody();
        $this->validate($data);

        $db   = getDB();
        $stmt = $db->prepare('
            INSERT INTO rooms (room_number, building, floor, capacity, has_projector, is_available)
            VALUES (?, ?, ?, ?, ?, 1)
        ');
        $stmt->execute([
            $data['roomNumber'], $data['building'], $data['floor'] ?? 0,
            $data['capacity'], isset($data['hasProjector']) ? (int)$data['hasProjector'] : 0
        ]);

        jsonResponse($this->findOrFail($db->lastInsertId()), 201);
    }

    public function update(array $params): void {
        $this->findOrFail($params['id']);
        $data = getBody();
        $this->validate($data);

        $db   = getDB();
        $stmt = $db->prepare('
            UPDATE rooms SET room_number=?, building=?, floor=?, capacity=?, has_projector=?, is_available=?
            WHERE id=?
        ');
        $stmt->execute([
            $data['roomNumber'], $data['building'], $data['floor'] ?? 0,
            $data['capacity'],
            isset($data['hasProjector']) ? (int)$data['hasProjector'] : 0,
            isset($data['isAvailable']) ? (int)$data['isAvailable'] : 1,
            $params['id']
        ]);

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
        return $row;
    }

    private function validate(array $data): void {
        foreach (['roomNumber','building','capacity'] as $f) {
            if (empty($data[$f])) errorResponse("Field '$f' is required");
        }
    }
}
