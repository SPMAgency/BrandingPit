// Reads Animations' src/data/move_timing.json (they write it; we never edit it).
// Units are frames at 60 per second, Blacktop's contract: su = wind-up,
// ac = active (the only frames that can connect), rc = recovery.
//
// Auto-battler rule from the Animation Reboot plan: an attack's whole entry is
// scaled to one attack interval (1 / attack speed), so contact stays at the
// same fraction of the swing. Ability casts play at their own length.
//
// Lookup order for a class's move: moves["<Class>.<kind>"], moves["<class_slug>_<kind>"],
// moves["default.<kind>"], then the fallback passed in (used only until the file lands).

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_');

export function createTiming(file, fallback) {
  const moves = (file && file.moves) || {};
  function entry(cls, kind) {
    const e = moves[`${cls}.${kind}`] || moves[`${slug(cls)}_${kind}`] || moves[`default.${kind}`];
    if (e) return { e, source: 'file' };
    if (!fallback || !fallback[kind]) throw new Error(`No timing for ${cls}.${kind} and no fallback`);
    return { e: fallback[kind], source: 'fallback' };
  }
  return {
    attack(cls, attacksPerSecond) {
      const { e, source } = entry(cls || 'Commander', 'attack');
      const frames = e.su + e.ac + e.rc;
      const total = Math.max(1, Math.round(60 / attacksPerSecond));
      const contact = Math.min(total - 1, Math.round((total * e.su) / frames));
      const active = Math.max(1, Math.min(total - contact, Math.round((total * e.ac) / frames)));
      return { total, contact, active, source };
    },
    cast(cls) {
      const { e, source } = entry(cls || 'Commander', 'cast');
      return { total: Math.max(1, e.su + e.ac + e.rc), contact: e.su, active: Math.max(1, e.ac), source };
    },
  };
}
