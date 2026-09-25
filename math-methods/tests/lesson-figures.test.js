import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { modules } from '../content/modules.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = (module, lang) => readFileSync(join(root, 'content/lessons', `${module}.${lang}.html`), 'utf8');
const figures = html => [...html.matchAll(/<figure class="lesson-figure" id="([^"]+)"[^>]*>([\s\S]*?)<\/figure>/g)];
const expected = {
  limits: ['limits-fig-sides', 'limits-fig-continuity'],
  'deriv-basics': ['deriv-basics-fig-secant'],
  'deriv-rules': ['deriv-rules-fig-mr', 'deriv-rules-fig-acmc'],
  partials: ['partials-fig-shift'],
  'exp-log': ['exp-log-fig-compound', 'exp-log-fig-mirror'],
  'opt-one': ['opt-one-fig-sign', 'opt-one-fig-profit'],
  taylor: ['taylor-fig-approx'], timing: ['timing-fig-rate'],
  'opt-multi': ['opt-multi-fig-contours'],
  lagrange: ['lagrange-fig-utility', 'lagrange-fig-cost']
};

test('every lesson has paired, accessible inline figures with theme classes', () => {
  for (const module of modules) {
    const en = figures(source(module.id, 'en'));
    const zh = figures(source(module.id, 'zh'));
    const ids = en.map(match => match[1]);
    assert.deepEqual(ids, expected[module.id] || [], module.id);
    assert.deepEqual(zh.map(match => match[1]), ids, `${module.id}: bilingual ids`);
    for (const lang of ['en', 'zh']) {
      const html = source(module.id, lang);
      const allIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
      assert.equal(new Set(allIds).size, allIds.length, `${module.id}.${lang}: duplicate id`);
      for (const [id, fragment] of figures(html).map(match => [match[1], match[2]])) {
        assert.match(fragment, new RegExp(`<svg viewBox="0 0 560 \\d+" role="img" aria-labelledby="${id}-title ${id}-desc"`));
        assert.match(fragment, new RegExp(`<title id="${id}-title">[^<]+<\\/title>`));
        assert.match(fragment, new RegExp(`<desc id="${id}-desc">[^<]+<\\/desc>`));
        assert.match(fragment, /<figcaption>[^<]+<\/figcaption>/);
        const svg = fragment.match(/<svg\b[\s\S]*?<\/svg>/)?.[0];
        assert.ok(svg, `${id}: svg`);
        assert.ok(!svg.includes('$'), `${id}: KaTeX delimiter inside SVG`);
        assert.doesNotMatch(svg, /(?:fill|stroke)="#|rgb\(/i, `${id}: color literal`);
        assert.doesNotMatch(svg, /NaN|Infinity/, `${id}: invalid coordinate`);
        assert.match(html, new RegExp(`<!-- figure:${id} -->[\\s\\S]*<!-- \\/figure:${id} -->`));
      }
    }
    // Coordinates and path data are identical; only text nodes may differ.
    for (let i = 0; i < en.length; i++) {
      const geometry = html => [...html.matchAll(/<(?:path|circle|rect)\b[^>]*>/g)].map(match => match[0]);
      assert.deepEqual(geometry(en[i][2]), geometry(zh[i][2]), `${ids[i]}: bilingual geometry`);
    }
  }
});

test('lesson figure generator has no drift', () => {
  const result = spawnSync(process.execPath, [join(root, 'tools/lesson-figures.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Checked 15 figures in both languages; no drift/);
});

test('reviewed figure placements and static interactive secant state', () => {
  for (const lang of ['en', 'zh']) {
    const limits = source('limits', lang);
    assert.match(limits, /id="limits-sides"[\s\S]*?id="limits-fig-sides"[\s\S]*?class="jump-back"[\s\S]*?id="limits-continuity"[\s\S]*?id="limits-fig-continuity"/);
    const lagrange = source('lagrange', lang);
    assert.match(lagrange, /id="lagrange-foc"[\s\S]*?id="lagrange-fig-utility"[\s\S]*?id="lagrange-fig-cost"[\s\S]*?class="jump-back"/);
    const secant = figures(source('deriv-basics', lang)).find(match => match[1] === 'deriv-basics-fig-secant');
    assert.match(secant[0], /data-interactive="secant"/);
    assert.match(secant[0], /data-scale="[^\"]+"/);
    assert.match(secant[0], /fig-secant-active/);
    assert.match(secant[0], /fig-secant-b/);
    assert.match(secant[0], /clipPath/);
    assert.doesNotMatch(secant[0], /fig-secant-(?:far|mid|near)/);
    assert.match(secant[0], /h=1[^<]*3[^<]*2/);
  }
});

test('lesson labels use mobile-size type and only theme-token strokes', () => {
  const css = readFileSync(join(root, 'assets/css/site.css'), 'utf8');
  assert.match(css, /\.lesson-figure \.fig-label[^}]*18px/);
  assert.match(css, /\.lesson-figure \.fig-sign[^}]*22px/);
  assert.match(css, /\.fig-secant-far[^}]*var\(--muted\)/);
  assert.doesNotMatch(css.match(/\.lesson-figure \{[\s\S]*?(?=\.typing-help)/)?.[0] || '', /#[\da-f]{3,8}\b|rgb\(/i);
});
