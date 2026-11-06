# Source model manifests (Character Dev)

One JSON file per model: every fighter, boss, the commander base body and every
commander piece. The models themselves live in Google Drive (CLAUDE.md: large
source files stay out of git); the manifest is the record of how each was made,
so any model can be audited or regenerated.

Copy `_template.json` to `<id>.json`. A model is not handed to Animations until
every entry in `checks` is `true` (the list is in `docs/STYLE_LINE.md`).
