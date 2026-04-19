<?php
require_once __DIR__ . '/../helpers/response.php';

class StudentController {
    public function index(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $where  = [];
        $values = [];

        foreach (['school','department','branch','semester','year','section','session'] as $field) {
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
        $student = $this->findOrFail($params['id']);
        jsonResponse($student);
    }

    public function store(array $params): void {
        $data = getBody();
        $this->validate($data);

        $db   = getDB();
        $stmt = $db->prepare('
            INSERT INTO students (roll_number, name, school, department, branch, semester, year, section, session)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['rollNumber'], $data['name'], $data['school'],
            $data['department'], $data['branch'], $data['semester'],
            $data['year'], $data['section'], $data['session']
        ]);

        $student = $this->findOrFail($db->lastInsertId());
        jsonResponse($student, 201);
    }

    public function update(array $params): void {
        $this->findOrFail($params['id']);
        $data = getBody();
        $this->validate($data);

        $db   = getDB();
        $stmt = $db->prepare('
            UPDATE students SET roll_number=?, name=?, school=?, department=?, branch=?,
            semester=?, year=?, section=?, session=? WHERE id=?
        ');
        $stmt->execute([
            $data['rollNumber'], $data['name'], $data['school'],
            $data['department'], $data['branch'], $data['semester'],
            $data['year'], $data['section'], $data['session'],
            $params['id']
        ]);

        jsonResponse($this->findOrFail($params['id']));
    }

    public function destroy(array $params): void {
        $this->findOrFail($params['id']);
        $db = getDB();
        $db->prepare('DELETE FROM students WHERE id = ?')->execute([$params['id']]);
        jsonResponse(['message' => 'Student deleted']);
    }

    public function bulk(array $params): void {
        $data = getBody();
        if (empty($data['students']) || !is_array($data['students'])) {
            errorResponse('students array is required');
        }
        if (count($data['students']) > 1000) {
            errorResponse('Maximum 1000 students per bulk import');
        }

        $db   = getDB();
        $stmt = $db->prepare('
            INSERT INTO students (roll_number, name, school, department, branch, semester, year, section, session)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), school=VALUES(school),
            department=VALUES(department), branch=VALUES(branch), semester=VALUES(semester),
            year=VALUES(year), section=VALUES(section), session=VALUES(session)
        ');

        $db->beginTransaction();
        $count = 0;
        foreach ($data['students'] as $s) {
            if (empty($s['rollNumber']) || empty($s['name'])) continue;
            $stmt->execute([
                substr($s['rollNumber'], 0, 20), substr($s['name'], 0, 150),
                substr($s['school'] ?? '', 0, 20), substr($s['department'] ?? '', 0, 50),
                substr($s['branch'] ?? '', 0, 50), (int)($s['semester'] ?? 1),
                substr($s['year'] ?? '', 0, 10), substr($s['section'] ?? '', 0, 5),
                substr($s['session'] ?? '', 0, 20)
            ]);
            $count++;
        }
        $db->commit();

        jsonResponse(['message' => "$count students imported", 'count' => $count]);
    }

    private function findOrFail(int|string $id): array {
        $db   = getDB();
        $stmt = $db->prepare('SELECT * FROM students WHERE id = ?');
        $stmt->execute([$id]);
        $row  = $stmt->fetch();
        if (!$row) errorResponse('Student not found', 404);
        return $row;
    }

    private function validate(array $data): void {
        $required = ['rollNumber','name','school','department','branch','semester','year','section','session'];
        foreach ($required as $field) {
            if (empty($data[$field])) errorResponse("Field '$field' is required");
        }
    }
}
