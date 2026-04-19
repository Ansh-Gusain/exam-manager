<?php
require_once __DIR__ . '/../helpers/jwt.php';

class AuthMiddleware {
    public static function authenticate(): ?array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = substr($authHeader, 7);
        return JwtHelper::verify($token);
    }

    public static function requireRole(array $allowedRoles): void {
        $user = self::authenticate();
        if (!$user || !in_array($user['role'], $allowedRoles)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit();
        }
    }
}
