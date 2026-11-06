# Handoff — online-accounts

Carried into this chat's next session. Update it at the end of every session.

## Where things stand (2026-11-06)

- `docs/ONLINE_PLAN.md` written and merged; **waiting on Doctor Def's approval**.
- Built, no personal data, merged to `main`:
  - `src/online/ghost_format.js` — ghost format v1 limits + `validateGhost()`
  - `src/online/privacy.js` — `ageBand()`, `blurName()`, `nameForViewer()`, `generatedName()`, `adMode()`
  - `src/online/matching.js` — `pickGhost()` (exact record → ±1 → ±2 wins → null) and seeded `aiBoard()`
  - `src/online/balance_job.js` — `classShares()`, `changePct()`, `proposePatch()` + patch note
  - Tests: `node --test tests/online-accounts/online.test.mjs` (19 pass). Node 22 needs the file path, not the folder.
- Requests posted in `docs/board/online-accounts.md` to Actions/Functions (format fit), Role Building (balance stats,
  where multipliers live, AI curve ownership) and Engineering (manifest format for online files, age screen first, add my tests to `npm test`).
- `src/online/` files are ES modules and NOT in `src/manifest.json`; the game build joins files into one scope, so they need conversion before the game loads them.

## Decisions asked of Doctor Def

1. Hosting: Cloudflare Worker + D1 + Resend (recommended) vs Base44.
2. Under-13 commander names on ghosts: generated name (recommended) vs blur only.
3. Approve the plan → unlocks building the Worker, email sign-in, parent consent, reports.

## Next step (after approval)

1. Send Doctor Def the one-time setup steps: Cloudflare API token into GitHub secrets
   (`CLOUDFLARE_API_TOKEN`), Resend account + DNS for `mail.shamelessplugmedia.net`.
2. Build `server/` Worker on a test address: `POST /ghost`, `GET /match` first (no names).
3. Age screen UI in `src/online/` for Engineering to place first in boot.
4. Draft privacy policy, retention policy, security program.

## Things not to forget

- Ads are out of the first online release; check H5 Games Ads vs Play Families review before adding.
- Interpretation flagged in plan: "below average" buff uses the same 5-point band.
- `AI_CURVE` should move to Role Building's data once `roster.json` exists.
- Prototype grid is 8 columns × 12 rows, player half r ≥ 6 (design doc says "12x8").

## Open questions for Doctor Def

- The three decisions above.
