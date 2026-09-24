import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import katex from '../vendor/katex/katex.mjs';
import { modules } from '../content/modules.js';
import { linear, polynomial, term, texPowers } from '../content/generators/format.js';
import { createRng } from '../assets/js/rng.js';
import { createChecker } from '../assets/js/checker.js';
import { loadMathJs } from './load-mathjs.js';

const checker = createChecker(loadMathJs());

test('active lessons have the revised structure and a single section sign in reading', () => {
  for (const module of modules.filter(item => item.generators.length)) {
    for (const lang of ['en', 'zh']) {
      const html = readFileSync(new URL(`../content/lessons/${module.id}.${lang}.html`, import.meta.url), 'utf8');
      for (const heading of lang === 'en' ? ['Motivation', 'Key ideas', 'Worked examples', 'Common mistakes'] : ['動機', '核心概念', '範例詳解', '常見錯誤']) {
        assert.ok(html.includes(`<h3>${heading}</h3>`), `${module.id} ${lang} ${heading}`);
      }
      assert.ok((html.match(/<details>/g) || []).length >= 2, `${module.id} ${lang} examples`);
      assert.match(html, lang === 'en' ? /Further reading: Chiang &amp; Wainwright §(?!§)/ : /延伸閱讀：Chiang &amp; Wainwright §(?!§)/);
      mathRenders(html.replaceAll('&gt;', '>').replaceAll('&lt;', '<'));
      if (lang === 'en') {
        const prose = [...html.replace(/<details>[\s\S]*?<\/details>/g, '').matchAll(/<p(?: [^>]*)?>([\s\S]*?)<\/p>/g)].map(match => match[1].replace(/<[^>]+>/g, ' ')).join(' ');
        const count = prose.trim().split(/\s+/).length;
        assert.ok(count >= 500 && count <= 900, `${module.id} lesson prose: ${count} words`);
        const motivation = html.match(/<h3>Motivation<\/h3>([\s\S]*?)<h3>Key ideas<\/h3>/)?.[1] || '';
        assert.ok((motivation.match(/<p>/g) || []).length >= 2, `${module.id} motivation paragraphs`);
      }
    }
  }
});

test('Chinese MRP wording and glossary distinguish MRP from VMP', () => {
  const lesson = readFileSync(new URL('../content/lessons/deriv-rules.zh.html', import.meta.url), 'utf8');
  const generatorSource = readFileSync(new URL('../content/generators/deriv-rules.js', import.meta.url), 'utf8');
  const plan = readFileSync(new URL('../../docs/superpowers/plans/2026-09-25-math-methods-practice.md', import.meta.url), 'utf8');
  assert.match(lesson, /邊際收益產量（MRP）/);
  assert.match(generatorSource, /邊際收益產量（MRP）/);
  assert.doesNotMatch(generatorSource, /邊際收益產值/);
  assert.match(plan, /邊際收益產量（MRP）/);
  assert.match(plan, /邊際產值（VMP）/);
});

test('shared formatter suppresses unit powers, unit coefficients and doubled signs', () => {
  assert.equal(term(1, 'x'), 'x');
  assert.equal(texPowers('4x^(1/2)+3x^(-2)'), '4x^{1/2}+3x^{-2}');
  assert.equal(linear(-1, 'x', -2), '-x-2');
  assert.equal(polynomial([[1, 'x', 1], [-3, 'x', 2], [0], [2]]), 'x-3x^2+2');
});

function cleanAlgebra(value, where) {
  assert.doesNotMatch(value, /[A-Za-z]\^1(?!\d)|(^|[^\d])1[A-Za-z]|\+\-|-[\s]+-/, where);
}

function mathRenders(value) {
  const matches = [...value.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g)];
  for (const match of matches) {
    assert.doesNotMatch(match[1] || match[2], /\^\(/, 'TeX powers use braces, not parser parentheses');
    katex.renderToString(match[1] || match[2], { throwOnError: true, strict: 'error' });
  }
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
          cleanAlgebra(problem.prompt.en, where);
          cleanAlgebra(problem.prompt.zh, where);
          assert.ok(problem.hints.length >= 2, where);
          assert.ok(problem.solution.length >= 2, where);
          problem.hints.forEach((value, index) => { bilingual(value, `${where} hint ${index}`); cleanAlgebra(value.en, where); cleanAlgebra(value.zh, where); });
          problem.solution.forEach((value, index) => { bilingual(value, `${where} solution ${index}`); cleanAlgebra(value.en, where); cleanAlgebra(value.zh, where); });
          assert.ok(problem.misconceptions.length >= 1, where);
          for (const [name, [low, high]] of Object.entries(problem.domain)) {
            assert.ok(problem.vars.includes(name) && Number.isFinite(low) && Number.isFinite(high) && low < high && Math.abs(low) <= 1000 && Math.abs(high) <= 1000, where);
          }
          const answers = Object.fromEntries(problem.fields.map(field => {
            bilingual(field.label, `${where} label`);
            const englishWords = field.label.en.replace(/\$[^$]*\$/g, '');
            if (/[A-Za-z]{3,}/.test(englishWords)) assert.notEqual(field.label.zh, field.label.en, `${where} translated label ${field.key}`);
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
