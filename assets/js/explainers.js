// Najih Explainers — seekable animated lessons rendered in SVG (no video files; works on slow connections).
// Layout guarantees no overlap: [plot] [side panel: formula + live values + legend], captions in their own band below.
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (p) => p * p * (3 - 2 * p);
  const lerp = (a, b, p) => a + (b - a) * p;
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };

  const EXPLAINERS = {
    "secant-tangent": {
      duration: 46,
      title: { ar: "من القاطع إلى المماس", en: "From secant to tangent" },
      chapters: [
        { t: 0, ar: "المنحنى", en: "The curve" }, { t: 8, ar: "القاطع", en: "The secant" },
        { t: 14, ar: "النهاية", en: "The limit" }, { t: 27, ar: "المماس", en: "The tangent" }, { t: 33, ar: "المشتقة", en: "The derivative" },
      ],
      cues: [
        { t: 0, ar: "هذا منحنى $y = x^2$. سؤالنا: ما مدى انحداره عند نقطة واحدة؟", en: "This is the curve $y = x^2$. Our question: how steep is it at a single point?",
          sar: "هذا منحنى صاد يساوي سين تربيع. سؤالنا: ما مدى انحداره عند نقطة واحدة؟", sen: "This is the curve y equals x squared. Our question: how steep is it at a single point?" },
        { t: 4, ar: "لنأخذ النقطة $P(1, 1)$. المنحنى لا يملك ميلاً واحداً؛ انحداره يتغيّر من نقطة لأخرى.", en: "Take the point $P(1, 1)$. A curve has no single slope — its steepness changes from point to point.",
          sar: "لنأخذ النقطة أ. المنحنى لا يملك ميلاً واحداً، فانحداره يتغيّر من نقطة لأخرى.", sen: "Take the point P. A curve has no single slope. Its steepness changes from point to point." },
        { t: 8, ar: "نختار نقطة ثانية $Q$ تبعد مسافة $h$، ونصل بينهما بقاطع ميله $\\frac{f(1+h)-f(1)}{h}$.", en: "Pick a second point $Q$, a distance $h$ away, and join them with a secant of slope $\\frac{f(1+h)-f(1)}{h}$.",
          sar: "نختار نقطة ثانية ب تبعد مسافة هاء، ونصل بينهما بخط قاطع.", sen: "Pick a second point Q, a distance h away, and join them with a secant line." },
        { t: 14, ar: "الآن نقرّب $Q$ من $P$. كلما صغرت $h$ اقترب ميل القاطع من $2$.", en: "Now slide $Q$ towards $P$. As $h$ shrinks, the secant's slope gets closer and closer to $2$.",
          sar: "الآن نقرّب ب من أ. كلما صغرت هاء اقترب ميل القاطع من اثنين.", sen: "Now slide Q towards P. As h shrinks, the slope of the secant gets closer and closer to two." },
        { t: 21, ar: "لا تصل $h$ إلى الصفر أبداً، لكننا نعرف تماماً إلى أين يتجه الميل. هذه هي النهاية.", en: "$h$ never actually reaches zero — but we know exactly where the slope is heading. That is a limit.",
          sar: "لا تصل هاء إلى الصفر أبداً، لكننا نعرف تماماً إلى أين يتجه الميل. هذه هي النهاية.", sen: "h never actually reaches zero, but we know exactly where the slope is heading. That is a limit." },
        { t: 27, ar: "في النهاية يصبح القاطع مماساً، وميله هو المشتقة: $f'(1) = 2$.", en: "In the limit the secant becomes the tangent, and its slope is the derivative: $f'(1) = 2$.",
          sar: "في النهاية يصبح القاطع مماساً، وميله هو المشتقة عند واحد، ويساوي اثنين.", sen: "In the limit the secant becomes the tangent, and its slope is the derivative. f prime of one equals two." },
        { t: 33, ar: "كرّر ذلك عند كل نقطة فتحصل على اقتران جديد: $f'(x) = 2x$.", en: "Do this at every point and you get a brand-new function: $f'(x) = 2x$.",
          sar: "كرّر ذلك عند كل نقطة فتحصل على اقتران جديد: قاف شرطة سين يساوي اثنين سين.", sen: "Do this at every point and you get a brand new function: f prime of x equals two x." },
        { t: 42, ar: "التالي: جرّب بنفسك، ثم تعلّم قواعد الاشتقاق.", en: "Next: try it yourself, then learn the rules of differentiation.",
          sar: "التالي: جرّب بنفسك، ثم تعلّم قواعد الاشتقاق.", sen: "Next: try it yourself, then learn the rules of differentiation." },
      ],
      mount(svg, panel, X) {
        const W = 420, H = 300, sx = (x) => 34 + ((x + 2.4) / 5.9) * (W - 52), sy = (y) => H - 30 - ((y + 0.6) / 10.2) * (H - 48);
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        const defs = el("defs", {}, svg);
        const cp = el("clipPath", { id: "ex-clip" }, defs); el("rect", { x: 0, y: 0, width: W, height: H }, cp);
        const grid = el("g", { class: "ex-grid" }, svg);
        for (let x = -2; x <= 3; x++) el("line", { x1: sx(x), x2: sx(x), y1: 8, y2: H - 22 }, grid);
        for (let y = 0; y <= 9; y += 1) el("line", { x1: 20, x2: W - 10, y1: sy(y), y2: sy(y) }, grid);
        const axes = el("g", { class: "ex-axes" }, svg);
        el("line", { x1: 20, x2: W - 10, y1: sy(0), y2: sy(0) }, axes); el("line", { x1: sx(0), x2: sx(0), y1: 8, y2: H - 22 }, axes);
        for (let x = -2; x <= 3; x++) if (x) { const tx = el("text", { x: sx(x), y: sy(0) + 16, class: "ex-tick" }, axes); tx.textContent = X.num(x); }
        const xl = el("text", { x: W - 12, y: sy(0) - 6, class: "ex-axl", "text-anchor": "end" }, axes); xl.textContent = X.ar ? "س" : "x";
        const yl = el("text", { x: sx(0) + 6, y: 18, class: "ex-axl" }, axes); yl.textContent = X.ar ? "ص" : "y";
        const d = Array.from({ length: 121 }, (_, i) => { const x = -2.4 + (i / 120) * 5.6; return `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(x * x).toFixed(1)}`; }).join("");
        const curve = el("path", { d, class: "ex-curve", pathLength: 1, "stroke-dasharray": 1 }, svg);
        const lines = el("g", { "clip-path": "url(#ex-clip)" }, svg);
        const run = el("line", { class: "ex-guide" }, lines), rise = el("line", { class: "ex-guide" }, lines);
        const sec = el("line", { class: "ex-secant" }, lines);
        const P = el("circle", { r: 6, class: "ex-p" }, svg), Q = el("circle", { r: 5.5, class: "ex-q" }, svg);
        const label = (cls) => el("text", { class: "ex-lab " + cls }, svg);
        const lp = label("lp"), lq = label("lq"), lh = label("lh");
        const names = X.ar ? { P: "أ", Q: "ب", h: "هـ" } : { P: "P", Q: "Q", h: "h" };
        panel.innerHTML = `<p class="exp-ch"></p>
          <div class="exp-formula" data-math="${X.ar ? "ar" : ""}"></div>
          <dl class="exp-vals"><div><dt class="v1l"></dt><dd class="v1"></dd></div><div><dt class="v2l"></dt><dd class="v2"></dd></div></dl>
          <ul class="exp-legend"><li><i class="lg-c"></i>${X.ar ? "المنحنى" : "Curve"}</li><li><i class="lg-s"></i>${X.ar ? "القاطع" : "Secant"}</li><li><i class="lg-t"></i>${X.ar ? "المماس" : "Tangent"}</li></ul>`;
        const $ = (s) => panel.querySelector(s);
        const lineThrough = (node, a, b, m, span = 4) => {
          node.setAttribute("x1", sx(a - span)); node.setAttribute("y1", sy(b - m * span));
          node.setAttribute("x2", sx(a + span)); node.setAttribute("y2", sy(b + m * span));
        };
        const last = {};
        const setHTML = (k, node, html) => { if (last[k] !== html) { node.innerHTML = html; last[k] = html; } };
        const setText = (node, txt, x, y, op) => { node.textContent = txt; node.setAttribute("x", x); node.setAttribute("y", y); node.style.opacity = op; };
        return (t) => {
          svg.style.setProperty("--axes", seg(t, 0, 1));
          curve.setAttribute("stroke-dashoffset", 1 - ease(seg(t, 0.4, 4)));
          let a = 1;
          if (t > 33) a = t < 37.5 ? lerp(1, -1.5, ease(seg(t, 33.5, 37.5))) : lerp(-1.5, 2.2, ease(seg(t, 38, 42)));
          const pA = ease(seg(t, 4, 5));
          P.setAttribute("cx", sx(a)); P.setAttribute("cy", sy(a * a)); P.setAttribute("r", 6 * pA);
          // P label sits up-and-outward from the curve (left of the point on the right branch, right of it on the left branch)
          const outward = a >= 0 ? -1 : 1;
          setText(lp, t < 33 ? (X.ar ? "أ(١، ١)" : "P(1, 1)") : names.P, sx(a) + outward * 12, sy(a * a) - 2, pA);
          lp.setAttribute("text-anchor", outward < 0 ? "end" : "start");
          const h = t < 14 ? 2 : lerp(2, 0.02, ease(seg(t, 14, 26)));
          const qOn = ease(seg(t, 8, 9)) * (1 - ease(seg(t, 27, 28.5)));
          const qx = 1 + h, qy = qx * qx;
          Q.setAttribute("cx", sx(qx)); Q.setAttribute("cy", sy(qy)); Q.setAttribute("r", 5.5 * qOn);
          setText(lq, names.Q, sx(qx) + 10, sy(qy) + 4, qOn * (h > 0.25 ? 1 : 0)); lq.setAttribute("text-anchor", "start");
          const mSec = (qy - 1) / h;
          const secOn = ease(seg(t, 9.5, 11)), tangentMode = t >= 27, m = tangentMode ? 2 * a : mSec;
          lineThrough(sec, tangentMode ? a : 1, tangentMode ? a * a : 1, m, 3.4 * Math.max(secOn, 0.001));
          sec.style.opacity = secOn; sec.classList.toggle("is-tangent", tangentMode);
          const gOn = ease(seg(t, 10.5, 12)) * (1 - ease(seg(t, 22, 25)));
          run.setAttribute("x1", sx(1)); run.setAttribute("y1", sy(1)); run.setAttribute("x2", sx(qx)); run.setAttribute("y2", sy(1));
          rise.setAttribute("x1", sx(qx)); rise.setAttribute("y1", sy(1)); rise.setAttribute("x2", sx(qx)); rise.setAttribute("y2", sy(qy));
          run.style.opacity = rise.style.opacity = gOn;
          setText(lh, names.h, sx(1 + h / 2), sy(1) + 15, gOn * (h > 0.5 ? 1 : 0)); lh.setAttribute("text-anchor", "middle");
          // side panel
          const ch = X.chapters.reduce((acc, c, k) => (c.t <= t ? k : acc), 0);
          setHTML("ch", $(".exp-ch"), X.L(X.chapters[ch]));
          const ftex = t < 10 ? "y = x^2" : t < 27 ? "m = \\frac{f(1+h)-f(1)}{h} = 2 + h" : t < 33 ? "f'(1) = \\lim_{h\\to0}\\frac{f(1+h)-f(1)}{h} = 2" : t < 42 ? "f'(x) = 2x" : "\\dv{}{x}\\,x^2 = 2x";
          setHTML("f", $(".exp-formula"), X.tex(ftex, true));
          $(".exp-formula").classList.toggle("final", t >= 42);
          const showH = t < 33;
          setHTML("v1l", $(".v1l"), showH ? (X.ar ? "هـ" : "h") : (X.ar ? "س" : "x"));
          setHTML("v2l", $(".v2l"), X.ar ? (showH && t < 27 ? "ميل القاطع" : "ميل المماس") : (showH && t < 27 ? "secant slope" : "tangent slope"));
          setHTML("v1", $(".v1"), t < 9 ? "—" : X.num(showH ? h : a, 2));
          setHTML("v2", $(".v2"), t < 9 ? "—" : X.num(showH ? (t < 27 ? mSec : 2) : 2 * a, 2));
        };
      },
    },
  };

  // ─────────────── Player ───────────────
  function VideoPlayer(host, id, o = {}) {
    const X = EXPLAINERS[id], lang = o.lang || "ar", ar = lang === "ar", I = window.icon;
    const L = (c) => c[lang] ?? c.en;
    const T = (a, e) => (ar ? a : e);
    const loc = ar ? "ar-PS" : "en-GB";
    const ctx = {
      ar, L, chapters: X.chapters,
      num: (v, d = 0) => Number(v).toLocaleString(loc, { useGrouping: false, minimumFractionDigits: d, maximumFractionDigits: d }),
      tex: (s, display) => window.NajihMath ? window.NajihMath.render(s, { display, ar }) : s,
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    host.innerHTML = `<div class="vp ${o.compact ? "compact" : ""}" data-playing="false" data-math="${ar ? "ar" : ""}">
      <div class="vp-stage">
        <div class="vp-plot" dir="ltr"><svg class="ex" role="img" aria-label="${L(X.title)}"></svg>
          <button class="vp-big" aria-label="${T("تشغيل", "Play")}">${I("play")}</button></div>
        <aside class="vp-panel" dir="${ar ? "rtl" : "ltr"}"></aside>
      </div>
      <div class="vp-cap" dir="${ar ? "rtl" : "ltr"}" aria-live="polite"></div>
      <div class="vp-ctrl" dir="ltr">
        <button class="vp-btn vp-play" aria-label="${T("تشغيل", "Play")}">${I("play")}</button>
        <span class="vp-time">0:00</span>
        <div class="vp-scrub"><div class="vp-chap">${X.chapters.map((c) => `<i style="left:${(c.t / X.duration) * 100}%" title="${L(c)}"></i>`).join("")}</div>
          <input type="range" min="0" max="${X.duration}" step="0.05" value="0" aria-label="${T("موضع التشغيل", "Seek")}"></div>
        <span class="vp-time vp-dur">${mmss(X.duration)}</span>
        <button class="vp-btn vp-rate" aria-label="${T("السرعة", "Speed")}">1×</button>
        <button class="vp-btn vp-cc" aria-pressed="true" aria-label="${T("الترجمة", "Captions")}">CC</button>
        <button class="vp-btn vp-voice" aria-pressed="false" aria-label="${T("التعليق الصوتي", "Narration")}">${I("volume")}</button>
      </div>
      <div class="vp-chapters" dir="${ar ? "rtl" : "ltr"}">${X.chapters.map((c, i) => `<button data-t="${c.t}"><span>${ctx.num(i + 1)}</span>${L(c)}</button>`).join("")}</div>
    </div>`;
    const root = host.querySelector(".vp"), svg = root.querySelector("svg"), panel = root.querySelector(".vp-panel");
    const cap = root.querySelector(".vp-cap"), range = root.querySelector('input[type="range"]'), time = root.querySelector(".vp-time");
    const playBtn = root.querySelector(".vp-play"), big = root.querySelector(".vp-big"), rateBtn = root.querySelector(".vp-rate");
    const ccBtn = root.querySelector(".vp-cc"), voiceBtn = root.querySelector(".vp-voice"), chapBtns = [...root.querySelectorAll(".vp-chapters button")];
    const render = X.mount(svg, panel, ctx);
    let t = 0, playing = false, rate = 1, raf = 0, prev = 0, cueIdx = -1, cc = true, voice = false;
    const synth = window.speechSynthesis;
    if (!synth) voiceBtn.disabled = true;
    function mmss(s) { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
    function speak(c) {
      if (!voice || !synth || !c) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(ar ? c.sar : c.sen);
      const v = synth.getVoices().find((x) => x.lang?.toLowerCase().startsWith(lang)); if (v) u.voice = v;
      u.lang = ar ? "ar-SA" : "en-GB"; u.rate = rate; synth.speak(u);
    }
    function draw() {
      render(t);
      range.value = t; range.style.setProperty("--p", (t / X.duration) * 100 + "%");
      time.textContent = mmss(t);
      const i = X.cues.reduce((acc, c, k) => (c.t <= t ? k : acc), 0);
      if (i !== cueIdx) {
        cueIdx = i;
        cap.innerHTML = `<p>${L(X.cues[i])}</p>`;
        window.NajihMath?.renderIn(cap);
        if (playing) speak(X.cues[i]);
      }
      cap.classList.toggle("off", !cc);
      const ch = X.chapters.reduce((acc, c, k) => (c.t <= t ? k : acc), 0);
      chapBtns.forEach((b, k) => b.classList.toggle("on", k === ch));
    }
    function loop(now) {
      if (!root.isConnected) { stop(); return; }
      const dt = Math.min(0.1, (now - prev) / 1000); prev = now;
      t += dt * rate;
      if (t >= X.duration) {
        if (o.loop) { t = 0; cueIdx = -1; } else { t = X.duration; draw(); pause(); o.onEnd?.(); return; }
      }
      draw(); raf = requestAnimationFrame(loop);
    }
    function play() {
      if (t >= X.duration) { t = 0; cueIdx = -1; }
      playing = true; root.dataset.playing = "true"; prev = performance.now();
      playBtn.innerHTML = I("pause"); playBtn.setAttribute("aria-label", T("إيقاف مؤقت", "Pause"));
      if (voice) speak(X.cues[Math.max(0, cueIdx)]);
      raf = requestAnimationFrame(loop);
    }
    function pause() {
      playing = false; root.dataset.playing = "false"; cancelAnimationFrame(raf); synth?.cancel();
      playBtn.innerHTML = I("play"); playBtn.setAttribute("aria-label", T("تشغيل", "Play"));
    }
    function stop() { cancelAnimationFrame(raf); synth?.cancel(); }
    const toggle = () => (playing ? pause() : play());
    playBtn.onclick = toggle; big.onclick = play;
    svg.addEventListener("click", toggle);
    range.addEventListener("input", () => { t = +range.value; cueIdx = -1; draw(); });
    rateBtn.onclick = () => { rate = rate === 1 ? 1.5 : rate === 1.5 ? 0.75 : 1; rateBtn.textContent = `${rate}×`; };
    ccBtn.onclick = () => { cc = !cc; ccBtn.setAttribute("aria-pressed", cc); draw(); };
    voiceBtn.onclick = () => { voice = !voice; voiceBtn.setAttribute("aria-pressed", voice); if (voice && playing) speak(X.cues[cueIdx]); else synth?.cancel(); };
    chapBtns.forEach((b) => (b.onclick = () => { t = +b.dataset.t; cueIdx = -1; draw(); if (!playing) play(); }));
    root.addEventListener("keydown", (e) => { if (e.key === " " && !e.target.matches("button, input")) { e.preventDefault(); toggle(); } });
    draw();
    if (o.autoplay && !reduce) play();
    return { play, pause, stop, get t() { return t; } };
  }

  window.EXPLAINERS = EXPLAINERS;
  window.VideoPlayer = VideoPlayer;
})();
