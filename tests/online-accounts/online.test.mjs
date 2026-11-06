import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGhost, ghostRound } from '../../src/online/ghost_format.js';
import { ageBand, blurName, nameForViewer, generatedName, ghostNameFor, adMode } from '../../src/online/privacy.js';
import { pickGhost, aiBoard } from '../../src/online/matching.js';
import { classShares, changePct, proposePatch } from '../../src/online/balance_job.js';
import { ROSTER, CLASSES, ITEMS, classOf, makeRun } from './fixtures.mjs';

const CAT = { roster: new Set(ROSTER.map(f => f.key)), items: new Set(ITEMS), classes: new Set(CLASSES) };

// ---------- ghost format ----------
test('a valid 12-1 run passes', () => {
  const r = validateGhost(makeRun('r_1'), CAT);
  assert.deepEqual(r.errors, []);
  assert.equal(r.ok, true);
});

test('runs under 12 wins are rejected', () => {
  assert.equal(validateGhost(makeRun('r_2', undefined, { wins: 11, losses: 2 }), CAT).ok, false);
});

test('stored patch stats are rejected so ghosts follow the current patch', () => {
  const run = makeRun('r_3'); run.rounds[0].units[0].hp = 9999;
  assert.match(validateGhost(run, CAT).errors.join(), /must not carry patch stats/);
});

