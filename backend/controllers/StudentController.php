<?php
require_once __DIR__ . '/../helpers/response.php';

class StudentController {
    public function index(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $where  = [];
        $values = [];

        foreach (['school','department','branch','semester','year','session','batch','type'] as $field) {
            if (!empty($q[$field])) {
                $where[]  = "$field = ?";
                $values[] = $q[$field];
            }
        }

        $sql = 'SELECT * FROM students';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY roll_number';

        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        jsonResponse($stmt->fetchAll());
    }

    public function show(array $params): void {
        jsonResponse($this->findOrFail($params['id']));
    }

    public function store(array $params): void {
        $data = getBody();
        $this->validate($data);

        $db   = getDB();
        $stmt = $db->prepare('
            INSERT INTO students (roll_number, name, school, department, branch, semester, year, session, batch, type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['rollNumber'], $data['name'], $data['school'],
            $data['department'], $data['branch'], (int)$data['semester'],
            $data['year'], $data['session'],
            $data['batch'] ?? $data['session'],
            in_array($data['type'] ?? 'regular', ['regular','repeater']) ? $data['type'] : 'regular'
        ]);

        jsonResponse($this->findOrFail($db->lastInsertId()), 201);
    }

    public function update(array $params): void {
        $this->findOrFail($params['id']);
        $data = getBody();
        $this->validate($data);

        $db   = getDB();
        $stmt = $db->prepare('
            UPDATE students SET roll_number=?, name=?, school=?, department=?, branch=?,
            semester=?, year=?, session=?, batch=?, type=? WHERE id=?
        ');
        $stmt->execute([
            $data['rollNumber'], $data['name'], $data['school'],
            $data['department'], $data['branch'], (int)$data['semester'],
            $data['year'], $data['session'],
            $data['batch'] ?? $data['session'],
            in_array($data['type'] ?? 'regular', ['regular','repeater']) ? $data['type'] : 'regular',
            $params['id']
        ]);

        jsonResponse($this->findOrFail($params['id']));
    }

    public function destroy(array $params): void {
        $this->findOrFail($params['id']);
        getDB()->prepare('DELETE FROM students WHERE id = ?')->execute([$params['id']]);
        jsonResponse(['message' => 'Student deleted']);
    }

    public function bulk(array $params): void {
        $data = getBody();
        if (empty($data['students']) || !is_array($data['students'])) {
            errorResponse('students array is required');
        }
        if (count($data['students']) > 2000) {
            errorResponse('Maximum 2000 students per bulk import');
        }

        $db   = getDB();
        $stmt = $db->prepare('
            INSERT INTO students (roll_number, name, school, department, branch, semester, year, session, batch, type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), school=VALUES(school),
            department=VALUES(department), branch=VALUES(branch), semester=VALUES(semester),
            year=VALUES(year), session=VALUES(session), batch=VALUES(batch), type=VALUES(type)
        ');

        $db->beginTransaction();
        $count = 0;
        foreach ($data['students'] as $s) {
            if (empty($s['rollNumber']) || empty($s['name'])) continue;
            $type = in_array($s['type'] ?? 'regular', ['regular','repeater']) ? $s['type'] : 'regular';
            $stmt->execute([
                substr($s['rollNumber'], 0, 20),
                substr($s['name'], 0, 150),
                substr($s['school'] ?? '', 0, 20),
                substr($s['department'] ?? '', 0, 50),
                substr($s['branch'] ?? '', 0, 50),
                (int)($s['semester'] ?? 1),
                substr($s['year'] ?? '', 0, 10),
                substr($s['session'] ?? '', 0, 20),
                substr($s['batch'] ?? $s['session'] ?? '', 0, 20),
                $type
            ]);
            $count++;
        }
        $db->commit();

        jsonResponse(['message' => "$count students imported", 'count' => $count]);
    }

    private function findOrFail(int|string $id): array {
        $stmt = getDB()->prepare('SELECT * FROM students WHERE id = ?');
        $stmt->execute([$id]);
        $row  = $stmt->fetch();
        if (!$row) errorResponse('Student not found', 404);
        return $row;
    }

    private function validate(array $data): void {
        foreach (['rollNumber','name','school','department','branch','semester','year','session'] as $f) {
            if (empty($data[$f])) errorResponse("Field '$f' is required");
        }
        if (!in_array($data['type'] ?? 'regular', ['regular','repeater'])) {
            errorResponse("type must be 'regular' or 'repeater'");
        }
    }
}
