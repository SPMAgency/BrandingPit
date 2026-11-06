// The fight. One simulation for the Raid, ghost fights and boss fights.
//
// Determinism: the fight advances in fixed 1/60 s ticks, all time is counted in
// whole ticks, randomness comes only from the seeded rng, and actors update in a
// fixed order. Same seed + same boards + same commands = the same fight on every
// phone, at any frame rate. Rendering reads the state; it never writes it.
//
// Every feel number is read from `data` (Role Building's files) or `timing`
// (Animations' move_timing.json). Nothing tunable is written in this file.

import { createRng } from './rng.js';
import { hexDist, neighbors, cellWorld, rotate180, cellKey } from './hex.js';
import { createTiming } from './timing.js';
import { computeStats, traitRanks } from './stats.js';

export const TICK_HZ = 60;
export const TICK = 1 / TICK_HZ;
const ticks = (sec) => Math.max(0, Math.round(sec * TICK_HZ));
const at = (arr, k, dflt = 0) => (arr && k >= 0 && k < arr.length ? arr[k] : dflt);

/**
 * createFight(config)
 *   mode:    'raid' | 'ghost' | 'boss'
 *   seed:    any string or number
 *   data:    the assembled game data (see src/sim/README.md)
 *   timing:  parsed src/data/move_timing.json, or null until it lands
 *   sides:   [{ id:'you', units:[...], reviveMode:'manual'|'auto' },
 *             { id:'foe'|'pen'|'boss', units:[...], rotate:true, traits:false, ... }]
 *   brands:  extra brands this Raid (ghost-spoils sacrifice), default 0
 */
export function createFight(config) {
  const { data } = config;
  const cb = data.combat;
  const board = data.board;
  const rng = createRng(config.seed);
  const timing = createTiming(config.timing, data.timingFallback);
  const mode = config.mode || 'ghost';

  const F = {
    mode, seed: config.seed, tick: 0, phase: 'fight', over: false, result: null,
    actors: [], shots: [], events: [], commands: [], acc: 0,
    occ: new Map(), rng, timing, data, board,
    brandsLeft: 0, meter: { pool: 0, dealt: 0, fired: 0 },
    sides: {},
  };

  if (mode === 'raid') {
    F.phase = 'scout';
    F.scoutLeft = ticks(data.raid.scoutSeconds);
    F.raidTicks = ticks(data.raid.seconds);
    F.brandsLeft = data.raid.brands + (config.brands || 0);
  } else {
    F.raidTicks = ticks(cb.timeLimitSec);
  }
  F.endTick = (F.scoutLeft || 0) + F.raidTicks;

  for (const s of config.sides) {
    const side = {
      id: s.id, traits: s.traits !== false, stars: s.stars !== false,
      scale: s.scale || null, runners: !!s.runners, recruitable: !!s.recruitable,
      reviveMode: s.reviveMode || 'auto', revivesLeft: 0, ranks: {},
    };
    side.ranks = side.traits ? traitRanks(data, s.units) : {};
    const healer = data.classes.Healer;
    if (healer && side.ranks.Healer >= 0) side.revivesLeft = healer.revivesPerFight;
    F.sides[s.id] = side;
    for (const u of s.units) {
      let { c, r } = u;
      if (s.rotate) ({ c, r } = rotate180(c, r, board.cols, board.rows));
      addActor(F, u, side, c, r);
    }
  }
  F.meter.pool = F.actors.reduce((t, a) => t + a.max, 0);
  return F;
}

function addActor(F, u, side, c, r) {
  const st = computeStats(F.data, u, side, side.ranks);
  if (F.occ.has(cellKey(c, r))) throw new Error(`Two units on cell ${c},${r}`);
  const cb = F.data.combat;
  const a = Object.assign({
    id: F.actors.length, uid: u.uid ?? null, key: u.key, star: u.star || 1, side: side.id,
    isCmd: u.key === 'cmd', items: (u.items || []).slice(), loot: u.loot || null,
    c, r, from: null, moveT: 0, moveLen: 0,
    hp: 0, ko: false, gone: false, koTick: -1, branded: false, fleeing: false,
    fleeTick: -1, target: null, retarget: 0,
    ready: ticks(F.rng.range(cb.firstAttackSec[0], cb.firstAttackSec[1])),
    action: null, freeze: 0, stun: 0, root: 0, slow: 0, knock: 0,
    shield: 0, shieldT: 0, sprites: [], hits: 0, wstack: 0, armorMult: 1, dmgDone: 0,
  }, st);
  a.hp = a.max;
  if (a.runner && F.mode === 'raid') {
    const [lo, hi] = F.data.raid.runnerFleeSec;
    a.fleeTick = (F.scoutLeft || 0) + ticks(F.rng.range(lo, hi));
  }
  F.actors.push(a);
  F.occ.set(cellKey(c, r), a);
  return a;
}

