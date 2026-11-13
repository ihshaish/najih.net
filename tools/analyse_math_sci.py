#!/usr/bin/env python3
"""Exam analysis for Scientific-branch Mathematics (Tawjihi, Palestine), 2022-2025.

Reads the verified captures
    content/math-sci/book/u1.json ... u6.json      (lessons, concepts, pages)
    content/math-sci/exams/<paper-id>.json         (every exam item, tagged)
and writes
    content/math-sci/analysis.json

Run:  python3 -I tools/analyse_math_sci.py      (no third-party packages, deterministic output)

METHOD (also written into analysis.json -> method)
1. Item marks. The printed mark of each item; where one printed mark covers several unmarked
   sub-parts the capture's equal split (marks_est) is used.
2. Choice rules. A student answers a subset of the questions, so an optional question is not worth
   its printed marks to the average candidate. Each question gets a weight w = 1 for compulsory
   questions and w = k/n for a section of n questions of which k must be answered (2023 rule
   "Q1 compulsory + 4 of the other 6": w = 4/6). Effective marks = printed marks x w, then scaled
   so every paper sums exactly to its stated total (100, or 200 for the single third-session
   paper). This is the expected mark value of each item for a candidate who picks optional
   questions uniformly; it is exact for compulsory sections and an unbiased estimate otherwise.
3. Lessons. Items carry one or more lesson tags, the primary (main) lesson first. Tags listed in an
   item's prerequisite_lessons are dropped. Effective marks go 50% to the primary lesson and 50%
   split equally over the supporting lessons (100% if the item has one lesson). Equal-split and
   primary-only variants are kept in sensitivity.
4. Concepts. The capture agents used slightly different concept ids per year; they are mapped to
   one canonical list (CONCEPTS below, each tied to a home lesson and to the book's concept ids).
   Marks are split over an item's canonical concepts with the same 50/50 primary rule.
5. Aggregation. Shares are effective marks / all effective marks in the group (overall, a year, a
   session, a paper type), in percent. Every paper counts with its own total, so the single 200-mark
   third-session paper weighs the same as a first-session paper 1 + paper 2 pair.
6. Frequency. Number of papers (of 20) and items in which a lesson/concept/pattern appears, and
   coverage = papers containing it / papers whose scope includes its unit.
7. Trend. Least-squares slope of the yearly share (percentage points per year, 4 points), with
   "rising"/"falling" only when |slope| >= 1 pp/yr and the 2024-25 mean differs from the 2022-23 mean
   in the same direction by >= 1.5 pp. Four years is a short series: these are signals, not forecasts.
8. Patterns. Each item is assigned one recurring question template ("pattern") of its primary
   lesson by ordered rules on its paraphrase, formula, format and concepts (PATTERNS below).
"""
from __future__ import annotations

import glob
import json
import math
import os
import re
from collections import Counter, OrderedDict, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "math-sci")
OUT = os.path.join(CONTENT, "analysis.json")

YEARS = [2022, 2023, 2024, 2025]
SESSIONS = ["s1", "s2", "s3"]

