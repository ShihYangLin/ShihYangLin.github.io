# Vendored libraries

| Library | Version | Source | Files |
|---|---|---|---|
| KaTeX | 0.18.9 | `npm pack katex@0.18.9` (https://registry.npmjs.org/katex/-/katex-0.18.9.tgz), `dist/` | `katex.mjs`, `katex.min.js`, `katex.min.css`, `fonts/`, `contrib/auto-render.*`, `LICENSE` (MIT) |
| math.js | 15.2.0 | `npm pack mathjs@15.2.0` (https://registry.npmjs.org/mathjs/-/mathjs-15.2.0.tgz), `lib/browser/math.js` | UMD bundle `math.js`, `LICENSE` (Apache-2.0) |

Loading notes:
- KaTeX: import `katex.mjs` as an ES module in both browser and Node.
- math.js: `math.js` is a UMD bundle. In the browser load it with a classic `<script>` (global `math`). In Node tests load it with `createRequire(import.meta.url)('../vendor/mathjs/math.js')`.
