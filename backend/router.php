<?php
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/StudentController.php';
require_once __DIR__ . '/controllers/FacultyController.php';
require_once __DIR__ . '/controllers/RoomController.php';
require_once __DIR__ . '/controllers/ExamController.php';
require_once __DIR__ . '/controllers/SeatingController.php';
require_once __DIR__ . '/controllers/InvigilationController.php';
require_once __DIR__ . '/controllers/AttendanceController.php';
require_once __DIR__ . '/controllers/ReplacementController.php';
require_once __DIR__ . '/controllers/ReportController.php';
require_once __DIR__ . '/controllers/AcademicController.php';
require_once __DIR__ . '/controllers/DashboardController.php';

class Router {
    private array $routes = [];

    public function __construct() {
        $this->registerRoutes();
    }

    private function registerRoutes(): void {
        // Auth (public)
        $this->add('POST', '/api/auth/login',           [AuthController::class, 'login'],           false);
        $this->add('POST', '/api/auth/signup',          [AuthController::class, 'signup'],          false);
        $this->add('POST', '/api/auth/google',          [AuthController::class, 'googleAuth'],      false);
        $this->add('POST', '/api/auth/forgot-password', [AuthController::class, 'forgotPassword'],  false);
        $this->add('POST', '/api/auth/reset-password',  [AuthController::class, 'resetPassword'],   false);
        $this->add('GET',  '/api/auth/verify-reset',    [AuthController::class, 'verifyResetToken'], false);
        $this->add('POST', '/api/auth/logout',          [AuthController::class, 'logout']);
        $this->add('GET',  '/api/auth/me',              [AuthController::class, 'me']);

        // Dashboard
        $this->add('GET', '/api/dashboard', [DashboardController::class, 'index']);

        // Academic structure (read-only)
        $this->add('GET', '/api/academic/schools',      [AcademicController::class, 'schools']);
        $this->add('GET', '/api/academic/departments',  [AcademicController::class, 'departments']);
        $this->add('GET', '/api/academic/branches',     [AcademicController::class, 'branches']);
        $this->add('GET', '/api/academic/structure',    [AcademicController::class, 'fullStructure']);

        // Students
        $this->add('GET',    '/api/students',      [StudentController::class, 'index']);
        $this->add('POST',   '/api/students',      [StudentController::class, 'store']);
        $this->add('GET',    '/api/students/{id}', [StudentController::class, 'show']);
        $this->add('PUT',    '/api/students/{id}', [StudentController::class, 'update']);
        $this->add('DELETE', '/api/students/{id}', [StudentController::class, 'destroy']);
        $this->add('POST',   '/api/students/bulk', [StudentController::class, 'bulk']);

        // Faculty
        $this->add('GET',    '/api/faculty',      [FacultyController::class, 'index']);
        $this->add('POST',   '/api/faculty',      [FacultyController::class, 'store']);
        $this->add('GET',    '/api/faculty/{id}', [FacultyController::class, 'show']);
        $this->add('PUT',    '/api/faculty/{id}', [FacultyController::class, 'update']);
        $this->add('DELETE', '/api/faculty/{id}', [FacultyController::class, 'destroy']);
        $this->add('POST',   '/api/faculty/bulk', [FacultyController::class, 'bulk']);

        // Rooms
        $this->add('GET',    '/api/rooms',      [RoomController::class, 'index']);
        $this->add('POST',   '/api/rooms',      [RoomController::class, 'store']);
        $this->add('GET',    '/api/rooms/{id}', [RoomController::class, 'show']);
        $this->add('PUT',    '/api/rooms/{id}', [RoomController::class, 'update']);
        $this->add('DELETE', '/api/rooms/{id}', [RoomController::class, 'destroy']);

        // Exams
        $this->add('GET',    '/api/exams',      [ExamController::class, 'index']);
        $this->add('POST',   '/api/exams',      [ExamController::class, 'store']);
        $this->add('GET',    '/api/exams/{id}', [ExamController::class, 'show']);
        $this->add('PUT',    '/api/exams/{id}', [ExamController::class, 'update']);
        $this->add('DELETE', '/api/exams/{id}', [ExamController::class, 'destroy']);

        // Seating
        $this->add('GET',    '/api/seating',                    [SeatingController::class, 'index']);
        $this->add('POST',   '/api/seating/allocate',           [SeatingController::class, 'allocate']);
        $this->add('POST',   '/api/seating/allocate-by-date',   [SeatingController::class, 'allocateByDate']);
        $this->add('DELETE', '/api/seating/exam/{examId}',      [SeatingController::class, 'clearByExam']);
        $this->add('DELETE', '/api/seating/date/{date}',        [SeatingController::class, 'clearByDate']);

        // Invigilation
        $this->add('GET',    '/api/invigilation',              [InvigilationController::class, 'index']);
        $this->add('POST',   '/api/invigilation/allocate',     [InvigilationController::class, 'allocate']);
        $this->add('DELETE', '/api/invigilation/exam/{examId}',[InvigilationController::class, 'clearByExam']);

        // Attendance
        $this->add('GET',  '/api/attendance',              [AttendanceController::class, 'index']);
        $this->add('POST', '/api/attendance/generate',     [AttendanceController::class, 'generate']);
        $this->add('PUT',  '/api/attendance/{id}',         [AttendanceController::class, 'update']);
        $this->add('POST', '/api/attendance/mark-all-present', [AttendanceController::class, 'markAllPresent']);

        // Replacements
        $this->add('GET',  '/api/replacements',      [ReplacementController::class, 'index']);
        $this->add('POST', '/api/replacements',      [ReplacementController::class, 'store']);
        $this->add('PUT',  '/api/replacements/{id}', [ReplacementController::class, 'update']);

        // Reports
        $this->add('GET', '/api/reports/room-utilization', [ReportController::class, 'roomUtilization']);
        $this->add('GET', '/api/reports/faculty-duties',   [ReportController::class, 'facultyDuties']);
        $this->add('GET', '/api/reports/attendance',       [ReportController::class, 'attendance']);
        $this->add('GET', '/api/reports/distribution',     [ReportController::class, 'distribution']);
    }

    private function add(string $method, string $path, array $handler, bool $requireAuth = true): void {
        $this->routes[] = compact('method', 'path', 'handler', 'requireAuth');
    }

    public function dispatch(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $base   = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
        if ($base && str_starts_with($uri, $base)) {
            $uri = substr($uri, strlen($base));
        }
        if (empty($uri)) $uri = '/';

        foreach ($this->routes as $route) {
            $params = $this->match($route['method'], $route['path'], $method, $uri);
            if ($params !== null) {
                if ($route['requireAuth']) {
                    $user = AuthMiddleware::authenticate();
                    if (!$user) {
                        http_response_code(401);
                        echo json_encode(['error' => 'Unauthorized']);
                        return;
                    }
                    $_REQUEST['_user'] = $user;
                }
                [$class, $action] = $route['handler'];
                $controller = new $class();
                $controller->$action($params);
                return;
            }
        }

        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    }

    private function match(string $routeMethod, string $routePath, string $method, string $uri): ?array {
        if ($routeMethod !== $method) return null;

        $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $routePath);
        $pattern = '#^' . $pattern . '$#';

        if (preg_match($pattern, $uri, $matches)) {
            return array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
        }
        return null;
    }
}
