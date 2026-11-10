// Najih content model. All strings are {ar, en}. Content HTML is authored by us (trusted).
// NOTE: branch→subject mapping is a starting point; verify against the current MoE (moe.edu.ps) structure.

const t = (ar, en) => ({ ar, en });

window.SUBJECTS = {
  math:       { name: t("الرياضيات", "Mathematics"),        icon: "sigma",    color: "#4F5BD5" },
  physics:    { name: t("الفيزياء", "Physics"),              icon: "atom",     color: "#0E7C86" },
  chemistry:  { name: t("الكيمياء", "Chemistry"),            icon: "flask",    color: "#2F855A" },
  biology:    { name: t("الأحياء", "Biology"),               icon: "leaf",     color: "#5B8C3A" },
  arabic:     { name: t("اللغة العربية", "Arabic"),          icon: "feather",  color: "#9C5B2E" },
  english:    { name: t("اللغة الإنجليزية", "English"),      icon: "lang",     color: "#B4442F" },
  islamic:    { name: t("التربية الإسلامية", "Islamic Education"), icon: "book", color: "#1F6F5C" },
  history:    { name: t("التاريخ", "History"),               icon: "landmark", color: "#8A6D3B" },
  geography:  { name: t("الجغرافيا", "Geography"),           icon: "globe",    color: "#2B6CB0" },
  tech:       { name: t("التكنولوجيا", "Technology"),        icon: "monitor",  color: "#6B4FBB" },
  entre:      { name: t("ريادة الأعمال", "Entrepreneurship"), icon: "trend",   color: "#B83280" },
  vocational: { name: t("المواد المهنية", "Vocational"),     icon: "wrench",   color: "#5A6474" },
};

window.BRANCHES = [
  { id: "scientific", name: t("العلمي", "Scientific"),     subjects: ["math", "physics", "chemistry", "biology", "arabic", "english", "islamic"] },
  { id: "literary",   name: t("الأدبي", "Literary"),       subjects: ["arabic", "english", "islamic", "history", "geography"] },
  { id: "technology", name: t("التكنولوجي", "Technology"), subjects: ["math", "physics", "tech", "arabic", "english", "islamic"] },
  { id: "entre",      name: t("الريادة والأعمال", "Entrepreneurship & Business"), subjects: ["entre", "arabic", "english", "islamic"] },
  { id: "sharia",     name: t("الشرعي", "Sharia"),         subjects: ["islamic", "arabic", "english", "history"] },
  { id: "vocational", name: t("المهني (صناعي، زراعي، فندقي، اقتصاد منزلي)", "Vocational (Industrial, Agricultural, Hospitality, Home Economics)"),
    subjects: ["vocational", "math", "arabic", "english", "islamic"] },
];

