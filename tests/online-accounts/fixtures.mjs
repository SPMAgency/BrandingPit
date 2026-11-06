// Prototype roster (prototype/raid.html) used as test data only.
export const ROSTER = [
  { key: 'brasshorn', cls: 'Warrior', tier: 1 }, { key: 'mossling', cls: 'Healer', tier: 1 },
  { key: 'glintwick', cls: 'Mage', tier: 1 }, { key: 'pebblejaw', cls: 'Judge Mark', tier: 1 },
  { key: 'sparkfen', cls: 'Ember Keeper', tier: 1 }, { key: 'driftwing', cls: 'Gusting Shallow', tier: 2 },
  { key: 'hushfang', cls: 'Quiet Concern', tier: 2 }, { key: 'thistlestep', cls: 'Leaf in the Wind', tier: 2 },
  { key: 'ironbloom', cls: 'Warrior', tier: 2 }, { key: 'auricstag', cls: 'Healer', tier: 3 },
  { key: 'cindermarquis', cls: 'Ember Keeper', tier: 3 }, { key: 'galesovereign', cls: 'Gusting Shallow', tier: 3 },
];
export const CLASSES = ['Warrior', 'Healer', 'Mage', 'Judge Mark', 'Ember Keeper', 'Gusting Shallow', 'Quiet Concern', 'Leaf in the Wind'];
export const ITEMS = ['Bulwark Plate', 'Forge Gauntlet', 'Warden Charm', 'Swiftguard Boots', 'Cinder Crown', 'Spellflare Tome', 'Blaze Arrow', 'Dream Lantern', 'Whisper Veil', 'Storm Fan'];
export const classOf = k => (ROSTER.find(f => f.key === k) || {}).cls;

/** A valid 13-round, 12-1 winning run whose every round uses `keys` for its fighters. */
export function makeRun(runId, keys = ['brasshorn', 'pebblejaw', 'glintwick'], { wins = 12, losses = 1 } = {}) {
  const rounds = [];
  let w = 0, l = 0;
  const total = wins + losses;
  for (let i = 0; i < total; i++) {
    rounds.push({
      round: i + 1,
      record: { wins: w, losses: l },
      hp: 500 - l * 30,
      units: keys.map((key, j) => ({ key, star: 1, c: j, r: 7, items: [] })),
      commander: { c: 3, r: 10, items: [], attribute: null, bonus: {}, magic: null },
      relics: [],
    });
    if (i === 2 && l < losses) l++; else w++;
  }
  return { v: 1, runId, patch: '0.1.0', name: { first: 'Jordan', last: 'Rivers', generated: false }, look: {}, result: { wins, losses }, rounds };
}
