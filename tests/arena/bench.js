/* Arena test bench: the locked camera, every background and the impact grammar, running the game's own
   src/render/camera.js, board.js and fx.js on stand-in fighters. Not game code.
   tests/arena/build.mjs joins: a small stand-in for the game's globals, the three Arena files, then this file.
   The stand-ins are drawn at the exact size and foot line a baked 96 x 120 sprite will use. */
(function(){
const CLASS_COL=['#e0704f','#5fcf8e','#9d7ff2','#cfae6b','#ff8a3d','#79cfe6','#cc72c6','#a6cc5c'];
let fighters=[],uidB=1,guides=false,auto=true,dense=false;
const held=new Map();   // stand-in for Animations' T.hitstop(): fighters whose move is frozen

function mk(c,r,team,k){const [x,z]=cellW(c,r);return {id:'f'+(uidB++),x,z,team,col:CLASS_COL[k%8],star:1+(k%3),lunge:0,flash:0,ko:false,koT:0,hx:0,hz:team==='you'?-1:1,phase:Math.random()*6};}
function spawn(){
  fighters=[];uidB=1;
  const yours=dense?[[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[1,8],[3,8],[5,8],[0,10],[2,10],[4,10],[6,10],[3,11]]:[[2,7],[4,7],[6,7],[1,8],[3,9],[5,9],[2,10],[4,11]];
  const pen=dense?[[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[1,3],[3,3],[5,3],[7,3],[0,4],[2,4],[4,4],[6,4]]:[[1,2],[3,1],[5,2],[6,3],[2,4],[4,4],[0,3],[7,5]];
  const bossRound=!!ARENA_THEMES[themeForRound(S.round)].boss;
  yours.forEach(([c,r],i)=>fighters.push(mk(c,r,'you',i)));
  pen.forEach(([c,r],i)=>fighters.push(mk(c,r,i===0&&bossRound?'boss':'pen',i+3)));
  for(let i=0;i<BENCH;i++){const [x,z]=benchW(i);fighters.push({id:'b'+i,x,z,team:'you',bench:true,col:CLASS_COL[(i*3)%8],hx:0,hz:-1,phase:i,star:1});}
  const runner=fighters.find(f=>f.team==='pen'&&f.z<3);if(runner)runner.runner=true;
}
const live=f=>!f.ko&&!f.bench;
const sizeOf=f=>spriteScale(f.z)*(f.bench?.9:1)*(f.team==='boss'?1.35:1);

function figure(f,now){
  const p=P(f.x,f.z),k=sizeOf(f),body=SPRITE_CELL.body*k,bw=body*.17;
  let x=p.x,y=p.y;
  // ground: shadow, team ring, runner glow, brand sigil (in the game, units.js draws these and calls sigil())
  const gr=groundRatio(f.z),s=p.s*(f.team==='boss'?1.35:f.bench?.9:1);
  ctx.save();ctx.globalAlpha=f.bench?.7:1;
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(x,y,s*.62,s*.62*gr,0,0,TAU);ctx.fill();
  if(f.runner){const pu=impactReduced()?.5:.5+.5*Math.sin(now*7);ctx.fillStyle=rgba(arenaTheme.accent,.16+.24*pu);ctx.beginPath();ctx.ellipse(x,y,s*1.05,s*1.05*gr,0,0,TAU);ctx.fill();}
  ctx.lineWidth=Math.max(2,s*.09);ctx.strokeStyle=f.team==='you'?C.you:C.foe;ctx.beginPath();ctx.ellipse(x,y,s*.55,s*.55*gr,0,0,TAU);ctx.stroke();
  if(f.branded)sigil(x,y,s*.85,impactReduced()?0:now*1.5);
  if(f.lunge>0&&f.tgt){const tp=P(f.tgt.x,f.tgt.z),l=Math.hypot(tp.x-x,tp.y-y)||1,m=Math.sin(f.lunge*Math.PI)*body*.18;x+=(tp.x-x)/l*m;y+=(tp.y-y)/l*m;}
  const bob=held.has(f.id)||impactReduced()?0:Math.sin(now*3+f.phase)*body*.012,top=y-body+bob;
  ctx.beginPath();ctx.moveTo(x-bw,y-body*.04);ctx.lineTo(x-bw,top+bw);ctx.arc(x,top+bw,bw,Math.PI,0);ctx.lineTo(x+bw,y-body*.04);ctx.ellipse(x,y-body*.04,bw,bw*.4,0,0,Math.PI);ctx.closePath();
  ctx.fillStyle=f.col;ctx.fill();
  const sh=ctx.createLinearGradient(x-bw,0,x+bw,0);sh.addColorStop(0,'rgba(255,255,255,.28)');sh.addColorStop(.45,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(0,0,0,.32)');ctx.fillStyle=sh;ctx.fill();
  if(f.flash>0){ctx.fillStyle='rgba(255,255,255,'+(f.flash*.6)+')';ctx.fill();}
  ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=1;ctx.stroke();
  const {row,flip}=headingToRow(f.hx,f.hz);   // facing dot: which way the fighter looks
  ctx.fillStyle='rgba(10,8,14,.75)';ctx.beginPath();ctx.arc(x+(flip?-1:1)*bw*(row===2?.2:.45),top+bw*.9,Math.max(1.5,bw*.18),0,TAU);ctx.fill();
  if(guides&&!f.bench){
    const cw=SPRITE_CELL.cellW*k,ch=SPRITE_CELL.cellH*k,footY=y+SPRITE_CELL.foot*k;
    ctx.strokeStyle='rgba(143,227,255,.8)';ctx.setLineDash([3,3]);ctx.lineWidth=1;ctx.strokeRect(x-cw/2,footY-ch,cw,ch);ctx.setLineDash([]);
    ctx.fillStyle='rgba(143,227,255,.9)';ctx.font='600 9px '+MONO;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText('row '+row+(flip?' ⇋':''),x,footY-ch-3);
  }
  if(!f.bench){ctx.fillStyle=['#c98a52','#d6dde6','#f2b84b'][f.star-1];ctx.font='700 '+Math.max(8,body*.16)+'px '+FONT;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText('★'.repeat(f.star),x,top-body*.06);}
  ctx.restore();
}

/* Mock fight: fires the same contact events Actions/Functions will. */
function strike(type){
  if(type==='brand'){const pen=fighters.filter(f=>live(f)&&f.team!=='you'&&!f.branded);const t=pen[Math.floor(Math.random()*pen.length)];if(t){t.branded=true;fxEvent('brand',{at:{x:t.x,z:t.z},victim:t.id});}return;}
  const att=fighters.filter(live),a=att[Math.floor(Math.random()*att.length)];if(!a)return;
  let v=null,bd=1e9;for(const f of fighters)if(live(f)&&(f.team==='you')!==(a.team==='you')){const d=Math.hypot(f.x-a.x,f.z-a.z);if(d<bd){bd=d;v=f;}}
  if(!v)return;
  a.tgt=v;a.lunge=1;a.hx=v.x-a.x;a.hz=v.z-a.z;v.hx=a.x-v.x;v.hz=a.z-v.z;
  const e={at:{x:v.x,z:v.z},from:{x:a.x,z:a.z},attacker:a.id,victim:v.id,star:a.star,boss:a.team==='boss'};
  if(!type){const r=Math.random();type=r<.05?'ko':r<.08?'big':r<.2?'crit':r<.3?'ability':'hit';}
  const hold=()=>{const until=performance.now()/1000+HITSTOP_MS/1000;held.set(a.id,until);held.set(v.id,until);};
  if(type==='big'){e.star=3;e.ability=true;fxEvent('cast',{at:e.from,attacker:a.id,star:3,ability:true});fxEvent('hit',e);hold();}
  else if(type==='ability'){e.ability=true;e.star=Math.min(2,e.star);fxEvent('hit',e);hold();}
  else if(type==='crit'){fxEvent('crit',e);hold();}
  else if(type==='ko'){fxEvent('hit',e);fxEvent('ko',e);puff(v,v.col);v.ko=true;v.koT=1.6;}
  else fxEvent('hit',e);
  v.flash=1;
}

let lastT=performance.now(),fpsT=0,fpsN=0,ftSum=0,nextHit=.4;
function frame(ts){
  const dt=Math.min(.05,(ts-lastT)/1000);lastT=ts;const now=ts/1000,t0=performance.now();
  if(auto){nextHit-=dt;if(nextHit<=0){nextHit=.22+Math.random()*.3;strike();}}
  for(const [id,u] of held)if(now>=u)held.delete(id);
  for(const f of fighters){
    if(!held.has(f.id)){f.lunge=Math.max(0,(f.lunge||0)-dt*5);f.flash=Math.max(0,(f.flash||0)-dt*6);}
    if(f.ko){f.koT-=dt;if(f.koT<=0){f.ko=false;f.flash=0;}}
  }
  if(W>0&&CELLS.length){
    ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
    drawBoard(now);
    fighters.filter(f=>!f.ko).sort((a,b)=>a.z-b.z).forEach(f=>figure(f,now));
    drawFx(dt);
  }
  ftSum+=performance.now()-t0;fpsN++;fpsT+=dt;
  if(fpsT>=1){$('perf').textContent=Math.round(fpsN/fpsT)+' fps · '+(ftSum/fpsN).toFixed(1)+' ms draw';fpsT=fpsN=ftSum=0;}
  requestAnimationFrame(frame);
}

function report(){
  const mid=P(XC,BOARD_MIDZ),body=ARENA_CAM.bodyWorld*mid.s,dp=devicePixelRatio||1;
  $('scale').textContent='fighter '+Math.round(body)+' pt tall mid-board · '+Math.round(body*dp)+' device px on this screen';
}
new ResizeObserver(()=>setTimeout(report,0)).observe(stage);

function setRound(r){
  S.round=r;spawn();$('themeName').textContent=ARENA_THEMES[themeForRound(r)].name;
  [...document.querySelectorAll('[data-round]')].forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.round===r)));
}
const rounds=[[1,'R1–2'],[3,'Boss 3'],[4,'R4–5'],[6,'Boss 6'],[7,'R7–8'],[9,'Boss 9'],[10,'R10–11'],[12,'Boss 12'],[13,'Boss 13']];
$('rounds').innerHTML=rounds.map(([r,l])=>'<button type="button" data-round="'+r+'" class="'+(ARENA_THEMES[themeForRound(r)].boss?'boss':'')+'" aria-pressed="false">'+l+'</button>').join('');
$('rounds').addEventListener('click',e=>{const b=e.target.closest('[data-round]');if(b)setRound(+b.dataset.round);});
$('events').addEventListener('click',e=>{const b=e.target.closest('[data-ev]');if(b)strike(b.dataset.ev);});
$('auto').addEventListener('change',e=>{auto=e.target.checked;});
$('guides').addEventListener('change',e=>{guides=e.target.checked;});
$('dense').addEventListener('change',e=>{dense=e.target.checked;spawn();});
$('reduced').checked=reduced;
$('reduced').addEventListener('change',e=>{impactForceReduced=e.target.checked;});
const sl=$('sliders');
sl.innerHTML=Object.entries(IMPACT_TUNING).map(([k,d])=>'<label for="s-'+k+'"><span>'+d.label+'</span><output id="o-'+k+'">'+d.def+'</output><input id="s-'+k+'" type="range" min="'+d.min+'" max="'+d.max+'" step="'+d.step+'" value="'+d.def+'"></label>').join('');
sl.addEventListener('input',e=>{const k=e.target.id.slice(2);if(!(k in IMPACT_TUNING))return;impactSettings[k]=+e.target.value;$('o-'+k).textContent=e.target.value;});
$('resetSliders').addEventListener('click',()=>{for(const [k,d] of Object.entries(IMPACT_TUNING)){impactSettings[k]=d.def;$('s-'+k).value=d.def;$('o-'+k).textContent=d.def;}});
$('camNums').textContent=ARENA_CAM.elevDeg+'° down · far edge '+ARENA_CAM.farNearRatio+'× · fighter '+ARENA_CAM.bodyWorld+' hex radii tall · cell '+SPRITE_CELL.cellW+'×'+SPRITE_CELL.cellH+', feet at '+(SPRITE_CELL.cellH-SPRITE_CELL.foot)+', body '+SPRITE_CELL.body+' px · baked rows at '+SPRITE_CELL.rows.map(r=>r.yawDeg+'°').join(' / ')+' · hit-stop '+HITSTOP_MS+' ms';

ARENA_PAD={top:30,bottom:6,side:4};
setRound(1);resize();report();requestAnimationFrame(frame);
window.__bench={strike,setRound,get fighters(){return fighters;},stats:()=>({sparks:impactSparks.length,flashes:impactFlashes.length,shakes:impactShakes.length})};
})();
