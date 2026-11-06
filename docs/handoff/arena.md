# Handoff — arena

Carried into this chat's next session. Update it at the end of every session.

## Where things stand (2026-11-06)

- Camera LOCKED at 44° to match Animations' `assets/atlases/layout.json` (far edge 0.8x, fighter 2.4 hex radii;
  cell 96x120 / ground y 104 / body 80 are Animations' numbers, mirrored in `SPRITE_CELL` with a drift check).
  Open with Animations: row yaws 45/135 should be 30/150 to match the hex headings.
- `board.js`: nine original backgrounds (4 round bands, 5 boss arenas), picked from `S.round` (or
  `S.bossArena`); static layer cached; brand sigil lies flat and stamps in light.
- `fx.js`: impact grammar via `fxEvent(type, e)`; sliders in `IMPACT_TUNING`; 3-flash-per-second ceiling;
  reduced motion off. Hit-stop belongs to Animations (`T.hitstop`, move_timing.json).
- Files are shared-scope scripts (no import/export). Keep every name other files use (listed at the top of
  each file).
- Bench: `tests/arena/` (build.mjs -> one file; checks.mjs, 20 checks + 1 note). Published:
  https://claude.ai/artifact/FNZ4TaK6xRyYLdTuB5utDC

## Next step

- Watch for answers to my four open requests (Animations, Actions/Functions, Role Building, Engineering).
- When Actions/Functions wires `fxEvent`, play a Raid in `dist/index.html` and check every impact fires once.
- When Animations' first baked fighter lands, check it on the board at 16 a side (memory and readability).
- Background polish after Doctor Def picks: stronger floor identity per band (currently mostly wall and light).

## Open questions for Doctor Def

- Approve the camera on your phone (bench link above) — Animations bakes to it.
- Approve or change the nine backgrounds (names and looks on the bench).
