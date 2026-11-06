// Gate for Role Building's data files. Run: node tests/role-building/data_check.mjs
// Exits 1 on any failure. Checks shape, cross-references, odds, and E10+ wording.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'data');
const errors = [];
const fail = (m) => errors.push(m);
const load = (f) => {
  try { return JSON.parse(readFileSync(join(root, f), 'utf8')); }
  catch (e) { fail(`${f}: does not parse (${e.message})`); return null; }
};

const classes = load('classes.json');
const abilities = load('abilities.json');
const roster = load('roster.json');
const items = load('items.json');
const relics = load('relics.json');
const magic = load('magic.json');
const bosses = load('bosses.json');
const balance = load('balance.json');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const PRIMARY = Object.keys(classes.primary);
const SECONDARY = Object.keys(classes.secondary).filter((k) => !k.startsWith('_'));
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const MOD_FIELDS = ['hp', 'atk', 'as', 'ability_power', 'heal_power', 'cc_seconds_add'];

// Classes
if (PRIMARY.length !== 8) fail(`classes: expected 8 primary classes, found ${PRIMARY.length}`);
if (SECONDARY.length !== 3) fail(`classes: expected 3 secondary attributes, found ${SECONDARY.length}`);
for (const [id, c] of [...Object.entries(classes.primary), ...SECONDARY.map((k) => [k, classes.secondary[k]])]) {
  for (const key of ['ranks', 'proposed_ranks']) {
    if (!c[key]) continue;
    const at = c[key].map((r) => r.at);
    if (at.some((v, i) => i && v <= at[i - 1])) fail(`classes.${id}.${key}: thresholds must rise (${at})`);
    if (Math.max(...at) > balance.slots.board) fail(`classes.${id}.${key}: threshold above board size`);
  }
}
const wheel = classes.counter_wheel.order;
if (wheel.length !== 8 || new Set(wheel).size !== 8 || !wheel.every((c) => PRIMARY.includes(c)))
  fail('counter wheel: must list each primary class exactly once');
if (classes.counter_wheel.bonus_damage !== balance.combat.counter_wheel_bonus)
  fail('counter wheel bonus differs between classes.json and balance.json');

// Abilities
for (const c of PRIMARY) {
  const a = abilities.by_class[c];
  if (!a) fail(`abilities: no ability for ${c}`);
  else if (!(a.mana > 0)) fail(`abilities.${c}: mana must be > 0`);
}

// Roster
const F = roster.launch_roster;
const ids = new Set();
const grid = {};
for (const f of F) {
  if (ids.has(f.id)) fail(`roster: duplicate id ${f.id}`);
  ids.add(f.id);
  if (!PRIMARY.includes(f.class)) fail(`roster.${f.id}: unknown class ${f.class}`);
  if (![1, 2, 3, 4, 5].includes(f.tier)) fail(`roster.${f.id}: tier must be 1-5`);
  for (const s of ['hp', 'atk', 'as', 'range']) if (!(f[s] > 0)) fail(`roster.${f.id}: ${s} must be > 0`);
  if (f.tier === 5 && !SECONDARY.includes(f.secondary)) fail(`roster.${f.id}: tier 5 needs exactly one secondary attribute`);
  if (f.tier !== 5 && f.secondary) fail(`roster.${f.id}: only tier 5 may carry a secondary attribute`);
  if (!f.concept) fail(`roster.${f.id}: missing concept line`);
  (grid[f.class] ||= new Set()).add(f.tier);
}
for (const c of PRIMARY) if ((grid[c]?.size || 0) < 2) fail(`roster: ${c} must appear at 2+ tiers`);
for (const s of SECONDARY) if (!F.some((f) => f.secondary === s)) fail(`roster: no fighter carries ${s}`);
for (let t = 1; t <= 5; t++) if (!F.some((f) => f.tier === t)) fail(`roster: no tier ${t} fighter`);
// Tier stat order: a tier's average HP and attack should beat the tier below.
const avg = (t, k) => { const g = F.filter((f) => f.tier === t); return g.reduce((s, f) => s + f[k], 0) / g.length; };
for (let t = 2; t <= 5; t++) for (const k of ['hp', 'atk'])
  if (avg(t, k) <= avg(t - 1, k)) fail(`roster: tier ${t} average ${k} is not above tier ${t - 1}`);

