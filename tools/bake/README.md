# The bake — 3D fighter to sprite atlas

Owner: **Animations**. Ported from Blacktop Aether `tools/bake/` (Godot 4.3,
headless). Its measured fixes are kept and credited in the code comments.

## Run it

```bash
# once: Godot 4.3 (the version Blacktop bakes with)
curl -sSLO https://github.com/godotengine/godot/releases/download/4.3-stable/Godot_v4.3-stable_linux.x86_64.zip
unzip Godot_v4.3-stable_linux.x86_64.zip     # or set GODOT=/path/to/binary

python3 tools/bake/bake.py tools/bake/specs/<id>.json             # bake the sheet
python3 tools/bake/bake.py <spec> --sweep <animation> --n 12 --row 1   # one animation, 12 samples
python3 tools/bake/filmstrip.py assets/atlases/<id>.json          # review by eye
python3 tools/bake/filmstrip.py --sweep <sweep png>               # label a sweep
node tools/timing_check.mjs                                       # timing + layout + manifests
```

Needs `xvfb-run` on a machine without a display, Python 3 with Pillow and
numpy. A bake of one fighter takes about 5 seconds.

## What one fighter is

`assets/atlases/layout.json` is the single source for every reader.

| | |
|---|---|
| cell | 96 × 120 px, ground point on y = 104, a height-band 1.00 fighter stands 80 px |
| rows | 3 baked directions: front three-quarter, side, back three-quarter. The player mirrors each for the opposite side: six headings |
| columns | 32 frames: idle 6, move 6, attack 6, cast 6, flinch 2, knockout 2, victory 4 |
| fighter sheet | one colour atlas, 3072 × 360, **4.42 MB decoded**, ~0.15 MB on disk |
| commander sheet | + brand 3 + magic 3 = 38 frames; colour + mask atlas, 10.5 MB decoded |
| format | lossless WebP, binary alpha, round trip verified on every pixel the engine reads |

## A spec (tools/bake/specs/<id>.json)

```json
{
  "id": "brasshorn", "sheet": "fighter", "class": "Warrior", "band": 1.0, "ship": true,
  "model": "assets/source/brasshorn.glb",
  "clip_files": ["tools/bake/clips/warrior_attack.glb"],
  "clips": {
    "idle":   {"anim": "warrior_idle", "loop": true},
    "attack": {"anim": "warrior_attack", "at": [0.05, 0.16, 0.27, 0.42, 0.65, 0.95]},
    "...": "one entry per clip of the sheet"
  },
  "props": [{"file": "assets/source/props/warrior_axe.glb", "bone": "RightHand"}]
}
```

- `band`: Character Dev's height band. The bake scales the model to
  `band × 1.80 m` itself, so export units never matter and a 1.15 Mage stands
  15% taller than a Warrior on screen.
- `at`: where in the animation each baked frame is sampled (0 to 1). Leave it
  out for even spacing (loops sample `i/n` so the cycle closes). Set attack and
  cast samples from a `--sweep`, by eye.
- `props`: a rigid glb with an empty node named `grip`; the grip lands on the
  bone with the bone's axes. Props are baked into the sprite.
- `ship`: only `true` writes to `assets/atlases/`. Fixtures go to a scratch folder.
- `${BLACKTOP}` in a path means the read-only Blacktop clone beside this repo.

## What the bake refuses, and what it only warns about

Refuses (nothing is written):
- an animation a clip names is missing, or a clip binds no tracks
- the ground misses the foot line, or the scale misses 80 px, by a pixel or more
- the three directions don't face the way their names say (measured from the toes)
- any cell renders empty, or the whole sheet is transparent
- antialiased alpha; a black colour sheet; a mask id outside 0/64/128/192/255
- a shipping model with no texture (fixtures may use a flat colour)
- a WebP round trip that changes any pixel the engine reads

Warns (written, then judged on the filmstrip):
- art touching a cell edge (clipped)
- a clip whose first or last frame overlaps the guard pose (idle frame 0) by
  under 70%: a likely pop between clips

## Measured on the first proof (2026-11-06)

Blacktop's studio-owned test rig (`specs/_fixture_blacktop.json`, untextured,
never shipped), with Blacktop's football clips standing in for ours.

| check | result |
|---|---|
| scale | 1.70 → 1.80 m, stands 80.1 px (target 80) |
| ground | y = 103.8 (target 104) |
| facing | front +0.71 toward camera, back −0.71, side +1.00 toward screen right |
| sheet | 3072 × 360, 4.42 MB decoded, 0.12 MB on disk |
| commander fixture with a test sword and part map | 3648 × 360 × 2 sheets, 10.51 MB, part ids 100% legal, all five present, sword follows the hand in every frame |

Two numbers changed because of it. The foot line moved from 114 to 104 and a
Warrior from 92 to 80 px: at the board's 44° camera, in a wide stance the foot
nearer the camera sits 13 px below the ground point (measured in a 180 px
diagnostic cell); Blacktop's flatter 28° camera never needed that room.
