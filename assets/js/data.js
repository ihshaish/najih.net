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
  // ── Mathematics
  { id: "m1", subject: "math", skill: "power_rule", type: "mcq",
    q: t("ما مشتقة الاقتران ق(س) = ٣س<sup>٢</sup> ؟", "What is the derivative of f(x) = 3x<sup>2</sup>?"),
    choices: [t("٦س", "6x"), t("٣س", "3x"), t("٦س<sup>٢</sup>", "6x<sup>2</sup>"), t("٢س", "2x")], answer: 0,
    hint: t("قاعدة القوة: أنزل الأُس واضربه بالمعامل، ثم اطرح ١ من الأُس.", "Power rule: bring the exponent down, multiply by the coefficient, then subtract 1 from the exponent."),
    explain: t("٣ × ٢ س<sup>٢−١</sup> = ٦س", "3 × 2 x<sup>2−1</sup> = 6x") },
  { id: "m2", subject: "math", skill: "derivative_eval", type: "num", answer: 8,
    q: t("إذا كان ق(س) = س<sup>٣</sup> − ٤س + ١، جد قَ(٢).", "If f(x) = x<sup>3</sup> − 4x + 1, find f′(2)."),
    hint: t("اشتق أولاً: قَ(س) = ٣س<sup>٢</sup> − ٤، ثم عوّض س = ٢.", "Differentiate first: f′(x) = 3x<sup>2</sup> − 4, then substitute x = 2."),
    explain: t("قَ(٢) = ٣(٤) − ٤ = ٨", "f′(2) = 3(4) − 4 = 8") },
  { id: "m3", subject: "math", skill: "power_rule", type: "mcq",
    q: t("ما مشتقة الاقتران الثابت ق(س) = ٥ ؟", "What is the derivative of the constant function f(x) = 5?"),
    choices: [t("٥", "5"), t("صفر", "0"), t("١", "1"), t("٥س", "5x")], answer: 1,
    hint: t("هل يتغيّر الاقتران الثابت عندما تتغيّر س؟", "Does a constant change when x changes?"),
    explain: t("الاقتران الثابت لا يتغيّر، فميله صفر.", "A constant never changes, so its slope is 0.") },
  { id: "m4", subject: "math", skill: "integral_basic", type: "mcq",
    q: t("∫ ٢س دس = ؟", "∫ 2x dx = ?"),
    choices: [t("س<sup>٢</sup> + ج", "x<sup>2</sup> + C"), t("٢س<sup>٢</sup> + ج", "2x<sup>2</sup> + C"), t("٢ + ج", "2 + C"), t("س + ج", "x + C")], answer: 0,
    hint: t("التكامل عكس الاشتقاق: أي اقتران مشتقته ٢س؟", "Integration undoes differentiation: which function has derivative 2x?"),
    explain: t("مشتقة س<sup>٢</sup> هي ٢س، لذلك ∫ ٢س دس = س<sup>٢</sup> + ج", "d/dx(x<sup>2</sup>) = 2x, so ∫ 2x dx = x<sup>2</sup> + C") },
  { id: "m5", subject: "math", skill: "limits", type: "num", answer: 4,
    q: t("جد نها<sub>س→٢</sub> (س<sup>٢</sup> − ٤) ÷ (س − ٢)", "Find lim<sub>x→2</sub> (x<sup>2</sup> − 4) / (x − 2)"),
    hint: t("حلّل البسط: س<sup>٢</sup> − ٤ = (س − ٢)(س + ٢)", "Factor the numerator: x<sup>2</sup> − 4 = (x − 2)(x + 2)"),
    explain: t("بعد الاختصار تصبح س + ٢، وعند س = ٢ تساوي ٤", "After cancelling you get x + 2, which equals 4 at x = 2") },
  { id: "m6", subject: "math", skill: "derivative_eval", type: "num", answer: 6,
    q: t("ما ميل المماس لمنحنى ص = س<sup>٢</sup> عند س = ٣ ؟", "What is the slope of the tangent to y = x<sup>2</sup> at x = 3?"),
    hint: t("الميل = المشتقة = ٢س", "Slope = derivative = 2x"),
    explain: t("٢ × ٣ = ٦", "2 × 3 = 6") },

  // ── Physics
  { id: "p1", subject: "physics", skill: "ohm", type: "num", answer: 10,
    q: t("يمر تيار ٢ أمبير في مقاومة ٥ أوم. ما فرق الجهد بين طرفيها (بالفولت)؟", "A 2 A current flows through a 5 Ω resistor. What is the voltage across it (in volts)?"),
    hint: t("قانون أوم: جـ = ت × م", "Ohm's law: V = I × R"), explain: t("٢ × ٥ = ١٠ فولت", "2 × 5 = 10 V") },
  { id: "p2", subject: "physics", skill: "circuits", type: "num", answer: 3,
    q: t("وُصلت مقاومتان كل منهما ٦ أوم على التوازي. ما المقاومة المكافئة (بالأوم)؟", "Two 6 Ω resistors are connected in parallel. What is the equivalent resistance (in Ω)?"),
    hint: t("١/م = ١/م١ + ١/م٢", "1/R = 1/R₁ + 1/R₂"), explain: t("١/م = ١/٦ + ١/٦ = ١/٣، إذن م = ٣ أوم", "1/R = 1/6 + 1/6 = 1/3, so R = 3 Ω") },
  { id: "p3", subject: "physics", skill: "magnetism", type: "mcq",
    q: t("شحنة تتحرك موازية لخطوط مجال مغناطيسي منتظم. ما القوة المغناطيسية المؤثرة فيها؟", "A charge moves parallel to a uniform magnetic field. What magnetic force acts on it?"),
    choices: [t("أكبر ما يمكن", "Maximum"), t("صفر", "Zero"), t("تساوي وزنها", "Equal to its weight"), t("تعتمد على الكتلة فقط", "Depends only on mass")], answer: 1,
    hint: t("ق = ش ع غ جاθ. كم قيمة θ هنا؟", "F = qvB sinθ. What is θ here?"), explain: t("θ = صفر، وجا(٠) = ٠، إذن القوة صفر", "θ = 0 and sin 0 = 0, so F = 0") },
  { id: "p4", subject: "physics", skill: "capacitance", type: "mcq",
    q: t("ما وحدة قياس السعة الكهربائية؟", "What is the SI unit of capacitance?"),
    choices: [t("الهنري", "Henry"), t("الفاراد", "Farad"), t("التسلا", "Tesla"), t("الكولوم", "Coulomb")], answer: 1,
    hint: t("سُمّيت على اسم العالم مايكل فاراداي.", "Named after Michael Faraday."), explain: t("الفاراد = كولوم/فولت", "Farad = coulomb per volt") },

  // ── Chemistry
  { id: "c1", subject: "chemistry", skill: "ph", type: "num", answer: 2,
    q: t("ما الرقم الهيدروجيني pH لمحلول HCl تركيزه ٠٫٠١ مول/لتر؟", "What is the pH of a 0.01 M HCl solution?"),
    hint: t("HCl حمض قوي يتأين كلياً، و pH = −log[H<sup>+</sup>]", "HCl is a strong acid (fully ionised), and pH = −log[H<sup>+</sup>]"),
    explain: t("[H<sup>+</sup>] = ١٠<sup>−٢</sup>، إذن pH = ٢", "[H<sup>+</sup>] = 10<sup>−2</sup>, so pH = 2") },
  { id: "c2", subject: "chemistry", skill: "redox", type: "num", answer: 7,
    q: t("ما عدد تأكسد المنغنيز Mn في KMnO<sub>4</sub>؟ (اكتب الرقم فقط)", "What is the oxidation number of Mn in KMnO<sub>4</sub>? (number only)"),
    hint: t("K = +١، O = −٢، ومجموع أعداد التأكسد في المركب = صفر", "K = +1, O = −2, and the total for a neutral compound is 0"),
    explain: t("+١ + Mn + ٤(−٢) = ٠ ⇐ Mn = +٧", "+1 + Mn + 4(−2) = 0 ⇒ Mn = +7") },
  { id: "c3", subject: "chemistry", skill: "kinetics", type: "mcq",
    q: t("كيف يزيد العامل المساعد سرعة التفاعل؟", "How does a catalyst increase reaction rate?"),
    choices: [t("يرفع درجة الحرارة", "It raises the temperature"), t("يخفض طاقة التنشيط", "It lowers the activation energy"), t("يزيد تركيز المتفاعلات", "It increases reactant concentration"), t("يغيّر قيمة ΔH", "It changes ΔH")], answer: 1,
    hint: t("يوفّر مساراً بديلاً للتفاعل.", "It provides an alternative reaction pathway."), explain: t("المسار البديل له طاقة تنشيط أقل، ولا يتغيّر ΔH.", "The alternative path has lower activation energy; ΔH is unchanged.") },

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
    hint: t("٥ = ٤ + ١ = ٢<sup>٢</sup> + ٢<sup>٠</sup>", "5 = 4 + 1 = 2<sup>2</sup> + 2<sup>0</sup>"), explain: t("١٠١", "101") },
  { id: "t2", subject: "tech", skill: "binary", type: "num", answer: 8,
    q: t("كم بت (bit) في البايت (byte) الواحد؟", "How many bits are in one byte?"),
    hint: t("أكبر قيمة في بايت واحد هي ٢٥٥ = ٢<sup>؟</sup> − ١", "The largest value in a byte is 255 = 2<sup>?</sup> − 1"), explain: t("٨ بت", "8 bits") },

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
    id: "derivative-intro", subject: "math", minutes: 10, skill: "power_rule",
    title: t("المشتقة: ميل المماس", "The derivative: slope of the tangent"),
    steps: [
      { type: "explore", widget: "tangent",
        title: t("استكشف أولاً", "Explore first"),
        body: t("حرّك المؤشر وراقب ميل المماس لمنحنى ص = س<sup>٢</sup>. هل تلاحظ علاقة بين قيمة س والميل؟", "Move the slider and watch the slope of the tangent to y = x<sup>2</sup>. Do you see a pattern between x and the slope?"),
        predict: { q: t("توقّع: ما الميل عند س = ٥ ؟", "Predict: what is the slope at x = 5?"), answer: 10, explain: t("الميل دائماً ضعف س، إذن عند س = ٥ يكون الميل ١٠.", "The slope is always twice x, so at x = 5 it is 10.") } },
      { type: "concept", title: t("القاعدة", "The rule"),
        body: t("<p>لاحظت أن الميل دائماً <b>ضعف</b> قيمة س. هذا ما نسمّيه <b>المشتقة</b>: قَ(س) = ٢س.</p><div class='rule'>إذا كان ق(س) = س<sup>ن</sup> فإن قَ(س) = ن س<sup>ن−١</sup></div><p>المشتقة تخبرك بسرعة تغيّر الاقتران عند كل نقطة.</p>",
                "<p>You noticed the slope is always <b>twice</b> x. That's the <b>derivative</b>: f′(x) = 2x.</p><div class='rule'>If f(x) = x<sup>n</sup> then f′(x) = n x<sup>n−1</sup></div><p>The derivative tells you how fast a function is changing at every point.</p>") },
      { type: "worked", title: t("مثال محلول", "Worked example"),
        problem: t("جد مشتقة ق(س) = ٤س<sup>٣</sup> − ٢س + ٧", "Differentiate f(x) = 4x<sup>3</sup> − 2x + 7"),
        reveal: [
          t("اشتق كل حد على حدة.", "Differentiate term by term."),
          t("٤س<sup>٣</sup> ← ٤ × ٣ س<sup>٢</sup> = ١٢س<sup>٢</sup>", "4x<sup>3</sup> → 4 × 3 x<sup>2</sup> = 12x<sup>2</sup>"),
          t("−٢س ← −٢ ، والثابت ٧ ← ٠", "−2x → −2, and the constant 7 → 0"),
          t("<b>قَ(س) = ١٢س<sup>٢</sup> − ٢</b>", "<b>f′(x) = 12x<sup>2</sup> − 2</b>"),
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
        body: t("غيّر فرق الجهد والمقاومة وراقب شدة التيار. ماذا يحدث للتيار عندما تضاعف الجهد؟ وعندما تضاعف المقاومة؟", "Change the voltage and resistance and watch the current. What happens when you double the voltage? When you double the resistance?"),
        predict: { q: t("توقّع: جهد ١٢ فولت ومقاومة ٤ أوم. كم التيار (أمبير)؟", "Predict: 12 V across 4 Ω. What is the current (A)?"), answer: 3, explain: t("ت = جـ ÷ م = ١٢ ÷ ٤ = ٣ أمبير.", "I = V ÷ R = 12 ÷ 4 = 3 A.") } },
      { type: "concept", title: t("القانون", "The law"),
        body: t("<div class='rule'>ت = جـ ÷ م &nbsp;&nbsp;⇔&nbsp;&nbsp; جـ = ت × م</div><p>التيار يتناسب <b>طردياً</b> مع الجهد، و<b>عكسياً</b> مع المقاومة (عند ثبات درجة الحرارة).</p>",
                "<div class='rule'>I = V ÷ R &nbsp;&nbsp;⇔&nbsp;&nbsp; V = I × R</div><p>Current is <b>directly</b> proportional to voltage and <b>inversely</b> proportional to resistance (at constant temperature).</p>") },
      { type: "quiz", title: t("تحقق من فهمك", "Check your understanding"), questions: ["p1", "p2"] },
    ],
  },
  {
    id: "passive-voice", subject: "english", minutes: 7, skill: "passive",
    title: t("المبني للمجهول في الإنجليزية", "The passive voice"),
    steps: [
      { type: "concept", title: t("الفكرة", "The idea"),
        body: t("<p>نستخدم المبني للمجهول عندما يكون <b>الفعل أو المفعول به</b> أهم من الفاعل.</p><div class='rule'>Object + be (بزمن الجملة) + V3</div><p><i>Palestinians grow olives.</i> ← <i>Olives <b>are grown</b> in Palestine.</i></p>",
                "<p>Use the passive when the <b>action or the object</b> matters more than who did it.</p><div class='rule'>Object + be (in the sentence's tense) + past participle</div><p><i>Palestinians grow olives.</i> → <i>Olives <b>are grown</b> in Palestine.</i></p>") },
      { type: "worked", title: t("خطوة بخطوة", "Step by step"),
        problem: t("حوّل: <i>The teacher will correct the exams.</i>", "Transform: <i>The teacher will correct the exams.</i>"),
        reveal: [
          t("المفعول به: <i>the exams</i> ← يصبح في بداية الجملة.", "Object: <i>the exams</i> → moves to the front."),
          t("الزمن مستقبل (will) ← <i>will be</i>", "Tense is future (will) → <i>will be</i>"),
          t("التصريف الثالث: correct ← corrected", "Past participle: correct → corrected"),
          t("<b>The exams will be corrected (by the teacher).</b>", "<b>The exams will be corrected (by the teacher).</b>"),
        ] },
      { type: "quiz", title: t("تحقق من فهمك", "Check your understanding"), questions: ["e1", "e3"] },
    ],
  },
  {
    id: "ph-basics", subject: "chemistry", minutes: 6, skill: "ph",
    title: t("الرقم الهيدروجيني pH", "pH basics"),
    steps: [
      { type: "concept", title: t("الفكرة", "The idea"),
        body: t("<div class='rule'>pH = −log[H<sup>+</sup>]</div><p>pH أقل من ٧: حمضي · يساوي ٧: متعادل · أكبر من ٧: قاعدي.</p><p>الأحماض القوية (مثل HCl) تتأين كلياً، لذلك [H<sup>+</sup>] = تركيز الحمض.</p>",
                "<div class='rule'>pH = −log[H<sup>+</sup>]</div><p>pH below 7: acidic · 7: neutral · above 7: basic.</p><p>Strong acids (like HCl) ionise completely, so [H<sup>+</sup>] equals the acid concentration.</p>") },
      { type: "quiz", title: t("تحقق من فهمك", "Check your understanding"), questions: ["c1", "c3"] },
    ],
  },
];

// Past-exam archive scaffold. Add real files to /exams/ and set `paper`/`solution` URLs.
window.EXAMS = (() => {
  const list = [];
  const years = [2025, 2024, 2023, 2022];
  for (const b of window.BRANCHES) for (const s of b.subjects) for (const y of years)
    list.push({ branch: b.id, subject: s, year: y, session: 1, paper: "", solution: "" });
  return list;
})();
