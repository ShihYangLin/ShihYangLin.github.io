import { frac, polynomial, term, texProduct } from './format.js';

const both = (en, zh) => ({ en, zh });
const field = (key, type, en, zh, answer, options) => ({ key, type, label: both(en, zh), answer: String(answer), ...(options ? { options } : {}) });
const error = (key, answer, en, zh) => ({ key, answer: String(answer), feedback: both(en, zh) });
const signs = [{ value: 'positive', label: both('Positive', '正') }, { value: 'negative', label: both('Negative', '負') }];
const yesNo = [{ value: 'yes', label: both('Yes', '是') }, { value: 'no', label: both('No', '否') }];

function partialBasic(rng, level) {
  const a = rng.int(1, 4), b = rng.int(1, 5), c = rng.int(1, 4), d = rng.int(1, 5);
  const f = polynomial([[a, 'x', 2], [b, 'xy'], [c, 'y', 2], [d, 'x']]);
  const fx = polynomial([[2*a, 'x'], [b, 'y'], [d]]), fy = polynomial([[b, 'x'], [2*c, 'y']]);
  const fields = [field('fx', 'expr', '$f_x$ =', '$f_x$ =', fx), field('fy', 'expr', '$f_y$ =', '$f_y$ =', fy)];
  if (level === 2) fields.push(field('gradient', 'expr', '$f_x+f_y$ =', '$f_x+f_y$ =', `(${fx})+(${fy})`));
  return { id: 'partials/partial-basic', level, vars: ['x','y'], domain: { x: [0.5, 4], y: [0.5, 4] },
    prompt: both(`For $f(x,y)=${f}$, find both partial derivatives${level === 2 ? ' and the sum of the gradient components $f_x+f_y$' : ''}. Hold the other input fixed each time.`, `對 $f(x,y)=${f}$ 求兩個偏導數${level === 2 ? '，以及梯度兩分量之和 $f_x+f_y$' : ''}；每次將另一變數視為常數。`),
    fields, misconceptions: [error('fx', polynomial([[2*a, 'x'], [b, 'x'], [d]]), 'When differentiating in $x$, $y$ stays fixed; $d(xy)/dx=y$.', '對 $x$ 微分時，$y$ 固定；$d(xy)/dx=y$。')],
    hints: [both('Take an $x$ cross section first, treating $y$ as a constant.', '先沿 $x$ 的截面求斜率，將 $y$ 視為常數。'), both('Then switch roles; the gradient lists the two resulting slopes.', '再交換變數角色；梯度列出這兩個斜率。')],
    solution: [both(`Holding $y$ fixed gives $d(${term(b,'xy')})/dx=${term(b,'y')}$ and $d(${term(c,'y',2)})/dx=0$.`, `固定 $y$ 時，$d(${term(b,'xy')})/dx=${term(b,'y')}$，而 $d(${term(c,'y',2)})/dx=0$。`), both(`Thus $f_x=${fx}$; holding $x$ fixed gives $f_y=${fy}$.${level === 2 ? ` The gradient is $(${fx},${fy})$, whose component sum is $(${fx})+(${fy})$.` : ''}`, `因此 $f_x=${fx}$；固定 $x$ 得 $f_y=${fy}$。${level === 2 ? `梯度為 $(${fx},${fy})$，分量和是 $(${fx})+(${fy})$。` : ''}`)] };
}

function marginalProducts(rng, level) {
  const a = rng.int(1, 6), u = rng.int(1, 4), v = rng.int(1, 4), A = 2*a, K = u*u, L = v*v;
  const mpk = `${a}*sqrt(L)/sqrt(K)`, mpl = `${a}*sqrt(K)/sqrt(L)`;
  return { id: 'partials/marginal-products', level, vars: ['K','L'], domain: { K: [0.5, 10], L: [0.5, 10] },
    prompt: both(`For positive inputs, output is $Q(K,L)=${A}\\sqrt{KL}$. Find $MP_K$, $MP_L$, and $MP_K$ at $(K,L)=(${K},${L})$.`, `對正的投入，產量為 $Q(K,L)=${A}\\sqrt{KL}$。求 $MP_K$、$MP_L$，及 $(K,L)=(${K},${L})$ 時的 $MP_K$。`),
    fields: [field('mpk','expr','$MP_K$ =','$MP_K$ =',mpk), field('mpl','expr','$MP_L$ =','$MP_L$ =',mpl), field('at','number',`$MP_K(${K},${L})$ =`,`$MP_K(${K},${L})$ =`,`${a*v}/${u}`)],
    misconceptions: [error('mpk', `${A}*sqrt(L)/sqrt(K)`, 'The exponent $1/2$ multiplies the coefficient when differentiating.', '微分時，指數 $1/2$ 須乘到係數。')],
    hints: [both('Rewrite the production function as $AK^{1/2}L^{1/2}$.', '將生產函數改寫成 $AK^{1/2}L^{1/2}$。'), both('For $MP_K$, keep $L^{1/2}$ fixed, then substitute the input levels.', '求 $MP_K$ 時保持 $L^{1/2}$ 固定，最後代入投入量。')],
    solution: [both(`$MP_K=${A}(1/2)K^{-1/2}L^{1/2}=${texProduct(a, '\\sqrt{L}')}/\\sqrt{K}$.`, `$MP_K=${A}(1/2)K^{-1/2}L^{1/2}=${texProduct(a, '\\sqrt{L}')}/\\sqrt{K}$。`), both(`Similarly $MP_L=${texProduct(a, '\\sqrt{K}')}/\\sqrt{L}$. At the given inputs, $MP_K=${a}(${v})/${u}=${frac(a*v,u,true)}$.`, `同理，$MP_L=${texProduct(a, '\\sqrt{K}')}/\\sqrt{L}$。代入指定投入，$MP_K=${a}(${v})/${u}=${frac(a*v,u,true)}$。`)] };
}

