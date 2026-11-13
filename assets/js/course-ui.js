// Najih pathway UI — Scientific mathematics (#/course/math-sci…).
// Loaded lazily by app.js on course routes, after assets/js/course-math-sci.js (analysis + blueprint data)
// and, when present, assets/js/course-math-sci-lessons.js (authored lessons, exercises and cards).
// Views: subject home (road map + radar + standing), block page, lesson player, exercise player, notebook (دفتري).
// State: localStorage "najih:v2" → S.course["math-sci"] (progress, attempts, notes, mistakes, review cards).
(() => {
  "use strict";
  const N = window.Najih, C = window.COURSE_MATH_SCI;
  const { $, $$, esc, I, T, L, num, go, app } = N;
  const S = () => N.S();
  const t = (k) => T("c_" + k);
  const fillT = (k, o) => Object.entries(o).reduce((s, [a, b]) => s.split(`{${a}}`).join(b), t(k));
  const isAr = () => S().lang === "ar";
  // In Arabic a middle dot beside an Arabic-Indic digit reads as zero (٠): separate with the Arabic comma instead.
  const SEP = () => (isAr() ? "، " : " · ");
  const LIST = () => (isAr() ? "، " : ", ");
  const BASE = "#/course/math-sci";
  const REDUCED = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pct1 = (v) => N.pct(Math.round((v || 0) * 10) / 10);
  const pct0 = (v) => N.pct(Math.round(v || 0));
  // Small but non-zero values keep one decimal, so early progress never reads as 0%.
  const pctS = (v) => (v > 0 && v < 9.95 ? pct1(Math.max(0.1, v)) : pct0(v));
  // A lone Arabic-Indic zero (٠) reads as a bullet: zero counts and shares show an en dash or words instead.
  const pctZ = (v) => (v > 0 ? pctS(v) : "–");
  const numZ = (n) => (n > 0 ? num(n) : "–");
  const doneOf = (d, n, key = "stand_bl") => (d > 0 ? fillT(key, { d: num(d), n: num(n) }) : fillT("none_done", { n: num(n) }));
  const mathOn = () => (isAr() ? 'data-math="ar"' : "");
  // Maths: one LaTeX source, Arabic notation in the Arabic UI (armath.js).
  const texRaw = (src, display = false) => window.NajihMath.render(String(src), { display, ar: isAr() });
  // Display maths keeps its source (data-tex) so fitMath can re-break it into lines on narrow screens.
  const tex = (src, display = false) => (src ? (window.NajihMath && window.katex ? (display ? `<span class="c-dm" data-tex="${esc(src)}">${texRaw(src, true)}</span>` : texRaw(src)) : `<code dir="ltr">${esc(src)}</code>`) : "");
  // Learner text: escaped; inline $…$ maths is rendered by app.js's observer on #app.
  const tx = (o) => esc(typeof o === "string" ? o : L(o) || "");
  const para = (o) => tx(o).split(/\n{2,}/).filter(Boolean).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
  const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return todayKey(d); };
  // Seeded shuffle (MCQ options): the same exercise + attempt count always shows the same order.
  const seedOf = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function shuffled(arr, seed) {
    let a = seed || 1; const rnd = () => { a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    const out = arr.slice(); for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out;
  }
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ───────────── Data lookups ─────────────
  const BLOCKS = C.blocks, BL = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));
  const NODES = Object.fromEntries(C.route.nodes.map((n) => [n.id, n]));
  const unitOf = (u) => C.units.find((x) => x.unit === u);
  const LX = () => (window.COURSE_MATH_SCI_LESSONS && window.COURSE_MATH_SCI_LESSONS.blocks) || {};
  let IDX = null;
  function idx() {
    if (IDX) return IDX;
    IDX = { ex: {}, cards: {}, lessons: {}, checks: {} };
    for (const [bid, b] of Object.entries(LX())) {
      (b.exercises || []).forEach((e) => (IDX.ex[e.id] = { ...e, block: e.block || bid }));
      (b.cards || []).forEach((c) => (IDX.cards[c.id] = { ...c, block: c.block || bid }));
      (b.lessons || []).forEach((l) => {
        IDX.lessons[l.id] = { ...l, block: l.block || bid };
        (l.steps || []).forEach((st) => st.type === "check" && (st.items || []).forEach((e) => (IDX.checks[e.id] = { ...e, block: e.block || bid, lesson: e.lesson || l.id })));
      });
    }
    return IDX;
  }
  const lessonsOf = (bid) => ((LX()[bid] && LX()[bid].lessons) || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const exercisesOf = (bid) => (LX()[bid] && LX()[bid].exercises) || [];
  const hasLessons = (bid) => lessonsOf(bid).length > 0;
  const exById = (id) => idx().ex[id] || idx().checks[id];
  const patTitle = (pid) => (C.patterns[pid] ? L(C.patterns[pid].t) : pid);
  const conceptTitle = (cid) => { for (const b of BLOCKS) { const c = b.concepts.find((x) => x.id === cid); if (c) return L(c.title); } return cid; };
  const blockOfConcept = (cid) => BLOCKS.find((b) => b.concepts.some((x) => x.id === cid));
  const reasonTitle = (r) => L((C.reasons.find((x) => x.id === r) || {}).title) || r;
  const paperName = (id) => {
    const p = (window.EXAMS?.papers || []).find((x) => x.id === id); if (!p) return id;
    return [num(p.y), T("ses_" + p.s), p.p ? T("paper_" + p.p) : ""].filter(Boolean).join(SEP());
  };
  const pastHref = (r) => `#/paper/${r.paper}/${r.page || 1}`;
  const pastLink = (r, { blank = false } = {}) => `<a class="c-past" href="${pastHref(r)}"${blank ? ' target="_blank" rel="noopener"' : ""}>${I("file")}<span><b>${tx(r.label)}</b><small>${esc(paperName(r.paper))}${SEP()}${T("page_short")} ${num(r.page || 1)}</small></span>${I("chevron", "i-dir c-past-go")}</a>`;
  const BOOK_URL = "https://elearn.azureedge.net/Books/c12/12s/ma12-s.pdf";
  const bookHref = (printed) => `${BOOK_URL}#page=${printed + 4}`; // PDF page = printed page + 4
  // Lesson ids read like the book ("درس ١-٦"): each part in the UI's digits, isolated in the UI's direction.
  const lessonId = (id) => `<bdi dir="${isAr() ? "rtl" : "ltr"}">${String(id).split("-").map((x) => (/^\d+$/.test(x) ? num(+x) : esc(x))).join("-")}</bdi>`;
  const bookChip = (lesson, page) => `<a class="c-book" href="${bookHref(page)}" target="_blank" rel="noopener">${I("book")}<span>${fillT("book_page", { l: lessonId(lesson), p: num(page) })}</span></a>`;
  const seqOf = (bid) => NODES[bid]?.seq || 0;
  const stopNo = (bid) => (isAr() ? num(seqOf(bid)) : num(seqOf(bid), { minimumIntegerDigits: 2 }));

  // ───────────── Notebook state (fails soft) ─────────────
  function NB() {
    const s = S();
    try {
      if (!s.course || typeof s.course !== "object") s.course = {};
      let c = s.course["math-sci"];
      if (!c || typeof c !== "object") c = s.course["math-sci"] = {};
      c.v = 1;
      if (!c.progress || typeof c.progress !== "object") c.progress = {};
      if (!c.progress.lessons || typeof c.progress.lessons !== "object") c.progress.lessons = {};
      if (!c.progress.blocks || typeof c.progress.blocks !== "object") c.progress.blocks = {};
      for (const k of ["attempts", "notes", "mistakes", "cards"]) if (!Array.isArray(c[k])) c[k] = [];
      if (!c.ui || typeof c.ui !== "object") c.ui = {};
      return c;
    } catch (_) { return { progress: { lessons: {}, blocks: {} }, attempts: [], notes: [], mistakes: [], cards: [], ui: {} }; }
  }
  const save = () => { try { N.save(); } catch (_) {} };
  function startBlock(bid) { const p = NB().progress.blocks; if (!p[bid]) p[bid] = { started_ts: Date.now() }; }

  function addReviewCard({ card = null, front, back, block, concept }) {
    const nb = NB();
    if (card && nb.cards.some((x) => x.card === card)) return null;
    const rc = { id: uid("r"), card, front, back, block, concept: concept || null, box: 1, due: addDays(1), history: [] }; // box 1 = one day: a card made today is first reviewed tomorrow
    nb.cards.push(rc); return rc;
  }
  const LEITNER = (C.readiness && C.readiness.leitner_days) || [1, 2, 4, 8, 16];
  function gradeCard(rc, g) {
    rc.box = g === 0 ? 1 : g === 1 ? rc.box : Math.min(5, rc.box + 1);
    rc.due = addDays(g === 0 ? 1 : LEITNER[rc.box - 1]);
    rc.history.push({ d: todayKey(), grade: g });
  }
  const dueCards = (bid) => NB().cards.filter((c) => c.due <= todayKey() && (!bid || c.block === bid));

  // ───────────── Readiness model (blueprint → readiness_model) ─────────────
  const DIFF = { 1: 0.8, 2: 1, 3: 1.3 };
  // Correct with hints or on a second try earns partial credit; one attempt is stored per exercise run (its final outcome).
  const attemptValue = (a) => (a.ok ? (a.hints || a.retry ? 0.6 : 1) : a.partial ? 0.3 : 0);
  function conceptScore(cid) {
    const nb = NB();
    const atts = nb.attempts.filter((a) => { const e = exById(a.ex); return e && (e.concepts || []).includes(cid); }).sort((a, b) => b.ts - a.ts);
    if (!atts.length) return { score: 0, state: "not_started", n: 0 };
    let sw = 0, sws = 0;
    atts.forEach((a, k) => { const e = exById(a.ex); const w = (DIFF[e.difficulty] || 1) * Math.pow(0.85, k); sw += w; sws += w * attemptValue(a); });
    const m = sws / sw, c = Math.min(1, sw / 4);
    const okDays = new Set(atts.filter((a) => a.ok).map((a) => todayKey(new Date(a.ts)))).size;
    const h = Math.min(60, Math.max(7, 7 * Math.pow(2, Math.max(0, okDays - 1))));
    const days = (Date.now() - atts[0].ts) / 864e5, r = Math.pow(2, -days / h);
    const open = nb.mistakes.filter((x) => !x.resolved && (x.concepts || []).includes(cid)).length;
    const score = Math.max(0, Math.min(1, m * c * (0.6 + 0.4 * r) - Math.min(0.3, 0.1 * open)));
    const state = score >= 0.9 && r >= 0.8 ? "mastered" : score >= 0.75 ? "solid" : score >= 0.5 ? "shaky" : "learning";
    return { score, state, n: atts.length, r };
  }
  const stateOf = (score, any) => (!any ? "not_started" : score >= 0.9 ? "mastered" : score >= 0.75 ? "solid" : score >= 0.5 ? "shaky" : "learning");
  function blockScore(bid) {
    const b = BL[bid]; let sw = 0, s = 0, any = false;
    const per = b.concepts.map((c) => { const r = conceptScore(c.id); const w = c.w || 0.5; sw += w; s += w * r.score; if (r.state !== "not_started") any = true; return { ...c, ...r }; });
    const score = sw ? s / sw : 0;
    return { score, state: stateOf(score, any), concepts: per };
  }
  function lessonState(lid) { const p = NB().progress.lessons[lid]; return p ? (p.done ? "done" : "active") : "new"; }
  // A block counts as started only when the student opened one of its lessons or practised its own exercises
  // (progress.blocks is written by both). Concept evidence from other blocks' exercises is shown separately (hasEvidence).
  const started = (bid) => !!NB().progress.blocks[bid] || lessonsOf(bid).some((l) => lessonState(l.id) !== "new");
  // Share of the block's lessons completed (the active lesson counts by the steps reached).
  function blockProgress(bid) {
    const ls = lessonsOf(bid), P = NB().progress.lessons; if (!ls.length) return 0;
    return ls.reduce((s, l) => { const p = P[l.id]; return s + (!p ? 0 : p.done ? 1 : Math.min(0.9, (p.step || 0) / Math.max(1, (l.steps || []).length))); }, 0) / ls.length;
  }
  function roadState(bid) {
    const b = BL[bid]; if (!b) return "soon";
    if (!b.examined) return "skip";
    const ls = lessonsOf(bid), sc = blockScore(bid), on = started(bid);
    const allDone = ls.length && ls.every((l) => lessonState(l.id) === "done");
    if ((allDone && sc.score >= 0.75) || (on && (sc.state === "solid" || sc.state === "mastered"))) return "done";
    if (on) return "active";
    return ls.length ? "open" : "soon";
  }
  const hasEvidence = (bid) => !started(bid) && blockScore(bid).state !== "not_started";
  function weighted(key = "w", filter = () => true) {
    let sw = 0, s = 0;
    for (const b of BLOCKS) { if (!b.examined || !filter(b)) continue; const w = b[key] || 0; if (!w) continue; sw += w; s += w * blockScore(b.id).score; }
    return sw ? s / sw : 0;
  }
  // Ordered next-step rules (readiness_model.next_rules).
  function nextStep() {
    const nb = NB();
    const due = dueCards();
    if (due.length) return { kind: "review", title: fillT("ns_review", { n: num(Math.min(due.length, 5)) }), href: `${BASE}/notebook/review`, icon: "cards" };
    const open = nb.mistakes.filter((m) => !m.resolved).sort((a, b) => (BL[b.block]?.w || 0) - (BL[a.block]?.w || 0));
    if (open.length) { const m = open[0]; return { kind: "pattern", title: fillT("ns_pattern", { p: esc(patTitle(m.pattern)) }), href: `${BASE}/ex/${m.ex}`, icon: "pencil" }; }
    const route = C.route.nodes.filter((n) => n.kind === "stop" && n.examined);
    for (const n of route) {
      const ls = lessonsOf(n.block); if (!ls.length) continue;
      const l = ls.find((x) => lessonState(x.id) !== "done");
      // Title: the lesson's main title (before its ":" subtitle); sub: where it sits, never the block name again.
      if (l) return { kind: "lesson", title: fillT(lessonState(l.id) === "active" ? "ns_continue" : "ns_start", { l: esc((L(l.title) || "").split(/\s*:\s*/)[0]) }), sub: `${t("stop")} ${stopNo(n.block)}${SEP()}${fillT("ns_lesson", { k: num(ls.indexOf(l) + 1), n: num(ls.length) })}`, href: `${BASE}/lesson/${l.id}`, icon: "play" };
    }
    if (!Object.keys(LX()).length) { const pb = BL[C.meta.pilot]; return { kind: "explore", title: fillT("ns_explore", { b: esc(L(pb.title)) }), sub: t("pilot"), href: `${BASE}/block/${pb.id}`, icon: "map" }; }
    let best = null;
    for (const b of BLOCKS) { if (!b.examined || !hasLessons(b.id)) continue; const sc = blockScore(b.id).score; const v = b.w * (1 - sc); if (sc < 0.75 && (!best || v > best.v)) best = { b, v }; }
    if (best) return { kind: "strengthen", title: fillT("ns_strengthen", { b: esc(L(best.b.title)) }), href: `${BASE}/practice/${best.b.id}`, icon: "target" };
    return { kind: "mock", title: t("ns_mock"), href: "", icon: "star" };
  }
  const STATE_LABEL = (s) => t("st_" + s);
  // The data title carries "— coming soon"; the badge beside it already says so.
  const mockTitle = () => (L(C.meta.mock.title) || "").replace(/\s*[—–-]\s*(قريباً|قريبا|coming soon)\s*$/i, "");
  // Block the student touched last (lesson progress or an attempt on one of its exercises).
  function focusBlock() {
    const nb = NB(); let best = null, bt = 0;
    for (const [lid, p] of Object.entries(nb.progress.lessons)) { const l = idx().lessons[lid]; if (l && (p.ts || 0) > bt) { bt = p.ts || 0; best = l.block; } }
    for (const a of nb.attempts) { const e = exById(a.ex); if (e && a.ts > bt) { bt = a.ts; best = e.block; } }
    return best && BL[best] ? best : null;
  }
  // "Where do I stand?" — block-level progress next to the exam-weighted %, so a first session gives visible feedback.
  function standBlock() {
    const bid = focusBlock(); if (!bid) return "";
    const ls = lessonsOf(bid), nb = NB();
    const d = ls.filter((l) => lessonState(l.id) === "done").length;
    const atts = nb.attempts.filter((a) => { const e = exById(a.ex); return e && e.block === bid; });
    const ok = atts.filter((a) => a.ok).length;
    const bits = [ls.length ? doneOf(d, ls.length) : "", atts.length ? (ok ? fillT("stand_ok", { r: num(ok), t: num(atts.length) }) : fillT("stand_ok0", { t: num(atts.length) })) : ""].filter(Boolean).join(LIST());
    return `<a class="c-stand-blk" href="${BASE}/block/${bid}"><span class="small muted">${t("stand_now")}</span>
      <span class="c-sb-row"><span class="c-sb-n">${stopNo(bid)}</span><b>${tx(BL[bid].title)}</b></span>
      <span class="c-sb-bar">${N.bar(blockProgress(bid))}</span><span class="small">${bits}</span></a>`;
  }

  // ───────────── Shared bits ─────────────
  const backLink = (href, label) => `<a class="back-link" href="${href}">${I("arrow", "back-ic")}${label}</a>`;
  const ring = (v, size = 64, label = "", empty = false) => {
    const r = size / 2 - 5, c = 2 * Math.PI * r;
    return `<span class="c-ring" style="--sz:${size}px" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}><svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="cr-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="cr-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.max(0, Math.min(1, v)))}"/></svg><b>${empty ? "–" : pctZ(v * 100)}</b></span>`;
  };
  const stateChip = (st) => `<span class="c-state s-${st}">${STATE_LABEL(st)}</span>`;
  // document.title is plain text: inline $…$ maths becomes its rendered glyphs (Arabic notation in ar), never raw LaTeX.
  const plainText = (x) => String(x || "").replace(/\$([^$]+)\$/g, (_, m) => {
    try { const d = document.createElement("div"); d.innerHTML = texRaw(m); return ((d.querySelector(".katex-html") || d).textContent || m).replace(/[\u200b\u200c]/g, ""); } catch (_) { return m; }
  });
  function setTitle(x) { document.title = `${plainText(x)} — ${T("brand")}`; }

  // ───────────── Exam links (opt-in, brief item 7) ─────────────
  // Off by default: learning screens stay about learning. When on, exam weights, patterns and past questions
  // appear as compact collapsed panels (.x-exam is hidden by CSS unless <html data-exl>).
  const exOn = () => NB().ui.examLinks === true;
  function applyExl() {
    document.documentElement.toggleAttribute("data-exl", exOn());
    $$(".c-exl").forEach((b) => { b.setAttribute("aria-pressed", String(exOn())); const s = $(".c-exl-s", b); if (s) s.textContent = exOn() ? t("exl_on") : t("exl_off"); });
  }
  const exlToggle = (cls = "") => `<button type="button" class="c-exl ${cls}" aria-pressed="${exOn()}" title="${t("exl_d")}">${cls.includes("in-player") ? I("target", "c-exl-ic") : ""}<span class="c-exl-sw" aria-hidden="true"><i></i></span><span class="c-exl-t">${t("exl")}</span><span class="vh c-exl-s">${exOn() ? t("exl_on") : t("exl_off")}</span></button>`;
  const exPanel = (inner, label = t("exl_panel")) => (inner ? `<details class="c-xp x-exam"><summary>${I("target")}<span>${label}</span>${I("chevron", "c-more-chev")}</summary><div class="c-xp-b">${inner}</div></details>` : "");
  const starMark = () => `<span class="c-star" title="${t("always_t")}" aria-label="${t("always_t")}" role="img">${I("star")}</span>`;
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".c-exl"); if (!b) return;
    NB().ui.examLinks = !exOn(); save(); applyExl();
    toast(exOn() ? t("exl_shown") : t("exl_hidden"));
    const rm = $("#rm"); if (rm && rm._relabel) rm._relabel();
    const rl = $("#rm-list"); if (rl) roadList(rl);
    window.__layout && window.__layout();
  });

  // Sheet (dialog) used for previews, notes and reason pickers. Bottom sheet on phones, centred card on wider screens.
  function openSheet(html, { label = "", onClose, anchor = null } = {}) {
    closeSheet(true);
    const back = document.activeElement;
    const wrap = document.createElement("div");
    wrap.className = "c-sheet-wrap"; wrap.setAttribute("data-esc-open", "");
    wrap.innerHTML = `<div class="c-scrim"></div><div class="c-sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}" tabindex="-1" ${mathOn()}>
      <button class="icon-btn c-sheet-x" aria-label="${T("pv_close")}">${I("x")}</button>${html}</div>`;
    document.body.append(wrap);
    const sheet = $(".c-sheet", wrap);
    const close = () => { wrap.remove(); document.removeEventListener("keydown", key, true); onClose && onClose(); back && back.focus && back.focus({ preventScroll: true }); };
    const key = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
      if (e.key === "Tab") { const f = $$("a[href], button:not(:disabled), textarea, input, select, [tabindex='0']", sheet); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    };
    document.addEventListener("keydown", key, true);
    $(".c-scrim", wrap).onclick = close; $(".c-sheet-x", wrap).onclick = close;
    wrap._close = close;
    N.renderMath(sheet);
    requestAnimationFrame(() => (($("[data-autofocus]", sheet) || sheet).focus({ preventScroll: true })));
    return { el: sheet, close };
  }
  function closeSheet(silent) { $$(".c-sheet-wrap").forEach((w) => (silent ? w.remove() : w._close && w._close())); }

  // Note editor: notes attach to any block / lesson / step / exercise.
  function noteSheet(ref, existing) {
    const nb = NB();
    const note = existing || null;
    const where = [ref.block && L(BL[ref.block]?.title), ref.lesson && idx().lessons[ref.lesson] && L(idx().lessons[ref.lesson].title), ref.ex && `${t("exercise")} ${esc(ref.ex)}`].filter(Boolean).join(SEP());
    const sh = openSheet(`<p class="eyebrow">${I("note")}${t("nb_title")}</p>
      <h2 class="h-sm">${note ? t("note_edit") : t("note_add")}</h2>
      ${where ? `<p class="small muted">${where}</p>` : ""}
      <label class="vh" for="c-note-ta">${t("note_ph")}</label>
      <textarea id="c-note-ta" class="field" rows="5" maxlength="1200" placeholder="${t("note_ph")}" data-autofocus>${esc(note ? note.text : "")}</textarea>
      <p class="small muted">${t("note_tags_hint")}</p>
      <div class="c-sheet-a">${note ? `<button class="btn quiet sm c-del">${I("trash")}${T("rd_delete")}</button>` : ""}<button class="btn primary sm c-save">${T("rd_save")}</button></div>`, { label: t("note_add") });
    const ta = $("#c-note-ta", sh.el);
    $(".c-save", sh.el).onclick = () => {
      const text = ta.value.trim().slice(0, 1200); if (!text) return ta.focus();
      const tags = [...new Set((text.match(/#[\p{L}\p{N}_-]+/gu) || []).map((x) => x.slice(1)))];
      if (note) Object.assign(note, { text, tags, updated: Date.now() });
      else nb.notes.push({ id: uid("n"), type: "note", ref, text, tags, pinned: false, created: Date.now(), updated: Date.now() });
      save(); sh.close(); toast(t("note_saved"));
      if (location.hash.startsWith(`${BASE}/notebook`)) render(location.hash.split("/").slice(2));
    };
    const del = $(".c-del", sh.el);
    if (del) del.onclick = () => { nb.notes.splice(nb.notes.indexOf(note), 1); save(); sh.close(); render(location.hash.split("/").slice(2)); };
  }
  function toast(msg) {
    let el = $(".c-toast"); if (!el) { el = Object.assign(document.createElement("div"), { className: "c-toast" }); el.setAttribute("role", "status"); document.body.append(el); }
    el.textContent = msg; el.classList.add("on"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("on"), 2200);
  }

  // ───────────── Subject home ─────────────
  function viewHome() {
    setTitle(L(C.meta.title));
    const nb = NB();
    const ns = nextStep();
    const overall = weighted("w"), p1 = weighted("w1", (b) => b.w1 > 0), p2 = weighted("w2", (b) => b.w2 > 0);
    const any = nb.attempts.length > 0;
    const nUnits = C.units.length, nStops = BLOCKS.length;
    const highlights = C.highlights.filter((h) => ["h-papers", "h-always", "h-mcq", "h-rolle", "h-unit6", "h-definition"].includes(h.id));
    app().innerHTML = `<div class="c-page" ${mathOn()}>
      <section class="wrap c-hero">
        ${backLink("#/subject/scientific/math", T("c_back_subject"))}
        <p class="eyebrow" lang="en">Scientific maths · Najih pathway</p>
        <h1>${t("home_t1")} <em class="accent">${t("home_t2")}</em></h1>
        <p class="lede">${fillT("home_d", { u: num(nUnits), s: num(nStops), p: num(C.meta.papers), i: num(C.meta.items) })}</p>
        <div class="c-stand card">
          <div class="c-stand-main">
            ${ring(overall, 76, `${t("readiness")} ${Math.round(overall * 100)}%`, !any)}
            <div><p class="eyebrow">${t("where_stand")}</p>
              <b class="c-stand-t">${any ? fillT("stand_line", { s: STATE_LABEL(stateOf(overall, true)) }) : t("stand_empty")}</b>
              <div class="c-stand-papers">
                <span><small>${T("paper_1")}</small>${N.bar(p1)}<small>${any ? pctZ(p1 * 100) : "–"}</small></span>
                <span><small>${T("paper_2")}</small>${N.bar(p2)}<small>${any ? pctZ(p2 * 100) : "–"}</small></span>
              </div></div>
          </div>
          ${ns.href ? `<a class="c-next" href="${ns.href}"><span class="c-next-ic">${I(ns.icon)}</span><span class="c-next-t"><span class="small">${t("next_step")}</span><b>${ns.title}</b>${ns.sub ? `<span class="small">${esc(ns.sub)}</span>` : ""}</span>${I("arrow", "flip")}</a>`
            : `<div class="c-next is-mock"><span class="c-next-ic">${I("star")}</span><span class="c-next-t"><b>${ns.title}</b></span></div>`}
          ${standBlock()}
        </div>
        <nav class="c-quick" aria-label="${t("quick_nav")}">
          <button type="button" data-scroll="c-road">${I("map")}<span>${t("road_t")}</span></button>
          <button type="button" data-scroll="c-radar">${I("radar")}<span>${t("radar_t")}</span></button>
          <a href="${BASE}/notebook">${I("note")}<span>${t("nb_title")}</span>${dueCards().length ? `<span class="c-dot" aria-label="${fillT("due_n", { n: num(dueCards().length) })}">${num(dueCards().length)}</span>` : ""}</a>
        </nav>
        <div class="c-exl-row">${exlToggle()}<span class="small muted">${t("exl_hint")}</span></div>
      </section>

      <section class="wrap c-sec" id="c-road" aria-labelledby="c-road-h">
        <div class="c-sec-head">
          <div><p class="eyebrow" lang="en">The road map</p><h2 id="c-road-h">${t("road_h")}</h2><p class="lede">${t("road_d")} <span class="x-exam">${t("road_d_w")}</span></p></div>
          <div class="c-seg" role="group" aria-label="${t("road_view")}">
            <button class="c-seg-b" data-v="road" aria-pressed="true">${I("map")}<span>${t("view_road")}</span></button>
            <button class="c-seg-b" data-v="list" aria-pressed="false">${I("list")}<span>${t("view_list")}</span></button>
          </div>
        </div>
        <div class="rm-legend small" aria-hidden="true">
          <span><i class="lg-stop s-done"></i>${t("lg_done")}</span><span><i class="lg-stop s-active"></i>${t("lg_active")}</span>
          <span><i class="lg-stop s-open"></i>${t("lg_open")}</span><span><i class="lg-stop s-soon"></i>${t("lg_soon")}</span>
          <span class="x-exam"><i class="lg-size"></i>${t("lg_size")}</span><span class="x-exam"><i class="lg-heavy">${isAr() ? "٪" : "%"}</i>${t("lg_heavy")}</span>
          <span class="lg-short-it"><i class="lg-short"></i>${t("lg_short")}</span>${BLOCKS.some((b) => b.examined && hasEvidence(b.id)) ? `<span><i class="lg-ev"></i>${t("lg_ev")}</span>` : ""}
        </div>
        <div class="rm" id="rm"></div>
        <div class="rm-list" id="rm-list" hidden></div>
      </section>

      <section class="wrap c-sec" id="c-radar" aria-labelledby="c-radar-h">
        <div class="c-sec-head"><div><p class="eyebrow" lang="en">Where you are tested</p><h2 id="c-radar-h">${t("radar_h")}</h2><p class="lede">${fillT("radar_d", { p: num(C.meta.papers) })}</p></div></div>
        <div class="rd" id="rd"></div>
      </section>

      <section class="wrap c-sec" aria-labelledby="c-hl-h">
        <div class="c-sec-head"><div><p class="eyebrow" lang="en">What the papers tell us</p><h2 id="c-hl-h">${t("hl_h")}</h2></div></div>
        <ol class="c-hl">${highlights.slice(0, 3).map((h, i) => `<li><span class="num-badge sm">${N.seq(i + 1)}</span><p>${tx(h.text)}</p></li>`).join("")}</ol>
        ${highlights.length > 3 ? `<details class="c-more"><summary>${t("more_findings")}${I("chevron", "c-more-chev")}</summary><ol class="c-hl" start="4">${highlights.slice(3).map((h, i) => `<li><span class="num-badge sm">${N.seq(i + 4)}</span><p>${tx(h.text)}</p></li>`).join("")}</ol></details>` : ""}
        <div class="c-mock"><span class="c-mock-ic">${I("star")}</span><div><b>${esc(mockTitle())}</b><p class="small muted">${t("mock_d")}</p></div><span class="badge muted">${t("soon")}</span></div>
        <p class="src-foot small muted">${I("shield")}<span>${t("src_line")}</span></p>
      </section>
    </div>`;
    roadMap($("#rm"));
    roadList($("#rm-list"));
    radar($("#rd"));
    // Scoped to the road header: the radar has its own .c-seg-b buttons (measure, paper, chart/table).
    const segs = $$("#c-road .c-sec-head .c-seg-b");
    const setView = (v) => {
      if (v !== "road" && v !== "list") v = "road";
      segs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
      $("#rm").hidden = v !== "road"; $(".rm-legend").hidden = v !== "road"; $("#rm-list").hidden = v !== "list";
      NB().ui.roadView = v; save();
      if (v === "road") window.__layout && window.__layout();
    };
    segs.forEach((b) => (b.onclick = () => setView(b.dataset.v)));
    $$("[data-scroll]").forEach((b) => (b.onclick = () => { const el = document.getElementById(b.dataset.scroll); el.scrollIntoView({ behavior: REDUCED() ? "auto" : "smooth" }); const h = el.querySelector("h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } }));
    if (NB().ui.roadView === "list") setView("list");
    else if (NB().ui.roadView && NB().ui.roadView !== "road") { NB().ui.roadView = "road"; save(); } // repair a value saved by the old toggle bug
  }

  // ───────────── Road map (custom SVG road + HTML stops) ─────────────
  // Layout: a winding road. Wide screens: rows that alternate direction with U-turns; phones: one vertical road.
  // Coordinates are "inline" (start → end); the SVG is mirrored in RTL and HTML uses inset-inline-start, so both directions read naturally.
  function routeSlots() {
    const main = C.route.nodes.filter((n) => !["B26", "M6", "FINISH"].includes(n.id) && n.kind !== "finish");
    main.sort((a, b) => a.row - b.row || a.col - b.col || a.lane - b.lane);
    const slots = [];
    for (const n of main) {
      const last = slots[slots.length - 1];
      if (last && last.nodes[0].row === n.row && last.nodes[0].col === n.col) last.nodes.push(n);
      else slots.push({ nodes: [n] });
    }
    const fin = NODES.FINISH, side = NODES.B26;
    slots.push({ nodes: [{ ...fin, lane: -1 }, { ...side, lane: 1, detour: true }], end: true });
    return slots;
  }
  function nodeInfo(n) {
    const b = n.block ? BL[n.block] : null;
    const st = n.kind === "stop" ? roadState(n.block) : n.kind === "milestone" ? (n.blocks.every((x) => roadState(x) === "done") ? "done" : "milestone") : n.kind;
    return { b, st };
  }
  function currentNode() {
    let cur = "START";
    for (const n of C.route.nodes) if (n.kind === "stop" && n.examined && ["active", "done"].includes(roadState(n.block))) cur = n.id;
    const act = C.route.nodes.filter((n) => n.kind === "stop" && roadState(n.block) === "active").pop();
    return act ? act.id : cur;
  }
  function roadMap(host) {
    const slots = routeSlots();
    const here = currentNode();
    const firstOfUnit = new Set(); { const seen = new Set(); for (const s of slots) for (const n of s.nodes) if (n.kind === "stop" && !seen.has(n.unit)) { seen.add(n.unit); firstOfUnit.add(n.id); } }
    // Stop size encodes exam weight by AREA (radius 12–26 px); the 44 px tap area comes from .rm-stop::before.
    const WMAX = Math.max(...C.route.nodes.filter((n) => n.kind === "stop").map((n) => n.weight || 0), 1);
    const radius = (n) => (n.kind === "stop" ? (!exOn() ? 17 : Math.sqrt(12 * 12 + (26 * 26 - 12 * 12) * Math.min(1, (n.weight || 0) / WMAX))) : n.kind === "milestone" ? 15 : 18);
    const shortcuts = C.route.edges.filter((e) => e.kind === "shortcut");
    const label = (n) => {
      const { b, st } = nodeInfo(n);
      if (n.kind === "start") return `<span class="rm-unit">${t("rm_start_eb")}</span><b class="rm-t">${tx(n.title)}</b>${shortcuts.length ? `<span class="rm-m"><span class="rm-sc-tag">${t("shortcut")}${isAr() ? " ← " : " → "}${shortcuts.map((e) => stopNo(e.to)).join(LIST())}</span></span>` : ""}`;
      if (n.kind === "finish") return `<b class="rm-t">${tx(n.title)}</b><span class="rm-m">${t("rm_finish_d")}</span>`;
      if (n.kind === "milestone") return `<b class="rm-t">${tx(n.title)}</b><span class="rm-m x-exam">${n.unit_weight ? fillT("rm_unit_w", { w: pct0(n.unit_weight) }) : t("rm_not_examined")}</span>`;
      const u = unitOf(n.unit);
      return `${firstOfUnit.has(n.id) ? `<span class="rm-unit">${fillT("unit_n", { n: num(n.unit) })}: ${tx(u.title)}</span>` : ""}
        <b class="rm-t">${tx(b.title)}</b>
        <span class="rm-m">${b.examined ? `<span class="rm-w x-exam${b.w >= 5 ? " heavy" : ""}">${pct1(b.w)}</span>` : `<span class="rm-w none x-exam">${t("rm_not_examined")}</span>`}${n.id === here ? `<span class="rm-here">${I("pin")}${t("you_here")}</span>` : st === "open" ? `<span class="rm-open">${t("lg_open")}</span>` : ""}${scTo.has(n.id) ? `<span class="rm-sc-tag">${t("shortcut")}</span>` : ""}</span>
        ${st === "active" || (st === "done" && lessonsOf(n.block).length) ? `<span class="rm-prog">${doneOf(lessonsOf(n.block).filter((l) => lessonState(l.id) === "done").length, lessonsOf(n.block).length)}</span>` : ""}`;
    };
    const scTo = new Set(shortcuts.map((e) => e.to));
    const stopAria = (n) => {
      const { b, st } = nodeInfo(n);
      if (n.kind === "start") return `${L(n.title)}`;
      if (n.kind === "finish") return L(n.title);
      if (n.kind === "milestone") return `${L(n.title)}`;
      const ls = lessonsOf(n.block);
      return `${t("stop")} ${num(n.seq)}: ${L(b.title)}. ${exOn() ? (b.examined ? fillT("aria_w", { w: Math.round(b.w * 10) / 10 }) : t("rm_not_examined")) + ". " : ""}${t("lg_" + (st === "skip" ? "soon" : st))}${st === "active" && ls.length ? ". " + fillT("stand_bl", { d: ls.filter((l) => lessonState(l.id) === "done").length, n: ls.length }) : ""}${hasEvidence(n.block) ? ". " + t("ev_aria") : ""}${scTo.has(n.id) ? ". " + t("lg_short") : ""}${n.id === here ? ". " + t("you_here") : ""}`;
    };
    const all = slots.flatMap((s) => s.nodes);
    host.innerHTML = `<svg class="rm-svg" aria-hidden="true" focusable="false"></svg>
      <p class="vh" id="rm-kbd">${t("rm_kbd")}</p>
      <ol class="rm-stops" aria-label="${t("road_h")}" aria-describedby="rm-kbd">${all.map((n) => {
        const { st } = nodeInfo(n);
        const inner = n.kind === "stop" ? (st === "done" ? I("check") : `<span>${stopNo(n.block)}</span>`) : n.kind === "milestone" ? I("flag") : n.kind === "finish" ? I("cap") : I("play");
        // Per-stop progress: a green arc around the stop (lessons done / total); indirect concept evidence: a small dot.
        const prog = n.kind === "stop" && st === "active" ? blockProgress(n.block) : 0;
        const ev = n.kind === "stop" && hasEvidence(n.block);
        return `<li class="rm-node k-${n.kind} s-${st}${n.detour ? " detour" : ""}${n.id === here ? " here" : ""}${n.paper ? " paper-end" : ""}${scTo.has(n.id) ? " sc-to" : ""}" data-id="${n.id}">
          <button class="rm-stop${n.kind === "stop" && st === "active" ? " has-p" : ""}" tabindex="${n.id === here ? 0 : -1}" style="--p:${Math.max(prog, st === "active" ? 0.04 : 0).toFixed(3)}" aria-label="${esc(stopAria(n))}" aria-haspopup="dialog">${inner}${ev ? '<i class="rm-ev" aria-hidden="true"></i>' : ""}</button>
          ${n.id === here && n.kind !== "start" ? `<span class="rm-pin" aria-hidden="true">${I("pin")}</span>` : ""}
          <div class="rm-lab" aria-hidden="true">${label(n)}</div></li>`;
      }).join("")}</ol>`;
    const svg = $(".rm-svg", host);
    const nodesEl = Object.fromEntries($$(".rm-node", host).map((li) => [li.dataset.id, li]));
    $$(".rm-node", host).forEach((li) => {
      const open = () => preview(li.dataset.id, li);
      $(".rm-stop", li).onclick = open;
      $(".rm-lab", li).onclick = open;
    });
    // Roving tabindex: the road is one Tab stop (the "you are here" stop); arrow keys, Home and End move between stops.
    if (!$$(".rm-stop[tabindex='0']", host).length) { const f = $(".rm-stop", host); if (f) f.tabIndex = 0; }
    host.onkeydown = (e) => {
      const btns = $$(".rm-stop", host), i = btns.indexOf(document.activeElement); if (i < 0) return;
      const d = { ArrowDown: 1, ArrowUp: -1, ArrowRight: isAr() ? -1 : 1, ArrowLeft: isAr() ? 1 : -1, Home: -999, End: 999 }[e.key]; if (!d) return;
      e.preventDefault(); const nx = btns[Math.max(0, Math.min(btns.length - 1, i + d))];
      btns.forEach((b) => (b.tabIndex = b === nx ? 0 : -1)); nx.focus();
    };
    host._relabel = () => $$(".rm-node", host).forEach((li) => { const n = all.find((x) => x.id === li.dataset.id); if (n) $(".rm-stop", li).setAttribute("aria-label", stopAria(n)); });

    function layout() {
      if (!host.isConnected) return;
      if (host.offsetParent === null) return; // hidden (list view)
      const W = host.clientWidth; if (!W) return;
      const vertical = W < 700;
      host.classList.toggle("vertical", vertical); host.classList.toggle("horizontal", !vertical);
      $(".rm-legend")?.classList.toggle("is-vertical", vertical);
      const pos = {}; // id → {x, y, r}
      let H = 0;
      if (vertical) {
        const xr = 46, lane = 25, labX = xr + lane + 30, labW = W - labX - 4;
        let y = 8;
        for (const s of slots) for (const n of s.nodes) {
          const li = nodesEl[n.id], lab = $(".rm-lab", li), r = radius(n);
          lab.style.width = labW + "px";
          const lh = lab.offsetHeight, hh = Math.max(r, lh / 2);
          y += hh;
          const ln = s.nodes.length > 1 ? n.lane : 0;
          pos[n.id] = { x: xr + ln * lane, y, r, lab: { x: labX, y: y - lh / 2, w: labW } };
          y += hh + 22;
        }
        H = y;
      } else {
        const padX = 54, inner = W - padX * 2;
        const cols = Math.max(4, Math.min(7, Math.floor(inner / 172)));
        const sw = inner / cols, labW = Math.min(sw - 14, 190), lane = 32;
        const rows = []; for (let i = 0; i < slots.length; i += cols) rows.push(slots.slice(i, i + cols));
        let top = 6;
        rows.forEach((row, ri) => {
          let up = 0, down = 0;
          row.forEach((s) => s.nodes.forEach((n) => {
            const lab = $(".rm-lab", nodesEl[n.id]); lab.style.width = labW + "px";
            const lh = lab.offsetHeight, r = radius(n), ln = s.nodes.length > 1 ? n.lane : 0;
            if (ln < 0) up = Math.max(up, lane + r + 8 + lh); else down = Math.max(down, ln * lane + r + 8 + lh);
          }));
          const roadY = top + Math.max(up, 26);
          row.forEach((s, k) => {
            const col = ri % 2 === 0 ? k : cols - 1 - k, cx = padX + col * sw + sw / 2;
            const fork = s.nodes.length > 1;
            s.nodes.forEach((n, j) => {
              const r = radius(n), ln = fork ? n.lane : 0;
              const x = fork ? cx + (j === 0 ? -sw * 0.18 : sw * 0.18) : cx;
              const y = roadY + ln * lane;
              const lh = $(".rm-lab", nodesEl[n.id]).offsetHeight;
              pos[n.id] = { x, y, r, row: ri, col, lab: { x: Math.max(4, Math.min(W - labW - 4, x - labW / 2)), y: ln < 0 ? y - r - 8 - lh : y + r + 8, w: labW } };
            });
          });
          row.roadY = roadY; row.cols = cols;
          top = roadY + Math.max(down, 40) + 30;
        });
        H = top;
        pos._rows = rows; pos._sw = sw; pos._padX = padX;
      }
      // Place HTML
      host.style.height = H + "px";
      for (const [id, li] of Object.entries(nodesEl)) {
        const p = pos[id]; if (!p) continue;
        const btn = $(".rm-stop", li), lab = $(".rm-lab", li);
        btn.style.width = btn.style.height = p.r * 2 + "px";
        btn.style.insetInlineStart = p.x - p.r + "px"; btn.style.top = p.y - p.r + "px";
        lab.style.insetInlineStart = p.lab.x + "px"; lab.style.top = p.lab.y + "px";
        lab.classList.toggle("ctr", !vertical);
        const pin = $(".rm-pin", li); // "you are here" badge on the stop's top-start corner (the progress arc grows toward the end side)
        if (pin) { pin.style.insetInlineStart = p.x - p.r * 0.62 - 12 + "px"; pin.style.top = p.y - p.r * 0.62 - 18 + "px"; }
      }
      // Road geometry
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H);
      const segs = [];
      const reached = (id) => { const n = all.find((x) => x.id === id) || NODES[id]; if (!n) return false; const st = nodeInfo(n).st; return n.kind === "start" || st === "done" || st === "active"; };
      const edgeKind = (a, b) => (C.route.edges.find((e) => e.from === a && e.to === b) || {}).kind;
      for (let i = 0; i < slots.length - 1; i++) {
        for (const a of slots[i].nodes) for (const b of slots[i + 1].nodes) {
          const k = edgeKind(a.id, b.id) || (b.detour ? "detour" : "road");
          if (k === "shortcut") continue;
          const pa = pos[a.id], pb = pos[b.id]; if (!pa || !pb) continue;
          let d;
          if (vertical) { const m = (pb.y - pa.y) / 2; d = `M${pa.x},${pa.y} C${pa.x},${pa.y + m} ${pb.x},${pb.y - m} ${pb.x},${pb.y}`; }
          else if (pa.row === pb.row) { const m = (pb.x - pa.x) / 2; d = `M${pa.x},${pa.y} C${pa.x + m},${pa.y} ${pb.x - m},${pb.y} ${pb.x},${pb.y}`; }
          else {
            const rows = pos._rows, ra = rows[pa.row], rb = rows[pb.row];
            const dir = pa.row % 2 === 0 ? 1 : -1; // direction of row a
            const ex = dir > 0 ? W - pos._padX : pos._padX, y1 = ra.roadY, y2 = rb.roadY;
            const lead = (x0, y0, x1, y1_) => { const m = (x1 - x0) / 2; return `C${x0 + m},${y0} ${x1 - m},${y1_} ${x1},${y1_}`; };
            const rx = pos._padX - 12, ry = (y2 - y1) / 2;
            d = `M${pa.x},${pa.y} ${lead(pa.x, pa.y, ex, y1)} A${rx},${ry} 0 0 ${dir > 0 ? 1 : 0} ${ex},${y2} ${lead(ex, y2, pb.x, pb.y)}`;
          }
          const done = reached(a.id) && reached(b.id) && k !== "detour";
          // Short "travelled" stub into the stop you are on, even when you skipped ahead (e.g. started at the pilot).
          segs.push({ d, k, done, stub: !done && b.id === here && k !== "detour" && here !== "START", from: a.id });
        }
      }
      // Only one incoming branch carries the stub (a reached one if any), so parallel stops never both read as travelled.
      { const st = segs.filter((x) => x.stub), keep = st.find((x) => reached(x.from)) || st[0]; st.forEach((x) => (x.stub = x === keep)); }
      // Shortcuts (START → stops that need no calculus): no long side roads across the map (they read as a card
      // border and crossed the U-turns). START's label names the target stops; each target gets a short dashed
      // side road arriving from above, with an arrowhead, beside its "shortcut" tag.
      const scs = [];
      if (!vertical) shortcuts.forEach((e) => {
        const pt = pos[e.to]; if (!pt) return;
        const y0 = pt.y - pt.r - 30, x0 = pt.x - 34, ye = pt.y - pt.r - 3;
        scs.push(`M${x0 - 14},${y0} L${x0},${y0} C${pt.x - 10},${y0} ${pt.x},${y0 + 8} ${pt.x},${ye}`);
      });
      // Draw: shortcuts underneath, road bed, lane line, travelled overlay; detours as a dotted path.
      const road = segs.filter((s) => s.k !== "detour"), det = segs.filter((s) => s.k === "detour");
      svg.innerHTML = `
        <defs><marker id="rm-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" class="rm-arr"/></marker></defs>
        ${scs.map((d) => `<path d="${d}" class="rm-short" marker-end="url(#rm-arr)"/>`).join("")}
        ${road.map((s) => `<path d="${s.d}" class="rm-bed"/>`).join("")}
        ${road.map((s) => `<path d="${s.d}" class="rm-top"/>`).join("")}
        ${road.filter((s) => s.done).map((s) => `<path d="${s.d}" class="rm-done"/>`).join("")}
        ${road.map((s) => `<path d="${s.d}" class="rm-line${s.done ? " on" : ""}"/>`).join("")}
        ${road.filter((s) => s.stub).map((s) => `<path d="${s.d}" pathLength="1" class="rm-stub"/>`).join("")}
        ${det.map((s) => `<path d="${s.d}" class="rm-detour"/>`).join("")}`;
    }
    window.__layout = layout;
    layout();
    document.fonts?.ready.then(() => window.__layout === layout && layout());
  }

  // Ordered-list alternative (also the screen-reader friendly view).
  function roadList(host) {
    const here = currentNode();
    host.innerHTML = C.units.map((u) => {
      const ms = C.route.nodes.find((n) => n.kind === "milestone" && n.unit === u.unit);
      return `<section class="rl-unit" aria-labelledby="rl-u${u.unit}">
        <h3 id="rl-u${u.unit}"><span class="num-badge sm">${num(u.unit)}</span><span>${tx(u.title)}</span><small class="x-exam">${u.examined ? fillT("rm_unit_w", { w: pct0(u.w) }) : t("rm_not_examined")}</small></h3>
        <ol class="rl-stops">${u.blocks.map((bid) => {
          const b = BL[bid], st = roadState(bid), n = NODES[bid];
          return `<li class="s-${st}"><a href="${BASE}/block/${bid}"><span class="rl-n">${st === "done" ? I("check") : stopNo(bid)}</span>
            <span class="rl-t"><b>${tx(b.title)}</b><small>${b.examined && exOn() ? `${pct1(b.w)}${SEP()}` : ""}${t("lg_" + (st === "skip" ? "soon" : st))}${n.parallel_with ? `${SEP()}${fillT("rl_parallel", { b: esc(n.parallel_with.map((x) => stopNo(x)).join(LIST())) })}` : ""}${bid === here ? `${SEP()}<b class="rl-here">${t("you_here")}</b>` : ""}</small></span>${I("chevron", "i-dir")}</a></li>`;
        }).join("")}</ol>
        ${ms ? `<p class="rl-ms small">${I("flag")}<span>${tx(ms.title)}</span></p>` : ""}
      </section>`;
    }).join("");
  }

  // Compact preview card for a stop.
  function preview(id) {
    const n = NODES[id]; if (!n) return;
    if (n.kind === "start") {
      openSheet(`<p class="eyebrow">${t("rm_start_eb")}</p><h2 class="h-sm">${tx(n.title)}</h2><p class="small muted">${t("g11_d")}</p>
        <ul class="c-g11">${n.grade11.map((g) => `<li>${tx(C.grade11[g])}</li>`).join("")}</ul>
        <p class="eyebrow">${t("shortcuts")}</p>
        <ul class="c-sc">${C.route.edges.filter((e) => e.kind === "shortcut").map((e) => `<li><a href="${BASE}/block/${e.to}">${esc(L(BL[e.to].title))}</a><small>${tx(e.note)}</small></li>`).join("")}</ul>`, { label: L(n.title) });
      return;
    }
    if (n.kind === "finish") {
      openSheet(`<p class="eyebrow">${I("cap")}${t("finish_eb")}</p><h2 class="h-sm">${tx(n.title)}</h2><p class="small muted">${t("finish_d")}</p>
        <div class="c-mock in-sheet"><span class="c-mock-ic">${I("star")}</span><div><b>${esc(mockTitle())}</b><p class="small muted">${t("mock_d")}</p></div><span class="badge muted">${t("soon")}</span></div>`, { label: L(n.title) });
      return;
    }
    if (n.kind === "milestone") {
      const done = n.blocks.filter((b) => roadState(b) === "done").length;
      openSheet(`<p class="eyebrow">${I("flag")}${fillT("unit_n", { n: num(n.unit) })}</p><h2 class="h-sm">${tx(n.title)}</h2>
        ${exPanel(`<p class="small muted">${n.unit_weight ? fillT("ms_d", { w: pct0(n.unit_weight) }) : t("rm_not_examined")}${n.paper ? ` ${t("ms_paper_" + n.paper)}` : ""}</p>`)}
        <p class="c-ms-prog">${N.bar(done / n.blocks.length)}<small>${fillT("ms_prog", { d: num(done), n: num(n.blocks.length) })}</small></p>
        <ul class="c-mini">${n.blocks.map((b) => `<li><a href="${BASE}/block/${b}"><span>${stopNo(b)}</span>${esc(L(BL[b].title))}</a></li>`).join("")}</ul>`, { label: L(n.title) });
      return;
    }
    const b = BL[n.block], st = roadState(b.id), sc = blockScore(b.id), ls = lessonsOf(b.id);
    const nextL = ls.find((l) => lessonState(l.id) !== "done");
    openSheet(`<p class="eyebrow">${t("stop")} ${stopNo(b.id)}${SEP()}${fillT("unit_n", { n: num(b.unit) })}</p>
      <h2 class="h-sm">${tx(b.title)}</h2>
      <p class="small c-pv-goal">${tx(b.goal)}</p>
      ${exPanel(b.examined ? `<dl class="c-facts">
        <div><dt>${t("f_weight")}</dt><dd>${pct1(b.w)}</dd></div>
        <div><dt>${b.paper === "p2" ? T("paper_2") : T("paper_1")}</dt><dd>${pct1(b.paper === "p2" ? b.w2 : b.w1)}</dd></div>
        <div><dt>${t("f_rank")}</dt><dd>${fillT("rank_of", { r: num(b.rank), n: num(BLOCKS.length) })}</dd></div>
      </dl>
      ${b.unlocks.blocks.length ? `<p class="small muted">${fillT("unlocks", { n: num(b.unlocks.blocks.length), w: pct0(b.unlocks.weight) })}</p>` : ""}` : `<p class="small muted">${t("b26_note")}</p>`)}
      <p class="c-pv-state">${stateChip(sc.state)}${ls.length ? `<span class="small muted">${doneOf(ls.filter((l) => lessonState(l.id) === "done").length, ls.length, "lessons_done")}</span>` : `<span class="small muted">${t("lessons_soon")}</span>`}</p>
      <div class="c-sheet-a">${nextL ? `<a class="btn secondary sm" href="${BASE}/lesson/${nextL.id}">${I("play")}${lessonState(nextL.id) === "active" ? t("continue_l") : t("start_l")}</a>` : ""}<a class="btn primary sm" href="${BASE}/block/${b.id}" data-autofocus>${t("open_block")}${I("arrow", "flip")}</a></div>`, { label: L(b.title) });
    void st;
  }

  // ───────────── Radar chart ─────────────
  // All values come from the generated data (tools/build_course_math_sci.py → C.radar):
  //   marks: axis share of expected marks (overall / p1 / p2 / per year); freq: share of exam items (axes[].freq, freq_units, freq_total).
  const YEARS = C.meta.years.map(String);
  // Unit-level axes (units 1–5; unit 6 never appeared in the papers and is named in the note).
  const UNIT_AXES = C.units.filter((u) => u.examined).map((u) => {
    const k = String(u.unit), ax = { id: "U" + k, unit: u.unit, title: { ar: `${fillT("unit_n", { n: num(u.unit) })}: ${L(u.title)}`, en: `Unit ${u.unit}: ${u.title.en || L(u.title)}` }, blocks: u.blocks,
      overall: C.radar.units[k], p1: C.radar.units_by_paper.p1[k], p2: C.radar.units_by_paper.p2[k], freq: (C.radar.freq_units || {})[k] || {} };
    YEARS.forEach((y) => (ax[y] = (C.radar.units_by_year[y] || {})[k] || 0));
    return ax;
  });
  // series: "a" (all years, for the chosen paper) or a year (overlay). paper: overall | p1 | p2 (marks only).
  function radarValue(ax, measure, series, paper = "overall") {
    if (measure === "marks") return series === "a" ? ax[paper] || 0 : ax[series] || 0;
    const tot = (C.radar.freq_total || {})[series];
    return tot ? (100 * ((ax.freq || {})[series] || 0)) / tot : 0;
  }
  function radar(host) {
    const ui = NB().ui;
    const st = { measure: ui.rdMeasure === "freq" ? "freq" : "marks", year: ui.rdYear || "", paper: ["p1", "p2"].includes(ui.rdPaper) ? ui.rdPaper : "overall", level: ui.rdLevel === "units" ? "units" : "parts", view: "chart", sel: null };
    if (st.measure === "freq") st.paper = "overall";
    if (st.paper !== "overall") st.year = ""; // the year overlay exists for all papers only
    // The solid series is named after the selected paper everywhere (legend, tooltip, table, detail).
    const seriesName = () => (st.paper === "overall" ? t("rd_all") : t("rd_series_" + st.paper));
    const shareOf = () => (st.measure === "marks" ? (st.paper === "overall" ? t("rd_marks_d") : t("rd_of_" + st.paper)) : t("rd_freq_d"));
    let AX = st.level === "units" ? UNIT_AXES : C.radar.axes, n = AX.length;
    host.innerHTML = `
      <div class="rd-controls">
        <div class="c-seg" role="group" aria-label="${t("rd_measure")}">
          <button class="c-seg-b" data-m="marks">${t("rd_marks")}</button>
          <button class="c-seg-b" data-m="freq">${t("rd_freq")}</button>
        </div>
        <div class="c-seg" role="group" aria-label="${t("rd_paper")}">
          <button class="c-seg-b" data-p="overall">${t("rd_p_all")}</button>
          <button class="c-seg-b" data-p="p1">${t("rd_p1")}</button>
          <button class="c-seg-b" data-p="p2">${t("rd_p2")}</button>
        </div>
        <button type="button" class="chip sm rd-more-b" aria-expanded="false" aria-controls="rd-opts">${I("settings")}<span>${t("rd_more_opts")}</span></button>
        <div class="rd-opts" id="rd-opts">
          <div class="c-seg" role="group" aria-label="${t("rd_level")}">
            <button class="c-seg-b" data-l="parts">${t("rd_by_part")}</button>
            <button class="c-seg-b" data-l="units">${t("rd_by_unit")}</button>
          </div>
          <div class="rd-years" role="group" aria-label="${t("rd_overlay")}">
            <span class="small muted" aria-hidden="true">${t("rd_compare")}</span>
            ${["", ...YEARS].map((y) => `<button class="chip sm" data-y="${y}">${y ? num(+y) : t("rd_none")}</button>`).join("")}
          </div>
        </div>
      </div>
      <div class="rd-legrow"><div class="rd-legend small"></div>
        <div class="c-seg rd-view" role="group" aria-label="${t("rd_viewas")}">
          <button class="c-seg-b icon-only" data-v="chart" aria-label="${t("rd_chart")}" title="${t("rd_chart")}">${I("radar")}</button>
          <button class="c-seg-b icon-only" data-v="table" aria-label="${t("rd_table")}" title="${t("rd_table")}">${I("table")}</button>
        </div></div>
      <div class="rd-body">
        <figure class="rd-fig">
          <div class="rd-stage"><svg class="rd-svg" role="img"></svg><div class="rd-labels"></div><div class="rd-tip" role="tooltip" hidden></div></div>
          <figcaption class="small muted rd-note">${tx(C.radar.note)}</figcaption>
        </figure>
        <div class="rd-table-wrap" hidden></div>
        <aside class="rd-detail" aria-live="polite"></aside>
      </div>
      <details class="c-more rd-method"><summary>${t("rd_method")}${I("chevron", "c-more-chev")}</summary><p class="small muted">${tx(C.radar.method)} ${t("rd_freq_method")}</p></details>`;
    const svg = $(".rd-svg", host), labs = $(".rd-labels", host), tip = $(".rd-tip", host), stage = $(".rd-stage", host);
    let cur = null; // current drawn values (for animation)
    const angle = (i) => { const dir = isAr() ? -1 : 1; return -Math.PI / 2 + dir * (2 * Math.PI * i) / n; };
    const values = () => ({ a: AX.map((ax) => radarValue(ax, st.measure, "a", st.paper)), y: st.year && st.paper === "overall" ? AX.map((ax) => radarValue(ax, st.measure, st.year)) : null });
    function geom() {
      const W = stage.clientWidth, narrow = W < 460;
      const labW = narrow ? 34 : 128, R = Math.max(70, Math.min(narrow ? 150 : 999, W / 2 - labW - 14));
      const Hh = R * 2 + (narrow ? 70 : 140);
      return { W, H: Hh, cx: W / 2, cy: Hh / 2, R, labW, narrow };
    }
    function scaleMax(v) { const m = Math.max(...v.a, ...(v.y || [0])); return Math.max(10, Math.ceil(m / 5) * 5); }
    function pts(vals, g, max) { return vals.map((v, i) => { const r = (v / max) * g.R, a = angle(i); return [g.cx + r * Math.cos(a), g.cy + r * Math.sin(a)]; }); }
    // v = the values drawn now (may be mid-animation); labels, tooltips and the accessible name always use the final values.
    function draw(v, g, max) {
      const fin = values();
      const rings = []; for (let k = 5; k <= max; k += 5) rings.push(k);
      const pa = pts(v.a, g, max), py = v.y ? pts(v.y, g, max) : null;
      const poly = (p) => p.map((q) => q.map((z) => z.toFixed(1)).join(",")).join(" ");
      svg.setAttribute("viewBox", `0 0 ${g.W} ${g.H}`); svg.setAttribute("width", g.W); svg.setAttribute("height", g.H);
      svg.setAttribute("aria-label", `${t("radar_h")}: ${AX.map((ax, i) => `${L(ax.title)} ${Math.round(fin.a[i] * 10) / 10}%`).join("; ")}`);
      const ta = (angle(0) + angle(1)) / 2; // ring ticks sit between axes 1 and 2, clear of markers and points
      svg.innerHTML = `
        <g class="rd-grid">${rings.map((k) => `<polygon points="${poly(AX.map((_, i) => { const a = angle(i), r = (k / max) * g.R; return [g.cx + r * Math.cos(a), g.cy + r * Math.sin(a)]; }))}"/>`).join("")}
          ${AX.map((_, i) => { const a = angle(i); return `<line x1="${g.cx}" y1="${g.cy}" x2="${(g.cx + g.R * Math.cos(a)).toFixed(1)}" y2="${(g.cy + g.R * Math.sin(a)).toFixed(1)}" class="${st.sel === i ? "sel" : ""}"/>`; }).join("")}</g>
        <g class="rd-ticks">${rings.map((k) => `<text x="${(g.cx + (k / max) * g.R * Math.cos(ta)).toFixed(1)}" y="${(g.cy + (k / max) * g.R * Math.sin(ta)).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" style="direction:ltr;unicode-bidi:isolate">${num(k)}${isAr() ? "٪" : "%"}</text>`).join("")}</g>
        <g class="rd-data" style="transform-origin:${g.cx}px ${g.cy}px">
        <polygon class="rd-a" points="${poly(pa)}"/>
        ${py ? `<polygon class="rd-y" points="${poly(py)}"/>` : ""}
        ${pa.map((p, i) => `<circle class="rd-pa${st.sel === i ? " sel" : ""}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5"/>`).join("")}
        ${py ? py.map((p) => `<rect class="rd-py" x="${(p[0] - 4).toFixed(1)}" y="${(p[1] - 4).toFixed(1)}" width="8" height="8" rx="1.5"/>`).join("") : ""}</g>
        ${AX.map((_, i) => { const a = angle(i), r = g.R; return `<path class="rd-hit" data-i="${i}" d="M${g.cx},${g.cy} L${(g.cx + r * 1.08 * Math.cos(a - Math.PI / n)).toFixed(1)},${(g.cy + r * 1.08 * Math.sin(a - Math.PI / n)).toFixed(1)} L${(g.cx + r * 1.08 * Math.cos(a + Math.PI / n)).toFixed(1)},${(g.cy + r * 1.08 * Math.sin(a + Math.PI / n)).toFixed(1)} Z"/>`; }).join("")}`;
      // Labels (HTML buttons around the chart: they wrap, take focus and open the detail panel)
      labs.innerHTML = AX.map((ax, i) => {
        const a = angle(i), off = g.narrow ? 20 : 10, lx = g.cx + (g.R + off) * Math.cos(a), ly = g.cy + (g.R + off) * Math.sin(a);
        const c = Math.cos(a), s = Math.sin(a);
        const side = Math.abs(c) < 0.2 ? "mid" : c > 0 ? "right" : "left";
        const vs = Math.abs(s) > 0.92 ? (s < 0 ? "top" : "bottom") : "middle";
        const val = Math.round(fin.a[i] * 10) / 10;
        // Phones: a numbered marker (the ranked list below names every axis); wider: the full name.
        if (g.narrow) return `<button class="rd-lab rd-num mid${st.sel === i ? " sel" : ""}" data-i="${i}" style="left:${lx.toFixed(1)}px;top:${ly.toFixed(1)}px" aria-pressed="${st.sel === i}" aria-label="${esc(L(ax.title))}: ${val}%">${num(i + 1)}</button>`;
        return `<button class="rd-lab ${side} ${vs}${st.sel === i ? " sel" : ""}" data-i="${i}" style="left:${lx.toFixed(1)}px;top:${ly.toFixed(1)}px;width:${g.labW}px" aria-pressed="${st.sel === i}">
          <span class="rd-lab-t">${tx(ax.title)}</span><span class="rd-lab-v">${pct1(val)}${fin.y ? ` <span class="rd-lab-y">· ${pct1(fin.y[i])}</span>` : ""}</span></button>`;
      }).join("");
      $$(".rd-lab", labs).forEach((b) => { b.onclick = () => select(+b.dataset.i); b.onmouseenter = () => showTip(+b.dataset.i, b); b.onmouseleave = hideTip; b.onfocus = () => showTip(+b.dataset.i, b); b.onblur = hideTip; });
      $$(".rd-hit", svg).forEach((p) => { p.onclick = () => select(+p.dataset.i); p.onmousemove = (e) => showTip(+p.dataset.i, null, e); p.onmouseleave = hideTip; });
    }
    function showTip(i, el, e) {
      const v = values(), r = stage.getBoundingClientRect();
      tip.replaceChildren();
      const h = document.createElement("b"); h.textContent = L(AX[i].title); tip.append(h);
      const row = (cls, label, val) => { const p = document.createElement("span"); p.className = "rd-tip-r " + cls; const k = document.createElement("i"); const vv = document.createElement("strong"); vv.dir = "ltr"; vv.style.unicodeBidi = "isolate"; vv.textContent = `${num(Math.round(val * 10) / 10)}${isAr() ? "٪" : "%"}`; const ll = document.createElement("span"); ll.textContent = label; p.append(k, vv, ll); tip.append(p); };
      row("a", seriesName(), v.a[i]); if (v.y) row("y", num(+st.year), v.y[i]);
      tip.hidden = false;
      let x, y;
      if (e) { x = e.clientX - r.left; y = e.clientY - r.top; } else { const b = el.getBoundingClientRect(); x = b.left - r.left + b.width / 2; y = b.top - r.top; }
      x = Math.max(8, Math.min(r.width - tip.offsetWidth - 8, x - tip.offsetWidth / 2)); y = Math.max(0, y - tip.offsetHeight - 10);
      tip.style.left = x + "px"; tip.style.top = y + "px";
    }
    function hideTip() { tip.hidden = true; }
    function animateTo(v) {
      const g = geom(), max = scaleMax(v);
      if (!cur || REDUCED()) { cur = v; draw(v, g, max); return; }
      const from = cur, t0 = performance.now(), D = 420;
      const fromY = from.y || from.a.map(() => 0), toY = v.y || null;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
        const mix = (a, b) => a.map((x, i) => x + (b[i] - x) * e);
        draw({ a: mix(from.a, v.a), y: toY ? mix(fromY, toY) : null }, g, max);
        if (k < 1) requestAnimationFrame(step); else cur = v;
      };
      requestAnimationFrame(step);
    }
    function table() {
      const cols = st.paper === "overall" ? ["a", ...YEARS] : ["a"];
      $(".rd-table-wrap", host).innerHTML = `<table class="c-table"><caption class="vh">${t("radar_h")} — ${st.measure === "marks" ? t("rd_marks") : t("rd_freq")}</caption>
        <thead><tr><th scope="col">${t("rd_axis")}</th>${cols.map((c) => `<th scope="col" class="${c === st.year ? "on" : ""}">${c === "a" ? (st.paper === "overall" ? t("rd_all_short") : T(st.paper === "p1" ? "paper_1" : "paper_2")) : num(+c)}</th>`).join("")}</tr></thead>
        <tbody>${AX.map((ax, i) => `<tr><th scope="row"><button class="link-btn" data-i="${i}">${tx(ax.title)}</button></th>${cols.map((c) => `<td class="${c === st.year ? "on" : ""}">${pct1(radarValue(ax, st.measure, c, st.paper))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      $$(".rd-table-wrap .link-btn", host).forEach((b) => (b.onclick = () => select(+b.dataset.i)));
    }
    function legend() {
      $(".rd-legend", host).innerHTML = `<span class="lg-a"><i></i>${seriesName()}</span>${st.year ? `<span class="lg-y"><i></i>${num(+st.year)}</span>` : ""}<span class="muted">${shareOf()}</span>${st.level === "units" ? `<span class="muted">${t("rd_unit_d")}</span>` : ""}`;
    }
    function detail() {
      const el = $(".rd-detail", host);
      if (st.sel == null) {
        const rows = AX.map((ax, i) => ({ i, ax, v: radarValue(ax, st.measure, "a", st.paper), y: st.year && st.paper === "overall" ? radarValue(ax, st.measure, st.year) : null })).sort((a, b) => b.v - a.v);
        const mx = Math.max(...rows.map((r) => Math.max(r.v, r.y || 0)));
        el.innerHTML = `<p class="eyebrow">${t("rd_ranked")}</p>
          <ol class="rd-rank">${rows.map((r) => `<li><button class="link-btn" data-i="${r.i}"><span class="rr-t"><span class="rr-n">${num(r.i + 1)}</span>${tx(r.ax.title)}</span>
            <span class="rr-bars"><span class="rr-bar a" style="width:${(r.v / mx) * 100}%"></span>${r.y != null ? `<span class="rr-bar y" style="width:${(r.y / mx) * 100}%"></span>` : ""}</span>
            <span class="rr-v">${pct1(r.v)}${r.y != null ? `<small>${pct1(r.y)}</small>` : ""}</span></button></li>`).join("")}</ol>
          <p class="rd-hint small muted">${I("radar")}<span>${t("rd_tap")}</span></p>`;
        $$(".rd-rank button", el).forEach((b) => (b.onclick = () => select(+b.dataset.i)));
        return;
      }
      const ax = AX[st.sel];
      const pats = ax.blocks.flatMap((b) => BL[b].patterns.map((p) => ({ id: p, ...C.patterns[p] }))).filter((p) => p.n).sort((a, b) => b.n - a.n).slice(0, 4);
      el.innerHTML = `<div class="rd-d-top"><p class="eyebrow">${t("rd_axis")}</p><button class="btn quiet sm rd-d-x">${I("arrow", "back-ic")}${t("rd_all_axes")}</button></div><h3>${tx(ax.title)}</h3>
        <p class="rd-d-v"><b>${pct1(radarValue(ax, st.measure, "a", st.paper))}</b> <span class="small muted">${shareOf()}</span></p>
        <h4 class="rd-d-h">${t("rd_blocks")}</h4>
        <ul class="rd-d-blocks">${ax.blocks.map((b) => `<li><a href="${BASE}/block/${b}"><span class="rl-n">${stopNo(b)}</span><span><b>${tx(BL[b].title)}</b><small>${BL[b].concepts.map((c) => `${esc(L(c.title))} (${fillT("cov", { c: pct0(c.cov * 100) })})`).join(SEP())}</small></span></a></li>`).join("")}</ul>
        <h4 class="rd-d-h">${t("rd_patterns")}</h4>
        <ul class="rd-d-pats" data-x>${pats.map((p) => `<li><b>${tx(p.t)}</b><small>${fillT("pat_meta", { n: num(p.n), y: p.y.map((y) => num(y)).join(LIST()) })}</small>${p.ex && p.ex[0] ? `<a class="small" href="${pastHref(p.ex[0])}">${I("file")}${tx(p.ex[0].label)}${SEP()}${esc(paperName(p.ex[0].paper))}</a>` : ""}</li>`).join("")}</ul>`;
      const x = $(".rd-d-x", el); if (x) x.onclick = () => { select(st.sel); $(".rd-rank button", el)?.focus(); };
    }
    function select(i) { st.sel = st.sel === i ? null : i; animateNoop(); detail(); if (st.view === "chart" && st.sel != null && matchMedia("(max-width: 899px)").matches) $(".rd-detail", host).scrollIntoView({ block: "nearest", behavior: REDUCED() ? "auto" : "smooth" }); }
    function animateNoop() { const v = values(); cur = v; draw(v, geom(), scaleMax(v)); }
    function sync() {
      $$("[data-m]", host).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === st.measure)));
      $$("[data-y]", host).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.y === st.year)));
      $$("[data-v]", host).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === st.view)));
      $$("[data-p]", host).forEach((b) => { b.setAttribute("aria-pressed", String(b.dataset.p === st.paper)); b.disabled = st.measure === "freq" && b.dataset.p !== "overall"; });
      $$("[data-l]", host).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === st.level)));
      $(".rd-years", host).hidden = st.paper !== "overall";
      $(".rd-fig", host).hidden = st.view !== "chart"; $(".rd-table-wrap", host).hidden = st.view !== "table";
      legend(); table(); detail();
    }
    $$("[data-m]", host).forEach((b) => (b.onclick = () => { st.measure = b.dataset.m; if (st.measure === "freq") st.paper = "overall"; NB().ui.rdMeasure = st.measure; save(); sync(); animateTo(values()); }));
    $$("[data-p]", host).forEach((b) => (b.onclick = () => { if (b.disabled) return; st.paper = b.dataset.p; if (st.paper !== "overall") st.year = NB().ui.rdYear = ""; NB().ui.rdPaper = st.paper; save(); sync(); animateTo(values()); }));
    const moreB = $(".rd-more-b", host);
    moreB.onclick = () => { const on = moreB.getAttribute("aria-expanded") !== "true"; moreB.setAttribute("aria-expanded", String(on)); $(".rd-controls", host).classList.toggle("open", on); };
    $$("[data-l]", host).forEach((b) => (b.onclick = () => {
      st.level = b.dataset.l; NB().ui.rdLevel = st.level; save();
      AX = st.level === "units" ? UNIT_AXES : C.radar.axes; n = AX.length; st.sel = null; cur = null; hideTip();
      sync(); animateNoop();
    }));
    $$("[data-y]", host).forEach((b) => (b.onclick = () => { st.year = b.dataset.y; NB().ui.rdYear = st.year; save(); sync(); animateTo(values()); }));
    $$("[data-v]", host).forEach((b) => (b.onclick = () => { st.view = b.dataset.v; sync(); if (st.view === "chart") animateNoop(); }));
    sync();
    // Final values on first paint (screenshots, print, screen readers all get real data).
    // A subtle grow-in plays only if the chart was off-screen at load and motion is allowed.
    animateNoop();
    if ("IntersectionObserver" in window && !REDUCED()) {
      let first = true;
      const io = new IntersectionObserver((es) => {
        const vis = es.some((e) => e.isIntersecting);
        if (first) { first = false; if (vis) io.disconnect(); return; }
        if (vis) { io.disconnect(); svg.classList.remove("rd-grow"); void svg.getBoundingClientRect(); svg.classList.add("rd-grow"); }
      }, { threshold: 0.25 });
      io.observe(stage);
    }
    const prev = window.__layout;
    window.__layout = () => { prev && prev(); if (stage.isConnected && cur) draw(cur, geom(), scaleMax(values())); };
  }

  // Book pages of a lesson's refs: equal ranges collapse to one page, repeated pages are dropped ("ص ٣٨، ٤١، ١٠").
  function refPages(refs) {
    const seen = new Set(), out = [];
    for (const r of refs) {
      const [a, b = a] = r.pages || []; if (a == null) continue;
      const key = `${a}-${b}`; if (seen.has(key)) continue; seen.add(key);
      out.push(a === b ? num(a) : `${num(a)}–${num(b)}`);
    }
    return `<bdi>${out.join(LIST())}</bdi>`;
  }

  // ───────────── Block page ─────────────
  function viewBlock(bid) {
    const b = BL[bid]; if (!b) return go(BASE);
    setTitle(L(b.title));
    const n = NODES[bid], u = unitOf(b.unit), ls = lessonsOf(bid), sc = blockScore(bid);
    const order = C.route.nodes.filter((x) => x.kind === "stop").sort((a, c) => a.seq - c.seq);
    const i = order.findIndex((x) => x.id === bid), prev = order[i - 1], next = order[i + 1];
    const nb = NB();
    const notes = nb.notes.filter((x) => x.ref.block === bid).length, mistakes = nb.mistakes.filter((x) => x.block === bid && !x.resolved).length, due = dueCards(bid).length;
    const nextL = ls.find((l) => lessonState(l.id) !== "done");
    const pats = b.patterns.map((p) => ({ id: p, ...C.patterns[p] })).filter((p) => p.t);
    const ex = exercisesOf(bid);
    const unitBlocks = u.blocks;
    app().innerHTML = `<div class="c-page" ${mathOn()}>
      <section class="wrap c-block">
        ${backLink(BASE + "#c-road", t("back_road"))}
        <nav class="c-unitbar" aria-label="${fillT("unit_n", { n: num(b.unit) })}">
          <span class="small muted">${fillT("unit_n", { n: num(b.unit) })}${SEP()}${tx(u.title)}</span>
          <ol>${unitBlocks.map((x) => `<li class="s-${roadState(x)}${x === bid ? " cur" : ""}"><a href="${BASE}/block/${x}" ${x === bid ? 'aria-current="page"' : ""} title="${esc(L(BL[x].title))}"><span class="vh">${esc(L(BL[x].title))}</span>${stopNo(x)}</a></li>`).join("")}</ol>
        </nav>
        <header class="c-bhead">
          <div class="c-bhead-top"><p class="eyebrow">${t("stop")} ${stopNo(bid)} ${T("of")} ${num(BLOCKS.length)}${b.pilot ? ` <span class="badge gold">${t("pilot")}</span>` : ""}</p>${exlToggle("sm")}</div>
          <h1>${tx(b.title)}</h1>
          <p class="lede">${tx(b.goal)}</p>
          ${b.key ? `<p class="c-key"><span class="small muted">${t("key_idea")}</span><b>${tx(b.key)}</b></p>` : ""}
        </header>
        <div class="c-bgrid">
          <div class="c-bmain">
            <p class="small muted c-time">${I("clock")}<span>${t("f_time")}: ${fillT("hours", { h: num(b.hours) })}</span></p>
            ${exPanel(b.examined ? `<dl class="c-facts">
              <div><dt>${t("f_weight")}</dt><dd>${pct1(b.w)}</dd></div>
              <div><dt>${b.paper === "p2" ? T("paper_2") : T("paper_1")}</dt><dd>${pct1(b.paper === "p2" ? b.w2 : b.w1)}</dd></div>
              <div><dt>${t("f_rank")}</dt><dd>${fillT("rank_of", { r: num(b.rank), n: num(BLOCKS.length) })}</dd></div>
            </dl>
            <p class="small muted c-unlock">${b.every_year ? I("check") : ""}<span>${b.every_year ? `${t("every_year")}${SEP()}` : ""}${b.unlocks.blocks.length ? fillT("unlocks", { n: num(b.unlocks.blocks.length), w: pct0(b.unlocks.weight) }) : ""}</span></p>` : `<p class="small muted">${t("b26_note")}</p>`)}

            <h2 class="c-h2">${t("lessons_h")}</h2>
            ${ls.length ? `<ol class="c-lessons">${ls.map((l, k) => {
              const ps = lessonState(l.id), p = nb.progress.lessons[l.id], frac = ps === "done" ? 1 : p ? (p.step || 0) / Math.max(1, (l.steps || []).length) : 0;
              return `<li class="ls-${ps}"><a href="${BASE}/lesson/${l.id}"><span class="cl-n">${ps === "done" ? I("check") : N.seq(k + 1)}</span>
                <span class="cl-t"><b>${tx(l.title)}</b><small>${fillT("minutes_n", { m: num(l.minutes || 0) })}${(l.book_refs || []).length ? `${SEP()}${T("page_short")} ${refPages(l.book_refs)}` : ""}</small>
                ${ps === "active" ? `<span class="cl-bar">${N.bar(frac)}</span>` : ""}</span>
                <span class="cl-go">${ps === "done" ? t("review_l") : ps === "active" ? t("continue_l") : t("start_l")}${I("chevron", "i-dir")}</span></a></li>`;
            }).join("")}</ol>
            ${ex.length ? `<a class="c-review-row" href="${BASE}/practice/${bid}">${I("pencil")}<span><b>${t("block_review")}</b><small>${fillT("ex_n", { n: num(ex.length) })}</small></span>${I("chevron", "i-dir")}</a>` : ""}`
            : `<div class="c-empty-l"><p><b>${t("lessons_soon")}</b></p><p class="small muted">${t("lessons_soon_d")}</p>${hasLessons(C.meta.pilot) ? `<a class="text-link" href="${BASE}/block/${C.meta.pilot}">${fillT("try_pilot", { b: esc(L(BL[C.meta.pilot].title)) })}${I("arrow", "flip")}</a>` : ""}</div>`}

            <h2 class="c-h2">${t("concepts_h")}</h2>
            <ul class="c-concepts">${sc.concepts.map((c) => `<li><b>${tx(c.title)}${b.examined && c.cov >= 1 ? starMark() : ""}</b>
              <span class="small muted x-exam">${b.examined ? `${pct1(c.w)}${SEP()}${fillT("cov", { c: pct0(c.cov * 100) })}` : t("rm_not_examined")}</span>
              ${stateChip(c.state)}</li>`).join("")}</ul>

            ${pats.length ? exPanel(`<p class="small muted">${t("patterns_d")}</p>
            <ul class="c-pats">${pats.map((p) => `<li><details><summary><span class="cp-t"><b>${tx(p.t)}</b><small>${fillT("pat_meta", { n: num(p.n), y: p.y.map((y) => num(y)).join(LIST()) })}${SEP()}${Object.entries(p.f).map(([f, k]) => `${t("fmt_" + f)} ${num(k)}`).join(LIST())}</small></span>${I("chevron", "c-more-chev")}</summary>
              <div class="cp-ex">${p.ex.map((r) => pastLink(r)).join("")}</div></details></li>`).join("")}</ul>`, t("patterns_h")) : ""}
          </div>
          <aside class="c-bside">
            <div class="card c-side-card">
              <p class="eyebrow">${t("where_stand")}</p>
              <div class="c-side-st">${ring(sc.score, 58, "", sc.state === "not_started")}<div>${sc.state === "not_started" && started(bid) ? `<span class="c-state s-learning">${t("lg_active")}</span>` : stateChip(sc.state)}<p class="small muted">${sc.state === "not_started" ? t("st_hint_new") : t("st_hint")}</p></div></div>
              ${nextL ? `<a class="btn primary block" href="${BASE}/lesson/${nextL.id}">${I("play")}${lessonState(nextL.id) === "active" ? t("continue_l") : t("start_l")}</a>` : ex.length ? `<a class="btn primary block" href="${BASE}/practice/${bid}">${I("pencil")}${t("block_review")}</a>` : ""}
            </div>
            <div class="card c-side-card">
              <p class="eyebrow">${I("note")}${t("nb_title")}</p>
              <ul class="c-nbstats"><li><b>${numZ(due)}</b><span>${t("nb_due")}</span></li><li><b>${numZ(mistakes)}</b><span>${t("nb_mist")}</span></li><li><b>${numZ(notes)}</b><span>${t("nb_notes")}</span></li></ul>
              <div class="c-side-a"><a class="btn secondary sm" href="${BASE}/notebook/notes/${bid}">${t("open_nb")}</a><button class="btn quiet sm c-addnote">${I("pencil")}${t("note_add")}</button></div>
            </div>
            <div class="card c-side-card">
              <p class="eyebrow">${t("needs_h")}</p>
              <ul class="c-mini">${b.pre.map((p) => `<li><a href="${BASE}/block/${p}"><span>${stopNo(p)}</span>${esc(L(BL[p].title))}</a></li>`).join("")}
                ${b.g11.map((g) => `<li class="g11"><span>${I("book")}</span>${tx(C.grade11[g])}</li>`).join("")}</ul>
              <p class="eyebrow c-book-h">${t("in_book")}</p>
              <p>${b.book.map((r) => r.pages.map((pp) => bookChip(r.lesson, pp[0])).join("")).join("")}</p>
            </div>
          </aside>
        </div>
        <nav class="c-prevnext">${prev ? `<a href="${BASE}/block/${prev.id}">${I("arrow", "back-ic")}<span><small>${t("prev_stop")}</small>${esc(L(BL[prev.id].title))}</span></a>` : "<span></span>"}
          ${next ? `<a class="nx" href="${BASE}/block/${next.id}"><span><small>${t("next_stop")}</small>${esc(L(BL[next.id].title))}</span>${I("arrow", "flip")}</a>` : ""}</nav>
      </section></div>`;
    $(".c-addnote").onclick = () => noteSheet({ block: bid });
  }

  // ───────────── Visuals for lesson intuition steps ─────────────
  // Each reads the lesson's visual.params (assets/js/course-math-sci-lessons.js) and falls back to a built-in example.
  // Functions in params.js / d_js are first-party lesson data (plain arithmetic in x or u).
  const fnOf = (src, v, fb) => { try { const f = new Function(v, `"use strict"; return (${src});`); f(1); return f; } catch (_) { return fb; } };
  const VISUALS = {
    // x → u = g(x) → y = f(u): a small segment on the x line is stretched by g'(x) onto the u line, then by f'(u) onto the y line.
    "chain-zoom"(host, v) {
      const P = v.params || {};
      const inner = P.inner || { latex: "u=2x+1", js: "2*x+1", d_js: "2", d_latex: "\\dv{u}{x}=2" };
      const outer = P.outer || { latex: "y=u^2", js: "u*u", d_js: "2*u", d_latex: "\\dv{y}{u}=2u" };
      const X = P.x || { min: -1, max: 1.5, step: 0.25, start: 0.5 };
      const g = fnOf(inner.js, "x", (x) => 2 * x + 1), gp = fnOf(inner.d_js, "x", () => 2), f = fnOf(outer.js, "u", (u) => u * u), fp = fnOf(outer.d_js, "u", (u) => 2 * u);
      const dx = P.dx || 0.05;
      const r2 = (n) => Math.round(n * 100) / 100;
      host.innerHTML = `<div class="widget cz">
        <div class="cz-eq">${tex(inner.latex)}<span class="cz-sep" aria-hidden="true"></span>${tex(outer.latex)}</div>
        <svg viewBox="0 0 340 250" class="plot" role="img" aria-label="${esc(L(v.alt) || t("cz_alt"))}" dir="ltr"></svg>
        <label class="sl-row" dir="ltr"><span>${tex("x")}</span><input type="range" min="${X.min}" max="${X.max}" step="${X.step}" value="${X.start ?? X.min}" aria-label="x"><b class="czx"></b></label>
        <div class="readout"><div><span>${tex("g'(x)")}</span><b class="c1"></b></div><div><span>${tex("f'(u)")}</span><b class="c2"></b></div><div class="hl"><span>${t("cz_total")}</span><b class="c3"></b></div></div>
      </div>`;
      const svg = $("svg", host), inp = $("input", host);
      const lab = isAr() ? { x: "س", u: "ع", y: "ص" } : { x: "x", u: "u", y: "y" };
      const draw = () => {
        const x = +inp.value, u = g(x), y = f(u), k1 = gp(x), k2 = fp(u), total = k1 * k2;
        // Each line is a local zoom window around its point; segment lengths are true to scale (same px per unit), capped to fit.
        const base = 60, Lx = dx * base * 6, Lu = Lx * Math.abs(k1), Ly = Lu * Math.abs(k2);
        const cap = 300, sc = Math.max(Ly, Lu, Lx) > cap ? cap / Math.max(Ly, Lu, Lx) : 1;
        const rows = [{ l: lab.y, val: y, len: Ly * sc, yy: 40 }, { l: lab.u, val: u, len: Lu * sc, yy: 125 }, { l: lab.x, val: x, len: Lx * sc, yy: 210 }];
        const cx = 175; let out = "";
        const seg = (r) => [cx - r.len / 2, cx + r.len / 2];
        for (let k = 0; k < 2; k++) { const [a, b] = seg(rows[k]), [a2, b2] = seg(rows[k + 1]); out += `<path d="M${a},${rows[k].yy + 6} L${b},${rows[k].yy + 6} L${b2},${rows[k + 1].yy - 6} L${a2},${rows[k + 1].yy - 6} Z" class="cz-funnel"/>`; }
        rows.forEach((r) => {
          const [a, b] = seg(r);
          out += `<line x1="20" x2="336" y1="${r.yy}" y2="${r.yy}" class="axis"/><line x1="${a}" x2="${b}" y1="${r.yy}" y2="${r.yy}" class="cz-seg"/>
            <text x="8" y="${r.yy + 4}" class="cz-l">${r.l}</text><text x="${cx}" y="${r.yy + 20}" class="tick-l">${num(r2(r.val))}</text>`;
        });
        out += `<text x="336" y="${(rows[1].yy + rows[2].yy) / 2 + 4}" class="cz-k" text-anchor="end">× ${num(r2(k1))}</text><text x="336" y="${(rows[0].yy + rows[1].yy) / 2 + 4}" class="cz-k" text-anchor="end">× ${num(r2(k2))}</text>`;
        svg.innerHTML = out;
        $(".czx", host).textContent = num(r2(x)); $(".c1", host).textContent = num(r2(k1)); $(".c2", host).textContent = num(r2(k2));
        $(".c3", host).textContent = `${num(r2(k1))} × ${num(r2(k2))} = ${num(r2(total))}`;
      };
      inp.addEventListener("input", draw); draw();
    },
    // Nested layers (outer → inner), each with its derivative underneath; the product is the derivative.
    "chain-layers"(host, v) {
      const P = v.params || {};
      const Ls = P.layers || [{ box: "(\\ \\ )^3", d: "3\\sin^2(2x)" }, { box: "\\sin(\\ \\ )", d: "\\cos(2x)" }, { box: "2x", d: "2" }];
      const nest = (i) => (i >= Ls.length ? "" : `<div class="cl-box d${i}"><span class="cl-fn">${tex(Ls[i].box || Ls[i].fn || "")}</span>${nest(i + 1)}</div>`);
      host.innerHTML = `<div class="cl-wrap"><div class="cl-nest">${nest(0)}</div>
        <div class="cl-prod">${Ls.map((x, i) => `<span class="cl-d d${i}">${tex(x.d)}</span>`).join(`<span class="cl-x">×</span>`)}</div>
        ${P.result ? `<div class="cl-res">${tex("= " + P.result)}</div>` : ""}</div>`;
    },
    // Value table: tap the cells in the right order (inside first, then f' at g(a), then g'(a)).
    "chain-table"(host, v) {
      const P = v.params || {};
      const T2 = P.table_table || { cols: ["x", "f(x)", "f'(x)", "g(x)", "g'(x)"], rows: [[1, 4, 6, 3, 2], [3, 7, 5, 2, -1]] };
      const Qs = P.questions || [{ ask: "(f\\circ g)'(1)", path: [["g", 1], ["df", 3], ["dg", 1]], calc: "f'(3)\\times g'(1)=5\\times 2=10", answer: 10 }];
      const COL = { f: 1, df: 2, g: 3, dg: 4 };
      let q = 0, s = 0;
      host.innerHTML = `<div class="ct">
        ${Qs.length > 1 ? `<div class="ct-qs" role="group" aria-label="${t("ct_pick")}">${Qs.map((x, i) => `<button class="chip sm" data-q="${i}">${tex(x.ask)}</button>`).join("")}</div>` : ""}
        <p class="ct-q"></p>
        <div class="ct-scroll"><table class="c-table ct-t"><thead><tr>${T2.cols.map((h) => `<th scope="col">${tex(h)}</th>`).join("")}</tr></thead>
        <tbody>${T2.rows.map((r) => `<tr>${r.map((c, j) => (j === 0 ? `<th scope="row">${tex(String(c))}</th>` : `<td><button class="ct-c" data-x="${r[0]}" data-c="${j}">${tex(String(c))}</button></td>`)).join("")}</tr>`).join("")}</tbody></table></div>
        <p class="ct-step" aria-live="polite"></p></div>`;
      const say = () => {
        const Q = Qs[q];
        $(".ct-q", host).innerHTML = `${t("ct_find")} ${tex(Q.ask)}`;
        $(".ct-step", host).innerHTML = s < Q.path.length ? `<b>${num(s + 1)}/${num(Q.path.length)}</b> ${t(["ct_s1", "ct_s2", "ct_s3"][Math.min(s, 2)])}` : `${I("check")} ${tex(Q.calc)}`;
        $$("[data-q]", host).forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.q === q)));
      };
      const reset = (i) => { q = i; s = 0; $$(".ct-c", host).forEach((b) => { b.classList.remove("on", "no"); b.disabled = false; }); say(); };
      $$("[data-q]", host).forEach((b) => (b.onclick = () => reset(+b.dataset.q)));
      $$(".ct-c", host).forEach((b) => (b.onclick = () => {
        const Q = Qs[q]; if (s >= Q.path.length) return;
        const [key, xv] = Q.path[s];
        if (+b.dataset.x === +xv && +b.dataset.c === COL[key]) { b.classList.add("on"); b.disabled = true; s++; say(); }
        else { b.classList.add("no"); $(".ct-step", host).innerHTML = `${I("alert")} ${t("ct_which")}`; setTimeout(() => { b.classList.remove("no"); say(); }, 900); }
      }));
      say();
    },
    // Chain links: variables joined by their rates; the total rate is the product.
    "chain-links"(host, v) {
      const P = v.params || {};
      const nodes = P.nodes || ["y", "u", "x", "m"];
      const rates = P.rates || nodes.slice(1).map((n, i) => `\\dv{${nodes[i]}}{${n}}`);
      const vals = P.values || [];
      host.innerHTML = `<div class="ck">${nodes.map((nd, i) => `<span class="ck-n">${tex(nd)}</span>${i < rates.length ? `<span class="ck-l"><span class="ck-r">${tex(rates[i])}</span>${vals[i] != null ? `<span class="ck-v">${tex(String(vals[i]))}</span>` : ""}</span>` : ""}`).join("")}</div>
        <div class="c-disp ck-p">${tex(P.result || `\\dv{${nodes[0]}}{${nodes[nodes.length - 1]}} = ${rates.join(" \\times ")}`, true)}</div>`;
    },
  };
  // Value table carried by an example or exercise ({cols, rows}).
  const valueTable = (tb) => (tb && tb.cols ? `<div class="ct-scroll"><table class="c-table c-vtable"><thead><tr>${tb.cols.map((h) => `<th scope="col">${tex(h)}</th>`).join("")}</tr></thead>
    <tbody>${tb.rows.map((r) => `<tr>${r.map((c, j) => (j === 0 ? `<th scope="row">${tex(String(c))}</th>` : `<td>${tex(String(c))}</td>`)).join("")}</tr>`).join("")}</tbody></table></div>` : "");
  function visual(v) {
    if (!v) return "";
    const id = "v" + Math.random().toString(36).slice(2, 8);
    queueMicrotask(() => {
      const host = document.getElementById(id); if (!host) return;
      const fn = VISUALS[v.id];
      if (fn) { try { fn($(".c-vis-body", host), v); } catch (e) { $(".c-vis-body", host).innerHTML = `<p class="small muted">${tx(v.spec)}</p>`; } }
      else $(".c-vis-body", host).innerHTML = `<p class="small muted">${tx(v.spec)}</p>`;
    });
    return `<figure class="c-vis" id="${id}"><div class="c-vis-body"></div><figcaption class="small muted">${tx(v.alt)}</figcaption></figure>`;
  }

  // ───────────── Lesson player ─────────────
  function stepRefLabel(st) { return L(st.title) || ""; }
  function addNoteButton(P, getRef) {
    const top = $(".player-top");
    const btn = document.createElement("button");
    btn.className = "icon-btn c-note-btn"; btn.setAttribute("aria-label", t("note_add")); btn.title = t("note_add");
    btn.innerHTML = I("pencil");
    btn.onclick = () => noteSheet(getRef());
    const nbl = document.createElement("a");
    nbl.className = "icon-btn c-nb-btn"; nbl.href = `${BASE}/notebook`; nbl.setAttribute("aria-label", t("nb_title")); nbl.title = t("nb_title"); nbl.innerHTML = I("note");
    top.insertBefore(nbl, top.lastElementChild); top.insertBefore(btn, nbl);
    // The exam-links switch, compact (icon) in the player bar.
    top.insertAdjacentHTML("beforeend", exlToggle("in-player"));
  }

  function staticStep(st) { // compact renderer for "more" steps
    let h = st.title ? `<h4>${tx(st.title)}</h4>` : "";
    if (st.body) h += para(st.body);
    if (st.statement) h += `<div class="rule">${tx(st.statement)}${st.latex ? `<div class="c-disp">${tex(st.latex, true)}</div>` : ""}</div>`;
    if (st.prompt) h += `<p>${tx(st.prompt)}</p>${st.latex ? `<div class="c-disp">${tex(st.latex, true)}</div>` : ""}`;
    if (st.steps) h += `<ol class="worked">${st.steps.map((s) => `<li>${tx(s.do)}${s.latex ? `<div class="c-disp">${tex(s.latex, true)}</div>` : ""}${s.why ? `<p class="c-why">${tx(s.why)}</p>` : ""}</li>`).join("")}</ol>`;
    if (st.answer) h += `<p class="c-answer"><b>${t("answer")}</b> ${tx(st.answer)} ${st.answer.latex ? tex(st.answer.latex) : ""}</p>`;
    return h;
  }
  const moreBlock = (st) => (st.more && st.more.length ? `<details class="c-more c-deeper"><summary>${I("layers")}${t("go_deeper")}${I("chevron", "c-more-chev")}</summary><div class="c-deeper-b">${st.more.map(staticStep).join("")}</div></details>` : "");

  function viewLesson(lid, stepArg) {
    const l = idx().lessons[lid]; if (!l) return go(BASE);
    const b = BL[l.block], steps = l.steps || [];
    const nb = NB(); startBlock(l.block);
    const prog = (nb.progress.lessons[lid] = nb.progress.lessons[lid] || { step: 0, done: false, ts: Date.now() });
    let i = stepArg != null && stepArg !== "" ? Math.max(0, Math.min(steps.length - 1, parseInt(stepArg, 10) || 0)) : prog.done ? 0 : Math.min(prog.step || 0, Math.max(0, steps.length - 1));
    save();
    setTitle(L(l.title));
    const P = N.Player({ title: `${t("stop")} ${stopNo(l.block)}${SEP()}${L(b.title)}`, subject: "math", segments: steps.length, exit: `${BASE}/block/${l.block}` });
    $(".player").setAttribute("data-course", "");
    let ctx = { lesson: lid, block: l.block };
    addNoteButton(P, () => ({ ...ctx }), true);
    const back = document.createElement("button");
    back.className = "btn quiet b-back"; back.innerHTML = `${I("arrow", "back-ic")}<span>${T("back")}</span>`;
    $(".bar-actions").prepend(back);
    const nav = (k) => { i = k; run(); };
    const finish = () => {
      prog.done = true; prog.step = steps.length; prog.ts = Date.now();
      const ls = lessonsOf(l.block); if (ls.every((x) => lessonState(x.id) === "done")) nb.progress.blocks[l.block].done_ts = nb.progress.blocks[l.block].done_ts || Date.now();
      N.logActivity(); save();
    };
    const run = () => {
      if (i >= steps.length) { finish(); return go(`${BASE}/block/${l.block}`); }
      const st = steps[i];
      prog.step = Math.max(prog.done ? 0 : prog.step || 0, i); prog.ts = Date.now(); save();
      ctx = { lesson: lid, block: l.block, step: st.id };
      P.progress(i); P.step(`${tx(st.title)}`);
      P.body.innerHTML = ""; P.body.setAttribute("data-step", st.type);
      back.hidden = i === 0; back.onclick = () => nav(i - 1);
      const next = () => nav(i + 1);
      const cont = (label = T("continue")) => P.set({ label, onMain: next });
      const type = st.type;
      if (type === "hook") {
        const ex = st.exam || {};
        const inner = `${ex.weight != null ? `<p class="c-exam-w"><b>${pct1(ex.weight)}</b> <span class="small muted">${t("of_marks")}</span></p>` : ""}
            ${(ex.patterns || []).length ? `<ul class="c-exam-pats">${ex.patterns.map((p) => `<li>${esc(patTitle(p))}</li>`).join("")}</ul>` : ""}
            ${(ex.past || []).length ? `<p class="small muted c-past-h">${fillT("past_n", { n: num(ex.past.length) })}</p><div class="c-past-list">${ex.past.map((r) => pastLink(r, { blank: true })).join("")}</div>` : ""}`;
        P.body.innerHTML = `<div class="prose">${para(st.body)}</div>
          ${exPanel(ex.weight != null || (ex.patterns || []).length || (ex.past || []).length ? inner : "", t("in_exam"))}${moreBlock(st)}`;
        cont();
      } else if (type === "intuition") {
        P.body.innerHTML = `<div class="prose">${para(st.body)}</div>
          ${st.analogy ? `<div class="c-analogy">${I("bulb")}<div><b>${t("analogy")}</b>${para(st.analogy)}</div></div>` : ""}
          ${visual(st.visual)}${moreBlock(st)}`;
        cont();
      } else if (type === "rule") {
        P.body.innerHTML = `<div class="rule c-rule"><p>${tx(st.statement)}</p>${st.latex ? `<div class="c-disp">${tex(st.latex, true)}</div>` : ""}</div>
          ${st.conditions ? `<p class="c-cond">${I("alert")}<span>${tx(st.conditions)}</span></p>` : ""}
          ${st.note ? `<div class="prose small">${para(st.note)}</div>` : ""}
          ${st.book ? `<p>${bookChip(st.book.lesson, st.book.page)}</p>` : ""}${moreBlock(st)}`;
        cont();
      } else if (type === "example") {
        const lv = st.level || 1;
        P.body.innerHTML = `<p class="c-level"><span class="badge">${fillT("level", { n: num(lv) })}</span>${st.pattern ? `<span class="small muted x-exam">${esc(patTitle(st.pattern))}</span>` : ""}</p>
          <div class="problem">${tx(st.prompt)}${st.latex ? `<div class="c-disp">${tex(st.latex, true)}</div>` : ""}${valueTable(st.table)}</div>
          <p class="small muted c-try">${t("try_first")}</p>
          <ol class="worked c-worked"></ol><div class="c-ans-slot"></div>
          ${st.book ? `<p>${bookChip(st.book.lesson, st.book.page)}</p>` : ""}
          ${(st.past || []).length ? exPanel(`<div class="c-past-list">${st.past.map((r) => pastLink(r, { blank: true })).join("")}</div>`, t("past_panel")) : ""}${moreBlock(st)}`;
        const ss = st.steps || []; let k = 0;
        const reveal = () => {
          if (k < ss.length) {
            const s = ss[k++];
            $(".c-worked", P.body).insertAdjacentHTML("beforeend", `<li>${tx(s.do)}${s.latex ? `<div class="c-disp">${tex(s.latex, true)}</div>` : ""}${s.why ? `<p class="c-why"><span>${t("why")}</span> ${tx(s.why)}</p>` : ""}</li>`);
            P.progress(i, k / (ss.length + 1));
          }
          if (k >= ss.length) {
            $(".c-ans-slot", P.body).innerHTML = st.answer ? `<p class="c-answer">${I("check")}<span><b>${t("answer")}</b> ${tx(st.answer)}${st.answer.latex ? ` ${tex(st.answer.latex)}` : ""}</span></p>` : "";
            P.set({ label: T("continue"), onMain: next });
          } else P.set({ label: T("next_step"), onMain: reveal });
          $(".c-try", P.body)?.remove();
          const last = $(".c-worked li:last-child", P.body); last && last.scrollIntoView({ block: "nearest", behavior: REDUCED() ? "auto" : "smooth" });
        };
        P.set({ label: ss.length ? t("show_step1") : T("continue"), onMain: ss.length ? reveal : next });
      } else if (type === "mistakes") {
        P.body.innerHTML = `<p class="small muted">${t("mistakes_d")}</p><ul class="c-mist">${(st.items || []).map((m) => `<li>
          <span class="c-reason">${esc(reasonTitle(m.reason))}</span>
          <div class="cm-row bad">${I("x")}<div>${tx(m.wrong)}${m.wrong_latex ? `<div class="c-disp">${tex(m.wrong_latex, true)}</div>` : ""}</div></div>
          <div class="cm-row good">${I("check")}<div>${tx(m.right)}${m.right_latex ? `<div class="c-disp">${tex(m.right_latex, true)}</div>` : ""}</div></div>
          <p class="c-why">${tx(m.why)}</p></li>`).join("")}</ul>${moreBlock(st)}`;
        cont();
      } else if (type === "check" || type === "practice") {
        const items = type === "check" ? st.items || [] : (st.exercise_ids || []).map(exById).filter(Boolean);
        let j = 0;
        if (!items.length) { P.body.innerHTML = `<p class="muted">${t("no_items")}</p>`; return cont(); }
        if (type === "practice") {
          P.body.innerHTML = `<div class="prose"><p>${fillT("practice_intro", { n: num(items.length) })}</p></div>
            <ul class="c-exlist">${items.map((e) => `<li><span class="badge">${t("fmt_" + e.format)}</span><span>${esc(patTitle(e.pattern))}</span>${lastResult(e.id)}</li>`).join("")}</ul>`;
          P.set({ label: t("start_practice"), onMain: () => ask() });
        } else ask();
        function ask() {
          if (j >= items.length) return next();
          P.progress(i, j / items.length);
          P.step(`${tx(st.title)} <span class="count">${num(j + 1)} ${T("of")} ${num(items.length)}</span>`);
          ctx = { lesson: lid, block: l.block, step: st.id, ex: items[j].id };
          runExercise(items[j], P, { log: type === "practice", onDone: () => { j++; ask(); } });
        }
      } else if (type === "summary") {
        const cards = (st.card_ids || []).map((id) => idx().cards[id]).filter(Boolean);
        let added = 0;
        cards.forEach((c) => { if (addReviewCard({ card: c.id, front: c.front, back: c.back, block: c.block, concept: c.concept })) added++; });
        finish();
        const ls = lessonsOf(l.block), k = ls.findIndex((x) => x.id === lid), nl = ls[k + 1];
        P.body.innerHTML = `<div class="c-done">
          <span class="c-done-ic">${I("check")}</span>
          <h2 class="c-done-h">${t("lesson_done")}</h2>
          <ul class="c-points">${(st.points || []).map((p) => `<li>${I("check")}<span>${tx(p)}</span></li>`).join("")}</ul>
          ${cards.length ? `<p class="c-cards-note">${I("cards")}<span>${added ? fillT("cards_added", { n: num(added) }) : fillT("cards_have", { n: num(cards.length) })}</span></p>` : ""}
          <div class="c-done-a">${nl ? "" : (exercisesOf(l.block).length ? `<a class="btn secondary" href="${BASE}/practice/${l.block}">${I("pencil")}${t("block_review")}</a>` : "")}
            <a class="btn secondary" href="${BASE}/notebook">${I("note")}${t("nb_title")}</a>
            <a class="btn quiet" href="${BASE}/block/${l.block}">${t("back_block")}</a></div>
        </div>`;
        P.progress(steps.length);
        P.set({ state: "good", label: nl ? t("next_lesson") : t("back_road"), onMain: () => go(nl ? `${BASE}/lesson/${nl.id}` : `${BASE}#c-road`) });
      } else {
        P.body.innerHTML = staticStep(st); cont();
      }
    };
    run();
  }
  function lastResult(exId) {
    const a = NB().attempts.filter((x) => x.ex === exId).pop();
    return a ? `<span class="c-res ${a.ok ? "ok" : "no"}">${I(a.ok ? "check" : "x")}<span class="vh">${a.ok ? T("correct_t") : T("incorrect_t")}</span></span>` : "";
  }

  // ───────────── Exercise engine ─────────────
  // mcq / numeric: auto-checked. expression: compare with the model answer. short / long / proof: write on paper, then self-mark.
  function runExercise(ex, P, { log = true, onDone }) {
    const t0 = Date.now(); let hints = 0, tries = 0, done = false, att = null, sel = null;
    const fmt = ex.format, auto = fmt === "mcq" || fmt === "numeric";
    const meta = `<p class="c-exmeta"><span class="badge">${t("fmt_" + fmt)}</span>${ex.marks ? `<span class="small muted">${fillT("marks_n", { m: num(ex.marks) })}</span>` : ""}<span class="c-diff" aria-label="${fillT("diff_aria", { n: num(ex.difficulty || 1) })}">${[1, 2, 3].map((k) => `<i class="${k <= (ex.difficulty || 1) ? "on" : ""}"></i>`).join("")}</span>${ex.pattern ? `<span class="small muted c-expat x-exam">${esc(patTitle(ex.pattern))}</span>` : ""}</p>`;
    const optHtml = (o) => (o.latex ? tex(o.latex) : tx(o.text));
    // Options are shuffled per exercise and attempt count (the authored order puts the key first).
    // data-i keeps the SOURCE index, so checking, feedback and the stored answer never depend on the display order.
    const order = fmt === "mcq" ? shuffled((ex.options || []).map((_, k) => k), seedOf(`${ex.id}#${NB().attempts.filter((a) => a.ex === ex.id).length}`)) : [];
    P.body.innerHTML = `${meta}<div class="stem">${tx(ex.prompt)}${ex.latex ? `<div class="c-disp">${tex(ex.latex, true)}</div>` : ""}${valueTable(ex.table)}</div>
      ${fmt === "mcq" ? `<div class="options" role="radiogroup">${order.map((k, pos) => `<button class="option" role="radio" aria-checked="false" data-i="${k}"><kbd>${num(pos + 1)}</kbd><span class="o-t">${optHtml(ex.options[k])}</span></button>`).join("")}</div><p class="kbd-hint">${T("keys_hint")}</p>`
      : fmt === "numeric" ? `<input class="num-input" inputmode="decimal" autocomplete="off" dir="ltr" aria-label="${T("your_answer")}" placeholder="${T("your_answer")}">`
      : fmt === "expression" ? `<label class="small muted c-exp-l" for="c-exp">${t("exp_label")}</label><input id="c-exp" class="field c-exp" autocomplete="off" dir="ltr" placeholder="${t("exp_ph")}">`
      : `<p class="c-paper">${I("pencil")}<span>${t("write_paper")}</span></p>`}
      <div class="c-hints"></div><div class="c-after"></div>`;
    const opts = $$(".option", P.body), input = $(".num-input", P.body) || $(".c-exp", P.body);
    const hintsArr = ex.hints || [];
    const hintFn = () => {
      if (hints >= hintsArr.length) return;
      $(".c-hints", P.body).insertAdjacentHTML("beforeend", `<div class="coach-msg">${N.mark("coach-av")}<div class="bubble"><b class="c-hint-n">${fillT("hint_n", { n: num(hints + 1), t: num(hintsArr.length) })}</b> ${tx(hintsArr[hints])}</div></div>`);
      hints++; idle();
    };
    const hintLabel = () => $(".b-hint span") && ($(".b-hint span").textContent = hintsArr.length > 1 ? fillT("hint_btn", { n: num(Math.min(hints + 1, hintsArr.length)), t: num(hintsArr.length) }) : T("hint"));
    const has = () => (fmt === "mcq" ? sel !== null : fmt === "numeric" ? input.value.trim() !== "" : true);
    function idle() {
      const canHint = !done && hints < hintsArr.length;
      if (auto) P.set({ label: T("check"), disabled: !has(), hint: canHint ? hintFn : null, onMain: check });
      else P.set({ label: fmt === "expression" ? t("show_answer") : t("show_solution"), hint: canHint ? hintFn : null, onMain: revealWritten });
      hintLabel();
    }
    opts.forEach((b) => b.addEventListener("click", () => { if (done || b.disabled) return; sel = +b.dataset.i; opts.forEach((o) => o.setAttribute("aria-checked", String(o === b))); idle(); }));
    if (input) { input.addEventListener("input", () => { input.classList.remove("is-wrong"); idle(); }); input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $(".b-main").click(); } }); setTimeout(() => input.focus({ preventScroll: true }), 30); }

    const solutionHtml = (open = true) => {
      const s = ex.solution || {};
      return `<details class="c-sol"${open ? " open" : ""}><summary>${I("eye")}${t("solution")}${I("chevron", "c-more-chev")}</summary>
        <ol class="worked">${(s.steps || []).map((x, k) => `<li>${tx(x.do)}${x.latex ? `<div class="c-disp">${tex(x.latex, true)}</div>` : ""}${x.why ? `<p class="c-why"><span>${t("why")}</span> ${tx(x.why)}</p>` : ""}${(s.marks_scheme || []).find((m) => m.step === k + 1) ? `<span class="c-mk">${fillT("marks_n", { m: num(s.marks_scheme.find((m) => m.step === k + 1).marks) })}</span>` : ""}</li>`).join("")}</ol>
        ${s.final ? `<p class="c-answer">${I("check")}<span><b>${t("answer")}</b> ${tx(s.final)}${s.final.latex ? ` ${tex(s.final.latex)}` : ""}</span></p>` : ex.answer ? `<p class="c-answer">${I("check")}<span><b>${t("answer")}</b> ${tex(ex.answer.latex)}</span></p>` : ""}
      </details>${(ex.past || []).length ? exPanel(`<div class="c-past-list">${ex.past.map((r) => pastLink(r, { blank: true })).join("")}</div>`, t("past_panel")) : ""}`;
    };
    // One attempt per exercise run, updated to the final outcome: wrong then right = correct on a second try (partial credit).
    const record = ({ ok, partial = false, answer, self_mark, reason }) => {
      if (!log) return null;
      const nb = NB(), first = !att;
      if (first) { att = { ex: ex.id, ts: Date.now() }; nb.attempts.push(att); if (nb.attempts.length > 2000) nb.attempts.splice(0, nb.attempts.length - 2000); }
      Object.assign(att, { ok: !!ok, hints, secs: Math.round((Date.now() - t0) / 1000) });
      if (tries > 1) att.tries = tries;
      if (ok && tries > 1) att.retry = true;
      if (partial) att.partial = true; else delete att.partial;
      if (answer != null && answer !== "") att.answer = String(answer).slice(0, 120); if (self_mark != null) att.self_mark = self_mark; if (reason) att.reason = reason;
      startBlock(ex.block);
      // Mistake log: open one on a wrong attempt (or bump retries); resolve it on a correct one (also a correct second try
      // in the same run). A resolved mistake keeps its review card. The reason stays unconfirmed until the student picks one.
      let m = nb.mistakes.find((x) => x.ex === ex.id && !x.resolved);
      if (!ok) {
        if (m) { if (first) m.retries = (m.retries || 0) + 1; if (answer) m.answer = String(answer).slice(0, 120); if (reason && !m.reason_confirmed) m.reason = reason; }
        else {
          m = { id: uid("m"), type: "mistake", ex: ex.id, block: ex.block, pattern: ex.pattern, concepts: ex.concepts || [], reason: reason || "concept", reason_confirmed: false, answer: answer ? String(answer).slice(0, 120) : undefined, created: Date.now(), retries: 0, card: null };
          const rc = addReviewCard({ front: { ...ex.prompt, latex: ex.latex || "" }, back: ex.solution && ex.solution.final ? ex.solution.final : { ar: "", en: "", latex: ex.answer ? ex.answer.latex : "" }, block: ex.block, concept: (ex.concepts || [])[0] });
          if (rc) m.card = rc.id;
          nb.mistakes.push(m);
        }
      } else if (m && !partial) { m.resolved = Date.now(); if (tries > 1) m.resolved_by = "retry"; }
      N.logActivity(); save();
      return m;
    };
    // Reason picker: the student confirms or changes why it went wrong.
    const reasonPicker = (m, preset) => {
      if (!m) return "";
      const rs = C.reasons;
      const wire = () => $$(".c-rsn button[data-r]", P.body).forEach((b) => (b.onclick = () => {
        m.reason = b.dataset.r; m.reason_confirmed = true; save();
        $$(".c-rsn button[data-r]", P.body).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        $(".c-rsn-ok", P.body).textContent = t("reason_saved");
      }));
      setTimeout(wire);
      // Three likely reasons first (the pre-selected one, then the student's most frequent ones), the rest behind "more".
      const cur = preset || m.reason, conf = m.reason_confirmed !== false;
      const freq = {}; NB().mistakes.forEach((x) => x.reason && x.reason_confirmed !== false && (freq[x.reason] = (freq[x.reason] || 0) + 1));
      const ordered = rs.map((r, k) => ({ r, k })).sort((a, b) => (b.r.id === cur) - (a.r.id === cur) || (freq[b.r.id] || 0) - (freq[a.r.id] || 0) || a.k - b.k).map((x) => x.r);
      const chip = (r) => `<button class="chip sm" data-r="${r.id}" aria-pressed="${conf && r.id === cur}">${tx(r.title)}</button>`;
      setTimeout(() => { const mb = $(".c-rsn-more", P.body); if (mb) mb.onclick = () => { mb.insertAdjacentHTML("beforebegin", ordered.slice(3).map(chip).join("")); mb.remove(); wire(); $$(".c-rsn button[data-r]", P.body)[3]?.focus(); }; });
      return `<div class="c-rsn-box"><p class="c-rsn-q" id="rsn-${ex.id}">${t("reason_q")}</p>
        <div class="c-rsn" role="group" aria-labelledby="rsn-${ex.id}">${ordered.slice(0, 3).map(chip).join("")}${ordered.length > 3 ? `<button class="chip sm quiet c-rsn-more" type="button">${t("reason_more")}</button>` : ""}</div>
        <p class="small muted c-rsn-ok" aria-live="polite">${t("reason_logged")}</p></div>`;
    };
    function check() {
      if (!has() || done) return;
      tries++;
      let ok, chosen = null, ans;
      if (fmt === "mcq") { chosen = ex.options[sel]; ok = !!chosen.correct; ans = String(sel + 1); } // source option number
      else { const v = parseFloat(N.normDigits(input.value)); ans = input.value.trim(); ok = Number.isFinite(v) && ex.answer && Math.abs(v - ex.answer.value) <= (ex.answer.tolerance ?? 1e-6); }
      const fbText = chosen && chosen.feedback ? tx(chosen.feedback) : "";
      if (ok) {
        done = true;
        record({ ok: true, answer: ans });
        if (fmt === "mcq") opts.forEach((o) => { o.disabled = true; if (+o.dataset.i === sel) o.classList.add("is-right"); });
        else { input.disabled = true; input.classList.add("is-right"); }
        $(".c-after", P.body).innerHTML = solutionHtml(false);
        P.set({ state: "good", fb: { title: tries > 1 ? t("right_now") : T("correct_t"), body: fbText }, label: T("continue"), onMain: () => onDone(true) });
        P.main.focus({ preventScroll: true });
        return;
      }
      const m = record({ ok: false, answer: ans, reason: chosen && chosen.reason });
      if (fmt === "mcq") { const o = opts.find((x) => +x.dataset.i === sel); o.classList.add("is-wrong"); o.disabled = true; o.setAttribute("aria-checked", "false"); sel = null; }
      else input.classList.add("is-wrong");
      if (tries === 1) {
        // First miss: just retry (the mistake is logged quietly); the reason is asked once, after the final attempt.
        $(".c-after", P.body).innerHTML = "";
        void m;
        P.set({ state: "bad", fb: { title: T("incorrect_t"), body: fbText || T("try_again") }, label: t("try_again_b"), disabled: false, hint: hints < hintsArr.length ? hintFn : null, onMain: () => { idle(); if (input) { input.focus(); input.select(); } } });
        hintLabel();
      } else {
        done = true;
        if (fmt === "mcq") opts.forEach((o) => { o.disabled = true; if (ex.options[+o.dataset.i].correct) o.classList.add("is-right"); });
        else input.disabled = true;
        const mm = log ? NB().mistakes.find((x) => x.ex === ex.id && !x.resolved) : null;
        // The reason picker comes first, so it is seen before the (long) worked solution.
        $(".c-after", P.body).innerHTML = (mm ? reasonPicker(mm, mm.reason) : "") + solutionHtml();
        P.set({ state: "bad", fb: { title: t("see_solution"), body: fbText }, label: T("continue"), onMain: () => onDone(false) });
      }
    }
    function revealWritten() {
      if (done) return; done = true;
      const ans = input ? input.value.trim() : "";
      if (input) input.disabled = true;
      const items = ex.self_mark || [];
      $(".c-after", P.body).innerHTML = solutionHtml() + (fmt === "expression" ? `<div class="c-self"><p class="c-rsn-q">${t("self_q")}</p>
          <div class="c-self-a"><button class="btn secondary sm" data-g="1">${I("check")}${t("self_yes")}</button><button class="btn secondary sm" data-g="0">${I("x")}${t("self_no")}</button></div></div>`
        : `<div class="c-self"><p class="c-rsn-q">${t("self_mark_q")}</p>
          ${items.length ? `<ul class="c-checklist">${items.map((it, k) => `<li><label><input type="checkbox" data-k="${k}"><span>${tx(it)}</span></label></li>`).join("")}</ul>` : `<div class="c-self-a"><button class="btn secondary sm" data-g="1">${t("self_full")}</button><button class="btn secondary sm" data-g="0.5">${t("self_part")}</button><button class="btn secondary sm" data-g="0">${t("self_none")}</button></div>`}</div>`);
      const finishSelf = (f) => {
        const ok = f >= 0.999, partial = !ok && f >= 0.5;
        const m = record({ ok, partial, answer: ans, self_mark: Math.round(f * 100) / 100 });
        if (!ok && m) $(".c-self", P.body).insertAdjacentHTML("afterend", reasonPicker(m));
        $$(".c-self button, .c-self input", P.body).forEach((x) => (x.disabled = true));
        P.set({ state: ok ? "good" : partial ? "hint" : "bad", fb: { title: ok ? t("self_good") : partial ? t("self_partial") : t("self_bad") }, label: T("continue"), onMain: () => onDone(ok) });
      };
      $$(".c-self [data-g]", P.body).forEach((b) => (b.onclick = () => finishSelf(+b.dataset.g)));
      if (fmt !== "expression" && items.length) P.set({ label: t("save_mark"), onMain: () => { const boxes = $$(".c-checklist input", P.body); finishSelf(boxes.filter((x) => x.checked).length / boxes.length); } });
      else P.set({ label: T("continue"), disabled: true, onMain: () => {} });
      $(".c-sol", P.body)?.scrollIntoView({ block: "nearest", behavior: REDUCED() ? "auto" : "smooth" });
    }
    idle();
  }

  // Exercise sets outside lessons: block review, one pattern, or one exercise (retry from the notebook).
  function viewPractice(bid, pattern) {
    const b = BL[bid]; if (!b) return go(BASE);
    const all = exercisesOf(bid);
    const inLessons = new Set(lessonsOf(bid).flatMap((l) => (l.steps || []).filter((s) => s.type === "practice").flatMap((s) => s.exercise_ids || [])));
    const review = all.filter((e) => e.set === "review");
    let list = pattern ? all.filter((e) => e.pattern === pattern) : review.length ? review : all.filter((e) => !inLessons.has(e.id));
    if (!list.length) list = all;
    if (!list.length) return go(`${BASE}/block/${bid}`);
    runSet(list, { title: pattern ? patTitle(pattern) : `${t("block_review")}${SEP()}${L(b.title)}`, exit: `${BASE}/block/${bid}`, block: bid });
  }
  function viewOneEx(id) {
    const ex = exById(id); if (!ex) return go(`${BASE}/notebook/mistakes`);
    runSet([ex], { title: `${t("retry")}${SEP()}${patTitle(ex.pattern)}`, exit: `${BASE}/notebook/mistakes`, block: ex.block });
  }
  function runSet(list, { title, exit, block }) {
    setTitle(title);
    const P = N.Player({ title, subject: "math", segments: list.length, exit });
    $(".player").setAttribute("data-course", "");
    let j = 0, right = 0, ctx = { block };
    addNoteButton(P, () => ({ ...ctx }), true);
    const ask = () => {
      if (j >= list.length) {
        P.progress(list.length); P.step("");
        P.body.innerHTML = `<div class="c-done"><span class="c-done-ic">${I("check")}</span><p class="eyebrow">${t("set_done")}</p>
          <h2>${fillT("set_score", { r: num(right), n: num(list.length) })}</h2>
          <p class="muted">${NB().mistakes.some((m) => !m.resolved && list.some((e) => e.id === m.ex)) ? t("set_mist") : t("set_clean")}</p>
          <div class="c-done-a"><a class="btn secondary" href="${BASE}/notebook">${I("note")}${t("nb_title")}</a></div></div>`;
        P.set({ state: "good", label: t("back_block"), onMain: () => go(exit) });
        return;
      }
      P.progress(j); P.step(`${T("question")} <span class="count">${num(j + 1)} ${T("of")} ${num(list.length)}</span>`);
      ctx = { block, ex: list[j].id };
      runExercise(list[j], P, { log: true, onDone: (ok) => { right += ok ? 1 : 0; j++; ask(); } });
    };
    ask();
  }

  // ───────────── Notebook (دفتري) ─────────────
  function viewNotebook(tab = "review", bidArg = "") {
    setTitle(t("nb_title"));
    const nb = NB();
    const TABS = ["review", "mistakes", "notes", "sheet"];
    if (!TABS.includes(tab)) tab = "review";
    const blk = bidArg && BL[bidArg] ? bidArg : nb.ui.nbBlock && BL[nb.ui.nbBlock] ? nb.ui.nbBlock : "";
    const used = new Set([...nb.notes.map((x) => x.ref.block), ...nb.mistakes.map((x) => x.block), ...nb.cards.map((x) => x.block), ...BLOCKS.filter((b) => hasLessons(b.id)).map((b) => b.id)].filter(Boolean));
    const inB = (x) => !blk || x === blk;
    const due = nb.cards.filter((c) => c.due <= todayKey() && inB(c.block));
    const openM = nb.mistakes.filter((m) => !m.resolved && inB(m.block));
    const notes = nb.notes.filter((x) => inB(x.ref.block));
    const counts = { review: due.length, mistakes: openM.length, notes: notes.length };
    app().innerHTML = `<div class="c-page" ${mathOn()}><section class="wrap c-nb">
      ${backLink(BASE, L(C.meta.title))}
      <div class="c-nb-head"><div><p class="eyebrow" lang="en">My notebook</p><h1>${t("nb_title")}</h1><p class="lede">${t("nb_d")}</p></div></div>
      <div class="c-nb-bar">
        <nav class="c-tabs" role="tablist" aria-label="${t("nb_title")}">${TABS.map((k) => `<a role="tab" href="${BASE}/notebook/${k}${blk ? "/" + blk : ""}" aria-selected="${k === tab}" ${k === tab ? 'aria-current="page"' : ""}>${I({ review: "cards", mistakes: "alert", notes: "note", sheet: "print" }[k])}<span>${t("tab_" + k)}</span>${counts[k] ? `<span class="c-dot">${num(counts[k])}</span>` : ""}</a>`).join("")}</nav>
        <label class="c-filter"><span class="small muted">${t("filter_block")}</span>
          <select class="field c-blk">${tab === "sheet" ? "" : `<option value="">${t("all_blocks")}</option>`}${BLOCKS.filter((b) => used.has(b.id)).map((b) => `<option value="${b.id}" ${b.id === blk ? "selected" : ""}>${stopNo(b.id)}${SEP()}${esc(L(b.title))}</option>`).join("")}</select></label>
      </div>
      <div class="c-nb-body" role="tabpanel"></div>
    </section></div>`;
    $(".c-blk").onchange = (e) => { nb.ui.nbBlock = e.target.value; save(); go(`${BASE}/notebook/${tab}${e.target.value ? "/" + e.target.value : ""}`); };
    const body = $(".c-nb-body");
    if (tab === "review") nbReview(body, blk);
    else if (tab === "mistakes") nbMistakes(body, blk);
    else if (tab === "notes") nbNotes(body, blk);
    else nbSheet(body, blk || ($(".c-blk").value) || C.meta.pilot);
  }
  const side = (o) => { const txt = o ? L(o) || "" : ""; return `${tx(o)}${o && o.latex && !txt.includes("$") ? `<div class="c-disp">${tex(o.latex, true)}</div>` : ""}`; };
  const front = (c) => side(c.front);
  const backOf = (c) => side(c.back);
  function nbReview(body, blk) {
    const nb = NB();
    const all = nb.cards.filter((c) => !blk || c.block === blk);
    const due = all.filter((c) => c.due <= todayKey());
    const boxes = [1, 2, 3, 4, 5].map((k) => all.filter((c) => c.box === k).length);
    body.innerHTML = `<div class="c-rv-top">
        ${due.length ? `<div class="c-rv-due"><b>${num(due.length)}</b><span>${t("due_today")}</span></div>` : `<div class="c-rv-due is-zero"><span>${t("due_none")}</span></div>`}
        <div class="c-boxes" role="img" aria-label="${esc(boxes.map((n, k) => `${t("box")} ${k + 1}: ${n}`).join(", "))}">${boxes.map((n, k) => `<span><i style="--h:${all.length ? Math.max(6, (n / Math.max(...boxes, 1)) * 100) : 6}%"></i><small>${num(k + 1)}</small></span>`).join("")}</div>
        <p class="small muted">${t("leitner_d")}</p>
      </div>
      <div class="c-rv-stage"></div>
      ${all.length ? `<details class="c-more"><summary>${fillT("all_cards", { n: num(all.length) })}${I("chevron", "c-more-chev")}</summary><ul class="c-cardlist">${all.map((c) => `<li><div>${front(c)}</div><small class="muted">${t("box")} ${num(c.box)}${SEP()}${t("due")} ${esc(fmtDue(c.due))}</small></li>`).join("")}</ul></details>` : ""}`;
    const stage = $(".c-rv-stage", body);
    if (!all.length) { stage.innerHTML = `<div class="c-empty">${I("cards")}<p><b>${t("no_cards")}</b></p><p class="small muted">${t("no_cards_d")}</p></div>`; return; }
    if (!due.length) { stage.innerHTML = `<div class="c-empty">${I("check")}<p><b>${t("all_reviewed")}</b></p><p class="small muted">${fillT("next_due", { d: esc(fmtDue(all.map((c) => c.due).sort()[0])) })}</p></div>`; return; }
    let q = due.slice(0, 20), k = 0;
    const show = () => {
      if (k >= q.length) { stage.innerHTML = `<div class="c-empty">${I("check")}<p><b>${t("session_done")}</b></p></div>`; return; }
      const c = q[k];
      stage.innerHTML = `<div class="c-flash" aria-live="polite"><p class="small muted">${num(k + 1)} / ${num(q.length)}${SEP()}${esc(L(BL[c.block]?.title))}</p>
        <div class="c-flash-f">${front(c)}</div><div class="c-flash-b" hidden>${backOf(c)}</div>
        <div class="c-flash-a"><button class="btn primary c-flip">${t("show_back")}</button></div></div>`;
      $(".c-flip", stage).onclick = () => {
        $(".c-flash-b", stage).hidden = false;
        $(".c-flash-a", stage).innerHTML = [[0, "g_again"], [1, "g_hard"], [2, "g_good"]].map(([g, kk]) => `<button class="btn ${g === 2 ? "primary" : "secondary"} sm" data-g="${g}">${t(kk)}</button>`).join("");
        $$(".c-flash-a [data-g]", stage).forEach((b) => (b.onclick = () => { gradeCard(c, +b.dataset.g); N.logActivity(); save(); k++; show(); }));
        $(".c-flash-a [data-g='2']", stage).focus();
      };
      $(".c-flip", stage).focus({ preventScroll: true });
    };
    show();
  }
  const fmtDue = (d) => (d <= todayKey() ? t("today") : N.fmtDate(new Date(d + "T00:00:00").getTime(), { day: "numeric", month: "short" }));
  function nbMistakes(body, blk) {
    const nb = NB();
    const filt = nb.ui.mFilter || "open";
    const all = nb.mistakes.filter((m) => !blk || m.block === blk);
    const list = all.filter((m) => (filt === "open" ? !m.resolved : !!m.resolved)).sort((a, b) => b.created - a.created);
    // Only reasons the student confirmed feed the chart; pre-filled guesses wait in the list below.
    const byR = {}; all.filter((m) => !m.resolved && m.reason_confirmed !== false).forEach((m) => (byR[m.reason] = (byR[m.reason] || 0) + 1));
    const unconf = all.filter((m) => !m.resolved && m.reason_confirmed === false).length;
    const top = Object.entries(byR).sort((a, b) => b[1] - a[1]); const maxR = top.length ? top[0][1] : 1;
    body.innerHTML = `${top.length ? `<div class="c-why-box"><p class="eyebrow">${t("why_mist")}</p><ul class="c-rbars">${top.map(([r, n]) => `<li><span>${esc(reasonTitle(r))}</span><span class="c-rbar"><i style="width:${(n / maxR) * 100}%"></i></span><b>${num(n)}</b></li>`).join("")}</ul>
        <p class="small muted">${fillT("why_tip", { r: esc(reasonTitle(top[0][0])) })} ${t("tip_" + top[0][0])}</p>${unconf ? `<p class="small muted">${fillT("unconf_n", { n: num(unconf) })}</p>` : ""}</div>` : unconf ? `<p class="small muted c-unconf">${I("alert")}<span>${fillT("unconf_n", { n: num(unconf) })}</span></p>` : ""}
      <div class="c-seg c-mf" role="group" aria-label="${t("tab_mistakes")}"><button class="c-seg-b" data-f="open" aria-pressed="${filt === "open"}">${t("m_open")}</button><button class="c-seg-b" data-f="resolved" aria-pressed="${filt === "resolved"}">${t("m_resolved")}</button></div>
      ${list.length ? `<ul class="c-mlist">${list.map((m) => {
        const ex = exById(m.ex);
        return `<li data-id="${m.id}"><div class="cm-head"><span class="badge muted">${stopNo(m.block)}${SEP()}${esc(L(BL[m.block]?.title))}</span><small class="muted">${esc(N.fmtDate(m.created, { day: "numeric", month: "short" }))}${m.retries ? `${SEP()}${fillT("retries", { n: num(m.retries) })}` : ""}</small></div>
          <p class="cm-q">${ex ? tx(ex.prompt) : esc(m.ex)}${ex && ex.latex ? ` <span class="cm-ql">${tex(ex.latex)}</span>` : ""}</p>
          ${ex ? answersLine(ex, m) : ""}
          <button type="button" class="cm-rchip${m.reason_confirmed === false ? " unset" : ""}" aria-haspopup="dialog">${I("alert")}<span><span class="vh">${t("reason")}: </span>${m.reason_confirmed === false ? t("reason_pick") : esc(reasonTitle(m.reason))}</span>${I("chevron", "cm-rchev")}</button>
          <div class="cm-a">${ex ? `<a class="cm-b" href="${BASE}/ex/${m.ex}">${I("review")}<span>${t("retry")}</span></a>` : ""}
            ${m.resolved ? `<button class="cm-b" data-act="reopen">${I("review")}<span>${t("m_reopen")}</span></button>` : `<button class="cm-b" data-act="resolve">${I("check")}<span>${t("m_resolve")}</span></button>`}
            <button class="cm-b" data-act="note">${I("pencil")}<span>${t("note_short")}</span></button></div></li>`;
      }).join("")}</ul>` : `<div class="c-empty">${I("check")}<p><b>${filt === "open" ? t("no_mist") : t("no_resolved")}</b></p><p class="small muted">${t("no_mist_d")}</p></div>`}`;
    $$(".c-mf [data-f]", body).forEach((b) => (b.onclick = () => { nb.ui.mFilter = b.dataset.f; save(); nbMistakes(body, blk); }));
    $$(".c-mlist li", body).forEach((li) => {
      const m = nb.mistakes.find((x) => x.id === li.dataset.id);
      $(".cm-rchip", li).onclick = () => reasonSheet(m, () => nbMistakes(body, blk));
      $$("[data-act]", li).forEach((b) => (b.onclick = () => {
        const a = b.dataset.act;
        if (a === "resolve") { m.resolved = Date.now(); save(); nbMistakes(body, blk); }
        if (a === "reopen") { delete m.resolved; save(); nbMistakes(body, blk); }
        if (a === "note") noteSheet({ block: m.block, ex: m.ex });
      }));
    });
  }
  // "Your answer" next to "correct" on one compact line (mcq: the option you picked; typed: what you typed).
  function answersLine(ex, m) {
    const opt = (o) => (o ? (o.latex ? tex(o.latex) : tx(o.text)) : "");
    let yours = "", right = "";
    if (ex.format === "mcq") { const k = parseInt(m.answer, 10) - 1; yours = Number.isFinite(k) && ex.options[k] ? opt(ex.options[k]) : ""; right = opt((ex.options || []).find((o) => o.correct)); }
    else {
      yours = m.answer ? `<bdi dir="ltr">${esc(m.answer)}</bdi>` : "";
      const f = ex.solution && ex.solution.final;
      right = ex.answer && ex.answer.latex ? tex(ex.answer.latex) : f ? (f.latex && !(L(f) || "").includes("$") ? tex(f.latex) : tx(f)) : "";
    }
    if (!yours && !right) return "";
    return `<p class="cm-ans">${yours ? `<span class="cm-y">${I("x")}<small>${t("your_ans")}</small>${yours}</span>` : ""}${right ? `<span class="cm-c">${I("check")}<small>${t("correct_ans")}</small>${right}</span>` : ""}</p>`;
  }
  // Reason picker in a sheet: three likely reasons first, the rest behind "more".
  function reasonSheet(m, after) {
    const rs = C.reasons, cur = m.reason_confirmed === false ? "" : m.reason;
    const freq = {}; NB().mistakes.forEach((x) => x.reason && x.reason_confirmed !== false && (freq[x.reason] = (freq[x.reason] || 0) + 1));
    const ordered = rs.map((r, k) => ({ r, k })).sort((a, b) => (b.r.id === (cur || m.reason)) - (a.r.id === (cur || m.reason)) || (freq[b.r.id] || 0) - (freq[a.r.id] || 0) || a.k - b.k).map((x) => x.r);
    const chip = (r) => `<button class="chip sm" data-r="${r.id}" aria-pressed="${r.id === cur}">${tx(r.title)}</button>`;
    const sh = openSheet(`<p class="eyebrow">${I("alert")}${t("reason")}</p><h2 class="h-sm">${t("reason_q")}</h2>
      <div class="c-rsn" role="group">${ordered.slice(0, 3).map(chip).join("")}${ordered.length > 3 ? `<button class="chip sm quiet c-rsn-more" type="button">${t("reason_more")}</button>` : ""}</div>`, { label: t("reason") });
    const wire = () => $$("[data-r]", sh.el).forEach((b) => (b.onclick = () => { m.reason = b.dataset.r; m.reason_confirmed = true; save(); sh.close(); toast(t("reason_saved")); after && after(); }));
    const mb = $(".c-rsn-more", sh.el); if (mb) mb.onclick = () => { mb.insertAdjacentHTML("beforebegin", ordered.slice(3).map(chip).join("")); mb.remove(); wire(); $$("[data-r]", sh.el)[3]?.focus(); };
    wire();
  }
  function refLink(ref) {
    if (ref.lesson && idx().lessons[ref.lesson]) {
      const l = idx().lessons[ref.lesson]; const k = (l.steps || []).findIndex((s) => s.id === ref.step);
      return `<a href="${BASE}/lesson/${ref.lesson}${k >= 0 ? "/" + k : ""}">${esc(L(l.title))}${k >= 0 ? `${SEP()}${esc(L(l.steps[k].title))}` : ""}</a>`;
    }
    if (ref.ex) return `<a href="${BASE}/ex/${ref.ex}">${t("exercise")} <bdi>${esc(ref.ex)}</bdi></a>`;
    if (ref.block) return `<a href="${BASE}/block/${ref.block}">${esc(L(BL[ref.block]?.title))}</a>`;
    return "";
  }
  function nbNotes(body, blk) {
    const nb = NB();
    const q = (nb.ui.noteQ || "").trim();
    const list = nb.notes.filter((x) => (!blk || x.ref.block === blk) && (!q || x.text.includes(q) || (x.tags || []).some((tg) => tg.includes(q.replace(/^#/, ""))))).sort((a, b) => (b.pinned - a.pinned) || b.updated - a.updated);
    const tags = [...new Set(nb.notes.flatMap((x) => x.tags || []))].slice(0, 12);
    body.innerHTML = `<div class="c-notes-bar"><button class="btn primary sm c-newnote">${I("plus")}${t("note_add")}</button>
        <label class="c-search"><span class="vh">${t("search")}</span><input class="field" type="search" value="${esc(q)}" placeholder="${t("search_ph")}"></label></div>
      ${tags.length ? `<div class="chips c-tags">${tags.map((tg) => `<button class="chip sm" data-tag="${esc(tg)}" aria-pressed="${q === "#" + tg}">#${esc(tg)}</button>`).join("")}</div>` : ""}
      ${list.length ? `<ul class="c-notes">${list.map((n) => `<li class="${n.pinned ? "pinned" : ""}" data-id="${n.id}">
          <div class="cn-head"><span class="small">${refLink(n.ref)}</span><small class="muted">${esc(N.fmtDate(n.updated, { day: "numeric", month: "short" }))}</small></div>
          <p class="cn-t">${esc(n.text).replace(/\n/g, "<br>")}</p>
          <div class="cn-a"><button class="icon-btn" data-act="pin" aria-pressed="${!!n.pinned}" aria-label="${n.pinned ? t("unpin") : t("pin")}" title="${n.pinned ? t("unpin") : t("pin")}">${I("star")}</button>
            <button class="icon-btn" data-act="edit" aria-label="${t("note_edit")}" title="${t("note_edit")}">${I("pencil")}</button></div></li>`).join("")}</ul>`
        : `<div class="c-empty">${I("note")}<p><b>${t("no_notes")}</b></p><p class="small muted">${t("no_notes_d")}</p></div>`}`;
    $(".c-newnote", body).onclick = () => noteSheet({ block: blk || C.meta.pilot });
    const inp = $(".c-search input", body); let tm;
    inp.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { nb.ui.noteQ = inp.value; save(); nbNotes(body, blk); const ni = $(".c-search input", body); ni.focus(); ni.setSelectionRange(ni.value.length, ni.value.length); }, 250); };
    $$("[data-tag]", body).forEach((b) => (b.onclick = () => { nb.ui.noteQ = nb.ui.noteQ === "#" + b.dataset.tag ? "" : "#" + b.dataset.tag; save(); nbNotes(body, blk); }));
    $$(".c-notes li", body).forEach((li) => {
      const n = nb.notes.find((x) => x.id === li.dataset.id);
      $$("[data-act]", li).forEach((b) => (b.onclick = () => { if (b.dataset.act === "pin") { n.pinned = !n.pinned; save(); nbNotes(body, blk); } else noteSheet(n.ref, n); }));
    });
  }
  // Printable revision sheet for one block: key idea, rules, worked-answer patterns, my mistakes, my notes, cards.
  function nbSheet(body, bid) {
    const b = BL[bid] || BL[C.meta.pilot], nb = NB();
    const ls = lessonsOf(b.id);
    // A revision sheet, not a reprint of the lessons: each rule once (title + formula + one-line condition),
    // the top traps (round-robin over lessons so every lesson is represented), the cards on the heaviest concepts.
    const rules = ls.flatMap((l) => (l.steps || []).filter((s) => s.type === "rule"));
    const trapsBy = ls.map((l) => (l.steps || []).filter((s) => s.type === "mistakes").flatMap((s) => s.items || []));
    const traps = []; for (let k = 0; traps.length < 6 && trapsBy.some((x) => x.length > k); k++) trapsBy.forEach((x) => x[k] && traps.length < 6 && traps.push(x[k]));
    const points = ls.flatMap((l) => (l.steps || []).filter((s) => s.type === "summary").flatMap((s) => (s.points || []).slice(0, 2)));
    const myM = nb.mistakes.filter((m) => m.block === b.id && !m.resolved);
    // At most 5 on the sheet (one per pattern first, most recent first); the rest stay in the notebook.
    const myMs = (() => { const byNew = myM.slice().sort((x, y) => y.created - x.created), seen = new Set(), out = [];
      byNew.forEach((m) => { if (out.length < 5 && !seen.has(m.pattern)) { seen.add(m.pattern); out.push(m); } });
      byNew.forEach((m) => { if (out.length < 5 && !out.includes(m)) out.push(m); }); return out; })();
    const stex = (src) => tex(src, true); // fitMath (screen) and printFit (print column) break it into lines
    const myN = nb.notes.filter((x) => x.ref.block === b.id);
    const cw = (c) => (b.concepts.find((x) => x.id === c.concept) || {}).w || 0;
    const cards = ((LX()[b.id] && LX()[b.id].cards) || []).map((c, k) => ({ c, k })).sort((x, y) => cw(y.c) - cw(x.c) || x.k - y.k).slice(0, 8).map((x) => x.c);
    body.innerHTML = `<div class="c-sheet-tools"><p class="small muted">${t("sheet_d")}</p>${exlToggle("sm")}<button class="btn primary sm c-print">${I("print")}${t("print")}</button></div>
      <article class="c-rev" ${mathOn()}>
        <header><p class="eyebrow">${T("brand")}${SEP()}${fillT("unit_n", { n: num(b.unit) })}${SEP()}${t("stop")} ${stopNo(b.id)}</p><h2>${tx(b.title)}</h2><p>${tx(b.goal)}</p>
          ${b.examined ? `<p class="small muted x-exam">${t("f_weight")}: ${pct1(b.w)}${SEP()}${fillT("rank_of", { r: num(b.rank), n: num(BLOCKS.length) })}</p>` : ""}</header>
        ${rules.length ? `<section class="cr-sec"><h3>${t("sh_rules")}</h3><div class="cr-grid">${rules.map((r) => `<div class="cr-rule"><b class="cr-rt">${tx(r.title)}</b>${r.latex ? `<div class="c-disp">${tex(r.latex, true)}</div>` : `<p>${tx(r.statement)}</p>`}${r.conditions ? `<p class="cr-cond small">${tx(r.conditions)}</p>` : ""}</div>`).join("")}</div></section>` : b.key ? `<section><h3>${t("key_idea")}</h3><p>${tx(b.key)}</p></section>` : ""}
        ${points.length ? `<section><h3>${t("sh_points")}</h3><ul class="cr-cols">${points.map((p) => `<li>${tx(p)}</li>`).join("")}</ul></section>` : ""}
        ${traps.length ? `<section class="cr-sec"><h3>${t("sh_traps")}</h3><ul class="cr-traps cr-cols">${traps.map((m) => `<li><b>${tx(m.wrong)}</b> → ${tx(m.right)}${m.right_latex ? `<div class="c-disp">${stex(m.right_latex)}</div>` : ""}</li>`).join("")}</ul></section>` : ""}
        <section class="x-exam"><h3>${t("sh_patterns")}</h3><ul class="cr-cols">${b.patterns.map((p) => C.patterns[p]).filter(Boolean).sort((x, y) => y.n - x.n).map((p) => `<li>${tx(p.t)} <small class="muted">(${fillT("pat_meta", { n: num(p.n), y: p.y.map((y) => num(y)).join(LIST()) })})</small></li>`).join("")}</ul></section>
        ${myM.length ? `<section><h3>${t("sh_mymist")}</h3><ul>${myMs.map((m) => { const ex = exById(m.ex); return `<li>${ex ? tx(ex.prompt) : esc(m.ex)}${m.reason_confirmed !== false ? ` <small class="muted">— ${esc(reasonTitle(m.reason))}</small>` : ""}</li>`; }).join("")}</ul>${myM.length > myMs.length ? `<p class="small muted">${fillT("sh_more_mist", { n: num(myM.length - myMs.length) })}</p>` : ""}</section>` : ""}
        ${myN.length ? `<section><h3>${t("sh_mynotes")}</h3><ul>${myN.map((n) => `<li>${esc(n.text)}</li>`).join("")}</ul></section>` : ""}
        ${cards.length ? `<section><h3>${t("sh_cards")}</h3><dl class="cr-cards">${cards.map((c) => `<div><dt>${front(c)}</dt><dd>${backOf(c)}</dd></div>`).join("")}</dl></section>` : ""}
        <footer class="small muted">${t("sheet_foot")}</footer>
      </article>`;
    $(".c-print", body).onclick = () => window.print();
  }

  // ───────────── Router ─────────────
  // parts: ["math-sci", view?, arg?, arg2?]
  function render(parts) {
    IDX = null; closeSheet(true);
    const clean = parts.map((x) => String(x || "").split("#")[0]);
    const [sub, view = "", a = "", b2 = ""] = clean;
    if (sub !== "math-sci") return go(BASE);
    document.body.classList.add("c-route"); applyExl();
    const after = () => { if (location.hash.includes("#c-")) { const id = location.hash.split("#").pop(); const el = document.getElementById(id); el && el.scrollIntoView(); } };
    if (!view) { viewHome(); return requestAnimationFrame(after); }
    if (view === "block") return viewBlock(a);
    if (view === "lesson") return viewLesson(a, b2);
    if (view === "practice") return viewPractice(a, b2);
    if (view === "ex") return viewOneEx(a);
    if (view === "notebook") return viewNotebook(a, b2);
    go(BASE);
  }
  // Display maths that is too wide for its column:
  //   1. formulas separated by \qquad go on their own lines;
  //   2. a line that is still too wide breaks at its top-level "=" signs into an aligned chain (A = B, then = C, = D…);
  //   3. only then shrink, never below 85%; if it still overflows it scrolls, with a fade on the cut edge as the cue.
  // Split at top level (outside {…}, (…), […], \left…\right, \begin…\end):
  //   "sep"    — between statements: \qquad, \quad, ";" (the separator is dropped);
  //   "clause" — after a top-level "," or ":" (kept at the end of its line, e.g. «ق = …،» then «هـ = …:»);
  //   "="      — before each "=" (the sign starts the next line).
  function splitTop(src, at) {
    const out = []; let depth = 0, last = 0;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (c === "\\") {
        const nm = (/^\\([a-zA-Z]+|.)/.exec(src.slice(i)) || ["\\"])[0];
        if (nm === "\\left" || nm === "\\begin") depth++;
        else if (nm === "\\right" || nm === "\\end") depth--;
        else if (at === "sep" && depth === 0 && (nm === "\\qquad" || nm === "\\quad")) { out.push(src.slice(last, i)); last = i + nm.length; }
        else if (at === "clause" && depth === 0 && (nm === "\\Rightarrow" || nm === "\\implies" || nm === "\\iff") && i > last) { out.push(src.slice(last, i)); last = i; } // "⇒ …" starts the next line
        else if (at === "times" && depth === 0 && nm === "\\times" && i > last) { out.push(src.slice(last, i)); last = i; } // "× …" starts the next line
        i += nm.length - 1; continue;
      }
      if (c === "{" || c === "(" || c === "[") depth++;
      else if (c === "}" || c === ")" || c === "]") depth--;
      else if (depth === 0 && at === "sep" && c === ";") { out.push(src.slice(last, i)); last = i + 1; }
      else if (depth === 0 && at === "clause" && (c === "," || c === ":")) { out.push(src.slice(last, i + 1)); last = i + 1; }
      else if (depth === 0 && at === "=" && c === "=") { out.push(src.slice(last, i)); last = i + 1; }
    }
    out.push(src.slice(last));
    // strip spacing commands at the ends ("\ ", "\,", "\;" …) before trimming, so no dangling "\" is left
    const trim = (x) => x.replace(/^(\\[,;:! ]|\s)+|(\\[,;:! ]|\s)+$/g, "").replace(/\\$/, "").trim();
    if (at === "sep") return out.map((x) => trim(x).replace(/,$/, "").trim()).filter(Boolean);
    if (at === "clause" || at === "times") return out.map(trim).filter(Boolean);
    return out.map(trim).filter((x, k) => x || k === 0);
  }
  // mode 0: «A = B» on the first row, then «= C»…; mode 1: A alone, then «= B», «= C»…;
  // mode 2: as 1, and a term still too wide continues on the next row at its top-level "×".
  const TALL = /\\(d?t?frac|dv|lim|sum|int|sqrt)/;
  const eqChain = (src, mode = 0, maxLen = 0) => {
    const p = splitTop(src, "=");
    if (!p[0]) p.shift(); // a line that starts with "=" continues the previous formula
    const lead = p.length === splitTop(src, "=").length; // false when the line started with "="
    if (p.length < 2 && mode < 2) return null;
    let rows = !lead ? p.map((x) => `&= ${x}`) : p.length === 2 || mode > 0 ? [`&${p[0]}`, ...p.slice(1).map((x) => `&= ${x}`)] : [`${p[0]} &= ${p[1]}`, ...p.slice(2).map((x) => `&= ${x}`)];
    // mode 2: greedy — keep "×" factors together on a line while its source stays within maxLen characters.
    if (mode === 2) rows = rows.flatMap((r) => {
      if (r.length <= maxLen) return [r];
      const parts = splitTop(r, "times"); if (parts.length < 2) return [r];
      const lines = [parts[0]];
      parts.slice(1).forEach((x) => { const k = lines.length - 1; if ((lines[k] + x).length <= maxLen) lines[k] += " " + x; else lines.push(x); });
      return lines.map((x, k) => (k ? `&\\quad ${x}` : x));
    });
    if (rows.length < 2) return null;
    // Arabic glyphs are taller than KaTeX's metrics, so rows with fractions or limits get a strut (no "\\[2pt]":
    // armath would turn the digit into an Arabic numeral).
    rows = rows.map((r) => (TALL.test(r) ? `${r}\\vphantom{\\Bigg(}` : r));
    return `\\begin{aligned}${rows.join("\\\\")}\\end{aligned}`;
  };
  const rowWidth = (row) => { const k = row.querySelector(".katex-html") || row.querySelector(".katex"); return Math.max(k ? k.getBoundingClientRect().width : 0, row.scrollWidth > row.clientWidth ? row.scrollWidth : 0); };
  // forceW: fit against a given width (the printed column) instead of the element's current width.
  function fitOne(el, forceW) {
    if (!el.isConnected) return;
    if (forceW) { el.style.width = forceW + "px"; el.style.maxWidth = "none"; }
    const W = forceW || el.clientWidth; if (!W || (!forceW && el._fitW === W)) return;
    el._fitW = forceW ? "print" : W;
    let dm = $(".c-dm", el); if (dm && !dm.dataset.tex) dm = null; // only maths with a source can be re-broken
    el.style.fontSize = ""; el.classList.remove("is-scroll", "is-split");
    if (dm && dm._split) { dm.innerHTML = texRaw(dm.dataset.tex, true); dm._split = false; }
    let over = el.scrollWidth / W;
    if (dm && over > 1.1 && window.katex) {
      const src = dm.dataset.tex, rowHtml = (p) => `<span class="c-dm-row" data-tex="${esc(p)}">${texRaw(p, true)}</span>`;
      dm.innerHTML = splitTop(src, "sep").map(rowHtml).join("") || rowHtml(src);
      dm._split = true; el.classList.add("is-split");
      $$(".c-dm-row", dm).forEach((row) => { // a statement still too wide: break it into clauses
        if (rowWidth(row) <= W) return;
        const cl = splitTop(row.dataset.tex, "clause"); if (cl.length > 1) row.outerHTML = cl.map(rowHtml).join("");
      });
      $$(".c-dm-row", dm).forEach((row) => {
        for (let mode = 0; mode < 2 && rowWidth(row) > W; mode++) { const ch = eqChain(row.dataset.tex, mode); if (ch) row.innerHTML = texRaw(ch, true); }
        // still too wide: continue long terms at "×", as few extra lines as fit
        const src = row.dataset.tex;
        for (let len = Math.floor(src.length * 0.8); len >= 12 && rowWidth(row) > W; len = Math.floor(len * 0.82)) { const ch = eqChain(src, 2, len); if (ch) row.innerHTML = texRaw(ch, true); }
      });
      over = Math.max(1, ...$$(".c-dm-row", dm).map((r) => rowWidth(r) / W));
    }
    if (over > 1.01) el.style.fontSize = Math.max(85, Math.floor(100 / over)) + "%";
    if (forceW) { el.style.width = el.style.maxWidth = ""; return over; }
    if (el.scrollWidth > el.clientWidth + 2) {
      el.classList.add("is-scroll");
      if (isAr()) el.scrollLeft = el.scrollWidth;
      fadeEdges(el);
      if (!el._fadeOn) { el._fadeOn = true; el.addEventListener("scroll", () => fadeEdges(el), { passive: true }); }
    }
  }
  function fadeEdges(el) {
    const l = el.scrollLeft > 2, r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    el.style.setProperty("--fl", l ? "28px" : "0px"); el.style.setProperty("--fr", r ? "28px" : "0px");
  }
  // One bad formula must never stop the others from being fitted.
  const safeFit = (el, w) => { try { return fitOne(el, w); } catch (e) { if (w) el.style.width = el.style.maxWidth = ""; return 1; } };
  let printing = false;
  function fitMath(root = document) { if (printing) return; $$(".c-disp", root).forEach((el) => safeFit(el)); }
  let fitQ = false;
  new MutationObserver(() => { if (fitQ) return; fitQ = true; requestAnimationFrame(() => { fitQ = false; if (document.body.classList.contains("c-route")) fitMath(); }); }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", () => document.body.classList.contains("c-route") && fitMath());
  document.addEventListener("toggle", (e) => document.body.classList.contains("c-route") && e.target.querySelectorAll && fitMath(e.target), true); // <details> opened
  const refit = () => { printing = false; $$(".c-rev .cr-rule.pr-wide").forEach((r) => r.classList.remove("pr-wide")); $$(".c-disp").forEach((e) => (e._fitW = 0)); document.body.classList.contains("c-route") && fitMath(); };
  document.fonts?.ready.then(refit);
  // Print: the revision sheet is refitted to the PRINTED column (A4 minus the 12 mm @page margins), not to the
  // screen it was opened on — a phone print would otherwise carry the phone's one-term-per-line breaks.
  // A rule wider than half the page takes the full width (.pr-wide) instead of being chopped.
  function printFit() {
    const rev = $(".c-rev"); if (!rev || printing) return;
    printing = true;
    const pr = document.createElement("div"); pr.style.cssText = "position:absolute;visibility:hidden;width:186mm;height:0"; document.body.append(pr);
    const Wp = pr.getBoundingClientRect().width || 700; pr.remove();
    const half = (Wp - 8) / 2 - 24, col = (Wp - 30) / 2 - 22, full = Wp - 24;
    $$(".c-disp", rev).forEach((el) => {
      const rule = el.closest(".cr-rule"), inCol = el.closest(".cr-cols, .cr-cards");
      // a rule that cannot fit half the page even after line breaks (it would shrink or clip) takes the full width
      const over = safeFit(el, rule ? half : inCol ? col : full);
      if (rule && over > 1.01) { rule.classList.add("pr-wide"); safeFit(el, full - 20); }
    });
  }
  window.addEventListener("beforeprint", printFit);
  window.addEventListener("afterprint", refit);
  try { matchMedia("print").addEventListener("change", (e) => (e.matches ? printFit() : refit())); } catch (_) {}
  window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#/course")) { document.body.classList.remove("c-route"); document.documentElement.removeAttribute("data-exl"); closeSheet(true); } });
  window.NajihCourse = { render, nextStep, blockScore };
})();
