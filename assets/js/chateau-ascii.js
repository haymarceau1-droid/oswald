/* Château d'Angers en ASCII animé (hero de l'accueil).
   La grille vient de assets/data/chateau-ascii.js (générée par scripts/generate-ascii.mjs).
   Animation : les caractères « se décodent » du bas vers le haut, puis un reflet traverse
   le dessin et quelques caractères scintillent. Pause hors écran ; image fixe si
   l'utilisateur a demandé moins d'animations. */
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

  /* cellules non vides */
  var cells = [];
  for (var r = 0; r < ROWS; r++) {
    var line = LINES[r] || "";
    for (var c = 0; c < line.length; c++) {
      var idx = RAMP.indexOf(line.charAt(c));
      if (idx > 0) {
        cells.push({
          c: c, r: r, idx: idx, ch: RAMP.charAt(idx),
          base: 0.62 + 0.38 * (idx / LAST),  /* opacité de repos */
          t0: (1 - r / ROWS) * 1500 + (c / COLS) * 350 + Math.random() * 450,
          alpha: -1, flick: 0
        });
      }
    }
  }

  var cw = 0, chh = 0, fontPx = 12, dpr = 1;

  var measure = function () {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || 1200;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * ASPECT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cw = w / COLS;
    chh = (w * ASPECT) / ROWS;
    ctx.font = "100px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    var m = ctx.measureText("M").width || 60;
    fontPx = Math.max(3, (100 * cw) / m);
    ctx.font = fontPx + "px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textBaseline = "middle";
  };

  var drawCell = function (cell, glyph, alpha) {
    var x = cell.c * cw, y = cell.r * chh;
    ctx.clearRect(x - 0.5, y - 0.5, cw + 1, chh + 1);
    if (alpha <= 0) return;
    ctx.fillStyle = "rgba(248,245,116," + alpha.toFixed(2) + ")";
    ctx.fillText(glyph, x, y + chh / 2);
  };

  var drawAll = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cells.forEach(function (cell) { cell.alpha = cell.base; drawCell(cell, cell.ch, cell.base); });
  };

  var resizeTimer = 0;
  var onResize = function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { measure(); if (done || reduce) drawAll(); }, 150);
  };

  measure();
  window.addEventListener("resize", onResize);

  if (reduce) { drawAll(); return; }

  /* ---------- animation ---------- */
  var start = 0, done = false, running = false, visible = true, lastFrame = 0, rafId = 0;
  var BUILD = 2600;      /* durée totale de l'apparition (ms) */
  var SCRAMBLE = 320;    /* durée du « décodage » d'une cellule (ms) */
  var SWEEP = 11000;     /* durée d'un passage de reflet (ms) */

  var frame = function (now) {
    rafId = 0;
    if (!running) return;
    if (now - lastFrame < 33) { rafId = requestAnimationFrame(frame); return; } /* ~30 images/s */
    lastFrame = now;
    var t = now - start;

    if (!done) {
      var pending = 0;
      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        var dt = t - cell.t0;
        if (dt < 0) { pending++; continue; }
        if (dt < SCRAMBLE) {
          pending++;
          var g = RAMP.charAt(1 + Math.floor(Math.random() * LAST));
          drawCell(cell, g, 0.25 + 0.55 * (dt / SCRAMBLE));
          cell.alpha = -2;
        } else if (cell.alpha !== cell.base) {
          drawCell(cell, cell.ch, cell.base);
          cell.alpha = cell.base;
        }
      }
      if (!pending && t > BUILD) { done = true; }
    } else {
      /* reflet diagonal qui traverse le dessin */
      var p = ((t % SWEEP) / SWEEP) * (COLS + ROWS * 1.2 + 60) - 30;
      for (var j = 0; j < cells.length; j++) {
        var k = cells[j];
        var d = Math.abs(k.c + (ROWS - k.r) * 0.9 - p);
        var boost = d < 16 ? 1 - d / 16 : 0;
        var a = Math.min(1, k.base + boost * 0.7);
        a = Math.round(a * 12) / 12;
        if (k.flick > now) continue;
        if (k.alpha !== a) { k.alpha = a; drawCell(k, k.ch, a); }
      }
      /* scintillement : quelques caractères changent brièvement de densité */
      for (var n = 0; n < 4; n++) {
        var f = cells[Math.floor(Math.random() * cells.length)];
        if (f.flick > now) continue;
        var gi = Math.max(1, Math.min(LAST, f.idx + (Math.random() < 0.5 ? -2 : 2)));
        f.flick = now + 160;
        drawCell(f, RAMP.charAt(gi), Math.min(1, f.base + 0.25));
        (function (cc) {
          setTimeout(function () { if (running || done) { cc.flick = 0; cc.alpha = -1; } }, 170);
        })(f);
      }
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
