import test from 'node:test';
import assert from 'node:assert/strict';
import { modules } from '../content/modules.js';
import { createRng } from '../assets/js/rng.js';
import { loadMathJs } from './load-mathjs.js';

const math=loadMathJs();
const generator=(module,id)=>modules.find(m=>m.id===module).generators.find(g=>g.id===id);
const value=(problem,key)=>Number(problem.fields.find(f=>f.key===key).answer);
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-8,`${label}: ${a} versus ${b}`);
function hessian(expression,x,y){
  const fx=math.derivative(expression,'x'),fy=math.derivative(expression,'y');
  const scope={x,y},xx=math.derivative(fx,'x').evaluate(scope),xy=math.derivative(fx,'y').evaluate(scope),yy=math.derivative(fy,'y').evaluate(scope);
  return {fx:fx.evaluate(scope),fy:fy.evaluate(scope),xx,xy,yy,det:xx*yy-xy*xy};
}
const shown=(problem,name)=>problem.prompt.en.match(new RegExp(`${name}\\(x,y\\)=([^$]+)`))?.[1];

test('multivariable stationary points and Hessian signs agree with displayed objectives',()=>{
  for(let seed=0;seed<100;seed++){
    for(const level of [1,2]){
      const p=generator('opt-multi','foc-2var').generate(createRng(seed),level);
      const H=hessian(shown(p,'f'),value(p,'x'),value(p,'y'));
      near(H.fx,0,'foc x');near(H.fy,0,'foc y');assert.ok(H.det>0);
      if(level===2) assert.equal(p.fields.find(f=>f.key==='kind').answer,H.xx<0?'max':'min');
    }
    const p=generator('opt-multi','hessian').generate(createRng(seed),2),H=hessian(shown(p,'f'),1,1);
    for(const [key,n] of [['xx',H.xx],['xy',H.xy],['yy',H.yy],['det',H.det]]) near(value(p,key),n,`Hessian ${key}`);
    const q=generator('opt-multi','classify-2var').generate(createRng(seed),2);
    const f=shown(q,'f'),mx=f.match(/\(x-(-?\d+)\)/),my=f.match(/\(y-(-?\d+)\)/);
    const C=hessian(f,Number(mx[1]),Number(my[1]));near(C.fx,0,'classify fx');near(C.fy,0,'classify fy');
    const kind=C.det<0?'saddle':C.det===0?'inconclusive':C.xx<0?'max':'min';
    assert.equal(q.fields[0].answer,kind);
  }
});

test('economic two-output examples satisfy FOCs, positive choices and negative definite profit Hessians',()=>{
  for(let seed=0;seed<100;seed++){
    const p=generator('opt-multi','multiproduct-firm').generate(createRng(seed),3);
    const q1=value(p,'q1'),q2=value(p,'q2'),p1=Number(p.prompt.en.match(/p_1=(\d+)/)[1]),p2=Number(p.prompt.en.match(/p_2=(\d+)/)[1]);
    const C=p.prompt.en.match(/C=([^$]+)/)[1].replaceAll('Q_1','x').replaceAll('Q_2','y');
    const H=hessian(`${p1}x+${p2}y-(${C})`,q1,q2);
    assert.ok(q1>0&&q2>0);near(H.fx,0,'firm foc1');near(H.fy,0,'firm foc2');assert.ok(H.xx<0&&H.det>0);near(value(p,'det'),H.det,'firm determinant');
    const d=generator('opt-multi','price-discrimination').generate(createRng(seed),3);
    const x=value(d,'q1'),y=value(d,'q2');
    const [A1,b1]=d.prompt.en.match(/P_1=(\d+)-(\d*)Q_1/).slice(1).map(v=>Number(v||1));
    const [A2,b2]=d.prompt.en.match(/P_2=(\d+)-(\d*)Q_2/).slice(1).map(v=>Number(v||1));
    const c=Number(d.prompt.en.match(/C=(\d+)\(Q_1\+Q_2\)/)[1]);
    const K=hessian(`${A1}x-${b1}x^2+${A2}y-${b2}y^2-${c}(x+y)-(x+y)^2`,x,y);
    assert.ok(x>0&&y>0&&A1-b1*x>0&&A2-b2*y>0);
    near(K.fx,0,'markets foc1');near(K.fy,0,'markets foc2');assert.ok(K.xx<0&&K.det>0);near(value(d,'det'),K.det,'markets determinant');near(value(d,'mc'),c+2*(x+y),'common MC');
  }
});

