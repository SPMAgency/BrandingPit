# The style line — LOCKED 2026-11-06 (Doctor Def), colours open

**Status:** locked: base line, class lines, shapes, heights, creature, face, tier
and rig rules. Do not reopen (Blacktop's lesson: six of seven characters regenerated
because the line came late).

**Colours are NOT locked.** Doctor Def, 2026-11-06: colour is not important until
we deem it important. Until then every model gets a **random** main and accent colour,
rolled and recorded in its manifest (seed included), and the class colours below are
reference only. Two readability guards still apply because they are not taste: nothing
near-black (the outline swallows it) and never mostly red or green (the team ring).

Every Meshy prompt for a fighter or boss is built in this order, and nothing later
may contradict anything earlier:

1. **Base line** (below, verbatim)
2. **Class line** for its primary class (below, verbatim)
3. **The fighter's own details**: species look, colours, face, outfit

Shape guide for all eight classes at phone size: `docs/class_silhouettes.svg`
(front view, ~130 px, simple shapes, not final art).

## Base line (every fighter, verbatim)

> Full-body 3D game character for an all-ages fantasy arcade battler, front view,
> plain light background. Original two-legged humanoid fighter with stylised chunky
> proportions: big head, large hands and feet, bold simple face with big clear eyes,
> thick readable silhouette. Flat-shaded colour panels with no fine surface pattern
> and no small detail. One main colour and one accent colour, soft cartoon finish.
> Fully clothed, no blood, no scars. Strict A-pose: arms straight out about 45
> degrees from the body, hands open and empty, palms down, legs straight with a
> clear gap between them, both legs visible from the knee down. No numbers, no
> logos, no text, nothing in hand.

Why each part is there:

| phrase | reason |
|---|---|
| big head, large hands and feet, bold simple face | A face and a fist must read at ~130 px tall. Blacktop's near-realistic faces failed at 120 px |
| flat-shaded panels, no fine pattern | Pattern turns to noise at phone size (Blacktop: Nova's armour) |
| one main + one accent colour | The accent is the class colour, so colour backs up the silhouette |
| fully clothed, no blood, no scars | E10+ |
| strict A-pose, hands open and empty, clear gap between the legs | Meshy auto-rig places its markers from these; a held weapon or a closed robe breaks the rig |
| no numbers, no logos, no text, nothing in hand | Saves the 12-credit revision Blacktop paid on its first test |

## Class lines (the rubric)

Each class owns **one signal shape** that no other class uses. The signal is the
largest shape on the figure, and it must read from all three baked directions
(front three-quarter, side, back three-quarter).

| class | signal | height band | class line (verbatim) | reads from the back by |
|---|---|---|---|---|
| **Warrior** | wedge: widest shoulders | 1.00 | Warrior class: broad heavy build, the widest shoulders of any fighter, oversized round shoulder guards, thick arms with wrapped forearms, wide planted stance, bare head or a low crested helm. Rust-red accent on the shoulder guards and wraps. | shoulder guards |
| **Judge Mark** | block: square, flat top | 1.05 | Judge Mark class: square boxy build like a small walking tower, one solid slab chest plate, flat-topped head or a square crown, thick straight legs, upright stiff stance, armour in a few big plates. Brass-gold accent on the chest plate and crown. | flat top, square back plate |
| **Healer** | dome: wide round headwear | 0.90 | Healer class: short and round, soft rounded shapes everywhere, a wide rounded hat, cap or hood brim that is broader than the head, short tunic ending above the knee, a pouch at the hip, gentle face. Mint-green accent on the headwear and tunic trim. | dome headwear |
| **Mage** | spike: tallest point | 1.00 body, 1.15 with hat | Mage class: slim and upright, narrow shoulders, one tall pointed hat or pointed hood that is the highest point of the figure, high stiff collar, short split coat ending above the knee. Violet accent on the hat and collar. | the point |
| **Ember Keeper** | flare: upward flame crest + back lantern | 0.95 | Ember Keeper class: compact wiry build, hair or crest swept upward in solid flame shapes, a round lantern worn on the back between the shoulders, short coat with a jagged hem above the knee. Bright-orange accent on the crest and lantern. Flames are solid sculpted shapes, never loose fire. | lantern |
| **Gusting Shallow** | sweep: shapes trailing back | 1.00 | Gusting Shallow class: lean light build, a stiff scarf or fin-shaped mantle swept back from the shoulders, a swept-back fin crest over the head, loose sleeves gathered at the wrist, light on the toes. Sky-blue accent on the scarf and fins. Swept parts are stiff and end above the waist. | scarf and crest |
| **Leaf in the Wind** | small with big ears | 0.85 | Leaf in the Wind class: the smallest fighter, nimble and light, long pointed leaf-shaped ears, a short leaf-cut cape to the waist, wrapped shins, big feet in soft wraps, alert springy look. Olive and yellow-green accent on the cape and ears. | ears, leaf cape |
| **Quiet Concern** | needle: tall, narrow, masked | 1.05 | Quiet Concern class: tall and lean with long arms and legs, narrow waist, a close smooth cowl and a cloth mask over the lower face, long narrow gauntlets to the elbow, one short tassel hanging from the back of the cowl. Plum and magenta accent on the cowl and gauntlets. | narrow cowl, tassel |

Height bands are relative to the Warrior (1.00) at the top of the head, headwear
included. They only work if the bake keeps one world scale for every fighter rather
than fitting each model to its cell (request to Animations on the board).

**Reference only while colours are open.** These are the prototype's class colours; a
later colour pass may adopt them as model accents so trait panel, unit card and model
agree. Until then, the accent words in the class lines above are swapped for the
model's random roll:

| class | prototype colour | prompt words |
|---|---|---|
| Warrior | `#e0704f` | rust red |
| Judge Mark | `#cfae6b` | brass gold |
| Healer | `#5fcf8e` | mint green |
| Mage | `#9d7ff2` | violet |
| Ember Keeper | `#ff8a3d` | bright orange |
| Gusting Shallow | `#79cfe6` | sky blue |
| Leaf in the Wind | `#a6cc5c` | olive and yellow-green |
| Quiet Concern | `#cc72c6` | plum and magenta |

Two pairs sit close in colour (Healer and Leaf in the Wind are both green; Mage and
Quiet Concern are both purple). Their silhouettes are deliberately opposite: dome
against big ears, tall point against smooth narrow cowl, so colour is never the only
cue.

## Creature looks

Fighters are all two-legged humanoids on one rig. A fighter's creature identity comes
from its own details: horns, ears, tails, fur or scale colour, snouts, markings. Three
rules keep that from breaking the class read or the rig:

1. **Smaller than the class signal.** A Mage's horns stay below its hat; a Healer's
   antlers stay inside its hat brim. Never copy another class's signal (no Warrior
   with a pointed hat). Long pointed ears belong to Leaf in the Wind; on any other
   class, ears stay short.