// Items: every pair of components makes exactly one item.
const comps = Object.keys(items.component_defs);
const seen = {};
for (const [id, it] of Object.entries(items.combined)) {
  if (it.parts.length !== 2 || !it.parts.every((p) => comps.includes(p))) fail(`items.${id}: parts must be two known components`);
  const key = [...it.parts].sort().join('+');
  if (seen[key]) fail(`items: ${key} makes both ${seen[key]} and ${id}`);
  seen[key] = id;
}
for (let i = 0; i < comps.length; i++) for (let j = i; j < comps.length; j++) {
  const key = [comps[i], comps[j]].sort().join('+');
  if (!seen[key]) fail(`items: no item for ${key}`);
}

// Pen odds and copies
for (let r = 1; r <= 13; r++) {
  const row = balance.pen_tier_odds.by_round[r];
  if (!row || row.length !== 5) { fail(`pen odds: round ${r} missing or not 5 columns`); continue; }
  const sum = row.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-6) fail(`pen odds: round ${r} sums to ${sum}`);
  if (r <= 6 && (row[3] || row[4])) fail(`pen odds: tier 4/5 must be 0 in round ${r}`);
}
for (let t = 1; t <= 5; t++) if (!(balance.copies_per_run.by_tier[t] > 0)) fail(`copies: tier ${t} missing`);
if (balance.raid.pen_size_by_round.table.length !== 13) fail('raid: pen size table needs 13 rounds');

// Relics and magic
const checkRarity = (name, obj) => {
  const by = {};
  for (const [id, x] of Object.entries(obj)) {
    if (!RARITIES.includes(x.rarity)) fail(`${name}.${id}: bad rarity ${x.rarity}`);
    by[x.rarity] = (by[x.rarity] || 0) + 1;
    if (!x.text) fail(`${name}.${id}: missing text`);
  }
  for (const r of RARITIES) if (!by[r]) fail(`${name}: no ${r} entry`);
  return by;
};
checkRarity('relics', relics.relics);
for (const [id, x] of Object.entries(relics.relics)) if (!relics.triggers[x.trigger]) fail(`relics.${id}: unknown trigger ${x.trigger}`);
checkRarity('magic', magic.attacks);
for (const w of [relics.offer.rarity_weights, magic.offer.rarity_weights])
  for (const r of RARITIES) if (!(w[r] > 0)) fail(`offer weights: ${r} missing`);

// Bosses
for (const lvl of bosses.rules.levels) {
  const pool = bosses.pool[lvl];
  if (!pool?.length) fail(`bosses: no boss for level ${lvl}`);
  if (!bosses.loot_boost_by_level[lvl]) fail(`bosses: no loot boost for level ${lvl}`);
  for (const b of pool || []) if (!(b.hp > 0 && b.ability && b.passive)) fail(`bosses.${b.id}: needs hp, ability and passive`);
}
const hpBy = bosses.rules.levels.map((l) => Math.min(...bosses.pool[l].map((b) => b.hp)));
if (hpBy.some((h, i) => i && h <= hpBy[i - 1])) fail('bosses: HP must rise level by level');

// Balance patch layer
for (const c of PRIMARY) {
  const m = balance.patch.class_mods[c];
  if (!m) { fail(`balance.patch: no class_mods for ${c}`); continue; }
  for (const k of MOD_FIELDS) if (typeof m[k] !== 'number') fail(`balance.patch.${c}: ${k} missing`);
}
for (const [id, pc] of Object.entries(balance.pit_conditions.list))
  for (const [c, m] of Object.entries(pc.class_mods)) {
    if (!PRIMARY.includes(c)) fail(`pit condition ${id}: unknown class ${c}`);
    for (const k of Object.keys(m)) if (!MOD_FIELDS.includes(k)) fail(`pit condition ${id}: unknown field ${k}`);
  }

