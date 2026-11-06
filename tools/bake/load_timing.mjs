// Owner: Animations. Loads src/anim/timing.js for Node tools the way the
// browser build does: as a plain script whose one global is MoveTiming.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export function loadMoveTiming(root = join(dirname(fileURLToPath(import.meta.url)), '../..')) {
  const file = join(root, 'src/anim/timing.js');
  const ctx = vm.createContext({});
  vm.runInContext(readFileSync(file, 'utf8') + '\n;globalThis.__mt = MoveTiming;', ctx, { filename: file });
  return ctx.__mt;
}
