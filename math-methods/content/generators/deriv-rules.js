import { frac, linear, polynomial, term } from './format.js';
const both = (en, zh) => ({ en, zh });
const expr = (key, label, answer) => ({ key, type: 'expr', label: both(label, label), answer });
const number = (key, label, answer) => ({ key, type: 'number', label: both(label, label), answer: String(answer) });
const misconception = (key, answer, en, zh) => ({ key, answer: String(answer), feedback: both(en, zh) });

function product(rng, level) {
  const a = rng.int(2, 6), b = rng.int(1, 5), c = rng.int(2, 5), d = rng.int(1, 5);
  const n = level === 1 ? 1 : 2;
  const u = linear(a, 'x', b), v = polynomial([[c, 'x', n], [d]]);
  const vp = term(n*c, 'x', n-1);
  return {
    id: 'deriv-rules/product', level, vars: ['x'], domain: { x: [0.4, 3.6] },
    prompt: both(`Differentiate $f(x)=(${u})(${v})$.`, `求 $f(x)=(${u})(${v})$ 的導數。`),
    fields: [expr('ans', "$f'(x)$ =", `${a}(${v})+(${u})(${vp})`)],
    misconceptions: [misconception('ans', `${a}(${vp})`, 'The derivative of a product has two terms, one for each changing factor.', '乘積的導數有兩項；每次分別對其中一個因子微分。')],
    hints: [both('Write the two factors as $u$ and $v$.', '先把兩個因子記為 $u$ 與 $v$。'), both('Use $(uv)\\prime=u\\prime v+uv\\prime$.', '使用 $(uv)\\prime=u\\prime v+uv\\prime$。')],
    solution: [both(`Let $u=${u}$ and $v=${v}$; then $u\\prime=${a}$ and $v\\prime=${vp}$.`, `令 $u=${u}$、$v=${v}$；則 $u\\prime=${a}$、$v\\prime=${vp}$。`), both(`Thus $f\\prime(x)=${a}(${v})+(${u})(${vp})$.`, `因此 $f\\prime(x)=${a}(${v})+(${u})(${vp})$。`)]
  };
}

function quotient(rng, level) {
  const a = rng.int(2, 6), b = rng.int(1, 5), c = rng.int(2, 4);
  let d = rng.int(1, 5);
  if (a*d === b*c) d++;
  const n = level === 1 ? 1 : 2;
  const u = polynomial([[a, 'x', n], [b]]), up = term(n*a, 'x', n-1), v = linear(c, 'x', d);
  return {
    id: 'deriv-rules/quotient', level, vars: ['x'], domain: { x: [0.5, 4] },
    prompt: both(`Differentiate $f(x)=\\frac{${u}}{${v}}$.`, `求 $f(x)=\\frac{${u}}{${v}}$ 的導數。`),
    fields: [expr('ans', "$f'(x)$ =", `((${up})(${v})-(${u})(${c}))/(${v})^2`)],
    misconceptions: [misconception('ans', `((${u})(${c})-(${up})(${v}))/(${v})^2`, 'Keep the numerator in the order: derivative of the top times the bottom, minus top times derivative of the bottom.', '分子順序應為「分子導數乘分母，減分子乘分母導數」。')],
    hints: [both('Identify the numerator $u$ and denominator $v$.', '先辨認分子 $u$ 與分母 $v$。'), both('Use $(u/v)\\prime=(u\\prime v-uv\\prime)/v^2$.', '使用 $(u/v)\\prime=(u\\prime v-uv\\prime)/v^2$。')],
    solution: [both(`Here $u\\prime=${up}$ and $v\\prime=${c}$.`, `這裡 $u\\prime=${up}$，$v\\prime=${c}$。`), both(`So $f\\prime(x)=\\frac{(${up})(${v})-(${u})(${c})}{(${v})^2}$.`, `所以 $f\\prime(x)=\\frac{(${up})(${v})-(${u})(${c})}{(${v})^2}$。`)]
  };
}

