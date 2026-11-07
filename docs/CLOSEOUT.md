# Closeout — the master list of open threads, and whose each one is

Engineering, 2026-11-07. Everything that is open, on one page, so nothing is lost
over the hold. Owners act; Engineering keeps this list current.

## Waiting on Doctor Def (batched; nothing else blocks on him)

| # | Decision or action | Asked by | Where it is |
| --- | --- | --- | --- |
| D1 | Approve the 25-fighter launch roster, secondary-attribute ranks re-cut to 1/2/3, tier 5 at 2 copies per run, tier 4/5 pen odds | Role Building | https://claude.ai/artifact/HCAbnuzNJ3wVHeiTxJCyVz |
| D2 | Online plan: hosting (Cloudflare, free tiers), what under-13 players see on ghosts, approve the plan | Online & Accounts | `docs/ONLINE_PLAN.md` |
| D3 | Reopen Chrome with the Claude extension so Character Dev can finish Brasshorn (remesh, rig: free) | Character Dev | its board file |
| D4 | Motion licences for a second game: RenderHub order 419210 (Extended Use), Meshy terms in writing, and the HY-Motion question behind Meshy's AI motions (parked in Blacktop, not forgotten) | Engineering | `docs/LEGAL.md` |
| D5 | Where the game ships: installable web only, or web plus Google Play like Blacktop (`docs/PLAN_SHIP.md`) | Engineering | `docs/PLAN_SHIP.md` |
| D6 | Open a Legal chat and a QA/Video chat, as Blacktop has (prompts ready in `docs/prompts/`) | Engineering | `docs/prompts/README.md` |

Settled by carrying over Blacktop's decisions (no question needed): **no Seele
motion ships** (Doctor Def's Pro subscription is cancelled); trademark filing is
last, when the game is ready for a store; nothing public until a full build
passes every gate and a phone test.

## Resume order (when Doctor Def lifts the hold)

1. Engineering lifts the hold on the board and posts this order.
2. Engineering merges `engineering/short-screen-rows`, then wires every chat's
   merged work into the build (B2): `move_timing`, `relics`, `magic`, `bosses`
   in the manifest data; `src/anim/timing.js`, `src/sim/engine.js` in the order.
   Gates green before anything else lands.
3. Actions/Functions switches the live game onto `PitSim` behind a switch, OFF
   by default, on for a phone test.
4. Character Dev finishes Brasshorn (D3); Animations bakes it; it replaces one
   placeholder figure. First fighter on device (Roadmap M1).
5. Sound/Music starts: audio plan and placeholders on the contact events.
6. Each chat answers the requests still open on the board (below).

## Open requests between chats (from the board at the hold)

| From | To | What |
| --- | --- | --- |
| Actions/Functions | Engineering | wire the engine into the build (resume step 2) |
| Role Building | Engineering | `relics`, `magic`, `bosses` into the manifest data |
| Online & Accounts | Engineering | module files in the build (on the parked branch); online test in `npm test` (done in this setup) |
| Arena | Engineering | compact controls on short phones (parked branch); keep the shake transform between board and effects (confirmed: `scene.js` never resets it) |
| Actions/Functions | Animations | timing segments API confirmation |
| Arena | Animations | direction yaws to 30 / 90 / 150 |
| Character Dev | Animations | one fixed world scale; separate unrigged props; commander piece format |
| Actions/Functions | Role Building | 14 fight settings need a home in the data |
| Arena | Role Building | an `arena` field per boss |
| Actions/Functions, Role Building | Online & Accounts | ghost format v1 confirmation; balance job output shape |
| Actions/Functions | Sound/Music | hook the contact events |
| Actions/Functions | Arena | contact events carry where the blow landed |
