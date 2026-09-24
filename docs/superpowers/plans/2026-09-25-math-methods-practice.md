# Math Methods Practice Site — Implementation Plan

> **For the implementing agent (ChatGPT / Codex):** Read the design doc
> `docs/superpowers/specs/2026-09-25-math-methods-practice-design.md`
> first; it is the source of truth. This plan is executed in phases. At
> the end of every phase, **stop** and hand off for review (see "Review
> gates"). Do not start the next phase until the reviewer approves.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `math-methods/`, a static bilingual practice site for
calculus and optimization (Chiang & Wainwright Ch 6, 7, 9, 10, 11, 12)
with randomized problems and in-browser automatic grading.

**Architecture:** No build step. Vanilla HTML/CSS/ES modules. Vendored
KaTeX + math.js. Hash-routed single page. Progress in `localStorage`.

**Tech stack:** HTML, CSS, JavaScript (ES2022 modules), KaTeX, math.js,
Node ≥ 20 built-in test runner (`node --test`).

## Global constraints

- Work only inside `math-methods/` (plus this plan's checkboxes). Do not
  edit the root `index.html`, `cv/`, `ai-workshop/`, or `.quarto/`.
- Work on branch `math-methods`. Commit at the end of each task with a
  clear message. **Do not push** and do not open a PR; the instructor
  pushes after review.
- **Reference text:** Chiang & Wainwright is the primary pedagogical
  model (see the design doc, "Using the reference text"). Read the
  relevant sections of the local PDF before writing each module, and
  follow the book's order, motivation, intuition, and example setups.
  Because the site is public: paraphrase instead of pasting paragraphs,
  no reproduced figures, new numbers in every example and problem, no
  transcribed exercise sets or answers. Never add or link the PDF.
- No runtime dependencies beyond vendored KaTeX and math.js. Pin exact
  versions and record them in `math-methods/vendor/VERSIONS.md` with the
  source URL.
- No npm install needed to run tests. `package.json` has no
  dependencies.
- No analytics, trackers, accounts, or network calls at runtime except
  Google Fonts.
- Every `localStorage` access is wrapped in try/catch.
- Chinese text: Traditional Chinese, Taiwan usage (see Glossary). Never
  Simplified characters or mainland terms (e.g. use 函數 not 函数, 導數
  not 导数, 最適化 not 最优化).
- Every math string must render with KaTeX `throwOnError: true`.

## Review gates

At the end of each phase, stop and produce a handoff note
`math-methods/HANDOFF-phase-N.md` containing:

1. What was built (files added/changed).
2. Full output of `node --test math-methods/tests/`.
3. Screenshot paths (if the phase has UI) under
   `math-methods/qa/phase-N/` (gitignored; do not commit screenshots).
4. Known issues, deviations from the spec and why, open questions.

The reviewer (Claude) checks the diff, runs the tests, and inspects the
pages before approving the next phase.

---

## Phase 0 — Skeleton, theme, i18n, routing

### Task 0.1: Scaffold and vendor libraries
- [ ] Create the directory layout from the design doc.
- [ ] Vendor KaTeX (css, js, fonts, `auto-render` extension) and math.js
      (ES module build usable in both browser and Node). Record versions
      in `vendor/VERSIONS.md`.
- [ ] Add `math-methods/.gitignore` with `qa/`.
- [ ] `package.json`: `{"type":"module","private":true,"scripts":{"test":"node --test tests/"}}`.

### Task 0.2: Theme
- [ ] `site.css` with tokens copied from the main site (light + dark
      values in the design doc), fonts via Google Fonts, dark mode under
      `@media (prefers-color-scheme: dark)` guarded by
      `:root:not([data-theme="light"])` and again under
      `:root[data-theme="dark"]`. Explicit `body` background.
- [ ] Header: site title, language toggle (EN / 中文), theme toggle,
      link back to `https://shihyanglin.github.io/`.
- [ ] Responsive to 360 px, 16 px gutters, no horizontal scroll.

### Task 0.3: i18n and routing
- [ ] `i18n.js`: `t(key)`, current language from `?lang=` → `mm-lang` →
      browser language; toggle updates URL param, storage, `<html lang>`,
      and re-renders without reload.
- [ ] `router.js`: routes `#/`, `#/<module>`,
      `#/<module>/<generator>?level=&seed=`, `#/progress`; unknown route
      → module map with a notice.
- [ ] `modules.js` registry with all 10 modules (titles in both
      languages, section refs, empty generator lists for now).
- [ ] Module map page lists all modules grouped as
      "Calculus / 微積分" (limits → exp-log, timing) and
      "Optimization / 最適化" (opt-one, taylor, opt-multi, lagrange);
      each card shows title, sections, mastery status.

### Task 0.4: Source notes from the textbook
- [ ] Extract text of Ch 6, 7, 9, 10, 11, 12 from the local PDF with
      PyMuPDF (page numbers in the design doc). Do not commit extracted
      text.
- [ ] For each of the 10 modules write
      `math-methods/.source-notes/<module>.md` (add `.source-notes/` to
      `math-methods/.gitignore`; these are working notes for the
      implementer and reviewer, not site content), in your own words:
  1. **Motivation**: how the book opens the topic and which economic
     question it uses.
  2. **Concept sequence**: the order in which ideas are introduced,
     with section numbers.
  3. **Key intuitions**: geometric or economic explanations worth
     carrying into the lesson card.
  4. **Worked examples**: list each example by section and setup type
     (e.g. "§12.5 two-good utility max, $U=xy$, linear budget"), and
     state which generator or lesson example will adapt it.
  5. **Exercise patterns**: the skills the end-of-section exercises
     drill, mapped to generators and levels.
  6. **Catalog changes**: generators in this plan's catalog that should
     be added, dropped, or re-leveled to match the book. List them as
     proposals; the reviewer approves them before Phase 1.
- [ ] Lesson cards written later (Tasks 1.6, Phase 2–3) must follow
      these notes and end with the "Further reading: Chiang & Wainwright
      §x.y" line.

**Gate 0:** handoff with screenshots of the module map (375 / 1280,
en / zh, light / dark), plus the 10 source-notes files. The reviewer
checks the notes against the book and approves or edits the catalog
changes.

---

## Phase 1 — Checker engine + one complete module (`deriv-rules`)

This phase is the most important review point: the checker must be
correct before scaling to 40+ generators.

### Task 1.1: `rng.js`
- [ ] mulberry32 seeded PRNG; helpers `int(a,b)`, `pick(arr)`,
      `nonzeroInt(a,b)`, `shuffle`, `sign()`.

### Task 1.2: `checker.js`
- [ ] `parseAnswer(str, allowedVars)` → `{ok, node, tex, error}`.
      Normalize: `ln` alias for natural log, unicode minus/×/÷,
      full-width characters (students typing with a Chinese IME will
      produce `（）`, `＋`, `＊`, `＾`, full-width digits).
- [ ] Whitelist AST walk (allowed symbols, functions, operators; reject
      assignment, function definition, strings, matrices, units,
      `derivative`, `simplify`, `evaluate`, `import`, etc.).
- [ ] `checkExpr(student, reference, vars, domain, opts)` per the design
      doc (≥ 8 points, resampling, "could not check" state).
- [ ] `checkNumber`, `checkChoice`, `checkSet`, `checkMulti`.
- [ ] `matchMisconception(student, problem)` using the same equivalence
      check.
- [ ] Return a uniform result:
      `{status: "correct"|"incorrect"|"invalid"|"uncheckable", message, misconception?}`.

### Task 1.3: `checker.test.js`
- [ ] All cases listed in the design doc's Testing section, plus
      full-width input, implicit multiplication (`3xy`, `2(x+1)`), `e^x`
      vs `exp(x)`, `x^(1/2)` vs `sqrt(x)`, and empty input → `invalid`.

### Task 1.4: Problem UI (`render.js`)
- [ ] Render prompt with KaTeX; fields with live preview; Check / Hint /
      Show solution / New problem buttons; feedback region with
      `aria-live="polite"`; Enter key submits.
- [ ] Feedback shows icon + text + color. Misconception feedback shown
      when matched.
- [ ] Level selector (1 / 2 / 3) and generator selector per module;
      "New problem" changes the seed in the URL hash.
- [ ] Collapsible "How to type math / 如何輸入數學式" panel.

### Task 1.5: `progress.js` and progress page
- [ ] Schema `mm-progress-v1`:
      `{ [generatorId]: { attempts, firstTryCorrect, streak, bestLevel, mastered } }`.
- [ ] Mastery rule from the design doc. Solution reveal breaks the streak.
- [ ] `#/progress`: per-module table, reset (with in-page confirm, not
      `window.confirm`), JSON export download.

### Task 1.6: `deriv-rules` module content
- [ ] Lesson cards `deriv-rules.en.html` / `.zh.html`.
- [ ] Generators (see catalog) with hints, solutions, misconceptions.

### Task 1.7: `generators.test.js`
- [ ] Generic harness over the registry per the design doc (every
      generator × level × 300 seeds). Must be generic so later modules
      are tested automatically once registered.

**Gate 1:** handoff with tests, screenshots of one problem in each state
(unanswered, correct, incorrect + misconception, invalid input, solution
shown), and a list of 20 sample generated problems (seed + prompt +
answer) for manual math review.

---

## Phase 2 — Calculus modules

One task per module, each: lesson cards (en + zh) → generators → tests
pass → commit. Order: `deriv-basics`, `limits`, `partials`, `exp-log`,
`timing`.

**Gate 2:** tests + 5 sample problems per generator (seed, prompt,
answer, solution) in the handoff note for math review.
The reviewer also compares each lesson card with its source notes and
the book section for fidelity, and checks that no passage is pasted
from the book.

## Phase 3 — Optimization modules

Order: `opt-one`, `taylor`, `opt-multi`, `lagrange`.

**Gate 3:** same as Gate 2. The reviewer will check second-order
conditions and economic sign restrictions especially carefully.

## Phase 4 — Polish and QA

- [ ] Optional small SVG plot (no library) for `opt-one` and `timing`
      shown with the solution: function curve, critical points marked.
- [ ] Keyboard-only walkthrough; focus styles visible; all buttons
      labeled in both languages.
- [ ] Full screenshot matrix from the design doc.
- [ ] `math-methods/README.md`: how to run tests, how to add a
      generator, file map.
- [ ] Lighthouse or equivalent: no console errors; page weight
      reasonable (KaTeX fonts lazy via CSS only).

**Gate 4:** final handoff.

---

## Generator catalog

Levels: **L1** mechanical, **L2** standard exam level, **L3** combined /
applied. Every generator must supply ≥ 1 misconception where a natural
one exists.

### `limits` (§6.2–6.7)
- `poly-limit` (number): limit of a polynomial at a point. L1.
- `removable` (number): rational function with a common factor, e.g.
  $(x^2-a^2)/(x-a)$ built from chosen roots. L1–L2.
- `one-sided` (multi: left, right, exists?): piecewise function; choice
  "exists / does not exist". L2.
- `at-infinity` (number): ratio of polynomials as $x\to\infty$ (0, ratio
  of leading coefficients, or ±∞ as a choice). L2.
- `continuity` (choice + number): pick $k$ making a piecewise function
  continuous. L3.

### `deriv-basics` (§6.2–6.3, 7.1)
- `diff-quotient` (expr in x, h): simplify $[f(x+h)-f(x)]/h$ for a
  quadratic. L1–L2.
- `power-rule` (expr): sums of $a x^n$ incl. negative and fractional $n$.
  L1–L2. Misconception: exponent not reduced.
- `tangent-slope` (number + expr): slope at a point, tangent line. L2.
- `marginal-cost` (expr + number): MC from a cubic TC; MC at given Q. L2.
- `mc-ac` (number): quantity where MC = AC (min AC) for a cubic TC with
  no fixed cost built so the answer is an integer. L3.

### `deriv-rules` (§7.2–7.3)
- `product` (expr). L1–L2. Misconception: $f'g'$.
- `quotient` (expr). L1–L2. Misconception: numerator order flipped.
- `chain` (expr): $(ax^n+b)^m$, $\sqrt{\cdot}$. L1–L3. Misconception:
  missing inner derivative.
- `inverse-fn` (number): $dx/dy$ at a point for a monotone $y=f(x)$. L2.
- `mr-from-demand` (expr + number): TR = P(Q)·Q, MR, and MR at Q;
  L2–L3 with the elasticity relation $MR = P(1-1/|\varepsilon|)$.

### `partials` (§7.4–7.6)
- `partial-basic` (multi expr): $f_x$, $f_y$ of two-variable
  polynomials / Cobb–Douglas. L1–L2. Misconception: treating $y$ as a
  variable when differentiating in $x$.
- `marginal-products` (multi expr/number): $MP_K$, $MP_L$ of
  $AK^\alpha L^\beta$ at a point. L2.
- `market-cs` (multi number/choice): linear supply–demand
  $Q_d = a - bP$, $Q_s = -c + dP$; $P^*$, $\partial P^*/\partial a$,
  sign of $\partial Q^*/\partial c$. L2–L3.
- `national-income-cs` (number): simple Keynesian model multiplier
  $\partial Y^*/\partial G$. L2.
- `jacobian` (number + choice): Jacobian determinant of two functions,
  functionally dependent or not. L3.

### `opt-one` (§9.1–9.4, 9.6)
- `critical-points` (set): cubic built from chosen integer roots of
  $f'$. L1.
- `classify` (multi: set + choice per point): second-derivative test.
  L2. Misconception: max/min swapped.
- `profit-max` (number + choice): TR and TC given, $Q^*$ and SOC. L2–L3.
- `inflection` (number): inflection point of a cubic. L2.
- `nth-derivative` (choice): $f(x)=(x-a)^n + c$ type; classify with the
  nth-derivative test when $f''=0$. L3.

### `taylor` (§9.5)
- `maclaurin-coef` (number): coefficient of $x^k$ in the Maclaurin
  series of a polynomial or $e^{ax}$. L1–L2.
- `taylor-poly` (expr): 2nd-order Taylor polynomial of $\ln x$,
  $\sqrt{x}$, or $e^x$ around a point. L2–L3.
- `approx-value` (number, round to 3 d.p.): use the polynomial to
  approximate a value. L3.

### `exp-log` (§10.1–10.5, 10.7)
- `log-rules` (number): solve $a e^{bx} = c$ or simplify logs. L1.
- `diff-exp` (expr): $e^{f(x)}$, $b^{x}$. L1–L2. Misconception:
  missing $f'(x)$ or missing $\ln b$.
- `diff-log` (expr): $\ln f(x)$, $\log_b x$. L1–L2.
- `growth-rate` (expr/number): instantaneous growth rate
  $d\ln y/dt$ of products/quotients/powers of growing variables
  (e.g. $Y/L$). L2–L3.
- `elasticity` (expr/number): point elasticity via
  $d\ln y/d\ln x$. L2–L3.

### `timing` (§10.6)
- `wine-storage` (number): value $V = A e^{\sqrt{t}}$-type or
  $V = A e^{g(t)}$ with discount rate $r$; optimal $t^*$ from
  $g'(t) = r$. Build so $t^*$ is nice. L2–L3.
- `timber` (number): $V = 2^{\sqrt t}$-type with continuous
  discounting. L3.
- `compound` (number): continuous vs discrete compounding, doubling
  time. L1–L2.

### `opt-multi` (§11.1–11.7)
- `foc-2var` (multi number): stationary point of a quadratic
  $f(x,y)$ built from a chosen point. L1–L2.
- `hessian` (multi number): $f_{xx}, f_{xy}, f_{yy}$, $|H|$. L2.
- `classify-2var` (choice): max / min / saddle / inconclusive. L2.
  Misconception: checking only $f_{xx}$.
- `multiproduct-firm` (multi number): two-product competitive firm with
  cost interaction. L3.
- `price-discrimination` (multi number): two markets, linear demands,
  common cost. L3.
- `three-var` (choice): leading principal minors of a given 3×3
  Hessian; definiteness. L3.

### `lagrange` (§12.1–12.5, 12.7)
- `setup` (expr): write the Lagrangian $Z$ (checked as an expression in
  $x, y, \lambda$). L1. Misconception: wrong sign convention is
  accepted if consistent — the generator must state the convention
  $Z = f + \lambda(c - g)$ in the prompt.
- `solve-linear` (multi number: $x^*, y^*, \lambda^*$): quadratic
  objective, linear constraint. L1–L2.
- `cobb-douglas` (multi number): max $x^a y^b$ s.t. $p_x x + p_y y = B$;
  demands and $\lambda^*$. L2. Build prices/budget for nice answers.
- `cost-min` (multi number): min $wL + rK$ s.t. $Q = AK^\alpha L^\beta$.
  L2–L3.
- `bordered-hessian` (multi number + choice): $|\bar H|$ value and
  max/min conclusion (2 vars, 1 constraint). L2–L3. Misconception:
  using the unbordered Hessian sign rule.
- `shadow-price` (number): given $\lambda^*$, approximate change in
  $Z^*$ when the budget rises by $\Delta B$; compare with exact
  re-solve. L3.

---

## Glossary (EN → 台灣繁體中文)

| English | 中文 |
|---|---|
| limit / one-sided limit | 極限／單邊極限 |
| continuity / differentiability | 連續性／可微分性 |
| derivative / partial derivative | 導數／偏導數 |
| difference quotient | 差商 |
| product / quotient / chain rule | 乘法法則／除法法則／連鎖律 |
| inverse function rule | 反函數法則 |
| comparative statics | 比較靜態分析 |
| Jacobian determinant | Jacobian 行列式 |
| marginal revenue / cost / product | 邊際收益／邊際成本／邊際產量 |
| marginal revenue product (MRP) | 邊際收益產量（MRP） |
| value of marginal product (VMP) | 邊際產值（VMP） |
| average cost | 平均成本 |
| elasticity | 彈性 |
| critical (stationary) point | 臨界點（駐點） |
| relative maximum / minimum | 相對極大值／相對極小值 |
| inflection point | 反曲點 |
| first-/second-order condition | 一階條件／二階條件 |
| concave / convex | 凹函數／凸函數 |
| Maclaurin / Taylor series | Maclaurin 級數／泰勒級數 |
| natural exponential / logarithm | 自然指數／自然對數 |
| instantaneous rate of growth | 瞬時成長率 |
| continuous compounding / discounting | 連續複利／連續折現 |
| optimal timing | 最適時點 |
| Hessian / bordered Hessian | Hessian 矩陣／加邊 Hessian 矩陣 |
| leading principal minor | 主子行列式（領先主子式） |
| positive / negative definite | 正定／負定 |
| saddle point | 鞍點 |
| constrained optimization | 限制式最適化 |
| Lagrangian / Lagrange multiplier | Lagrange 函數／Lagrange 乘數 |
| shadow price | 影子價格 |
| utility maximization / cost minimization | 效用極大化／成本極小化 |
| budget constraint | 預算限制 |
| price discrimination | 差別取價 |

---

## Reviewer decisions

### Gate 0 (approved 2026-09-25)

Environment (applies to all phases): the implementer's sandbox has no
network and cannot write `.git`. The reviewer commits after each gate.
Handoff notes go to `math-methods/qa/HANDOFF-phase-N.md` (gitignored, so
they are never published). Source notes live in
`math-methods/.source-notes/` (gitignored).

Catalog decisions (these amend the Generator catalog above):
1. **Move `mc-ac` to `deriv-rules`** (the MC–AC relation uses the
   quotient rule, §7.2). `deriv-basics` keeps `marginal-cost`.
2. **Move `compound` to `exp-log`** (§§10.2, 10.4). `timing` keeps
   `wine-storage` and `timber` and adds `growth-rate` style drills only
   if they come from §10.7; otherwise `timing` has 2 generators plus the
   §10.7 content already in `exp-log`.
3. `mr-from-demand`: L1–L2 use `MR = P + Q·dP/dQ` (§7.2). The elasticity
   form `MR = P(1 − 1/|ε|)` is L3 only, and the lesson cross-references
   the elasticity material.
4. `taylor`: L1–L2 use polynomial and rational functions only (§9.5).
   L3 may use `e^x`, `ln x`, `sqrt x`; the L3 prompt notes that it uses
   the exp-log module.
5. No comparative statics that need the implicit function theorem
   (Ch 8). §11.7 / §12.5 comparative statics only on explicit reduced
   forms. `jacobian` asks whether the Jacobian determinant is
   identically zero (functional dependence), nothing more.
6. `lagrange/setup`: the prompt always states `Z = f + λ(c − g)`. The
   opposite sign is **not** accepted; it is registered as a
   misconception with feedback explaining the convention. Every
   multiplier / shadow-price prompt restates the convention.
   `shadow-price` labels `Δz* ≈ λ*Δc` as a first-order approximation and
   shows the exact re-solve for comparison.
7. Router: `#/<module>/<generator>` without `level`/`seed` must not be
   "unknown"; default to level 1 and a fresh random seed, and rewrite the
   hash with `history.replaceState`.

### Gate 1 (approved with required fixes, 2026-09-25)

Checker fixes (each needs a regression test in `checker.test.js`):
1. **Sampling bug**: all variables currently advance with the same
   golden-ratio step, so multi-variable points lie on a family of
   parallel lines. A wrong answer that differs only by a function
   vanishing on those lines is accepted 20/20. Use independent
   per-variable sequences (e.g. Kronecker steps √2, √3, √5, √7 fractional
   parts with independent random phases, or a seeded PRNG per variable).
   Regression: `x + sin(2π((y−0.5)/3.5 − (x−0.5)/3.5 − 0.41421356…))`
   vs `x` on `x,y ∈ [0.5, 4]` must be `incorrect`.
2. Skip a sample point only when the **reference** is non-finite. If the
   reference is finite and the student's value is non-finite or complex,
   that point is a mismatch. `sqrt(-x)` or `log(-x)` on a positive domain
   must be `incorrect`, not `uncheckable`.
3. Reject function names used without parentheses (`sqrt x`, `ln x`,
   `lnx`) with a friendly message: "Use parentheses, e.g. ln(x)".
4. Allow `e` inside implicit-multiplication tokens when `e` is not a
   declared variable: `2xe^x` = `2*x*e^x`. Never split tokens that are
   function names or constants.
5. Non-blocking ambiguity notice under the preview when a number after
   `^` or `/` is directly followed by a letter or `(`: `e^2x` → "Read as
   (e^2)·x. For e^(2x), add parentheses." Same for `1/2x`.
6. `set` fields accept input without braces (`-1, 3`).
7. Map math.js parser errors to friendly bilingual messages; show each
   message once (currently duplicated, English-only).

Content fixes (apply to all generators, now and later):
8. Shared formatting helper (e.g. `content/generators/format.js`) for
   polynomials and coefficients: never output `x^1`, `1x`, `+-`, `- -`;
   compute numeric coefficients in solutions (`48-6Q`, not `48-2(3)Q`).
   Add a harness test that scans every prompt/hint/solution for these
   patterns.
9. MRP in Chinese is 「邊際收益產量（MRP）」, not 邊際收益產值 (that is
   VMP, 邊際產值). Add both to the glossary.
10. Chinese further-reading line shows `§ §7.2–7.3`; fix the duplicate `§`.
11. Lessons use the new structure in the design doc (motivation, key
    ideas + intuition, 2–3 collapsible worked examples following the
    book's setups with new numbers, common mistakes, further reading).
    Rewrite `deriv-rules` lessons in this structure.

### Gate 2a (approved with required fixes, 2026-09-25)

All 11 Gate 1 items verified independently by the reviewer. Math in all
new generators checked. Required fixes:
1. `deriv-basics/power-rule` prints `x^(1/2)` / `x^(-2)` inside TeX,
   which KaTeX renders wrongly. TeX strings must use braces (`x^{1/2}`).
   Add a harness test: no `$...$` segment may contain `^(`.
2. `limits/at-infinity` leaks the answer type through the prompt ("Find
   the finite limit" vs "Choose its behavior"). Use one prompt for all
   cases, with a behavior choice (finite / +∞ / −∞) and a value field
   that is only graded when the correct behavior is "finite".
3. Field labels are not translated (Chinese page shows
   "Difference quotient ="). Every label with words needs a real `zh`
   label. Add a harness test: if `label.en` contains a word of 3+ Latin
   letters outside `$...$`, `label.zh` must differ from `label.en`.
4. Lessons are still thin (~280 words). The instructor specifically
   values Chiang's introductions: the *Motivation* section should be
   1–2 real paragraphs that follow the book's narrative (e.g. Ch 6 goes
   comparative statics → rate of change → difference quotient →
   derivative → slope → limit). Target 500–900 English words per lesson
   excluding worked examples. Backfill `limits`, `deriv-basics`,
   `deriv-rules`, and apply to every new module.
5. Low priority: `xexp(x)` gives a generic "unsupported operation"
   message; give a hint to write `x*exp(x)`.

### Gate 2b (approved with required fixes, 2026-09-25)

All reference answers in the new generators are mathematically correct.
Lessons now reach the length target. Required fixes (all modules):
1. **Juxtaposition bugs in displayed math** (students see wrong math):
   `timing/timber` shows `V(t)=4005^{\sqrt t}` for 400·5^{√t};
   `partials/jacobian` solution shows `23u(1,4)` for `6u(1,4)`. Add a
   format helper that inserts `\cdot` whenever a numeric coefficient
   precedes a number or a numeric base, compute products instead of
   concatenating digits, and audit every template string for
   `${a}${b}`-style numeric concatenation.
2. **Unreduced fractions**: `2/4`, `16/14`, `2/20`, `2t/10`, rate
   `2/10`. Add `frac(p, q)` that reduces and prints an integer when
   possible (`\frac{p}{q}` in display math, `p/q` inline is fine).
   Reference answers may stay unreduced, but displayed text may not.
   Add a harness test: no `a/b` with integer a, b and gcd(a, b) > 1
   inside `$...$`. Rates may be shown as decimals (`r=0.1`) when that
   reads more naturally.
3. `1\sqrt{L}` and similar unit coefficients before functions; extend the
   unit-coefficient test to cover `1\sqrt`, `1e^`, `1\ln`.
4. `partials/market-cs`: the prompt asks for ∂P*/∂a without defining the
   parameters. State the general model `Q_d = a − bP`, `Q_s = −c + dP`
   and the parameter values.
5. Field labels containing math (`f_x =`, `MP_K =`) must render with
   KaTeX, e.g. label `$f_x$ =`.
