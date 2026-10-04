(function () {
  "use strict";

  var nav = document.querySelector(".sv-subnav");
  if (!nav || !("IntersectionObserver" in window)) return;

  var links = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
  var map = {};
  links.forEach(function (a) {
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
    var active = map[id] && map[id].link;
    if (active && nav.scrollWidth > nav.clientWidth) {
      var list = active.parentNode.parentNode;
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
    requestAnimationFrame(function () {
      ticking = false;
      onScroll();
    });
  }, { passive: true });
  onScroll();
})();
