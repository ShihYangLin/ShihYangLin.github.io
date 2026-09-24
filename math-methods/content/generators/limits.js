import { frac, linear, polynomial } from './format.js';

const both = (en, zh) => ({ en, zh });
const number = (key, label, answer) => ({ key, type: 'number', label: both(label, ({ 'Limit =': '極限值 =', 'Left limit =': '左極限 =', 'Right limit =': '右極限 =', '$k$ =': '$k$ =' })[label] || label), answer: String(answer) });
const choice = (key, label, answer, options) => ({ key, type: 'choice', label: both(label, ({ 'Two-sided limit exists?': '雙邊極限存在嗎？', 'Continuous now?': '目前連續嗎？', 'Behavior =': '趨勢 =' })[label] || label), answer, options });
const misconception = (key, answer, en, zh) => ({ key, answer: String(answer), feedback: both(en, zh) });
const yesNo = [
  { value: 'yes', label: both('Yes', '是') }, { value: 'no', label: both('No', '否') }
];

function polyLimit(rng, level) {
  const a = rng.int(1, 4), b = rng.int(1, 5), c = rng.int(1, 6), point = rng.int(1, 4);
  if (level === 2) {
    const d = rng.int(2, 5), e = rng.int(1, 5);
    const numerator = linear(a, 'x', b), denominator = linear(d, 'x', e);
    const top = a*point+b, bottom = d*point+e;
    return {
      id: 'limits/poly-limit', level, vars: [], domain: {},
      prompt: both(`Find $\\lim_{x\\to ${point}}\\frac{${numerator}}{${denominator}}$.`, `求 $\\lim_{x\\to ${point}}\\frac{${numerator}}{${denominator}}$。`),
      fields: [number('ans', 'Limit =', `${top}/${bottom}`)],
      misconceptions: [misconception('ans', top, 'The denominator also approaches a nonzero value; divide the two limits.', '分母也趨近一個非零值；須將分子極限除以分母極限。')],
      hints: [both('Both polynomials are continuous at the approach point.', '分子與分母的多項式在該點都連續。'), both('Substitute after checking the denominator is nonzero.', '先確認分母不為零，再分別代入並相除。')],
      solution: [both(`At $x=${point}$, the numerator approaches $${top}$ and the denominator $${bottom}\\ne0$.`, `當 $x\\to${point}$，分子趨近 $${top}$，分母趨近 $${bottom}\\ne0$。`), both(`The quotient limit is $${frac(top,bottom,true)}$.`, `商的極限為 $${frac(top,bottom,true)}$。`)]
    };
  }
  const f = polynomial([[a, 'x', 2], [b, 'x'], [c]]), value = a*point*point+b*point+c;
  return {
    id: 'limits/poly-limit', level, vars: [], domain: {},
    prompt: both(`Find $\\lim_{x\\to ${point}}(${f})$.`, `求 $\\lim_{x\\to ${point}}(${f})$。`),
    fields: [number('ans', 'Limit =', value)],
    misconceptions: [misconception('ans', value-c, 'Include the constant term when evaluating the polynomial.', '代入多項式時，別漏掉常數項。')],
    hints: [both('A polynomial is continuous at every real number.', '多項式在每個實數點都連續。'), both(`Evaluate each term at $x=${point}$, then add.`, `將 $x=${point}$ 代入每一項，再相加。`)],
    solution: [both(`The polynomial limit law permits substitution at $x=${point}$.`, `多項式的極限法則允許在 $x=${point}$ 直接代入。`), both(`The value is $${a}(${point})^2+${b}(${point})+${c}=${value}$.`, `計算得 $${a}(${point})^2+${b}(${point})+${c}=${value}$。`)]
  };
}

