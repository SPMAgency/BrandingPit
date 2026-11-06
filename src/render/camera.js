/* src/render/camera.js — owner: Arena. The LOCKED tilted camera, board cell polygons, tap hit-testing,
   and the sprite-cell contract Animations bakes to. Shared-scope script (see docs/OWNERS.md "How the build works").
   Names other files use, keep them: W H DPR P cellW benchW CELLS BSLOTS resize cellAt slotAt inPoly BENCHZ.

   World units: one hex circumradius = 1. x runs across the board, z toward the camera.
   Row 0 is the far edge (the exit row); the bench is nearest the camera.

   The camera keeps vertical lines vertical (a shifted-lens view), so fighters stand upright as sprites
   and only the floor foreshortens. Animations bakes at the elevation angle the board centre is seen at. */

/* LOCKED. Every baked atlas depends on these. A change means a re-bake and needs Doctor Def's OK. */
const ARENA_CAM={
  elevDeg:44,        // looks down 44 deg at the board centre (41.3 at the far edge, 46.3 at the near edge); = layout.json camera.pitchDeg
  farNearRatio:.8,   // the far edge draws at 0.8x the scale of the bench row
  bodyWorld:2.4,     // a height-band 1.00 fighter, ground to top of head, in hex radii (about 1.4 hex widths)
  maxDpr:2           // canvas resolution cap (board performance)
};
/* Sprite cell, mirrored from Animations' assets/atlases/layout.json (their file, the one source for the bake and the
   sprite player). tests/arena/checks.mjs fails if this copy drifts from it. */
const SPRITE_CELL={
  cellW:96, cellH:120,
  footY:104,         // the ground point's line in the cell
  bodyPx:80,         // a height-band 1.00 fighter stands 80 px; other bands scale with it (a Mage at 1.15 stands 92)
  bakePitchDeg:44,   // = ARENA_CAM.elevDeg
  bakeFovDeg:20
};
/* Hex neighbour headings on this board, measured from facing the camera: 30, 90 and 150 degrees, mirrored. */
const HEX_HEADINGS_DEG=[30,90,150];

/* ---------- projection ---------- */
let W=0,H=0,DPR=1,F=1,CX=0,YH=0,XC=0,ZMAX=0,DN=0,CAMH=0;
const BENCHZ=1.5*(ROWS-1)+2.3, ZFAR=-1, BOARD_MIDZ=1.5*(ROWS-1)/2;
function cellW(c,r){return [SQ3*(c+.5*(r&1)),1.5*r];}
function benchW(i){const w=SQ3*(COLS+.5),x0=-SQ3/2;return [x0+w*(i+.5)/BENCH,BENCHZ];}
function P(x,z){const D=DN+(ZMAX-z);return {x:CX+(x-XC)*F/D,y:YH+CAMH*F/D,s:F/D};}
/* Screen squash of a ground circle at depth z (ry / rx), for rings and sigils that lie flat. */
function groundRatio(z){const a=P(XC,z-.5),b=P(XC,z+.5);return (b.y-a.y)/((a.s+b.s)/2);}
/* CSS px per sprite px at depth z: a baked 80 px (band 1.00) body becomes bodyWorld hex radii on the board. */
function spriteScale(z){return ARENA_CAM.bodyWorld*P(XC,z).s/SPRITE_CELL.bodyPx;}
/* World heading (dx,dz) -> baked row and mirror flag. */
function headingToRow(dx,dz){const a=Math.abs(Math.atan2(dx,dz))*180/Math.PI;return {row:a<60?0:a<120?1:2,flip:dx<0};}

let CELLS=[],BSLOTS=[];
let ARENA_PAD={top:34,bottom:8,side:4};
function resize(){
  const b=stage.getBoundingClientRect();DPR=Math.min(window.devicePixelRatio||1,ARENA_CAM.maxDpr);W=b.width;H=b.height;
  cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  XC=SQ3*(COLS-.5)/2;ZMAX=BENCHZ+.8;
  const L=ZMAX-ZFAR,k=ARENA_CAM.farNearRatio;DN=L*k/(1-k);CAMH=(DN+ZMAX-BOARD_MIDZ)*Math.tan(ARENA_CAM.elevDeg*Math.PI/180);
  F=1;CX=0;YH=0;
  const x0=-SQ3/2,x1=SQ3*(COLS+.5)-SQ3/2,far=P(XC,0);
  let mnx=1e9,mxx=-1e9,mny=far.y-far.s*ARENA_CAM.bodyWorld*1.35,mxy=-1e9;   // room for a far-row fighter and its bars
  for(const [x,z] of [[x0,ZFAR],[x1,ZFAR],[x0,ZMAX],[x1,ZMAX]]){const p=P(x,z);mnx=Math.min(mnx,p.x);mxx=Math.max(mxx,p.x);mny=Math.min(mny,p.y);mxy=Math.max(mxy,p.y);}
  const pd=ARENA_PAD,aw=W-pd.side*2,ah=H-pd.top-pd.bottom;
  F=Math.min(aw/(mxx-mnx),ah/(mxy-mny));
  CX=W/2-(mnx+mxx)/2*F;YH=pd.top+(ah-(mxy-mny)*F)/2-mny*F;
  CELLS=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const [x,z]=cellW(c,r),poly=[];
    for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);poly.push(P(x+.97*Math.cos(a),z+.97*Math.sin(a)));}
    CELLS.push({c,r,poly,ctr:P(x,z)});
  }
  BSLOTS=[];
  for(let i=0;i<BENCH;i++){const [x,z]=benchW(i),hw=SQ3*(COLS+.5)/BENCH*.43;BSLOTS.push({i,poly:[P(x-hw,z-.75),P(x+hw,z-.75),P(x+hw,z+.75),P(x-hw,z+.75)],ctr:P(x,z)});}
  if(typeof boardDirty==='function')boardDirty();
}
new ResizeObserver(()=>{resize();}).observe(stage);
function inPoly(px,py,poly){let ins=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.y>py)!==(b.y>py))&&(px<(b.x-a.x)*(py-a.y)/(b.y-a.y)+a.x))ins=!ins;}return ins;}
function cellAt(x,y){for(const c of CELLS)if(inPoly(x,y,c.poly))return c;return null;}
function slotAt(x,y){for(const s of BSLOTS)if(inPoly(x,y,s.poly))return s;return null;}
