/* src/render/board.js — owner: Arena. Everything under and around the fighters: backdrop per round and boss,
   floor, pen, exit row, gate line, bench row, lighting, drag highlights, release strip, the brand sigil.
   Shared-scope script. Names other files use, keep them: drawBoard(now), sigil(x,y,R,rot), polyPath(poly).

   Readability rules every background follows:
   - the floor stays dark and low in saturation, so fighters and team rings carry the colour;
   - no strong greens or reds (those are the team rings);
   - bright accents sit on the far wall and the exit row, never behind mid-board heads.
   tests/arena/checks.mjs measures ring and sigil contrast on every floor (3:1 or better). */

const ARENA_THEMES={
  'outer-pen':        {name:'The Outer Pen',   rounds:'1–2',    sky:['#0f0c16','#2a2033'],wall:'#1d1726',floorPen:['#2b2536','#302a3c'],floorYou:['#262d3d','#2a3243'],edge:'rgba(255,255,255,.07)',accent:'#f2b84b',exit:'#e8823a',bench:'#1b1724',motes:{color:'#f2b84b',count:14,rise:8}, lights:'#ffb35c',vignette:.55},
  'cinder-yard':      {name:'Cinder Yard',     rounds:'4–5',    sky:['#120b0a','#33201a'],wall:'#241713',floorPen:['#2e2421','#342925'],floorYou:['#272a33','#2c2f39'],edge:'rgba(255,214,170,.07)',accent:'#ff9a4a',exit:'#ff7a3a',bench:'#1d1513',motes:{color:'#ff8a3d',count:26,rise:16},lights:'#ff8a3d',vignette:.6},
  'tidewell':         {name:'Tidewell Grotto', rounds:'7–8',    sky:['#081014','#15303a'],wall:'#11222a',floorPen:['#1f2c33','#233239'],floorYou:['#222a3a','#262f40'],edge:'rgba(190,240,255,.08)',accent:'#8fe3ff',exit:'#6fd2f0',bench:'#121b22',motes:{color:'#b9ecff',count:22,rise:-5},lights:'#7fd4f0',vignette:.6},
  'gilded-crown':     {name:'Gilded Crown',    rounds:'10–11',  sky:['#0b0816','#272046'],wall:'#1b1632',floorPen:['#2a2540','#2f2946'],floorYou:['#242a40','#283046'],edge:'rgba(255,230,160,.08)',accent:'#ffd27a',exit:'#ffc35a',bench:'#16132a',motes:{color:'#fff1c2',count:18,rise:3}, lights:'#ffd27a',vignette:.6},
  /* Boss arenas, one per boss level. bosses.json may name its own arena (S.bossArena) to override. */
  'boss-iron-gate':   {boss:true,name:'The Iron Gate',    rounds:'boss 3', sky:['#08090c','#22252e'],wall:'#171a21',floorPen:['#26282f','#2a2d34'],floorYou:['#232a38','#273040'],edge:'rgba(220,230,255,.08)',accent:'#f2b84b',exit:'#c9d2e0',bench:'#14161c',motes:{color:'#d9e2f0',count:10,rise:4}, lights:'#f2c26b',vignette:.7, sigil:'#f2b84b'},
  'boss-ember-throne':{boss:true,name:'The Ember Throne', rounds:'boss 6', sky:['#0d0606','#2c1510'],wall:'#1f100c',floorPen:['#2c1f1c','#322320'],floorYou:['#26283a','#2a2d3f'],edge:'rgba(255,190,140,.08)',accent:'#ff9a4a',exit:'#ff8a3d',bench:'#190f0d',motes:{color:'#ffb066',count:34,rise:20},lights:'#ff7a3a',vignette:.72,sigil:'#ff9a4a'},
  'boss-storm-hollow':{boss:true,name:'Storm Hollow',     rounds:'boss 9', sky:['#05060f','#1a1f3d'],wall:'#11142a',floorPen:['#1f2238','#23263d'],floorYou:['#21283a','#252d40'],edge:'rgba(180,200,255,.09)',accent:'#9fb8ff',exit:'#8fb2ff',bench:'#10122a',motes:{color:'#c8d6ff',count:24,rise:-10},lights:'#8fb2ff',vignette:.72,sigil:'#9fb8ff',storm:true},
  'boss-sunken-court':{boss:true,name:'The Sunken Court', rounds:'boss 12',sky:['#040a0a','#12282a'],wall:'#0e1c1d',floorPen:['#1c2a2a','#203030'],floorYou:['#222a38','#26303e'],edge:'rgba(255,225,150,.08)',accent:'#ffd27a',exit:'#ffcf6b',bench:'#0e1818',motes:{color:'#ffe6a6',count:16,rise:2}, lights:'#e8c56a',vignette:.74,sigil:'#ffd27a'},
  'boss-last-pit':    {boss:true,name:'The Last Pit',     rounds:'boss 13',sky:['#030305','#17121f'],wall:'#0d0a12',floorPen:['#1d1824','#211b29'],floorYou:['#1f2433','#232839'],edge:'rgba(255,215,130,.09)',accent:'#ffd27a',exit:'#ffd27a',bench:'#0c0a10',motes:{color:'#ffd27a',count:30,rise:6}, lights:'#ffc35a',vignette:.8, sigil:'#ffd27a'}
};
const ARENA_BANDS=['outer-pen','cinder-yard','tidewell','gilded-crown'];
const ARENA_BOSS={3:'boss-iron-gate',6:'boss-ember-throne',9:'boss-storm-hollow',12:'boss-sunken-court',13:'boss-last-pit'};
/* Every third round is a boss round; round 13 is the perfect-run boss. */
function themeForRound(round,bossArena){
  if(bossArena&&ARENA_THEMES[bossArena])return bossArena;
  if(ARENA_BOSS[round])return ARENA_BOSS[round];
  return ARENA_BANDS[Math.min(ARENA_BANDS.length-1,Math.floor((Math.max(1,round)-1)/3))];
}

