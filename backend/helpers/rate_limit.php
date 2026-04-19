<?php
/**
 * Simple file-based rate limiter.
 * Limits requests per IP per window.
 */
function rateLimit(string $key, int $maxRequests = 10, int $windowSeconds = 60): void {
    $dir  = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'exam_rl';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);

    // If we can't create the dir, skip rate limiting rather than crash
    if (!is_dir($dir)) return;

    $ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = $dir . DIRECTORY_SEPARATOR . md5($key . $ip) . '.json';
    $now  = time();

    $data = ['count' => 0, 'window_start' => $now];
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true) ?? $data;
    }

    // Reset window if expired
    if ($now - $data['window_start'] > $windowSeconds) {
        $data = ['count' => 0, 'window_start' => $now];
    }

    $data['count']++;
    file_put_contents($file, json_encode($data), LOCK_EX);

    if ($data['count'] > $maxRequests) {
        http_response_code(429);
        echo json_encode(['error' => 'Too many requests. Please try again later.']);
        exit();
    }
}