function removable(rng, level) {
  const point = rng.int(1, 5), a = rng.int(1, 4), b = rng.int(2, 7);
  const factor = `(x-${point})`, other = linear(a, 'x', b);
  const value = a*point+b;
  const numerator = level === 1 ? `${factor}(${other})` : `(x^2-${point*point})(${other})`;
  const denominator = level === 1 ? factor : `${factor}(x+${point})`;
  return {
    id: 'limits/removable', level, vars: [], domain: {},
    prompt: both(`For $x\\ne${point}$, let $f(x)=\\frac{${numerator}}{${denominator}}$. Find $\\lim_{x\\to${point}}f(x)$.`, `對 $x\\ne${point}$，設 $f(x)=\\frac{${numerator}}{${denominator}}$。求 $\\lim_{x\\to${point}}f(x)$。`),
    fields: [number('ans', 'Limit =', value)],
    misconceptions: [misconception('ans', 0, 'A $0/0$ substitution is indeterminate; cancel the common factor for nearby $x$.', '直接代入得 $0/0$，並非極限值；須在附近的 $x$ 約去公因式。')],
    hints: [both('Direct substitution gives $0/0$, so simplify first.', '直接代入會得到 $0/0$，應先化簡。'), both(level === 1 ? 'Cancel the common factor $x-a$ for $x\\ne a$.' : 'Factor $x^2-a^2=(x-a)(x+a)$, then cancel.', level === 1 ? '在 $x\\ne a$ 時約去公因式 $x-a$。' : '先用 $x^2-a^2=(x-a)(x+a)$ 因式分解，再約分。')],
    solution: [both(level === 1 ? `For $x\\ne${point}$, cancel $${factor}$ to obtain $f(x)=${other}$.` : `Factor $x^2-${point*point}=(x-${point})(x+${point})$; cancelling gives $f(x)=${other}$ for $x\\ne${point}$.`, level === 1 ? `在 $x\\ne${point}$ 時約去 $${factor}$，得到 $f(x)=${other}$。` : `將 $x^2-${point*point}$ 分解為 $(x-${point})(x+${point})$，在 $x\\ne${point}$ 時約分得 $f(x)=${other}$。`), both(`Nearby values approach $${value}$ as $x\\to${point}$; the original function is still undefined at the hole.`, `當 $x\\to${point}$，附近函數值趨近 $${value}$；原函數在缺口處仍未定義。`)]
  };
}

function oneSided(rng, level) {
  const point = rng.int(1, 4), leftSlope = rng.int(2, 3), rightSlope = rng.int(2, 3);
  const left = rng.int(2, 7), right = left + rng.int(1, 4);
  const l = `${leftSlope}(x-${point})+${left}`, r = `${rightSlope}(x-${point})+${right}`;
  return {
    id: 'limits/one-sided', level, vars: [], domain: {},
    prompt: both(`At $x=${point}$, find the left and right limits of $f(x)=\\begin{cases}${l},&x<${point}\\\\${r},&x\\ge${point}\\end{cases}$, then decide whether the finite two-sided limit exists.`, `在 $x=${point}$，求 $f(x)=\\begin{cases}${l},&x<${point}\\\\${r},&x\\ge${point}\\end{cases}$ 的左右極限，並判斷雙邊有限極限是否存在。`),
    fields: [number('left', 'Left limit =', left), number('right', 'Right limit =', right), choice('exists', 'Two-sided limit exists?', 'no', yesNo)],
    misconceptions: [misconception('exists', 'yes', 'The two one-sided limits differ, so there is no two-sided limit.', '左右極限不同，所以雙邊極限不存在。')],
    hints: [both('Use the branch for inputs just below the point, then the branch just above it.', '先分別使用該點左邊與右邊的分段式。'), both('A finite two-sided limit exists only when both one-sided limits agree.', '只有左右單邊極限相等時，雙邊有限極限才存在。')],
    solution: [both(`The left branch approaches $${left}$ and the right branch approaches $${right}$.`, `左側分段趨近 $${left}$，右側分段趨近 $${right}$。`), both(`Since $${left}\\ne${right}$, the two-sided limit does not exist. The assigned value at $x=${point}$ does not change this conclusion.`, `因為 $${left}\\ne${right}$，雙邊極限不存在；$x=${point}$ 的函數值不會改變此結論。`)]
  };
}

