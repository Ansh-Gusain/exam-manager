<?php
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/rate_limit.php';

class AuthController {

    public function login(array $params): void {
        // Rate limit: 10 attempts per minute per IP
        rateLimit('login', 10, 60);

        $body       = getBody();
        $identifier = trim($body['identifier'] ?? $body['email'] ?? '');
        $password   = $body['password'] ?? '';

        if (!$identifier) errorResponse('Identifier is required');

        $db   = getDB();
        $stmt = $db->prepare('SELECT * FROM admin_login WHERE email = ? OR username = ? LIMIT 1');
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch();

        // Use constant-time comparison to prevent timing attacks
        $hash = $user['password'] ?? '$2y$10$invalidhashpadding000000000000000000000000000000000000';
        if (!$user || !password_verify($password, $hash)) {
            errorResponse('Invalid credentials', 401);
        }

        $token = JwtHelper::generate([
            'sub'    => $user['id'],
            'role'   => $user['role'],
            'name'   => $user['name'],
            'email'  => $user['email'],
            'ref_id' => $user['ref_id'],
        ]);

        jsonResponse([
            'token' => $token,
            'user'  => [
                'id'     => $user['id'],
                'name'   => $user['name'],
                'email'  => $user['email'],
                'role'   => $user['role'],
                'ref_id' => $user['ref_id'],
            ],
        ]);
    }

    public function signup(array $params): void {
        // Rate limit: 5 signups per 10 minutes per IP
        rateLimit('signup', 5, 600);

        $data     = getBody();
        $name     = trim($data['name'] ?? '');
        $email    = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $role     = $data['role'] ?? 'student'; // Default to least-privileged role

        if (!$name || !$email || !$password) errorResponse('Name, email and password are required');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL))  errorResponse('Invalid email address');
        if (!in_array($role, ['admin', 'faculty', 'student'], true)) errorResponse('Invalid role');
        if (strlen($password) < 8) errorResponse('Password must be at least 8 characters');
        if (strlen($name) > 150)   errorResponse('Name too long');

        $db   = getDB();
        $stmt = $db->prepare('SELECT id FROM admin_login WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) errorResponse('Email already registered', 409);

        $hash     = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $username = preg_replace('/[^a-z0-9_]/', '', strtolower(explode('@', $email)[0]));
        // Fallback if username is empty after sanitization
        if (empty($username)) $username = 'user' . time();
        // Ensure username is unique
        $base = $username;
        $i = 1;
        while (true) {
            $stmt = $db->prepare('SELECT id FROM admin_login WHERE username = ?');
            $stmt->execute([$username]);
            if (!$stmt->fetch()) break;
            $username = $base . $i++;
        }

        $stmt = $db->prepare('INSERT INTO admin_login (username, email, password, name, role) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$username, $email, $hash, $name, $role]);
        $userId = $db->lastInsertId();

        $token = JwtHelper::generate([
            'sub'    => $userId,
            'role'   => $role,
            'name'   => $name,
            'email'  => $email,
            'ref_id' => null,
        ]);

        jsonResponse(['token' => $token, 'user' => ['id' => $userId, 'name' => $name, 'email' => $email, 'role' => $role, 'refId' => null]], 201);
    }

    public function googleAuth(array $params): void {
        rateLimit('google_auth', 10, 60);

        $data       = getBody();
        $credential = $data['credential'] ?? '';
        if (!$credential) errorResponse('Google credential required');

        // Verify Google ID token via Google's tokeninfo endpoint
        $url      = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);
        $response = @file_get_contents($url);
        if (!$response) errorResponse('Could not verify Google token', 502);

        $payload = json_decode($response, true);
        if (!$payload || !empty($payload['error']) || empty($payload['email'])) {
            errorResponse('Invalid Google token', 401);
        }

        // Verify audience matches our client ID
        $clientId = $_ENV['VITE_GOOGLE_CLIENT_ID'] ?? getenv('VITE_GOOGLE_CLIENT_ID') ?? '';
        if ($clientId && ($payload['aud'] ?? '') !== $clientId) {
            errorResponse('Google token audience mismatch', 401);
        }

        $email = $payload['email'];
        $name  = $payload['name'] ?? $email;

        $db   = getDB();
        $stmt = $db->prepare('SELECT * FROM admin_login WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            $username = preg_replace('/[^a-z0-9_]/', '', strtolower(explode('@', $email)[0]));
            if (empty($username)) $username = 'user' . time();
            $base = $username; $i = 1;
            while (true) {
                $chk = $db->prepare('SELECT id FROM admin_login WHERE username = ?');
                $chk->execute([$username]);
                if (!$chk->fetch()) break;
                $username = $base . $i++;
            }
            $hash     = password_hash(bin2hex(random_bytes(32)), PASSWORD_BCRYPT);
            // Google users default to 'student' — admin must manually elevate
            $stmt = $db->prepare('INSERT INTO admin_login (username, email, password, name, role) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$username, $email, $hash, $name, 'student']);
            $userId = $db->lastInsertId();
            $role   = 'student';
        } else {
            $userId = $user['id'];
            $name   = $user['name'];
            $role   = $user['role'];
        }

        $jwtToken = JwtHelper::generate([
            'sub'    => $userId,
            'role'   => $role,
            'name'   => $name,
            'email'  => $email,
            'ref_id' => $user['ref_id'] ?? null,
        ]);

        jsonResponse(['token' => $jwtToken, 'user' => ['id' => $userId, 'name' => $name, 'email' => $email, 'role' => $role]]);
    }

    public function logout(array $params): void {
        jsonResponse(['message' => 'Logged out successfully']);
    }

    public function me(array $params): void {
        $user = $_REQUEST['_user'] ?? null;
        if (!$user) errorResponse('Unauthorized', 401);
        jsonResponse($user);
    }
}
