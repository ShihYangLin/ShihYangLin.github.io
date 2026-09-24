import { linear, polynomial, term, texPowers } from './format.js';

const both = (en, zh) => ({ en, zh });
const expr = (key, label, answer) => ({ key, type: 'expr', label: both(label, ({ 'Difference quotient =': '差商 =', 'Slope =': '斜率 =' })[label] || label), answer });
const number = (key, label, answer) => ({ key, type: 'number', label: both(label, ({ 'Difference quotient =': '差商 =', 'Slope =': '斜率 =' })[label] || label), answer: String(answer) });
const misconception = (key, answer, en, zh) => ({ key, answer: String(answer), feedback: both(en, zh) });

function diffQuotient(rng, level) {
  const a = rng.int(2, 5), b = rng.int(1, 7), c = rng.int(2, 9);
  const f = polynomial([[a, 'x', 2], [b, 'x'], [c]]);
  const quotient = polynomial([[2*a, 'x'], [a, 'h'], [b]]);
  const derivative = linear(2*a, 'x', b);
  return {
    id: 'deriv-basics/diff-quotient', level, vars: ['x', 'h'], domain: { x: [0.5, 4], h: [0.2, 2] },
    prompt: both(`For $f(x)=${f}$, simplify $[f(x+h)-f(x)]/h$ for $h\\ne0$${level === 2 ? ' and find its limit as $h\\to0$' : ''}.`, `已知 $f(x)=${f}$，化簡 $h\\ne0$ 時的差商 $[f(x+h)-f(x)]/h$${level === 2 ? '，並求 $h\\to0$ 時的極限' : ''}。`),
    fields: [expr('quotient', 'Difference quotient =', quotient), ...(level === 2 ? [expr('derivative', "f'(x) =", derivative)] : [])],
    misconceptions: [misconception('quotient', derivative, 'That is the derivative after taking the limit; the finite quotient still contains $h$.', '這是取極限後的導數；有限差商仍含有 $h$。')],
    hints: [both('Expand $f(x+h)$ before subtracting $f(x)$.', '先展開 $f(x+h)$，再減去 $f(x)$。'), both('After cancellation, every remaining term contains $h$; divide by $h$ before taking a limit.', '消去相同項後，其餘各項都含 $h$；先除以 $h$，再取極限。')],
    solution: [both(`$f(x+h)=${a}(x+h)^2+${b === 1 ? '' : b}(x+h)+${c}$. Subtracting $f(x)$ leaves $${2*a}xh+${a}h^2+${term(b, 'h')}$.`, `$f(x+h)=${a}(x+h)^2+${b === 1 ? '' : b}(x+h)+${c}$。減去 $f(x)$ 後得 $${2*a}xh+${a}h^2+${term(b, 'h')}$。`), both(`Divide by $h\\ne0$: $[f(x+h)-f(x)]/h=${quotient}$.${level === 2 ? ` Letting $h\\to0$ gives $f'(x)=${derivative}$.` : ''}`, `除以 $h\\ne0$：$[f(x+h)-f(x)]/h=${quotient}$。${level === 2 ? `令 $h\\to0$，得 $f'(x)=${derivative}$。` : ''}`)]
  };
}

function powerRule(rng, level) {
  const a = rng.int(2, 5), b = rng.int(2, 7), c = rng.int(1, 8);
  let f, answer, wrong, steps, stepsZh, n;
  if (level === 1) {
    n = rng.int(2, 4);
    f = polynomial([[a, 'x', n], [b, 'x'], [c]]);
    answer = polynomial([[a*n, 'x', n-1], [b]]);
    wrong = polynomial([[a*n, 'x', n], [b]]);
    steps = `Differentiate $${term(a, 'x', n)}$ to get $${term(a*n, 'x', n-1)}$; $${term(b, 'x')}$ gives $${b}$ and the constant gives $0$.`;
    stepsZh = `先對 $${term(a, 'x', n)}$ 使用冪次法則，得到 $${term(a*n, 'x', n-1)}$；一次項導數為 $${b}$，常數項導數為 $0$。`;
  } else if (rng.sign() === 1) {
    f = `${a}x^(-2)+${b}x+${c}`;
    answer = `-${2*a}x^(-3)+${b}`;
    wrong = `-${2*a}x^(-2)+${b}`;
    steps = `The negative power obeys the same rule: $d(${a}x^{-2})/dx=-${2*a}x^{-3}$.`;
    stepsZh = `負數指數也使用冪次法則：$d(${a}x^{-2})/dx=-${2*a}x^{-3}$；一次項導數為 $${b}$。`;
  } else {
    f = `${2*a}x^(1/2)+${b}x+${c}`;
    answer = `${a}x^(-1/2)+${b}`;
    wrong = `${a}x^(1/2)+${b}`;
    steps = `Use $d(x^{1/2})/dx=\\frac12x^{-1/2}$, so the first term becomes $${a}x^{-1/2}$.`;
    stepsZh = `由 $d(x^{1/2})/dx=\\frac12x^{-1/2}$，首項微分後為 $${a}x^{-1/2}$；一次項導數為 $${b}$。`;
  }
  return {
    id: 'deriv-basics/power-rule', level, vars: ['x'], domain: { x: [0.5, 4] },
    prompt: both(`Differentiate $f(x)=${texPowers(f)}$${level === 2 ? ' on $x>0$' : ''}.`, `求 $f(x)=${texPowers(f)}$ 的導數${level === 2 ? '，定義域為 $x>0$' : ''}。`),
    fields: [expr('ans', "f'(x) =", answer)],
    misconceptions: [misconception('ans', wrong, 'Multiply by the exponent and reduce the exponent by one.', '要乘上原指數，並將指數減一。')],
    hints: [both('Differentiate each term separately; a constant has derivative zero.', '逐項微分；常數項的導數為零。'), both('Apply $d(ax^n)/dx=anx^{n-1}$, including for negative or fractional $n$.', '使用 $d(ax^n)/dx=anx^{n-1}$；負數或分數指數也適用。')],
    solution: [both(steps, stepsZh), both(`The derivative function is $f'(x)=${texPowers(answer)}$.`, `導數函數為 $f'(x)=${texPowers(answer)}$。`)]
  };
}

