# B07 (chain rule): authoring notes

Data file: `assets/js/course-math-sci-lessons.js` (`window.COURSE_MATH_SCI_LESSONS.blocks.B07`).

## Sources re-read
- Book lesson 1-6, printed pp. 37–41 (PDF pp. 41–45): activity 1 (gears), introduction, the chain rule, corollary, activity 2, note, rule (e^{k(x)}, ln k(x)), examples 1–6, exercises 1-6.
- Lesson 1-7, p. 44: rational power rule and corollary (n ∈ ℝ), example 5 (previewed in L2, so later lessons can use roots).
- Lesson 1-2, p. 10: definition (1), both limit forms (used in L3 for limits that are derivatives).
- Past papers: every PastRef was checked by script against `content/math-sci/exams/*.json` (item id, page and Arabic label).

## Content
| lesson | rules | worked examples | check items | exercises |
|---|---|---|---|---|
| L1 function inside a function | composition recall, chain rule (p37) | 4 (2 from the book) | 3 | E01–E10, E54 |
| L2 outside first, then inside | general power (p39), trig of an inner angle, e/ln (p40), rational power (p44) | 4 (3 from the book) | 3 | E11–E21, E55, E60 |
| L3 unknown functions | differentiate both sides, f^n(x) vs f(x^n), limit as derivative (p10) | 4 (1 from the book) | 3 | E22–E32, E56–E58, E61 |
| L4 several links | Leibniz form, note (p39) | 4 (2 from the book) | 3 | E33–E43, E59 |
| Block review | | | | E44–E53 (5 MCQ, 3 short, 1 long, 1 proof) |

There are 14 review cards (C01–C14). Every MCQ distractor comes from a named mistake and carries a reason code.

## Conventions and additions to the schema
- Exercises have `set: "lesson" | "review"`. Review items have `lesson: null`.
- Value tables are given as `table: {cols, rows}` and must be rendered as HTML. armath's mirrored layout misaligns KaTeX `array` rows in Arabic. The `TABLE*_LATEX` strings are kept only as an English fallback.
- `<` and `>` inside maths are written `\lt` and `\gt`, so strings are safe even if a renderer uses innerHTML.
- `hook.exam.weight` is the block weight (4.76%). Pattern-level detail is in the hook text.
- Interactive visuals (`chain-zoom`, `chain-table`) and SVGs (`chain-layers`, `chain-links`) are specified in `spec`, with data in `params`. `chain-zoom` gives JS expressions in `x`/`u` for the functions.

## Verification
- Each answer was worked by hand, then recomputed independently with sympy (scratch scripts `verify_answers.py`, `pre*.py`). All 61 answers match, including the check items.
- A node validator renders every LaTeX string with KaTeX in both Latin and armath-Arabic form (about 3,600 strings, no errors). It also checks: schema fields, ids, step order, 8–15 exercises per lesson, exactly 4 options with 1 correct, hint counts, marks schemes that sum to the marks, and that every PastRef exists.

## Review round 1 (content fixes)
- Letters armath cannot map were replaced: the auxiliary function F became L (ل), G in card C14 became k (ك), and w in E49 became m (م). In Arabic, only letters in armath's `LETTERS` may appear inside maths.
- Part labels (a)…(d) no longer go inside LaTeX. Multi-part answers use `answer: {ar, en}` with the labels as text.
- New items covering exam variants the block did not train before:
  - E54: piecewise outer function evaluated at its branch point (2024 s2-p1 Q4-a).
  - E55: f'' of a root composite (2025 s2-p1 Q1-a-2).
  - E56: inner equation whose solution is x = ½ (2025 s2-p1 Q1-a-1).
  - E57: root inside the unknown function (2025 s2-p1 Q5-a-2).
  - E58: M = (f − x²)², finding f'' from M'' (2022 s1-p1 q6b, 2025 s1-p1 Q5-b).
  - E59: intermediate variable given by a relation, z² = 2x + 1 (2023 s2-p1 q1-3).
  New ids continue from E54 so that saved progress keyed by id stays valid. Lesson order is set by the practice lists.
- PastRefs were re-pointed so that each link tests the same structure as its item.
- The L4 intuition now uses a chain of unit conversions instead of a relay race.
- Verification: each answer and every distractor value was worked by hand, then recomputed with sympy (scratch `fix1/verify_fix1.py`). The validator reports no errors: 59 exercises, about 3,950 LaTeX strings.

