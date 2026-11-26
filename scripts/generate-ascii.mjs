/* Convertit des dessins SVG du site en grilles ASCII pour les animations du hero et des services.
   Usage : node scripts/generate-ascii.mjs   (nécessite Playwright et Chromium)
   Sorties : assets/data/chateau-ascii.js et assets/data/statue-ascii.js,
   lus par assets/js/chateau-ascii.js. */
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RAMP = " .:-=+*#%@";  /* du plus clair au plus dense */

/* mode « line » : dessin au trait (le contraste est renforcé) ; mode « fill » : silhouette pleine.
   Une cellule est ~1,9 fois plus haute que large : rows = cols * (H / W) / 1,9 */
const TARGETS = [
  { svg: "assets/svg/chateau-angers.svg", out: "assets/data/chateau-ascii.js", global: "CHATEAU_ASCII", W: 1672, H: 941, cols: 200, rows: 60, mode: "line" },
  { svg: "assets/svg/statue.svg", out: "assets/data/statue-ascii.js", global: "STATUE_ASCII", W: 1122, H: 1402, cols: 76, rows: 50, mode: "fill" },
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const t of TARGETS) {
  const svg = readFileSync(join(root, t.svg), "utf8");
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
  }, { dataUri, COLS: t.cols, ROWS: t.rows, W: t.W, H: t.H });

  /* mode « line » : le 85e centile devient la densité maximale (traits fins, donc peu denses) */
  const sorted = cells.filter((v) => v > 0.01).sort((a, b) => a - b);
  const ref = t.mode === "line" ? sorted[Math.floor(sorted.length * 0.85)] || 1 : 1;

  const lines = [];
  for (let r = 0; r < t.rows; r++) {
    let line = "";
    for (let col = 0; col < t.cols; col++) {
      const v = Math.min(1, cells[r * t.cols + col] / ref);
      if (v < 0.05) { line += " "; continue; }
      if (t.mode === "line") {
        if (v < 0.14) { line += "."; continue; }
        line += RAMP[Math.min(RAMP.length - 1, 3 + Math.round(Math.pow(v, 0.55) * (RAMP.length - 4)))];
      } else {
        line += RAMP[Math.max(1, Math.min(RAMP.length - 1, Math.round(Math.pow(v, 0.85) * (RAMP.length - 1))))];
      }
    }
    lines.push(line.replace(/\s+$/, ""));
  }

  const js = `/* Généré par scripts/generate-ascii.mjs : ne pas modifier à la main. */\nwindow.${t.global} = ${JSON.stringify({ cols: t.cols, rows: t.rows, ramp: RAMP, lines })};\n`;
  writeFileSync(join(root, t.out), js);
  console.log(`${t.out} : ${t.cols} x ${t.rows}, ${(js.length / 1024).toFixed(1)} Ko`);
  if (t.mode === "fill") console.log(lines.join("\n"));
}

await browser.close();
