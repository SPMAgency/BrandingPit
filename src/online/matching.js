// Ghost matching by round and record, with a seeded AI board when no ghost fits.
// The server runs pickGhost over candidates it read for this round; the game runs
// aiBoard when the server answers "no ghost" or the phone is offline.

import { LIMITS } from './ghost_format.js';

export const MATCH = {
  widenSteps: [0, 1, 2],   // allowed difference in wins, tried in order
  maxAgeDays: 180,
};

// AI difficulty curve — data, tuned with Role Building. Index = round - 1.
export const AI_CURVE = {
  units:     [2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 7],
  twoStar:   [0, 0, 0, .1, .2, .3, .4, .5, .55, .6, .65, .7, .75],
  threeStar: [0, 0, 0, 0, 0, 0, 0, 0, .03, .05, .08, .1, .15],
  items:     [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 6],
  // Tier odds per pen slot from the design doc (tier 4 / tier 5), rounds 7+.
  tier4:     [0, 0, 0, 0, 0, 0, .04, .06, .08, .10, .12, .14, .14],
  tier5:     [0, 0, 0, 0, 0, 0, .01, .02, .03, .04, .05, .06, .06],
};

/** Small seeded random generator (mulberry32). */
export function rng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : [...String(seed)].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pick one ghost for this round.
 * @param candidates [{runId, round, wins, losses, savedAt (ms)}] — ghost rounds at this round
 * @param me {round, wins, losses, runId, seen: string[] (runIds met this run), now (ms), seed}
 * @returns the chosen candidate or null (null = use an AI board)
 */
export function pickGhost(candidates, me) {
  const oldest = me.now - MATCH.maxAgeDays * 86400000;
  const seen = new Set(me.seen || []);
  const ok = candidates.filter(c => c.round === me.round && c.runId !== me.runId && !seen.has(c.runId) && c.savedAt >= oldest);
  const pick = rng(me.seed ?? `${me.runId}:${me.round}`);
  for (const d of MATCH.widenSteps) {
    const pool = d === 0
      ? ok.filter(c => c.wins === me.wins && c.losses === me.losses)
      : ok.filter(c => Math.abs(c.wins - me.wins) === d);
    if (pool.length) return pool[Math.floor(pick() * pool.length)];
  }
  return null;
}

function tierFor(round, r) {
  const i = round - 1, x = r();
  if (x < AI_CURVE.tier5[i]) return 5;
  if (x < AI_CURVE.tier5[i] + AI_CURVE.tier4[i]) return 4;
  return round <= 2 ? 1 : round <= 4 ? 1 + Math.floor(r() * 2) : 1 + Math.floor(r() * 3);
}

/**
 * Seeded AI board in ghost round format. Same runId + round → same board.
 * @param roster [{key, tier}] from the current roster data
 * @param itemNames optional list of full item names
 */
export function aiBoard(roster, { round, runId, itemNames = [] }) {
  const i = Math.min(Math.max(round, 1), LIMITS.maxRounds) - 1;
  const r = rng(`ai:${runId}:${round}`);
  const byTier = {};
  for (const f of roster) (byTier[f.tier] = byTier[f.tier] || []).push(f.key);
  const hexes = [];
  for (let row = LIMITS.gate; row < LIMITS.rows; row++) for (let c = 0; c < LIMITS.cols; c++) hexes.push({ c, r: row });
  for (let k = hexes.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [hexes[k], hexes[j]] = [hexes[j], hexes[k]]; }

  const units = [];
  for (let n = 0; n < AI_CURVE.units[i]; n++) {
    let t = tierFor(round, r);
    while (t > 1 && !byTier[t]) t--;
    const pool = byTier[t] || roster.map(f => f.key);
    const x = r();
    const star = x < AI_CURVE.threeStar[i] ? 3 : x < AI_CURVE.threeStar[i] + AI_CURVE.twoStar[i] ? 2 : 1;
    const { c, r: row } = hexes.pop();
    units.push({ key: pool[Math.floor(r() * pool.length)], star, c, r: row, items: [] });
  }
  if (itemNames.length) for (let n = 0; n < AI_CURVE.items[i]; n++) {
    const u = units[Math.floor(r() * units.length)];
    if (u.items.length < LIMITS.maxItemsPerUnit) u.items.push(itemNames[Math.floor(r() * itemNames.length)]);
  }
  const { c, r: row } = hexes.pop();
  return {
    round,
    record: null,
    hp: LIMITS.startHp,
    units,
    commander: { c, r: row, items: [], attribute: null, bonus: {}, magic: null },
    relics: [],
    ai: true,
  };
}
