<?php
require_once __DIR__ . '/../helpers/response.php';

class ReplacementController {
    public function index(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $where  = [];
        $values = [];

        if (!empty($q['status'])) {
            $where[]  = 'rl.status = ?';
            $values[] = $q['status'];
        }
        if (!empty($q['examId'])) {
            $where[]  = 'rl.exam_id = ?';
            $values[] = $q['examId'];
        }
        if (!empty($q['facultyId'])) {
            $where[]  = '(rl.original_faculty_id = ? OR rl.replacement_faculty_id = ?)';
            $values[] = $q['facultyId'];
            $values[] = $q['facultyId'];
        }

        $sql = '
            SELECT rl.*,
                   f1.name AS original_faculty_name,
                   f2.name AS replacement_faculty_name,
                   r.room_number, r.building,
                   e.name AS exam_name
            FROM replacement_logs rl
            JOIN faculty f1 ON rl.original_faculty_id    = f1.id
            LEFT JOIN faculty f2 ON rl.replacement_faculty_id = f2.id
            JOIN rooms r   ON rl.room_id  = r.id
            JOIN exams e   ON rl.exam_id  = e.id
        ';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY rl.requested_at DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        jsonResponse($stmt->fetchAll());
    }

    public function store(array $params): void {
        $data = getBody();
        foreach (['examId','roomId','originalFacultyId','reason'] as $f) {
            if (empty($data[$f])) errorResponse("Field '$f' is required");
        }

        $db   = getDB();
        $stmt = $db->prepare('
            INSERT INTO replacement_logs (exam_id, room_id, original_faculty_id, replacement_faculty_id, reason, status, requested_at)
            VALUES (?, ?, ?, ?, ?, "pending", NOW())
        ');
        $stmt->execute([
            $data['examId'], $data['roomId'], $data['originalFacultyId'],
            $data['replacementFacultyId'] ?? null, $data['reason']
        ]);

        $id   = $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM replacement_logs WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse($stmt->fetch(), 201);
    }

    public function update(array $params): void {
        $db   = getDB();
        $stmt = $db->prepare('SELECT * FROM replacement_logs WHERE id = ?');
        $stmt->execute([$params['id']]);
        $log = $stmt->fetch();
        if (!$log) errorResponse('Replacement log not found', 404);

        $data   = getBody();
        $status = $data['status'] ?? $log['status'];

        // Validate status enum
        if (!in_array($status, ['pending', 'approved', 'rejected'], true)) {
            errorResponse('Invalid status value');
        }

        $approvedAt = in_array($status, ['approved', 'rejected']) ? 'NOW()' : 'NULL';

        $stmt = $db->prepare("
            UPDATE replacement_logs
            SET status=?, replacement_faculty_id=?, approved_at=$approvedAt
            WHERE id=?
        ");
        $stmt->execute([
            $status,
            $data['replacementFacultyId'] ?? $log['replacement_faculty_id'],
            $params['id']
        ]);

        $stmt = $db->prepare('SELECT * FROM replacement_logs WHERE id = ?');
        $stmt->execute([$params['id']]);
        jsonResponse($stmt->fetch());
    }
}
