// Najih maths renderer.
// One LaTeX source per formula; rendered either in Latin notation (English UI, physics, chemistry)
// or in the Arabic notation used by Palestinian maths textbooks and Tawjihi papers:
//   x→س  y→ص  f→ق  g,h→هـ  e→هـ  sin→جا  cos→جتا  tan→ظا  sec→قا  csc→قتا  cot→ظتا  ln→لـو_هـ  lim→نهـا
//   dx→ءس  ℝ→ح  digits→٠١٢…  ","→"،"  and the whole formula laid out right-to-left
// RTL layout is done by "double mirroring": the KaTeX box is mirrored, then every letter/number is
// mirrored back, so structure (exponents, radicals, arrows, brackets, inequalities) reads right-to-left
// while glyphs stay upright — matching the printed Ministry papers.
(() => {
  const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  const LETTERS = { x: "س", y: "ص", z: "ع", f: "ق", g: "هـ", h: "هـ", n: "ن", m: "م", a: "أ", b: "ب", c: "جـ", C: "جـ", k: "ك",
    t: "ن", s: "ف", v: "ع", u: "ع", r: "ر", L: "ل", A: "أ", B: "ب", P: "أ", Q: "ب", M: "م", N: "ن" };
  const CMDS = {
    "\\sin": "\\mathop{\\text{جا}}\\nolimits ", "\\cos": "\\mathop{\\text{جتا}}\\nolimits ", "\\tan": "\\mathop{\\text{ظا}}\\nolimits ",
    "\\sec": "\\mathop{\\text{قا}}\\nolimits ", "\\csc": "\\mathop{\\text{قتا}}\\nolimits ", "\\cot": "\\mathop{\\text{ظتا}}\\nolimits ",
    "\\ln": "\\mathop{\\text{لـو}_{\\text{هـ}}}\\nolimits ", "\\log": "\\mathop{\\text{لـو}}\\nolimits ", "\\lim": "\\mathop{\\text{نهـا}}\\limits ",
    "\\E": "\\text{هـ}",
  };
  const VERBATIM = new Set(["\\text", "\\mathrm", "\\operatorname", "\\textbf", "\\mathbf", "\\textit", "\\mathbb", "\\color", "\\begin", "\\end"]);
  const BB = { R: "ح", Z: "ص", N: "ط", Q: "ن", C: "ك" };
  const MACROS_LATIN = { "\\dv": "\\frac{d #1}{d #2}", "\\dd": "d#1", "\\E": "e" };
  const MACROS_AR = { "\\dv": "\\frac{\\text{ء}#1}{\\text{ء}#2}", "\\dd": "\\text{ء}#1" };

  const arDigits = (s) => s.replace(/[0-9]/g, (d) => AR_DIGITS[d]).replace(".", "٫");
  function group(tex, i) { // returns {text, end} of the {...} group starting at i (skipping spaces)
    while (tex[i] === " ") i++;
    if (tex[i] !== "{") return { text: "", end: i };
    let depth = 0, j = i;
    for (; j < tex.length; j++) { if (tex[j] === "{") depth++; else if (tex[j] === "}" && --depth === 0) break; }
    return { text: tex.slice(i, j + 1), end: j + 1 };
  }
  function toArabic(tex) {
    let out = "", i = 0;
    while (i < tex.length) {
      const c = tex[i];
      if (c === "\\") {
        const m = /^\\([a-zA-Z]+|.)/.exec(tex.slice(i)); const name = m[0];
        if (name === "\\mathbb") { const g = group(tex, i + name.length); const k = g.text.replace(/[{}\s]/g, ""); out += BB[k] ? `\\text{${BB[k]}}` : name + g.text; i = g.end; continue; }
        if (VERBATIM.has(name)) { const g = group(tex, i + name.length); out += name + g.text; i = g.end; continue; }
        if (CMDS[name]) { out += CMDS[name]; i += name.length; continue; }
        out += name; i += name.length; continue;
      }
      if (/[0-9]/.test(c)) { const m = /^[0-9]+(\.[0-9]+)?/.exec(tex.slice(i)); out += `{\\text{${arDigits(m[0])}}}`; i += m[0].length; continue; }
      if (/[a-zA-Z]/.test(c)) { out += LETTERS[c] ? `{\\text{${LETTERS[c]}}}` : c; i++; continue; }
      if (c === ",") { out += "{\\text{،}}"; i++; continue; }
      out += c; i++;
    }
    return out;
  }
  // glyphs that must stay mirrored (they have a direction)
  const MIRROR_KEEP = /^[\s()\[\]{}<>≤≥≮≯∈∉∋→←⟶⟵⇒⇐⇔∫∑√|⟨⟩′″‴'^]+$/;
  function unflip(root) {
    root.querySelectorAll(".katex-html *").forEach((el) => {
      for (const n of el.childNodes) {
        if (n.nodeType === 3 && n.data.trim() && !MIRROR_KEEP.test(n.data)) { el.classList.add("uf"); break; }
      }
    });
  }
  function render(tex, { display = false, ar = false } = {}) {
    if (!window.katex) return tex;
    const src = ar ? toArabic(tex) : tex;
    const html = window.katex.renderToString(src, { displayMode: display, throwOnError: false, strict: false, macros: { ...(ar ? MACROS_AR : MACROS_LATIN) } });
    if (!ar) return html;
    const box = document.createElement("span"); box.innerHTML = html;
    box.querySelectorAll(".katex").forEach((k) => k.classList.add("ar"));
    unflip(box);
    return box.innerHTML;
  }
  // Render every $…$ / $$…$$ in text nodes under root. Arabic notation applies inside [data-math="ar"].
  const SKIP = "script, style, textarea, input, .katex, .no-math";
  function renderIn(root) {
    if (!root || !window.katex) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.data.includes("$") && !n.parentElement.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    const nodes = []; let n; while ((n = walker.nextNode())) nodes.push(n);
    for (const node of nodes) {
      const ar = !!node.parentElement.closest('[data-math="ar"]');
      const parts = node.data.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
      if (parts.length < 2) continue;
      const frag = document.createDocumentFragment();
      for (const p of parts) {
        if (!p) continue;
        if (p.startsWith("$$") && p.endsWith("$$") && p.length > 4) { const s = document.createElement("span"); s.innerHTML = render(p.slice(2, -2), { display: true, ar }); frag.append(...s.childNodes); }
        else if (p.startsWith("$") && p.endsWith("$") && p.length > 2) { const s = document.createElement("span"); s.innerHTML = render(p.slice(1, -1), { ar }); frag.append(...s.childNodes); }
        else frag.append(p);
      }
      node.replaceWith(frag);
    }
  }
  window.NajihMath = { render, renderIn, toArabic };
})();
