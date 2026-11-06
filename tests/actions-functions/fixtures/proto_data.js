// Test data: the Raid prototype's numbers (prototype/raid.html) and the design
// doc's tables, in the shape src/sim/ reads. This is NOT the game's data: Role
// Building's src/data/*.json replaces it. Values marked PROPOSED were not in
// the prototype or the design doc.

const penOdds = [];
const t45 = { 7: [0.04, 0.01], 8: [0.06, 0.02], 9: [0.08, 0.03], 10: [0.10, 0.04], 11: [0.12, 0.05], 12: [0.14, 0.06], 13: [0.14, 0.06] };
for (let r = 1; r <= 13; r++) {
  const p3 = Math.min(0.06 + 0.04 * r, 0.3), p2 = Math.min(0.25 + 0.05 * r, 0.45);
  const [p4, p5] = t45[r] || [0, 0];
  penOdds.push([1 - p2 - p3 - p4 - p5, p2, p3, p4, p5]);
}

export default {
  board: { cols: 8, rows: 12, exitRow: 0 },
  combat: {
    baseCrit: 0.25, critDamage: 1.4, armorK: 100, defaultArmor: 25, defaultMr: 25,
    manaPerAttack: 10, manaOnHitPct: 0.05, manaOnHitCap: 10, jitter: 0.05,
    retargetSec: 0.6, firstAttackSec: [0.1, 0.5], pathJitter: 0.25,
    moveSpeed: { you: 2.8, foe: 2.8, pen: 2.4, boss: 2.4, default: 2.6 },
    projectileSpeed: { attack: 11, ability: 8 },
    stunSec: 2.0, knockupSec: 0.6,
    starStats: { hp: [1, 1.8, 3.24], atk: [1, 1.8, 3.24] },
    itemSlots: 3,
    timeLimitSec: 30, // PROPOSED: ghost fight "about 30 s"
  },
  impact: { hitStopMs: 60 },
  raid: {
    seconds: 15, scoutSeconds: 2, brands: 3,
    penRows: [1, 4], runnerRow: 5,
    penSizeByRound: [6, 6, 7, 7, 8],
    penOdds,
    runnerTiers: [3, 4, 5], guaranteedRunnerTier: 3, // PROPOSED: prototype ran tier 3 only
    runnerFleeSec: [4.5, 6.5], runnerSpeed: 1.45, runnerHp: 0.9,
    lootChance: 0.35, lureShare: 0.5,
    penScale: { hpBase: 0.55, hpPerRound: 0.08, atkBase: 0.6, atkPerRound: 0.06 },
  },
  run: {
    startHp: 500, lossPerUnit: 10, lossCommander: 13, bossLossHpFraction: 0.5, winTarget: 12,
    benchSize: 8, boardSize: 8,
    timeoutCountsAs: 'loss', // PROPOSED: decision for Doctor Def
  },
  counter: {
    bonus: 0.15,
    beats: { 'Warrior': 'Mage', 'Mage': 'Judge Mark', 'Judge Mark': 'Quiet Concern', 'Quiet Concern': 'Healer', 'Healer': 'Ember Keeper', 'Ember Keeper': 'Leaf in the Wind', 'Leaf in the Wind': 'Gusting Shallow', 'Gusting Shallow': 'Warrior' },
  },
  classes: {
    'Warrior': { ranks: [3, 5, 8], stackPerHit: 0.5, stackCap: [1, 2, 3.5] },
    'Healer': { ranks: [3, 5, 7, 8], unitRevivePct: [0.5, 1, 1, 1], commanderRevivePct: [0, 0, 0.5, 1], revivesPerFight: 1, autoReviveDelaySec: 0.8 },
    'Mage': { ranks: [3, 5] },
    'Judge Mark': { ranks: [2, 4, 5], armorPct: [0.2, 0.25, 0.4], slowChance: [0.05, 0.18, 0.35], slowSec: 2, slowFactor: 0.7 },
    'Ember Keeper': { ranks: [4, 5], everyNth: 5, spritePctPerSec: 0.03, spriteSec: 3, maxSprites: 5, bonusHitPct: [0, 0.03] },
    'Gusting Shallow': { ranks: [4, 5], everyNth: 3, stunSec: [1.5, 3.0] },
    'Quiet Concern': { ranks: [1, 5], critRate: [0.05, 0.3], critDamage: [0.05, 1.0] },
    'Leaf in the Wind': { ranks: [4, 5], rootChance: [0.2, 0.2], rootSec: 1.5, attackSpeedPct: [0, 0.3] },
    'Wisest Battler': { ranks: [3], decayEveryNth: 3, armorDecayByStar: [0.15, 0.25, 0.35], armorPenRankBonusByStar: [0.15, 0.25, 0.35] },
    'Recovery Pool': { ranks: [4, 5], everyNth: [5, 4], lifeStealPct: [0.2, 0.3] },
    'Magnetic Composition': { ranks: [1, 3, 4], stunChance: [0.1, 0.15, 0.3], stunSec: 2.0 },
  },
  abilities: {
    'Warrior': { name: 'Cleave', mana: 60, kind: 'cleave', mult: 1.8, radius: 1, canCrit: true },
    'Healer': { name: 'Mend', mana: 70, kind: 'heal', mult: 2.5, flat: 80, anyRange: true },
    'Mage': { name: 'Arcane Bolt', mana: 60, kind: 'strike', mult: 3.2, dmgType: 'magic', projectile: true },
    'Judge Mark': { name: 'Bastion', mana: 80, kind: 'shield', pct: 0.3, sec: 4 },
    'Ember Keeper': { name: 'Ember Burst', mana: 60, kind: 'strike', mult: 1.5, dmgType: 'magic', projectile: true, burnSec: 3 },
    'Gusting Shallow': { name: 'Updraft', mana: 70, kind: 'strike', mult: 1.2, stunSec: 1.5, knockup: true },
    'Quiet Concern': { name: 'Shadow Strike', mana: 50, kind: 'strike', mult: 2, canCrit: true, forceCrit: true },
    'Leaf in the Wind': { name: 'Leaf Step', mana: 60, kind: 'strike', mult: 1.5, rootSec: 1.5, blink: true, canCrit: true, anyRange: true },
  },
  roster: {
    brasshorn: { name: 'Brasshorn', cls: 'Warrior', tier: 1, hp: 650, atk: 50, as: 0.7, range: 1, armor: 35 },
    mossling: { name: 'Mossling', cls: 'Healer', tier: 1, hp: 450, atk: 35, as: 0.65, range: 3 },
    glintwick: { name: 'Glintwick', cls: 'Mage', tier: 1, hp: 420, atk: 40, as: 0.65, range: 3 },
    pebblejaw: { name: 'Pebblejaw', cls: 'Judge Mark', tier: 1, hp: 700, atk: 42, as: 0.6, range: 1, armor: 45 },
    sparkfen: { name: 'Sparkfen', cls: 'Ember Keeper', tier: 1, hp: 480, atk: 45, as: 0.7, range: 2 },
    driftwing: { name: 'Driftwing', cls: 'Gusting Shallow', tier: 2, hp: 600, atk: 55, as: 0.7, range: 2 },
    hushfang: { name: 'Hushfang', cls: 'Quiet Concern', tier: 2, hp: 600, atk: 65, as: 0.8, range: 1 },
    thistlestep: { name: 'Thistlestep', cls: 'Leaf in the Wind', tier: 2, hp: 620, atk: 58, as: 0.75, range: 1 },
    ironbloom: { name: 'Ironbloom', cls: 'Warrior', tier: 2, hp: 850, atk: 60, as: 0.65, range: 1, armor: 40 },
    auricstag: { name: 'Auric Stag', cls: 'Healer', tier: 3, hp: 800, atk: 60, as: 0.7, range: 3 },
    cindermarquis: { name: 'Cinder Marquis', cls: 'Ember Keeper', tier: 3, hp: 820, atk: 70, as: 0.7, range: 2 },
    galesovereign: { name: 'Gale Sovereign', cls: 'Gusting Shallow', tier: 3, hp: 880, atk: 68, as: 0.75, range: 1 },
    // Test-only tier 5 placeholders so secondary attributes run. Not roster proposals.
    test_t5_wise: { name: 'Test T5 A', cls: 'Warrior', secondary: 'Wisest Battler', tier: 5, hp: 1200, atk: 90, as: 0.75, range: 1, armor: 40 },
    test_t5_magnet: { name: 'Test T5 B', cls: 'Mage', secondary: 'Magnetic Composition', tier: 5, hp: 900, atk: 80, as: 0.7, range: 3 },
  },
  commander: { name: 'Commander', hp: 1000, atk: 70, as: 0.75, range: 1, armor: 35, mr: 35 },
  items: {
    components: ['Iron Shard', 'Ember Thread', 'Moon Bead', 'Gale Feather'],
    recipes: { 'Iron Shard+Iron Shard': 'Bulwark Plate', 'Ember Thread+Iron Shard': 'Forge Gauntlet', 'Iron Shard+Moon Bead': 'Warden Charm', 'Gale Feather+Iron Shard': 'Swiftguard Boots', 'Ember Thread+Ember Thread': 'Cinder Crown', 'Ember Thread+Moon Bead': 'Spellflare Tome', 'Ember Thread+Gale Feather': 'Blaze Arrow', 'Moon Bead+Moon Bead': 'Dream Lantern', 'Gale Feather+Moon Bead': 'Whisper Veil', 'Gale Feather+Gale Feather': 'Storm Fan' },
    stats: {
      'Bulwark Plate': { armor: 40, hp: 150 }, 'Forge Gauntlet': { atk: 0.25, armor: 15 }, 'Warden Charm': { mr: 40, hp: 150 },
      'Swiftguard Boots': { as: 0.25, armor: 15 }, 'Cinder Crown': { atk: 0.4 }, 'Spellflare Tome': { ap: 0.4, mana: 15 },
      'Blaze Arrow': { atk: 0.15, as: 0.2 }, 'Dream Lantern': { mana: 30 }, 'Whisper Veil': { mr: 25, as: 0.15 }, 'Storm Fan': { as: 0.45 },
    },
  },
  // Animations' numbers until src/data/move_timing.json lands: the reboot plan's
  // 6-frame attack (2 wind-up, 1 contact, 3 recovery). Cast length is PROPOSED.
  timingFallback: {
    attack: { su: 2, ac: 1, rc: 3 },
    cast: { su: 10, ac: 5, rc: 15 },
  },
};

