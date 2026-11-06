# Move timing — the contract

Owner: **Animations**. Readers: Actions/Functions, Sound/Music, Arena. Readers
never edit the data; ask on the board in the Animations section.

Adapted from Blacktop Aether's `docs/MOVE_TIMING.md` (patch600). What changed
for an auto-battler is listed at the bottom.

## Where things live

| file | role |
|---|---|
| `src/data/move_timing.json` | the data: one entry per class attack and per class ability, plus the commander's attack, magic cast and brand |
| `src/anim/timing.js` | the runtime: a plain script defining one global, `MoveTiming`; pure functions, no DOM, safe in a headless fight or balance run |
| `tools/bake/load_timing.mjs` | loads the runtime into Node tools exactly as the browser build does |
| `assets/atlases/layout.json` | which baked frames each clip has; the art indices below point into it |
| `tools/timing_check.mjs` | the gate: `node tools/timing_check.mjs` |
| `tests/animations/timing.test.mjs` | `node --test tests/animations/*.test.mjs` |

## Units

Frames at 60 per second. `tick()` takes seconds and advances `dt * 60`, so a
variable frame rate is fine.

## One entry

```json
"warrior": {
  "class": "Warrior",
  "attack": {"clip": "attack", "su": 20, "ac": 6, "rc": 26,
             "art": {"startup": [0, 1], "active": [2], "recovery": [3, 4, 5]},
             "scale": "attack", "fill": 1.0, "contact": "unverified", "wired": 0},
  "cast":   {"clip": "cast", "ability": "Cleave", "su": 16, "ac": 6, "rc": 22, "...": "...",
             "scale": "fixed"}
}
```

| field | meaning |
|---|---|
| `su` | wind-up frames. Cannot connect. |
| `ac` | active frames, at least 1. The **only** frames a move connects on. The contact frame is held on screen for all of them. |
| `rc` | recovery frames. |
| `art` | which baked frames of `clip` show in each phase, spread evenly across it. Every frame of the clip, once, in order. |
| `scale` | `attack`: the whole entry fills one attack interval (below). `fixed`: plays at its authored length (casts, brand). |
| `fill` | fraction of the attack interval the swing occupies. 1.0 = back to back, the design rule. Lower leaves the guard pose showing between swings. A slider. |
| `contact` | how the contact frame was chosen: `eye` (on a filmstrip) or `unverified`. |
| `wired` | 0 = data only, nothing in the game drives it yet. |

## The attack-speed rule

An attack lasts exactly `fill × 60 / attackSpeed` frames. All three phases
scale by the same factor, so **contact stays at the same fraction of the swing
at every attack speed**. A Warrior at 0.7 attacks/s swings for 1.43 s and hits
at 38% (549 ms); at 1.4 attacks/s the same clip plays twice as fast and still
hits at 38%. Attack speed is read when the swing starts; a slow applied
mid-swing takes effect from the next one.

Casts and the brand do not scale. Limits (checked): a cast is at most 1.0 s
and fires within 0.4 s.

## API

```js

// once Engineering adds it to src/manifest.json (data: move_timing; order: src/anim/timing.js before src/sim/)
const T = MoveTiming.createTiming(DATA.move_timing);

const mv = T.start(cls, kind, { as });        // cls: 'Warrior' | 'warrior' | 'cmd' ...
                                              // kind: 'attack' | 'cast' | 'magic' | 'brand'
                                              // as: attacks per second (attacks only)
T.tick(mv, dt)      // seconds -> 'contact' on the ONE tick the move reaches its first
                    // active frame (even if a long frame skips past it), else null
mv.done             // true once recovery ends
mv.hit = 1          // set when the hit lands
T.hitstop(mv, ms?)  // freeze the move; default impact.hitstopMs (60)
T.phase(mv)         // { id, kind, clip, ph, f, k, total, live, hit, frozen, art }
                    //   ph: 'startup' | 'active' | 'recovery' | 'done'
                    //   live: true only on active frames — the hit gate
                    //   art: the baked frame index to draw (for the sprite player)
T.segments(cls, kind, { as })  // [su, ac, rc] scaled, in frames
T.length(cls, kind, { as })    // total frames
T.contactAt(cls, kind, { as }) // seconds from start to contact
T.loop(clip)                   // playback for idle, move, flinch, knockout, victory
```

**Rule for the fight code:** resolve a hit once, on the `'contact'` return.

- Melee: deal damage on contact.
- Ranged (range > 1): the projectile leaves on contact; damage lands when it
  arrives.
- Ability: the effect fires on the cast's contact (a Leaf Step teleports
  there, a Bastion shield appears there).
- Brand: the sigil lands on the brand's contact.
- Crit or ability hit: call `T.hitstop()` on both fighters' moves.

### Fitting it to the prototype's loop

Today `prototype/raid.html` deals damage the instant the attack timer fires.
With the track, keep the timer exactly as it is and start a swing there:

```js
if (a.cd <= 0) {
  a.cd = 1 / (a.as * slowFactor);
  a.mv = T.start(a.cls || 'cmd', 'attack', { as: a.as * slowFactor });
}
if (a.mv && T.tick(a.mv, dt) === 'contact') onAttackHit(a, a.target);
if (a.mv?.done) a.mv = null;
```

Hit cadence is unchanged (one hit per interval); each hit simply lands 27–39%
of an interval later, on the frame where the blow visibly connects. What a
fighter does if its target is defeated mid-swing is Actions/Functions' call.

## What changed from Blacktop

| Blacktop | Here | why |
|---|---|---|
| per-character `tempo` on wind-up only | whole entry scales to the attack interval | attack speed is a stat, and items change it |
| one `art` frame per phase | a list per phase | 6-frame clips: 2 wind-up, 1 contact, 3 recovery |
| `cancel`, `commit`, `hold` | dropped | no player input during a fight |
| beats (multi-stage slams) | dropped for now | no slams in the clip list |
| data copied into two game files + drift check | one JSON, one runtime, the check imports the runtime | nothing to drift |
| Python check | Node check | it runs the game's own runtime, loaded the way the build loads it |

## Open

- Every contact frame is `unverified` until a filmstrip of a baked clip
  picks it by eye.
- `limits.attackSpeed` (0.4 to 3.0 attacks/s) is assumed; Role Building owns
  the real range.