## Review round 2 (content fixes)
- PastRefs re-pointed to items with the same structure: E02 and E05 now link forward-direction items (2023 s2-p1 q1-2; E02 also 2025 s3-wb Q1-a-1). 2025 s1-p1 Q6-a-2, which runs the rule backwards, stays on E45 only. E30 dropped 2022 s1-p1 q6b (E58 carries it). E53 dropped 2022 s1-p1 q4b; E10 keeps q4b because it also compares (f∘g)' with (g∘f)'. E14, E20 and E48 (simple ln k(x)) now link 2022 s2-p1 q3a (derivative of ln M(x)) instead of 2025 s1-p1 Q5-a-2. E27 dropped 2023 s1-p1 q1-8.
- New items (ids continue from E59):
  - E60 (L2): y = ln(((x − 3)/(x + 1))²) at x = 1. The inside is −1, so ln k² = 2 ln|k| is needed. Answer −2. Distractors: "does not exist" (writing 2 ln(x − 3)), −1 (outer 2 lost), 0 (log of a quotient taken as a sum). Linked to 2025 s1-p1 Q5-a-2.
  - E61 (L3): f(2x) = (x + 2)·g(3x − 1), f(2) = 12, g'(2) = 2; find f'(2). Differentiate both sides, use x = 1, recover g(2) = 4 from the original equation. Answer 11. Distractors: 15 (f(2) used for g(2)), 22 (left factor 2 not divided), 14 (x = 2 in the factor x + 2). Linked to 2023 s1-p1 q1-8, 2025 s3-wb Q2-a-3 and 2022 s2-p1 q3c.
- The L2 rule note now says ln k² = 2 ln|k| for any k ≠ 0.
- Rule statements no longer repeat their formula inline. The formula appears once, in the display (L1-s4, L2-s3, L2-s4, L2-s5, L3-s3, L3-s4, L3-s5, L4-s3, L4-s4). L3-s5 shows both limit forms in the display, separated by \qquad so they wrap on phones.
- The L1 mistake "inner-at-x" no longer claims a fact about real exam options. It gives advice: f'(a)·g'(a) is a typical distractor.
- Block keys (tools/build_course_math_sci.py) and pattern titles (tools/analyse_math_sci.py) that held formulas are now inline $…$ LaTeX, rendered by armath like the rest of the site. arnum() leaves $…$ untouched. The h-top highlight adds a caveat when a top block's primary-lesson-only weight is below 75% of its weight (B04: 6.57% → 3.24%), and stores those weights in `primary_only`.
- Verification: E60 and E61 were worked by hand, then recomputed with sympy (scratch `fixr2/verify_r2.py`). E60 was checked three ways (direct, limit, 2A'/A). E61 was checked with three different g, each satisfying g(2) = 4 and g'(2) = 2. Every distractor value was recomputed. The validator reports no errors: 61 exercises, 4,113 LaTeX strings.

## Review round 3 (content fixes)
- Hook bodies (L1–L4 s1) are now learning-only: why the idea matters and what it unlocks. The exam sentences moved, unchanged, to `exam.text {ar,en}` next to weight, patterns and past, so they show only when exam links are on. The numbers were rechecked against analysis.json: 1-6 = 4.76% overall, 48 items; p16-inner 10 items in 8 papers, 4 of them in 2025; p16-intermediate 6 papers from 2023 to 2025, 5 of them MCQ.
- Mistake "why" lines no longer claim how real exam options are built (L2-s7 missing-inner and trig-sign, L3-s6 inner-at-x, L4-s5 intermediate-value). Each one now gives advice: the answer this slip produces is a typical distractor.
- E28 and E29 no longer link 2023 s1-p1 q7b, which asks about a squared composite. They carry a book reference instead (lesson 1-6, p. 41, exercise 8 (a) and 8 (b)). q7b stays on L3-x4, E32 and E52. The validator now accepts `past: []` only when `book` is set.
- E19 dropped 2024 s3 Q5-a-2 (a composite-derivative identity) and keeps 2024 s2-p1 Q6-a.
- New item E62 (L2, short, 6 marks): f(x) = x²(3 + cos πx)(sin(π/(2x)))³, find f'(1). It practises what 2025 s1-p1 Q6-c tests: a three-factor product, a cubed sine with a reciprocal angle (derivative −π/(2x²)), and two product-rule terms that vanish at the point (sin π = 0, cos(π/2) = 0). Answer 4. Q6-c is now linked from E62 only. E12 and E17 link 2022 s1-p1 q1-5 (derivative of cos³2x) instead. E15 keeps 2025 s2-p1 Q4-a-1.
- The ln rule display no longer repeats k(x) > 0. The condition line keeps it.
- MCQ keys are rotated in the source: the correct option sits at position (sum of the id's char codes) mod 4. The 42 option sets now have the key at positions 0/1/2/3 = 9/14/10/9. Distractor order is unchanged.
- blueprint.json has `item_blocks`: each exam item's block attribution ('<paper>#<item>' → {block: fraction}). It uses the same function as the block weights. The builder asserts that the map reproduces every block weight. The h-units highlight prints one decimal (31.2 / 19.5 / 15.5 / 16.3 / 17.5).
- Verification: E62 was worked by hand, then recomputed with sympy two ways: the symbolic derivative at 1, and a central difference (scratch `fixr3/verify_r3.py`). Q6-c was recomputed as a cross-check (−π). Validator (scratch `fixr3/validate.js`) reports no errors: 62 exercises, 4,174 LaTeX strings. It now also checks that every hook has exam.text, that no hook body holds exam statistics, book refs, and the key rotation.
