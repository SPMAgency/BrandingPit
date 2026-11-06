// Test boards (unit lists in near-side coordinates). Not game content.
export const startBoard = [ // the prototype's opening board
  { uid: 'c', key: 'cmd', c: 3, r: 10, items: [] },
  { uid: 'a', key: 'brasshorn', star: 1, c: 2, r: 7, items: [] },
  { uid: 'b', key: 'pebblejaw', star: 1, c: 4, r: 7, items: [] },
  { uid: 'd', key: 'glintwick', star: 1, c: 5, r: 9, items: [] },
];
export const midBoard = [ // traits on: 3 Warriors, 3 Healers
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
// Test-only tier 5 fighters so the secondary attributes run. Not roster proposals.
export const testFighters = {
  test_t5_wise: { name: 'Test T5 A', cls: 'Warrior', secondary: 'Wisest Battler', tier: 5, hp: 1200, atk: 90, as: 0.75, range: 1, armor: 40 },
  test_t5_magnet: { name: 'Test T5 B', cls: 'Mage', secondary: 'Magnetic Composition', tier: 5, hp: 900, atk: 80, as: 0.7, range: 3 },
};