// Question types: "mcq" (choices + answer index) or "num" (numeric answer, optional tolerance).
window.QUESTIONS = [
  // ── Mathematics  (math is LaTeX between $…$, rendered with KaTeX)
  { id: "m1", subject: "math", skill: "power_rule", type: "mcq",
    q: t("ما مشتقة الاقتران $f(x) = 3x^2$ ؟", "What is the derivative of $f(x) = 3x^2$?"),
    choices: [t("$6x$", "$6x$"), t("$3x$", "$3x$"), t("$6x^2$", "$6x^2$"), t("$2x$", "$2x$")], answer: 0,
    hint: t("قاعدة القوة: $\\frac{d}{dx}x^n = n\\,x^{n-1}$. أنزل الأُس واضربه بالمعامل.", "Power rule: $\\frac{d}{dx}x^n = n\\,x^{n-1}$. Bring the exponent down and multiply."),
    explain: t("$3 \\cdot 2\\,x^{2-1} = 6x$", "$3 \\cdot 2\\,x^{2-1} = 6x$") },
  { id: "m2", subject: "math", skill: "derivative_eval", type: "num", answer: 8,
    q: t("إذا كان $f(x) = x^3 - 4x + 1$، جد $f'(2)$.", "If $f(x) = x^3 - 4x + 1$, find $f'(2)$."),
    hint: t("اشتق أولاً: $f'(x) = 3x^2 - 4$، ثم عوّض $x = 2$.", "Differentiate first: $f'(x) = 3x^2 - 4$, then substitute $x = 2$."),
    explain: t("$f'(2) = 3(4) - 4 = 8$", "$f'(2) = 3(4) - 4 = 8$") },
  { id: "m3", subject: "math", skill: "power_rule", type: "mcq",
    q: t("ما مشتقة الاقتران الثابت $f(x) = 5$ ؟", "What is the derivative of the constant function $f(x) = 5$?"),
    choices: [t("$5$", "$5$"), t("$0$", "$0$"), t("$1$", "$1$"), t("$5x$", "$5x$")], answer: 1,
    hint: t("هل يتغيّر الاقتران الثابت عندما تتغيّر $x$؟", "Does a constant change when $x$ changes?"),
    explain: t("الاقتران الثابت لا يتغيّر، فميله صفر: $\\frac{d}{dx}(5) = 0$", "A constant never changes, so its slope is zero: $\\frac{d}{dx}(5) = 0$") },
  { id: "m4", subject: "math", skill: "integral_basic", type: "mcq",
    q: t("$\\displaystyle\\int 2x\\,dx = \;?$", "$\\displaystyle\\int 2x\\,dx = \;?$"),
    choices: [t("$x^2 + C$", "$x^2 + C$"), t("$2x^2 + C$", "$2x^2 + C$"), t("$2 + C$", "$2 + C$"), t("$x + C$", "$x + C$")], answer: 0,
    hint: t("التكامل عكس الاشتقاق: أي اقتران مشتقته $2x$؟", "Integration undoes differentiation: which function has derivative $2x$?"),
    explain: t("$\\frac{d}{dx}(x^2) = 2x$، لذلك $\\int 2x\\,dx = x^2 + C$", "$\\frac{d}{dx}(x^2) = 2x$, so $\\int 2x\\,dx = x^2 + C$") },
  { id: "m5", subject: "math", skill: "limits", type: "num", answer: 4,
    q: t("جد $\\displaystyle\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$", "Find $\\displaystyle\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$"),
    hint: t("حلّل البسط: $x^2 - 4 = (x - 2)(x + 2)$", "Factor the numerator: $x^2 - 4 = (x - 2)(x + 2)$"),
    explain: t("بعد الاختصار: $\\lim_{x\\to2}(x + 2) = 4$", "After cancelling: $\\lim_{x\\to2}(x + 2) = 4$") },
  { id: "m6", subject: "math", skill: "derivative_eval", type: "num", answer: 6,
    q: t("ما ميل المماس لمنحنى $y = x^2$ عند $x = 3$ ؟", "What is the slope of the tangent to $y = x^2$ at $x = 3$?"),
    hint: t("الميل = المشتقة: $y' = 2x$", "Slope = derivative: $y' = 2x$"),
    explain: t("$y'(3) = 2 \\times 3 = 6$", "$y'(3) = 2 \\times 3 = 6$") },

  // ── Physics
  { id: "p1", subject: "physics", skill: "ohm", type: "num", answer: 10,
    q: t("يمر تيار $I = 2\\,\\text{A}$ في مقاومة $R = 5\\,\\Omega$. ما فرق الجهد بين طرفيها (بالفولت)؟", "A current $I = 2\\,\\text{A}$ flows through $R = 5\\,\\Omega$. What is the voltage across it (in volts)?"),
    hint: t("قانون أوم: $V = IR$", "Ohm's law: $V = IR$"), explain: t("$V = 2 \\times 5 = 10\\,\\text{V}$", "$V = 2 \\times 5 = 10\\,\\text{V}$") },
  { id: "p2", subject: "physics", skill: "circuits", type: "num", answer: 3,
    q: t("وُصلت مقاومتان كل منهما $6\\,\\Omega$ على التوازي. ما المقاومة المكافئة (بالأوم)؟", "Two $6\\,\\Omega$ resistors are connected in parallel. What is the equivalent resistance (in Ω)?"),
    hint: t("$\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2}$", "$\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2}$"),
    explain: t("$\\frac{1}{R} = \\frac{1}{6} + \\frac{1}{6} = \\frac{1}{3} \\Rightarrow R = 3\\,\\Omega$", "$\\frac{1}{R} = \\frac{1}{6} + \\frac{1}{6} = \\frac{1}{3} \\Rightarrow R = 3\\,\\Omega$") },
  { id: "p3", subject: "physics", skill: "magnetism", type: "mcq",
    q: t("شحنة تتحرك موازية لخطوط مجال مغناطيسي منتظم. ما القوة المغناطيسية المؤثرة فيها؟", "A charge moves parallel to a uniform magnetic field. What magnetic force acts on it?"),
    choices: [t("أكبر ما يمكن", "Maximum"), t("صفر", "Zero"), t("تساوي وزنها", "Equal to its weight"), t("تعتمد على الكتلة فقط", "Depends only on mass")], answer: 1,
    hint: t("$F = qvB\\sin\\theta$. كم قيمة $\\theta$ هنا؟", "$F = qvB\\sin\\theta$. What is $\\theta$ here?"), explain: t("$\\theta = 0^\\circ$ و $\\sin 0 = 0$، إذن $F = 0$", "$\\theta = 0^\\circ$ and $\\sin 0 = 0$, so $F = 0$") },
  { id: "p4", subject: "physics", skill: "capacitance", type: "mcq",
    q: t("ما وحدة قياس السعة الكهربائية؟", "What is the SI unit of capacitance?"),
    choices: [t("الهنري", "Henry"), t("الفاراد", "Farad"), t("التسلا", "Tesla"), t("الكولوم", "Coulomb")], answer: 1,
    hint: t("سُمّيت على اسم العالم مايكل فاراداي.", "Named after Michael Faraday."), explain: t("$1\\,\\text{F} = 1\\,\\text{C}/\\text{V}$", "$1\\,\\text{F} = 1\\,\\text{C}/\\text{V}$") },

  // ── Chemistry
  { id: "c1", subject: "chemistry", skill: "ph", type: "num", answer: 2,
    q: t("ما الرقم الهيدروجيني لمحلول $\\mathrm{HCl}$ تركيزه $0.01\\,\\text{M}$؟", "What is the pH of a $0.01\\,\\text{M}$ $\\mathrm{HCl}$ solution?"),
    hint: t("$\\mathrm{HCl}$ حمض قوي يتأين كلياً، و $\\mathrm{pH} = -\\log[\\mathrm{H^+}]$", "$\\mathrm{HCl}$ is a strong acid (fully ionised), and $\\mathrm{pH} = -\\log[\\mathrm{H^+}]$"),
    explain: t("$[\\mathrm{H^+}] = 10^{-2} \\Rightarrow \\mathrm{pH} = 2$", "$[\\mathrm{H^+}] = 10^{-2} \\Rightarrow \\mathrm{pH} = 2$") },
  { id: "c2", subject: "chemistry", skill: "redox", type: "num", answer: 7,
    q: t("ما عدد تأكسد المنغنيز في $\\mathrm{KMnO_4}$؟ (اكتب الرقم فقط)", "What is the oxidation number of Mn in $\\mathrm{KMnO_4}$? (number only)"),
    hint: t("$\\mathrm{K} = +1$، $\\mathrm{O} = -2$، ومجموع أعداد التأكسد في المركب المتعادل صفر.", "$\\mathrm{K} = +1$, $\\mathrm{O} = -2$, and the total for a neutral compound is 0."),
    explain: t("$+1 + x + 4(-2) = 0 \\Rightarrow x = +7$", "$+1 + x + 4(-2) = 0 \\Rightarrow x = +7$") },
  { id: "c3", subject: "chemistry", skill: "kinetics", type: "mcq",
    q: t("كيف يزيد العامل المساعد سرعة التفاعل؟", "How does a catalyst increase reaction rate?"),
    choices: [t("يرفع درجة الحرارة", "It raises the temperature"), t("يخفض طاقة التنشيط", "It lowers the activation energy"), t("يزيد تركيز المتفاعلات", "It increases reactant concentration"), t("يغيّر قيمة $\\Delta H$", "It changes $\\Delta H$")], answer: 1,
    hint: t("يوفّر مساراً بديلاً للتفاعل.", "It provides an alternative reaction pathway."), explain: t("المسار البديل له $E_a$ أقل، ولا تتغيّر $\\Delta H$.", "The alternative path has a lower $E_a$; $\\Delta H$ is unchanged.") },

  // ── Biology
  { id: "b1", subject: "biology", skill: "genetics", type: "mcq",
    q: t("في جزيء DNA، تقترن القاعدة A (أدينين) مع:", "In DNA, adenine (A) pairs with:"),
    choices: [t("C", "C"), t("G", "G"), t("T", "T"), t("U", "U")], answer: 2,
    hint: t("U توجد في RNA فقط.", "U is only found in RNA."), explain: t("A–T و C–G", "A–T and C–G") },
  { id: "b2", subject: "biology", skill: "cells", type: "mcq",
    q: t("أين تحدث التفاعلات الضوئية في البناء الضوئي؟", "Where do the light-dependent reactions of photosynthesis occur?"),
    choices: [t("أغشية الثايلاكويد", "Thylakoid membranes"), t("الستروما", "Stroma"), t("الميتوكوندريا", "Mitochondria"), t("النواة", "Nucleus")], answer: 0,
    hint: t("تحتاج إلى صبغة الكلوروفيل الموجودة في الأغشية.", "They need chlorophyll, which sits in membranes."), explain: t("تحدث في أغشية الثايلاكويد، ودورة كالفن في الستروما.", "Thylakoid membranes; the Calvin cycle happens in the stroma.") },

  // ── English
  { id: "e1", subject: "english", skill: "passive", type: "mcq",
    q: t("Choose the passive form: “They built the school in 1990.”", "Choose the passive form: “They built the school in 1990.”"),
    choices: [t("The school is built in 1990.", "The school is built in 1990."), t("The school was built in 1990.", "The school was built in 1990."), t("The school has built in 1990.", "The school has built in 1990."), t("The school was build in 1990.", "The school was build in 1990.")], answer: 1,
    hint: t("الفعل في الماضي البسيط ⇐ was/were + التصريف الثالث", "Past simple → was/were + past participle"), explain: t("built هو التصريف الثالث لـ build", "“built” is the past participle of “build”") },
  { id: "e2", subject: "english", skill: "conditionals", type: "mcq",
    q: t("If I ____ more time, I would travel.", "If I ____ more time, I would travel."),
    choices: [t("have", "have"), t("had", "had"), t("will have", "will have"), t("would have", "would have")], answer: 1,
    hint: t("الجملة الشرطية الثانية: If + ماضٍ بسيط, would + فعل", "Second conditional: If + past simple, would + verb"), explain: t("If I had…, I would…", "If I had…, I would…") },
  { id: "e3", subject: "english", skill: "tenses", type: "mcq",
    q: t("She has lived here ____ 2015.", "She has lived here ____ 2015."),
    choices: [t("for", "for"), t("since", "since"), t("from", "from"), t("at", "at")], answer: 1,
    hint: t("نستخدم since مع نقطة زمنية محددة، و for مع مدة.", "Use “since” with a point in time and “for” with a duration."), explain: t("2015 نقطة زمنية ⇐ since", "2015 is a point in time → since") },

  // ── Arabic
  { id: "a1", subject: "arabic", skill: "nahw", type: "mcq",
    q: t("ما إعراب كلمة «الطالبُ» في جملة: نجحَ الطالبُ؟", "How is «الطالبُ» parsed in «نجحَ الطالبُ» (The student succeeded)?"),
    choices: [t("فاعل مرفوع", "Subject (fāʿil), nominative"), t("مفعول به منصوب", "Object, accusative"), t("مبتدأ مرفوع", "Subject of nominal sentence (mubtadaʾ)"), t("خبر مرفوع", "Predicate (khabar)")], answer: 0,
    hint: t("الجملة بدأت بفعل. من قام بالفعل؟", "The sentence starts with a verb — who did the action?"), explain: t("جملة فعلية، و«الطالبُ» فاعل مرفوع وعلامة رفعه الضمة.", "Verbal sentence; «الطالبُ» is the fāʿil, marked by ḍamma.") },
  { id: "a2", subject: "arabic", skill: "nawasikh", type: "mcq",
    q: t("ما عمل «كان» وأخواتها؟", "What do «كان» and its sisters do?"),
    choices: [t("تنصب المبتدأ وترفع الخبر", "Make the mubtadaʾ accusative, khabar nominative"), t("ترفع المبتدأ وتنصب الخبر", "Keep the mubtadaʾ nominative, make the khabar accusative"), t("تنصبهما معاً", "Make both accusative"), t("لا تغيّر شيئاً", "Change nothing")], answer: 1,
    hint: t("تذكّر: كانَ الجوُّ جميلاً", "Remember: كانَ الجوُّ جميلاً"), explain: t("يسمّى المبتدأ اسمها والخبر خبرها.", "The mubtadaʾ becomes its ism (nominative), the khabar its khabar (accusative).") },

  // ── Islamic Education
  { id: "i1", subject: "islamic", skill: "basics", type: "num", answer: 5,
    q: t("كم عدد أركان الإسلام؟", "How many pillars of Islam are there?"),
    hint: t("أولها الشهادتان وآخرها الحج.", "The first is the shahada, the last is hajj."), explain: t("الشهادتان، الصلاة، الزكاة، الصوم، الحج", "Shahada, prayer, zakat, fasting, hajj") },

  // ── History / Geography
  { id: "h1", subject: "history", skill: "modern", type: "num", answer: 1917,
    q: t("في أي عام صدر وعد بلفور؟", "In which year was the Balfour Declaration issued?"),
    hint: t("خلال الحرب العالمية الأولى.", "During World War I."), explain: t("٢ تشرين الثاني ١٩١٧", "2 November 1917") },
  { id: "g1", subject: "geography", skill: "physical", type: "mcq",
    q: t("أي بحر يحدّ فلسطين من الغرب؟", "Which sea borders Palestine to the west?"),
    choices: [t("البحر الأحمر", "Red Sea"), t("البحر الميت", "Dead Sea"), t("البحر الأبيض المتوسط", "Mediterranean Sea"), t("بحر العرب", "Arabian Sea")], answer: 2,
    hint: t("عليه تقع مدن يافا وحيفا وغزة.", "Jaffa, Haifa and Gaza lie on it."), explain: t("البحر الأبيض المتوسط", "The Mediterranean") },

  // ── Technology
  { id: "t1", subject: "tech", skill: "binary", type: "num", answer: 101,
    q: t("حوّل العدد العشري ٥ إلى النظام الثنائي.", "Convert decimal 5 to binary."),
    hint: t("$5 = 4 + 1 = 2^2 + 2^0$", "$5 = 4 + 1 = 2^2 + 2^0$"), explain: t("$5_{10} = 101_2$", "$5_{10} = 101_2$") },
  { id: "t2", subject: "tech", skill: "binary", type: "num", answer: 8,
    q: t("كم بت (bit) في البايت (byte) الواحد؟", "How many bits are in one byte?"),
    hint: t("أكبر قيمة في بايت واحد هي $255 = 2^{?} - 1$", "The largest value in a byte is $255 = 2^{?} - 1$"), explain: t("٨ بت", "8 bits") },

  // ── Entrepreneurship
  { id: "n1", subject: "entre", skill: "finance", type: "mcq",
    q: t("نقطة التعادل هي النقطة التي:", "The break-even point is where:"),
    choices: [t("تتساوى فيها الإيرادات مع التكاليف", "Revenue equals total costs"), t("يكون الربح أعلى ما يمكن", "Profit is at its maximum"), t("تبدأ فيها الشركة", "The company starts"), t("تساوي فيها الأسعار الأجور", "Prices equal wages")], answer: 0,
    hint: t("لا ربح ولا خسارة.", "No profit, no loss."), explain: t("الربح = صفر عند نقطة التعادل.", "Profit = 0 at break-even.") },
  { id: "n2", subject: "entre", skill: "strategy", type: "mcq",
    q: t("في تحليل SWOT، يرمز الحرف O إلى:", "In SWOT analysis, the O stands for:"),
    choices: [t("الأهداف", "Objectives"), t("الفرص", "Opportunities"), t("العمليات", "Operations"), t("المخرجات", "Outputs")], answer: 1,
    hint: t("O و T عوامل خارجية.", "O and T are external factors."), explain: t("نقاط القوة، الضعف، الفرص، التهديدات", "Strengths, Weaknesses, Opportunities, Threats") },

  // ── Vocational
  { id: "v1", subject: "vocational", skill: "electric", type: "mcq",
    q: t("ما وحدة قياس القدرة الكهربائية؟", "What is the unit of electrical power?"),
    choices: [t("الفولت", "Volt"), t("الأمبير", "Ampere"), t("الواط", "Watt"), t("الأوم", "Ohm")], answer: 2,
    hint: t("القدرة = فرق الجهد × التيار", "Power = voltage × current"), explain: t("الواط = فولت × أمبير", "Watt = volt × ampere") },
];