2. **Close to the body.** Anything the rig has no bone for rides rigidly on the
   nearest one, so: horns and ears within about one head-width of the head; tails no
   longer than knee height and hanging close behind the legs; no wings.
3. **Markings are big flat shapes** (a stripe, a patch, a mask) in the accent or main
   colour. Never fine pattern, never text.

## Colour rules

- **Main colour** is a neutral or earthy tone: cream, sand, stone, slate, bark, moss.
  Skin, fur or scale counts as part of it.
- **Accent** is the model's rolled accent (later: possibly the class colour), on roughly a
  quarter of the visible surface at most.
- **No large saturated red or green.** Team is shown by the ring under the feet (green
  yours, red wild); a mostly red or mostly green fighter fights its own ring.
- **Nothing near-black.** The engine draws the outline; anything darker than a
  mid slate grey (about 30% lightness), hair included, disappears into it.

## Faces

Meshy exports no blend shapes, so each face is fixed for life. One friendly-confident
expression per fighter, mouth closed or slightly open, big eyes. No snarling teeth,
no glowing red eyes. Expression in a fight comes from pose, not the face.

## Tiers (proposal; Role Building owns who is which tier)

Tier shows in how much armour a fighter wears, never in size. Size belongs to class.

| tier | look |
|---|---|
| 1 | plain cloth and hide |
| 2 | one armour piece added |
| 3 | partial armour, a second accent area |
| 4 | most of the body armoured, one ornate piece |
| 5 | full armour plus its secondary attribute's mark: Wisest Battler a pale silver circlet, Recovery Pool a teal sash, Magnetic Composition steel-blue cuffs |

## Class props (never in the prompt)

Weapons, staffs and shields are separate prop files, attached to the hand bone at
bake time, so the body generates and rigs cleanly with empty hands. Proposed props:
Warrior one-handed blade or axe; Judge Mark square-headed hammer; Healer sprouting
staff; Mage rod with an orb; Ember Keeper short torch rod; Gusting Shallow crescent
glaive; Leaf in the Wind thorn dagger; Quiet Concern curved claw blade. Whether props
are drawn on the baked sprite is the Animations chat's call (request on the board).

## Bosses

Same base line, plus their own boss line (written when the first boss is designed):
bigger build, larger cell, and one class signal exaggerated. Budgeted separately; one
boss in memory at a time.

