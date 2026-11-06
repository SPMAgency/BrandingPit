# Game data (Role Building)

How every role plays, as data. Owner: Role Building. Other chats read these files
and never edit them; ask on the Role Building section of `docs/STATUS.md`.
(`move_timing.json` in this folder belongs to Animations.)

| File | What it holds | Main readers |
|---|---|---|
| `classes.json` | 8 primary classes, 3 tier-5 secondary attributes, rank thresholds and per-rank numbers, the counter wheel | Actions/Functions |
| `abilities.json` | One ability per class, mana rules | Actions/Functions |
| `roster.json` | Who exists: class, tier, base stats, one-line concept; the commander's base stats. **Shared contract** | Character Dev, Animations, Actions/Functions |
| `items.json` | 4 components, 10 combined items, drop and equip rules | Actions/Functions |
| `relics.json` | Damage meter rules, relic offer odds, relic list | Actions/Functions |
| `magic.json` | Commander magic attacks by rarity, offer odds and streak bonus | Actions/Functions, Arena (looks) |
| `bosses.json` | Boss rules, loot boost per level, boss pool for levels 3, 6, 9, 12, 13 | Actions/Functions, Character Dev, Animations |
| `balance.json` | Run and Raid numbers, pen odds per round, copies per run, stars, combat formulas, the per-patch layer and Pit Conditions | Actions/Functions, Online & Accounts |

## Where each number came from

Every entry carries `source`:

- `design` — the design doc (live Claude Doc linked in `CLAUDE.md`).
- `prototype` — `prototype/raid.html`, already playable.
- `PROPOSED` — invented here to fill a gap; waiting for Doctor Def's OK.
  Fields listed in `proposed_fields` are PROPOSED even inside a `design` entry.

Files with `"status": "DRAFT"` (roster, relics, magic, bosses) are proposals as a whole.

## Two layers in five files

The game already reads `classes`, `abilities`, `roster`, `items` and `balance` through
`src/data/load.js` (Engineering). Those keys stay exactly as they were:
`colors`, `traits`, `counter`, the class-name ability entries, `fighters`, `commander`,
`components`, `recipes`, `stats`, `star`, `raid.seconds`, `raid.scout`, `slots`.
Everything else in each file is the full structure (ids, per-rank numbers, sources).
`data_check.mjs` fails if the two layers disagree, so a number is changed in both or not at all.

- `roster.fighters` is what the game plays today: the 12 prototype fighters.
  `roster.launch_roster` is the 25-fighter draft. On Doctor Def's approval, Role Building
  rewrites `fighters` from it; no code change is needed.
- `relics`, `magic` and `bosses` are not loaded by the game yet (Engineering adds them to
  `src/manifest.json` when Actions/Functions is ready for them).

## Rules for readers

- **Ids are stable.** Code refers to `warrior`, `brasshorn`, `cinder_crown`; display text comes from `name`.
- **Balance never needs code.** The fight multiplies base stats by `balance.patch.class_mods`, then
  `patch.fighter_mods`, then the active Pit Condition. The per-patch job (Online & Accounts)
  writes only the `patch` block, under `patch_job`. Saved ghosts fight on the current file.
- **Secondary ranks:** read `ranks`. If Doctor Def approves the re-cut, `proposed_ranks` will replace `ranks`.

## Design vs prototype, for Actions/Functions

The data follows the design doc where the two differ:

- Ember Keeper's flame sprite and Leaf in the Wind's root fire at any count in the prototype;
  the design switches them on at rank 4. Flame sprites stack up to 5 per enemy (the prototype keeps one).
- Healer revives: the prototype allows one per fight, as the data does.

## Check before merging

```
node tests/role-building/data_check.mjs
```

It checks shape, drift between the two layers, the locked style line's no-wings and no-size-words rules in concept lines, cross-references (every roster class exists, every component pair makes one item,
every rarity is filled), pen odds rows sum to 1, tier stats rise, boss HP rises by level, the patch
block covers every class, and E10+ wording in player-facing text. It must print PASS.
