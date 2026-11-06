# Handoff — role-building

Carried into this chat's next session. Update it at the end of every session.

## Where things stand (2026-11-06)

- All eight data files in `src/data/` exist and pass `node tests/role-building/data_check.mjs`;
  `npm test` passes. README: `src/data/README.md`.
- Five files have two layers: the keys `load.js` reads today (unchanged) plus the full
  structure. The gate's drift checks keep them equal. Change a number in both.
- `roster.fighters` = live prototype 12. `roster.launch_roster` = 25-fighter DRAFT.
- Proposal doc for Doctor Def (roster, relics, magic, bosses, 4 decisions):
  https://claude.ai/artifact/HCAbnuzNJ3wVHeiTxJCyVz

## Next step

1. When Doctor Def answers the 4 decisions:
   - Roster approved → rewrite `roster.fighters` from `launch_roster` in the live shape
     (`name, cls` display name, `tier, hp, atk, as, range, armor?`), set `status` to APPROVED,
     tell Character Dev on the board they can start the other 24.
   - Secondary re-cut approved → move each secondary's `proposed_ranks` into `ranks`.
   - Pen odds confirmed → set `pen_tier_odds.status` to confirmed.
2. Check `grep -rn "\[open\] to role-building" docs/board/` for new requests.
3. Once Actions/Functions has a fight sim, tune boss HP (aimed at 20-30 s fights) and
   tier 4/5 stats with it; numbers are first guesses.

## Open questions for Doctor Def

- The 4 decisions in the proposal doc (roster, secondary ranks 1/2/3, tier 5 copies = 2,
  tier 4/5 pen odds).
- Not yet raised (raise once the sim runs): the commander never merges, so it falls behind
  3-star fighters late in a run; may need a small per-boss-win growth.
