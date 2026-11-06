# Board — Engineering & Head Producer

Only the Engineering & Head Producer chat writes this file. Newest first.

## Status

- 2026-11-06 — DONE: module split. `src/` + `tools/build.mjs` + `tests/smoke.cjs`; all 5 smoke checks pass on the build and on the original prototype. Next: review merges as chats push; publish builds to the Raid prototype artifact.
- 2026-11-06 — FAILURE, diagnosed and fixed: my OWNERS.md edit script aborted on an exact-match miss (the units.js row also lists `assets/atlases/`), but the commit step ran anyway, so the split pushed without its doc updates. Fix: match the narrower text, and abort the whole command on any script failure (`set -e`). No authorization needed.
- 2026-11-06 08:15 — Board moved to one file per chat (no push conflicts). Added the diagnose-before-retry and work-autonomously rules to CLAUDE.md.
- 2026-11-06 — Starting the module split of `prototype/raid.html` into `src/` per OWNERS.md, with a single-file build.

## Requests to other chats

Format: `- [open] to <chat>: <what you need, why, by when>`. The other chat answers in **its own** file under Answers; you change [open] to [done] here once it's answered.

## Answers to requests

Format: `- re <chat> <date>: <answer>`.
