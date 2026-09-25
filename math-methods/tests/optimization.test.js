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
    const H=p.prompt.en.match(/H=\\begin\{pmatrix\}(-?\d+)&(-?\d+)&0\\\\(-?\d+)&(-?\d+)&0\\\\0&0&(-?\d+)\\end\{pmatrix\}/);
    assert.ok(H);const [,a,b,b2,d,e]=H.map(Number);near(b,b2,'symmetric H');
    near(value(p,'d1'),a,'D1');near(value(p,'d2'),a*d-b*b,'D2');near(value(p,'d3'),(a*d-b*b)*e,'D3');
    assert.equal(p.fields.find(f=>f.key==='kind').answer,a<0&&a*d-b*b>0&&(a*d-b*b)*e<0?'max':'min');
  }
});

function border(gx,gy,hxx,hxy,hyy){return 2*gx*gy*hxy-gy*gy*hxx-gx*gx*hyy;}
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
    const x=value(u,'x'),y=value(u,'y'),lambda=value(u,'lambda'),a=u.prompt.en.includes('x^{2}')?2:1,b=1,px=a,py=1;
    const B=Number(u.prompt.en.match(/g\(x,y\)=.*=(\d+)/)[1]);
    near(px*x+py*y,B,'budget');near(a*x**(a-1)*y/px,lambda,'MU per price x');near(x**a/py,lambda,'MU per price y');
    const det=border(px,py,a*(a-1)*x**(a-2)*y,a*x**(a-1),0);
    assert.ok(x>0&&y>0&&lambda>0&&det>0);near(value(u,'det'),det,'utility border');
    const c=generator('lagrange','cost-min').generate(createRng(seed),2);
    const L=value(c,'L'),K=value(c,'K'),mu=value(c,'lambda');
    const Q=Number(c.prompt.en.match(/Q_0=(\d+)/)[1]),w=Number(c.prompt.en.match(/w=(\d+)/)[1]),r=Number(c.prompt.en.match(/r=(\d+)/)[1]);
    near(L*K,Q,'output');near(w,mu*K,'labor FOC');near(r,mu*L,'capital FOC');
    assert.ok(L>0&&K>0&&mu>0);near(value(c,'det'),border(K,L,0,-mu,0),'cost border');assert.ok(value(c,'det')<0);
    for(const level of [2,3]){
      const bh=generator('lagrange','bordered-hessian').generate(createRng(seed),level);
      const m=bh.solution[0].en.match(/pmatrix\}0&(-?\d+)&(-?\d+)\\\\(-?\d+)&(-?\d+)&0\\\\(-?\d+)&0&(-?\d+)\\end/);
      assert.ok(m);const [,gx,gy,gx2,hxx,gy2,hyy]=m.map(Number);near(gx,gx2,'border symmetry x');near(gy,gy2,'border symmetry y');
      const D=border(gx,gy,hxx,0,hyy);near(value(bh,'det'),D,'border determinant');assert.equal(bh.fields.find(f=>f.key==='kind').answer,D>0?'max':'min');
    }
    const sp=generator('lagrange','shadow-price').generate(createRng(seed),3);
    const Bsp=Number(sp.prompt.en.match(/B=(\d+)/)[1]),delta=Number(sp.prompt.en.match(/\\Delta B=(\d+)/)[1]),lambdaSp=Number(sp.prompt.en.match(/\\lambda\^\*=(\d+)/)[1]);
    near(value(sp,'approx'),lambdaSp*delta,'first-order shadow');near(value(sp,'exact'),(Bsp+delta)**2/4-Bsp**2/4,'exact re-solve');assert.ok(value(sp,'exact')>value(sp,'approx'));
  }
});
