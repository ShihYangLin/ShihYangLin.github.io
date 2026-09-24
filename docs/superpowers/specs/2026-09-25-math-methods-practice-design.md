# Math Methods Practice Site — Design

## Goal

A bilingual (Traditional Chinese / English) online practice site where
undergraduate economics students drill calculus and optimization: limits
and derivatives, differentiation rules, partial derivatives and
comparative statics, exponential/log functions, single- and
multi-variable unconstrained optimization, and equality-constrained
optimization (Lagrangian). Students get randomized problems, type
mathematical answers, and receive immediate automatic grading, hints, and
worked solutions.

Hosted as a sub-site of the instructor's GitHub Pages site:
`https://shihyanglin.github.io/math-methods/`
(repo: `ShihYangLin.github.io`, folder `math-methods/`).

## Audience

Undergraduate students (2nd–3rd year) preparing for or taking
intermediate macroeconomics / mathematical economics. Emphasis on
computational fluency and economic applications, not proofs. Problems
should feel like the ones they will see on exams: clean numbers, clear
economic interpretation.

## Source material and scope

Reference text: Chiang & Wainwright, *Fundamental Methods of
Mathematical Economics*, 4th ed. (2005). Scope confirmed with the
instructor: Chapters 6, 7, 9, 10, 11, 12.

| Module id | Title (EN / 中文) | Sections |
|---|---|---|
| `limits` | Limits & Continuity / 極限與連續 | 6.2–6.7 |
| `deriv-basics` | Derivative Basics / 導數基礎 | 6.2–6.3, 7.1 |
| `deriv-rules` | Product, Quotient & Chain Rules / 乘法、除法與連鎖律 | 7.2–7.3 |
| `partials` | Partial Derivatives & Comparative Statics / 偏導數與比較靜態 | 7.4–7.6 |
| `opt-one` | One-Variable Optimization / 單變數最適化 | 9.1–9.4, 9.6 |
| `taylor` | Taylor Approximation / 泰勒展開 | 9.5 |
| `exp-log` | Exponential & Log Functions / 指數與對數函數 | 10.1–10.5, 10.7 |
| `timing` | Optimal Timing & Growth Rates / 最適時點與成長率 | 10.6–10.7 |
| `opt-multi` | Multivariable Unconstrained Optimization / 多變數無限制最適化 | 11.1–11.7 |
| `lagrange` | Equality-Constrained Optimization / 等式限制最適化 | 12.1–12.5, 12.7 |

Out of scope: Ch 8 (total differentials, implicit function theorem),
Ch 13 (Kuhn–Tucker), proofs, and comparative statics of the Lagrangian
solution via the implicit function theorem (needs Ch 8). Sections 11.7 and
12.6 (homogeneous functions) are included only if the generators stay at
undergraduate computational level.

### Using the reference text (primary pedagogical model)

The instructor likes Chiang & Wainwright's introductions and worked
examples. The site should **follow the book closely in teaching
approach**, and the implementing agent must read the relevant sections
before writing each module.