test('three-variable leading principal minors have the claimed definite sign pattern',()=>{
  for(let seed=0;seed<100;seed++){
    const p=generator('opt-multi','three-var').generate(createRng(seed),3);
    const text=p.prompt.en.match(/H=\\begin\{pmatrix\}([^$]+)\\end\{pmatrix\}/)?.[1];
    assert.ok(text);
    const H=text.split('\\\\').map(row=>row.split('&').map(Number));
    assert.equal(H.length,3);assert.ok(H.every(row=>row.length===3));
    assert.ok(H[0][1]!==0&&H[0][2]!==0&&H[1][2]!==0,'L3 has three nonzero cross-partials');
    near(H[0][1],H[1][0],'xy symmetry');near(H[0][2],H[2][0],'xz symmetry');near(H[1][2],H[2][1],'yz symmetry');
    const [[a,b,c],[,d,e],[,,f]]=H;
    const D2=a*d-b*b,D3=a*(d*f-e*e)-b*(b*f-e*c)+c*(b*e-d*c);
    near(value(p,'d1'),a,'D1');near(value(p,'d2'),D2,'D2');near(value(p,'d3'),D3,'D3');
    assert.equal(p.fields.find(f=>f.key==='kind').answer,a<0&&D2>0&&D3<0?'max':'min');
  }
});

