// Owner: Actions/Functions. Loads the fight sim into Node exactly as the one-file
// build does: plain scripts sharing one global scope (Animations' timing runtime,
// the prototype rules, the engine). Returns the game DATA built from src/data/.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

export function loadSim() {
  for (const f of ['src/anim/timing.js', 'src/sim/prototype_rules.js', 'src/sim/engine.js']) {
    vm.runInThisContext(read(f), { filename: join(ROOT, f) });
  }
  const DATA = {};
  for (const n of ['classes', 'abilities', 'roster', 'items', 'balance', 'move_timing']) {
    DATA[n] = JSON.parse(read(`src/data/${n}.json`));
  }
  return { PitSim: globalThis.PitSim, MoveTiming: globalThis.MoveTiming, RULES: globalThis.PIT_PROTOTYPE_RULES, DATA };
}