function chain(rng, level) {
  if (level === 3) {
    const a = rng.int(18, 35), b = rng.int(2, 3), c = rng.int(2, 5);
    const inner = linear(c, 'L', 1);
    const revenue = polynomial([[a, 'Q'], [-b, 'Q', 2]]);
    const marginal = polynomial([[a], [-2*b, 'Q']]);
    return {
      id: 'deriv-rules/chain', level, vars: ['L'], domain: { L: [0.1, 0.8] },
      prompt: both(`Output is $Q(L)=${inner}$ and revenue is $R(Q)=${revenue}$. Find the marginal revenue product $dR/dL$ as a function of $L$.`, `產量為 $Q(L)=${inner}$，收益為 $R(Q)=${revenue}$。求勞動的邊際收益產量（MRP）$dR/dL$，以 $L$ 表示。`),
      fields: [expr('ans', '$dR/dL$ =', `(${a}-2*${b}(${inner}))*${c}`)],
      misconceptions: [misconception('ans', `${a}-2*${b}(${inner})`, 'Multiply marginal revenue by the marginal product of labor.', '還要將邊際收益乘以勞動的邊際產量。')],
      hints: [both('Revenue changes through output: $L\\to Q\\to R$.', '收益透過產量隨勞動改變：$L\\to Q\\to R$。'), both('Use $dR/dL=(dR/dQ)(dQ/dL)$.', '使用 $dR/dL=(dR/dQ)(dQ/dL)$。')],
      solution: [both(`Marginal revenue is $dR/dQ=${marginal}$; marginal product is $dQ/dL=${c}$.`, `邊際收益為 $dR/dQ=${marginal}$；邊際產量為 $dQ/dL=${c}$。`), both(`Substitute $Q=${inner}$: $dR/dL=(${a}-${2*b}(${inner}))(${c})$.`, `代入 $Q=${inner}$：$dR/dL=(${a}-${2*b}(${inner}))(${c})$。`)]
    };
  }
  const a = rng.int(2, 5), b = rng.int(1, 5), n = level === 1 ? 1 : 2, m = rng.int(3, 5);
  const inside = polynomial([[a, 'x', n], [b]]), derivative = term(a*n, 'x', n-1);
  const isRoot = level === 2 && rng.sign() === -1;
  const answer = isRoot ? `(${derivative})/(2sqrt(${inside}))` : `${m}(${inside})^${m-1}(${derivative})`;
  const wrong = isRoot ? `1/(2sqrt(${inside}))` : `${m}(${inside})^${m-1}`;
  const shown = isRoot ? `\\sqrt{${inside}}` : `(${inside})^{${m}}`;
  return {
    id: 'deriv-rules/chain', level, vars: ['x'], domain: { x: [0.5, 3] },
    prompt: both(`Differentiate $f(x)=${shown}$.`, `求 $f(x)=${shown}$ 的導數。`),
    fields: [expr('ans', "$f'(x)$ =", answer)],
    misconceptions: [misconception('ans', wrong, 'You differentiated the outside but omitted the derivative of the inside.', '你已對外層微分，但漏乘內層函數的導數。')],
    hints: [both(`Set $u=${inside}$.`, `令 $u=${inside}$。`), both('Differentiate the outside with respect to $u$, then multiply by $du/dx$.', '先對 $u$ 微分外層，再乘以 $du/dx$。')],
    solution: [both(`The inner derivative is $du/dx=${derivative}$.`, `內層函數的導數為 $du/dx=${derivative}$。`), both(`By the chain rule, $f\\prime(x)=${isRoot ? `\\frac{${derivative}}{2\\sqrt{${inside}}}` : `${m}(${inside})^{${m-1}}(${derivative})`}$.`, `依連鎖法則，$f\\prime(x)=${isRoot ? `\\frac{${derivative}}{2\\sqrt{${inside}}}` : `${m}(${inside})^{${m-1}}(${derivative})`}$。`)]
  };
}

