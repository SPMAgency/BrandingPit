// Fight simulation tests, on the game's real src/data files and Animations' real
// timing runtime. Run: node --test 'tests/actions-functions/*.test.mjs'
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

import { loadSim, ROOT } from './load_sim.mjs';
import { startBoard, midBoard, ghostBoard, testFighters } from './fixtures/boards.mjs';

const { PitSim, MoveTiming, RULES, DATA } = loadSim();
const {
  advance, step, runToEnd, command, replay, createRaid, createGhostFight, createBossFight,
  genPen, mergeAll, combineComponents, newRun, applyGhostResult, applyBossResult, simTiming, createRng, traitRanks, fromGameData,
} = PitSim;

const data = fromGameData(DATA, RULES);
Object.assign(data.roster, testFighters);
const T = MoveTiming.createTiming(DATA.move_timing);

// FNV-1a over the event log: one number that changes if anything in the fight changes.
function hash(F) {
  const s = JSON.stringify(F.events);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16) + ':' + F.events.length + ':' + F.tick;
}

const ghost = (seed, timing = T) => createGhostFight({ data, timing, seed, board: midBoard, ghost: { units: ghostBoard }, youRevive: 'auto' });

/* ---------------- determinism ---------------- */

test('same seed, same fight, every time', () => {
  const a = ghost('s1'); runToEnd(a);
  const b = ghost('s1'); runToEnd(b);
  assert.equal(hash(a), hash(b));
  assert.ok(a.events.length > 50, 'the fight actually happened');
  assert.ok(a.result.winner || a.result.reason === 'time');
});

test('different seeds give different fights', () => {
  const hs = new Set();
  for (let i = 0; i < 6; i++) { const f = ghost('seed' + i); runToEnd(f); hs.add(hash(f)); }
  assert.ok(hs.size >= 5, `only ${hs.size} distinct fights from 6 seeds`);
});

test('frame rate does not change the fight (30, 60, 90, 144 fps and a jittery phone)', () => {
  const ref = ghost('fps'); runToEnd(ref);
  const rates = [1 / 30, 1 / 60, 1 / 90, 1 / 144];
  for (const dt of rates) {
    const f = ghost('fps');
    let guard = 0;
    while (!f.over && guard++ < 200000) advance(f, dt);
    assert.equal(hash(f), hash(ref), `differs at ${Math.round(1 / dt)} fps`);
  }
  const rng = createRng('frames');
  const f = ghost('fps');
  let guard = 0;
  while (!f.over && guard++ < 200000) advance(f, 0.004 + rng.next() * 0.06); // 4 ms to 64 ms frames
  assert.equal(hash(f), hash(ref), 'differs with uneven frames');
});

test('a long stall (tab in background) catches up without changing the result', () => {
  const ref = ghost('stall'); runToEnd(ref);
  const f = ghost('stall');
  advance(f, 0.5); advance(f, 3.0); // 3 s stall, capped per call, carried over
  while (!f.over) advance(f, 1 / 60);
  assert.equal(hash(f), hash(ref));
});

test('the sim never calls Math.random, Date or performance', () => {
  for (const file of ['src/sim/engine.js', 'src/sim/prototype_rules.js']) {
    const src = readFileSync(join(ROOT, file), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const bad of ['Math.random', 'Date.now', 'new Date', 'performance.now', 'Math.sin', 'Math.cos', 'Math.hypot', 'Math.pow', 'Math.exp']) {
      assert.ok(!src.includes(bad), `${file} uses ${bad} (not identical on every phone)`);
    }
  }
  const real = Math.random;
  Math.random = () => { throw new Error('Math.random called during a fight'); };
  try { runToEnd(ghost('norandom')); runToEnd(createRaid({ data, timing: T, seed: 'nr', round: 3, board: startBoard })); }
  finally { Math.random = real; }
});

