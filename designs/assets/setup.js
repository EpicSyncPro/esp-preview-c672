// Direction B: the version -> class -> spec selector. All words and the plan matching come from the
// data-json the build writes from content.json; this file only re-renders the spec pills and result.
(() => {
  const M = window.Motion, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-setup]").forEach((box) => {
    const D = JSON.parse(box.dataset.json);
    const specsEl = box.querySelector("[data-specs]"), status = box.querySelector("[data-status]");
    const plan = box.querySelector("[data-plan]"), link = box.querySelector("[data-plan-link]");
    const pricing = box.dataset.pricing;
    const val = (n) => (box.querySelector(`input[name="${n}"]:checked`) || {}).value;
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const pill = (name, v, checked) => { const l = el("label", "pill"), i = el("input"); i.type = "radio"; i.name = name; i.value = v; i.checked = checked; l.append(i, el("span", "", v)); return l; };

    const renderSpecs = () => {
      const c = D.classes.find((x) => x.id === val("cls")), keep = val("spec");
      specsEl.replaceChildren(...c.specs.map((s, i) => pill("spec", s, keep ? s === keep : i === 0)));
      if (!val("spec")) specsEl.querySelector("input").checked = true;
    };
    const renderResult = () => {
      const ver = val("ver"), cls = val("cls"), spec = val("spec");
      const kind = ver === "midnight" ? D.midnight[cls][spec] : "review";
      const p = D.plans[kind];
      status.classList.toggle("ok", !!p); status.classList.toggle("review", !p);
      status.textContent = p ? D.text.supported : kind === "support" ? D.text.support : D.text.review;
      plan.hidden = !p; link.hidden = !p;
      if (p) {
        plan.querySelector(".r-name").textContent = p.name;
        const pr = plan.querySelector(".r-price"); pr.textContent = p.price + " ";
        if (p.alt) pr.append(el("span", "", p.alt));
        link.href = `${pricing}#plan-${kind}`;
        if (M && !reduce) M.animate(plan, { y: [8, 0], scale: [0.98, 1] }, { type: "spring", stiffness: 260, damping: 20 });
      }
    };
    const applyVersion = () => {
      const nineOnly = val("ver") !== "midnight";
      box.querySelectorAll('input[name="cls"]').forEach((i) => { i.disabled = nineOnly && !D.nine.includes(i.value); });
      const cur = box.querySelector('input[name="cls"]:checked');
      if (cur && cur.disabled) box.querySelector('input[name="cls"]:not(:disabled)').checked = true; // selector
    };
    box.addEventListener("change", (e) => {
      if (e.target.name === "ver") { applyVersion(); renderSpecs(); }
      if (e.target.name === "cls") { specsEl.querySelectorAll("input").forEach((i) => { i.checked = false; }); renderSpecs(); }
      renderResult();
    });
  });
})();