function inverseFn(rng, level) {
  const a = rng.int(2, 4), b = rng.int(2, 6), x = rng.int(1, 3);
  const isLinear = level === 2 && rng.sign() === 1;
  const y = isLinear ? polynomial([[a, 'x'], [b]]) : polynomial([[a, 'x', 3], [b, 'x']]);
  const y0 = isLinear ? a*x+b : a*x**3+b*x;
  const slope = isLinear ? a : 3*a*x*x+b;
  return {
    id: 'deriv-rules/inverse-fn', level, vars: [], domain: {},
    prompt: both(`The function $y=${y}$ is strictly increasing. At $x=${x}$ (so $y=${y0}$), find $dx/dy$.`, `函數 $y=${y}$ 嚴格遞增。在 $x=${x}$（故 $y=${y0}$）處，求 $dx/dy$。`),
    fields: [number('ans', '$dx/dy$ =', `1/${slope}`)],
    misconceptions: [misconception('ans', slope, 'That is $dy/dx$; the inverse slope is its reciprocal.', '這是 $dy/dx$；反函數斜率應取其倒數。')],
    hints: [both('Check the slope of the original function.', '先求原函數的斜率。'), both('For a local inverse, $dx/dy=1/(dy/dx)$ when $dy/dx\\ne0$.', '當 $dy/dx\\ne0$ 且局部反函數存在時，$dx/dy=1/(dy/dx)$。')],
    solution: [both(`At $x=${x}$, $dy/dx=${slope}>0$, so the inverse slope is defined.`, `在 $x=${x}$ 處，$dy/dx=${slope}>0$，故反函數斜率存在。`), both(`Thus $dx/dy=1/${slope}$.`, `因此 $dx/dy=1/${slope}$。`)]
  };
}

function mrFromDemand(rng, level) {
  const b = rng.int(2, 4), q = rng.int(2, 5), a = 3*b*q + rng.int(6, 16);
  const p = a-b*q, mr = a-2*b*q;
  const price = polynomial([[a], [-b, 'Q']]);
  const mrExpr = polynomial([[a], [-2*b, 'Q']]);
  const fields = [expr('mr', '$MR(Q)$ =', mrExpr)];
  if (level >= 2) fields.push(number('at', `$MR(${q})$ =`, mr));
  if (level === 3) fields.push(number('elasticity', '$|ε|$ =', `${p}/${b*q}`));
  return {
    id: 'deriv-rules/mr-from-demand', level, vars: ['Q'], domain: { Q: [0.5, Math.min(6, a/b-0.5)] },
    prompt: both(`Inverse demand is $P(Q)=${price}$. Find marginal revenue${level >= 2 ? ` and evaluate it at $Q=${q}$` : ''}${level === 3 ? '; also find $|\\varepsilon|$ there and verify $MR=P(1-1/|\\varepsilon|)$' : ''}.`, `反需求函數為 $P(Q)=${price}$。求邊際收益${level >= 2 ? `，並計算 $Q=${q}$ 時的值` : ''}${level === 3 ? '；另求該處的 $|\\varepsilon|$，並驗證 $MR=P(1-1/|\\varepsilon|)$' : ''}。`),
    fields,
    misconceptions: [misconception('mr', price, 'Price is average revenue. Differentiate $R=P(Q)Q$ to obtain marginal revenue.', '價格是平均收益。應先對 $R=P(Q)Q$ 微分，才能得到邊際收益。')],
    hints: [both('Write total revenue as $R(Q)=P(Q)Q$.', '先寫出總收益 $R(Q)=P(Q)Q$。'), both('Use $MR=P+Q\\,dP/dQ$.', '使用 $MR=P+Q\\,dP/dQ$。')],
    solution: [both(`$R(Q)=(${price})Q$ and $dP/dQ=-${b}$.`, `$R(Q)=(${price})Q$，且 $dP/dQ=-${b}$。`), both(`$MR(Q)=P+Q(dP/dQ)=${mrExpr}$${level >= 2 ? `, so $MR(${q})=${mr}$` : ''}.`, `$MR(Q)=P+Q(dP/dQ)=${mrExpr}$${level >= 2 ? `，故 $MR(${q})=${mr}$` : ''}。`), ...(level === 3 ? [both(`At $Q=${q}$, $P=${p}$ and $|\\varepsilon|=P/(${b}Q)=${frac(p,b*q,true)}$; hence $P(1-1/|\\varepsilon|)=${mr}$.`, `在 $Q=${q}$ 處，$P=${p}$、$|\\varepsilon|=P/(${b}Q)=${frac(p,b*q,true)}$；因此 $P(1-1/|\\varepsilon|)=${mr}$。`)] : [])]
  };
}

