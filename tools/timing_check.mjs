#!/usr/bin/env node
// Gate for the move timing track (src/data/move_timing.json).
// Owner: Animations. Contract: tools/bake/MOVE_TIMING.md.
//
//   node tools/timing_check.mjs          # exits 1 on any FAIL
//
// Fails when the data is malformed, points at art that is not on the atlas
// layout, breaks a readability limit at the slowest or fastest attack speed,
// or when a baked atlas manifest disagrees with the layout.
//
// It runs the game's own runtime (src/anim/timing.js), so what passes here is
// what plays: no second copy of the maths to drift.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMoveTiming } from './bake/load_timing.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { createTiming, slug } = loadMoveTiming(ROOT);
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const data = read('src/data/move_timing.json');
const layout = read('assets/atlases/layout.json');
const errs = [];
const warns = [];
const fail = (m) => errs.push(m);

// Every class with an ability needs an attack and a cast. The list comes from
// Role Building's src/data/abilities.json, so a new ability cannot ship
// without timing. Before that file existed: the design doc's eight.
let CLASSES = ['Warrior', 'Healer', 'Mage', 'Judge Mark', 'Ember Keeper', 'Gusting Shallow', 'Quiet Concern', 'Leaf in the Wind'];
if (existsSync(join(ROOT, 'src/data/abilities.json'))) {
  const keys = Object.keys(read('src/data/abilities.json')).filter((k) => !k.startsWith('_'));
  if (keys.length) CLASSES = keys;
}
const REQUIRED = Object.fromEntries(CLASSES.map((c) => [slug(c), ['attack', 'cast']]));
REQUIRED.commander = ['attack', 'magic', 'brand'];

const isInt = (v) => Number.isInteger(v) && v >= 0;

// ---- shape ---------------------------------------------------------------
for (const [cls, kinds] of Object.entries(REQUIRED)) {
  if (!data.moves[cls]) { fail(`moves.${cls} missing (every class needs ${kinds.join(' + ')})`); continue; }
  for (const k of kinds) if (!data.moves[cls][k]) fail(`moves.${cls}.${k} missing`);
}
for (const [cls, c] of Object.entries(data.moves)) {
  for (const [kind, e] of Object.entries(c)) {
    if (kind === 'class' || kind.startsWith('_') || typeof e !== 'object' || e === null) continue;
    const id = `${cls}.${kind}`;
    for (const f of ['su', 'ac', 'rc']) if (!isInt(e[f])) fail(`${id}.${f} must be a whole number of frames >= 0`);
    if (isInt(e.ac) && e.ac < 1) fail(`${id}.ac must be >= 1: a move with no active frame never connects`);
    if (!['attack', 'fixed'].includes(e.scale)) fail(`${id}.scale must be "attack" or "fixed"`);
    if (e.scale === 'attack' && !(e.fill > 0 && e.fill <= 1)) fail(`${id}.fill must be in (0, 1]`);
    if (!['eye', 'unverified'].includes(e.contact)) fail(`${id}.contact must say how the contact frame was chosen ("eye" or "unverified")`);
    if (![0, 1].includes(e.wired)) fail(`${id}.wired must be 0 or 1`);
    const clip = layout.clips[e.clip];
    if (!clip) { fail(`${id}.clip "${e.clip}" is not a clip in assets/atlases/layout.json`); continue; }
    // art: every baked frame of the clip, once, in order, across the 3 phases
    const a = e.art || {};
    const ph = ['startup', 'active', 'recovery'];
    if (!ph.every((p) => Array.isArray(a[p]))) { fail(`${id}.art needs startup, active and recovery frame lists`); continue; }
    if (a.active.length < 1) fail(`${id}.art.active needs the contact frame`);
    const flat = ph.flatMap((p) => a[p]);
    const want = [...Array(clip.frames).keys()];
    if (JSON.stringify(flat) !== JSON.stringify(want)) {
      fail(`${id}.art plays ${JSON.stringify(flat)} but the "${e.clip}" clip has frames ${JSON.stringify(want)}; every baked frame once, in order`);
    }
    if (e.contact === 'unverified' && e.wired) warns.push(`${id} is wired but its contact frame was never picked by eye`);
  }
}
for (const [name, l] of Object.entries(data.loops || {})) {
  if (name.startsWith('_')) continue;
  if (!layout.clips[name]) fail(`loops.${name} is not a clip in the layout`);
  if (!(l.fps > 0)) fail(`loops.${name}.fps must be > 0`);
}
for (const [sheet, s] of Object.entries(layout.sheets)) {
  const timed = new Set(Object.values(data.moves).flatMap((c) => Object.values(c).filter((e) => e && e.clip).map((e) => e.clip)));
  for (const clip of s.clips) {
    if (!layout.clips[clip]) fail(`layout.sheets.${sheet} names clip "${clip}" with no frame count`);
    else if (!(data.loops || {})[clip] && !timed.has(clip)) fail(`clip "${clip}" has neither a loop entry nor a timed move`);
  }
}
if (errs.length) finish();