const live = (a) => !a.ko && !a.gone;

export function actorPos(a) {
  const to = cellWorld(a.c, a.r);
  if (!a.from || a.moveT >= a.moveLen) return to;
  const fr = cellWorld(a.from.c, a.from.r);
  const k = a.moveT / a.moveLen;
  return { x: fr.x + (to.x - fr.x) * k, z: fr.z + (to.z - fr.z) * k };
}

function emit(F, type, o) {
  F.events.push(Object.assign({ t: F.tick, type }, o));
}

// The contact event every other chat hooks into: where the blow landed, where it
// came from (so the spark sits on the attacker's side), and who threw it.
function contact(F, type, src, tgt, extra) {
  const at = actorPos(tgt);
  const from = src ? actorPos(src) : at;
  emit(F, type, Object.assign({
    src: src ? src.id : null, tgt: tgt.id, side: src ? src.side : null, tgtSide: tgt.side,
    x: at.x, z: at.z, fromX: from.x, fromZ: from.z,
  }, extra));
}

/* ---------------- commands (player input) ---------------- */

// Inputs are stamped with the tick they apply on, so a fight can be replayed
// exactly from seed + boards + command list.
export function command(F, cmd) {
  const c = Object.assign({ t: F.tick }, cmd);
  F.commands.push(c);
  return c;
}

function applyCommand(F, c) {
  if (c.type === 'brand') {
    const a = F.actors[c.actor];
    if (F.mode !== 'raid' || !a || !live(a) || a.side === 'you') return reject(F, c, 'not a wild fighter');
    if (a.branded) return reject(F, c, 'already branded');
    if (F.brandsLeft <= 0) return reject(F, c, 'no brands left');
    a.branded = true; F.brandsLeft--;
    for (const o of F.actors) if (o.side === 'you') o.retarget = 0;
    contact(F, 'brand', null, a, { brandsLeft: F.brandsLeft });
  } else if (c.type === 'revive') {
    const a = F.actors[c.actor];
    if (!a || !a.ko) return reject(F, c, 'not knocked out');
    if (!tryRevive(F, a)) return reject(F, c, 'revive not available');
  } else reject(F, c, 'unknown command');
}

function reject(F, c, why) { emit(F, 'rejected', { cmd: c.type, actor: c.actor, why }); }

/* ---------------- the tick ---------------- */

// Call once per rendered frame with real seconds elapsed. Runs as many whole
// ticks as that covers; the leftover carries to the next frame.
export function advance(F, dt, maxTicks = 30) {
  F.acc += dt;
  let n = 0;
  while (F.acc >= TICK && !F.over && n < maxTicks) { step(F); F.acc -= TICK; n++; }
  if (F.over) F.acc = 0;
  return n;
}

// Run to the end with no rendering (ghost matching, tests, balance jobs).
export function runToEnd(F, limit = 60 * 600) {
  while (!F.over && F.tick < limit) step(F);
  return F.result;
}

export function step(F) {
  if (F.over) return;
  for (const c of F.commands) if (c.t === F.tick) applyCommand(F, c);

  if (F.phase === 'scout') {
    if (--F.scoutLeft <= 0) { F.phase = 'fight'; emit(F, 'phase', { phase: 'fight' }); }
    F.tick++;
    return;
  }

  autoRevive(F);
  // Seeded shuffle of the turn order every tick, so neither side always moves or
  // strikes first on a shared tick. Measured on mirror matches: a fixed order gave
  // your side 62%; alternating ends was still 58%; the shuffle is ~50%.
  const order = F.order || (F.order = F.actors.map((_, i) => i));
  if (order.length !== F.actors.length) { order.length = 0; F.actors.forEach((_, i) => order.push(i)); }
  F.rng.shuffle(order);
  for (const i of order) updateActor(F, F.actors[i]);
  updateShots(F);
  F.tick++;
  checkEnd(F);
}

