// The SVG is a complete h=1 example before this optional enhancement runs.
export const f = x => x*x;
export const secantSlope = h => {
  if (!Number.isFinite(h) || h === 0) throw new RangeError('h must be finite and nonzero');
  return (f(1+h)-f(1))/h;
};
export function snapH(value, direction = 1) {
  const h = Math.max(-2, Math.min(2, Number(value)));
  if (!Number.isFinite(h)) throw new RangeError('h must be finite');
  return Math.abs(h) < .05 ? (direction < 0 ? -.05 : .05) : Math.round(h*20)/20;
}
export const mapToSvg = (x, y, s) => ({
  x: s.left + (x-s.x0)*(s.right-s.left)/(s.x1-s.x0),
  y: s.bottom - (y-s.y0)*(s.bottom-s.top)/(s.y1-s.y0)
});

const round = value => Number(value.toFixed(2));
const words = {
  en: { play: 'Play', slider: 'Secant step h', secant: 'secant slope', tangent: 'tangent slope' },
  zh: { play: '播放', slider: '割線步長 h', secant: '割線斜率', tangent: '切線斜率' }
};

export function mountLessonInteractives(lessonEl, lang) {
  for (const figure of lessonEl.querySelectorAll('[data-interactive="secant"]')) {
    if (figure.querySelector('.lesson-figure-controls')) continue;
    const svg = figure.querySelector('svg');
    const scale = JSON.parse(svg.dataset.scale);
    const secant = svg.querySelector('.fig-secant-active');
    const point = svg.querySelector('.fig-secant-b');
    const pointLabel = svg.querySelector('.fig-secant-b-label');
    if (!secant || !point || !pointLabel) continue;
    const copy = words[lang] || words.en;
    const controls = document.createElement('div');
    controls.className = 'lesson-figure-controls';
    const label = document.createElement('label');
    label.textContent = 'h';
    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = '-2'; slider.max = '2'; slider.step = '.05'; slider.value = '1';
    slider.setAttribute('aria-label', copy.slider);
    label.append(slider);
    const play = document.createElement('button');
    play.type = 'button'; play.textContent = copy.play;
    // Visible readout updates every frame; only the throttled status span below is announced.
    const readout = document.createElement('p');
    readout.className = 'lesson-figure-readout';
    const announcement = document.createElement('span');
    announcement.className = 'sr-only';
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    controls.append(label, play, readout, announcement);
    figure.insertBefore(controls, figure.querySelector('figcaption'));

    let h = 1, previousRaw = 1, frame = 0, timer = 0, lastAnnouncement = 0;
    const render = (next, announce = false) => {
      h = next;
      const slope = secantSlope(h);
      const yAt = x => f(1) + slope*(x-1);
      const from = mapToSvg(scale.x0, yAt(scale.x0), scale);
      const to = mapToSvg(scale.x1, yAt(scale.x1), scale);
      const b = mapToSvg(1+h, f(1+h), scale);
      secant.setAttribute('d', `M${round(from.x)} ${round(from.y)}L${round(to.x)} ${round(to.y)}`);
      point.setAttribute('cx', round(b.x)); point.setAttribute('cy', round(b.y));
      // Keep B in the plot and separate its label from A as the points converge.
      const labelLeft = h < 0 && h > -1.5;
      pointLabel.setAttribute('text-anchor', labelLeft ? 'end' : 'start');
      pointLabel.setAttribute('x', round(b.x + (labelLeft ? -35 : h < .3 && h >= 0 ? 20 : 12)));
      pointLabel.setAttribute('y', round(b.y + (h < 0 ? -27 : h > 1.4 ? 28 : -40)));
      slider.value = String(h);
      slider.setAttribute('aria-valuetext', `h = ${h.toFixed(2)}`);
      const message = `h = ${h.toFixed(2)} · ${copy.secant} = (f(1+h) − f(1))/h = ${slope.toFixed(2)} · ${copy.tangent} = 2`;
      readout.textContent = message;
      const now = performance.now();
      if (announce || now-lastAnnouncement > 600) { announcement.textContent = message; lastAnnouncement = now; }
    };
    const stop = () => { cancelAnimationFrame(frame); clearInterval(timer); frame = 0; timer = 0; };
    slider.addEventListener('input', () => {
      stop();
      const raw = Number(slider.value);
      render(snapH(raw, raw < previousRaw ? -1 : 1));
      previousRaw = raw;
    });
    slider.addEventListener('change', () => render(h, true));
    play.addEventListener('click', () => {
      stop();
      render(2, true);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const steps = [1, .5, .25, .1, .05];
        let index = 0;
        timer = setInterval(() => {
          if (!figure.isConnected) { stop(); return; }
          render(steps[index++], true);
          if (index === steps.length) stop();
        }, 700);
      } else {
        const start = performance.now();
        const tick = now => {
          if (!figure.isConnected) { stop(); return; }
          render(snapH(2-1.95*Math.min((now-start)/3000, 1)));
          if (now-start < 3000) frame = requestAnimationFrame(tick);
          else render(.05, true);
        };
        frame = requestAnimationFrame(tick);
      }
    });
    render(1, true);
  }
}
