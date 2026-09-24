export const PROGRESS_KEY = 'mm-progress-v1';

export function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

function writeProgress(value) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(value)); } catch { /* Advisory progress is optional. */ }
}

export function recordAttempt(id, level, correctFirstTry, highestLevel) {
  const data = readProgress();
  const prior = data[id] || { attempts: 0, firstTryCorrect: 0, streak: 0, bestLevel: 0, mastered: false };
  const streak = correctFirstTry && level === highestLevel ? prior.streak + 1 : 0;
  data[id] = {
    attempts: prior.attempts + 1,
    firstTryCorrect: prior.firstTryCorrect + Number(correctFirstTry),
    streak,
    bestLevel: Math.max(prior.bestLevel, correctFirstTry ? level : 0),
    mastered: prior.mastered || streak >= 3
  };
  writeProgress(data);
  return data[id];
}

export function breakStreak(id) {
  const data = readProgress();
  if (data[id]) { data[id].streak = 0; writeProgress(data); }
}

export function resetProgress() {
  try { localStorage.removeItem(PROGRESS_KEY); } catch { /* Storage may be unavailable. */ }
}

export function exportProgress() {
  return JSON.stringify(readProgress(), null, 2);
}