function updateActor(F, a) {
  if (!live(a)) return;
  if (a.freeze > 0) { a.freeze--; return; }
  if (a.knock > 0) a.knock--;
  tickSprites(F, a);
  if (!live(a)) return;
  if (a.shieldT > 0 && --a.shieldT === 0) a.shield = 0;
  if (a.slow > 0) a.slow--;
  if (a.root > 0) a.root--;
  if (a.stun > 0) { a.stun--; a.action = null; return; }

  if (a.moveT < a.moveLen) { a.moveT++; if (a.moveT < a.moveLen) return; }
  if (a.ready > 0) a.ready--;
  if (a.retarget > 0) a.retarget--;

  if (a.action) { runAction(F, a); return; }

  if (a.runner && !a.fleeing && a.fleeTick >= 0 && F.tick >= a.fleeTick) {
    a.fleeing = true; contact(F, 'run', null, a, {});
  }
  if (a.fleeing) {
    if (a.root > 0) return;
    if (a.r === F.board.exitRow) {
      a.gone = true; F.occ.delete(cellKey(a.c, a.r));
      contact(F, 'escape', null, a, { key: a.key });
    } else stepToward(F, a, null, F.data.raid.runnerSpeed);
    return;
  }

  const brandedAlive = a.side === 'you' && F.actors.some((o) => o.branded && live(o));
  if (!a.target || !live(a.target) || a.retarget <= 0 || (brandedAlive && !a.target.branded)) {
    a.target = chooseTarget(F, a);
    a.retarget = ticks(F.data.combat.retargetSec);
  }
  const t = a.target;
  if (!t) return;
  const d = hexDist(a, t);

  if (a.ability && a.mana >= a.maxMana && (a.ability.anyRange || d <= a.range + 1)) {
    startCast(F, a, t);
    return;
  }
  if (d <= a.range) {
    if (a.ready <= 0) startAttack(F, a, t);
  } else if (a.root <= 0) {
    stepToward(F, a, t, F.data.combat.moveSpeed[a.side] ?? F.data.combat.moveSpeed.default);
  }
}

function chooseTarget(F, a) {
  let pool = F.actors.filter((o) => o.side !== a.side && live(o));
  if (!pool.length) return null;
  if (a.side === 'you') {
    const br = pool.filter((o) => o.branded);
    if (br.length) pool = br;
  }
  let best = null, bd = Infinity;
  for (const o of pool) { const d = hexDist(a, o); if (d < bd) { bd = d; best = o; } } // ties: lower id wins
  return best;
}

function moveTo(F, a, cell, speed) {
  F.occ.delete(cellKey(a.c, a.r));
  a.from = { c: a.c, r: a.r };
  a.c = cell.c; a.r = cell.r;
  F.occ.set(cellKey(cell.c, cell.r), a);
  a.moveT = 0; a.moveLen = Math.max(1, ticks(1 / speed));
}

function stepToward(F, a, goal, speed) {
  const flee = !goal;
  const here = flee ? a.r : hexDist(a, goal);
  const jitter = F.data.combat.pathJitter;
  const opts = neighbors(a.c, a.r, F.board.cols, F.board.rows)
    .filter((p) => !F.occ.has(cellKey(p.c, p.r)) && !(a.from && p.c === a.from.c && p.r === a.from.r))
    .map((p) => ({ p, raw: flee ? p.r : hexDist(p, goal), s: 0 }));
  if (!opts.length) return false;
  for (const o of opts) o.s = o.raw + F.rng.next() * jitter;
  opts.sort((x, y) => x.s - y.s);
  if (opts[0].raw > here) return false;
  moveTo(F, a, opts[0].p, speed);
  return true;
}

/* ---------------- attacks and casts on the timing track ---------------- */

function startAttack(F, a, t) {
  const slowF = a.slow > 0 ? a.slowFactor || 1 : 1;
  const tm = F.timing.attack(a.cls, a.as * slowF);
  a.action = { kind: 'attack', t: 0, tgt: t, done: false, ...tm };
  a.ready = tm.total; // the swing is the attack interval
  contact(F, 'attack_start', a, t, { cls: a.cls, total: tm.total, contactAt: tm.contact, active: tm.active, ranged: a.range > 1 });
}

