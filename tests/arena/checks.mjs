// Arena checks, no browser: node tests/arena/checks.mjs
// Loads the game's own src/render/camera.js, board.js and fx.js (shared scope) with stand-in globals, then checks:
//  1. Camera: the whole board and bench fit each phone stage; fighter size; six hex headings -> three rows.
//  2. Readability: team rings and the brand sigil keep 3:1 contrast or better on every floor.
//  3. Impact grammar: KO flash cap, 3-flash ceiling, cast+hit flash once, reduced motion.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; };

function load(stageW, stageH, reducedMotion = false) {
  const box = { w: stageW, h: stageH };
  const ctx = new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
  const sandbox = {
    Math, Object, Map, Array, String, Number, JSON, console,
    window: { devicePixelRatio: 2 }, performance: { now: () => 0 },
    matchMedia: () => ({ matches: reducedMotion }),
    ResizeObserver: class { observe() {} },
    stage: { getBoundingClientRect: () => ({ width: box.w, height: box.h }) },
    cv: { width: 0, height: 0 }, ctx,
  };
  vm.createContext(sandbox);
  const pre = `const COLS=8,ROWS=12,GATE=6,BENCH=8,TAU=Math.PI*2,SQ3=Math.sqrt(3);
    const reduced=matchMedia().matches; const C={sigil:'#f2b84b',you:'#56c27a',foe:'#e0524a',ink:'#fff'};
    const FONT='x',MONO='x'; let S={round:1,phase:'raid'},drag=null; const rnd=(a,b)=>a+Math.random()*(b-a);
    function rgba(h,a){return h;}`;
  const src = ['camera.js', 'board.js', 'fx.js'].map(f => readFileSync(join(root, 'src/render', f), 'utf8')).join('\n');
  // expose the shared-scope names the checks read
  const expose = `;globalThis.A={resize,P,cellW,ARENA_CAM,SPRITE_CELL,headingToRow,ARENA_THEMES,themeForRound,fxEvent,impactUpdate,impactShake,impactSettings,impactFlashes,impactShakes,impactSparks,get W(){return W},get H(){return H},BENCHZ,ZMAX,XC};`;
  vm.runInContext(pre + '\n' + src + expose, sandbox);
  sandbox.A.resize();
  return sandbox.A;
}

// 1. Camera fit on real phone stages (stage = what is left under the header and above the controls)
const SQ3 = Math.sqrt(3);
for (const [name, w, h] of [['360x640 small Android', 328, 410], ['390x844 iPhone', 358, 616], ['412x915 Pixel', 380, 690]]) {
  const A = load(w, h);
  const pts = [[-SQ3 / 2, -1], [SQ3 * 8.5 - SQ3 / 2, -1], [-SQ3 / 2, A.ZMAX], [SQ3 * 8.5 - SQ3 / 2, A.ZMAX]].map(([x, z]) => A.P(x, z));
  const inside = pts.every(p => p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h);
  const far = A.P(A.XC, 0), farTop = far.y - far.s * A.ARENA_CAM.bodyWorld;
  const mid = A.ARENA_CAM.bodyWorld * A.P(A.XC, 8.25).s;
  ok(inside && farTop >= 0, `${name}: whole board and bench on screen, far-row heads visible (fighter ${mid.toFixed(0)} pt mid-board)`);
}
{ const A = load(358, 616), mid = A.ARENA_CAM.bodyWorld * A.P(A.XC, 8.25).s;
  ok(mid * 2.6 > 115 && mid * 2.6 < 145, `iPhone-size phone: fighter about 130 device px at 2.6x (${(mid * 2.6).toFixed(0)})`); }
{ const A = load(358, 616); const dirs = [[1, 0], [.5, .866], [-.5, .866], [-1, 0], [-.5, -.866], [.5, -.866]]; // the six hex neighbour headings
  const got = dirs.map(([dx, dz]) => { const r = A.headingToRow(dx, dz); return r.row + (r.flip ? 'f' : ''); }).join(' ');
  ok(got === '1 0 0f 1f 2f 2', `six hex headings map to rows side, front 3/4, front 3/4 mirrored, side mirrored, back 3/4 mirrored, back 3/4 (${got})`); }

