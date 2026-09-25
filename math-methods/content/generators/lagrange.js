import { frac } from './format.js';

const both=(en,zh)=>({en,zh});
const field=(key,type,en,zh,answer,options)=>({key,type,label:both(en,zh),answer:String(answer),...(options?{options}:{})});
const error=(key,answer,en,zh)=>({key,answer:String(answer),feedback:both(en,zh)});
const kinds=[{value:'max',label:both('Local maximum','相對極大值')},{value:'min',label:both('Local minimum','相對極小值')}];
const convention=both('Use the convention $Z=f+\\lambda(c-g)$.','採用約定 $Z=f+\\lambda(c-g)$。');
function bordered(gx,gy,hxx,hxy,hyy,kind){
  const det=2*gx*gy*hxy-gy*gy*hxx-gx*gx*hyy;
  if (!(kind==='max'?det>0:det<0)) throw new Error('Bordered Hessian sign failed');
  return det;
}
function setup(rng,level){
  const p=rng.int(1,3),q=rng.int(1,3),B=rng.int(8,20);
  return {id:'lagrange/setup',level,vars:['x','y','lambda'],domain:{x:[1,5],y:[1,5],lambda:[0.5,3]},
    prompt:both(`Maximize $f(x,y)=xy$ subject to $g(x,y)=${p===1?'':p}x+${q===1?'':q}y=${B}$. ${convention.en} Enter $Z$ as an expression in x, y, lambda.`,`在 $g(x,y)=${p===1?'':p}x+${q===1?'':q}y=${B}$ 下極大化 $f(x,y)=xy$。${convention.zh}請以 x、y、lambda 輸入 $Z$ 的代數式。`),
    fields:[field('z','expr','$Z$ =','$Z$ =',`x*y+lambda*(${B}-${p}*x-${q}*y)`)],
    misconceptions:[error('z',`x*y+lambda*(${p}*x+${q}*y-${B})`,'This uses the opposite multiplier sign. The prescribed convention is $+\\lambda(c-g)$.','這是相反的乘數符號；題目指定 $+\\lambda(c-g)$。')],
    hints:[both('The objective is the first term.','目標函數是第一項。'),both('Subtract the entire left side of the constraint from its right side inside the multiplier term.','在乘數項中，用限制式右側減去整個左側。')],
    solution:[both(`Here $c=${B}$ and $g=${p===1?'':p}x+${q===1?'':q}y$.`,`此處 $c=${B}$、$g=${p===1?'':p}x+${q===1?'':q}y$。`),both(`Thus $Z=xy+\\lambda(${B}-${p===1?'':p}x-${q===1?'':q}y)$. Reversing the sign changes the multiplier convention.`,`故 $Z=xy+\\lambda(${B}-${p===1?'':p}x-${q===1?'':q}y)$；反轉括號符號會改變乘數約定。`)]};
}
function solve(rng,level){
  const x=rng.int(1,5),y=rng.int(1,5),k=rng.int(1,3),a=x+k,b=y+k,c=x+y,lambda=2*k;
  const det=bordered(1,1,-2,0,-2,'max');
  return {id:'lagrange/solve-linear',level,vars:[],domain:{},
    prompt:both(`Maximize $f(x,y)=-(x-${a})^2-(y-${b})^2$ subject to $g(x,y)=x+y=${c}$, with $x,y>0$. ${convention.en} Find the interior solution and multiplier.${level===2?' Give the bordered-Hessian determinant too.':''}`,`在 $g(x,y)=x+y=${c}$、$x,y>0$ 下極大化 $f(x,y)=-(x-${a})^2-(y-${b})^2$。${convention.zh}求內部解與乘數。${level===2?'並求加邊 Hessian 行列式。':''}`),
    fields:[field('x','number','$x^*$ =','$x^*$ =',x),field('y','number','$y^*$ =','$y^*$ =',y),field('lambda','number','$\\lambda^*$ =','$\\lambda^*$ =',lambda),...(level===2?[field('det','number','$|\\bar H|$ =','$|\\bar H|$ =',det)]:[])],
    misconceptions:[error('lambda',-lambda,'With $Z=f+\\lambda(c-g)$, $f_x=\\lambda g_x$; check the multiplier sign.','依 $Z=f+\\lambda(c-g)$，$f_x=\\lambda g_x$；請檢查乘數符號。')],
    hints:[both('Write the three first-order equations, including the constraint.','寫出三個一階條件，包括限制式。'),both('Set $-2(x-a)=\\lambda$ and $-2(y-b)=\\lambda$, then use $x+y=c$.','令 $-2(x-a)=\\lambda$、$-2(y-b)=\\lambda$，再使用 $x+y=c$。')],
    solution:[both(`$Z=-(x-${a})^2-(y-${b})^2+\\lambda(${c}-x-y)$. The FOCs give $-2(x-${a})=\\lambda=-2(y-${b})$ and $x+y=${c}$. Hence $(x^*,y^*,\\lambda^*)=(${x},${y},${lambda})$.`,`$Z=-(x-${a})^2-(y-${b})^2+\\lambda(${c}-x-y)$。一階條件給出 $-2(x-${a})=\\lambda=-2(y-${b})$ 與 $x+y=${c}$，故 $(x^*,y^*,\\lambda^*)=(${x},${y},${lambda})$。`),both(`With the border $(g_x,g_y)=(1,1)$, $\\bar H=\\begin{pmatrix}0&1&1\\\\1&-2&0\\\\1&0&-2\\end{pmatrix}$ and $|\\bar H|=${det}>0$: a strict constrained local maximum. The quadratic is strictly concave, so it is also globally best on the feasible line.`,`以 $(g_x,g_y)=(1,1)$ 作邊，$\\bar H=\\begin{pmatrix}0&1&1\\\\1&-2&0\\\\1&0&-2\\end{pmatrix}$，$|\\bar H|=${det}>0$，故為嚴格限制式相對極大值；目標函數嚴格凹，也是在可行線上的全域極大值。`)]};
}
function cobb(rng,level){
  const a=rng.int(1,3),b=rng.int(1,3),k=rng.int(2,6),priceScale=rng.int(1,4);
  const px=a*priceScale,py=b*priceScale,B=(a+b)*priceScale*k,lambda=k**(a+b-1)/priceScale;
  const hxx=a*(a-1)*k**(a+b-2),hxy=a*b*k**(a+b-2),hyy=b*(b-1)*k**(a+b-2),det=bordered(px,py,hxx,hxy,hyy,'max');
  return {id:'lagrange/cobb-douglas',level,vars:[],domain:{},
    prompt:both(`A consumer maximizes $U(x,y)=${a===1?'x':`x^{${a}}`}${b===1?'y':`y^{${b}}`}$ subject to $g(x,y)=${px===1?'':px}x+${py===1?'':py}y=${B}$, with $x,y>0$. ${convention.en} Find demands, $\\lambda^*$, and the bordered-Hessian determinant.`,`消費者在 $g(x,y)=${px===1?'':px}x+${py===1?'':py}y=${B}$、$x,y>0$ 下極大化 $U(x,y)=${a===1?'x':`x^{${a}}`}${b===1?'y':`y^{${b}}`}$。${convention.zh}求需求、$\\lambda^*$ 及加邊 Hessian 行列式。`),
    fields:[field('x','number','$x^*$ =','$x^*$ =',k),field('y','number','$y^*$ =','$y^*$ =',k),field('lambda','number','$\\lambda^*$ =','$\\lambda^*$ =',lambda),field('det','number','$|\\bar H|$ =','$|\\bar H|$ =',det)],
    misconceptions:[error('lambda',-lambda,'An extra unit of budget raises optimal utility under this convention, so the multiplier is positive.','依本題約定，增加預算會提高最適效用，故乘數為正。')],
    hints:[both('At an interior tangency, marginal utility per dollar is equal across goods.','內部切點上，兩種商品每元邊際效用相等。'),both('Use $U_x/p_x=U_y/p_y=\\lambda$ with the budget equation.','聯立 $U_x/p_x=U_y/p_y=\\lambda$ 與預算式。')],
    solution:[both(`$Z=${a===1?'x':`x^{${a}}`}${b===1?'y':`y^{${b}}`}+\\lambda(${B}-${px===1?'':px}x-${py===1?'':py}y)$. The FOCs $U_x/${px}=U_y/${py}=\\lambda$ imply $x=y$; the budget gives $x^*=y^*=${k}$ and $\\lambda^*=${frac(k**(a+b-1),priceScale,true)}>0$.`,`$Z=${a===1?'x':`x^{${a}}`}${b===1?'y':`y^{${b}}`}+\\lambda(${B}-${px===1?'':px}x-${py===1?'':py}y)$。一階條件 $U_x/${px}=U_y/${py}=\\lambda$ 得 $x=y$；預算式給出 $x^*=y^*=${k}$、$\\lambda^*=${frac(k**(a+b-1),priceScale,true)}>0$。`),both(`At the solution, $(U_{xx},U_{xy},U_{yy})=(${hxx},${hxy},${hyy})$ and $(g_x,g_y)=(${px},${py})$. Thus $|\\bar H|=${det}>0$, a strict local maximum; Cobb–Douglas level curves and the positive budget line make this the unique interior global maximum.`,`在解上，$(U_{xx},U_{xy},U_{yy})=(${hxx},${hxy},${hyy})$、$(g_x,g_y)=(${px},${py})$，故 $|\\bar H|=${det}>0$，為嚴格相對極大值；Cobb–Douglas 等效用曲線與正價格預算線也給出唯一的內部全域極大值。`)]};
}
function cost(rng,level){
  const L=rng.int(2,7),K=rng.int(2,7),lambda=rng.int(1,3);
  const A=level===3?rng.int(1,3):1, alpha=level===3?2:1;
  const Q=A*L**alpha*K,w=lambda*A*alpha*L**(alpha-1)*K,r=lambda*A*L**alpha;
  const gx=A*alpha*L**(alpha-1)*K,gy=A*L**alpha;
  const hxx=-lambda*A*alpha*(alpha-1)*L**(alpha-2)*K,hxy=-lambda*A*alpha*L**(alpha-1);
  const det=bordered(gx,gy,hxx,hxy,0,'min');
  const production=level===3?`${A===1?'':A}L^2K`:'LK';
  const denominator=level===3?`${A===1?'':A}L^2`:'L';
  return {id:'lagrange/cost-min',level,vars:[],domain:{},
    prompt:both(`A firm must produce $Q_0=${Q}$ with $g(L,K)=${production}$. Input prices are $w=${w}$ for labor and $r=${r}$ for capital; minimize $C=wL+rK$ for $L,K>0$. ${convention.en} Find the least-cost inputs, $\\lambda^*$, and $|\\bar H|$.`,`廠商必須以 $g(L,K)=${production}$ 生產 $Q_0=${Q}$。勞動價格 $w=${w}$、資本價格 $r=${r}$；在 $L,K>0$ 下極小化 $C=wL+rK$。${convention.zh}求最低成本投入、$\\lambda^*$ 與 $|\\bar H|$。`),
    fields:[field('L','number','$L^*$ =','$L^*$ =',L),field('K','number','$K^*$ =','$K^*$ =',K),field('lambda','number','$\\lambda^*$ =','$\\lambda^*$ =',lambda),field('det','number','$|\\bar H|$ =','$|\\bar H|$ =',det)],
    misconceptions:[error('det',-det,'For one equality and two choices, a negative bordered determinant supports a constrained minimum.','單一等式限制、兩個選擇變數下，負的加邊行列式支持限制式極小值。')],
    hints:[both('At the tangency, each input has the same price per marginal product.','切點上，兩種投入的每單位邊際產量價格相同。'),both('Use $w/g_L=r/g_K=\\lambda$ and the output constraint.','聯立 $w/g_L=r/g_K=\\lambda$ 與產量限制式。')],
    solution:[both(`$Z=${w}L+${r}K+\\lambda(${Q}-${production})$. At the solution $(g_L,g_K)=(${gx},${gy})$, so $w=\\lambda g_L$, $r=\\lambda g_K$, and $g=${Q}$ give $(L^*,K^*,\\lambda^*)=(${L},${K},${lambda})$.`,`$Z=${w}L+${r}K+\\lambda(${Q}-${production})$。解上 $(g_L,g_K)=(${gx},${gy})$，故 $w=\\lambda g_L$、$r=\\lambda g_K$ 與 $g=${Q}$ 給出 $(L^*,K^*,\\lambda^*)=(${L},${K},${lambda})$。`),both(`The border is $(g_L,g_K)=(${gx},${gy})$ and $(Z_{LL},Z_{LK},Z_{KK})=(${hxx},${hxy},0)$. Thus $|\\bar H|=${det}<0$: a strict constrained local minimum. Substitution $K=Q_0/(${denominator})$ gives a strictly convex cost curve for $L>0$, so it is global.`,`邊為 $(g_L,g_K)=(${gx},${gy})$，且 $(Z_{LL},Z_{LK},Z_{KK})=(${hxx},${hxy},0)$，故 $|\\bar H|=${det}<0$，為嚴格限制式相對極小值。代入 $K=Q_0/(${denominator})$ 後，$L>0$ 的成本曲線嚴格凸，故也是全域極小值。`)]};
}
function borderedProblem(rng,level){
  const kind=rng.pick(['max','min']),s=kind==='max'?-1:1,a=rng.int(1,3),b=rng.int(1,3),p=rng.int(1,3),q=rng.int(1,3),x=rng.int(1,4),y=rng.int(1,4),c=p*x+q*y;
  const lambda=rng.int(1,3),cross=level===3?-s*rng.int(1,2):0;
  if (lambda === 0) throw new Error('Constraint must bind with a nonzero multiplier');
  const hxx=2*s*a,hyy=2*s*b,det=bordered(p,q,hxx,cross,hyy,kind);
  const objective=`${s<0?'-':''}${a===1?'':a}(x-${x})^2${s<0?'-':'+'}${b===1?'':b}(y-${y})^2${cross?`${cross<0?'-':'+'}${Math.abs(cross)===1?'':Math.abs(cross)}(x-${x})(y-${y})`:''}+${lambda===1?'':lambda}(${p===1?'':p}x+${q===1?'':q}y)`;
  return {id:'lagrange/bordered-hessian',level,vars:[],domain:{},
    prompt:both(`For $f(x,y)=${objective}$ under $g(x,y)=${p===1?'':p}x+${q===1?'':q}y=${c}$, the constrained stationary point is $(${x},${y})$. ${convention.en} Compute $|\\bar H|$ with border $(g_x,g_y)$ and classify it on the feasible line.${level===3?' Also find the multiplier.':''}`,`在 $g(x,y)=${p===1?'':p}x+${q===1?'':q}y=${c}$ 下，$f(x,y)=${objective}$ 的限制式駐點是 $(${x},${y})$。${convention.zh}以 $(g_x,g_y)$ 作邊求 $|\\bar H|$，並在可行線上判別。${level===3?'另求乘數。':''}`),
    fields:[field('det','number','$|\\bar H|$ =','$|\\bar H|$ =',det),field('kind','choice','Constrained classification =','限制式判別 =',kind,kinds),...(level===3?[field('lambda','number','$\\lambda^*$ =','$\\lambda^*$ =',lambda)]:[])],
    misconceptions:[error('kind',kind==='max'?'min':'max','The bordered determinant sign rule is positive for a constrained maximum and negative for a minimum.','加邊行列式的符號規則：限制式極大為正，極小為負。')],
    hints:[both('Place zero at the top-left and the constraint gradient along the top and left.','左上角放零，限制式梯度放在上邊與左邊。'),both('For two choices and one equality, positive determinant means local maximum; negative means local minimum.','兩變數、單一等式限制下，行列式正為相對極大，負為相對極小。')],
    solution:[both(`At $(${x},${y})$, $(f_x,f_y)=(${lambda*p},${lambda*q})=${lambda}(g_x,g_y)$, so $\\lambda^*=${lambda}\\ne0$. The bordered matrix is $\\bar H=\\begin{pmatrix}0&${p}&${q}\\\\${p}&${hxx}&${cross}\\\\${q}&${cross}&${hyy}\\end{pmatrix}$, giving $|\\bar H|=${det}$.`,`在 $(${x},${y})$，$(f_x,f_y)=(${lambda*p},${lambda*q})=${lambda}(g_x,g_y)$，故 $\\lambda^*=${lambda}\\ne0$。加邊矩陣為 $\\bar H=\\begin{pmatrix}0&${p}&${q}\\\\${p}&${hxx}&${cross}\\\\${q}&${cross}&${hyy}\\end{pmatrix}$，得 $|\\bar H|=${det}$。`),both(`The sign is ${kind==='max'?'positive':'negative'}, giving a strict constrained local ${kind==='max'?'maximum':'minimum'}. This sign concerns curvature along feasible directions.`,`符號為${kind==='max'?'正':'負'}，故是嚴格限制式相對${kind==='max'?'極大':'極小'}值；此符號檢驗可行方向上的曲率。`)]};
}
function shadow(rng,level){
  const k=rng.int(2,9),scale=rng.int(1,6),B=2*k,delta=rng.int(1,5),lambda=scale*k,approx=lambda*delta,exact=approx+scale*delta*delta/4;
  bordered(1,1,0,1,0,'max');
  return {id:'lagrange/shadow-price',level,vars:[],domain:{},
    prompt:both(`Maximize $U(x,y)=${scale===1?'':scale}xy$ with $x+y=B=${B}$ and $x,y>0$. ${convention.en} At the optimum $\\lambda^*=${lambda}$. If budget rises by $\\Delta B=${delta}$, use $\\Delta U^*\\approx\\lambda^*\\Delta B$ as a first-order approximation, then give the exact change after re-solving.`,`在 $x+y=B=${B}$、$x,y>0$ 下極大化 $U(x,y)=${scale===1?'':scale}xy$。${convention.zh}最適時 $\\lambda^*=${lambda}$。若預算增加 $\\Delta B=${delta}$，先以 $\\Delta U^*\\approx\\lambda^*\\Delta B$ 作一階近似，再重新求解給出精確變化量。`),
    fields:[field('approx','number','First-order approximate $\\Delta U^*$ =','一階近似 $\\Delta U^*$ =',approx),field('exact','number','Exact $\\Delta U^*$ =','精確 $\\Delta U^*$ =',exact)],
    misconceptions:[error('exact',approx,'The shadow-price formula is first-order; the exact re-solve includes a quadratic term.','影子價格公式是一階近似；精確重新求解另有二次項。')],
    hints:[both('The multiplier is the slope of optimized utility with respect to budget at the original budget.','乘數是原預算處最適效用對預算的斜率。'),both(`For any positive budget $B$, re-solve $x^*=y^*=B/2$ and $U^*(B)=${scale===1?'':scale}B^2/4$.`,`對任意正預算 $B$，重新求解得 $x^*=y^*=B/2$、$U^*(B)=${scale===1?'':scale}B^2/4$。`)],
    solution:[both(`The original optimum is $(x^*,y^*)=(${k},${k})$ and $U^*=${scale*k*k}$. First-order approximation: $\\lambda^*\\Delta B=${lambda}(${delta})=${approx}$.`,`原最適解為 $(x^*,y^*)=(${k},${k})$、$U^*=${scale*k*k}$。一階近似為 $\\lambda^*\\Delta B=${lambda}(${delta})=${approx}$。`),both(`Exactly, $U^*(B)=${scale===1?'':scale}B^2/4$; at $B'=${B+delta}$ the re-solved choices are $x'=y'=${frac(B+delta,2,true)}$. Thus the exact change is $U^*(${B+delta})-U^*(${B})=${frac(4*exact,4,true)}$. The difference from the first-order estimate is $${frac(scale*delta*delta,4,true)}$.`,`精確地，$U^*(B)=${scale===1?'':scale}B^2/4$；在 $B'=${B+delta}$，重新求解得 $x'=y'=${frac(B+delta,2,true)}$。因此精確變化是 $U^*(${B+delta})-U^*(${B})=${frac(4*exact,4,true)}$，與一階近似差 $${frac(scale*delta*delta,4,true)}$。`)]};
}
export const lagrangeGenerators=[
  {id:'setup',title:both('Set up the Lagrangian','建立 Lagrange 函數'),levels:[1],minDistinct: 40, generate:setup},
  {id:'solve-linear',title:both('Quadratic objective, linear constraint','二次目標與線性限制'),levels:[1,2],minDistinct: 40, generate:solve},
  {id:'cobb-douglas',title:both('Cobb–Douglas consumer','Cobb–Douglas 消費者'),levels:[2],minDistinct: 40, generate:cobb},
  {id:'cost-min',title:both('Least-cost inputs','最低成本投入組合'),levels:[2,3],minDistinct: 40, generate:cost},
  {id:'bordered-hessian',title:both('Bordered Hessian test','加邊 Hessian 檢定'),levels:[2,3],minDistinct: 40, generate:borderedProblem},
  {id:'shadow-price',title:both('Shadow value and exact change','影子價格與精確變化'),levels:[3],minDistinct: 40, generate:shadow}
];
