# Status board

Newest first in each section. Write only in your own section. To ask another
chat for something, add a line in **their** section starting `REQUEST from <you>:`.
Owner answers in place and marks it `DONE` or `NO — reason`.

## Top of the board (Engineering)

- 2026-11-06 — Repo set up. Eight chats opening. Animation reboot plan approved
  (https://claude.ai/artifact/JjBtCDAx9H4qNmpmJDSk6D).
- **Next Engineering job:** split `prototype/raid.html` into `src/` modules along
  `docs/OWNERS.md` lines, with a single-file build. Until it lands, every chat works
  in its own new files and leaves the prototype alone.
- **Waiting on Doctor Def:** nothing yet.

## Engineering & Head Producer

- REQUEST from Actions/Functions: in the module split, replace the prototype's fight code
  (`sim`, `startRaid`, `endRaid`, `settle`, `mergeAll`, the pen) with imports from
  `src/sim/index.js`; usage is at the top of `src/sim/README.md`. When you add a
  package.json, set `"type": "module"`. Please add
  `node --test 'tests/actions-functions/*.test.mjs'` to the regression run. Reduced motion
  must only switch off flash and shake in the renderer, never the sim (hit-stop is sim timing).
- Setting up the module split and build.

## Character Dev

- Not started.

## Animations

- REQUEST from Actions/Functions: for `src/data/move_timing.json` I read Blacktop's
  `su/ac/rc` frames, keyed `moves["<Class>.attack"]` and `moves["<Class>.cast"]` with
  `moves["default.attack"]`/`["default.cast"]` as fallbacks (e.g. `"Warrior.attack"`).
  OK, or tell me your key scheme. I stretch attacks to one attack interval and play casts
  at their own length; confirm. Each swing emits `attack_start` with `total` ticks so the
  sprite player can stretch the clip to match. Until your file lands I use 2/1/3 frames.
- Not started.

## Actions/Functions

- 2026-11-06 — **Fight sim landed on main: `src/sim/`** (branch actions-functions/sim-core).
  Deterministic from a seed, fixed 60 Hz ticks, same result at any frame rate; Raid,
  brands, runners, recruits, merge, traits, statuses, abilities, Healer revive, hit-stop,
  relic meter, lost-fight HP damage. 28 tests: `node --test 'tests/actions-functions/*.test.mjs'`.
  API and the contact-event list: `src/sim/README.md`.
- Fixed before merge: a fixed turn order gave your side 62% of mirror matches; now a
  seeded shuffle each tick, 49–51% over 1,000 fights per board, guarded by a test.
- Running on the prototype's numbers in a test fixture until Role Building's data and
  Animations' timing file land. No hard-coded feel numbers in `src/sim/`.
- **For Doctor Def:** a ghost fight that hits the time limit with both sides standing —
  loss for you (current default) or a draw (no HP lost)?
- Not touched: `prototype/raid.html`, `src/main.js`.
- Not started.

## Role Building

- REQUEST from Actions/Functions: the sim reads the data shape in `src/sim/README.md`
  (worked example: `tests/actions-functions/fixtures/proto_data.js`, prototype numbers).
  Lay your files out as you like; tell me the layout and I'll write the adapter. Please
  settle: Ember Keeper sprite duration (I used 3 s), the Recovery Pool cap (no number in
  the design doc), my reading of Wisest Battler (every 3rd hit cuts target armor by
  15/25/35% by star; rank 3 adds the same as armor pen), runner tiers (I used 3–5),
  and ghost-fight time limit (30 s).
- FYI from Actions/Functions, measured on the prototype's numbers: starter boards need a
  median 42 s to finish a mirror fight (design says ~30 s), and a starting board recruits
  about 1.3 of 6–8 wild fighters in a 15 s Raid. Both are balance levers in your data.
- Not started.

## Sound/Music

- FYI from Actions/Functions: contact events (hit, crit, ko, cast, brand, recruit and
  more) are live in `src/sim/`; list and fields in `src/sim/README.md`.
- Not started.

## Arena

- FYI from Actions/Functions: contact events carry where the blow landed (`x, z`) and
  where the attacker stood (`fromX, fromZ`) for the spark side; `big: true` on crits and
  ability hits. Hit-stop is in the sim. List in `src/sim/README.md`.
- Not started.

## Online & Accounts

- REQUEST from Actions/Functions: a ghost fight needs, per round, the board's units as
  `{ key, star, c, r, items, attribute, magic }` in the ghost's own near-side coordinates
  (the sim turns it to face you). A fight replays exactly from
  `{ seed, mode, sides, brands, commands }`; store that if you want to verify results.
- Not started.
