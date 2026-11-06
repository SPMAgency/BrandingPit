# Study log

Every video, doc or lesson studied for the game, newest first, with what it changed.
Blacktop Aether's full study (23 sections) is the starting point:
https://claude.ai/artifact/NXAQV95DYWqiMTFgAsgZov

| Date | Chat | Source | Key takeaway | Applied to |
|---|---|---|---|---|
| 2026-11-06 | Arena | Blacktop Aether tools/bake/godot/bake.gd camera header, tools/bake/ATLAS.md geometry | Bake with a long lens (20° FOV) framed by the model's bounding box, figure normalised to a body height in the cell with a fixed foot line; the engine scales by body height | Locked camera and sprite cell contract (camera.js, docs/board/arena.md) |
| 2026-11-06 | Online & Accounts | Blacktop Aether `BACKEND_MIGRATION.md` and its Base44 auth code; Cloudflare D1 and Email pricing; Resend limits; Base44 plans; amended COPPA Rule; Play Families ads policy | Blacktop already plans to leave Base44 and calls accounts its riskiest move; start on Cloudflare's free tier with passwordless email codes; keep children's typed names off public ghosts | `docs/ONLINE_PLAN.md` |
| 2026-11-06 | Role Building | Blacktop Aether docs/MOVE_TIMING.md (data contract + timing_check gate, `contact: eye/unverified` provenance flag) | Data is the contract; a gate script checks shape and drift between data and what the game reads; every value says where it came from | `src/data/*.json` `source` / `PROPOSED` fields, `tests/role-building/data_check.mjs` |
| 2026-11-06 | Character Dev | Blacktop Aether STYLE_LINE, STYLE_LINE_PREP, MESHY_FINDINGS, MESHY_REGEN_PROMPTS, ATLAS (channels), glb_tag_parts.py | Lock the line before generating; concept model ignores proportions so budget the refine; a held object or closed robe breaks auto-rig; part ids in a lossless channel let one mesh take many colours | STYLE_LINE.md, COMMANDER_PIECES.md |
| 2026-11-06 | Engineering | Blacktop Aether repo docs (ANIMATION_PLAN, 3D_PIPELINE, ATLAS, MOVE_TIMING, STYLE_LINE, MESHY_FINDINGS) | Shared Mixamo rig, Godot bake, timing as data, sprite memory is the ceiling | Animation reboot plan |
