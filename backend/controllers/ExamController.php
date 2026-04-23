<?php
require_once __DIR__ . '/../helpers/response.php';

class ExamController {
    public function index(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $where  = [];
        $values = [];

        if (!empty($q['status'])) {
            $where[]  = 'status = ?';
            $values[] = $q['status'];
        }
        if (!empty($q['semester'])) {
            $where[]  = 'semester = ?';
            $values[] = $q['semester'];
        }

        $sql = 'SELECT * FROM exams';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY date, start_time';

        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['branches']   = json_decode($r['branches'], true) ?? [];
            $r['startTime']  = $r['start_time'];
            $r['endTime']    = $r['end_time'];
            $r['courseCode'] = $r['course_code'];
            $r['batch']      = $r['batch'] ?? null;
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
            INSERT INTO exams (name, course_code, subject, date, start_time, end_time, shift, branches, semester, batch, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['name'],
            $data['courseCode'],
            $data['subject'],
            $data['date'],
            $data['startTime'], $data['endTime'],
            $data['shift'] ?? 'Shift 1 (Morning)',
            json_encode($data['branches']),
            $data['semester'],
            $data['batch'] ?? null,
            $data['status'] ?? 'scheduled'
        ]);
        jsonResponse($this->findOrFail($db->lastInsertId()), 201);
    }

    public function update(array $params): void {
        $this->findOrFail($params['id']);
        $data = getBody();
        $this->validate($data);

        $db   = getDB();
        $stmt = $db->prepare('
            UPDATE exams SET name=?, course_code=?, subject=?, date=?, start_time=?, end_time=?,
            shift=?, branches=?, semester=?, batch=?, status=? WHERE id=?
        ');
        $stmt->execute([
            $data['name'],
            $data['courseCode'],
            $data['subject'],
            $data['date'],
            $data['startTime'], $data['endTime'],
            $data['shift'] ?? 'Shift 1 (Morning)',
            json_encode($data['branches']),
            $data['semester'],
            $data['batch'] ?? null,
            $data['status'] ?? 'scheduled',
            $params['id']
        ]);

        jsonResponse($this->findOrFail($params['id']));
    }

    public function destroy(array $params): void {
        $this->findOrFail($params['id']);
        getDB()->prepare('DELETE FROM exams WHERE id = ?')->execute([$params['id']]);
        jsonResponse(['message' => 'Exam deleted']);
    }

    private function findOrFail(int|string $id): array {
        $stmt = getDB()->prepare('SELECT * FROM exams WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) errorResponse('Exam not found', 404);
        $row['branches']   = json_decode($row['branches'], true) ?? [];
        $row['startTime']  = $row['start_time'];
        $row['endTime']    = $row['end_time'];
        $row['courseCode'] = $row['course_code'];
        $row['batch']      = $row['batch'] ?? null;
        return $row;
    }

    private function validate(array $data): void {
        foreach (['name','courseCode','subject','date','startTime','endTime','branches','semester'] as $f) {
            if (empty($data[$f])) errorResponse("Field '$f' is required");
        }
        if (!is_array($data['branches'])) errorResponse('branches must be an array');
        if (!in_array($data['status'] ?? 'scheduled', ['scheduled','ongoing','completed'], true)) {
            errorResponse('Invalid status value');
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) errorResponse('Invalid date format');
    }
}
