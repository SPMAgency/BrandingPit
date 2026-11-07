# Chat prompts

One chat per role, with a written handoff carried in (Blacktop's working-method
rules 10 and 11). Each file is paste-ready: open a new conversation **inside the
"Branding Pit - Game" claude.ai Project** and paste the text under the line.

| Prompt | Role | State |
| --- | --- | --- |
| `engineering.md` | Engineering & Head Producer (the main chat) | in use |
| `character-dev.md` | Character Dev | in use |
| `animations.md` | Animations | in use |
| `actions-functions.md` | Actions/Functions | in use |
| `role-building.md` | Role Building | in use |
| `sound-music.md` | Sound/Music | in use (not started) |
| `arena.md` | Arena | in use |
| `online-accounts.md` | Online & Accounts | in use |
| `legal.md` | Legal (proposed; writes no code) | ready, not opened (CLOSEOUT D6) |
| `qa-video.md` | QA/Video (proposed; writes no code) | ready, not opened (CLOSEOUT D6) |
| `NEXT_CHAT_TEMPLATE.md` | any new role | template |

## How the chats stay in sync

They do not talk to each other: separate conversations share nothing. The repo
is the bus. Every prompt carries the same protocol: pull first, read the board,
write only your own board file, put your board line in the same commit as the
work, run the gates before main.

## The coordination points (one writer, many readers)

- `src/data/move_timing.json` — Animations writes; Actions/Functions, Arena and Sound read.
- `src/data/*.json` rules and balance — Role Building writes; everyone reads.
- Contact events from the fight engine — Actions/Functions emits; Sound, Arena and Animations hook in.
- Ghost snapshot format — Online & Accounts writes; Actions/Functions reads.

## Why each prompt ends with a plan first

Each one asks for a two- or three-line plan before any work, so the session reads
the measured docs instead of skimming them, and leaves a target to hold the work to.
