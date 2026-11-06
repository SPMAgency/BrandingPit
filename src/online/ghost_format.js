// Ghost snapshot format v1 — owned by Online & Accounts, read by Actions/Functions.
// A ghost stores WHAT a board had (fighters, stars, hexes, items), never derived stats,
// so saved ghosts always fight on the current patch's numbers.
// Every limit below is data; change it here, not in callers.

export const GHOST_VERSION = 1;

export const LIMITS = {
  cols: 8,            // prototype COLS
  rows: 12,           // prototype ROWS
  gate: 6,            // player's half is r >= gate
  maxUnits: 7,        // fighters on the board, commander not included (8 with commander)
  maxStar: 3,
  maxItemsPerUnit: 3,
  maxRounds: 13,
  winTarget: 12,
  startHp: 500,
  nameMax: 16,
  maxBytes: 24 * 1024,
  maxRelics: 8,
};

const NAME_RE = /^[\p{L}][\p{L}' -]*$/u;
const ID_RE = /^[a-z0-9_]{1,40}$/i;

function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }

function checkName(n, errs) {
  if (!isObj(n)) { errs.push('name missing'); return; }
  for (const part of ['first', 'last']) {
    const s = n[part];
    if (typeof s !== 'string' || !s.length) { errs.push(`name.${part} missing`); continue; }
    if (s.length > LIMITS.nameMax) errs.push(`name.${part} longer than ${LIMITS.nameMax}`);
    if (!NAME_RE.test(s)) errs.push(`name.${part} has characters that are not letters, spaces, hyphens or apostrophes`);
  }
  if (typeof n.generated !== 'boolean') errs.push('name.generated must be true or false');
}

function checkHex(o, where, taken, errs) {
  const { cols, rows, gate } = LIMITS;
  if (!Number.isInteger(o.c) || o.c < 0 || o.c >= cols) errs.push(`${where}: column out of range`);
  if (!Number.isInteger(o.r) || o.r < gate || o.r >= rows) errs.push(`${where}: row not on the player's half`);
  const k = o.c + ',' + o.r;
  if (taken.has(k)) errs.push(`${where}: shares a hex with another unit`);
  taken.add(k);
}

function checkItems(items, where, cat, errs) {
  if (!Array.isArray(items)) { errs.push(`${where}: items must be a list`); return; }
  if (items.length > LIMITS.maxItemsPerUnit) errs.push(`${where}: more than ${LIMITS.maxItemsPerUnit} items`);
  if (cat.items) for (const it of items) if (!cat.items.has(it)) errs.push(`${where}: unknown item "${it}"`);
}

/**
 * Check a ghost run before it is saved or served.
 * @param run   the snapshot (parsed JSON)
 * @param cat   optional catalogues from the current data files:
 *              { roster: Set<key>, items: Set<name>, magic: Set<id>, relics: Set<id>, classes: Set<name> }
 * @returns {{ok: boolean, errors: string[]}}
 */