# --------------------------------------------------------------------------------------------
# Canonical concepts: id -> (home lesson, ar, en, [book concept ids])
# --------------------------------------------------------------------------------------------
CONCEPTS = OrderedDict([
    ("avg-rate", ("1-1", "متوسط التغير", "Average rate of change",
                  ["u1.change_delta", "u1.avg_rate", "u1.avg_rate_function", "u1.secant_slope", "u1.avg_velocity"])),
    ("deriv-limit", ("1-2", "المشتقة كنهاية (نهايات على صورة تعريف المشتقة)", "Derivative as a limit (limits that are a derivative)",
                     ["u1.derivative_def", "u1.derivative_limit_disguise"])),
    ("diff-piecewise", ("1-2", "قابلية الاشتقاق: المتشعب والمطلق وأكبر عدد صحيح", "Differentiability: piecewise, absolute value, greatest integer",
                        ["u1.one_sided_derivative", "u1.differentiability", "u1.diff_continuity", "u1.piecewise_derivative"])),
    ("diff-rules", ("1-2", "قواعد الاشتقاق (الضرب والقسمة والقوة)", "Differentiation rules (product, quotient, power)",
                    ["u1.basic_rules", "u1.product_rule", "u1.quotient_rule", "u1.power_rule"])),
    ("higher-deriv", ("1-2", "المشتقات العليا", "Higher derivatives",
                      ["u1.higher_derivatives", "u1.derivative_identity_proof"])),
    ("trig-deriv", ("1-3", "مشتقات الاقترانات المثلثية", "Derivatives of trigonometric functions", ["u1.trig_derivatives"])),
    ("exp-log-deriv", ("1-4", "مشتقة الاقتران الأسي واللوغاريتمي", "Derivatives of exponential and logarithmic functions",
                       ["u1.e_number", "u1.exp_log_laws", "u1.exp_derivative", "u1.ln_derivative"])),
    ("lhopital", ("1-4", "قاعدة لوبيتال", "L'Hôpital's rule", ["u1.lhopital"])),
    ("tangent-normal", ("1-5", "المماس والعمودي على المماس", "Tangent and normal lines",
                        ["u1.tangent_slope", "u1.tangent_normal", "u1.tangent_conditions"])),
    ("motion-deriv", ("1-5", "الحركة: السرعة والتسارع", "Motion: velocity and acceleration",
                      ["u1.instant_velocity_accel", "u1.direction_change", "u1.vertical_motion"])),
    ("chain-rule", ("1-6", "قاعدة السلسلة", "Chain rule",
                    ["u1.chain_rule", "u1.general_power_rule", "u1.chain_multi", "u1.exp_ln_composite"])),
    ("implicit-diff", ("1-7", "الاشتقاق الضمني", "Implicit differentiation",
                       ["u1.implicit_relation", "u1.implicit_diff", "u1.implicit_tangent", "u1.rational_power_rule", "u1.log_differentiation"])),
    ("rolle", ("2-1", "نظرية رول", "Rolle's theorem", ["u2.rolle", "u2.theorem_conditions", "u2.find_c", "u2.theorem_parameters", "u2.rolle_proofs"])),
    ("mvt", ("2-1", "نظرية القيمة المتوسطة", "Mean value theorem", ["u2.mvt"])),
    ("monotonic", ("2-2", "التزايد والتناقص", "Increasing and decreasing",
                   ["u2.monotonic_def", "u2.first_derivative_monotonic", "u2.sign_chart", "u2.monotonic_abstract"])),
    ("critical-points", ("2-3", "النقط الحرجة", "Critical points", ["u2.critical_point"])),
    ("local-extrema", ("2-3", "القيم القصوى المحلية", "Local extrema", ["u2.local_extrema", "u2.first_derivative_test", "u2.extrema_parameters"])),
    ("absolute-extrema", ("2-3", "القيم القصوى المطلقة", "Absolute extrema",
                          ["u2.absolute_extrema", "u2.endpoint_test", "u2.discontinuity_extrema", "u2.extreme_value_theorem", "u2.closed_interval_method"])),
    ("concavity-inflection", ("2-4", "التقعر ونقط الانعطاف", "Concavity and inflection",
                              ["u2.concavity_def", "u2.concavity_test", "u2.inflection_point", "u2.inflection_angle", "u2.second_derivative_test", "u2.function_from_conditions"])),
    ("graph-reading", ("2-4", "قراءة منحنى ق أو قَ أو قً", "Reading the graph of f, f' or f''", ["u2.graph_of_derivative", "u2.monotonic_from_graph"])),
    ("optimization", ("2-5", "تطبيقات القيم القصوى (التحسين)", "Optimisation", ["u2.optimization", "u2.objective_function", "u2.optimization_verify"])),
    ("matrix-basics", ("3-1", "المصفوفة: الرتبة والمدخلات والتساوي", "Matrices: order, entries, equality",
                       ["u3.matrix", "u3.matrix_entry", "u3.matrix_order", "u3.square_matrix", "u3.identity_matrix", "u3.zero_matrix", "u3.row_matrix",
                        "u3.column_matrix", "u3.diagonal_matrix", "u3.main_diagonal", "u3.upper_triangular", "u3.matrix_equality"])),
    ("matrix-add-scalar", ("3-2", "جمع المصفوفات والضرب بعدد", "Matrix addition and scalar multiplication",
                           ["u3.matrix_addition", "u3.scalar_multiplication", "u3.matrix_subtraction", "u3.additive_inverse", "u3.addition_properties"])),
    ("matrix-mult", ("3-2", "ضرب المصفوفات", "Matrix multiplication",
                     ["u3.matrix_multiplication", "u3.multiplication_conformability", "u3.multiplication_properties", "u3.matrix_powers"])),
    ("matrix-equation", ("3-2", "المعادلة المصفوفية", "Matrix equations", ["u3.matrix_equation_linear"])),
    ("determinant", ("3-3", "المحددات وخصائصها", "Determinants and their properties",
                     ["u3.determinant", "u3.det_2x2", "u3.det_3x3", "u3.cofactor_expansion", "u3.det_properties", "u3.det_scalar_rule", "u3.det_product_rule", "u3.det_equation"])),
    ("matrix-inverse", ("3-4", "النظير الضربي للمصفوفة", "Inverse of a matrix",
                        ["u3.inverse_matrix", "u3.nonsingular_matrix", "u3.singular_matrix", "u3.singular_iff_det_zero", "u3.inverse_properties", "u3.inverse_2x2_formula", "u3.det_of_inverse"])),
    ("cramer", ("3-5", "طريقة كريمر", "Cramer's rule", ["u3.cramer_rule", "u3.system_matrix_form"])),
    ("inverse-method", ("3-5", "حل النظام بالنظير الضربي", "Solving a system with the inverse", ["u3.inverse_method"])),
    ("gauss", ("3-5", "طريقة جاوس", "Gaussian elimination", ["u3.gauss_elimination", "u3.augmented_matrix", "u3.elementary_row_operations", "u3.back_substitution"])),
    ("antiderivative", ("4-1", "الاقتران الأصلي والتكامل غير المحدود", "Antiderivative and indefinite integral",
                        ["u4.antiderivative", "u4.general_antiderivative", "u4.antiderivatives_differ_by_constant", "u4.indefinite_integral", "u4.constant_of_integration", "u4.derivative_of_integral", "u4.initial_condition"])),
    ("indef-rules", ("4-2", "قواعد التكامل غير المحدود", "Rules of indefinite integration",
                     ["u4.basic_integral_rules", "u4.power_rule_integral", "u4.integral_reciprocal_ln", "u4.integral_exponential", "u4.integral_trig", "u4.linearity_integral", "u4.algebraic_simplification", "u4.trig_identity_rewrite"])),
    ("indef-applications", ("4-3", "تطبيقات التكامل: الميل والحركة", "Applications: curve from slope, motion",
                            ["u4.curve_from_slope", "u4.curve_from_second_derivative", "u4.tangent_line_condition", "u4.motion_integration", "u4.vertical_motion"])),
    ("substitution", ("4-4", "التكامل بالتعويض", "Integration by substitution",
                      ["u4.substitution", "u4.power_of_function_rule", "u4.linear_inner_rule", "u4.log_derivative_rule", "u4.trig_powers", "u4.back_substitution_leftover"])),
    ("by-parts", ("4-4", "التكامل بالأجزاء", "Integration by parts", ["u4.integration_by_parts", "u4.repeated_parts", "u4.cyclic_parts", "u4.substitution_then_parts"])),
    ("partial-fractions", ("4-4", "التكامل بالكسور الجزئية", "Partial fractions",
                           ["u4.partial_fractions", "u4.long_division_rational", "u4.substitution_to_rational", "u4.integral_sec_csc"])),
    ("riemann-sum", ("5-1", "التجزئة ومجموع ريمان", "Partitions and Riemann sums",
                     ["u5.partition", "u5.subinterval", "u5.regular_partition", "u5.regular_partition_element", "u5.riemann_sum"])),
    ("def-integral-def", ("5-2", "التكامل المحدود بالتعريف", "Definite integral from the definition",
                          ["u5.riemann_sum_general_n", "u5.definite_integral_def", "u5.integrability"])),
    ("ftc", ("5-3", "النظرية الأساسية للتفاضل والتكامل", "Fundamental theorem of calculus", ["u5.ftc_evaluation", "u5.definite_substitution"])),
    ("integral-function", ("5-3", "الاقتران المكامل ت(س)", "Integral function T(x)", ["u5.integral_function", "u5.ftc_derivative", "u5.integral_function_piecewise"])),
    ("def-integral-props", ("5-4", "خصائص التكامل المحدود", "Properties of the definite integral",
                            ["u5.basic_properties", "u5.positivity", "u5.comparison", "u5.additivity", "u5.definite_techniques"])),
    ("integral-piecewise", ("5-4", "تكامل المتشعب والمطلق وأكبر عدد صحيح", "Integrating piecewise / absolute / greatest-integer", ["u5.piecewise_integral"])),
    ("area", ("5-5", "المساحة", "Area", ["u5.area_curve_axis", "u5.area_two_curves"])),
    ("volume", ("5-5", "حجم الجسم الدوراني", "Volume of revolution", ["u5.volume_disc", "u5.volume_washer"])),
    ("complex", ("6-1", "الأعداد المركبة", "Complex numbers",
                 ["u6.imaginary_unit", "u6.complex_number", "u6.real_imag_parts", "u6.sqrt_negative", "u6.powers_of_i", "u6.equality", "u6.add_sub",
                  "u6.multiplication", "u6.operation_properties", "u6.multiplicative_inverse", "u6.modulus", "u6.conjugate", "u6.modulus_conjugate_props",
                  "u6.division", "u6.argand_plane", "u6.polar_form"])),
])

