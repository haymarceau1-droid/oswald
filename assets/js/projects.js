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
    /* capture d'écran réelle du site : "image": "assets/projects/xxx.jpg" */
    if (p.image) {
      return (
        '<div class="mock mock--shot mock--' + tone + '">' +
        '<div class="mock__bar"><i></i><i></i><i></i><span class="mock__url">' + escapeHtml(p.domain || "") + "</span></div>" +
        '<img class="mock__shot" src="' + escapeHtml(p.image) + '" alt="Aperçu du site ' + escapeHtml(p.domain || p.title) + '" loading="lazy">' +
        "</div>"
      );
    }
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

  /* projet à la une : grand encadré avec la capture en perspective */
  var feature = function (p) {
    var tags = (p.tags || []);
    var meta = [p.category, p.year].filter(Boolean).map(escapeHtml).join(" · ");
    var chips = tags.slice(0, 2).map(function (t, i) {
      return '<span class="project-feature__chip project-feature__chip--' + (i + 1) + '"><i></i>' + escapeHtml(t) + "</span>";
    }).join("");
    var pills = tags.map(function (t) { return "<li>" + escapeHtml(t) + "</li>"; }).join("");
    var cta = p.url
      ? '<a class="btn btn--primary" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener"><span class="btn__label"><span class="btn__text">Voir le projet \u2197</span><span class="btn__text btn__text--dupe" aria-hidden="true">Voir le projet \u2197</span></span></a>'
      : "";
    var stage = '<div class="project-feature__stage">' + mock(p) + chips + "</div>";
    return (
      '<article class="project-feature">' +
      '<div class="project-feature__text">' +
      (meta ? '<p class="project-feature__meta">' + meta + "</p>" : "") +
      "<h3>" + escapeHtml(p.title) + "</h3>" +
      '<p class="project-feature__excerpt">' + escapeHtml(p.excerpt) + "</p>" +
      (pills ? '<ul class="project-feature__tags">' + pills + "</ul>" : "") +
      cta +
      "</div>" +
      (p.url
        ? '<a class="project-feature__shot" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener" aria-label="Ouvrir ' + escapeHtml(p.domain || p.title) + '" tabindex="-1">' + stage + "</a>"
        : stage) +
      "</article>"
    );
  };

  var fill = function (container, list) {
    if (!container || !list.length) return;
    var rest = list.slice(1);
    container.classList.remove("projects__grid");
    container.classList.add("projects__stack");
    container.innerHTML =
      feature(list[0]) +
      (rest.length ? '<div class="projects__grid projects__grid--rest">' + rest.map(card).join("") + "</div>" : "");

    var items = container.querySelectorAll(".project-feature, .project-card");
    items.forEach(function (c, i) {
      c.classList.add("reveal");
      c.style.transitionDelay = Math.min(i * 90, 270) + "ms";
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        items.forEach(function (c) { c.classList.add("is-visible"); });
      });
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    fill(document.getElementById("projects-grid"), PROJECTS.slice(0, 3));
    fill(document.getElementById("projects-list"), PROJECTS);
  });
})();
