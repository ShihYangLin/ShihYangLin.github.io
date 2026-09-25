// Generate the static, bilingual lesson figures. Add future figures to `figures` only.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const lessons = join(dirname(fileURLToPath(import.meta.url)), '../content/lessons');
const check = process.argv.includes('--check');
if (process.argv.some(arg => arg.startsWith('--') && arg !== '--check')) throw new Error('Usage: node lesson-figures.mjs [--check]');
const n = value => Number(value.toFixed(2));
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const tr = (lang, en, zh) => esc(lang === 'zh' ? zh : en);
const line = (x1, y1, x2, y2, cls = 'fig-guide') => `<path class="${cls}" d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}"/>`;
const dot = (x, y, cls = 'fig-point', r = 4) => `<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${r}"/>`;
const label = (x, y, value, cls = 'fig-label', anchor = 'start') => `<text class="${cls}" x="${n(x)}" y="${n(y)}" text-anchor="${anchor}">${value}</text>`;
const labelBg = (x, y, width, height = 22) => `<rect class="fig-label-bg" x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${height}"/>`;
const arrow = (x1, y1, x2, y2) => {
  const angle = Math.atan2(y2-y1, x2-x1), wing = 8;
  const left = [x2-wing*Math.cos(angle-.55), y2-wing*Math.sin(angle-.55)];
  const right = [x2-wing*Math.cos(angle+.55), y2-wing*Math.sin(angle+.55)];
  return `<path class="fig-arrow" d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)} M${n(left[0])} ${n(left[1])}L${n(x2)} ${n(y2)}L${n(right[0])} ${n(right[1])}"/>`;
};
const axes = (b, xLabel, yLabel, x0 = b.left, y0 = b.bottom) =>
  `<path class="fig-axis" d="M${b.left} ${n(y0)}H${b.right} M${n(x0)} ${b.top}V${b.bottom}"/>${label(b.right, b.bottom + 24, xLabel, 'fig-label', 'end')}${label(Math.max(10, b.left - 35), b.top - 10, yLabel)}`;
