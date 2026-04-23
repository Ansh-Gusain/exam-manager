<?php
require_once __DIR__ . '/../helpers/response.php';

class FacultyController {
    public function index(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $where  = [];
        $values = [];

        foreach (['school','department','designation','status'] as $field) {
            if (!empty($q[$field])) {
                $where[]  = "$field = ?";
                $values[] = $q[$field];
            }
        }

        $sql = 'SELECT * FROM faculty';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY name';

        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['is_available'] = $r['status'] === 'available';
            $r['totalDuties']  = (int)$r['total_duties'];
            $r['isAvailable']  = $r['status'] === 'available';
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
            INSERT INTO faculty (phone, name, school, department, designation, email, status, total_duties)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        ');
        $stmt->execute([
            $data['phone'], $data['name'], $data['school'],
            $data['department'], $data['designation'],
            $data['email'] ?? null,
            $data['status'] ?? 'available'
        ]);

        jsonResponse($this->findOrFail($db->lastInsertId()), 201);
    }

    public function update(array $params): void {
        $this->findOrFail($params['id']);
        $data = getBody();

        $db   = getDB();
        $stmt = $db->prepare('
            UPDATE faculty SET phone=?, name=?, school=?, department=?,
            designation=?, email=?, status=?, total_duties=? WHERE id=?
        ');
        $stmt->execute([
            $data['phone'], $data['name'], $data['school'],
            $data['department'], $data['designation'],
            $data['email'] ?? null,
            $data['status'] ?? 'available',
            $data['totalDuties'] ?? $data['total_duties'] ?? 0,
            $params['id']
        ]);

        jsonResponse($this->findOrFail($params['id']));
    }

    // Mark faculty on leave
    public function setLeave(array $params): void {
        $data = getBody();
        $db   = getDB();

        $stmt = $db->prepare('SELECT * FROM faculty WHERE id = ?');
        $stmt->execute([$params['id']]);
        $faculty = $stmt->fetch();
        if (!$faculty) errorResponse('Faculty not found', 404);

        $status = $data['status'] ?? 'on_leave';
        if (!in_array($status, ['available','on_leave','not_available'])) {
            errorResponse('Invalid status');
        }

        $db->prepare('UPDATE faculty SET status=?, leave_reason=?, is_available=? WHERE id=?')
           ->execute([
               $status,
               $data['reason'] ?? null,
               $status === 'available' ? 1 : 0,
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
            INSERT INTO faculty (phone, name, school, department, designation, email, status, total_duties)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            ON DUPLICATE KEY UPDATE name=VALUES(name), school=VALUES(school),
            department=VALUES(department), designation=VALUES(designation),
            email=VALUES(email), status=VALUES(status)
        ');

        $db->beginTransaction();
        $count = 0;
        foreach ($data['faculty'] as $f) {
            if (empty($f['phone']) || empty($f['name'])) continue;
            $stmt->execute([
                substr($f['phone'], 0, 10), substr($f['name'], 0, 150),
                substr($f['school'] ?? '', 0, 20),
                substr($f['department'] ?? '', 0, 50),
                substr($f['designation'] ?? 'Assistant Professor', 0, 50),
                $f['email'] ?? null,
                in_array($f['status'] ?? 'available', ['available','on_leave','not_available'])
                    ? $f['status'] : 'available'
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
        $row['is_available'] = $row['status'] === 'available';
        $row['isAvailable']  = $row['status'] === 'available';
        $row['totalDuties']  = (int)$row['total_duties'];
        return $row;
    }

    private function validate(array $data): void {
        foreach (['phone','name','school','department','designation'] as $f) {
            if (empty($data[$f])) errorResponse("Field '$f' is required");
        }
        if (!preg_match('/^[6-9]\d{9}$/', $data['phone'])) {
            errorResponse('Phone must be a valid 10-digit Indian mobile number');
        }
    }
}
