<?php
// Load from environment or .env file
$env = [];
$envFile = __DIR__ . '/../../.env.backend';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $env[trim($k)] = trim($v);
    }
}

define('DB_HOST',    $env['DB_HOST']    ?? '127.0.0.1');
define('DB_PORT',    $env['DB_PORT']    ?? '3307');
define('DB_NAME',    $env['DB_NAME']    ?? 'exam_manager');
define('DB_USER',    $env['DB_USER']    ?? 'root');
define('DB_PASS',    $env['DB_PASS']    ?? '');
define('DB_CHARSET', 'utf8mb4');

// JWT secret — MUST be changed in production
define('JWT_SECRET', $env['JWT_SECRET'] ?? 'change-this-to-a-long-random-secret-min-32-chars!!');
define('JWT_EXPIRY', (int)($env['JWT_EXPIRY'] ?? 86400));

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
