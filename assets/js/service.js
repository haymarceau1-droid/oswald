(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sommaire collant : section active ---------- */
  var nav = document.querySelector(".fx-nav");
  if (nav) {
    var links = Array.prototype.slice.call(nav.querySelectorAll("li a[href^='#']"));
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var el = document.getElementById(id);
      if (el) map[id] = { link: a, el: el };
    });
    var ids = Object.keys(map);

    var setActive = function (id) {
      ids.forEach(function (k) {
        var on = k === id;
        map[k].link.classList.toggle("is-active", on);
        if (on) map[k].link.setAttribute("aria-current", "true");
        else map[k].link.removeAttribute("aria-current");
      });
    };

    var onScroll = function () {
      var line = window.innerHeight * 0.35;
      var current = null;
      ids.forEach(function (id) {
        if (map[id].el.getBoundingClientRect().top <= line) current = id;
      });
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Texte qui s'allume mot à mot ---------- */
  var outro = document.querySelector("[data-words]");
  if (outro) {
    var words = outro.textContent.trim().split(/\s+/);
    outro.setAttribute("aria-label", words.join(" "));
    outro.textContent = "";
    var spans = words.map(function (w, i) {
      var s = document.createElement("span");
      s.className = "w";
      s.setAttribute("aria-hidden", "true");
      s.textContent = w;
      outro.appendChild(s);
      if (i < words.length - 1) outro.appendChild(document.createTextNode(" "));
      return s;
    });

    if (!reduce) {
      var update = function () {
        var r = outro.getBoundingClientRect();
        var vh = window.innerHeight;
        // 0 quand le bloc entre par le bas, 1 quand il atteint le milieu de l'écran
        var p = (vh * 0.9 - r.top) / (vh * 0.9 - vh * 0.35 + r.height * 0.4);
        p = Math.max(0, Math.min(1, p));
        var n = Math.round(p * spans.length);
        spans.forEach(function (s, i) { s.classList.toggle("is-on", i < n); });
      };
      var ticking = false;
      window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; update(); });
      }, { passive: true });
      window.addEventListener("resize", update);
      update();
    } else {
      spans.forEach(function (s) { s.classList.add("is-on"); });
    }
  }
})();