function marketCs(rng, level) {
  const b = rng.int(1, 4), d = rng.int(2, 5), p = rng.int(2, 5), c = rng.int(1, 3);
  const q = d*p-c, a = q+b*p, sum = b+d;
  return { id: 'partials/market-cs', level, vars: [], domain: {},
    prompt: both(`The general market model is $Q_d=a-bP$, $Q_s=-c+dP$. Here $a=${a}$, $b=${b}$, $c=${c}$, $d=${d}$. Solve the equilibrium and find $\\partial P^*/\\partial a$, holding other parameters fixed. What is the sign of $\\partial Q^*/\\partial c$?${level === 3 ? ' Also give $\\partial Q^*/\\partial a$.' : ''}`, `一般市場模型為 $Q_d=a-bP$、$Q_s=-c+dP$。此處 $a=${a}$、$b=${b}$、$c=${c}$、$d=${d}$。求均衡與固定其他參數時的 $\\partial P^*/\\partial a$，並判斷 $\\partial Q^*/\\partial c$ 的符號。${level === 3 ? '另求 $\\partial Q^*/\\partial a$。' : ''}`),
    fields: [field('p','number','Equilibrium price =','均衡價格 =',p),field('q','number','Equilibrium quantity =','均衡數量 =',q),field('pa','number','$\\partial P^*/\\partial a$ =','$\\partial P^*/\\partial a$ =',`1/${sum}`),field('qc','choice','Sign of $\\partial Q^*/\\partial c$ =','$\\partial Q^*/\\partial c$ 的符號 =','negative',signs),...(level===3?[field('qa','number','$\\partial Q^*/\\partial a$ =','$\\partial Q^*/\\partial a$ =',`${d}/${sum}`)]:[])],
    misconceptions: [error('qc','positive','A larger $c$ shifts supply left, so equilibrium quantity falls.', '$c$ 增加使供給左移，因此均衡數量下降。')],
    hints: [both('Set demand equal to supply, then solve for $P^*$.', '令需求等於供給，先解出 $P^*$。'), both('Differentiate the reduced forms, not the isolated demand equation.', '對均衡的顯式解求偏導，而非只對需求式求導。')],
    solution: [both(`Equating schedules gives $P^*=(a+c)/(b+d)=(${a}+${c})/${sum}=${p}$ and $Q^*=(ad-bc)/(b+d)=${q}$.`, `供需相等得 $P^*=(a+c)/(b+d)=(${a}+${c})/${sum}=${p}$，$Q^*=(ad-bc)/(b+d)=${q}$。`),both(`Therefore $\\partial P^*/\\partial a=1/${sum}$ and $\\partial Q^*/\\partial c=${frac(-b,sum,true)}<0$.${level===3?` Also $\\partial Q^*/\\partial a=${frac(d,sum,true)}$.`:''}`, `因此 $\\partial P^*/\\partial a=1/${sum}$，$\\partial Q^*/\\partial c=${frac(-b,sum,true)}<0$。${level===3?`另外 $\\partial Q^*/\\partial a=${frac(d,sum,true)}$。`:''}`)] };
}

