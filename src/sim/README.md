# src/sim — the fight (owner: Actions/Functions)

One deterministic simulation for the Raid, ghost fights and boss fights.
Same seed + same boards + same player taps = the same fight on every phone, at
any frame rate. Rendering, sound and effects **read** it; nothing outside this
folder writes to it.

Tests: `node --test 'tests/actions-functions/*.test.mjs'` (31 tests, about 3 s). Loader: `tests/actions-functions/load_sim.mjs`.

## Using it (for Engineering's main.js)

`src/sim/engine.js` is a plain script (one global, `PitSim`), like Animations'
`src/anim/timing.js`. Load order: `src/anim/timing.js`, `src/sim/prototype_rules.js`,
`src/sim/engine.js`, then anything that calls them.

```js
const SIMDATA = PitSim.fromGameData(DATA, PIT_PROTOTYPE_RULES);
const TIMING = MoveTiming.createTiming(DATA.move_timing);

const F = PitSim.createRaid({ data: SIMDATA, timing: TIMING, seed: runSeed, round, lure, board, copiesLeft, brands: extraBrands });
// every frame:
PitSim.advance(F, dtSeconds);      // runs whole 1/60 s ticks; leftover carries over
const fresh = F.events.slice(seen); seen = F.events.length;      // hand these to sound / fx / sprites
// player input:
PitSim.command(F, { type: 'brand', actor: a.id });    // Raid: tap a wild fighter
PitSim.command(F, { type: 'revive', actor: a.id });   // Healer: tap a knocked-out ally
// when F.over:
F.result   // { winner, reason, survivors, recruits, loot, escaped, brandsUsed, meterFills, ticks }
// after a ghost fight:
const { run, outcome, damage } = PitSim.applyGhostResult(SIMDATA, run, F.result);
```

- `data` comes from `PitSim.fromGameData`: Role Building's files win; values they don't
  carry yet come from `src/sim/prototype_rules.js` and are listed in `data._fromRules`.
- `timing` is Animations' `MoveTiming` instance, or `null` (then `data.timingFallback`).
- Positions: `actorPos(a)` gives world `{x, z}` (one hex = √3 wide, rows 1.5
  apart, the prototype's projection). `a.c, a.r` is the hex.
- Never call `Math.random` (or anything clock-based) from code that changes the
  fight. A test fails the build if `src/sim/` does.
- **Reduced motion must never change the sim.** Hit-stop lives in the sim (it
  changes timing, so it must be identical on every phone). Reduced motion turns
  off flash and shake in the renderer only.

## Contact events (for Sound/Music, Arena, Animations)

Every event: `{ t, type, ... }`, `t` = tick (60 per second). Events with a
target also carry `src, tgt, side, tgtSide, x, z, fromX, fromZ`:
`x, z` = where it landed, `fromX, fromZ` = where the attacker stood (put the
spark on that side), `side` = attacker's side (`you`, `foe`, `pen`, `boss`).

| type | when | extra fields |
|---|---|---|
| `attack_start` | a swing begins (start the attack clip) | `cls, total, contactAt, active, ranged` — ticks; clip length = `total` |
| `projectile` | a ranged attack or ability leaves, on the contact frame | `kind, flight` (ticks until it lands) |
| `hit` | damage lands | `amount, dmgType` (`phys`/`magic`/`true`), `big, ability, source` (`attack`/`ability`/`burn`/`trait`) |
| `crit` | as `hit`, a critical | same; `big: true` |
| `heal` | HP restored | `amount` |
| `cast_start` | ability wind-up begins (start the cast clip) | `cls, ability, total, contactAt` |
| `cast` | ability fires (its contact frame) | `cls, ability, kind` |
| `status` | stun, knockup, root, slow, burn, shield, armor_down applied | `status, ticks` |
| `ko` | a fighter is knocked out | `key, isCmd` |
| `revive` | Healer brings one back | `pct, isCmd` |
| `brand` | a wild fighter is branded | `brandsLeft` |
| `recruit` | a wild fighter is defeated and joins you | `key` |
| `loot` | it dropped an item component | `item` |
| `run` | a runner starts for the exit | — |
| `escape` | a wild fighter leaves (exit row, or time up) | `key, timeUp` |
| `blink` | a fighter steps behind its target | `src, side, fromX, fromZ, x, z` |
| `meter` | relic meter fills a quarter (max 3) | `fill` |
| `phase` | scout ends, the Raid starts | `phase` |
| `rejected` | a tap that did nothing | `cmd, actor, why` |
| `end` | fight over | `winner, reason` |

`big` hits (crits, ability hits) freeze both fighters for `impact.hitStopMs`.

## Move timing (from Animations)

Through Animations' runtime: `T.segments(cls, 'attack', { as })` and
`T.segments(cls, 'cast')`; the commander uses `'cmd'` with `attack` and `magic`.
Fractional frames are rounded to whole 60 Hz ticks. The swing fills `fill` of one
attack interval (1 / attack speed); damage lands only inside the active window, once.
Casts play at their own length. Slow lengthens the next swing, not the current one.
Hit-stop: `impact.hitstopMs` from the timing file.

## Data the sim reads (for Role Building)

`PitSim.fromGameData` maps your files into the keys below. What it reads today:
`balance.star/raid/slots`, `classes.traits/counter`, `abilities` (name, mana),
`roster.fighters/commander`, `items`. Everything else is in
`src/sim/prototype_rules.js`, one block per target file; move a block into your JSON
under the same keys (`balance.json` "board", "combat", "impact", "raid", "run";
`classes.json` "effects", "secondary"; `abilities.json` an "effect" per class) and
the sim takes yours.

| key | used for |
|---|---|
| `board` | `cols, rows, exitRow` |
| `combat` | crit, armor formula constant, default armor/MR, mana per attack and per hit, damage jitter, retarget time, first-attack delay, path jitter, move speed per side, projectile speed, stun and knock-up length, star multipliers, item slots, ghost-fight time limit |
| `impact.hitStopMs` | hit-stop on big hits |
| `raid` | seconds, scout seconds, brands, pen rows, runner row, pen size by round, pen odds by round (tier 1–5), runner tiers, flee window, runner speed and HP, loot chance, lure share, pen strength by round |
| `run` | start HP, loss per unit, loss per commander, boss-loss HP fraction, win target, bench and board size, what a timeout counts as |
| `counter` | `bonus`, `beats` (the wheel) |
| `classes` | per class / secondary attribute: `ranks` plus its effect arrays (indexed by rank) |
| `abilities` | per class: `mana, kind` (`strike`, `cleave`, `heal`, `shield`) and riders (`mult, dmgType, projectile, canCrit, forceCrit, stunSec, knockup, rootSec, blink, burnSec, pct, sec, flat, anyRange`) |
| `roster` | per fighter: `cls, secondary, tier, hp, atk, as, range, armor, mr` |
| `commander` | base stats; its magic attack comes in as `unit.magic` (same ability vocabulary) |
| `items` | `components`, `recipes`, `stats` |
| `timingFallback` | attack/cast frames until the timing file exists |

New magic attacks, abilities and bosses that fit the vocabulary above need no
code. Anything that doesn't: post the effect on the board and I add a `kind`.

## Not built yet

- Relics firing on the meter (meter fill events exist; relic effects wait for `relics.json`).
- Mage trait (boosts relics) — waits on relics.
- Knockback (design lists it as code); boss abilities beyond the shared vocabulary.
- The Recovery Pool "cap" (design says "up to a cap", no number given).
