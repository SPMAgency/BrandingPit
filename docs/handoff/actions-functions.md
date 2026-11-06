# Handoff — actions-functions

Carried into this chat's next session. Update it at the end of every session.

## Where things stand (2026-11-06)

- `src/sim/engine.js` on main: the whole fight as one plain script, global `PitSim`.
  Deterministic (fixed 60 Hz ticks, seeded rng, seeded turn-order shuffle each tick).
  Uses Animations' `MoveTiming` (`src/anim/timing.js`) and the real `src/data/*.json`
  via `PitSim.fromGameData(DATA, PIT_PROTOTYPE_RULES)`.
- Reads Role Building's full data layer and the patch layer (class mods, fighter mods,
  Pit Condition). `src/sim/prototype_rules.js` holds the 14 settings their files lack
  (26 values incl. the timing fallback); `data._fromRules` lists them; `checkData()`
  names any missing number.
- `src/sim/README.md`: API, contact events, data keys.
- Tests: `node --test 'tests/actions-functions/*.test.mjs'` (34 pass; loader
  `load_sim.mjs` runs the scripts in one scope like the build). `npm test` smoke green.
- **Not yet live**: the game still runs the prototype fight code in my
  `actors.js / combat.js / phases.js / pen.js / hex.js`. Engine waits on Engineering's
  manifest request.
- Lessons: fixed update order biases mirror matches (62%); alternating 58%; shuffle 50%.
  Check `main` before merging: the board and build changed under me mid-session.

## Next step

1. When Engineering wires the manifest: switch the live fight to PitSim inside my five
   files. Keep `sim(dt)`, `startRaid`, `endRaid`, `settle`, `mergeAll`, `genPen`, `live`
   callable for main.js; map actors to the fields the renderers read (`team`, `x`, `z`,
   `flash`, `lunge`, `hp`, `max`, `shield`, `mana`, `maxMana`, `stun`, `branded`,
   `runner`, `fleeing`, `knock`) and turn events into the existing floatAt/puff/ring calls.
   Gate: `npm test` smoke + my tests + a side-by-side Raid in the browser.
2. When Role Building adds the 14 settings to balance.json, map their names in
   `fromGameData`; delete prototype_rules.js when `_fromRules` is empty.
3. Then: relic effects on the meter (needs relics.json), Mage trait, knockback, the
   commander's magic attack from magic.json.

## Open questions for Doctor Def

- Ghost fight hits the time limit with both sides standing: loss (current) or draw?

## Requests out (in docs/board/actions-functions.md)

- Engineering: manifest wiring + add my tests to npm test; reduced motion stays out of the sim.
- Animations: confirm how I read the timing runtime.
- Role Building: home for 14 settings (incl. a ghost-fight time limit). Their patch request: DONE.
- Online & Accounts: ghost unit fields, replay log. Sound/Music, Arena: event contract FYI.
