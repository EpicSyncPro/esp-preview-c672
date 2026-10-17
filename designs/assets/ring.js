// Direction C: the crest leans gently toward the pointer (spring, transform only). Reduced motion or
// coarse pointers: still. The conic ring itself is CSS and stops under reduced motion.
(() => {
  const stage = document.querySelector("[data-tilt]"), M = window.Motion;
  if (!stage || !M || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(pointer: fine)").matches) return;
  const img = stage.querySelector("img");
  let raf = 0;
  const area = stage.closest("section") || stage;  // only the hero reacts, not the whole window
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  area.addEventListener("pointermove", (e) => {
    if (still.matches) return;  // a preference change mid-visit is honoured
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const b = stage.getBoundingClientRect();
      const a = area.getBoundingClientRect();
      const x = (e.clientX - (b.left + b.width / 2)) / a.width, y = (e.clientY - (b.top + b.height / 2)) / a.height;
      M.animate(img, { x: x * 14, y: y * 14, rotate: x * 3 }, { type: "spring", stiffness: 80, damping: 18 });
    });
  }, { passive: true });
})();