// 1b. The cell and camera here must match Animations' layout.json (their file, the one source for the bake).
{ const A = load(358, 616), L = JSON.parse(readFileSync(join(root, 'assets/atlases/layout.json'), 'utf8'));
  const c = A.SPRITE_CELL, same = c.cellW === L.cell.w && c.cellH === L.cell.h && c.footY === L.cell.footY && c.bodyPx === L.cell.bodyPx;
  ok(same, `sprite cell matches layout.json (${c.cellW}x${c.cellH}, feet ${c.footY}, body ${c.bodyPx})`);
  ok(Math.abs(L.camera.pitchDeg) === A.ARENA_CAM.elevDeg && c.bakePitchDeg === A.ARENA_CAM.elevDeg, `bake pitch ${L.camera.pitchDeg} matches the board camera ${A.ARENA_CAM.elevDeg} deg`);
  const yaws = L.directions.map(d => d.yawDeg).join('/');
  console.log((yaws === '30/90/150' ? 'PASS ' : 'NOTE ') + `baked row yaws ${yaws}; hex headings on this board are 30/90/150 (request open to Animations)`); }

// 2. Readability
const lin = c => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
const lum = h => { const n = parseInt(h.slice(1), 16); return .2126 * lin(n >> 16 & 255) + .7152 * lin(n >> 8 & 255) + .0722 * lin(n & 255); };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
{ const A = load(358, 616); let worst = 99, where = '';
  for (const [id, t] of Object.entries(A.ARENA_THEMES)) for (const floor of [...t.floorPen, ...t.floorYou])
    for (const col of ['#56c27a', '#e0524a', t.accent]) { const c = contrast(col, floor); if (c < worst) { worst = c; where = `${id} ${col} on ${floor}`; } }
  ok(worst >= 3, `ring and sigil contrast on every floor, worst ${worst.toFixed(2)}:1 (${where})`);
  ok(A.themeForRound(1) === 'outer-pen' && A.themeForRound(5) === 'cinder-yard' && A.themeForRound(8) === 'tidewell' && A.themeForRound(11) === 'gilded-crown', 'round bands: 1-2, 4-5, 7-8, 10-11');
  ok([3, 6, 9, 12, 13].every(r => A.ARENA_THEMES[A.themeForRound(r)].boss), 'boss rounds 3, 6, 9, 12, 13 get boss arenas');
  ok(A.themeForRound(3, 'boss-last-pit') === 'boss-last-pit', 'a boss can name its own arena'); }

// 3. Impact grammar
const step = (A, s) => { for (let i = 0; i < Math.round(s * 1000); i++) A.impactUpdate(.001); };
const ev = id => ({ at: { x: 5, z: 3 }, from: { x: 5, z: 6 }, attacker: 'a', victim: id || 'v' });
{ const A = load(358, 616);
  A.fxEvent('hit', ev()); ok(A.impactSparks.length > 0 && A.impactFlashes.length === 0, 'normal hit: spark, no flash');
  const n0 = A.impactSparks.length; A.fxEvent('crit', ev()); ok(A.impactSparks.length - n0 > n0, 'crit: bigger spark than a normal hit');
  for (let i = 0; i < 5; i++) A.fxEvent('ko', ev('k' + i));
  ok(A.impactFlashes.length === 2 && A.impactShakes.length === 2, `5 knockouts at once: 2 flashes and 2 shakes (got ${A.impactFlashes.length}/${A.impactShakes.length})`);
  step(A, .04); ok(A.impactFlashes.length === 0, 'knockout flash gone by 40 ms (35 ms)');
  step(A, 1); A.fxEvent('ko', ev('w')); ok(A.impactFlashes.length === 1, 'a second later, knockouts flash again'); }
{ const A = load(358, 616); A.impactSettings.koFlashPerSec = 3;
  A.fxEvent('cast', { at: { x: 5, z: 6 }, attacker: 'a', star: 3 }); A.fxEvent('hit', Object.assign(ev(), { ability: true, star: 3 }));
  ok(A.impactFlashes.length === 1 && A.impactFlashes[0].dur === .1, '3-star cast and its hit: one 100 ms flash, not two');
  for (let i = 0; i < 5; i++) A.fxEvent('ko', ev('k' + i));
  ok(A.impactFlashes.length <= 3, `never more than 3 flashes in a second, even with sliders raised (${A.impactFlashes.length})`); }
{ const A = load(358, 616, true);
  A.fxEvent('crit', ev()); A.fxEvent('ko', ev()); A.fxEvent('cast', { at: { x: 5, z: 6 }, attacker: 'b', star: 3 });
  const s = A.impactShake();
  ok(A.impactFlashes.length === 0 && A.impactShakes.length === 0 && s.x === 0 && s.y === 0, 'reduced motion: no flash, no shake');
  ok(A.impactSparks.length > 0, 'reduced motion: sparks still show what happened'); }

console.log(fails ? `\n${fails} check(s) failed` : '\nall checks passed');
process.exit(fails ? 1 : 0);
