# Board — Engineering & Head Producer

Only the Engineering & Head Producer chat writes this file. Newest first.

## Status

- 2026-11-07 — **DONE: Blacktop's methodology set up (Doctor Def's ask, during the hold).** New: `docs/PROJECT_README.md`, `BUG_RUBRIC.md` (8 gates, S1-S3), `AUDIT_TECH.md` (every chat by evidence, bugs B1-B5), `CLOSEOUT.md` (D1-D6 for Doctor Def, resume order, open requests), `ROADMAP.md` (M0-M6), `PLAN_SHIP.md` (three builds, release bar), `LEGAL.md` (incl. motion files on his PC by source), `LORE.md`, `DEVICE_TEST_SHEET.md`, `BLOCKER_CHECKS.md`; prompts README, template, Legal and QA/Video prompts; protocol in every prompt and in CLAUDE.md. New gates: `tests/sweep.cjs` (proven to catch a planted throw and a planted NaN), `tests/ui_audit.cjs` (report mode, 50 baseline findings = B1); `npm test` runs every chat's checks; CI `.github/workflows/test.yml` runs all gates on every push, reports only.
- 2026-11-07 — FAILURE, diagnosed: `git pull --rebase` refused (uncommitted work), and `set -e` does not stop a chain joined with `&&`, so my edit step was skipped while tests ran. Fix: edits and commit first, then pull and push; each step on its own line. No authorization needed.
- 2026-11-06 — Reviewed first merges (Animations move timing, Character Dev style line): own lanes only, `npm test` green on main. Note to Animations: `src/anim/timing.js` is not in `src/manifest.json` yet, so it isn't in the build; post a request when you want it wired.
- 2026-11-06 — DONE: module split. `src/` + `tools/build.mjs` + `tests/smoke.cjs`; all 5 smoke checks pass on the build and on the original prototype. Next: review merges as chats push; publish builds to the Raid prototype artifact.
- 2026-11-06 — FAILURE, diagnosed and fixed: my OWNERS.md edit script aborted on an exact-match miss (the units.js row also lists `assets/atlases/`), but the commit step ran anyway, so the split pushed without its doc updates. Fix: match the narrower text, and abort the whole command on any script failure (`set -e`). No authorization needed.
- 2026-11-06 08:15 — Board moved to one file per chat (no push conflicts). Added the diagnose-before-retry and work-autonomously rules to CLAUDE.md.
- 2026-11-06 — Starting the module split of `prototype/raid.html` into `src/` per OWNERS.md, with a single-file build.

## Requests to other chats

Format: `- [open] to <chat>: <what you need, why, by when>`. The other chat answers in **its own** file under Answers; you change [open] to [done] here once it's answered.

- [open] to animations (2026-11-06, from Doctor Def's ask "can we use all the animations from our journey"): **Reuse Blacktop's motion library.** Blacktop Aether's `tools/bake/clips/` has 134 converted clips on the Mixamo rig (every one finds all its joints on the 66-joint template, per Blacktop's MESHY_FINDINGS), plus about 50 Meshy motions per character in Doctor Def's Meshy account. Engineering's first sort by name: 95 of 134 fit our clip slots — idle 12, move 15, attack 16, cast 1, dash/dodge 12, flinch/block 11, knockout 12, victory/taunt 10, get-up 6; the other 39 are football or everyday motions. Please: (1) add `source` and `licence` to every clip you take, in a registry like Blacktop's `clip_registry.json` — Blacktop's registry has no source field, so this is new work; (2) map candidates to each class's 7 clips by eye on filmstrips; (3) list the gaps. Expected gaps: only 1 spell cast, no heal, no ranged throw or shot, no weapon swing. Price the gaps as Meshy Text to Motion at 10 credits each, and ask Doctor Def before spending. Rule: **a clip with no confirmed licence is never baked into a release**; prototype use is fine.

## Answers to requests

Format: `- re <chat> <date>: <answer>`.

- re character-dev 2026-11-06: DONE. `docs/COMMANDER_PIECES.md`, `docs/class_silhouettes.svg` and `tools/character/` are yours in OWNERS.md. Also added Animations' new `src/anim/`, `tests/animations/`, `tools/timing_check.mjs`.
