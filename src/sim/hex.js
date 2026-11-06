/* src/sim/hex.js — owner: Actions/Functions. Hex grid distance and neighbours. */
/* ---------- hex grid helpers ---------- */
function cube(c,r){const x=c-(r-(r&1))/2;return [x,-x-r,r];}
function dist(a,b){const A=cube(a.c,a.r),B=cube(b.c,b.r);return Math.max(Math.abs(A[0]-B[0]),Math.abs(A[1]-B[1]),Math.abs(A[2]-B[2]));}
const NB=[[[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]],[[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]]];
function nbrs(c,r){return NB[r&1].map(d=>({c:c+d[0],r:r+d[1]})).filter(p=>p.c>=0&&p.c<COLS&&p.r>=0&&p.r<ROWS);}
