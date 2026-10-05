(function () {
  "use strict";

  /* Sommaire de la page : section active au scroll */
  var nav = document.querySelector(".sv-subnav");
  if (!nav) return;

  var map = {};
  Array.prototype.forEach.call(nav.querySelectorAll("a[href^='#']"), function (a) {
    var id = a.getAttribute("href").slice(1);
    var el = document.getElementById(id);
    if (el) map[id] = { link: a, el: el };
  });
  var ids = Object.keys(map);
  if (!ids.length) return;

  var setActive = function (id) {
    ids.forEach(function (k) {
      var on = k === id;
      map[k].link.classList.toggle("is-active", on);
      if (on) map[k].link.setAttribute("aria-current", "true");
      else map[k].link.removeAttribute("aria-current");
    });
    var active = id && map[id].link;
    var list = nav.querySelector("ul");
    if (active && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: active.offsetLeft - 24, behavior: "smooth" });
    }
  };

  var onScroll = function () {
    var line = window.innerHeight * 0.3;
    var current = null;
    ids.forEach(function (id) {
      if (map[id].el.getBoundingClientRect().top <= line) current = id;
    });
    setActive(current);
  };

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScroll(); });
  }, { passive: true });
  onScroll();
})();
