#!/usr/bin/env python3
"""Build the Scientific-maths pathway: concept blocks, road map, pilot plan and content schema.

Inputs   content/math-sci/analysis.json   (run tools/analyse_math_sci.py first)
         content/math-sci/book/u*.json, content/math-sci/exams/*.json (labels for past-question links)
Outputs  content/math-sci/blueprint.json  (full design document, inspectable)
         assets/js/course-math-sci.js     (window.COURSE_MATH_SCI, runtime data for #/course/math-sci...)

Run:  python3 -I tools/analyse_math_sci.py && python3 -I tools/build_course_math_sci.py

The block design below is authored (curriculum architecture); every number attached to it is computed
from analysis.json so the two never drift apart.

Block exam weight. Item effective marks go to lessons with the analysis rule (50% primary lesson, 50%
shared by supporting lessons). Lessons that belong to one block pass their share to it. Lessons split
across blocks (1-2, 1-4, 4-4) pass each item's lesson share to the blocks whose concepts the item is
tagged with (equally); an item with none of them uses that lesson's overall split. Block weights
therefore sum to exactly the lesson shares, i.e. 100%.
"""
from __future__ import annotations

import glob
import json
import os
from collections import Counter, OrderedDict, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "math-sci")
A = json.load(open(os.path.join(CONTENT, "analysis.json"), encoding="utf-8"))
YEARS = ["2022", "2023", "2024", "2025"]


AR_DIGITS = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")


def arnum(s):
    """Arabic-Indic digits and the Arabic decimal separator for numbers inside Arabic text.
    $…$ maths is left as LaTeX source: armath.js converts its digits when it renders."""
    import re
    def conv(t):
        return re.sub(r"(?<=\d)\.(?=\d)", "٫", t).translate(AR_DIGITS)
    return "".join(part if part.startswith("$") else conv(part) for part in re.split(r"(\$[^$]*\$)", s))


def T(ar, en):
    return {"ar": arnum(ar), "en": en}


# ------------------------------------------------------------------------------------------------
# Assumed Grade-11 knowledge (nodes outside the book)
# ------------------------------------------------------------------------------------------------
G11 = OrderedDict([
    ("g11-functions", T("الاقترانات: المجال والتعويض والتركيب، المتشعب وأكبر عدد صحيح والقيمة المطلقة",
                        "Functions: domain, evaluation, composition; piecewise, greatest-integer and absolute value")),
    ("g11-limits", T("النهايات والاتصال (بما فيها النهايات من جهة واحدة وصورة ٠/٠)", "Limits and continuity (one-sided limits, 0/0 forms)")),
    ("g11-trig", T("الاقترانات المثلثية والمتطابقات وقياس الزوايا بالراديان", "Trig functions, identities and radian measure")),
    ("g11-explog", T("الاقتران الأسي واللوغاريتمي وقوانينهما", "Exponential and logarithmic functions and their laws")),
    ("g11-lines", T("ميل المستقيم ومعادلته، والتوازي والتعامد", "Slope and equation of a line; parallel and perpendicular lines")),
    ("g11-equations", T("حل المعادلات والمتباينات ودراسة الإشارة", "Solving equations and inequalities; sign charts")),
    ("g11-geometry", T("المساحات والحجوم والمحيطات للأشكال المألوفة", "Areas, perimeters and volumes of familiar shapes")),
    ("g11-systems", T("حل نظام معادلتين خطيتين بالحذف والتعويض", "Solving 2×2 linear systems by elimination and substitution")),
    ("g11-sigma", T("رمز المجموع Σ وخصائصه", "Sigma notation and its rules")),
    ("g11-quadratics", T("المعادلة التربيعية والمميز والجذور", "Quadratic equations, the discriminant and roots")),
])

