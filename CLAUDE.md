# The Branding Pit — rules for every chat

Auto-chess roguelite for mobile web (installable) and browser. Everyone 10+.
Owner and producer: Doctor Def. Eight chats build it; each owns its own files.

## Read first, every session

1. `docs/STATUS.md` — the board. Read the top, then anything addressed to your chat.
2. `docs/handoff/<your-chat>.md` — where you left off.
3. `docs/OWNERS.md` — who owns which file. Never edit a file you do not own; ask its owner on the board.

While work is in flight, re-check the board about every 10 minutes. When you are
blocked on another chat, check every 5. Stop checking when you are idle.

## Living docs (read, do not copy into the repo)

- Design doc (rules, classes, Raid, bosses, cosmetics, E10+): https://claude.ai/code/artifact/9f8d6fb6-2c9d-45a0-a604-8ab561bd3ab0
- Animation reboot plan (pipeline, memory budget, clip list, timing): https://claude.ai/artifact/JjBtCDAx9H4qNmpmJDSk6D
- Raid prototype (playable): https://claude.ai/artifact/HTesf8P5NBRj4TBQ1Jnko4 — source in `prototype/raid.html`
- Studio Pipeline hub: https://claude.ai/artifact/Ga1CTyWuQpdeoDwQ7A79XU — **only the Engineering chat publishes to it**
- Sister project, read-only reference: SPMAgency/Blacktop-Aether (its `docs/` and `tools/bake/` are where most of our method comes from)

## How we work

- **One feature per request.** A change request names the problem, how it should work, and what must stay unchanged.
- **Simple first.** Build the plain version, test it, then add one layer at a time.
- **Checkpoint before experiments.** Work on a branch named `<chat>/<feature>`. Merge your own finished work to `main` yourself.
- **Two failed attempts, roll back.** Return to the last good commit and restart the problem from a clean description.
- **Every feel number is a slider or a data value, never hard-coded.**
- **Measure, don't assume.** The headless browser is not the phone. Frame rate, memory and feel are signed off on Doctor Def's devices only.
- **Judge motion by eye** on a filmstrip, not by a metric.
- **Only the Engineering chat builds, releases, and decides what ships.**
- **Doctor Def is the producer.** Bring him decisions, cleared blockers and things ready to test, not engineering detail.
- **End every session** by updating your handoff file and your section of the board.

## Hard rules

- **Original only.** No characters, names, art, logos or moves from other games. References are for timing and structure.
- **E10+.** Fantasy, cartoon combat; no blood; defeated fighters flash, shrink and vanish. Game text says "defeat", never "kill". Nothing suggestive.
- **Meshy: paid plan, Private licence only.** Free-tier output (CC BY) never goes in the game.
- **Never spend credits or money without Doctor Def's OK in chat.** Name the cost first.
- **No personal data collected** until the Online & Accounts plan is approved (under-13 rules apply).
- **Large source files** (3D models, raw audio, video) live in Google Drive, not in git. The repo holds what the game loads.

## Git commit attribution

End commit messages with the attribution lines your session gives you.
