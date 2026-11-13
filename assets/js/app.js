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
  if (S.profile) { const mig = { technology: "scientific", vocational: "industrial" }; if (mig[S.profile.branch]) S.profile.branch = mig[S.profile.branch]; }

  // ───────────────────────── i18n ─────────────────────────
  const T = (k) => window.I18N[S.lang]?.[k] ?? k;
  const L = (o) => (o ? o[S.lang] ?? o.en : "");
  const loc = () => (S.lang === "ar" ? "ar-PS" : "en-GB");
  const num = (n, o = {}) => Number(n).toLocaleString(loc(), { useGrouping: false, maximumFractionDigits: 2, ...o });
  // Step/pillar badges: "01" in English (as in the deck); unpadded "١" in Arabic, because the Arabic-Indic zero "٠" is drawn as a dot.
  const seq = (n) => (S.lang === "ar" ? num(n) : num(n, { minimumIntegerDigits: 2 }));
  const fmtDate = (t, o = { day: "numeric", month: "long", year: "numeric" }) => new Date(t).toLocaleDateString(loc(), o);
  const normDigits = (s) => String(s).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٫,]/g, ".").replace(/[−–]/g, "-");
  const renderMath = (root) => window.NajihMath?.renderIn(root);
  // Arabic maths notation (س، ص، ق(س)…) for maths content in the Arabic interface; Latin notation elsewhere.
  const mathAttr = (subject) => (S.lang === "ar" && subject === "math" ? 'data-math="ar"' : "");
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
    $$("[data-t-aria]").forEach((el) => el.setAttribute("aria-label", T(el.dataset.tAria)));
    $(".lang-txt")?.setAttribute("lang", S.lang === "ar" ? "en" : "ar");
    $$(".logo").forEach((el) => el.setAttribute("aria-label", T("brand")));
    $("#year").textContent = num(new Date().getFullYear());
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
  // Brand mark (N ribbon). Decorative: callers provide the accessible text.
  const mark = (cls = "") => `<img class="mark ${cls}" src="assets/img/logo-mark.svg" width="32" height="32" alt="">`;
  // Subject tiles/tags are monochrome brand (see .s-tile); per-subject hues are no longer used for UI chrome.
  const tile = (s, size = "") => `<span class="s-tile ${size}">${I(SUBJ[s].icon)}</span>`;
  const tag = (s) => `<span class="s-tag">${I(SUBJ[s].icon)}${esc(subjName(s))}</span>`;
  // Meters are brand green; only semantic CSS colours (var(--…)) override it, never subject hex colours.
  const bar = (v, c) => `<span class="meter"${c && c.startsWith("var(") ? ` style="--c:${c}"` : ""}><span style="width:${Math.round((v ?? 0) * 100)}%"></span></span>`;
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
      <div class="player" ${mathAttr(subject)}>
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
      ? `<div class="options" role="radiogroup">${q.choices.map((c, i) => `<button class="option" role="radio" aria-checked="false" data-i="${i}"><kbd>${num(i + 1)}</kbd><span class="o-t">${L(c)}</span></button>`).join("")}</div><p class="kbd-hint">${T("keys_hint")}</p>`
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
        P.set({ state: ok ? "good" : "bad", fb: { title: ok ? T("correct_t") : T("incorrect_t"), body: (ok ? "" : `<span class="fb-ans">${T("answer_was")} <b>${ans}</b></span>`) + L(q.explain) }, label: T("continue"), onMain: () => onDone(ok && attempts === 1) });
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
    const acc = total ? Math.round((correct / total) * 100) : 100, C = 2 * Math.PI * 52, pctTxt = pct;
    P.body.innerHTML = `<div class="summary">
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="--off:${C * (1 - acc / 100)}"/></svg>
      <div class="ring-ic">${I("check")}</div>
      <h1>${title}</h1>
      <div class="sum-stats"><div><b>${pctTxt(acc)}</b><span>${T("accuracy")}</span></div><div><b><bdi dir="ltr">+${num(xp)}</bdi></b><span>${T("earned")}</span></div></div>
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
      const ticks = [-3, -2, -1, 1, 2, 3].map((x) => `<line x1="${sx(x)}" x2="${sx(x)}" y1="${sy(0) - 3}" y2="${sy(0) + 3}" class="tick"/><text x="${sx(x)}" y="${sy(0) + 15}" class="tick-l">${num(x)}</text>`).join("");
      const lab = S.lang === "ar" ? ["س", "ص", "الميل"] : ["x", "y", "slope"];
      host.innerHTML = `<div class="widget" dir="ltr">
        <svg viewBox="0 0 ${W} ${H}" class="plot" role="img" aria-label="y = x², tangent line">
          <line x1="0" x2="${W}" y1="${sy(0)}" y2="${sy(0)}" class="axis"/><line y1="0" y2="${H}" x1="${sx(0)}" x2="${sx(0)}" class="axis"/>${ticks}
          <path d="${curve}" class="curve"/><line class="tan"/>
          <g class="handle" tabindex="0" role="slider" aria-label="${lab[0]}" aria-valuemin="-3" aria-valuemax="3"><circle r="16" class="halo"/><circle r="7" class="pt"/></g>
        </svg>
        <div class="readout" dir="${S.lang === "ar" ? "rtl" : "ltr"}"><div><span>${lab[0]}</span><b class="rx"></b></div><div><span>${lab[1]}</span><b class="ry"></b></div><div class="hl"><span>${lab[2]}</span><b class="rs"></b></div></div>
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
  // Arabic number agreement: 1 ورقة واحدة · 2 ورقتان · 3–10 أوراق · 11+ ورقة.
  const countN = (n, ar, en) => (S.lang === "ar" ? (n === 1 ? `${ar[0]} ${ar[3]}` : n === 2 ? ar[1] : n <= 10 ? `${num(n)} ${ar[2]}` : `${num(n)} ${ar[0]}`) : `${num(n)} ${n === 1 ? en[0] : en[1]}`);
  const papersN = (n) => countN(n, ["ورقة", "ورقتان", "أوراق", "واحدة"], ["paper", "papers"]);
  const itemsN = (n) => countN(n, ["فقرة", "فقرتان", "فقرات", "واحدة"], ["item", "items"]);
  // Full Arabic agreement where the 11+ form differs from the singular (درس واحد · درسان · ٣ دروس · ١١ درساً).
  const agree = (n, ar, en) => (S.lang === "ar" ? (n === 1 ? ar[0] : n === 2 ? ar[1] : n <= 10 ? `${num(n)} ${ar[2]}` : `${num(n)} ${ar[3]}`) : `${num(n)} ${n === 1 ? en[0] : en[1]}`);
  const unitsN = (n) => agree(n, ["وحدة واحدة", "وحدتان", "وحدات", "وحدة"], ["unit", "units"]);
  const lessonsN = (n) => agree(n, ["درس واحد", "درسان", "دروس", "درساً"], ["lesson", "lessons"]);
  const pct = (n) => `<bdi>${num(n)}${S.lang === "ar" ? "٪" : "%"}</bdi>`;
  const fill = (k, o) => Object.entries(o).reduce((s, [a, b]) => s.replace(`{${a}}`, b), T(k));
  const curOf = (bid) => (window.CURRICULUM?.branches || []).find((x) => x.id === bid);
  const curSubject = (bid, sid) => curOf(bid)?.subjects.find((x) => x.sub === sid);
  const unitCount = (cs) => (cs ? cs.books.reduce((n, k) => n + k.units.length, 0) : 0);
  const lessonCount = (cs) => (cs ? cs.books.reduce((n, k) => n + k.units.reduce((m, u) => m + u.lessons.length, 0), 0) : 0);
  const papersFor = (bid, sid) => (window.EXAMS?.papers || []).filter((x) => x.b === bid && (!sid || x.sub === sid));
  const tl = (o) => (S.lang === "en" ? o.en || o.ar : o.ar.replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]));

  const views = {
    home() {
      const sample = window.LESSONS[0];
      // Deck-style section head: English eyebrow (tracked, uppercase), short headline with one accent phrase, one sentence.
      const head = (eb, k, { tag = "h2", id = "" } = {}) => `<div class="sec-head">
          <p class="eyebrow" lang="en">${eb}</p>
          <${tag}${id ? ` id="${id}"` : ""}>${T(k + "_t1")} <em class="accent">${T(k + "_t2")}</em></${tag}>
          <p class="lede">${T(k + "_d")}</p></div>`;
      const primary = S.profile ? `<a class="btn primary lg" href="#/dashboard">${T("my_plan")}${I("arrow", "flip")}</a>` : `<a class="btn primary lg" href="#/start">${T("hero_cta")}</a>`;
      const nPapers = (window.EXAMS?.papers || []).length;
      const phone = `<div class="h-phone" aria-hidden="true"><div class="h-phone-scr">
          <p class="hp-top">${T("h_ph_greet")}</p>
          <p class="hp-msg">${T("h_ph_m1")}</p>
          <p class="hp-msg me">${T("h_ph_m2").replace("{n}", num(2))}</p>
          <p class="hp-msg">${T("h_ph_m3")}</p>
          <div class="hp-prog"><span>${T("h_ph_prog")}</span>${bar(0.68)}</div>
        </div></div>`;

      app().innerHTML = `
      <section class="h-hero" aria-labelledby="h-title"><div class="wrap h-hero-in">
        <div class="h-hero-copy">
          <p class="eyebrow" lang="en">Your smart AI tutor</p>
          <h1 id="h-title" class="h-display">${T("h_hero_t1")} <em class="accent">${T("h_hero_t2")}</em></h1>
          <p class="lead">${T("h_hero_d")}</p>
          <div class="actions">${primary}<a class="btn secondary lg" href="#/lesson/${sample.id}">${I("play")}${T("hero_cta2")}</a></div>
        </div>
        <div class="h-hero-logo"><img src="assets/img/logo-full.svg" width="1326" height="657" alt="${T("brand")}" class="h-logo-light"><img src="assets/img/logo-full-white.svg" width="1326" height="657" alt="" class="h-logo-dark"></div>
      </div></section>

      <section class="wrap hm-sec" aria-labelledby="h-built"><div class="block-forest h-built">
        <div class="h-built-copy">
          <p class="eyebrow" lang="en">Built around you</p>
          <h2 id="h-built" class="h-big">${T("h_built_t1")} <br><em class="accent gold">${T("h_built_t2")}</em></h2>
          <p class="h-dots">${["h_built_p1", "h_built_p2", "h_built_p3", "h_built_p4"].map((k) => `<span>${T(k)}</span>`).join("")}</p>
          <ul class="h-pills">${["h_pill1", "h_pill2", "h_pill3"].map((k) => `<li>${T(k)}</li>`).join("")}</ul>
        </div>
        <div class="h-built-media">${phone}</div>
      </div></section>

      <section class="wrap hm-sec" aria-labelledby="h-why">
        ${head("Why Najih / 01", "h_why", { id: "h-why" })}
        <div class="h-compare">
          <div class="h-cmp old"><p class="eyebrow" lang="en">One-size-fits-all</p><h3>${T("h_old_t")}</h3><p>${T("h_old_d")}</p></div>
          <div class="h-cmp new"><p class="eyebrow" lang="en">Adaptive learning</p><h3>${T("h_new_t")}</h3><p>${T("h_new_d")}</p></div>
        </div>
        <div class="note-mint h-approach"><p class="eyebrow" lang="en">Our approach</p>
          <h3>${T("h_ap_t1")} <em class="accent">${T("h_ap_t2")}</em></h3><p>${T("h_ap_d")}</p></div>
        <ol class="h-three">${[1, 2, 3].map((n) => `<li><span class="h-n">${seq(n)}</span><h3>${T("h_w" + n + "_t")}</h3><p>${T("h_w" + n + "_d")}</p></li>`).join("")}</ol>
      </section>

      <section class="h-band" aria-labelledby="h-loop"><div class="wrap">
        ${head("The learning loop / 02", "h_loop", { id: "h-loop" })}
        <div class="h-loop-grid">
          <ol class="h-steps">${[1, 2, 3, 4, 5].map((n) => `<li><span class="h-step-n">${seq(n)}</span><div><h3>${T("h_s" + n + "_t")}</h3><p>${T("h_s" + n + "_d")}</p></div></li>`).join("")}</ol>
          <div class="h-moment">
            <div class="callout-navy"><p class="eyebrow" lang="en">A real learning moment</p><h3>${T("h_mo_t")}</h3><p>${T("h_mo_d")}</p></div>
            <div class="demo card" ${mathAttr("math")}>
              <div class="demo-head"><span class="pill">${T("demo_label")}</span><b>${T("demo_title")}</b></div>
              <p class="small muted">${T("demo_inst")}</p><div class="w"></div>
              <p class="demo-q" id="demo-q">${T("demo_q")}</p>
              <div class="seg" role="radiogroup" aria-labelledby="demo-q">${[5, 10, 25].map((v, i) => `<button class="seg-b" role="radio" aria-checked="false" tabindex="${i ? -1 : 0}" data-v="${v}">${num(v)}</button>`).join("")}</div>
              <div class="demo-fb" aria-live="polite"></div></div>
          </div>
        </div>
      </div></section>

      <section class="wrap hm-sec" aria-labelledby="h-pil">
        ${head("What makes Najih different / 03", "h_pil", { id: "h-pil" })}
        <ol class="h-pillars">${[1, 2, 3, 4, 5, 6].map((n) => `<li><span class="num-badge h-gold">${seq(n)}</span><h3>${T("h_p" + n + "_t")}</h3><p>${T("h_p" + n + "_d")}</p></li>`).join("")}</ol>
        <p class="note-mint h-idea"><b>${T("h_idea_k")}</b> ${T("h_idea_d")}</p>
        <a class="text-link" href="#/learn">${T("h_pil_cta")}${I("arrow", "flip")}</a>
      </section>

      <section class="wrap hm-sec" aria-labelledby="h-road">
        ${head("Product &amp; roadmap / 04", "h_road", { id: "h-road" })}
        <ol class="h-road">${[["Core product", ""], ["Additional service", "#/tutors"], ["Future phase", ""]].map(([eb, href], i) => `
          <li class="${i ? "" : "core"}"><span class="h-road-n">${seq(i + 1)}</span><p class="eyebrow" lang="en">${eb}</p><h3>${T("h_r" + (i + 1) + "_t")}</h3><p>${T("h_r" + (i + 1) + "_d")}</p>${href ? `<a class="text-link" href="${href}">${T("h_r2_cta")}${I("arrow", "flip")}</a>` : ""}</li>`).join("")}</ol>
        <div class="h-promise"><h3>${T("h_pr_t")}</h3><p>${T("h_pr_d")}</p></div>
      </section>

      <section class="wrap hm-sec" aria-labelledby="h-ex"><div class="h-exams">
        <span class="h-ex-ic">${I("file")}</span>
        <div><p class="eyebrow" lang="en">Past papers</p><h2 id="h-ex">${T("h_ex_t1")} <em class="accent">${T("h_ex_t2")}</em></h2>
          <p class="lede">${nPapers ? T("h_ex_d").replace("{n}", num(nPapers)) : T("h_ex_d0")}</p></div>
        <a class="btn secondary" href="#/exams">${T("h_ex_cta")}${I("arrow", "flip")}</a>
      </div></section>

      <section class="wrap hm-sec h-last" aria-labelledby="h-close"><div class="block-forest h-close">
        <div class="h-close-logo"><img src="assets/img/logo-full.svg" width="1326" height="657" alt="${T("brand")}"></div>
        <div class="h-close-copy">
          <p class="eyebrow" lang="en">The next step is yours</p>
          <h2 id="h-close" class="h-big">${T("h_cl_t1")} <br><em class="accent gold">${T("h_cl_t2")}</em></h2>
          <p>${T("h_cl_d")}</p>
          <div class="actions">${S.profile ? `<a class="btn light lg" href="#/dashboard">${T("my_plan")}</a>` : `<a class="btn light lg" href="#/start">${T("hero_cta")}</a>`}</div>
          <p class="h-fine">${T("h_cl_note")}</p>
        </div>
      </div></section>`;

      // The one interactive demo: wrong answers get a hint, not the solution (the deck's "real learning moment").
      WIDGETS.tangent($(".demo .w"));
      const segs = $$(".seg-b");
      const pick = (b) => {
        const ok = +b.dataset.v === 10;
        segs.forEach((x) => { x.setAttribute("aria-checked", String(x === b)); x.tabIndex = x === b ? 0 : -1; x.classList.remove("is-right", "is-wrong"); });
        b.classList.add(ok ? "is-right" : "is-wrong");
        $(".demo-fb").className = "demo-fb " + (ok ? "good" : "bad");
        $(".demo-fb").innerHTML = `${I(ok ? "check" : "bulb")}<span>${ok ? T("demo_ok") : T("demo_no")}${ok ? ` <a href="#/lesson/${sample.id}">${T("demo_more")}</a>` : ""}</span>`;
      };
      segs.forEach((b) => b.addEventListener("click", () => pick(b)));
      $(".seg").addEventListener("keydown", (e) => {
        const dir = document.documentElement.dir === "rtl" ? -1 : 1;
        const d = { ArrowRight: dir, ArrowLeft: -dir, ArrowDown: 1, ArrowUp: -1 }[e.key];
        const i = segs.indexOf(document.activeElement);
        if (d && i > -1) { e.preventDefault(); const n = segs[(i + d + segs.length) % segs.length]; n.focus(); pick(n); }
      });
    },

    read(bookId, pageArg) {
      const B = window.BOOKS[bookId]; if (!B) return go("#/learn");
      const n = Math.min(B.pages.length, Math.max(1, parseInt(pageArg, 10) || 1)), page = B.pages[n - 1];
      S.notes = S.notes || {}; S.layers = S.layers || { najih: true, mine: true };
      const mine = (S.notes[bookId] = S.notes[bookId] || []);
      const lesson = window.LESSONS.find((l) => l.book === bookId);
      app().innerHTML = `<section class="reader">
        <div class="wrap rd-top">
          <div><a class="back-link" href="#/subject/${S.profile?.branch || "scientific"}/${B.subject}">${I("arrow", "back-ic")}${esc(subjName(B.subject))}</a>
            <h1 class="rd-title">${esc(L(B.title))}</h1></div>
          <div class="toggle-group" role="group" aria-label="${T("rd_layers")}">
            <button class="tgl" data-layer="najih" aria-pressed="${S.layers.najih}">${mark("tgl-mark")}${T("rd_najih")}</button>
            <button class="tgl" data-layer="mine" aria-pressed="${S.layers.mine}">${I("highlighter")}${T("rd_mine")}</button>
          </div>
        </div>
        <div class="wrap rd-spread">
          <article class="rd-page" lang="${S.lang}" ${mathAttr(B.subject)}>${page[S.lang] || page.en}<footer class="pg-no">${num(n)}</footer></article>
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
      margin.innerHTML = anchors.map((a, i) => { const nt = page.notes[a.dataset.n]; return `<div class="mnote" data-n="${a.dataset.n}"><span class="mn-i">${num(i + 1)}</span><p class="mn-t">${esc(L(nt))}</p></div>`; }).join("");
      // Gutter chips: absolutely positioned at the page's inline-end edge, aligned to the anchor's first line (never inside a word).
      anchors.forEach((a, i) => pageEl.insertAdjacentHTML("beforeend", `<span class="an-chip" data-n="${a.dataset.n}" aria-hidden="true">${num(i + 1)}</span>`));
      // Narrow screens: the same notes as compact callouts directly under the block that holds the anchor.
      anchors.forEach((a, i) => {
        const block = a.closest("p, .def, table, ul, ol, h2, h3") || a;
        let box = block.nextElementSibling;
        if (!box || !box.classList.contains("in-notes")) { box = Object.assign(document.createElement("div"), { className: "in-notes" }); block.after(box); }
        box.insertAdjacentHTML("beforeend", `<p class="in-note" data-n="${a.dataset.n}"><span class="mn-i" aria-hidden="true">${num(i + 1)}</span><span>${esc(L(page.notes[a.dataset.n]))}</span></p>`);
      });
      const noteEl = (id) => margin.querySelector(`.mnote[data-n="${id}"]`);
      const link = (id, on) => $$(`[data-n="${id}"]`, root).forEach((x) => x.classList.toggle("lit", on));
      anchors.forEach((a) => {
        a.addEventListener("mouseenter", () => link(a.dataset.n, true)); a.addEventListener("mouseleave", () => link(a.dataset.n, false));
        const open = () => {
          const m = getComputedStyle(margin).display === "none" ? pageEl.querySelector(`.in-note[data-n="${a.dataset.n}"]`) : noteEl(a.dataset.n);
          if (!m) return;
          m.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          m.classList.add("pulse"); setTimeout(() => m.classList.remove("pulse"), 700);
        };
        a.addEventListener("click", open); a.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open()));
      });
      $$(".mnote", margin).forEach((m) => { m.addEventListener("mouseenter", () => link(m.dataset.n, true)); m.addEventListener("mouseleave", () => link(m.dataset.n, false)); });
      function layout() {
        const top0 = pageEl.getBoundingClientRect().top;
        // Chips never overlap each other: each one starts below the previous chip.
        let cfloor = 0;
        $$(".an-chip", pageEl).forEach((c) => {
          const a = pageEl.querySelector(`.an[data-n="${c.dataset.n}"]`), r = [...a.getClientRects()].find((x) => x.width > 4) || a.getBoundingClientRect();
          if (!c.offsetParent) return;
          const y = Math.max(r.top - top0 + (Math.min(r.height, 34) - c.offsetHeight) / 2, cfloor);
          c.style.top = y + "px"; cfloor = y + c.offsetHeight + 4;
        });
        if (getComputedStyle(margin).display === "none") return;
        let floor = 0;
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
        const w = document.createTreeWalker(pageEl, NodeFilter.SHOW_TEXT, { acceptNode: (nd) => (nd.parentElement.closest(".katex, .u-hl, .pg-no, .an-chip, .in-notes") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
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
        const ok = txt.length > 1 && txt.length < 400 && r.startContainer === r.endContainer && r.startContainer.nodeType === 3 && pageEl.contains(r.startContainer) && !r.startContainer.parentElement.closest(".katex, .u-hl, .an-chip, .in-notes");
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
      function openSheet({ item, mark: m }) {
        sheet.hidden = false;
        {
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

    learn() { views.branch(branchOf(S.profile?.branch) ? S.profile.branch : "scientific"); },

    branch(id) {
      const b = branchOf(id); if (!b) return go("#/learn");
      const cur = curOf(id);
      // One job: pick a subject. Card = icon + name + one muted line (+ progress once started).
      app().innerHTML = `<section class="wrap section br-page">
        <div class="sec-head left"><p class="eyebrow" lang="en">Subjects</p><h1>${T("br_prefix")} ${esc(L(b.name))}</h1><p class="lede">${T("br_lede")}</p></div>
        <nav class="chips scroll-x br-chips" aria-label="${T("f_branch")}">${window.BRANCHES.map((x) => `<a class="chip" href="#/branch/${x.id}" ${x.id === id ? 'aria-current="page"' : ""}>${esc(L(x.name))}</a>`).join("")}</nav>
        <ul class="subj-grid">${b.subjects.map((s) => {
          const cs = curSubject(id, s), nu = unitCount(cs), m = subjectMastery(s);
          return `<li><a class="subj-card" href="#/subject/${id}/${s}">${tile(s, "lg")}
            <span class="sc-t"><b>${esc(subjName(s))}</b><span class="sc-m">${nu ? unitsN(nu) : T("sub_book_short")}</span>
              ${m !== null ? `<span class="sc-p">${bar(m)}<small>${pct(Math.round(m * 100))}</small></span>` : ""}</span>
            ${I("chevron", "i-dir sc-go")}</a></li>`; }).join("")}</ul>
        ${cur ? `<p class="src-foot small muted">${I("shield")}<span>${T("br_official")} <a href="${cur.page}" target="_blank" rel="noopener"><bdi>elearn.edu.ps</bdi></a>.</span></p>` : ""}
      </section>`;
      requestAnimationFrame(() => $(".br-chips [aria-current]")?.scrollIntoView({ block: "nearest", inline: "center" }));
    },

    subject(bid, sid) {
      const b = branchOf(bid), cs = curSubject(bid, sid);
      if (!b || !SUBJ[sid]) return go("#/learn");
      const nq = window.QUESTIONS.filter((q) => q.subject === sid).length, np = papersFor(bid, sid).length;
      const najih = window.LESSONS.filter((l) => l.subject === sid);
      const books = cs ? cs.books : [];
      const done = (id) => S.done.includes(id);
      // One primary action: the next Najih lesson (or practice, or the book). Everything else is a quiet link.
      const nextL = najih.find((l) => !done(l.id)) || najih[0];
      const lead = nextL
        ? `<a class="sp-next" href="#/lesson/${nextL.id}"><span class="sp-next-ic">${I(done(nextL.id) ? "review" : "play")}</span>
            <span class="sp-next-t"><span class="small">${T("najih_lesson")}</span><b>${esc(L(nextL.title))}</b><span class="small">${num(nextL.minutes)} ${T("minutes")}</span></span>
            <span class="btn light sp-next-b">${T(done(nextL.id) ? "sp_again" : "sp_start")}${I("arrow", "flip")}</span></a>`
        : nq ? `<a class="btn primary lg" href="#/practice/${sid}">${I("pencil")}${T("practise")}</a>`
        : books[0] ? `<a class="btn primary lg" href="${books[0].url}" target="_blank" rel="noopener">${I("book")}${T("sub_book")}</a>` : "";
      const links = [
        ...books.map((k) => `<a class="sp-link" href="${k.url}" target="_blank" rel="noopener">${I("book")}<span>${T("sub_book_short")}${k.part ? ` · ${T("part_" + k.part)}` : ""}</span></a>`),
        np ? `<a class="sp-link" href="#/exams/${bid}/${sid}">${I("file")}<span>${T("sub_papers")}</span></a>` : "",
        nextL && nq ? `<a class="sp-link" href="#/practice/${sid}">${I("pencil")}<span>${T("practise")}</span></a>` : "",
        bookFor(sid) ? `<a class="sp-link" href="#/read/${bookFor(sid)}">${I("highlighter")}<span>${T("read_chapter")}</span></a>` : "",
      ].filter(Boolean);
      const row = (k, l) => {
        const t = `<span class="ul-t">${esc(tl(l.t))}</span>`;
        if (l.najih?.length) return `<a class="ul-row is-najih" href="#/lesson/${l.najih[0]}">${t}<span class="ul-go" aria-hidden="true">${I(done(l.najih[0]) ? "check" : "play")}</span><span class="vh"> · ${T("najih_lesson")}</span></a>`;
        if (!l.pg) return `<span class="ul-row">${t}</span>`;
        const href = k.off != null ? `${k.url}#page=${l.pg + k.off}` : k.url;
        return `<a class="ul-row" href="${href}" target="_blank" rel="noopener">${t}<span class="ul-pg">${T("page_short")} ${num(l.pg)}</span><span class="vh"> · ${T("open_in_book")}</span></a>`;
      };
      app().innerHTML = `<section class="wrap section subject-page">
        <a class="back-link" href="#/branch/${bid}">${I("arrow", "back-ic")}${T("br_prefix")} ${esc(L(b.name))}</a>
        <header class="sp-head">${tile(sid, "xl")}<div><h1>${esc(subjName(sid))}</h1><p class="lede">${T("sp_lede")}</p></div></header>
        <div class="sp-lead">${lead}</div>
        ${links.length ? `<nav class="sp-links" aria-label="${T("sp_res")}">${links.join("")}</nav>` : ""}
        <h2 class="sp-h">${T("sp_units")}</h2>
        ${books.some((k) => k.units.length) ? books.map((k) => `${books.length > 1 ? `<h3 class="part-h">${T("part_" + (k.part || "1"))}</h3>` : ""}
          <div class="units">${k.units.map((u, ui) => `<details class="unit" ${ui === 0 && k === books[0] ? "open" : ""}>
            <summary><span class="num-badge sm">${num(ui + 1)}</span><span class="u-t">${esc(tl(u.t))}</span><span class="u-c">${lessonsN(u.lessons.length)}</span>${I("chevron", "u-chev")}</summary>
            <ol class="u-lessons">${u.lessons.map((l) => `<li>${row(k, l)}</li>`).join("")}</ol>
          </details>`).join("")}</div>`).join("") : `<p class="notice small">${T("toc_missing")}</p>`}
        <p class="src-foot small muted">${I("shield")}<span>${T("toc_source")}</span></p>
      </section>`;
    },

    start() {
      const p = S.profile ? { ...S.profile, weak: [...S.profile.weak] } : { name: "", branch: "", target: 85, weak: [], minutes: 20, examDate: CFG.defaultExamDate };
      let step = 0; const N = 5;
      const render = () => {
        const b = branchOf(p.branch);
        const q = [
          () => `<label class="q-label" for="ob-name">${T("ob_name")}</label><input class="field lg" id="ob-name" value="${esc(p.name)}" placeholder="${T("ob_name_ph")}" maxlength="40" autocomplete="given-name">`,
          () => `<p class="q-label" id="ob-q">${T("ob_branch")}</p><div class="opts" role="radiogroup" aria-labelledby="ob-q">${window.BRANCHES.map((x) => `<button class="opt" role="radio" aria-checked="${p.branch === x.id}" data-v="${x.id}"><span>${esc(L(x.name))}</span><span class="o-m"></span></button>`).join("")}</div>`,
          () => `<label class="q-label" for="ob-target">${T("ob_target")}</label><p class="muted small">${T("ob_target_hint")}</p><div class="target"><b id="ob-tv">${pct(p.target)}</b><input type="range" min="60" max="99" value="${p.target}" id="ob-target" dir="ltr"></div>`,
          () => `<p class="q-label" id="ob-q">${T("ob_subjects")}</p><p class="muted small">${T("ob_subjects_hint")}</p><div class="opts" role="group" aria-labelledby="ob-q">${b.subjects.map((s) => `<button class="opt" aria-pressed="${p.weak.includes(s)}" data-v="${s}">${tile(s, "sm")}<span>${esc(subjName(s))}</span><span class="o-m box"></span></button>`).join("")}</div>`,
          () => `<p class="q-label" id="ob-q">${T("ob_minutes")}</p><div class="opts row" role="radiogroup" aria-labelledby="ob-q">${[10, 20, 30, 45].map((m) => `<button class="opt center" role="radio" aria-checked="${p.minutes === m}" data-v="${m}"><b>${num(m)}</b><span class="small muted">${T("minutes")}</span></button>`).join("")}</div>
                 <label class="q-label sm" for="ob-exam">${T("ob_exam")}</label><input type="date" class="field" id="ob-exam" value="${p.examDate}">`,
        ][step]();
        app().innerHTML = `<section class="wrap section ob">
          <aside class="ob-aside"><h1>${T("ob_title")}</h1><p class="muted">${T("ob_sub")}</p>
            <ol class="stepper">${[1, 2, 3, 4, 5].map((n, i) => `<li class="${i < step ? "done" : i === step ? "cur" : ""}"><span>${i < step ? I("check") : num(n)}</span>${T("ob_s" + n)}</li>`).join("")}</ol>
            <div class="ob-progress"><p class="small muted" aria-live="polite">${fill("ob_step", { n: num(step + 1), t: num(N) })}</p>${bar((step + 1) / N)}</div>
          </aside>
          <div class="card ob-card">${q}
            <div class="ob-actions">${step ? `<button class="btn quiet" id="ob-back">${I("arrow", "flip back-ic")}${T("back")}</button>` : "<span></span>"}<button class="btn primary" id="ob-next">${step === N - 1 ? T("finish") : T("next")}${I("arrow", "flip")}</button></div>
          </div></section>`;
        const nextBtn = $("#ob-next");
        const valid = () => [p.name.trim(), p.branch, 1, 1, p.minutes][step];
        const refresh = () => (nextBtn.disabled = !valid());
        const name = $("#ob-name");
        if (name) { name.addEventListener("input", () => { p.name = name.value; refresh(); }); name.addEventListener("keydown", (e) => e.key === "Enter" && nextBtn.click()); name.focus(); }
        $("#ob-target")?.addEventListener("input", (e) => { p.target = +e.target.value; $("#ob-tv").innerHTML = pct(p.target); });
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
      const plan = dailyPlan(), next = plan[0], rest = plan.slice(1);
      const streak = S.streak.last >= today() - DAY ? S.streak.count : 0;
      const week = Array.from({ length: 7 }, (_, i) => today() - (6 - i) * DAY);
      // Lessons: subject · minutes. Review/practice titles already name the kind and subject, so only minutes.
      const ms = b.subjects.map((s) => [s, subjectMastery(s)]); // one empty-state line until there is data, not a wall of zero rows
      const line = (it) => (it.kind === "lesson" ? `${esc(subjName(it.subject))} · ` : "") + `${num(it.minutes)} ${T("minutes")}`;
      // Greeting → one next step → two numbers → the rest of today → mastery. Settings live in one menu.
      app().innerHTML = `<section class="wrap section dash">
        <header class="dash-h">
          <div><p class="eyebrow">${fmtDate(today(), { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1>${new Date().getHours() < 12 ? T("greet_m") : T("greet_e")}${S.lang === "ar" ? "،" : ","} ${esc(p.name)}</h1>
            <p class="muted dash-sub">${esc(L(b.name))} · ${T("goal")} ${pct(p.target)}</p></div>
          <div class="menu">
            <button class="btn secondary sm menu-btn" aria-expanded="false" aria-controls="dash-menu">${I("settings")}<span>${T("settings")}</span></button>
            <div class="menu-pop" id="dash-menu" hidden>
              <a href="#/start">${I("pencil")}<span>${T("edit_plan")}</span></a>
              <a target="_blank" rel="noopener" href="${waLink(`${T("rem_title")} — ${p.name} · ${L(b.name)}`)}">${I("message")}<span>${T("rem_btn")}<small>${T("rem_desc")}</small></span></a>
              <button class="danger" id="reset">${I("trash")}<span>${T("reset")}</span></button>
            </div>
          </div>
        </header>
        ${next ? `<a class="dash-next" href="${next.href}">
            <span class="dn-copy"><span class="eyebrow">${T("up_next")}</span><b>${esc(itemTitle(next))}</b><span class="dn-m">${line(next)}</span></span>
            <span class="btn light">${I("play")}${T(next.kind === "lesson" ? "start" : "continue")}</span></a>`
          : `<div class="note-mint done-msg">${I("check")}<span>${T("plan_done")}</span></div>`}
        <div class="dash-stats">
          <div class="dstat"><span class="st-ic">${I("calendar")}</span><div><b>${num(days)}</b><span>${T("days_to_exam")}</span><small>${fmtDate(exam)}</small></div></div>
          <div class="dstat"><span class="st-ic">${I("flame")}</span><div>${streak ? `<b>${num(streak)}</b><span>${T("streak")}</span>` : `<b class="st-zero">${T("streak_start")}</b><span>${T("streak_start_d")}</span>`}
            <span class="week" role="img" aria-label="${T("this_week")}">${week.map((d) => `<i class="${S.activity[dkey(d)] ? "on" : ""} ${d === today() ? "today" : ""}" title="${fmtDate(d, { weekday: "long" })}"></i>`).join("")}</span></div></div>
        </div>
        <div class="dash-grid">
          ${rest.length ? `<div class="card"><h2 class="h-sm">${T("plan_rest")}</h2>
            <ol class="plan">${rest.map((it, i) => `<li><a href="${it.href}"><span class="num-badge sm">${num(i + 2)}</span><div><b>${esc(itemTitle(it))}</b><small>${line(it)}</small></div>${I("chevron", "i-dir chev")}</a></li>`).join("")}</ol></div>` : ""}
          <div class="card"><h2 class="h-sm">${T("mastery")}</h2>
            ${ms.some(([, m]) => m !== null) ? `<ul class="mastery">${ms.map(([s, m]) => `<li><span class="ms-n">${esc(subjName(s))}</span>${bar(m)}<small>${m === null ? T("not_started") : pct(Math.round(m * 100))}</small></li>`).join("")}</ul>`
              : `<p class="muted ms-empty">${T("mastery_empty")}</p>`}</div>
        </div></section>`;
      const btn = $(".menu-btn"), pop = $("#dash-menu");
      const setMenu = (on, focus) => { pop.hidden = !on; btn.setAttribute("aria-expanded", on); if (on && focus) $("a, button", pop).focus(); };
      btn.addEventListener("click", () => setMenu(pop.hidden, true));
      $(".menu").addEventListener("keydown", (e) => { if (e.key === "Escape" && !pop.hidden) { setMenu(false); btn.focus(); } });
      document.addEventListener("click", function off(e) { if (!pop.isConnected) return document.removeEventListener("click", off); if (!e.target.closest(".menu")) setMenu(false); });
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
            <div class="predict"><label for="pr">${L(st.predict.q)}</label><input id="pr" class="num-input" inputmode="decimal" autocomplete="off" dir="ltr"></div>`;
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
            P.progress(i, j / qs.length); P.step(`${L(st.title)} <span class="count">${num(j + 1)} ${T("of")} ${num(qs.length)}</span>`);
            askQuestion(qs[j], P, (ft) => { total++; correct += ft ? 1 : 0; j++; ask(); });
          };
          ask();
        }
      };
      run();
    },

    practice(subject) {
      if (!SUBJ[subject] || !window.QUESTIONS.some((q) => q.subject === subject)) return go("#/learn");
      const pool = window.QUESTIONS.filter((q) => q.subject === subject)
        .map((q) => ({ q, w: (S.mastery[mkey(q)]?.m ?? 0.2) + Math.random() * 0.3 }))
        .sort((a, b) => a.w - b.w).slice(0, 5).map((x) => x.q);
      const xp0 = S.xp; let j = 0, correct = 0;
      const P = Player({ title: `${T("practise")} · ${subjName(subject)}`, subject, segments: pool.length, exit: S.profile ? "#/dashboard" : "#/learn" });
      const ask = () => {
        if (j >= pool.length) return summary(P, { title: T("practice_done"), correct, total: pool.length, xp: S.xp - xp0, again: `#/practice/${subject}` });
        P.progress(j); P.step(`${T("question")} <span class="count">${num(j + 1)} ${T("of")} ${num(pool.length)}</span>`);
        askQuestion(pool[j], P, (ft) => { correct += ft ? 1 : 0; j++; ask(); });
      };
      ask();
    },

    // Past-paper library: branch → subject → year × session. Progressive disclosure, state lives in the URL
    // (#/exams/<branch>/<subject>) so Back works and links from subject pages land on the right list.
    exams(bArg, sArg) {
      const E = window.EXAMS;
      const hosted = Object.keys(E.branchNames).filter((k) => E.papers.some((p) => p.b === k));
      const br = hosted.includes(bArg) ? bArg : hosted.includes(S.profile?.branch) ? S.profile.branch : hosted[0];
      const all = E.papers.filter((p) => p.b === br);
      const order = branchOf(br)?.subjects || [];
      const subs = [...new Set(all.map((p) => p.sub))].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
      const sub = subs.includes(sArg) ? sArg : "";
      const count = (s) => all.filter((p) => p.sub === s).length;
      const branchNav = `<nav class="ex-branch" aria-label="${T("f_branch")}">${hosted.map((k) => `<a class="ex-seg" href="#/exams/${k}" ${k === br ? 'aria-current="page"' : ""}>${esc(L(E.branchNames[k]))}</a>`).join("")}</nav>`;
      const foot = `<p class="ex-foot small muted">${I("shield")}<span>${T("ex_src_line")} <a href="${E.source}" target="_blank" rel="noopener"><bdi>elearn.edu.ps</bdi></a>. ${T("ex_other_br")}</span></p>`;
      let body;
      if (!sub) {
        body = `<h2 class="ex-h">${T("ex_pick_subject")}</h2>
          <ul class="ex-subjects">${subs.map((s) => `<li><a class="ex-subj" href="#/exams/${br}/${s}">${tile(s)}<span class="ex-subj-t"><b>${esc(subjName(s))}</b><span class="small muted">${papersN(count(s))}</span></span>${I("chevron", "i-dir ex-go")}</a></li>`).join("")}</ul>`;
      } else {
        const list = all.filter((p) => p.sub === sub);
        const years = [...new Set(list.map((p) => p.y))].sort((a, b) => b - a);
        const label = (p) => (p.p ? T("paper_" + p.p) : p.v ? T("var_" + p.v) : T("ex_open_paper"));
        const link = (p) => `<a class="ex-paper" href="#/paper/${p.id}">${I("file")}<span>${label(p)}</span>${window.SOLUTIONS?.[p.id] ? `<span class="ex-sol" title="${T("has_solutions")}">${I("check")}<span class="vh">${T("has_solutions")}</span></span>` : ""}</a>`;
        body = `<nav class="ex-subnav" aria-label="${T("f_subject")}">${subs.map((s) => `<a class="chip" href="#/exams/${br}/${s}" ${s === sub ? 'aria-current="page"' : ""}>${esc(subjName(s))}</a>`).join("")}</nav>
          <div class="ex-subhead">${tile(sub, "lg")}<div><h2>${esc(subjName(sub))}</h2><p class="small muted">${papersN(list.length)} · ${num(Math.min(...years))}–${num(Math.max(...years))}</p></div>
            <a class="btn quiet sm ex-back" href="#/exams/${br}">${I("arrow", "back-ic")}${T("ex_all_subj")}</a></div>
          <div class="ex-years">${years.map((y) => `<section class="ex-year" aria-labelledby="ey-${y}"><h3 id="ey-${y}">${num(y)}</h3><ul>${[1, 2, 3].map((s) => {
            const ps = list.filter((p) => p.y === y && p.s === s).sort((a, b) => (a.p || 0) - (b.p || 0) || String(a.v || "").localeCompare(String(b.v || "")));
            return ps.length ? `<li><span class="ex-ses">${T("ses_" + s)}</span><span class="ex-links">${ps.map(link).join("")}</span></li>` : "";
          }).join("")}</ul></section>`).join("")}</div>`;
      }
      app().innerHTML = `<section class="wrap section exams-page">
          <div class="sec-head left"><p class="eyebrow" lang="en">Past papers</p><h1>${T("ex_title")}</h1><p class="lede">${T("ex_sub")}</p></div>
          <div class="ex-bar"><span class="ex-bar-l small muted" id="exb-l">${T("f_branch")}</span>${branchNav}</div>
          ${body}
          ${foot}
        </section>`;
      requestAnimationFrame(() => $(".ex-subnav [aria-current]")?.scrollIntoView({ block: "nearest", inline: "center" }));
    },

    // Paper viewer: pre-rendered WebP pages (tools/render_exam_pages.py), not PDF.js, so Arabic reads exactly like the original.
    paper(id) {
      const E = window.EXAMS, p = E.papers.find((x) => x.id === id); if (!p) return go("#/exams");
      const sol = window.SOLUTIONS?.[id], n = p.pages || 0, H = Math.round(1300 * (p.ratio || 1.4146));
      const solOpen = !!sol && window.matchMedia("(min-width: 1100px)").matches; // answers start open on desktop, set in the markup so nothing shifts after load
      const title = `${subjName(p.sub)}${p.p ? ` · ${T("paper_" + p.p)}` : ""}`;
      const pct = (z) => `<bdi>${num(Math.round(z * 100))}${S.lang === "ar" ? "٪" : "%"}</bdi>`;
      const pageOf = (k) => T("pv_page_of").replace("{n}", num(k)).replace("{t}", num(n));
      // Solutions grouped by question: "السؤال الأول (أ) ١" → group "السؤال الأول (أ)", item "١".
      const groups = [];
      sol?.items.forEach((it, i) => {
        const q = L(it.q).trim(), cut = q.lastIndexOf(" "), g = cut > 0 ? q.slice(0, cut) : q, item = cut > 0 ? q.slice(cut + 1) : num(i + 1);
        let grp = groups.find((x) => x.g === g); if (!grp) groups.push((grp = { g, items: [] }));
        grp.items.push({ ...it, i, item });
      });
      const solHtml = sol ? `<aside id="pv-sol" class="pv-sol" aria-labelledby="pvs-t" ${mathAttr(p.sub)}>
          <div class="pvs-grab" aria-hidden="true"></div>
          <div class="pvs-head"><h2 id="pvs-t" tabindex="-1">${T("has_solutions")}</h2><span class="badge muted">${T("pv_unofficial")}</span>
            <button class="icon-btn pvs-x" aria-label="${T("pv_close")}">${I("x")}</button></div>
          <p class="small muted pvs-note">${L(sol.note)}</p>
          <button class="btn quiet sm pvs-all" aria-pressed="false">${T("pv_reveal_all")}</button>
          <div class="sol-groups">${groups.map((g, gi) => `<details class="sol-g" ${gi === 0 ? "open" : ""}>
            <summary><b>${esc(g.g)}</b><span class="small muted">${itemsN(g.items.length)}</span>${I("chevron", "sol-chev")}</summary>
            <ol class="sol-list">${g.items.map((it) => `<li class="sol">
              <button class="sol-row" aria-expanded="false" aria-controls="sa-${it.i}"><span class="num-badge sm" aria-hidden="true">${esc(it.item)}</span><span class="sol-l">${T("pv_item")} ${esc(it.item)}<span class="vh"> · ${esc(g.g)}</span></span><span class="sol-hint small">${T("pv_reveal")}</span></button>
              <div class="sol-a" id="sa-${it.i}" hidden><p class="sol-ans"><span>${T("pv_answer")}</span> ${L(it.ans)}</p><p class="sol-steps">${L(it.steps)}</p></div></li>`).join("")}</ol>
          </details>`).join("")}</div>
        </aside><div class="pv-scrim" hidden></div>` : "";
      const practise = window.QUESTIONS.some((q) => q.subject === p.sub);
      app().innerHTML = `<section class="paper-view">
        <header class="wrap pv-head">
          <a class="back-link" href="#/exams/${p.b}/${p.sub}">${I("arrow", "back-ic")}${T("sub_papers")}</a>
          <h1>${esc(title)}</h1>
          ${meta(esc(L(E.branchNames[p.b])), num(p.y), T("ses_" + p.s), p.v ? T("var_" + p.v) : "")}
        </header>
        <div class="pv-bar"><div class="wrap pv-bar-in" role="toolbar" aria-label="${T("pv_tools")}">
          <div class="zoom" role="group" aria-label="${T("pv_zoom")}">
            <button class="icon-btn z-out" aria-label="${T("pv_zoom_out")}">${I("minus")}</button>
            <button class="z-val" aria-label="${T("pv_fit")}" title="${T("pv_fit")}">${pct(1)}</button>
            <button class="icon-btn z-in" aria-label="${T("pv_zoom_in")}">${I("plus")}</button>
          </div>
          <span class="pv-pgi small muted" aria-live="off">${n ? pageOf(1) : ""}</span>
          <span class="pv-sp"></span>
          <a class="btn secondary sm pv-dl" href="${p.file}" download="${esc(p.orig)}" aria-label="${T("pv_download")}">${I("download")}<span class="pv-dl-t">${T("pv_download")}</span></a>
          ${sol ? `<button class="btn ${solOpen ? "primary" : "soft"} sm pv-toggle" aria-expanded="${solOpen}" aria-controls="pv-sol">${I("check")}${T("pv_answers")}</button>` : ""}
        </div></div>
        <div class="wrap pv-body${solOpen ? " with-sol" : ""}">
          <div class="pv-doc" tabindex="0" aria-label="${esc(title)}">
            <div class="pv-pages">${Array.from({ length: n }, (_, i) => `<figure class="pv-page" id="pg-${i + 1}" data-n="${i + 1}">
              <img src="${p.img}/p${i + 1}.webp" width="1300" height="${H}" alt="${esc(title)} — ${pageOf(i + 1)}" decoding="async" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></figure>`).join("") || `<p class="notice small">${T("pv_fail")}</p>`}</div>
          </div>
          ${solHtml}
        </div>
        <div class="wrap pv-after">
          ${sol ? "" : `<p class="small muted">${T("pv_no_sol_short")}${practise ? ` <a href="#/practice/${p.sub}">${T("practise")}</a>` : ""}</p>`}
          <p class="small muted pv-credit">${I("shield")}<span>${T("pv_credit")} <a href="${E.source}" target="_blank" rel="noopener"><bdi>elearn.edu.ps</bdi></a></span></p>
        </div>
      </section>`;

      // Broken image → say so on that page and point at the PDF.
      $$(".pv-page img").forEach((img) => img.addEventListener("error", () => {
        img.closest(".pv-page").classList.add("broken");
        img.replaceWith(Object.assign(document.createElement("p"), { className: "pv-broken small", textContent: T("pv_img_fail") }));
      }, { once: true }));

      // Zoom: one CSS variable, no re-render. 100% = fit width (capped on desktop); max keeps the 1300px images sharp.
      const doc = $(".pv-doc"), zv = $(".z-val");
      let z = 1;
      const maxZ = () => Math.max(1.5, Math.floor(Math.min(2, 1300 / Math.min(doc.clientWidth || 900, 920)) * 4) / 4);
      const curPage = () => {
        const top = ($(".topbar")?.offsetHeight || 0) + ($(".pv-bar")?.offsetHeight || 0) + 8;
        let cur = $(".pv-page"); for (const el of $$(".pv-page")) { if (el.getBoundingClientRect().top <= top + 40) cur = el; else break; }
        return { cur, top };
      };
      const setZoom = (nz) => {
        nz = Math.round(Math.max(1, Math.min(maxZ(), nz)) * 100) / 100; if (nz === z) return;
        const { cur, top } = curPage(), r0 = cur?.getBoundingClientRect(), frac = r0 ? (top - r0.top) / r0.height : 0;
        z = nz; doc.style.setProperty("--z", z); zv.innerHTML = pct(z);
        $(".z-out").disabled = z <= 1; $(".z-in").disabled = z >= maxZ() - 0.001;
        if (cur && frac > 0) { const r1 = cur.getBoundingClientRect(); window.scrollBy(0, r1.top + frac * r1.height - top); }
      };
      $(".z-in").onclick = () => setZoom(z + 0.25); $(".z-out").onclick = () => setZoom(z - 0.25); zv.onclick = () => setZoom(1);
      $(".z-out").disabled = true;

      // Page indicator follows scrolling.
      const pgi = $(".pv-pgi"); let ticking = false;
      const onScroll = () => {
        if (!pgi.isConnected) return window.removeEventListener("scroll", onScroll);
        if (ticking) return; ticking = true;
        requestAnimationFrame(() => { ticking = false; const { cur } = curPage(); if (cur) pgi.textContent = pageOf(+cur.dataset.n); });
      };
      if (n > 1) window.addEventListener("scroll", onScroll, { passive: true });

      if (!sol) return;
      // Solutions: side panel on wide screens, bottom sheet below 1100px.
      const body = $(".pv-body"), tog = $(".pv-toggle"), panel = $("#pv-sol"), scrim = $(".pv-scrim");
      const wide = window.matchMedia("(min-width: 1100px)");
      const setOpen = (on, focus) => {
        body.classList.toggle("with-sol", on); tog.setAttribute("aria-expanded", on);
        tog.classList.toggle("primary", on); tog.classList.toggle("soft", !on);
        scrim.hidden = !on || wide.matches;
        document.body.classList.toggle("sheet-open", on && !wide.matches);
        if (on && focus) $("#pvs-t").focus({ preventScroll: wide.matches });
        if (!on && focus) tog.focus();
      };
      tog.onclick = () => setOpen(!body.classList.contains("with-sol"), true);
      $(".pvs-x").onclick = () => setOpen(false, true);
      scrim.onclick = () => setOpen(false, true);
      panel.addEventListener("keydown", (e) => { if (e.key === "Escape" && !wide.matches) setOpen(false, true); });
      wide.addEventListener("change", () => { if (panel.isConnected) setOpen(body.classList.contains("with-sol") && wide.matches, false); });
      setOpen(wide.matches, false);
      const reveal = (li, on) => {
        li.querySelector(".sol-a").hidden = !on; const b = li.querySelector(".sol-row");
        b.setAttribute("aria-expanded", on); b.querySelector(".sol-hint").textContent = on ? T("pv_hide") : T("pv_reveal");
      };
      $$(".sol").forEach((li) => (li.querySelector(".sol-row").onclick = () => reveal(li, li.querySelector(".sol-a").hidden)));
      $(".pvs-all").onclick = (e) => {
        const b = e.currentTarget, open = b.getAttribute("aria-pressed") !== "true";
        $$(".sol-g").forEach((d) => (d.open = open || d === $(".sol-g")));
        $$(".sol").forEach((li) => reveal(li, open));
        b.setAttribute("aria-pressed", open); b.textContent = open ? T("pv_hide_all") : T("pv_reveal_all");
      };
    },

    // Roadmap item 02 from the deck: register interest in tutor sessions. One action.
    tutors() {
      app().innerHTML = `<section class="wrap section tu-page">
        <a class="back-link" href="#/">${I("arrow", "back-ic")}${T("nav_home")}</a>
        <div class="sec-head left"><p class="eyebrow" lang="en">Additional service · Coming soon</p><h1>${T("h_r2_t")}</h1><p class="lede">${T("tu_sub")}</p></div>
        <ol class="tu-points">${[1, 2, 3].map((n) => `<li><span class="num-badge">${seq(n)}</span><div><h2 class="h-sm">${T(`tu${n}_t`)}</h2><p>${T(`tu${n}_d`)}</p></div></li>`).join("")}</ol>
        <div class="tu-cta"><div><h2>${T("tu_cta_t")}</h2><p>${T("tu_cta_d")}</p></div>
          <div class="tu-act"><a class="btn light lg" target="_blank" rel="noopener" href="${waLink(`${T("tu_interest")} — ${T("brand")}`)}">${I("message")}${T("tu_interest")}</a>
          <a class="text-link" target="_blank" rel="noopener" href="${waLink(`${T("tu_apply")} — ${T("brand")}`)}">${T("tu_apply")}${I("arrow", "flip")}</a></div></div>
      </section>`;
    },

    // One form; WhatsApp and Messenger are a secondary line underneath.
    join() {
      app().innerHTML = `<section class="wrap section join">
        <div class="join-copy"><p class="eyebrow" lang="en">Join Najih</p><h1>${T("j_title")}</h1><p class="lede">${T("j_sub")}</p>
          <ul class="checks">${[1, 2, 3].map((n) => `<li>${I("check")}${T("j" + n)}</li>`).join("")}</ul></div>
        <div class="card join-card"><div class="join-panel">
          <form id="jf" class="form" novalidate>
            <label>${T("name")}<input class="field" name="name" maxlength="40" autocomplete="given-name" value="${esc(S.profile?.name || "")}"></label>
            <div class="f-row"><label for="jf-phone">${T("phone")}</label><div class="phone-field" dir="ltr"><select name="cc" aria-label="${T("cc_label")}"><option value="970">+970</option><option value="972">+972</option></select><input id="jf-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="${T("phone_ph")}"></div></div>
            <label>${T("branch")}<select class="field" name="branch">${window.BRANCHES.map((b) => `<option value="${b.id}" ${S.profile?.branch === b.id ? "selected" : ""}>${esc(L(b.name))}</option>`).join("")}</select></label>
            <label class="check"><input type="checkbox" name="consent"><span>${T("consent")}</span></label>
            <p class="form-err" role="alert"></p>
            <button class="btn primary block" type="submit">${T("submit")}</button></form>
          <p class="join-alt small">${T("j_or")} <a target="_blank" rel="noopener" href="${waLink(`${T("j_title")} — ${S.profile?.name || ""}`)}">${T("via_wa")}</a> · <a target="_blank" rel="noopener" href="${fbLink()}">${T("via_fb")}</a></p>
        </div></div></section>`;
      const panel = $(".join-panel");
      $("#jf").addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = new FormData(e.target), err = $(".form-err", panel);
        const name = String(f.get("name")).trim().slice(0, 40);
        const local = normDigits(f.get("phone")).replace(/\D/g, "").replace(/^0/, "");
        if (!name) return (err.textContent = T("invalid_name"));
        if (!/^5\d{8}$/.test(local)) return (err.textContent = T("invalid_phone"));
        if (!f.get("consent")) return (err.textContent = T("need_consent"));
        const entry = { name, phone: `+${f.get("cc")}${local}`, branch: f.get("branch"), lang: S.lang, source: "web", at: new Date().toISOString() };
        S.signups.push(entry); save();
        let sent = false;
        if (CFG.signupEndpoint) { try { sent = (await fetch(CFG.signupEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) })).ok; } catch (_) {} }
        panel.innerHTML = `<div class="success" tabindex="-1">${I("check")}<h2 class="h-sm">${T("thanks_t")}</h2><p class="muted">${T("thanks_d")}</p>
          ${sent ? "" : `<a class="btn primary" target="_blank" rel="noopener" href="${waLink(`${T("j_title")}: ${entry.name} · ${entry.phone} · ${L(branchOf(entry.branch).name)}`)}">${I("message")}${T("open_wa")}</a>`}</div>`;
        $(".success", panel).focus();
      });
    },
  };

  // ───────────────────────── Router & global handlers ─────────────────────────
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function route() {
    const [, name = "", arg, arg2] = (location.hash || "#/").split("/");
    window.speechSynthesis?.cancel(); window.__layout = null;
    const view = views[name] ? name : "home";
    focusMode(false); applyLang();
    $("#top-cta").hidden = !!S.profile && view === "dashboard"; // the nav pill already says «خطتي» there
    $$("[data-nav]").forEach((a) => a.toggleAttribute("aria-current", a.dataset.nav === ({ branch: "learn", subject: "learn", read: "learn", paper: "exams" }[view] || view)));
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
    // Enter checks/continues — also right after choosing an option with 1–4 (focus is then on the option button).
    if (e.key === "Enter" && !tgt.matches("button:not(.option), a, .handle")) {
      const m = $(".b-main"); if (m && !m.disabled) { e.preventDefault(); m.click(); } return;
    }
    const n = "1234".indexOf(e.key) + 1 || "١٢٣٤".indexOf(e.key) + 1;
    if (n && !typing) { const o = $$(".option")[n - 1]; if (o && !o.disabled) { o.click(); o.focus(); } }
  });
  route();
})();