// Lessons: a sequence of steps. Step types: explore (interactive widget), concept, worked (reveal steps), quiz (question ids).
window.LESSONS = [
  {
    id: "derivative-intro", subject: "math", minutes: 12, skill: "power_rule", book: "calc",
    title: t("المشتقة: ميل المماس", "The derivative: slope of the tangent"),
    steps: [
      { type: "video", explainer: "secant-tangent", title: t("شاهد الفكرة", "Watch the idea") },
      { type: "explore", widget: "tangent",
        title: t("جرّب بنفسك", "Try it yourself"),
        body: t("اسحب النقطة على منحنى $y = x^2$ وراقب ميل المماس. هل تلاحظ علاقة بين $x$ والميل؟", "Drag the point along $y = x^2$ and watch the slope of the tangent. Do you see a pattern between $x$ and the slope?"),
        predict: { q: t("توقّع: ما الميل عند $x = 5$ ؟", "Predict: what is the slope at $x = 5$?"), answer: 10, explain: t("الميل دائماً ضعف $x$، إذن عند $x = 5$ يكون الميل $10$.", "The slope is always twice $x$, so at $x = 5$ it is $10$.") } },
      { type: "concept", title: t("القاعدة", "The rule"),
        body: t("<p>لاحظت أن الميل دائماً <b>ضعف</b> قيمة $x$. هذا ما نسمّيه <b>المشتقة</b>:</p>$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$<p>ولاقترانات القوى قاعدة مختصرة:</p><div class='rule'>$$\\frac{d}{dx}\\,x^n = n\\,x^{n-1}$$</div>",
                "<p>You noticed the slope is always <b>twice</b> $x$. That's the <b>derivative</b>:</p>$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$<p>For powers of $x$ there is a shortcut:</p><div class='rule'>$$\\frac{d}{dx}\\,x^n = n\\,x^{n-1}$$</div>") },
      { type: "worked", title: t("مثال محلول", "Worked example"),
        problem: t("جد مشتقة $f(x) = 4x^3 - 2x + 7$", "Differentiate $f(x) = 4x^3 - 2x + 7$"),
        reveal: [
          t("اشتق كل حدّ على حدة.", "Differentiate term by term."),
          t("$\\frac{d}{dx}(4x^3) = 4 \\cdot 3x^2 = 12x^2$", "$\\frac{d}{dx}(4x^3) = 4 \\cdot 3x^2 = 12x^2$"),
          t("$\\frac{d}{dx}(-2x) = -2$ ، و $\\frac{d}{dx}(7) = 0$", "$\\frac{d}{dx}(-2x) = -2$, and $\\frac{d}{dx}(7) = 0$"),
          t("$$f'(x) = 12x^2 - 2$$", "$$f'(x) = 12x^2 - 2$$"),
        ] },
      { type: "quiz", title: t("تحقق من فهمك", "Check your understanding"), questions: ["m1", "m3", "m6", "m2"] },
    ],
  },
  {
    id: "ohms-law", subject: "physics", minutes: 8, skill: "ohm",
    title: t("قانون أوم بالتجربة", "Ohm's law, hands-on"),
    steps: [
      { type: "explore", widget: "ohm",
        title: t("مختبر افتراضي", "Virtual lab"),
        body: t("غيّر فرق الجهد $V$ والمقاومة $R$ وراقب شدة التيار $I$. ماذا يحدث للتيار عندما تضاعف الجهد؟ وعندما تضاعف المقاومة؟", "Change the voltage $V$ and resistance $R$ and watch the current $I$. What happens when you double $V$? When you double $R$?"),
        predict: { q: t("توقّع: $V = 12\\,\\text{V}$ و $R = 4\\,\\Omega$. كم التيار (أمبير)؟", "Predict: $V = 12\\,\\text{V}$, $R = 4\\,\\Omega$. What is the current (A)?"), answer: 3, explain: t("$I = \\frac{V}{R} = \\frac{12}{4} = 3\\,\\text{A}$", "$I = \\frac{V}{R} = \\frac{12}{4} = 3\\,\\text{A}$") } },
      { type: "concept", title: t("القانون", "The law"),
        body: t("<div class='rule'>$$I = \\frac{V}{R} \\quad\\Longleftrightarrow\\quad V = IR$$</div><p>التيار يتناسب <b>طردياً</b> مع الجهد، و<b>عكسياً</b> مع المقاومة (عند ثبات درجة الحرارة).</p>",
                "<div class='rule'>$$I = \\frac{V}{R} \\quad\\Longleftrightarrow\\quad V = IR$$</div><p>Current is <b>directly</b> proportional to voltage and <b>inversely</b> proportional to resistance (at constant temperature).</p>") },
      { type: "quiz", title: t("تحقق من فهمك", "Check your understanding"), questions: ["p1", "p2"] },
    ],
  },
  {
    id: "passive-voice", subject: "english", minutes: 7, skill: "passive",
    title: t("المبني للمجهول في الإنجليزية", "The passive voice"),
    steps: [
      { type: "concept", title: t("الفكرة", "The idea"),
        body: t("<p>نستخدم المبني للمجهول عندما يكون <b>الفعل أو المفعول به</b> أهم من الفاعل.</p><div class='rule' dir='ltr'>Object + <i>be</i> (in the sentence's tense) + V3</div><p dir='ltr'><i>Palestinians grow olives.</i> → <i>Olives <b>are grown</b> in Palestine.</i></p>",
                "<p>Use the passive when the <b>action or the object</b> matters more than who did it.</p><div class='rule'>Object + <i>be</i> (in the sentence's tense) + past participle</div><p><i>Palestinians grow olives.</i> → <i>Olives <b>are grown</b> in Palestine.</i></p>") },
      { type: "worked", title: t("خطوة بخطوة", "Step by step"),
        problem: t("حوّل: <i dir='ltr'>The teacher will correct the exams.</i>", "Transform: <i>The teacher will correct the exams.</i>"),
        reveal: [
          t("المفعول به <i dir='ltr'>the exams</i> ينتقل إلى بداية الجملة.", "The object <i>the exams</i> moves to the front."),
          t("الزمن مستقبل (will) ← <i dir='ltr'>will be</i>", "Tense is future (will) → <i>will be</i>"),
          t("التصريف الثالث: <i dir='ltr'>correct → corrected</i>", "Past participle: <i>correct → corrected</i>"),
          t("<b dir='ltr'>The exams will be corrected (by the teacher).</b>", "<b>The exams will be corrected (by the teacher).</b>"),
        ] },
      { type: "quiz", title: t("تحقق من فهمك", "Check your understanding"), questions: ["e1", "e3"] },
    ],
  },
  {
    id: "ph-basics", subject: "chemistry", minutes: 6, skill: "ph",
    title: t("الرقم الهيدروجيني pH", "pH basics"),
    steps: [
      { type: "concept", title: t("الفكرة", "The idea"),
        body: t("<div class='rule'>$$\\mathrm{pH} = -\\log[\\mathrm{H^+}]$$</div><p>$\\mathrm{pH} < 7$ حمضي · $\\mathrm{pH} = 7$ متعادل · $\\mathrm{pH} > 7$ قاعدي.</p><p>الأحماض القوية مثل $\\mathrm{HCl}$ تتأين كلياً، لذلك $[\\mathrm{H^+}]$ يساوي تركيز الحمض.</p>",
                "<div class='rule'>$$\\mathrm{pH} = -\\log[\\mathrm{H^+}]$$</div><p>$\\mathrm{pH} < 7$ acidic · $\\mathrm{pH} = 7$ neutral · $\\mathrm{pH} > 7$ basic.</p><p>Strong acids like $\\mathrm{HCl}$ ionise completely, so $[\\mathrm{H^+}]$ equals the acid concentration.</p>") },
      { type: "quiz", title: t("تحقق من فهمك", "Check your understanding"), questions: ["c1", "c3"] },
    ],
  },
];
