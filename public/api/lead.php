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

// Mapas id -> nombre legible, leídos de los MISMOS JSON que pintan el funnel
// (public/data/*.json en el repo, desplegados como www/data/*.json). Única
// fuente de verdad: lo que se añada desde /admin queda aceptado aquí sin
// tocar código. Fallo cerrado: si el archivo falta o está corrupto, no se
// aceptan leads (mejor un error visible que aceptar ids sin validar).
function ts_cargar_mapa(string $archivo, string $claveRaiz): ?array {
    $raw = @file_get_contents(__DIR__ . '/../data/' . $archivo);
    if ($raw === false) return null;
    $json = json_decode($raw, true);
    if (!is_array($json) || !isset($json[$claveRaiz]) || !is_array($json[$claveRaiz])) return null;
    $mapa = [];
    foreach ($json[$claveRaiz] as $item) {
        if (!is_array($item) || !is_string($item['id'] ?? null) || !is_string($item['name'] ?? null)) return null;
        $mapa[$item['id']] = $item['name'];
    }
    return $mapa !== [] ? $mapa : null;
}

$COMPANIAS = ts_cargar_mapa('providers.json', 'providers');
$SERVICIOS = ts_cargar_mapa('services.json', 'services');
if ($COMPANIAS === null || $SERVICIOS === null) {
    http_response_code(500); echo json_encode(['ok'=>false,'error'=>'config']); exit;
}


// --- Validación en servidor ---
$pago    = filter_var($in['pago_actual'] ?? null, FILTER_VALIDATE_FLOAT);
$compId  = trim((string)($in['compania_actual'] ?? ''));
$servId  = trim((string)($in['servicio_actual'] ?? ''));
$elegido = trim((string)($in['servicio_elegido'] ?? ''));
$canal   = trim((string)($in['canal_contacto'] ?? ''));
$telRaw  = preg_replace('/\s+/', '', (string)($in['telefono'] ?? ''));
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
if ($elegido !== '' && mb_strlen($elegido) > 255) {
    http_response_code(422); echo json_encode(['ok'=>false,'error'=>'elegido']); exit;
}
if (!in_array($canal, ['llamada', 'whatsapp'], true)) {
    http_response_code(422); echo json_encode(['ok'=>false,'error'=>'canal']); exit;
}
// Sin teléfono no se crea el lead. La única excepción es el canal WhatsApp:
// ahí es el usuario quien nos escribe, y esa elección queda en canal_contacto.
if ($canal === 'llamada' && !preg_match('/^[6789]\d{8}$/', $telRaw)) {
    http_response_code(422); echo json_encode(['ok'=>false,'error'=>'telefono']); exit;
}
if ($canal === 'whatsapp') { $telRaw = ''; }

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
       (pago_actual, compania_actual, servicio_actual, servicio_elegido, canal_contacto,
        telefono, consentimiento, ip_origen, user_agent, origen)
     VALUES (:pago, :comp, :serv, :eleg, :canal, :tel, :cons, :ip, :ua, :org)"
);
$stmt->execute([
    ':pago'  => $pago,
    ':comp'  => $COMPANIAS[$compId],
    ':serv'  => $SERVICIOS[$servId],
    ':eleg'  => $elegido !== '' ? $elegido : null,
    ':canal' => $canal,
    ':tel'   => $telRaw !== '' ? $telRaw : null,
    ':cons'  => $consent,
    ':ip'    => $_SERVER['REMOTE_ADDR'] ?? null,
    ':ua'    => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
    ':org'   => substr($_SERVER['HTTP_REFERER'] ?? '', 0, 255),
]);

echo json_encode(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);