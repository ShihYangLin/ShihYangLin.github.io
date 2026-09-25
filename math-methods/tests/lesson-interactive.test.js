import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { f, secantSlope, snapH, mapToSvg } from '../assets/js/lesson-interactive.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('one-secant slope follows f(x)=x² on both sides of zero', () => {
  assert.equal(f(1), 1);
  assert.equal(f(2), 4);
  for (const h of [-2, -1, -.5, -.05, .05, .5, 1, 2]) {
    assert.ok(Math.abs(secantSlope(h)-(2+h)) < 1e-9, `h=${h}`);
  }
  assert.throws(() => secantSlope(0), RangeError);
});

test('slider snapping excludes zero and follows drag direction at the gap', () => {
  for (let i=-200; i<=200; i++) assert.notEqual(snapH(i/100), 0);
  assert.equal(snapH(0, -1), -.05);
  assert.equal(snapH(0, 1), .05);
  assert.equal(snapH(3), 2);
  assert.equal(snapH(-3), -2);
});

test('runtime scale maps to the exact generated SVG coordinates', () => {
  const html = readFileSync(join(root, 'content/lessons/deriv-basics.en.html'), 'utf8');
  const svg = html.match(/<figure class="lesson-figure" id="deriv-basics-fig-secant"[\s\S]*?<svg ([^>]+)>/)[1];
  const encoded = svg.match(/data-scale="([^"]+)"/)[1];
  const scale = JSON.parse(encoded.replaceAll('&quot;', '"'));
  const a = mapToSvg(1, 1, scale);
  const b = mapToSvg(2, 4, scale);
  assert.equal(scale.x0, -1.5);
  assert.equal(scale.x1, 3.5);
  assert.deepEqual(mapToSvg(scale.x0, scale.y0, scale), { x: scale.left, y: scale.bottom });
  assert.deepEqual(mapToSvg(scale.x1, scale.y1, scale), { x: scale.right, y: scale.top });
  assert.match(html, new RegExp(`class="fig-point" cx="${Number(a.x.toFixed(2))}" cy="${Number(a.y.toFixed(2))}"`));
  assert.match(html, new RegExp(`class="fig-open-point fig-secant-b" cx="${Number(b.x.toFixed(2))}" cy="${Number(b.y.toFixed(2))}"`));
});
