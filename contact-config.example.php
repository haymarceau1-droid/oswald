<?php
/* Copiez ce fichier en « contact-config.php » (sur l'hébergement uniquement : il n'est pas versionné)
   puis adaptez les valeurs. Toutes les clés sont facultatives. */
return [
    /* où recevoir les demandes (par défaut : haymarceau1@gmail.com) */
    'to' => 'haymarceau1@gmail.com',

    /* expéditeur : doit être une boîte du domaine oswaldsolutions.fr créée chez Hostinger */
    'from' => 'contact@oswaldsolutions.fr',
    'from_name' => 'Oswald Solutions',

    /* facultatif : clé API Resend (resend.com), pour un envoi plus fiable que mail() */
    'resend_key' => '',

    /* facultatif : phrase secrète (n'importe quelle longue suite de caractères) qui signe les jetons anti-spam.
       Sans elle, le secret est dérivé de la clé Resend. */
    'secret' => '',
];
