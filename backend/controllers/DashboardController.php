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

        // Upcoming exams — include course_code, shift, batch
        $stmt = $db->prepare('
            SELECT id, name, course_code, subject, date, start_time, shift, semester, batch, branches, status
            FROM exams
            WHERE status = "scheduled" AND date >= CURDATE()
            ORDER BY date, start_time
            LIMIT 5
        ');
        $stmt->execute();
        $upcoming = $stmt->fetchAll();
        foreach ($upcoming as &$e) {
            $e['branches']   = json_decode($e['branches'], true) ?? [];
            $e['courseCode'] = $e['course_code'];
            $e['startTime']  = $e['start_time'];
        }
        $stats['upcomingExams'] = $upcoming;

        // Student distribution by school
        $stmt = $db->query('SELECT school, COUNT(*) AS count FROM students GROUP BY school ORDER BY school');
        $stats['studentsBySchool'] = $stmt->fetchAll();

        // Seating & attendance stats
        $stats['totalSeated']    = (int)$db->query('SELECT COUNT(DISTINCT student_id) FROM seating_allocations')->fetchColumn();
        $stats['totalAttendance']= (int)$db->query('SELECT COUNT(*) FROM attendance_records WHERE status != "not-marked"')->fetchColumn();
        $stats['presentCount']   = (int)$db->query('SELECT COUNT(*) FROM attendance_records WHERE status = "present"')->fetchColumn();
        $stats['absentCount']    = (int)$db->query('SELECT COUNT(*) FROM attendance_records WHERE status = "absent"')->fetchColumn();

        // Faculty on leave
        $stats['facultyOnLeave'] = (int)$db->query('SELECT COUNT(*) FROM faculty WHERE status = "on_leave"')->fetchColumn();

        // Student distribution by batch
        $stmt = $db->query('SELECT batch, COUNT(*) AS count FROM students GROUP BY batch ORDER BY batch');
        $stats['studentsByBatch'] = $stmt->fetchAll();

        jsonResponse($stats);
    }
}
