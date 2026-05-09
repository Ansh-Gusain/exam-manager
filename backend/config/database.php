<?php
// Load from environment variables first (Railway/production), then fall back to .env.backend file
$env = [];
$envFile = __DIR__ . '/../../.env.backend';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $env[trim($k)] = trim($v);
    }
}

// Railway provides MYSQL_URL or individual vars — check system env first
function env(string $key, string $default = ''): string {
    return getenv($key) ?: ($_ENV[$key] ?? $_SERVER[$key] ?? $default);
}

// Railway MySQL plugin provides MYSQL_URL as a connection string
// Parse it if available, otherwise use individual variables
$mysqlUrl = env('MYSQL_URL') ?: env('DATABASE_URL');
if ($mysqlUrl) {
    $parsed = parse_url($mysqlUrl);
    define('DB_HOST', $parsed['host'] ?? '127.0.0.1');
    define('DB_PORT', (string)($parsed['port'] ?? 3306));
    define('DB_NAME', ltrim($parsed['path'] ?? '/exam_manager', '/'));
    define('DB_USER', $parsed['user'] ?? 'root');
    define('DB_PASS', $parsed['pass'] ?? '');
} else {
    define('DB_HOST', env('MYSQLHOST',    $env['DB_HOST'] ?? '127.0.0.1'));
    define('DB_PORT', env('MYSQLPORT',    $env['DB_PORT'] ?? '3306'));
    define('DB_NAME', env('MYSQLDATABASE',$env['DB_NAME'] ?? 'exam_manager'));
    define('DB_USER', env('MYSQLUSER',    $env['DB_USER'] ?? 'root'));
    define('DB_PASS', env('MYSQLPASSWORD',$env['DB_PASS'] ?? ''));
}

define('DB_CHARSET', 'utf8mb4');

// JWT secret — MUST be set as environment variable in production
define('JWT_SECRET', env('JWT_SECRET', $env['JWT_SECRET'] ?? 'change-this-to-a-long-random-secret-min-32-chars!!'));
define('JWT_EXPIRY', (int)(env('JWT_EXPIRY', $env['JWT_EXPIRY'] ?? '86400')));

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            // Never leak DB error details to client
            error_log('DB connection failed: ' . $e->getMessage());
            echo json_encode(['error' => 'Service unavailable']);
            exit();
        }
    }
    return $pdo;
}
