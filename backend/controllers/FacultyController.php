<?php
require_once __DIR__ . '/../helpers/response.php';

class FacultyController {
    public function index(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $where  = [];
        $values = [];

        foreach (['school','department','branch','designation'] as $field) {
            if (!empty($q[$field])) {
                $where[]  = "$field = ?";
                $values[] = $q[$field];
            }
        }
        if (isset($q['isAvailable'])) {
            $where[]  = 'is_available = ?';
            $values[] = $q['isAvailable'] === 'true' ? 1 : 0;
        }

        $sql = 'SELECT * FROM faculty';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY name';

        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        $rows = $stmt->fetchAll();

        // Cast booleans
        foreach ($rows as &$r) {
            $r['is_available'] = (bool)$r['is_available'];
            $r['total_duties'] = (int)$r['total_duties'];
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
            INSERT INTO faculty (employee_id, name, school, department, branch, designation, email, phone, total_duties, is_available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
        ');
        $stmt->execute([
            $data['employeeId'], $data['name'], $data['school'],
            $data['department'], $data['branch'], $data['designation'],
            $data['email'] ?? null, $data['phone'] ?? null
        ]);

        jsonResponse($this->findOrFail($db->lastInsertId()), 201);
    }

    public function update(array $params): void {
        $this->findOrFail($params['id']);
        $data = getBody();

        $db   = getDB();
        $stmt = $db->prepare('
            UPDATE faculty SET employee_id=?, name=?, school=?, department=?, branch=?,
            designation=?, email=?, phone=?, is_available=?, total_duties=? WHERE id=?
        ');
        $stmt->execute([
            $data['employeeId'], $data['name'], $data['school'],
            $data['department'], $data['branch'], $data['designation'],
            $data['email'] ?? null, $data['phone'] ?? null,
            isset($data['isAvailable']) ? (int)$data['isAvailable'] : 1,
            $data['totalDuties'] ?? 0,
            $params['id']
        ]);

        jsonResponse($this->findOrFail($params['id']));
    }

    public function destroy(array $params): void {
        $this->findOrFail($params['id']);
        getDB()->prepare('DELETE FROM faculty WHERE id = ?')->execute([$params['id']]);
        jsonResponse(['message' => 'Faculty deleted']);
    }

    public function bulk(array $params): void {
        $data = getBody();
        if (empty($data['faculty']) || !is_array($data['faculty'])) {
            errorResponse('faculty array is required');
        }

        $db   = getDB();
        $stmt = $db->prepare('
            INSERT INTO faculty (employee_id, name, school, department, branch, designation, email, phone, total_duties, is_available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
            ON DUPLICATE KEY UPDATE name=VALUES(name), school=VALUES(school),
            department=VALUES(department), branch=VALUES(branch), designation=VALUES(designation),
            email=VALUES(email), phone=VALUES(phone)
        ');

        $db->beginTransaction();
        $count = 0;
        foreach ($data['faculty'] as $f) {
            $stmt->execute([
                $f['employeeId'], $f['name'], $f['school'],
                $f['department'], $f['branch'], $f['designation'],
                $f['email'] ?? null, $f['phone'] ?? null
            ]);
            $count++;
        }
        $db->commit();

        jsonResponse(['message' => "$count faculty imported", 'count' => $count]);
    }

    private function findOrFail(int|string $id): array {
        $stmt = getDB()->prepare('SELECT * FROM faculty WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) errorResponse('Faculty not found', 404);
        $row['is_available'] = (bool)$row['is_available'];
        $row['total_duties'] = (int)$row['total_duties'];
        return $row;
    }

    private function validate(array $data): void {
        foreach (['employeeId','name','school','department','branch','designation'] as $f) {
            if (empty($data[$f])) errorResponse("Field '$f' is required");
        }
    }
}
