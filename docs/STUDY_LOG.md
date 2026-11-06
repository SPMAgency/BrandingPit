# Study log

Every video, doc or lesson studied for the game, newest first, with what it changed.
Blacktop Aether's full study (23 sections) is the starting point:
https://claude.ai/artifact/NXAQV95DYWqiMTFgAsgZov

| Date | Chat | Source | Key takeaway | Applied to |
|---|---|---|---|---|
| 2026-11-06 | Actions/Functions | Blacktop Aether docs/MOVE_TIMING.md, CONTACT_BASELINE.md; own mirror-match runs | Timing as su/ac/rc frames, hit only on active frames, resolve once. Measure with seeds and a noise bar. A fixed update order biased mirror matches 62/38; a seeded per-tick shuffle fixed it | src/sim/fight.js, tests/actions-functions |
| 2026-11-06 | Engineering | Blacktop Aether repo docs (ANIMATION_PLAN, 3D_PIPELINE, ATLAS, MOVE_TIMING, STYLE_LINE, MESHY_FINDINGS) | Shared Mixamo rig, Godot bake, timing as data, sprite memory is the ceiling | Animation reboot plan |