# exam concept id (as captured) -> canonical id; a callable gets the item's lessons.
ALIAS = {
    "avg-rate": "avg-rate", "derivative-def": "deriv-limit", "deriv-as-limit": "deriv-limit",
    "deriv-piecewise": "diff-piecewise", "piecewise-diff": "diff-piecewise", "special-func-deriv": "diff-piecewise",
    "deriv-rules": "diff-rules", "diff-rules": "diff-rules", "product-quotient": "diff-rules",
    "higher-deriv": "higher-deriv", "trig-deriv": "trig-deriv", "exp-log-deriv": "exp-log-deriv", "lhopital": "lhopital",
    "tangent-normal": "tangent-normal", "motion-deriv": "motion-deriv",
    "motion": lambda ls: "indef-applications" if ("4-3" in ls and "1-5" not in ls) else "motion-deriv",
    "chain-rule": "chain-rule", "composition-deriv": "chain-rule", "parametric-deriv": "chain-rule",
    "implicit-diff": "implicit-diff", "rolle": "rolle", "mvt": "mvt",
    "monotonic": "monotonic", "monotonicity": "monotonic", "critical-points": "critical-points",
    "local-extrema": "local-extrema", "absolute-extrema": "absolute-extrema", "abs-extrema": "absolute-extrema", "extrema-inequality": "absolute-extrema",
    "concavity": "concavity-inflection", "inflection": "concavity-inflection", "concavity-inflection": "concavity-inflection", "inflection-angle": "concavity-inflection",
    "graph-reading": "graph-reading", "graph-of-derivative": "graph-reading", "optimization": "optimization",
    "matrix-def": "matrix-basics", "matrix-basics": "matrix-basics", "special-matrices": "matrix-basics",
    "matrix-add-scalar": "matrix-add-scalar", "matrix-mult": "matrix-mult", "matrix-ops": "matrix-mult", "matrix-equation": "matrix-equation",
    "determinant": "determinant", "determinant-props": "determinant", "matrix-inverse": "matrix-inverse",
    "cramer": "cramer", "inverse-method": "inverse-method", "linear-system-inverse": "inverse-method", "gauss": "gauss",
    "antiderivative": "antiderivative", "integral-derivative-relation": "antiderivative",
    "indef-rules": "indef-rules", "integral-rules": "indef-rules", "trig-integral": "indef-rules", "exp-log-integral": "indef-rules",
    "integral-applications": "indef-applications", "curve-from-slope": "indef-applications", "motion-integral": "indef-applications",
    "substitution": "substitution", "by-parts": "by-parts", "partial-fractions": "partial-fractions",
    "riemann-sum": "riemann-sum", "def-integral-limit": "def-integral-def", "definite-integral": "def-integral-def",
    "ftc": "ftc", "integral-function": "integral-function",
    "def-integral-props": "def-integral-props", "integral-props": "def-integral-props", "integral-bounds": "def-integral-props",
    "integral-piecewise": "integral-piecewise", "area": "area",
}

# --------------------------------------------------------------------------------------------
# Patterns: lesson -> ordered list of (id, ar, en, rule). rule(text, item) -> bool; last rule is the
# default (None). text = paraphrase + latex + "fmt:<format>", lower-cased; concept rules use has_c.
# An item whose paraphrase starts with "Same" (a follow-up sub-part) inherits the pattern of the
# previous item of the same question when both share the primary lesson.
# --------------------------------------------------------------------------------------------
def rx(p):
    r = re.compile(p, re.I)
    return lambda t, it: bool(r.search(t))

def fmt(*fs):
    return lambda t, it: it["format"] in fs

def has_c(*cs):
    return lambda t, it: any(c in it["canon"] for c in cs)

def AND(*fs):
    return lambda t, it: all(f(t, it) for f in fs)

def OR(*fs):
    return lambda t, it: any(f(t, it) for f in fs)

def NOT(f):
    return lambda t, it: not f(t, it)

