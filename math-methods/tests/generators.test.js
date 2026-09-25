import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import katex from '../vendor/katex/katex.mjs';
import { modules } from '../content/modules.js';
import { derivative, frac, linear, polynomial, term, texPowers, texProduct } from '../content/generators/format.js';
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
        const prose = [...html.replace(/<details>[\s\S]*?<\/details>/g, '').replace(/<section class="lesson-glance"[\s\S]*?<\/section>/, '').replace(/<p class="jump-back">[\s\S]*?<\/p>/g, '').matchAll(/<p(?: [^>]*)?>([\s\S]*?)<\/p>/g)].map(match => match[1].replace(/<[^>]+>/g, ' ')).join(' ');
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
  assert.equal(texProduct(4, '5^{\\sqrt t}'), '4\\cdot 5^{\\sqrt t}');
  assert.equal(texProduct(4, 't^2'), '4t^2');
  assert.equal(texProduct(2, '\\ln t'), '2\\ln t');
  assert.equal(texProduct(1, '\\sqrt L'), '\\sqrt L');
  assert.equal(derivative('f', 1, 'x'), "f'(x)");
  assert.equal(derivative('f', 3, 'x'), "f'''(x)");
  assert.equal(derivative('f', 4, 'x'), 'f^{(4)}(x)');
  assert.equal(frac(16, 14, true), '\\frac{8}{7}');
  assert.equal(frac(-2, 20), '-1/10');
  assert.equal(frac(4, 2, true), '2');
});

function cleanAlgebra(value, where) {
  assert.doesNotMatch(value, /[A-Za-z]\^1(?!\d)|(^|[^\d])1[A-Za-z]|\+\-|-[\s]+-/, where);
}

function mathRenders(value, generated = false) {
  const matches = [...value.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g)];
  for (const match of matches) {
    const math = match[1] || match[2];
    assert.doesNotMatch(math, /\^\(/, 'TeX powers use braces, not parser parentheses');
    assert.doesNotMatch(math, /\^\{\([123]\)\}/, 'derivatives of orders 1–3 use primes');
    assert.doesNotMatch(math, /\\cdot(?!s)\s*(?:[A-Za-z]|\\(?:ln|sqrt)\b)/, 'multiplication dots precede numeric factors only');
    if (generated) {
      assert.doesNotMatch(math, /(?<!\d)[+-]1\(/, 'omit signed unit coefficients before parentheses');
      assert.doesNotMatch(math, /(\\frac\{[^}]+\}\{[^}]+\})=\1/, 'do not repeat the same fraction across an equality');
      assert.doesNotMatch(math, /(?<![\d.])1\\(?:sqrt|ln)\b|(?<![\d.])1e\^/, 'omit unit coefficients before functions');
      assert.doesNotMatch(math, /\d{3,}\^\{\\sqrt/, 'separate a coefficient from a numeric exponential base');
      for (const fraction of math.matchAll(/(?<![\d.^])(-?\d+)\s*\/\s*(\d+)(?![\d!])/g)) {
        const p = Math.abs(Number(fraction[1])), q = Number(fraction[2]);
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        assert.ok(gcd(p, q) <= 1, `unreduced displayed fraction ${fraction[0]} in ${math}`);
      }
      for (const fraction of math.matchAll(/(?<![\d.^])(\d+)[A-Za-z]\/\s*(\d+)(?!\d)/g)) {
        const p = Number(fraction[1]), q = Number(fraction[2]);
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        assert.ok(gcd(p, q) <= 1, `unreduced displayed coefficient ${fraction[0]} in ${math}`);
      }
      for (const fraction of math.matchAll(/\\frac\{(-?\d+)\}\{(\d+)\}/g)) {
        const p = Math.abs(Number(fraction[1])), q = Number(fraction[2]);
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        assert.ok(gcd(p, q) <= 1, `unreduced TeX fraction ${fraction[0]} in ${math}`);
      }
    }
    katex.renderToString(math, { throwOnError: true, strict: 'error' });
  }
}

test('Gate 3b minDistinct applies to every generator and top-level prompts differ', () => {
  for (const module of modules) for (const generator of module.generators) {
    assert.ok(Object.hasOwn(generator, 'minDistinct'), `${module.id}/${generator.id} declares minDistinct`);
    assert.ok(Number.isInteger(generator.minDistinct) && generator.minDistinct >= 40, `${module.id}/${generator.id} threshold`);
    const counts = new Map();
    for (const level of generator.levels) {
      const prompts = { en: new Set(), zh: new Set() };
      for (let seed = 0; seed < 300; seed++) {
        const problem = generator.generate(createRng(seed), level);
        prompts.en.add(problem.prompt.en); prompts.zh.add(problem.prompt.zh);
      }
      for (const lang of ['en', 'zh']) assert.ok(prompts[lang].size >= generator.minDistinct, `${module.id}/${generator.id} L${level} ${lang}: ${prompts[lang].size}`);
      counts.set(level, prompts);
    }
    if (generator.levels.length > 1) {
      const levels = [...generator.levels].sort((a, b) => a - b), top = levels.at(-1), prior = levels.at(-2);
      for (let seed = 0; seed < 300; seed++) {
        const upper = generator.generate(createRng(seed), top), lower = generator.generate(createRng(seed), prior);
        for (const lang of ['en', 'zh']) assert.notEqual(upper.prompt[lang], lower.prompt[lang], `${module.id}/${generator.id} seed ${seed} ${lang} top-level prompt`);
      }
    }
  }
});

