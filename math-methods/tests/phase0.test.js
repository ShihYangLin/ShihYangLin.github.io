import test from 'node:test';
import assert from 'node:assert/strict';
import { modules } from '../content/modules.js';
import { resolveLanguage } from '../assets/js/i18n.js';
import { parseRoute } from '../assets/js/router.js';

test('registry has ten unique modules in the intended groups', () => {
  assert.equal(modules.length, 10);
  assert.equal(new Set(modules.map(module => module.id)).size, 10);
  assert.equal(modules.filter(module => module.group === 'calculus').length, 6);
  assert.equal(modules.filter(module => module.group === 'optimization').length, 4);
  for (const module of modules) {
    assert.ok(module.title.en && module.title.zh && module.sections);
    const expected = { limits: 5, 'deriv-basics': 4, 'deriv-rules': 6, partials: 5, 'exp-log': 6, timing: 2, 'opt-one': 5, taylor: 3 }[module.id] || 0;
    assert.equal(module.generators.length, expected);
  }
});

test('routes cover map, module, problem, progress, and unknown paths', () => {
  assert.deepEqual(parseRoute('#/'), { kind: 'map' });
  assert.deepEqual(parseRoute('#/progress'), { kind: 'progress' });
  assert.equal(parseRoute('#/limits').module.id, 'limits');
  assert.deepEqual(parseRoute('#/lagrange/cobb-douglas?level=2&seed=81723'), {
    kind: 'problem', module: modules[9], generator: 'cobb-douglas', level: 2, seed: 81723
  });
  for (const path of ['#/missing', '#/limits/a?level=4&seed=1', '#/limits/a?level=2&seed=-2']) {
    assert.equal(parseRoute(path).kind, 'unknown');
  }
  const rewritten = [];
  const defaulted = parseRoute('#/deriv-rules/product', { seed: 42, replaceHash: hash => rewritten.push(hash) });
  assert.equal(defaulted.level, 1);
  assert.equal(defaulted.seed, 42);
  assert.deepEqual(rewritten, ['#/deriv-rules/product?level=1&seed=42']);
  assert.equal(parseRoute('#/deriv-rules/product?level=2', { seed: 9, replaceHash: hash => rewritten.push(hash) }).seed, 9);
});

test('language resolution follows URL, storage, then browser preference', () => {
  assert.equal(resolveLanguage('?lang=zh', 'en', 'en-US'), 'zh');
  assert.equal(resolveLanguage('', 'zh', 'en-US'), 'zh');
  assert.equal(resolveLanguage('', null, 'zh-TW'), 'zh');
  assert.equal(resolveLanguage('?lang=invalid', null, 'en-US'), 'en');
});
