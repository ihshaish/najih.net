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
- `assets/js/data.js` — branches, subjects, questions, lessons, exam list. Every string is `{ar, en}`.
- Branch→subject mapping is a starting point: verify it against the current MoE structure (moe.edu.ps).
- Past exams: drop PDFs into `exams/` and set `paper` / `solution` URLs in the `EXAMS` list (check copyright/permission).

## Roadmap (after MVP)
1. **Accounts & sync** — phone-number OTP login (WhatsApp/SMS), progress stored server-side (Supabase/Firebase).
2. **WhatsApp Business Cloud API** (Meta) — opt-in, daily reminders from approved templates, weekly parent reports, quizzes in chat.
3. **Content pipeline** — CMS for teachers, full curriculum coverage per branch, worked solutions to ministry exams, diagnostic tests.
4. **Tutor marketplace** — profiles, availability, booking, video sessions, ratings; local payment options.
5. **Analytics & AI** — item-level difficulty calibration, AI step-by-step tutor/explanations in Arabic, predicted average.
6. **Offline-first PWA** — low-bandwidth mode for Gaza and areas with poor connectivity.
