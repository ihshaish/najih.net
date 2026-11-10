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
| Past-exam archive (branch → subject → year) | ✅ scaffold — add PDFs |
| Subscribe via WhatsApp / Messenger / phone form | ✅ click-to-chat + optional form endpoint |
| Tutors | ✅ waitlist via WhatsApp |

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
- `assets/js/solutions.js` — Najih worked solutions (unofficial), keyed by paper id. Only add items whose wording is certain.
- `assets/js/armath.js` — maths renderer: one LaTeX source, rendered in Latin notation (English UI, physics, chemistry) or Palestinian Arabic notation (س، ص، ق(س)، نهـا، جا، لـو، ءس، digits ٠–٩, right-to-left layout) for maths in the Arabic UI. Use `\dv{y}{x}`, `\dd{x}`, `\E` for derivatives, differentials and Euler's e.
- `assets/js/explainers.js` — animated explainers (SVG, seekable, chapters, captions, narration); plot / side panel / caption band never overlap.
- `assets/js/books.js` — annotated textbook pages with margin notes; `assets/js/data.js` — lessons and practice questions.

## Design principles
- Calm, editorial UI: warm paper background, deep ink, a single olive accent; a subtle tatreez (cross-stitch) motif is the only ornament.
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
