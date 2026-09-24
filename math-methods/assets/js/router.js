import { moduleById } from '../../content/modules.js';

export function parseRoute(hash = '') {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?', 2);
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { kind: 'map' };
  if (parts.length === 1 && parts[0] === 'progress') return { kind: 'progress' };
  const module = moduleById.get(parts[0]);
  if (!module || parts.length > 2) return { kind: 'unknown' };
  if (parts.length === 1) return { kind: 'module', module };
  const params = new URLSearchParams(query);
  const level = Number(params.get('level'));
  const seed = Number(params.get('seed'));
  if (!parts[1] || !/^[a-z0-9-]+$/.test(parts[1]) || ![1, 2, 3].includes(level) || !Number.isSafeInteger(seed) || seed < 0 || !params.has('level') || !params.has('seed')) {
    return { kind: 'unknown' };
  }
  return { kind: 'problem', module, generator: parts[1], level, seed };
}
