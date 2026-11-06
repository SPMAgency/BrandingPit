# Handoff — character-dev

Carried into this chat's next session. Update it at the end of every session.

## Where things stand (2026-11-06 08:35)

- **RESUME HERE:** Brasshorn textured model exists in Meshy (My generations, Model
  tab, first tile, 499,184 faces). Do: remesh to ~8,000 → auto-rig (check chin and
  groin markers) → export glb, Mixamo template, All Added, single file. All free.
  44 of 51 approved credits spent. Paused because the Chrome extension disconnected.
- Style line is LOCKED (colours open, random roll per model). Commander plan approved.

- `docs/STYLE_LINE.md` — DRAFT, awaiting Doctor Def. Base line, 8 class lines, colour,
  creature, face and tier rules, 10 per-model checks, Meshy recipe, Brasshorn prompt.
- `docs/COMMANDER_PIECES.md` — PROPOSAL, awaiting Doctor Def. Base body, slot seams,
  part-map pigments, cutting tool plan, pass/fail test.
- `docs/class_silhouettes.svg` — shape guide; regenerate with
  `python3 tools/character/silhouettes.py docs/class_silhouettes.svg` (byte-identical).
- `assets/source/_template.json` — manifest every model fills in.
- Board requests open to Animations (fixed bake scale, props, commander format),
  Role Building (tier rule, test fighter name), Engineering (OWNERS lines).
- **Credits spent: 0.**

## Next step

2. (Done up to the 3D model.) Run Brasshorn in Meshy through
   Claude in Chrome (Blacktop's `docs/prompts/MESHY_CHROME.md` rules: new tab, never
   enter credentials or payment, ask before any download and name its size, stop after
   two identical failures and diagnose on the board).
   Confirm in Meshy first: paid plan active, Private licence on the model, balance.
3. Recipe: text-to-image (base + class + details) → refine prompt → image to 3D
   (Meshy 7.1) → remesh ~8,000 tris → auto-rig (check chin/groin markers) → export
   glb, Mixamo template, All Added, single file.
4. The download lands on Doctor Def's computer; stage it through the linked-device
   tools if a folder is connected, otherwise ask him to attach it. Raw file to Google
   Drive, manifest to `assets/source/brasshorn.json`, check joint names (66) with
   Blacktop's `tools/glb_rig_report.py` / `glb_verify_rig.py`, then hand to Animations
   on the board.

## Open questions for Doctor Def

- Re-open Chrome with the Claude extension so the remesh/rig/export can finish.
- Before downloading the export: confirm the file name and size.
