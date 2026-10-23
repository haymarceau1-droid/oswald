/* Réalisations — rendu des projets (assets/data/projects.js) */
(function () {
  "use strict";

  var PROJECTS = (window.PROJECTS || []).filter(function (p) {
    return p && typeof p === "object" && typeof p.title === "string" && p.status !== "draft";
  });

  var escapeHtml = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  /* maquette de navigateur dessinée en CSS */
  var mock = function (p) {
    var tone = p.visual === "acid" ? "acid" : "forest";
    return (
      '<div class="mock mock--' + tone + '" aria-hidden="true">' +
      '<div class="mock__bar"><i></i><i></i><i></i><span class="mock__url">' + escapeHtml(p.domain || "exemple.fr") + "</span></div>" +
      '<div class="mock__body">' +
      '<div class="mock__nav"><b></b><span></span><span></span><span></span></div>' +
      '<div class="mock__hero"><div class="mock__lines"><span class="w80"></span><span class="w60"></span><span class="w40 accent"></span></div><div class="mock__btn"></div></div>' +
      '<div class="mock__cards"><span></span><span></span><span></span></div>' +
      "</div></div>"
    );
  };

  var card = function (p) {
    var tags = (p.tags || [])
      .map(function (t) { return "<li>" + escapeHtml(t) + "</li>"; })
      .join("");
    var meta = [p.category, p.year].filter(Boolean).map(escapeHtml).join(" · ");
    var inner =
      '<div class="project-card__visual">' + mock(p) +
      (p.sample ? '<span class="project-card__badge">Exemple</span>' : "") +
      "</div>" +
      '<div class="project-card__body">' +
      (meta ? '<p class="project-card__meta">' + meta + "</p>" : "") +
      "<h3>" + escapeHtml(p.title) + "</h3>" +
      '<p class="project-card__excerpt">' + escapeHtml(p.excerpt) + "</p>" +
      (tags ? '<ul class="project-card__tags">' + tags + "</ul>" : "") +
      (p.url
        ? '<span class="project-card__more">Voir le projet <span class="arrow" aria-hidden="true">↗</span></span>'
        : "") +
      "</div>";

    var cls = "project-card" + (p.sample ? " project-card--sample" : "");
    return p.url
      ? '<article class="' + cls + '"><a class="project-card__link" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' + inner + "</a></article>"
      : '<article class="' + cls + '"><div class="project-card__link">' + inner + "</div></article>";
  };

  var fill = function (container, list) {
    if (!container) return;
    container.innerHTML = list.map(card).join("");
    container.classList.toggle("projects__grid--single", list.length === 1);
    var cards = container.querySelectorAll(".project-card");
    cards.forEach(function (c, i) {
      c.classList.add("reveal");
      c.style.transitionDelay = Math.min(i * 80, 240) + "ms";
    });
    if (cards.length) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          cards.forEach(function (c) { c.classList.add("is-visible"); });
        });
      });
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    fill(document.getElementById("projects-grid"), PROJECTS.slice(0, 3));
    fill(document.getElementById("projects-list"), PROJECTS);
  });
})();