PATTERNS = {
    "1-1": [
        ("p11-proof", "إثبات صيغة عامة لمتوسط التغير", "Prove a general formula for an average rate", fmt("proof")),
        ("p11-built", "متوسط تغيّر اقتران مبنيّ من اقتران متوسط تغيّره معلوم (أو ربط فترتين)",
         "Average rate of a function built from one whose rate is known (or chaining intervals)",
         rx(r"h\(x\)|\bh=|k\(x\)=\\ln|l\(x\)|5n|\[3,7\]|\[5,13\]|change in \$?f|f\(1\)-f\(7\)")),
        ("p11-unknown", "متوسط التغير معطى: أوجد الثابت أو طرف الفترة", "Average rate given: find a constant or an endpoint",
         rx(r"find \$?[abc]\b|find \$?[abc]\$|find a, b")),
        ("p11-direct", "حساب التغير ومتوسط التغير مباشرة", "Compute the change and the average rate directly", None),
    ],
    "1-2": [
        ("p12-limit", "نهاية على صورة تعريف المشتقة", "A limit that is a derivative in disguise", rx(r"\\lim|lim_")),
        ("p12-piecewise", "قابلية الاشتقاق للمتشعب والمطلق وأكبر عدد صحيح (إيجاد الثوابت)",
         "Differentiability of piecewise / absolute / greatest-integer functions (find the constants)", has_c("diff-piecewise")),
        ("p12-values", "مشتقة الضرب أو القسمة من قيم معطاة لاقترانات مجهولة", "Product/quotient derivative from given values of unknown functions",
         rx(r"[a-z]\(-?\d+\)\s*=|[a-z]'\(-?\d+\)\s*=|[a-z]′\(-?\d+\)\s*=|[a-z]'\+|k'=f")),
        ("p12-higher", "المشتقات العليا: قيمة أو إثبات علاقة", "Higher derivatives: a value or a proved identity", has_c("higher-deriv")),
        ("p12-explicit", "اشتقاق اقتران صريح بالقواعد", "Differentiate an explicit function with the rules", None),
    ],
    "1-3": [
        ("p13-proof", "إثبات علاقة تحوي مشتقات مثلثية", "Prove an identity involving trig derivatives", fmt("proof")),
        ("p13-compute", "إيجاد مشتقة اقتران مثلثي", "Differentiate a trig function", None),
    ],
    "1-4": [
        ("p14-lhopital-unknown", "نهاية فيها اقتران مجهول: لوبيتال لإيجاد قيمة أو ثابت",
         "Limit with an unknown function: use L'Hôpital to find a value or constant",
         AND(rx(r"\\lim|lim_"), rx(r"f\(x\)|f\^2|f\(3x|find c|find \$?f|polynomial"))),
        ("p14-lhopital", "حساب نهاية ٠/٠ بقاعدة لوبيتال", "Evaluate a 0/0 limit with L'Hôpital", rx(r"\\lim|lim_")),
        ("p14-explog", "مشتقات الأسي واللوغاريتمي (وحل معادلات فيها)", "Exponential/log derivatives (and equations in them)", None),
    ],
    "1-5": [
        ("p15-vertical", "الحركة الرأسية: أقصى ارتفاع، السرعة عند ارتفاع، المسافة المقطوعة",
         "Vertical motion: maximum height, speed at a height, distance travelled",
         rx(r"thrown|free fall|tower|height|building")),
        ("p15-motion", "السرعة والتسارع وتغيّر اتجاه الحركة", "Velocity, acceleration and change of direction",
         rx(r"motion|velocity|acceleration|s\(t\)|speed|v\^2|\bs=")),
        ("p15-tangency", "شروط التماس: إيجاد ثوابت أو نقاط التماس", "Tangency conditions: find constants or points of tangency",
         rx(r"is tangent to|tangent to \$?f|share a tangent|horizontal tangent|parallel|tangent at .* find|points of tangency|value\(s\) of \$?a")),
        ("p15-equation", "معادلة المماس والعمودي، وميل المماس", "Equation of the tangent/normal and the tangent slope", None),
    ],
    "1-6": [
        ("p16-limit", "نهاية تمثّل مشتقة اقتران مركّب", "A limit that is the derivative of a composite", rx(r"\\lim|lim_")),
        ("p16-intermediate", r"متغيّر وسيط: $\dv{y}{x}$ عبر متغير ثالث", r"Intermediate variable: $\dv{y}{x}$ through a third variable",
         rx(r"\bz\s*=|\bz\^2|\\dv\{t\}|\\dv\{z\}|\bz=x|t\^2\+5t|\\dv\{y\}\{x\}=a\\sqrt\{y\}")),
        ("p16-composition", r"$(f\circ g)'$ عند نقطة: قيمة أو ثابت مجهول", r"$(f\circ g)'$ at a point: a value or an unknown constant", rx(r"\\circ|∘| o h| o n")),
        ("p16-inner", r"اقتران مجهول معطى بقيم أو بمعادلة في $f\big(g(x)\big)$: المشتقة عند نقطة",
         r"An unknown function given by values or by an equation in $f\big(g(x)\big)$: the derivative at a point",
         rx(r"f\^2\(x|f\((?:2x|x\^|\\sqrt|x-)|f\(x\^3|f\(2x|[a-z][′″']*\([−-]?\d+\)\s*=")),
        ("p16-direct", "اشتقاق اقتران مركّب (قوى وجذور ومثلثية وأسية)", "Differentiate a composite (powers, roots, trig, exponential)", None),
    ],
    "1-7": [
        ("p17-tangent", "مماس منحنى ضمني، أو نقاط ميلها معطى", "Tangent to an implicit curve, or points with a given slope",
         rx(r"tangent|parallel|points on|=-2")),
        ("p17-chain", r"علاقة ضمنية داخل سلسلة ($\dv{z}{x}$)", r"Implicit relation inside a chain ($\dv{z}{x}$)", rx(r"\bz\s*=|\\dv\{z\}")),
        ("p17-proof", "إثبات علاقة بالاشتقاق الضمني", "Prove a relation by implicit differentiation", fmt("proof")),
        ("p17-compute", r"إيجاد $\dv{y}{x}$ أو $\dv{^2y}{x^2}$ ضمنياً", r"Find $\dv{y}{x}$ or $\dv{^2y}{x^2}$ implicitly", None),
    ],
    "2-1": [
        ("p21-proof", "إثبات وجود جـ أو خاصية باستخدام النظرية", "Prove the existence of c or a property with the theorem", fmt("proof")),
        ("p21-piecewise", "شروط النظرية لاقتران متشعب أو مطلق (وإيجاد الثوابت ثم جـ)",
         "Theorem hypotheses for a piecewise / absolute function (find constants, then c)", rx(r"piecewise|cases|\|")),
        ("p21-find-c", "التحقق من الشروط وإيجاد جـ (رول أو القيمة المتوسطة)", "Check the hypotheses and find c (Rolle or MVT)", None),
    ],
    "2-2": [
        ("p22-critical", "مجموعة النقط الحرجة", "The set of critical points", rx(r"critical")),
        ("p22-graph", "التزايد والتناقص من الرسم", "Increase/decrease read from a graph", rx(r"graph")),
        ("p22-abstract", "تزايد/تناقص اقتران مجرد أو مركّب (عبارة صحيحة أو إثبات)",
         "Monotonicity of an abstract or combined function (true statement or proof)",
         OR(fmt("proof"), rx(r"f'\+h|polynomial \$?f|true statement|choose the true"))),
        ("p22-fprime", r"$f'$ معطاة: فترات التزايد والتناقص", r"$f'$ is given: intervals of increase/decrease", rx(r"f'\(x\)=|f′\(x\)=")),
        ("p22-explicit", "فترات التزايد والتناقص لاقتران معطى", "Intervals of increase/decrease of a given function", None),
    ],
    "2-3": [
        ("p23-proof", "إثبات باستخدام القيم القصوى (متباينة أو قيمة مطلقة)", "Prove with extrema (an inequality or an absolute value)", fmt("proof")),
        ("p23-critical", "عدد النقط الحرجة", "Number of critical points", rx(r"number of critical")),
        ("p23-params", "ثوابت من معطيات القيم القصوى", "Constants from given extrema", rx(r"find a, b|local max at x=.*local min")),
        ("p23-abstract", "القيم القصوى من شروط مجردة أو رسم", "Extrema from abstract conditions or a graph",
         rx(r"graph|statement|comparison|decreasing on|f''|crosses")),
        ("p23-absolute", "القيم القصوى المطلقة على فترة", "Absolute extrema on an interval", rx(r"absolute|smallest|largest")),
        ("p23-local", "القيم القصوى المحلية لاقتران معطى", "Local extrema of a given function", None),
    ],
    "2-4": [
        ("p24-proof", "إثبات التقعّر لاقتران مركّب من رسم", "Prove the concavity of a combined function from graphs", OR(fmt("proof"), rx(r"prove|show k"))),
        ("p24-graph", r"التقعّر من منحنى $f'$ أو $f''$", r"Concavity from the graph of $f'$ or $f''$", rx(r"graph")),
        ("p24-horizontal", "نقطة الانعطاف الأفقي وزاوية انعطاف معطاة", "Horizontal inflection point, or a given angle of inflection",
         rx(r"horizontal inflection|angle is|tangent of the angle|\\theta")),
        ("p24-param", r"قيمة ثابت تجعل $x=a$ نقطة انعطاف", r"A constant that makes $x=a$ an inflection point",
         rx(r"value of \$?[bm]|find \$?[abcm]\b|find \$?[abcm]\$|find a and b|find a so")),
        ("p24-intervals", "فترات التقعّر ونقط الانعطاف (وزوايا الانعطاف) لاقتران معطى",
         "Concavity intervals and inflection points (and angles) of a given function", None),
    ],
    "2-5": [
        ("p25-inscribed", "شكل محاط بدائرة أو مخروط", "A shape inscribed in a circle or cone", rx(r"inscribed")),
        ("p25-length", "طول ثابت: سياج أو سلك أو محيط", "A fixed length: fence, wire or perimeter", rx(r"fence|wire|perimeter|cut")),
        ("p25-volume", "صندوق أو خزان: الحجم والتكلفة", "Box or tank: volume and cost", rx(r"volume|tank|box|cost")),
        ("p25-distance", "أقصر مسافة أو أصغر مجموع", "Shortest distance or least sum", rx(r"distance|shortest|minimis")),
        ("p25-other", "مسائل هندسية أخرى (شبه منحرف)", "Other geometric set-ups (trapezoid)", None),
    ],
    "3-1": [
        ("p31-rule", "كتابة مصفوفة من قاعدة مدخلاتها", "Write a matrix from a rule for its entries", rx(r"_\{ij\}|_\{2j\}|_ij|entries")),
        ("p31-equality", "تساوي مصفوفتين", "Equality of two matrices", rx(r"=\\begin\{bmatrix|set of \$?x")),
        ("p31-order", "الرتبة وإمكانية إجراء العمليات", "Order and whether an operation is defined", None),
    ],
    "3-2": [
        ("p32-equation", "معادلة مصفوفية خطية: أوجد المصفوفة", "Linear matrix equation: find the matrix", rx(r"2x\+3y|x=m|\+x-|3x\b")),
        ("p32-power", r"قوى المصفوفة وعلاقات مثل $A^2-3A=7M$", r"Matrix powers and relations such as $A^2-3A=7I$",
         rx(r"a\^2|x\^2|b\^2|a\^3|a\^\{2\}")),
        ("p32-product", "ضرب المصفوفات مع مجهول أو شرط رتب", "Matrix products with an unknown or order conditions",
         AND(has_c("matrix-mult"), rx(r"find|orders|a_\{11\}"))),
        ("p32-combination", "عمليات جمع وضرب بعدد وضرب", "Combinations: addition, scalar multiple, product", None),
    ],
    "3-3": [
        ("p33-proof", "إثبات باستخدام خصائص المحددات", "Prove with determinant properties", fmt("proof")),
        ("p33-properties", "خصائص المحددات: |كأ| و|أب| و|أ⁻¹|", "Determinant properties: |kA|, |AB|, |A⁻¹|",
         rx(r"\|3a|\|-2a|\|\(|\|ba|\|3b|\^\{-1\}\||\|c\||\|5i|\|3a\^2|\|b\|=-2")),
        ("p33-equation", r"معادلة محددات أو مصفوفة منفردة: أوجد $x$", r"Determinant equation or singular matrix: find $x$",
         rx(r"find \$?x|values? of \$?x|singular|equals -|=-")),
        ("p33-evaluate", "حساب محدد", "Evaluate a determinant", None),
    ],
    "3-4": [
        ("p34-proof", "إثبات علاقة بالنظير الضربي", "Prove a relation with the inverse", fmt("proof")),
        ("p34-relation", "النظير من علاقة، أو مجاهيل داخل النظير", "The inverse from a relation, or unknowns inside an inverse",
         rx(r"a\^2\+i|find k|a,b,c,d|find x·y|\(3a\+i|\|c\^\{-1\}\|")),
        ("p34-equation", "معادلة مصفوفية بالنظير الضربي: أوجد س", "Matrix equation solved with the inverse: find X",
         rx(r"find \$?x\b|find \$?x\$|recover|find a\.|find \$?a\$|bc=a-c|a\+x=bx|ax=b\+x|2x\+")),
        ("p34-compute", "إيجاد النظير الضربي لمصفوفة ٢×٢ أو أحد مدخلاته", "Find the inverse of a 2×2 matrix or one of its entries", None),
    ],
    "3-5": [
        ("p35-gauss", "طريقة جاوس لنظام ٣×٣", "Gaussian elimination for a 3×3 system", rx(r"gauss")),
        ("p35-inverse", "حل نظام بالنظير الضربي", "Solve a system with the inverse matrix", rx(r"inverse")),
        ("p35-reverse", r"كريمر بالعكس: من $A_x$ و $A_y$ إلى الحل أو النظام", r"Cramer in reverse: from $A_x$, $A_y$ to the solution or the system",
         rx(r"a\\cdot a_x|a_xa_y|a_x\\cdot|a_x=|\|a_x\|=|reconstruct|given a_y|a_x\b.*\|a\|=2")),
        ("p35-cramer", "حل نظام ٢×٢ بطريقة كريمر", "Solve a 2×2 system with Cramer's rule", None),
    ],
    "4-1": [
        ("p41-inverse-ops", "التكامل والاشتقاق عمليتان عكسيتان", "Integration and differentiation undo each other",
         OR(has_c("__never__"), rx(r"\\dv\{\}\{x\}\\int|\\int\\dv|\\int f'\(x\)|\\int f\(x\)\\dd\{x\}=x|\\int f\(x\)\\dd\{x\}=\\tan"))),
        ("p41-antiderivative", "الاقتران الأصلي: التعرّف عليه وعلاقاته", "Antiderivatives: recognise them and use their relations", None),
    ],
    "4-2": [
        ("p42-trig", "تكامل مثلثي بعد التبسيط بالمتطابقات", "Trig integral after simplifying with identities", rx(r"\\sec|\\tan|\\sin|\\cos|\\cot")),
        ("p42-algebraic", "تكامل جبري أو أسي بعد التبسيط", "Algebraic or exponential integral after simplifying", None),
    ],
    "4-3": [
        ("p43-motion", "الحركة: من التسارع إلى السرعة إلى الموقع", "Motion: from acceleration to velocity to position",
         rx(r"motion|velocity|acceleration|speed|runner|v\(t\)|a\(t\)|distance")),
        ("p43-second", "الاقتران من المشتقة الثانية وشروط", "The function from its second derivative and conditions", rx(r"f''")),
        ("p43-relation", "علاقات تفاضلية: التعرّف على مشتقة مخفية", "Derivative relations: spot the hidden derivative", fmt("proof")),
        ("p43-slope", "قاعدة الاقتران من ميل المماس أو العمودي ونقطة", "The function from the slope of its tangent/normal and a point", None),
    ],
    "4-4": [
        ("p44-partial", "الكسور الجزئية (وقبلها القسمة أو التعويض)", "Partial fractions (after long division or a substitution)", has_c("partial-fractions")),
        ("p44-parts", "التكامل بالأجزاء (مكرر، دوري، بعد تعويض)", "Integration by parts (repeated, cyclic, after a substitution)", has_c("by-parts")),
        ("p44-substitution", "التكامل بالتعويض (قوى، جذور، مثلثية)", "Integration by substitution (powers, roots, trig)", has_c("substitution")),
        ("p44-other", "تكامل بتبسيط أو متطابقة", "Integral by simplifying or an identity", None),
    ],
    "5-1": [
        ("p51-n", "مجموع ريمان بدلالة ن: أوجد قيمة", "Riemann sum in terms of n: find a value", rx(r"\{n\}|in terms of \$?n")),
        ("p51-elements", "عناصر التجزئة المنتظمة: أوجد أ أو ن أو الرتبة", "Elements of a regular partition: find a, n or a rank",
         AND(NOT(rx(r"riemann|r\(\\sigma|m\(\\sigma")), rx(r"\\sigma|σ|partition|subinterval|element|rank"))),
        ("p51-unknown", "مجموع ريمان معطى: أوجد الثابت", "Riemann sum given: find the constant", rx(r"find \$?[ab]\b|find \$?[ab]\$")),
        ("p51-compute", "حساب مجموع ريمان لتجزئة معطاة", "Compute a Riemann sum for a given partition", None),
    ],
    "5-2": [
        ("p52-definition", "التكامل المحدود بالتعريف (نهاية مجموع ريمان)", "Definite integral from the definition (limit of Riemann sums)", rx(r"definition")),
        ("p52-n", "مجموع ريمان بدلالة ن ← قيمة التكامل", "Riemann sum in n → value of the integral", None),
    ],
    "5-3": [
        ("p53-T-constants", r"$\text{ت}(x)$ متشعب معطى: أوجد الثوابت", r"A piecewise $T(x)$ is given: find the constants",
         AND(has_c("integral-function"), rx(r"t\(x\)=\\begin|t=x\^3|piecewise t"))),
        ("p53-T-build", "إيجاد الاقتران المكامل لاقتران متشعب أو مطلق", "Build the integral function of a piecewise / absolute function",
         AND(OR(has_c("integral-function"), rx(r"integral function")), rx(r"cases|\||piecewise"))),
        ("p53-T-equation", r"تكامل من $a$ إلى $x$ معطى: أوجد $f$ أو الثابت", r"An integral from $a$ to $x$ is given: find $f$ or the constant",
         rx(r"\\int_\{?-?\w+\}?\^\{?x|\\int_x|t\(x\)|t\(2\)|t\(1\)|from \d to x|l\(x\)=4x")),
        ("p53-evaluate", "حساب تكامل محدود بالنظرية الأساسية", "Evaluate a definite integral with the fundamental theorem", None),
    ],
    "5-4": [
        ("p54-bounds", "المقارنة والحدود دون حساب التكامل", "Comparison and bounds without integrating",
         OR(fmt("proof"), rx(r"without|least value|largest value|sign of"))),
        ("p54-shift", "الإزاحة والانعكاس في حدود التكامل", "Shifting and reflecting the limits", rx(r"f\(x-|f\(x\+|h\(x\+|f\(-x\)|x\^m\(1-x")),
        ("p54-piecewise", "تكامل القيمة المطلقة وأكبر عدد صحيح والمتشعب", "Integrals of absolute-value, greatest-integer and piecewise functions",
         OR(has_c("integral-piecewise"), rx(r"\|x|\\sqrt\{x\^2-10x"))),
        ("p54-linear", "خصائص التكامل: الخطية وعكس الحدود وتجزئة الفترة", "Properties: linearity, reversed limits, splitting the interval", None),
    ],
    "5-5": [
        ("p55-graph", "المساحة من الرسم (مناطق فوق المحور وتحته)", "Area from a graph (regions above and below the axis)",
         rx(r"graph|m_1|m₁|shaded|which integral")),
        ("p55-param", "مساحة معطاة: أوجد الثابت", "Area given: find the constant", rx(r"find \$?a\$|is \$?\\tfrac43")),
        ("p55-axis", "المساحة بين منحنى ومحور السينات", "Area between a curve and the x-axis", rx(r"and the \$?x\$?-axis on")),
        ("p55-two", "المساحة بين منحنيين (مع المحاور أو مماس)", "Area between two curves (with the axes or a tangent)", None),
    ],
}