test('Gate 2b numeric factors remain separate in timber and Jacobian templates', () => {
  const timber = modules.find(item => item.id === 'timing').generators.find(item => item.id === 'timber');
  const jacobian = modules.find(item => item.id === 'partials').generators.find(item => item.id === 'jacobian');
  for (let seed = 0; seed < 300; seed++) {
    const tree = timber.generate(createRng(seed), 3);
    assert.match(tree.prompt.en, /V\(t\)=\d+\\cdot \d+\^\{\\sqrt t\}/);
    const jac = jacobian.generate(createRng(seed), 3);
    const k = jac.prompt.en.match(/\$v=(\d+)\(/)?.[1];
    if (k) {
      const coefficient = jac.solution[0].en.match(/\(v_x,v_y\)=(\d+)u/)?.[1];
      assert.equal(Number(coefficient), 2 * Number(k), `Jacobian seed ${seed}`);
    }
  }
});

test('Gate 2b displayed fractions and function coefficients are reduced across every template', () => {
  for (const module of modules) for (const generator of module.generators) for (const level of generator.levels) {
    for (let seed = 0; seed < 40; seed++) {
      const problem = generator.generate(createRng(seed), level);
      for (const value of [problem.prompt, ...problem.hints, ...problem.solution]) {
        mathRenders(value.en, true);
        mathRenders(value.zh, true);
      }
    }
  }
});

test('at-a-glance lessons lead with the summary and every jump link has a target', () => {
  for (const module of modules.filter(item => item.generators.length)) {
    const pages = ['en', 'zh'].map(lang => readFileSync(new URL(`../content/lessons/${module.id}.${lang}.html`, import.meta.url), 'utf8'));
    if (!pages.some(html => html.includes('lesson-glance'))) continue;
    const jumpSets = pages.map((html, index) => {
      const heading = index === 0 ? 'At a glance' : '重點速覽';
      assert.match(html, new RegExp(`</h2>\\s*<section class="lesson-glance" id="${module.id}-glance">\\s*<h3>${heading}</h3>`), `${module.id} summary first`);
      const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]));
      const jumps = [...html.matchAll(/<a class="jump-link" href="#([^"]+)" data-jump="([^"]+)">/g)];
      assert.ok(jumps.length >= 4, `${module.id} jump links`);
      for (const [, href, jump] of jumps) {
        assert.equal(href, jump, `${module.id} href matches data-jump`);
        assert.ok(ids.has(jump), `${module.id} missing target ${jump}`);
      }
      return [...new Set(jumps.map(match => match[2]))].sort().join(',');
    });
    assert.equal(jumpSets[0], jumpSets[1], `${module.id} en and zh share jump targets`);
  }
});

test('Gate 3a prime notation and multiplication dots across every lesson and generator', () => {
  for (const module of modules) {
    for (const lang of ['en', 'zh']) {
      const html = readFileSync(new URL(`../content/lessons/${module.id}.${lang}.html`, import.meta.url), 'utf8');
      mathRenders(html.replaceAll('&gt;', '>').replaceAll('&lt;', '<'));
    }
    for (const generator of module.generators) for (const level of generator.levels) for (let seed = 0; seed < 20; seed++) {
      const problem = generator.generate(createRng(seed), level);
      for (const pair of [problem.prompt, ...problem.hints, ...problem.solution, ...problem.fields.map(item => item.label), ...problem.misconceptions.map(item => item.feedback)]) {
        mathRenders(pair.en, true);
        mathRenders(pair.zh, true);
      }
    }
  }
});

test('Gate 2b market parameters and KaTeX field labels are explicit', () => {
  const market = modules.find(item => item.id === 'partials').generators.find(item => item.id === 'market-cs');
  const renderer = readFileSync(new URL('../assets/js/render.js', import.meta.url), 'utf8');
  assert.match(renderer, /querySelectorAll\('\.answer-field label, \.answer-field legend'\)\.forEach\(typeset\)/);
  for (let seed = 0; seed < 300; seed++) {
    const problem = market.generate(createRng(seed), 2);
    assert.match(problem.prompt.en, /Q_d=a-bP.*Q_s=-c\+dP.*a=\d+.*b=\d+.*c=\d+.*d=\d+/);
    assert.match(problem.prompt.zh, /Q_d=a-bP.*Q_s=-c\+dP.*a=\d+.*b=\d+.*c=\d+.*d=\d+/);
    assert.ok(problem.fields.filter(item => ['pa', 'qc'].includes(item.key)).every(item => item.label.en.includes('$')));
  }
});