function startCast(F, a, t) {
  const tm = F.timing.cast(a.cls);
  a.mana = 0;
  a.action = { kind: 'cast', t: 0, tgt: t, done: false, ...tm };
  contact(F, 'cast_start', a, t, { cls: a.cls, ability: a.ability.name || a.ability.kind, total: tm.total, contactAt: tm.contact });
}

function runAction(F, a) {
  const ac = a.action;
  const inWindow = ac.t >= ac.contact && ac.t < ac.contact + ac.active;
  if (!ac.done && ac.t < ac.contact && !live(ac.tgt) && ac.kind === 'attack') {
    a.action = null; a.ready = 0; return; // target gone during the wind-up: cancel, no hit
  }
  if (!ac.done && inWindow) {
    if (ac.kind === 'attack') {
      const t = ac.tgt;
      if (a.range > 1) {
        if (live(t)) { ac.done = true; gainMana(a, F.data.combat.manaPerAttack); a.hits++; launch(F, a, t, 'attack', () => onAttackHit(F, a, t)); }
      } else if (live(t) && hexDist(a, t) <= a.range) {
        ac.done = true; gainMana(a, F.data.combat.manaPerAttack); a.hits++; onAttackHit(F, a, t);
      }
    } else {
      ac.done = true;
      let t = ac.tgt;
      if (!live(t) && !(a.ability.kind === 'heal' || a.ability.kind === 'shield')) t = chooseTarget(F, a);
      castEffect(F, a, t);
    }
  }
  ac.t++;
  if (ac.t >= ac.total) a.action = null;
}

function gainMana(a, n) { if (a.maxMana) a.mana = Math.min(a.maxMana, a.mana + n); }

function launch(F, a, t, kind, onHit) {
  const speed = F.data.combat.projectileSpeed[kind];
  const flight = Math.max(1, ticks(hexDist(a, t) / speed));
  F.shots.push({ src: a.id, tgt: t.id, left: flight, onHit });
  contact(F, 'projectile', a, t, { kind, flight });
}

function updateShots(F) {
  for (let i = 0; i < F.shots.length; i++) {
    const s = F.shots[i];
    if (--s.left <= 0) {
      F.shots.splice(i--, 1);
      if (live(F.actors[s.tgt])) s.onHit();
    }
  }
}

/* ---------------- damage ---------------- */

function deal(F, src, tgt, amt, type, o = {}) {
  if (!live(tgt)) return 0;
  const cb = F.data.combat;
  let crit = false;
  if (src && o.canCrit && (o.forceCrit || F.rng.chance(src.crit))) { crit = true; amt *= src.critD; }
  if (src && src.cls && tgt.cls && F.data.counter.beats[src.cls] === tgt.cls) amt *= 1 + F.data.counter.bonus;
  if (type === 'phys') {
    const armor = Math.max(0, tgt.armor * tgt.armorMult * (1 - (src ? src.armorPen : 0)));
    amt *= cb.armorK / (cb.armorK + armor);
  } else if (type === 'magic') amt *= cb.armorK / (cb.armorK + tgt.mr);
  amt = Math.max(1, Math.round(amt));

  let rest = amt;
  if (tgt.shield > 0) { const ab = Math.min(tgt.shield, rest); tgt.shield -= ab; rest -= ab; }
  tgt.hp -= rest;
  if (tgt.maxMana) gainMana(tgt, Math.min(amt * cb.manaOnHitPct, cb.manaOnHitCap));
  if (src) src.dmgDone += amt;
  feedMeter(F, amt);

  const big = crit || !!o.ability;
  contact(F, crit ? 'crit' : 'hit', src, tgt, { amount: amt, dmgType: type, crit, big, ability: !!o.ability, source: o.source || 'attack' });
  if (big && src && F.data.impact.hitStopMs > 0) {
    const n = ticks(F.data.impact.hitStopMs / 1000);
    src.freeze = Math.max(src.freeze, n); tgt.freeze = Math.max(tgt.freeze, n);
  }
  if (tgt.hp <= 0) knockOut(F, tgt, src);
  return amt;
}

