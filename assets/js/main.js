(function () {
  "use strict";

  /* ---------- Loader de chargement ---------- */
  var loader = document.getElementById("loader");

  var hideLoader = function () {
    if (!loader) return;
    loader.classList.add("is-hidden");
    document.body.classList.remove("loader-active");
  };

  if (loader) {
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      document.body.classList.remove("loader-active");
    } else {
      var fill = loader.querySelector(".loader__bar-fill");
      var percent = loader.querySelector(".loader__percent");
      document.body.classList.add("loader-active");
      loader.classList.add("is-active");

      var DURATION = 1000;
      var start = null;
      var ease = function (t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      var frame = function (now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / DURATION, 1);
        var p = ease(t);
        fill.style.width = p * 100 + "%";
        if (percent) percent.textContent = Math.round(p * 100) + "%";
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          setTimeout(hideLoader, 120);
        }
      };

      requestAnimationFrame(frame);
    }
  }

  /* ---------- Header : bordure au scroll ---------- */
  var header = document.getElementById("site-header");
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var siteNav = document.getElementById("site-nav");

  var servicesLink = document.getElementById("nav-services");
  var servicesParent = servicesLink
    ? servicesLink.closest(".has-dropdown")
    : null;
  var servicesDropdown = document.getElementById("services-dropdown");

  var setSubmenu = function (open) {
    if (!servicesLink || !servicesParent || !servicesDropdown) return;
    servicesLink.setAttribute("aria-expanded", String(open));
    servicesParent.classList.toggle("is-open", open);
    if (window.innerWidth < 1200) {
      servicesDropdown.style.maxHeight = open
        ? servicesDropdown.scrollHeight + "px"
        : "0px";
    } else {
      servicesDropdown.style.maxHeight = "";
    }
  };

  var setServicesOpen = function (open) {
    servicesLink.setAttribute("aria-expanded", String(open));
    servicesParent.classList.toggle("is-open", open);
  };

  var setMenu = function (open) {
    if (!navToggle || !siteNav) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    siteNav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    if (!open) setSubmenu(false);
  };

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });
  }

  if (siteNav) {
    siteNav.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (!link) return;
      if (link.id === "nav-services") return;
      setMenu(false);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 960) setMenu(false);
  });

  /* ---------- Dropdown Services : accordéon mobile ---------- */
  if (servicesLink && servicesParent) {
    servicesLink.addEventListener("click", function (e) {
      e.preventDefault();
      if (window.innerWidth < 1200) {
        setSubmenu(!servicesParent.classList.contains("is-open"));
      } else {
        setServicesOpen(
          servicesLink.getAttribute("aria-expanded") !== "true"
        );
      }
    });
  }

  /* ---------- Dropdown Services (desktop) ---------- */
  if (servicesLink && servicesParent) {
    servicesParent.addEventListener("mouseenter", function () {
      if (window.innerWidth < 1200) return;
      setServicesOpen(true);
    });
    servicesParent.addEventListener("mouseleave", function () {
      if (window.innerWidth < 1200) return;
      setServicesOpen(false);
    });
    servicesParent.addEventListener("focusin", function () {
      if (window.innerWidth < 1200) return;
      setServicesOpen(true);
    });
    servicesParent.addEventListener("focusout", function (e) {
      if (window.innerWidth < 1200) return;
      if (!servicesParent.contains(e.relatedTarget)) setServicesOpen(false);
    });
  }

  /* ---------- Dropdown Services : hauteur de l'accordéon ---------- */
  var refreshSubmenuHeight = function () {
    if (
      servicesParent &&
      servicesParent.classList.contains("is-open") &&
      window.innerWidth < 1200
    ) {
      servicesDropdown.style.maxHeight = servicesDropdown.scrollHeight + "px";
    }
  };
  window.addEventListener("resize", refreshSubmenuHeight);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refreshSubmenuHeight);
  }

  /* ---------- Titre hero : apparition des lettres en fondu ---------- */
  var heroTitle = document.getElementById("hero-title");
  if (heroTitle) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      var accentSpan = heroTitle.querySelector(".accent");
      var accentText = accentSpan ? accentSpan.textContent : "";
      var fullText = heroTitle.textContent.replace(/\s+/g, " ").trim();
      var aStart = accentText ? fullText.indexOf(accentText) : -1;
      var aEnd = aStart + accentText.length;

      var chars = [];
      heroTitle.textContent = "";
      var curWord = null;
      for (var ci = 0; ci < fullText.length; ci++) {
        var isAcc = ci >= aStart && ci < aEnd;
        if (fullText[ci] === " ") {
          curWord = null;
          var sp = document.createElement("span");
          sp.className = "hero__char" + (isAcc ? " hero__char--accent" : "");
          sp.textContent = " ";
          heroTitle.appendChild(sp);
          chars.push(sp);
        } else {
          if (!curWord) {
            curWord = document.createElement("span");
            curWord.className = "hero__word";
            heroTitle.appendChild(curWord);
          }
          var ch = document.createElement("span");
          ch.className = "hero__char" + (isAcc ? " hero__char--accent" : "");
          ch.textContent = fullText[ci];
          curWord.appendChild(ch);
          chars.push(ch);
        }
      }

      var revealStarted = false;
      var ci = 0;
      var last = null;
      var acc = 0;
      var lastPause = 0;
      var CHAR_DELAY = 22;
      var PAUSE = 300;

      var charFrame = function (now) {
        if (last === null) last = now;
        var delta = now - last;
        last = now;

        if (now < lastPause) {
          requestAnimationFrame(charFrame);
          return;
        }

        acc += delta;
        while (acc >= CHAR_DELAY && ci < chars.length) {
          acc -= CHAR_DELAY;
          chars[ci].classList.add("is-in");
          ci++;
          if (ci === aStart) {
            lastPause = now + PAUSE;
            acc = 0;
            break;
          }
        }

        if (ci >= chars.length) return;
        requestAnimationFrame(charFrame);
      };

      setTimeout(function () {
        if (revealStarted) return;
        revealStarted = true;
        requestAnimationFrame(charFrame);
      }, 900);
    }
  }

  /* ---------- Apparitions au scroll ---------- */
  var REVEAL_SELECTOR = [
    ".hero__label",
    ".hero__title",
    ".hero__lede",
    ".hero__actions",
    ".hero__proof",
    ".label",
    ".section__title",
    ".section__lede",
    "h1",
    "h2:not(.cookie-banner__title)",
    "h3",
    ".problem__list li",
    ".problem__outro",
    ".value__card",
    ".service-card",
    ".method__step",
    ".method__outro",
    ".care__intro",
    ".care__price",
    ".care__list",
    ".care__note",
    ".care__card > .btn",
    ".price-row",
    ".pricing__note",
    ".pricing .btn",
    ".about__prose > p",
    ".faq__intro > *",
    ".faq__support",
    ".faq-item",
    ".contact__intro > *",
    ".contact-form"
  ].join(",");

  var targets = document.querySelectorAll(REVEAL_SELECTOR);
  var stagger = function (el) {
    if (el.classList.contains("value__card") ||
        el.classList.contains("service-card") ||
        el.classList.contains("method__step") ||
        el.classList.contains("price-row") ||
        el.classList.contains("faq-item")) {
      var siblings = el.parentNode.children;
      var index = Array.prototype.indexOf.call(siblings, el);
      el.style.transitionDelay = Math.min(index * 60, 240) + "ms";
    }
  };

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  targets.forEach(function (el) {
    el.classList.add("reveal");
    stagger(el);
    io.observe(el);
  });

  /* ---------- Accordéon FAQ ---------- */
  var faqTriggers = document.querySelectorAll(".faq-item__trigger");

  var openFaqPanel = function (panel) {
    panel.style.maxHeight = panel.scrollHeight + "px";
    panel.classList.add("is-open-panel");
  };

  var closeFaqPanel = function (panel) {
    if (!panel.classList.contains("is-open-panel")) return;
    panel.style.maxHeight = panel.scrollHeight + "px";
    panel.offsetHeight;
    panel.style.maxHeight = "0px";
    panel.classList.remove("is-open-panel");
  };

  faqTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var item = trigger.closest(".faq-item");
      var isOpen = trigger.getAttribute("aria-expanded") === "true";
      faqTriggers.forEach(function (t) {
        t.setAttribute("aria-expanded", "false");
        t.closest(".faq-item").classList.remove("is-open");
        closeFaqPanel(t.parentNode.querySelector(".faq-item__panel"));
      });
      if (!isOpen) {
        trigger.setAttribute("aria-expanded", "true");
        item.classList.add("is-open");
        openFaqPanel(item.querySelector(".faq-item__panel"));
      }
    });
  });

  window.addEventListener("resize", function () {
    document.querySelectorAll(".faq-item__panel.is-open-panel").forEach(function (panel) {
      panel.style.maxHeight = panel.scrollHeight + "px";
    });
  });

  /* ---------- Formulaire ---------- */
  var form = document.getElementById("formulaire");
  if (form) {
    var status = form.querySelector(".form__status");

  var setFieldInvalid = function (field, invalid) {
    field.closest(".form__field").classList.toggle("invalid", invalid);
  };

  var validateField = function (field) {
    var valid = field.checkValidity();
    setFieldInvalid(field, !valid);
    return valid;
  };

  form.querySelectorAll("input, select, textarea").forEach(function (field) {
    field.addEventListener("blur", function () {
      if (field.value) validateField(field);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var fields = form.querySelectorAll("input, select, textarea");
    var allValid = true;
    fields.forEach(function (field) {
      if (!validateField(field)) allValid = false;
    });

    if (!allValid) {
      status.textContent = "Veuillez compléter les champs obligatoires.";
      status.classList.add("is-error");
      return;
    }

    status.classList.remove("is-error");
    status.textContent = "Merci. Votre demande a bien été prise en compte, je reviens vers vous rapidement.";
    form.reset();
  });
  }

  /* ---------- Année du footer ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Bannière cookies ---------- */
  var cookieBanner = document.getElementById("cookie-banner");
  var cookieBtn = document.getElementById("cookie-btn");
  var COOKIE_KEY = "os_cookies_choice";

  var showBanner = function () {
    if (cookieBanner) cookieBanner.classList.add("is-visible");
  };

  var hideBanner = function () {
    if (cookieBanner) cookieBanner.classList.remove("is-visible");
  };

  var cookieChoice = localStorage.getItem(COOKIE_KEY);

  if (cookieBtn) {
    cookieBtn.classList.toggle("has-pending", !cookieChoice);
    cookieBtn.addEventListener("click", showBanner);
  }

  if (!cookieChoice) {
    setTimeout(showBanner, 900);
  }

  if (cookieBanner) {
    cookieBanner.querySelectorAll("button[data-cookie]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        localStorage.setItem(COOKIE_KEY, btn.getAttribute("data-cookie"));
        hideBanner();
        if (cookieBtn) cookieBtn.classList.remove("has-pending");
      });
    });
  }

  /* ---------- Retour en haut ---------- */
  var backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    var toggleBackToTop = function () {
      backToTop.classList.toggle("is-visible", window.scrollY > 600);
    };
    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    toggleBackToTop();

    backToTop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
