<?php
require_once __DIR__ . '/../helpers/response.php';

class ReportController {
    public function roomUtilization(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $joinWhere  = '';
        $values = [];
        if (!empty($q['examId'])) {
            $joinWhere = ' AND sa.exam_id = ?';
            $values[]  = $q['examId'];
        }

        $sql = "
            SELECT r.id, r.room_number, r.building, r.capacity,
                   COUNT(sa.id) AS allocated,
                   ROUND(COUNT(sa.id) / r.capacity * 100, 1) AS utilization_pct
            FROM rooms r
            LEFT JOIN seating_allocations sa ON r.id = sa.room_id$joinWhere
            GROUP BY r.id
            ORDER BY r.building, r.room_number
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['allocated']       = (int)$r['allocated'];
            $r['capacity']        = (int)$r['capacity'];
            $r['utilization_pct'] = (float)$r['utilization_pct'];
        }
        jsonResponse($rows);
    }

    public function facultyDuties(array $params): void {
        $db   = getDB();
        $stmt = $db->query('
            SELECT f.id, f.name, f.employee_id, f.school, f.department,
                   f.total_duties, f.is_available,
                   COUNT(ia.id) AS current_allocations
            FROM faculty f
            LEFT JOIN invigilation_allocations ia ON f.id = ia.faculty_id
            GROUP BY f.id
            ORDER BY f.total_duties DESC
        ');
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['is_available']         = (bool)$r['is_available'];
            $r['total_duties']         = (int)$r['total_duties'];
            $r['current_allocations']  = (int)$r['current_allocations'];
        }
        jsonResponse($rows);
    }

    public function attendance(array $params): void {
        $db = getDB();
        $q  = getQuery();

        $where  = ['1=1'];
        $values = [];

        if (!empty($q['examId'])) {
            $where[]  = 'ar.exam_id = ?';
            $values[] = $q['examId'];
        }

        $stmt = $db->prepare('
            SELECT e.id AS exam_id, e.name AS exam_name, e.date,
                   COUNT(ar.id) AS total,
                   SUM(ar.status = "present") AS present,
                   SUM(ar.status = "absent")  AS absent,
                   SUM(ar.status = "not-marked") AS not_marked,
                   ROUND(SUM(ar.status = "present") / COUNT(ar.id) * 100, 1) AS attendance_pct
            FROM attendance_records ar
            JOIN exams e ON ar.exam_id = e.id
            WHERE ' . implode(' AND ', $where) . '
            GROUP BY ar.exam_id
            ORDER BY e.date DESC
        ');
        $stmt->execute($values);
        jsonResponse($stmt->fetchAll());
    }

    public function distribution(array $params): void {
        $db = getDB();

        $byBranch = $db->query('SELECT branch, COUNT(*) AS count FROM students GROUP BY branch ORDER BY count DESC')->fetchAll();
        $bySchool = $db->query('SELECT school, COUNT(*) AS count FROM students GROUP BY school ORDER BY count DESC')->fetchAll();
        $byDept   = $db->query('SELECT department, COUNT(*) AS count FROM faculty GROUP BY department ORDER BY count DESC')->fetchAll();

        jsonResponse([
            'studentsByBranch'      => $byBranch,
            'studentsBySchool'      => $bySchool,
            'facultyByDepartment'   => $byDept,
        ]);
    }
}
