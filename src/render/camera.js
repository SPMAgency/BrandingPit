/* src/render/camera.js — owner: Arena. Tilted camera projection, board cell polygons, tap hit-testing. */
/* ---------- projection: tilted camera over the hex plane ---------- */
let W=0,H=0,DPR=1,F=1,CX=0,YH=0,XC=0,ZMAX=0,DN=0,CAMH=0;
const BENCHZ=1.5*(ROWS-1)+2.3;
function cellW(c,r){return [SQ3*(c+.5*(r&1)),1.5*r];}
function benchW(i){const w=SQ3*(COLS+.5),x0=-SQ3/2;return [x0+w*(i+.5)/BENCH,BENCHZ];}
function P(x,z){const D=DN+(ZMAX-z);return {x:CX+(x-XC)*F/D,y:YH+CAMH*F/D,s:F/D};}
let CELLS=[],BSLOTS=[];
function resize(){
  const b=stage.getBoundingClientRect();DPR=Math.min(window.devicePixelRatio||1,2);W=b.width;H=b.height;
  cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  XC=SQ3*(COLS-.5)/2;ZMAX=BENCHZ+.8;const L=ZMAX+1.2;DN=3*L;CAMH=1.12*DN;
  F=1;CX=0;YH=0;
  let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;
  const pts=[[-SQ3/2,-1],[SQ3*(COLS+.5)-SQ3/2,-1],[-SQ3/2,ZMAX],[SQ3*(COLS+.5)-SQ3/2,ZMAX]];
  for(const [x,z] of pts){const p=P(x,z);mnx=Math.min(mnx,p.x);mxx=Math.max(mxx,p.x);mny=Math.min(mny,p.y);mxy=Math.max(mxy,p.y);}
  const top=34,bot=8,aw=W-8,ah=H-top-bot;
  F=Math.min(aw/(mxx-mnx),ah/(mxy-mny));
  CX=W/2-(mnx+mxx)/2*F;YH=top+(ah-(mxy-mny)*F)/2-mny*F;
  CELLS=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const [x,z]=cellW(c,r),poly=[];
    for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);poly.push(P(x+.97*Math.cos(a),z+.97*Math.sin(a)));}
    CELLS.push({c,r,poly,ctr:P(x,z)});
  }
  BSLOTS=[];
  for(let i=0;i<BENCH;i++){const [x,z]=benchW(i),hw=SQ3*(COLS+.5)/BENCH*.43;BSLOTS.push({i,poly:[P(x-hw,z-.75),P(x+hw,z-.75),P(x+hw,z+.75),P(x-hw,z+.75)],ctr:P(x,z)});}
}
new ResizeObserver(()=>{resize();}).observe(stage);
function inPoly(px,py,poly){let ins=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.y>py)!==(b.y>py))&&(px<(b.x-a.x)*(py-a.y)/(b.y-a.y)+a.x))ins=!ins;}return ins;}
function cellAt(x,y){for(const c of CELLS)if(inPoly(x,y,c.poly))return c;return null;}
function slotAt(x,y){for(const s of BSLOTS)if(inPoly(x,y,s.poly))return s;return null;}