# ------------------------------------------------------------------------------------------------
# Concept blocks. pages = printed page spans; book_concepts = ids in content/math-sci/book/u*.json
# ------------------------------------------------------------------------------------------------
BLOCKS = [
    dict(id="B01", unit=1, title=T("متوسط التغير", "Average rate of change"),
         goal=T("تحسب متوسط تغيّر اقتران على فترة، وتفسّره ميلاً للقاطع وسرعةً متوسطة، وتستخدمه لإيجاد ثوابت مجهولة.",
                "Compute the average rate of change on an interval, read it as a secant slope and an average velocity, and use it to find unknown constants."),
         key=T("متوسط التغير = التغير في الاقتران ÷ التغير في س", "Average rate = change in f ÷ change in x"),
         lessons={"1-1": [[4, 8]]}, concepts=["avg-rate"],
         book_concepts=["u1.change_delta", "u1.avg_rate", "u1.avg_rate_function", "u1.secant_slope", "u1.avg_velocity"],
         prereq=[], g11=["g11-functions", "g11-lines"]),
    dict(id="B02", unit=1, title=T("المشتقة وقابلية الاشتقاق", "The derivative and differentiability"),
         goal=T("تفهم المشتقة نهايةً لمتوسط التغير، وتحكم على قابلية الاشتقاق عند نقطة للاقتران المتشعب والمطلق وأكبر عدد صحيح، وتجد الثوابت التي تجعله قابلاً للاشتقاق.",
                "Understand the derivative as the limit of the average rate, decide differentiability at a point for piecewise, absolute-value and greatest-integer functions, and find the constants that make a function differentiable."),
         key=T("قابل للاشتقاق عند أ ⇔ متصل عند أ والمشتقة من اليمين = المشتقة من اليسار", "Differentiable at a ⇔ continuous at a and right derivative = left derivative"),
         lessons={"1-2": [[9, 10], [12, 14]]}, concepts=["diff-piecewise"],
         book_concepts=["u1.derivative_def", "u1.one_sided_derivative", "u1.differentiability", "u1.diff_continuity", "u1.piecewise_derivative"],
         prereq=["B01"], g11=["g11-limits", "g11-functions"]),
    dict(id="B03", unit=1, title=T("قواعد الاشتقاق والمشتقات العليا", "Differentiation rules and higher derivatives"),
         goal=T("تشتق بقواعد الثابت والمجموع والضرب والقسمة والقوة، وتحسب المشتقات العليا، وتجد المشتقة من قيم معطاة لاقترانات مجهولة.",
                "Differentiate with the constant, sum, product, quotient and power rules, compute higher derivatives, and find derivatives from given values of unknown functions."),
         key=T(r"$(f\times g)'(x)=f(x)\times g'(x)+g(x)\times f'(x)$", r"$(f\times g)'(x)=f(x)\,g'(x)+g(x)\,f'(x)$"),
         lessons={"1-2": [[10, 11], [13, 18]]}, concepts=["diff-rules", "higher-deriv"],
         book_concepts=["u1.basic_rules", "u1.product_rule", "u1.quotient_rule", "u1.power_rule", "u1.higher_derivatives", "u1.derivative_identity_proof"],
         prereq=["B02"], g11=["g11-functions"]),
    dict(id="B04", unit=1, title=T("مشتقات المثلثية والأسية واللوغاريتمية", "Derivatives of trig, exponential and log functions"),
         goal=T("تشتق الاقترانات المثلثية الست والأسي الطبيعي واللوغاريتم الطبيعي، وتثبت علاقات تحوي مشتقاتها.",
                "Differentiate the six trig functions, eˣ and ln x, and prove identities involving their derivatives."),
         key=T(r"$(\sin x)'=\cos x$ ، $(\E^{x})'=\E^{x}$ ، $(\ln x)'=\frac{1}{x}$", r"$(\sin x)'=\cos x$, $(\E^{x})'=\E^{x}$, $(\ln x)'=\frac{1}{x}$"),
         lessons={"1-3": [[19, 21]], "1-4": [[25, 29]]}, concepts=["trig-deriv", "exp-log-deriv"],
         book_concepts=["u1.trig_derivatives", "u1.e_number", "u1.exp_log_laws", "u1.exp_derivative", "u1.ln_derivative"],
         prereq=["B03"], g11=["g11-trig", "g11-explog"]),
    dict(id="B05", unit=1, title=T("قاعدة لوبيتال ونهايات المشتقة", "L'Hôpital's rule and derivative limits"),
         goal=T("تحسب نهايات الصورة ٠/٠ بقاعدة لوبيتال، وتتعرّف على النهاية التي هي مشتقة متنكّرة، وتستخدمهما لإيجاد قيم وثوابت لاقتران مجهول.",
                "Evaluate 0/0 limits with L'Hôpital's rule, recognise a limit that is a derivative in disguise, and use both to find values and constants of an unknown function."),
         key=T(r"إذا كانت النهاية على الصورة $\frac{0}{0}$ فإن $\lim\frac{f(x)}{g(x)}=\lim\frac{f'(x)}{g'(x)}$", r"For a $\frac{0}{0}$ form, $\lim\frac{f(x)}{g(x)}=\lim\frac{f'(x)}{g'(x)}$"),
         lessons={"1-4": [[22, 24]]}, concepts=["lhopital", "deriv-limit"],
         book_concepts=["u1.lhopital", "u1.derivative_limit_disguise"],
         prereq=["B02", "B04"], g11=["g11-limits"]),
    dict(id="B06", unit=1, title=T("المماس والحركة", "Tangents and motion"),
         goal=T("تكتب معادلتي المماس والعمودي، وتستخدم شروط التماس لإيجاد الثوابت، وتحلّل الحركة المستقيمة والرأسية بالسرعة والتسارع.",
                "Write tangent and normal equations, use tangency conditions to find constants, and analyse straight-line and vertical motion with velocity and acceleration."),
         key=T(r"ميل المماس عند $x=a$ هو $f'(a)$ ؛ السرعة $v=s'(t)$ والتسارع هو $v'(t)$", r"Tangent slope at $x=a$ is $f'(a)$; velocity $v=s'(t)$, acceleration $v'(t)$"),
         lessons={"1-5": [[30, 36]]}, concepts=["tangent-normal", "motion-deriv"],
         book_concepts=["u1.tangent_slope", "u1.tangent_normal", "u1.tangent_conditions", "u1.instant_velocity_accel", "u1.direction_change", "u1.vertical_motion"],
         prereq=["B03", "B04"], g11=["g11-lines", "g11-equations"]),
    dict(id="B07", unit=1, title=T("قاعدة السلسلة", "The chain rule"),
         goal=T("تشتق الاقتران المركّب بقاعدة السلسلة في صورتيها، وتتعامل مع القوى والجذور والمثلثية والأسية داخلياً، ومع اقترانات مجهولة معطاة بقيم أو معادلات، ومع المتغيرات الوسيطة.",
                "Differentiate composite functions with both forms of the chain rule, handle powers, roots, trig and exponential inner functions, unknown functions given by values or equations, and intermediate variables."),
         key=T(r"$(f\circ g)'(x)=f'\big(g(x)\big)\times g'(x)$", r"$(f\circ g)'(x)=f'\big(g(x)\big)\times g'(x)$"),
         lessons={"1-6": [[37, 41]]}, concepts=["chain-rule"],
         book_concepts=["u1.chain_rule", "u1.general_power_rule", "u1.chain_multi", "u1.exp_ln_composite"],
         prereq=["B03", "B04"], g11=["g11-functions"]),
    dict(id="B08", unit=1, title=T("الاشتقاق الضمني", "Implicit differentiation"),
         goal=T("تجد دص/دس ضمنياً، وتكتب مماس منحنى علاقة ضمنية، وتثبت علاقات بالاشتقاق الضمني، وتشتق القوى النسبية.",
                "Find dy/dx implicitly, write tangents to implicit curves, prove relations by implicit differentiation, and differentiate rational powers."),
         key=T(r"اشتق الطرفين بالنسبة إلى $x$، وكل حدّ فيه $y$ يُضرب في $\dv{y}{x}$", r"Differentiate both sides in $x$; every term in $y$ picks up $\dv{y}{x}$"),
         lessons={"1-7": [[42, 47]]}, concepts=["implicit-diff"],
         book_concepts=["u1.implicit_relation", "u1.implicit_diff", "u1.implicit_tangent", "u1.rational_power_rule", "u1.log_differentiation"],
         prereq=["B07", "B06"], g11=["g11-equations"]),
    dict(id="B09", unit=2, title=T("نظريتا رول والقيمة المتوسطة", "Rolle's theorem and the mean value theorem"),
         goal=T("تتحقق من شروط النظريتين (للمتشعب أيضاً)، وتجد قيم جـ، وتجد ثوابت تجعل الشروط متحققة، وتثبت بهما وجود قيم.",
                "Check both theorems' hypotheses (piecewise too), find the values of c, find constants that make the hypotheses hold, and prove existence results with them."),
         key=T(r"متصل على $[a,b]$ وقابل للاشتقاق على $]a,b[$ ⇐ يوجد $c$ بحيث $f'(c)=\frac{f(b)-f(a)}{b-a}$", r"Continuous on $[a,b]$, differentiable on $]a,b[$ ⇒ some $c$ has $f'(c)=\frac{f(b)-f(a)}{b-a}$"),
         lessons={"2-1": [[54, 59]]}, concepts=["rolle", "mvt"],
         book_concepts=["u2.rolle", "u2.mvt", "u2.theorem_conditions", "u2.find_c", "u2.theorem_parameters", "u2.rolle_proofs"],
         prereq=["B02", "B04", "B07"], g11=["g11-limits"]),
    dict(id="B10", unit=2, title=T("التزايد والتناقص", "Increasing and decreasing functions"),
         goal=T("تحدد فترات التزايد والتناقص من إشارة المشتقة الأولى أو من الرسم، ولاقترانات مجردة ومركّبة.",
                "Find intervals of increase and decrease from the sign of f' or from a graph, including abstract and combined functions."),
         key=T(r"$f'(x)\gt 0$ على فترة ⇐ $f$ متزايد عليها", r"$f'(x)\gt 0$ on an interval ⇒ $f$ increasing there"),
         lessons={"2-2": [[60, 64]]}, concepts=["monotonic"],
         book_concepts=["u2.monotonic_def", "u2.monotonic_from_graph", "u2.first_derivative_monotonic", "u2.sign_chart", "u2.monotonic_abstract"],
         prereq=["B03", "B04", "B07"], g11=["g11-equations"]),
    dict(id="B11", unit=2, title=T("القيم القصوى", "Extreme values"),
         goal=T("تجد النقط الحرجة والقيم القصوى المحلية والمطلقة على فترة، وتستخدم اختبار المشتقة الأولى واختبار الأطراف، وتجد ثوابت من معطيات القيم القصوى.",
                "Find critical points and local and absolute extrema on an interval with the first-derivative and endpoint tests, and find constants from given extrema."),
         key=T("القيم القصوى تقع عند النقط الحرجة أو أطراف الفترة", "Extrema occur at critical points or at the ends of the interval"),
         lessons={"2-3": [[65, 74]]}, concepts=["critical-points", "local-extrema", "absolute-extrema"],
         book_concepts=["u2.local_extrema", "u2.absolute_extrema", "u2.critical_point", "u2.first_derivative_test", "u2.endpoint_test",
                        "u2.discontinuity_extrema", "u2.extreme_value_theorem", "u2.closed_interval_method", "u2.extrema_parameters"],
         prereq=["B10"], g11=["g11-equations"]),
    dict(id="B12", unit=2, title=T("التقعّر ونقط الانعطاف", "Concavity and inflection"),
         goal=T("تحدد فترات التقعّر ونقط الانعطاف وزواياها، وتستخدم اختبار المشتقة الثانية، وتقرأ سلوك ق من منحنى قَ أو قً.",
                "Find concavity intervals, inflection points and their angles, use the second-derivative test, and read f's behaviour from the graph of f' or f''."),
         key=T(r"$f''(x)\gt 0$ ⇐ مقعّر للأعلى ؛ نقطة الانعطاف حيث يتغيّر اتجاه التقعّر", r"$f''(x)\gt 0$ ⇒ concave up; inflection where concavity changes"),
         lessons={"2-4": [[75, 82]]}, concepts=["concavity-inflection", "graph-reading"],
         book_concepts=["u2.concavity_def", "u2.concavity_test", "u2.inflection_point", "u2.inflection_angle", "u2.second_derivative_test",
                        "u2.graph_of_derivative", "u2.function_from_conditions"],
         prereq=["B11", "B03"], g11=["g11-equations"]),
    dict(id="B13", unit=2, title=T("تطبيقات القيم القصوى", "Optimisation"),
         goal=T("تحوّل مسألة هندسية أو عملية إلى اقتران بمتغير واحد باستخدام القيد، وتجد قيمته العظمى أو الصغرى المطلقة وتتحقق منها.",
                "Turn a geometric or practical problem into a one-variable function using the constraint, find its absolute maximum or minimum, and verify it."),
         key=T("القيد ← اقتران بمتغير واحد ← مشتقة = صفر ← تحقق", "Constraint → one-variable function → derivative = 0 → verify"),
         lessons={"2-5": [[83, 87]]}, concepts=["optimization"],
         book_concepts=["u2.optimization", "u2.objective_function", "u2.optimization_verify"],
         prereq=["B11", "B12"], g11=["g11-geometry"]),
    dict(id="B14", unit=3, title=T("المصفوفات والعمليات عليها", "Matrices and their operations"),
         goal=T("تكتب المصفوفة من قاعدة مدخلاتها، وتجري الجمع والضرب بعدد والضرب، وتحدد متى يكون الضرب ممكناً، وتحل معادلات مصفوفية بسيطة.",
                "Write a matrix from a rule for its entries, add, scale and multiply matrices, decide when a product is defined, and solve simple matrix equations."),
         key=T("أ(م×ن) × ب(ن×ك) = جـ(م×ك)", "A(m×n) · B(n×k) = C(m×k)"),
         lessons={"3-1": [[94, 98]], "3-2": [[99, 107]]}, concepts=["matrix-basics", "matrix-add-scalar", "matrix-mult", "matrix-equation"],
         book_concepts=["u3.matrix", "u3.matrix_entry", "u3.matrix_order", "u3.square_matrix", "u3.identity_matrix", "u3.zero_matrix", "u3.row_matrix",
                        "u3.column_matrix", "u3.diagonal_matrix", "u3.main_diagonal", "u3.upper_triangular", "u3.matrix_equality", "u3.matrix_addition",
                        "u3.scalar_multiplication", "u3.matrix_subtraction", "u3.additive_inverse", "u3.addition_properties", "u3.matrix_equation_linear",
                        "u3.matrix_multiplication", "u3.multiplication_conformability", "u3.multiplication_properties", "u3.matrix_powers"],
         prereq=[], g11=["g11-systems"]),
    dict(id="B15", unit=3, title=T("المحدّدات", "Determinants"),
         goal=T("تحسب محددات الرتب ١ و٢ و٣، وتستخدم خصائصها (|كأ|، |أب|، تساوي صفين…) لحل معادلات وإثبات علاقات.",
                "Evaluate determinants of order 1, 2 and 3, and use their properties (|kA|, |AB|, equal rows…) to solve equations and prove relations."),
         key=T(r"$|kA|=k^{n}|A|$ ، $|AB|=|A|\,|B|$", r"$|kA|=k^{n}|A|$, $|AB|=|A|\,|B|$"),
         lessons={"3-3": [[108, 113]]}, concepts=["determinant"],
         book_concepts=["u3.determinant", "u3.det_2x2", "u3.det_3x3", "u3.cofactor_expansion", "u3.det_properties", "u3.det_scalar_rule", "u3.det_product_rule", "u3.det_equation"],
         prereq=["B14"], g11=["g11-equations"]),
    dict(id="B16", unit=3, title=T("النظير الضربي والمعادلات المصفوفية", "The inverse matrix and matrix equations"),
         goal=T("تجد النظير الضربي لمصفوفة ٢×٢، وتحكم على المصفوفة المنفردة، وتستخدم خصائص النظير لحل معادلات مصفوفية.",
                "Find the inverse of a 2×2 matrix, recognise singular matrices, and use inverse properties to solve matrix equations."),
         key=T("أ⁻¹ = (١/|أ|) × [د −ب ؛ −جـ أ] ، (أب)⁻¹ = ب⁻¹ أ⁻¹", "A⁻¹ = (1/|A|)[d −b; −c a], (AB)⁻¹ = B⁻¹A⁻¹"),
         lessons={"3-4": [[114, 119]]}, concepts=["matrix-inverse"],
         book_concepts=["u3.inverse_matrix", "u3.nonsingular_matrix", "u3.singular_matrix", "u3.singular_iff_det_zero", "u3.inverse_properties", "u3.inverse_2x2_formula", "u3.det_of_inverse"],
         prereq=["B14", "B15"], g11=[]),
    dict(id="B17", unit=3, title=T("حل أنظمة المعادلات الخطية", "Solving linear systems"),
         goal=T("تحل الأنظمة الخطية بطريقة كريمر وبالنظير الضربي وبطريقة جاوس، وتعيد بناء النظام من مصفوفات كريمر.",
                "Solve linear systems by Cramer's rule, the inverse matrix and Gaussian elimination, and rebuild a system from its Cramer matrices."),
         key=T(r"$x=\frac{|A_x|}{|A|}$ ، $y=\frac{|A_y|}{|A|}$", r"$x=\frac{|A_x|}{|A|}$, $y=\frac{|A_y|}{|A|}$"),
         lessons={"3-5": [[120, 125]]}, concepts=["cramer", "inverse-method", "gauss"],
         book_concepts=["u3.system_matrix_form", "u3.inverse_method", "u3.cramer_rule", "u3.gauss_elimination", "u3.augmented_matrix", "u3.elementary_row_operations", "u3.back_substitution"],
         prereq=["B15", "B16"], g11=["g11-systems"]),
    dict(id="B18", unit=4, title=T("الاقتران الأصلي وقواعد التكامل", "Antiderivatives and integration rules"),
         goal=T("تفهم التكامل غير المحدود عكساً للاشتقاق، وتكامل بالقواعد الأساسية بعد التبسيط الجبري أو بالمتطابقات المثلثية.",
                "Understand the indefinite integral as the reverse of differentiation and integrate with the basic rules after algebraic or trig simplification."),
         key=T(r"$\int x^{n}\,\dd{x}=\frac{x^{n+1}}{n+1}+c$ ، $n\neq -1$", r"$\int x^{n}\,\dd{x}=\frac{x^{n+1}}{n+1}+c$, $n\neq -1$"),
         lessons={"4-1": [[132, 136]], "4-2": [[137, 140]]}, concepts=["antiderivative", "indef-rules"],
         book_concepts=["u4.antiderivative", "u4.general_antiderivative", "u4.antiderivatives_differ_by_constant", "u4.indefinite_integral", "u4.constant_of_integration",
                        "u4.derivative_of_integral", "u4.initial_condition", "u4.basic_integral_rules", "u4.power_rule_integral", "u4.integral_reciprocal_ln",
                        "u4.integral_exponential", "u4.integral_trig", "u4.linearity_integral", "u4.algebraic_simplification", "u4.trig_identity_rewrite"],
         prereq=["B03", "B04", "B07"], g11=["g11-trig", "g11-explog"]),
    dict(id="B19", unit=4, title=T("تطبيقات التكامل غير المحدود", "Applications of the indefinite integral"),
         goal=T("تجد قاعدة الاقتران من ميل المماس أو العمودي ونقطة أو من المشتقة الثانية، وتنتقل في الحركة من التسارع إلى السرعة إلى الموقع.",
                "Recover a function from the slope of its tangent or normal and a point, or from its second derivative, and move from acceleration to velocity to position."),
         key=T(r"$f(x)=\int f'(x)\,\dd{x}$، ثم نجد $c$ من نقطة معطاة", r"$f(x)=\int f'(x)\,\dd{x}$, then find $c$ from a given point"),
         lessons={"4-3": [[141, 145]]}, concepts=["indef-applications"],
         book_concepts=["u4.curve_from_slope", "u4.curve_from_second_derivative", "u4.tangent_line_condition", "u4.motion_integration", "u4.vertical_motion"],
         prereq=["B18", "B06"], g11=["g11-lines"]),
    dict(id="B20", unit=4, title=T("التكامل بالتعويض", "Integration by substitution"),
         goal=T("تختار التعويض المناسب (قوة اقتران، داخل خطي، قَ/ق، قوى مثلثية، جذور) وتعبّر عن المتبقي بالمتغير الجديد.",
                "Choose the right substitution (power of a function, linear inside, f'/f, trig powers, roots) and express what is left in the new variable."),
         key=T(r"$\int f\big(g(x)\big)\,g'(x)\,\dd{x}=\int f(y)\,\dd{y}$ حيث $y=g(x)$", r"$\int f\big(g(x)\big)\,g'(x)\,\dd{x}=\int f(u)\,\dd{u}$ with $u=g(x)$"),
         lessons={"4-4": [[146, 150]]}, concepts=["substitution"],
         book_concepts=["u4.substitution", "u4.power_of_function_rule", "u4.linear_inner_rule", "u4.log_derivative_rule", "u4.trig_powers", "u4.back_substitution_leftover"],
         prereq=["B18", "B07"], g11=["g11-trig"]),
    dict(id="B21", unit=4, title=T("التكامل بالأجزاء والكسور الجزئية", "Integration by parts and partial fractions"),
         goal=T("تكامل بالأجزاء (مكرراً ودورياً وبعد تعويض)، وتجزّئ الكسر النسبي إلى كسور جزئية بعد القسمة المطولة عند الحاجة.",
                "Integrate by parts (repeated, cyclic, after a substitution) and split rational functions into partial fractions, after long division when needed."),
         key=T(r"$\int y\,\dd{v}=y\,v-\int v\,\dd{y}$", r"$\int u\,\dd{v}=uv-\int v\,\dd{u}$"),
         lessons={"4-4": [[151, 159]]}, concepts=["by-parts", "partial-fractions"],
         book_concepts=["u4.integration_by_parts", "u4.repeated_parts", "u4.cyclic_parts", "u4.substitution_then_parts", "u4.partial_fractions",
                        "u4.long_division_rational", "u4.substitution_to_rational", "u4.integral_sec_csc"],
         prereq=["B20", "B03"], g11=["g11-equations"]),
    dict(id="B22", unit=5, title=T("مجموع ريمان والتكامل المحدود بالتعريف", "Riemann sums and the definite integral by definition"),
         goal=T("تكتب عناصر التجزئة المنتظمة وتحسب مجموع ريمان، وتحسب التكامل المحدود لاقتران خطي بالتعريف (نهاية مجموع ريمان).",
                "Write the elements of a regular partition, compute Riemann sums, and evaluate the definite integral of a linear function from the definition (limit of Riemann sums)."),
         key=T(r"$x_r=a+r\times\frac{b-a}{n}$", r"$x_r=a+r\times\frac{b-a}{n}$"),
         lessons={"5-1": [[164, 170]], "5-2": [[171, 175]]}, concepts=["riemann-sum", "def-integral-def"],
         book_concepts=["u5.partition", "u5.subinterval", "u5.regular_partition", "u5.regular_partition_element", "u5.riemann_sum",
                        "u5.riemann_sum_general_n", "u5.definite_integral_def", "u5.integrability"],
         prereq=[], g11=["g11-sigma", "g11-limits"]),
    dict(id="B23", unit=5, title=T("النظرية الأساسية والاقتران المكامل", "The fundamental theorem and the integral function"),
         goal=T("تحسب التكامل المحدود باقتران أصلي (مع التعويض والأجزاء)، وتبني الاقتران المكامل ت(س) لاقتران متشعب، وتجد ثوابته، وتشتقه.",
                "Evaluate definite integrals with an antiderivative (with substitution and parts), build the integral function T(x) of a piecewise function, find its constants and differentiate it."),
         key=T(r"$\int_a^b f(x)\,\dd{x}=M(b)-M(a)$ ، $\text{ت}'(x)=f(x)$", r"$\int_a^b f(x)\,\dd{x}=F(b)-F(a)$; $T'(x)=f(x)$"),
         lessons={"5-3": [[176, 180]]}, concepts=["ftc", "integral-function"],
         book_concepts=["u5.ftc_evaluation", "u5.integral_function", "u5.ftc_derivative", "u5.definite_substitution"],
         prereq=["B22", "B18", "B20", "B21"], g11=["g11-trig"]),
    dict(id="B24", unit=5, title=T("خصائص التكامل المحدود", "Properties of the definite integral"),
         goal=T("تستخدم الخطية وعكس الحدود وتجزئة الفترة والإزاحة، وتكامل القيمة المطلقة والمتشعب وأكبر عدد صحيح، وتقارن التكاملات وتحدّها دون حسابها.",
                "Use linearity, reversed limits, interval splitting and shifts, integrate absolute-value, piecewise and greatest-integer functions, and compare or bound integrals without evaluating them."),
         key=T(r"$\int_a^b f=-\int_b^a f$ ، $\int_a^b f=\int_a^c f+\int_c^b f$", r"$\int_a^b f=-\int_b^a f$ and $\int_a^b f=\int_a^c f+\int_c^b f$"),
         lessons={"5-4": [[181, 188]]}, concepts=["def-integral-props", "integral-piecewise"],
         book_concepts=["u5.basic_properties", "u5.positivity", "u5.comparison", "u5.additivity", "u5.piecewise_integral", "u5.integral_function_piecewise", "u5.definite_techniques"],
         prereq=["B23"], g11=["g11-equations", "g11-functions"]),
    dict(id="B25", unit=5, title=T("المساحة والحجم", "Area and volume"),
         goal=T("تحسب المساحة بين منحنى ومحور السينات وبين منحنيين، وحجم الجسم الناتج من دوران منطقة حول محور السينات.",
                "Compute areas between a curve and the x-axis and between curves, and volumes of solids of revolution about the x-axis."),
         key=T(r"المساحة $=\int_a^b\big|f(x)-g(x)\big|\,\dd{x}$", r"Area $=\int_a^b\big|f(x)-g(x)\big|\,\dd{x}$"),
         lessons={"5-5": [[189, 199]]}, concepts=["area", "volume"],
         book_concepts=["u5.area_curve_axis", "u5.area_two_curves", "u5.volume_disc", "u5.volume_washer"],
         prereq=["B23", "B24"], g11=["g11-geometry", "g11-equations"]),
    dict(id="B26", unit=6, title=T("الأعداد المركبة", "Complex numbers"),
         goal=T("تتعرّف على العدد ت والعدد المركب، وتجري العمليات عليه (الجمع والضرب والقسمة)، وتجد المقياس والمرافق والصورة القطبية.",
                "Meet i and complex numbers, operate on them (add, multiply, divide), and find the modulus, conjugate and polar form."),
         key=T("ت² = −١ ، (أ + ب ت)(أ − ب ت) = أ² + ب²", "i² = −1, (a + bi)(a − bi) = a² + b²"),
         lessons={"6-1": [[206, 209]], "6-2": [[210, 214]], "6-3": [[215, 220]]}, concepts=["complex"],
         book_concepts=["u6.imaginary_unit", "u6.complex_number", "u6.real_imag_parts", "u6.sqrt_negative", "u6.powers_of_i", "u6.equality", "u6.add_sub",
                        "u6.multiplication", "u6.operation_properties", "u6.multiplicative_inverse", "u6.modulus", "u6.conjugate", "u6.modulus_conjugate_props",
                        "u6.division", "u6.argand_plane", "u6.polar_form"],
         prereq=[], g11=["g11-quadratics"]),
]
BI = {b["id"]: b for b in BLOCKS}

