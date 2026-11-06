# Handoff — character-dev

Carried into this chat's next session. Update it at the end of every session.

## Where things stand (2026-11-06)

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

1. When Doctor Def approves the line: change STYLE_LINE.md header to LOCKED with the
   date, add his edits, log it in the decision table.
2. Ask in chat for the **51 credits** for Brasshorn, then run it in Meshy through
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

- Approve the style line (or edits).
- Commander: class-neutral look (attribute shown by code effect); two pigment slots
  (main + trim) across the outfit; 6 face presets + skin tint, one body type at launch.
- OK 51 credits for the Brasshorn test fighter.
