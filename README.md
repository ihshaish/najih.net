# Najih · ناجح — Tawjihi learning MVP

Personalised, bilingual (Arabic RTL / English) learning for Palestinian Tawjihi students.
Static site — no build step, no server — so it runs on GitHub Pages at `najih.net` for free.

## What's in the MVP
| Area | Status |
|---|---|
| Landing page, 6 branch groups, subjects | ✅ |
| Onboarding → personalised daily plan (weak subjects, target average, minutes/day, exam countdown) | ✅ |
| Interactive lessons: explore → predict → rule → worked example → check (derivatives, Ohm's law, passive voice, pH) | ✅ |
| Practice with hints, 2 attempts, explanations, Arabic-Indic digit input | ✅ |
| Mastery per skill + spaced review, XP, streaks | ✅ (stored in the browser) |
| Past-exam archive (branch → subject → year × session) with an image-based paper viewer and grouped Najih solutions | ✅ 232 papers (Scientific + Literary) |
| Subscribe: one form (name, phone, branch) with WhatsApp / Messenger links underneath | ✅ click-to-chat + optional form endpoint |
| Tutor sessions (roadmap item 02, reached from the home roadmap card) | ✅ register interest via WhatsApp |
| Scientific-maths pathway: road map, exam radar, block pages, lessons, exercises, notebook and readiness (`#/course/math-sci`) | ✅ whole-book map; pilot block B07 fully authored |

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Configure before launch
Edit `assets/js/config.js`:
- `whatsappNumber` — your WhatsApp Business number, digits only (e.g. `970599123456`).
- `facebookPage` — your Facebook page username (for `m.me` links).
- `signupEndpoint` — optional URL that accepts a JSON POST (Formspree, Google Apps Script → Google Sheet, Supabase…).

## Deploy to GitHub Pages + GoDaddy
1. Push this folder to a GitHub repo (e.g. `najih.net`), then **Settings → Pages → Deploy from branch → `main` / root**.
2. The `CNAME` file already contains `najih.net`. In **Settings → Pages → Custom domain**, enter `najih.net`.
3. In **GoDaddy → My Products → najih.net → DNS**:
   - Delete the default `A @ → Parked` record (and any "Forwarding").
   - Add 4 **A** records, host `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Add **CNAME** host `www` → `<your-github-username>.github.io`
4. Wait for DNS (minutes to a few hours), verify with `dig najih.net +short`, then tick **Enforce HTTPS**.
5. Recommended: verify the domain under GitHub **Settings → Pages → Verified domains** to prevent takeover.

## Content
- `assets/js/curriculum.js` — **generated** curriculum map (branch → subject → official textbook → units → lessons with printed page numbers), from the Ministry's Grade-12 textbooks on https://elearn.edu.ps. Rebuild: `python3 -I tools/build_curriculum.py` (source: `tools/curriculum_source.json`).
- `exams/` + `assets/js/exams.js` — **generated** library of official Tawjihi papers (2022–2025, Scientific + Literary; 232 PDFs), extracted from the Ministry's archives and hosted with credit. Rebuild: `python3 -I tools/fetch_exams.py CACHE scientific,literary` then `python3 -I tools/build_exams.py CACHE scientific,literary`. Add branches by listing them in both commands.
- `exams/<year>/<branch>/<paper>/p<N>.webp` — **generated** page images of every paper (1300 px wide WebP, ≤ 120 KB each: lossless small-palette encoding, stepping the palette down on dense pages before any lossy fallback). PDF.js renders the papers' embedded Arabic fonts with broken glyphs and spacing, so the viewer shows these poppler-rendered pages instead and keeps the PDF as the download. Rebuild: `python3 -I tools/render_exam_pages.py` (needs poppler's `pdftoppm`/`pdfinfo` and Pillow; idempotent, parallel; `--force` re-renders, `--only <path-substring>` limits to some papers). It also writes each paper's `pages`, `img` (image folder) and `ratio` (page height ÷ width) into `assets/js/exams.js`; `build_exams.py` does the same on a full rebuild.
- Exam library and viewer (`views.exams`, `views.paper` in `assets/js/app.js`): the library is branch → subject → a year × session grid, with the state in the URL (`#/exams/<branch>/<subject>`). The viewer shows the page images (lazy-loaded, with `width`/`height` so nothing jumps). Zoom is one CSS variable (`--z`), so changing it never re-renders the pages. The toolbar has zoom and fit-to-width, a page indicator, the original PDF download and an answers toggle. Najih solutions are grouped by question with collapsible items. They sit in a side panel at 1100 px and wider, and in a bottom sheet below that. There is no PDF.js.
- `assets/js/solutions.js` — Najih worked solutions (unofficial), keyed by paper id. Only add items whose wording is certain.
- Scientific-maths pathway (`content/math-sci/`): `book/u<N>.json` and `exams/<paper-id>.json` are verified captures of the textbook and of the 20 papers (2022–2025). `python3 -I tools/analyse_math_sci.py` writes `analysis.json`: mark shares per unit, lesson, concept and recurring question pattern (overall, by year, session and paper), weighted for the choice rules (optional questions count by the fraction answered), plus formats, skills, always-tested concepts and trends, with sanity checks that every share set sums to 100%. `python3 -I tools/build_course_math_sci.py` then writes `blueprint.json` (concept blocks, dependency graph, road-map route, radar axes, pilot plan, lesson/exercise/notebook schema, readiness model) and the runtime `assets/js/course-math-sci.js` (`window.COURSE_MATH_SCI`). Lessons live in `assets/js/course-math-sci-lessons.js` (`window.COURSE_MATH_SCI_LESSONS`) and follow the schema in `blueprint.json`.
- Pathway UI (`assets/js/course-ui.js`, routes `#/course/math-sci…`). `app.js` loads it, the course data and the lessons only when a course route opens; the lessons file is optional. It talks to `app.js` through `window.Najih` (state, strings, the Player). The subject home has four parts:
  - **Where do I stand?** Readiness overall and per paper, plus the single next step.
  - **The road map**, drawn as a real road. It is a custom SVG with HTML stops and labels: wide screens get rows that alternate direction with U-turns, phones get one vertical road. Forks mark blocks that can be studied in parallel. Flags mark the end of each unit, and gold flags mark the end of paper 1 and paper 2. With exam links on (see below), circle size shows a stop's exam weight (by area), each stop shows its % and a green chip marks the heaviest stops (5% or more); with them off (the default) all stops are the same size. A stop you have started gets a green arc showing the share of its lessons done; a stop you have not started but have correct answers on (through other blocks' exercises) gets a small dot instead. A pin says "you are here", the road you have travelled turns green, with a short green stub into the stop you are on even if you skipped ahead. The two shortcuts from the start (matrices, Riemann sums) are named on the start label, and each target stop gets a short dashed side road with an arrowhead and a "shortcut" tag (no long paths across the map); complex numbers sit on a dotted detour. Tapping a stop opens a preview card. The road is one Tab stop (roving tabindex on the "you are here" stop; arrow keys, Home and End move between stops), and a "List" view gives the same route as an ordered list.
  - **The radar.** Its 12 axes come from `radar.axes`. It can show share of marks or share of items, paper 1 / paper 2 alone (marks), parts or the five examined units (`radar.units*`), overlay any year, and show a table instead of the chart. It draws the real values on first paint (the accessible name and labels always carry the final values); a short grow-in plays only when it scrolls into view and motion is allowed. Tapping an axis shows its stops, concepts and recurring patterns, with links to the real questions. The two series colours were checked with the dataviz palette validator in light and dark: green `#1F9157`/`#2FA563` and blue `#4A64B8`/`#7889DF`, and the year overlay is also dashed. The "share of items" counts are generated by `build_course_math_sci.py` from `analysis.json → items` (each item's pattern belongs to one block) as `radar.axes[].freq`, `radar.freq_units` and `radar.freq_total`, so they update with the analysis.
  - Highlights, and a quiet "mock exams — coming soon" placeholder.

  **Exam links are opt-in** (brief item 7). One switch, «إظهار صلة الامتحان» / "Show exam links", saved as `course["math-sci"].ui.examLinks` in `najih:v2` (off by default), sits in the subject-home header, the block header, the revision-sheet tools and the lesson/exercise player bar. Off: no exam weights, paper/rank tiles, "in the exam" boxes, "how it's asked" pattern lists, pattern tags or past-question links in block pages, lessons, exercises or the revision sheet; only a small gold star marks concepts asked in every paper. On: they appear as collapsed `<details>` panels (`.c-xp`). Markup carries `.x-exam`, hidden by CSS unless `<html data-exl>`, so switching needs no re-render (the road re-runs its layout and stop labels). The readiness card, the radar and "what the papers tell us" are exam views and always show.

  The other course views:
  - **Block pages:** goal, key idea, study time, lessons with progress, concepts with their state, prerequisites and book pages; weight facts and exam patterns with past-question links sit in exam-link panels.
  - **Lesson player:** reuses the Player. It renders every step type in the schema, including the `chain-zoom`, `chain-layers`, `chain-table` and `chain-links` visuals driven by `visual.params`, and value tables (`table`) in examples and exercises. Worked examples reveal one step at a time; extra depth sits behind "Go deeper".
  - **Exercise engine:** MCQ and numeric answers are checked automatically. Expression answers are compared with the model answer. Short, long and proof answers are self-marked against `self_mark`. Every exercise has graduated hints and a full solution.
  - **Notebook (دفتري)** at `#/course/math-sci/notebook/<review|mistakes|notes|sheet>[/<block>]`:
    - Review: Leitner review cards (1/2/4/8/16 days). Lesson cards are added when a lesson ends, and one card per mistake.
    - Mistakes: logged automatically. Each card shows the prompt, "yours" next to "correct" on one line, a reason chip that opens the 3 + more picker, and one row of retry / resolved / note actions; a breakdown by confirmed reason sits above. The printed revision sheet lists at most five open mistakes.
    - Notes: on any block, step or exercise, with #tags, pinning and search.
    - Revision sheet: one printable sheet per block. Each rule appears once (title, formula, one-line condition), with the top 6 traps and the 8 cards on the heaviest concepts, in two columns when printed (three A4 pages for B07 from 360, 390 or 1440 px). Display maths is refitted to the printed column on `beforeprint` / `matchMedia("print")` (A4 minus the 12 mm margins), not to the screen it was opened on; a rule that cannot fit half the page takes the full width, and the screen fit returns after printing.
  - Display maths that is too wide breaks at `\qquad`, then clauses, then `=` (an aligned chain, the left side on its own row if needed), then at top-level `\times`, and only then shrinks (never below 85%) or scrolls. Rows with fractions or limits get a strut, because Arabic glyphs are taller than KaTeX's metrics.
  - New review cards are first due the next day (Leitner box 1), so a finished lesson leads to the next lesson, not to re-reviewing it.
  - Display maths that is too wide for a phone breaks into lines (statements separated by `\qquad`/`\quad`/`;`, then clauses after `,` `:` or before `⇒`, then an aligned chain at each top-level `=`), shrinks at most to 85%, and only then scrolls, with a fade on the hidden edge.
  - Wrong answers: the first miss only asks to retry; the reason picker appears after the final attempt, above the worked solution (or a self-mark below full), with three likely reasons pre-ordered and the rest behind "More reasons".
  - MCQ options are shown in a seeded shuffle (exercise id + attempt count), so the authored order never gives the key away; the stored answer keeps the source option index.
  - One attempt is stored per exercise run with its final outcome: correct on the second try counts as partial credit (like correct with hints) and resolves the mistake opened on the first try, which keeps its review card.
  - A mistake's reason stays unconfirmed until the student picks one; only confirmed reasons feed the "Why do you make mistakes?" chart.

  Everything is stored in `localStorage["najih:v2"].course["math-sci"]` (the `blueprint.json` schema, every access fails soft). Readiness follows `readiness_model`: exercise evidence weighted by recency, difficulty and coverage, with retention and a penalty for open mistakes, combined by exam weight; the next step follows the five ordered rules. The paper viewer supports page links: `#/paper/<id>/<page>`. Entry points: a card on the Scientific branch's subject list and on the maths subject page, and a quiet link on the home page.
- `assets/js/armath.js` — maths renderer: one LaTeX source, rendered in Latin notation (English UI, physics, chemistry) or Palestinian Arabic notation (س، ص، ق(س)، نهـا، جا، لـو، ءس، digits ٠–٩, right-to-left layout) for maths in the Arabic UI. Use `\dv{y}{x}`, `\dd{x}`, `\E` for derivatives, differentials and Euler's e.
- `assets/js/explainers.js` — animated explainers (SVG, seekable, chapters, captions, narration); plot / side panel / caption band never overlap. Dark navy/forest stage (curve white, secant gold, tangent green); timer and speed use Arabic-Indic digits in the Arabic UI; value rows appear only once they have a value.
- `assets/js/books.js` — annotated textbook pages. One annotation style: a mint highlight. On wide screens the numbered notes sit in the margin beside their line (stacked so they never overlap); below 960px each note becomes a small callout under its paragraph and a numbered chip sits in the page gutter (never inside a word). The "Najih notes" toggle hides all of them; `assets/js/data.js` — lessons and practice questions.

## Design principles
- Brand (see `design/BRIEF.md` and `design/brand/`): N-ribbon logo (`assets/img/logo-*.svg`; PNG app icons in `assets/img/icon-*.png`) and the palette forest `#0B5D3B`, green `#2FB56A`, mint `#DDF6E6`, gold `#F4C542` (sparing accent), navy `#1F3B5C` (text). All colours are tokens on `:root` in `assets/css/style.css`, with a dark theme (system preference or `<html data-theme="dark">`). Green `#2FB56A` is for fills and progress only; green text uses the darker `--green-ink` so it passes AA contrast.
- Deck-style components: pill buttons, 20px cards with hairline mint borders and almost no shadow, mint chips for selected states, `.eyebrow` → bold headline with one `.accent` phrase → one short `.lede`, numbered `.num-badge` squares, `.block-forest` feature blocks, `.callout-navy` callouts. Subject tiles are monochrome (mint + forest line icon).
- Think Arabic: one Arabic-first family (IBM Plex Sans Arabic 400–700), 17px / 1.8 body in Arabic, bold headings at 1.35, no letter-spacing on Arabic text (tracking is only for English `.eyebrow[lang=en]`), start-aligned paragraphs, logical CSS properties, `<bdi>` for mixed-direction strings, Arabic-Indic digits in the Arabic UI.
- Landing page tells the brand deck's story in order, using the deck's own copy (`h_*` strings in `assets/js/i18n.js`, Arabic transcribed from `design/brand/01-brand-deck.jpg` with faithful English): hero, "مش مجرد إجابات. تعلّم يفهمك.", why Najih, the 5-step learning loop with the "real learning moment" (and the one interactive demo: a wrong answer gets a hint, not the solution), the 6 pillars, the roadmap and teaching promise, a past-papers teaser, and the forest closing block. Nothing on the page autoplays.
- Responsive from 360px: grid tracks are `minmax(0, 1fr)` so content never widens the page, tap targets are at least 44px, and the bottom tab bar on phones has 4 short items.
- Learning pages have one job each: branch = pick a subject (icon, name, unit count, progress once started); subject = one primary action (the next Najih lesson) plus quiet resource links, then the textbook units (a row per lesson: play icon for Najih lessons, otherwise the book page); dashboard = greeting, one next step, two numbers (days to exam, streak), the rest of today and mastery, with edit / reminders / reset in a settings menu. Arabic counts use proper agreement (درس واحد، درسان، ٣ دروس، ١١ درساً).
- Distraction-free lesson player with a persistent action bar for feedback (Check → Continue), segmented progress, and a study coach that gives graduated hints.
- Keyboard support (1–4 to choose, Enter to check/continue, Esc to exit), visible focus states, ARIA roles, reduced-motion support, light/dark themes, RTL-first layout.
- Line icons only (assets/js/icons.js); no emoji.

## Roadmap (after MVP)
1. **Accounts & sync** — phone-number OTP login (WhatsApp/SMS), progress stored server-side (Supabase/Firebase).
2. **WhatsApp Business Cloud API** (Meta) — opt-in, daily reminders from approved templates, weekly progress, quizzes in chat.
3. **AI study coach** — Arabic-first, Socratic step-by-step help grounded in the lesson (served via a small backend so API keys stay private).
4. **Tutor marketplace + tutor tools** — tutors subscribe, get a profile and booking; their toolkit lets them assign practice to their students, see each student's mastery and weak skills, and track sessions.
5. **Content pipeline** — CMS for authors, full curriculum coverage per branch, worked solutions to ministry exams, diagnostic tests.
6. **Offline-first PWA** — low-bandwidth mode for Gaza and areas with poor connectivity.
