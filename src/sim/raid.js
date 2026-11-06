// Setting up fights: the 15-second Raid (with its pen) and the ghost / boss fights.

import { createRng } from './rng.js';
import { createFight } from './fight.js';

const byRound = (arr, round) => arr[Math.max(0, Math.min(arr.length - 1, round - 1))];

// Who spawns in the pen this round. Seeded, so the Scout preview and the fight
// agree, and a ghost replay rebuilds the same pen.
//   lure: a class name (tilts up to raid.lureShare of the pen), or null
//   copiesLeft: { key: n } run-wide copy limits; omitted = no limits
export function genPen(data, seed, { round, lure = null, copiesLeft = null }) {
  const R = data.raid, B = data.board;
  const rng = createRng(`${seed}:pen:${round}`);
  const n = byRound(R.penSizeByRound, round);
  const odds = byRound(R.penOdds, round);
  const keys = Object.keys(data.roster);
  const left = copiesLeft ? { ...copiesLeft } : null;

  const cells = [];
  for (let r = R.penRows[0]; r <= R.penRows[1]; r++) for (let c = 0; c < B.cols; c++) cells.push({ c, r });
  rng.shuffle(cells);
  const runnerCells = [];
  for (let c = 0; c < B.cols; c++) runnerCells.push({ c, r: R.runnerRow });
  rng.shuffle(runnerCells);

  const available = (k) => !left || (left[k] ?? 0) > 0;
  function pickOfTier(t) {
    for (let tier = t; tier >= 1; tier--) {
      let pool = keys.filter((k) => data.roster[k].tier === tier && available(k));
      if (!pool.length) continue;
      if (lure) {
        const lp = pool.filter((k) => data.roster[k].cls === lure);
        if (lp.length && rng.chance(R.lureShare)) pool = lp;
      }
      return rng.pick(pool);
    }
    return null;
  }

  const pen = [];
  let runners = 0;
  for (let i = 0; i < n; i++) {
    const x = rng.next();
    let tier = 1, accum = 0;
    for (let t = 0; t < odds.length; t++) { accum += odds[t]; if (x < accum) { tier = t + 1; break; } }
    if (i === n - 1 && !runners && R.guaranteedRunnerTier) tier = Math.max(tier, R.guaranteedRunnerTier);
    const key = pickOfTier(tier);
    if (!key) continue;
    if (left) left[key]--;
    const isRunner = R.runnerTiers.includes(data.roster[key].tier);
    if (isRunner) runners++;
    const cell = isRunner && runnerCells.length ? runnerCells.pop() : cells.pop();
    if (!cell) break;
    const loot = rng.chance(R.lootChance) ? rng.pick(data.items.components) : null;
    pen.push({ key, star: 1, c: cell.c, r: cell.r, items: [], loot });
  }
  return pen;
}

export function penScale(data, round) {
  const s = data.raid.penScale;
  return { hp: s.hpBase + s.hpPerRound * (round - 1), atk: s.atkBase + s.atkPerRound * (round - 1) };
}

// The Raid: your board against the pen. You recruit whatever you defeat.
export function createRaid({ data, timing, seed, round, lure, board, copiesLeft, brands = 0, pen = null }) {
  const units = pen || genPen(data, seed, { round, lure, copiesLeft });
  return createFight({
    data, timing, seed: `${seed}:raid:${round}`, mode: 'raid', brands,
    sides: [
      { id: 'you', units: board, reviveMode: 'manual' },
      { id: 'pen', units, traits: false, stars: false, scale: penScale(data, round), runners: true, recruitable: true },
    ],
  });
}

// A ghost fight: your board against a saved board, turned to face you.
// `ghost` is the snapshot's board for this round: { units: [...] } in its own
// near-side coordinates (Online & Accounts own the snapshot format).
export function createGhostFight({ data, timing, seed, board, ghost, youRevive = 'manual' }) {
  return createFight({
    data, timing, seed, mode: 'ghost',
    sides: [
      { id: 'you', units: board, reviveMode: youRevive },
      { id: 'foe', units: ghost.units, rotate: true, reviveMode: 'auto' },
    ],
  });
}

export function createBossFight({ data, timing, seed, board, boss, youRevive = 'manual' }) {
  return createFight({
    data, timing, seed, mode: 'boss',
    sides: [
      { id: 'you', units: board, reviveMode: youRevive },
      { id: 'boss', units: boss.units, rotate: !!boss.rotate, traits: false, stars: false, reviveMode: 'auto' },
    ],
  });
}
