# oswald

## Référencement (SEO)

- Chaque page a son titre, sa description, son adresse canonique, ses balises Open Graph / Twitter et ses données structurées (JSON-LD) dans le `<head>`.
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, favicons (`favicon.ico`, `assets/icons/`) et images de partage (`assets/og/`) sont à la racine / dans `assets/`.
- Images Open Graph (1200 × 630) : une par page, générées par `node scripts/generate-og.mjs` (titres et prix dans la liste `PAGES` du script). Penser à régénérer après avoir changé un tarif.
- Page 404 personnalisée : `404.html` (non indexée). Redirections, en-têtes de sécurité et cache : `.htaccess` (hébergement Hostinger).

## Formulaire de contact

Le formulaire envoie un vrai e-mail via `contact.php` (PHP, hébergement Hostinger). Par défaut, il utilise la fonction `mail()` de PHP : les demandes arrivent sur `haymarceau1@gmail.com`. L'expéditeur est `contact@oswaldsolutions.fr` (adresse du domaine : elle n'a pas besoin d'exister comme boîte pour envoyer).

Pour changer le destinataire ou l'expéditeur, ou utiliser [Resend](https://resend.com) à la place de `mail()`, copier `contact-config.example.php` en `contact-config.php` **sur l'hébergement** (ce fichier n'est pas versionné et reste inaccessible depuis le web grâce à `.htaccess`) et adapter les valeurs.

