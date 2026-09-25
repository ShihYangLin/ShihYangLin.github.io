import { derivative, frac, linear, polynomial } from './format.js';

const both = (en, zh) => ({ en, zh });
const field = (key, type, en, zh, answer, options) => ({ key, type, label: both(en, zh), answer: String(answer), ...(options ? { options } : {}) });
const error = (key, answer, en, zh) => ({ key, answer: String(answer), feedback: both(en, zh) });
const extrema = [
  { value: 'max', label: both('Local maximum', '相對極大值') },
  { value: 'min', label: both('Local minimum', '相對極小值') }
];
const higher = [...extrema, { value: 'inflection', label: both('Stationary inflection', '駐點反曲點') }];
const curvature = [
  { value: 'up-down', label: both('Convex to concave', '由凸轉凹') },
  { value: 'down-up', label: both('Concave to convex', '由凹轉凸') }
];

function cubic(rng) {
  const r1 = rng.int(-3, 0), r2 = rng.int(1, 4), sign = rng.sign();
  const c = rng.int(2, 8);
  const f = polynomial([[2 * sign, 'x', 3], [-3 * sign * (r1 + r2), 'x', 2], [6 * sign * r1 * r2, 'x'], [c]]);
  const fp = polynomial([[6 * sign, 'x', 2], [-6 * sign * (r1 + r2), 'x'], [6 * sign * r1 * r2]]);
  const fpp = linear(12 * sign, 'x', -6 * sign * (r1 + r2));
  return { r1, r2, sign, f, fp, fpp, left: 6 * sign * (r1 - r2), right: 6 * sign * (r2 - r1) };
}

function criticalPoints(rng, level) {
  const { r1, r2, f, fp } = cubic(rng);
  return {
    id: 'opt-one/critical-points', level, vars: [], domain: {},
    prompt: both(`For the smooth function $f(x)=${f}$ on $\\mathbb R$, find all stationary $x$ values, where $f\'(x)=0$. Enter a set.`, `對定義於 $\\mathbb R$ 的平滑函數 $f(x)=${f}$，求所有滿足 $f\'(x)=0$ 的駐點 $x$ 值，並以集合輸入。`),
    fields: [field('roots', 'set', 'Stationary $x$ values =', '駐點 $x$ 值 =', `{${r1},${r2}}`)],
    misconceptions: [error('roots', `{${r1}}`, 'The derivative is quadratic and has a second real root.', '導數為二次式，還有另一個實根。')],
    hints: [both('Differentiate before looking for a high or low value.', '先求導數，再尋找高點或低點。'), both('Factor the derivative; both linear factors can be zero.', '將導數因式分解；兩個一次因式都可能為零。')],
    solution: [both(`Differentiation gives $f\'(x)=${fp}$.`, `微分得 $f\'(x)=${fp}$。`), both(`This factors as $f\'(x)=${fp.startsWith('-') ? '-' : ''}6(${linear(1, 'x', -r1)})(${linear(1, 'x', -r2)})$. Hence the stationary $x$ values are $\\{${r1},${r2}\\}$.`, `因式分解得 $f\'(x)=${fp.startsWith('-') ? '-' : ''}6(${linear(1, 'x', -r1)})(${linear(1, 'x', -r2)})$，所以駐點 $x$ 值為 $\\{${r1},${r2}\\}$。`)]
  };
}

function classify(rng, level) {
  const { r1, r2, sign, f, fp, fpp, left, right } = cubic(rng);
  const leftKind = sign > 0 ? 'max' : 'min', rightKind = sign > 0 ? 'min' : 'max';
  return {
    id: 'opt-one/classify', level, vars: [], domain: {},
    prompt: both(`For $f(x)=${f}$ on $\\mathbb R$, find its stationary $x$ values and classify each with the second-derivative test. State local conclusions.`, `對定義於 $\\mathbb R$ 的 $f(x)=${f}$，求駐點 $x$ 值，並以二階導數檢定逐一判別；答案為局部結論。`),
    fields: [field('roots', 'set', 'Stationary $x$ values =', '駐點 $x$ 值 =', `{${r1},${r2}}`), field('left', 'choice', `At $x=${r1}$ =`, `在 $x=${r1}$ =`, leftKind, extrema), field('right', 'choice', `At $x=${r2}$ =`, `在 $x=${r2}$ =`, rightKind, extrema)],
    misconceptions: [error('left', rightKind, 'Check the sign of $f\'\'$ at the left root; the two roots have opposite curvature.', '請檢查左側駐點的二階導數符號；兩個駐點的曲率相反。')],
    hints: [both('First solve $f\'(x)=0$ for both candidates.', '先解 $f\'(x)=0$，找出兩個候選點。'), both('A negative $f\'\'$ at a stationary point gives a local maximum; a positive value gives a local minimum.', '駐點處二階導數為負是相對極大值，為正是相對極小值。')],
    solution: [both(`$f\'(x)=${fp}= ${sign > 0 ? '' : '-'}6(${linear(1, 'x', -r1)})(${linear(1, 'x', -r2)})$, so the stationary values are $\\{${r1},${r2}\\}$.`, `$f\'(x)=${fp}= ${sign > 0 ? '' : '-'}6(${linear(1, 'x', -r1)})(${linear(1, 'x', -r2)})$，故駐點值為 $\\{${r1},${r2}\\}$。`), both(`$f\'\'(x)=${fpp}$, giving $f\'\'(${r1})=${left}$ and $f\'\'(${r2})=${right}$. Therefore $x=${r1}$ is a local ${leftKind === 'max' ? 'maximum' : 'minimum'} and $x=${r2}$ a local ${rightKind === 'max' ? 'maximum' : 'minimum'}.`, `$f\'\'(x)=${fpp}$，得 $f\'\'(${r1})=${left}$、$f\'\'(${r2})=${right}$。因此 $x=${r1}$ 為相對${leftKind === 'max' ? '極大' : '極小'}值，$x=${r2}$ 為相對${rightKind === 'max' ? '極大' : '極小'}值。`)]
  };
}