let arenaThemeId=null,arenaTheme=ARENA_THEMES['outer-pen'],arenaLayer=null,arenaDirty=true,arenaMotes=[];
let arenaThemeOverride=null;            // test bench / tools only
function boardDirty(){arenaDirty=true;}
function arenaHash(n){const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);}
function arenaMix(h1,h2,t){const a=parseInt(h1.slice(1),16),b=parseInt(h2.slice(1),16);let o='#';for(const sh of [16,8,0]){const x=a>>sh&255,y=b>>sh&255;o+=Math.round(x+(y-x)*t).toString(16).padStart(2,'0');}return o;}
function setArenaTheme(id){
  if(!ARENA_THEMES[id]||id===arenaThemeId)return;
  arenaThemeId=id;arenaTheme=ARENA_THEMES[id];arenaDirty=true;
  const n=arenaTheme.motes?arenaTheme.motes.count:0;arenaMotes=[];
  for(let i=0;i<n;i++)arenaMotes.push({x:arenaHash(i+1),y:arenaHash(i+50)*.75,r:.8+arenaHash(i+90)*1.6,ph:arenaHash(i+7)*TAU,sp:.6+arenaHash(i+13)*.8});
}

function polyPath(poly){ctx.beginPath();poly.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}

/* Everything that does not move, painted once per resize or theme change. */
function buildArenaLayer(){
  const cv2=arenaLayer||(typeof OffscreenCanvas==='function'?new OffscreenCanvas(1,1):document.createElement('canvas'));
  cv2.width=Math.max(1,Math.round(W*DPR));cv2.height=Math.max(1,Math.round(H*DPR));
  const g2=cv2.getContext('2d'),t=arenaTheme,x0=-SQ3/2,x1=SQ3*(COLS+.5)-SQ3/2;
  g2.setTransform(DPR,0,0,DPR,0,0);
  const path=poly=>{g2.beginPath();poly.forEach((p,i)=>i?g2.lineTo(p.x,p.y):g2.moveTo(p.x,p.y));g2.closePath();};
  const farL=P(x0,ZFAR),farR=P(x1,ZFAR),horizon=farL.y;
  // backdrop and far wall with arches
  let g=g2.createLinearGradient(0,0,0,horizon+10);g.addColorStop(0,t.sky[0]);g.addColorStop(1,t.sky[1]);g2.fillStyle=g;g2.fillRect(0,0,W,H);
  const wallTop=Math.max(0,horizon-(farR.x-farL.x)*.17);
  g2.fillStyle=t.wall;g2.fillRect(0,wallTop,W,horizon-wallTop+2);
  const arches=7,aw=W/arches;
  for(let i=0;i<arches;i++){const cx=aw*(i+.5),top=wallTop+(horizon-wallTop)*.28,w=aw*.26,bot=horizon-2;
    g2.beginPath();g2.moveTo(cx-w,bot);g2.lineTo(cx-w,top+w);g2.arc(cx,top+w,w,Math.PI,0);g2.lineTo(cx+w,bot);g2.closePath();
    g2.fillStyle=arenaMix(t.wall,'#000000',.45);g2.fill();g2.fillStyle=rgba(t.lights,.1);g2.fill();}
  g2.fillStyle=rgba(t.accent,.35);g2.fillRect(0,wallTop,W,1.5);
  // floor apron the board is cut into
  const fl=P(x0-1.6,ZFAR),fr=P(x1+1.6,ZFAR),nl=P(x0-1.6,ZMAX+.4),nr=P(x1+1.6,ZMAX+.4);
  g2.beginPath();g2.moveTo(fl.x,fl.y);g2.lineTo(fr.x,fr.y);g2.lineTo(nr.x,nr.y);g2.lineTo(nl.x,nl.y);g2.closePath();
  g=g2.createLinearGradient(0,horizon,0,H);g.addColorStop(0,arenaMix(t.wall,'#000000',.2));g.addColorStop(1,arenaMix(t.bench,'#000000',.1));g2.fillStyle=g;g2.fill();
  // hex cells: the pen and your side read as two territories
  for(const cl of CELLS){
    path(cl.poly);g2.fillStyle=(cl.r<GATE?t.floorPen:t.floorYou)[(cl.c+cl.r)%2];g2.fill();
    g2.strokeStyle=t.edge;g2.lineWidth=1;g2.stroke();
    const k=cl.r*31+cl.c*7;g2.fillStyle='rgba(0,0,0,.16)';
    for(let i=0;i<3;i++){g2.beginPath();g2.arc(cl.ctr.x+(arenaHash(k+i)-.5)*cl.ctr.s*1.1,cl.ctr.y+(arenaHash(k+i+9)-.5)*cl.ctr.s*.5,Math.max(.6,cl.ctr.s*.045),0,TAU);g2.fill();}
  }
  // boss arenas: a faint ground sigil across the pen
  if(t.sigil){const z=1.5*(GATE-1)/2,c=P(XC,z),rx=c.s*6.2,ry=rx*groundRatio(z);
    g2.strokeStyle=rgba(t.sigil,.16);g2.lineWidth=2;
    for(const m of [1,.82]){g2.beginPath();g2.ellipse(c.x,c.y,rx*m,ry*m,0,0,TAU);g2.stroke();}
    for(let i=0;i<12;i++){const a=i*TAU/12;g2.beginPath();g2.moveTo(c.x+Math.cos(a)*rx*.82,c.y+Math.sin(a)*ry*.82);g2.lineTo(c.x+Math.cos(a)*rx,c.y+Math.sin(a)*ry);g2.stroke();}}
  // exit row base (the pulse is per frame)
  for(const cl of CELLS)if(cl.r===0){path(cl.poly);g2.fillStyle=rgba(t.exit,.14);g2.fill();}
  // gate line and posts
  const gy=(CELLS[(GATE-1)*COLS].ctr.y+CELLS[GATE*COLS].ctr.y)/2,gl=CELLS[GATE*COLS].poly[3].x-8,gr=CELLS[GATE*COLS+COLS-1].poly[0].x+8;
  g2.strokeStyle=rgba(t.accent,.45);g2.setLineDash([6,5]);g2.lineWidth=1.5;g2.beginPath();g2.moveTo(gl,gy);g2.lineTo(gr,gy);g2.stroke();g2.setLineDash([]);
  for(const x of [gl,gr]){g2.fillStyle=arenaMix(t.wall,'#ffffff',.12);g2.fillRect(x-2,gy-9,4,11);g2.fillStyle=rgba(t.accent,.8);g2.fillRect(x-2,gy-10,4,2);}
  // bench rail and slots
  const bl=P(x0-.3,BENCHZ-1.05),br=P(x1+.3,BENCHZ-1.05),bnl=P(x0-.3,BENCHZ+1.05),bnr=P(x1+.3,BENCHZ+1.05);
  g2.beginPath();g2.moveTo(bl.x,bl.y);g2.lineTo(br.x,br.y);g2.lineTo(bnr.x,bnr.y);g2.lineTo(bnl.x,bnl.y);g2.closePath();
  g2.fillStyle=t.bench;g2.fill();g2.strokeStyle=rgba(t.accent,.22);g2.lineWidth=1;g2.stroke();
  for(const s of BSLOTS){path(s.poly);g2.fillStyle=arenaMix(t.bench,'#ffffff',.05);g2.fill();g2.strokeStyle='rgba(255,255,255,.09)';g2.stroke();}
  // light from the far wall, then a vignette, both under the fighters
  g=g2.createRadialGradient(W/2,horizon,0,W/2,horizon,H*.7);g.addColorStop(0,rgba(t.lights,.13));g.addColorStop(1,rgba(t.lights,0));g2.fillStyle=g;g2.fillRect(0,0,W,H);
  g=g2.createRadialGradient(W/2,H*.55,Math.min(W,H)*.35,W/2,H*.55,Math.max(W,H)*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+t.vignette+')');g2.fillStyle=g;g2.fillRect(0,0,W,H);
  arenaLayer=cv2;arenaDirty=false;
}

