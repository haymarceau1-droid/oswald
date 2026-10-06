/* Oswald Solutions — bandeau « Site réalisé par Oswald Solutions »
   ------------------------------------------------------------------
   Utilisation (à coller juste avant </body>, sur le site de ton site ou d'un client) :

     <script src="https://oswaldsolutions.fr/assets/js/oswald-credit.js" defer></script>

   Options (attributs facultatifs sur la balise <script>) :
     data-theme="dark"   fond vert foncé (par défaut)
     data-theme="light"  fond clair, pour les sites sombres ou très colorés
     data-url="https://…" adresse du lien (par défaut : https://oswaldsolutions.fr)

   Le bandeau est isolé dans un Shadow DOM : le CSS du site hôte ne peut pas le
   déformer, et il ne modifie rien sur la page. Il se place en bas de page, après le pied de page. */
(function () {
  "use strict";

  if (document.getElementById("oswald-credit")) return;

  var script = document.currentScript;
  var theme = (script && script.getAttribute("data-theme")) === "light" ? "light" : "dark";
  var url = (script && script.getAttribute("data-url")) || "https://oswaldsolutions.fr";

  var mount = function () {
    if (document.getElementById("oswald-credit")) return;

    var host = document.createElement("div");
    host.id = "oswald-credit";
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

    var palette = theme === "light"
      ? { bg: "#f0f2ed", text: "rgba(0,29,27,.62)", strong: "#002624", line: "rgba(0,38,36,.14)", hover: "#002624", dot: "#002624" }
      : { bg: "#001a18", text: "rgba(240,242,237,.62)", strong: "#f0f2ed", line: "rgba(240,242,237,.12)", hover: "#f8f574", dot: "#f8f574" };

    root.innerHTML =
      "<style>" +
      ":host{display:block;all:initial;display:block}" +
      ".band{box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.35rem .55rem;" +
      "width:100%;padding:.95rem 1.25rem;background:" + palette.bg + ";color:" + palette.text + ";" +
      "border-top:1px solid " + palette.line + ";text-align:center;" +
      "font:500 13px/1.4 'Geist',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:-.005em}" +
      ".dot{width:6px;height:6px;border-radius:50%;background:" + palette.dot + ";flex-shrink:0}" +
      "a{display:inline-flex;align-items:center;gap:.3rem;color:" + palette.strong + ";text-decoration:none;" +
      "font-family:'Clash Grotesk','Geist',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-weight:600;letter-spacing:-.01em;" +
      "padding-bottom:1px;border-bottom:1px solid " + palette.line + ";transition:color .2s ease,border-color .2s ease}" +
      "a:hover,a:focus-visible{color:" + palette.hover + ";border-color:" + palette.hover + "}" +
      "a:focus-visible{outline:2px solid " + palette.hover + ";outline-offset:3px;border-radius:2px}" +
      ".arr{display:inline-block;font-size:.9em;transition:transform .25s ease}" +
      "a:hover .arr,a:focus-visible .arr{transform:translate(2px,-2px)}" +
      "@media print{.band{display:none}}" +
      "</style>" +
      '<div class="band"><span class="dot" aria-hidden="true"></span>' +
      "<span>Site réalisé par</span>" +
      '<a href="' + url.replace(/"/g, "&quot;") + '" target="_blank" rel="noopener">Oswald Solutions<span class="arr" aria-hidden="true">↗</span></a></div>';

    document.body.appendChild(host);
  };

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
