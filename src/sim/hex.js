// The hex board: "odd-r" offset rows. c = column (0..cols-1), r = row (0..rows-1).
// Row 0 is the far edge (the pen's exit row in a Raid); the player's side is the
// high rows. World units: one hex = sqrt(3) wide, rows 1.5 apart (same as the
// prototype's projection, so the renderer can keep its camera).

export const SQ3 = Math.sqrt(3); // correctly rounded on every engine

export function cube(c, r) {
  const x = c - (r - (r & 1)) / 2;
  return [x, -x - r, r];
}

export function hexDist(a, b) {
  const A = cube(a.c, a.r), B = cube(b.c, b.r);
  return Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2]));
}

const NB = [
  [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]],
  [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]],
];

export function neighbors(c, r, cols, rows) {
  const out = [];
  for (const [dc, dr] of NB[r & 1]) {
    const nc = c + dc, nr = r + dr;
    if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) out.push({ c: nc, r: nr });
  }
  return out;
}

export function cellWorld(c, r) {
  return { x: SQ3 * (c + 0.5 * (r & 1)), z: 1.5 * r };
}

// Exact 180-degree turn of the board. A ghost saves its board on its own near
// side; this puts it on the far side facing you.
export function rotate180(c, r, cols, rows) {
  return { c: cols - 1 - c, r: rows - 1 - r };
}

export const cellKey = (c, r) => c * 64 + r;