test('a Raid replays exactly from seed + boards + recorded brand taps', () => {
  const live = createRaid({ data, timing: T, seed: 'run42', round: 2, lure: 'Warrior', board: startBoard });
  for (let i = 0; i < 40; i++) step(live); // tap during the scout
  const pens = live.actors.filter((a) => a.side === 'pen');
  command(live, { type: 'brand', actor: pens[0].id });
  for (let i = 0; i < 200; i++) step(live);
  command(live, { type: 'brand', actor: pens[pens.length - 1].id });
  runToEnd(live);

  const pen = genPen(data, 'run42', { round: 2, lure: 'Warrior' });
  const again = replay(data, T, {
    seed: 'run42:raid:2', mode: 'raid',
    sides: [
      { id: 'you', units: startBoard, reviveMode: 'manual' },
      { id: 'pen', units: pen, traits: false, stars: false, scale: { hp: 0.55 + 0.08, atk: 0.6 + 0.06 }, runners: true, recruitable: true },
    ],
    commands: live.commands,
  });
  assert.equal(hash(again), hash(live));
});

/* ---------------- timing track ---------------- */

test('attack speed scales the whole swing; contact stays at the same fraction (timing file)', () => {
  const tm = simTiming(T, data);
  for (const cls of Object.keys(data.abilities)) {
    const e = T.entry(cls, 'attack');
    const frac = e.su / (e.su + e.ac + e.rc);
    const slow = tm.attack(cls, 0.7), fast = tm.attack(cls, 1.4);
    assert.equal(slow.source, 'file');
    assert.equal(slow.total, Math.round(86 * (e.fill ?? 1)), `${cls}: a 1.43 s cycle at 0.7 attacks per second`);
    assert.ok(Math.abs(slow.contact / slow.total - frac) < 0.02, `${cls} slow contact`);
    assert.ok(Math.abs(fast.contact / fast.total - frac) < 0.03, `${cls} fast contact`);
  }
  const c = tm.attack(null, 0.75, true);
  assert.ok(c.total > 0 && c.contact > 0, 'commander attack comes from the commander entry');
  assert.ok(tm.cast(null, true).total > 0, 'commander casts its magic entry');
});

test('without the timing file the fallback 2/1/3 frames are used', () => {
  const tm = simTiming(null, data);
  const slow = tm.attack('Warrior', 0.7);
  assert.equal(slow.source, 'fallback'); assert.equal(slow.total, 86);
  assert.ok(Math.abs(slow.contact / slow.total - 2 / 6) < 0.02);
  const F = createGhostFight({ data, timing: null, seed: 'nofile', board: midBoard, ghost: { units: ghostBoard }, youRevive: 'auto' });
  assert.ok(runToEnd(F), 'a fight still runs');
});

test('hit-stop comes from the timing file when it is loaded', () => {
  assert.equal(ghost('hs').hitStopMs, DATA.move_timing.impact.hitstopMs);
  assert.equal(ghost('hs', null).hitStopMs, data.impact.hitStopMs);
});

test('melee damage lands only on active frames, after the wind-up', () => {
  const F = ghost('contact');
  runToEnd(F);
  const starts = new Map();
  let checked = 0;
  for (const e of F.events) {
    if (e.type === 'attack_start' && !e.ranged) starts.set(e.src, e);
    if ((e.type === 'hit' || e.type === 'crit') && e.source === 'attack' && starts.has(e.src)) {
      const s = starts.get(e.src);
      const a = F.actors[e.src];
      if (a.range > 1) continue;
      const since = e.t - s.t;
      if (since > s.total) continue; // a projectile or a later swing
      assert.ok(since >= s.contactAt - 0 && since < s.contactAt + s.active + 8, `hit ${since} ticks into a swing whose contact is ${s.contactAt}`);
      checked++;
    }
  }
  assert.ok(checked > 20, `only ${checked} melee hits checked`);
});

test('contact events carry the hit position and the attacker side and position', () => {
  const F = ghost('events'); runToEnd(F);
  const hits = F.events.filter((e) => e.type === 'hit' || e.type === 'crit');
  assert.ok(hits.length > 10);
  for (const e of hits) {
    for (const k of ['x', 'z', 'fromX', 'fromZ', 'amount']) assert.equal(typeof e[k], 'number', k);
    if (e.src != null) assert.ok(['you', 'foe'].includes(e.side));
  }
  const types = new Set(F.events.map((e) => e.type));
  for (const t of ['attack_start', 'hit', 'ko', 'cast_start', 'cast', 'end']) assert.ok(types.has(t), `no ${t} event`);
});

