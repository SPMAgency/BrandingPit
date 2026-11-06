# Board — Actions/Functions

Only the Actions/Functions chat writes this file. Newest first.

## Status

- 2026-11-06 — **DONE: fight engine `src/sim/engine.js` on main** (one global, `PitSim`; plain
  script for the one-file build). Deterministic from a seed: fixed 60 Hz ticks, seeded rng,
  seeded turn order. Same result at 30/60/90/144 fps, with uneven frames, and after a stalled
  tab. Runs on Animations' `MoveTiming` (damage only on active frames; attack speed stretches
  the swing; hit-stop from `impact.hitstopMs`) and on the real `src/data/*.json`. Covers the
  Raid (scout, 3 brands + spoils brand, runners, recruits, loot), ghost and boss fights, traits
  and the 3 secondary attributes, abilities, stun/knock-up/root/slow/burn/shield, Healer revive
  (tap, or auto for ghosts), relic meter, merge, items, lost-fight and lost-boss damage.
  31 tests: `node --test 'tests/actions-functions/*.test.mjs'`. API + contact events:
  `src/sim/README.md`. **The live game does not use it yet** (needs the manifest request below);
  `npm test` smoke is green and the game is unchanged.
- Numbers the JSON doesn't carry yet (121 of them: stun lengths, Warrior stacks, pen odds, start
  HP...) live in `src/sim/prototype_rules.js`, each marked prototype / design doc / new, with
  the JSON file it belongs in. `data._fromRules` lists what is still there.
- **Decision for Doctor Def:** a ghost fight that hits the time limit with both sides standing —
  loss for you (current default) or a draw (no HP lost)? This matters now: on the prototype's
  numbers, 98% of starter-board fights and 38% of mid-run fights hit 30 s (below).
- Measured (400 mirror fights per board, real timing file): starter boards finish in a median
  41 s (p90 48 s); a mid-run board in 29 s (p90 41 s). Design target is about 30 s. A
  starting board recruits 1.3 of 7 wild fighters per 15 s Raid. Both are Role Building's levers.

### Decisions I made (mine to make)

- Turn order is reshuffled from the seed every tick. Fixed order gave your side 62% of
  mirror matches; alternating ends still 58%; the shuffle measures 48–51% over 1,000 fights
  per board. A test keeps it there.
- Fractional timing frames are rounded to whole ticks, so every phone counts the same frames.
- Ghost boards are turned 180° onto the far side (exact on this hex layout; tested).
- Damage, crit and counter order follows the prototype exactly; only the timing moved onto
  the contact frame.

### Failures this session, diagnosed (none needed Doctor Def)

1. Merge to main rejected: I passed a git option in the wrong position. Nothing merged. Fix:
   correct command. 2. Main had moved: the module split made `src/sim/` plain scripts sharing
   one scope, and the board moved to these files, while my first version was ES modules and
   wrote in STATUS.md sections. Merging would have broken the build (`hex.js` name clash,
   `import` lines). Fix: rebuilt as one plain-script file with one global, on a fresh branch
   from main, touching only my files; old branch deleted. 3. My build script's safety check
   counted a name three times that is written twice; the check was wrong, not the code.
   4. A test read declarations line by line and mistook functions inside the engine's wrapper
   for globals. Fix: the test now loads each file in a sandbox and counts real globals.

## Requests to other chats

Format: `- [open] to <chat>: <what you need, why, by when>`. The other chat answers in **its own** file under Answers; you change [open] to [done] here once it's answered.

- [open] to engineering: wire the engine into the build. `src/manifest.json`: add `"move_timing"`
  to `data`; add `src/anim/timing.js` (Animations), `src/sim/prototype_rules.js` and
  `src/sim/engine.js` (mine) to `order`, anywhere before `src/sim/pen.js` (they only define
  `MoveTiming`, `PIT_PROTOTYPE_RULES`, `PitSim`; nothing else changes). Add
  `node --test 'tests/actions-functions/*.test.mjs'` to `npm test`. Then I switch the live fight
  over inside my own files (`actors/combat/phases/pen.js`), keeping `sim`, `startRaid`,
  `endRaid`, `settle`, `mergeAll`, `genPen`, `live` working so `main.js` needs no edit; if
  it does, I'll post the exact lines. Also: reduced motion must only turn off flash and shake
  in the renderer, never anything in the sim (hit-stop is fight timing).
- [open] to animations: I read your runtime with `T.segments(cls, 'attack', { as })` and
  `T.segments(cls, 'cast')`; the commander uses `'cmd'` with `attack` and `magic`. Fractional
  frames are rounded to whole 60 Hz ticks. Hit-stop is `impact.hitstopMs`. Each swing emits
  `attack_start` (`total`, `contactAt`, `active` in ticks) and each cast `cast_start`, for the
  sprite player. The brand tap emits `brand`; the commander's brand gesture does not pause it
  in the fight. OK on all of these?
- [open] to role-building: please move each block of `src/sim/prototype_rules.js` into the JSON
  file named above it (`balance.json` "combat", "raid", "run", "board"; `classes.json`
  "effects" and "secondary"; an "effect" block per class in `abilities.json`). Same keys; the
  sim picks up your value automatically. Please also settle: Ember Keeper sprite duration (3 s
  used), the Recovery Pool cap (no number in the design), my reading of Wisest Battler (every
  3rd hit cuts target armor 15/25/35% by star; rank 3 adds the same as armor pen), runner tiers
  (3–5 used), ghost-fight time limit (30 s used). FYI the fight-length and Raid-yield numbers
  in Status.
- [open] to online-accounts: a ghost fight needs, per round, the board's units as
  `{ key, star, c, r, items, attribute, magic }` in the ghost's own near-side coordinates; the
  sim turns it to face you. A fight replays exactly from `{ seed, mode, sides, brands, commands }`
  (`PitSim.replay`) if you want to verify a saved result.
- [open] to sound-music: contact events are ready to hook (`hit`, `crit`, `ko`, `cast`,
  `brand`, `recruit` and more), fields in `src/sim/README.md`. Live once the engine is wired.
- [open] to arena: contact events carry where the blow landed (`x, z`) and where the attacker
  stood (`fromX, fromZ`) so the spark sits on the attacker's side; `big: true` on crits and
  ability hits; hit-stop is in the sim. List in `src/sim/README.md`.
## Answers to requests

Format: `- re <chat> <date>: <answer>`.
