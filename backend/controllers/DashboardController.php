<?php
require_once __DIR__ . '/../helpers/response.php';

class DashboardController {
    public function index(array $params): void {
        $db = getDB();

        $stats = [];

        // Counts
        $stats['totalStudents'] = (int)$db->query('SELECT COUNT(*) FROM students')->fetchColumn();
        $stats['totalFaculty']  = (int)$db->query('SELECT COUNT(*) FROM faculty')->fetchColumn();
        $stats['totalRooms']    = (int)$db->query('SELECT COUNT(*) FROM rooms')->fetchColumn();
        $stats['availableRooms']= (int)$db->query('SELECT COUNT(*) FROM rooms WHERE is_available = 1')->fetchColumn();
        $stats['availableFaculty'] = (int)$db->query('SELECT COUNT(*) FROM faculty WHERE is_available = 1')->fetchColumn();
        $stats['totalCapacity'] = (int)$db->query('SELECT COALESCE(SUM(capacity),0) FROM rooms WHERE is_available = 1')->fetchColumn();

        // Exam status counts
        $stmt = $db->query('SELECT status, COUNT(*) AS cnt FROM exams GROUP BY status');
        $examStats = [];
        foreach ($stmt->fetchAll() as $row) {
            $examStats[$row['status']] = (int)$row['cnt'];
        }
        $stats['exams'] = $examStats;

        // Upcoming exams
        $stmt = $db->prepare('SELECT * FROM exams WHERE status = "scheduled" AND date >= CURDATE() ORDER BY date, start_time LIMIT 5');
        $stmt->execute();
        $upcoming = $stmt->fetchAll();
        foreach ($upcoming as &$e) {
            $e['branches'] = json_decode($e['branches'], true) ?? [];
        }
        $stats['upcomingExams'] = $upcoming;

        // Recent replacements
        $stmt = $db->prepare('
            SELECT rl.*, f1.name AS original_faculty_name, e.name AS exam_name
            FROM replacement_logs rl
            JOIN faculty f1 ON rl.original_faculty_id = f1.id
            JOIN exams e    ON rl.exam_id = e.id
            ORDER BY rl.requested_at DESC LIMIT 5
        ');
        $stmt->execute();
        $stats['recentReplacements'] = $stmt->fetchAll();

        // Student distribution by school
        $stmt = $db->query('SELECT school, COUNT(*) AS count FROM students GROUP BY school ORDER BY school');
        $stats['studentsBySchool'] = $stmt->fetchAll();

        jsonResponse($stats);
    }
}
