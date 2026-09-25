import { frac, linear, term, texProduct, texRate } from './format.js';
const both=(en,zh)=>({en,zh});
const field=(key,type,en,zh,answer)=>({key,type,label:both(en,zh),answer:String(answer)});
const error=(key,answer,en,zh)=>({key,answer:String(answer),feedback:both(en,zh)});

function logRules(rng,level){
  const a=rng.int(2,6),b=rng.int(2,4),m=rng.int(2,5);
  if(level===1) return {id:'exp-log/log-rules',level,vars:[],domain:{},
    prompt:both(`Solve $${a}e^{${term(b,'x')}}=${a}e^{${b*m}}$ for $x$.`, `解 $${a}e^{${term(b,'x')}}=${a}e^{${b*m}}$，求 $x$。`),
    fields:[field('x','number','$x$ =','$x$ =',m)],misconceptions:[error('x',b*m,'First divide by the scale factor, then take logarithms and divide by the coefficient of $x$.','先除以比例係數，再取對數，最後除以 $x$ 的係數。')],
    hints:[both('Divide both sides by the same positive scale factor.','兩邊同除以正的比例係數。'),both('Natural logarithm reverses the natural exponential: $\\ln(e^u)=u$.','自然對數是自然指數的反函數：$\\ln(e^u)=u$。')],
    solution:[both(`Divide by $${a}$ to get $e^{${term(b,'x')}}=e^{${b*m}}$.`,`兩邊除以 $${a}$，得 $e^{${term(b,'x')}}=e^{${b*m}}$。`),both(`Taking natural logs yields $${term(b,'x')}=${b*m}$, hence $x=${m}$.`,`取自然對數得 $${term(b,'x')}=${b*m}$，故 $x=${m}$。`)]};
  const n=rng.int(2,5);
  return {id:'exp-log/log-rules',level,vars:['x'],domain:{x:[0.5,4]},
    prompt:both(`For $x>0$, simplify $\\ln(x^{${n}})-\\ln(x)$ as a single multiple of $\\ln x$.`,`對 $x>0$，將 $\\ln(x^{${n}})-\\ln(x)$ 化簡為 $\\ln x$ 的倍數。`),
    fields:[field('ans','expr','Simplified expression =','化簡結果 =',`${n-1}*log(x)`)],misconceptions:[error('ans',`${n+1}*log(x)`,'The logarithm of a quotient subtracts the exponents.','對數商法則使指數相減。')],
    hints:[both('Use the power rule for logarithms.','使用對數的冪次法則。'),both('Subtract the two multiples of $\\ln x$.','把兩個 $\\ln x$ 的倍數相減。')],
    solution:[both(`$\\ln(x^{${n}})=${texProduct(n, '\\ln x')}$ because $x>0$.`,`因為 $x>0$，$\\ln(x^{${n}})=${texProduct(n, '\\ln x')}$。`),both(`Thus $${texProduct(n, '\\ln x')}-\\ln x=${texProduct(n-1, '\\ln x')}$.`,`因此 $${texProduct(n, '\\ln x')}-\\ln x=${texProduct(n-1, '\\ln x')}$。`)]};
}
function diffExp(rng,level){
 const a=rng.int(2,5),b=rng.int(1,6),base=rng.int(2,5),inside=linear(a,'x',b),natural=level===1;
 const f=natural?`e^{${inside}}`:`${base}^{${inside}}`;
 const answer=natural?`${a}*exp(${inside})`:`${a}*log(${base})*${base}^(${inside})`;
 const wrong=natural?`exp(${inside})`:`${a}*${base}^(${inside})`;
 return {id:'exp-log/diff-exp',level,vars:['x'],domain:{x:[0.5,4]},
 prompt:both(`Differentiate $f(x)=${f}$.`,`求 $f(x)=${f}$ 的導數。`),fields:[field('ans','expr',"$f'(x)$ =","$f'(x)$ =",answer)],
 misconceptions:[error('ans',wrong,natural?'Multiply by the derivative of the exponent.':'A general base contributes a factor $\\ln b$.',natural?'須乘上指數內部的導數。':'一般底數微分還要乘上 $\\ln b$。')],
 hints:[both('Name the exponent $u(x)$ before using the chain rule.','先將指數記為 $u(x)$，再用連鎖律。'),both(natural?'Use $(e^u)\\prime=e^u u\\prime$.':'Use $(b^u)\\prime=b^u(\\ln b)u\\prime$.',natural?'使用 $(e^u)\\prime=e^u u\\prime$。':'使用 $(b^u)\\prime=b^u(\\ln b)u\\prime$。')],
 solution:[both(`The inner function is $u=${inside}$, so $u'=${a}$.`,`內部函數為 $u=${inside}$，因此 $u'=${a}$。`),both(natural?`Therefore $f'(x)=${a}e^{${inside}}$.`:`Therefore $f'(x)=${a}(\\ln ${base})${base}^{${inside}}$.`,natural?`所以 $f'(x)=${a}e^{${inside}}$。`:`所以 $f'(x)=${a}(\\ln ${base})${base}^{${inside}}$。`)]};
}
function diffLog(rng,level){
 const a=rng.int(2,6),b=rng.int(2,7),base=rng.int(2,5),inside=linear(a,'x',b),natural=level===1;
 const answer=natural?`${a}/(${inside})`:`${a}/((${inside})*log(${base}))`;
 return {id:'exp-log/diff-log',level,vars:['x'],domain:{x:[0.5,4]},
 prompt:both(`For $x>0$, differentiate $f(x)=${natural?`\\ln(${inside})`:`\\log_{${base}}(${inside})`}$.`,`對 $x>0$，求 $f(x)=${natural?`\\ln(${inside})`:`\\log_{${base}}(${inside})`}$ 的導數。`),
 fields:[field('ans','expr',"$f'(x)$ =","$f'(x)$ =",answer)],
 misconceptions:[error('ans',natural?`1/(${inside})`:`${a}/(${inside})`,natural?'The argument also changes with $x$; multiply by its derivative.':'The change of base introduces a denominator $\\ln b$.',natural?'括號內的函數也隨 $x$ 改變，須乘上其導數。':'換底後分母還有 $\\ln b$。')],
 hints:[both('Differentiate the inner linear expression.','先對括號內的一次式求導。'),both(natural?'Use $(\\ln u)\\prime=u\\prime/u$.':'Use $\\log_b u=\\ln u/\\ln b$.',natural?'使用 $(\\ln u)\\prime=u\\prime/u$。':'使用 $\\log_b u=\\ln u/\\ln b$。')],
 solution:[both(`The argument $u=${inside}$ is positive and $u'=${a}$.`,`真數 $u=${inside}$ 為正，且 $u'=${a}$。`),both(natural?`Hence $f'(x)=${a}/(${inside})$.`:`Base change gives $f'(x)=${a}/[(${inside})\\ln ${base}]$.`,natural?`因此 $f'(x)=${a}/(${inside})$。`:`換底後 $f'(x)=${a}/[(${inside})\\ln ${base}]$。`)]};
}
function compound(rng,level){
 const m=rng.int(2,4),n=rng.int(1,3),rate=rng.int(1,3), principal=rng.int(2,5)*100;
 const annual=`${(rate/10).toFixed(1)}`, exponent=m*n, discrete=`${principal}*(1+${frac(rate,10*m)})^${exponent}`;
 return {id:'exp-log/compound',level,vars:[],domain:{},
 prompt:both(`Deposit $${principal}$ for ${n} year${n>1?'s':''} at nominal annual rate $${annual}$, compounded ${m} times yearly. Find the discrete-compounding balance${level===2?' and the balance under continuous compounding at the same nominal rate':''}.`,`本金 $${principal}$，名目年利率 $${annual}$，每年複利 ${m} 次，存 ${n} 年。求離散複利本利和${level===2?'，以及相同名目利率下的連續複利本利和':''}。`),
 fields:[field('discrete','number','Discrete balance =','離散複利本利和 =',discrete),...(level===2?[field('continuous','number','Continuous balance =','連續複利本利和 =',`${principal}*exp(${rate}*${n}/10)`)]:[])],
 misconceptions:[error('discrete',`${principal}*exp(${rate}*${n}/10)`,'Continuous compounding is a distinct convention; use the stated number of periods for this field.','連續複利是另一種計息方式；此欄須使用題目指定的每年期數。')],
 hints:[both('The per-period rate is the annual nominal rate divided by the periods per year.','每期利率等於名目年利率除以一年計息次數。'),both('Use $B=P(1+r/m)^{mt}$; for continuous compounding use $B=Pe^{rt}$.','離散複利用 $B=P(1+r/m)^{mt}$；連續複利用 $B=Pe^{rt}$。')],
 solution:[both(`There are $${m*n}$ periods, each at rate $${frac(rate,10*m,true)}$; hence $B_d=${principal}(1+${frac(rate,10*m,true)})^{${exponent}}$.`,`共有 $${m*n}$ 期，每期利率為 $${frac(rate,10*m,true)}$；故 $B_d=${principal}(1+${frac(rate,10*m,true)})^{${exponent}}$。`),both(level===2?`Numerically $B_d\\approx${(principal*(1+rate/(10*m))**exponent).toFixed(3)}$. Continuous compounding instead gives $B_c=${principal}e^{${frac(rate*n,10,true)}}\\approx${(principal*Math.exp(rate*n/10)).toFixed(3)}$.`:`Evaluating the power gives $B_d\\approx${(principal*(1+rate/(10*m))**exponent).toFixed(3)}$; the exact answer is $${principal}(1+${frac(rate,10*m,true)})^{${exponent}}$.`,level===2?`數值上 $B_d\\approx${(principal*(1+rate/(10*m))**exponent).toFixed(3)}$；連續複利則為 $B_c=${principal}e^{${frac(rate*n,10,true)}}\\approx${(principal*Math.exp(rate*n/10)).toFixed(3)}$。`:`計算冪次得 $B_d\\approx${(principal*(1+rate/(10*m))**exponent).toFixed(3)}$；精確答案為 $${principal}(1+${frac(rate,10*m,true)})^{${exponent}}$。`)]};
}
function growthRate(rng,level){
 const g=rng.int(2,6),h=rng.int(1,g-1),k=rng.int(1,3), A=rng.int(2,5),B=rng.int(2,5);
 if(level===2)return {id:'exp-log/growth-rate',level,vars:['t'],domain:{t:[0.5,5]},
 prompt:both(`For $t>0$, let $Y(t)=${A}${k===1?'t':`t^{${k}}`}e^{${texRate(g,10,'t')}}$. Find its instantaneous proportional growth rate $d\\ln Y/dt$.`,`對 $t>0$，設 $Y(t)=${A}${k===1?'t':`t^{${k}}`}e^{${texRate(g,10,'t')}}$。求瞬時比例成長率 $d\\ln Y/dt$。`),
 fields:[field('rate','expr','Growth rate =','成長率 =',`${k}/t+${frac(g,10)}`)],misconceptions:[error('rate',frac(g,10),'The power of time also contributes $k/t$ to proportional growth.','時間冪次也對比例成長率貢獻 $k/t$。')],
 hints:[both('Taking logs turns the product into a sum.','取對數將乘積化為和。'),both('Differentiate $\\ln Y=\\ln A+k\\ln t+gt/10$.','對 $\\ln Y=\\ln A+k\\ln t+gt/10$ 微分。')],
 solution:[both(`$\\ln Y=\\ln ${A}+${texProduct(k, '\\ln t')}+${texRate(g,10,'t')}$.`,`$\\ln Y=\\ln ${A}+${texProduct(k, '\\ln t')}+${texRate(g,10,'t')}$。`),both(`Differentiate: $d\\ln Y/dt=${k}/t+${frac(g,10,true)}$.`,`微分得 $d\\ln Y/dt=${k}/t+${frac(g,10,true)}$。`)]};
 return {id:'exp-log/growth-rate',level,vars:[],domain:{},
 prompt:both(`Output and labor grow as $Y=${A}e^{${texRate(g,10,'t')}}$ and $L=${B}e^{${texRate(h,10,'t')}}$. Find the instantaneous growth rate of output per worker $Y/L$.`,`產量與勞動分別為 $Y=${A}e^{${texRate(g,10,'t')}}$、$L=${B}e^{${texRate(h,10,'t')}}$。求每位勞工產量 $Y/L$ 的瞬時成長率。`),
 fields:[field('rate','number','Per-worker growth rate =','每位勞工產量成長率 =',frac(g-h,10))],misconceptions:[error('rate',`${g+h}/10`,'A quotient has growth rate equal to numerator growth minus denominator growth.','商的成長率為分子成長率減去分母成長率。')],
 hints:[both('Write $\\ln(Y/L)=\\ln Y-\\ln L$.','寫成 $\\ln(Y/L)=\\ln Y-\\ln L$。'),both('Subtract labor growth from output growth.','以產量成長率減去勞動成長率。')],
 solution:[both(`$d\\ln Y/dt=${frac(g,10,true)}$ and $d\\ln L/dt=${frac(h,10,true)}$.`,`$d\\ln Y/dt=${frac(g,10,true)}$，$d\\ln L/dt=${frac(h,10,true)}$。`),both(`Therefore $d\\ln(Y/L)/dt=(${g}-${h})/10=${frac(g-h,10,true)}$.`,`因此 $d\\ln(Y/L)/dt=(${g}-${h})/10=${frac(g-h,10,true)}$。`)]};
}
function elasticity(rng,level){
 const a=rng.int(30,50),b=rng.int(1,4),p=rng.int(2,5),q=a-b*p;
 if(level===2){const n=rng.int(1,4),A=rng.int(2,8);
 return {id:'exp-log/elasticity',level,vars:[],domain:{},prompt:both(`For $x>0$, $y=${A}x^{-${n}}$. Find the signed point elasticity $d\\ln y/d\\ln x$.`,`對 $x>0$，$y=${A}x^{-${n}}$。求帶符號的點彈性 $d\\ln y/d\\ln x$。`),fields:[field('eps','number','Signed elasticity =','帶符號彈性 =',-n)],misconceptions:[error('eps',n,'The signed elasticity is negative for this decreasing function.','函數遞減，帶符號彈性為負。')],hints:[both('Take the log of both sides.','兩邊取對數。'),both('Differentiate $\\ln y=\\ln A-n\\ln x$ with respect to $\\ln x$.','將 $\\ln y=\\ln A-n\\ln x$ 對 $\\ln x$ 微分。')],solution:[both(`$\\ln y=\\ln ${A}-${texProduct(n, '\\ln x')}$.`,`$\\ln y=\\ln ${A}-${texProduct(n, '\\ln x')}$。`),both(`Thus $d\\ln y/d\\ln x=-${n}$ at every positive $x$.`,`故對所有正的 $x$，$d\\ln y/d\\ln x=-${n}$。`)]};}
 return {id:'exp-log/elasticity',level,vars:[],domain:{},prompt:both(`Demand is $Q(P)=${a}-${term(b,'P')}$. At $P=${p}$, where $Q=${q}>0$, find the signed price elasticity $d\\ln Q/d\\ln P$.`,`需求為 $Q(P)=${a}-${term(b,'P')}$。在 $P=${p}$ 且 $Q=${q}>0$ 時，求帶符號的價格彈性 $d\\ln Q/d\\ln P$。`),fields:[field('eps','number','Signed elasticity =','帶符號彈性 =',frac(-b*p,q))],misconceptions:[error('eps',frac(b*p,q),'The demand slope is negative; retain its sign before taking any absolute value.','需求斜率為負；除非另要求絕對值，否則應保留負號。')],hints:[both('Point elasticity is slope times input divided by output.','點彈性等於斜率乘自變數再除以應變數。'),both('Use $(dQ/dP)(P/Q)$ at the stated point.','在指定點計算 $(dQ/dP)(P/Q)$。')],solution:[both(`$dQ/dP=-${b}$ and $Q(${p})=${q}$.`,`$dQ/dP=-${b}$，且 $Q(${p})=${q}$。`),both(`Hence $d\\ln Q/d\\ln P=(-${b})(${frac(p,q,true)})=${frac(-b*p,q,true)}$.`,`所以 $d\\ln Q/d\\ln P=(-${b})(${frac(p,q,true)})=${frac(-b*p,q,true)}$。`)]};
}
export const expLogGenerators=[
{id:'log-rules',title:both('Logarithm rules','對數法則'),levels:[1,2],generate:logRules},
{id:'compound',title:both('Compounding','複利計算'),levels:[1,2],generate:compound},
{id:'diff-exp',title:both('Exponential derivatives','指數函數微分'),levels:[1,2],generate:diffExp},
{id:'diff-log',title:both('Logarithmic derivatives','對數函數微分'),levels:[1,2],generate:diffLog},
{id:'growth-rate',title:both('Instantaneous growth','瞬時成長率'),levels:[2,3],generate:growthRate},
{id:'elasticity',title:both('Point elasticity','點彈性'),levels:[2,3],generate:elasticity}
];