function profitMax(rng, level) {
  const q = rng.int(2, 6), b = rng.int(1, 3), d = rng.int(1, 2), c = rng.int(2, 7), fixed = rng.int(1, 4);
  const a = c + 2 * (b + d) * q;
  const price = linear(-b, 'Q', a), cost = polynomial([[d, 'Q', 2], [c, 'Q'], [fixed]]);
  const mr = linear(-2 * b, 'Q', a), mc = linear(2 * d, 'Q', c);
  const profit = (b + d) * q * q - fixed, soc = -2 * (b + d);
  return {
    id: 'opt-one/profit-max', level, vars: [], domain: {},
    prompt: both(`A firm faces inverse demand $P(Q)=${price}$ and cost $C(Q)=${cost}$. On feasible output $0<Q<${frac(a,b,true)}$ (where price is positive), find the profit-maximizing interior $Q^*>0$ and the sign of $\\pi\'\'(Q^*)$.${level === 3 ? ' Also find maximum profit.' : ''}`, `廠商的反需求為 $P(Q)=${price}$，成本為 $C(Q)=${cost}$。在價格為正的可行產量 $0<Q<${frac(a,b,true)}$ 上，求利潤極大的內部產量 $Q^*>0$，以及 $\\pi\'\'(Q^*)$ 的符號。${level === 3 ? '另求最大利潤。' : ''}`),
    fields: [field('q', 'number', '$Q^*$ =', '$Q^*$ =', q), field('soc', 'choice', 'Sign of $\\pi\'\'(Q^*)$ =', '$\\pi\'\'(Q^*)$ 的符號 =', 'negative', [{ value: 'negative', label: both('Negative', '負') }, { value: 'positive', label: both('Positive', '正') }]), ...(level === 3 ? [field('profit', 'number', '$\\pi(Q^*)$ =', '$\\pi(Q^*)$ =', profit)] : [])],
    misconceptions: [error('q', `-${q}`, 'Output must be positive and satisfy the feasible price range.', '產量必須為正，且在價格非負的可行範圍內。')],
    hints: [both('Write profit as revenue minus cost and differentiate.', '將利潤寫為收益減成本，再求導。'), both('At an interior solution set $MR=MC$; use $\\pi\'\'=R\'\'-C\'\'$ for the SOC.', '內部解令 $MR=MC$；二階條件使用 $\\pi\'\'=R\'\'-C\'\'$。')],
    solution: [both(`$R(Q)=Q(${price})$, so $MR=${mr}$ and $MC=${mc}$. The first-order condition $MR=MC$ gives $Q^*=${q}$.`, `$R(Q)=Q(${price})$，故 $MR=${mr}$、$MC=${mc}$。一階條件 $MR=MC$ 得 $Q^*=${q}$。`), both(`$\\pi\'\'(Q)=${soc}<0$ throughout the feasible interval, so $Q^*=${q}$ is a local maximum. Strict concavity makes it the unique global maximum on that interval; $P(${q})=${a - b * q}>0$.${level === 3 ? ` Profit is $\\pi(${q})=${profit}$.` : ''}`, `$\\pi\'\'(Q)=${soc}<0$ 在可行區間內處處成立，故 $Q^*=${q}$ 為局部極大值。嚴格凹性也保證它是該區間唯一的全域極大值；$P(${q})=${a - b * q}>0$。${level === 3 ? `利潤為 $\\pi(${q})=${profit}$。` : ''}`)]
  };
}

