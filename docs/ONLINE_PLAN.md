# Online & Accounts plan

Nov 6, 2026 · Online & Accounts chat · **Status: waiting for Doctor Def's approval.**
Nothing that collects personal data is built or switched on until this plan is approved.

## Bottom line

- **Everything online runs on Cloudflare's free tier** (a Worker plus a D1 database), with
  sign-in and parent emails sent through Resend's free tier. Expected hosting cost: **$0 a
  month** until the game is popular; the first upgrade is **$5 a month** (Workers Paid), which
  also lifts the 100-emails-a-day cap.
- **Guests play with no sign-up.** An account is only an email address that receives a
  6-digit code. No passwords are stored anywhere.
- **Under-13 players never give us their own email.** They play as guests; saving to an
  account asks for a parent's email, and nothing is created until the parent clicks consent.
- **Ghosts carry no personal data except a commander name**, and under-13 commanders appear
  to everyone else under a generated fantasy name.
- **The balance job runs itself each patch**, proposes changes as data plus a patch note,
  and never edits Role Building's numbers directly.

Already built on this branch, with no personal data involved: the ghost format checker, the
name blur, the age-screen logic, ghost matching with AI fill-in, and the balance job. All have
tests (`tests/online-accounts/`), and none of it is in the game build yet.

## Decisions for you

