/* src/core/constants.js — owner: Engineering. Board size, gate row, rule numbers read from balance.json. */
const COLS=8, ROWS=12, GATE=6;
const RAID=DATA.balance.raid.seconds, SCOUT=DATA.balance.raid.scout, BENCH=DATA.balance.slots.bench, BOARD=DATA.balance.slots.board;
const TAU=Math.PI*2, SQ3=Math.sqrt(3);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
