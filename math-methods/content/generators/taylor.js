import { derivative, frac, linear, polynomial, texProduct } from './format.js';
const both=(en,zh)=>({en,zh});
const field=(key,type,en,zh,answer,tol)=>({key,type,label:both(en,zh),answer:String(answer),...(tol?{tol}:{})});
const error=(key,answer,en,zh)=>({key,answer:String(answer),feedback:both(en,zh)});
const factorial=n=>Array.from({length:n},(_,i)=>i+1).reduce((a,b)=>a*b,1);
const shift=a=>`(${linear(1,'x',-a)})`;

function maclaurinCoef(rng,level){
 const k=rng.int(2,3);
 if(level===1){
  const c0=rng.int(2,6),c1=rng.int(1,5),c2=rng.int(1,4),c3=rng.int(1,4);
  const f=polynomial([[c3,'x',3],[c2,'x',2],[c1,'x'],[c0]]);
  const coef=k===2?c2:c3,deriv=factorial(k)*coef;
  return {id:'taylor/maclaurin-coef',level,vars:[],domain:{},
   prompt:both(`For $f(x)=${f}$, find the coefficient of $x^{${k}}$ in its exact Maclaurin polynomial.`,`對 $f(x)=${f}$，求其精確馬克勞林多項式中 $x^{${k}}$ 的係數。`),
   fields:[field('coef','number',`Coefficient of $x^{${k}}$ =`,`$x^{${k}}$ 的係數 =`,coef)],
   misconceptions:[error('coef',deriv,'That is the derivative at zero; divide by the factorial to obtain the coefficient.','那是零點的導數值；還須除以階乘才是係數。')],
   hints:[both('Maclaurin means the center is zero.','馬克勞林展開的中心是零。'),both(`The coefficient of $x^k$ is $${derivative('f',k,0)}/k!$.`,`$x^k$ 的係數是 $${derivative('f',k,0)}/k!$。`)],
   solution:[both(`At zero, $${derivative('f',k,0)}=${deriv}$.`,`在零點，$${derivative('f',k,0)}=${deriv}$。`),both(`Divide by $${k}!=${factorial(k)}$ to get coefficient $${coef}$. The full polynomial expansion is exact.`,`除以 $${k}!=${factorial(k)}$，係數為 $${coef}$；完整多項式展開是精確等式。`)]};
 }
  const A=rng.int(2,9),b=rng.int(1,7),coef=A*(-b)**k;
 return {id:'taylor/maclaurin-coef',level,vars:[],domain:{},
  prompt:both(`For $f(x)=\\frac{${A}}{1+${texProduct(b,'x')}}$ near $x=0$ with $|${texProduct(b,'x')}|<1$, find the coefficient of $x^{${k}}$ in its Maclaurin expansion.`,`對 $x=0$ 附近且 $|${texProduct(b,'x')}|<1$ 的 $f(x)=\\frac{${A}}{1+${texProduct(b,'x')}}$，求馬克勞林展開中 $x^{${k}}$ 的係數。`),
  fields:[field('coef','number',`Coefficient of $x^{${k}}$ =`,`$x^{${k}}$ 的係數 =`,coef)],
  misconceptions:[error('coef',factorial(k)*coef,'The derivative at zero is $k!$ times the coefficient.','零點的導數值是係數的 $k!$ 倍。')],
  hints:[both('Treat the denominator as $1+u$ with $u=bx$.','將分母視為 $1+u$，其中 $u=bx$。'),both('Use $1/(1+u)=1-u+u^2-u^3+\\cdots$ when $|u|<1$.','在 $|u|<1$ 時用 $1/(1+u)=1-u+u^2-u^3+\\cdots$。')],
  solution:[both(`With $u=${texProduct(b,'x')}$, the series begins $f(x)=${A}(1-u+u^2-u^3+\\cdots)$.`,`令 $u=${texProduct(b,'x')}$，級數開頭是 $f(x)=${A}(1-u+u^2-u^3+\\cdots)$。`),both(`The $x^{${k}}$ term is $${coef}x^{${k}}$, so its coefficient is $${coef}$. This series is local to zero.`,`$x^{${k}}$ 項為 $${coef}x^{${k}}$，故係數為 $${coef}$；此級數適用於零點附近。`)]};
}