1. **Hosting: Cloudflare + Resend (recommended) or Base44 like Blacktop?**
   - *Cloudflare:* free up to roughly 19,000 runs a day; the studio already has a Cloudflare
     account (Blacktop's multiplayer credential lives there); Blacktop's own
     `BACKEND_MIGRATION.md` already names Cloudflare as where it is moving, so we skip that
     migration entirely. Cost: one-time setup by you (below).
   - *Base44:* the account flow Blacktop already ships, but the live app **stops working** when
     the month's integration credits run out (no overage billing), backend functions need the
     $50/month Builder plan, and Blacktop has already decided to leave it before launch.
2. **Under-13 commander names on ghosts: generated name (recommended) or blur only?**
   Showing a child's typed name to strangers counts as making their information public under
   COPPA, even blurred. A generated name ("Bram Ironvale") avoids that completely. The child
   still sees their own name on their own screen.
3. **Approve this plan** so I can build the parts that collect personal data: the email
   sign-in, the parent-consent email and name reports.

### One-time setup I'll need from you after approval (about 15 minutes, no cost)

I can't sign in to accounts or handle passwords for you, so these three steps are yours. I'll
send step-by-step instructions when we get there.

- Create a Cloudflare API token (deploy rights for Workers and D1) and paste it into the
  repo's GitHub secrets, not into chat.
- Create a free Resend account and add two DNS records so emails come from
  `play@mail.shamelessplugmedia.net`. A game domain can replace it later; buying one is a
  spend for you to OK once the trademark check is done.
- Add a privacy policy page (I'll write it; Engineering publishes it).

## Where things live

| Thing | Where | Cost |
|---|---|---|
| Ghost boards, accounts, name reports, balance results | Cloudflare D1 (database) | Free: 5 GB, 5M rows read and 100k rows written a day |
| The game's online API | One Cloudflare Worker | Free: 100k requests a day |
| Sign-in codes and parent-consent emails | Resend | Free: 3,000 a month, 100 a day |
| The balance job | Cloudflare Cron Trigger on the same Worker | Free |
| Guest progress, cosmetics, settings, age answer | The player's own device | Free |

**What hitting a free limit looks like:** online features pause until midnight UTC; the game
keeps working offline with AI boards; stored data is untouched; you get an email. Workers Paid
($5/month) removes the limit. I'll flag it when daily use passes half the free limit.

**Lesson from Blacktop:** its migration doc says accounts were "the one item that could turn
a weekend into longer". Passwordless email codes keep accounts to an email address, a code and
a session token, which is easy to move or hand over on a sale.

## Accounts and guests

- **Guest (default):** no sign-up. Progress, cosmetics and settings save on the device. A guest
  is told plainly that clearing the browser loses progress.
- **Account (13+):** type an email → get a 6-digit code (good for 10 minutes) → signed in on
  that device. The account keeps cosmetics and progress (unlocked fighters, relics, Legendary
  magic attacks, commander looks and name). Sign in on another device the same way.
- **What an account stores:** email, commander name and look, unlocks, cosmetics, created and
  last-seen dates. No birth year, no location, no device ID, no payment data.
- **Delete my account:** a button in settings deletes the account and its ghosts' names within
  30 days. Signed-in players can also export their data.

## Under-13 rules (US COPPA, Google Play Families)

The amended COPPA Rule has been fully in force since April 22, 2026. This design avoids
collecting children's personal data wherever it can, so most of the rule's heavier duties
(separate third-party consent, consent for targeted ads) never come up.

**Age screen.** On first launch: "What year were you born?" with an empty number field,
nothing preset, no year suggested, no hint that one answer unlocks more. Only the result is kept,
as one of `child` or `13plus`, on the device; the birth year itself is thrown away (this follows
the FTC's February 2026 policy on age checks). A birth year that could mean 12 or 13 counts as
`child`. The screen does not come back to be re-answered; a different answer needs the
browser's data cleared.

**What each age group gets:**

| | Under 13 or no answer | 13 and older |
|---|---|---|
| Play as guest | Yes, device save | Yes, device save |
| Account | Only with a parent's consent by email | Email code |
| Other commanders' names | Blurred: `J****n R****s` | Full names when signed in; blurred as a guest |
| Own name on ghosts | Generated fantasy name (decision 2) | Their commander name |
| Ads | Child-directed, non-personalized, from Families-certified networks only | Standard ads |
| Chat | None (no one has chat) | None |
| Report a name | Yes | Yes |

**Parent consent ("email plus", for data used only inside the game):**
1. The child taps "Save my progress" and is asked for **a parent's** email, nothing else.
2. We email the parent: what the account stores, that nothing is shared or sold, no ads are
   personalized, and a Consent button.
3. The parent clicks Consent → the account is created; sign-in codes go to the parent's email.
4. A second email follows the next day confirming it, with a one-click "revoke and delete".
5. No click within 14 days → the parent's email is deleted and nothing is created.

**Name blur.** Each name keeps its first and last letter with four stars between, so every
name looks the same length (`Jordan Rivers` → `J****n R****s`). A one- or two-letter name
shows as a single `*`.

**Name reports.** Any player can report a commander name with one tap and a reason from a list
(no free text). Three reports hide the name for everyone until reviewed; reviews come to you
as a weekly list. Reports are deleted after 90 days.

**Written policies COPPA requires** (I draft them, you approve): a data retention policy, a
short information security program, and the privacy policy page.

| Data | Kept for |
|---|---|
| Ghost boards | 180 days, or sooner as newer boards replace them |
| Pending parent email | 14 days, then deleted |
| Child accounts | Until deleted, or after 24 months with no sign-in |
| Name reports | 90 days |
| Sign-in codes | 10 minutes |

**Ads are not part of the first online release.** A web game cannot use the app ad kits on
Google's Families certified list; web ads (Google's H5 Games Ads) do support child-directed
tagging, but whether they pass Play's Families review inside an installed app must be checked
before any ad goes in. I'll bring that back as its own decision when ads are next.

## Ghosts

**Who becomes a ghost:** every run that reaches 12 wins (or goes on to 13), saved round by
round, so you always meet a board as it stood at your round.

**What a ghost holds (format v1):** per round — the fighters (which fighter, star level,
hex, items), the commander (hex, items, attribute, boss bonus stats, magic attack), relics,
the record before that round and the player's HP. Once per run — the commander's name and
look, the patch it was saved on, the final record.

**Ghosts always fight on today's numbers.** A ghost stores *which* fighters, stars and items it
had, never their HP or damage. The fight works those out from the current patch, so a balance
change applies to every saved ghost automatically. The only stats stored are the ones the run
itself earned (the commander's boss bonuses).

**Checks before a ghost is saved:** real fighters and items only, at most 8 units with exactly
one commander, stars 1 to 3, every unit on the player's half with no two on one hex, a record
that adds up round to round, at least 12 wins, at most 24 KB. A board that fails is rejected.
Tampered boards that pass the checks are the known gap; later the server can replay a fight to
confirm it, once the fight code is final.

**Matching:**
1. Find ghosts at your round with your exact record (wins and losses so far), saved within
   180 days, not your own, not one you have already met this run.
2. None? Widen to one win either way, then two.
3. Still none, or offline? A seeded **AI board** fills in, built from the current roster, with
   fighter count, tiers, stars and items rising with the round. The same run and round always
   get the same AI board.

At launch every fight is against AI boards; real ghosts take over as players finish winning
runs. Because only winning runs are saved, early-round ghosts are on the strong side; matching
by record softens that, and the AI curve is a data value we can tune.

**Storage:** about 20 KB per winning run. The pool keeps the newest 500 ghosts per round and
record, so the database stays far under the free 5 GB.

## Per-patch balance job

Runs automatically when a patch is cut, on the last patch's winning runs:

1. For every 12-win run, take its final board and count each class's share of the fighters
   (commander left out; a tier 5 fighter counts as its primary class).
2. Average each class's share across all runs. With 8 classes the average is 12.5%.
3. A class **more than 5 points above** average loses **3% to 5%** of its HP and damage: 3%
   at just over 5 points, rising to 5% at 10 points or more. A class **more than 5 points
   below** gains the same. (I read "below" as the same 5-point band; otherwise half the
   classes would be buffed every patch.)
4. Fewer than 100 winning runs on the patch → no changes; a class whose total change since
   launch would pass ±25% → flagged to Role Building instead of applied.
5. Output: a class multiplier file and a short patch note. Role Building reviews it, the
   Engineering chat ships it. Saved ghosts pick the new numbers up automatically.

Every number above (5 points, 3–5%, 100 runs, ±25%) is a data value, not code.

## Build order after approval

1. Worker and database on a test address; ghost upload and matching with no names.
2. Age screen, guest saves, name blur, generated names — tested on your phone.
3. Email sign-in for 13+, then the parent-consent flow — tested with your own email.
4. Name reports and the weekly review list.
5. Balance job on real data at the first patch.
6. Privacy policy, retention policy and security program live before any public test.

---

## Appendix for the other chats (engineering detail)

### API (one Worker)

| Endpoint | Does |
|---|---|
| `POST /ghost` | Save a winning run (format v1). No auth needed; rate-limited per network |
| `GET /match?round&wins&losses&run&seen` | Return one ghost round, or `204` meaning "use an AI board" |
| `POST /auth/code`, `POST /auth/verify` | Email code sign-in → session token |
| `POST /consent/start`, `GET /consent/:token` | Parent-consent email and click |
| `GET/PUT /me` | Account profile and progress |
| `DELETE /me` | Delete account |
| `POST /report` | Report a commander name (reason code only) |
| Cron | Balance job, retention clean-up, report digest |

### Ghost format v1

Source of truth: `src/online/ghost_format.js` (checker and limits). Coordinates are the fight's
own: `c` 0–7, `r` 6–11 is the player's half (`COLS=8, ROWS=12, GATE=6` from the prototype).

```json
{
  "v": 1,
  "runId": "r_8f3c…",
  "patch": "0.1.0",
  "name": { "first": "Jordan", "last": "Rivers", "generated": false },
  "look": { "hair": "h01", "torso": "t03", "weapon": "w02", "pigment": "p07" },
  "result": { "wins": 12, "losses": 3 },
  "rounds": [
    {
      "round": 1,
      "record": { "wins": 0, "losses": 0 },
      "hp": 500,
      "units": [ { "key": "brasshorn", "star": 1, "c": 2, "r": 7, "items": [] } ],
      "commander": { "c": 3, "r": 10, "items": [], "attribute": null, "bonus": {}, "magic": null },
      "relics": []
    }
  ]
}
```

### Files

| File | What |
|---|---|
| `src/online/ghost_format.js` | Format v1 limits and the checker |
| `src/online/privacy.js` | Age band, name blur, generated names, what a viewer sees, ad mode |
| `src/online/matching.js` | Ghost pick with widening, seeded AI board |
| `src/online/balance_job.js` | Class shares, proposed multipliers, patch note |
| `server/` | The Worker — built after approval |

Sources checked Nov 6, 2026: Cloudflare D1 limits and pricing, D1 free-tier enforcement
(Sept 1, 2026), Cloudflare Email Service pricing, Resend sending limits, Base44 plan
comparison, FTC amended COPPA Rule summaries, Google Play Families Self-Certified Ads SDK
policy, AdSense H5 Games Ads parameters.