function border(gx,gy,hxx,hxy,hyy){return 2*gx*gy*hxy-gy*gy*hxx-gx*gx*hyy;}
test('Gate 3b bordered examples have nonzero multipliers and L3 cross-partials',()=>{
  const gen=generator('lagrange','bordered-hessian');
  for(const level of gen.levels)for(let seed=0;seed<300;seed++){
    const problem=gen.generate(createRng(seed),level);
    const multiplier=Number(problem.solution[0].en.match(/\\lambda\^\*=(\d+)/)?.[1]);
    assert.ok(Number.isFinite(multiplier)&&multiplier!==0,`L${level} seed ${seed}`);
    if(level===3){
      const matrix=problem.solution[0].en.match(/\\bar H=\\begin\{pmatrix\}([^$]+)\\end\{pmatrix\}/)?.[1];
      assert.ok(matrix,`L3 seed ${seed} matrix`);
      const rows=matrix.split('\\\\').map(row=>row.split('&').map(Number));
      assert.notEqual(rows[1][2],0,`L3 seed ${seed} cross-partial`);
    }
  }
});
test('constrained examples meet feasibility, FOCs, multiplier signs and bordered-Hessian rules',()=>{
  for(let seed=0;seed<100;seed++){
    for(const level of [1,2]){
      const p=generator('lagrange','solve-linear').generate(createRng(seed),level);
      const x=value(p,'x'),y=value(p,'y'),lambda=value(p,'lambda');
      const [,a,b,c]=p.prompt.en.match(/x-(\d+)\)\^2-\(y-(\d+)\)\^2.*x\+y=(\d+)/).map(Number);
      near(x+y,c,'linear feasibility');near(-2*(x-a),lambda,'linear x FOC');near(-2*(y-b),lambda,'linear y FOC');
      assert.ok(x>0&&y>0&&lambda>0&&border(1,1,-2,0,-2)>0);
      if(level===2)near(value(p,'det'),border(1,1,-2,0,-2),'linear border');
    }
    const u=generator('lagrange','cobb-douglas').generate(createRng(seed),2);
    const x=value(u,'x'),y=value(u,'y'),lambda=value(u,'lambda');
    const utility=u.prompt.en.match(/U\(x,y\)=([^$]+)/)[1];
    const a=Number(utility.match(/x\^\{(\d+)\}/)?.[1]||1),b=Number(utility.match(/y\^\{(\d+)\}/)?.[1]||1);
    const budget=u.prompt.en.match(/g\(x,y\)=(\d*)x\+(\d*)y=(\d+)/),px=Number(budget[1]||1),py=Number(budget[2]||1),B=Number(budget[3]);
    near(px*x+py*y,B,'budget');near(a*x**(a-1)*y**b/px,lambda,'MU per price x');near(b*x**a*y**(b-1)/py,lambda,'MU per price y');
    const det=border(px,py,a*(a-1)*x**(a-2)*y**b,a*b*x**(a-1)*y**(b-1),b*(b-1)*x**a*y**(b-2));
    assert.ok(x>0&&y>0&&lambda>0&&det>0);near(value(u,'det'),det,'utility border');
    for(const level of [2,3]){
      const c=generator('lagrange','cost-min').generate(createRng(seed),level);
      const L=value(c,'L'),K=value(c,'K'),mu=value(c,'lambda');
      const Q=Number(c.prompt.en.match(/Q_0=(\d+)/)[1]),w=Number(c.prompt.en.match(/w=(\d+)/)[1]),r=Number(c.prompt.en.match(/r=(\d+)/)[1]);
      const shownG=c.prompt.en.match(/g\(L,K\)=([^$]+)/)[1];
      const g=shownG.replace(/L\^2K/, 'L^2*K').replace(/LK/, 'L*K');
      const scope={L,K},gx=math.derivative(g,'L').evaluate(scope),gy=math.derivative(g,'K').evaluate(scope);
      const gxx=math.derivative(math.derivative(g,'L'),'L').evaluate(scope),gxy=math.derivative(math.derivative(g,'L'),'K').evaluate(scope),gyy=math.derivative(math.derivative(g,'K'),'K').evaluate(scope);
      near(math.evaluate(g,scope),Q,'output');near(w,mu*gx,'labor FOC');near(r,mu*gy,'capital FOC');
      assert.ok(L>0&&K>0&&mu>0);near(value(c,'det'),border(gx,gy,-mu*gxx,-mu*gxy,-mu*gyy),'cost border');assert.ok(value(c,'det')<0);
      if(level===3)assert.match(shownG,/L\^2K/,'L3 uses a nonconstant-returns technology');
    }
    for(const level of [2,3]){
      const bh=generator('lagrange','bordered-hessian').generate(createRng(seed),level);
      const f=bh.prompt.en.match(/f\(x,y\)=([^$]+)/)[1];
      const m=bh.prompt.en.match(/g\(x,y\)=(\d*)x\+(\d*)y=(\d+)/);
      const gx=Number(m[1]||1),gy=Number(m[2]||1),constraint=Number(m[3]);
      const point=bh.prompt.en.match(/stationary point is \$\((\d+),(\d+)\)\$/),x=Number(point[1]),y=Number(point[2]);
      const lambda=Number(bh.solution[0].en.match(/\\lambda\^\*=(\d+)/)[1]);
      const H=hessian(f,x,y);
      near(gx*x+gy*y,constraint,'bordered feasibility');near(H.fx,lambda*gx,'bordered x FOC');near(H.fy,lambda*gy,'bordered y FOC');
      assert.notEqual(lambda,0,'multiplier is nonzero');
      const D=border(gx,gy,H.xx,H.xy,H.yy);near(value(bh,'det'),D,'border determinant');assert.equal(bh.fields.find(f=>f.key==='kind').answer,D>0?'max':'min');
      if(level===3){assert.notEqual(H.xy,0,'L3 cross partial');near(value(bh,'lambda'),lambda,'L3 multiplier field');}
    }
    const sp=generator('lagrange','shadow-price').generate(createRng(seed),3);
    const Bsp=Number(sp.prompt.en.match(/B=(\d+)/)[1]),delta=Number(sp.prompt.en.match(/\\Delta B=(\d+)/)[1]),lambdaSp=Number(sp.prompt.en.match(/\\lambda\^\*=(\d+)/)[1]);
    const scale=Number(sp.prompt.en.match(/U\(x,y\)=(\d*)xy/)[1]||1);
    near(value(sp,'approx'),lambdaSp*delta,'first-order shadow');near(value(sp,'exact'),scale*((Bsp+delta)**2-Bsp**2)/4,'exact re-solve');assert.ok(value(sp,'exact')>value(sp,'approx'));
  }
});