## Checks every new model must pass before it goes to Animations

1. **Class from silhouette.** Filled black at ~130 px in all three directions, beside
   one fighter of every other class, the class can be named.
2. **Height** within its class band.
3. **Signal** is the largest shape and belongs to this class only; creature parts are
   smaller and close to the body.
4. **Surface:** flat panels, no pattern that turns to noise at phone size.
5. **Colour:** accent on no more than about a quarter of the body;
   nothing near-black; not mostly red or green.
6. **E10+:** no blood, scars or gore; fully clothed; nothing suggestive; hands empty.
7. **Rig-safe:** strict A-pose, open empty hands, clear gap between the legs, legs
   visible from the knee down (no long robes), swept or hanging parts end above the
   waist or at the knee.
8. **Budget:** about 8,000 triangles after remesh (auto-rig refuses above 300,000).
9. **Export:** Mixamo skeleton template, glb, Animation All Added, single file; joint
   names checked against the template before anything else (66 joints).
10. **Licence:** generated on the paid plan under the Private licence, recorded in the
    model's manifest in `assets/source/<fighter>.json` with prompts, credits and date.

## Meshy recipe (measured on Blacktop, adjusted here)

| step | credits |
|---|---|
| Text to image (base line + class line + details) | 9 |
| Image to image refine (head and hands bigger, strict A-pose) | 12 |
| Image to 3D, Meshy 7.1 | 30 |
| Remesh to ~8,000 triangles (before rigging) | 0 |
| Auto-rig (check chin and groin markers), export through Mixamo template | 0 |
| **Total** | **51** |

Blacktop found the concept model ignores "exaggerated head and hands" on the first
pass; the refine round fixes it reliably, so it is budgeted rather than retried.

**Meshy's prompt box holds 800 characters.** The full base + class + details text is
longer, so Meshy gets a compact form that keeps every rule (Brasshorn's, 796 characters,
is in `assets/source/brasshorn.json` and is the template). Compact base line:

> 3D game character, full body, front view, plain light background. Original chunky
> cartoon humanoid fighter for an all-ages fantasy battler: big head, big hands and
> feet, bold simple face, big clear eyes, thick silhouette. Flat colour panels, no fine
> pattern. Fully clothed, no blood. Strict A-pose: arms straight out 45 degrees, hands
> open and empty, palms down, legs apart. No numbers, no logos, no text, nothing in hand.

Then a compact class line (its build and signal only) and the fighter's details.
Settings: 1 image, A-Pose; Image to 3D at Meshy 7.1, Standard resolution, texture on at
2K, A-Pose, Private. Measured cost on Brasshorn: 9 + 25 + 10 = **44 credits** with no
refine needed.

Refine prompt (swap the bracketed parts):

> Make the proportions more arcade: noticeably bigger head, about one fifth of the
> total height, and bigger hands and feet, bold simple face, while keeping [class
> build]. Put the arms in a strict A-pose, straight out about 45 degrees from the
> body, hands open and empty, palms down, a clear gap between the legs. Keep
> [signal, accent, outfit] and everything else exactly the same. No numbers, no
> logos, no text, nothing in hand.

## Test fighter (proposed): Brasshorn, Warrior, tier 1

Chosen because it is a tier 1 placeholder already in the Raid prototype, the
Warrior has the strongest silhouette to prove, and its horns test the creature-look
rule (horns smaller than the class signal). Role Building confirms the name when
`roster.json` exists; the look does not depend on it.

Own details, appended after the base and class lines:

> Brasshorn: stocky ram-like fighter with sand-coloured short fur, two curled
> bronze-brown horns tight against the sides of the head, smaller than the shoulder
> guards, cheerful confident grin, sleeveless cream hide vest, plain brown trousers,
> soft brown boots, rust-red round shoulder guards and rust-red forearm wraps.

**Colour roll for this run** (seed 1793971294): main **pale gold**, accent **lilac**.
Used in place of the colours above, and in place of "Rust-red accent" in the Warrior
class line:

> Brasshorn: stocky ram-like fighter with pale gold short fur, two curled lilac horns
> tight against the sides of the head, smaller than the shoulder guards, cheerful
> confident grin, sleeveless pale gold hide vest, plain pale gold trousers, soft pale
> gold boots, lilac round shoulder guards and lilac forearm wraps.

## Decision log

| date | decision |
|---|---|
| 2026-11-06 | Draft written (Character Dev). |
| 2026-11-06 | **Locked by Doctor Def**, except colours: random per model until colour is deemed important. Brasshorn test fighter and 51 credits approved. |
