# Najih Pathway — Scientific Mathematics (pilot) — shared brief

Every agent on this project reads this file first, then `design/BRIEF.md` (brand, Arabic typography, responsive rules, QA screenshot tool, working rules). Repo: `/Users/Hisham/github_page/najih.net` (static SPA, no build step; views in `assets/js/app.js`, strings in `assets/js/i18n.js`, maths rendering in `assets/js/armath.js`).

## What the owner wants (intent, in their words, condensed)
A new way to learn a subject, built from the official book and the real exams, for Scientific-branch Mathematics first:
1. **Understand the subject** — an intelligent summary of the book's roadmap and main concepts, and how they depend on each other. The roadmap must be shown **literally as a road map, in a smart way** (a visual route with stops, forks for prerequisites, the student's position and progress, exam weight visible at each stop).
2. **Where students are tested** — a modern, professional **radar chart** showing how the exams weight each part of the book, derived from analysing the book contents **and every exam paper** (not guessed).
3. **Book summary as blocks of concepts**, then **lessons for each block**. Pedagogically excellent: not skimming, digestible yet thorough, analogies and examples where they help, building block by block and step by step, matching what the exams expect.
4. **Exercises** that match exam expectations.
5. **Notes and tracking** after exercises — save notes, track them in a genuinely useful way. Think creatively from an interactive-design perspective.
6. **The overall goal (owner, added during the run):** a place where a student gets *exactly* what they need to **excel in the exam** AND **understand the concepts perfectly**. That means:
   - **The big picture is always visible**: where this concept sits in the book and the road, why it matters and how much the exam weights it.
   - **Never overwhelming**: small chunks, one next step at a time, progressive disclosure, a calm interface, clear "you are done with this" moments. Hide depth behind "more" when it isn't needed yet.
   - **"Where do I stand?" indicator**: after studying and practising, the student sees their standing per concept, block and unit, plus overall exam readiness. It is based on evidence (exercise results, mistakes and their reasons, recency and spaced review) weighted by exam importance, not on pages visited. It must clearly say what to do next ("review X", "practise pattern Y", "ready for a mock").
   - **Mock exams are the NEXT step** (not built in this run), so design for them now: the exam-pattern tags, item metadata (format, marks, skills, difficulty, lesson/concept) and readiness model must be rich and consistent enough to later generate full mock papers that mirror the real paper structure, mark weights and choice rules. Leave a visible but quiet "mock exams — coming soon" placeholder where it will live.

7. **Exam links are opt-in (owner, after seeing the first build):** relating every piece of content to exam appearances is overwhelming. Learning content (block pages, lessons, exercises, notebook) is for **learning** by default. Provide one clear, persistent toggle **"Show exam links" / «إظهار صلة الامتحان»** (off by default, saved in `najih:v2`, reachable from the course header and the lesson player). When it is off, hide the exam % weights, "in the exam" boxes, "how the exam asks" pattern lists, past-question links and paper/weight stats inside blocks and lessons. At most one tiny, quiet marker (e.g. a small star on "always tested" items) may remain. When it is on, show them, but as compact, collapsible, clearly labelled panels that never fill the page. The radar/"where students are tested" section and the "what the papers tell us" findings on the subject home are explicitly exam views and stay visible. Road-map stop weights follow the toggle.

8. **Maths notation matches the book and the exams, and maths is visually distinct from prose (owner):** every symbol, letter, function name and layout must follow how the book and the papers print it (ق(س)، ق∘هـ، نهـا، جا، ءص/ءس، Arabic-Indic digits, Arabic decimal comma ٫, RTL order). Inline maths must be clearly distinguishable from surrounding Arabic text at a glance through a consistent maths style (its own font and/or colour and/or a subtle tint). Several options were compared, and one was chosen and applied site-wide (see `design/math-style.md` once written). Never mix Latin letters into Arabic-UI maths.

Pilot scope for this run: full book + all-exam analysis, radar, roadmap and block map for the WHOLE book; **one pilot block fully authored** (all its lessons + exercises) as the reference template the owner will review before scaling.

## Sources (ground truth — never invent curriculum)
- **Book**: الرياضيات، الصف الثاني عشر، الفرع العلمي (Ministry of Education, elearn.edu.ps, `https://elearn.azureedge.net/Books/c12/12s/ma12-s.pdf`). The PDF's text layer is unusable (custom font encoding) — read the **page images**:
  `/private/tmp/claude-502/-Users-Hisham-github-page-najih-net/f214c930-c0de-435a-a68e-074e0bd6abf3/scratchpad/books/ma150/p-NNN.png` (150 dpi, NNN = PDF page, 001–252). **PDF page = printed page + 4.** If something is too small, crop/zoom with Pillow (`python3 -I`) or render that page at higher dpi with `pdftoppm -r 250 -f N -l N`.
