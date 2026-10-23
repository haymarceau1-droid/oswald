# oswald

## Référencement (SEO)

- Chaque page a son titre, sa description, son adresse canonique, ses balises Open Graph / Twitter et ses données structurées (JSON-LD) dans le `<head>`.
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, favicons (`favicon.ico`, `assets/icons/`) et image de partage (`assets/og/og-image.png`) sont à la racine / dans `assets/`.
- Page 404 personnalisée : `404.html` (non indexée). En-têtes de sécurité et cache : `vercel.json`.
- **Après avoir publié ou modifié un article** (`assets/data/posts.js`), régénérer le plan du site :
  `node scripts/generate-sitemap.mjs`, puis commit + push.
- Les pages d'article mettent à jour leur titre, leur description, leur URL canonique et leurs données structurées (BlogPosting) à partir de `posts.js`.
