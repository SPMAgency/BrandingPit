// Age screen, name blur, generated names and ad mode.
// Nothing here stores or sends anything; callers keep only the returned band on the device.

export const AGE_BANDS = { CHILD: 'child', ADULT: '13plus', UNKNOWN: 'unknown' };

/**
 * Turn the typed birth year into an age band. The year itself is not kept.
 * A year that could mean 12 or 13 (nowYear - year === 13) counts as child.
 * @returns 'child' | '13plus' | null (null = not a valid year, ask again)
 */
export function ageBand(typedYear, nowYear) {
  const s = String(typedYear ?? '').trim();
  if (!/^\d{4}$/.test(s)) return null;
  const y = Number(s);
  if (y > nowYear || y < nowYear - 120) return null;
  return nowYear - y <= 13 ? AGE_BANDS.CHILD : AGE_BANDS.ADULT;
}

/** Blur one name word: first and last letter with four stars; 1–2 letters → "*". */
export function blurWord(w) {
  const chars = Array.from(w);
  if (chars.length <= 2) return '*';
  return chars[0] + '****' + chars[chars.length - 1];
}

/** "Jordan Rivers" → "J****n R****s". Hyphens and apostrophes split words too. */
export function blurName(name) {
  return String(name).trim().split(/\s+/).filter(Boolean)
    .map(part => part.split(/([-'])/).map(p => (p === '-' || p === "'") ? p : (p ? blurWord(p) : p)).join(''))
    .join(' ');
}

/**
 * The commander name a viewer sees on a ghost.
 * @param ghostName {first, last, generated}
 * @param viewer {band, signedIn}
 */
export function nameForViewer(ghostName, viewer) {
  const full = `${ghostName.first} ${ghostName.last}`;
  if (ghostName.generated) return full;
  const seesFull = viewer && viewer.band === AGE_BANDS.ADULT && viewer.signedIn === true;
  return seesFull ? full : blurName(full);
}

// Original word lists for generated commander names (used for under-13 ghosts).
export const NAME_PARTS = {
  first: ['Ash', 'Bram', 'Cora', 'Dov', 'Elm', 'Fen', 'Gale', 'Hollis', 'Ivo', 'Juno', 'Kestrel', 'Lark',
    'Mira', 'Nell', 'Orrin', 'Pip', 'Quill', 'Rowan', 'Sable', 'Tamsin', 'Ulla', 'Vesper', 'Wren', 'Yarrow'],
  last: ['Ironvale', 'Emberly', 'Stonebrook', 'Galecrest', 'Moonmere', 'Thornfield', 'Brightwater', 'Ashdown',
    'Copperleaf', 'Duskhollow', 'Fernwick', 'Glimmerford', 'Hearthstone', 'Kettleby', 'Larkspire', 'Mossgate'],
};

function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

/** Same seed (the runId) → same generated name, so a ghost keeps one name everywhere. */
export function generatedName(seed) {
  const h = hash32(String(seed));
  return {
    first: NAME_PARTS.first[h % NAME_PARTS.first.length],
    last: NAME_PARTS.last[(h >>> 8) % NAME_PARTS.last.length],
    generated: true,
  };
}

/** Name written into a ghost at upload: children never publish their typed name. */
export function ghostNameFor(band, typed, runId) {
  if (band !== AGE_BANDS.ADULT) return generatedName(runId);
  return { first: typed.first, last: typed.last, generated: false };
}

/** Ad settings by age band. Child and unknown: child-directed and non-personalized only. */
export function adMode(band) {
  if (band === AGE_BANDS.ADULT) return { childDirected: false, personalizedAllowed: true, familiesCertifiedOnly: false };
  return { childDirected: true, personalizedAllowed: false, familiesCertifiedOnly: true };
}
