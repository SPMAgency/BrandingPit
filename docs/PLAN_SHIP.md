# Ship plan — store-ready in three builds

Engineering, 2026-11-07. The shape Blacktop Aether uses, set now so every chat
builds toward it. The per-chat steps are written at Roadmap M5, when the
contents are known.

## Where it ships (decision D5 for Doctor Def)

The design says installable mobile web plus browser. Blacktop ships the same
web build as a Google Play app through its GitHub Actions pipeline (Capacitor).
**Engineering's recommendation: both**, reusing Blacktop's pipeline: the web
build for iPhone and desktop players, the Play app for Android. Play brings
its rules for a game whose audience includes under-13s (Families policy,
certified ads only, data safety form), which `docs/ONLINE_PLAN.md` already
plans for.

## The three builds (if Play is chosen)

Google Play with a personal account: internal testing, then a closed test with
12 testers for 14 consecutive days, then production. Three builds, and nothing
is added to a build after its list closes.

| Build | Purpose | Cut when |
| --- | --- | --- |
| **1 — the proof** (internal, his phones) | a full run with no freeze; the baseline every later build is measured against | M4 done, every gate green |
| **2 — the closed test** (12 testers, 14 days) | every store requirement met, every licence item closed | build 1's phone recordings pass `docs/BLOCKER_CHECKS.md` |
| **3 — production** | build 2 plus tester fixes only | day 14 with no open S1 |

## The release bar (carried from Blacktop)

- Nothing goes anywhere public until a build passes every gate and a full run
  on Doctor Def's phones with no freeze. The browser version must work too.
- Only Engineering cuts builds. Every build cut emails doctordefmusic@gmail.com
  with the subject "Resume Work" and a direct link to the build.
- Every build line on the board carries the gate results and the switch defaults.