function mcAc(rng, level) {
  const q = rng.int(2, 6), c = rng.int(2, 4), f = c*q*q, v = rng.int(2, 8);
  const cost = polynomial([[c, 'Q', 2], [v, 'Q'], [f]]);
  const mc = linear(2*c, 'Q', v);
  return {
    id: 'deriv-rules/mc-ac', level, vars: [], domain: {},
    prompt: both(`For $Q>0$, total cost is $C(Q)=${cost}$. Find the quantity where $MC=AC$ (the minimum of average cost).`, `對 $Q>0$，總成本為 $C(Q)=${cost}$。求 $MC=AC$（平均成本最低）時的產量。`),
    fields: [number('ans', '$Q$ =', q)],
    misconceptions: [misconception('ans', `-${q}`, 'Output must be positive; solve the cost condition on $Q>0$.', '產量必須為正；請在 $Q>0$ 的範圍求解成本條件。')],
    hints: [both('Start from $AC=C(Q)/Q$.', '先寫出 $AC=C(Q)/Q$。'), both('The quotient rule gives $AC\\prime=(MC-AC)/Q$ for $Q>0$.', '對 $Q>0$，除法法則給出 $AC\\prime=(MC-AC)/Q$。')],
    solution: [both(`$AC=${f}/Q+${v}+${c}Q$ and $MC=${mc}$.`, `$AC=${f}/Q+${v}+${c}Q$，$MC=${mc}$。`), both(`Setting $MC=AC$ gives $${c}Q=${f}/Q$, hence $Q^2=${q*q}$ and $Q=${q}>0$.`, `令 $MC=AC$，得 $${c}Q=${f}/Q$，所以 $Q^2=${q*q}$，且 $Q=${q}>0$。`), both(`Since $AC\\prime\\prime=${2*f}/Q^3>0$, this is the minimum of $AC$.`, `由於 $AC\\prime\\prime=${2*f}/Q^3>0$，此處為 $AC$ 的最低點。`)]
  };
}

export const derivRulesGenerators = [
  { id: 'product', title: both('Product rule', '乘法法則'), levels: [1, 2], minDistinct: 40, generate: product },
  { id: 'quotient', title: both('Quotient rule', '除法法則'), levels: [1, 2], minDistinct: 40, generate: quotient },
  { id: 'chain', title: both('Chain rule', '連鎖法則'), levels: [1, 2, 3], minDistinct: 40, generate: chain },
  { id: 'inverse-fn', title: both('Inverse-function rule', '反函數法則'), levels: [2], minDistinct: 40, generate: inverseFn },
  { id: 'mr-from-demand', title: both('Marginal revenue', '邊際收益'), levels: [1, 2, 3], minDistinct: 40, generate: mrFromDemand },
  { id: 'mc-ac', title: both('MC and AC', '邊際成本與平均成本'), levels: [3], minDistinct: 40, generate: mcAc }
];
