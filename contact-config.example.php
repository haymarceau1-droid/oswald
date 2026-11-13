<?php
/* Copiez ce fichier en « contact-config.php » (sur l'hébergement uniquement : il n'est pas versionné)
   puis adaptez les valeurs. Toutes les clés sont facultatives. */
return [
    /* où recevoir les demandes (par défaut : contact@oswaldsolutions.fr) */
    'to' => 'contact@oswaldsolutions.fr',

    /* expéditeur : doit être une boîte du domaine oswaldsolutions.fr créée chez Hostinger */
    'from' => 'contact@oswaldsolutions.fr',
    'from_name' => 'Oswald Solutions',

    /* facultatif : clé API Resend (resend.com), pour un envoi plus fiable que mail() */
    'resend_key' => '',
];
