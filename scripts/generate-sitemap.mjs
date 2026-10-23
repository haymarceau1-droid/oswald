#!/usr/bin/env node
/* Régénère sitemap.xml à partir des pages du site et des articles publiés
   (assets/data/posts.js).  Usage :  node scripts/generate-sitemap.mjs
   À relancer après avoir publié ou modifié un article, puis commit + push. */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://oswaldsolutions.fr";

// pages à exclure du sitemap
const EXCLUDE = new Set(["404.html", "article.html"]);
const pages = readdirSync(root).filter((f) => f.endsWith(".html") && !EXCLUDE.has(f));

const lastmod = (file) => {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${file}"`, { cwd: root }).toString().trim();
    if (d) return d;
  } catch (_) {}
  return statSync(join(root, file)).mtime.toISOString().slice(0, 10);
};

const urls = pages.map((f) => ({
  loc: f === "index.html" ? `${BASE}/` : `${BASE}/${f}`,
  lastmod: lastmod(f),
  priority: f === "index.html" ? "1.0" : /legales|confidentialite/.test(f) ? "0.3" : f === "blog.html" ? "0.7" : "0.8",
}));

// articles de blog publiés
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(readFileSync(join(root, "assets/data/posts.js"), "utf8"), ctx);
(ctx.window.BLOG_POSTS || [])
  .filter((p) => p && p.status === "published" && p.slug)
  .forEach((p) =>
    urls.push({
      loc: `${BASE}/article.html?slug=${encodeURIComponent(p.slug)}`,
      lastmod: p.date || lastmod("assets/data/posts.js"),
      priority: "0.6",
    })
  );

urls.sort((a, b) => (a.loc === `${BASE}/` ? -1 : b.loc === `${BASE}/` ? 1 : a.loc.localeCompare(b.loc)));

const esc = (s) => s.replace(/&/g, "&amp;");
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n") +
  `\n</urlset>\n`;

writeFileSync(join(root, "sitemap.xml"), xml);
console.log(`sitemap.xml : ${urls.length} URL`);
