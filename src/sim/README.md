# src/sim — the fight (owner: Actions/Functions)

One deterministic simulation for the Raid, ghost fights and boss fights.
Same seed + same boards + same player taps = the same fight on every phone, at
any frame rate. Rendering, sound and effects **read** it; nothing outside this
folder writes to it.

Tests: `node --test 'tests/actions-functions/*.test.mjs'` (28 tests, under 2 s).

## Using it (for Engineering's main.js)

```js
import { createRaid, createGhostFight, advance, command, applyGhostResult } from './sim/index.js';

const F = createRaid({ data, timing, seed: runSeed, round, lure, board, copiesLeft, brands: extraBrands });
// every frame:
advance(F, dtSeconds);             // runs whole 1/60 s ticks; leftover carries over
const newEvents = F.events.slice(seen); seen = F.events.length;   // hand these to sound / fx / sprites
// player input:
command(F, { type: 'brand', actor: a.id });    // Raid: tap a wild fighter
command(F, { type: 'revive', actor: a.id });   // Healer: tap a knocked-out ally
// when F.over:
F.result   // { winner, reason, survivors, recruits, loot, escaped, brandsUsed, meterFills, ticks }
```

- `data` is the assembled game data (Role Building's files, shape below).
- `timing` is the parsed `src/data/move_timing.json`, or `null` until it lands
  (then `data.timingFallback` is used).
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

Read from `src/data/move_timing.json`, Blacktop's shape: frames at 60 fps,
`su` wind-up, `ac` active, `rc` recovery. Lookup per class:
`moves["<Class>.attack"]`, `moves["<Class>.cast"]`, then `moves["default.attack"]`
/ `["default.cast"]`. An attack's whole entry is stretched to one attack interval
(1 / attack speed); damage lands only inside the active window, once. Casts play
at their own length. Slow lengthens the next swing, not the current one.

## Data the sim reads (for Role Building)

Shape used by the tests in `tests/actions-functions/fixtures/proto_data.js`
(prototype numbers). Your files can be laid out however suits you; Engineering
assembles them into this object, or tell me your layout and I add an adapter.

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
