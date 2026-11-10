(() => {
  "use strict";
  const CFG = window.NAJIH_CONFIG;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DAY = 864e5;
  const today = () => new Date(new Date().toDateString()).getTime();

  // ───────────── Store (localStorage, fails soft) ─────────────
  const KEY = "najih:v1";
  const defaults = () => ({ lang: "ar", profile: null, mastery: {}, xp: 0, streak: { count: 0, last: 0 }, done: [], signups: [] });
  let S = defaults();
  try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };

  // ───────────── i18n ─────────────
  const T = (k) => (window.I18N[S.lang] && window.I18N[S.lang][k]) ?? k;
  const L = (obj) => (obj ? obj[S.lang] ?? obj.en : "");
  const num = (n) => (S.lang === "ar" ? Number(n).toLocaleString("ar-EG") : String(n));
  const normDigits = (s) => String(s).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/٫/g, ".");

  function applyLang() {
    document.documentElement.lang = S.lang;
    document.documentElement.dir = S.lang === "ar" ? "rtl" : "ltr";
    document.title = `${T("brand")} — ${T("tagline")}`;
    $$("[data-t]").forEach((el) => (el.textContent = T(el.dataset.t)));
  }

  // ───────────── Learning model ─────────────
  const mkey = (q) => `${q.subject}:${q.skill}`;
  function record(q, correct) {
    const k = mkey(q);
    const m = S.mastery[k] || { m: 0.2, n: 0, iv: 0, next: 0 };
    m.m = +(m.m + 0.35 * ((correct ? 1 : 0) - m.m)).toFixed(3);
    m.n++;
    m.iv = correct ? Math.min(30, Math.max(1, m.iv * 2)) : 1; // spaced review interval (days)
    m.next = today() + m.iv * DAY;
    S.mastery[k] = m;
    S.xp += correct ? 10 : 2;
    bumpStreak();
    save();
  }
  function bumpStreak() {
    const d = today();
    if (S.streak.last === d) return;
    S.streak.count = S.streak.last === d - DAY ? S.streak.count + 1 : 1;
    S.streak.last = d;
  }
  function subjectMastery(subject) {
    const vals = Object.entries(S.mastery).filter(([k]) => k.startsWith(subject + ":")).map(([, v]) => v.m);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  const branchOf = (id) => window.BRANCHES.find((b) => b.id === id);

  function dailyPlan() {
    const p = S.profile; if (!p) return [];
    const subjects = branchOf(p.branch).subjects;
    const order = [...p.weak.filter((s) => subjects.includes(s)), ...subjects.filter((s) => !p.weak.includes(s))]
      .sort((a, b) => (subjectMastery(a) ?? 0.2) - (subjectMastery(b) ?? 0.2) + (p.weak.includes(b) - p.weak.includes(a)) * 0.5);
    const items = []; let mins = 0;
    // 1) spaced-review items that are due
    const due = Object.entries(S.mastery).filter(([k, v]) => v.next <= today() && subjects.includes(k.split(":")[0]));
    for (const [k] of due.slice(0, 2)) { items.push({ kind: "review", subject: k.split(":")[0], minutes: 4 }); mins += 4; }
    // 2) new lessons / practice in weakest subjects
    for (const s of order) {
      if (mins >= p.minutes) break;
      if (items.some((i) => i.subject === s)) continue;
      const lesson = window.LESSONS.find((l) => l.subject === s && !S.done.includes(l.id));
      if (lesson) { items.push({ kind: "lesson", subject: s, lesson, minutes: lesson.minutes }); mins += lesson.minutes; }
      else if (window.QUESTIONS.some((q) => q.subject === s)) { items.push({ kind: "practice", subject: s, minutes: 5 }); mins += 5; }
    }
    return items;
  }

  // ───────────── Question widget ─────────────
  function renderQuestion(q, host, onDone) {
    let attempts = 0, selected = null, finished = false;
    host.innerHTML = `
      <div class="q-card">
        <div class="q-text">${L(q.q)}</div>
        ${q.type === "mcq"
          ? `<div class="choices">${q.choices.map((c, i) => `<button class="choice" data-i="${i}"><span class="ci">${"أبجد"[i] && S.lang === "ar" ? "أبجد"[i] : "ABCD"[i]}</span><span>${L(c)}</span></button>`).join("")}</div>`
          : `<input class="num-input" inputmode="decimal" autocomplete="off" placeholder="${S.lang === "ar" ? "اكتب الإجابة" : "Your answer"}" dir="ltr">`}
        <div class="q-feedback" aria-live="polite"></div>
        <div class="q-actions">
          <button class="btn ghost hint-btn">💡 ${T("hint")}</button>
          <button class="btn primary check-btn">${T("check")}</button>
        </div>
      </div>`;
    const fb = $(".q-feedback", host), check = $(".check-btn", host), hintBtn = $(".hint-btn", host);
    $$(".choice", host).forEach((b) => b.addEventListener("click", () => {
      if (finished) return;
      $$(".choice", host).forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel"); selected = +b.dataset.i;
    }));
    const input = $(".num-input", host);
    if (input) input.addEventListener("keydown", (e) => e.key === "Enter" && check.click());
    hintBtn.addEventListener("click", () => { fb.className = "q-feedback hint"; fb.innerHTML = `💡 ${L(q.hint)}`; });
    check.addEventListener("click", () => {
      if (finished) return onDone(attempts === 1);
      let ok;
      if (q.type === "mcq") { if (selected === null) return; ok = selected === q.answer; }
      else { const v = parseFloat(normDigits(input.value).trim()); if (isNaN(v)) return; ok = Math.abs(v - q.answer) <= (q.tol ?? 1e-6); }
      attempts++;
      if (ok || attempts >= 2) {
        finished = true;
        record(q, ok && attempts === 1);
        if (q.type === "mcq") {
          $$(".choice", host).forEach((b, i) => { b.disabled = true; if (i === q.answer) b.classList.add("right"); else if (i === selected) b.classList.add("bad"); });
        } else { input.disabled = true; input.classList.add(ok ? "right" : "bad"); }
        fb.className = "q-feedback " + (ok ? "good" : "bad");
        fb.innerHTML = `${ok ? T("correct") : "📘"} <div class="explain">${L(q.explain)}</div>`;
        hintBtn.remove();
        check.textContent = T("continue");
        if (ok) confettiBurst(check);
      } else {
        fb.className = "q-feedback bad"; fb.textContent = T("wrong");
        if (q.type === "mcq") $$(".choice", host)[selected].classList.add("bad");
        else input.classList.add("bad");
        setTimeout(() => { $$(".choice.bad", host).forEach((b) => b.classList.remove("bad")); input && input.classList.remove("bad"); }, 700);
      }
    });
  }

  function runQuiz(qs, host, onFinish) {
    let i = 0, score = 0;
    const next = () => {
      if (i >= qs.length) return onFinish(score, qs.length);
      host.innerHTML = `<div class="q-progress">${T("question")} ${num(i + 1)} / ${num(qs.length)}<div class="bar"><span style="width:${(i / qs.length) * 100}%"></span></div></div><div class="q-host"></div>`;
      renderQuestion(qs[i], $(".q-host", host), (firstTry) => { score += firstTry ? 1 : 0; i++; next(); });
    };
    next();
  }

  function confettiBurst(anchor) {
    const r = anchor.getBoundingClientRect();
    for (let k = 0; k < 14; k++) {
      const s = document.createElement("span");
      s.className = "confetti";
      s.style.left = r.left + r.width / 2 + "px"; s.style.top = r.top + "px";
      s.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
      s.style.setProperty("--dy", (-60 - Math.random() * 90) + "px");
      s.style.background = ["#4f46e5", "#16a34a", "#f59e0b", "#ec4899", "#06b6d4"][k % 5];
      document.body.appendChild(s); setTimeout(() => s.remove(), 900);
    }
  }

  // ───────────── Interactive widgets ─────────────
  const WIDGETS = {
    tangent(host) {
      const W = 320, H = 230, sx = (x) => ((x + 3.5) / 7) * W, sy = (y) => H - ((y + 1.5) / 11.5) * H;
      const path = Array.from({ length: 71 }, (_, i) => { const x = -3.5 + i * 0.1; return `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(x * x).toFixed(1)}`; }).join("");
      host.innerHTML = `
        <div class="widget" dir="ltr">
          <svg viewBox="0 0 ${W} ${H}" class="plot" role="img" aria-label="y = x squared with tangent line">
            <line x1="0" x2="${W}" y1="${sy(0)}" y2="${sy(0)}" class="axis"/><line y1="0" y2="${H}" x1="${sx(0)}" x2="${sx(0)}" class="axis"/>
            <path d="${path}" class="curve"/><line class="tan"/><circle r="6" class="pt"/>
          </svg>
          <input type="range" min="-3" max="3" step="0.5" value="1" class="slider" aria-label="x">
          <div class="readout"><span>x = <b class="rx"></b></span><span>y = <b class="ry"></b></span><span class="slope">slope = <b class="rs"></b></span></div>
        </div>`;
      const sl = $(".slider", host), tan = $(".tan", host), pt = $(".pt", host);
      const draw = () => {
        const a = +sl.value, m = 2 * a, y0 = a * a, x1 = a - 2, x2 = a + 2;
        pt.setAttribute("cx", sx(a)); pt.setAttribute("cy", sy(y0));
        tan.setAttribute("x1", sx(x1)); tan.setAttribute("y1", sy(y0 + m * (x1 - a)));
        tan.setAttribute("x2", sx(x2)); tan.setAttribute("y2", sy(y0 + m * (x2 - a)));
        $(".rx", host).textContent = a; $(".ry", host).textContent = y0; $(".rs", host).textContent = m;
      };
      sl.addEventListener("input", draw); draw();
    },
    ohm(host) {
      host.innerHTML = `
        <div class="widget" dir="ltr">
          <div class="circuit"><div class="bulb"><span>💡</span></div><div class="meter"><span class="cur"></span><small>A</small></div></div>
          <label class="sl-row">V <input type="range" min="0" max="24" step="1" value="6" class="v"> <b class="vv"></b> V</label>
          <label class="sl-row">R <input type="range" min="1" max="20" step="1" value="3" class="r"> <b class="rv"></b> Ω</label>
          <div class="bar big"><span class="ibar"></span></div>
        </div>`;
      const v = $(".v", host), r = $(".r", host);
      const draw = () => {
        const I = v.value / r.value;
        $(".vv", host).textContent = v.value; $(".rv", host).textContent = r.value;
        $(".cur", host).textContent = I.toFixed(2);
        $(".ibar", host).style.width = Math.min(100, (I / 8) * 100) + "%";
        $(".bulb", host).style.filter = `brightness(${0.4 + Math.min(1.2, I / 4)}) drop-shadow(0 0 ${Math.min(24, I * 4)}px #facc15)`;
      };
      v.addEventListener("input", draw); r.addEventListener("input", draw); draw();
    },
  };

  // ───────────── Views ─────────────
  const app = () => $("#app");
  const subjName = (s) => L(window.SUBJECTS[s].name);
  const chip = (s) => `<span class="chip" style="--c:${window.SUBJECTS[s].color}"><i>${window.SUBJECTS[s].icon}</i>${esc(subjName(s))}</span>`;

  const views = {
    home() {
      const sample = window.LESSONS[0];
      app().innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <span class="pill">🇵🇸 ${T("mvp_note")} · ${T("tagline")}</span>
          <h1>${T("hero_title")}</h1>
          <p class="lead">${T("hero_sub")}</p>
          <div class="cta-row">
            <a class="btn primary lg" href="#/start">${T("hero_cta")}</a>
            <a class="btn ghost lg" href="#/lesson/${sample.id}">${T("hero_cta2")} ▸</a>
          </div>
          <div class="stats">
            <div><b>${num(6)}</b><span>${T("stat_branches")}</span></div>
            <div><b>${num(20)}</b><span>${T("stat_minutes")}</span></div>
            <div><b>⚡</b><span>${T("stat_feedback")}</span></div>
          </div>
        </div>
        <div class="hero-card" aria-hidden="true">
          <div class="phone">
            <div class="ph-top"><b>${T("today_plan")}</b><span class="streak-badge">🔥 ${num(7)}</span></div>
            <div class="ph-item done">✓ ${esc(L(window.LESSONS[0].title))}</div>
            <div class="ph-item">${chip("physics")} ${esc(L(window.LESSONS[1].title))}</div>
            <div class="ph-item">${chip("english")} ${T("review")} – ⏱ ${num(4)} ${T("min")}</div>
            <div class="ph-wa"><span>🟢 WhatsApp</span><p>${S.lang === "ar" ? "صباح الخير! مهمتك اليوم: ١٠ دقائق مشتقات + مراجعة إنجليزي 💪" : "Morning! Today: 10 min derivatives + an English review 💪"}</p></div>
          </div>
        </div>
      </section>

      <section class="section"><h2>${T("how_title")}</h2>
        <div class="grid four">${[1, 2, 3, 4].map((n) => `<div class="card step"><span class="step-n">${num(n)}</span><h3>${T(`how${n}_t`)}</h3><p>${T(`how${n}_d`)}</p></div>`).join("")}</div>
      </section>

      <section class="section"><h2>${T("feat_title")}</h2>
        <div class="grid three">${["🧪", "💡", "📈", "📝", "👩‍🏫", "🌐"].map((ic, i) => `<div class="card feat"><span class="ic">${ic}</span><h3>${T(`f${i + 1}_t`)}</h3><p>${T(`f${i + 1}_d`)}</p></div>`).join("")}</div>
      </section>

      <section class="section" id="branches"><h2>${T("branches_title")}</h2>
        <div class="grid three">${window.BRANCHES.map((b) => `
          <a class="card branch" href="#/branch/${b.id}"><h3>${esc(L(b.name))}</h3><div class="chips">${b.subjects.map(chip).join("")}</div><span class="go">${T("start_branch")} ▸</span></a>`).join("")}</div>
      </section>

      <section class="section cta-band"><h2>${T("cta_title")}</h2><p>${T("cta_sub")}</p>
        <div class="cta-row center">${joinButtons()}<a class="btn light" href="#/join">📱 ${T("via_phone")}</a></div>
      </section>`;
    },

    branch(id) {
      const b = branchOf(id); if (!b) return go("#/");
      app().innerHTML = `<section class="section"><a class="back" href="#/">◂ ${T("nav_home")}</a><h1>${esc(L(b.name))}</h1>
        <div class="grid three">${b.subjects.map((s) => {
          const lessons = window.LESSONS.filter((l) => l.subject === s);
          const nq = window.QUESTIONS.filter((q) => q.subject === s).length;
          const m = subjectMastery(s);
          return `<div class="card subj" style="--c:${window.SUBJECTS[s].color}">
            <div class="subj-h"><span class="subj-ic">${window.SUBJECTS[s].icon}</span><h3>${esc(subjName(s))}</h3></div>
            ${m !== null ? `<div class="bar"><span style="width:${m * 100}%"></span></div>` : ""}
            <ul class="lesson-list">${lessons.map((l) => `<li><a href="#/lesson/${l.id}">${S.done.includes(l.id) ? "✅" : "▶"} ${esc(L(l.title))} <small>${num(l.minutes)} ${T("min")}</small></a></li>`).join("") || `<li class="muted">${T("coming")}…</li>`}</ul>
            ${nq ? `<a class="btn ghost sm" href="#/practice/${s}">${T("practice")} (${num(nq)})</a>` : ""}
          </div>`; }).join("")}</div></section>`;
    },

    learn() {
      if (S.profile) return go(`#/branch/${S.profile.branch}`);
      go("#/"); setTimeout(() => $("#branches")?.scrollIntoView({ behavior: "smooth" }), 50);
    },

    start() {
      const p = S.profile ? { ...S.profile } : { name: "", branch: "", target: 90, weak: [], minutes: 20, examDate: CFG.defaultExamDate };
      let step = 0; const N = 5;
      const render = () => {
        const b = branchOf(p.branch);
        const body = [
          () => `<label class="q-label">${T("ob_name")}</label><input class="field" id="ob-name" value="${esc(p.name)}" placeholder="${T("ob_name_ph")}" maxlength="40">`,
          () => `<label class="q-label">${T("ob_branch")}</label><div class="opt-grid">${window.BRANCHES.map((x) => `<button class="opt ${p.branch === x.id ? "sel" : ""}" data-v="${x.id}">${esc(L(x.name))}</button>`).join("")}</div>`,
          () => `<label class="q-label">${T("ob_target")}</label><div class="target"><input type="range" min="60" max="99" value="${p.target}" id="ob-target"><b id="ob-tv">${num(p.target)}%</b></div>`,
          () => `<label class="q-label">${T("ob_subjects")}</label><div class="opt-grid">${b.subjects.map((s) => `<button class="opt ${p.weak.includes(s) ? "sel" : ""}" data-v="${s}">${window.SUBJECTS[s].icon} ${esc(subjName(s))}</button>`).join("")}</div>`,
          () => `<label class="q-label">${T("ob_minutes")}</label><div class="opt-grid">${[10, 20, 30, 45].map((m) => `<button class="opt ${p.minutes === m ? "sel" : ""}" data-v="${m}">${num(m)} ${T("min")}</button>`).join("")}</div>
                 <label class="q-label sm">${T("ob_exam")}</label><input type="date" class="field" id="ob-exam" value="${p.examDate}">`,
        ][step]();
        app().innerHTML = `<section class="section narrow"><div class="card onboard">
          <div class="q-progress">${T("ob_step")} ${num(step + 1)} ${T("ob_of")} ${num(N)}<div class="bar"><span style="width:${((step + 1) / N) * 100}%"></span></div></div>
          <h2>${T("ob_title")}</h2>${body}
          <div class="q-actions">${step ? `<button class="btn ghost" id="ob-back">${T("back")}</button>` : "<span></span>"}<button class="btn primary" id="ob-next">${step === N - 1 ? T("finish") : T("next")}</button></div>
        </div></section>`;
        const nextBtn = $("#ob-next");
        const valid = () => [p.name.trim(), p.branch, true, true, p.minutes][step];
        const refresh = () => (nextBtn.disabled = !valid());
        $("#ob-name")?.addEventListener("input", (e) => { p.name = e.target.value; refresh(); });
        $("#ob-name")?.focus();
        $("#ob-target")?.addEventListener("input", (e) => { p.target = +e.target.value; $("#ob-tv").textContent = num(p.target) + "%"; });
        $("#ob-exam")?.addEventListener("change", (e) => (p.examDate = e.target.value || CFG.defaultExamDate));
        $$(".opt").forEach((o) => o.addEventListener("click", () => {
          const v = o.dataset.v;
          if (step === 1) { if (p.branch !== v) p.weak = []; p.branch = v; $$(".opt").forEach((x) => x.classList.toggle("sel", x === o)); }
          if (step === 3) { p.weak = p.weak.includes(v) ? p.weak.filter((x) => x !== v) : [...p.weak, v]; o.classList.toggle("sel"); }
          if (step === 4) { p.minutes = +v; $$(".opt").forEach((x) => x.classList.toggle("sel", x === o)); }
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
      if (!p) { app().innerHTML = `<section class="section narrow center"><div class="card"><h2>${T("no_plan")}</h2><a class="btn primary lg" href="#/start">${T("make_plan")}</a></div></section>`; return; }
      const b = branchOf(p.branch);
      const days = Math.max(0, Math.ceil((new Date(p.examDate).getTime() - today()) / DAY));
      const plan = dailyPlan();
      const streak = S.streak.last >= today() - DAY ? S.streak.count : 0;
      app().innerHTML = `
      <section class="section">
        <div class="dash-head">
          <div><h1>${T("hello")} ${esc(p.name)} 👋</h1><p class="muted">${esc(L(b.name))} · 🎯 ${num(p.target)}%</p></div>
          <div class="kpis">
            <div class="kpi"><b>${num(days)}</b><span>${T("days_left")}</span></div>
            <div class="kpi"><b>🔥 ${num(streak)}</b><span>${T("streak")}</span></div>
            <div class="kpi"><b>⭐ ${num(S.xp)}</b><span>${T("xp")}</span></div>
          </div>
        </div>
        <div class="dash-grid">
          <div class="card">
            <h2>${T("today_plan")}</h2>
            <ol class="plan">${plan.map((it) => {
              const href = it.kind === "lesson" ? `#/lesson/${it.lesson.id}` : `#/practice/${it.subject}`;
              const label = it.kind === "lesson" ? `${T("lesson")}: ${esc(L(it.lesson.title))}` : `${T(it.kind)}: ${esc(subjName(it.subject))}`;
              return `<li><span class="kind k-${it.kind}">${it.kind === "lesson" ? "▶" : it.kind === "review" ? "↻" : "✎"}</span><div><b>${label}</b><small>${chip(it.subject)} ⏱ ${num(it.minutes)} ${T("min")}</small></div><a class="btn primary sm" href="${href}">${T("start")}</a></li>`;
            }).join("") || `<li class="muted">${T("done")} 🎉</li>`}</ol>
          </div>
          <div class="card">
            <h2>${T("mastery")}</h2>
            <ul class="mastery">${b.subjects.map((s) => { const m = subjectMastery(s); return `<li><span>${window.SUBJECTS[s].icon} ${esc(subjName(s))}</span><div class="bar" style="--c:${window.SUBJECTS[s].color}"><span style="width:${(m ?? 0) * 100}%"></span></div><small>${m === null ? "—" : num(Math.round(m * 100)) + "%"}</small></li>`; }).join("")}</ul>
          </div>
          <div class="card wa-card">
            <h2>🟢 ${T("notify_title")}</h2><p>${T("notify_desc")}</p>
            <a class="btn wa" target="_blank" rel="noopener" href="${waLink(`${S.lang === "ar" ? "مرحباً، بدي أفعّل تذكيرات ناجح اليومية." : "Hi, I'd like to enable Najih daily reminders."} (${p.name} · ${L(b.name)})`)}">${T("notify_btn")}</a>
          </div>
        </div>
        <div class="row-end"><a class="btn ghost sm" href="#/start">${T("edit_plan")}</a> <button class="btn ghost sm" id="reset">${T("reset")}</button></div>
      </section>`;
      $("#reset").addEventListener("click", () => { if (confirm(T("reset") + "?")) { const lang = S.lang; S = defaults(); S.lang = lang; save(); go("#/"); } });
    },

    lesson(id) {
      const lesson = window.LESSONS.find((l) => l.id === id); if (!lesson) return go("#/");
      let i = 0;
      const render = () => {
        const st = lesson.steps[i];
        app().innerHTML = `<section class="section narrow lesson">
          <div class="lesson-top"><a class="back" href="${S.profile ? "#/dashboard" : "#/"}">✕</a>
            <div class="bar"><span style="width:${(i / lesson.steps.length) * 100}%"></span></div>${chip(lesson.subject)}</div>
          <h1 class="lesson-title">${esc(L(lesson.title))}</h1>
          <div class="card step-card"><h2>${L(st.title)}</h2><div class="step-body"></div></div>
        </section>`;
        const body = $(".step-body");
        const nextBtn = (enabled = true) => { const b = document.createElement("button"); b.className = "btn primary block"; b.textContent = T("continue"); b.disabled = !enabled; b.onclick = () => { i++; i < lesson.steps.length ? render() : finish(); }; body.appendChild(b); return b; };
        if (st.type === "explore") {
          body.innerHTML = `<p>${L(st.body)}</p><div class="w"></div>
            <div class="predict"><label>${L(st.predict.q)}</label><div class="row"><input class="num-input" inputmode="decimal" dir="ltr"><button class="btn ghost pcheck">${T("check")}</button></div><div class="q-feedback"></div></div>`;
          WIDGETS[st.widget]($(".w", body));
          const nb = nextBtn(false);
          $(".pcheck", body).onclick = () => {
            const v = parseFloat(normDigits($(".predict input", body).value));
            if (isNaN(v)) return;
            const ok = Math.abs(v - st.predict.answer) < 1e-6, fb = $(".predict .q-feedback", body);
            fb.className = "q-feedback " + (ok ? "good" : "hint");
            fb.innerHTML = ok ? T("correct") : `🤔 ${S.lang === "ar" ? "قريب! استخدم الأداة لتتأكد، ثم تابع." : "Close! Use the tool to check, then continue."}`;
            nb.disabled = false; if (ok) { S.xp += 5; save(); confettiBurst(nb); }
          };
        } else if (st.type === "concept") { body.innerHTML = L(st.body); nextBtn(); }
        else if (st.type === "worked") {
          body.innerHTML = `<p class="problem">${L(st.problem)}</p><ol class="reveal"></ol><button class="btn ghost rv">${T("reveal_step")} ▾</button>`;
          let k = 0; const nb = nextBtn(false);
          $(".rv", body).onclick = (e) => { $(".reveal", body).insertAdjacentHTML("beforeend", `<li>${L(st.reveal[k++])}</li>`); if (k >= st.reveal.length) { e.target.remove(); nb.disabled = false; } };
        } else if (st.type === "quiz") {
          const qs = st.questions.map((qid) => window.QUESTIONS.find((q) => q.id === qid));
          runQuiz(qs, body, (score, total) => { body.innerHTML = `<div class="result"><b>${num(score)} / ${num(total)}</b><span>${T("score")}</span></div>`; nextBtn(); });
        }
      };
      const finish = () => {
        if (!S.done.includes(lesson.id)) { S.done.push(lesson.id); S.xp += 20; bumpStreak(); save(); }
        app().innerHTML = `<section class="section narrow center"><div class="card done-card"><div class="big-emoji">🎉</div><h2>${T("lesson_done")}</h2><p>+${num(20)} ${T("xp")}</p>
          <div class="cta-row center"><a class="btn ghost" href="#/practice/${lesson.subject}">${T("practice_more")}</a><a class="btn primary" href="${S.profile ? "#/dashboard" : "#/start"}">${S.profile ? T("back_dashboard") : T("make_plan")}</a></div></div></section>`;
      };
      render();
    },

    practice(subject) {
      if (!window.SUBJECTS[subject]) return go("#/");
      const pool = window.QUESTIONS.filter((q) => q.subject === subject)
        .map((q) => ({ q, w: (S.mastery[mkey(q)]?.m ?? 0.2) + Math.random() * 0.3 }))
        .sort((a, b) => a.w - b.w).slice(0, 5).map((x) => x.q);
      app().innerHTML = `<section class="section narrow lesson"><div class="lesson-top"><a class="back" href="${S.profile ? "#/dashboard" : "#/"}">✕</a><span></span>${chip(subject)}</div>
        <h1 class="lesson-title">${T("practice")}: ${esc(subjName(subject))}</h1><div class="card step-card"><div class="step-body"></div></div></section>`;
      runQuiz(pool, $(".step-body"), (score, total) => {
        $(".step-body").innerHTML = `<div class="result"><b>${num(score)} / ${num(total)}</b><span>${T("score")}</span></div>
          <div class="cta-row center"><a class="btn ghost" href="#/practice/${subject}" onclick="setTimeout(()=>dispatchEvent(new HashChangeEvent('hashchange')),0)">${T("practice_more")}</a><a class="btn primary" href="${S.profile ? "#/dashboard" : "#/start"}">${S.profile ? T("back_dashboard") : T("make_plan")}</a></div>`;
      });
    },

    exams() {
      const st = { branch: S.profile?.branch || "scientific", subject: "" };
      const render = () => {
        const b = branchOf(st.branch);
        if (!b.subjects.includes(st.subject)) st.subject = b.subjects[0];
        const rows = window.EXAMS.filter((e) => e.branch === st.branch && e.subject === st.subject);
        app().innerHTML = `<section class="section"><h1>${T("exams_title")}</h1><p class="muted">${T("exams_sub")}</p>
          <div class="filters"><label>${T("filter_branch")}<select id="fb">${window.BRANCHES.map((x) => `<option value="${x.id}" ${x.id === st.branch ? "selected" : ""}>${esc(L(x.name))}</option>`).join("")}</select></label>
          <label>${T("filter_subject")}<select id="fs">${b.subjects.map((s) => `<option value="${s}" ${s === st.subject ? "selected" : ""}>${esc(subjName(s))}</option>`).join("")}</select></label></div>
          <div class="card"><table class="tbl"><thead><tr><th>${T("year")}</th><th>${T("session")}</th><th>${T("paper")}</th><th>${T("solution")}</th></tr></thead><tbody>
          ${rows.map((e) => `<tr><td>${num(e.year)}</td><td>${num(e.session)}</td>
            <td>${e.paper ? `<a href="${esc(e.paper)}" target="_blank" rel="noopener">PDF</a>` : `<span class="soon">${T("coming")}</span>`}</td>
            <td>${e.solution ? `<a href="${esc(e.solution)}" target="_blank" rel="noopener">PDF</a>` : `<span class="soon">${T("coming")}</span>`}</td></tr>`).join("")}
          </tbody></table></div>
          <p class="center"><a class="btn primary" href="#/practice/${st.subject}">${T("practice")}: ${esc(subjName(st.subject))}</a></p></section>`;
        $("#fb").onchange = (e) => { st.branch = e.target.value; render(); };
        $("#fs").onchange = (e) => { st.subject = e.target.value; render(); };
      };
      render();
    },

    tutors() {
      const ar = S.lang === "ar";
      app().innerHTML = `<section class="section narrow center"><div class="card"><div class="big-emoji">👩‍🏫</div><h1>${T("tutors_title")}</h1><p>${T("tutors_sub")}</p>
        <div class="cta-row center">
          <a class="btn primary" target="_blank" rel="noopener" href="${waLink(ar ? "مرحباً، بدي أحجز معلّم خصوصي عبر ناجح لما يفتح الحجز." : "Hi, please notify me when Najih tutor booking opens.")}">${T("tutor_interest")}</a>
          <a class="btn ghost" target="_blank" rel="noopener" href="${waLink(ar ? "مرحباً، أنا معلّم/ة وبدي أنضم لناجح." : "Hi, I'm a tutor and I'd like to join Najih.")}">${T("tutor_apply")}</a>
        </div></div></section>`;
    },

    join() {
      const ar = S.lang === "ar";
      app().innerHTML = `<section class="section narrow"><div class="card"><h1>${T("join_title")}</h1><p class="muted">${T("join_sub")}</p>
        <div class="cta-row">${joinButtons()}</div><hr>
        <h3>📱 ${T("via_phone")}</h3>
        <form id="jf" class="form" novalidate>
          <label>${T("name")}<input class="field" name="name" required maxlength="40" value="${esc(S.profile?.name || "")}"></label>
          <label>${T("phone")}<input class="field" name="phone" required inputmode="tel" dir="ltr" placeholder="${T("phone_ph")}"></label>
          <label>${T("branch")}<select class="field" name="branch">${window.BRANCHES.map((b) => `<option value="${b.id}" ${S.profile?.branch === b.id ? "selected" : ""}>${esc(L(b.name))}</option>`).join("")}</select></label>
          <label class="check"><input type="checkbox" name="consent" required checked> <span>${T("consent")}</span></label>
          <div class="q-feedback" aria-live="polite"></div>
          <button class="btn primary block" type="submit">${T("submit")}</button>
        </form></div></section>`;
      $("#jf").addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = new FormData(e.target), fb = $("#jf .q-feedback");
        const phone = normDigits(f.get("phone")).replace(/[\s\-()]/g, "");
        if (!/^(\+?97[02]|0097[02]|0)?5\d{8}$/.test(phone) || !f.get("consent")) { fb.className = "q-feedback bad"; fb.textContent = T("invalid_phone"); return; }
        const entry = { name: String(f.get("name")).trim().slice(0, 40), phone, branch: f.get("branch"), lang: S.lang, source: "web", at: new Date().toISOString() };
        S.signups.push(entry); save();
        let sent = false;
        if (CFG.signupEndpoint) { try { sent = (await fetch(CFG.signupEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) })).ok; } catch (_) {} }
        fb.className = "q-feedback good"; fb.textContent = T("thanks");
        if (!sent) window.open(waLink(`${ar ? "اشتراك جديد في ناجح" : "New Najih signup"}: ${entry.name} · ${entry.phone} · ${L(branchOf(entry.branch).name)}`), "_blank", "noopener");
      });
    },
  };

  function waLink(text) { return `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(text)}`; }
  function joinButtons() {
    const msg = S.lang === "ar" ? "مرحباً ناجح! بدي أشترك وأستقبل الدروس والتذكيرات." : "Hi Najih! I'd like to subscribe to lessons and reminders.";
    return `<a class="btn wa" target="_blank" rel="noopener" href="${waLink(msg)}">🟢 ${T("via_whatsapp")}</a>
            <a class="btn fb" target="_blank" rel="noopener" href="https://m.me/${encodeURIComponent(CFG.facebookPage)}?ref=signup">💬 ${T("via_facebook")}</a>`;
  }

  // ───────────── Router ─────────────
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function route() {
    const [, name = "", arg] = (location.hash || "#/").split("/");
    const view = views[name || "home"] || views.home;
    applyLang();
    $$(".nav a, .tabbar a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#/${name}`));
    view(decodeURIComponent(arg || ""));
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("click", (e) => {
    if (e.target.closest("#lang-toggle")) { S.lang = S.lang === "ar" ? "en" : "ar"; save(); route(); }
  });
  $("#year").textContent = new Date().getFullYear();
  route();
})();
