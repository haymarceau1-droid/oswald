(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce) return;

  var raf = window.requestAnimationFrame.bind(window);

  /* ---------- Barre de progression du scroll ---------- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  var hero = document.querySelector(".hero");
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

  /* ---------- Hero : aurora ---------- */
  if (hero) {
    var aurora = document.createElement("div");
    aurora.className = "hero__aurora";
    aurora.setAttribute("aria-hidden", "true");
    aurora.innerHTML =
      '<span class="hero__orb hero__orb--1"></span>' +
      '<span class="hero__orb hero__orb--2"></span>' +
      '<span class="hero__orb hero__orb--3"></span>';
    hero.insertBefore(aurora, hero.firstChild);
  }

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

  /* ---------- Observateur dédié (titres, cartes tarifs) ---------- */
  var pricingCards = document.querySelectorAll(".pricing__card");
  pricingCards.forEach(function (card, i) {
    card.classList.add("reveal");
    card.style.transitionDelay = Math.min(i * 90, 270) + "ms";
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      io.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".reveal--split, .pricing__card").forEach(function (el) {
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
  document.querySelectorAll(".value__card, .service-card, .pricing__card").forEach(function (card) {
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

  /* ---------- Boutons magnétiques ---------- */
  document.querySelectorAll(".btn--primary").forEach(function (btn) {
    var STRENGTH = 0.28;

    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      btn.classList.add("is-magnetic");
      btn.style.setProperty("--tx", (dx * STRENGTH).toFixed(1) + "px");
      btn.style.setProperty("--ty", (dy * STRENGTH).toFixed(1) + "px");
    });

    btn.addEventListener("pointerleave", function () {
      btn.classList.remove("is-magnetic");
      btn.style.removeProperty("--tx");
      btn.style.removeProperty("--ty");
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