function taylorPoly(rng,level){
 let f,p,shown,center,derivatives,exact=false,domain={x:[0.2,5]};
 if(level===2&&rng.sign()>0){
  center=rng.int(1,3);
  const u=rng.int(1,3),v=rng.int(2,5),w=rng.int(2,7),value=u*center**2+v*center+w,slope=2*u*center+v;
  f=polynomial([[u,'x',2],[v,'x'],[w]]);
  p=`${value}+${slope}*(x-${center})+${u}*(x-${center})^2`;
  shown=`${value}+${slope}${shift(center)}+${u===1?'':u}${shift(center)}^2`;
  derivatives=`$f(${center})=${value}$, $f'(${center})=${slope}$, $f''(${center})=${2*u}$`; exact=true;
 }else if(level===2){
  center=rng.int(1,3);
  const c=rng.int(1,3),D=center+c;
  f=`\\frac{${D**3}}{x+${c}}`;
  p=`${D*D}-${D}*(x-${center})+(x-${center})^2`;
  shown=`${D*D}-${D}${shift(center)}+${shift(center)}^2`;
  derivatives=`$f(${center})=${D*D}$, $f'(${center})=-${D}$, $f''(${center})=2$`;
 }else{
  const variant=rng.int(0,2),a=rng.int(2,6),b=rng.int(1,5);
  if(variant===0){center=0;f=`e^x+${a}x+${b}`;p=`${1+b}+${1+a}*x+x^2/2`;shown=`${1+b}+${1+a}x+\\frac{1}{2}x^2`;derivatives=`$f(0)=${1+b}$, $f'(0)=${1+a}$, $f''(0)=1$`;domain={x:[-1,1]};}
  else if(variant===1){center=1;f=`\\ln x+${a}x+${b}`;p=`${a+b}+${a+1}*(x-1)-(x-1)^2/2`;shown=`${a+b}+${a+1}(x-1)-\\frac{1}{2}(x-1)^2`;derivatives=`$f(1)=${a+b}$, $f'(1)=${a+1}$, $f''(1)=-1$`;}
  else{center=4;f=`\\sqrt{x}+${a}x+${b}`;p=`${2+4*a+b}+(${a}+1/4)*(x-4)-(x-4)^2/64`;shown=`${2+4*a+b}+(${a}+\\frac{1}{4})(x-4)-\\frac{1}{64}(x-4)^2`;derivatives=`$f(4)=${2+4*a+b}$, $f'(4)=${frac(4*a+1,4,true)}$, $f''(4)=-1/32$`;domain={x:[2,6]};}
 }
 const derivativesZh=derivatives.replace(/, and /g,'、').replace(/ and /g,'、');
 return {id:'taylor/taylor-poly',level,vars:['x'],domain,
  prompt:both(`Find the second-order Taylor polynomial $P_2(x)$ for $f(x)=${f}$ centered at $x_0=${center}$. ${level===3?'This uses derivatives from the exp-log module.':''}`,`求 $f(x)=${f}$ 在 $x_0=${center}$ 的二階泰勒多項式 $P_2(x)$。${level===3?'本題使用指數與對數模組的導數知識。':''}`),
  fields:[field('p','expr','$P_2(x)$ =','$P_2(x)$ =',p)],
  misconceptions:[error('p',`(${p})+1`,'At the center, the polynomial must equal the original function.','在展開中心，多項式必須等於原函數。')],
  hints:[both('Evaluate the function and its first two derivatives at the center.','在展開中心計算函數值及前兩階導數。'),both("Use $P_2(x)=f(x_0)+f'(x_0)(x-x_0)+f''(x_0)(x-x_0)^2/2!$.","使用 $P_2(x)=f(x_0)+f'(x_0)(x-x_0)+f''(x_0)(x-x_0)^2/2!$。")],
  solution:[both(`At the center, ${derivatives}.`,`在展開中心，${derivativesZh}。`),both(`Taylor's formula gives $P_2(x)=${shown}$. ${exact?'This is exact because the original function is quadratic.':'Away from the center, the omitted remainder creates approximation error.'}`,`泰勒公式給出 $P_2(x)=${shown}$。${exact?'原函數為二次多項式，故此式精確。':'離開中心後仍有餘項，因而產生近似誤差。'}`)]};
}

