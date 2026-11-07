# The Branding Pit — legal record

Engineering, 2026-11-07, first pass. **Not legal advice; this chat is not a
lawyer.** Facts with their sources, open items, and what needs a real lawyer
before a sale (marked **Lawyer**). If Doctor Def opens a Legal chat (CLOSEOUT
D6), it owns this file from then on. Owners act; this file never changes game
files.

## 1. Rights in what the game is made of

| Item | State | Evidence | What closes it |
| --- | --- | --- | --- |
| Fighter and commander models (Meshy) | Made under the paid plan, Private licence | `assets/source/*.json` manifests; Character Dev's ledger | Meshy's commercial-use terms for his plan, in writing (D4) |
| Motion from Blacktop's library | Not cleared for this game | Blacktop `docs/CLOSEOUT.md` licence table | Per clip: source and licence recorded by Animations before it is baked into a release |
| RenderHub mocap, order 419210 | Extended Use License | Blacktop CLOSEOUT | Does it cover a second game, and survive a sale (D4) **Lawyer** |
| Meshy AI motions (HY-Motion behind them) | Parked in Blacktop, not forgotten | Blacktop memory, 2026-11-06 | Licence of the underlying model, before release |
| Seele motion | **Never ships** (carried from Blacktop: Pro subscription cancelled) | Blacktop PROJECT_README | Closed |
| Music | Doctor Def's own productions | his statement | Credit line; any collaborator track needs written permission per track |
| Fonts (Google Fonts: Germania One, Spline Sans, Spline Sans Mono) | Open-licence (OFL) | fonts.google.com | Notices file and credits screen |
| Godot (bake tool) | MIT | godotengine.org | Notice only if Godot code ships; the bake output does not need one |

### 1a. Motion files on Doctor Def's computer, by likely source (2026-11-07, file names only)

From `Downloads/` on his PC, read by file name only; nothing was opened or copied.
"Likely source" is from the naming and the packs' contents, so each still gets
confirmed per clip before it is baked into a release.

| Group | Count | Likely source | Licence | Use here |
| --- | --- | --- | --- | --- |
| `Action Adventure Pack/` (with Mixamo's `X Bot.fbx`) | 23 FBX | Mixamo pack | **Royalty-free for commercial video games** (Adobe Mixamo FAQ, read 2026-11-07: helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) | idles, runs, turns, landings |
| `Soccer Game Pack/` | 55 FBX | Mixamo pack | same | blocks, throws, dives (few fit) |
| Loose FBX in `Downloads/` (Jab Cross, Big Body Blow, Big Kidney Hit, Light/Medium Hit To Head, Grab And Slam, Getting Thrown, Dodging Right, Dying, Taunt, Defender, Silly Dancing and others) | 35 FBX | Mixamo names; 2 wall-run files from Blacktop | same, once confirmed | **attacks, hit reactions, knockouts, taunts: the core of the fighter set** |
| Motion-named zips (`A hard punch`, `Celebrating victory_2`, `Zombie Attacking_2` and others) | 34 zips | Seele export naming | Seele | **never ships** |
| `BTAE/` Meshy exports (`Meshy_AI_*_animated_mixamo_*`) and `MOTION_MAP_2026-11-06.csv` (29 football motions) | — | Meshy, on Blacktop's characters | Meshy terms (D4); HY-Motion behind "Motion Prime" | football-specific; Branding Pit makes its own |
| `BTAE/21 football motion capture animations for blender3d.zip` | 1 pack | RenderHub (order 419210) | Extended Use (D4) | tackles; unlikely to fit |

**What this changes:** Mixamo's library is free to use in a commercial game,
is built for the same rig our fighters use, and also has spell casts, sword,
staff and bow sets. That can fill most of the gaps (cast, heal, ranged, weapon
swings) **at zero Meshy credits**, if the clips are downloaded from Mixamo
with Doctor Def's Adobe account. Animations confirms the source per clip at resume.

## 2. Players and data (Everyone 10+)

- **US COPPA and Google Play Families** apply because the audience includes
  under-13s. The plan for both is in `docs/ONLINE_PLAN.md`: neutral age screen,
  under-13s as guests with device saves, parent-consent email before an account,
  only Families-certified, non-personalised ads, no chat, names blurred for
  guests and under-13s. **Nothing that collects personal data runs until Doctor
  Def approves that plan** (D2).
- Sources read 2026-11-06: Google Play target audience and Families rules
  (support.google.com/googleplay/android-developer/answer/9867159).
- If accounts ship, Play requires account deletion both in the app and on a web
  page (Blacktop LEGAL §1a, same rule).

## 3. The name

- "The Branding Pit": no game by that name found on the web or Steam
  (2026-10-20). thebrandingpit.com is registered by someone else; brandingpitgame.com
  and others were available on IONOS that day.
- Trademark search and filing: **last**, when the game is ready for a store
  (carried from Blacktop's decision). **Lawyer**.

## 4. Rating

Target ESRB E10+ (Fantasy Violence, In-Game Purchases, Users Interact) through
the IARC questionnaire in Play Console. Rules that keep it there are in the
design doc's E10+ section: no blood, defeated fighters flash and vanish,
"defeat" not "kill", direct-purchase cosmetics only (no random paid items).
