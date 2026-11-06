# The commander: base body and cosmetic pieces — PROPOSAL 2026-11-06

**Status:** proposal for Doctor Def. Owner: Character Dev. The phone-bake that
turns these pieces into an atlas is the Animations chat's spike
(`src/render/commander_bake.js`); this doc defines what that spike receives.

## Bottom line

One neutral base body on the shared Mixamo rig, cut at fixed seams into body
segments. Each outfit piece **replaces** a segment (or sits on a seam), skinned to
the same 66 joints, so any combination snaps together with no gaps and no clipping.
Every piece carries a small part map that tells the renderer which pixels take the
player's pigment, so a new armour colour costs zero art and zero memory.

## The base body

- **Pose:** strict A-pose, arms straight out about 45°, hands open and empty, palms
  down, legs straight with a clear gap. Same pose every fighter is generated in.
- **Build:** the base line's chunky arcade proportions, average athletic build, height
  band 1.00 (same as a Warrior). **Class-neutral:** none of the eight class signals,
  because the commander's attribute changes mid-run (after boss wins) and the look
  must not claim a class it no longer has. The attribute shows as a code effect.
- **Default outfit:** a plain fitted cream underlayer on every segment, so a
  commander with empty slots is always fully clothed (E10+).
- **Skin tone:** a tint on the skin channel, chosen at creation; free in memory.
- **Faces:** a small set of head textures chosen at creation (proposed 6), one fixed
  expression each. No blend shapes exist, so faces are textures, never morphs.
- **Budget:** about 4,000 triangles for the base; a fully equipped commander about
  9,000 total.

## Slots and where each one is cut

Seven fixed seam rings on the base body: **neck, shoulders (×2), wrists (×2), waist,
shins (×2)**. Every piece that crosses a seam ends exactly on it, with the same edge
positions as the base, so pieces from different sets meet cleanly.

| slot | kind | covers | rides these bones | seams |
|---|---|---|---|---|
| Hair | replaces scalp | top and back of head | Head | hairline |
| Torso armour | replaces | chest, back, belly | Spine, Spine1, Spine2 | neck, shoulders, waist |
| Sleeves | replaces | upper arm and forearm | Arm, ForeArm | shoulder, wrist |
| Gloves | replaces | hands, fingers | Hand + finger joints | wrist (cuff laps over sleeve) |
| Leg armour | replaces | hips to mid-shin | Hips, UpLeg, Leg | waist, shin |
| Boots / shoes | replaces | mid-shin to toe | Leg, Foot, ToeBase | shin (cuff laps over leg) |
| Belt | sits on seam | the waist ring | Hips, Spine | covers waist seam |
| Pauldrons | sits on seam | top of each shoulder | Shoulder, Arm | covers shoulder seam |
| Weapon | rigid prop | in the right hand | parented to RightHand | grip point |
| Shield | rigid prop | on the left forearm | parented to LeftForeArm | strap point |

Replacing rather than layering is the standard modular-character method: the body
under a piece is simply not drawn, so nothing pokes through in any animation frame,
and the triangle count stays flat however many slots are filled. Belt and pauldrons
are the only add-ons, and they sit on seams, which is also what hides the seams.

## Pigments: tint on part channels

Each piece ships with a **part map** beside its colour map: one value per pixel
saying which colour rule applies.

| part id | meaning | colour at draw time |
|---|---|---|
| 0 | own colour | as painted (leather, metal studs, gems) |
| 1 | pigment A | player's main armour pigment × painted shading |
| 2 | pigment B | player's trim pigment × painted shading |
| 3 | skin | creation skin tone × painted shading |
| 4 | hair | creation hair colour × painted shading |

- Tintable areas are generated in **unpainted light grey**, so the painted map only
  carries shading and the pigment supplies the hue. That is the same trick Blacktop
  uses for team jerseys (its mask's part channel), extended from 3 parts to 5.
- The part map is saved **lossless**, never quality-compressed: Blacktop measured
  that lossy WebP moves part ids across thresholds and recolours the wrong pixels.
- Ids are spaced 0, 64, 128, 192, 255 in one channel so a renderer threshold has wide
  margins.
- **Proposed:** two pigment slots (A main, B trim) applied across the whole outfit.
  Each pigment the player unlocks is just one colour value. Per-piece pigments can be
  added later without new art.

## How the pieces get made

| step | what | credits |
|---|---|---|
| 1 | Base body in Meshy (same recipe as a fighter), remesh ~4,000, rig through Mixamo template | ~51 |
| 2 | One **outfit set** per theme: the base body's front image fed back to Meshy as "same body and pose, now wearing [theme] torso, sleeves, gloves, legs, boots, belt, pauldrons, hair", tintable areas in light grey | ~51 per set (yields up to 8 pieces) |
| 3 | Weapons and shields as unrigged props | ~30–40 each |
| 4 | A cutting tool (no credits) splits each set at the seam rings, fits every piece onto the **base** skeleton, snaps seam edges to the base body, writes the part map, exports one small glb per piece | 0 |

The hard part is step 4. Meshy generations agree on joint names but not on bone
lengths, so an outfit made on a slightly different body has to be refitted to the
base. The tool does it bone by bone: each vertex is held in its bone's local space on
the generated rig and re-placed on the base rig. Blacktop's tooling already does the
reading, writing and refusal checks this needs (`glb_normalize_rig.py`,
`glb_tag_parts.py`); the new tool would live in `tools/character/` (owner line requested
from Engineering).

Raw Meshy downloads go to Google Drive; the repo keeps only the cut pieces the game
loads (`assets/commander/`) and their manifests (`assets/source/`).

## Pass or fail test (runs before any second outfit set)

One base body plus one outfit set, cut and refitted. It passes when:

1. Every piece swaps on and off independently and the empty slot shows the default
   underlayer, with no gaps at any seam.
2. Nothing pokes through in the 7 fighter clips plus Brand and Magic cast, checked on
   a filmstrip in all three directions.
3. Two different pigment pairs on the same outfit look right side by side, and the
   skin and hair tints do not bleed onto armour.
4. A full outfit is under about 9,000 triangles and its pieces download in under
   about 1 MB together.

If it fails, the fallback is fewer, larger slots (torso+sleeves as one piece,
legs+boots as one piece) before anything more exotic.

## Cost to first test

About 51 credits for the base body plus 51 for one outfit set: **~102 credits**,
asked for separately after the test fighter proves the line. Nothing is spent
from this doc.

## Decisions for Doctor Def

1. Commander look is class-neutral; the attribute is shown by a code effect. (Recommended.)
2. Two pigment slots, main and trim, across the whole outfit. (Recommended.)
3. Six face presets and a skin-tone tint at creation; one body type at launch.