SKILLS = ["compute", "apply", "interpret", "prove", "model"]
FORMATS = ["mcq", "short", "long", "proof"]


def L(s):
    return s if isinstance(s, str) else (s or {}).get("en", "")


def load_book():
    units, lessons = [], OrderedDict()
    for path in sorted(glob.glob(os.path.join(CONTENT, "book", "u*.json"))):
        d = json.load(open(path, encoding="utf-8"))
        u = {"unit": d["unit"], "title": d["title"], "printed_pages": d["printed_pages"], "lessons": []}
        for l in d["lessons"]:
            bn = l.get("branch_note") or l.get("branch_notes") or l.get("branch_marking")
            lessons[l["id"]] = {
                "id": l["id"], "unit": d["unit"], "title": l["title"], "printed_pages": l["printed_pages"],
                "book_concepts": [c["id"] for c in l["concepts"]],
                "scientific_only": "للعلمي فقط" in json.dumps(bn, ensure_ascii=False) or "scientific_only" in json.dumps(bn),
            }
            u["lessons"].append(l["id"])
        units.append(u)
    return units, lessons


def question_weights(d):
    """question number -> weight under the paper's choice rule."""
    qs = [q["q"] for q in d["questions"]]
    cr = d.get("choice_rule") or d.get("choice_rules") or {}
    w = {}
    if cr.get("sections"):
        for s in cr["sections"]:
            for q in s["questions"]:
                w[q] = s["answer"] / len(s["questions"])
    else:
        comp = {int(str(c).lstrip("Q")) for c in cr.get("compulsory", [])}
        k = cr["answer_count"] - len(comp)
        rest = [q for q in qs if q not in comp]
        for q in qs:
            w[q] = 1.0 if q in comp else k / len(rest)
    assert set(w) == set(qs), d["id"]
    return w