function tangentSlope(rng, level) {
  const a = rng.int(1, 4), b = rng.int(2, 6), c = rng.int(1, 7), x0 = rng.int(1, 4);
  const f = polynomial([[a, 'x', 2], [b, 'x'], [c]]);
  const slope = 2*a*x0+b, y0 = a*x0*x0+b*x0+c;
  return {
    id: 'deriv-basics/tangent-slope', level, vars: ['x'], domain: { x: [0.5, 5] },
    prompt: both(`For $y=f(x)=${f}$ at $x=${x0}$, find the tangent slope and give the tangent line $y$ as a function of $x$.`, `對 $y=f(x)=${f}$，求 $x=${x0}$ 處的切線斜率，並寫出切線 $y$（以 $x$ 表示）。`),
    fields: [number('slope', 'Slope =', slope), expr('line', 'y =', `${slope}(x-${x0})+${y0}`)],
    misconceptions: [misconception('line', String(y0), 'A tangent line needs the slope as well as the point.', '切線除了通過該點，也必須具有正確斜率。')],
    hints: [both('Differentiate $f(x)$ before substituting the chosen point.', '先求 $f(x)$ 的導數，再代入指定點。'), both("Use point-slope form $y-f(x_0)=f'(x_0)(x-x_0)$.", "使用點斜式 $y-f(x_0)=f'(x_0)(x-x_0)$。")],
    solution: [both(`$f'(x)=${linear(2*a, 'x', b)}$, so $f'(${x0})=${slope}$.`, `$f'(x)=${linear(2*a, 'x', b)}$，所以 $f'(${x0})=${slope}$。`), both(`The point is $(${x0},${y0})$. Thus $y-${y0}=${slope}(x-${x0})$, or $y=${slope}(x-${x0})+${y0}$.`, `該點為 $(${x0},${y0})$。因此 $y-${y0}=${slope}(x-${x0})$，即 $y=${slope}(x-${x0})+${y0}$。`)]
  };
}

function marginalCost(rng, level) {
  const a = rng.int(2, 7), b = rng.int(1, 4), c = rng.int(1, 3), fixed = rng.int(8, 25), q = rng.int(1, 4);
  const cost = polynomial([[c, 'Q', 3], [b, 'Q', 2], [a, 'Q'], [fixed]]);
  const mc = polynomial([[3*c, 'Q', 2], [2*b, 'Q'], [a]]);
  const value = 3*c*q*q+2*b*q+a;
  return {
    id: 'deriv-basics/marginal-cost', level, vars: ['Q'], domain: { Q: [0.5, 5] },
    prompt: both(`A firm's total cost is $C(Q)=${cost}$. Find the marginal cost function and marginal cost at $Q=${q}$.`, `廠商的總成本為 $C(Q)=${cost}$。求邊際成本函數，以及 $Q=${q}$ 時的邊際成本。`),
    fields: [expr('mc', 'MC(Q) =', mc), number('at', `MC(${q}) =`, value)],
    misconceptions: [misconception('mc', polynomial([[2*b, 'Q'], [a]]), 'The cubic cost term also contributes to marginal cost.', '三次方成本項也會影響邊際成本。')],
    hints: [both('Marginal cost is the slope of the total-cost curve.', '邊際成本是總成本曲線的斜率。'), both('Differentiate $C(Q)$ term by term, then substitute $Q$.', '逐項對 $C(Q)$ 微分，再代入產量 $Q$。')],
    solution: [both(`The fixed cost has zero derivative. Differentiating the other terms gives $MC(Q)=${mc}$.`, `固定成本的導數為零。對其餘各項微分得 $MC(Q)=${mc}$。`), both(`At $Q=${q}$, $MC(${q})=${3*c}(${q})^2+${2*b}(${q})+${a}=${value}$.`, `在 $Q=${q}$ 時，$MC(${q})=${3*c}(${q})^2+${2*b}(${q})+${a}=${value}$。`)]
  };
}

export const derivBasicsGenerators = [
  { id: 'diff-quotient', title: both('Difference quotient', '差商'), levels: [1, 2], generate: diffQuotient },
  { id: 'power-rule', title: both('Power rule', '冪次法則'), levels: [1, 2], generate: powerRule },
  { id: 'tangent-slope', title: both('Tangent slope', '切線斜率'), levels: [2], generate: tangentSlope },
  { id: 'marginal-cost', title: both('Marginal cost', '邊際成本'), levels: [2], generate: marginalCost }
];