function atInfinity(rng, level) {
  const a = rng.int(2, 6), b = rng.int(2, 6), c = rng.int(1, 5), d = rng.int(1, 5);
  const variant = rng.int(0, 2), negative = rng.sign() < 0;
  const numerator = variant === 0 ? linear(a, 'x', c) : variant === 1 ? linear(a, 'x', c) : polynomial([[negative ? -a : a, 'x', 2], [c]]);
  const denominator = variant === 0 ? polynomial([[b, 'x', 2], [d]]) : linear(b, 'x', d);
  const finite = variant !== 2;
  const behavior = finite ? 'finite' : negative ? 'negative' : 'positive';
  const answer = variant === 0 ? '0' : variant === 1 ? `${a}/${b}` : '0';
  const options = [{ value: 'positive', label: both('Diverges to +∞', '發散至 +∞') }, { value: 'negative', label: both('Diverges to −∞', '發散至 −∞') }, { value: 'finite', label: both('Finite', '有限值') }];
  return {
    id: 'limits/at-infinity', level, vars: [], domain: {},
    prompt: both(`As $x\\to+\\infty$, analyze $f(x)=\\frac{${numerator}}{${denominator}}$. Choose its behavior and, if finite, give the limit value.`, `當 $x\\to+\\infty$，分析 $f(x)=\\frac{${numerator}}{${denominator}}$。選擇趨勢；若為有限值，再填極限值。`),
    fields: [choice('behavior', 'Behavior =', behavior, options), { ...number('value', 'Limit if finite =', answer), label: both('Limit if finite =', '若為有限值，極限 ='), gradeWhen: { key: 'behavior', value: 'finite' } }],
    misconceptions: [misconception('behavior', behavior === 'finite' ? 'positive' : 'finite', 'Compare the highest powers of numerator and denominator.', '應比較分子與分母的最高次方。')],
    hints: [both('Divide top and bottom by the highest power in the denominator.', '分子與分母同除以分母的最高次方。'), both('Lower-degree terms vanish relative to the leading terms as $x\\to+\\infty$.', '當 $x\\to+\\infty$，低次項相對於最高次項的影響消失。')],
    solution: [both(`The numerator has degree ${variant === 2 ? 2 : 1}; the denominator has degree ${variant === 0 ? 2 : 1}.`, `分子為 ${variant === 2 ? 2 : 1} 次；分母為 ${variant === 0 ? 2 : 1} 次。`), both(variant === 0 ? 'The denominator grows faster, so the ratio tends to $0$.' : variant === 1 ? `The leading coefficients give a finite limit of $${frac(a,b,true)}$.` : `The ratio grows without bound with ${negative ? 'negative' : 'positive'} sign; it diverges to ${negative ? '$-\\infty$' : '$+\\infty$'}.`, variant === 0 ? '分母成長較快，所以比值趨近 $0$。' : variant === 1 ? `最高次項的係數比給出有限極限 $${frac(a,b,true)}$。` : `比值的絕對值無界增大，且符號為${negative ? '負' : '正'}，故發散至 ${negative ? '$-\\infty$' : '$+\\infty$'}。`)]
  };
}

function continuity(rng, level) {
  const point = rng.int(1, 4), a = rng.int(1, 4), b = rng.int(1, 6);
  const target = a*point+b, isContinuous = rng.sign() === 1, assigned = isContinuous ? target : target+rng.int(1, 4);
  const nearby = linear(a, 'x', b);
  return {
    id: 'limits/continuity', level, vars: [], domain: {},
    prompt: both(`Let $f(x)=\\begin{cases}${nearby},&x\\ne${point}\\\\${assigned},&x=${point}\\end{cases}$. Find $\\lim_{x\\to${point}}f(x)$, the value $k$ that would make $f(${point})=k$ continuous, and decide whether the current function is continuous at $${point}$.`, `設 $f(x)=\\begin{cases}${nearby},&x\\ne${point}\\\\${assigned},&x=${point}\\end{cases}$。求 $\\lim_{x\\to${point}}f(x)$、使 $f(${point})=k$ 連續所需的 $k$，並判斷目前函數在 $${point}$ 是否連續。`),
    fields: [number('limit', 'Limit =', target), number('k', '$k$ =', target), choice('continuous', 'Continuous now?', isContinuous ? 'yes' : 'no', yesNo)],
    misconceptions: [misconception('continuous', isContinuous ? 'no' : 'yes', 'Continuity requires the defined value to equal the existing two-sided limit.', '連續性要求函數在該點有定義，且其值等於雙邊極限。')],
    hints: [both('First compute the approach value from the branch for nearby inputs.', '先用附近點的分段式求趨近值。'), both('Compare that limit with the assigned value at the point.', '將極限與該點指定的函數值比較。')],
    solution: [both(`For nearby $x$, $f(x)=${nearby}$, so the two-sided limit is $${target}$.`, `在附近，$f(x)=${nearby}$，因此雙邊極限為 $${target}$。`), both(`The point is defined with value $${assigned}$. Continuity requires $k=${target}$; the current function is ${isContinuous ? 'continuous' : 'discontinuous'} because $${assigned}${isContinuous ? '=' : '\\ne'}${target}$.`, `該點目前指定值為 $${assigned}$。連續所需的值是 $k=${target}$；目前函數${isContinuous ? '連續' : '不連續'}，因為 $${assigned}${isContinuous ? '=' : '\\ne'}${target}$。`)]
  };
}

export const limitsGenerators = [
  { id: 'poly-limit', title: both('Direct limits', '直接求極限'), levels: [1, 2], generate: polyLimit },
  { id: 'removable', title: both('Removable holes', '可去除的缺口'), levels: [1, 2], generate: removable },
  { id: 'one-sided', title: both('One-sided limits', '單邊極限'), levels: [2], generate: oneSided },
  { id: 'at-infinity', title: both('Limits at infinity', '無窮遠處的極限'), levels: [2], generate: atInfinity },
  { id: 'continuity', title: both('Continuity at a point', '一點的連續性'), levels: [3], generate: continuity }
];