# patterns of split lessons that do not follow "lesson -> its only block"
PATTERN_BLOCK = {
    "p12-limit": "B05", "p12-piecewise": "B02", "p12-values": "B03", "p12-higher": "B03", "p12-explicit": "B03",
    "p14-lhopital-unknown": "B05", "p14-lhopital": "B05", "p14-explog": "B04",
    "p44-substitution": "B20", "p44-other": "B20", "p44-parts": "B21", "p44-partial": "B21",
}

# radar axes (groups of blocks, book order); unit 6 is not examined and is shown as a note, not an axis
RADAR_AXES = [
    ("R01", T("معدل التغير والمشتقة", "Rates and the derivative"), ["B01", "B02", "B03"]),
    ("R02", T("مشتقات خاصة ولوبيتال", "Special derivatives, L'Hôpital"), ["B04", "B05"]),
    ("R03", T("المماس والحركة", "Tangents and motion"), ["B06"]),
    ("R04", T("السلسلة والاشتقاق الضمني", "Chain rule, implicit"), ["B07", "B08"]),
    ("R05", T("رول والتزايد والقيم القصوى", "Rolle, monotonicity, extrema"), ["B09", "B10", "B11"]),
    ("R06", T("التقعر والتحسين", "Concavity, optimisation"), ["B12", "B13"]),
    ("R07", T("المصفوفات والمحددات", "Matrices, determinants"), ["B14", "B15"]),
    ("R08", T("النظير والأنظمة الخطية", "Inverse, linear systems"), ["B16", "B17"]),
    ("R09", T("التكامل غير المحدود وتطبيقاته", "Indefinite integral, applications"), ["B18", "B19"]),
    ("R10", T("طرق التكامل", "Integration techniques"), ["B20", "B21"]),
    ("R11", T("ريمان والتكامل بالتعريف", "Riemann sums, definition"), ["B22"]),
    ("R12", T("النظرية الأساسية والخصائص والمساحة", "FTC, properties, area"), ["B23", "B24", "B25"]),
]

# ------------------------------------------------------------------------------------------------
# Road map: an ordered route of stops; forks where blocks can run in parallel; milestones at unit ends.
# col/row are abstract grid coordinates for a serpentine layout (row = one unit, direction alternates);
# lane = -1 (upper branch) / 0 (main road) / +1 (lower branch) at forks.
# ------------------------------------------------------------------------------------------------
ROUTE_ROWS = [
    # (unit, [ items ]) item = block id | ("fork", [upper, lower]) | ("milestone", id, ar, en)
    (1, ["B01", "B02", "B03", "B04", ("fork", ["B05", "B06"]), "B07", "B08", ("milestone", "M1", "نهاية الوحدة الأولى", "End of unit 1")]),
    (2, [("fork", ["B09", "B10"]), "B11", "B12", "B13", ("milestone", "M2", "الورقة الأولى مكتملة", "Paper 1 scope complete")]),
    (3, ["B14", "B15", "B16", "B17", ("milestone", "M3", "نهاية الوحدة الثالثة", "End of unit 3")]),
    (4, ["B18", ("fork", ["B19", "B20"]), "B21", ("milestone", "M4", "نهاية الوحدة الرابعة", "End of unit 4")]),
    (5, ["B22", "B23", "B24", "B25", ("milestone", "M5", "الورقة الثانية مكتملة", "Paper 2 scope complete")]),
    (6, ["B26", ("milestone", "M6", "الكتاب كاملاً", "Whole book")]),
]


def load_labels():
    lab = {}
    for path in glob.glob(os.path.join(CONTENT, "exams", "*.json")):
        d = json.load(open(path, encoding="utf-8"))
        its = d["items"] if isinstance(d.get("items"), list) else [it for q in d["questions"] for it in q["items"]]
        for it in its:
            p = it["paraphrase"]
            lab[(d["id"], it["id"])] = {"label_ar": it.get("label_ar"), "label_en": it.get("label"), "page": it.get("page"),
                                        "paraphrase_ar": p.get("ar") if isinstance(p, dict) else None,
                                        "paraphrase_en": p.get("en") if isinstance(p, dict) else p}
    return lab


def split_primary(keys, primary_only=False):
    if not keys:
        return {}
    if len(keys) == 1 or primary_only:
        return {keys[0]: 1.0}
    out = {keys[0]: 0.5}
    for k in keys[1:]:
        out[k] = out.get(k, 0) + 0.5 / (len(keys) - 1)
    return out


