# oswald

## Référencement (SEO)

- Chaque page a son titre, sa description, son adresse canonique, ses balises Open Graph / Twitter et ses données structurées (JSON-LD) dans le `<head>`.
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, favicons (`favicon.ico`, `assets/icons/`) et image de partage (`assets/og/og-image.png`) sont à la racine / dans `assets/`.
- Page 404 personnalisée : `404.html` (non indexée). En-têtes de sécurité et cache : `vercel.json`.

## Formulaire de contact

Le formulaire envoie un vrai e-mail via la fonction `api/contact.js` (Vercel) et [Resend](https://resend.com). Variables à définir dans Vercel (Settings > Environment Variables), puis redéployer :

- `RESEND_API_KEY` : clé API Resend (obligatoire).
- `CONTACT_TO` : destinataire (défaut `contact@oswaldsolutions.fr`).
- `CONTACT_FROM` : expéditeur sur un domaine vérifié dans Resend, ex. `Oswald Solutions <contact@oswaldsolutions.fr>`. Sans domaine vérifié, Resend n'envoie qu'à l'e-mail du compte.
