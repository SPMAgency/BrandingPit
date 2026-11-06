// Per-patch balance job. Reads the last patch's winning runs, proposes class
// multipliers and a patch note. It never edits Role Building's data files: its
// output is reviewed by Role Building and shipped by Engineering.

export const BALANCE = {
  bandPoints: 5,        // a class more than this many points from average is changed
  minPct: 3,            // change at just over the band
  maxPct: 5,            // change at bandPoints + fullAt or more
  fullAt: 5,            // extra points over the band that reach maxPct
  minRuns: 100,         // fewer winning runs on the patch → no changes
  lifetimeCap: 0.25,    // total change since launch beyond ±25% → flag, don't apply
  stats: ['hp', 'atk'], // which stats the multiplier applies to
};

/**
 * Each class's share of fighters on winning runs' final boards, in percent.
 * Every run counts equally; the commander is left out; tier 5 counts by primary class.
 * @param runs ghost runs (format v1) with 12+ wins
 * @param classOf (key) => primary class name
 * @param classes all class names (so a class nobody used shows 0)
 */
export function classShares(runs, classOf, classes) {
  const sums = Object.fromEntries(classes.map(c => [c, 0]));
  let counted = 0;
  for (const run of runs) {
    const last = run.rounds[run.rounds.length - 1];
    const units = (last && last.units) || [];
    if (!units.length) continue;
    counted++;
    for (const u of units) {
      const c = classOf(u.key);
      if (c in sums) sums[c] += 100 / units.length;
    }
  }
  const shares = {};
  for (const c of classes) shares[c] = counted ? sums[c] / counted : 0;
  return { shares, runs: counted };
}

/** Percent change for a class `excess` points from average (negative = below). */
export function changePct(excess) {
  const over = Math.abs(excess) - BALANCE.bandPoints;
  if (over <= 0) return 0;
  const pct = BALANCE.minPct + (BALANCE.maxPct - BALANCE.minPct) * Math.min(over / BALANCE.fullAt, 1);
  return Math.round(pct * 10) / 10 * (excess > 0 ? -1 : 1);
}

/**
 * Propose this patch's changes.
 * @param current {className: multiplier} from the last patch (missing = 1)
 * @returns {{patch, sample, average, shares, changes, flagged, multipliers, note}}
 */
export function proposePatch({ patch, runs, classOf, classes, current = {} }) {
  const { shares, runs: sample } = classShares(runs, classOf, classes);
  const average = 100 / classes.length;
  const multipliers = Object.fromEntries(classes.map(c => [c, current[c] ?? 1]));
  const changes = [], flagged = [];

  if (sample >= BALANCE.minRuns) {
    for (const c of classes) {
      const pct = changePct(shares[c] - average);
      if (!pct) continue;
      const next = Math.round(multipliers[c] * (1 + pct / 100) * 10000) / 10000;
      const row = { cls: c, share: round1(shares[c]), excess: round1(shares[c] - average), pct, from: multipliers[c], to: next };
      if (Math.abs(next - 1) > BALANCE.lifetimeCap) flagged.push(row);
      else { changes.push(row); multipliers[c] = next; }
    }
  }
  return { patch, sample, average: round1(average), shares: mapRound(shares), changes, flagged, multipliers, note: patchNote(patch, sample, changes, flagged) };
}

export function patchNote(patch, sample, changes, flagged) {
  if (sample < BALANCE.minRuns) return `Patch ${patch}: no class changes (only ${sample} winning runs; ${BALANCE.minRuns} needed).`;
  if (!changes.length && !flagged.length) return `Patch ${patch}: every class is within ${BALANCE.bandPoints} points of average. No class changes.`;
  const lines = [`Patch ${patch} class changes (from ${sample} 12-win runs):`];
  for (const ch of changes) lines.push(`- ${ch.cls}: ${ch.pct > 0 ? '+' : ''}${ch.pct}% HP and damage (${ch.share}% of winning boards).`);
  for (const f of flagged) lines.push(`- ${f.cls}: held for Role Building review (would pass ±${BALANCE.lifetimeCap * 100}% since launch).`);
  return lines.join('\n');
}

function round1(x) { return Math.round(x * 10) / 10; }
function mapRound(o) { return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, round1(v)])); }
