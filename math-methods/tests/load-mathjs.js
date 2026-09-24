import { createRequire } from 'node:module';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Node treats vendor/mathjs/math.js as ESM because this package is type:module.
// The UMD bundle requires a .cjs extension for createRequire on current Node.
// Copy identical bytes to a temporary .cjs file; never alter the vendored file.
export function loadMathJs() {
  const directory = mkdtempSync(join(tmpdir(), 'math-methods-umd-'));
  const destination = join(directory, 'math.cjs');
  copyFileSync(fileURLToPath(new URL('../vendor/mathjs/math.js', import.meta.url)), destination);
  try { return createRequire(import.meta.url)(destination); }
  finally { rmSync(directory, { recursive: true, force: true }); }
}
