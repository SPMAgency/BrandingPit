# Who owns what

One owner per file. To change a file you don't own, post a request in your own
board file, `docs/board/<you>.md`, addressed to the owner. Paths marked *(planned)* do not exist yet; the owner
creates them.

| Path | Owner | Others may |
|---|---|---|
| `CLAUDE.md`, `docs/STATUS.md`, `docs/OWNERS.md` | Engineering | Read |
| `docs/board/<chat>.md` | That chat | Read |
| `prototype/raid.html` | Engineering | Read. Frozen reference until the module split lands |
| `src/main.js`, `src/ui/` *(planned)*, `index.html` *(planned)*, build config | Engineering | Read |
| `tests/` | Engineering | Add tests for their own files in `tests/<chat>/` |
| `docs/STYLE_LINE.md` *(planned)*, `assets/source/` manifests *(planned)* | Character Dev | Read |
| `assets/commander/` *(planned: cosmetic pieces)* | Character Dev | Read |
| `src/data/move_timing.json` *(planned)*, `tools/bake/` *(planned)*, `tools/timing_check.*` *(planned)* | Animations | Read |
| `assets/atlases/` *(planned)*, `src/render/units.js` *(planned: sprite player)* | Animations | Read |
| `src/render/commander_bake.js` *(planned: phone-bake spike)* | Animations | Read |
| `src/sim/` *(planned: fight, Raid, targeting, statuses, branding)* | Actions/Functions | Read |
| `src/data/classes.json`, `abilities.json`, `roster.json`, `items.json`, `relics.json`, `magic.json`, `bosses.json`, `balance.json` *(planned)* | Role Building | Read |
| `src/audio/`, `assets/audio/` *(planned)* | Sound/Music | Read |
| `src/render/board.js`, `src/render/fx.js` *(planned: board, camera, flash, shake, backgrounds)* | Arena | Read |
| `src/online/`, `server/` *(planned)* | Online & Accounts | Read |
| `docs/handoff/<chat>.md` | That chat | Read |
| `docs/STUDY_LOG.md` | Everyone | Add rows at the top |

## Shared contracts

| Contract | Writer | Readers |
|---|---|---|
| `src/data/move_timing.json` — when an attack can connect | Animations | Actions/Functions, Sound/Music, Arena |
| `src/data/roster.json` — who exists, class, tier, stats | Role Building | Character Dev, Animations, Actions/Functions |
| Contact events (`hit`, `crit`, `ko`, `cast`, `brand`, `recruit`) | Actions/Functions | Sound/Music, Arena, Animations |
| Ghost snapshot format | Online & Accounts | Actions/Functions |
