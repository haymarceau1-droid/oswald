(function () {
  "use strict";

  var section = document.getElementById("tarifs");
  var tablist = section && section.querySelector(".pricing__tabs");
  if (!section || !tablist) return;

  var tabs = Array.prototype.slice.call(tablist.querySelectorAll(".pricing__tab"));
  var indicator = tablist.querySelector(".pricing__tab-indicator");
  var panels = tabs.map(function (tab) {
    return document.getElementById(tab.getAttribute("aria-controls"));
  });

  section.classList.add("js-tabs");

  /* indices pour la cascade */
  panels.forEach(function (panel) {
    panel.querySelectorAll(".pricing__card").forEach(function (card, i) {
      card.style.setProperty("--i", i);
      card.querySelectorAll(".pricing__features li").forEach(function (li, j) {
        li.style.setProperty("--j", j);
      });
    });
  });

  var moveIndicator = function (tab) {
    indicator.style.setProperty("--x", tab.offsetLeft + "px");
    indicator.style.setProperty("--w", tab.offsetWidth + "px");
  };

  var inView = false;

  var play = function (panel) {
    panel.classList.remove("is-in");
    void panel.offsetWidth; // relance les animations
    panel.classList.add("is-in");
  };

  var select = function (tab, focus) {
    tabs.forEach(function (t, i) {
      var on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      panels[i].classList.toggle("is-active", on);
      if (!on) panels[i].classList.remove("is-in");
    });
    moveIndicator(tab);
    if (focus) tab.focus();
    var panel = panels[tabs.indexOf(tab)];
    if (inView) play(panel);
  };

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        select(next, true);
      }
    });
  });

  /* position initiale (après chargement de la police) */
  var active = tablist.querySelector(".pricing__tab.is-active") || tabs[0];
  moveIndicator(active);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      moveIndicator(tablist.querySelector(".pricing__tab.is-active"));
    });
  }
  window.addEventListener("resize", function () {
    moveIndicator(tablist.querySelector(".pricing__tab.is-active"));
  });

  /* première apparition quand la section entre à l'écran */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      inView = true;
      play(panels[tabs.indexOf(tablist.querySelector(".pricing__tab.is-active"))]);
    }, { threshold: 0.15 });
    io.observe(section);
  } else {
    inView = true;
    play(panels[0]);
  }
})();
