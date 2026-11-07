# Technical audit — every chat's work, by evidence, and the bug log

Engineering, 2026-11-07, at the hold (Doctor Def: on hold until Blacktop Aether
is published). Every "done" names its commit or test; nothing here is taken
from a board line alone. Re-run before resuming: `npm test` and the gates in
`docs/BUG_RUBRIC.md`.

## State of main at the hold

- **Last commit:** `2275ca3` (the hold notice). Last work commit `17ae118`
  (Actions/Functions, 2026-11-06 08:38 ET).
- **Gates on main, 2026-11-07:** build, 63 unit tests, timing, data, arena,
  boot smoke and the new sweep (6 Raids at 3 screen sizes, 0 errors, 0 NaN)
  all pass. The UI audit (new) reports 50 findings: bug B1.
- **What a player sees today:** the Raid prototype as of 2026-10-20, unchanged.
  Every chat's new work is merged but **not wired into the game yet**; wiring
  is the first job after the hold (CLOSEOUT.md, "Resume order").
- **Parked, not merged:** branch `engineering/short-screen-rows` (compact
  controls on short phones: stage 380-413 px to 448 px on 360 x 640; module
  support in the build). Merge it at resume, then re-run the gates.

## Each chat, by evidence

| Chat | Merged to main | Evidence | Open |
| --- | --- | --- | --- |
| Engineering | Repo, rules, per-chat board, owners, prompts; module split into 18 owned files; build; smoke | `fa9e40a`, `5f95ca6`, `903444c`; smoke 5/5 on build and prototype | Wire everyone's work into the build; B1; parked branch |
| Character Dev | Style line (LOCKED by Doctor Def); commander pieces (approved); class silhouettes; Brasshorn concept + textured model | `ecd7547`, `9cbd885`; `assets/source/brasshorn.json`; 44 of 51 approved credits, ledger on its board | Brasshorn remesh to ~8,000, rig, Mixamo export (all free); needs Chrome reopened on his computer |
| Animations | Move timing file, runtime, check, tests; Godot bake ported (3 directions, 96 x 120, fixed world scale); atlas layout | `e1162ad`, `54153a9`, `2216dc8`, `9b40c19`; `node tools/timing_check.mjs` passes | First real bake waits on Brasshorn's rig; Blacktop motion reuse (licences); board file never updated (B3) |
| Actions/Functions | Deterministic fight engine `src/sim/engine.js` (`PitSim`): Raid, ghosts, bosses, traits, abilities, statuses, revive, relic meter, merge, items, damage | `79c7533`, `4bf0193`; 34 tests | Not wired into the game (manifest request to Engineering) |
| Role Building | Data foundation: classes, abilities, roster, items, relics (13), magic (16), bosses (9), balance + patch layer | `7c96e05`, `6be07a4`; `node tests/role-building/data_check.mjs` passes | Launch roster (25), odds, copies: **draft, waiting on Doctor Def** |
| Arena | Camera locked at 44 degrees, matching the bake; nine backgrounds; impact grammar; reduced motion | `fb29923`, `679549f`; `node tests/arena/checks.mjs` passes | Direction yaws 30/90/150 (to Animations); bench compaction (parked branch) |
| Online & Accounts | Plan (Cloudflare Worker + D1 + Resend, free tiers); ghost format v1; name blur; age band; matching; balance job; no personal data | `0028088`; 19 tests | **3 decisions waiting on Doctor Def**; nothing collects data |
| Sound/Music | Nothing yet | no commits | Audio plan, placeholders |

## Bug log

| # | Sev | Found | Owner | State |
| --- | --- | --- | --- | --- |
| B1 | S3 | UI audit, 2026-11-07: 50 findings across 3 sizes. Lure, item and trait buttons are 27-31 px tall and the help button 30 x 30 (target 44); the help card's Close button sits below the fold at 390 x 844 | Engineering (`src/index.html`, `src/ui/hud.js`) | logged; fix at resume, then the UI audit becomes a failing gate |
| B2 | S2 | Each chat's new work is merged but not in the build, so a passing smoke test does not cover it | Engineering (`src/manifest.json`) | logged; resume step 2 |
| B3 | S3 | Animations' board file still says "Not started" after 5 merges: the board no longer shows its state | Animations | logged; the protocol now asks for the board line in the same commit as the work |
| B4 | S3 | Engineering's 2026-11-06 doc edit: the edit script stopped, the commit ran anyway | Engineering | fixed: `set -e` and anchor asserts (BUG_RUBRIC.md §2.3) |
| B5 | S3 | Arena: on 360 x 640 the controls left a 380-413 px stage (the lure row wraps with long names) | Engineering | fixed on the parked branch: steady 448 px; merge at resume |
