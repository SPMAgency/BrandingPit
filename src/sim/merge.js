// Three copies make a 2-star; three 2-stars make a 3-star. Pure: returns new lists.
// The copy that stays is the one on the board, else the bench, else the newest
// recruit waiting for a bench slot; the other two give it their items.

export function mergeAll({ board, bench, wait = [] }, { maxStar = 3, itemSlots = 3 } = {}) {
  let B = board.map((u) => ({ ...u, items: [...(u.items || [])] }));
  let N = bench.map((u) => ({ ...u, items: [...(u.items || [])] }));
  let Wt = wait.map((u) => ({ ...u, items: [...(u.items || [])] }));
  const merges = [];
  for (;;) {
    const all = [
      ...B.filter((u) => u.key !== 'cmd').map((u) => ({ u, w: 0 })),
      ...N.map((u) => ({ u, w: 1 })),
      ...Wt.map((u) => ({ u, w: 2 })),
    ];
    const groups = new Map();
    for (const e of all) {
      if ((e.u.star || 1) >= maxStar) continue;
      const k = `${e.u.key}|${e.u.star || 1}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(e);
    }
    let found = null;
    for (const l of groups.values()) if (l.length >= 3) { found = l; break; }
    if (!found) break;
    found.sort((a, b) => a.w - b.w);
    const keep = found[0], drop = found.slice(1, 3);
    for (const d of drop) {
      keep.u.items = keep.u.items.concat(d.u.items).slice(0, itemSlots);
      B = B.filter((u) => u !== d.u); N = N.filter((u) => u !== d.u); Wt = Wt.filter((u) => u !== d.u);
    }
    keep.u.star = (keep.u.star || 1) + 1;
    merges.push({ key: keep.u.key, star: keep.u.star, uid: keep.u.uid ?? null });
  }
  return { board: B, bench: N, wait: Wt, merges };
}

// Two item components combine into a full item, in the order they arrived.
export function combineComponents(data, comps) {
  const left = [...comps], made = [];
  while (left.length >= 2) {
    const a = left.shift(), b = left.shift();
    const item = data.items.recipes[[a, b].sort().join('+')];
    if (item) made.push(item);
  }
  return { comps: left, items: made };
}
