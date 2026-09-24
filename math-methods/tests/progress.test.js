import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, recordAttempt, breakStreak, resetProgress, exportProgress } from '../assets/js/progress.js';

test('three highest-level first tries master; solution breaks streak', () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: key => store.delete(key)
  };
  resetProgress();
  const id = 'deriv-rules/product';
  recordAttempt(id, 1, true, 2);
  assert.equal(readProgress()[id].streak, 0);
  recordAttempt(id, 2, true, 2);
  recordAttempt(id, 2, true, 2);
  assert.equal(readProgress()[id].mastered, false);
  breakStreak(id);
  assert.equal(readProgress()[id].streak, 0);
  for (let i = 0; i < 3; i++) recordAttempt(id, 2, true, 2);
  assert.equal(readProgress()[id].mastered, true);
  assert.equal(readProgress()[id].attempts, 6);
  assert.equal(readProgress()[id].firstTryCorrect, 6);
  assert.equal(readProgress()[id].bestLevel, 2);
  assert.deepEqual(JSON.parse(exportProgress())[id], readProgress()[id]);
  resetProgress();
  assert.deepEqual(readProgress(), {});
  delete globalThis.localStorage;
});

test('storage failures do not stop practice', () => {
  globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.deepEqual(readProgress(), {});
  assert.equal(recordAttempt('x', 3, true, 3).streak, 1);
  assert.doesNotThrow(resetProgress);
  delete globalThis.localStorage;
});