const scale = (domain, box) => ({
  x: x => box.left + (x - domain.x0) * (box.right - box.left) / (domain.x1 - domain.x0),
  y: y => box.bottom - (y - domain.y0) * (box.bottom - box.top) / (domain.y1 - domain.y0)
});
function assertLabelBoxes(id, height, body) {
  const labels = [...body.matchAll(/<text class="([^"]+)" x="([^"]+)" y="([^"]+)" text-anchor="([^"]+)">([^<]*)<\/text>/g)].map(match => {
    const [, cls, xs, ys, anchor, encoded] = match;
    const value = encoded.replace(/&(?:lt|gt|amp|quot|#39);/g, entity => ({ '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'" })[entity]);
    const size = cls === 'fig-sign' ? 22 : 18;
    const width = [...value].reduce((sum, ch) => sum + (/\p{Script=Han}/u.test(ch) ? size : ch === ' ' ? size*.35 : size*.6), 0);
    const x = Number(xs), y = Number(ys), left = anchor === 'end' ? x-width : anchor === 'middle' ? x-width/2 : x;
    return { value, left, right: left+width, top: y-size, bottom: y+size*.3 };
  }).filter(item => item.value);
  for (const item of labels) {
    assert(item.left >= -1 && item.right <= 561 && item.top >= -1 && item.bottom <= height+1, `${id}: label outside SVG: ${item.value}`);
  }
  for (let i=0; i<labels.length; i++) for (let j=i+1; j<labels.length; j++) {
    const a = labels[i], b = labels[j];
    const overlapX = Math.min(a.right,b.right)-Math.max(a.left,b.left);
    const overlapY = Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    assert(overlapX <= 3 || overlapY <= 3, `${id}: labels overlap: ${a.value} / ${b.value}`);
  }
  // Approximate glyph bounds and sample each plotted segment; label backgrounds intentionally
  // knock out contours in the two places where annotation inside a contour is necessary.
  const knockouts = [...body.matchAll(/<rect class="fig-label-bg" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"\/>/g)]
    .map(match => ({ left: +match[1], top: +match[2], right: +match[1]+ +match[3], bottom: +match[2]+ +match[4] }));
  const protectedLabels = labels.filter(a => !knockouts.some(k => a.left >= k.left && a.right <= k.right+2 && a.top >= k.top-4 && a.bottom <= k.bottom+5));
  for (const match of body.matchAll(/<path class="(fig-(?:axis|curve(?:-2|-3)?|contour(?:-2|-positive)?|budget|isocost(?:-other)?|secant-(?:far|mid|near)|tangent))" d="([^"]+)"\/>/g)) {
    const [, cls, data] = match;
    const tokens = data.match(/[MLHV]|-?\d+(?:\.\d+)?/g) || [];
    let x=0, y=0;
    for (let i=0; i<tokens.length;) {
      const cmd=tokens[i++], px=x, py=y;
      if (cmd === 'M' || cmd === 'L') { x=+tokens[i++]; y=+tokens[i++]; }
      else if (cmd === 'H') x=+tokens[i++];
      else if (cmd === 'V') y=+tokens[i++];
      else throw new Error(`${id}: unsupported path command ${cmd} in ${cls}: ${data.slice(0,120)}`);
      if (cmd === 'M') continue;
      const steps=Math.max(1,Math.ceil(Math.hypot(x-px,y-py)/3));
      for (let k=0; k<=steps; k++) {
        const sx=px+(x-px)*k/steps, sy=py+(y-py)*k/steps;
        for (const a of protectedLabels) {
          const top=a.top+2, bottom=a.bottom-2;
          assert(!(sx>a.left+2 && sx<a.right-2 && sy>top && sy<bottom), `${id}: ${cls} crosses label ${a.value} at (${n(sx)}, ${n(sy)})`);
        }
      }
    }
  }
}
function curve(fn, x0, x1, s, cls = 'fig-curve', steps = 100, valid = () => true) {
  let open = false;
  const parts = [];
  for (let i = 0; i <= steps; i++) {
    const x = x0 + (x1 - x0) * i / steps, y = fn(x);
    const px = s.x(x), py = s.y(y);
    if (!Number.isFinite(y) || !Number.isFinite(px) || !Number.isFinite(py) || !valid(x, y)) { open = false; continue; }
    parts.push(`${open ? 'L' : 'M'}${n(px)} ${n(py)}`);
    open = true;
  }
  return `<path class="${cls}" d="${parts.join(' ')}"/>`;
}
function figure(id, height, lang, title, desc, body, caption, options = {}) {
  assertLabelBoxes(id, height, body);
  const svg = `<svg viewBox="0 0 560 ${height}" role="img" aria-labelledby="${id}-title ${id}-desc"${options.scale ? ` data-scale="${esc(JSON.stringify(options.scale))}"` : ''}><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(desc)}</desc>${body}</svg>`;
  assert(!svg.includes('$'), `${id}: dollar sign in SVG`);
  return `<figure class="lesson-figure" id="${id}"${options.interactive ? ` data-interactive="${options.interactive}"` : ''}>\n    ${svg}\n    <figcaption>${caption}</figcaption>\n  </figure>`;
}
const close = (actual, expected) => assert(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

const figures = [
  {
    id: 'deriv-basics-fig-secant', module: 'deriv-basics', idea: 'deriv-basics-definition',
    render(lang) {
      const f = x => x*x;
      close(f(1), 1); close(f(2), 4); close(2*1, 2);
      for (const h of [2, 1, .5, -1, -2]) close((f(1+h)-f(1))/h, 2+h);
      const domain = { x0: -1.5, x1: 3.5, y0: -.5, y1: 10 };
      const b = { left: 48, right: 437, top: 42, bottom: 262 }, s = scale(domain, b);
      let body = axes(b, 'x', 'y', s.x(0), s.y(0));
      body += `<defs><clipPath id="deriv-basics-fig-secant-clip"><rect x="${b.left}" y="${b.top}" width="${b.right-b.left}" height="${b.bottom-b.top}"/></clipPath></defs>`;
      const A = [s.x(1), s.y(f(1))];
      const tangent = x => f(1) + 2*(x-1);
      const secant = x => f(1) + 3*(x-1);
      body += `<g clip-path="url(#deriv-basics-fig-secant-clip)">${curve(f, domain.x0, domain.x1, s)}`;
      body += line(s.x(domain.x0), s.y(tangent(domain.x0)), s.x(domain.x1), s.y(tangent(domain.x1)), 'fig-tangent');
      body += `<path class="fig-secant-active" d="M${n(s.x(domain.x0))} ${n(s.y(secant(domain.x0)))}L${n(s.x(domain.x1))} ${n(s.y(secant(domain.x1)))}"/></g>`;
      body += dot(...A) + label(A[0]-10, A[1]-12, 'A', 'fig-label', 'end');
      body += `<circle class="fig-open-point fig-secant-b" cx="${n(s.x(2))}" cy="${n(s.y(f(2)))}" r="4"/>`;
      body += `<text class="fig-label fig-secant-b-label" x="${n(s.x(2)+12)}" y="${n(s.y(f(2))-40)}" text-anchor="start">B</text>`;
      body += label(445, 135, tr(lang, 'tangent', '切線'));
      return figure(this.id, 301, lang, tr(lang, 'A secant approaches the tangent to a parabola', '割線趨近拋物線的切線'), tr(lang, 'For f(x)=x², A=(1,1) and h=1 place B at (2,4). The secant slope is 3 and the tangent slope at A is 2.', '對 f(x)=x²，A=(1,1) 且 h=1 時，B=(2,4)。割線斜率為 3，A 點切線斜率為 2。'), body, lang === 'zh' ? '$f(x)=x^2$、$x=1$。拖動 $h$ 或按「播放」：$h$ 越接近 0，割線斜率 $\\frac{f(1+h)-f(1)}{h}=2+h$ 越接近切線斜率 $f\'(1)=2$；$h&lt;0$ 時從左側逼近。' : 'For $f(x)=x^2$ at $x=1$, drag $h$ or press Play: as $h$ approaches 0, the secant slope $\\frac{f(1+h)-f(1)}{h}=2+h$ approaches the tangent slope $f\'(1)=2$; $h&lt;0$ approaches from the left.', { interactive: 'secant', scale: { ...domain, ...b } });
    }
  },
  {
    id: 'opt-one-fig-sign', module: 'opt-one', idea: 'opt-one-sign',
    render(lang) {
      const f = x => 2*x**3 - 3*x*x - 12*x + 5, fp = x => 6*(x+1)*(x-2);
      close(f(-1), 12); close(f(2), -15); close(fp(-1), 0); close(fp(2), 0);
      const top = { left: 50, right: 518, top: 42, bottom: 215 }, bot = { left: 50, right: 518, top: 282, bottom: 424 };
      const a = scale({ x0: -2.5, x1: 3.5, y0: -38, y1: 35 }, top), b = scale({ x0: -2.5, x1: 3.5, y0: -15, y1: 45 }, bot);
      let body = axes(top, '', 'f(x)', a.x(0), a.y(0)) + axes(bot, 'x', "f′(x)", b.x(0), b.y(0));
      for (const x of [-1, 2]) body += line(a.x(x), top.top, a.x(x), bot.bottom, 'fig-guide');
      body += curve(f, -2.5, 3.5, a) + curve(fp, -2.5, 3.5, b, 'fig-curve-2');
      body += dot(a.x(-1), a.y(12)) + dot(a.x(2), a.y(-15));
      body += dot(b.x(-1), b.y(0)) + dot(b.x(2), b.y(0));
      // Two-line labels sit beside the guides so no text crosses a dashed line.
      body += label(a.x(-1)-8, 58, tr(lang, 'local max', '局部極大'), 'fig-label', 'end') + label(a.x(-1)-8, 80, '(−1, 12)', 'fig-label', 'end');
      body += label(a.x(2)+10, 190, tr(lang, 'local min', '局部極小')) + label(a.x(2)+10, 212, '(2, −15)');
      for (const [x, sign] of [[-1.8, '+'], [0.5, '−'], [2.7, '+']]) body += label(b.x(x), bot.top+31, sign, 'fig-sign', 'middle');
      body += label(a.x(-1), 447, '−1', 'fig-label', 'middle') + label(a.x(2), 447, '2', 'fig-label', 'middle');
      return figure(this.id, 462, lang, tr(lang, 'Function and first derivative sign', '函數與一階導數符號'), tr(lang, 'The derivative changes from positive to negative at x=−1, a local maximum, and from negative to positive at x=2, a local minimum.', '導數在 x=−1 由正轉負，形成局部極大；在 x=2 由負轉正，形成局部極小。'), body, lang === 'zh' ? '上圖為 f；下圖的 +、−、+ 判定兩個平穩點。' : 'The +, −, + signs below classify the two stationary points above.');
    }
  },
  {
    id: 'opt-one-fig-profit', module: 'opt-one', idea: 'opt-one-profit',
    render(lang) {
      const profit = q => 26*q - 5*q*q - 2, mr = q => 31 - 4*q, mc = q => 6*q + 5;
      close(profit(2.6), 31.8); close(mr(2.6), 20.6); close(mc(2.6), 20.6);
      close(31-2*2.6, 25.8); close(-10, -10);
      const top = { left: 50, right: 518, top: 45, bottom: 214 }, bot = { left: 50, right: 518, top: 281, bottom: 423 };
      const a = scale({ x0: 0, x1: 5.2, y0: -5, y1: 37 }, top), b = scale({ x0: 0, x1: 5.2, y0: 0, y1: 37 }, bot);
      let body = axes(top, '', 'π(Q)', 50, a.y(0)) + axes(bot, 'Q', tr(lang, 'marginal', '邊際值'));
      body += line(a.x(2.6), top.top, a.x(2.6), bot.bottom, 'fig-guide');
      body += curve(profit, 0, 5.2, a) + curve(mr, 0, 5.2, b) + curve(mc, 0, 5.2, b, 'fig-curve-2');
      body += dot(a.x(2.6), a.y(31.8)) + dot(b.x(2.6), b.y(20.6));
      body += label(a.x(2.6)+12, a.y(31.8)-12, 'π*=31.8') + label(a.x(2.6), 449, 'Q*=2.6', 'fig-label', 'middle');
      body += label(b.x(.55), b.y(mr(.55))-11, 'MR') + label(b.x(4.25), b.y(mc(4.25))-12, 'MC');
      body += label(b.x(2.6)+55, b.y(20.6)+55, '(2.6, 20.6)');
      return figure(this.id, 465, lang, tr(lang, 'Profit peaks where marginal revenue meets marginal cost', '邊際收益等於邊際成本時利潤達高峰'), tr(lang, 'Profit peaks at Q=2.6 and 31.8. Marginal revenue and marginal cost cross at Q=2.6 and 20.6.', '利潤在 Q=2.6 達到 31.8；邊際收益與邊際成本在 Q=2.6、20.6 相交。'), body, lang === 'zh' ? 'MR=MC 對應上圖的利潤高峰。' : 'MR=MC aligns with the profit peak above.');
    }
  },
  {
    id: 'taylor-fig-approx', module: 'taylor', idea: 'taylor-quadratic',
    render(lang) {
      const f = x => 27/(x+2), p1 = x => 9-3*(x-1), p2 = x => p1(x)+(x-1)**2;
      close(f(1), 9); close(p1(1), 9); close(p2(1), 9);
      close(f(3), 5.4); close(p1(3), 3); close(p2(3), 7);
      const b = { left: 55, right: 390, top: 48, bottom: 290 }, s = scale({ x0: -.5, x1: 3.5, y0: 1, y1: 19 }, b);
      let body = axes(b, 'x', 'y') + curve(f, -.5, 3.5, s) + curve(p1, -.5, 3.5, s, 'fig-curve-2') + curve(p2, -.5, 3.5, s, 'fig-curve-3');
      body += dot(s.x(1), s.y(9));
      // Bracket sits on x=3 itself; the short label fits in the widening gap to its right.
      const bx = s.x(3), upper = s.y(p2(3)), lower = s.y(f(3));
      body += line(bx, upper, bx, lower, 'fig-bracket') + line(bx-5, upper, bx+5, upper, 'fig-bracket') + line(bx-5, lower, bx+5, lower, 'fig-bracket');
      body += label(bx+9, (upper+lower)/2+6, 'R₂');
      body += label(403, s.y(p2(3.5))+4, 'P₂') + label(403, s.y(f(3.5))+23, 'f');
      body += label(403, s.y(p1(3.5))+5, tr(lang, 'P₁ (tangent)', 'P₁（切線）'));
      body += label(s.x(3), 317, '3', 'fig-label', 'middle');
      body += line(s.x(1), b.bottom-5, s.x(1), b.bottom+5, 'fig-bracket') + label(s.x(1), 317, 'x₀=1', 'fig-label', 'middle');
      return figure(this.id, 337, lang, tr(lang, 'Linear and quadratic Taylor approximations', '一次與二次泰勒近似'), tr(lang, 'All curves meet at the center x₀=1, where f=9. At x=3, f=5.4, P₁=3, and P₂=7; their gap is remainder R₂.', '三條曲線在中心 x₀=1、f=9 相交。在 x=3，f=5.4、P₁=3、P₂=7；兩者之差為餘項 R₂。'), body, lang === 'zh' ? '三條曲線在中心 $x_0=1$ 重合；$x=3$ 時 $f=5.4$、$P_2=7$，兩者之差即餘項 $R_2$。' : 'All three curves agree at the center $x_0=1$; at $x=3$, $f=5.4$ and $P_2=7$, and their gap is the remainder $R_2$.');
    }
  },
  {
    id: 'timing-fig-rate', module: 'timing', idea: 'timing-foc',
    render(lang) {
      const A = t => 400*Math.exp(.8*Math.sqrt(t)-.1*t), growth = t => .4/Math.sqrt(t);
      close(growth(16), .1); close(A(16), 400*Math.exp(1.6));
      close(.4/.1, 4); close((.4/.1)**2, 16);
      const top = { left: 52, right: 518, top: 42, bottom: 220 }, bot = { left: 52, right: 518, top: 297, bottom: 438 };
      const a = scale({ x0: 0, x1: 40, y0: 300, y1: 2100 }, top), b = scale({ x0: 0, x1: 40, y0: 0, y1: .3 }, bot);
      let body = axes(top, '', 'A(t)') + axes(bot, 't', tr(lang, 'growth', '成長率'));
      body += `<path class="fig-region" d="M${bot.left} ${bot.top}H${n(b.x(16))}V${bot.bottom}H${bot.left}Z"/>`;
      body += line(a.x(16), top.top, a.x(16), bot.bottom, 'fig-guide');
      body += curve(A, 0, 40, a) + curve(growth, .5, 40, b, 'fig-curve', 160, (_, y) => y <= .3);
      body += line(bot.left, b.y(.1), bot.right, b.y(.1), 'fig-curve-2');
      body += dot(a.x(16), a.y(A(16))) + dot(b.x(16), b.y(.1));
      body += label(a.x(16)+10, a.y(A(16))-12, 't*=16') + label(b.x(16), 463, '16', 'fig-label', 'middle');
      body += label(bot.right-5, b.y(.1)-10, 'r=0.1', 'fig-label', 'end');
      body += label(77, 423, tr(lang, 'keep waiting', '繼續等待'));
      body += label(335, 326, tr(lang, 'sell already', '應已出售'));
      body += label(122, 320, 'V′/V') + label(122, 343, '= 0.4/√t');
      return figure(this.id, 478, lang, tr(lang, 'Optimal waiting time and growth rate', '最適等待時間與成長率'), tr(lang, 'Present value peaks at t=16 when value growth falls to interest rate 0.1. Before that, keep waiting; after it, sell already.', '現值在 t=16 達高峰，此時價值成長率降至利率 0.1。此前應繼續等待，此後應已出售。'), body, lang === 'zh' ? '當 V′/V=r=0.1 時，現值在 t*=16 達到高峰。' : 'Present value peaks at t*=16 where V′/V=r=0.1.');
    }
  },
  {
    id: 'opt-multi-fig-contours', module: 'opt-multi', idea: 'opt-multi-hessian',
    render(lang) {
      close(10-.5, 9.5); close(10-3, 7); close((-2)*(-4), 8); close(2*(-2), -4);
      const hfn = (x,y) => (x-2)**2-(y-4)**2;
      assert(hfn(3,4) > hfn(2,4) && hfn(2,5) < hfn(2,4));
      const left = { left: 47, right: 248, top: 58, bottom: 267 }, right = { left: 313, right: 514, top: 58, bottom: 267 };
      const sl = scale({ x0: 0, x1: 4, y0: 2, y1: 6 }, left), sr = scale({ x0: 0, x1: 4, y0: 2, y1: 6 }, right);
      let body = axes(left, 'x', 'y') + axes(right, 'x', 'y');
      body += label(148, 30, tr(lang, 'peak', '峰頂'), 'fig-panel-title', 'middle') + label(414, 30, tr(lang, 'saddle', '鞍點'), 'fig-panel-title', 'middle');
      for (const c of [.5, 1.5, 3, 5]) {
        // The c=5 contour is clipped by the panel domain; only in-domain arcs are emitted.
        const rad = Math.sqrt(c);
        body += curve(t => 4 + Math.sqrt(Math.max(0, c - (t-2)**2)/2), Math.max(0,2-rad), Math.min(4,2+rad), sl, 'fig-contour', 90, (x,y) => y <= 6 && y >= 2);
        body += curve(t => 4 - Math.sqrt(Math.max(0, c - (t-2)**2)/2), Math.max(0,2-rad), Math.min(4,2+rad), sl, 'fig-contour', 90, (x,y) => y <= 6 && y >= 2);
      }
      for (const h of [.5, 1.5, 3]) for (const sign of [-1,1]) {
        if (sign > 0) {
          const start = Math.sqrt(h);
          for (const xSide of [-1,1]) for (const ySide of [-1,1])
            body += curve(u => 4 + ySide*Math.sqrt(u*u-h), start, 2, { x: u => sr.x(2 + xSide*u), y: sr.y }, 'fig-contour-positive', 65, (_,y) => y>=2 && y<=6);
        } else {
          const start = Math.sqrt(h);
          for (const side of [-1,1]) body += curve(u => 4 + side*u, start, 2, { x: u => sr.x(2 + Math.sqrt(u*u-h)), y: sr.y }, 'fig-contour-2', 65, (_,y) => y>=2 && y<=6);
          for (const side of [-1,1]) body += curve(u => 4 + side*u, start, 2, { x: u => sr.x(2 - Math.sqrt(u*u-h)), y: sr.y }, 'fig-contour-2', 65, (_,y) => y>=2 && y<=6);
        }
      }
      body += line(sr.x(0), sr.y(2), sr.x(4), sr.y(6), 'fig-guide') + line(sr.x(0), sr.y(6), sr.x(4), sr.y(2), 'fig-guide');
      body += dot(sl.x(2), sl.y(4)) + dot(sr.x(2), sr.y(4));
      body += labelBg(153, 126, 64) + label(157, 145, '(2, 4)');
      body += label(45, 318, 'D₁=−2, D₂=8') + label(314, 318, 'D₂=|H|=−4');
      body += arrow(sr.x(2)+7, sr.y(4), sr.x(2)+47, sr.y(4));
      body += arrow(sr.x(2), sr.y(4)+8, sr.x(2), sr.y(4)+48);
      body += labelBg(425, 127, 90) + label(429, 145, tr(lang, 'h rises', 'h 上升'));
      body += labelBg(425, 202, 88) + label(429, 220, tr(lang, 'h falls', 'h 下降'));
      body += labelBg(470, 167, 65) + label(475, 185, 'h&gt;0');
      body += labelBg(383, 39, 65) + label(388, 58, 'h&lt;0');
      return figure(this.id, 337, lang, tr(lang, 'Elliptic peak contours and hyperbolic saddle contours', '橢圓峰頂與雙曲線鞍點的等高線'), tr(lang, 'Left: f=10−(x−2)²−2(y−4)² has negative D₁ and positive D₂ at its peak. Right: h=(x−2)²−(y−4)² is a saddle with negative D₂=|H|.', '左：f=10−(x−2)²−2(y−4)² 的 D₁ 為負、D₂ 為正，是峰頂。右：h=(x−2)²−(y−4)² 的 D₂=|H| 為負，是鞍點。'), body, lang === 'zh' ? '左：$f=10-(x-2)^2-2(y-4)^2$，$D_1&lt;0$、$D_2&gt;0$，為峰頂；右：$h=(x-2)^2-(y-4)^2$，$D_2=|H|&lt;0$，為鞍點。' : 'Left: $f=10-(x-2)^2-2(y-4)^2$ has $D_1&lt;0$, $D_2&gt;0$ and a peak; right: $h=(x-2)^2-(y-4)^2$ has $D_2=|H|&lt;0$ and a saddle.');
    }
  },
  {
    id: 'lagrange-fig-utility', module: 'lagrange', idea: 'lagrange-foc',
    render(lang) {
      close(3*6, 18); close(2*3+6, 12); close(-2/1, -2);
      for (const u of [8,18,32]) close(u/3*3, u);
      const b = { left: 52, right: 405, top: 40, bottom: 320 }, s = scale({ x0: 0, x1: 7, y0: 0, y1: 13 }, b);
      let body = axes(b, 'x', 'y');
      for (const [u, cls] of [[8,'fig-contour'],[18,'fig-curve'],[32,'fig-contour-2']]) {
        body += curve(x => u/x, Math.max(.25,u/13), 7, s, cls, 110, (_,y) => y <= 13);
      }
      body += line(s.x(0), s.y(12), s.x(6), s.y(0), 'fig-budget') + dot(s.x(3), s.y(6));
      body += labelBg(s.x(3)+11, s.y(6)-35, 180, 24) + label(s.x(3)+16, s.y(6)-16, '(x*, y*)=(3, 6)');
      body += label(55, 30, tr(lang, 'budget slope −2', '預算線斜率 −2'));
      body += label(414, s.y(8/7)+5, 'U=8') + label(414, s.y(18/7)+5, 'U=18');
      body += label(414, s.y(32/7)-5, 'U=32') + label(414, s.y(32/7)+18, tr(lang, 'unaffordable', '買不起'));
      return figure(this.id, 350, lang, tr(lang, 'Utility contours tangent to a budget line', '效用無差異曲線與預算線相切'), tr(lang, 'The budget 2x+y=12 is tangent to U=xy=18 at (x*,y*)=(3,6). U=8 is lower; U=32 lies beyond the budget.', '預算線 2x+y=12 在 (x*,y*)=(3,6) 與 U=xy=18 相切；U=8 較低，U=32 在預算外。'), body, lang === 'zh' ? '$U=xy$、$2x+y=12$：切點 $(x^*,y^*)=(3,6)$ 滿足 $U_x/p_x=U_y/p_y=\\lambda$，即 $6/2=3/1=3$。' : '$U=xy$ and $2x+y=12$: at $(x^*,y^*)=(3,6)$, $U_x/p_x=U_y/p_y=\\lambda$, since $6/2=3/1=3$.');
    }
  },
  {
    id: 'lagrange-fig-cost', module: 'lagrange', idea: 'lagrange-foc',
    render(lang) {
      close(3*4, 12); close(4*3+3*4, 24); close(-12/3**2, -4/3);
      for (const cost of [18,24,30]) close(4*(cost/4)+3*0, cost);
      const b = { left: 52, right: 513, top: 40, bottom: 319 }, s = scale({ x0: 0, x1: 8, y0: 0, y1: 9 }, b);
      let body = axes(b, 'L', 'K');
      body += curve(l => 12/l, 12/9, 8, s, 'fig-curve', 130);
      for (const [cost, cls] of [[18,'fig-isocost-other'],[24,'fig-isocost'],[30,'fig-isocost-other']]) {
        const lo = Math.max(0,(cost-27)/4), hi = Math.min(8,cost/4);
        body += line(s.x(lo), s.y((cost-4*lo)/3), s.x(hi), s.y((cost-4*hi)/3), cls);
      }
      body += dot(s.x(3), s.y(4)) + labelBg(240, 147, 180, 26) + label(245, 170, '(L*, K*)=(3, 4)');
      body += label(540, 231, tr(lang, 'isoquant Q=12', '等產量線 Q=12'), 'fig-label', 'end');
      for (const cost of [18, 24, 30]) body += label(s.x(cost/4)+8, b.bottom-6, `C=${cost}`);
      body += label(345, 195, tr(lang, 'isocost', '等成本線'));
      body += label(200, 275, tr(lang, 'slope −4/3', '斜率 −4/3'), 'fig-label', 'end');
      return figure(this.id, 350, lang, tr(lang, 'Least-cost isocost tangent to an isoquant', '最低等成本線與等產量線相切'), tr(lang, 'For Q=LK=12, C=18 cannot reach the isoquant, C=24 touches it at (L*,K*)=(3,4), and C=30 is more costly.', 'Q=LK=12 時，C=18 無法觸及等產量線；C=24 在 (L*,K*)=(3,4) 相切，C=30 成本較高。'), body, lang === 'zh' ? '$Q=LK=12$、$C=4L+3K$：切點 $(L^*,K^*)=(3,4)$ 滿足 $w/Q_L=r/Q_K=\\lambda$，即 $4/4=3/3=1$。' : '$Q=LK=12$ and $C=4L+3K$: at $(L^*,K^*)=(3,4)$, $w/Q_L=r/Q_K=\\lambda$, since $4/4=3/3=1$.');
    }
  },
  {
    id: 'deriv-rules-fig-acmc', module: 'deriv-rules', idea: 'deriv-rules-quotient',
    render(lang) {
      const ac = q => 27/q + 5 + 3*q, mc = q => 5 + 6*q;
      close(ac(3), 23); close(mc(3), 23); close(-27/3**2+3, 0);
      assert(mc(2) < ac(2) && mc(4) > ac(4));
      const b = { left: 55, right: 500, top: 49, bottom: 282 }, s = scale({ x0: .8, x1: 6, y0: 5, y1: 44 }, b);
      let body = axes(b, 'Q', tr(lang, 'cost', '成本'));
      body += curve(ac, .8, 6, s) + curve(mc, .8, 6, s, 'fig-curve-2');
      body += line(s.x(3), s.y(23), s.x(3), b.bottom, 'fig-guide') + dot(s.x(3), s.y(23));
      body += label(150, 145, '(3, 23)');
      body += label(436, s.y(ac(5.4))+23, 'AC') + label(454, s.y(mc(5.4))-16, 'MC');
      body += label(40, 338, tr(lang, 'MC < AC: AC falls', 'MC < AC：AC 下降'));
      body += label(291, 338, tr(lang, 'MC > AC: AC rises', 'MC > AC：AC 上升'));
      return figure(this.id, 360, lang, tr(lang, 'Average and marginal cost cross at minimum average cost', '平均成本與邊際成本在最低平均成本處相交'), tr(lang, 'AC=27/Q+5+3Q falls before Q=3 and rises after it. MC=5+6Q crosses AC at (3, 23).', 'AC=27/Q+5+3Q 在 Q=3 前下降、之後上升；MC=5+6Q 與 AC 在 (3, 23) 相交。'), body, lang === 'zh' ? 'MC&lt;AC 時 AC 下降；MC&gt;AC 時 AC 上升。' : 'AC falls where MC&lt;AC and rises where MC&gt;AC.');
    }
  },
  {
    id: 'deriv-rules-fig-mr', module: 'deriv-rules', idea: 'deriv-rules-product',
    render(lang) {
      const demand = q => 35-3*q, mr = q => 35-6*q, end = 35/3;
      close(demand(4), 23); close(mr(4), 11); close(mr(35/6), 0); close(4*(-3), -12);
      const b = { left: 57, right: 491, top: 46, bottom: 301 }, s = scale({ x0: 0, x1: end, y0: -38, y1: 38 }, b);
      let body = axes(b, 'Q', 'P, MR', s.x(0), s.y(0));
      body += curve(demand, 0, end, s) + curve(mr, 0, end, s, 'fig-curve-2');
      const qx = s.x(4), pY = s.y(23), mrY = s.y(11), bx = qx+14;
      body += dot(qx, pY) + dot(qx, mrY) + line(qx, s.y(0), qx, b.bottom, 'fig-guide');
      body += line(bx, pY, bx, mrY, 'fig-bracket') + line(bx-5, pY, bx+5, pY, 'fig-bracket') + line(bx-5, mrY, bx+5, mrY, 'fig-bracket');
      body += label(75, 145, 'QP′=−12');
      body += label(qx+30, 75, 'P=23');
      body += labelBg(qx+25, mrY+6, 75, 26) + label(qx+30, mrY+27, 'MR=11');
      body += label(qx, 330, 'Q=4', 'fig-label', 'middle');
      body += label(421, 143, tr(lang, 'demand', '需求')) + label(413, 290, 'MR');
      return figure(this.id, 351, lang, tr(lang, 'Demand and marginal revenue from a product rule', '乘法法則下的需求與邊際收益'), tr(lang, 'At Q=4, price is 23 and marginal revenue is 11. The gap QP′ equals −12; marginal revenue reaches zero at Q=35/6.', '在 Q=4 時價格為 23，邊際收益為 11，差額 QP′=−12；MR 在 Q=35/6 時為零。'), body, lang === 'zh' ? 'Q=4 時，MR=P+QP′=23−12=11。' : 'At Q=4, MR=P+QP′=23−12=11.');
    }
  },
  {
    id: 'limits-fig-sides', module: 'limits', idea: 'limits-sides',
    render(lang) {
      close(2*2+1, 5); close(3*2+1, 7); close(2*3+5, 11);
      const left = { left: 45, right: 235, top: 60, bottom: 225 };
      const right = { left: 315, right: 505, top: 60, bottom: 225 };
      const a = scale({ x0: 0, x1: 4, y0: 0, y1: 11 }, left);
      const b = scale({ x0: 1, x1: 5, y0: 5, y1: 17 }, right);
      let body = axes(left, 'x', 'y') + axes(right, 'x', 'y');
      body += label(140, 34, tr(lang, 'jump', '跳躍'), 'fig-panel-title', 'middle');
      body += label(410, 34, tr(lang, 'hole', '可移除'), 'fig-panel-title', 'middle');
      body += curve(x => 2*x+1, 0, 2, a) + curve(x => 3*x+1, 2, 10/3, a, 'fig-curve-2');
      body += dot(a.x(2), a.y(5), 'fig-open-point', 5) + dot(a.x(2), a.y(7), 'fig-point', 5);
      body += label(150, 157, 'L₋=5') + label(130, 112, 'L₊=7', 'fig-label', 'end');
      body += label(a.x(2), 254, 'a=2', 'fig-label', 'middle');
      body += curve(x => 2*x+5, 1, 2.98, b) + curve(x => 2*x+5, 3.02, 5, b);
      body += dot(b.x(3), b.y(11), 'fig-open-point', 5);
      body += label(420, 190, 'L₋=L₊=11');
      body += label(326, 288, tr(lang, 'f(3) undefined', 'f(3) 未定義'));
      return figure(this.id, 306, lang, tr(lang, 'One-sided limits at a jump and a hole', '跳躍與空點的單側極限'), tr(lang, 'At a=2, the jump has L₋=5 and L₊=f(2)=7; at a=3, the hole has L₋=L₊=11 although f(3) is undefined.', 'a=2 時跳躍的 L₋=5、L₊=f(2)=7；a=3 時空點的 L₋=L₊=11，但 f(3) 未定義。'), body, lang === 'zh' ? '雙側極限只在 $L_-=L_+$ 時存在：左圖 $5\\ne7$（$f(2)=7$），極限不存在；右圖兩側皆為 11，故極限為 11，雖然 $f(3)$ 未定義。' : 'A two-sided limit exists only when $L_-=L_+$: on the left $5\\ne7$ (with $f(2)=7$), so it does not exist; on the right both sides approach 11, although $f(3)$ is undefined.');
    }
  },
  {
    id: 'limits-fig-continuity', module: 'limits', idea: 'limits-continuity',
    render(lang) {
      close(2+4, 6); close(9, 9); close(Math.abs(1-1)+2, 2);
      const left = { left: 45, right: 235, top: 60, bottom: 225 };
      const right = { left: 315, right: 505, top: 60, bottom: 225 };
      const a = scale({ x0: 0, x1: 4, y0: 3, y1: 11 }, left);
      const b = scale({ x0: -1, x1: 3, y0: 1, y1: 5 }, right);
      let body = axes(left, 'x', 'y') + axes(right, 'x', 'y');
      body += label(140, 34, tr(lang, 'f(2) ≠ lim', 'f(2) ≠ 極限'), 'fig-panel-title', 'middle');
      body += label(410, 34, tr(lang, 'kink', '尖角'), 'fig-panel-title', 'middle');
      body += curve(x => x+4, 0, 1.98, a) + curve(x => x+4, 2.02, 4, a);
      body += dot(a.x(2), a.y(6), 'fig-open-point', 5) + dot(a.x(2), a.y(9), 'fig-point', 5);
      body += label(148, 192, 'lim = 6') + label(148, 91, 'f(2)=9');
      body += curve(x => Math.abs(x-1)+2, -1, 3, b) + dot(b.x(1), b.y(2), 'fig-point', 5);
      body += label(316, 259, tr(lang, 'continuous', '連續'));
      body += label(316, 286, tr(lang, 'two slopes −1 and 1', '但左右斜率 −1、1'));
      return figure(this.id, 306, lang, tr(lang, 'A mismatched value and a continuous kink', '函數值不符與連續尖角'), tr(lang, 'At a=2, the limit is 6 but f(2)=9, so continuity fails. The kink at (1,2) is continuous although the left and right slopes are −1 and 1.', 'a=2 時極限為 6，但 f(2)=9，故不連續；(1,2) 的尖角雖有左右斜率 −1、1，仍連續。'), body, lang === 'zh' ? '連續須滿足三條件：$f(a)$ 有定義、$\\lim_{x\\to a}f(x)$ 存在，且兩者相等。左圖第三條件失敗；右圖雖有尖角，仍連續。' : 'Continuity requires three conditions: $f(a)$ is defined, $\\lim_{x\\to a}f(x)$ exists, and the two agree. The left panel fails the third; the right kink is continuous.');
    }
  },
  {
    id: 'partials-fig-shift', module: 'partials', idea: 'partials-market',
    render(lang) {
      const demand = q => (23-q)/2, shifted = q => (29-q)/2, supply = q => (q+1)/4;
      close(demand(15), 4); close(supply(15), 4); close(shifted(19), 5); close(supply(19), 5);
      close((5-4)/(29-23), 1/6);
      const b = { left: 53, right: 509, top: 53, bottom: 301 }, s = scale({ x0: 0, x1: 30, y0: 0, y1: 9 }, b);
      let body = axes(b, 'Q', 'P');
      body += curve(demand, 0, 30, s, 'fig-curve', 120, (_,y) => y>=0 && y<=9);
      body += curve(shifted, 0, 30, s, 'fig-curve-2', 120, (_,y) => y>=0 && y<=9);
      body += curve(supply, 0, 30, s, 'fig-curve-3');
      body += arrow(s.x(11), s.y(demand(11))-6, s.x(11), s.y(shifted(11))+6);
      body += dot(s.x(15), s.y(4)) + dot(s.x(19), s.y(5));
      body += label(s.x(15)-28, s.y(4)-34, 'E₀');
      body += label(s.x(19)+12, s.y(5)-30, 'E₁');
      body += line(54, 28, 84, 28, 'fig-curve') + label(90, 34, 'D');
      body += line(194, 28, 224, 28, 'fig-curve-2') + label(230, 34, 'D′');
      body += line(335, 28, 365, 28, 'fig-curve-3') + label(371, 34, 'S');
      return figure(this.id, 336, lang, tr(lang, 'Demand shift raises equilibrium price', '需求移動提高均衡價格'), tr(lang, 'Demand shifts from Q=23−2P to Q=29−2P. Supply stays Q=4P−1. Equilibrium moves from E₀=(15, 4) to E₁=(19, 5).', '需求從 Q=23−2P 移到 Q=29−2P，供給維持 Q=4P−1；均衡從 E₀=(15, 4) 移到 E₁=(19, 5)。'), body, lang === 'zh' ? '$a$ 由 23 增為 29，均衡由 $E_0=(15,4)$ 移到 $E_1=(19,5)$：$P^*$ 上升 $6\\times\\tfrac16=1$，與 $\\partial P^*/\\partial a=1/6$ 一致。' : 'Raising $a$ from 23 to 29 moves $E_0=(15,4)$ to $E_1=(19,5)$: $P^*$ rises by $6\\times\\tfrac16=1$, matching $\\partial P^*/\\partial a=1/6$.');
    }
  },
  {
    id: 'exp-log-fig-mirror', module: 'exp-log', idea: 'exp-log-log-rules',
    render(lang) {
      close(Math.exp(0), 1); close(Math.log(1), 0);
      const b = { left: 111, right: 447, top: 37, bottom: 373 }, s = scale({ x0: -3, x1: 4, y0: -3, y1: 4 }, b);
      let body = axes(b, 'x', 'y', s.x(0), s.y(0));
      body += curve(x => Math.exp(x), -3, Math.log(4), s) + curve(x => Math.log(x), Math.exp(-3), 4, s, 'fig-curve-2');
      body += line(s.x(-3), s.y(-3), s.x(4), s.y(4), 'fig-guide');
      body += dot(s.x(0), s.y(1)) + dot(s.x(1), s.y(0));
      body += label(s.x(0)-12, s.y(1)-13, '(0, 1)', 'fig-label', 'end');
      body += label(s.x(1)+10, s.y(0)+24, '(1, 0)');
      body += label(329, 75, 'eˣ') + label(392, 142, 'ln x') + label(389, 88, 'y=x', 'fig-label', 'end');
      return figure(this.id, 402, lang, tr(lang, 'Exponential and logarithm reflect across y=x', '指數與對數曲線沿 y=x 互為鏡像'), tr(lang, 'On equal x and y scales, y=eˣ passes through (0, 1), y=ln x through (1, 0), and the curves reflect across y=x.', 'x、y 等比例時，y=eˣ 通過 (0, 1)，y=ln x 通過 (1, 0)，兩曲線沿 y=x 互為鏡像。'), body, lang === 'zh' ? 'ln x 與 eˣ 互為反函數，沿 y=x 對稱。' : 'ln x and eˣ are inverse functions, reflected across y=x.');
    }
  },
  {
    id: 'exp-log-fig-compound', module: 'exp-log', idea: 'exp-log-compounding',
    render(lang) {
      const discrete = k => 300*(1+.1/2)**k, continuous = t => 300*Math.exp(.1*t);
      for (const [k, amount] of [[1,315],[2,330.75],[3,347.29],[4,364.65]]) close(Math.round(discrete(k)*100)/100, amount);
      close(Math.round(continuous(2)*100)/100, 366.42);
      const b = { left: 57, right: 425, top: 69, bottom: 301 }, s = scale({ x0: 0, x1: 2, y0: 295, y1: 370 }, b);
      let body = axes(b, 't', 'B(t)');
      body += curve(continuous, 0, 2, s);
      let step = `M${n(s.x(0))} ${n(s.y(300))}`;
      for (let k=1; k<=4; k++) step += `H${n(s.x(k/2))}V${n(s.y(discrete(k)))}`;
      body += `<path class="fig-curve-2" d="${step}"/>`;
      body += line(55, 29, 85, 29, 'fig-curve') + `<text class="fig-label" x="92" y="35" text-anchor="start">B<tspan baseline-shift="sub" font-size="15">c</tspan>(t)</text>`;
      body += line(271, 29, 301, 29, 'fig-curve-2') + label(308, 35, 'B₂(t)');
      body += dot(s.x(2), s.y(continuous(2))) + dot(s.x(2), s.y(discrete(4)), 'fig-open-point');
      body += label(439, 91, '366.42') + label(439, 130, '364.65');
      body += line(s.x(2)+3, s.y(continuous(2)), 435, 84, 'fig-guide');
      body += line(s.x(2)+3, s.y(discrete(4)), 435, 123, 'fig-guide');
      return figure(this.id, 345, lang, tr(lang, 'Semiannual steps and continuous compounding', '半年複利階梯與連續複利'), tr(lang, 'With P=300, r=0.1 and m=2, B₂(2)=364.65 after two years, while Bc(2) is about 366.42.', 'P=300、r=0.1、m=2 時，兩年後 B₂(2)=364.65，Bc(2) 約為 366.42。'), body, lang === 'zh' ? '$P=300$、$r=0.1$、$m=2$：$B_2(2)=364.65$，$B_c(2)=300e^{0.2}\\approx366.42$。' : '$P=300$, $r=0.1$, $m=2$: $B_2(2)=364.65$, $B_c(2)=300e^{0.2}\\approx366.42$.');
    }
  }
];

for (const def of figures) for (const lang of ['en', 'zh']) {
  const file = join(lessons, `${def.module}.${lang}.html`), original = readFileSync(file, 'utf8');
  let source = original;
  if (def.id === 'limits-fig-sides') {
    const old = source.match(/^    <!-- figure:limits-fig-cases -->\n[\s\S]*?^    <!-- \/figure:limits-fig-cases -->\n/m);
    if (old) source = source.replace(old[0], '');
  }
  const start = `<!-- figure:${def.id} -->`, end = `<!-- /figure:${def.id} -->`;
  const block = `    ${start}\n    ${def.render(lang)}\n    ${end}\n`;
  const idea = source.indexOf(`<div class="lesson-idea" id="${def.idea}">`);
  assert(idea >= 0, `${file}: missing ${def.idea}`);
  const back = source.indexOf('    <p class="jump-back">', idea);
  assert(back >= 0 && source.slice(idea, back).includes('lesson-rule'), `${file}: missing idea jump-back`);
  if (source.includes(start) && !(source.indexOf(start) > idea && source.indexOf(start) < back)) {
    const old = source.match(new RegExp(`^    <!-- figure:${def.id} -->\\n[\\s\\S]*?^    <!-- /figure:${def.id} -->\\n`, 'm'));
    assert(old, `${file}: malformed marker to move`);
    source = source.replace(old[0], '');
  }
  let output;
  if (source.includes(start)) {
    const first = source.indexOf(start), last = source.indexOf(end);
    assert(first >= 0 && last > first && source.indexOf(start, first+1) < 0 && source.indexOf(end, last+1) < 0, `${file}: duplicate or malformed markers`);
    const lineStart = source.lastIndexOf('\n', first) + 1;
    output = source.slice(0, lineStart) + block + source.slice(last + end.length + 1);
  } else {
    const target = source.indexOf('    <p class="jump-back">', source.indexOf(`<div class="lesson-idea" id="${def.idea}">`));
    output = source.slice(0, target) + block + source.slice(target);
  }
  if (check) assert.equal(output, original, `${file}: figure drift; run node math-methods/tools/lesson-figures.mjs`);
  else if (output !== original) writeFileSync(file, output);
}
console.log(`${check ? 'Checked' : 'Generated'} ${figures.length} figures in both languages${check ? '; no drift' : ''}.`);