function heal(F, src, tgt, amt) {
  if (!live(tgt)) return;
  const h = Math.round(Math.min(amt, tgt.max - tgt.hp));
  if (h <= 0) return;
  tgt.hp += h;
  contact(F, 'heal', src, tgt, { amount: h });
}

function knockOut(F, t, src) {
  t.ko = true; t.hp = 0; t.koTick = F.tick; t.action = null; t.sprites = [];
  F.occ.delete(cellKey(t.c, t.r));
  contact(F, 'ko', src, t, { key: t.key, isCmd: t.isCmd });
  const side = F.sides[t.side];
  if (side.recruitable) {
    contact(F, 'recruit', src, t, { key: t.key });
    if (t.loot) contact(F, 'loot', src, t, { item: t.loot });
  }
}

function feedMeter(F, amt) {
  const m = F.meter;
  m.dealt += amt;
  const q = m.pool / 4;
  while (m.fired < 3 && m.dealt >= q * (m.fired + 1)) { m.fired++; emit(F, 'meter', { fill: m.fired }); }
}

function status(F, src, tgt, kind, ticksN, extra) {
  contact(F, 'status', src, tgt, Object.assign({ status: kind, ticks: ticksN }, extra));
}

function addSprite(F, src, tgt, pctPerSec, sec) {
  const EK = F.data.classes['Ember Keeper'];
  const cap = EK ? EK.maxSprites : 1;
  if (tgt.sprites.length >= cap) tgt.sprites.shift();
  tgt.sprites.push({ src: src ? src.id : null, left: ticks(sec), age: 0, dmg: tgt.max * pctPerSec });
  status(F, src, tgt, 'burn', ticks(sec), { sprites: tgt.sprites.length });
}

function tickSprites(F, a) {
  for (let i = 0; i < a.sprites.length && live(a); i++) {
    const s = a.sprites[i];
    s.age++;
    if (s.age % TICK_HZ === 0) deal(F, s.src != null ? F.actors[s.src] : null, a, s.dmg, 'magic', { source: 'burn' });
    if (--s.left <= 0) a.sprites.splice(i--, 1);
  }
}

function onAttackHit(F, a, t) {
  if (!live(t)) return;
  const C = F.data.classes, side = F.sides[a.side], ranks = side.ranks;
  let mult = 1;
  const W = C.Warrior;
  if (a.cls === 'Warrior' && ranks.Warrior >= 0) {
    mult += t.wstack;
    t.wstack = Math.min(at(W.stackCap, ranks.Warrior), t.wstack + W.stackPerHit);
  }
  const j = F.data.combat.jitter;
  deal(F, a, t, a.atk * mult * F.rng.range(1 - j, 1 + j), 'phys', { canCrit: true });
  if (!live(t)) return;

  const k = a.cls ? ranks[a.cls] : -1;
  if (a.cls === 'Judge Mark' && k >= 0 && F.rng.chance(at(C['Judge Mark'].slowChance, k))) {
    t.slow = ticks(C['Judge Mark'].slowSec); t.slowFactor = C['Judge Mark'].slowFactor;
    status(F, a, t, 'slow', t.slow);
  }
  if (a.cls === 'Ember Keeper' && k >= 0 && a.hits % C['Ember Keeper'].everyNth === 0) {
    const E = C['Ember Keeper'];
    addSprite(F, a, t, E.spritePctPerSec, E.spriteSec);
    const bonus = at(E.bonusHitPct, k);
    if (bonus > 0) deal(F, a, t, t.max * bonus, 'magic', { source: 'trait' });
  }
  if (a.cls === 'Gusting Shallow' && k >= 0 && a.hits % C['Gusting Shallow'].everyNth === 0) {
    stun(F, a, t, at(C['Gusting Shallow'].stunSec, k), true);
  }
  if (a.cls === 'Leaf in the Wind' && k >= 0 && F.rng.chance(at(C['Leaf in the Wind'].rootChance, k))) {
    root(F, a, t, C['Leaf in the Wind'].rootSec);
    blink(F, a, t);
  }
  // Tier 5 secondary attributes
  const sk = a.sec ? ranks[a.sec] : -1;
  if (a.sec === 'Wisest Battler' && a.hits % C['Wisest Battler'].decayEveryNth === 0) {
    t.armorMult *= 1 - at(C['Wisest Battler'].armorDecayByStar, a.star - 1);
    status(F, a, t, 'armor_down', 0, { armorMult: t.armorMult });
  }
  if (a.sec === 'Recovery Pool' && sk >= 0 && a.hits % at(C['Recovery Pool'].everyNth, sk, 1) === 0) {
    heal(F, a, a, a.atk * at(C['Recovery Pool'].lifeStealPct, sk));
  }
  if (a.sec === 'Magnetic Composition' && sk >= 0 && F.rng.chance(at(C['Magnetic Composition'].stunChance, sk))) {
    stun(F, a, t, C['Magnetic Composition'].stunSec ?? F.data.combat.stunSec, false);
  }
}