function nationalIncomeCs(rng, level) {
  const m = rng.int(1, 7), tax = rng.int(0, 6), den = 64-8*m+m*tax;
  return { id:'partials/national-income-cs',level,vars:[],domain:{},
    prompt: both(`In $Y=C+I+G$, let $C=C_0+(${frac(m,8,true)})(Y-T)$ and $T=T_0+(${frac(tax,8,true)})Y$. Autonomous terms are fixed. Find the equilibrium spending multiplier $\\partial Y^*/\\partial G$${level===3?' and the tax-intercept effect $\\partial Y^*/\\partial T_0$':''}.`, `在 $Y=C+I+G$ 中，令 $C=C_0+(${frac(m,8,true)})(Y-T)$、$T=T_0+(${frac(tax,8,true)})Y$。固定其他自主項，求均衡支出乘數 $\\partial Y^*/\\partial G$${level===3?'，以及稅收截距效果 $\\partial Y^*/\\partial T_0$':''}。`),
    fields:[field('g','number','$\\partial Y^*/\\partial G$ =','$\\partial Y^*/\\partial G$ =',`64/${den}`),...(level===3?[field('t','number','$\\partial Y^*/\\partial T_0$ =','$\\partial Y^*/\\partial T_0$ =',`-${8*m}/${den}`)]:[])],
    misconceptions:[error('g','1','A direct one-unit increase in $G$ triggers further consumption changes.', '$G$ 直接增加一單位後，還會引起消費的後續變動。')],
    hints:[both('Substitute the tax rule into consumption.', '先將稅收規則代入消費式。'),both('Collect all terms containing $Y$ on the left before differentiating the reduced form.', '先把所有含 $Y$ 的項移到左側，再對均衡顯式解微分。')],
    solution:[both(`Substitution gives $[1-(${frac(m,8,true)})(1-${frac(tax,8,true)})]Y=C_0-(${frac(m,8,true)})T_0+I+G$.`, `代入後得 $[1-(${frac(m,8,true)})(1-${frac(tax,8,true)})]Y=C_0-(${frac(m,8,true)})T_0+I+G$。`),both(`The coefficient on $Y$ is $${frac(den,64,true)}$; hence $\\partial Y^*/\\partial G=${frac(64,den,true)}$.${level===3?` Likewise $\\partial Y^*/\\partial T_0=${frac(-8*m,den,true)}$.`:''}`, `$Y$ 的係數是 $${frac(den,64,true)}$，所以 $\\partial Y^*/\\partial G=${frac(64,den,true)}$。${level===3?`同理，$\\partial Y^*/\\partial T_0=${frac(-8*m,den,true)}$。`:''}`)] };
}

function jacobian(rng, level) {
  const a=rng.int(1,4),b=rng.int(1,4),k=rng.int(2,4),dependent=rng.sign()>0;
  const c=b, d=a+b, det=a*d-b*c;
  const first=polynomial([[a,'x'],[b,'y']]);
  const second=dependent?`${k}(${first})^2`:polynomial([[c,'x'],[d,'y']]);
  const x=rng.int(1,3), y=rng.int(1,3);
  return {id:'partials/jacobian',level,vars:[],domain:{},
    prompt:both(`Let $u=${first}$ and $v=${second}$. Compute the Jacobian determinant at $(x,y)=(${x},${y})$. Is that determinant identically zero, showing these two functions are functionally dependent?`, `設 $u=${first}$、$v=${second}$。求 $(x,y)=(${x},${y})$ 的 Jacobian 行列式。此行列式是否恆為零，從而顯示兩函數具有函數依存關係？`),
    fields:[field('det','number','Jacobian at point =','該點的 Jacobian =',dependent?0:det),field('dependent','choice','Identically zero?','恆為零嗎？',dependent?'yes':'no',yesNo)],
    misconceptions:[error('dependent',dependent?'no':'yes','Decide from the determinant as a function, not from a single selected point.', '須檢查行列式作為函數是否恆為零，不能只看某一點。')],
    hints:[both('Place $u_x,u_y$ in the first row and $v_x,v_y$ in the second.', '第一列放 $u_x,u_y$，第二列放 $v_x,v_y$。'),both('Compute $u_xv_y-u_yv_x$; if $v$ is a function of $u$, its gradient is proportional.', '計算 $u_xv_y-u_yv_x$；若 $v$ 是 $u$ 的函數，兩者梯度會成比例。')],
    solution:[both(dependent?`Here $v=${k}u^2$, so $(v_x,v_y)=${2*k}u(${a},${b})$.`:`The derivative rows are $(${a},${b})$ and $(${c},${d})$.`,dependent?`此處 $v=${k}u^2$，所以 $(v_x,v_y)=${2*k}u(${a},${b})$。`:`偏導數的兩列為 $(${a},${b})$ 與 $(${c},${d})$。`),both(dependent?'The rows are proportional everywhere; $|J|=0$ identically, including at the stated point.':`$|J|=${a*d}-${b*c}=${det}$ at every point, so it is not identically zero.`,dependent?'兩列處處成比例，$|J|=0$ 恆成立，在指定點也為零。':`每一點皆有 $|J|=${a*d}-${b*c}=${det}$，故不恆為零。`)]};
}

export const partialsGenerators=[
 {id:'partial-basic',title:both('Partial derivatives','偏導數'),levels:[1,2],minDistinct: 40, generate:partialBasic},
 {id:'marginal-products',title:both('Marginal products','邊際產量'),levels:[2],minDistinct: 40, generate:marginalProducts},
 {id:'market-cs',title:both('Market comparative statics','市場比較靜態分析'),levels:[2,3],minDistinct: 40, generate:marketCs},
 {id:'national-income-cs',title:both('Income multiplier','所得乘數'),levels:[2,3],minDistinct: 40, generate:nationalIncomeCs},
 {id:'jacobian',title:both('Jacobian determinant','Jacobian 行列式'),levels:[3],minDistinct: 40, generate:jacobian}
];
