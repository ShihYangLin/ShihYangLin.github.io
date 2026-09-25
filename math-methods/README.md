# Math Methods Practice

A static bilingual (English and Traditional Chinese) calculus and optimization practice site for undergraduate economics students. It contains ten modules, randomized exercises, local answer checking, hints, worked solutions, and browser-local progress. It has no build step or account system.

## Run locally

From the repository root, serve the files over HTTP so lesson `fetch()` calls work:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/math-methods/`. No package installation is needed. With Node 20 or later, run all tests from the repository root:

```sh
node --test math-methods/tests/
```

The vendored KaTeX and math.js versions are recorded in `vendor/VERSIONS.md`. They are used in the browser and by the Node tests.

## File map

| Path | Purpose |
| --- | --- |
| `index.html` | Static entry point, fonts, and vendored library loading |
| `assets/css/site.css` | Responsive layout and light/dark theme tokens |
| `assets/js/app.js`, `router.js`, `i18n.js` | Page views, hash routes, bilingual UI |
| `assets/js/render.js`, `plot.js` | Exercise form, feedback, math rendering, solution SVG |
| `assets/js/checker.js`, `rng.js`, `progress.js` | Answer checking, deterministic seeds, local progress |
| `assets/js/feedback.js` | Google Form address for the footer feedback link and per-problem report link; both stay hidden while it is empty |
| `content/modules.js` | Ordered module registry |
| `content/generators/*.js`, `format.js` | Pure problem generators and shared algebra/TeX helpers |
| `content/lessons/<module>.en.html`, `.zh.html` | English and Traditional Chinese lesson fragments |
| `tests/*.test.js` | Checker, generator, mathematical, route, plot, and UI contract tests |
| `vendor/` | Pinned KaTeX and math.js; do not edit these files |

`qa/` and `.source-notes/` are working material and are gitignored. They are not part of the public site.

## Add a generator

1. Add a pure `generate(rng, level)` function to the relevant `content/generators/<module>.js`. It must return the same problem for the same seed and level. Register it in that file's exported generator array with a stable `id`, bilingual `title`, `levels`, `minDistinct: 40`, and `generate`. The 300-seed harness checks distinct prompts in **each language at every level**. A lower `minDistinct` requires a code comment explaining a real content constraint.
2. Return `id` (`<module>/<generator>`), `level`, `vars`, `domain`, bilingual `prompt`, nonempty `fields`, at least two bilingual `hints` and `solution` steps, and at least one targeted `misconceptions` entry. Each field needs `key`, `type`, bilingual `label`, `answer`, and `options` for choices. An expression field's declared variables and sampling domain must match its answer. See the design document for field types and checking rules.
3. Build backward from clean answers and verify economic restrictions, first-order conditions, and second-order signs. Give the highest level a distinct, harder prompt. Use `format.js` helpers (`polynomial`, `linear`, `term`, `frac`, `texProduct`, `texRate`, `derivative`) to keep displayed algebra valid and reduced. TeX powers need braces. Keep numeric factors separate where adjacency would look like a single number.
4. Add a misconception answer that the checker rejects and bilingual feedback explaining the error. Add an independent mathematical test when the generator has nontrivial calculus or economic conditions. The shared harness runs 300 seeds per level, checks bilingual text and KaTeX, reference answers, misconceptions, determinism, format rules, and prompt variety.
5. If a one-dimensional curve clarifies a solution, add a `plot` object with `expr`, `variable`, `range`, `axis`, and `points` (`{x, kind}`). `plot.js` evaluates the generated expression and draws it when the solution opens.

## Lesson structure and source rule

Each module has paired `.en.html` and `.zh.html` fragments. Keep the same mathematical sequence in both. A lesson opens with an **At a glance** (`重點速覽`) summary, then contains **Motivation**, **Key ideas**, 2–3 collapsible **Worked examples**, **Common mistakes**, and a **Further reading** line naming the relevant Chiang & Wainwright sections. Math inside `$...$` or `$$...$$` is rendered with KaTeX.

The summary is a `<section class="lesson-glance" id="<module>-glance">` list. Each item pairs a `glance-formula` (inline math split into `glance-chunk` spans, which wrap between chunks but never inside one) with a one-sentence conclusion and a "Why? ↓" link to the matching key idea; a final `glance-warn` item links to the common mistakes. Each key idea and the mistakes section is a `<div class="lesson-idea" id="<module>-<slug>">` ending in a "↑ Back to summary" link. Jump links use `<a class="jump-link" href="#id" data-jump="id">`: `app.js` scrolls to the target instead of following the href, because the hash is reserved for routing. Both languages must share the same jump targets; the lesson test checks this.

Chiang and Wainwright, *Fundamental Methods of Mathematical Economics*, 4th ed., is a pedagogical reference. Paraphrase its ideas and motivation. Use new wording and numbers for examples and exercises. Do not paste book paragraphs, reproduce its figures, transcribe exercise sets or answers, or add or link the PDF in this repository or public site.
