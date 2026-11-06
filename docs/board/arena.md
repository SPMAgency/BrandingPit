# Board — Arena

Only the Arena chat writes this file. Newest first.

## Status

- 2026-11-06 — **Camera LOCKED. Animations, bake to these numbers** (they live in `src/render/camera.js`,
  `ARENA_CAM` and `SPRITE_CELL`; changing them means a re-bake and needs Doctor Def's OK):

  | What | Value |
  |---|---|
  | Camera | fixed, looks down **46°** at the board centre (43.3° far edge, 48.3° near edge); vertical lines stay vertical, so fighters are upright sprites |
  | Bake camera | pitch **46°** down, long lens **20° FOV** (as Blacktop's `bake.gd`), framed by the model's bounding box |
  | Cell | **96 × 120**, feet on **y = 116** (foot 4), standing body **84 px** head to foot; the rest is headroom for raised arms and props |
  | Baked rows | row 0 = **yaw 30°** (front three-quarter), row 1 = **90°** (side), row 2 = **150°** (back three-quarter); yaw measured from facing the camera, positive = turned toward screen-right. These are exactly the six hex neighbour directions; the engine mirrors for the other three |
  | Fighter size on the board | **2.4 hex radii** tall (about 1.4 hex widths); about **50 pt** mid-board on an iPhone-size phone, which is **~130 device px** at 2.6×, 100 at 2×, 150 at 3× |
  | Perspective | far edge draws at **0.8×** the bench row's scale |
  | Sprite player sizing | draw scale = `spriteScale(z)` CSS px per sprite px; feet at `P(x,z)`; row and mirror from `headingToRow(dx,dz)` |

- 2026-11-06 — **Merged to main:** `camera.js` (locked camera above), `board.js` (nine backgrounds, cached
  static layer, exit-row pulse, gate posts, bench rail, brand sigil that lies flat at the fighter's depth and
  stamps in light), `fx.js` (impact grammar). Every existing name the split uses is unchanged; `npm test` passes.
  The background picks itself from `S.round`, so nothing else had to change for it to show.
- Backgrounds (proposal, original, procedural): rounds 1–2 The Outer Pen · 4–5 Cinder Yard · 7–8 Tidewell
  Grotto · 10–11 Gilded Crown · bosses: 3 The Iron Gate · 6 The Ember Throne · 9 Storm Hollow ·
  12 The Sunken Court · 13 The Last Pit. Floors stay dark and low in saturation, no strong greens or reds;
  team rings and the sigil measure 3.35:1 or better on every floor.
- Impact grammar in `fx.js`, fired by `fxEvent(type, e)` on the contact frame: spark on the side the blow came
  from; bigger spark on crits and ability hits; 35 ms knockout flash + small shake, at most 2 a second;
  100 ms flash + shake for 3-star and boss abilities (a cast and its hit flash once). Every number is a slider
  (`IMPACT_TUNING`). Reduced motion turns every flash and shake off. Hard ceiling: 3 flashes in any second.
  Hit-stop is Animations' (`move_timing.json` impact.hitstopMs, applied with `T.hitstop()`); I don't hold a copy.
- Board performance: everything static is painted once per resize or background change; a frame is one image
  plus the exit pulse, two torch glows and up to 34 motes. Bench: 60 fps, about 1 ms per frame headless.
  Phone sign-off is Doctor Def's.
- Test bench (phone): https://claude.ai/artifact/FNZ4TaK6xRyYLdTuB5utDC — build it yourself with
  `node tests/arena/build.mjs`; checks with `node tests/arena/checks.mjs` (18 pass).

### Failures this session (diagnosed before retrying)

- 2026-11-06 — **Rebase conflict on `src/render/board.js` and `fx.js`.** Evidence: `git rebase origin/main`
  stopped, both files "added by both". Cause: Engineering's module split landed after I cloned; it extracted the
  prototype into shared-scope files (no import/export) and gave me `camera.js`, `board.js`, `fx.js`. My first
  versions were ES modules and would have broken the one-file build. Fix: reset the branch to main and rebuilt
  all three in the shared-scope style, keeping every name other files call, with my additions alongside.
  Hit-stop moved to Animations' runtime, which already owns that number. Human authorization: none needed.
- 2026-11-06 — **Bench fighters drew as slivers.** Evidence: screenshot, bench row showed only rings. Cause: the
  bench stand-ins had no bob phase, so their height was not a number. Fix: give them one (test page only).
  Authorization: none.

### Decisions I made (mine to make)

- 46° rather than steeper: the small 360 × 640 Android is height-bound; steeper squeezes fighters there to
  31 pt. 46° keeps them 36 pt on that phone and 50 pt on an iPhone-size one, and the floor still reads as hexes.
- Shake is applied inside `drawBoard()` so the whole frame moves without touching `scene.js`.
- Contact flashes are local radial glows, and the 3-star screen flash is capped at 28% white, for photosensitivity.

## Requests to other chats

- [open] to Animations: bake to the camera table above, and have the sprite player size and place fighters with
  `spriteScale(z)`, feet at `P(x,z)`, and `headingToRow(dx,dz)` for row and mirror. Keep calling
  `sigil(x,y,R,rot)` under branded fighters (same signature; it now lies flat and plays the stamp). If 84 px of
  body leaves too little headroom for an overhead swing, tell me the pose and I'll re-check the cell. Before your
  first atlas bake.
- [open] to Actions/Functions: on each contact frame call `fxEvent(type, e)` with type `hit`, `crit`, `ko`,
  `cast` or `brand`, and `e = { at:{x,z} victim (caster for cast), from:{x,z} attacker, attacker, victim,
  crit, ability, star, boss }` (world positions, as actors carry them). Keep calling `puff()` on knockouts as now.
  When a boss round starts, set `S.bossArena` from the boss's `arena` field if it has one. When you wire contact
  frames.
- [open] to Role Building: give each boss in `bosses.json` an optional `arena` field naming one of
  `ARENA_THEMES` (`boss-iron-gate`, `boss-ember-throne`, `boss-storm-hollow`, `boss-sunken-court`,
  `boss-last-pit`). Without it, the boss level picks the arena. When you write bosses.json.
- [open] to Engineering: (1) On a 360 × 640 phone the controls leave a 410 px stage and fighters drop to 36 pt
  (50 pt on an iPhone-size phone). Please compact the lure, item and info rows when the screen is under about
  700 px tall. (2) `drawBoard()` now applies screen shake with `ctx.translate`; please don't reset the transform
  between `drawBoard` and `drawFx`. If you would rather own it, call `impactShake()` in `scene.js` and I'll drop
  mine. No rush on either.

## Answers to requests

Format: `- re <chat> <date>: <answer>`.

- None yet.
