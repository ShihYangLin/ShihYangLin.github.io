import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import katex from '../vendor/katex/katex.mjs';
import { modules } from '../content/modules.js';
import { createRng } from '../assets/js/rng.js';
import { createChecker } from '../assets/js/checker.js';
import { loadMathJs } from './load-mathjs.js';

const checker = createChecker(loadMathJs());

test('derivative lesson cards render and carry the exact reading line', () => {
  for (const [lang, ending] of [
    ['en', 'Further reading: Chiang &amp; Wainwright §§7.2–7.3'],
    ['zh', '延伸閱讀：Chiang &amp; Wainwright §§7.2–7.3']
  ]) {
    const html = readFileSync(new URL(`../content/lessons/deriv-rules.${lang}.html`, import.meta.url), 'utf8');
    assert.ok(html.includes(ending));
    mathRenders(html.replaceAll('&gt;', '>').replaceAll('&lt;', '<'));
  }
});

function mathRenders(value) {
  const matches = [...value.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g)];
  for (const match of matches) katex.renderToString(match[1] || match[2], { throwOnError: true, strict: 'error' });
}

function bilingual(value, label) {
  assert.ok(value && typeof value.en === 'string' && value.en.trim(), `${label} EN`);
  assert.ok(value && typeof value.zh === 'string' && value.zh.trim(), `${label} ZH`);
  mathRenders(value.en);
  mathRenders(value.zh);
}

for (const module of modules) {
  for (const generator of module.generators) {
    for (const level of generator.levels) {
      test(`${module.id}/${generator.id} level ${level}: 300 seeds`, () => {
        for (let seed = 0; seed < 300; seed++) {
          const problem = generator.generate(createRng(seed), level);
          const where = `${generator.id} L${level} seed ${seed}`;
          assert.deepEqual(problem, generator.generate(createRng(seed), level), `${where} deterministic`);
          assert.equal(problem.id, `${module.id}/${generator.id}`);
          assert.equal(problem.level, level);
          assert.ok(Array.isArray(problem.fields) && problem.fields.length, where);
          bilingual(problem.prompt, `${where} prompt`);
          assert.ok(problem.hints.length >= 2, where);
          assert.ok(problem.solution.length >= 2, where);
          problem.hints.forEach((value, index) => bilingual(value, `${where} hint ${index}`));
          problem.solution.forEach((value, index) => bilingual(value, `${where} solution ${index}`));
          assert.ok(problem.misconceptions.length >= 1, where);
          for (const [name, [low, high]] of Object.entries(problem.domain)) {
            assert.ok(problem.vars.includes(name) && Number.isFinite(low) && Number.isFinite(high) && low < high && Math.abs(low) <= 1000 && Math.abs(high) <= 1000, where);
          }
          const answers = Object.fromEntries(problem.fields.map(field => {
            bilingual(field.label, `${where} label`);
            if (field.type !== 'choice' && field.type !== 'set') {
              const parsed = checker.parseAnswer(field.answer, field.type === 'expr' ? problem.vars : []);
              assert.ok(parsed.ok, `${where}: ${field.key} ${parsed.error}`);
              assert.ok(field.answer.length <= 160, where);
            }
            assert.equal(checker.checkField(field.answer, field, problem).status, 'correct', `${where} ${field.key} reference`);
            return [field.key, field.answer];
          }));
          assert.equal(checker.checkMulti(answers, problem).status, 'correct', where);
          for (const item of problem.misconceptions) {
            const field = problem.fields.find(value => value.key === item.key);
            assert.ok(field, `${where} misconception field`);
            bilingual(item.feedback, `${where} misconception feedback`);
            assert.equal(checker.checkField(item.answer, { ...field, answer: field.answer }, problem).status, 'incorrect', `${where} misconception ${item.key}`);
            assert.equal(checker.matchMisconception({ ...answers, [item.key]: item.answer }, problem)?.answer, item.answer, `${where} targeted feedback`);
          }
        }
      });
    }
  }
}
