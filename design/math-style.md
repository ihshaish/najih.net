# Maths style and notation (decision)

## Visual style: option E, naskh plus forest colour
Seven options were compared in light and dark mode at phone and desktop widths: current, colour only, tint chip, naskh, naskh plus colour, naskh plus colour plus chip, and Amiri plus colour.

Chosen:
- **Arabic letters inside maths** use `Noto Naskh Arabic` (weight 500). Its glyphs are close to the book's naskh face. Prose stays in IBM Plex Sans Arabic, so maths is recognisable by its shape alone.
- **All maths is coloured** forest `#0B5D3B` in light mode and mint-green `#7BDCA3` in dark mode. Both meet WCAG AA on their backgrounds.
- **Inline maths size** is about 1.12em of the surrounding text.
- **Display (block) formulas** get a 3px green rail on the inline-start edge.
- **No tinted chips.** They made paragraphs noisy.

Rejected:
- Colour alone: clear, but the letters still look like prose.
- Chips: busy, and they conflict with the "never overwhelming" goal.
- Amiri: elegant, but its digits are small and its line height uneven next to Plex.

## Notation follows the book, then the papers
Notes from the book capture (`content/math-sci/book/u*.json`, `notation_notes`) and the paper scans:
- **Leibniz notation.**
  - The book prints dal: `دص/دس`, `∫ق(س) دس`.
  - The papers print a hooked glyph that looks like ء (`ءص/ءس`).
  - Najih keeps **ء**, following the papers (an earlier owner decision). This is open for the owner to switch to the book's د; it is a one-line change in `MACROS_AR`.
- **Prime notation.**
  - Book and papers both put a short stroke above the letter: **قَ(س)** for the first derivative, **قً(س)** for the second, and **ق^(٣)(س)** from the third up.
  - **Done in armath:** a letter followed by `'` renders as letter + fatha, and `''` as letter + tanween fath. A prime after a bracket, as in (ق∘هـ)′, still shows as ′.
- **Negative numbers.** The book prints a raised minus (⁻١) and the papers print the minus to the left of the digit. Keep the RTL minus and make sure there is no wide gap after "=".
- **Intervals.** Use French brackets ]أ ، ب[ (open) and [أ ، ب] (closed), mirrored for RTL.
- **Letters armath is missing.** Add mappings for these:
  - acceleration ت(ن)
  - matrix indices ي (row) and هـ (column)
  - identity matrix م (with its order as a subscript) and zero matrix و
  - the variables column matrix ك
  - a second antiderivative
- **Prose rule.** Maths always goes through armath, never as hand-typed Arabic letters in prose, so the style and notation stay consistent.