// The prototype's opening board and bench.
export const startBoard = [
  { uid: 'c', key: 'cmd', c: 3, r: 10, items: [] },
  { uid: 'a', key: 'brasshorn', star: 1, c: 2, r: 7, items: [] },
  { uid: 'b', key: 'pebblejaw', star: 1, c: 4, r: 7, items: [] },
  { uid: 'd', key: 'glintwick', star: 1, c: 5, r: 9, items: [] },
];

// A mid-run board with traits switched on, for ghost fights.
export const midBoard = [
  { uid: 'm0', key: 'cmd', c: 3, r: 10, items: ['Bulwark Plate'] },
  { uid: 'm1', key: 'brasshorn', star: 2, c: 1, r: 7, items: ['Forge Gauntlet'] },
  { uid: 'm2', key: 'ironbloom', star: 1, c: 3, r: 7, items: [] },
  { uid: 'm3', key: 'brasshorn', star: 1, c: 5, r: 7, items: [] },
  { uid: 'm4', key: 'mossling', star: 2, c: 2, r: 9, items: [] },
  { uid: 'm5', key: 'auricstag', star: 1, c: 4, r: 9, items: [] },
  { uid: 'm6', key: 'mossling', star: 1, c: 6, r: 9, items: [] },
  { uid: 'm7', key: 'hushfang', star: 2, c: 6, r: 7, items: ['Cinder Crown'] },
];

export const ghostBoard = [
  { uid: 'g0', key: 'cmd', c: 4, r: 10, items: [] },
  { uid: 'g1', key: 'pebblejaw', star: 2, c: 2, r: 7, items: ['Bulwark Plate'] },
  { uid: 'g2', key: 'pebblejaw', star: 1, c: 4, r: 7, items: [] },
  { uid: 'g3', key: 'driftwing', star: 2, c: 3, r: 8, items: [] },
  { uid: 'g4', key: 'driftwing', star: 1, c: 5, r: 8, items: [] },
  { uid: 'g5', key: 'cindermarquis', star: 1, c: 1, r: 9, items: ['Blaze Arrow'] },
  { uid: 'g6', key: 'sparkfen', star: 2, c: 6, r: 9, items: [] },
  { uid: 'g7', key: 'test_t5_magnet', star: 1, c: 2, r: 10, items: [] },
];
