// Move timing runtime. Owner: Animations. Contract: tools/bake/MOVE_TIMING.md.
//
// Pure functions over src/data/move_timing.json. No DOM, no canvas, no clock:
// the fight sim (and a headless ghost or balance run) can use it unchanged.
//
//   import { createTiming } from '../anim/timing.js';
//   const T = createTiming(json);                 // json = parsed move_timing.json
//   const mv = T.start('Warrior', 'attack', { as: 0.7 });
//   // every sim step:
//   if (T.tick(mv, dt) === 'contact') { resolveHit(); mv.hit = 1; }
//   if (mv.done) mv = null;
//
// Units are frames at 60 per second; tick() takes seconds and advances dt*60,
// so a variable frame rate is fine.
//
// Attack-speed rule (auto-battler): an entry with "scale": "attack" stretches
// or shrinks as a whole to fill one attack interval (60 / as frames, times
// "fill"). Every phase scales by the same factor, so contact stays at the same
// fraction of the swing at any attack speed. "scale": "fixed" entries (casts,
// brand) play at their authored length.

const PHASES = ['startup', 'active', 'recovery'];

export function slug(name) {
  if (name == null) return 'commander';
  const s = String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return s === 'cmd' ? 'commander' : s;
}

export function createTiming(data) {
  if (!data || !data.moves) throw new Error('move timing: data has no "moves"');
  const fps = data.fps || 60;
  const hitstopFrames = ((data.impact && data.impact.hitstopMs) || 0) * fps / 1000;

  function entry(cls, kind) {
    const c = data.moves[slug(cls)];
    if (!c) throw new Error(`move timing: no entry for class "${cls}"`);
    const e = c[kind];
    if (!e || typeof e !== 'object' || !('su' in e)) throw new Error(`move timing: "${slug(cls)}" has no "${kind}"`);
    return e;
  }

  // Scaled [su, ac, rc] in (fractional) frames.
  function segments(cls, kind, opts = {}) {
    const e = entry(cls, kind);
    const natural = e.su + e.ac + e.rc;
    let f = 1;
    if (e.scale === 'attack') {
      const as = opts.as;
      if (!(as > 0)) throw new Error(`move timing: ${slug(cls)}.${kind} scales with attack speed; pass { as } > 0`);
      f = (fps / as) * (e.fill == null ? 1 : e.fill) / natural;
    }
    return [e.su * f, e.ac * f, e.rc * f];
  }

  function length(cls, kind, opts) {
    const s = segments(cls, kind, opts);
    return s[0] + s[1] + s[2];
  }

  // Seconds from start to the contact frame (first active frame).
  function contactAt(cls, kind, opts) {
    return segments(cls, kind, opts)[0] / fps;
  }

  // Start a move. Attack speed is read once here: a slow applied mid-swing
  // takes effect from the next swing, which keeps the hit on its frame.
  function start(cls, kind, opts = {}) {
    const e = entry(cls, kind);
    const segs = segments(cls, kind, opts);
    return {
      id: `${slug(cls)}.${kind}`, cls: slug(cls), kind, clip: e.clip, art: e.art,
      segs, total: segs[0] + segs[1] + segs[2],
      f: 0, stop: 0, hit: 0, contacted: false, done: false,
    };
  }

  // Advance by dt seconds. Returns 'contact' on the one tick the move reaches
  // its first active frame (even if a long frame skips straight past it),
  // otherwise null. mv.done turns true once recovery ends.
  function tick(mv, dt) {
    if (!mv || mv.done) return null;
    let adv = Math.max(0, dt) * fps;
    if (mv.stop > 0) {
      const used = Math.min(mv.stop, adv);
      mv.stop -= used; adv -= used;
      // 0.06 s * 60 is 3.5999999999999996, not 3.6: without the snap a residue
      // leaves the move "frozen" by a trillionth of a frame.
      if (mv.stop < 1e-6) mv.stop = 0;
      if (adv < 1e-9) adv = 0;
    }
    mv.f += adv;
    let ev = null;
    if (!mv.contacted && mv.f >= mv.segs[0] && (adv > 0 || mv.segs[0] === 0)) {
      mv.contacted = true; ev = 'contact';
    }
    if (mv.f >= mv.total) { mv.f = mv.total; mv.done = true; }
    return ev;
  }

  // Freeze a move for the impact hit-stop (default: impact.hitstopMs).
  function hitstop(mv, ms) {
    if (!mv || mv.done) return;
    const fr = ms == null ? hitstopFrames : ms * fps / 1000;
    mv.stop = Math.max(mv.stop, fr);
  }

  // Where a move is right now.
  function phase(mv) {
    if (!mv) return null;
    const [su, ac] = mv.segs;
    let ph, k, i;
    if (mv.done) { ph = 'done'; k = 1; i = 2; }
    else if (mv.f < su) { ph = 'startup'; k = su ? mv.f / su : 1; i = 0; }
    else if (mv.f < su + ac) { ph = 'active'; k = (mv.f - su) / ac; i = 1; }
    else { ph = 'recovery'; const rc = mv.segs[2]; k = rc ? (mv.f - su - ac) / rc : 1; i = 2; }
    const frames = mv.art[PHASES[i]];
    const art = frames[Math.min(frames.length - 1, Math.floor(k * frames.length))];
    return {
      id: mv.id, kind: mv.kind, clip: mv.clip, ph, f: mv.f, k, total: mv.total,
      live: ph === 'active', hit: !!mv.hit, frozen: mv.stop > 0, art,
    };
  }

  // Playback for the clips with no contact (idle, move, flinch, ...).
  function loop(clip) {
    const l = data.loops && data.loops[clip];
    if (!l) throw new Error(`move timing: no loop entry for "${clip}"`);
    return l;
  }

  return { start, tick, phase, hitstop, segments, length, contactAt, loop, entry, data };
}

export async function loadTiming(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`move timing: ${url} returned ${r.status}`);
  return createTiming(await r.json());
}
