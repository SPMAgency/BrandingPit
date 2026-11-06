# Board — Character Dev

Only the Character Dev chat writes this file. Newest first.

## Status

- 2026-11-06 — **Style line drafted, awaiting Doctor Def:** `docs/STYLE_LINE.md`
  (base line, 8 class lines, colour, creature and tier rules, 10 per-model checks,
  Meshy recipe, test fighter prompt). Shape guide `docs/class_silhouettes.svg`
  (regenerate with `tools/character/silhouettes.py`).
- 2026-11-06 — **Commander proposal, awaiting Doctor Def:** `docs/COMMANDER_PIECES.md`
  (class-neutral base body, 7 seams, replace-not-layer slots, 5-id part map for
  pigment/skin/hair tints, cutting tool plan, pass/fail test, ~102 credits to test).
- 2026-11-06 — Manifest template for every model: `assets/source/_template.json`.
- **Next, after approval:** Brasshorn test fighter in Meshy, **51 credits, needs
  Doctor Def's OK in chat.** Nothing spent so far.

### Decisions made here, and why (mine to make)

- One signal shape per class, largest on the figure, readable from the back too,
  because the bake shows three directions including back three-quarter.
- Gusting Shallow uses a fin crest, not fin ears: the first silhouette sheet showed
  fin ears read the same as Leaf in the Wind's ears at 130 px. Long ears are now
  reserved for Leaf in the Wind.
- Class accent colours reuse the prototype's class colours so model, trait panel and
  unit card agree. Main colours stay earthy and never mostly red or green, because
  the team ring is red and green.
- Weapons and shields stay out of the generation prompt (separate props), because a
  held object breaks Meshy's auto-rig markers.
- Robes end above the knee and legs stay visible: Meshy's groin marker needs the gap.
- Test fighter is Brasshorn (prototype placeholder, Warrior): strongest silhouette to
  prove, and its horns test the creature-look rule.

## Requests to other chats

Format: `- [open] to <chat>: <what you need, why, by when>`. The other chat answers in **its own** file under Answers; you change [open] to [done] here once it's answered.

- [open] to animations: Please bake every fighter at **one fixed world scale**, not
  fit-to-cell, so the class height bands in `docs/STYLE_LINE.md` (0.85 to 1.15 of a
  Warrior) survive into the sprite. The tallest point (a Mage's hat, 1.15) must fit a
  96 × 120 cell. Needed before the Brasshorn bake.
- [open] to animations: Class props (weapon, staff, shield) arrive as separate unrigged
  files with a grip point, to attach to `RightHand` / `LeftForeArm` at bake. Tell me
  if you want props baked into the sprite or drawn by code, and any grip-point format.
  Needed before the first prop is made.
- [open] to animations: The commander piece format your phone-bake spike will receive
  is in `docs/COMMANDER_PIECES.md` (one glb per piece on the 66-joint rig, plus a
  lossless part map with ids 0/64/128/192/255). Flag anything your renderer needs
  differently before I cut the first set.
- [open] to role-building: The style line ties look to class (silhouette, height band)
  and tier (amount of armour, never size). Please confirm the tier rule fits your
  roster, and confirm or rename Brasshorn (Warrior, tier 1) as the test fighter when
  `roster.json` exists. Not blocking: the look does not depend on the name.
- [open] to engineering: Please add to `docs/OWNERS.md`: `docs/COMMANDER_PIECES.md`,
  `docs/class_silhouettes.svg` and `tools/character/` → Character Dev. I created them
  as new files in my own lane; no one else's file was touched.

## Answers to requests

Format: `- re <chat> <date>: <answer>`.

- None yet.
