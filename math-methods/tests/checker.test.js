import test from 'node:test';
import assert from 'node:assert/strict';
import { ambiguityNotice, createChecker, parseSetEntries } from '../assets/js/checker.js';
import { invalidDisplay, localizedError } from '../assets/js/render.js';
import { loadMathJs } from './load-mathjs.js';

const checker = createChecker(loadMathJs());
const domain = { x: [0.5, 4] };

test('equivalent forms, implicit products, powers, and functions', () => {
  for (const [a, b, span] of [
    ['2x*x', '2x^2', domain], ['ln(x^2)', '2ln(x)', domain],
    ['1/(x+1)^2', '(x+1)^-2', domain], ['e^x', 'exp(x)', domain],
    ['x^(1/2)', 'sqrt(x)', domain], ['2(x+1)', '2x+2', domain],
    ['3xy', '3*x*y', { x: [1, 3], y: [1, 3] }]
  ]) {
    const vars = a.includes('y') ? ['x', 'y'] : ['x'];
    assert.equal(checker.checkExpr(a, b, vars, span).status, 'correct', a);
  }
  assert.equal(checker.checkExpr('x^2', 'x^2+1', ['x'], domain).status, 'incorrect');
});

test('full-width and common math characters normalize', () => {
  assert.equal(checker.checkExpr('２ｘ（ｘ＋１）', '2x(x+1)', ['x'], domain).status, 'correct');
  assert.equal(checker.checkExpr('３×ｘ−１', '3x-1', ['x'], domain).status, 'correct');
  assert.equal(checker.checkNumber('６÷８', '3/4').status, 'correct');
});

test('AST whitelist rejects dangerous syntax and unknown names', () => {
  for (const value of ['derivative(x^2,x)', 'import("a")', 'simplify(x)', 'evaluate(x)', 'y+1', 'x=2', 'f(x)=x', '[1,2]', '2 inch', '"hi"', 'x<2', 'x!', '']) {
    assert.equal(checker.parseAnswer(value, ['x']).ok, false, value);
    assert.equal(checker.checkExpr(value, 'x', ['x'], domain).status, 'invalid', value);
  }
  assert.throws(() => checker.math.evaluate('2+2'));
  assert.throws(() => checker.math.derivative('x^2', 'x'));
});

test('domains, singularities and uncheckable results', () => {
  assert.equal(checker.checkExpr('ln(x)', 'log(x)', ['x'], { x: [0.5, 3] }).status, 'correct');
  assert.equal(checker.checkExpr('sqrt(x)', 'x^(1/2)', ['x'], { x: [0.5, 3] }).status, 'correct');
  assert.equal(checker.checkExpr('sqrt(-x)', 'sqrt(-x)', ['x'], { x: [0.5, 3] }).status, 'uncheckable');
  assert.equal(checker.checkExpr('1/(x-1)', '1/(x-1)', ['x'], { x: [0.5, 2] }).status, 'correct');
  assert.throws(() => checker.checkExpr('x', 'x', ['x'], {}));
});

test('numbers, choices, sets and multiple fields', () => {
  assert.equal(checker.checkNumber('sqrt(2)', '2^(1/2)').status, 'correct');
  assert.equal(checker.checkNumber('log(8,2)', '3').status, 'correct');
  assert.equal(checker.checkNumber('1.235', '1.23456', { absTol: 0.001, relTol: 0 }).status, 'correct');
  assert.equal(checker.checkNumber('x', '2').status, 'invalid');
  assert.equal(checker.checkChoice('', 'max').status, 'invalid');
  assert.equal(checker.checkChoice('min', 'max').status, 'incorrect');
  assert.equal(checker.checkSet('{3,-1}', '{-1,3}').status, 'correct');
  assert.equal(checker.checkSet('{3,3}', '{-1,3}').status, 'incorrect');
  assert.equal(checker.checkSet('3,-1', '{-1,3}').status, 'correct');
  const problem = { vars: ['x'], domain, fields: [
    { key: 'a', type: 'expr', answer: '2x' }, { key: 'b', type: 'number', answer: '3' }
  ], misconceptions: [{ key: 'a', answer: 'x', feedback: { en: 'Missing factor', zh: '漏乘係數' } }] };
  assert.equal(checker.checkMulti({ a: '2*x', b: '3' }, problem).status, 'correct');
  assert.equal(checker.checkMulti({ a: 'x', b: '3' }, problem).fields.a.status, 'incorrect');
  assert.equal(checker.matchMisconception({ a: 'x', b: '3' }, problem).answer, 'x');
});

test('independent sampling detects a difference hidden on diagonal lines', () => {
  const falseMatch = 'x+sin(2*pi*((y-0.5)/3.5-(x-0.5)/3.5-0.4142135623730951))';
  assert.equal(checker.checkExpr(falseMatch, 'x', ['x', 'y'], { x: [0.5, 4], y: [0.5, 4] }).status, 'incorrect');
});

test('a non-finite student expression disagrees with a finite reference', () => {
  for (const student of ['sqrt(-x)', 'log(-x)']) {
    assert.equal(checker.checkExpr(student, 'x', ['x'], domain).status, 'incorrect');
  }
});

test('function names require parentheses', () => {
  for (const input of ['sqrt x', 'ln x', 'lnx']) {
    assert.equal(checker.parseAnswer(input, ['x']).error, 'Use parentheses, e.g. ln(x)');
  }
});

test('implicit multiplication splits e between declared variables', () => {
  assert.equal(checker.checkExpr('2xe^x', '2*x*e^x', ['x'], domain).status, 'correct');
});

test('ambiguous exponent and division grouping has a bilingual notice', () => {
  assert.match(ambiguityNotice('e^2x'), /parentheses/);
  assert.match(ambiguityNotice('1/2x', 'zh'), /括號/);
  assert.equal(ambiguityNotice('e^(2x)'), '');
  assert.equal(checker.checkExpr('e^2x', '(e^2)*x', ['x'], domain).status, 'correct');
  assert.equal(checker.checkExpr('1/2x', 'x/2', ['x'], domain).status, 'correct');
});

test('set inputs work with or without braces', () => {
  assert.equal(checker.checkSet('-1, 3', '{3,-1}').status, 'correct');
  assert.equal(checker.checkSet('{3,-1}', '-1,3').status, 'correct');
  assert.deepEqual(parseSetEntries('-1, log(8,2)'), ['-1', ' log(8,2)']);
  assert.deepEqual(parseSetEntries('｛-1，3｝'), ['-1', '3']);
});

test('parser errors have friendly English and Chinese text', () => {
  const message = checker.parseAnswer('x++', ['x']).error;
  assert.equal(message, 'Check the expression syntax and parentheses');
  assert.equal(localizedError(message, 'zh'), '請檢查算式語法與括號。');
  assert.deepEqual(invalidDisplay({ status: 'invalid', fields: { ans: { message } } }, { fields: [{ key: 'ans' }] }, 'zh', 'generic'), {
    summary: '請檢查算式語法與括號。', suppressField: true
  });
});
