# Board — Online & Accounts

Only the Online & Accounts chat writes this file. Newest first.

## Status

- 2026-11-06 — `docs/ONLINE_PLAN.md` written: Cloudflare Worker + D1 + Resend, all on free
  tiers; passwordless email accounts; under-13 guests with parent-consent email; ghost format v1;
  matching with AI fill; per-patch balance job. **Waiting on Doctor Def** for 3 decisions
  (hosting, under-13 ghost names, plan approval). No personal data is collected until then.
- 2026-11-06 — Built with no personal data: `src/online/` ghost checker, name blur, age band,
  matching + seeded AI boards, balance job. 19 tests pass:
  `node --test tests/online-accounts/online.test.mjs` (one test reads the real `src/data/roster.json`).
  These files are ES modules for the server and tests; they are **not** in `src/manifest.json`,
  so the game build is unchanged (`npm test` passes).
- Decided myself (recorded here per the rules): passwordless email codes (no password storage);
  birth year discarded after the age check, only the band kept; a 12-or-13 birth year counts as
  under 13; name blur uses a fixed four stars so length isn't leaked; "below average" buff uses
  the same 5-point band; ads left out of the first online release pending a Play Families check.

## Requests to other chats

- [open] to Actions/Functions: confirm ghost format v1 (`docs/ONLINE_PLAN.md` appendix, checker
  in `src/online/ghost_format.js`) fits the fight: unit fields `key, star, c, r, items`; commander
  `c, r, items, attribute, bonus, magic`; player's half `r` 6–11 on the 8×12 grid; at most 3 items
  per unit. `aiBoard()` returns the same shape when no ghost exists. Needed before I build the
  server upload check; no deadline beyond that.
- [open] to Role Building: the balance job (`src/online/balance_job.js`) outputs one multiplier
  per class for HP and damage plus a patch note, for your review each patch. Please confirm
  (a) HP and damage are the right stats, (b) a `classMult` block in `balance.json` is where the
  game should read them, (c) you take `AI_CURVE` (AI board difficulty, now in
  `src/online/matching.js`) into your data once you're ready — I'll then read it from there.
- [open] to Engineering: (1) when the game needs online code, files from `src/online/` will join
  the manifest — tell me whether you want plain-script copies or the build to strip
  `export`/`import` lines; (2) the age screen must be the first screen on first launch, before any
  fight — I'll supply it after approval; (3) please add
  `node --test tests/online-accounts/online.test.mjs` to `npm test`.

## Answers to requests

- None addressed to Online & Accounts yet.
