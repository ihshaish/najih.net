# Najih v5 redesign — shared brief

Every agent working on the v5 redesign reads this first. The site is a static SPA (no build step): `index.html`, `assets/css/style.css`, `assets/js/*.js` (views live in `assets/js/app.js`, UI strings in `assets/js/i18n.js`). Arabic (RTL) is the default language; English is secondary. GitHub Pages hosting.

## What the owner asked for (verbatim intent)
- Adopt the provided **logo and colour palette** — they are the brand now.
- A **responsive** interface that is modern and easy to use, see and learn from.
- Page contents are currently **noisy**: cut the clutter, give each screen one clear job.
- **PDF quality is bad**: the exam viewer renders Arabic papers with broken glyphs and spacing.
- "You don't get the text/font and alignment right — **think Arabic**."

## Brand references (in `design/brand/`)
- `01-brand-deck.jpg` — the 6-page brand deck. **This is the visual target**: white/mint pages, forest-green feature blocks, rounded 20–24px cards with hairline mint borders, numbered green rounded squares (01, 02…), small uppercase English eyebrow above a bold Arabic headline with one phrase in green, short muted body text, a navy "real learning moment" callout, a forest closing block with the logo in a white card.
- `05-logo-n-ribbon-chosen.jpg` + `logo-standalone.html` — **the chosen logo** (green ribbon N, gold path, graduation cap).
- `04-palette-sheet.jpg` — palette + icon style (line icons: Learn, Improve, Track progress, Achieve).
- `02`, `03`, `06` — other concepts, for reference only.

Built logo assets (already in the repo): `assets/img/logo-full.svg` (N mark + "Najih" wordmark), `assets/img/logo-mark.svg` (N mark only: header, favicon), `assets/img/logo-mark-white.svg` and `assets/img/logo-full-white.svg` (on forest/dark backgrounds). In Arabic UI, pair the mark with the word **ناجح** set in the UI font (bold, forest). Never stretch or recolour the mark.

## Palette (tokens on :root, plus a dark theme)
| token | hex | use |
|---|---|---|
| primary / forest | #0B5D3B | brand, primary buttons, feature blocks, headings accent |
| secondary / green | #2FB56A | highlights, progress, success, active states |
| mint | #DDF6E6 | light backgrounds, card tints, selected chips |
| gold | #F4C542 | sparing accent only (eyebrows on dark, one highlight per screen, stars) — never body text on white |
| navy | #1F3B5C | body/heading text and contrast callouts |
Derive neutrals from navy (e.g. muted text ≈ navy at 65–70%, hairlines ≈ mint/grey). Check WCAG AA contrast for all text. Remove the old olive/charcoal/tatreez look.

## Typography — think Arabic
- Use one high-quality Arabic-first family with a matching Latin, e.g. **IBM Plex Sans Arabic** (Google Fonts; weights 400/500/600/700). Arabic headlines in the deck are bold (600–700), not light.
- **Never apply letter-spacing to Arabic text** (it breaks letter joining). Uppercase + tracking is for small English eyebrows only.
- Arabic body line-height ~1.8, headings ~1.35; slightly larger base size for Arabic (≈17–18px body).
- Align to the start edge (right in RTL). Do not centre multi-line Arabic paragraphs; centring is acceptable only for short single-line hero statements.
- Use logical CSS properties (margin-inline-start, padding-inline, inset-inline) so RTL/LTR both mirror correctly; directional icons (arrows, chevrons) must flip in RTL.
- Mixed-direction strings (numbers, Latin terms, file names, "pdf") need proper isolation (`<bdi>`, `dir="auto"`, `unicode-bidi: isolate`) — no "pdf.1 الدورة" style reversals.
- Keep the established decision: maths in Arabic UI uses Palestinian notation via `assets/js/armath.js`; Arabic-Indic digits in Arabic UI.

## Content and layout rules (reduce noise)
- One job per screen. Every section: eyebrow → headline (≤ 8 words) → one short sentence → one clear action. Max 3–4 cards per row on desktop, 1 column on phones.
- Use the deck's own copy for the landing story (smart tutor, "مش مجرد إجابات. تعلّم يفهمك.", why Najih, the 5-step learning loop, 6 pillars, product roadmap, closing "لكل طالب طريقته. ولكل نجاح خطة."). Transcribe it carefully from `01-brand-deck.jpg`.
- Remove duplicated stats, badge spam, meta-text clutter and decorative noise. Long lists (exam papers, solutions) get progressive disclosure, grouping and good filters, not walls of identical rows.
- Generous whitespace, consistent 8px spacing scale, consistent radii (cards 20px, buttons pill), hairline borders, very soft shadows only.
- No emoji, nothing cartoonish. Line icons only (`assets/js/icons.js`).

## Responsive and accessibility requirements
- Widths 360–1440+ with no horizontal scroll at any width. Phone: bottom nav stays usable; tap targets ≥ 44px.
- Visible focus states, `prefers-reduced-motion`, light/dark themes, ARIA on interactive widgets, keyboard support already present must keep working.

## Exam papers (PDF quality)
PDF.js currently mangles the papers' Arabic fonts (compare `pdftoppm` output, which is correct). Fix it so every paper reads exactly like the original on phones and desktops. The preferred approach is pre-rendering each page to WebP with poppler (`pdftoppm`) + Pillow from a generator script in `tools/`, shown in a clean page viewer with zoom. Keep the original PDF as the download, and keep the Ministry credit + source link. Budget: ~929 pages total; keep each page roughly ≤ 120 KB.

## Working rules for agents
- Local server for the working tree: `http://localhost:8765` (already running; serves the repo root). The original site, for comparison, is on `http://localhost:8766`.
- QA screenshot tool: `node /private/tmp/claude-502/-Users-Hisham-github-page-najih-net/f214c930-c0de-435a-a68e-074e0bd6abf3/scratchpad/qa-tool/shot.js --base http://localhost:8765 --out <dir> [--routes "learn,exams"] [--widths 390,1440] [--langs ar,en] [--full 1]`. Run it from any directory; `<dir>` should be inside the scratchpad. It writes PNGs plus `report.json` (horizontal overflow, offending elements, console errors, failed requests, and whether the PDF rendered). **Look at the PNGs yourself with the Read tool**; the JSON does not catch ugly or misaligned layouts.
- Python: run with `python3 -I`. Use `/usr/bin/curl` if you need curl.
- Do **not** commit, push or create branches; the orchestrator does that. Do not add any Claude/AI attribution anywhere.
- Don't invent curriculum content; existing lessons, questions, solutions and exam data stay as they are (you may restructure how they are shown).
- Keep `README.md` accurate for anything you change (design principles, tools).