function inflection(rng, level) {
  const a = rng.int(-2, 3), s = rng.sign() * rng.int(1, 3), m = rng.int(0, 2), c = rng.int(2, 7);
  const f = polynomial([[s, 'x', 3], [-3 * s * a, 'x', 2], [3 * s * a * a + m, 'x'], [c - s * a ** 3 - m * a]]);
  const fpp = linear(6 * s, 'x', -6 * s * a), direction = s > 0 ? 'down-up' : 'up-down';
  return {
    id: 'opt-one/inflection', level, vars: [], domain: {},
    prompt: both(`For $f(x)=${f}$, find the $x$ coordinate of its inflection point and describe the concavity change from left to right.`, `對 $f(x)=${f}$，求反曲點的 $x$ 座標，並說明由左至右的凹凸性變化。`),
    fields: [field('x', 'number', 'Inflection $x$ =', '反曲點 $x$ =', a), field('change', 'choice', 'Concavity changes =', '凹凸性變化 =', direction, curvature)],
    misconceptions: [error('x', a + 1, 'A zero of $f\'\'$ is at the center, not one unit to its right; verify signs on both sides.', '二階導數為零的中心點才是候選點；還要檢查其兩側符號。')],
    hints: [both('Differentiate twice and solve $f\'\'(x)=0$.', '求二階導數，解 $f\'\'(x)=0$。'), both('Check the signs of $f\'\'$ just left and right of that point.', '檢查該點左右兩側的二階導數符號。')],
    solution: [both(`$f\'\'(x)=${fpp}$ vanishes at $x=${a}$.`, `$f\'\'(x)=${fpp}$ 在 $x=${a}$ 為零。`), both(`At $x=${a - 1}$, $f\'\'=${-6 * s}$; at $x=${a + 1}$, $f\'\'=${6 * s}$. The signs are opposite, so concavity truly changes ${s > 0 ? 'from concave to convex' : 'from convex to concave'} at $x=${a}$.`, `在 $x=${a - 1}$ 時 $f\'\'=${-6 * s}$；在 $x=${a + 1}$ 時 $f\'\'=${6 * s}$。符號相反，故 $x=${a}$ 確實${s > 0 ? '由凹轉凸' : '由凸轉凹'}，是反曲點。`)]
  };
}

function nthDerivative(rng, level) {
  const a = rng.int(-3, 3), n = rng.pick([3, 4, 5, 6]), sign = rng.sign(), c = rng.int(2, 7);
  const center = linear(1, 'x', -a);
  const kind = n % 2 ? 'inflection' : sign > 0 ? 'min' : 'max';
  const factorial = Array.from({ length: n }, (_, i) => i + 1).reduce((x, y) => x * y, 1);
  return {
    id: 'opt-one/nth-derivative', level, vars: [], domain: {},
    prompt: both(`At the stationary point $x=${a}$ of $f(x)=${sign < 0 ? '-' : ''}(${center})^{${n}}+${c}$, the second derivative is zero. Use the first nonzero derivative to classify the point locally.`, `在 $f(x)=${sign < 0 ? '-' : ''}(${center})^{${n}}+${c}$ 的駐點 $x=${a}$，二階導數為零。請用第一個非零的高階導數判別其局部性質。`),
    fields: [field('kind', 'choice', 'Local classification =', '局部判別 =', kind, higher)],
    misconceptions: [error('kind', kind === 'max' ? 'min' : 'max', 'A zero second derivative is inconclusive; use the parity and sign of the first nonzero derivative.', '二階導數為零時無法直接判別；須看第一個非零導數的階數奇偶與符號。')],
    hints: [both('Derivatives of orders below the displayed power vanish at the center.', '低於所示冪次的各階導數在中心點均為零。'), both('An even first nonzero order gives an extremum; an odd order gives a stationary inflection.', '第一個非零導數階數為偶數時是極值；奇數時為駐點反曲點。')],
    solution: [both(`$f\'(${a})=\\cdots=${derivative('f', n - 1, a)}=0$, while $${derivative('f', n, a)}=${sign * factorial}$.`, `$f\'(${a})=\\cdots=${derivative('f', n - 1, a)}=0$，但 $${derivative('f', n, a)}=${sign * factorial}$。`), both(n % 2 ? `The first nonzero order is odd: $(${linear(1, 'x', -a)})^{${n}}$ changes sign across $x=${a}$. This is a stationary inflection, not an extremum.` : `The first nonzero order is even and its sign is ${sign > 0 ? 'positive' : 'negative'}, so $x=${a}$ is a local ${kind === 'min' ? 'minimum' : 'maximum'}.`, n % 2 ? `第一個非零導數的階數為奇數；$(${linear(1, 'x', -a)})^{${n}}$ 在 $x=${a}$ 兩側變號，因此是駐點反曲點，並非極值。` : `第一個非零導數的階數為偶數，且符號為${sign > 0 ? '正' : '負'}，故 $x=${a}$ 是相對${kind === 'min' ? '極小' : '極大'}值。`)]
  };
}

export const optOneGenerators = [
  { id: 'critical-points', title: both('Stationary values', '駐點'), levels: [1], generate: criticalPoints },
  { id: 'classify', title: both('Second-derivative test', '二階導數檢定'), levels: [2], generate: classify },
  { id: 'profit-max', title: both('Profit maximization', '利潤極大化'), levels: [2, 3], generate: profitMax },
  { id: 'inflection', title: both('Inflection point', '反曲點'), levels: [2], generate: inflection },
  { id: 'nth-derivative', title: both('Higher-derivative test', '高階導數檢定'), levels: [3], generate: nthDerivative }
];