function drawBoard(now){
  setArenaTheme(arenaThemeOverride||themeForRound(S.round,S.bossArena));
  if(arenaDirty)buildArenaLayer();
  // Screen shake from fx.js moves the whole frame: the board, the fighters drawn after it, and the effects.
  const sh=typeof impactShake==='function'?impactShake():null;if(sh&&(sh.x||sh.y))ctx.translate(sh.x,sh.y);
  const t=arenaTheme,rm=typeof impactReduced==='function'?impactReduced():reduced;
  ctx.fillStyle=t.sky[0];ctx.fillRect(-24,-24,W+48,H+48);   // overscan so shake never shows an edge
  ctx.drawImage(arenaLayer,0,0,W,H);
  const horizon=P(-SQ3/2,ZFAR).y;
  // torch light on the far wall: slow flicker
  const fl=rm?.5:.5+.25*Math.sin(now*3.1)+.15*Math.sin(now*7.3);
  for(const fx of [.14,.86]){const g=ctx.createRadialGradient(W*fx,horizon-6,0,W*fx,horizon-6,W*.22);g.addColorStop(0,rgba(t.lights,.16+.08*fl));g.addColorStop(1,rgba(t.lights,0));ctx.fillStyle=g;ctx.fillRect(W*fx-W*.22,horizon-6-W*.22,W*.44,W*.44);}
  // Storm Hollow: a slow, dim sky pulse. Never a flash; off under reduced motion.
  if(t.storm&&!rm){const p=Math.max(0,Math.sin(now*.7))**8;if(p>.01){ctx.fillStyle=rgba('#9fb8ff',.08*p);ctx.fillRect(0,0,W,horizon);}}
  // exit row pulse
  for(const cl of CELLS)if(cl.r===0){polyPath(cl.poly);ctx.fillStyle=rgba(t.exit,rm?.12:.08+.07*Math.sin(now*2+cl.c));ctx.fill();}
  // camp: drag highlights and the release strip
  if(drag&&drag.moved){
    const hover=cellAt(drag.x,drag.y),hs=slotAt(drag.x,drag.y);
    for(const cl of CELLS)if(cl.r>=GATE){polyPath(cl.poly);ctx.fillStyle=rgba(t.accent,hover===cl?.32:.08);ctx.fill();}
    if(hs){polyPath(hs.poly);ctx.fillStyle=rgba(t.accent,.3);ctx.fill();}
    if(drag.u.key!=='cmd'){ctx.fillStyle=rgba(C.foe,drag.y>H-46?.5:.22);ctx.fillRect(0,H-46,W,46);ctx.fillStyle=C.ink;ctx.font='700 13px '+MONO;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('RELEASE',W/2,H-23);}
  }
  // ambient motes (embers, dust, spray); still under reduced motion
  if(t.motes&&arenaMotes.length){
    ctx.fillStyle=rgba(t.motes.color,.5);const hh=H*.8;
    for(const m of arenaMotes){
      const y=rm?m.y*H:(((m.y*H-now*t.motes.rise*m.sp)%hh)+hh)%hh,x=m.x*W+(rm?0:Math.sin(now*.6*m.sp+m.ph)*6);
      ctx.globalAlpha=.35+.3*Math.sin(now*m.sp+m.ph);ctx.beginPath();ctx.arc(x,y,m.r,0,TAU);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
}

/* The brand: a glowing sigil stamped in light on the ground (never a hot iron). Called by units.js under
   branded fighters. It lies flat at the fighter's depth, and plays a short stamp when fx.js saw a 'brand' event there. */
function sigil(x,y,R,rot){
  const D=CAMH*F/Math.max(1e-3,y-YH),z=DN+ZMAX-D,k=groundRatio(z);
  const rm=typeof impactReduced==='function'?impactReduced():reduced;
  const st=typeof brandStampAt==='function'?brandStampAt(x,y,R):null,age=st==null?9:performance.now()/1000-st;
  const intro=age<.45&&!rm?1-age/.45:0,sc=1+intro*intro*.8,col=arenaTheme.accent;
  ctx.save();ctx.translate(x,y);ctx.scale(sc,sc*k);
  ctx.strokeStyle=col;ctx.lineWidth=2.2/sc;ctx.shadowColor=col;ctx.shadowBlur=rm?0:12+intro*14;
  ctx.save();ctx.rotate(rot);
  for(let n=0;n<2;n++){ctx.beginPath();for(let i=0;i<3;i++){const a=n*Math.PI/3+i*TAU/3-Math.PI/2;ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R);}ctx.closePath();ctx.stroke();}
  ctx.restore();
  ctx.beginPath();ctx.arc(0,0,R*1.05,0,TAU);ctx.stroke();
  if(intro>0){ctx.fillStyle=rgba(col,.35*intro);ctx.fill();}
  ctx.restore();
}
