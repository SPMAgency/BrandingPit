/* src/render/board.js — owner: Arena. Draws the hex board, bench row, gate line, release strip and the brand sigil. */
/* ---------- drawing ---------- */
function polyPath(poly){ctx.beginPath();poly.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
function drawBoard(now){
  const prep=S.phase==='prep',hover=drag&&drag.moved?cellAt(drag.x,drag.y):null,hs=drag&&drag.moved?slotAt(drag.x,drag.y):null;
  for(const cl of CELLS){
    polyPath(cl.poly);
    let f=cl.r<GATE?'#2d2539':'#283043';
    if(cl.r===0)f=rgba(C.ember,.18+.06*Math.sin(now*2+cl.c));
    if((cl.r+cl.c)%2===0&&cl.r>0)f=cl.r<GATE?'#30283d':'#2b3447';
    ctx.fillStyle=f;ctx.fill();
    if(drag&&drag.moved&&cl.r>=GATE){ctx.fillStyle=rgba(C.sigil,hover===cl?.32:.08);ctx.fill();}
    ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;ctx.stroke();
  }
  const g=(CELLS[(GATE-1)*COLS].ctr.y+CELLS[GATE*COLS].ctr.y)/2;
  ctx.strokeStyle=rgba(C.sigil,.4);ctx.setLineDash([6,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(CELLS[GATE*COLS].poly[3].x-8,g);ctx.lineTo(CELLS[GATE*COLS+COLS-1].poly[0].x+8,g);ctx.stroke();ctx.setLineDash([]);
  for(const s of BSLOTS){polyPath(s.poly);ctx.fillStyle=hs===s?rgba(C.sigil,.3):'#1d1826';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.09)';ctx.stroke();}
  if(drag&&drag.moved&&drag.u.key!=='cmd'){ctx.fillStyle=rgba(C.foe,drag.y>H-46?.5:.22);ctx.fillRect(0,H-46,W,46);ctx.fillStyle=C.ink;ctx.font='700 13px '+MONO;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('RELEASE',W/2,H-23);}
}
function sigil(x,y,R,rot){ctx.save();ctx.translate(x,y);ctx.scale(1,.55);ctx.rotate(rot);ctx.strokeStyle=C.sigil;ctx.lineWidth=2.2;ctx.shadowColor=C.sigil;ctx.shadowBlur=reduced?0:12;for(let k=0;k<2;k++){ctx.beginPath();for(let i=0;i<3;i++){const a=k*Math.PI/3+i*TAU/3-Math.PI/2;ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R);}ctx.closePath();ctx.stroke();}ctx.beginPath();ctx.arc(0,0,R*1.05,0,TAU);ctx.stroke();ctx.restore();}
