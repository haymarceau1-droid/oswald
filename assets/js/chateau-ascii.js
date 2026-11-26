/* Château d'Angers en ASCII animé (hero de l'accueil).
   La grille vient de assets/data/chateau-ascii.js (générée par scripts/generate-ascii.mjs).

   Animation :
   1. Apparition : une vague diagonale (bas gauche vers haut droit) balaie le dessin. Son front est
      lumineux, sa traîne « décode » les caractères (symboles aléatoires qui se fixent un à un).
   2. Ensuite : le dessin respire doucement, un reflet le traverse, de petites rafales de données
      parcourent une bande de lignes, quelques caractères scintillent.
   3. Interaction (souris) : le curseur allume les caractères autour de lui et les fait « chanter ».
   Pause hors écran ou onglet masqué ; image fixe si l'utilisateur préfère moins d'animations. */
(function () {
  "use strict";

  var data = window.CHATEAU_ASCII;
  var canvas = document.querySelector("canvas.hero__chateau");
  if (!data || !canvas || !canvas.getContext) return;

  var COLS = data.cols, ROWS = data.rows, RAMP = data.ramp, LINES = data.lines;
  var LAST = RAMP.length - 1;
  var ASPECT = 941 / 1672;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");

  /* ---------- cellules non vides ---------- */
  var U_MAX = COLS * 0.55 + ROWS;   /* étendue de la diagonale de la vague */
  var cells = [];
  for (var r = 0; r < ROWS; r++) {
    var line = LINES[r] || "";
    for (var c = 0; c < line.length; c++) {
      var idx = RAMP.indexOf(line.charAt(c));
      if (idx > 0) {
        cells.push({
          c: c, r: r, idx: idx, ch: RAMP.charAt(idx),
          base: 0.62 + 0.38 * (idx / LAST),
          u: c * 0.55 + (ROWS - r),      /* position sur la diagonale */
          settled: false, flick: 0, fg: "",
          dA: -1, dG: "", dH: -1          /* dernier état dessiné */
        });
      }
    }
  }

  /* ---------- palettes (jaune du site, et blanc chaud pour les éclats) ---------- */
  var Q = 16;
  var YEL = [], HOT = [];
  for (var q = 0; q <= Q; q++) {
    YEL.push("rgba(248,245,116," + (q / Q).toFixed(3) + ")");
    HOT.push("rgba(255,254,226," + (q / Q).toFixed(3) + ")");
  }

  /* ---------- géométrie ---------- */
  var cw = 0, chh = 0, dpr = 1, W = 0;
  var FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  var measure = function () {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth || 1200;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(W * ASPECT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cw = W / COLS;
    chh = (W * ASPECT) / ROWS;
    ctx.font = "100px " + FONT;
    var m = ctx.measureText("M").width || 60;
    ctx.font = Math.max(3, (100 * cw) / m) + "px " + FONT;
    ctx.textBaseline = "middle";
    for (var i = 0; i < cells.length; i++) { cells[i].dA = -1; cells[i].settled = false; }
  };

  /* dessine une cellule seulement si son apparence a changé */
  var paint = function (cell, glyph, alpha, hot) {
    var a = Math.max(0, Math.min(Q, Math.round(alpha * Q)));
    var h = hot ? 1 : 0;
    if (cell.dA === a && cell.dG === glyph && cell.dH === h) return;
    cell.dA = a; cell.dG = glyph; cell.dH = h;
    var x = cell.c * cw, y = cell.r * chh;
    ctx.clearRect(x - 0.6, y - 0.4, cw + 1.2, chh + 0.8);
    if (a <= 0) return;
    ctx.fillStyle = (h ? HOT : YEL)[a];
    ctx.fillText(glyph, x, y + chh / 2);
  };

  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var randGlyph = function (min) { return RAMP.charAt(min + Math.floor(Math.random() * (LAST - min + 1))); };

  /* ---------- image fixe (moins d'animations) ---------- */
  var drawStatic = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < cells.length; i++) { paint(cells[i], cells[i].ch, cells[i].base, false); }
  };

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      measure();
      if (reduce) drawStatic();
    }, 150);
  });

  measure();
  if (reduce) { drawStatic(); return; }

  /* ---------- paramètres ---------- */
  var BUILD = 3400;      /* durée de la vague d'apparition (ms) */
  var HEAD = 9;          /* épaisseur du front lumineux (unités de diagonale) */
  var TRAIL = 46;        /* longueur de la traîne de décodage */
  var SWEEP = 12000;     /* période du reflet (ms) */
  var done = false, running = false, visible = true;
  var start = 0, lastFrame = 0, rafId = 0;

  /* rafale de données : quelques lignes consécutives s'embrasent brièvement */
  var burst = { r0: 0, r1: -1, until: 0, next: 0 };

  /* curseur */
  var pointer = { x: -9999, y: -9999, on: false };
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("pointermove", function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true;
    }, { passive: true });
    document.addEventListener("pointerleave", function () { pointer.on = false; });
  }

  var easeInOut = function (x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };

  var frame = function (now) {
    rafId = 0;
    if (!running) return;
    if (now - lastFrame < 33) { rafId = requestAnimationFrame(frame); return; } /* ~30 images/s */
    lastFrame = now;
    var t = now - start;
    var i, cell;

    /* ----- 1. vague d'apparition ----- */
    if (!done) {
      var head = easeInOut(Math.min(1, t / BUILD)) * (U_MAX + HEAD + TRAIL + 6) - 4;
      var remaining = 0;
      for (i = 0; i < cells.length; i++) {
        cell = cells[i];
        if (cell.settled) continue;
        var d = head - cell.u;
        if (d < 0) { remaining++; continue; }
        if (d < HEAD) {                       /* front : éclat blanc, symboles denses */
          remaining++;
          paint(cell, randGlyph(5), 1, true);
        } else if (d < HEAD + TRAIL) {        /* traîne : décodage progressif */
          remaining++;
          var k = (d - HEAD) / TRAIL;
          var g = Math.random() < k * 0.85 ? cell.ch : randGlyph(1);
          paint(cell, g, 0.95 - (0.95 - cell.base) * k, false);
        } else {                              /* fixé */
          cell.settled = true;
          paint(cell, cell.ch, cell.base, false);
        }
      }
      if (!remaining) done = true;
      rafId = requestAnimationFrame(frame);
      return;
    }

    /* ----- 2. vie du dessin ----- */
    var rect = null, px = 0, py = 0, R = 0, R2 = 0;
    if (pointer.on) {
      rect = canvas.getBoundingClientRect();
      px = pointer.x - rect.left; py = pointer.y - rect.top;
      R = cw * 15; R2 = R * R;
    }
    var sweepP = ((t % SWEEP) / SWEEP) * (U_MAX + 90) - 30;
    var breathT = t / 1900;

    /* rafale : toutes les 4 à 8 s, sur 2 à 4 lignes, pendant 220 ms */
    if (now > burst.next) {
      burst.r0 = Math.floor(rnd(ROWS * 0.25, ROWS * 0.9));
      burst.r1 = burst.r0 + Math.floor(rnd(1, 3));
      burst.until = now + 220;
      burst.next = now + rnd(4000, 8000);
    }
    var inBurst = now < burst.until;

    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      var alpha = cell.base + 0.1 * Math.sin(breathT + cell.c * 0.05 + cell.r * 0.09);
      var glyph = cell.ch, hot = false;

      /* reflet diagonal */
      var dd = Math.abs(cell.u - sweepP);
      if (dd < 15) {
        var b = 1 - dd / 15;
        alpha += b * 0.6;
        if (b > 0.7) hot = true;
      }

      /* rafale de données */
      if (inBurst && cell.r >= burst.r0 && cell.r <= burst.r1) {
        glyph = Math.random() < 0.45 ? randGlyph(2) : cell.ch;
        alpha = 1; hot = true;
      }

      /* scintillement ponctuel */
      if (cell.flick > now) {
        glyph = cell.fg; alpha += 0.25;
      }

      /* curseur : lumière et caractères qui « chantent » autour de la souris */
      if (rect) {
        var dx = (cell.c + 0.5) * cw - px, dy = (cell.r + 0.5) * chh - py;
        var d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          var kk = 1 - Math.sqrt(d2) / R;
          alpha += kk * 0.9;
          if (kk > 0.3) hot = true;
          if (kk > 0.5 && Math.random() < 0.7) glyph = randGlyph(Math.max(1, cell.idx - 2));
        }
      }

      paint(cell, glyph, Math.min(1, alpha), hot);
    }

    /* nouveaux scintillements */
    for (var n = 0; n < 5; n++) {
      var f = cells[Math.floor(Math.random() * cells.length)];
      if (f.flick > now) continue;
      f.flick = now + 180;
      f.fg = RAMP.charAt(Math.max(1, Math.min(LAST, f.idx + (Math.random() < 0.5 ? -2 : 2))));
    }

    rafId = requestAnimationFrame(frame);
  };

  var play = function () {
    if (running || !visible || document.hidden) return;
    running = true;
    if (!start) start = performance.now();
    lastFrame = 0;
    rafId = requestAnimationFrame(frame);
  };
  var pause = function () {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) play(); else pause();
    }, { threshold: 0 }).observe(canvas);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause(); else play();
  });

  play();
})();