function stun(F, src, t, sec, knockup) {
  const n = ticks(sec);
  t.stun = Math.max(t.stun, n); t.action = null;
  if (knockup) t.knock = ticks(F.data.combat.knockupSec);
  status(F, src, t, knockup ? 'knockup' : 'stun', n);
}

function root(F, src, t, sec) {
  t.root = Math.max(t.root, ticks(sec));
  status(F, src, t, 'root', t.root);
}

// Step to the free hex behind the target (farthest from where we stand).
function blink(F, a, t) {
  const opts = neighbors(t.c, t.r, F.board.cols, F.board.rows).filter((p) => !F.occ.has(cellKey(p.c, p.r)));
  if (!opts.length) return;
  opts.sort((p, q) => hexDist(q, a) - hexDist(p, a) || p.c - q.c || p.r - q.r);
  const b = opts[0];
  F.occ.delete(cellKey(a.c, a.r));
  const from = actorPos(a);
  a.c = b.c; a.r = b.r; a.from = null; a.moveT = a.moveLen = 0;
  F.occ.set(cellKey(b.c, b.r), a);
  const to = actorPos(a);
  emit(F, 'blink', { src: a.id, side: a.side, fromX: from.x, fromZ: from.z, x: to.x, z: to.z });
}

function castEffect(F, a, t) {
  const ab = a.ability, p = a.ap;
  contact(F, 'cast', a, t || a, { cls: a.cls, ability: ab.name || ab.kind, kind: ab.kind });
  if (ab.kind === 'heal') {
    const allies = F.actors.filter((o) => o.side === a.side && live(o)).sort((x, y) => x.hp / x.max - y.hp / y.max || x.id - y.id);
    if (allies[0]) heal(F, a, allies[0], (a.atk * ab.mult + (ab.flat || 0)) * p);
    return;
  }
  if (ab.kind === 'shield') {
    a.shield = a.max * ab.pct * p; a.shieldT = ticks(ab.sec);
    status(F, a, a, 'shield', a.shieldT, { amount: Math.round(a.shield) });
    return;
  }
  if (!t || !live(t)) return;
  const type = ab.dmgType || 'phys';
  const opt = { canCrit: !!ab.canCrit, forceCrit: !!ab.forceCrit, ability: true, source: 'ability' };
  if (ab.kind === 'cleave') {
    const hitList = [t, ...F.actors.filter((o) => o.side === t.side && live(o) && o !== t && hexDist(o, t) <= (ab.radius || 1))];
    for (const o of hitList) deal(F, a, o, a.atk * ab.mult * p, type, opt);
    return;
  }
  // 'strike': one target, with optional riders
  const land = () => {
    if (!live(t)) return;
    if (ab.blink) blink(F, a, t);
    if (ab.rootSec) root(F, a, t, ab.rootSec);
    if (ab.stunSec) stun(F, a, t, ab.stunSec, !!ab.knockup);
    deal(F, a, t, a.atk * ab.mult * p, type, opt);
    if (ab.burnSec && live(t)) {
      const E = F.data.classes['Ember Keeper'];
      addSprite(F, a, t, ab.burnPctPerSec ?? E.spritePctPerSec, ab.burnSec);
    }
  };
  if (ab.projectile) launch(F, a, t, 'ability', land); else land();
}

/* ---------------- Healer revive ---------------- */

