/* Bulles « i » : explique simplement les termes techniques de la grille tarifaire */
(function () {
  "use strict";

  var GLOSSARY = {
    "UX/UI sur mesure": "UX : l'expérience de visite (parcours simple, logique). UI : l'apparence (couleurs, typographies, boutons). Le tout dessiné pour votre activité, pas un modèle générique.",
    "UX/UI personnalisé": "UX : l'expérience de visite (parcours simple, logique). UI : l'apparence (couleurs, typographies, boutons). Le tout dessiné pour votre activité, pas un modèle générique.",
    "Design responsive": "Le site s'adapte automatiquement à tous les écrans : téléphone, tablette et ordinateur.",
    "Développement": "La programmation du site : du code écrit pour votre projet, sans modèle lourd ni extension inutile.",
    "Développement sur mesure": "La programmation du site : du code écrit pour votre projet, sans modèle lourd ni extension inutile.",
    "Animations": "De petits mouvements à l'écran (apparitions, survols) qui rendent le site vivant, sans le ralentir.",
    "SEO technique de base": "SEO = référencement naturel sur Google. Le volet technique, c'est la structure du site, les balises et le plan du site, pour que Google comprenne et indexe vos pages.",
    "SEO technique": "SEO = référencement naturel sur Google. Le volet technique, c'est la structure du site, les balises et le plan du site, pour que Google comprenne et indexe vos pages.",
    "SEO avancé": "Au-delà des bases : choix des mots-clés, contenus optimisés, présence locale, liens externes et suivi de vos positions sur Google.",
    "SEO e-commerce avancé": "Référencement de vos fiches produits et catégories : balises et données structurées pour apparaître sur Google avec prix, stock et avis.",
    "Optimisé pour être cité par les IA": "Le site est structuré pour que des assistants comme ChatGPT, Gemini ou Perplexity comprennent votre activité et puissent vous recommander.",
    "Suivi de votre visibilité dans les IA": "Nous vérifions si et comment les assistants IA (ChatGPT, Gemini, Perplexity…) parlent de vous, puis nous ajustons le site en conséquence.",
    "Référencement IA avancé": "Optimisation poussée pour être recommandé par les assistants IA : contenus structurés, données cohérentes sur le web, suivi des citations.",
    "Optimisation des performances": "Le site se charge vite : images allégées, code propre. C'est meilleur pour vos visiteurs et pour votre classement Google.",
    "CMS si nécessaire": "CMS = système de gestion de contenu : un espace d'administration pour modifier vous-même vos textes et images, sans coder.",
    "Analytics": "Statistiques de fréquentation : combien de visiteurs, d'où ils viennent et quelles pages ils consultent.",
    "Mise en ligne": "Publication du site sur Internet avec votre nom de domaine, après les dernières vérifications.",
    "Audit & migration de contenus": "Audit : état des lieux de votre site actuel. Migration : transfert de vos textes, images et produits vers le nouveau site, sans rien perdre.",
    "Fonctionnalités avancées": "Fonctions sur mesure au-delà d'une boutique standard : filtres, comptes clients, codes promo, règles de livraison…",
    "Intégrations API": "Connexion du site à vos autres outils (paiement, logistique, CRM, emailing) pour qu'ils échangent automatiquement des données.",
    "Espace client / réservation": "Un espace connecté où vos clients retrouvent leurs informations ou réservent directement en ligne.",
    "Optimisation de la conversion": "Améliorer le site pour qu'un plus grand nombre de visiteurs passe à l'action : demander un devis, acheter, vous appeler.",
    "Optimisation de conversion": "Améliorer le site pour qu'un plus grand nombre de visiteurs passe à l'action : demander un devis, acheter, vous appeler.",
    "Hébergement": "Le serveur sur lequel votre site est stocké pour être accessible 24 h/24.",
    "SSL": "Le certificat de sécurité (le cadenas, « https ») qui chiffre les échanges et rassure visiteurs et Google.",
    "Sauvegardes": "Copies régulières du site, pour le restaurer rapidement en cas de problème.",
    "Monitoring": "Surveillance automatique : nous sommes alertés si le site tombe ou ralentit.",
    "Monitoring renforcé": "Surveillance automatique plus fréquente et plus fine : nous sommes alertés si le site tombe ou ralentit.",
    "Sécurité": "Protection contre les attaques et les logiciels malveillants, avec correctifs appliqués régulièrement.",
    "Mises à jour": "Mises à jour techniques et de sécurité, pour que le site reste compatible et protégé.",
    "Analyse mensuelle des performances": "Chaque mois : vitesse, fréquentation et résultats du site, avec des recommandations concrètes."
  };

  var items = document.querySelectorAll(".pricing__features li");
  if (!items.length) return;

  var tip = document.createElement("div");
  tip.className = "info-tip";
  tip.id = "info-tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.appendChild(tip);

  var current = null;

  function canHover() {
    return window.matchMedia("(hover: hover)").matches;
  }

  function place(btn) {
    var r = btn.getBoundingClientRect();
    var w = Math.min(280, window.innerWidth - 24);
    tip.style.width = w + "px";
    var left = r.left + r.width / 2 - w / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
    tip.style.left = left + "px";
    var h = tip.offsetHeight;
    var below = r.top < h + 20;
    tip.classList.toggle("is-below", below);
    tip.style.top = (below ? r.bottom + 10 : r.top - h - 10) + "px";
    tip.style.setProperty("--arrow-x", r.left + r.width / 2 - left + "px");
  }

  function show(btn) {
    current = btn;
    tip.textContent = btn.getAttribute("data-tip");
    tip.hidden = false;
    btn.setAttribute("aria-describedby", "info-tip");
    place(btn);
    tip.classList.add("is-open");
  }

  function hide() {
    if (current) current.removeAttribute("aria-describedby");
    current = null;
    tip.classList.remove("is-open");
    tip.hidden = true;
  }

  items.forEach(function (li) {
    var key = li.textContent.replace(/\s+/g, " ").trim();
    var text = GLOSSARY[key];
    if (!text) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "info-btn";
    btn.setAttribute("data-tip", text);
    btn.setAttribute("aria-label", "Explication : " + key);
    btn.textContent = "i";
    li.appendChild(btn);

    btn.addEventListener("mouseenter", function () { if (canHover()) show(btn); });
    btn.addEventListener("mouseleave", function () { if (canHover()) hide(); });
    btn.addEventListener("focus", function () {
      /* le focus au clavier ouvre la bulle ; au toucher, c'est le clic qui s'en charge */
      if (btn.matches(":focus-visible")) show(btn);
    });
    btn.addEventListener("blur", hide);
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (canHover()) show(btn);
      else if (current === btn && !tip.hidden) hide();
      else show(btn);
    });
  });

  document.addEventListener("click", hide);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") hide();
  });
  window.addEventListener("scroll", function () { if (current) place(current); }, { passive: true });
  window.addEventListener("resize", hide);
})();