def block_weights(primary_only=False):
    lesson_blocks = defaultdict(dict)  # lesson -> block -> concepts
    for b in BLOCKS:
        for l in b["lessons"]:
            lesson_blocks[l][b["id"]] = b["concepts"]
    items = A["items"]
    # global split ratio for split lessons
    ratio = {}
    for l, bc in lesson_blocks.items():
        if len(bc) == 1:
            continue
        acc = Counter()
        for it in items:
            if l in it["lessons"]:
                hits = [bid for bid, cs in bc.items() if any(c in it["concepts"] for c in cs)]
                for bid in hits:
                    acc[bid] += it["eff"] / len(hits)
        tot = sum(acc.values())
        ratio[l] = {bid: acc[bid] / tot for bid in bc}

    def item_blocks(it):
        """Block attribution of one exam item as fractions summing to 1 (the same rule the radar uses)."""
        out = Counter()
        for l, f in split_primary(it["lessons"], primary_only).items():
            bc = lesson_blocks[l]
            if len(bc) == 1:
                out[next(iter(bc))] += f
                continue
            hits = [bid for bid, cs in bc.items() if any(c in it["concepts"] for c in cs)]
            if hits:
                for bid in hits:
                    out[bid] += f / len(hits)
            else:
                for bid, r in ratio[l].items():
                    out[bid] += f * r
        return out

    def alloc(group):
        out = Counter()
        tot = sum(it["eff"] for it in group)
        for it in group:
            for bid, f in item_blocks(it).items():
                out[bid] += it["eff"] * f
        return {b["id"]: round(100 * out.get(b["id"], 0) / tot, 2) for b in BLOCKS}

    res = {"overall": alloc(items)}
    for y in YEARS:
        res[y] = alloc([i for i in items if i["paper"].startswith(y)])
    for t, key in (("p1", "-p1"), ("p2", "-p2")):
        res[t] = alloc([i for i in items if i["paper"].endswith(key)])
    res["combined"] = alloc([i for i in items if "-s3" in i["paper"]])
    res["items"] = OrderedDict((f'{it["paper"]}#{it["item"]}', OrderedDict((bid, round(f, 4)) for bid, f in sorted(item_blocks(it).items(), key=lambda kv: -kv[1])))
                               for it in items)
    return res, ratio


def pages_count(spans):
    return sum(b - a + 1 for a, b in spans)


