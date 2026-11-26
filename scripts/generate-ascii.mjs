/* Convertit le dessin du château (assets/svg/chateau-angers.svg) en grille ASCII.
   Usage : node scripts/generate-ascii.mjs   (nécessite Playwright et Chromium)
   Sortie : assets/data/chateau-ascii.js, lu par assets/js/chateau-ascii.js (animation du hero). */
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "assets/svg/chateau-angers.svg"), "utf8");

const COLS = 200;           /* largeur de la grille en caractères */
const ROWS = 60;            /* hauteur de la grille (une cellule est ~1,9 fois plus haute que large) */
const RAMP = " .:-=+*#%@";  /* du plus clair au plus dense */
const W = 1672, H = 941;

const browser = await chromium.launch();
const page = await browser.newPage();
const dataUri = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");

const cells = await page.evaluate(async ({ dataUri, COLS, ROWS, W, H }) => {
  const img = new Image();
  img.src = dataUri;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;
  const cw = W / COLS, ch = H / ROWS;
  const out = [];
  for (let r = 0; r < ROWS; r++) {
    for (let col = 0; col < COLS; col++) {
      const x0 = Math.floor(col * cw), x1 = Math.floor((col + 1) * cw);
      const y0 = Math.floor(r * ch), y1 = Math.floor((r + 1) * ch);
      let sum = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { sum += data[(y * W + x) * 4 + 3]; n++; }
      out.push(sum / n / 255);
    }
  }
  return out;
}, { dataUri, COLS, ROWS, W, H });
await browser.close();

/* normalisation : le 85e centile devient la densité maximale (le dessin est fait de traits fins,
   donc peu denses : on renforce le contraste pour que les contours ressortent) */
const sorted = cells.filter((v) => v > 0.01).sort((a, b) => a - b);
const ref = sorted[Math.floor(sorted.length * 0.85)] || 1;
const lines = [];
for (let r = 0; r < ROWS; r++) {
  let line = "";
  for (let col = 0; col < COLS; col++) {
    const v = Math.min(1, cells[r * COLS + col] / ref);
    if (v < 0.05) { line += " "; continue; }
    if (v < 0.14) { line += "."; continue; }
    /* traits : de « - » (3) à « @ » (9) */
    line += RAMP[Math.min(RAMP.length - 1, 3 + Math.round(Math.pow(v, 0.55) * (RAMP.length - 4)))];
  }
  lines.push(line.replace(/\s+$/, ""));
}

const js = `/* Généré par scripts/generate-ascii.mjs : ne pas modifier à la main. */\nwindow.CHATEAU_ASCII = ${JSON.stringify({ cols: COLS, rows: ROWS, ramp: RAMP, lines })};\n`;
writeFileSync(join(root, "assets/data/chateau-ascii.js"), js);
console.log(`chateau-ascii.js : ${COLS} x ${ROWS}, ${(js.length / 1024).toFixed(1)} Ko`);
console.log(lines.join("\n"));
