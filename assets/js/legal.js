(function () {
  "use strict";

  var toc = document.querySelector(".legal__toc");
  var sections = document.querySelectorAll(".legal__section");
  if (!toc || !sections.length) return;

  var list = document.createElement("ol");
  var links = [];

  sections.forEach(function (section, i) {
    var h2 = section.querySelector("h2");
    if (!h2) return;
    var id = "section-" + (i + 1);
    section.id = id;
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "#" + id;
    a.textContent = h2.textContent;
    li.appendChild(a);
    list.appendChild(li);
    links.push({ link: a, section: section });
  });

  toc.appendChild(list);

  if (!("IntersectionObserver" in window)) return;

  var setActive = function (current) {
    links.forEach(function (item) {
      var on = item.section === current;
      item.link.classList.toggle("is-active", on);
      if (on) item.link.setAttribute("aria-current", "true");
      else item.link.removeAttribute("aria-current");
    });
  };

  var visible = [];
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var idx = visible.indexOf(entry.target);
      if (entry.isIntersecting && idx === -1) visible.push(entry.target);
      if (!entry.isIntersecting && idx > -1) visible.splice(idx, 1);
    });
    if (!visible.length) return;
    visible.sort(function (a, b) {
      return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
    });
    setActive(visible[0]);
  }, { rootMargin: "-96px 0px -55% 0px" });

  links.forEach(function (item) { io.observe(item.section); });
  setActive(links[0].section);
})();
