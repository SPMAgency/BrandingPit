// What a fight result does to the run: HP, wins, the bench and loot.
// All numbers from data.run (Role Building's balance.json).

export function newRun(data) {
  return { hp: data.run.startHp, wins: 0, losses: 0, over: false, won: false, perfect: false };
}

// Damage you take after losing a ghost fight: each enemy unit still standing,
// the commander counting for more.
export function lossDamage(data, survivors) {
  let d = 0;
  for (const s of survivors) d += s.isCmd ? data.run.lossCommander : data.run.lossPerUnit;
  return d;
}

export function outcomeOf(data, result, you = 'you') {
  if (result.winner === you) return 'win';
  if (result.winner) return 'loss';
  return data.run.timeoutCountsAs; // time ran out or both sides fell
}

export function applyGhostResult(data, run, result, you = 'you') {
  const R = { ...run };
  const outcome = outcomeOf(data, result, you);
  let damage = 0;
  if (outcome === 'win') {
    R.wins++;
    if (R.wins >= data.run.winTarget) { R.over = true; R.won = true; R.perfect = R.losses === 0; }
  } else if (outcome === 'loss') {
    const foe = Object.keys(result.survivors).find((id) => id !== you);
    damage = lossDamage(data, result.survivors[foe] || []);
    R.losses++;
    R.hp = Math.max(0, R.hp - damage);
    if (R.hp <= 0) R.over = true;
  }
  return { run: R, outcome, damage };
}

// Losing a boss: half your current HP, no loot, and the bench is wiped.
// Winning keeps the loot. Either way the round's ghost fight follows.
export function applyBossResult(data, run, result, { bench = [], loot = [] } = {}, you = 'you') {
  const R = { ...run };
  const won = result.winner === you;
  if (won) return { run: R, outcome: 'win', damage: 0, bench, loot };
  const damage = Math.floor(R.hp * data.run.bossLossHpFraction);
  R.hp = Math.max(0, R.hp - damage);
  if (R.hp <= 0) R.over = true;
  return { run: R, outcome: 'loss', damage, bench: [], loot: [] };
}