// ---- limits, through the runtime, at both ends of the attack-speed range --
const T = createTiming(data);
const L = data.limits;
const { min: asMin, max: asMax } = L.attackSpeed;
const rows = [];
for (const [cls, c] of Object.entries(data.moves)) {
  for (const [kind, e] of Object.entries(c)) {
    if (kind === 'class' || kind.startsWith('_') || !e || typeof e !== 'object') continue;
    const id = `${cls}.${kind}`;
    if (e.scale === 'attack') {
      const [suF, acF, rcF] = T.segments(cls, kind, { as: asMax });
      const [suS] = T.segments(cls, kind, { as: asMin });
      if (acF < L.attack.minActiveFrames) fail(`${id}: contact holds ${acF.toFixed(2)} frames at ${asMax} attacks/s; needs ${L.attack.minActiveFrames}`);
      if (suF / e.art.startup.length < L.attack.minFramesPerArt) fail(`${id}: wind-up frames flash by at ${asMax} attacks/s (${(suF / e.art.startup.length).toFixed(2)} game frames each)`);
      if (rcF / e.art.recovery.length < L.attack.minFramesPerArt) fail(`${id}: recovery frames flash by at ${asMax} attacks/s`);
      if (suS / 60 > L.attack.maxStartupSec) fail(`${id}: wind-up lasts ${(suS / 60).toFixed(2)} s at ${asMin} attacks/s; limit ${L.attack.maxStartupSec} s`);
      // the auto-battler rule, proved on the runtime: contact fraction is constant
      const fr = (a) => T.segments(cls, kind, { as: a })[0] / T.length(cls, kind, { as: a });
      if (Math.abs(fr(asMin) - fr(asMax)) > 1e-9) fail(`${id}: contact fraction moves with attack speed`);
      const cyc = (a) => T.length(cls, kind, { as: a }) / 60;
      if (Math.abs(cyc(1) - (e.fill ?? 1)) > 1e-9) fail(`${id}: at 1 attack/s the swing should last ${e.fill ?? 1} s`);
    } else {
      const lim = L.cast;
      const tot = e.su + e.ac + e.rc;
      if (tot > lim.maxTotalFrames) fail(`${id}: ${tot} frames (${(tot / 60).toFixed(2)} s) exceeds ${lim.maxTotalFrames}`);
      if (e.su > lim.maxStartupFrames) fail(`${id}: wind-up ${e.su} frames exceeds ${lim.maxStartupFrames}; the effect would fire late`);
      if (e.ac < lim.minActiveFrames) fail(`${id}: contact holds ${e.ac} frames; needs ${lim.minActiveFrames}`);
    }
    rows.push({ id, e });
  }
}

