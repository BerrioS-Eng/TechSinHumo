<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['ok' => false, 'error' => 'method']); exit;
}
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'json']); exit; }

// Honeypot anti-bot
if (!empty($in['website'] ?? '')) { echo json_encode(['ok' => true]); exit; }

// Mapas id -> valor legible (coinciden con provider.ts y services.ts)
$COMPANIAS = [
  'movistar'=>'Movistar','vodafone'=>'Vodafone','orange'=>'Orange','masmovil'=>'MásMóvil',
  'digi'=>'Digi','o2'=>'O2','yoigo'=>'Yoigo','pepephone'=>'Pepephone','lowi'=>'Lowi',
  'simyo'=>'Simyo','finetwork'=>'Finetwork','otra'=>'Otra…',
];
$SERVICIOS = [
  'movil'=>'Movil','fibra-movil'=>'Fibra y Movil','fibra-movil-tv'=>'Fibra, Movil y TV',
];

// --- Validación en servidor ---
$pago    = filter_var($in['pago_actual'] ?? null, FILTER_VALIDATE_FLOAT);
$compId  = trim((string)($in['compania_actual'] ?? ''));
$servId  = trim((string)($in['servicio_actual'] ?? ''));
$telRaw  = preg_replace('/\s+/', '', (string)($in['telefono'] ?? ''));
$dejoTel = $telRaw !== '';
$consent = !empty($in['consentimiento']) ? 1 : 0;

if ($pago === false || $pago < 1 || $pago > 500) {
    http_response_code(422); echo json_encode(['ok'=>false,'error'=>'pago']); exit;
}
if (!isset($COMPANIAS[$compId])) {
    http_response_code(422); echo json_encode(['ok'=>false,'error'=>'compania']); exit;
}
if (!isset($SERVICIOS[$servId])) {
    http_response_code(422); echo json_encode(['ok'=>false,'error'=>'servicio']); exit;
}
if ($dejoTel && !preg_match('/^[6789]\d{8}$/', $telRaw)) {
    http_response_code(422); echo json_encode(['ok'=>false,'error'=>'telefono']); exit;
}

// --- Conexión (credenciales fuera de git) ---
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

$stmt = $pdo->prepare(
    "INSERT INTO leads
       (pago_actual, compania_actual, servicio_actual, telefono, consentimiento, ip_origen, user_agent, origen)
     VALUES (:pago, :comp, :serv, :tel, :cons, :ip, :ua, :org)"
);
$stmt->execute([
    ':pago' => $pago,
    ':comp' => $COMPANIAS[$compId],
    ':serv' => $SERVICIOS[$servId],
    ':tel'  => $dejoTel ? $telRaw : null,
    ':cons' => $consent,
    ':ip'   => $_SERVER['REMOTE_ADDR'] ?? null,
    ':ua'   => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
    ':org'  => substr($_SERVER['HTTP_REFERER'] ?? '', 0, 255),
]);

echo json_encode(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);