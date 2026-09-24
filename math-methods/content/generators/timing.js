import { texProduct } from './format.js';
const both=(en,zh)=>({en,zh});
const number=(key,en,zh,answer)=>({key,type:'number',label:both(en,zh),answer:String(answer)});
const choice=(key,en,zh,answer)=>({key,type:'choice',label:both(en,zh),answer,options:[{value:'negative',label:both('Negative (maximum)','負（極大值）')},{value:'positive',label:both('Positive (minimum)','正（極小值）')} ]});
const error=(key,answer,en,zh)=>({key,answer:String(answer),feedback:both(en,zh)});
function wineStorage(rng,level){
 const u=rng.int(2,5),A=rng.int(2,8)*100,r=level===2?10:5,k=2*u/r,t=u*u;
 return {id:'timing/wine-storage',level,vars:[],domain:{},
 prompt:both(`A dealer already owns wine worth $V(t)=${texProduct(A, `e^{${texProduct(k, '\\sqrt t')}}`)}$ after $t\\ge0$ years. With zero storage cost and continuous discount rate $r=${(1/r).toFixed(1)}$, choose the sale time maximizing $A(t)=V(t)e^{-rt}$.${level===3?' Also give the sign of the second derivative of $\\ln A$ at the interior solution.':''}`,`酒商已持有葡萄酒，$t\\ge0$ 年後的市值為 $V(t)=${texProduct(A, `e^{${texProduct(k, '\\sqrt t')}}`)}$。不計保管成本，連續折現率 $r=${(1/r).toFixed(1)}$。求使現值 $A(t)=V(t)e^{-rt}$ 極大的出售時點。${level===3?'另判斷內部解處 $\\ln A$ 二階導數的符號。':''}`),
 fields:[number('t','Optimal years =','最適年數 =',t),...(level===3?[choice('soc','Second derivative sign =','二階導數符號 =','negative')]:[])],
 misconceptions:[error('t',u,'The first-order condition determines $\\sqrt t$; square it to obtain years.','一階條件先求出 $\\sqrt t$；求年數還須平方。')],
 hints:[both('Compare all sale dates using present value, not future wine value alone.','以現值比較各出售時點，不能只看未來酒價。'),both('Differentiate $\\ln A=\\ln V-rt$ and set the wine-value growth rate equal to $r$.','對 $\\ln A=\\ln V-rt$ 微分，令酒價成長率等於 $r$。')],
 solution:[both(`$\\ln A=\\ln ${A}+${texProduct(k, '\\sqrt t')}-t/${r}$, so $d\\ln A/dt=${k}/(2\\sqrt t)-${(1/r).toFixed(1)}$.`,`$\\ln A=\\ln ${A}+${texProduct(k, '\\sqrt t')}-t/${r}$，故 $d\\ln A/dt=${k}/(2\\sqrt t)-${(1/r).toFixed(1)}$。`),both(`Setting this to zero gives $\\sqrt t=${u}$ and $t^*=${t}$. The second derivative is $-${k}/(4t^{3/2})<0$ for $t>0$, so this is the maximum; the derivative is positive before and negative after.`,`令其為零得 $\\sqrt t=${u}$、$t^*=${t}$。對 $t>0$，二階導數為 $-${k}/(4t^{3/2})<0$，且一階導數由正轉負，故為極大值。`)]};
}
function timber(rng,level){
 const u=rng.int(2,5),base=rng.int(2,5),A=rng.int(2,6)*100,t=u*u;
 return {id:'timing/timber',level,vars:[],domain:{},
 prompt:both(`Already planted timber has harvest value $V(t)=${texProduct(A, `${base}^{\\sqrt t}`)}$ for $t\\ge0$. Planting cost is sunk and upkeep is zero. At continuous discount rate $r=\\ln(${base})/${2*u}$, find the harvest time maximizing present value $A(t)=V(t)e^{-rt}$ and classify the interior stationary point.`,`已種植的林木於 $t\\ge0$ 時採伐，價值為 $V(t)=${texProduct(A, `${base}^{\\sqrt t}`)}$。種植成本為沉沒成本且不計維護費。連續折現率 $r=\\ln(${base})/${2*u}$。求使現值 $A(t)=V(t)e^{-rt}$ 極大的採伐時點，並判別內部駐點。`),
 fields:[number('t','Optimal years =','最適年數 =',t),choice('soc','Second derivative sign =','二階導數符號 =','negative')],
 misconceptions:[error('t',u,'The growth condition solves for $\\sqrt t$; the harvest time is its square.','成長率條件解出的是 $\\sqrt t$；採伐時點須平方。')],
 hints:[both('Rewrite $b^{\\sqrt t}=e^{(\\ln b)\\sqrt t}$.','將 $b^{\\sqrt t}$ 改寫為 $e^{(\\ln b)\\sqrt t}$。'),both('Set $(\\ln b)/(2\\sqrt t)=r$ and check declining growth.','令 $(\\ln b)/(2\\sqrt t)=r$，並檢查成長率是否遞減。')],
 solution:[both(`$\\ln A=\\ln ${A}+(\\ln ${base})\\sqrt t-[\\ln(${base})/${2*u}]t$.`,`$\\ln A=\\ln ${A}+(\\ln ${base})\\sqrt t-[\\ln(${base})/${2*u}]t$。`),both(`$d\\ln A/dt=(\\ln ${base})/(2\\sqrt t)-r=0$ implies $\\sqrt t=${u}$, hence $t^*=${t}$. Since $d^2\\ln A/dt^2=-(\\ln ${base})/(4t^{3/2})<0$, present value peaks there.`,`由 $d\\ln A/dt=(\\ln ${base})/(2\\sqrt t)-r=0$ 得 $\\sqrt t=${u}$，故 $t^*=${t}$。因 $d^2\\ln A/dt^2=-(\\ln ${base})/(4t^{3/2})<0$，此處現值達極大。`)]};
}
export const timingGenerators=[
{id:'wine-storage',title:both('Wine storage','葡萄酒儲存時點'),levels:[2,3],generate:wineStorage},
{id:'timber',title:both('Timber harvest','林木採伐時點'),levels:[3],generate:timber}
];
