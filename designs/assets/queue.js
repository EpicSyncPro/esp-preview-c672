// Direction A: the cast-queue console. Steps advance on a global-cooldown timer; pause, step and keyboard
// arrows inspect each press. Copy lives in the HTML; this file only switches states. Reduced motion: paused,
// and the GCD bar stays still even after Play. Focus inside the console pauses it; reasons are announced only
// while someone is stepping, never on the timer.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const M = window.Motion;
  const GCD = 2600;
  document.querySelectorAll("[data-queue]").forEach((box) => {
    const btns = [...box.querySelectorAll("[data-q]")], whys = [...box.querySelectorAll("[data-why]")];
    const play = box.querySelector("[data-q-play]"), bar = box.querySelector(".gcd span"), live = box.querySelector(".why");
    const sense = [...document.querySelectorAll(".sees [data-sense]")];
    const labels = { on: play.textContent, off: "Play" };
    let at = 0, timer = 0, running = !reduce;
    const go = (n) => {
      at = (n + btns.length) % btns.length;
      btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === at)));
      whys.forEach((w, i) => { w.hidden = i !== at; });
      // the matching "what the engine sees" card lights with each step (proc, burst, roles, APM)
      sense.forEach((s, i) => s.classList.toggle("lit", i === at));
      tick();
    };
    const tick = () => {
      clearTimeout(timer);
      if (bar) bar.getAnimations().forEach((a) => a.cancel());
      if (!running) return;
      if (bar && !reduce) bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: GCD, easing: "linear", fill: "forwards" });
      timer = setTimeout(() => go(at + 1), GCD);
    };
    const setRun = (on) => { running = on; live.setAttribute("aria-live", on ? "off" : "polite"); play.setAttribute("aria-pressed", String(!on)); play.textContent = on ? labels.on : labels.off; tick(); };
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-q")) { setRun(false); go(+b.dataset.q); }
      else if (b.hasAttribute("data-q-next")) { setRun(false); go(at + 1); }
      else if (b.hasAttribute("data-q-prev")) { setRun(false); go(at - 1); }
      else if (b.hasAttribute("data-q-play")) setRun(!running);
    });
    box.addEventListener("focusin", () => { if (running) setRun(false); });
    box.addEventListener("keydown", (e) => {
      if (!e.target.hasAttribute("data-q")) return; // arrows step the queue only from a queue choice
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); setRun(false); go(at + 1); btns[at].focus(); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); setRun(false); go(at - 1); btns[at].focus(); }
    });
    // pause while off screen or hidden, so the timer never runs unseen
    new IntersectionObserver(([en]) => { if (!en.isIntersecting) clearTimeout(timer); else tick(); }).observe(box);
    document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(timer); else tick(); });
    live.setAttribute("aria-live", running ? "off" : "polite");
    if (!running) { play.textContent = labels.off; play.setAttribute("aria-pressed", "true"); }
    go(0);
  });
})();