export function validateGhost(run, cat = {}) {
  const errs = [];
  if (!isObj(run)) return { ok: false, errors: ['not an object'] };

  const bytes = new TextEncoder().encode(JSON.stringify(run)).length;
  if (bytes > LIMITS.maxBytes) errs.push(`too big: ${bytes} bytes (limit ${LIMITS.maxBytes})`);

  if (run.v !== GHOST_VERSION) errs.push(`unknown format version ${run.v}`);
  if (typeof run.runId !== 'string' || !ID_RE.test(run.runId)) errs.push('runId missing or malformed');
  if (typeof run.patch !== 'string' || !run.patch) errs.push('patch missing');
  checkName(run.name, errs);
  if (run.look !== undefined && !isObj(run.look)) errs.push('look must be an object');

  const res = run.result;
  if (!isObj(res) || !Number.isInteger(res.wins) || !Number.isInteger(res.losses)) errs.push('result missing');
  else if (res.wins < LIMITS.winTarget) errs.push(`only runs with ${LIMITS.winTarget}+ wins become ghosts`);

  const rounds = run.rounds;
  if (!Array.isArray(rounds) || !rounds.length) { errs.push('rounds missing'); return { ok: false, errors: errs }; }
  if (rounds.length > LIMITS.maxRounds) errs.push(`more than ${LIMITS.maxRounds} rounds`);

  let prev = null;
  rounds.forEach((rd, i) => {
    const w = `round ${i + 1}`;
    if (!isObj(rd)) { errs.push(`${w}: not an object`); return; }
    if (rd.round !== i + 1) errs.push(`${w}: round number should be ${i + 1}`);
    const rec = rd.record;
    if (!isObj(rec) || !Number.isInteger(rec.wins) || !Number.isInteger(rec.losses)) errs.push(`${w}: record missing`);
    else {
      if (rec.wins + rec.losses !== i) errs.push(`${w}: record should add up to ${i} fights before this round`);
      if (prev && (rec.wins < prev.wins || rec.losses < prev.losses)) errs.push(`${w}: record went backwards`);
      prev = rec;
    }
    if (typeof rd.hp !== 'number' || rd.hp <= 0 || rd.hp > LIMITS.startHp) errs.push(`${w}: hp out of range`);

    const taken = new Set();
    if (!Array.isArray(rd.units)) errs.push(`${w}: units must be a list`);
    else {
      if (rd.units.length > LIMITS.maxUnits) errs.push(`${w}: more than ${LIMITS.maxUnits} fighters plus the commander`);
      rd.units.forEach((u, j) => {
        const uw = `${w} unit ${j + 1}`;
        if (!isObj(u)) { errs.push(`${uw}: not an object`); return; }
        if (typeof u.key !== 'string' || u.key === 'cmd') errs.push(`${uw}: bad fighter key`);
        else if (cat.roster && !cat.roster.has(u.key)) errs.push(`${uw}: unknown fighter "${u.key}"`);
        if (!Number.isInteger(u.star) || u.star < 1 || u.star > LIMITS.maxStar) errs.push(`${uw}: star must be 1 to ${LIMITS.maxStar}`);
        checkHex(u, uw, taken, errs);
        checkItems(u.items, uw, cat, errs);
        for (const k of ['hp', 'atk', 'as', 'armor', 'mr', 'stats']) if (k in u) errs.push(`${uw}: stores "${k}" — ghosts must not carry patch stats`);
      });
    }

    const cm = rd.commander;
    if (!isObj(cm)) errs.push(`${w}: commander missing`);
    else {
      checkHex(cm, `${w} commander`, taken, errs);
      checkItems(cm.items, `${w} commander`, cat, errs);
      if (cm.attribute !== null && typeof cm.attribute !== 'string') errs.push(`${w} commander: attribute must be a class or null`);
      else if (cm.attribute && cat.classes && !cat.classes.has(cm.attribute)) errs.push(`${w} commander: unknown attribute "${cm.attribute}"`);
      if (!isObj(cm.bonus)) errs.push(`${w} commander: bonus must be an object`);
      else for (const [k, v] of Object.entries(cm.bonus)) if (typeof v !== 'number' || !isFinite(v)) errs.push(`${w} commander: bonus ${k} not a number`);
      if (cm.magic !== null) {
        if (!isObj(cm.magic) || typeof cm.magic.id !== 'string') errs.push(`${w} commander: magic must be {id, rarity} or null`);
        else if (cat.magic && !cat.magic.has(cm.magic.id)) errs.push(`${w} commander: unknown magic attack "${cm.magic.id}"`);
      }
    }

    if (!Array.isArray(rd.relics) || rd.relics.length > LIMITS.maxRelics) errs.push(`${w}: relics must be a list of at most ${LIMITS.maxRelics}`);
    else if (cat.relics) for (const r of rd.relics) if (!cat.relics.has(r)) errs.push(`${w}: unknown relic "${r}"`);
  });

  return { ok: errs.length === 0, errors: errs };
}

/** The single round of a ghost a match serves. */
export function ghostRound(run, round) {
  return run.rounds.find(r => r.round === round) || null;
}