test('crits and ability hits freeze both fighters for the hit-stop', () => {
  const F = ghost('hitstop');
  let frozen = null;
  while (!F.over && !frozen) {
    const n = F.events.length; step(F);
    const big = F.events.slice(n).find((e) => e.big && e.src != null);
    if (big) frozen = { src: F.actors[big.src], tgt: F.actors[big.tgt] };
  }
  assert.ok(frozen, 'a big hit happened');
  const n = Math.round((DATA.move_timing.impact.hitstopMs / 1000) * 60);
  assert.ok(frozen.src.freeze >= n - 1 && frozen.tgt.freeze >= n - 1, 'both fighters hold for the hit-stop');
  const off = { ...data, impact: { hitStopMs: 0 } };
  const a = createGhostFight({ data: off, timing: null, seed: 'hitstop', board: midBoard, ghost: { units: ghostBoard }, youRevive: 'auto' });
  runToEnd(a); const b = ghost('hitstop', null); runToEnd(b);
  assert.notEqual(hash(a), hash(b), 'hit-stop is a data value that changes the fight');
});

/* ---------------- the Raid ---------------- */

test('Raid: scout first, 3 brands only, recruits and escapes recorded', () => {
  const F = createRaid({ data, timing: T, seed: 'raid', round: 3, board: startBoard });
  assert.equal(F.phase, 'scout');
  const pen = F.actors.filter((a) => a.side === 'pen');
  for (const a of pen.slice(0, 5)) command(F, { type: 'brand', actor: a.id });
  step(F);
  const brands = F.events.filter((e) => e.type === 'brand');
  const rejected = F.events.filter((e) => e.type === 'rejected');
  assert.equal(brands.length, 3);
  assert.equal(rejected.length, 2);
  assert.equal(F.brandsLeft, 0);
  const res = runToEnd(F);
  assert.ok(res.ticks <= (2 + 15) * 60 + 1, 'Raid ends at 15 s after a 2 s scout');
  assert.equal(res.recruits.length + res.escaped.length, pen.length, 'every wild fighter is either recruited or gone');
});

test('Raid: ghost-spoils extra brand adds one for this Raid only', () => {
  const F = createRaid({ data, timing: T, seed: 'raid', round: 3, board: startBoard, brands: 1 });
  assert.equal(F.brandsLeft, 4);
  assert.equal(createRaid({ data, timing: T, seed: 'raid', round: 4, board: startBoard }).brandsLeft, 3);
});

test('Raid: your board focuses a branded fighter', () => {
  const F = createRaid({ data, timing: T, seed: 'focus', round: 1, board: startBoard });
  const pen = F.actors.filter((a) => a.side === 'pen');
  const far = pen.reduce((m, a) => (a.r < m.r ? a : m), pen[0]);
  command(F, { type: 'brand', actor: far.id });
  for (let i = 0; i < 200; i++) step(F);
  const mine = F.actors.filter((a) => a.side === 'you' && !a.ko);
  assert.ok(mine.every((a) => !a.target || a.target === far || far.ko || far.gone));
});

test('Raid: runners flee toward the exit row', () => {
  let saw = false;
  for (let i = 0; i < 6 && !saw; i++) {
    const F = createRaid({ data, timing: T, seed: 'run' + i, round: 2, board: [{ key: 'cmd', c: 3, r: 11 }] });
    runToEnd(F);
    if (F.events.some((e) => e.type === 'run') && F.events.some((e) => e.type === 'escape' && !e.timeUp)) saw = true;
  }
  assert.ok(saw, 'a runner escaped through the exit row');
});

