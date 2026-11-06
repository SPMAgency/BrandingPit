// Tests for the move timing runtime and its gate. Owner: Animations.
//   node --test tests/animations/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, cpSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { loadMoveTiming } from '../../tools/bake/load_timing.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { createTiming, slug } = loadMoveTiming(ROOT);
const DATA = JSON.parse(readFileSync(join(ROOT, 'src/data/move_timing.json'), 'utf8'));
const T = createTiming(DATA);
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('class names, ids and the commander all resolve', () => {
  assert.equal(slug('Leaf in the Wind'), 'leaf_in_the_wind');
  assert.equal(slug('cmd'), 'commander');
  assert.equal(slug(null), 'commander');
  assert.ok(T.start('Judge Mark', 'attack', { as: 1 }));
  assert.ok(T.start('judge_mark', 'cast'));
  assert.ok(T.start('cmd', 'brand'));
});

test('an attack fills one attack interval, contact at the same fraction', () => {
  // design rule: 0.7 attacks/s gives a 1.43 s cycle; 1.4 plays twice as fast
  near(T.length('Warrior', 'attack', { as: 0.7 }) / 60, 1 / 0.7);
  near(T.length('Warrior', 'attack', { as: 1.4 }) / 60, 1 / 1.4);
  const fr = (as) => T.contactAt('Warrior', 'attack', { as }) / (T.length('Warrior', 'attack', { as }) / 60);
  near(fr(0.4), fr(3.0));
  near(fr(0.7), 20 / 52);
});

test('casts are fixed length and ignore attack speed', () => {
  near(T.length('Mage', 'cast', { as: 0.5 }), T.length('Mage', 'cast', { as: 2.5 }));
  near(T.length('Mage', 'cast'), 18 + 5 + 21);
});

test('an attack refuses to start without an attack speed', () => {
  assert.throws(() => T.start('Warrior', 'attack'), /attack speed/);
});

test('contact fires exactly once, on the first active frame', () => {
  const mv = T.start('Warrior', 'attack', { as: 1 }); // 60 frames, su = 20/52*60
  const su = mv.segs[0];
  let contacts = 0, contactF = -1, n = 0;
  while (!mv.done && n++ < 1000) {
    if (T.tick(mv, 1 / 60) === 'contact') { contacts++; contactF = mv.f; assert.ok(T.phase(mv).live); }
  }
  assert.equal(contacts, 1);
  assert.ok(contactF >= su && contactF < su + 1.0001);
  assert.equal(T.phase(mv).ph, 'done');
});

test('a long frame that skips past active still reports contact', () => {
  const mv = T.start('Quiet Concern', 'attack', { as: 2 });
  assert.equal(T.tick(mv, 10), 'contact'); // ten seconds in one tick
  assert.ok(mv.done);
  assert.equal(T.tick(mv, 1 / 60), null);
});

test('the art on screen follows the phases', () => {
  const mv = T.start('Healer', 'attack', { as: 1 });
  const seen = [];
  while (!mv.done) { T.tick(mv, 1 / 60); const p = T.phase(mv); if (!seen.length || seen.at(-1) !== p.art) seen.push(p.art); }
  assert.deepEqual(seen, [0, 1, 2, 3, 4, 5]);
  const mv2 = T.start('Healer', 'attack', { as: 1 });
  T.tick(mv2, mv2.segs[0] / 60 + 1e-6);
  assert.equal(T.phase(mv2).art, 2); // the contact frame shows while live
});

test('hit-stop freezes the move for impact.hitstopMs', () => {
  const mv = T.start('Mage', 'cast');
  T.tick(mv, 0.1);
  const f = mv.f;
  T.hitstop(mv);
  T.tick(mv, DATA.impact.hitstopMs / 1000);
  near(mv.f, f, 1e-6);
  assert.equal(T.phase(mv).frozen, false);
  T.tick(mv, 1 / 60);
  assert.ok(mv.f > f);
});

test('the gate passes the shipped data and fails broken data', () => {
  const run = (root) => {
    try { execFileSync('node', [join(root, 'tools/timing_check.mjs')], { stdio: 'pipe' }); return { ok: true, out: '' }; }
    catch (e) { return { ok: false, out: e.stdout.toString() }; }
  };
  assert.ok(run(ROOT).ok);
  const breakWith = (mutate) => {
    const dir = mkdtempSync(join(tmpdir(), 'tc-'));
    for (const p of ['src/anim', 'src/data', 'tools/bake', 'assets/atlases']) mkdirSync(join(dir, p), { recursive: true });
    cpSync(join(ROOT, 'src/anim/timing.js'), join(dir, 'src/anim/timing.js'));
    cpSync(join(ROOT, 'tools/timing_check.mjs'), join(dir, 'tools/timing_check.mjs'));
    cpSync(join(ROOT, 'tools/bake/load_timing.mjs'), join(dir, 'tools/bake/load_timing.mjs'));
    cpSync(join(ROOT, 'assets/atlases/layout.json'), join(dir, 'assets/atlases/layout.json'));
    const d = structuredClone(DATA); mutate(d);
    writeFileSync(join(dir, 'src/data/move_timing.json'), JSON.stringify(d));
    return run(dir);
  };
  let r = breakWith((d) => { d.moves.warrior.attack.ac = 0; });
  assert.ok(!r.ok && /never connects/.test(r.out));
  r = breakWith((d) => { d.moves.mage.attack.art.recovery = [3, 4]; });
  assert.ok(!r.ok && /every baked frame once/.test(r.out));
  r = breakWith((d) => { delete d.moves.healer.cast; });
  assert.ok(!r.ok && /healer.cast missing/.test(r.out));
  r = breakWith((d) => { d.moves.judge_mark.attack.su = 60; });
  assert.ok(!r.ok && /wind-up lasts/.test(r.out));
  r = breakWith((d) => { d.moves.quiet_concern.attack.ac = 1; });
  assert.ok(!r.ok && /contact holds/.test(r.out));
});

test('the runtime is a plain script the one-file build can include', () => {
  const src = readFileSync(join(ROOT, 'src/anim/timing.js'), 'utf8');
  assert.ok(!/^\s*(export|import)\b/m.test(src), 'no module syntax');
  // run it as the browser would and count what it adds to the global scope:
  // one name, so it cannot collide with another chat's globals
  const ctx = vm.createContext({});
  const before = new Set(Object.getOwnPropertyNames(ctx));
  vm.runInContext(src, ctx);
  const added = vm.runInContext('Object.getOwnPropertyNames(globalThis)', ctx).filter((k) => !before.has(k) && !(k in globalThis));
  assert.deepEqual([...added], ['MoveTiming']);
});
