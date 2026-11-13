<?php
/* Formulaire de contact : reçoit les demandes en JSON et les envoie par e-mail.
   Hébergement Hostinger (PHP). Réglages facultatifs dans contact-config.php
   (voir contact-config.example.php). Sans ce fichier, les demandes sont envoyées
   à haymarceau1@gmail.com avec la fonction mail() de PHP.

   Protection anti-spam (sans service tiers ni captcha) :
   1. jeton signé délivré à l'ouverture de la page : un robot qui poste directement est refusé ;
   2. délai minimal de remplissage (4 s) et durée de vie limitée du jeton (2 h) ;
   3. champ piège (honeypot) invisible ;
   4. filtrage du contenu (liens en nombre, alphabets inhabituels, noms suspects) ;
   5. détection des doublons ;
   6. limites : 1 envoi / 20 s par adresse IP, 40 par heure au total ;
   7. même origine uniquement, JSON uniquement, taille limitée. */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reponse($code, $ok, $erreur = null) {
    http_response_code($code);
    echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $erreur]);
    exit;
}

/* faux succès : les robots ne savent pas qu'ils ont été repérés */
function ignorer($raison) {
    error_log('contact.php : demande ignorée (' . $raison . ')');
    reponse(200, true);
}

/* même site uniquement */
$hote = $_SERVER['HTTP_HOST'] ?? '';
$origine = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($origine !== '') {
    $hoteOrigine = parse_url($origine, PHP_URL_HOST);
    $autorises = ['oswaldsolutions.fr', 'www.oswaldsolutions.fr', preg_replace('/:\d+$/', '', $hote)];
    if (!$hoteOrigine || !in_array(strtolower($hoteOrigine), array_map('strtolower', $autorises), true)) {
        reponse(403, false, 'forbidden');
    }
}

/* réglages */
$config = [
    'to'         => 'haymarceau1@gmail.com',
    'from'       => 'contact@oswaldsolutions.fr',
    'from_name'  => 'Oswald Solutions',
    'resend_key' => '',
    'secret'     => '',
];
$fichier = __DIR__ . '/contact-config.php';
if (is_file($fichier)) {
    $perso = include $fichier;
    if (is_array($perso)) $config = array_merge($config, $perso);
}
/* clé de signature des jetons : 'secret' si fourni, sinon dérivée de la clé Resend */
$cleSignature = $config['secret'] !== '' ? $config['secret'] : hash('sha256', 'oswald|' . $config['resend_key'] . '|' . __FILE__);
$signer = function ($t) use ($cleSignature) { return hash_hmac('sha256', (string) $t, $cleSignature); };

/* délivrance du jeton : GET contact.php?jeton=1 */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['jeton'])) {
    $t = time();
    http_response_code(200);
    echo json_encode(['ok' => true, 'jeton' => $t . '.' . $signer($t)]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    reponse(405, false, 'method_not_allowed');
}

if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
    reponse(415, false, 'unsupported');
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) {
    reponse(413, false, 'too_large');
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

/* 3. champ piège : les robots le remplissent */
if (nettoyer($body['website'] ?? '', 200) !== '') ignorer('honeypot');

/* 1 et 2. jeton signé, délai de remplissage et durée de vie */
$jeton = nettoyer($body['jeton'] ?? '', 120);
$partiesJeton = explode('.', $jeton);
if (count($partiesJeton) !== 2 || !ctype_digit($partiesJeton[0]) || !hash_equals($signer($partiesJeton[0]), $partiesJeton[1])) {
    reponse(403, false, 'token');
}
$age = time() - (int) $partiesJeton[0];
if ($age < 4) ignorer('trop rapide (' . $age . ' s)');
if ($age > 7200) reponse(403, false, 'token_expired');

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

/* 4. filtrage du contenu */
$tout = $nom . ' ' . $entreprise . ' ' . $message;
if (preg_match('~(https?://|www\.)~i', $nom . ' ' . $entreprise)) ignorer('lien dans le nom');
if (preg_match_all('~(https?://|www\.)~i', $message) > 3) ignorer('trop de liens');
if (preg_match('~\[url[=\]]|<a\s|<script|\[link=~i', $tout)) ignorer('balises');
$lettres = preg_match_all('/\p{L}/u', $message);
if ($lettres > 20) {
    $hors = preg_match_all('/[\p{Cyrillic}\p{Han}\p{Arabic}\p{Hangul}\p{Thai}]/u', $message);
    if ($hors / $lettres > 0.3) ignorer('alphabet inhabituel');
}
if (mb_strlen($message, 'UTF-8') < 10) reponse(400, false, 'invalid');

/* 5. doublons : même message et même adresse dans l'heure */
$empreinte = sys_get_temp_dir() . '/oswald-contact-dup-' . md5(strtolower($email) . '|' . $message);
if (is_file($empreinte) && time() - filemtime($empreinte) < 3600) ignorer('doublon');

/* 6. limites : par adresse IP, puis globale */
$verrou = sys_get_temp_dir() . '/oswald-contact-' . md5($_SERVER['REMOTE_ADDR'] ?? '');
if (is_file($verrou) && time() - filemtime($verrou) < 20) reponse(429, false, 'too_many');
@touch($verrou);

$compteur = sys_get_temp_dir() . '/oswald-contact-total-' . date('YmdH');
$total = (int) @file_get_contents($compteur);
if ($total >= 40) reponse(429, false, 'too_many');
@file_put_contents($compteur, (string) ($total + 1), LOCK_EX);

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
    @touch($empreinte);
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
@touch($empreinte);
reponse(200, true);
