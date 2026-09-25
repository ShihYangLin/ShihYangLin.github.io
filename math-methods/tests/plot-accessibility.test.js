import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { modules } from '../content/modules.js';
import { createRng } from '../assets/js/rng.js';
import { plotSvg } from '../assets/js/plot.js';
import { loadMathJs } from './load-mathjs.js';

const math = loadMathJs();
const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('solution plots use each generated curve and mark the solved point', () => {
  for (const moduleId of ['opt-one', 'timing']) {
    const module = modules.find(item => item.id === moduleId);
    for (const generator of module.generators) {
      for (const level of generator.levels) for (let seed = 0; seed < 40; seed++) {
        const problem = generator.generate(createRng(seed), level);
        if (generator.id === 'nth-derivative') { assert.equal(problem.plot, undefined); continue; }
        assert.ok(problem.plot, `${problem.id} plot metadata`);
        const { expr, variable, range, points } = problem.plot;
        const compiled = math.compile(expr);
        for (const point of points) {
          assert.ok(point.x >= range[0] && point.x <= range[1]);
          const derivative = math.derivative(expr, variable);
          if (point.kind !== 'inflection') assert.ok(Math.abs(derivative.evaluate({ [variable]: point.x })) < 1e-7, `${problem.id} stationary point`);
          else {
            const second = math.derivative(derivative, variable);
            assert.ok(Math.abs(second.evaluate({ [variable]: point.x })) < 1e-7, `${problem.id} inflection`);
            assert.ok(second.evaluate({ [variable]: point.x - 0.1 }) * second.evaluate({ [variable]: point.x + 0.1 }) < 0);
          }
          assert.ok(Number.isFinite(compiled.evaluate({ [variable]: point.x })));
        }
        for (const lang of ['en', 'zh']) {
          const svg = plotSvg(problem.plot, lang, math);
          assert.match(svg, /<svg viewBox="0 0 560 265" role="img" aria-label="/);
          assert.match(svg, /class="plot-curve"/);
          assert.equal((svg.match(/class="plot-point"/g) || []).length, points.length);
          assert.ok(!svg.includes('NaN') && !svg.includes('Infinity'));
          assert.ok(svg.includes(`>${variable}</text>`));
        }
      }
    }
  }
});

test('keyboard and bilingual accessible-name hooks remain in the app', () => {
  const app = source('../assets/js/app.js'), render = source('../assets/js/render.js');
  const css = source('../assets/css/site.css'), index = source('../index.html');
  assert.match(index, /<main id="app" tabindex="-1">/);
  assert.match(app, /hashchange', \(\) => render\(true\)/);
  assert.match(app, /target\?\.focus\(\)/);
  assert.match(app, /englishButton.*chineseButton/);
  assert.match(render, /<form id="answer-form" novalidate>/);
  assert.match(render, /type="submit">\$\{t\('check'\)\}/);
  assert.match(render, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(render, /<label>\$\{t\('generator'\)\}<select/);
  assert.match(render, /<label>\$\{t\('difficulty'\)\}<select/);
  assert.match(css, /:focus-visible \{ outline: 3px solid var\(--accent\)/);
  assert.match(css, /\.plot-curve \{[^}]*var\(--accent\)/);
  assert.match(css, /\.plot-point \{[^}]*var\(--ink\)/);
});