test('pen: seeded, same for scout and replay, lure tilts at most part of it, copy limits hold', () => {
  assert.deepEqual(genPen(data, 'p', { round: 5 }), genPen(data, 'p', { round: 5 }));
  let lured = 0, total = 0;
  for (let i = 0; i < 200; i++) {
    const pen = genPen(data, 'l' + i, { round: 3, lure: 'Healer' });
    total += pen.length; lured += pen.filter((u) => data.roster[u.key].cls === 'Healer').length;
  }
  assert.ok(lured / total > 0.2 && lured / total < 0.75, `lure share ${lured / total}`);
  const limited = genPen(data, 'c', { round: 3, copiesLeft: { brasshorn: 0, mossling: 0, glintwick: 0, pebblejaw: 0, sparkfen: 1 } });
  assert.ok(limited.filter((u) => u.key === 'sparkfen').length <= 1);
  assert.ok(!limited.some((u) => ['brasshorn', 'mossling', 'glintwick', 'pebblejaw'].includes(u.key)));
  for (let r = 1; r <= 6; r++) for (let i = 0; i < 30; i++) assert.ok(genPen(data, 'tier' + i, { round: r }).every((u) => data.roster[u.key].tier <= 3), 'rounds 1-6 draw tiers 1-3');
});

/* ---------------- traits, revive, merge ---------------- */

test('traits count the board; commander only with an attribute', () => {
  const r = traitRanks(data, midBoard);
  assert.equal(r.Warrior, 0); // 3 Warriors
  assert.equal(r.Healer, 0); // 3 Healers
  const withAttr = traitRanks(data, [...midBoard.filter((u) => u.key !== 'mossling' || u.uid !== 'm6'), { key: 'cmd', attribute: 'Healer' }]);
  assert.equal(withAttr.Healer, 0);
});

test('Healer revive: tap to revive mid-fight once, at the rank\'s HP', () => {
  const F = ghost('revive');
  F.sides.you.reviveMode = 'manual';
  let tries = 0;
  while (!F.over && tries++ < 5000) {
    step(F);
    const down = F.actors.find((a) => a.side === 'you' && a.ko && !a.isCmd);
    if (down) { command(F, { type: 'revive', actor: down.id }); step(F); break; }
  }
  const rev = F.events.filter((e) => e.type === 'revive');
  assert.equal(rev.length, 1);
  assert.equal(rev[0].pct, 0.5, 'rank 3 Healers revive a unit at 50%');
  const down2 = F.actors.find((a) => a.side === 'you' && a.ko);
  if (down2) { command(F, { type: 'revive', actor: down2.id }); step(F); }
  assert.equal(F.events.filter((e) => e.type === 'revive').length, 1, 'only one revive per fight');
});

test('merge: three 1-stars make a 2-star, three 2-stars a 3-star, items carried', () => {
  const u = (uid, star = 1, items = []) => ({ uid, key: 'brasshorn', star, items });
  const out = mergeAll({ board: [u('b1', 1, ['Storm Fan'])], bench: [u('n1', 1, ['Cinder Crown']), u('n2')], wait: [] });
  assert.equal(out.board[0].star, 2);
  assert.deepEqual(out.board[0].items, ['Storm Fan', 'Cinder Crown']);
  assert.equal(out.bench.length, 0);
  const many = mergeAll({ board: [], bench: [u('a', 2), u('b', 2), u('c'), u('d'), u('e')], wait: [] });
  assert.equal(many.bench.length, 1); assert.equal(many.bench[0].star, 3);
  const cmd = mergeAll({ board: [{ key: 'cmd' }, { key: 'cmd' }, { key: 'cmd' }], bench: [] });
  assert.equal(cmd.merges.length, 0, 'commanders never merge');
});

test('item components combine into full items', () => {
  const r = combineComponents(data, ['Iron Shard', 'Moon Bead', 'Gale Feather']);
  assert.deepEqual(r.items, ['Warden Charm']); assert.deepEqual(r.comps, ['Gale Feather']);
});

/* ---------------- after the fight ---------------- */

test('lost ghost fight: 10 per enemy unit standing, 13 for their commander, from 500', () => {
  const run = newRun(data);
  assert.equal(run.hp, 500);
  const res = { winner: 'foe', survivors: { you: [], foe: [{ isCmd: true }, { isCmd: false }, { isCmd: false }] } };
  const out = applyGhostResult(data, run, res);
  assert.equal(out.damage, 33); assert.equal(out.run.hp, 467); assert.equal(out.outcome, 'loss');
  const changed = { ...data, run: { ...data.run, lossPerUnit: 4 } };
  assert.equal(applyGhostResult(changed, run, res).damage, 21, 'numbers come from data, not code');
});

