# Who owns what

One owner per file. To change a file you don't own, post a request in your own
board file, `docs/board/<you>.md`, addressed to the owner. Paths marked *(planned)* do not exist yet; the owner
creates them.

| Path | Owner | Others may |
|---|---|---|
| `CLAUDE.md`, `docs/STATUS.md`, `docs/OWNERS.md` | Engineering | Read |
| `docs/board/<chat>.md` | That chat | Read |
| `prototype/raid.html` | Engineering | Read. Frozen reference; the game now builds from `src/` |
| `src/main.js`, `src/index.html` (page, CSS, markup), `src/manifest.json` (file order), `src/core/`, `src/ui/`, `src/render/scene.js`, `src/data/load.js`, `tools/build.mjs`, `package.json` | Engineering | Read |
| `tests/` | Engineering | Add tests for their own files in `tests/<chat>/` |
| `docs/STYLE_LINE.md` *(planned)*, `assets/source/` manifests *(planned)* | Character Dev | Read |
| `assets/commander/` *(planned: cosmetic pieces)* | Character Dev | Read |
| `docs/COMMANDER_PIECES.md`, `docs/class_silhouettes.svg`, `tools/character/` | Character Dev | Read |
| `src/anim/` (timing runtime), `tests/animations/`, `tools/timing_check.mjs`, `tools/bake/MOVE_TIMING.md` | Animations | Read |
| `src/data/move_timing.json` *(planned)*, `tools/bake/` *(planned)*, `tools/timing_check.*` *(planned)* | Animations | Read |
| `assets/atlases/` *(planned)*, `src/render/units.js` (fighter drawing; becomes the sprite player) | Animations | Read |
| `src/render/commander_bake.js` *(planned: phone-bake spike)* | Animations | Read |
| `src/sim/` (`hex.js`, `pen.js`, `actors.js`, `combat.js`, `phases.js`) | Actions/Functions | Read |
| `src/data/classes.json`, `abilities.json`, `roster.json`, `items.json`, `balance.json`; *(planned)* `relics.json`, `magic.json`, `bosses.json` | Role Building | Read |
| `src/audio/`, `assets/audio/` *(planned)* | Sound/Music | Read |
| `src/render/camera.js`, `src/render/board.js`, `src/render/fx.js` (camera, board, effects, flash, shake, backgrounds) | Arena | Read |
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

## How the build works

`npm run build` joins the files listed in `src/manifest.json`, in that order, into one
script inside `src/index.html`, and writes `dist/index.html` (open it in a browser).
The files share one scope: a name declared in one file is visible in the others, so
**never rename or delete something another chat's file uses** without a request first.
The JSON data files load into `DATA` before any code runs.

A new file: add it to `src/manifest.json` by request to Engineering (the order matters).

`npm test` builds and runs `tests/smoke.cjs`: boots the game at phone size, opens a unit
card, plays one Raid and checks for script errors. **Run it before every push to main.**
