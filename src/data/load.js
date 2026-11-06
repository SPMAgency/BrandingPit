/* src/data/load.js — owner: Engineering. Turns the JSON data files into the tables the game uses. Edit the JSON, not this file. */
const strip=o=>{const r={};for(const k in o)if(k[0]!=='_')r[k]=o[k];return r;};
const CLASSES=DATA.classes.colors;
const TRAITS=DATA.classes.traits;
const ABIL=strip(DATA.abilities);
const BEATS=DATA.classes.counter.beats;
const BEATEN={};for(const k in BEATS)BEATEN[BEATS[k]]=k;
const COUNTER=DATA.classes.counter.bonus;
const ROSTER=DATA.roster.fighters;
const CMD=DATA.roster.commander;
const COMPS=DATA.items.components;
const ITEMS=DATA.items.recipes;
const ISTAT=DATA.items.stats;
const STAR=DATA.balance.star.atk, STARHP=DATA.balance.star.hp;
