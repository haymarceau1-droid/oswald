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
    var h = 0;
    String(post.slug || post.title).split("").forEach(function (ch) { h += ch.charCodeAt(0); });
    var tone = h % 2 === 0 ? "acid" : "forest";
    return (
      '<div class="post-card__cover post-card__cover--placeholder post-card__cover--' + tone + '" aria-hidden="true">' +
      '<div class="post-card__cover-top">' +
      '<span class="post-card__cover-cat">' + escapeHtml(post.category || "Blog") + "</span>" +
      '<span class="post-card__cover-go">\u2197</span>' +
      "</div>" +
      '<p class="post-card__cover-title">' + escapeHtml(post.title) + "</p>" +
      "</div>"
    );
  };

  var renderCard = function (post) {
    return (
      '<article class="post-card' + (post.cover ? "" : " post-card--typo") + '">' +
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

  /* SEO dynamique de la page article (le contenu vient de assets/data/posts.js) */
  var SITE = "https://oswaldsolutions.fr";

  var setHead = function (selector, attr, value) {
    var el = document.head.querySelector(selector);
    if (el && value) el.setAttribute(attr, value);
  };

  var applyArticleSeo = function (post) {
    var url = SITE + "/article.html?slug=" + encodeURIComponent(post.slug);
    var title = /oswald solutions/i.test(post.title) ? post.title : post.title + " — Oswald Solutions";
    var desc = post.excerpt || "Article du blog Oswald Solutions.";
    var abs = function (u) { return /^https?:/.test(u) ? u : SITE + "/" + String(u).replace(/^\//, ""); };
    var image = post.cover ? abs(post.cover) : SITE + "/assets/og/og-image.png";

    setHead('meta[name="description"]', "content", desc);
    setHead('link[rel="canonical"]', "href", url);
    setHead('meta[property="og:title"]', "content", title);
    setHead('meta[property="og:description"]', "content", desc);
    setHead('meta[property="og:url"]', "content", url);
    setHead('meta[property="og:image"]', "content", image);
    setHead('meta[name="twitter:title"]', "content", title);
    setHead('meta[name="twitter:description"]', "content", desc);
    setHead('meta[name="twitter:image"]', "content", image);

    var ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          "@id": url + "#article",
          "headline": post.title,
          "description": desc,
          "image": image,
          "datePublished": post.date,
          "dateModified": post.updated || post.date,
          "inLanguage": "fr-FR",
          "articleSection": post.category || "Blog",
          "mainEntityOfPage": { "@type": "WebPage", "@id": url },
          "author": { "@id": SITE + "/#organization" },
          "publisher": { "@id": SITE + "/#organization" }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE + "/" },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog.html" },
            { "@type": "ListItem", "position": 3, "name": post.title, "item": url }
          ]
        }
      ]
    };
    /* remplace les données structurées génériques de la page par celles de l'article */
    Array.prototype.forEach.call(
      document.head.querySelectorAll('script[type="application/ld+json"]'),
      function (s) { s.parentNode.removeChild(s); }
    );
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
  };

  var initArticlePage = function () {
    var main = document.getElementById("article-main");
    if (!main) return;
    var slug = new URLSearchParams(window.location.search).get("slug");
    var post = bySlug(slug);
    if (!post) {
      setHead('meta[name="robots"]', "content", "noindex,follow");
      main.innerHTML =
        '<section class="section article">' +
        '<div class="container container--narrow">' +
        '<p class="label">Blog</p>' +
        '<h2 class="section__title">Article introuvable.</h2>' +
        '<p class="section__lede">Cet article n\u2019existe pas ou a \u00e9t\u00e9 retir\u00e9.</p>' +
        '<p style="margin-top:2rem"><a class="btn btn--primary" href="blog.html"><span class="btn__label"><span class="btn__text">Retour au blog</span><span class="btn__text btn__text--dupe" aria-hidden="true">Retour au blog</span></span></a></p>' +
        "</div>" +
        "</section>";
      return;
    }
    document.title = /oswald solutions/i.test(post.title) ? post.title : post.title + " — Oswald Solutions";
    applyArticleSeo(post);
    var body = document.getElementById("article-body");
    if (body) body.innerHTML = renderContent(post.content);
    var heroTitle = document.getElementById("article-title");
    if (heroTitle) heroTitle.textContent = post.title;
    var heroCat = document.getElementById("article-category");
    if (heroCat) heroCat.textContent = post.category || "Blog";
    var crumb = document.getElementById("crumb-current");
    if (crumb) crumb.textContent = post.title;
    var heroDate = document.getElementById("article-date");
    if (heroDate) heroDate.textContent = formatDate(post.date);
  };

  document.addEventListener("DOMContentLoaded", function () {
    initHomeBlog();
    initBlogPage();
    initArticlePage();
  });
})();
