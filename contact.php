<?php
/* Formulaire de contact : reçoit les demandes en JSON et les envoie par e-mail.
   Hébergement Hostinger (PHP). Réglages facultatifs dans contact-config.php
   (voir contact-config.example.php). Sans ce fichier, les demandes sont envoyées
   à contact@oswaldsolutions.fr avec la fonction mail() de PHP. */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reponse($code, $ok, $erreur = null) {
    http_response_code($code);
    echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $erreur]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    reponse(405, false, 'method_not_allowed');
}

/* réglages */
$config = [
    'to'         => 'contact@oswaldsolutions.fr',
    'from'       => 'contact@oswaldsolutions.fr',
    'from_name'  => 'Oswald Solutions',
    'resend_key' => '',
];
$fichier = __DIR__ . '/contact-config.php';
if (is_file($fichier)) {
    $perso = include $fichier;
    if (is_array($perso)) $config = array_merge($config, $perso);
}

/* lecture et nettoyage des champs */
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) $body = [];

function nettoyer($v, $max) {
    $v = is_scalar($v) ? (string) $v : '';
    $v = str_replace("\r", '', $v);
    return trim(mb_substr($v, 0, $max, 'UTF-8'));
}
function une_ligne($v, $max) {
    return preg_replace('/[\n\t]+/', ' ', nettoyer($v, $max));
}

/* champ piège : les robots le remplissent, on fait semblant d'avoir réussi */
if (nettoyer($body['website'] ?? '', 200) !== '') reponse(200, true);

$PROJETS = [
    'nouveau-site' => 'Nouveau site', 'refonte' => 'Refonte', 'landing-page' => 'Landing page',
    'e-commerce' => 'Site e-commerce', 'maintenance' => 'Maintenance', 'care-plan' => 'Care Plan',
    'autre' => 'Autre',
];
$BUDGETS = [
    'moins-1500' => 'Moins de 1 500 €', '1500-3000' => '1 500 € – 3 000 €',
    '3000-6000' => '3 000 € – 6 000 €', 'plus-6000' => 'Plus de 6 000 €',
];

$nom        = une_ligne($body['nom'] ?? '', 120);
$entreprise = une_ligne($body['entreprise'] ?? '', 120);
$email      = une_ligne($body['email'] ?? '', 200);
$projet     = $PROJETS[$body['projet'] ?? ''] ?? '';
$budget     = $BUDGETS[$body['budget'] ?? ''] ?? 'Non défini';
$message    = nettoyer($body['message'] ?? '', 5000);
$page       = une_ligne($body['page'] ?? '', 300);

if ($nom === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $projet === '' || $message === '') {
    reponse(400, false, 'invalid');
}

/* limite simple : une demande toutes les 20 secondes par adresse IP */
$verrou = sys_get_temp_dir() . '/oswald-contact-' . md5($_SERVER['REMOTE_ADDR'] ?? '');
if (is_file($verrou) && time() - filemtime($verrou) < 20) reponse(429, false, 'too_many');
@touch($verrou);

$sujet = 'Demande de devis — ' . $nom . ' (' . $projet . ')';
$texte = "Nom : $nom\nEntreprise : " . ($entreprise ?: '—') . "\nEmail : $email\n"
       . "Type de projet : $projet\nBudget indicatif : $budget\nPage : " . ($page ?: '—')
       . "\n\nMessage :\n$message\n";

/* envoi via Resend si une clé est fournie, sinon via mail() */
if ($config['resend_key'] !== '') {
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $config['resend_key'],
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'from'     => $config['from_name'] . ' <' . $config['from'] . '>',
            'to'       => [$config['to']],
            'reply_to' => $email,
            'subject'  => $sujet,
            'text'     => $texte,
        ]),
    ]);
    curl_exec($ch);
    $statut = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($statut < 200 || $statut >= 300) {
        error_log('contact.php : Resend a répondu ' . $statut);
        reponse(502, false, 'send_failed');
    }
    reponse(200, true);
}

$entetes = [
    'From: ' . mb_encode_mimeheader($config['from_name'], 'UTF-8') . ' <' . $config['from'] . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];
$ok = mail($config['to'], mb_encode_mimeheader($sujet, 'UTF-8'), $texte, implode("\r\n", $entetes), '-f' . $config['from']);
if (!$ok) {
    error_log('contact.php : mail() a échoué');
    reponse(502, false, 'send_failed');
}
reponse(200, true);
