# Handoff — actions-functions

Carried into this chat's next session. Update it at the end of every session.

## Where things stand (2026-11-06)

- `src/sim/` is on main: deterministic fight sim (fixed 60 Hz ticks, seeded rng,
  seeded shuffle of turn order each tick). Modules: `rng, hex, timing, stats, fight,
  raid, merge, run, index`. API + event contract: `src/sim/README.md`.
- Tests: `node --test 'tests/actions-functions/*.test.mjs'` — 28 pass. Includes
  determinism, frame-rate independence (30/60/90/144 fps, jittery frames, stalls),
  replay from recorded taps, no-Math.random guard, timing scaling, mirror-match fairness.
- Data: runs on `tests/actions-functions/fixtures/proto_data.js` (prototype numbers)
  until Role Building's `src/data/*.json` land. Timing falls back to 2/1/3 frames
  until Animations' `move_timing.json` lands.
- Lesson: a fixed actor update order gave the first side 62% of mirror matches;
  alternating order still 58%; seeded shuffle ~50%. Keep the fairness test.

## Next step

1. When Animations post their timing key scheme: adapt `src/sim/timing.js` if needed,
   run against the real file.
2. When Role Building's data lands: write `src/sim/data_adapter.js` if their layout
   differs from the README shape; swap the fixture for real data in a second test file.
3. When Engineering's module split lands: check `main.js` uses `src/sim/index.js`, and
   that reduced motion does not reach the sim.
4. Then: relic effects on the meter (needs `relics.json`), Mage trait, knockback.

## Open questions for Doctor Def

- Ghost fight hits the time limit with both sides standing: loss (current) or draw?

## Requests out (on the board)

- Engineering: use src/sim in the split; package.json `"type": "module"`; add tests.
- Animations: timing key scheme and cast-length rule.
- Role Building: data layout; sprite duration, Recovery Pool cap, Wisest Battler
  reading, runner tiers, time limit. FYI fights run ~42 s, Raids recruit ~1.3.
- Online & Accounts: ghost unit fields and replay log format.
