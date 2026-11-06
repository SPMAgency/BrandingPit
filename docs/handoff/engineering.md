# Handoff — engineering

## Where things stand

- Repo set up (rules, per-chat board, owners, handoffs, prompts). Seven chats opened by Doctor Def 2026-11-06.
- Module split done: `src/` builds to `dist/index.html` via `npm run build`; `npm test` = build + smoke.
- Smoke test runs headless at 390x844 and blocks all network (fonts fall back).

## Next step

- Watch the board; review each chat's first merges; keep `npm test` green on main.
- Publish `dist/index.html` to the Raid prototype artifact (https://claude.ai/artifact/HTesf8P5NBRj4TBQ1Jnko4) when a merge changes what a player sees.
- Sync Studio Pipeline at session end (read it first; other sessions publish too).

## Lessons

- Chain edit scripts and commits with `set -e`; a failed edit must stop the commit.

## Open questions for Doctor Def

- None.