function tryRevive(F, a) {
  const side = F.sides[a.side];
  if (!side || side.revivesLeft <= 0 || !a.ko) return false;
  const H = F.data.classes.Healer, k = side.ranks.Healer;
  const pct = a.isCmd ? at(H.commanderRevivePct, k) : at(H.unitRevivePct, k);
  if (!(pct > 0)) return false;
  let cell = { c: a.c, r: a.r };
  if (F.occ.has(cellKey(cell.c, cell.r))) {
    cell = neighbors(a.c, a.r, F.board.cols, F.board.rows).find((p) => !F.occ.has(cellKey(p.c, p.r)));
    if (!cell) return false;
  }
  side.revivesLeft--;
  a.ko = false; a.hp = a.max * pct; a.c = cell.c; a.r = cell.r; a.from = null; a.moveT = a.moveLen = 0;
  a.stun = a.root = a.slow = a.freeze = 0; a.action = null; a.target = null;
  F.occ.set(cellKey(cell.c, cell.r), a);
  contact(F, 'revive', null, a, { pct, isCmd: a.isCmd });
  return true;
}

// Ghost and AI sides revive on their own: the commander first when the rank
// allows it, otherwise the knocked-out unit that has dealt the most damage.
function autoRevive(F) {
  const H = F.data.classes.Healer;
  if (!H) return;
  const delay = ticks(H.autoReviveDelaySec);
  for (const id in F.sides) {
    const side = F.sides[id];
    if (side.reviveMode !== 'auto' || side.revivesLeft <= 0) continue;
    const kos = F.actors.filter((a) => a.side === id && a.ko && !a.gone && F.tick - a.koTick >= delay);
    if (!kos.length) continue;
    const cmd = kos.find((a) => a.isCmd && at(H.commanderRevivePct, side.ranks.Healer) > 0);
    const pick = cmd || kos.filter((a) => !a.isCmd).sort((x, y) => y.dmgDone - x.dmgDone || x.id - y.id)[0];
    if (pick) tryRevive(F, pick);
  }
}

/* ---------------- end of fight ---------------- */

function checkEnd(F) {
  const ids = Object.keys(F.sides);
  const standing = (id) => F.actors.filter((a) => a.side === id && live(a));
  let winner = null, reason = null;
  if (F.mode === 'raid') {
    if (!standing('pen').length) reason = 'cleared';
    else if (!standing('you').length) reason = 'wiped';
    else if (F.tick >= F.endTick) reason = 'time';
    if (!reason) return;
    for (const a of F.actors) if (a.side === 'pen' && live(a)) {
      a.gone = true; F.occ.delete(cellKey(a.c, a.r)); contact(F, 'escape', null, a, { key: a.key, timeUp: true });
    }
  } else {
    const alive = ids.filter((id) => standing(id).length);
    if (alive.length === 1) { winner = alive[0]; reason = 'defeated'; }
    else if (!alive.length) reason = 'both';
    else if (F.tick >= F.endTick) reason = 'time';
    if (!reason) return;
  }
  F.over = true;
  F.result = summarize(F, winner, reason);
  emit(F, 'end', { winner, reason });
}

function summarize(F, winner, reason) {
  const ev = F.events;
  const survivors = {};
  for (const id in F.sides) {
    survivors[id] = F.actors.filter((a) => a.side === id && live(a)).map((a) => ({ id: a.id, uid: a.uid, key: a.key, isCmd: a.isCmd }));
  }
  return {
    mode: F.mode, seed: F.seed, ticks: F.tick, winner, reason, survivors,
    recruits: ev.filter((e) => e.type === 'recruit').map((e) => e.key),
    loot: ev.filter((e) => e.type === 'loot').map((e) => e.item),
    escaped: ev.filter((e) => e.type === 'escape').map((e) => e.key),
    brandsUsed: ev.filter((e) => e.type === 'brand').length,
    meterFills: F.meter.fired,
  };
}

/* ---------------- replay ---------------- */

// A replay is { seed, mode, sides, brands, commands }. Running it gives the
// identical fight: this is what a ghost board is checked against.
export function replay(data, timing, log) {
  const F = createFight({ data, timing, seed: log.seed, mode: log.mode, sides: log.sides, brands: log.brands });
  for (const c of log.commands || []) F.commands.push(Object.assign({}, c));
  runToEnd(F);
  return F;
}
