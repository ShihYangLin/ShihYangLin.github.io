import { polynomial } from './format.js';

const both = (en, zh) => ({ en, zh });
const field = (key, type, en, zh, answer, options) => ({ key, type, label: both(en, zh), answer: String(answer), ...(options ? { options } : {}) });
const error = (key, answer, en, zh) => ({ key, answer: String(answer), feedback: both(en, zh) });
const kinds = ['max', 'min', 'saddle', 'inconclusive'].map((value, i) => ({ value, label: both(['Local maximum', 'Local minimum', 'Saddle', 'Hessian test inconclusive'][i], ['相對極大值', '相對極小值', '鞍點', 'Hessian 檢定無法判定'][i]) }));
const definite = kinds.slice(0, 2);
function soc(hxx, hxy, hyy, kind) {
  const D = hxx * hyy - hxy ** 2;
  if (kind === 'max' && !(hxx < 0 && D > 0)) throw new Error('Negative definite Hessian required');
  if (kind === 'min' && !(hxx > 0 && D > 0)) throw new Error('Positive definite Hessian required');
  if (kind === 'saddle' && !(D < 0)) throw new Error('Indefinite Hessian required');
  if (kind === 'inconclusive' && D !== 0) throw new Error('Singular Hessian required');
  return D;
}
function quadratic(rng, forced) {
  const x = rng.int(1, 5), y = rng.int(1, 5), a = rng.int(1, 3), d = rng.int(1, 3), b = rng.int(0, 1), s = forced === 'min' ? 1 : -1;
  const hxx = 2 * s * a, hxy = s * b, hyy = 2 * s * d, D = soc(hxx, hxy, hyy, forced);
  const expression = `${s < 0 ? '-' : ''}${a===1?'':a}(x-${x})^2${b ? `${s < 0 ? '-' : '+'}(x-${x})(y-${y})` : ''}${s < 0 ? '-' : '+'}${d===1?'':d}(y-${y})^2+${rng.int(1, 8)}`;
  return { x, y, hxx, hxy, hyy, D, expression };
}
function foc(rng, level) {
  const q = quadratic(rng, level === 1 ? 'max' : rng.pick(['max', 'min']));
  return { id: 'opt-multi/foc-2var', level, vars: [], domain: {},
    prompt: both(`Find the stationary point of $f(x,y)=${q.expression}$.${level === 2 ? ' Classify it using the Hessian.' : ''}`, `求 $f(x,y)=${q.expression}$ 的駐點。${level === 2 ? '再用 Hessian 矩陣判別。' : ''}`),
    fields: [field('x', 'number', '$x^*$ =', '$x^*$ =', q.x), field('y', 'number', '$y^*$ =', '$y^*$ =', q.y), ...(level === 2 ? [field('kind', 'choice', 'Local classification =', '局部判別 =', q.hxx < 0 ? 'max' : 'min', definite)] : [])],
    misconceptions: [error('x', -q.x, 'The square is centered at a positive x value.', '平方項的中心是正的 x 值。')],
    hints: [both('Set both partial derivatives to zero.', '將兩個偏導數同時設為零。'), both('The squared terms reveal the center; check both leading principal minors.', '平方項顯示中心；再檢查兩個領先主子式。')],
    solution: [both(`At $(${q.x},${q.y})$, both partial derivatives vanish. The linear first-order system has this unique solution.`, `在 $(${q.x},${q.y})$，兩個偏導數皆為零；此線性一階條件組有唯一解。`), both(`$H=\\begin{pmatrix}${q.hxx}&${q.hxy}\\\\${q.hxy}&${q.hyy}\\end{pmatrix}$ has $D_1=${q.hxx}$ and $D_2=${q.D}>0$. It is ${q.hxx < 0 ? 'negative' : 'positive'} definite, so the point is a strict local ${q.hxx < 0 ? 'maximum' : 'minimum'}.`, `$H=\\begin{pmatrix}${q.hxx}&${q.hxy}\\\\${q.hxy}&${q.hyy}\\end{pmatrix}$ 的 $D_1=${q.hxx}$、$D_2=${q.D}>0$，故為${q.hxx < 0 ? '負' : '正'}定，駐點是嚴格相對${q.hxx < 0 ? '極大' : '極小'}值。`)] };
}
function hessian(rng, level) {
  const q = quadratic(rng, rng.pick(['max', 'min']));
  return { id: 'opt-multi/hessian', level, vars: [], domain: {},
    prompt: both(`For $f(x,y)=${q.expression}$, calculate the Hessian entries and its determinant.`, `對 $f(x,y)=${q.expression}$，計算 Hessian 矩陣各元素及行列式。`),
    fields: [field('xx','number','$f_{xx}$ =','$f_{xx}$ =',q.hxx),field('xy','number','$f_{xy}$ =','$f_{xy}$ =',q.hxy),field('yy','number','$f_{yy}$ =','$f_{yy}$ =',q.hyy),field('det','number','$|H|$ =','$|H|$ =',q.D)],
    misconceptions: [error('det', q.D + (q.hxy ? 2*q.hxy**2 : 1), 'The determinant subtracts the square of the cross-partial.', '行列式須減去交叉偏導數的平方。')],
    hints: [both('Differentiate each first partial once more.', '將各一階偏導數再微分一次。'), both('For a symmetric 2 by 2 Hessian, $|H|=f_{xx}f_{yy}-f_{xy}^2$.', '對稱的二階 Hessian 有 $|H|=f_{xx}f_{yy}-f_{xy}^2$。')],
    solution: [both(`The entries are $f_{xx}=${q.hxx}$, $f_{xy}=f_{yx}=${q.hxy}$, and $f_{yy}=${q.hyy}$.`, `各元素為 $f_{xx}=${q.hxx}$、$f_{xy}=f_{yx}=${q.hxy}$、$f_{yy}=${q.hyy}$。`), both(`Hence $|H|=(${q.hxx})(${q.hyy})-(${q.hxy})^2=${q.D}$. The first leading minor is $D_1=${q.hxx}$.`, `所以 $|H|=(${q.hxx})(${q.hyy})-(${q.hxy})^2=${q.D}$；第一個領先主子式是 $D_1=${q.hxx}$。`)] };
}
function classify(rng, level) {
  const kind = rng.pick(['max','min','saddle','inconclusive']);
  let hxx, hxy, hyy, f;
  if (kind === 'max' || kind === 'min') { const q = quadratic(rng, kind); ({ hxx,hxy,hyy } = q); f=q.expression; }
  else if (kind === 'saddle') { const x=rng.int(1,6),y=rng.int(1,6),a=rng.int(1,3),b=rng.int(1,3); hxx=2*a;hxy=0;hyy=-2*b;f=`${a===1?'':a}(x-${x})^2-${b===1?'':b}(y-${y})^2`; }
  else { const x=rng.int(1,6),y=rng.int(1,6),a=rng.int(1,3),b=rng.int(1,3); hxx=0;hxy=0;hyy=0;f=`${a===1?'':a}(x-${x})^4+${b===1?'':b}(y-${y})^4`; }
  const D=soc(hxx,hxy,hyy,kind);
  return { id:'opt-multi/classify-2var',level,vars:[],domain:{},
    prompt:both(`At its stationary point, what conclusion does the Hessian test give for $f(x,y)=${f}$?`, `在駐點處，Hessian 檢定對 $f(x,y)=${f}$ 得出什麼結論？`),
    fields:[field('kind','choice','Hessian conclusion =','Hessian 結論 =',kind,kinds)],
    misconceptions:[error('kind',kind==='max'?'min':'max','One diagonal entry alone cannot classify every direction; inspect the determinant.','只看一個對角元素不足以判別所有方向；請檢查行列式。')],
    hints:[both('Compute both leading principal minors.','計算兩個領先主子式。'),both('Positive determinant plus a negative first minor gives a maximum; negative determinant gives a saddle.','行列式正且第一主子式負為極大；行列式負則為鞍點。')],
    solution:[both(`$D_1=${hxx}$ and $D_2=${D}$.`, `$D_1=${hxx}$、$D_2=${D}$。`),both(`The Hessian test is ${kind==='inconclusive'?'inconclusive when both minors vanish':kind==='saddle'?'indefinite, so the stationary point is a saddle':kind==='max'?'negative definite, giving a strict local maximum':'positive definite, giving a strict local minimum'}.`, `Hessian ${kind==='inconclusive'?'兩個主子式皆為零，檢定無法判定':kind==='saddle'?'不定，因此駐點是鞍點':kind==='max'?'負定，因此為嚴格相對極大值':'正定，因此為嚴格相對極小值'}。`)] };
}
function firm(rng, level) {
  const x=rng.int(1,5),y=rng.int(1,5),a=rng.int(1,3),d=rng.int(1,3),b=1,u=rng.int(1,4),v=rng.int(1,4),fixed=rng.int(1,5);
  const p1=2*a*x+b*y+u,p2=b*x+2*d*y+v,D=soc(-2*a,-b,-2*d,'max');
  const cost=polynomial([[a,'Q_1',2],[b,'Q_1 Q_2'],[d,'Q_2',2],[u,'Q_1'],[v,'Q_2'],[fixed]]);
  return {id:'opt-multi/multiproduct-firm',level,vars:[],domain:{},
    prompt:both(`A competitive firm sells two products at $p_1=${p1}$ and $p_2=${p2}$. Its cost is $C=${cost}$. Find its positive profit-maximizing outputs and $|H_\\pi|$.`, `完全競爭廠商的兩種產品價格為 $p_1=${p1}$、$p_2=${p2}$，成本為 $C=${cost}$。求正的利潤極大產量及 $|H_\\pi|$。`),
    fields:[field('q1','number','$Q_1^*$ =','$Q_1^*$ =',x),field('q2','number','$Q_2^*$ =','$Q_2^*$ =',y),field('det','number','$|H_\\pi|$ =','$|H_\\pi|$ =',D)],
    misconceptions:[error('det',-D,'Profit curvature must be checked with the determinant of its Hessian.','請用利潤 Hessian 行列式檢查曲率。')],
    hints:[both('Profit is price times each quantity minus joint cost.','利潤是兩種產品收益之和減聯合成本。'),both('Set $p_1=C_{Q_1}$ and $p_2=C_{Q_2}$; cost interaction affects both equations.','令 $p_1=C_{Q_1}$、$p_2=C_{Q_2}$；成本交互項會影響兩式。')],
    solution:[both(`FOCs are $${p1}=${2*a}Q_1+${b===1?'':b}Q_2+${u}$ and $${p2}=${b===1?'':b}Q_1+${2*d}Q_2+${v}$. They give $(Q_1^*,Q_2^*)=(${x},${y})$.`, `一階條件為 $${p1}=${2*a}Q_1+${b===1?'':b}Q_2+${u}$ 與 $${p2}=${b===1?'':b}Q_1+${2*d}Q_2+${v}$，解得 $(Q_1^*,Q_2^*)=(${x},${y})$。`),both(`$H_\\pi=\\begin{pmatrix}${-2*a}&${-b}\\\\${-b}&${-2*d}\\end{pmatrix}$; its leading minors are $${-2*a}<0$ and $${D}>0$. Strict concavity gives the unique global profit maximum over nonnegative outputs.`, `$H_\\pi=\\begin{pmatrix}${-2*a}&${-b}\\\\${-b}&${-2*d}\\end{pmatrix}$；領先主子式為 $${-2*a}<0$、$${D}>0$，嚴格凹性保證非負產量上的唯一全域利潤極大值。`)]};
}
function discrimination(rng, level) {
  const q1=rng.int(1,5),q2=rng.int(1,5),b1=rng.int(1,3),b2=rng.int(1,3),c=rng.int(1,5),d=1,S=q1+q2;
  const A1=c+2*d*S+2*b1*q1,A2=c+2*d*S+2*b2*q2,mc=c+2*d*S,D=soc(-2*(b1+d),-2*d,-2*(b2+d),'max');
  return {id:'opt-multi/price-discrimination',level,vars:[],domain:{},
    prompt:both(`One firm sells in separate markets with $P_1=${A1}-${b1===1?'':b1}Q_1$ and $P_2=${A2}-${b2===1?'':b2}Q_2$. Common cost is $C=${c}(Q_1+Q_2)+(Q_1+Q_2)^2$. Find positive optimal sales, the common marginal cost, and $|H_\\pi|$.`, `同一廠商在兩個分隔市場銷售，$P_1=${A1}-${b1===1?'':b1}Q_1$、$P_2=${A2}-${b2===1?'':b2}Q_2$，共同成本 $C=${c}(Q_1+Q_2)+(Q_1+Q_2)^2$。求正的最適銷量、共同邊際成本及 $|H_\\pi|$。`),
    fields:[field('q1','number','$Q_1^*$ =','$Q_1^*$ =',q1),field('q2','number','$Q_2^*$ =','$Q_2^*$ =',q2),field('mc','number','$MC^*$ =','$MC^*$ =',mc),field('det','number','$|H_\\pi|$ =','$|H_\\pi|$ =',D)],
    misconceptions:[error('mc',c,'Marginal cost includes the derivative of the quadratic common-cost term.','邊際成本也包含共同成本二次項的導數。')],
    hints:[both('Each market has its own marginal revenue; total output determines common cost.','各市場有自己的邊際收益；總產量決定共同成本。'),both('Set $MR_1=MR_2=MC$ and verify a negative definite profit Hessian.','令 $MR_1=MR_2=MC$，並檢查利潤 Hessian 為負定。')],
    solution:[both(`$MR_1=${A1}-${2*b1}Q_1$, $MR_2=${A2}-${2*b2}Q_2$, and $MC=${c}+2(Q_1+Q_2)$. Simultaneous equality gives $(Q_1^*,Q_2^*)=(${q1},${q2})$ and $MC^*=${mc}$.`, `$MR_1=${A1}-${2*b1}Q_1$、$MR_2=${A2}-${2*b2}Q_2$、$MC=${c}+2(Q_1+Q_2)$。同時相等得 $(Q_1^*,Q_2^*)=(${q1},${q2})$、$MC^*=${mc}$。`),both(`The Hessian has $D_1=${-2*(b1+d)}<0$ and $D_2=${D}>0$, hence profit is strictly concave. Both prices, $${A1-b1*q1}$ and $${A2-b2*q2}$, are positive.`, `Hessian 的 $D_1=${-2*(b1+d)}<0$、$D_2=${D}>0$，利潤嚴格凹；兩個價格 $${A1-b1*q1}$、$${A2-b2*q2}$ 皆為正。`)]};
}
function three(rng, level) {
  const kind=rng.pick(['max','min']),s=kind==='max'?-1:1,a=2*rng.int(2,5),b=2*rng.int(2,5),c=2*rng.int(2,5),h=rng.int(1,2),j=rng.int(1,2),k=rng.int(1,2);
  const D1=s*a,D2=a*b-h*h,D3=s*a*b*c+2*h*j*k-s*a*k*k-s*b*j*j-s*c*h*h;
  if (!(D2>0 && (kind==='max'?D1<0&&D3<0:D1>0&&D3>0))) throw new Error('3D definiteness failed');
  return {id:'opt-multi/three-var',level,vars:[],domain:{},
    prompt:both(`At a stationary point, $H=\\begin{pmatrix}${s*a}&${h}&${j}\\\\${h}&${s*b}&${k}\\\\${j}&${k}&${s*c}\\end{pmatrix}$. Find its three leading principal minors and classify the point.`, `在駐點處，$H=\\begin{pmatrix}${s*a}&${h}&${j}\\\\${h}&${s*b}&${k}\\\\${j}&${k}&${s*c}\\end{pmatrix}$。求三個領先主子式並判別。`),
    fields:[field('d1','number','$D_1$ =','$D_1$ =',D1),field('d2','number','$D_2$ =','$D_2$ =',D2),field('d3','number','$D_3$ =','$D_3$ =',D3),field('kind','choice','Local classification =','局部判別 =',kind,definite)],
    misconceptions:[error('d2',D2+1,'Subtract the squared off-diagonal entry in the second determinant.','第二主子式須減去非對角元素的平方。')],
    hints:[both('Take the upper-left blocks of sizes one, two, and three.','依序取左上角一、二、三階方塊。'),both('Positive definite uses $+,+,+$; negative definite uses $-,+,-$.','正定的符號是 $+,+,+$；負定是 $-,+,-$。')],
    solution:[both(`The minors are $D_1=${D1}$, $D_2=${D2}$, $D_3=${D3}$.`, `主子式為 $D_1=${D1}$、$D_2=${D2}$、$D_3=${D3}$。`),both(`Their signs are ${kind==='max'?'negative, positive, negative':'positive, positive, positive'}. Therefore the Hessian is ${kind==='max'?'negative':'positive'} definite and the stationary point is a strict local ${kind==='max'?'maximum':'minimum'}.`, `符號依序為${kind==='max'?'負、正、負':'正、正、正'}，故 Hessian ${kind==='max'?'負':'正'}定，駐點是嚴格相對${kind==='max'?'極大':'極小'}值。`)]};
}
export const optMultiGenerators=[
  {id:'foc-2var',title:both('Two-variable stationary point','雙變數駐點'),levels:[1,2],minDistinct: 40, generate:foc},
  {id:'hessian',title:both('Hessian entries and determinant','Hessian 元素與行列式'),levels:[2],minDistinct: 40, generate:hessian},
  {id:'classify-2var',title:both('Classify a stationary point','判別駐點'),levels:[2],minDistinct: 40, generate:classify},
  {id:'multiproduct-firm',title:both('Multiproduct firm','多產品廠商'),levels:[3],minDistinct: 40, generate:firm},
  {id:'price-discrimination',title:both('Price discrimination','差別取價'),levels:[3],minDistinct: 40, generate:discrimination},
  {id:'three-var',title:both('Three-variable Hessian','三變數 Hessian'),levels:[3],minDistinct: 40, generate:three}
];