def main():
    labels = load_labels()
    bw, split_ratio = block_weights()
    bw_primary = block_weights(primary_only=True)[0]["overall"]  # sensitivity: each item counted for its main lesson only
    for k, v in bw.items():
        if k == "items":
            continue
        assert abs(sum(v.values()) - 100) < 0.3, (k, sum(v.values()))
    # the per-item block map must reproduce the radar weights
    assert len(bw["items"]) == len(A["items"])
    chk = Counter()
    for it in A["items"]:
        fr = bw["items"][f'{it["paper"]}#{it["item"]}']
        assert abs(sum(fr.values()) - 1) < 0.002, (it["paper"], it["item"], fr)
        for bid, f in fr.items():
            chk[bid] += it["eff"] * f
    tot_eff = sum(it["eff"] for it in A["items"])
    for bid, w in bw["overall"].items():
        assert abs(100 * chk[bid] / tot_eff - w) < 0.02, (bid, 100 * chk[bid] / tot_eff, w)

    lessons_meta = {}
    for path in sorted(glob.glob(os.path.join(CONTENT, "book", "u*.json"))):
        d = json.load(open(path, encoding="utf-8"))
        for l in d["lessons"]:
            bn = json.dumps(l.get("branch_note") or l.get("branch_notes") or l.get("branch_marking"), ensure_ascii=False)
            lessons_meta[l["id"]] = {"title": l["title"], "printed_pages": l["printed_pages"], "unit": d["unit"],
                                     "scientific_only": ("للعلمي فقط" in bn and "partial" not in bn and "Part 2" not in bn) or bn == '"scientific_only"',
                                     "scientific_only_part": ("partial" in bn or "Part 2" in bn)}
    units_meta = []
    for path in sorted(glob.glob(os.path.join(CONTENT, "book", "u*.json"))):
        d = json.load(open(path, encoding="utf-8"))
        units_meta.append({"unit": d["unit"], "title": d["title"], "printed_pages": d["printed_pages"],
                           "lessons": [l["id"] for l in d["lessons"]]})

    # book concept coverage check: every book concept belongs to exactly one block
    allb = [c for l in A["canonical_concepts"].values() for c in l["book_concepts"]]
    inblocks = Counter(c for b in BLOCKS for c in b["book_concepts"])
    missing = [c for c in allb if c not in inblocks]
    dup = [c for c, n in inblocks.items() if n > 1]
    assert not missing and not dup, (missing, dup)

    # patterns grouped by block
    pat_by_block = defaultdict(list)
    lesson_block = {}
    for b in BLOCKS:
        for l in b["lessons"]:
            lesson_block.setdefault(l, []).append(b["id"])
    for lid, rows in A["patterns"].items():
        for r in rows:
            bid = PATTERN_BLOCK.get(r["id"]) or lesson_block[lid][0]
            ex = []
            for e in r["examples"][:4]:
                lb = labels[(e["paper"], e["item"])]
                ex.append({"paper": e["paper"], "item": e["item"], "page": e["page"], "label_ar": lb["label_ar"], "label_en": lb["label_en"]})
            pat_by_block[bid].append({"id": r["id"], "lesson": lid, "title": T(r["ar"], r["en"]), "items": r["items"], "papers": r["papers"],
                                      "years": r["years"], "share": r["share"], "formats": r["formats"], "typical_marks": r["typical_marks_printed"],
                                      "examples": ex, "refs": r["all_refs"]})
    for bid in pat_by_block:
        pat_by_block[bid].sort(key=lambda p: -p["share"])

    conc = A["canonical_concepts"]
    freq_c = A["frequency"]["concepts"]

    blocks_out = []
    for b in BLOCKS:
        pages = sum(pages_count(s) for s in b["lessons"].values())
        pats = pat_by_block.get(b["id"], [])
        w = bw["overall"][b["id"]]
        # study-time estimate: 15 min per book page (read + worked examples) + 20 min per recurring exam
        # pattern (targeted practice) + 6 min per 1% of exam weight (extra past-paper practice); 0.5 h steps
        minutes = pages * 15 + len(pats) * 20 + w * 6
        hours = max(1.0, round(minutes / 30) / 2)
        sci = [l for l in b["lessons"] if lessons_meta[l]["scientific_only"]]
        sci_part = [l for l in b["lessons"] if lessons_meta[l]["scientific_only_part"]]
        cover = [freq_c[c]["coverage"] for c in b["concepts"]]
        blocks_out.append(OrderedDict([
            ("id", b["id"]), ("unit", b["unit"]), ("title", b["title"]), ("goal", b["goal"]), ("key_idea", b["key"]),
            ("book", [{"lesson": l, "lesson_title": lessons_meta[l]["title"], "pages": s} for l, s in b["lessons"].items()]),
            ("book_pages_total", pages),
            ("concepts", [{"id": c, "title": T(conc[c]["ar"], conc[c]["en"]), "home_lesson": conc[c]["lesson"], "share": A["overall"]["concepts"][c],
                           "papers": freq_c[c]["papers_in_scope_present"], "papers_in_scope": freq_c[c]["papers_in_scope"],
                           "coverage": freq_c[c]["coverage"], "years": freq_c[c]["years"]} for c in b["concepts"]]),
            ("book_concepts", b["book_concepts"]),
            ("prerequisites", {"blocks": b["prereq"], "grade11": b["g11"]}),
            ("exam", OrderedDict([
                ("weight", w), ("weight_paper1", bw["p1"][b["id"]]), ("weight_paper2", bw["p2"][b["id"]]),
                ("weight_by_year", {y: bw[y][b["id"]] for y in YEARS}),
                ("tested_every_year", all(bw[y][b["id"]] > 0 for y in YEARS)),
                ("max_concept_coverage", max(cover) if cover else 0),
                ("paper", "p1" if b["unit"] <= 2 else ("p2" if b["unit"] <= 5 else None)),
                ("examined", w > 0),
            ])),
            ("patterns", [p["id"] for p in pats]),
            ("study_hours", hours),
            ("scientific_only", {"lessons": sci, "partly": sci_part}),
        ]))
    BO = {b["id"]: b for b in blocks_out}
    # what each block unlocks: all blocks that depend on it, directly or not, and their exam weight
    dependents = defaultdict(set)
    for b in BLOCKS:
        for p in b["prereq"]:
            dependents[p].add(b["id"])

    def downstream(k, seen):
        for d in dependents[k]:
            if d not in seen:
                seen.add(d)
                downstream(d, seen)
        return seen

    for b in blocks_out:
        ds = sorted(downstream(b["id"], set()))
        b["exam"]["unlocks"] = {"blocks": ds, "weight": round(sum(BO[x]["exam"]["weight"] for x in ds), 2)}
    ranks = sorted(blocks_out, key=lambda x: -x["exam"]["weight"])
    for i, b in enumerate(ranks):
        b["exam"]["rank"] = i + 1

    # dependency graph
    edges = []
    for b in BLOCKS:
        for p in b["prereq"]:
            edges.append({"from": p, "to": b["id"], "kind": "block"})
        for g in b["g11"]:
            edges.append({"from": g, "to": b["id"], "kind": "grade11"})
    # cross-unit links worth showing on the map (shortcuts)
    # topological check
    order = [b["id"] for b in BLOCKS]
    pos = {k: i for i, k in enumerate(order)}
    for e in edges:
        if e["kind"] == "block":
            assert pos[e["from"]] < pos[e["to"]], e

    # route layout
    nodes, redges = [], []
    nodes.append({"id": "START", "kind": "start", "row": 0, "col": -1, "lane": 0, "title": T("ما قبل الكتاب: مهارات الصف الحادي عشر", "Before the book: Grade-11 skills"),
                  "grade11": list(G11)})
    prev_tail = ["START"]
    seq = 0
    for row_i, (unit, row) in enumerate(ROUTE_ROWS):
        col = 0
        direction = 1 if row_i % 2 == 0 else -1
        for item in row:
            if isinstance(item, str):
                seq += 1
                b = BO[item]
                nodes.append({"id": item, "kind": "stop", "block": item, "unit": unit, "row": row_i, "col": col, "lane": 0, "seq": seq,
                              "weight": b["exam"]["weight"], "hours": b["study_hours"], "examined": b["exam"]["examined"]})
                for t in prev_tail:
                    redges.append({"from": t, "to": item, "kind": "merge" if len(prev_tail) > 1 else "road"})
                prev_tail = [item]
                col += 1
            elif item[0] == "fork":
                tails = []
                for lane, bid in zip((-1, 1), item[1]):
                    seq += 1
                    b = BO[bid]
                    nodes.append({"id": bid, "kind": "stop", "block": bid, "unit": unit, "row": row_i, "col": col, "lane": lane, "seq": seq,
                                  "weight": b["exam"]["weight"], "hours": b["study_hours"], "examined": b["exam"]["examined"], "parallel_with": [x for x in item[1] if x != bid]})
                    for t in prev_tail:
                        redges.append({"from": t, "to": bid, "kind": "fork"})
                    tails.append(bid)
                prev_tail = tails
                col += 1
            else:
                _, mid, ar, en = item
                unit_blocks = [b["id"] for b in blocks_out if b["unit"] == unit]
                uw = round(sum(BO[x]["exam"]["weight"] for x in unit_blocks), 2)
                nodes.append({"id": mid, "kind": "milestone", "unit": unit, "row": row_i, "col": col, "lane": 0, "title": T(ar, en),
                              "unit_weight": uw, "blocks": unit_blocks, "paper": {"M2": "p1", "M5": "p2"}.get(mid)})
                for t in prev_tail:
                    redges.append({"from": t, "to": mid, "kind": "merge" if len(prev_tail) > 1 else "road"})
                prev_tail = [mid]
                col += 1
        for n in nodes:
            if n.get("row") == row_i and n["id"] != "START":
                n["dir"] = direction
    # unit 6 hangs off as a detour (not examined); unit 3 can start any time (shortcut from START)
    for e in redges:
        if e["to"] == "B26":
            e["kind"] = "detour"
    redges.append({"from": "START", "to": "B14", "kind": "shortcut", "note": T("المصفوفات لا تعتمد على التفاضل: يمكن البدء بها في أي وقت", "Matrices do not depend on calculus: start them any time")})
    redges.append({"from": "START", "to": "B22", "kind": "shortcut", "note": T("التجزئة ومجموع ريمان يحتاجان رمز Σ فقط", "Partitions and Riemann sums only need Σ notation")})
    nodes.append({"id": "FINISH", "kind": "finish", "title": T("جاهز للامتحان", "Exam ready"), "row": len(ROUTE_ROWS) - 1, "col": 2, "lane": 0})
    redges.append({"from": "M5", "to": "FINISH", "kind": "road"})
    redges.append({"from": "M6", "to": "FINISH", "kind": "detour"})

    # radar
    radar_axes = []
    for rid, title, bl in RADAR_AXES:
        ax = {"id": rid, "title": title, "blocks": bl}
        for key in ["overall", "p1", "p2", "combined"] + YEARS:
            ax[key] = round(sum(bw[key][x] for x in bl), 2)
        radar_axes.append(ax)
    # item frequency (share of items mode): every exam item has one pattern, every pattern belongs to one block
    pat_block = {p["id"]: bid for bid, pats in pat_by_block.items() for p in pats}
    freq_block, freq_total = defaultdict(Counter), Counter()
    for it in A["items"]:
        y = it["paper"][:4]
        freq_block[pat_block[it["pattern"]]][y] += 1
        freq_block[pat_block[it["pattern"]]]["a"] += 1
        freq_total[y] += 1
        freq_total["a"] += 1
    for ax in radar_axes:
        ax["freq"] = {k: sum(freq_block[x][k] for x in ax["blocks"]) for k in ["a"] + YEARS}
    assert sum(ax["freq"]["a"] for ax in radar_axes) == freq_total["a"] == len(A["items"])
    for key in ["overall", "p1", "p2"] + YEARS:
        s = sum(a[key] for a in radar_axes)
        assert abs(s - 100) < 0.3, (key, s)
    radar = {
        "axes": radar_axes,
        "series": [
            {"id": "overall", "title": T("كل الأوراق ٢٠٢٢–٢٠٢٥", "All papers 2022–2025")},
            {"id": "p1", "title": T("الورقة الأولى (الوحدتان ١–٢)", "Paper 1 (units 1–2)")},
            {"id": "p2", "title": T("الورقة الثانية (الوحدات ٣–٥)", "Paper 2 (units 3–5)")},
        ] + [{"id": y, "title": T(f"سنة {y}", f"Year {y}")} for y in YEARS],
        "units": {u: A["overall"]["units"][u] for u in A["overall"]["units"]},
        "units_by_paper": {t: A["by_paper_type"][t]["units"] for t in ("p1", "p2", "combined")},
        "units_by_year": {y: A["by_year"][y]["units"] for y in YEARS},
        "freq_total": {k: freq_total[k] for k in ["a"] + YEARS},
        "freq_units": {str(u["unit"]): {k: sum(freq_block[b["id"]][k] for b in blocks_out if b["unit"] == u["unit"]) for k in ["a"] + YEARS} for u in units_meta},
        "note": T("الوحدة السادسة (الأعداد المركبة) لم تَرِد في أي من أوراق ٢٠٢٢–٢٠٢٥ العشرين.",
                  "Unit 6 (complex numbers) did not appear in any of the 20 papers of 2022–2025."),
        "method": T("النسبة = العلامة المتوقعة للبند بعد احتساب قاعدة الاختيار (السؤال الاختياري يُضرب في نسبة ما يُجاب عنه)، موزعة على الدروس ثم على الكتل.",
                    "Share = each item's expected marks after the choice rule (an optional question counts by the fraction answered), spread over lessons, then blocks."),
    }

    # ------------------------------------------------------------------------------------------
    # Highlights (plain-language findings shown on the subject home)
    # ------------------------------------------------------------------------------------------
    hl = A["highlights"]
    # one decimal, as the radar labels print them (course-ui.js pct1)
    us = {u: f"{v:.1f}" for u, v in hl["unit_shares"].items()}
    trend = A["trends"]["lessons"]
    top_blocks = [b["id"] for b in ranks[:5]]
    highlights = [
        {"id": "h-papers", "kind": "structure",
         "text": T("كل دورة فيها ورقتان: الأولى للتفاضل وتطبيقاته (الوحدتان ١–٢) والثانية للمصفوفات والتكامل (٣–٥)، والدورة الثالثة ورقة واحدة من ٢٠٠ تغطي الوحدات ١–٥.",
                   "Each session has two papers: paper 1 is differentiation and its applications (units 1–2), paper 2 is matrices and integration (3–5); the third session is one 200-mark paper on units 1–5.")},
        {"id": "h-unit6", "kind": "scope",
         "text": T("الأعداد المركبة (الوحدة السادسة) لم تظهر في أي ورقة من الأوراق العشرين، وكذلك حجم الجسم الدوراني.",
                   "Complex numbers (unit 6) appeared in none of the 20 papers, and neither did volumes of revolution.")},
        {"id": "h-units", "kind": "weight",
         "text": T(f"توزيع العلامات المتوقعة: الوحدة ١ {us['1']}٪، الوحدة ٢ {us['2']}٪، الوحدة ٣ {us['3']}٪، الوحدة ٤ {us['4']}٪، الوحدة ٥ {us['5']}٪.",
                   f"Expected marks by unit: unit 1 {us['1']}%, unit 2 {us['2']}%, unit 3 {us['3']}%, unit 4 {us['4']}%, unit 5 {us['5']}%.")},
        {"id": "h-top", "kind": "weight", "blocks": top_blocks,
         "primary_only": {x: bw_primary[x] for x in top_blocks},
         "text": T("أثقل الكتل وزناً: " + "، ".join(f"{BO[x]['title']['ar']} ({BO[x]['exam']['weight']}٪)" for x in top_blocks) + "."
                   + "".join(f" وزن «{BO[x]['title']['ar']}» مرتفع جزئياً لأن مهاراتها تظهر خطوةً داخل أسئلة كثيرة من دروس أخرى؛ إذا احتُسب الدرس الرئيسي لكل سؤال فقط يصبح وزنها {bw_primary[x]}٪."
                             for x in top_blocks if bw_primary[x] < 0.75 * BO[x]['exam']['weight']),
                   "Heaviest blocks: " + ", ".join(f"{BO[x]['title']['en']} ({BO[x]['exam']['weight']}%)" for x in top_blocks) + "."
                   + "".join(f" The block “{BO[x]['title']['en']}” ranks high partly because these skills appear as a step inside many questions from other lessons; counting only each question's main lesson gives {bw_primary[x]}%."
                             for x in top_blocks if bw_primary[x] < 0.75 * BO[x]['exam']['weight']))},
        {"id": "h-always", "kind": "frequency", "concepts": hl["always_tested_full_coverage"],
         "text": T("مفاهيم ظهرت في كل ورقة شملت وحدتها: " + "، ".join(conc[c]["ar"] for c in hl["always_tested_full_coverage"]) + ".",
                   "Concepts in every paper that covered their unit: " + ", ".join(conc[c]["en"] for c in hl["always_tested_full_coverage"]) + ".")},
        {"id": "h-mcq", "kind": "format",
         "text": T(f"الاختيار من متعدد = {hl['format_share_overall']['mcq']}٪ من العلامات، والأسئلة المقالية الطويلة {hl['format_share_overall']['long']}٪، والبرهان {hl['format_share_overall']['proof']}٪.",
                   f"Multiple choice is {hl['format_share_overall']['mcq']}% of the marks, long written answers {hl['format_share_overall']['long']}%, proofs {hl['format_share_overall']['proof']}%.")},
        {"id": "h-rolle", "kind": "trend", "blocks": ["B09"],
         "text": T(f"نظريتا رول والقيمة المتوسطة: {trend['2-1']['by_year'][0]}٪ ثم {trend['2-1']['by_year'][1]}٪ ثم {trend['2-1']['by_year'][2]}٪، ولم تظهرا إطلاقاً في ٢٠٢٥.",
                   f"Rolle and the mean value theorem: {trend['2-1']['by_year'][0]}%, {trend['2-1']['by_year'][1]}%, {trend['2-1']['by_year'][2]}%, then absent in 2025.")},
        {"id": "h-techniques", "kind": "trend", "blocks": ["B20", "B21"],
         "text": T(f"طرق التكامل (٤-٤) أثقل درس في الكتاب لكن وزنها يتراجع: {trend['4-4']['by_year'][0]}٪ ← {trend['4-4']['by_year'][3]}٪، بينما يرتفع الاقتران المكامل والنظرية الأساسية (٥-٣): {trend['5-3']['by_year'][0]}٪ ← {trend['5-3']['by_year'][3]}٪.",
                   f"Integration techniques (4-4) is the heaviest lesson but falling: {trend['4-4']['by_year'][0]}% → {trend['4-4']['by_year'][3]}%, while the FTC and integral function (5-3) rises: {trend['5-3']['by_year'][0]}% → {trend['5-3']['by_year'][3]}%.")},
        {"id": "h-definition", "kind": "pattern", "blocks": ["B22"],
         "text": T("سؤال «احسب التكامل المحدود لاقتران خطي باستخدام التعريف» تكرر في كل سنة من ٢٠٢٢ إلى ٢٠٢٥ بالصيغة نفسها تقريباً (٦ مرات، ٧–١٦ علامة).",
                   "\"Evaluate the definite integral of a linear function from the definition\" recurred every year 2022–2025 in almost the same form (6 times, 7–16 marks).")},
        {"id": "h-optim", "kind": "pattern", "blocks": ["B13"],
         "text": T("مسألة تحسين كاملة (مستطيل محاط، سياج أو سلك، صندوق) حاضرة في كل ورقة أولى وكل ورقة دورة ثالثة.",
                   "A full optimisation problem (inscribed rectangle, fence or wire, box) is in every paper 1 and every third-session paper.")},
    ]

    # ------------------------------------------------------------------------------------------
    # Pilot block plan (B07 chain rule)
    # ------------------------------------------------------------------------------------------
    def refs_for(pattern_ids, limit=None, extra=()):
        out = []
        for lid, rows in A["patterns"].items():
            for r in rows:
                if r["id"] in pattern_ids:
                    for p, iid, pg in r["all_refs"]:
                        lb = labels[(p, iid)]
                        out.append({"paper": p, "item": iid, "page": pg, "label_ar": lb["label_ar"], "label_en": lb["label_en"],
                                    "pattern": r["id"], "about_en": lb["paraphrase_en"]})
        seen = {(r["paper"], r["item"]) for r in out}
        for p, iid in extra:
            if (p, iid) in seen:
                continue
            lb = labels[(p, iid)]
            out.append({"paper": p, "item": iid, "page": lb["page"], "label_ar": lb["label_ar"], "label_en": lb["label_en"],
                        "pattern": None, "about_en": lb["paraphrase_en"]})
        out.sort(key=lambda r: (-int(r["paper"][:4]), r["paper"], r["item"]))
        return out[:limit] if limit else out

    chain_items = [i for i in A["items"] if "chain-rule" in i["concepts"]]
    pilot = OrderedDict([
        ("block", "B07"),
        ("title", BI["B07"]["title"]),
        ("why", OrderedDict([
            ("weight", BO["B07"]["exam"]["weight"]),
            ("rank", BO["B07"]["exam"]["rank"]),
            ("coverage", freq_c["chain-rule"]["coverage"]),
            ("items_tagged", len(chain_items)),
            ("most_tagged_concept", Counter(c for i in A["items"] for c in i["concepts"]).most_common(1)[0]),
            ("unlocks", BO["B07"]["exam"]["unlocks"]),
            ("weight_paper1", BO["B07"]["exam"]["weight_paper1"]),
            ("papers_tagged", len({i["paper"] for i in chain_items})),
            ("text", T(
                f"قاعدة السلسلة ظهرت في كل ورقة أولى وكل ورقة دورة ثالثة ({freq_c['chain-rule']['papers']} ورقة، {len(chain_items)} بنداً)، وهي أكثر مفهوم يتكرر في الأوراق كلها لأنها تدخل في الاشتقاق الضمني والتزايد والقيم القصوى والتقعر، ثم في التكامل بالتعويض. "
                f"وزن درسها {BO['B07']['exam']['weight']}٪ من العلامات ({BO['B07']['exam']['weight_paper1']}٪ من الورقة الأولى)، وتعتمد عليها {len(BO['B07']['exam']['unlocks']['blocks'])} كتلة وزنها معاً {BO['B07']['exam']['unlocks']['weight']}٪. "
                "الدرس قصير (٥ صفحات) فيمكن تأليفه كاملاً، وأنماط أسئلته تمثل أسلوب الامتحان كله: اقترانات مجهولة معطاة بقيم، اختيار من متعدد سريع، وإثباتات قصيرة.",
                f"The chain rule is in every paper 1 and every third-session paper ({freq_c['chain-rule']['papers']} papers, {len(chain_items)} items) and is the most frequently tagged concept overall, because implicit differentiation, monotonicity, extrema and concavity, and later substitution, all run through it. "
                f"Its own lesson carries {BO['B07']['exam']['weight']}% of the marks ({BO['B07']['exam']['weight_paper1']}% of paper 1), and {len(BO['B07']['exam']['unlocks']['blocks'])} blocks worth {BO['B07']['exam']['unlocks']['weight']}% depend on it. "
                "The lesson is short (5 pages) so it can be authored completely, and its question patterns represent the whole exam's style: unknown functions given by values, quick multiple choice, short proofs.")),
        ])),
        ("book", {"lesson": "1-6", "pages": [37, 41], "related": [{"lesson": "1-7", "pages": [44, 44], "why": T("قاعدة القوة النسبية تمدّد قاعدة القوة العامة", "The rational power rule extends the general power rule")}]}),
        ("lessons", [
            OrderedDict([
                ("id", "B07-L1"), ("order", 1),
                ("title", T("اقتران داخل اقتران: قاعدة السلسلة", "A function inside a function: the chain rule")),
                ("minutes", 35),
                ("book_refs", [{"lesson": "1-6", "pages": [37, 38], "items": ["نشاط 1", "تمهيد", "مثال 1", "مثال 2"]}]),
                ("objectives", [
                    T("تفكك الاقتران المركّب إلى اقتران خارجي وداخلي.", "Split a composite function into an outer and an inner function."),
                    T("تطبق (ق∘هـ)َ(س) = قَ(هـ(س)) × هـَ(س) وتفهم لماذا تُحسب قَ عند هـ(س).", "Apply (f∘g)'(x) = f'(g(x))·g'(x) and see why f' is taken at g(x)."),
                    T("تستخدم الصورة دص/دس = دص/دع × دع/دس.", "Use the form dy/dx = dy/du · du/dx."),
                ]),
                ("concept_order", ["composition recap (f∘g)(x) = f(g(x)), range of g ⊆ domain of f", "rates multiply along a chain (gears, book activity 1)",
                                   "chain rule statement and conditions (p37)", "Leibniz form", "evaluating at a point: g(a) first, then f'(g(a))"]),
                ("analogy", T("المسنّنات (نشاط ١ في الكتاب): إذا دار الأزرق مرة دار الأحمر ٤/٣ مرة، وإذا دار الأحمر مرة دار الأصفر نصف مرة، فالمعدلات تُضرب على طول السلسلة.",
                              "Gears (book activity 1): if blue turns once red turns 4/3, and if red turns once yellow turns 1/2, so rates multiply along the chain.")),
                ("visual", {"kind": "interactive", "id": "chain-zoom",
                            "spec": T("ثلاثة خطوط أعداد س ← ع = هـ(س) ← ص = ق(ع)؛ مقطع صغير حول س يتمدد بعامل هـَ(س) ثم بعامل قَ(ع)؛ منزلق لتغيير س ويظهر حاصل الضرب.",
                                      "Three number lines x → u = g(x) → y = f(u); a small segment around x is stretched by g'(x), then by f'(u); a slider moves x and shows the product."),
                            "alt": T("رسم يوضح أن معامل التمدد الكلي هو حاصل ضرب معاملي التمدد.", "Diagram showing the total stretch factor is the product of the two stretch factors.")}),
                ("patterns", ["p16-composition", "p16-direct"]),
                ("worked_examples_plan", [
                    T("مستوى ١: ق = س³ + س ، هـ = س² : (ق∘هـ)َ(س) (مثال ١ في الكتاب).", "Level 1: f = x³ + x, g = x²: (f∘g)'(x) (book example 1)."),
                    T("مستوى ٢: (هـ∘هـ)َ(٢) = هـَ(هـ(٢)) × هـَ(٢) وليس (هـَ(٢))².", "Level 2: (g∘g)'(2) = g'(g(2))·g'(2), not g'(2)²."),
                    T("مستوى ٣ (نمط امتحاني): (ق∘هـ)َ(أ) معطاة، أوجد ثابتاً مجهولاً داخل هـ.", "Level 3 (exam pattern): (f∘g)'(a) is given, find an unknown constant inside g."),
                ]),
                ("mistakes", ["inner-at-x", "missing-inner", "order-swapped"]),
                ("exercises_outline", {"count": 6, "mix": T("٢ اختيار من متعدد (قيمة (ق∘هـ)َ عند نقطة)، ٢ حساب لاقترانات صريحة، ١ إيجاد ثابت، ١ بصيغة لايبنتز",
                                                             "2 MCQ (value of (f∘g)' at a point), 2 explicit computations, 1 find a constant, 1 Leibniz form")}),
            ]),
            OrderedDict([
                ("id", "B07-L2"), ("order", 2),
                ("title", T("الخارج أولاً ثم الداخل: القوى والمثلثية والأسية", "Outside first, then inside: powers, trig and exponentials")),
                ("minutes", 35),
                ("book_refs", [{"lesson": "1-6", "pages": [39, 40], "items": ["نتيجة", "نشاط 2", "مثال 4", "مثال 6"]}, {"lesson": "1-7", "pages": [44, 44], "items": ["قاعدة القوة النسبية"]}]),
                ("objectives", [
                    T("تطبق قاعدة القوة العامة (هـ(س))ⁿ.", "Apply the general power rule to (g(x))ⁿ."),
                    T("تشتق هـ^ك(س) و لـو_هـ ك(س) (ك(س) > ٠) والاقترانات المثلثية لزاوية داخلية.", "Differentiate e^{k(x)}, ln k(x) (k(x) > 0) and trig functions of an inner angle."),
                    T("تجمع قاعدة السلسلة مع قاعدتي الضرب والقسمة.", "Combine the chain rule with the product and quotient rules."),
                ]),
                ("concept_order", ["general power corollary (integer n, p39)", "trig of an inner function (sec x + tan x)ⁿ (activity 2)",
                                   "e^{k(x)} and ln k(x), k(x) > 0 (p40)", "roots as powers (preview of the rational power rule, p44)", "chain + product/quotient (example 4)"]),
                ("analogy", T("تقشير البصلة: اشتق الطبقة الخارجية وأبقِ ما بداخلها كما هو، ثم اضرب في مشتقة الطبقة التالية، حتى تصل إلى س.",
                              "Peeling an onion: differentiate the outer layer keeping its inside untouched, multiply by the derivative of the next layer, until you reach x.")),
                ("visual", {"kind": "svg", "id": "chain-layers",
                            "spec": T("صناديق متداخلة لـ جا³(٢س): مكعب ← جا ← ٢س، وتحت كل صندوق مشتقته، والسهم يضربها.",
                                      "Nested boxes for sin³(2x): cube → sin → 2x, each box's derivative underneath, an arrow multiplying them."),
                            "alt": T("ثلاث طبقات متداخلة ومشتقاتها تُضرب.", "Three nested layers whose derivatives are multiplied.")}),
                ("patterns", ["p16-direct"]),
                ("worked_examples_plan", [
                    T("مستوى ١: ص = جتا³(٢س).", "Level 1: y = cos³(2x)."),
                    T("مستوى ٢: ق = ((س + ١)/(س − ١))⁵ : قَ(٢) (مثال ٤).", "Level 2: f = ((x+1)/(x−1))⁵: f'(2) (book example 4)."),
                    T("مستوى ٣: ص = هـ^جتا س ثم ص = لـو_هـ س² وإثبات صً × هـ^ص = −٢ (مثال ٦).", "Level 3: y = e^{cos x}, then y = ln x² and prove y''·e^y = −2 (book example 6)."),
                ]),
                ("mistakes", ["missing-inner", "power-on-wrong-part", "ln-domain", "trig-sign"]),
                ("exercises_outline", {"count": 7, "mix": T("٣ اختيار من متعدد سريع، ٣ حساب عند نقطة، ١ إثبات قصير", "3 quick MCQ, 3 evaluate at a point, 1 short proof")}),
            ]),
            OrderedDict([
                ("id", "B07-L3"), ("order", 3),
                ("title", T("عندما لا تعرف الاقتران: قيم ومعادلات ونهايات", "When the function is unknown: values, equations and limits")),
                ("minutes", 40),
                ("book_refs", [{"lesson": "1-6", "pages": [38, 41], "items": ["مثال 3", "تمارين 1-6: 2، 4، 5، 8"]}]),
                ("objectives", [
                    T("تحسب مشتقة اقتران مجهول من جدول قيم ق، قَ، هـ، هـَ.", "Compute derivatives of unknown functions from a table of f, f', g, g' values."),
                    T("تشتق طرفي معادلة مثل ق(٢س + ١) = … لإيجاد قَ عند نقطة، وتختار س المناسبة.", "Differentiate both sides of an equation like f(2x + 1) = … to find f' at a point, choosing the right x."),
                    T("تتعرّف على النهاية التي هي مشتقة اقتران مركّب.", "Recognise a limit that is the derivative of a composite."),
                ]),
                ("concept_order", ["reading a value table", "f(g(x)) = expression: differentiate both sides, solve g(x) = target", "tangent line with an abstract f inside (example 3)",
                                   "f²(x) versus f(x²)", "limits as derivatives (exercise 8)"]),
                ("analogy", T("محقق الجدول: لكل قيمة تحتاج أن تسأل «عند أي مدخل؟». قَ تُقرأ عند هـ(أ) لا عند أ.",
                              "Table detective: for every value ask \"at which input?\". f' is read at g(a), not at a.")),
                ("visual", {"kind": "interactive", "id": "chain-table",
                            "spec": T("جدول قيم مع أسهم تُضيء: أ ← هـ(أ) ← قَ(هـ(أ))؛ يختار الطالب الخلية الصحيحة قبل الحساب.",
                                      "A value table with highlighted arrows a → g(a) → f'(g(a)); the student picks the right cell before computing."),
                            "alt": T("جدول قيم ومسار القراءة الصحيح.", "Value table and the correct reading path.")}),
                ("patterns", ["p16-inner", "p16-composition", "p16-limit"]),
                ("worked_examples_plan", [
                    T("مستوى ١: ق(س³) = ١/س : أوجد قَ(٨).", "Level 1: f(x³) = 1/x: find f'(8)."),
                    T("مستوى ٢: مماس ص = س ق(س² + ١) عند س = ٢ مع ق(٥) و قَ(٥) (مثال ٣).", "Level 2: tangent to y = x f(x² + 1) at x = 2 given f(5), f'(5) (book example 3)."),
                    T("مستوى ٣ (نمط امتحاني): نهاية على صورة مشتقة (ق∘هـ)² عند ١.", "Level 3 (exam pattern): a limit that is the derivative of (f∘g)² at 1."),
                ]),
                ("mistakes", ["inner-at-x", "square-notation", "substitute-before-differentiating", "wrong-x-for-target"]),
                ("exercises_outline", {"count": 7, "mix": T("٤ اختيار من متعدد (جداول ومعادلات)، ٢ قصيرة، ١ طويلة بنمط امتحان", "4 MCQ (tables and equations), 2 short, 1 exam-style long")}),
            ]),
            OrderedDict([
                ("id", "B07-L4"), ("order", 4),
                ("title", T("سلاسل بأكثر من حلقة: المتغيرات الوسيطة", "Chains with several links: intermediate variables")),
                ("minutes", 30),
                ("book_refs", [{"lesson": "1-6", "pages": [38, 39], "items": ["مثال 2", "ملاحظة ص39", "مثال 5", "تمارين 1-6: 1ج، 6"]}]),
                ("objectives", [
                    T("تحسب دص/دس عندما تُعطى ص بدلالة ع، و ع بدلالة س (أو بدلالة م).", "Compute dy/dx when y is given in u and u in x (or in a parameter)."),
                    T("تجد قيم المتغيرات الوسيطة عند النقطة المطلوبة قبل التعويض.", "Find the intermediate values at the requested point before substituting."),
                    T("تمدّد القاعدة إلى ثلاث حلقات.", "Extend the rule to three links."),
                ]),
                ("concept_order", ["Leibniz chain dy/du · du/dx", "values of u at the point", "three links dy/dm = dy/du · du/dx · dx/dm (p39)",
                                   "given dt/dx at a point", "bridge to implicit differentiation (B08)"]),
                ("analogy", T("تحويل الوحدات: سنتيمتر لكل كيلومتر = (سنتيمتر لكل متر) × (متر لكل كيلومتر)؛ التحويلات المتتالية تُضرب.",
                              "Unit conversion: centimetres per kilometre = (centimetres per metre) × (metres per kilometre); successive conversions multiply.")),
                ("visual", {"kind": "svg", "id": "chain-links",
                            "spec": T("حلقات سلسلة متصلة ص — ع — س — م، فوق كل وصلة معدلها، والمجموع حاصل الضرب.",
                                      "Linked chain y — u — x — m with each link's rate above it and the product as the total."),
                            "alt": T("سلسلة من ثلاث وصلات ومعدلاتها.", "A three-link chain and its rates.")}),
                ("patterns", ["p16-intermediate"]),
                ("worked_examples_plan", [
                    T("مستوى ١: ص = ع² − ٥ع ، ع = ١/(س + ١) : دص/دس عند س = ٠ (مثال ٢).", "Level 1: y = u² − 5u, u = 1/(x+1): dy/dx at x = 0 (book example 2)."),
                    T("مستوى ٢: ص = ن² + ٥ن و دن/دس = ٢ عند ن = ١.", "Level 2: y = t² + 5t and dt/dx = 2 at t = 1."),
                    T("مستوى ٣: ثلاث حلقات مع ثابت مجهول (مثال ٥).", "Level 3: three links with an unknown constant (book example 5)."),
                ]),
                ("mistakes", ["intermediate-value", "missing-inner"]),
                ("exercises_outline", {"count": 5, "mix": T("٣ اختيار من متعدد، ٢ قصيرة", "3 MCQ, 2 short")}),
            ]),
        ]),
        ("block_exercises", {"count": 10, "mix": T("مراجعة الكتلة: ٥ اختيار من متعدد مختلطة الأنماط، ٣ قصيرة، ١ طويلة، ١ إثبات، بتوزيع يطابق أوزان الأنماط في الامتحان",
                                                    "Block review: 5 mixed-pattern MCQ, 3 short, 1 long, 1 proof, distributed like the pattern weights in the exam")}),
        ("mistakes_catalogue", [
            {"id": "inner-at-x", "reason": "concept", "text": T("حساب قَ عند س بدل هـ(س): (ق∘هـ)َ(٢) = قَ(٢) × هـَ(٢) خطأ.", "Taking f' at x instead of at g(x): (f∘g)'(2) = f'(2)·g'(2) is wrong.")},
            {"id": "missing-inner", "reason": "rule", "text": T("نسيان الضرب في مشتقة الداخل: (جا ٣س)َ = جتا ٣س.", "Forgetting the inner derivative: (sin 3x)' = cos 3x.")},
            {"id": "order-swapped", "reason": "concept", "text": T("الخلط بين ق∘هـ و هـ∘ق.", "Mixing up f∘g and g∘f.")},
            {"id": "power-on-wrong-part", "reason": "notation", "text": T("قراءة جتا³(٢س) على أنها جتا(٢س)³ أو جتا(٨س³).", "Reading cos³(2x) as cos((2x)³).")},
            {"id": "square-notation", "reason": "notation", "text": T("الخلط بين ق²(س) = (ق(س))² و ق(س²).", "Confusing f²(x) = (f(x))² with f(x²).")},
            {"id": "ln-domain", "reason": "domain", "text": T("نسيان شرط ك(س) > ٠ في لـو_هـ ك(س).", "Forgetting k(x) > 0 for ln k(x).")},
            {"id": "trig-sign", "reason": "sign", "text": T("إشارة خاطئة في مشتقة جتا أو ظتا أو قتا.", "Wrong sign in the derivative of cos, cot or csc.")},
            {"id": "substitute-before-differentiating", "reason": "strategy", "text": T("التعويض بالعدد قبل الاشتقاق فيصبح الناتج صفراً.", "Substituting the number before differentiating, which gives zero.")},
            {"id": "wrong-x-for-target", "reason": "strategy", "text": T("في ق(٢س + ١) = …، التعويض بـ س = ٣ لإيجاد قَ(٣) بدل حل ٢س + ١ = ٣.", "In f(2x + 1) = …, substituting x = 3 to get f'(3) instead of solving 2x + 1 = 3.")},
            {"id": "intermediate-value", "reason": "strategy", "text": T("عدم إيجاد قيمة ع عند النقطة قبل التعويض في دص/دع.", "Not finding u at the point before substituting into dy/du.")},
        ]),
        ("past_questions", OrderedDict([
            ("B07-L1", refs_for({"p16-composition"})),
            ("B07-L2", refs_for({"p16-direct"}, extra=[("2025-scientific-math-s2-p1", "Q1-a-2"), ("2025-scientific-math-s1-p1", "Q6-c"),
                                                        ("2025-scientific-math-s1-p1", "Q5-a-2")])),
            ("B07-L3", refs_for({"p16-inner", "p16-limit"}, extra=[("2025-scientific-math-s1-p1", "Q4-a-1"), ("2025-scientific-math-s3-wb", "Q2-a-3"),
                                                                     ("2022-scientific-math-s2-p1", "q2a")])),
            ("B07-L4", refs_for({"p16-intermediate"}, extra=[("2025-scientific-math-s1-p1", "Q3-c"), ("2024-scientific-math-s1-p1", "Q3-b")])),
        ])),
    ])

    # ------------------------------------------------------------------------------------------
    # Content schema (lessons, exercises, notebook) and readiness model
    # ------------------------------------------------------------------------------------------
    REASONS = [
        ("concept", "لم أفهم الفكرة", "Did not understand the idea"),
        ("rule", "قاعدة أو شرط خاطئ أو ناقص", "Wrong or missing rule or condition"),
        ("algebra", "خطأ جبري أو حسابي", "Algebra or arithmetic slip"),
        ("sign", "خطأ في الإشارة", "Sign error"),
        ("notation", "قراءة الرموز أو السؤال", "Misread notation or the question"),
        ("domain", "نسيت المجال أو الشرط (س ≠ …، الاتصال)", "Forgot a domain or condition (x ≠ …, continuity)"),
        ("strategy", "لم أعرف من أين أبدأ أو اخترت طريقة خاطئة", "Did not know where to start, or chose the wrong method"),
        ("incomplete", "حل ناقص أو بلا تبرير (خسارة علامات)", "Incomplete or unjustified working (lost marks)"),
        ("time", "نفد الوقت أو تسرّعت", "Ran out of time or rushed"),
    ]
    reason_codes = [{"id": r[0], "title": T(r[1], r[2])} for r in REASONS]

    schema = OrderedDict([
        ("version", 1),
        ("files", {"lessons": "assets/js/course-math-sci-lessons.js", "global": "window.COURSE_MATH_SCI_LESSONS"}),
        ("conventions", [
            "Every learner-facing string is {ar, en}. Arabic first, book terminology exactly.",
            "Maths is LaTeX in fields named latex/*_latex, written once and rendered by assets/js/armath.js (\\dv, \\dd, \\E, \\ln, \\sin...). Inline maths inside text uses $...$.",
            "Ids: lesson B07-L1; step B07-L1-s3; exercise B07-E01 (block-wide numbering); card B07-C01; worked example B07-L1-x1.",
            "Past questions are referenced, never copied: {paper, item, page} with paper ids from assets/js/exams.js; the viewer opens #/paper/<paper> at <page>.",
            "Only verified answers ship: every exercise has verified:true after the solution was checked by hand.",
        ]),
        ("root", {"version": "int", "blocks": "{ <blockId>: { lessons: Lesson[], exercises: Exercise[], cards: Card[] } }"}),
        ("Lesson", OrderedDict([
            ("id", "string, e.g. B07-L1"), ("block", "string"), ("order", "int"), ("title", "{ar,en}"), ("minutes", "int"),
            ("objectives", "[{ar,en}] 2-4 items"), ("book_refs", "[{lesson:'1-6', pages:[37,38], label?:{ar,en}}]"),
            ("concepts", "[canonical concept id] (analysis.json canonical_concepts)"), ("patterns", "[pattern id] (analysis.json patterns)"),
            ("steps", "Step[] in this order: hook, intuition, rule (1+), example (2-4, levels rising), mistakes, check, practice, summary"),
        ])),
        ("Step", OrderedDict([
            ("common", "{id, type, title:{ar,en}, more?: Step[] (depth hidden behind 'more')}"),
            ("hook", "{body:{ar,en}, exam:{text:{ar,en}, weight:number, patterns:[id], past:[PastRef]}}  body = why it matters for learning (no exam statistics); exam.* = where it shows up in exams, shown only when exam links are on"),
            ("intuition", "{body:{ar,en}, analogy?:{ar,en}, visual?:Visual}"),
            ("rule", "{statement:{ar,en}, latex, conditions?:{ar,en}, book:{lesson, page}, note?:{ar,en}}  exactly as the book states it"),
            ("example", "{level:1|2|3, pattern?:id, prompt:{ar,en}, latex?, steps:[{do:{ar,en}, latex?, why:{ar,en}}], answer:{ar,en,latex?}, book?:{lesson,page,label}, past?:[PastRef]}  every step justified"),
            ("mistakes", "{items:[{id, reason:ReasonCode, wrong:{ar,en}, wrong_latex?, right:{ar,en}, right_latex?, why:{ar,en}}]}"),
            ("check", "{items:[Exercise (format mcq|numeric|expression, difficulty 1-2)]}  quick self-check, not logged as exam practice"),
            ("practice", "{exercise_ids:[id]}  opens the exercise player"),
            ("summary", "{points:[{ar,en}] (3-5), card_ids:[id]}  the 'you are done with this' moment"),
        ])),
        ("Visual", "{kind:'svg'|'interactive'|'explainer', id, spec:{ar,en}, alt:{ar,en}, params?:object}  rendered by app.js; spec describes behaviour for the implementer"),
        ("PastRef", "{paper:'2025-scientific-math-s1-p1', item:'Q3-a-2', page:int, label:{ar,en}}  label as printed (e.g. السؤال الثالث أ-٢)"),
        ("Exercise", OrderedDict([
            ("id", "string B07-E01"), ("lesson", "lesson id"), ("block", "block id"), ("pattern", "pattern id"), ("concepts", "[canonical id]"),
            ("format", "mcq | numeric | expression | short | long | proof  (mcq/short/long/proof mirror exam formats; numeric/expression are auto-checked)"),
            ("difficulty", "1|2|3 (same scale as exam items)"), ("marks", "number, exam-equivalent marks (MCQ 2, short 4-7, long 6-10, proof 6-8)"),
            ("skills", "[compute|apply|interpret|prove|model]"), ("prompt", "{ar,en}"), ("latex", "string?"),
            ("options", "mcq only: [{latex?|text:{ar,en}, correct:bool, feedback:{ar,en}, reason?:ReasonCode}]  exactly 4, like the papers"),
            ("answer", "{latex, ar?, en?, value?:number, tolerance?:number}  value for numeric auto-check"),
            ("hints", "[{ar,en}] 1-3, graduated: nudge -> method -> first step"),
            ("solution", "{steps:[{do:{ar,en}, latex?, why:{ar,en}}], final:{ar,en,latex?}, marks_scheme?:[{step:int, marks:number}]}"),
            ("self_mark", "short/long/proof: checklist [{ar,en}] the student ticks against the solution"),
            ("past", "[PastRef] real questions of the same pattern; may be empty only when book is set"), ("book", "{lesson, page:int, label:{ar,en}}? the book exercise an item is modelled on (used instead of a past link when no past question has the same structure)"), ("source", "'najih' (original item modelled on the pattern)"), ("verified", "true"),
        ])),
        ("Card", "{id, block, concept, front:{ar,en,latex?}, back:{ar,en,latex?}, source:'lesson'|'mistake'|'note'}"),
        ("ReasonCode", [r[0] for r in REASONS]),
        ("notebook", OrderedDict([
            ("storage", "localStorage 'najih:v2' -> S.course['math-sci'] (same object as the site's mastery state); every read/write in try/catch"),
            ("progress", "{lessons:{<lessonId>:{step:int, done:bool, ts}}, blocks:{<blockId>:{started_ts, done_ts?}}}"),
            ("attempts", "[{ex, ts, ok:bool, hints:int, secs:int, answer?, reason?:ReasonCode, self_mark?:number}]  append-only, capped at 2000"),
            ("Note", "{id, type:'note', ref:{block, lesson?, step?, ex?, concept?}, text, tags:[string], pinned:bool, created, updated}"),
            ("Mistake", "{id, type:'mistake', ex, block, pattern, concepts:[id], reason:ReasonCode, detail?:string, answer?:string, created, resolved?:ts, retries:int, card?:cardId}  created automatically on a wrong attempt; the student confirms or changes the reason"),
            ("ReviewCard", "{id, card:cardId|null, front, back, block, concept, box:1..5 (Leitner), due:'YYYY-MM-DD', history:[{d, grade:0|1|2}]}  boxes 1..5 = 1, 2, 4, 8, 16 days; grade 0 -> box 1, 1 -> same box, 2 -> next box"),
            ("revision_sheet", "printable view: per block, pinned notes + open mistakes (with the correct method) + key rules"),
        ])),
    ])

    readiness = OrderedDict([
        ("concept_score", OrderedDict([
            ("evidence", "attempts on exercises tagged with the concept (check items count half)"),
            ("attempt_value", "s = 1 correct without hints, 0.6 correct with hints, 0.3 self-marked partial, 0 wrong"),
            ("attempt_weight", "w = difficulty factor (1, 1.5, 2) x 0.85^k for the k-th most recent attempt"),
            ("mastery", "m = sum(w*s) / sum(w)"),
            ("confidence", "c = min(1, sum(w) / 4)"),
            ("retention", "r = 2^(-days since last correct / h); h starts at 7 days, doubles after each correct spaced review, max 60"),
            ("open_mistakes", "p = 0.1 per unresolved mistake on the concept, max 0.3"),
            ("score", "clamp(m * c * (0.6 + 0.4 r) - p, 0, 1)"),
            ("states", {"not_started": "no evidence", "learning": "< 0.5", "shaky": "0.5 - 0.75", "solid": ">= 0.75", "mastered": ">= 0.9 and r >= 0.8"}),
        ])),
        ("block_score", "exam-weighted mean of its concept scores (concept share from analysis; untested concepts weight 0.5)"),
        ("unit_and_overall", "readiness = sum(block score x block exam weight) / sum(block exam weight) over the scope (unit, paper 1 = units 1-2, paper 2 = units 3-5)"),
        ("projected_share", "sum(block score x block weight): the share of the exam the student currently controls, in %"),
        ("next_step_rules", [
            T("بطاقات مراجعة مستحقة اليوم ← «راجع ٥ بطاقات»", "Review cards due today → \"Review 5 cards\""),
            T("خطأ مفتوح في كتلة وزنها كبير ← «تدرّب على النمط ...» مع تمرين من النمط نفسه", "Open mistake in a heavy block → \"Practise pattern …\" with an exercise of the same pattern"),
            T("المحطة التالية على الطريق ومتطلباتها «متماسكة» أو أفضل ← «ابدأ ...»", "Next stop on the road whose prerequisites are at least shaky → \"Start …\""),
            T("أكبر قيمة لـ (الوزن × (١ − الدرجة)) ← «قوِّ ...»", "Largest weight × (1 − score) → \"Strengthen …\""),
            T("كل كتل الورقة «متماسكة» ← «جاهز لامتحان تجريبي» (قريباً)", "Every block of a paper solid → \"Ready for a mock exam\" (coming soon)"),
        ]),
        ("mock_exam_ready_metadata", "exercise.format, marks, skills, difficulty, pattern, concepts, lesson match the exam item fields, so a generator can mirror analysis.paper_structures (questions, marks per question, MCQ count, choice rules) and sample patterns by their exam share"),
    ])

    blueprint = OrderedDict([
        ("meta", {"subject": "math", "branch": "scientific", "generator": "tools/build_course_math_sci.py", "analysis": "content/math-sci/analysis.json",
                  "papers": A["meta"]["papers"], "items": A["meta"]["items"], "years": A["meta"]["years"], "book": A["meta"]["book"]}),
        ("method", {
            "block_weight": "Lesson shares from analysis (choice-rule weighted, 50% primary lesson). Split lessons (1-2, 1-4, 4-4) pass each item's share to the blocks whose concepts it is tagged with; otherwise by the lesson's overall split.",
            "split_ratios": {l: {k: round(v, 3) for k, v in r.items()} for l, r in split_ratio.items()},
            "study_hours": "15 min per book page + 20 min per recurring exam pattern + 6 min per 1% exam weight, rounded to 0.5 h (minimum 1 h).",
            "route": "Book order kept for traceability; forks where two blocks share prerequisites and do not depend on each other; milestones at unit ends; M2/M5 mark the scope of paper 1 / paper 2.",
        }),
        ("grade11", G11),
        ("units", [{"unit": u["unit"], "title": u["title"], "printed_pages": u["printed_pages"], "lessons": u["lessons"],
                    "weight": A["overall"]["units"][str(u["unit"])], "blocks": [b["id"] for b in blocks_out if b["unit"] == u["unit"]]} for u in units_meta]),
        ("blocks", blocks_out),
        ("dependency_graph", {"nodes": [{"id": k, "kind": "grade11", "title": v} for k, v in G11.items()] + [{"id": b["id"], "kind": "block"} for b in blocks_out], "edges": edges}),
        ("route", {"nodes": nodes, "edges": redges, "layout": "serpentine: one row per unit, direction alternates (dir), col along the row, lane -1/+1 for parallel branches"}),
        ("radar", radar),
        ("patterns", {bid: pats for bid, pats in pat_by_block.items()}),
        ("highlights", highlights),
        ("item_blocks", {
            "method": "Each exam item's block attribution as fractions summing to 1, by the same rule as the block weights and the radar (50% primary lesson; split lessons 1-2, 1-4, 4-4 by the item's concept tags, else by the lesson's overall split). Key: '<paper id>#<item id>' as in analysis.json items[]. Use it for mock generation and readiness so they match the radar.",
            "items": bw["items"],
        }),
        ("pilot", pilot),
        ("schema", schema),
        ("reason_codes", reason_codes),
        ("readiness_model", readiness),
    ])
    with open(os.path.join(CONTENT, "blueprint.json"), "w", encoding="utf-8") as f:
        json.dump(blueprint, f, ensure_ascii=False, indent=1)
        f.write("\n")

    # ------------------------------------------------------------------------------------------
    # Runtime file (compact)
    # ------------------------------------------------------------------------------------------
    lessons_rt = {lid: {"t": m["title"], "pp": m["printed_pages"], "u": m["unit"], "w": A["overall"]["lessons"][lid],
                        "sci": m["scientific_only"], "sci_part": m["scientific_only_part"]} for lid, m in lessons_meta.items()}
    patterns_rt = {}
    for bid, pats in pat_by_block.items():
        for p in pats:
            patterns_rt[p["id"]] = {"b": bid, "l": p["lesson"], "t": p["title"], "n": p["items"], "papers": p["papers"], "y": p["years"],
                                    "w": p["share"], "f": p["formats"], "m": p["typical_marks"],
                                    "ex": [{"paper": e["paper"], "item": e["item"], "page": e["page"], "label": T(e["label_ar"], e["label_en"])} for e in p["examples"]]}
    blocks_rt = []
    for b in blocks_out:
        blocks_rt.append({
            "id": b["id"], "unit": b["unit"], "title": b["title"], "goal": b["goal"], "key": b["key_idea"],
            "book": [{"lesson": x["lesson"], "pages": x["pages"]} for x in b["book"]],
            "concepts": [{"id": c["id"], "title": c["title"], "w": c["share"], "cov": c["coverage"], "y": c["years"]} for c in b["concepts"]],
            "pre": b["prerequisites"]["blocks"], "g11": b["prerequisites"]["grade11"],
            "w": b["exam"]["weight"], "w1": b["exam"]["weight_paper1"], "w2": b["exam"]["weight_paper2"], "wy": b["exam"]["weight_by_year"],
            "rank": b["exam"]["rank"], "every_year": b["exam"]["tested_every_year"], "unlocks": b["exam"]["unlocks"], "examined": b["exam"]["examined"], "paper": b["exam"]["paper"],
            "patterns": b["patterns"], "hours": b["study_hours"], "sci": b["scientific_only"], "pilot": b["id"] == "B07",
        })
    papers_rt = [{"id": p["id"], "year": p["year"], "session": p["session"], "type": p["ptype"], "total": p["total"], "q": p["num_questions"],
                  "mcq": p["mcq_items"], "units": p["scope_units"]} for p in A["papers"]]
    runtime = OrderedDict([
        ("meta", {"v": 1, "subject": "math", "branch": "scientific", "title": T("الرياضيات — الفرع العلمي", "Mathematics — Scientific branch"),
                  "book": A["meta"]["book"], "papers": A["meta"]["papers"], "items": A["meta"]["items"], "years": A["meta"]["years"],
                  "pilot": "B07", "lessons_global": "COURSE_MATH_SCI_LESSONS", "lessons_src": "assets/js/course-math-sci-lessons.js",
                  "storage": "najih:v2 -> course['math-sci']", "mock": {"status": "coming_soon", "title": T("امتحانات تجريبية — قريباً", "Mock exams — coming soon")}}),
        ("units", [{"unit": u["unit"], "title": u["title"], "pp": u["printed_pages"], "lessons": u["lessons"], "w": A["overall"]["units"][str(u["unit"])],
                    "w_by_year": {y: A["by_year"][y]["units"][str(u["unit"])] for y in YEARS},
                    "blocks": [b["id"] for b in blocks_out if b["unit"] == u["unit"]], "examined": A["overall"]["units"][str(u["unit"])] > 0} for u in units_meta]),
        ("lessons", lessons_rt),
        ("grade11", G11),
        ("blocks", blocks_rt),
        ("route", {"nodes": nodes, "edges": redges}),
        ("radar", radar),
        ("patterns", patterns_rt),
        ("highlights", highlights),
        ("analysis", {
            "format_share": A["highlights"]["format_share_overall"],
            "per_unit": {u: {"formats": v["format_marks_share"], "skills": v["skills_marks_share"], "difficulty": v["mean_difficulty"]} for u, v in A["per_unit"].items()},
            "concepts_by_coverage": [{"concept": a["concept"], "title": T(a["ar"], a["en"]), "lesson": a["lesson"], "cov": a["coverage"], "w": a["share"]} for a in A["concepts_by_coverage"]],
            "never_tested": A["never_tested"]["concepts"],
            "trends": {k: {"y": v["by_year"], "slope": v["slope_pp_per_year"], "trend": v["trend"]} for k, v in A["trends"]["lessons"].items()},
            "papers": papers_rt,
            "method": radar["method"],
        }),
        ("reasons", reason_codes),
        ("readiness", {"states": readiness["concept_score"]["states"], "half_life_days": [7, 60], "leitner_days": [1, 2, 4, 8, 16],
                       "next_rules": readiness["next_step_rules"]}),
    ])
    js = ("// Generated by tools/build_course_math_sci.py from content/math-sci/analysis.json and the block design.\n"
          "// Do not edit by hand: re-run python3 -I tools/analyse_math_sci.py && python3 -I tools/build_course_math_sci.py\n"
          "window.COURSE_MATH_SCI = " + json.dumps(runtime, ensure_ascii=False, separators=(",", ":")) + ";\n")
    out_js = os.path.join(ROOT, "assets", "js", "course-math-sci.js")
    with open(out_js, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"wrote content/math-sci/blueprint.json and assets/js/course-math-sci.js ({len(js.encode())//1024} KB); "
          f"{len(blocks_out)} blocks, pilot B07 weight {BO['B07']['exam']['weight']}% rank {BO['B07']['exam']['rank']}")


if __name__ == "__main__":
    main()
