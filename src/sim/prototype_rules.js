/* src/sim/prototype_rules.js — owner: Actions/Functions, values belong to Role Building.
 *
 * The rule numbers the fight needs that are NOT yet in src/data/*.json. They are
 * the Raid prototype's numbers (prototype/raid.html) and the design doc's tables,
 * moved out of code so nothing in the sim is hard-coded.
 *
 * This file is a temporary home. Role Building moves each block into their JSON
 * (target file shown per block); PitSim.fromGameData() then takes their value
 * and ignores the one here. `data._fromRules` lists what is still coming from
 * this file. When that list is empty, this file is deleted.
 *
 * Marks: (P) prototype value · (D) design doc value · (NEW) not in either; my pick.
 *
 * A plain script defining one global, PIT_PROTOTYPE_RULES.
 */
var PIT_PROTOTYPE_RULES = {
  // -> balance.json "board"
  board: { cols: 8, rows: 12, exitRow: 0 }, // (P) 12x8 hexes; row 0 is the pen's exit row

  // -> balance.json "combat"
  combat: {
    baseCrit: 0.25, critDamage: 1.4,           // (P)
    armorK: 100,                               // (P) damage x 100 / (100 + armor)
    defaultArmor: 25, defaultMr: 25,           // (P)
    manaPerAttack: 10,                         // (P) (D) +10 per attack
    manaOnHitPct: 0.05, manaOnHitCap: 10,      // (P) taking hits: 5% of damage, max 10
    jitter: 0.05,                              // (P) attack damage +/- 5%
    retargetSec: 0.6,                          // (P)
    firstAttackSec: [0.1, 0.5],                // (P) random first-swing delay
    pathJitter: 0.25,                          // (P) tie-break noise when stepping
    moveSpeed: { you: 2.8, foe: 2.8, pen: 2.4, boss: 2.4, default: 2.6 }, // (P) hexes/s; foe/boss (NEW)
    projectileSpeed: { attack: 11, ability: 8 }, // (P) hexes/s
    stunSec: 2.0,                              // (D) every stun 2.0 s unless a class lists its own
    knockupSec: 0.6,                           // (P) knock-up shown in the air
    itemSlots: 3,                              // (P)
    timeLimitSec: 30,                          // (NEW) design says a ghost fight is "about 30 s"
  },

  // Hit-stop. Animations' move_timing.json impact.hitstopMs wins when the timing file is loaded.
  impact: { hitStopMs: 60 },                   // (D) reboot plan

  // -> balance.json "raid"
  raid: {
    brands: 3,                                 // (D)
    penRows: [1, 4], runnerRow: 5,             // (P)
    penSizeByRound: [6, 6, 7, 7, 8],           // (P) last value repeats
    // (P) tiers 1-3 from the prototype formula; (D) tier 4 and 5 rates from round 7.
    // One row per round 1..13: [tier1, tier2, tier3, tier4, tier5]
    penOdds: [
      [0.60, 0.30, 0.10, 0, 0], [0.51, 0.35, 0.14, 0, 0], [0.42, 0.40, 0.18, 0, 0],
      [0.33, 0.45, 0.22, 0, 0], [0.29, 0.45, 0.26, 0, 0], [0.25, 0.45, 0.30, 0, 0],
      [0.20, 0.45, 0.30, 0.04, 0.01], [0.17, 0.45, 0.30, 0.06, 0.02], [0.14, 0.45, 0.30, 0.08, 0.03],
      [0.11, 0.45, 0.30, 0.10, 0.04], [0.08, 0.45, 0.30, 0.12, 0.05], [0.05, 0.45, 0.30, 0.14, 0.06],
      [0.05, 0.45, 0.30, 0.14, 0.06],
    ],
    runnerTiers: [3, 4, 5],                    // (P) tier 3; 4 and 5 (NEW)
    guaranteedRunnerTier: 3,                   // (P) every pen has at least one runner
    runnerFleeSec: [4.5, 6.5],                 // (P) seconds into the Raid
    runnerSpeed: 1.45, runnerHp: 0.9,          // (P)
    lootChance: 0.35,                          // (P)
    lureShare: 0.5,                            // (D) a lure tilts half the pen at most
    penScale: { hpBase: 0.55, hpPerRound: 0.08, atkBase: 0.6, atkPerRound: 0.06 }, // (P) wild fighters start weaker
  },

  // -> balance.json "run"
  run: {
    startHp: 500, lossPerUnit: 10, lossCommander: 13, // (D)
    bossLossHpFraction: 0.5,                   // (D) lose half of current HP
    winTarget: 12,                             // (D)
    timeoutCountsAs: 'loss',                   // (NEW) decision asked of Doctor Def
  },

  // -> classes.json, e.g. "effects": { "Warrior": {...} }  (ranks stay in "traits")
  classes: {
    'Warrior': { stackPerHit: 0.5, stackCap: [1, 2, 3.5] },                          // (D)
    'Healer': { unitRevivePct: [0.5, 1, 1, 1], commanderRevivePct: [0, 0, 0.5, 1],   // (D) by rank 3/5/7/8
      revivesPerFight: 1, autoReviveDelaySec: 0.8 },                                 // (P)
    'Mage': {},                                                                      // relic boost waits on relics
    'Judge Mark': { armorPct: [0.2, 0.25, 0.4], slowChance: [0.05, 0.18, 0.35],      // (D)
      slowSec: 2, slowFactor: 0.7 },                                                 // (P)
    'Ember Keeper': { everyNth: 5, spritePctPerSec: 0.03, maxSprites: 5,             // (D)
      spriteSec: 3, bonusHitPct: [0, 0.03] },                                        // (P) 3 s; (D) rank 5 bonus
    'Gusting Shallow': { everyNth: 3, stunSec: [1.5, 3.0] },                         // (D)
    'Quiet Concern': { critRate: [0.05, 0.3], critDamage: [0.05, 1.0] },             // (D)
    'Leaf in the Wind': { rootChance: [0.2, 0.2], rootSec: 1.5, attackSpeedPct: [0, 0.3] }, // (D)
    // -> classes.json "secondary": tier 5 secondary attributes, with their own ranks
    'Wisest Battler': { ranks: [3], decayEveryNth: 3, armorDecayByStar: [0.15, 0.25, 0.35],
      armorPenRankBonusByStar: [0.15, 0.25, 0.35] },                                 // (D) my reading; confirm
    'Recovery Pool': { ranks: [4, 5], everyNth: [5, 4], lifeStealPct: [0.2, 0.3] },  // (D) cap not given
    'Magnetic Composition': { ranks: [1, 3, 4], stunChance: [0.1, 0.15, 0.3], stunSec: 2.0 }, // (D)
  },

  // -> abilities.json, an "effect" block per class (name and mana are already there)
  abilities: {
    'Warrior': { kind: 'cleave', mult: 1.8, radius: 1, canCrit: true },                       // (P)
    'Healer': { kind: 'heal', mult: 2.5, flat: 80, anyRange: true },                          // (P)
    'Mage': { kind: 'strike', mult: 3.2, dmgType: 'magic', projectile: true },                // (P)
    'Judge Mark': { kind: 'shield', pct: 0.3, sec: 4 },                                       // (P)
    'Ember Keeper': { kind: 'strike', mult: 1.5, dmgType: 'magic', projectile: true, burnSec: 3 }, // (P)
    'Gusting Shallow': { kind: 'strike', mult: 1.2, stunSec: 1.5, knockup: true },            // (P)
    'Quiet Concern': { kind: 'strike', mult: 2, canCrit: true, forceCrit: true },             // (P)
    'Leaf in the Wind': { kind: 'strike', mult: 1.5, rootSec: 1.5, blink: true, canCrit: true, anyRange: true }, // (P)
  },

  // Animations' numbers, used only when move_timing.json is not loaded:
  // the reboot plan's 6-frame attack (2 wind-up, 1 contact, 3 recovery).
  timingFallback: { attack: { su: 2, ac: 1, rc: 3 }, cast: { su: 10, ac: 5, rc: 15 } },
};
