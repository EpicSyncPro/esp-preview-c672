// Shared behaviour: mobile menu, and transform-only entrance springs (Motion, MIT). Text never starts
// transparent, so contrast holds at every frame; reduced motion skips all of it. The shells work without JS.
(() => {
  document.querySelectorAll("[data-menu]").forEach((b) => {
    const nav = document.getElementById(b.getAttribute("aria-controls"));
    b.addEventListener("click", () => { const o = b.getAttribute("aria-expanded") === "true"; b.setAttribute("aria-expanded", String(!o)); nav.classList.toggle("open", !o); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { b.setAttribute("aria-expanded", "false"); nav.classList.remove("open"); b.focus(); } });
  });

  const M = window.Motion;
  if (!M || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const spring = { type: "spring", stiffness: 140, damping: 22, mass: 0.9 };
  const hero = document.querySelector(".hero .wrap, .page-hero .wrap");
  if (hero) {
    const parts = hero.querySelectorAll(".eyebrow, h1, .lede, .actions, .trust, .console, .setup, .crest-stage"); // selector
    parts.forEach((el, i) => M.animate(el, { y: [18, 0] }, { ...spring, delay: 0.05 * i }));
  }
  // Section entrances: cards lift into place as they enter the viewport (transform only).
  // selector
  M.inView(".sec .card, .sec .steps li, .service li, .ledger li, .class-table > li", (el) => {
    M.animate(el, { y: [14, 0] }, spring);
  }, { margin: "0px 0px -8% 0px" });
})();
