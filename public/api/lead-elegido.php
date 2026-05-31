<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['ok' => false, 'error' => 'method']); exit;
}
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'json']); exit; }

$id      = filter_var($in['id'] ?? null, FILTER_VALIDATE_INT);
$elegido = trim((string)($in['servicio_elegido'] ?? ''));

if ($id === false || $id < 1 || $elegido === '' || mb_strlen($elegido) > 255) {
    http_response_code(422); echo json_encode(['ok'=>false,'error'=>'datos']); exit;
}

$cfg = require __DIR__ . '/config.php';
try {
    $pdo = new PDO(
        "mysql:host={$cfg['host']};dbname={$cfg['db']};charset=utf8mb4",
        $cfg['user'], $cfg['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );
} catch (Throwable $e) {
    http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db']); exit;
}

// Solo rellena si está vacío (evita sobrescrituras/abuso)
$stmt = $pdo->prepare(
    "UPDATE leads SET servicio_elegido = :e WHERE id = :id AND servicio_elegido IS NULL"
);
$stmt->execute([':e' => $elegido, ':id' => $id]);

echo json_encode(['ok' => true]);