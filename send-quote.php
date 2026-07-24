<?php
// Receives the contact/quote form (via fetch, JSON body) and relays it to
// Resend's HTTP API. Works on plain PHP/Apache hosting (e.g. SiteGround
// shared hosting) since it only needs cURL, not a Node runtime.

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'not_configured']);
    exit;
}
require $configPath;

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_payload']);
    exit;
}

// Honeypot: a hidden field real visitors never see or fill. Bots that
// autofill every field will trip it — pretend success and drop the message.
if (!empty($input['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

function oa_clean($value) {
    return is_string($value) ? trim(strip_tags($value)) : '';
}

$name = oa_clean($input['name'] ?? '');
$phone = oa_clean($input['phone'] ?? '');
$email = oa_clean($input['email'] ?? '');
$location = oa_clean($input['location'] ?? '');
$equipment = oa_clean($input['equipment'] ?? '');
$date = oa_clean($input['date'] ?? '');
$duration = oa_clean($input['duration'] ?? '');
$message = oa_clean($input['message'] ?? '');
$selectedItems = oa_clean($input['selected_items'] ?? '');
$lang = oa_clean($input['lang'] ?? 'en') === 'es' ? 'es' : 'en';

if ($name === '' || $phone === '' || $email === '' || $location === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'missing_fields']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'invalid_email']);
    exit;
}

$rows = [
    'Name' => $name,
    'Phone' => $phone,
    'Email' => $email,
    'Delivery city / ZIP' => $location,
    'Equipment' => $equipment,
    'Date needed' => $date,
    'Rental duration' => $duration,
    'Job details' => $message,
    'Selected items (quote list)' => $selectedItems,
    'Submitted from' => $lang === 'es' ? 'Spanish page' : 'English page',
];

$htmlBody = '<h2>New quote request &mdash; O&amp;A Restroom Portables</h2><table cellpadding="6" cellspacing="0">';
foreach ($rows as $label => $value) {
    if ($value === '') {
        continue;
    }
    $htmlBody .= '<tr><td style="font-weight:bold;vertical-align:top;padding-right:12px;">'
        . htmlspecialchars($label, ENT_QUOTES)
        . '</td><td>' . nl2br(htmlspecialchars($value, ENT_QUOTES)) . '</td></tr>';
}
$htmlBody .= '</table>';

$payload = [
    'from' => RESEND_FROM,
    'to' => [RESEND_TO],
    'reply_to' => $email,
    'subject' => 'New quote request from ' . $name,
    'html' => $htmlBody,
];

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . RESEND_API_KEY,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 15,
]);
$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError !== '' || $status < 200 || $status >= 300) {
    error_log('Resend send failed: ' . $curlError . ' | HTTP ' . $status . ' | ' . $response);
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'send_failed']);
    exit;
}

echo json_encode(['ok' => true]);
