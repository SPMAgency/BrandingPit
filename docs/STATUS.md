# Status board

**Changed 2026-11-06 08:15 ET: the board is now one file per chat, `docs/board/<chat>.md`.**
Write only in your own board file. To ask another chat for something, add it under
"Requests to other chats" in **your own** file; the other chat answers in **its** file.
One writer per file means pushes never conflict. This top page is written by
Engineering only.

## ⛔ ON HOLD — all chats stop until Blacktop Aether is published (Doctor Def, 2026-11-07 06:41 ET; extends the 11/6 halt)

Stop all work now. Do not start new tasks, spend credits, merge, or push anything else
to `main`. Finish nothing in progress: commit unfinished work to your own branch only,
note where you stopped in your handoff file, and stop. Cancel any check-ins you have
scheduled. Work resumes only when Doctor Def says so, after Blacktop Aether has a published version.

## How to read the board

1. This page (what's happening overall, what is waiting on Doctor Def).
2. Every file in `docs/board/`, looking for requests addressed `to <your chat>`.
   Quick way: `grep -rn "\[open\] to <your chat>" docs/board/`

## The protocol

Full form in `CLAUDE.md` and `docs/BUG_RUBRIC.md`; short form in `docs/PROJECT_README.md`.
Pull before you start; commit subjects carry your tag; your board line goes in the same
commit as the work; gates (`npm test` + `node tests/sweep.cjs`) before `main`; claims name
their evidence; found-not-fixed goes in your own file with the owner's name. Board checks
back off 5 min → 10 → 15 → 30 → 1 h → 3 h → 8 h → 24 h, reset by any activity for you.

## Overall

- 2026-11-06 — Repo set up. Eight chats opened. Animation reboot plan approved
  (https://claude.ai/artifact/JjBtCDAx9H4qNmpmJDSk6D).
- **2026-11-06 — Module split landed.** The game now builds from `src/`: 18 files, each
  with one owner (see `docs/OWNERS.md`, "How the build works"). Balance data is JSON in
  `src/data/`. `npm test` must pass before every push to main. Behaviour is unchanged
  from the prototype (smoke test passes on both; diff shows only the data move).

## Waiting on Doctor Def

- Everything waiting on him is in one table: `docs/CLOSEOUT.md`, D1–D6.

- **Licences for reusing Blacktop's motion in a second game** (one batch, from Blacktop's CLOSEOUT.md): (1) RenderHub mocap, order 419210, Extended Use License — does it cover a second game? (2) The Drive library "Seele Export" — which pack it came from, and its licence. (3) Meshy's commercial-use terms for your plan, in writing; they cover the Meshy-made motions.

- **Style line approval** — `docs/STYLE_LINE.md` (Character Dev). Answer in the Character Dev chat.
- **Commander pieces approval** — `docs/COMMANDER_PIECES.md` (Character Dev). Same chat.
