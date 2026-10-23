(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce) return;

  var raf = window.requestAnimationFrame.bind(window);

  /* ---------- Étoiles filantes du hero (accueil) ---------- */
  (function () {
    var hero = document.querySelector("body.home .hero");
    if (!hero) return;

    var box = document.createElement("div");
    box.className = "hero__stars";
    box.setAttribute("aria-hidden", "true");
    hero.insertBefore(box, hero.firstChild);

    var rand = function (min, max) { return min + Math.random() * (max - min); };

    /* Sens de chute alterné (une fois vers la gauche, une fois vers la droite) et
       point de départ pris dans la moitié opposée : l'écran est couvert de façon
       équilibrée, à gauche comme à droite. */
    var place = function (star) {
      var toLeft = star._toLeft = !star._toLeft;
      var angle = toLeft ? rand(142, 156) : rand(24, 38);
      var rad = (angle * Math.PI) / 180;
      var dist = rand(380, 520);
      var x = toLeft ? rand(36, 108) : rand(-8, 64);
      star.style.setProperty("--x", x.toFixed(1) + "%");
      star.style.setProperty("--y", rand(2, 48).toFixed(1) + "%");
      star.style.setProperty("--a", angle.toFixed(1) + "deg");
      star.style.setProperty("--dx", (Math.cos(rad) * dist).toFixed(0) + "px");
      star.style.setProperty("--dy", (Math.sin(rad) * dist).toFixed(0) + "px");
      star.style.setProperty("--o", rand(0.22, 0.38).toFixed(2));
    };

    /* 4 étoiles : durée du cycle (s) et délai de départ (s) */
    var cycles = [12, 14.3, 16.6, 23.4];
    var delays = [2.2, 6.8, 11.5, 9];
    cycles.forEach(function (dur, i) {
      var star = document.createElement("span");
      star.className = "hero__star";
      star.style.setProperty("--dur", dur.toFixed(1) + "s");
      star.style.animationDelay = delays[i] + "s";
      star._toLeft = i % 2 === 0; /* place() inverse : la 1re ira donc vers la droite */
      place(star);
      /* à chaque nouveau passage : autre endroit, autre angle */
      star.addEventListener("animationiteration", function () { place(star); });
      box.appendChild(star);
    });
  })();

  /* ---------- Barre de progression du scroll ---------- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  var heroVisual = document.querySelector(".hero__visual");
  var ticking = false;

  var updateScroll = function () {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var y = window.scrollY;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    if (heroVisual && y < window.innerHeight * 1.5) {
      heroVisual.style.transform = "translate3d(0," + (y * 0.14).toFixed(1) + "px,0)";
    }
  };

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      raf(updateScroll);
    }
  }, { passive: true });
  window.addEventListener("resize", updateScroll);
  updateScroll();

  /* ---------- Titres de section : mot par mot ---------- */
  document.querySelectorAll("h2.section__title").forEach(function (title) {
    if (title.querySelector("*")) return; // texte simple uniquement
    var words = title.textContent.trim().split(/\s+/);
    title.setAttribute("aria-label", words.join(" "));
    title.textContent = "";
    words.forEach(function (word, i) {
      var outer = document.createElement("span");
      outer.className = "sw";
      outer.setAttribute("aria-hidden", "true");
      var inner = document.createElement("span");
      inner.className = "sw__i";
      inner.style.setProperty("--i", i);
      inner.textContent = word;
      outer.appendChild(inner);
      title.appendChild(outer);
      if (i < words.length - 1) title.appendChild(document.createTextNode(" "));
    });
    title.classList.add("reveal", "reveal--split");
  });

  /* ---------- Observateur dédié (titres) ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      io.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".reveal--split").forEach(function (el) {
    io.observe(el);
  });

  /* ---------- Compteurs animés (prix) ---------- */
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 4); };

  var countUp = function (el) {
    var original = el.textContent;
    var match = original.match(/\d[\d\s  ]*/);
    if (!match) return;
    var raw = match[0];
    var target = parseInt(raw.replace(/\D/g, ""), 10);
    if (!target) return;
    var sep = /[\s  ]/.exec(raw);
    var sepChar = sep ? sep[0] : "";
    var fmt = function (n) {
      var s = String(n);
      return sepChar ? s.replace(/\B(?=(\d{3})+(?!\d))/g, sepChar) : s;
    };
    var trail = /[\s  ]$/.exec(raw);
    var tail = trail ? trail[0] : "";
    var prefix = original.slice(0, match.index);
    var suffix = original.slice(match.index + raw.length);
    var start = null;
    var DURATION = 1400;

    var step = function (now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / DURATION, 1);
      var value = Math.round(target * easeOut(t));
      el.textContent = prefix + fmt(value) + (tail && t < 1 ? tail : (tail || "")) + suffix;
      if (t < 1) {
        raf(step);
      } else {
        el.textContent = original;
      }
    };
    raf(step);
  };

  var amountIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      amountIo.unobserve(entry.target);
      countUp(entry.target);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll(".pricing__amount").forEach(function (el) {
    amountIo.observe(el);
  });

  if (!finePointer) return;

  /* ---------- Cartes : spotlight + tilt 3D ---------- */
  var MAX_TILT = 5;
  document.querySelectorAll(".value__card, .service-card").forEach(function (card) {
    var frame = null;

    card.addEventListener("pointerenter", function () {
      card.style.transitionDelay = "0s";
    });

    card.addEventListener("pointermove", function (e) {
      if (frame) return;
      var cx = e.clientX, cy = e.clientY;
      frame = raf(function () {
        frame = null;
        var r = card.getBoundingClientRect();
        var px = (cx - r.left) / r.width;
        var py = (cy - r.top) / r.height;
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        card.style.setProperty("--ry", ((px - 0.5) * 2 * MAX_TILT).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - py) * 2 * MAX_TILT).toFixed(2) + "deg");
        card.classList.add("is-tilting");
      });
    });

    card.addEventListener("pointerleave", function () {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      card.classList.remove("is-tilting");
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
    });
  });

  /* ---------- Ripple au clic ---------- */
  document.addEventListener("pointerdown", function (e) {
    var btn = e.target.closest(".btn");
    if (!btn) return;
    var r = btn.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2;
    var dot = document.createElement("span");
    dot.className = "ripple";
    dot.style.width = dot.style.height = size + "px";
    dot.style.left = e.clientX - r.left - size / 2 + "px";
    dot.style.top = e.clientY - r.top - size / 2 + "px";
    btn.appendChild(dot);
    setTimeout(function () { dot.remove(); }, 750);
  });
})();
