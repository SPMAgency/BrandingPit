# Bug rubric — how a bug is found, logged, fixed and kept out

Engineering, 2026-11-07. Carried over from Blacktop Aether's rubric (its
`docs/BUG_RUBRIC.md`, written after its full bug sweep), cut to what fits a
game built from owned files instead of one patched file. Short on purpose.

The findings themselves live in `docs/AUDIT_TECH.md`.

## 1. The gates

Every push to `main` runs all of them (`npm test` locally, and the CI workflow
`.github/workflows/test.yml` on GitHub). **Red is red.** Nobody calls a gate
flaky without the log line that proves the harness, not the game, failed.

| Gate | Command | Proves | Owner |
| --- | --- | --- | --- |
| Build | `node tools/build.mjs` | every file in the manifest joins into one page | Engineering |
| Unit tests | `node --test "tests/**/*.test.mjs"` | each chat's own logic (engine, timing, online) | each chat |
| Timing | `node tools/timing_check.mjs` | every move obeys the timing contract; memory budget | Animations |
| Data | `node tests/role-building/data_check.mjs` | every data file is whole and consistent | Role Building |
| Arena | `node tests/arena/checks.mjs` | camera matches the bake; impact limits; reduced motion | Arena |
| Boot | `node tests/smoke.cjs` | the page starts, a unit card opens, a Raid finishes, 0 errors | Engineering |
| **Sweep** | `node tests/sweep.cjs` | **the whole game driven at random for several rounds: every button, drag, item, lure, overlay and phase; 0 page errors, 0 NaN** | Engineering |
| UI audit | `node tests/ui_audit.cjs` | every control fits the screen at 3 phone sizes and is at least 44 px to tap | Engineering |

The sweep and the UI audit are the two Blacktop learned it needed last: none
of its other gates ever pressed every button at once. UI audit runs in
**report** mode until its baseline findings are fixed (AUDIT_TECH.md B1);
after that it fails like the others.

Headless numbers (frame times, memory) are **read, never passed or failed**.
Headless Chromium is not a phone; only a phone reading closes a performance
bug (§4).

## 2. Change discipline

The game is one page built from files that **share one scope**: a name
declared in one file is visible in all of them.

1. **One owner per file** (`docs/OWNERS.md`). Need a change in someone
   else's file: post a request in your board file. Never edit it yourself.
2. **Never rename or delete a top-level name another file uses.** Grep the
   whole of `src/` for it first. The build's syntax check catches a name
   declared twice; nothing but grep catches one that vanished.
3. **Scripted edits anchor and assert.** A script that edits a file finds its
   anchor exactly once (`assert s.count(a) == 1`) before writing a byte, and
   every step stops on failure (`set -e`). Engineering's first failure here
   was a commit that ran after its edit script had stopped.
4. **Feel and balance ship OFF.** A change that alters how the game feels or
   balances goes behind a switch in its owner's data file, default off, with
   the default noted on the board. It goes on after Doctor Def's phone test.
5. **Say why in the commit.** Subject starts with your chat tag (`[eng]`,
   `[char]`, `[anim]`, `[act]`, `[role]`, `[sound]`, `[arena]`, `[online]`).
   Body says what was wrong, what you tried that failed, and what changed. A
   dead end written down costs one session; one not written down costs one
   per chat that finds it.

## 3. Where bugs come from (Blacktop's history, by count)

1. **A value read from two places.** One value, one accessor; every reader
   uses it. Grep for the raw name before merging.
2. **A tool that rebuilds a shipped list from a wider source.** A tool may
   refresh entries a shipped list already has, never add new ones.
3. **A cache that never empties.** Anything cached per fighter, per round or
   per frame has a cap and posts its worst-case MB on the board before it
   merges. Sprite memory is this game's ceiling (Animation Reboot plan §3).
4. **Headless passes, the phone does not.** A fix for a phone symptom is
   proven by a phone recording (`docs/BLOCKER_CHECKS.md`), never by a
   headless number.
5. **CI that edits the repo.** Workflows only report, in the job log. They
   never commit or rebase.
6. **Two chats, one line.** Solved here by one owner per file (§2.1).
7. **A wrong belief carried across chats.** A number or licence claim on the
   board names its evidence (a test, a commit, a URL read today). A claim
   without one is "unverified" until someone checks it.

## 4. Watching for new ones

- **Found, not fixed:** a chat that finds a bug in another chat's file writes
  it in its own board file with the repro and the owner's name. The owner
  answers in its next board check. A bug with no owner is Engineering's.
- **Device readings close bugs, not merges.** A phone bug closes when a
  recording of the fixed build passes its check.
- **The sweep's error and NaN counts** go in every build line on the board.

## 5. Severity

| Severity | Definition | Release rule |
| --- | --- | --- |
| **S1** | throws, freezes, loses progress, collects data it shouldn't, or breaks a store rule | nothing ships with an open S1 |
| **S2** | a feature does not do what the board says, or a licence or notice gap | fixed before any public test |
| **S3** | visual, wording, tooling or headless-only | fixed when touched; listed, never silently dropped |

Every bug in `docs/AUDIT_TECH.md` carries a severity, an owner and one of
**fixed** (commit named), **logged** (owner named, on the board) or **his**
(Doctor Def's decision or account).
