// Annotated reader content (Najih-authored). Anchors: <span class="an" data-n="id">…</span>; notes keyed by id.
// kind: highlight | underline | circle | box. Notes render in the margin in a handwritten style.
window.BOOKS = {
  calc: {
    subject: "math",
    title: { ar: "الوحدة الأولى: المشتقة", en: "Unit 1: The derivative" },
    pages: [
      {
        ar: `<h2>١-١ معدّل التغيّر والمشتقة</h2>
<p>إذا تحرّكنا على منحنى الاقتران $f$ من النقطة $x$ إلى النقطة $x+h$، فإن <span class="an" data-n="n1">متوسط معدّل التغيّر</span> هو:</p>
$$\\frac{f(x+h) - f(x)}{h}$$
<p>وهو ميل <b>القاطع</b> الذي يصل بين النقطتين. عندما نجعل <span class="an" data-n="n2">$h \\to 0$</span> يقترب القاطع من <b>المماس</b>.</p>
<div class="def"><span class="an" data-n="n3"><b>تعريف.</b> مشتقة الاقتران $f$ عند $x$ هي
$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$
بشرط أن تكون النهاية موجودة.</span></div>
<p>نكتب المشتقة بعدة رموز: <span class="an" data-n="n4">$f'(x)$ ، $y'$ ، $\\dfrac{dy}{dx}$</span>.</p>
<h3>مثال ١</h3>
<p>جد مشتقة $f(x) = x^2$ باستخدام التعريف.</p>
<p><span class="an" data-n="n5">$f(x+h) = (x+h)^2 = x^2 + 2xh + h^2$</span></p>
$$f'(x) = \\lim_{h\\to0}\\frac{2xh + h^2}{h} = \\lim_{h\\to0}(2x + h) = 2x$$`,
        en: `<h2>1.1 Rate of change and the derivative</h2>
<p>Moving along the graph of $f$ from $x$ to $x+h$, the <span class="an" data-n="n1">average rate of change</span> is:</p>
$$\\frac{f(x+h) - f(x)}{h}$$
<p>This is the slope of the <b>secant</b> joining the two points. As we let <span class="an" data-n="n2">$h \\to 0$</span>, the secant approaches the <b>tangent</b>.</p>
<div class="def"><span class="an" data-n="n3"><b>Definition.</b> The derivative of $f$ at $x$ is
$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$
provided the limit exists.</span></div>
<p>We write the derivative in several ways: <span class="an" data-n="n4">$f'(x)$, $y'$, $\\dfrac{dy}{dx}$</span>.</p>
<h3>Example 1</h3>
<p>Find the derivative of $f(x) = x^2$ using the definition.</p>
<p><span class="an" data-n="n5">$f(x+h) = (x+h)^2 = x^2 + 2xh + h^2$</span></p>
$$f'(x) = \\lim_{h\\to0}\\frac{2xh + h^2}{h} = \\lim_{h\\to0}(2x + h) = 2x$$`,
        notes: {
          n1: { kind: "highlight", ar: "متوسط = بين نقطتين. اللحظي = عند نقطة واحدة.", en: "Average = between two points. Instantaneous = at one point." },
          n2: { kind: "underline", ar: "h تقترب من الصفر ولا تساويه، لذلك نحتاج النهاية.", en: "h gets close to 0 but never equals it — that's why we need a limit." },
          n3: { kind: "box", ar: "احفظ هذه الصيغة: تحتاجها كلما طُلب الحل «باستخدام التعريف».", en: "Know this by heart: you need it whenever a question says “using the definition”." },
          n4: { kind: "circle", ar: "ثلاثة رموز لشيء واحد!", en: "Three symbols, one idea!" },
          n5: { kind: "highlight", ar: "خطأ شائع: نسيان الحدّ الأوسط 2xh.", en: "Common slip: forgetting the middle term 2xh." },
        },
      },
      {
        ar: `<h2>١-٢ قواعد الاشتقاق</h2>
<p>حساب المشتقة من التعريف في كل مرة طويل، لذلك نستخدم القواعد التالية:</p>
<table class="rules">
<tr><td>الثابت</td><td><span class="an" data-n="r1">$\\dfrac{d}{dx}(c) = 0$</span></td></tr>
<tr><td>القوة</td><td><span class="an" data-n="r2">$\\dfrac{d}{dx}(x^n) = n\\,x^{n-1}$</span></td></tr>
<tr><td>الضرب في ثابت</td><td>$\\dfrac{d}{dx}\\big(c\\,f(x)\\big) = c\\,f'(x)$</td></tr>
<tr><td>المجموع</td><td>$\\dfrac{d}{dx}\\big(f + g\\big) = f' + g'$</td></tr>
</table>
<h3>مثال ٢</h3>
<p>جد $\\dfrac{dy}{dx}$ إذا كان $y = 5x^4 - 3x^2 + 8$.</p>
$$\\frac{dy}{dx} = 20x^3 - 6x + \\underbrace{0}_{\\text{ثابت}}$$
<h3>مثال ٣</h3>
<p>جد مشتقة <span class="an" data-n="r3">$f(x) = \\sqrt{x}$</span>.</p>
$$f(x) = x^{1/2} \\;\\Rightarrow\\; f'(x) = \\tfrac{1}{2}x^{-1/2} = \\frac{1}{2\\sqrt{x}}$$`,
        en: `<h2>1.2 Rules of differentiation</h2>
<p>Using the definition every time is slow, so we use these rules:</p>
<table class="rules">
<tr><td>Constant</td><td><span class="an" data-n="r1">$\\dfrac{d}{dx}(c) = 0$</span></td></tr>
<tr><td>Power</td><td><span class="an" data-n="r2">$\\dfrac{d}{dx}(x^n) = n\\,x^{n-1}$</span></td></tr>
<tr><td>Constant multiple</td><td>$\\dfrac{d}{dx}\\big(c\\,f(x)\\big) = c\\,f'(x)$</td></tr>
<tr><td>Sum</td><td>$\\dfrac{d}{dx}\\big(f + g\\big) = f' + g'$</td></tr>
</table>
<h3>Example 2</h3>
<p>Find $\\dfrac{dy}{dx}$ if $y = 5x^4 - 3x^2 + 8$.</p>
$$\\frac{dy}{dx} = 20x^3 - 6x + \\underbrace{0}_{\\text{constant}}$$
<h3>Example 3</h3>
<p>Differentiate <span class="an" data-n="r3">$f(x) = \\sqrt{x}$</span>.</p>
$$f(x) = x^{1/2} \\;\\Rightarrow\\; f'(x) = \\tfrac{1}{2}x^{-1/2} = \\frac{1}{2\\sqrt{x}}$$`,
        notes: {
          r1: { kind: "circle", ar: "الثابت يختفي دائماً.", en: "Constants always vanish." },
          r2: { kind: "box", ar: "أهم قاعدة في الوحدة — تعمل لأي أُس، حتى الكسور والسالب.", en: "The most important rule in the unit — works for any power, even fractions and negatives." },
          r3: { kind: "underline", ar: "حوّل الجذر إلى أُس أولاً!", en: "Rewrite the root as a power first!" },
        },
      },
      {
        ar: `<h2>١-٣ معادلة المماس</h2>
<p>ميل المماس لمنحنى $y = f(x)$ عند النقطة $(x_1, y_1)$ هو $m = f'(x_1)$، ومعادلته:</p>
<div class="def"><span class="an" data-n="t1">$$y - y_1 = m\\,(x - x_1)$$</span></div>
<h3>مثال ٤</h3>
<p>جد معادلة المماس لمنحنى $y = x^2$ عند $x = 3$.</p>
<ol>
<li><span class="an" data-n="t2">النقطة: $y_1 = 3^2 = 9$، إذن $(3, 9)$.</span></li>
<li>الميل: $y' = 2x \\Rightarrow m = 6$.</li>
<li>المعادلة: $y - 9 = 6(x - 3) \\Rightarrow$ <span class="an" data-n="t3">$y = 6x - 9$</span>.</li>
</ol>`,
        en: `<h2>1.3 The equation of a tangent</h2>
<p>The slope of the tangent to $y = f(x)$ at $(x_1, y_1)$ is $m = f'(x_1)$, and its equation is:</p>
<div class="def"><span class="an" data-n="t1">$$y - y_1 = m\\,(x - x_1)$$</span></div>
<h3>Example 4</h3>
<p>Find the equation of the tangent to $y = x^2$ at $x = 3$.</p>
<ol>
<li><span class="an" data-n="t2">Point: $y_1 = 3^2 = 9$, so $(3, 9)$.</span></li>
<li>Slope: $y' = 2x \\Rightarrow m = 6$.</li>
<li>Equation: $y - 9 = 6(x - 3) \\Rightarrow$ <span class="an" data-n="t3">$y = 6x - 9$</span>.</li>
</ol>`,
        notes: {
          t1: { kind: "box", ar: "صيغة النقطة والميل — سؤال متكرر جداً.", en: "Point–slope form — a very common question type." },
          t2: { kind: "highlight", ar: "لا تنسَ إيجاد y₁ من الاقتران نفسه، لا من المشتقة.", en: "Find y₁ from the function itself — not from the derivative." },
          t3: { kind: "circle", ar: "تحقق: عوّض x = 3 ← y = 9 ✓", en: "Check: x = 3 gives y = 9 ✓" },
        },
      },
    ],
  },
};