function approxValue(rng,level){
 const variant=rng.int(0,3),a=rng.int(2,6),b=rng.int(1,5),h=rng.pick([1,1.25,1.5,1.75]);
 let f,center,target,estimate,actual,calculation,calculationZh;
 if(variant===0){
  const c=rng.int(1,5),D=a+c;
  center=a;target=a+h;f=`\\frac{${D**3}}{x+${c}}`;
  estimate=D*D-D*h+h*h;actual=D**3/(D+h);
  calculation=`$P_2(x)=${D*D}-${D}${shift(a)}+${shift(a)}^2$. With $x-x_0=${h}$, $P_2(${target})=${estimate}$.`;
  calculationZh=`$P_2(x)=${D*D}-${D}${shift(a)}+${shift(a)}^2$。代入 $x-x_0=${h}$，得 $P_2(${target})=${estimate}$。`;
 }else if(variant===1){
  center=0;target=h;f=`e^x+${a}x+${b}`;estimate=1+b+(1+a)*h+h*h/2;actual=Math.exp(h)+a*h+b;
  calculation=`$P_2(x)=${1+b}+${1+a}x+\\frac{1}{2}x^2$. At $x=${target}$, $P_2(${target})=${estimate}$.`;
  calculationZh=`$P_2(x)=${1+b}+${1+a}x+\\frac{1}{2}x^2$。代入 $x=${target}$，得 $P_2(${target})=${estimate}$。`;
 }else if(variant===2){
  center=1;target=1+h;f=`\\ln x+${a}x+${b}`;estimate=a+b+(a+1)*h-h*h/2;actual=Math.log(target)+a*target+b;
  calculation=`$P_2(x)=${a+b}+${a+1}(x-1)-\\frac{1}{2}(x-1)^2$. At $x=${target}$, $P_2(${target})=${estimate}$.`;
  calculationZh=`$P_2(x)=${a+b}+${a+1}(x-1)-\\frac{1}{2}(x-1)^2$。代入 $x=${target}$，得 $P_2(${target})=${estimate}$。`;
 }else{
  center=4;target=4+h;f=`\\sqrt x+${a}x+${b}`;estimate=2+4*a+b+(a+0.25)*h-h*h/64;actual=Math.sqrt(target)+a*target+b;
  calculation=`$P_2(x)=${2+4*a+b}+(${a}+\\frac{1}{4})(x-4)-\\frac{1}{64}(x-4)^2$. At $x=${target}$, $P_2(${target})=${estimate}$.`;
  calculationZh=`$P_2(x)=${2+4*a+b}+(${a}+\\frac{1}{4})(x-4)-\\frac{1}{64}(x-4)^2$。代入 $x=${target}$，得 $P_2(${target})=${estimate}$。`;
 }
 return {id:'taylor/approx-value',level,vars:[],domain:{},
  prompt:both(`Use the second-order Taylor polynomial for $f(x)=${f}$ centered at $x_0=${center}$ to estimate $f(${target})$. Round the polynomial estimate to 3 decimals.${variant?' This uses derivatives from the exp-log module.':''}`,`用 $f(x)=${f}$ 在 $x_0=${center}$ 的二階泰勒多項式估計 $f(${target})$。將多項式估計值四捨五入至小數第 3 位。${variant?'本題使用指數與對數模組的導數知識。':''}`),
  fields:[field('estimate','number','Polynomial estimate =','多項式估計值 =',estimate.toFixed(3),{absTol:0.00051,relTol:0})],
  misconceptions:[error('estimate',actual.toFixed(3),'That is the original function value; this asks for the polynomial estimate.','這是原函數值；本題要求多項式的估計值。')],
  hints:[both('Construct $P_2$ from the function and its first two derivatives at the center.','用中心點的函數值及前兩階導數建立 $P_2$。'),both('Substitute the target into $P_2$ and round only the final result.','將目標值代入 $P_2$，只在最後四捨五入。')],
  solution:[both(`Taylor's formula gives ${calculation}`,`泰勒公式給出 ${calculationZh}`),both(`The polynomial estimate rounds to $${estimate.toFixed(3)}$. The actual value is about $${actual.toFixed(3)}$; the difference is the omitted remainder.`,`多項式估計值四捨五入後為 $${estimate.toFixed(3)}$。原函數值約為 $${actual.toFixed(3)}$；差距來自省略的餘項。`)]};
}
export const taylorGenerators=[
 {id:'maclaurin-coef',title:both('Maclaurin coefficients','馬克勞林係數'),levels:[1,2],minDistinct: 40, generate:maclaurinCoef},
 {id:'taylor-poly',title:both('Taylor polynomial','泰勒多項式'),levels:[2,3],minDistinct: 40, generate:taylorPoly},
 {id:'approx-value',title:both('Approximate a value','函數值近似'),levels:[3],minDistinct: 40, generate:approxValue}
];
