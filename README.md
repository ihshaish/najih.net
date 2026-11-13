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