// ---- memory budget -----------------------------------------------------------
const { w, h } = layout.cell;
const dirs = layout.directions.length;
const frames = (s) => layout.sheets[s].clips.reduce((n, c) => n + layout.clips[c].frames, 0);
const fFrames = frames('fighter');
const cFrames = frames('commander');
if (fFrames !== layout.budget.fighterFrames) fail(`fighter sheet has ${fFrames} frames; budget says ${layout.budget.fighterFrames}`);
if (cFrames !== layout.budget.commanderFrames) fail(`commander sheet has ${cFrames} frames; budget says ${layout.budget.commanderFrames}`);
const mb = (n, passes) => (n * w * h * dirs * 4 * passes) / 1e6;
const fighterMB = mb(fFrames, layout.sheets.fighter.passes.length);
const commanderMB = mb(cFrames, layout.sheets.commander.passes.length);
const screenMB = fighterMB * layout.budget.fightersOnScreen;
if (fighterMB > layout.budget.fighterMB) fail(`a fighter decodes to ${fighterMB.toFixed(2)} MB; budget ${layout.budget.fighterMB} MB`);
if (screenMB > layout.budget.ceilingMB) fail(`${layout.budget.fightersOnScreen} fighters decode to ${screenMB.toFixed(1)} MB; ceiling ${layout.budget.ceilingMB} MB`);
const worst = screenMB + 2 * commanderMB;
if (worst > layout.budget.ceilingMB) warns.push(`16 fighters + 2 commanders (yours and the ghost's) decode to ${worst.toFixed(1)} MB, over the ${layout.budget.ceilingMB} MB ceiling while the commander keeps a mask sheet`);

// ---- baked atlas manifests, when any exist ---------------------------------
const adir = join(ROOT, 'assets/atlases');
for (const f of readdirSync(adir).filter((f) => f.endsWith('.json') && f !== 'layout.json')) {
  const m = JSON.parse(readFileSync(join(adir, f), 'utf8'));
  const sheet = layout.sheets[m.sheet];
  if (!sheet) { fail(`${f}: unknown sheet "${m.sheet}"`); continue; }
  if (m.cell?.w !== w || m.cell?.h !== h) fail(`${f}: cell ${m.cell?.w}x${m.cell?.h}, layout says ${w}x${h}`);
  if (m.rows !== dirs) fail(`${f}: ${m.rows} direction rows, layout says ${dirs}`);
  for (const clip of sheet.clips) {
    if (m.clips?.[clip]?.frames !== layout.clips[clip].frames) fail(`${f}: clip "${clip}" has ${m.clips?.[clip]?.frames} frames, layout says ${layout.clips[clip].frames}`);
  }
}

finish();

function finish() {
  for (const e of errs) console.log('FAIL', e);
  for (const wn of warns) console.log('WARN', wn);
  if (errs.length) process.exit(1);
  console.log(`ok: ${rows.length} moves (${rows.filter((r) => r.e.wired).length} wired), limits hold at ${asMin} and ${asMax} attacks/s`);
  for (const { id, e } of rows) {
    const t = e.su + e.ac + e.rc;
    const frac = (e.su / t * 100).toFixed(0).padStart(3);
    const how = e.scale === 'attack'
      ? `contact at ${frac}% of the swing; ${(T.contactAt(...id.split('.'), { as: 0.7 }) * 1000).toFixed(0)} ms at 0.7/s`
      : `${(t * 1000 / 60).toFixed(0)} ms, contact at ${(e.su * 1000 / 60).toFixed(0)} ms`;
    console.log(`  ${id.padEnd(24)} ${String(e.su).padStart(2)}+${e.ac}+${String(e.rc).padEnd(2)}  ${e.scale.padEnd(6)}  ${how}${e.contact === 'unverified' ? '  (contact unverified)' : ''}`);
  }
  console.log(`  memory: fighter ${fighterMB.toFixed(2)} MB, ${layout.budget.fightersOnScreen} on screen ${screenMB.toFixed(1)} MB, commander ${commanderMB.toFixed(2)} MB`);
  process.exit(0);
}
