# The Branding Pit — the shared project (read this first, every chat)

**ON HOLD (Doctor Def, 2026-11-07): no progress until Blacktop Aether is
published.** Read only; do not start work. The resume order is in
`shared/CLOSEOUT.md`.

This claude.ai Project ("Branding Pit - Game") is the one place all the chats and
Doctor Def share. It holds the STABLE documents. The LIVE board stays in the repo
`SPMAgency/BrandingPit`, because it changes every few minutes and every chat
pulls it anyway:

- **The board:** `docs/STATUS.md` plus one file per chat in `docs/board/`.
  Write only your own board file.
- **This project:** the plan, the audit, the rubric, the closeout, the legal
  record, the lore, the style line, the timing rules, the chat prompts.
  Engineering refreshes these copies when the repo versions change in substance.

## The chats and what each owns

| Chat | Tag | Owns |
| --- | --- | --- |
| **Engineering & Head Producer** (the main chat) | `[eng]` | the build, menus, HUD, the board's protocol, merges review, every build and release, Studio Pipeline |
| Character Dev | `[char]` | style line, every look, Meshy models, rig export, commander pieces |
| Animations | `[anim]` | motion, the Godot bake, filmstrips, the timing file, the sprite player, the commander phone-bake |
| Actions/Functions | `[act]` | the fight engine: movement, targeting, damage, statuses, the Raid, branding, contact events |
| Role Building | `[role]` | classes, abilities, roster, items, relics, magic attacks, bosses, every balance number |
| Sound/Music | `[sound]` | sound effects, music, volume settings |
| Arena | `[arena]` | the board, camera, backgrounds, lighting, impact flash and shake |
| Online & Accounts | `[online]` | ghosts, accounts, age screen, ads, the per-patch balance job |
| *Legal (proposed)* | `[legal]` | facts, licences, store pieces; writes no code |
| *QA/Video (proposed)* | `[qa]` | device-test sheets, phone-recording checks, studies; writes no code |

Doctor Def decides; Engineering has the say on what is built and when it ships.

## The protocol (short form; `CLAUDE.md` in the repo has the long form)

1. **Board checks back off while quiet**, scheduled with `send_later`:
   5 min, 10, 15, 30, 1 h, 3 h, 8 h, then daily. Any activity for you resets to
   5 min. Waiting on a reply you must act on: stay at 5.
2. **Commits:** subject starts with your tag; the body says what was wrong,
   what you tried that failed, and what changed. Your board line goes in the
   same commit as the work.
3. **Gates before `main`:** `npm test` (build, unit tests, timing, data, arena,
   boot smoke) plus `node tests/sweep.cjs`. Red is red.
4. **A claim names its evidence.** A number you did not measure is not yours to post.
5. **Found, not fixed:** goes in your board file with the repro and the owner's name.
6. **Diagnose before you retry:** what failed, why, the fix, and whether it needs Doctor Def.

## Standing rules from Doctor Def

- Work autonomously; ask him only for money, credits, accounts, legal or a real
  design choice, and batch the questions.
- Never spend credits or money without his OK in chat. Meshy: paid plan,
  Private licence only.
- E10+: no blood, defeated fighters flash and vanish, "defeat" not "kill".
- Original only: no names, art or moves from other games.
- No personal data collected until the online plan is approved.
- No Seele motion ships. Nothing public until a full build passes every gate and
  his phone test. Only Engineering cuts builds.

## Files in this project

- `README.md` — this page.
- `engineering/AUDIT_TECH.md` — every chat's work by evidence; the bug log.
- `engineering/BUG_RUBRIC.md` — how bugs are found, logged, fixed and kept out.
- `engineering/ROADMAP.md`, `engineering/PLAN_SHIP.md` — milestones and the three-build shape.
- `shared/CLOSEOUT.md` — every open thread, whose it is, and the resume order.
- `shared/LEGAL.md`, `shared/LORE.md` — the legal record; the world as fixed so far.
- `shared/STYLE_LINE.md`, `shared/MOVE_TIMING.md` — art direction; the timing contract.
- `shared/DEVICE_TEST_SHEET.md`, `shared/BLOCKER_CHECKS.md` — phone tests.
- `prompts/*.md` — each chat's starting prompt.
- Uploaded by Doctor Def: the design doc and the Animation Reboot plan (PDFs).