def load_exams(lessons):
    papers, items = [], []
    for path in sorted(glob.glob(os.path.join(CONTENT, "exams", "*.json"))):
        d = json.load(open(path, encoding="utf-8"))
        pid = d["id"]
        m = re.match(r"(\d{4})-scientific-math-s(\d)(?:-p(\d))?", pid)
        year, sess, pno = int(m.group(1)), "s" + m.group(2), m.group(3)
        ptype = "p" + pno if pno else "combined"
        scope = d.get("scope_units") or d.get("units_covered")
        qw = question_weights(d)
        if isinstance(d.get("items"), list):
            raw = [(it, it["question"]) for it in d["items"]]
        else:
            raw = [(it, q["q"]) for q in d["questions"] for it in q["items"]]
        pitems = []
        for it, qn in raw:
            mk = it["marks"] if isinstance(it.get("marks"), (int, float)) else it.get("marks_est")
            assert isinstance(mk, (int, float)), (pid, it["id"])
            pre = set(it.get("prerequisite_lessons") or [])
            ls = [x for x in it["lessons"] if x not in pre]
            for x in ls:
                assert x in lessons, (pid, it["id"], x)
            # Supporting tags from units outside the paper's scope (e.g. a unit-1 skill used inside a paper-2
            # integration question) are treated as prerequisites: kept on the item for reference, not counted.
            out_scope = [x for x in ls if lessons[x]["unit"] not in scope]
            assert ls and ls[0] not in out_scope, (pid, it["id"], "primary lesson outside paper scope")
            ls = [x for x in ls if x not in out_scope]
            canon = []
            for c in it["concepts"]:
                cid = c["id"] if isinstance(c, dict) else c
                a = ALIAS[cid]
                a = a(ls) if callable(a) else a
                if a not in canon:
                    canon.append(a)
            out_scope_c = [c for c in canon if lessons[CONCEPTS[c][0]]["unit"] not in scope]
            canon = [c for c in canon if c not in out_scope_c] or canon[:1]
            para = it["paraphrase"]
            pitems.append({
                "paper": pid, "year": year, "session": sess, "ptype": ptype, "q": qn, "id": it["id"],
                "label": it.get("label"), "label_ar": it.get("label_ar"), "page": it.get("page"),
                "marks": float(mk), "w": qw[qn], "format": it["format"], "skills": it.get("skills") or [],
                "difficulty": it.get("difficulty"), "lessons": ls, "canon": canon,
                "para_en": L(para), "para_ar": para.get("ar") if isinstance(para, dict) else None,
                "latex": it.get("latex") or "",
                "out_of_scope_tags": {"lessons": out_scope, "concepts": out_scope_c} if (out_scope or out_scope_c) else None,
            })
        # Question marks for the mock-exam generator: the sum of the item marks (reconciled). Where the printed
        # heading differs (a recorded misprint), the printed value is kept separately.
        qsum = defaultdict(float)
        for x in pitems:
            qsum[x["q"]] += x["marks"]
        qmarks, qprinted = {}, {}
        for q in d["questions"]:
            v = qsum[q["q"]]
            qmarks[str(q["q"])] = int(v) if float(v).is_integer() else v
            if abs(v - q["marks"]) > 1e-9:
                qprinted[str(q["q"])] = q["marks"]
        raw_sum = sum(x["marks"] * x["w"] for x in pitems)
        scale = d["total_marks"] / raw_sum
        for x in pitems:
            x["eff"] = x["marks"] * x["w"] * scale
        papers.append({
            "id": pid, "year": year, "session": sess, "ptype": ptype, "total": d["total_marks"], "scope_units": scope,
            "num_questions": len(d["questions"]), "n_items": len(pitems), "printed_sum": sum(x["marks"] for x in pitems),
            "weighted_raw_sum": round(raw_sum, 3), "scale": round(scale, 4),
            "choice_weights": {str(k): round(v, 4) for k, v in sorted(qw.items())},
            "mcq_items": sum(1 for x in pitems if x["format"] == "mcq"),
            "question_marks": qmarks,
            "duration_min": d.get("duration_min"),
        })
        if qprinted:
            papers[-1]["question_marks_printed"] = qprinted
            papers[-1]["question_marks_note"] = " ".join(d.get("discrepancies") or []) or "printed heading differs from the sum of its item marks"
        items.extend(pitems)
    return papers, items


def split_primary(keys, mode="primary_weighted"):
    if not keys:
        return {}
    if len(keys) == 1 or mode == "primary_only":
        return {keys[0]: 1.0}
    if mode == "equal":
        return {k: 1.0 / len(keys) for k in keys}
    out = {keys[0]: 0.5}
    for k in keys[1:]:
        out[k] = out.get(k, 0) + 0.5 / (len(keys) - 1)
    return out


def assign_pattern(it):
    lesson = it["lessons"][0]
    text = " ".join([it["para_en"], it["latex"], "fmt:" + it["format"]]).lower()
    for pid, ar, en, rule in PATTERNS[lesson]:
        if rule is None or rule(text, it):
            return pid
    raise AssertionError(lesson)


def r2(x):
    return round(x, 2)


def shares(acc, total):
    return {k: r2(100 * v / total) for k, v in acc.items()}


def slope(ys):
    xs = list(range(len(ys)))
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    den = sum((x - mx) ** 2 for x in xs)
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / den