- Table of contents (units, lessons, printed start pages): unit 1 حساب التفاضل (p2; lessons 1-1…1-7 at 4, 9, 19, 22, 30, 37, 42), unit 2 تطبيقات التفاضل (p52; 2-1…2-5 at 54, 60, 65, 75, 83), unit 3 المصفوفات والمحددات (p92; 3-1…3-5 at 94, 99, 108, 114, 120), unit 4 التكامل غير المحدود وتطبيقاته (p130; 4-1…4-4 at 132, 137, 141, 146), unit 5 التكامل المحدود وتطبيقاته (p162; 5-1…5-5 at 164, 171, 176, 181, 189), unit 6 الأعداد المركبة (p204; 6-1…6-3 at 206, 210, 215). Lesson titles are in `tools/curriculum_source.json`.
- **Exams**: 20 official Scientific maths papers 2022–2025 (sessions s1/s2 have paper p1 and p2; s3 is one paper). Page images: `exams/<year>/scientific/<paper>/pN.webp` (1300 px wide); metadata in `assets/js/exams.js` (ids like `2025-scientific-math-s1-p1`, fields `pages`, `img`). Existing verified Najih solutions: `assets/js/solutions.js`.

## Notation and language
- Arabic first, English second (every learner-facing string has ar + en).
- Maths in the Arabic UI uses Palestinian notation exactly as the book prints it (س، ص، ق(س)، نهـا، جا، جتا، ظا، لـو، هـ، ءس, Arabic-Indic digits, RTL). Author every formula once as LaTeX source following `assets/js/armath.js` conventions (`\dv{y}{x}`, `\dd{x}`, `\E`, …) so it renders in Arabic notation in ar and Latin in en. Read armath.js before writing maths; extend it (carefully, without regressions) only if the book uses notation it cannot render.
- Arabic writing: clear Modern Standard Arabic as used in the book's own explanations, warm and direct to the student; the book's terminology exactly (e.g. الاقتران، المشتقة، القيم القصوى، المصفوفة، المحدّدة).

## Open decision for the owner: derivative notation (dal or hamza)
Not decided yet. The B07 lessons are live with the current choice, so this needs a decision before more blocks are written.
- **Book**: prints dal, e.g. د ص / د س (checked on printed p. 39, the general-power corollary).
- **Exam papers**: every paper checked prints hamza, ءص / ءس (2022 s2-p2, 2023 s1-p1, 2024 s1-p1). This brief also lists ءس.
- **Current site**: hamza, through `\dv` / `\dd` in `assets/js/armath.js` (`MACROS_AR`). This matches the exams and this brief, but not the book.
- **If dal is chosen**: change the glyph in `MACROS_AR` (one place), re-run the lesson KaTeX validator, and update this section.

## Data layout (keep it inspectable and re-usable)
- `content/math-sci/book/u<N>.json` — structured capture of unit N (lessons → concepts, definitions, rules/theorems, worked-example types, exercise types, prerequisites, printed pages). Summaries in our own words + formulas; no long verbatim copying of the book.
- `content/math-sci/exams/<paper-id>.json` — every exam item: question label (e.g. السؤال الأول أ-2), page, marks, format (mcq / short / long / proof), lesson ids (e.g. "1-6"), concept ids, skills (compute / apply / interpret / prove / model), difficulty (1–3), one-line paraphrase. Marks per paper must reconcile with the paper's stated total and its choice rules (e.g. "answer five of six questions") — record those rules.
- `content/math-sci/analysis.json` + `tools/analyse_math_sci.py` (reproducible stats: marks share and frequency per unit/lesson/concept, by year and session, question formats, always-tested concepts, rising/falling topics).
- `content/math-sci/blueprint.json` — concept blocks, dependency graph, roadmap layout data, pilot block choice + lesson plan, and the **content schema** for lessons/exercises.
- Runtime data the site loads: `assets/js/course-math-sci.js` (generated or hand-authored from the above; small enough to load lazily only on course routes).

## Pedagogy bar for lessons (QA will hold you to this)
Each lesson: why it matters (hook, where it shows up in exams) → intuition first (analogy, picture, or interactive manipulation) → precise definition/rule in the book's notation → worked examples graded from easy to exam level, every step justified → common mistakes (drawn from how exams trap students) → a quick self-check → exam-style exercises with graduated hints and full solutions, linked to the real past questions that test the same thing (open the paper viewer at that page). Short paragraphs, one idea per step, no walls of text, no skipped steps, mathematically exact. Exercises: original Najih items modelled on exam patterns, plus pointers to real past questions; every answer verified.

## Interaction and design
Follow `design/BRIEF.md` (brand palette, logo, Arabic typography, no noise, responsive 360–1440, a11y, light/dark). New routes under `#/course/math-sci…` (subject home with the road map and radar, block pages, lesson player, exercises, notebook). Reuse existing patterns (lesson Player, practice feedback, mastery state in localStorage `najih:v2`) where they fit. Charts: custom SVG, crisp, accessible (text alternative/table), animated subtly, respecting reduced motion — load the `dataviz` skill before designing the radar. Notebook (دفتري): notes per concept/exercise, automatic mistake log with the reason, review cards with spaced repetition, filter by block, printable revision sheet; stored locally (no accounts yet).

## Rules
- Do not commit/push. No AI attribution anywhere. `python3 -I`; `/usr/bin/curl` if needed.
- Never invent exam questions as if they were real; past questions are referenced by paper id + label + page. Only include solutions you have verified.
- Write to your own files when working in parallel with other agents; never rewrite files another agent owns in the same phase.
