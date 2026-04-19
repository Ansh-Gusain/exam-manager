<?php
// Entry point - all requests routed through here
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/router.php';

$router = new Router();
$router->dispatch();
