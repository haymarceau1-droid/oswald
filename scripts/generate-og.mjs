/* Génère les images Open Graph (1200 × 630) de chaque page.
   Usage : node scripts/generate-og.mjs   (nécessite Playwright et Chromium)
   Les images sont écrites dans assets/og/. Les polices et le logo viennent de assets/. */
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const url = (p) => pathToFileURL(join(root, p)).href;

/* Une image par page : [fichier, étiquette, titre, prix (facultatif)] */
const PAGES = [
  ["og-image", "Studio web · Angers", "Des sites clairs, modernes et bien suivis.", ""],
  ["og-landing-page", "Landing page", "Une page qui donne envie d'agir.", "Dès 1 490 € TTC"],
  ["og-site-vitrine", "Site vitrine", "Votre activité, bien présentée.", "Dès 2 490 € TTC"],
  ["og-site-e-commerce", "Site e-commerce", "Vendez en ligne, simplement.", "Sur devis"],
  ["og-refonte-site", "Refonte de site", "Un site qui vous ressemble enfin.", "Sur devis"],
  ["og-care-plan", "Care Plan", "Votre site suivi, mois après mois.", "Dès 79 € TTC / mois"],
  ["og-maintenance", "Maintenance et hébergement", "Un site à jour, sans y penser.", "Dès 79 € TTC / mois"],
  ["og-realisations", "Réalisations", "Des projets concrets, des sites qui servent.", ""],
  ["og-legal", "Informations légales", "Transparence et données personnelles.", ""],
];

/* motif de la charte : défenses en quinconce */
const TUSK = "M32 108A27 27 0 0 1 12 66A62 62 0 0 0 32 108Z";
const n = (x, y) => `<path transform="translate(${x} ${y}) scale(.9) translate(-12 -66)" d="${TUSK}"/>`;
const m = (x, y) => `<path transform="translate(${x + 18} ${y}) scale(-.9 .9) translate(-12 -66)" d="${TUSK}"/>`;
const tile = [n(20, 14), m(58, 28), n(100, 14), m(138, 28), n(60, 84), m(98, 98), n(140, 84), m(18, 98)].join("");
const patternSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="140" viewBox="0 0 160 140"><g fill="#7D9B8F" fill-opacity=".16">${tile}</g></svg>`;
const patternUri = "data:image/svg+xml;base64," + Buffer.from(patternSvg).toString("base64");

const icon = readFileSync(join(root, "assets/brand/icone-fond-sombre.svg"), "utf8");
const iconUri = "data:image/svg+xml;base64," + Buffer.from(icon).toString("base64");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const html = ([, label, title, price]) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Geist;src:url(${url("assets/fonts/geist-variable.woff2")});font-weight:100 900}
@font-face{font-family:Clash;src:url(${url("assets/fonts/clash-grotesk-600.woff2")});font-weight:600}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#002624;position:relative;overflow:hidden;font-family:Geist,sans-serif;color:#F0F2ED}
.pattern{position:absolute;inset:0;background:url(${patternUri}) 0 0/200px 175px;
  -webkit-mask-image:linear-gradient(100deg,transparent 30%,#000 85%)}
.glow{position:absolute;inset:0;background:radial-gradient(60% 80% at 100% 0%,rgba(248,245,116,.14),transparent 65%)}
.mark{position:absolute;right:-70px;bottom:-110px;width:560px;opacity:.1}
.logo{position:absolute;left:84px;top:72px;height:84px;display:block}
.label{position:absolute;left:84px;top:236px;font-size:24px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#F8F574}
.title{position:absolute;left:84px;top:288px;width:760px;font-size:68px;font-weight:600;line-height:1.06;letter-spacing:-.045em}
.price{position:absolute;left:84px;bottom:72px;padding:14px 30px;border:2px solid rgba(248,245,116,.55);border-radius:999px;
  font-family:Clash,sans-serif;font-weight:600;font-size:34px;letter-spacing:-.01em;color:#F8F574;word-spacing:.12em}
.site{position:absolute;right:84px;bottom:80px;font-size:24px;letter-spacing:.02em;color:rgba(240,242,237,.7)}
</style></head><body>
<div class="pattern"></div><div class="glow"></div>
<img class="mark" src="${iconUri}">
<img class="logo" src="${url("assets/brand/logo-horizontal-fond-sombre.svg")}">
<p class="label">${esc(label)}</p>
<h1 class="title">${esc(title)}</h1>
${price ? `<p class="price">${esc(price)}</p>` : ""}
<p class="site">oswaldsolutions.fr</p>
</body></html>`;

const dir = mkdtempSync(join(tmpdir(), "og-"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

for (const entry of PAGES) {
  const file = join(dir, entry[0] + ".html");
  writeFileSync(file, html(entry));
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(root, "assets/og", entry[0] + ".png") });
  console.log("✓", entry[0] + ".png");
}

await browser.close();
