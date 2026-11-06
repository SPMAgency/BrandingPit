// Turns a unit (key, star, items) plus its side's active traits into fight stats.
// Every number comes from the data object (Role Building's files); none live here.

export function defOf(data, unit) {
  if (unit.key === 'cmd') return data.commander;
  const d = data.roster[unit.key];
  if (!d) throw new Error(`Unknown fighter "${unit.key}" (not in roster)`);
  return d;
}

// Class of a unit for traits and the counter wheel. The commander has none
// until an attribute is picked after a boss win.
export function classOf(data, unit) {
  return unit.key === 'cmd' ? unit.attribute || null : defOf(data, unit).cls;
}

export function secondaryOf(data, unit) {
  return unit.key === 'cmd' ? null : defOf(data, unit).secondary || null;
}

// Rank index per class (and secondary attribute) for one side's board.
// -1 = below the first threshold. Every unit on the board counts, the commander
// too once it has an attribute.
export function traitRanks(data, units) {
  const n = {};
  for (const u of units) {
    const cls = classOf(data, u);
    if (cls) n[cls] = (n[cls] || 0) + 1;
    const sec = secondaryOf(data, u);
    if (sec) n[sec] = (n[sec] || 0) + 1;
  }
  const out = {};
  for (const name in n) {
    const t = data.classes[name];
    if (!t) continue;
    let k = -1;
    t.ranks.forEach((need, i) => { if (n[name] >= need) k = i; });
    out[name] = k;
  }
  return out;
}

const at = (arr, k, dflt = 0) => (arr && k >= 0 && k < arr.length ? arr[k] : dflt);

export function computeStats(data, unit, side, ranks) {
  const d = defOf(data, unit);
  const cb = data.combat;
  const isCmd = unit.key === 'cmd';
  const star = Math.max(1, Math.min(3, unit.star || 1));
  const mh = side.stars === false || isCmd ? 1 : cb.starStats.hp[star - 1];
  const ma = side.stars === false || isCmd ? 1 : cb.starStats.atk[star - 1];
  const scale = side.scale || { hp: 1, atk: 1 };
  const runner = !!(side.runners && data.raid.runnerTiers.includes(d.tier));

  const it = { hp: 0, atk: 0, armor: 0, mr: 0, as: 0, ap: 0, mana: 0 };
  for (const name of unit.items || []) {
    const s = data.items.stats[name];
    if (!s) continue;
    for (const k in it) if (s[k]) it[k] += s[k];
  }

  const cls = classOf(data, unit);
  const sec = secondaryOf(data, unit);
  // Fighters cast their class ability; the commander casts its magic attack (none until learned).
  const ability = isCmd ? unit.magic || null : data.abilities[cls] || null;

  const st = {
    max: (d.hp * mh * scale.hp + it.hp) * (runner ? data.raid.runnerHp : 1),
    atk: d.atk * ma * scale.atk * (1 + it.atk),
    as: d.as * (1 + it.as),
    range: d.range,
    armor: (d.armor ?? cb.defaultArmor) + it.armor,
    mr: (d.mr ?? cb.defaultMr) + it.mr,
    ap: 1 + it.ap,
    crit: cb.baseCrit,
    critD: cb.critDamage,
    armorPen: 0,
    mana: it.mana,
    maxMana: ability ? ability.mana : 0,
    ability,
    cls,
    sec,
    tier: d.tier || 0,
    runner,
  };

  if (side.traits !== false && ranks) {
    const C = data.classes;
    if (cls && ranks[cls] >= 0) {
      const k = ranks[cls], p = C[cls];
      if (p.armorPct) st.armor *= 1 + at(p.armorPct, k);
      if (p.critRate) st.crit += at(p.critRate, k);
      if (p.critDamage) st.critD += at(p.critDamage, k);
      if (p.attackSpeedPct) st.as *= 1 + at(p.attackSpeedPct, k);
    }
    if (sec && C[sec]) {
      // Secondary attributes have a base effect on the carrier, plus rank bonuses.
      const p = C[sec];
      if (p.armorPenByStar) st.armorPen += at(p.armorPenByStar, star - 1);
      if (p.armorPenRankBonusByStar && ranks[sec] >= 0) st.armorPen += at(p.armorPenRankBonusByStar, star - 1);
    }
  }
  return st;
}
