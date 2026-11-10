(() => {
  "use strict";
  const CFG = window.NAJIH_CONFIG, I = window.icon;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DAY = 864e5;
  const today = () => new Date(new Date().toDateString()).getTime();
  const dkey = (t) => new Date(t).toDateString();

  // ───────────────────────── Store (browser only, fails soft) ─────────────────────────
  const KEY = "najih:v2";
  const defaults = () => ({ lang: "ar", profile: null, mastery: {}, xp: 0, streak: { count: 0, last: 0 }, done: [], activity: {}, signups: [] });
  let S = defaults();
  try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };

  // ───────────────────────── i18n ─────────────────────────
  const T = (k) => window.I18N[S.lang]?.[k] ?? k;
  const L = (o) => (o ? o[S.lang] ?? o.en : "");
  const loc = () => (S.lang === "ar" ? "ar-PS" : "en-GB");
  const num = (n, o = {}) => Number(n).toLocaleString(loc(), { useGrouping: false, maximumFractionDigits: 2, ...o });
  const fmtDate = (t, o = { day: "numeric", month: "long", year: "numeric" }) => new Date(t).toLocaleDateString(loc(), o);
  const normDigits = (s) => String(s).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٫,]/g, ".").replace(/[−–]/g, "-");
  const renderMath = (root) => {
    if (!window.renderMathInElement || !root) return;
    window.renderMathInElement(root, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }], ignoredClasses: ["katex", "no-math"], throwOnError: false });
  };
  let mathQueued = false;
  new MutationObserver(() => {
    if (mathQueued) return; mathQueued = true;
    requestAnimationFrame(() => { mathQueued = false; renderMath(document.getElementById("app")); });
  }).observe(document.getElementById("app"), { childList: true, subtree: true });
  const SUBJ = window.SUBJECTS, subjName = (s) => L(SUBJ[s].name);
  const branchOf = (id) => window.BRANCHES.find((b) => b.id === id);

  function applyLang() {
    const h = document.documentElement;
    h.lang = S.lang; h.dir = S.lang === "ar" ? "rtl" : "ltr";
    document.title = `${T("brand")} — ${T("tagline")}`;
    $$("[data-t]").forEach((el) => (el.textContent = T(el.dataset.t)));
    const cta = $("#top-cta");
    cta.href = S.profile ? "#/dashboard" : "#/start";
    cta.textContent = S.profile ? T("my_plan") : T("start_free");
  }

  // ───────────────────────── Learning model ─────────────────────────
  const mkey = (q) => `${q.subject}:${q.skill}`;
  function logActivity() {
    const d = today(), k = dkey(d);
    S.activity[k] = (S.activity[k] || 0) + 1;
    if (S.streak.last !== d) { S.streak.count = S.streak.last === d - DAY ? S.streak.count + 1 : 1; S.streak.last = d; }
  }
  function record(q, correct) {
    const m = S.mastery[mkey(q)] || { m: 0.2, n: 0, iv: 0, next: 0 };
    m.m = +(m.m + 0.35 * ((correct ? 1 : 0) - m.m)).toFixed(3);
    m.n++;
    m.iv = correct ? Math.min(30, Math.max(1, m.iv * 2)) : 1; // spaced-review interval in days
    m.next = today() + m.iv * DAY;
    S.mastery[mkey(q)] = m;
    S.xp += correct ? 10 : 2;
    logActivity(); save();
  }
  function subjectMastery(s) {
    const v = Object.entries(S.mastery).filter(([k]) => k.startsWith(s + ":")).map(([, x]) => x.m);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  }
  function dailyPlan() {
    const p = S.profile; if (!p) return [];
    const subjects = branchOf(p.branch).subjects;
    const score = (s) => (subjectMastery(s) ?? 0.2) - (p.weak.includes(s) ? 0.5 : 0);
    const order = [...subjects].sort((a, b) => score(a) - score(b));
    const items = []; let mins = 0;
    for (const [k] of Object.entries(S.mastery).filter(([k, v]) => v.next <= today() && subjects.includes(k.split(":")[0])).slice(0, 2)) {
      const s = k.split(":")[0];
      if (!items.some((i) => i.subject === s)) { items.push({ kind: "review", subject: s, minutes: 4, href: `#/practice/${s}` }); mins += 4; }
    }
    for (const s of order) {
      if (mins >= p.minutes) break;
      if (items.some((i) => i.subject === s)) continue;
      const lesson = window.LESSONS.find((l) => l.subject === s && !S.done.includes(l.id));
      if (lesson) { items.push({ kind: "lesson", subject: s, lesson, minutes: lesson.minutes, href: `#/lesson/${lesson.id}` }); mins += lesson.minutes; }
      else if (window.QUESTIONS.some((q) => q.subject === s) && (subjectMastery(s) ?? 0) < 0.85) { items.push({ kind: "practice", subject: s, minutes: 5, href: `#/practice/${s}` }); mins += 5; }
    }
    return items;
  }
  const itemTitle = (it) => (it.kind === "lesson" ? L(it.lesson.title) : `${T("k_" + it.kind)} · ${subjName(it.subject)}`);

  // ───────────────────────── UI atoms ─────────────────────────
  const mark = (cls = "") => `<svg class="mark ${cls}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--brand)"/><g fill="var(--on-brand)"><path d="M16 6l3 3-3 3-3-3zM16 20l3 3-3 3-3-3zM9 13l3 3-3 3-3-3zM23 13l3 3-3 3-3-3z"/><path d="M16 13.2l2.8 2.8-2.8 2.8-2.8-2.8z" opacity=".55"/></g></svg>`;
  const tile = (s, size = "") => `<span class="s-tile ${size}" style="--c:${SUBJ[s].color}">${I(SUBJ[s].icon)}</span>`;
  const tag = (s) => `<span class="s-tag" style="--c:${SUBJ[s].color}">${I(SUBJ[s].icon)}${esc(subjName(s))}</span>`;
  const bar = (v, c) => `<span class="meter" style="--c:${c || "var(--brand)"}"><span style="width:${Math.round((v ?? 0) * 100)}%"></span></span>`;
  const meta = (...parts) => `<span class="meta">${parts.filter(Boolean).map((p) => `<span>${p}</span>`).join("")}</span>`;
  const app = () => $("#app");
  const bookFor = (s) => Object.keys(window.BOOKS || {}).find((k) => window.BOOKS[k].subject === s);
  const focusMode = (on) => document.body.classList.toggle("focus-mode", on);
  const waLink = (text) => `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  const fbLink = () => `https://m.me/${encodeURIComponent(CFG.facebookPage)}?ref=signup`;

  // ───────────────────────── Lesson player ─────────────────────────
  function Player({ title, subject, segments, exit }) {
    focusMode(true);
    app().innerHTML = `
      <div class="player">
        <header class="player-top">
          <a class="icon-btn" href="${exit}" aria-label="${T("exit")}" data-exit>${I("x")}</a>
          <div class="segments" aria-hidden="true">${"<span><i></i></span>".repeat(segments)}</div>
          ${tag(subject)}
        </header>
        <div class="player-main"><div class="player-inner">
          <p class="eyebrow">${esc(title)}</p>
          <h1 class="step-title"></h1>
          <div class="step-body"></div>
          <div class="coach" aria-live="polite"></div>
        </div></div>
        <footer class="player-bar" data-state="idle">
          <div class="bar-inner">
            <div class="bar-fb" aria-live="assertive"></div>
            <div class="bar-actions">
              <button class="btn quiet b-hint" hidden>${I("bulb")}<span>${T("hint")}</span></button>
              <button class="btn primary b-main"></button>
            </div>
          </div>
        </footer>
      </div>`;
    const P = { body: $(".step-body"), titleEl: $(".step-title"), coach: $(".coach"), barEl: $(".player-bar"), main: $(".b-main"), hintBtn: $(".b-hint"), fb: $(".bar-fb"), exit };
    P.progress = (i, part = 0) => $$(".segments span").forEach((s, k) => { $("i", s).style.width = (k < i ? 100 : k === i ? Math.max(6, part * 100) : 0) + "%"; });
    P.step = (t) => { P.titleEl.innerHTML = t || ""; P.body.innerHTML = ""; P.coach.innerHTML = ""; window.scrollTo(0, 0); };
    P.set = ({ state = "idle", fb = null, hint = null, label, disabled = false, onMain }) => {
      P.barEl.dataset.state = state;
      P.fb.innerHTML = fb ? `<span class="fb-ic">${I(state === "good" ? "check" : state === "bad" ? "x" : "bulb")}</span><div><b>${fb.title}</b>${fb.body ? `<p>${fb.body}</p>` : ""}</div>` : "";
      P.hintBtn.hidden = !hint; P.hintBtn.onclick = hint;
      P.main.textContent = label; P.main.disabled = disabled; P.main.onclick = onMain;
    };
    P.say = (html) => P.coach.insertAdjacentHTML("beforeend", `<div class="coach-msg">${mark("coach-av")}<div class="bubble">${html}</div></div>`);
    return P;
  }

  function askQuestion(q, P, onDone) {
    const mcq = q.type === "mcq";
    P.body.innerHTML = `<div class="stem">${L(q.q)}</div>` + (mcq
      ? `<div class="options" role="radiogroup">${q.choices.map((c, i) => `<button class="option" role="radio" aria-checked="false" data-i="${i}"><kbd>${num(i + 1)}</kbd><span class="o-t">${L(c)}</span><span class="o-m"></span></button>`).join("")}</div><p class="kbd-hint">${T("keys_hint")}</p>`
      : `<input class="num-input" inputmode="decimal" autocomplete="off" dir="ltr" aria-label="${T("your_answer")}" placeholder="${T("your_answer")}">`);
    let attempts = 0, sel = null, done = false, hinted = false;
    const input = $(".num-input", P.body), opts = $$(".option", P.body);
    const has = () => (mcq ? sel !== null : input.value.trim() !== "");
    const hint = () => { if (hinted) return; hinted = true; P.say(L(q.hint)); idle(); };
    const idle = () => P.set({ label: T("check"), disabled: !has(), hint: hinted ? null : hint, onMain: check });
    opts.forEach((b) => b.addEventListener("click", () => {
      if (done || b.disabled) return;
      sel = +b.dataset.i;
      opts.forEach((o) => o.setAttribute("aria-checked", String(o === b)));
      idle();
    }));
    if (input) { input.addEventListener("input", () => { input.classList.remove("is-wrong"); idle(); }); setTimeout(() => input.focus(), 30); }
    function check() {
      if (!has() || done) return;
      const ok = mcq ? sel === q.answer : Math.abs(parseFloat(normDigits(input.value)) - q.answer) <= (q.tol ?? 1e-6);
      attempts++;
      if (ok || attempts >= 2) {
        done = true; record(q, ok && attempts === 1);
        if (mcq) opts.forEach((o, i) => { o.disabled = true; if (i === q.answer) o.classList.add("is-right"); else if (i === sel) o.classList.add("is-wrong"); });
        else { input.disabled = true; input.classList.add(ok ? "is-right" : "is-wrong"); }
        const ans = mcq ? L(q.choices[q.answer]) : num(q.answer);
        P.set({ state: ok ? "good" : "bad", fb: { title: ok ? T("correct_t") : T("incorrect_t"), body: (ok ? "" : `${T("answer_was")} <b>${ans}</b> — `) + L(q.explain) }, label: T("continue"), onMain: () => onDone(ok && attempts === 1) });
        P.main.focus({ preventScroll: true });
      } else {
        if (mcq) { const o = opts[sel]; o.classList.add("is-wrong"); o.disabled = true; o.setAttribute("aria-checked", "false"); sel = null; }
        else input.classList.add("is-wrong");
        P.set({ state: "bad", fb: { title: T("incorrect_t"), body: T("try_again") }, label: T("check"), disabled: true, hint: hinted ? null : hint, onMain: check });
      }
    }
    idle();
  }

  function summary(P, { title, correct, total, xp, again, book }) {
    P.progress(Infinity); P.step("");
    const pct = total ? Math.round((correct / total) * 100) : 100, C = 2 * Math.PI * 52;
    P.body.innerHTML = `<div class="summary">
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="--off:${C * (1 - pct / 100)}"/></svg>
      <div class="ring-ic">${I("check")}</div>
      <h1>${title}</h1>
      <div class="sum-stats"><div><b>${num(pct)}%</b><span>${T("accuracy")}</span></div><div><b>+${num(xp)}</b><span>${T("earned")}</span></div></div>
      <div class="sum-links"><a class="btn secondary" href="${again}">${I("review")}${T("practice_more")}</a>${book ? `<a class="btn secondary" href="#/read/${book}">${I("book")}${T("read_chapter")}</a>` : ""}</div>
    </div>`;
    P.set({ label: S.profile ? T("back_plan") : T("make_plan"), onMain: () => go(S.profile ? "#/dashboard" : "#/start") });
    P.main.focus({ preventScroll: true });
  }

  // ───────────────────────── Interactive widgets ─────────────────────────
  const WIDGETS = {
    tangent(host) {
      const W = 320, H = 220, sx = (x) => ((x + 3.6) / 7.2) * W, sy = (y) => H - 14 - ((y + 0.5) / 10.5) * (H - 24);
      const curve = Array.from({ length: 73 }, (_, i) => { const x = -3.6 + i * 0.1; return `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(x * x).toFixed(1)}`; }).join("");
      const ticks = [-3, -2, -1, 1, 2, 3].map((x) => `<line x1="${sx(x)}" x2="${sx(x)}" y1="${sy(0) - 3}" y2="${sy(0) + 3}" class="tick"/><text x="${sx(x)}" y="${sy(0) + 15}" class="tick-l">${x}</text>`).join("");
      const lab = S.lang === "ar" ? ["س", "ص", "الميل"] : ["x", "y", "slope"];
      host.innerHTML = `<div class="widget" dir="ltr">
        <svg viewBox="0 0 ${W} ${H}" class="plot" role="img" aria-label="y = x², tangent line">
          <line x1="0" x2="${W}" y1="${sy(0)}" y2="${sy(0)}" class="axis"/><line y1="0" y2="${H}" x1="${sx(0)}" x2="${sx(0)}" class="axis"/>${ticks}
          <path d="${curve}" class="curve"/><line class="tan"/>
          <g class="handle" tabindex="0" role="slider" aria-label="${lab[0]}" aria-valuemin="-3" aria-valuemax="3"><circle r="16" class="halo"/><circle r="7" class="pt"/></g>
        </svg>
        <div class="readout"><div><span>${lab[0]}</span><b class="rx"></b></div><div><span>${lab[1]}</span><b class="ry"></b></div><div class="hl"><span>${lab[2]}</span><b class="rs"></b></div></div>
      </div>`;
      const svg = $("svg", host), handle = $(".handle", host), tan = $(".tan", host);
      let a = 1;
      const draw = () => {
        const m = 2 * a, y0 = a * a, x1 = a - 1.6, x2 = a + 1.6;
        handle.setAttribute("transform", `translate(${sx(a)},${sy(y0)})`);
        handle.setAttribute("aria-valuenow", a);
        tan.setAttribute("x1", sx(x1)); tan.setAttribute("y1", sy(y0 + m * (x1 - a)));
        tan.setAttribute("x2", sx(x2)); tan.setAttribute("y2", sy(y0 + m * (x2 - a)));
        $(".rx", host).textContent = num(a); $(".ry", host).textContent = num(y0); $(".rs", host).textContent = num(m);
      };
      const setA = (v) => { a = Math.max(-3, Math.min(3, Math.round(v * 2) / 2)); draw(); };
      const fromEvent = (e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return (p.x / W) * 7.2 - 3.6; };
      let drag = false;
      svg.addEventListener("pointerdown", (e) => { drag = true; svg.setPointerCapture(e.pointerId); setA(fromEvent(e)); handle.focus({ preventScroll: true }); });
      svg.addEventListener("pointermove", (e) => drag && setA(fromEvent(e)));
      svg.addEventListener("pointerup", () => (drag = false));
      handle.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[e.key];
        if (d) { e.preventDefault(); e.stopPropagation(); setA(a + d); }
      });
      draw();
    },
    ohm(host) {
      const lab = S.lang === "ar" ? { V: "فرق الجهد", R: "المقاومة", I: "شدة التيار" } : { V: "Voltage", R: "Resistance", I: "Current" };
      host.innerHTML = `<div class="widget" dir="ltr">
        <div class="ohm">
          <svg viewBox="0 0 320 200" class="circuit" aria-hidden="true">
            <path d="M50 40H270V160H50Z" class="wire"/><path d="M50 40H270V160H50Z" class="flow"/>
            <rect x="120" y="28" width="80" height="24" class="mask"/><path d="M120 40h8l6-10 10 20 10-20 10 20 10-20 10 20 6-10h10" class="comp"/>
            <rect x="36" y="86" width="28" height="28" class="mask"/><path d="M34 94h32M42 106h16" class="comp batt"/>
            <circle cx="270" cy="100" r="17" class="meter-c"/><text x="270" y="105" class="meter-t">A</text>
            <text x="160" y="22" class="c-lab r-lab"></text><text x="18" y="104" class="c-lab v-lab"></text>
          </svg>
          <div class="ohm-read"><span>${lab.I}</span><b class="cur"></b><small>I = V ÷ R</small></div>
        </div>
        <label class="sl-row"><span>${lab.V}</span><input type="range" min="0" max="24" step="1" value="6" class="v"><b class="vv"></b></label>
        <label class="sl-row"><span>${lab.R}</span><input type="range" min="1" max="12" step="1" value="3" class="r"><b class="rv"></b></label>
      </div>`;
      const v = $(".v", host), r = $(".r", host), flow = $(".flow", host);
      const draw = () => {
        const I = v.value / r.value;
        $(".vv", host).textContent = `${v.value} V`; $(".rv", host).textContent = `${r.value} Ω`;
        $(".v-lab", host).textContent = `${v.value}V`; $(".r-lab", host).textContent = `${r.value}Ω`;
        $(".cur", host).textContent = `${I.toFixed(2)} A`;
        flow.style.animationDuration = I > 0 ? `${Math.max(0.25, 4 / I)}s` : "0s";
        flow.style.opacity = I > 0 ? Math.min(1, 0.35 + I / 6) : 0;
      };
      v.addEventListener("input", draw); r.addEventListener("input", draw); draw();
    },
  };

  // ───────────────────────── Views ─────────────────────────
  function subjectRows(b) {
    return b.subjects.map((s) => {
      const nl = window.LESSONS.filter((l) => l.subject === s).length, nq = window.QUESTIONS.filter((q) => q.subject === s).length;
      return `<li>${tile(s)}<div><b>${esc(subjName(s))}</b>${nl || nq ? meta(nl ? `${num(nl)} ${T("lessons_n")}` : "", nq ? `${num(nq)} ${T("questions_n")}` : "") : meta(T("soon"))}</div></li>`;
    }).join("");
  }

  const views = {
    home() {
      const sample = window.LESSONS[0];
      let br = S.profile?.branch || "scientific";
      const pageEx = window.BOOKS.calc.pages[0];
      app().innerHTML = `
      <section class="hero2">
        <div class="wrap hero2-in">
          <p class="kicker">${T("hero_kicker")}</p>
          <h1 class="display">${T("hero_title")}</h1>
          <p class="lead center">${T("hero_sub")}</p>
          <div class="actions center"><a class="btn primary lg" href="#/start">${T("hero_cta")}</a><a class="btn secondary lg" href="#/lesson/${sample.id}">${I("play")}${T("hero_cta2")}</a></div>
        </div>
        <div class="wrap"><div class="stage-frame"><div class="hero-video"></div></div></div>
        <div class="wrap"><ul class="stats">${[["6", "st1"], ["12", "st2"], ["2", "st3"], ["10", "st4"]].map(([n, k]) => `<li><b>${num(n)}</b><span>${T(k)}</span></li>`).join("")}</ul></div>
      </section>

      <section class="wrap feature">
        <div class="f-media"><div class="demo card">
          <div class="demo-head"><span class="pill">${T("demo_label")}</span><b>${T("demo_title")}</b></div>
          <p class="small muted">${T("demo_inst")}</p><div class="w"></div>
          <p class="demo-q">${T("demo_q")}</p>
          <div class="seg" role="radiogroup">${[5, 10, 25].map((v) => `<button class="seg-b" role="radio" aria-checked="false" data-v="${v}">${num(v)}</button>`).join("")}</div>
          <div class="demo-fb" aria-live="polite"></div></div></div>
        <div class="f-copy"><p class="eyebrow">${T("fs_eyebrow")}</p><h2>${T("fs_title")}</h2><p class="muted">${T("fs_text")}</p>
          <ul class="checks">${["fs1", "fs2", "fs3"].map((k) => `<li>${I("check")}${T(k)}</li>`).join("")}</ul>
          <a class="text-link" href="#/lesson/${sample.id}">${T("fs_cta")}${I("arrow", "flip")}</a></div>
      </section>

      <section class="wrap feature rev">
        <div class="f-media"><div class="book-peek" aria-hidden="true"><div class="rd-page mini">${pageEx[S.lang] || pageEx.en}</div></div></div>
        <div class="f-copy"><p class="eyebrow">${T("fr_eyebrow")}</p><h2>${T("fr_title")}</h2><p class="muted">${T("fr_text")}</p>
          <a class="text-link" href="#/read/calc">${T("fr_cta")}${I("arrow", "flip")}</a></div>
      </section>

      <section class="band"><div class="wrap">
        <div class="sec-head center"><p class="eyebrow">${T("nav_learn")}</p><h2>${T("br_title")}</h2><p class="muted">${T("br_sub")}</p></div>
        <div class="tabs center" role="tablist">${window.BRANCHES.map((b) => `<button role="tab" class="tab" data-b="${b.id}" aria-selected="${b.id === br}">${esc(L(b.name).split(" (")[0])}</button>`).join("")}</div>
        <div class="br-panel card" role="tabpanel"></div>
      </div></section>

      <section class="wrap feature">
        <div class="f-media"><div class="frame" aria-hidden="true"><div class="frame-bar"><i></i><i></i><i></i><span>najih.net</span></div><div class="frame-body">
          <p class="eyebrow">${T("up_next")}</p>
          <div class="next-mini">${tile("math")}<div><b>${esc(L(sample.title))}</b>${meta(T("k_lesson"), `${num(sample.minutes)} ${T("min")}`)}</div><span class="btn primary sm">${T("continue")}</span></div>
          <div class="mini-grid">
            <div class="mini"><span class="muted small">${T("exam_on")}</span><b class="big">${num(203)}</b><span class="small muted">${T("days_to_exam")}</span></div>
            <div class="mini"><span class="muted small">${T("mastery")}</span>${["math", "physics", "english"].map((s, i) => `<div class="mrow"><span>${esc(subjName(s))}</span>${bar([0.62, 0.41, 0.78][i], SUBJ[s].color)}</div>`).join("")}</div>
          </div></div></div></div>
        <div class="f-copy"><p class="eyebrow">${T("fp_eyebrow")}</p><h2>${T("p_title")}</h2><p class="muted">${T("p_sub")}</p>
          <ul class="checks">${[1, 2, 3, 4].map((n) => `<li>${I("check")}${T("p" + n)}</li>`).join("")}</ul>
          <a class="btn primary" href="#/start">${T("hero_cta")}</a></div>
      </section>

      <section class="wrap feature rev">
        <div class="f-media"><div class="card tutor-peek" aria-hidden="true">
          <div class="tp-head"><b>${T("ft_class")}</b><span class="badge">${T("soon")}</span></div>
          <table class="tbl"><tbody>${[["ليان", "Layan", 0.82, "math"], ["أحمد", "Ahmad", 0.46, "physics"], ["سارة", "Sara", 0.67, "chemistry"], ["يوسف", "Yousef", 0.38, "math"]].map(([ar, en, m, s]) => `
            <tr><td><span class="avatar">${(S.lang === "ar" ? ar : en)[0]}</span>${S.lang === "ar" ? ar : en}</td><td class="w-meter">${bar(m, m < 0.5 ? "var(--clay)" : "var(--brand)")}</td><td>${tag(s)}</td></tr>`).join("")}</tbody></table>
          <div class="tp-foot"><span class="btn primary sm">${I("pencil")}${T("ft_assign")}</span></div></div></div>
        <div class="f-copy"><p class="eyebrow">${T("ft_eyebrow")}</p><h2>${T("ft_title")}</h2><p class="muted">${T("ft_text")}</p>
          <a class="text-link" href="#/tutors">${T("ft_cta")}${I("arrow", "flip")}</a></div>
      </section>

      <section class="wrap section">
        <div class="sec-head center"><h2>${T("s_title")}</h2></div>
        <div class="grid3">${[["file", "s1", "#/exams"], ["users", "s2", "#/tutors"], ["message", "s3", "#/join"]].map(([ic, k, h]) => `
          <a class="card svc" href="${h}"><span class="svc-ic">${I(ic)}</span><h3>${T(k + "_t")}${k === "s2" ? ` <span class="badge">${T("soon")}</span>` : ""}</h3><p class="muted">${T(k + "_d")}</p><span class="more">${I("arrow", "flip")}</span></a>`).join("")}</div>
      </section>

      <section class="wrap"><div class="cta">
        <div><h2>${T("cta_title")}</h2><p>${T("cta_sub")}</p></div>
        <div class="actions"><a class="btn light" target="_blank" rel="noopener" href="${waLink(T("j_title"))}">${I("message")}${T("via_wa")}</a><a class="btn ghost-light" target="_blank" rel="noopener" href="${fbLink()}">${T("via_fb")}</a><a class="btn ghost-light" href="#/join">${I("phone")}${T("via_phone")}</a></div>
      </div></section>`;

      window.VideoPlayer($(".hero-video"), "secant-tangent", { lang: S.lang, autoplay: true, loop: true });
      WIDGETS.tangent($(".demo .w"));
      $$(".seg-b").forEach((b) => b.addEventListener("click", () => {
        const ok = +b.dataset.v === 10;
        $$(".seg-b").forEach((x) => { x.setAttribute("aria-checked", String(x === b)); x.classList.remove("is-right", "is-wrong"); });
        b.classList.add(ok ? "is-right" : "is-wrong");
        $(".demo-fb").className = "demo-fb " + (ok ? "good" : "bad");
        $(".demo-fb").innerHTML = `${I(ok ? "check" : "bulb")}<span>${ok ? T("demo_ok") : T("demo_no")}${ok ? ` <a href="#/lesson/${sample.id}">${T("demo_more")}</a>` : ""}</span>`;
      }));
      $$(".book-peek .an").forEach((a) => a.classList.add("k-" + pageEx.notes[a.dataset.n].kind));
      const renderBranch = () => {
        const b = branchOf(br);
        $(".br-panel").innerHTML = `<div class="br-head"><h3>${esc(L(b.name))}</h3><a class="btn primary sm" href="#/branch/${b.id}">${T("br_start")}${I("arrow", "flip")}</a></div><ul class="subj-list">${subjectRows(b)}</ul>`;
      };
      $$(".tab").forEach((t) => t.addEventListener("click", () => { br = t.dataset.b; $$(".tab").forEach((x) => x.setAttribute("aria-selected", String(x === t))); renderBranch(); }));
      $(".tabs").addEventListener("keydown", (e) => {
        const tabs = $$(".tab"), i = tabs.indexOf(document.activeElement), dir = document.documentElement.dir === "rtl" ? -1 : 1;
        const d = { ArrowRight: dir, ArrowLeft: -dir }[e.key];
        if (d && i > -1) { const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click(); }
      });
      renderBranch();
    },

    read(bookId, pageArg) {
      const B = window.BOOKS[bookId]; if (!B) return go("#/learn");
      const n = Math.min(B.pages.length, Math.max(1, parseInt(pageArg, 10) || 1)), page = B.pages[n - 1];
      S.notes = S.notes || {}; S.layers = S.layers || { najih: true, mine: true };
      const mine = (S.notes[bookId] = S.notes[bookId] || []);
      const lesson = window.LESSONS.find((l) => l.book === bookId);
      app().innerHTML = `<section class="reader">
        <div class="wrap rd-top">
          <div><a class="back-link" href="#/branch/${S.profile?.branch || "scientific"}">${I("arrow", "back-ic")}${esc(subjName(B.subject))}</a>
            <h1 class="rd-title">${esc(L(B.title))}</h1></div>
          <div class="toggle-group" role="group" aria-label="${T("rd_layers")}">
            <button class="tgl" data-layer="najih" aria-pressed="${S.layers.najih}">${mark("tgl-mark")}${T("rd_najih")}</button>
            <button class="tgl" data-layer="mine" aria-pressed="${S.layers.mine}">${I("highlighter")}${T("rd_mine")}</button>
          </div>
        </div>
        <div class="wrap rd-spread">
          <article class="rd-page" lang="${S.lang}">${page[S.lang] || page.en}<footer class="pg-no">${num(n)}</footer></article>
          <aside class="rd-margin" aria-label="${T("rd_najih")}"></aside>
        </div>
        <p class="wrap rd-hint muted small">${I("highlighter")}${T("rd_hint")}</p>
        <nav class="wrap rd-nav">
          ${n > 1 ? `<a class="btn secondary" href="#/read/${bookId}/${n - 1}">${I("arrow", "back-ic")}${T("rd_prev")}</a>` : "<span></span>"}
          <span class="muted small">${T("rd_page")} ${num(n)} ${T("rd_of")} ${num(B.pages.length)}</span>
          ${n < B.pages.length ? `<a class="btn primary" href="#/read/${bookId}/${n + 1}">${T("rd_next")}${I("arrow", "flip")}</a>` : lesson ? `<a class="btn primary" href="#/lesson/${lesson.id}">${I("play")}${T("rd_lesson")}</a>` : "<span></span>"}
        </nav>
        <div class="sel-bar" hidden><button data-act="hl">${I("highlighter")}${T("rd_highlight")}</button><button data-act="note">${I("note")}${T("rd_note")}</button></div>
        <div class="sheet" hidden role="dialog" aria-modal="false"></div>
      </section>`;
      const root = $(".reader"), pageEl = $(".rd-page"), margin = $(".rd-margin"), bar = $(".sel-bar"), sheet = $(".sheet");
      const applyLayers = () => { root.classList.toggle("hide-najih", !S.layers.najih); root.classList.toggle("hide-mine", !S.layers.mine); };
      $$(".tgl").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.layer; S.layers[k] = !S.layers[k]; b.setAttribute("aria-pressed", S.layers[k]); save(); applyLayers(); layout(); }));
      applyLayers();
      renderMath(pageEl);
      const anchors = $$(".an", pageEl);
      anchors.forEach((a, i) => {
        const nt = page.notes[a.dataset.n];
        a.classList.add("k-" + nt.kind); a.dataset.i = num(i + 1); a.tabIndex = 0; a.setAttribute("role", "button");
        a.setAttribute("aria-label", `${T("rd_najih")} ${i + 1}: ${L(nt)}`);
      });
      margin.innerHTML = anchors.map((a, i) => { const nt = page.notes[a.dataset.n]; return `<div class="mnote k-${nt.kind}" data-n="${a.dataset.n}"><span class="mn-i">${num(i + 1)}</span><p class="hand">${esc(L(nt))}</p></div>`; }).join("");
      const noteEl = (id) => margin.querySelector(`.mnote[data-n="${id}"]`);
      const link = (id, on) => { pageEl.querySelector(`.an[data-n="${id}"]`)?.classList.toggle("lit", on); noteEl(id)?.classList.toggle("lit", on); };
      anchors.forEach((a) => {
        a.addEventListener("mouseenter", () => link(a.dataset.n, true)); a.addEventListener("mouseleave", () => link(a.dataset.n, false));
        const open = () => { if (getComputedStyle(margin).display === "none") openSheet({ najih: page.notes[a.dataset.n] }); else { const m = noteEl(a.dataset.n); m.classList.add("pulse"); setTimeout(() => m.classList.remove("pulse"), 700); } };
        a.addEventListener("click", open); a.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open()));
      });
      $$(".mnote", margin).forEach((m) => { m.addEventListener("mouseenter", () => link(m.dataset.n, true)); m.addEventListener("mouseleave", () => link(m.dataset.n, false)); });
      function layout() {
        if (getComputedStyle(margin).display === "none") return;
        const top0 = pageEl.getBoundingClientRect().top; let floor = 0;
        $$(".mnote", margin).forEach((m) => {
          const a = pageEl.querySelector(`.an[data-n="${m.dataset.n}"]`);
          const y = Math.max(a.getBoundingClientRect().top - top0 - 4, floor);
          m.style.top = y + "px"; floor = y + m.offsetHeight + 14;
        });
        margin.style.minHeight = floor + "px";
      }
      window.__layout = layout;
      // ── personal highlights (stored as text quotes, re-applied on render)
      const wrapQuote = (quote, uid) => {
        const w = document.createTreeWalker(pageEl, NodeFilter.SHOW_TEXT, { acceptNode: (nd) => (nd.parentElement.closest(".katex, .u-hl, .pg-no") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
        let nd; while ((nd = w.nextNode())) {
          const i = nd.data.indexOf(quote); if (i < 0) continue;
          const r = document.createRange(); r.setStart(nd, i); r.setEnd(nd, i + quote.length);
          const m = document.createElement("mark"); m.className = "u-hl"; m.dataset.uid = uid; r.surroundContents(m); return m;
        }
        return null;
      };
      const decorate = (m, item) => { m.classList.toggle("has-note", !!item.note); m.tabIndex = 0; m.title = item.note || ""; };
      mine.filter((x) => x.page === n).forEach((x) => { const m = wrapQuote(x.quote, x.id); if (m) decorate(m, x); });
      let pending = null;
      const hideBar = () => { bar.hidden = true; pending = null; };
      const onSelect = () => setTimeout(() => {
        const sel = getSelection(); if (!sel.rangeCount || sel.isCollapsed) return hideBar();
        const r = sel.getRangeAt(0), txt = r.toString().trim();
        const ok = txt.length > 1 && txt.length < 400 && r.startContainer === r.endContainer && r.startContainer.nodeType === 3 && pageEl.contains(r.startContainer) && !r.startContainer.parentElement.closest(".katex, .u-hl");
        if (!ok) return hideBar();
        pending = r.cloneRange();
        const rc = r.getBoundingClientRect();
        bar.hidden = false;
        bar.style.top = Math.max(8, rc.top - bar.offsetHeight - 10) + "px";
        bar.style.left = Math.min(innerWidth - bar.offsetWidth - 8, Math.max(8, rc.left + rc.width / 2 - bar.offsetWidth / 2)) + "px";
      }, 10);
      pageEl.addEventListener("mouseup", onSelect); pageEl.addEventListener("touchend", onSelect);
      document.addEventListener("selectionchange", () => { if (getSelection().isCollapsed && !bar.matches(":hover")) bar.hidden = true; });
      bar.addEventListener("mousedown", (e) => e.preventDefault());
      bar.addEventListener("click", (e) => {
        const act = e.target.closest("button")?.dataset.act; if (!act || !pending) return;
        const item = { id: "u" + Date.now().toString(36), page: n, quote: pending.toString(), note: "" };
        const m = document.createElement("mark"); m.className = "u-hl"; m.dataset.uid = item.id;
        try { pending.surroundContents(m); } catch (_) { return hideBar(); }
        mine.push(item); save(); decorate(m, item); getSelection().removeAllRanges(); hideBar();
        if (act === "note") openSheet({ item, mark: m });
      });
      pageEl.addEventListener("click", (e) => {
        const m = e.target.closest(".u-hl"); if (!m || !getSelection().isCollapsed) return;
        const item = mine.find((x) => x.id === m.dataset.uid); if (item) openSheet({ item, mark: m });
      });
      function openSheet({ najih, item, mark: m }) {
        sheet.hidden = false;
        if (najih) {
          sheet.innerHTML = `<div class="sheet-h">${window.icon("note")}<b>${T("rd_najih")}</b><button class="icon-btn sh-x" aria-label="${T("exit")}">${I("x")}</button></div><p class="hand big-hand">${esc(L(najih))}</p>`;
        } else {
          sheet.innerHTML = `<div class="sheet-h">${I("highlighter")}<b>${T("rd_mine")}</b><button class="icon-btn sh-x" aria-label="${T("exit")}">${I("x")}</button></div>
            <blockquote class="sh-quote">${esc(item.quote)}</blockquote>
            <textarea class="field" rows="3" placeholder="${T("rd_note_ph")}">${esc(item.note)}</textarea>
            <div class="sheet-a"><button class="btn quiet sm sh-del">${I("trash")}${T("rd_delete")}</button><button class="btn primary sm sh-save">${T("rd_save")}</button></div>`;
          const ta = $("textarea", sheet); ta.focus();
          $(".sh-save", sheet).onclick = () => { item.note = ta.value.trim().slice(0, 500); save(); decorate(m, item); closeSheet(); };
          $(".sh-del", sheet).onclick = () => { mine.splice(mine.indexOf(item), 1); save(); m.replaceWith(...m.childNodes); pageEl.normalize(); closeSheet(); };
        }
        $(".sh-x", sheet).onclick = closeSheet;
        sheet.onkeydown = (e) => e.key === "Escape" && closeSheet();
      }
      function closeSheet() { sheet.hidden = true; sheet.innerHTML = ""; }
      requestAnimationFrame(layout);
      document.fonts?.ready.then(() => window.__layout === layout && layout());
    },

    learn() { views.branch(S.profile?.branch || "scientific"); },

    branch(id) {
      const b = branchOf(id); if (!b) return go("#/learn");
      app().innerHTML = `<section class="wrap section">
        <p class="eyebrow">${T("nav_learn")}</p><h1>${esc(L(b.name))}</h1>
        <nav class="chips" aria-label="${T("f_branch")}">${window.BRANCHES.map((x) => `<a class="chip" href="#/branch/${x.id}" ${x.id === id ? 'aria-current="page"' : ""}>${esc(L(x.name).split(" (")[0])}</a>`).join("")}</nav>
        <div class="grid3 subjects">${b.subjects.map((s) => {
          const lessons = window.LESSONS.filter((l) => l.subject === s), nq = window.QUESTIONS.filter((q) => q.subject === s).length, m = subjectMastery(s);
          return `<article class="card subj">
            <header>${tile(s, "lg")}<div><h3>${esc(subjName(s))}</h3>${meta(lessons.length ? `${num(lessons.length)} ${T("lessons_n")}` : "", nq ? `${num(nq)} ${T("questions_n")}` : "") }</div></header>
            ${m !== null ? `<div class="mrow">${bar(m, SUBJ[s].color)}<small>${num(Math.round(m * 100))}%</small></div>` : ""}
            ${lessons.length ? `<ul class="lessons">${lessons.map((l) => `<li><a href="#/lesson/${l.id}"><span class="l-ic ${S.done.includes(l.id) ? "done" : ""}">${I(S.done.includes(l.id) ? "check" : "play")}</span><span>${esc(L(l.title))}</span><small>${num(l.minutes)} ${T("min")}</small></a></li>`).join("")}</ul>` : `<p class="muted small soon-note">${I("lock")}${T("soon")}</p>`}
            <div class="subj-actions">${nq ? `<a class="btn secondary sm" href="#/practice/${s}">${I("pencil")}${T("practise")}</a>` : ""}${bookFor(s) ? `<a class="btn quiet sm" href="#/read/${bookFor(s)}">${I("book")}${T("read_chapter")}</a>` : ""}</div>
          </article>`; }).join("")}</div></section>`;
    },

    start() {
      const p = S.profile ? { ...S.profile, weak: [...S.profile.weak] } : { name: "", branch: "", target: 85, weak: [], minutes: 20, examDate: CFG.defaultExamDate };
      let step = 0; const N = 5;
      const render = () => {
        const b = branchOf(p.branch);
        const q = [
          () => `<label class="q-label" for="ob-name">${T("ob_name")}</label><input class="field lg" id="ob-name" value="${esc(p.name)}" placeholder="${T("ob_name_ph")}" maxlength="40" autocomplete="given-name">`,
          () => `<p class="q-label">${T("ob_branch")}</p><div class="opts" role="radiogroup">${window.BRANCHES.map((x) => `<button class="opt" role="radio" aria-checked="${p.branch === x.id}" data-v="${x.id}"><span>${esc(L(x.name))}</span><span class="o-m"></span></button>`).join("")}</div>`,
          () => `<label class="q-label" for="ob-target">${T("ob_target")}</label><p class="muted small">${T("ob_target_hint")}</p><div class="target"><b id="ob-tv">${num(p.target)}%</b><input type="range" min="60" max="99" value="${p.target}" id="ob-target" dir="ltr"></div>`,
          () => `<p class="q-label">${T("ob_subjects")}</p><p class="muted small">${T("ob_subjects_hint")}</p><div class="opts" role="group">${b.subjects.map((s) => `<button class="opt" aria-pressed="${p.weak.includes(s)}" data-v="${s}">${tile(s, "sm")}<span>${esc(subjName(s))}</span><span class="o-m box"></span></button>`).join("")}</div>`,
          () => `<p class="q-label">${T("ob_minutes")}</p><div class="opts row" role="radiogroup">${[10, 20, 30, 45].map((m) => `<button class="opt center" role="radio" aria-checked="${p.minutes === m}" data-v="${m}"><b>${num(m)}</b><span class="small muted">${T("minutes")}</span></button>`).join("")}</div>
                 <label class="q-label sm" for="ob-exam">${T("ob_exam")}</label><input type="date" class="field" id="ob-exam" value="${p.examDate}">`,
        ][step]();
        app().innerHTML = `<section class="wrap section ob">
          <aside class="ob-aside"><h1>${T("ob_title")}</h1><p class="muted">${T("ob_sub")}</p>
            <ol class="stepper">${[1, 2, 3, 4, 5].map((n, i) => `<li class="${i < step ? "done" : i === step ? "cur" : ""}"><span>${i < step ? I("check") : num(n)}</span>${T("ob_s" + n)}</li>`).join("")}</ol>
            <div class="ob-progress">${bar((step + 1) / N)}</div>
          </aside>
          <div class="card ob-card">${q}
            <div class="ob-actions">${step ? `<button class="btn quiet" id="ob-back">${I("arrow", "flip back-ic")}${T("back")}</button>` : "<span></span>"}<button class="btn primary" id="ob-next">${step === N - 1 ? T("finish") : T("next")}${I("arrow", "flip")}</button></div>
          </div></section>`;
        const nextBtn = $("#ob-next");
        const valid = () => [p.name.trim(), p.branch, 1, 1, p.minutes][step];
        const refresh = () => (nextBtn.disabled = !valid());
        const name = $("#ob-name");
        if (name) { name.addEventListener("input", () => { p.name = name.value; refresh(); }); name.addEventListener("keydown", (e) => e.key === "Enter" && nextBtn.click()); name.focus(); }
        $("#ob-target")?.addEventListener("input", (e) => { p.target = +e.target.value; $("#ob-tv").textContent = num(p.target) + "%"; });
        $("#ob-exam")?.addEventListener("change", (e) => (p.examDate = e.target.value || CFG.defaultExamDate));
        $$(".opt").forEach((o) => o.addEventListener("click", () => {
          const v = o.dataset.v;
          if (step === 1) { if (p.branch !== v) p.weak = []; p.branch = v; }
          if (step === 3) { p.weak = p.weak.includes(v) ? p.weak.filter((x) => x !== v) : [...p.weak, v]; o.setAttribute("aria-pressed", String(p.weak.includes(v))); }
          if (step === 4) p.minutes = +v;
          if (step !== 3) $$(".opt").forEach((x) => x.setAttribute("aria-checked", String(x === o)));
          refresh();
        }));
        $("#ob-back")?.addEventListener("click", () => { step--; render(); });
        nextBtn.addEventListener("click", () => {
          if (!valid()) return;
          if (step < N - 1) { step++; return render(); }
          p.name = p.name.trim().slice(0, 40); S.profile = p; save(); go("#/dashboard");
        });
        refresh();
      };
      render();
    },

    dashboard() {
      const p = S.profile;
      if (!p) {
        app().innerHTML = `<section class="wrap section narrow"><div class="card empty">${mark("lg")}<h1>${T("no_plan_t")}</h1><p class="muted">${T("no_plan_d")}</p><a class="btn primary lg" href="#/start">${T("make_plan")}${I("arrow", "flip")}</a></div></section>`;
        return;
      }
      const b = branchOf(p.branch), exam = new Date(p.examDate).getTime();
      const days = Math.max(0, Math.ceil((exam - today()) / DAY));
      const plan = dailyPlan(), next = plan[0];
      const streak = S.streak.last >= today() - DAY ? S.streak.count : 0;
      const week = Array.from({ length: 7 }, (_, i) => today() - (6 - i) * DAY);
      app().innerHTML = `<section class="wrap section dash">
        <header class="dash-h">
          <div><p class="eyebrow">${fmtDate(today(), { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1>${new Date().getHours() < 12 ? T("greet_m") : T("greet_e")}${S.lang === "ar" ? "،" : ","} ${esc(p.name)}</h1>
          <p class="muted">${meta(esc(L(b.name)), `${I("target")} ${num(p.target)}%`, `${num(p.minutes)} ${T("min")}`)}</p></div>
          <a class="btn secondary sm" href="#/start">${I("pencil")}${T("edit_plan")}</a>
        </header>
        <div class="dash-grid">
          <div class="col">
            ${next ? `<a class="card next" href="${next.href}" style="--c:${SUBJ[next.subject].color}">
              <p class="eyebrow">${T("up_next")}</p>
              <div class="next-row">${tile(next.subject, "lg")}<div><h2>${esc(itemTitle(next))}</h2>${meta(T("k_" + next.kind), esc(subjName(next.subject)), `${num(next.minutes)} ${T("min")}`)}</div></div>
              <span class="btn primary">${I("play")}${T(next.kind === "lesson" ? "start" : "continue")}</span></a>` : ""}
            <div class="card"><h2 class="h-sm">${T("plan_today")}</h2>
              ${plan.length ? `<ol class="plan">${plan.map((it, i) => `<li><a href="${it.href}"><span class="p-i">${num(i + 1)}</span><div><b>${esc(itemTitle(it))}</b>${meta(T("k_" + it.kind), esc(subjName(it.subject)), `${num(it.minutes)} ${T("min")}`)}</div>${I("chevron", "flip chev")}</a></li>`).join("")}</ol>`
                : `<p class="done-msg">${I("check")}${T("plan_done")}</p>`}
            </div>
            <div class="card"><h2 class="h-sm">${T("mastery")}</h2>
              <ul class="mastery">${b.subjects.map((s) => { const m = subjectMastery(s); return `<li>${tile(s, "sm")}<span>${esc(subjName(s))}</span>${bar(m, SUBJ[s].color)}<small>${m === null ? T("not_started") : num(Math.round(m * 100)) + "%"}</small></li>`; }).join("")}</ul></div>
          </div>
          <aside class="col">
            <div class="card stat"><span class="st-ic">${I("calendar")}</span><b class="big">${num(days)}</b><span>${T("days_to_exam")}</span><small class="muted">${T("exam_on")}: ${fmtDate(exam)}</small></div>
            <div class="card stat"><span class="st-ic warm">${I("flame")}</span><b class="big">${num(streak)}</b><span>${T("streak")}</span>
              <div class="week" aria-label="${T("this_week")}">${week.map((d) => `<span class="${S.activity[dkey(d)] ? "on" : ""} ${d === today() ? "today" : ""}"><i></i><small>${fmtDate(d, { weekday: "narrow" })}</small></span>`).join("")}</div>
              <small class="muted">${num(S.xp)} ${T("xp")}</small></div>
            <div class="card rem"><h2 class="h-sm">${I("message")}${T("rem_title")}</h2><p class="muted small">${T("rem_desc")}</p>
              <a class="btn secondary sm" target="_blank" rel="noopener" href="${waLink(`${T("rem_title")} — ${p.name} · ${L(b.name)}`)}">${T("rem_btn")}</a></div>
            <button class="btn quiet sm reset" id="reset">${T("reset")}</button>
          </aside>
        </div></section>`;
      $("#reset").addEventListener("click", () => { if (confirm(T("confirm_reset"))) { const lang = S.lang; S = defaults(); S.lang = lang; save(); go("#/"); } });
    },

    lesson(id) {
      const lesson = window.LESSONS.find((l) => l.id === id); if (!lesson) return go("#/learn");
      const xp0 = S.xp; let correct = 0, total = 0, i = 0;
      const P = Player({ title: L(lesson.title), subject: lesson.subject, segments: lesson.steps.length, exit: S.profile ? "#/dashboard" : "#/learn" });
      const run = () => {
        if (i >= lesson.steps.length) {
          if (!S.done.includes(lesson.id)) { S.done.push(lesson.id); S.xp += 20; logActivity(); save(); }
          return summary(P, { title: T("lesson_done"), correct, total, xp: S.xp - xp0, again: `#/practice/${lesson.subject}`, book: lesson.book });
        }
        const st = lesson.steps[i], next = () => { i++; run(); };
        P.progress(i); P.step(L(st.title));
        if (st.type === "explore") {
          P.body.innerHTML = `<div class="prose"><p>${L(st.body)}</p></div><div class="w"></div>
            <div class="predict"><label for="pr"><span class="pill">${T("predict")}</span> ${L(st.predict.q)}</label><input id="pr" class="num-input" inputmode="decimal" autocomplete="off" dir="ltr"></div>`;
          WIDGETS[st.widget]($(".w", P.body));
          const inp = $("#pr");
          const chk = () => {
            const ok = Math.abs(parseFloat(normDigits(inp.value)) - st.predict.answer) < 1e-6;
            inp.disabled = true; inp.classList.add(ok ? "is-right" : "is-close");
            if (ok) { S.xp += 5; logActivity(); save(); }
            P.set({ state: ok ? "good" : "hint", fb: { title: ok ? T("correct_t") : T("close_t"), body: L(st.predict.explain) }, label: T("continue"), onMain: next });
            P.main.focus({ preventScroll: true });
          };
          const idle = () => P.set({ label: T("check"), disabled: !inp.value.trim(), onMain: chk });
          inp.addEventListener("input", idle); idle();
        } else if (st.type === "video") {
          P.body.innerHTML = `<div class="vwrap"></div>`;
          window.VideoPlayer($(".vwrap", P.body), st.explainer, { lang: S.lang, autoplay: true,
            onEnd: () => P.set({ state: "good", fb: { title: T("video_done") }, label: T("continue"), onMain: next }) });
          P.set({ label: T("continue"), onMain: next });
        } else if (st.type === "concept") {
          P.body.innerHTML = `<div class="prose">${L(st.body)}</div>`;
          P.set({ label: T("continue"), onMain: next });
        } else if (st.type === "worked") {
          P.body.innerHTML = `<div class="problem">${L(st.problem)}</div><ol class="worked"></ol>`;
          let k = 0;
          const reveal = () => {
            $(".worked", P.body).insertAdjacentHTML("beforeend", `<li>${L(st.reveal[k++])}</li>`);
            P.progress(i, k / st.reveal.length);
            P.set(k < st.reveal.length ? { label: T("next_step"), onMain: reveal } : { label: T("continue"), onMain: next });
          };
          P.set({ label: T("next_step"), onMain: reveal });
        } else if (st.type === "quiz") {
          const qs = st.questions.map((qid) => window.QUESTIONS.find((q) => q.id === qid));
          let j = 0;
          const ask = () => {
            if (j >= qs.length) return next();
            P.progress(i, j / qs.length); P.step(`${L(st.title)} <span class="count">${num(j + 1)} / ${num(qs.length)}</span>`);
            askQuestion(qs[j], P, (ft) => { total++; correct += ft ? 1 : 0; j++; ask(); });
          };
          ask();
        }
      };
      run();
    },

    practice(subject) {
      if (!SUBJ[subject]) return go("#/learn");
      const pool = window.QUESTIONS.filter((q) => q.subject === subject)
        .map((q) => ({ q, w: (S.mastery[mkey(q)]?.m ?? 0.2) + Math.random() * 0.3 }))
        .sort((a, b) => a.w - b.w).slice(0, 5).map((x) => x.q);
      const xp0 = S.xp; let j = 0, correct = 0;
      const P = Player({ title: `${T("practise")} · ${subjName(subject)}`, subject, segments: pool.length, exit: S.profile ? "#/dashboard" : "#/learn" });
      const ask = () => {
        if (j >= pool.length) return summary(P, { title: T("practice_done"), correct, total: pool.length, xp: S.xp - xp0, again: `#/practice/${subject}` });
        P.progress(j); P.step(`${T("question")} <span class="count">${num(j + 1)} / ${num(pool.length)}</span>`);
        askQuestion(pool[j], P, (ft) => { correct += ft ? 1 : 0; j++; ask(); });
      };
      ask();
    },

    exams() {
      const OE = window.OFFICIAL_EXAMS;
      let br = OE.map[S.profile?.branch] || "scientific";
      const render = () => {
        const b = OE.branches.find((x) => x.id === br);
        app().innerHTML = `<section class="wrap section">
          <div class="sec-head left"><p class="eyebrow">${T("nav_exams")}</p><h1>${T("ex_title")}</h1><p class="lead-sm muted">${T("ex_sub")}</p></div>
          <div class="source-note">${I("shield")}<div><b>${T("ex_official")}</b><p class="small muted">${T("ex_source")} <a href="${OE.source}" target="_blank" rel="noopener">elearn.edu.ps</a></p></div></div>
          ${S.profile?.branch === "technology" ? `<p class="notice small">${T("ex_tech")}</p>` : ""}
          <nav class="chips" aria-label="${T("f_branch")}">${OE.branches.map((x) => `<button class="chip" data-b="${x.id}" ${x.id === br ? 'aria-current="true"' : ""}>${esc(L(x.name))}</button>`).join("")}</nav>
          <div class="papers">${["2025", "2024", "2023", "2022"].map((y) => `
            <a class="paper card" href="${b.files[y]}" target="_blank" rel="noopener"><span class="paper-y">${num(y)}</span>
              <div><b>${T("ex_paper_t")} ${esc(L(b.name))}</b>${meta(T("ex_all_subjects"), "RAR")}</div><span class="dl-ic">${I("download")}</span></a>`).join("")}
            <a class="paper card all" href="${b.files.all}" target="_blank" rel="noopener"><span class="paper-y">${I("layers")}</span>
              <div><b>${T("ex_bundle")}</b>${meta("2022–2025", T("ex_all_subjects"), "RAR")}</div><span class="dl-ic">${I("download")}</span></a>
          </div>
          <p class="small muted rar-help">${I("file")}${T("ex_rar")}</p>
          <div class="ex-next card"><div><h3>${T("ex_practice_t")}</h3><p class="muted small">${T("ex_practice_d")}</p></div><a class="btn primary" href="#/learn">${T("ex_practice_cta")}</a></div>
        </section>`;
        $$(".chip[data-b]").forEach((c) => (c.onclick = () => { br = c.dataset.b; render(); }));
      };
      render();
    },

    tutors() {
      app().innerHTML = `<section class="wrap section">
        <div class="sec-head left"><p class="eyebrow">${T("nav_tutors")} <span class="badge">${T("soon")}</span></p><h1>${T("tu_title")}</h1><p class="lead-sm muted">${T("tu_sub")}</p></div>
        <div class="grid3">${[["shield", 1], ["users", 2], ["target", 3]].map(([ic, n]) => `<div class="card svc"><span class="svc-ic">${I(ic)}</span><h3>${T(`tu${n}_t`)}</h3><p class="muted">${T(`tu${n}_d`)}</p></div>`).join("")}</div>
        <div class="actions">
          <a class="btn primary" target="_blank" rel="noopener" href="${waLink(`${T("tu_interest")} — ${T("brand")}`)}">${T("tu_interest")}</a>
          <a class="btn secondary" target="_blank" rel="noopener" href="${waLink(`${T("tu_apply")} — ${T("brand")}`)}">${T("tu_apply")}</a>
        </div></section>`;
    },

    join() {
      let tab = "phone";
      app().innerHTML = `<section class="wrap section join">
        <div><p class="eyebrow">${T("beta")}</p><h1>${T("j_title")}</h1><p class="lead-sm muted">${T("j_sub")}</p>
          <ul class="checks">${[1, 2, 3].map((n) => `<li>${I("check")}${T("j" + n)}</li>`).join("")}</ul></div>
        <div class="card">
          <div class="tabs small" role="tablist">${[["phone", "phone"], ["wa", "message"], ["fb", "message"]].map(([k, ic]) => `<button class="tab" role="tab" data-k="${k}" aria-selected="${k === tab}">${I(ic)}${T(k === "phone" ? "via_phone" : k === "wa" ? "via_wa" : "via_fb")}</button>`).join("")}</div>
          <div class="join-panel"></div>
        </div></section>`;
      const panel = $(".join-panel");
      const render = () => {
        if (tab === "wa") panel.innerHTML = `<p class="muted">${T("wa_desc")}</p><a class="btn primary block" target="_blank" rel="noopener" href="${waLink(`${T("j_title")} — ${S.profile?.name || ""}`)}">${I("message")}${T("open_wa")}</a>`;
        else if (tab === "fb") panel.innerHTML = `<p class="muted">${T("fb_desc")}</p><a class="btn primary block" target="_blank" rel="noopener" href="${fbLink()}">${I("message")}${T("open_fb")}</a>`;
        else {
          panel.innerHTML = `<form id="jf" class="form" novalidate>
            <label>${T("name")}<input class="field" name="name" maxlength="40" autocomplete="given-name" value="${esc(S.profile?.name || "")}"></label>
            <label>${T("phone")}<div class="phone-field" dir="ltr"><select name="cc" aria-label="Country code"><option value="970">+970</option><option value="972">+972</option></select><input name="phone" inputmode="tel" autocomplete="tel-national" placeholder="${T("phone_ph")}"></div></label>
            <label>${T("branch")}<select class="field" name="branch">${window.BRANCHES.map((b) => `<option value="${b.id}" ${S.profile?.branch === b.id ? "selected" : ""}>${esc(L(b.name))}</option>`).join("")}</select></label>
            <label class="check"><input type="checkbox" name="consent" checked><span>${T("consent")}</span></label>
            <p class="form-err" role="alert"></p>
            <button class="btn primary block" type="submit">${T("submit")}</button></form>`;
          $("#jf").addEventListener("submit", async (e) => {
            e.preventDefault();
            const f = new FormData(e.target), err = $(".form-err", panel);
            const name = String(f.get("name")).trim().slice(0, 40);
            const local = normDigits(f.get("phone")).replace(/\D/g, "").replace(/^0/, "");
            if (!name) return (err.textContent = T("invalid_name"));
            if (!/^5\d{8}$/.test(local) || !f.get("consent")) return (err.textContent = T("invalid_phone"));
            const entry = { name, phone: `+${f.get("cc")}${local}`, branch: f.get("branch"), lang: S.lang, source: "web", at: new Date().toISOString() };
            S.signups.push(entry); save();
            let sent = false;
            if (CFG.signupEndpoint) { try { sent = (await fetch(CFG.signupEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) })).ok; } catch (_) {} }
            panel.innerHTML = `<div class="success">${I("check")}<h3>${T("thanks_t")}</h3><p class="muted">${T("thanks_d")}</p>
              ${sent ? "" : `<a class="btn primary" target="_blank" rel="noopener" href="${waLink(`${T("j_title")}: ${entry.name} · ${entry.phone} · ${L(branchOf(entry.branch).name)}`)}">${I("message")}${T("open_wa")}</a>`}</div>`;
          });
        }
      };
      $$(".tab").forEach((t) => t.addEventListener("click", () => { tab = t.dataset.k; $$(".tab").forEach((x) => x.setAttribute("aria-selected", String(x === t))); render(); }));
      render();
    },
  };

  // ───────────────────────── Router & global handlers ─────────────────────────
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function route() {
    const [, name = "", arg, arg2] = (location.hash || "#/").split("/");
    window.speechSynthesis?.cancel(); window.__layout = null;
    const view = views[name] ? name : "home";
    focusMode(false); applyLang();
    $$("[data-nav]").forEach((a) => a.toggleAttribute("aria-current", a.dataset.nav === (view === "branch" ? "learn" : view)));
    views[view](decodeURIComponent(arg || ""), arg2);
    window.scrollTo(0, 0);
    $("#app").focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", route);
  window.addEventListener("resize", () => window.__layout?.());
  document.addEventListener("click", (e) => {
    if (e.target.closest("#lang-toggle")) { S.lang = S.lang === "ar" ? "en" : "ar"; save(); route(); return; }
    const a = e.target.closest('a[href^="#/"]');
    if (a && a.getAttribute("href") === location.hash) { e.preventDefault(); route(); }
  });
  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("focus-mode") || e.altKey || e.ctrlKey || e.metaKey) return;
    const tgt = e.target, typing = tgt.matches("input, select, textarea");
    if (e.key === "Escape") { $("[data-exit]")?.click(); return; }
    if (e.key === "Enter" && !tgt.matches("button, a, .handle")) {
      const m = $(".b-main"); if (m && !m.disabled) { e.preventDefault(); m.click(); } return;
    }
    const n = "1234".indexOf(e.key) + 1 || "١٢٣٤".indexOf(e.key) + 1;
    if (n && !typing) { const o = $$(".option")[n - 1]; if (o && !o.disabled) { o.click(); o.focus(); } }
  });
  $("#year").textContent = new Date().getFullYear();
  route();
})();
