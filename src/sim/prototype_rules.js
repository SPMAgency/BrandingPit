/* src/sim/prototype_rules.js — owner: Actions/Functions, values belong to Role Building.
 *
 * The few rule numbers the fight needs that are NOT in src/data/*.json yet.
 * Everything else (classes, ranks, abilities, mana, crit, armor, pen odds,
 * runners, run HP, items, the patch layer) is read from Role Building's files
 * by PitSim.fromGameData(). When Role Building adds one of these under the key
 * shown, the sim takes theirs and ignores this one; `data._fromRules` lists
 * what is still coming from here. When that list is empty, this file goes.
 *
 * Marks: (P) prototype value · (D) design doc value · (NEW) not in either; my pick.
 * A plain script defining one global, PIT_PROTOTYPE_RULES.
 */
var PIT_PROTOTYPE_RULES = {
  board: { exitRow: 0 },                       // (P) row 0, the far edge, is the pen's exit row

  combat: {
    attackRoll: [0.95, 1.05], minDamage: 1,    // (P) used only if balance.combat lacks them
    armorK: 100,                               // (P) only if balance.combat.armor_formula can't be read
    retargetSec: 0.6,                          // (P) how often a fighter re-picks its target
    firstAttackSec: [0.1, 0.5],                // (P) random first-swing delay, so boards don't swing in sync
    pathJitter: 0.25,                          // (P) tie-break noise when stepping between equal hexes
    moveSpeed: { you: 2.8, foe: 2.8, pen: 2.4, boss: 2.4, default: 2.6 }, // (P) hexes per second; foe, boss (NEW)
    projectileSpeed: { attack: 11, ability: 8 }, // (P) hexes per second
    knockupSec: 0.6,                           // (P) time in the air on a knock-up (the stun is separate)
    timeLimitSec: 30,                          // (NEW) ghost fight cut-off; balance.run has a 30 s *target* only
  },

  // Fallback only: Animations' move_timing.json impact.hitstopMs wins when the timing file is loaded.
  impact: { hitStopMs: 60 },                   // (D)

  raid: {
    penRows: [1, 4], runnerRow: 5,             // (P) where the pen spawns; runners start nearer the exit
    runnerSpeed: 1.45,                         // (P) hexes per second while fleeing
  },

  run: {
    timeoutCountsAs: 'loss',                   // (NEW) decision asked of Doctor Def: 'loss' or 'draw'
    bossLossHpFraction: 0.5,                   // (D) until bosses.json is loaded into the build (its on_loss wins)
  },

  classes: {
    'Healer': { autoReviveDelaySec: 0.8 },     // (P) how long a ghost Healer waits before reviving
  },

  // Animations' numbers, used only when move_timing.json is not loaded.
  timingFallback: { attack: { su: 2, ac: 1, rc: 3 }, cast: { su: 10, ac: 5, rc: 15 } },
};
