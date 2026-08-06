/* Blog Oswald Solutions — lecture des articles (assets/data/posts.js) */
(function () {
  "use strict";

  /* Les articles publies sont lus depuis assets/data/posts.js. */
  var POSTS = (window.BLOG_POSTS || []).filter(function (p) {
    return p && typeof p === "object" && typeof p.title === "string";
  });

  var MONTHS = [
    "janvier", "f\u00e9vrier", "mars", "avril", "mai", "juin",
    "juillet", "ao\u00fbt", "septembre", "octobre", "novembre", "d\u00e9cembre"
  ];

  var escapeHtml = function (s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  var formatDate = function (iso) {
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  };

  var renderInline = function (s) {
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  };

  var renderContent = function (text) {
    var lines = String(text || "").split(/\n+/);
    var html = "";
    var inList = false;
    var closeList = function () {
      if (inList) { html += "</ul>"; inList = false; }
    };
    lines.forEach(function (line) {
      line = line.trim();
      if (!line) return;
      if (/^###\s+/.test(line)) {
        closeList();
        html += "<h3>" + renderInline(line.replace(/^###\s+/, "")) + "</h3>";
      } else if (/^##\s+/.test(line)) {
        closeList();
        html += "<h2>" + renderInline(line.replace(/^##\s+/, "")) + "</h2>";
      } else if (/^-\s+/.test(line)) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += "<li>" + renderInline(line.replace(/^-\s+/, "")) + "</li>";
      } else {
        closeList();
        html += "<p>" + renderInline(line) + "</p>";
      }
    });
    closeList();
    return html;
  };

  var published = function () {
    return POSTS
      .filter(function (p) { return p.status === "published"; })
      .sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
  };

  var bySlug = function (slug) {
    return POSTS.find(function (p) { return p.slug === slug; }) || null;
  };

  var coverHtml = function (post) {
    if (post.cover) {
      return (
        '<div class="post-card__cover">' +
        '<img src="' + escapeHtml(post.cover) + '" alt="" loading="lazy">' +
        "</div>"
      );
    }
    return (
      '<div class="post-card__cover post-card__cover--placeholder" aria-hidden="true">' +
      "<span>" + escapeHtml(post.category || "Oswald Solutions") + "</span>" +
      "</div>"
    );
  };

  var renderCard = function (post) {
    return (
      '<article class="post-card">' +
      '<a class="post-card__link" href="article.html?slug=' + encodeURIComponent(post.slug) + '">' +
      coverHtml(post) +
      '<div class="post-card__body">' +
      '<p class="post-card__meta">' +
      '<span class="post-card__category">' + escapeHtml(post.category || "Blog") + "</span>" +
      '<span class="post-card__date">' + formatDate(post.date) + "</span>" +
      "</p>" +
      "<h3>" + escapeHtml(post.title) + "</h3>" +
      '<p class="post-card__excerpt">' + escapeHtml(post.excerpt) + "</p>" +
      '<span class="post-card__more">Lire l\u2019article <span class="arrow" aria-hidden="true">\u2192</span></span>' +
      "</div>" +
      "</a>" +
      "</article>"
    );
  };

  var fillGrid = function (container, posts) {
    container.innerHTML = posts.map(renderCard).join("");
    var cards = container.querySelectorAll(".post-card");
    cards.forEach(function (card, i) {
      card.classList.add("reveal");
      card.style.transitionDelay = Math.min(i * 80, 240) + "ms";
    });
    if (cards.length) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          cards.forEach(function (card) { card.classList.add("is-visible"); });
        });
      });
    }
    var empty = document.getElementById("blog-empty");
    if (empty) empty.style.display = posts.length ? "none" : "";
  };

  var initHomeBlog = function () {
    var grid = document.getElementById("blog-grid");
    if (!grid) return;
    fillGrid(grid, published().slice(0, 3));
  };

  var initBlogPage = function () {
    var list = document.getElementById("blog-list");
    if (!list) return;
    fillGrid(list, published());
  };

  var initArticlePage = function () {
    var main = document.getElementById("article-main");
    if (!main) return;
    var slug = new URLSearchParams(window.location.search).get("slug");
    var post = bySlug(slug);
    if (!post) {
      main.innerHTML =
        '<section class="section article">' +
        '<div class="container container--narrow">' +
        '<p class="label">Blog</p>' +
        '<h1 class="section__title">Article introuvable.</h1>' +
        '<p class="section__lede">Cet article n\u2019existe pas ou a \u00e9t\u00e9 retir\u00e9.</p>' +
        '<p style="margin-top:2rem"><a class="btn btn--primary" href="blog.html"><span class="btn__label"><span class="btn__text">Retour au blog</span><span class="btn__text btn__text--dupe" aria-hidden="true">Retour au blog</span></span></a></p>' +
        "</div>" +
        "</section>";
      return;
    }
    document.title = post.title + " — Oswald Solutions";
    var body = document.getElementById("article-body");
    if (body) body.innerHTML = renderContent(post.content);
    var heroTitle = document.getElementById("article-title");
    if (heroTitle) heroTitle.textContent = post.title;
    var heroCat = document.getElementById("article-category");
    if (heroCat) heroCat.textContent = post.category || "Blog";
    var heroDate = document.getElementById("article-date");
    if (heroDate) heroDate.textContent = formatDate(post.date);
  };

  document.addEventListener("DOMContentLoaded", function () {
    initHomeBlog();
    initBlogPage();
    initArticlePage();
  });
})();
