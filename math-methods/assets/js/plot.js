// Small solution-only plot. Generator expressions are trusted site content.
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
const labels = {
  en: { stationary: 'stationary', max: 'local max', min: 'local min', optimum: 'optimum', inflection: 'inflection', caption: 'Curve and marked point(s); positions are approximate.' },
  zh: { stationary: '平穩點', max: '局部極大', min: '局部極小', optimum: '最適點', inflection: '反曲點', caption: '函數曲線與標記點；位置為近似值。' }
};

export function plotSvg(plot, lang, mathEngine = globalThis.math) {
  if (!plot || !mathEngine) return '';
  const [lo, hi] = plot.range;
  if (!(Number.isFinite(lo) && Number.isFinite(hi) && hi > lo)) return '';
  const evaluate = mathEngine.compile(plot.expr);
  const valueAt = x => Number(evaluate.evaluate({ [plot.variable]: x }));
  const samples = Array.from({ length: 121 }, (_, i) => {
    const x = lo + (hi - lo) * i / 120;
    return { x, y: valueAt(x) };
  });
  const marked = plot.points.map(point => ({ ...point, y: valueAt(point.x) }));
  const values = [...samples, ...marked].map(point => point.y).filter(Number.isFinite);
  if (values.length < 2 || marked.some(point => !Number.isFinite(point.y))) return '';
  let min = Math.min(...values), max = Math.max(...values);
  const padding = Math.max((max - min) * 0.12, 0.5);
  min -= padding; max += padding;
  const left = 48, right = 535, top = 20, bottom = 225;
  const px = x => left + (x - lo) * (right - left) / (hi - lo);
  const py = y => bottom - (y - min) * (bottom - top) / (max - min);
  const path = samples.map((point, i) => `${i ? 'L' : 'M'}${px(point.x).toFixed(2)} ${py(point.y).toFixed(2)}`).join(' ');
  const axisY = min <= 0 && max >= 0 ? py(0) : bottom;
  const axisX = lo <= 0 && hi >= 0 ? px(0) : left;
  const dictionary = labels[lang] || labels.en;
  const title = lang === 'zh' ? `${plot.axis} 對 ${plot.variable} 的曲線` : `${plot.axis} against ${plot.variable}`;
  const pointMarkup = marked.map((point, i) => {
    const x = px(point.x), y = py(point.y);
    const caption = `${dictionary[point.kind] || point.kind}: ${plot.variable}=${point.x}`;
    const dy = y < top + 30 ? 20 : -11;
    return `<circle class="plot-point" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="5"/><text class="plot-point-label" x="${Math.min(x + 9, 435).toFixed(2)}" y="${(y + dy + i % 2 * 2).toFixed(2)}">${esc(caption)}</text>`;
  }).join('');
  return `<figure class="solution-plot"><svg viewBox="0 0 560 265" role="img" aria-label="${esc(title)}; ${esc(marked.map(point => `${dictionary[point.kind]} ${plot.variable}=${point.x}`).join(', '))}"><path class="plot-axis" d="M${left} ${axisY.toFixed(2)}H${right} M${axisX.toFixed(2)} ${top}V${bottom}"/><path class="plot-curve" d="${path}"/>${pointMarkup}<text class="plot-axis-label" x="${right}" y="252" text-anchor="end">${esc(plot.variable)}</text><text class="plot-axis-label" x="10" y="16">${esc(plot.axis)}</text></svg><figcaption>${esc(dictionary.caption)}</figcaption></figure>`;
}