Local PDF (the copy in the instructor's Books app):
`/Users/linshih-yang/Library/Mobile Documents/iCloud~com~apple~iBooks/Documents/ Kevin Wainwright Alpha Chiang - Fundamental Methods of Mathematical Economics 2004 McGraw-Hill Education - libgen.pdf`
(note the leading space in the file name). Text is extractable with
PyMuPDF; the PDF's bookmark page numbers equal the PDF page indices
(e.g. §9.1 starts on PDF page 241). Section start pages:
6.1→144, 7.1→168, 9.1→241, 10.1→276, 11.1→311, 12.1→367.

What to take from the book:
- **Order and motivation**: the sequence of ideas within each chapter,
  and the economic motivation used to introduce each concept (e.g.
  comparative statics motivating the derivative; "economics is a science
  of choice" motivating optimization; wine storage / timber cutting for
  optimal timing).
- **Intuition and explanations**: the book's way of explaining a concept
  (geometric interpretation, why the condition works, how the
  second-order condition relates to curvature), rewritten in the site's
  own words and condensed to a lesson card.
- **Worked-example patterns**: the types of examples the book works
  through (linear market model, national income model, cubic cost
  function and MC/AC, multiproduct firm, price discrimination,
  Cobb–Douglas utility maximization, least-cost input combination, λ as
  shadow price) become the templates for generators and lesson examples.
- **Exercise styles**: the kinds of end-of-section exercises tell us
  which skills each generator should drill and at what difficulty.

How to use it (hard constraints, because the site is public):
- Paraphrase; do not paste the book's paragraphs, and do not reproduce
  its figures. Short defining phrases and standard formulas are fine.
- Worked examples and problems use the book's **setups** but new
  numbers and new wording. Do not transcribe exercise sets or their
  answers.
- Each lesson card ends with "Further reading: Chiang & Wainwright
  §x.y" / 「延伸閱讀：Chiang & Wainwright §x.y」.
- The PDF must never be copied into, or linked from, the repo or site.

## Pedagogical design

Each module page has three parts:

1. **Lesson** (revised at Gate 1: the instructor values Chiang's
   introductions and worked examples, so lessons are fuller than a
   one-screen card). Structure:
   - *Motivation*: the book's opening economic question, paraphrased.
   - *Key ideas*: each rule / condition in a display formula, followed
     by the book's intuition (geometric or economic) in 2–4 sentences.
   - *Worked examples*: 2–3 examples in collapsible `<details>`, using
     the book's example setups with new numbers, fully step by step.
   - *Common mistakes*.
   - *Further reading* line.
   About two screens with the examples collapsed.
2. **Practice**: a stream of randomized problems from the module's
   generators (3–6 generators per module), at difficulty levels 1–3.
3. **Mastery indicator**: per-generator status stored locally.

Each problem shows:
- Prompt (bilingual) with KaTeX-rendered math.
- One or more answer fields.
- Buttons: **Check**, **Hint** (up to 2 progressive hints),
  **Show solution** (step-by-step worked solution), **New problem**.
- Feedback: correct / incorrect, plus targeted feedback when the answer
  matches a known misconception (e.g. quotient-rule sign flip, forgetting
  the inner derivative in the chain rule, treating a saddle point as a
  maximum, wrong sign on λ).

Economic applications are required in every module except `limits`, e.g.
MR from an inverse demand, MC and AC relationship, comparative statics of
a linear market model, profit maximization, instantaneous growth rates
and elasticities via log-differentiation, optimal timing with continuous
discounting, multiproduct firm / price discrimination, Cobb–Douglas
utility maximization, cost minimization, λ as a shadow price.

### Mastery rule

A generator is "mastered" after 3 consecutive correct first attempts at
its highest available level. A module is mastered when all its generators
are. Using "Show solution" makes that attempt count as incorrect for
streak purposes. Progress is advisory only; there is no grading or
submission.

## Answer types and checking

All grading happens in the browser. Answer types:

| Type | Input example | Checking |
|---|---|---|
| `expr` | `3x^2 + 2/x` | Parse with math.js; evaluate student and reference at ≥ 8 random points inside the generator's declared domain; accept if all match within `abs 1e-8 + rel 1e-6`. Points where either side is non-finite are resampled (max 50 tries); if fewer than 6 valid points, show "could not check, please simplify" instead of marking wrong. |
| `number` | `3/4`, `sqrt(2)`, `e^2`, `-1.5` | Evaluate with no free variables; tolerance `abs 1e-6 + rel 1e-6`. Decimal answers rounded by the student are accepted if the prompt says "round to 3 decimals" and the generator sets that tolerance explicitly. |
| `choice` | radio: max / min / saddle / inconclusive; exists / DNE | Exact match. |
| `multi` | several labeled fields (`x* =`, `y* =`, `λ* =`) | Each field checked by its own type; feedback per field. |
| `set` | critical points `{-1, 3}` | Unordered list of numbers; matched as a multiset. |

Input rules:
- Accept `^`, implicit multiplication (`2x`, `3xy`), `ln(x)`, `log(x)`
  meaning natural log, `log(x, b)`, `exp(x)`, `e`, `sqrt`, `pi`.
- Live KaTeX preview of the parsed input below each field so students
  see how their input is read.
- **Whitelist** AST check before evaluation: only the module's declared
  variables, the constants `e` and `pi`, and the functions
  `sin cos tan exp ln log sqrt abs`. Reject anything else with a clear
  message. This blocks both errors and cheating (e.g. typing math.js's
  `derivative(...)`).
- A collapsible "How to type math" help panel, bilingual.

## Problem generators

Each generator is a pure function `generate(rng, level)` returning a
problem object:

```js
{
  id: "deriv-rules/quotient",          // stable id
  level: 2,
  vars: ["x"],
  domain: { x: [0.5, 4] },             // sampling range for expr checks
  prompt: { en: "...", zh: "..." },    // may contain $...$ KaTeX
  fields: [{ key: "ans", type: "expr", label: { en: "f'(x) =", zh: "f'(x) =" },
             answer: "…", tol: null }],
  misconceptions: [{ answer: "…", feedback: { en: "…", zh: "…" } }],
  hints: [{ en: "…", zh: "…" }, { en: "…", zh: "…" }],
  solution: [{ en: "…", zh: "…" }, …]  // steps, KaTeX inside
}
```

Requirements:
- Deterministic from a seed (seeded PRNG, e.g. mulberry32). The URL hash
  carries module, generator, level, and seed so a problem can be shared
  and reproduced: `#/lagrange/cobb-douglas?level=2&seed=81723`.
- Build problems **backwards from nice answers** (integer or simple
  fraction critical points, positive quantities, λ > 0 where economics
  requires it) rather than solving arbitrary random problems.
- Economic parameters must be economically sensible (positive prices,
  downward-sloping demand, concave production where claimed).
- Second-order checks (second-derivative test, Hessian leading principal
  minors, bordered Hessian for 2 variables / 1 constraint) are asked as
  explicit sub-questions at levels 2–3.

## Bilingual design

- One codebase; language switch via `?lang=en|zh`, remembered in
  `localStorage` (`mm-lang`), defaulting to browser language. Same
  pattern as the existing `ai-workshop/` page.
- UI strings in `i18n.js` (`{ en: {...}, zh: {...} }`); lesson cards in
  `content/lessons/<module>.en.html` and `.zh.html`; problem text inside
  each generator (both languages side by side so they cannot drift).
- Chinese is Traditional Chinese with Taiwan terminology. Use the
  glossary in the implementation plan; mathematics notation is identical
  in both languages.
- `<html lang>` updates to `en` / `zh-Hant`.

## Visual design

Match the main site `shihyanglin.github.io`:
- Fonts: Newsreader (headings / serif), Libre Franklin (UI and body),
  IBM Plex Mono (labels, input fields), Noto Serif TC (Chinese
  headings), Noto Sans TC (Chinese body) from Google Fonts.
- Color tokens copied from the main site (`oklch`): `--accent`
  `oklch(0.55 0.10 255)`, `--ink`, `--muted`, `--faint`, `--bg`,
  `--panel`, with the main site's dark-mode values under
  `prefers-color-scheme: dark` and a manual toggle (`data-theme`).
- Quiet academic look: generous whitespace, thin rules, small caps mono
  labels (like the main site's section eyebrows), no gradients, no
  emoji, no stock illustrations.
- Correct / incorrect feedback uses color **plus** icon and text (not
  color alone).
- Responsive down to 360 px; 16 px side gutter; no horizontal scroll;
  wide display math scrolls inside its own container.
- A header link back to the main site ("← Shih-Yang Lin").

## Architecture

- Static site, **no build step**, vanilla HTML/CSS/ES modules, served
  directly by GitHub Pages.
- Vendored, pinned libraries in `math-methods/vendor/` (so the browser
  and Node tests use the same files): KaTeX (rendering) and math.js
  (parsing / evaluation). No other runtime dependencies.
- Single-page app with hash routing: `#/` (module map), `#/<module>`
  (lesson + practice), `#/<module>/<generator>?level=&seed=`
  (specific problem), `#/progress`.
- Progress in `localStorage` key `mm-progress-v1`; every read/write in
  try/catch; site fully works when storage is unavailable. Progress page
  offers reset and JSON export.
- No analytics, no accounts, no external data collection.

```
math-methods/
  index.html
  package.json            # "type": "module", test script only, no deps
  assets/css/site.css
  assets/js/
    app.js  router.js  i18n.js  rng.js
    checker.js            # parse, whitelist, equivalence
    render.js             # KaTeX helpers, problem UI
    progress.js
  content/
    modules.js            # registry: id, titles, sections, generators
    lessons/<module>.en.html, <module>.zh.html
    generators/<module>.js
  vendor/katex/…  vendor/mathjs/…
  tests/
    checker.test.js
    generators.test.js
```

## Testing and QA

- `node --test math-methods/tests/` must pass (Node ≥ 20, no npm install).
- `checker.test.js`: equivalent forms accepted (`2x*x` vs `2x^2`,
  `ln(x^2)` vs `2ln(x)` on x > 0, `1/(x+1)^2` vs `(x+1)^-2`); non-equivalent
  rejected; whitelist rejects `derivative(x^2,x)`, `import`, unknown
  variables; domain handling for `ln` and `sqrt`.
- `generators.test.js`: for **every** generator × level × 300 seeds:
  the reference answer passes the checker; each misconception answer
  fails; all numbers are finite and within declared "niceness" bounds;
  both `en` and `zh` strings are non-empty for prompt, hints, solution;
  KaTeX renders every math string without throwing (`katex.renderToString`
  with `throwOnError: true`).
- Visual QA: screenshots at 375 px and 1280 px, both languages, light and
  dark, for the module map, one lesson, one problem in each state
  (unanswered, correct, incorrect with misconception, solution shown).

## Deployment

- All files live under `math-methods/`; nothing else in the repo changes
  except an optional link from the main site's Teaching page.
- The main `index.html` is a generated bundle; adding a link to it is a
  separate manual step handled by the instructor, not part of this build.