test('optimization economics and inflections satisfy their stated restrictions', () => {
  const math = loadMathJs();
  const opt = modules.find(item => item.id === 'opt-one');
  const profit = opt.generators.find(item => item.id === 'profit-max');
  const inflection = opt.generators.find(item => item.id === 'inflection');
  const classify = opt.generators.find(item => item.id === 'classify');
  for (let seed = 0; seed < 300; seed++) {
    const p = profit.generate(createRng(seed), 3);
    const q = Number(p.fields.find(item => item.key === 'q').answer);
    const inverseDemand = p.prompt.en.match(/P\(Q\)=([^$]+)/)[1];
    const cost = p.prompt.en.match(/C\(Q\)=([^$]+)/)[1];
    const objective = `Q*(${inverseDemand})-(${cost})`;
    const first = math.derivative(objective, 'Q');
    const secondProfit = math.derivative(first, 'Q');
    assert.ok(q > 0 && math.evaluate(inverseDemand, { Q: q }) > 0, `profit seed ${seed}`);
    assert.ok(Math.abs(first.evaluate({ Q: q })) < 1e-8 && secondProfit.evaluate({ Q: q }) < 0, `profit FOC/SOC seed ${seed}`);
    assert.ok(Math.abs(math.evaluate(objective, { Q: q }) - Number(p.fields.find(item => item.key === 'profit').answer)) < 1e-8);
    assert.equal(p.fields.find(item => item.key === 'soc').answer, 'negative');
    assert.match(p.solution[1].en, /Strict concavity/);
    const point = inflection.generate(createRng(seed), 2);
    const x = Number(point.fields.find(item => item.key === 'x').answer);
    const f = point.prompt.en.match(/f\(x\)=([^$]+)/)[1];
    const second = math.derivative(math.derivative(f, 'x'), 'x');
    assert.ok(second.evaluate({ x: x - 0.25 }) * second.evaluate({ x: x + 0.25 }) < 0, `inflection seed ${seed}`);
    const candidates = classify.generate(createRng(seed), 2);
    const cf = candidates.prompt.en.match(/f\(x\)=([^$]+)/)[1];
    const curvature = math.derivative(math.derivative(cf, 'x'), 'x');
    const roots = candidates.fields.find(item => item.key === 'roots').answer.slice(1, -1).split(',').map(Number);
    assert.ok(roots[0] < roots[1]);
    assert.equal(candidates.fields.find(item => item.key === 'left').answer, curvature.evaluate({ x: roots[0] }) < 0 ? 'max' : 'min');
    assert.equal(candidates.fields.find(item => item.key === 'right').answer, curvature.evaluate({ x: roots[1] }) < 0 ? 'max' : 'min');
  }
});

test('Taylor lower levels use polynomial or rational functions and P2 matches derivatives', () => {
  const math = loadMathJs();
  const mod = modules.find(item => item.id === 'taylor');
  const poly = mod.generators.find(item => item.id === 'taylor-poly');
  for (const generator of mod.generators) for (const level of generator.levels.filter(value => value <= 2)) {
    for (let seed = 0; seed < 300; seed++) {
      const problem = generator.generate(createRng(seed), level);
      assert.doesNotMatch(problem.prompt.en, /e\^x|\\ln|\\sqrt/);
    }
  }
  for (const level of poly.levels) for (let seed = 0; seed < 300; seed++) {
    const problem = poly.generate(createRng(seed), level);
    const center = Number(problem.prompt.en.match(/x_0=(-?\d+)/)[1]);
    let f = problem.prompt.en.match(/f\(x\)=([^$]+)/)[1];
    f = f.replace(/\\frac\{(\d+)\}\{([^}]+)\}/, '($1)/($2)').replace('\\ln x', 'log(x)').replace('\\sqrt{x}', 'sqrt(x)').replace('e^x', 'exp(x)');
    const answer = problem.fields[0].answer;
    for (let order = 0; order <= 2; order++) {
      let original = f, approximation = answer;
      for (let i = 0; i < order; i++) { original = math.derivative(original, 'x'); approximation = math.derivative(approximation, 'x'); }
      const actual = typeof original === 'string' ? math.evaluate(original, { x: center }) : original.evaluate({ x: center });
      const estimated = typeof approximation === 'string' ? math.evaluate(approximation, { x: center }) : approximation.evaluate({ x: center });
      assert.ok(Math.abs(actual - estimated) < 1e-8, `Taylor P2 L${level} seed ${seed} order ${order}`);
    }
  }
});

function bilingual(value, label) {
  assert.ok(value && typeof value.en === 'string' && value.en.trim(), `${label} EN`);
  assert.ok(value && typeof value.zh === 'string' && value.zh.trim(), `${label} ZH`);
  mathRenders(value.en, true);
  mathRenders(value.zh, true);
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
            if (/[_^\\]|f'\(x\)|\b(?:MC|MR)\([^)]+\)|\b(?:dx\/dy|dR\/dL)\b|^[xyQk] =/.test(field.label.en)) assert.match(field.label.en, /\$[^$]+\$/, `${where} math label wrapped for KaTeX`);
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
