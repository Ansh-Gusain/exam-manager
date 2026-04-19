<?php
function jsonResponse(mixed $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode(toCamel($data));
    exit();
}

function errorResponse(string $message, int $status = 400): void {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit();
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function getQuery(): array {
    return $_GET;
}

// Convert snake_case keys to camelCase recursively
function toCamel(mixed $data): mixed {
    if (is_array($data)) {
        // Check if it's a list (indexed) or map (associative)
        if (array_is_list($data)) {
            return array_map('toCamel', $data);
        }
        $result = [];
        foreach ($data as $key => $value) {
            $camel = lcfirst(str_replace('_', '', ucwords($key, '_')));
            $result[$camel] = toCamel($value);
        }
        return $result;
    }
    return $data;
}