test('12 wins ends the run; a perfect run is flagged for the 13th level', () => {
  let run = newRun(data);
  for (let i = 0; i < 12; i++) run = applyGhostResult(data, run, { winner: 'you', survivors: { you: [], foe: [] } }).run;
  assert.equal(run.over, true); assert.equal(run.won, true); assert.equal(run.perfect, true);
});

test('lost boss: half current HP, no loot, bench wiped', () => {
  const run = { ...newRun(data), hp: 301 };
  const out = applyBossResult(data, run, { winner: 'boss' }, { bench: [{ key: 'x' }], loot: ['Moon Bead'] });
  assert.equal(out.run.hp, 151); assert.deepEqual(out.bench, []); assert.deepEqual(out.loot, []);
  const won = applyBossResult(data, run, { winner: 'you' }, { bench: [{ key: 'x' }], loot: ['Moon Bead'] });
  assert.equal(won.run.hp, 301); assert.equal(won.bench.length, 1);
});

test('a real ghost fight result feeds the run damage end to end', () => {
  const F = ghost('e2e'); const res = runToEnd(F);
  const out = applyGhostResult(data, newRun(data), res);
  if (out.outcome === 'loss') {
    const expect = res.survivors.foe.reduce((t, s) => t + (s.isCmd ? 13 : 10), 0);
    assert.equal(out.damage, expect);
  } else assert.equal(out.damage, 0);
});

test('a boss fight runs to an end', () => {
  const F = createBossFight({ data, timing: T, seed: 'boss', board: midBoard, boss: { units: [{ key: 'galesovereign', c: 3, r: 2 }] } });
  const res = runToEnd(F);
  assert.ok(['you', 'boss'].includes(res.winner));
});

test('fair: identical boards win about half each, whichever side you are on', () => {
  // Regression guard. A fixed turn order gave your side 62% of these; see STUDY_LOG.
  const long = { ...data, combat: { ...data.combat, timeLimitSec: 120 } };
  for (const b of [midBoard, ghostBoard]) {
    let you = 0, foe = 0;
    for (let i = 0; i < 300; i++) {
      const r = runToEnd(createGhostFight({ data: long, timing: T, seed: 'fair' + i, board: b, ghost: { units: b }, youRevive: 'auto' }));
      if (r.winner === 'you') you++; else if (r.winner === 'foe') foe++;
    }
    const share = you / (you + foe);
    assert.ok(share > 0.42 && share < 0.58, `your side won ${(share * 100).toFixed(1)}% of mirror matches`);
  }
});

test('ghost boards are turned to face you (180 degrees)', () => {
  const F = ghost('rot');
  const g = F.actors.filter((a) => a.side === 'foe');
  for (const a of g) assert.ok(a.r <= 4, `ghost unit on row ${a.r}`);
});

test('performance: 200 full ghost fights run in a few seconds headless', () => {
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 200; i++) runToEnd(ghost('perf' + i));
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.ok(ms < 20000, `${ms} ms`);
  console.log(`  200 ghost fights in ${Math.round(ms)} ms (${(ms / 200).toFixed(1)} ms each)`);
});