// E10+ wording: player-facing text must not use these words.
const BANNED = /\b(kill|kills|killed|killing|blood|bloody|gore|dead|death|die|dies|murder|slay|corpse)\b/i;
const walk = (file, o, path = '') => {
  if (typeof o === 'string') { if ((/(^|\.)(text|name|concept|summary)$/.test(path)) && BANNED.test(o)) fail(`${file}${path}: E10+ word in "${o}"`); return; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(file, v, `${path}.${k}`);
};
for (const [f, d] of Object.entries({ classes, abilities, roster, items, relics, magic, bosses, balance })) walk(f, d);


// Drift: the keys the game reads today (src/data/load.js) must agree with the full structure.
const nameOf = Object.fromEntries(PRIMARY.map((c) => [c, classes.primary[c].name]));
for (const c of PRIMARY) {
  const n = nameOf[c];
  if (!classes.colors[n]) fail(`drift: classes.colors has no "${n}"`);
  const live = classes.traits[n]?.r?.join(',');
  const full = classes.primary[c].ranks.map((r) => r.at).join(',');
  if (live !== full) fail(`drift: ${n} ranks ${live} (game) vs ${full} (full)`);
  const a = abilities[n], b = abilities.by_class[c];
  if (!a || a.mana !== b.mana || a.n !== b.name || a.d !== b.text) fail(`drift: ability for ${n} differs between game keys and by_class`);
}
for (let i = 0; i < wheel.length; i++) {
  const beats = nameOf[wheel[(i + 1) % wheel.length]];
  if (classes.counter.beats[nameOf[wheel[i]]] !== beats) fail(`drift: counter wheel ${nameOf[wheel[i]]} should beat ${beats}`);
}
if (classes.counter.bonus !== classes.counter_wheel.bonus_damage) fail('drift: counter bonus');
const compName = Object.fromEntries(Object.entries(items.component_defs).map(([k, v]) => [k, v.name]));
if (items.components.join() !== Object.values(compName).join()) fail('drift: item components list');
for (const [id, it] of Object.entries(items.combined)) {
  const key = it.parts.map((p) => compName[p]).sort().join('+');
  if (items.recipes[key] !== it.name) fail(`drift: recipe ${key} is "${items.recipes[key]}" in game keys, "${it.name}" in full`);
  const st = items.stats[it.name] || {};
  for (const [k, v] of Object.entries(it.stats)) if (st[k] !== v) fail(`drift: ${it.name}.${k}`);
  if (st.d !== it.text) fail(`drift: ${it.name} text`);
}
for (const f of F.filter((x) => x.source === 'prototype')) {
  const g = roster.fighters[f.id];
  if (!g) { fail(`drift: prototype fighter ${f.id} missing from live fighters`); continue; }
  for (const k of ['hp', 'atk', 'as', 'range', 'tier']) if (g[k] !== f[k]) fail(`drift: ${f.id}.${k}`);
  if (g.cls !== nameOf[f.class]) fail(`drift: ${f.id} class`);
}
for (const k of ['hp', 'atk', 'as', 'range', 'armor', 'mr']) if (roster.commander[k] !== roster.commander_full[k]) fail(`drift: commander.${k}`);

// Style line (docs/STYLE_LINE.md, locked): no wings; size words belong to class, not to a concept.
const STYLE = /\b(wings?|winged)\b|-winged|\b(towering|hulking|giant|tiny|huge)\b/i;
for (const f of F) if (STYLE.test(f.concept)) fail(`roster.${f.id}: concept breaks the style line ("${f.concept.match(STYLE)[0]}")`);
for (const b of Object.values(bosses.pool).flat()) if (/\b(wings?|winged)\b|-winged/i.test(b.concept)) fail(`bosses.${b.id}: no wings (style line)`);

// Report
const t = [1, 2, 3, 4, 5].map((n) => F.filter((f) => f.tier === n).length);
console.log(`roster: ${F.length} fighters, by tier ${t.join(' / ')}`);
for (const c of PRIMARY) console.log(`  ${c.padEnd(17)} tiers ${[...grid[c]].sort().join(',')}  (${F.filter((f) => f.class === c).length})`);
console.log(`relics ${Object.keys(relics.relics).length}, magic attacks ${Object.keys(magic.attacks).length}, bosses ${Object.values(bosses.pool).flat().length}, items ${Object.keys(items.combined).length}`);
if (errors.length) { console.error(`\nFAIL (${errors.length})\n- ` + errors.join('\n- ')); process.exit(1); }
console.log('\nPASS');