test('enemy-half positions, shared hexes, bad stars and unknown fighters are rejected', () => {
  const run = makeRun('r_4');
  run.rounds[0].units[0].r = 2;
  run.rounds[1].units[1].c = 0;                // same hex as unit 1
  run.rounds[2].units[0].star = 4;
  run.rounds[3].units[0].key = 'nobody';
  const e = validateGhost(run, CAT).errors.join('\n');
  assert.match(e, /player's half/); assert.match(e, /shares a hex/); assert.match(e, /star must be/); assert.match(e, /unknown fighter/);
});

test('more than 7 fighters, a broken record and an oversize run are rejected', () => {
  const run = makeRun('r_5', ['brasshorn', 'pebblejaw', 'glintwick', 'mossling', 'sparkfen', 'driftwing', 'hushfang', 'thistlestep']);
  run.rounds[5].record.wins = 0;
  run.look = { junk: 'x'.repeat(30000) };
  const e = validateGhost(run, CAT).errors.join('\n');
  assert.match(e, /more than 7 fighters/); assert.match(e, /add up/); assert.match(e, /too big/);
});

test('ghostRound returns the requested round', () => {
  assert.equal(ghostRound(makeRun('r_6'), 5).round, 5);
});

// ---------- privacy ----------
test('age band: blank or odd input asks again; 12-or-13 years counts as child', () => {
  assert.equal(ageBand('', 2026), null);
  assert.equal(ageBand('20x6', 2026), null);
  assert.equal(ageBand('2030', 2026), null);
  assert.equal(ageBand('2013', 2026), 'child');   // 12 or 13 → child
  assert.equal(ageBand('2016', 2026), 'child');
  assert.equal(ageBand('2012', 2026), '13plus');
  assert.equal(ageBand(' 1985 ', 2026), '13plus');
});

test('name blur matches the design doc', () => {
  assert.equal(blurName('Jordan Rivers'), 'J****n R****s');
  assert.equal(blurName('Al Bo'), '* *');
  assert.equal(blurName('Mary-Jane O\'Neil'), 'M****y-J****e *\'N****l');
  assert.equal(blurName('Zoë Åsa'), 'Z****ë Å****a');
});

test('who sees which name', () => {
  const real = { first: 'Jordan', last: 'Rivers', generated: false };
  assert.equal(nameForViewer(real, { band: '13plus', signedIn: true }), 'Jordan Rivers');
  assert.equal(nameForViewer(real, { band: '13plus', signedIn: false }), 'J****n R****s');
  assert.equal(nameForViewer(real, { band: 'child', signedIn: true }), 'J****n R****s');
  assert.equal(nameForViewer(real, { band: 'unknown', signedIn: false }), 'J****n R****s');
  const gen = generatedName('r_1');
  assert.equal(nameForViewer(gen, { band: 'child' }), `${gen.first} ${gen.last}`);
});

test('children never publish their typed name; generated names are stable', () => {
  const n = ghostNameFor('child', { first: 'Sam', last: 'Lee' }, 'r_9');
  assert.equal(n.generated, true);
  assert.notEqual(n.first, 'Sam');
  assert.deepEqual(generatedName('r_9'), n);
  assert.equal(ghostNameFor('13plus', { first: 'Sam', last: 'Lee' }, 'r_9').first, 'Sam');
});

test('ads: child and unknown are child-directed and non-personalized', () => {
  for (const b of ['child', 'unknown']) assert.deepEqual(adMode(b), { childDirected: true, personalizedAllowed: false, familiesCertifiedOnly: true });
  assert.equal(adMode('13plus').childDirected, false);
});

// ---------- matching ----------
const NOW = Date.UTC(2026, 10, 6);
const cand = (runId, wins, losses, daysOld = 1) => ({ runId, round: 5, wins, losses, savedAt: NOW - daysOld * 86400000 });

test('exact record first, then widen by wins', () => {
  const me = { round: 5, wins: 3, losses: 1, runId: 'me', seen: [], now: NOW };
  assert.equal(pickGhost([cand('a', 3, 1), cand('b', 4, 0)], me).runId, 'a');
  assert.equal(pickGhost([cand('b', 4, 0), cand('c', 1, 3)], me).runId, 'b');
  assert.equal(pickGhost([cand('c', 1, 3)], me).runId, 'c');
});

test('own, already-met and stale ghosts are skipped; nothing left → AI board', () => {
  const me = { round: 5, wins: 3, losses: 1, runId: 'me', seen: ['x'], now: NOW };
  assert.equal(pickGhost([cand('me', 3, 1), cand('x', 3, 1), cand('old', 3, 1, 200), cand('far', 0, 4)], me), null);
});

test('AI board is seeded, legal and grows with the round', () => {
  const a = aiBoard(ROSTER, { round: 9, runId: 'r_1', itemNames: ITEMS });
  assert.deepEqual(a, aiBoard(ROSTER, { round: 9, runId: 'r_1', itemNames: ITEMS }));
  assert.ok(aiBoard(ROSTER, { round: 1, runId: 'r_1' }).units.length < a.units.length);
  const run = makeRun('r_ai');
  for (let r = 1; r <= 13; r++) {
    const b = aiBoard(ROSTER, { round: r, runId: 'r_ai', itemNames: ITEMS });
    run.rounds[r - 1] = { ...b, record: run.rounds[r - 1].record };
    delete run.rounds[r - 1].ai;
  }
  assert.deepEqual(validateGhost(run, CAT).errors, []);
});

// ---------- balance job ----------
test('changePct: inside the band no change; 3% to 5% outside it', () => {
  assert.equal(changePct(5), 0);
  assert.equal(changePct(-4.9), 0);
  assert.equal(changePct(5.1), -3);
  assert.equal(changePct(7.5), -4);
  assert.equal(changePct(15), -5);
  assert.equal(changePct(-12), 5);
});

test('shares are per run, commander excluded, and sum to 100', () => {
  const { shares, runs } = classShares([makeRun('a', ['brasshorn', 'ironbloom']), makeRun('b', ['glintwick', 'mossling', 'sparkfen', 'pebblejaw'])], classOf, CLASSES);
  assert.equal(runs, 2);
  assert.equal(shares.Warrior, 50);
  assert.equal(shares.Mage, 12.5);
  assert.ok(Math.abs(Object.values(shares).reduce((s, x) => s + x, 0) - 100) < 1e-9);
});

test('a Warrior-heavy meta nerfs Warrior, buffs unused classes, and writes a note', () => {
  const runs = [];
  for (let i = 0; i < 120; i++) runs.push(makeRun('w' + i, ['brasshorn', 'ironbloom', 'glintwick', 'mossling']));
  const out = proposePatch({ patch: '0.2.0', runs, classOf, classes: CLASSES });
  const war = out.changes.find(c => c.cls === 'Warrior');
  assert.equal(war.pct, -5);
  assert.equal(out.multipliers.Warrior, 0.95);
  assert.equal(out.changes.find(c => c.cls === 'Quiet Concern').pct, 5);
  assert.equal(out.changes.find(c => c.cls === 'Mage').pct, -5);      // 25% share is 12.5 points over
  assert.match(out.note, /Warrior: -5% HP and damage/);
});

test('too few runs → no changes; lifetime cap → flagged, not applied', () => {
  const few = proposePatch({ patch: '0.2.0', runs: [makeRun('a')], classOf, classes: CLASSES });
  assert.equal(few.changes.length, 0);
  assert.match(few.note, /no class changes/);
  const runs = Array.from({ length: 120 }, (_, i) => makeRun('w' + i, ['brasshorn']));
  const capped = proposePatch({ patch: '0.9.0', runs, classOf, classes: CLASSES, current: { Warrior: 0.76 } });
  assert.equal(capped.flagged[0].cls, 'Warrior');
  assert.equal(capped.multipliers.Warrior, 0.76);
});

// ---------- against the real data files ----------
import { readFileSync } from 'node:fs';
test('AI boards built from src/data/roster.json pass the ghost checker', () => {
  const data = JSON.parse(readFileSync(new URL('../../src/data/roster.json', import.meta.url)));
  const roster = Object.entries(data.fighters).map(([key, f]) => ({ key, tier: f.tier, cls: f.cls }));
  const cat = { roster: new Set(roster.map(f => f.key)), classes: new Set(roster.map(f => f.cls)) };
  const run = makeRun('r_real');
  for (let r = 1; r <= 13; r++) {
    const b = aiBoard(roster, { round: r, runId: 'r_real' });
    run.rounds[r - 1] = { ...b, record: run.rounds[r - 1].record };
    delete run.rounds[r - 1].ai;
  }
  assert.deepEqual(validateGhost(run, cat).errors, []);
});