test('data: Role Building\'s full layer is read; only the listed gaps come from prototype rules', () => {
  assert.equal(data.raid.seconds, DATA.balance.raid.seconds);
  assert.equal(data.raid.scoutSeconds, DATA.balance.raid.scout);
  assert.equal(data.raid.brands, DATA.balance.raid.brands_per_raid);
  assert.deepEqual(data.raid.penOdds[6], DATA.balance.pen_tier_odds.by_round['7']);
  assert.equal(data.run.startHp, DATA.balance.run.start_hp);
  assert.deepEqual(data.combat.starStats.hp, DATA.balance.star.hp);
  assert.deepEqual(data.classes.Warrior.ranks, DATA.classes.traits.Warrior.r);
  assert.deepEqual(data.classes.Warrior.stackCap, DATA.classes.primary.warrior.ranks.map((r) => r.stack_cap));
  assert.equal(data.abilities.Mage.mult, DATA.abilities.by_class.mage.effect.atk_mult);
  assert.equal(data.abilities.Warrior.kind, 'cleave');
  assert.equal(data.abilities['Leaf in the Wind'].blink, true);
  assert.equal(data.classes['Recovery Pool'].capMaxHpPerFight, DATA.classes.secondary.recovery_pool.effect.cap_max_hp_per_fight);
  assert.equal(data.combat.armorK, 100, 'armor constant read from the formula text');
  assert.equal(data.roster.brasshorn.hp, DATA.roster.fighters.brasshorn.hp);
  assert.ok(!data._fromRules.some((p) => p.startsWith('roster') || p.startsWith('abilities')), 'roster and abilities never come from rules');
  assert.ok(data._fromRules.includes('combat.retargetSec'));
  const moved = JSON.parse(JSON.stringify(DATA));
  delete moved.balance.combat.attack_roll;
  assert.ok(fromGameData(moved, RULES)._fromRules.includes('combat.attackRoll'), 'a value Role Building drops falls back and is listed');
  console.log(`  ${data._fromRules.length} values still come from src/sim/prototype_rules.js: ${data._fromRules.join(', ')}`);
});

test('every number the sim needs is present with exactly the data set the build loads', () => {
  const man = JSON.parse(readFileSync(join(ROOT, 'src/manifest.json'), 'utf8'));
  const buildData = {};
  for (const n of new Set([...man.data, 'move_timing'])) buildData[n] = DATA[n];
  const d = fromGameData(buildData, RULES);
  assert.deepEqual(PitSim.checkData(d), []);
  const broken = JSON.parse(JSON.stringify(d)); delete broken.raid.penOdds;
  assert.deepEqual(PitSim.checkData(broken), ['raid.penOdds'], 'a gap is reported by name');
});

test('patch layer: class mods, fighter mods and the Pit Condition change the fight stats', () => {
  const base = PitSim.computeStats(data, { key: 'brasshorn', star: 1 }, { traits: false }, {});
  const D2 = JSON.parse(JSON.stringify(DATA));
  D2.balance.patch.class_mods.warrior.hp = 0.95;
  D2.balance.patch.fighter_mods.brasshorn = { atk: 1.1 };
  D2.balance.pit_conditions.active = 'iron_week'; // warriors +8% HP
  const d2 = fromGameData(D2, RULES);
  const st = PitSim.computeStats(d2, { key: 'brasshorn', star: 1 }, { traits: false }, {});
  assert.ok(Math.abs(st.max - base.max * 0.95 * 1.08) < 1e-6, 'hp: class mod x Pit Condition');
  assert.ok(Math.abs(st.atk - base.atk * 1.1) < 1e-6, 'atk: fighter mod');
  const gale = JSON.parse(JSON.stringify(DATA)); gale.balance.pit_conditions.active = 'gale_season';
  const g = PitSim.computeStats(fromGameData(gale, RULES), { key: 'driftwing', star: 1 }, { traits: false }, {});
  assert.equal(g.ccAdd, -0.5, 'Gale Season: Gusting Shallow stuns 0.5 s shorter');
});

test('copies per run come from balance.copies_per_run and limit the pen', () => {
  const c = PitSim.initialCopies(data);
  assert.equal(c.brasshorn, DATA.balance.copies_per_run.by_tier['1']);
  assert.equal(c.auricstag, DATA.balance.copies_per_run.by_tier['3']);
});

test('the engine adds exactly one global and loads after the timing runtime', () => {
  // Run each file in a clean sandbox and see what it leaves behind.
  for (const [file, name] of [['src/sim/engine.js', 'PitSim'], ['src/sim/prototype_rules.js', 'PIT_PROTOTYPE_RULES']]) {
    const ctx = vm.createContext({});
    vm.runInContext(readFileSync(join(ROOT, file), 'utf8'), ctx);
    assert.deepEqual(Object.keys(ctx), [name], `${file} must define only ${name}`);
  }
});