def main():
    units, lessons = load_book()
    papers, items = load_exams(lessons)
    prev = None
    for it in items:
        if (prev and it["para_en"].lower().startswith("same") and prev["paper"] == it["paper"] and prev["q"] == it["q"]
                and prev["lessons"][0] == it["lessons"][0]):
            it["pattern"] = prev["pattern"]
        else:
            it["pattern"] = assign_pattern(it)
        prev = it

    unit_of = {lid: l["unit"] for lid, l in lessons.items()}
    concept_lesson = {c: v[0] for c, v in CONCEPTS.items()}
    pmeta = {p[0]: {"lesson": lid, "ar": p[1], "en": p[2]} for lid, ps in PATTERNS.items() for p in ps}

    def attribute(group_items, mode="primary_weighted"):
        lu, ll, lc, lp = Counter(), Counter(), Counter(), Counter()
        for it in group_items:
            for k, f in split_primary(it["lessons"], mode).items():
                ll[k] += it["eff"] * f
                lu[unit_of[k]] += it["eff"] * f
            for k, f in split_primary(it["canon"], mode).items():
                lc[k] += it["eff"] * f
            lp[it["pattern"]] += it["eff"]
        return lu, ll, lc, lp

    def group_stats(group_items, mode="primary_weighted"):
        tot = sum(it["eff"] for it in group_items)
        lu, ll, lc, lp = attribute(group_items, mode)
        return {
            "total_effective_marks": r2(tot),
            "units": {str(u["unit"]): r2(100 * lu.get(u["unit"], 0) / tot) for u in units},
            "lessons": {lid: r2(100 * ll.get(lid, 0) / tot) for lid in lessons},
            "concepts": {c: r2(100 * lc.get(c, 0) / tot) for c in CONCEPTS},
            "patterns": {p: r2(100 * v / tot) for p, v in sorted(lp.items())},
        }

    overall = group_stats(items)
    by_year = {str(y): group_stats([i for i in items if i["year"] == y]) for y in YEARS}
    by_session = {s: group_stats([i for i in items if i["session"] == s]) for s in SESSIONS}
    by_paper_type = {t: group_stats([i for i in items if i["ptype"] == t]) for t in ("p1", "p2", "combined")}
    sensitivity = {m: {k: group_stats(items, m)[k] for k in ("units", "lessons")} for m in ("equal", "primary_only")}

    # ---------------- frequency and coverage
    def in_scope(paper, unit):
        return unit in paper["scope_units"]

    def freq(key_fn, keys, unit_fn):
        out = {}
        for k in keys:
            its = [i for i in items if k in key_fn(i)]
            ps = sorted({i["paper"] for i in its})
            scope_ps = [p for p in papers if in_scope(p, unit_fn(k))]
            ps_in = [p for p in scope_ps if p["id"] in ps]
            yrs = sorted({i["year"] for i in its})
            out[k] = {"items": len(its), "papers": len(ps), "papers_in_scope_present": len(ps_in), "papers_in_scope": len(scope_ps),
                      "coverage": r2(len(ps_in) / len(scope_ps)) if scope_ps else 0, "years": yrs,
                      "mcq_items": sum(1 for i in its if i["format"] == "mcq")}
        return out

    freq_units = freq(lambda i: {unit_of[l] for l in i["lessons"]}, [u["unit"] for u in units], lambda u: u)
    freq_units = {str(k): v for k, v in freq_units.items()}
    freq_lessons = freq(lambda i: set(i["lessons"]), list(lessons), lambda l: unit_of[l])
    freq_lessons_primary = freq(lambda i: {i["lessons"][0]}, list(lessons), lambda l: unit_of[l])
    freq_concepts = freq(lambda i: set(i["canon"]), list(CONCEPTS), lambda c: unit_of[concept_lesson[c]])

    # ---------------- formats, skills, difficulty per unit (by primary lesson's unit)
    per_unit = {}
    for u in units:
        un = u["unit"]
        its = [i for i in items if unit_of[i["lessons"][0]] == un]
        tot = sum(i["eff"] for i in its) or 1
        fm, fc, sk, df = Counter(), Counter(), Counter(), []
        for i in its:
            fm[i["format"]] += i["eff"]
            fc[i["format"]] += 1
            for s in i["skills"]:
                sk[s] += i["eff"] / len(i["skills"])
            if i["difficulty"]:
                df.append(i["difficulty"])
        per_unit[str(un)] = {
            "items": len(its),
            "format_marks_share": {f: r2(100 * fm.get(f, 0) / tot) for f in FORMATS},
            "format_counts": {f: fc.get(f, 0) for f in FORMATS},
            "skills_marks_share": {s: r2(100 * sk.get(s, 0) / tot) for s in SKILLS},
            "mean_difficulty": r2(sum(df) / len(df)) if df else None,
            "mean_item_marks_printed": r2(sum(i["marks"] for i in its) / len(its)) if its else None,
        }
    fmt_overall = Counter()
    for i in items:
        fmt_overall[i["format"]] += i["eff"]
    tot_all = sum(i["eff"] for i in items)

    # ---------------- trends
    def trend(kind):
        out = {}
        for k in (lessons if kind == "lessons" else CONCEPTS):
            ys = [by_year[str(y)][kind][k] for y in YEARS]
            if max(ys) == 0:
                continue
            s = slope(ys)
            early, late = (ys[0] + ys[1]) / 2, (ys[2] + ys[3]) / 2
            label = "stable"
            if s >= 1 and late - early >= 1.5:
                label = "rising"
            elif s <= -1 and early - late >= 1.5:
                label = "falling"
            out[k] = {"by_year": ys, "slope_pp_per_year": r2(s), "mean_2022_23": r2(early), "mean_2024_25": r2(late), "trend": label}
        return out

    trends_lessons, trends_concepts = trend("lessons"), trend("concepts")

    # ---------------- always tested
    always = []
    for c, f in freq_concepts.items():
        if len(f["years"]) == 4:
            always.append({"concept": c, "ar": CONCEPTS[c][1], "en": CONCEPTS[c][2], "lesson": concept_lesson[c],
                           "papers": f["papers"], "papers_in_scope_present": f["papers_in_scope_present"],
                           "papers_in_scope": f["papers_in_scope"], "coverage": f["coverage"],
                           "share": overall["concepts"][c]})
    always.sort(key=lambda x: (-x["coverage"], -x["share"]))
    never_concepts = [c for c in CONCEPTS if freq_concepts[c]["items"] == 0]
    never_lessons = [l for l in lessons if freq_lessons[l]["items"] == 0]
    tested_book = {b for c in CONCEPTS if freq_concepts[c]["items"] for b in CONCEPTS[c][3]}
    all_book = [b for l in lessons.values() for b in l["book_concepts"]]
    mapped_book = {b for c in CONCEPTS.values() for b in c[3]}
    unmapped = [b for b in all_book if b not in mapped_book]
    assert not unmapped, unmapped

    # ---------------- patterns per lesson
    def ref(i):
        return {"paper": i["paper"], "item": i["id"], "label": i["label"], "label_ar": i["label_ar"], "page": i["page"],
                "format": i["format"], "marks": i["marks"]}

    patterns = OrderedDict()
    for lid in lessons:
        if lid not in PATTERNS:
            continue
        rows = []
        for pid, ar, en, _ in PATTERNS[lid]:
            its = [i for i in items if i["pattern"] == pid]
            if not its:
                continue
            its_sorted = sorted(its, key=lambda i: (-i["year"], i["paper"], i["id"]))
            fc = Counter(i["format"] for i in its)
            rows.append({
                "id": pid, "ar": ar, "en": en, "items": len(its), "papers": len({i["paper"] for i in its}),
                "years": sorted({i["year"] for i in its}), "share": overall["patterns"].get(pid, 0),
                "formats": dict(fc.most_common()), "typical_marks_printed": r2(sorted(i["marks"] for i in its)[len(its) // 2]),
                "examples": [ref(i) for i in its_sorted[:6]], "all_refs": [[i["paper"], i["id"], i["page"]] for i in its_sorted],
            })
        rows.sort(key=lambda r: -r["share"])
        patterns[lid] = rows

    # ---------------- paper structures (for future mock exams)
    structures = defaultdict(list)
    for p in papers:
        structures[str(p["year"])].append({k: p[k] for k in ("id", "session", "ptype", "total", "scope_units", "num_questions",
                                                             "question_marks", "question_marks_printed", "question_marks_note",
                                                             "choice_weights", "mcq_items", "n_items", "duration_min") if k in p})

    # ---------------- sanity checks
    checks = []
    for p in papers:
        s = sum(i["eff"] for i in items if i["paper"] == p["id"])
        checks.append({"check": f"effective marks of {p['id']} = stated total", "value": r2(s), "expected": p["total"], "ok": abs(s - p["total"]) < 1e-6})
    def chk(name, d):
        s = sum(d.values())
        checks.append({"check": name, "value": r2(s), "expected": 100, "ok": abs(s - 100) < 0.2})
    for nm, g in [("overall", overall)] + [(f"year {y}", by_year[y]) for y in by_year] + [(f"session {s}", by_session[s]) for s in by_session] + [(f"paper type {t}", by_paper_type[t]) for t in by_paper_type]:
        for k in ("units", "lessons", "concepts", "patterns"):
            chk(f"{nm}: {k} shares sum to 100", g[k])
    assert all(c["ok"] for c in checks), [c for c in checks if not c["ok"]]
    assert len(papers) == 20

    # ---------------- highlights (ranked facts used by the UI)
    top_lessons = sorted(lessons, key=lambda l: -overall["lessons"][l])
    paper1 = by_paper_type["p1"]
    paper2 = by_paper_type["p2"]
    highlights = {
        "mcq_share_of_marks": r2(100 * fmt_overall["mcq"] / tot_all),
        "proof_share_of_marks": r2(100 * fmt_overall["proof"] / tot_all),
        "format_share_overall": {f: r2(100 * fmt_overall[f] / tot_all) for f in FORMATS},
        "top_lessons": [{"lesson": l, "share": overall["lessons"][l], "papers": freq_lessons[l]["papers"]} for l in top_lessons[:8]],
        "unit_shares": overall["units"],
        "never_tested_units": [u["unit"] for u in units if overall["units"][str(u["unit"])] == 0],
        "never_tested_concepts": never_concepts,
        "rising_lessons": [k for k, v in trends_lessons.items() if v["trend"] == "rising"],
        "falling_lessons": [k for k, v in trends_lessons.items() if v["trend"] == "falling"],
        "rising_concepts": [k for k, v in trends_concepts.items() if v["trend"] == "rising"],
        "falling_concepts": [k for k, v in trends_concepts.items() if v["trend"] == "falling"],
        "paper1_top_lessons": sorted(paper1["lessons"], key=lambda l: -paper1["lessons"][l])[:5],
        "paper2_top_lessons": sorted(paper2["lessons"], key=lambda l: -paper2["lessons"][l])[:5],
        "always_tested_full_coverage": [a["concept"] for a in always if a["coverage"] == 1.0],
    }

    out = OrderedDict()
    out["meta"] = {
        "subject": "math", "branch": "scientific", "years": YEARS, "papers": len(papers), "items": len(items),
        "generator": "tools/analyse_math_sci.py", "sources": ["content/math-sci/book/u1-u6.json", "content/math-sci/exams/*.json"],
        "book": "الرياضيات، الصف الثاني عشر، الفرع العلمي (وزارة التربية والتعليم، فلسطين)",
    }
    out["method"] = {
        "item_marks": "Printed item marks; where one printed mark covers several unmarked sub-parts, the capture's equal split (marks_est).",
        "choice_rule_weighting": "Each question's marks are multiplied by w = (questions to answer)/(questions offered) in its section (w = 1 for compulsory questions; 2023: Q1 compulsory, w = 4/6 for Q2-Q7), then scaled so each paper sums exactly to its stated total. This is the expected value of each item to a candidate who chooses optional questions uniformly.",
        "lesson_attribution": "Prerequisite tags removed; 50% to the primary (first) lesson, 50% split equally over supporting lessons (100% when one lesson). Variants 'equal' and 'primary_only' in sensitivity.",
        "concept_attribution": "Captured concept ids mapped to canonical concepts (canonical_concepts); same 50/50 primary rule.",
        "aggregation": "Share = effective marks / all effective marks of the group, in percent. Each paper weighs by its total (s3 = 200 = p1 + p2).",
        "unit_of_item": "Formats, skills and difficulty per unit use the unit of the item's primary lesson.",
        "frequency": "papers = number of the 20 papers containing at least one item tagged with it; papers_in_scope_present = the same count restricted to papers whose scope includes its unit; coverage = papers_in_scope_present / papers_in_scope. concepts_by_coverage lists concepts tested in all four years (highlights.always_tested_full_coverage = coverage 1.0 only).",
        "scope_rule": "Supporting lesson and concept tags from units outside a paper's scope (e.g. unit 1 inside paper 2) are treated as prerequisites and not counted; they stay on the item as out_of_scope_tags.",
        "question_marks": "paper_structures question_marks = sum of the question's item marks (reconciled); a printed heading that differs is kept in question_marks_printed with the capture's note.",
        "trend": "Least-squares slope of yearly share (pp/yr). 'rising'/'falling' needs |slope| >= 1 and a >= 1.5 pp change between the 2022-23 and 2024-25 means. Four data points: treat as signals.",
        "patterns": "Each item gets one recurring template of its primary lesson by ordered rules on paraphrase, formula, format and concepts.",
    }
    out["canonical_concepts"] = OrderedDict((c, {"lesson": v[0], "ar": v[1], "en": v[2], "book_concepts": v[3]}) for c, v in CONCEPTS.items())
    out["concept_aliases"] = {k: ("motion-deriv | indef-applications (by lesson)" if callable(v) else v) for k, v in ALIAS.items()}
    out["papers"] = papers
    out["overall"] = overall
    out["by_year"] = by_year
    out["by_session"] = by_session
    out["by_paper_type"] = by_paper_type
    out["sensitivity"] = sensitivity
    out["frequency"] = {"units": freq_units, "lessons_any_tag": freq_lessons, "lessons_primary": freq_lessons_primary, "concepts": freq_concepts}
    out["per_unit"] = per_unit
    out["concepts_by_coverage"] = always  # tested in all four years, ranked by coverage; 'always' = coverage 1.0 only
    out["never_tested"] = {"concepts": never_concepts, "lessons": never_lessons,
                           "book_concepts_not_tested": [b for b in all_book if b not in tested_book]}
    out["trends"] = {"lessons": trends_lessons, "concepts": trends_concepts}
    out["patterns"] = patterns
    out["paper_structures"] = structures
    out["highlights"] = highlights
    out["sanity_checks"] = {"all_ok": True, "n": len(checks), "checks": checks}
    out["items"] = [{"paper": i["paper"], "item": i["id"], "q": i["q"], "page": i["page"], "format": i["format"],
                     "marks": i["marks"], "w": r2(i["w"]), "eff": round(i["eff"], 3), "lessons": i["lessons"], "concepts": i["canon"],
                     "pattern": i["pattern"], "skills": i["skills"], "difficulty": i["difficulty"],
                     **({"out_of_scope_tags": i["out_of_scope_tags"]} if i["out_of_scope_tags"] else {})} for i in items]
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"wrote {os.path.relpath(OUT, ROOT)}: {len(papers)} papers, {len(items)} items, {len(checks)} checks ok")


if __name__ == "__main__":
    main()
