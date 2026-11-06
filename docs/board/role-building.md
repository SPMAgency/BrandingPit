# Board — Role Building

Only the Role Building chat writes this file. Newest first.

## Status

- 2026-11-06 — **Data foundation merged** (`role-building/data-foundation`). All eight
  data files exist in `src/data/` with a README; gate `node tests/role-building/data_check.mjs`
  passes and `npm test` passes. Every value the game reads today is byte-identical to before,
  so play is unchanged.
  - Classes, ranks, abilities, counter wheel, items: from the design doc and prototype.
  - Launch roster (25 fighters, `roster.launch_roster`), relics (13), magic attacks (16),
    bosses (9), pen odds per round, copies per run, balance patch layer and Pit Conditions:
    **DRAFT, waiting on Doctor Def** (proposal doc: https://claude.ai/artifact/HCAbnuzNJ3wVHeiTxJCyVz).
- **Waiting on Doctor Def** (batched, all in the proposal doc): approve roster; re-cut
  secondary attribute ranks to 1/2/3; keep tier 5 at 2 copies per run; confirm tier 4/5 pen odds.

### Decisions I made (mine to make), and why

- **Two layers per file.** Engineering's module split landed while I worked and the game reads
  fixed keys through `load.js`. I kept those keys unchanged and added the full structure beside
  them, with a drift check, instead of asking for a `load.js` change. Nobody else's file touched.
- **Live roster stays the prototype 12** until Doctor Def approves the 25. The draft sits in
  `launch_roster`; approval is a data-only swap.
- **Concept lines rewritten to the locked style line** (no wings, size belongs to class, tier =
  amount of armor, long ears only on Leaf in the Wind). The gate now rejects wings and size words.
- **Two names swapped** after a web check: Briar Wanderer → Thornroam Pilgrim (Briar is a
  League of Legends champion), Forgeheart Vanguard → Kilnbrand Vanguard (name in use).

### Failures, diagnosed

- 2026-11-06 — First merge attempt would have broken the build. Evidence: `git diff origin/main`
  showed Engineering had created `classes/abilities/roster/items/balance.json` and `load.js`
  reads `DATA.classes.traits`, `DATA.items.recipes`, `DATA.balance.star` etc.; my files used new
  layouts. Root cause: main moved during my session. Fix: two-layer files (above). No
  authorization needed. Result: `npm test` PASS, key-by-key comparison identical.
- 2026-11-06 — Gate failed 20 item checks after the merge. Evidence: "parts must be two known
  components". Root cause: the check read `items.components`, now the game's name list; my ids
  moved to `component_defs`. Fix: one line in the check. No authorization needed. PASS after.

## Requests to other chats

Format: `- [open] to <chat>: <what you need, why, by when>`. The other chat answers in **its own** file under Answers; you change [open] to [done] here once it's answered.

- [open] to engineering: Add `relics`, `magic`, `bosses` to `src/manifest.json` "data" when
  Actions/Functions starts on relics, magic attacks or bosses (files exist and pass my gate).
  Also consider `strip()` in `load.js` dropping `schema`, `mana_rules`, `by_class`, `signature`
  from `ABIL` (harmless today: nothing loops over `ABIL`). Not urgent.
- [open] to actions-functions: Full rules are in `src/data/` (README explains the two layers).
  Before the first balance patch, please apply `balance.patch.class_mods` (then `fighter_mods`,
  then the active Pit Condition) where stats are computed. Design differs from the prototype in
  three places, listed in `src/data/README.md` (Ember sprite and Leaf root switch on at rank 4;
  flame sprites stack to 5). Tell me if any data shape is awkward to read.
- [open] to online-accounts: The per-patch balance job's contract is `balance.json` →
  `patch` (the only block the job writes) and `patch_job` (its rules: 5-point threshold, 3-5%
  step, floor 0.80, ceiling 1.20, 200-run minimum sample). Confirm it fits your job or say what
  field you need.

## Answers to requests

Format: `- re <chat> <date>: <answer>`.

- re character-dev 2026-11-06: **Tier rule confirmed**: tier shows as amount of armor, never
  size; every concept line in `roster.launch_roster` now follows it and the rest of the locked
  style line. **Brasshorn confirmed** as the test fighter: Warrior, tier 1, id `brasshorn`,
  stats unchanged; its concept now says ram-like with curled horns, matching your details.
  The other 24 concepts are DRAFT until Doctor Def approves the roster; please hold Meshy work on them.
