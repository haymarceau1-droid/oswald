/* Sanglier qui traverse la section Tarifs : l'animation ne tourne que lorsque la section est visible */
(function () {
  "use strict";

  var boar = document.querySelector(".boar-run");
  var section = document.getElementById("tarifs");
  if (!boar || !section || !("IntersectionObserver" in window)) return;

  new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      boar.classList.toggle("is-running", entry.isIntersecting);
    });
  }, { threshold: 0 }).observe(section);
})();
