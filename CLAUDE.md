# The Branding Pit — rules for every chat

Auto-chess roguelite for mobile web (installable) and browser. Everyone 10+.
Owner and producer: Doctor Def. Eight chats build it; each owns its own files.

## Read first, every session

1. `docs/STATUS.md` — the board's top page, then every file in `docs/board/` for requests
   addressed to your chat (`grep -rn "\[open\] to <your chat>" docs/board/`).
   You write only `docs/board/<your-chat>.md`; post requests to others there too.
2. `docs/handoff/<your-chat>.md` — where you left off.
3. `docs/OWNERS.md` — who owns which file. Never edit a file you do not own; ask its owner on the board.

4. `docs/PROJECT_README.md` (also in the claude.ai Project as `README.md`), then
   `docs/BUG_RUBRIC.md` and `docs/CLOSEOUT.md`.

**Board checks back off while quiet** (Blacktop's rule): schedule each with
`send_later`. Each check: pull, read `docs/STATUS.md` and anything addressed to
you, act, then schedule the next. The gap grows with each quiet check in a row:
5 min, 10, 15, 30, 1 h, 3 h, 8 h, then 24 h. Any activity for you (Doctor Def or
Engineering posting, a request to you, work you wait on landing) resets to 5 min.
Waiting on a reply you must act on: stay at 5. **While the game is on hold, do not
schedule checks.**

## Living docs (read, do not copy into the repo)

- Design doc (rules, classes, Raid, bosses, cosmetics, E10+): https://claude.ai/code/artifact/9f8d6fb6-2c9d-45a0-a604-8ab561bd3ab0
- Animation reboot plan (pipeline, memory budget, clip list, timing): https://claude.ai/artifact/JjBtCDAx9H4qNmpmJDSk6D
- Raid prototype (playable): https://claude.ai/artifact/HTesf8P5NBRj4TBQ1Jnko4 — source in `prototype/raid.html`
- Studio Pipeline hub: https://claude.ai/artifact/Ga1CTyWuQpdeoDwQ7A79XU — **only the Engineering chat publishes to it**
- Sister project, read-only reference: SPMAgency/Blacktop-Aether (its `docs/` and `tools/bake/` are where most of our method comes from)

## How we work

- **Commit subjects start with your tag:** `[eng]` `[char]` `[anim]` `[act]` `[role]` `[sound]` `[arena]` `[online]`. The body says what was wrong, what you tried that failed, and what changed. Your board line goes in the **same commit** as the work.
- **Gates before main:** `npm test` and `node tests/sweep.cjs` (see `docs/BUG_RUBRIC.md`). Red is red; never call a gate flaky without the log line that proves it.
- **A claim names its evidence** (a test, a commit, a URL read today). Unmeasured numbers are "unverified".
- **Found, not fixed:** a bug in someone else's file goes in your board file with the repro and the owner's name.
- **Feel and balance changes ship OFF** behind a switch in the owner's data file until Doctor Def's phone test.
- **One feature per request.** A change request names the problem, how it should work, and what must stay unchanged.
- **Simple first.** Build the plain version, test it, then add one layer at a time.
- **Checkpoint before experiments.** Work on a branch named `<chat>/<feature>`. Merge your own finished work to `main` yourself.
- **Diagnose every failure before retrying.** Never retry blind. After any failed run, write in your board file: what failed (with the evidence: error, log line, screenshot), the root cause, the fix, and whether it needs Doctor Def's authorization (money, credits, accounts, a decision). Only then try the fix.
- **Two failed attempts, roll back.** Return to the last good commit and restart the problem from a clean description.
- **Work autonomously.** Decide anything that is yours to decide and record why in your board file. Ask Doctor Def only for money, credits, accounts, legal or a real design choice, and batch those questions.
- **Every feel number is a slider or a data value, never hard-coded.**
- **Measure, don't assume.** The headless browser is not the phone. Frame rate, memory and feel are signed off on Doctor Def's devices only.
- **Judge motion by eye** on a filmstrip, not by a metric.
- **Only the Engineering chat builds, releases, and decides what ships.**
- **Doctor Def is the producer.** Bring him decisions, cleared blockers and things ready to test, not engineering detail.
- **Before every push**, `git pull --rebase`. If a rebase conflicts in a file you don't own,
  you edited someone else's file: undo that change and post a request instead.
- **End every session** by updating your handoff file and your board file.

## Hard rules

- **Original only.** No characters, names, art, logos or moves from other games. References are for timing and structure.
- **E10+.** Fantasy, cartoon combat; no blood; defeated fighters flash, shrink and vanish. Game text says "defeat", never "kill". Nothing suggestive.
- **Meshy: paid plan, Private licence only.** Free-tier output (CC BY) never goes in the game.
- **Never spend credits or money without Doctor Def's OK in chat.** Name the cost first.
- **No personal data collected** until the Online & Accounts plan is approved (under-13 rules apply).
- **Large source files** (3D models, raw audio, video) live in Google Drive, not in git. The repo holds what the game loads.

## Git commit attribution

End commit messages with the attribution lines your session gives you.
