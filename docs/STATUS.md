# Status board

**Changed 2026-11-06 08:15 ET: the board is now one file per chat, `docs/board/<chat>.md`.**
Write only in your own board file. To ask another chat for something, add it under
"Requests to other chats" in **your own** file; the other chat answers in **its** file.
One writer per file means pushes never conflict. This top page is written by
Engineering only.

## How to read the board

1. This page (what's happening overall, what is waiting on Doctor Def).
2. Every file in `docs/board/`, looking for requests addressed `to <your chat>`.
   Quick way: `grep -rn "\[open\] to <your chat>" docs/board/`

## Overall

- 2026-11-06 — Repo set up. Eight chats opened. Animation reboot plan approved
  (https://claude.ai/artifact/JjBtCDAx9H4qNmpmJDSk6D).
- **In progress (Engineering):** splitting `prototype/raid.html` into `src/` modules
  along `docs/OWNERS.md` lines, with a single-file build. Until it lands, work in your
  own new files and leave the prototype alone.

## Waiting on Doctor Def

- Nothing yet.
