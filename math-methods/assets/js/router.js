import { moduleById } from '../../content/modules.js';

function freshSeed() {
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 0x100000000);
}

export function parseRoute(hash = '', options = {}) {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?', 2);
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { kind: 'map' };
  if (parts.length === 1 && parts[0] === 'progress') return { kind: 'progress' };
  const module = moduleById.get(parts[0]);
  if (!module || parts.length > 2) return { kind: 'unknown' };
  if (parts.length === 1) return { kind: 'module', module };
  const params = new URLSearchParams(query);
  if (!parts[1] || !/^[a-z0-9-]+$/.test(parts[1])) {
    return { kind: 'unknown' };
  }
  const level = params.has('level') ? Number(params.get('level')) : 1;
  const seed = params.has('seed') ? Number(params.get('seed')) : (options.seed ?? freshSeed());
  if (![1, 2, 3].includes(level) || !Number.isSafeInteger(seed) || seed < 0 || (params.has('seed') && !/^\d+$/.test(params.get('seed')))) return { kind: 'unknown' };
  if (!params.has('level') || !params.has('seed')) {
    params.set('level', String(level)); params.set('seed', String(seed));
    const nextHash = `#/${parts[0]}/${parts[1]}?${params}`;
    if (options.replaceHash) options.replaceHash(nextHash);
    else if (globalThis.history?.replaceState && globalThis.location) {
      const url = new URL(globalThis.location.href);
      url.hash = nextHash;
      globalThis.history.replaceState(null, '', url);
    }
  }
  return { kind: 'problem', module, generator: parts[1], level, seed };
}
