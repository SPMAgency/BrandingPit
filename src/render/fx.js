/* src/render/fx.js — owner: Arena. Effects: damage numbers, particles, rings, projectiles, and the impact grammar.
   Shared-scope script. Names other files use, keep them: floats parts shots rings headPos floatAt puff ring drawFx.

   IMPACT GRAMMAR (Animation Reboot plan), fired by fxEvent() on the contact frame:
     hit      small spark on the side the blow came from                  every hit
     crit /   bigger spark (hit-stop itself is Animations': T.hitstop()    every one
     ability  on both moves, number in move_timing.json impact.hitstopMs)
     ko       35 ms white flash at the contact point, small shake, puff   flash + shake at most 2 a second
     3-star / 100 ms flash + shake                                         rare by design
     boss ability
   Every number is a slider in IMPACT_TUNING. Under reduced motion every flash and shake is off and sparks
   drop to a few particles. Photosensitivity ceiling: never more than 3 flashes in one second, whatever the sliders say. */
const floats=[],parts=[],shots=[],rings=[];
function headPos(a,lift){const p=P(a.x,a.z);return {x:p.x,y:p.y-p.s*(lift==null?1.9:lift),s:p.s};}
function floatAt(a,txt,col,size,lift){const h=headPos(a,lift);floats.push({x:h.x+rnd(-8,8),y:h.y,txt,col,life:1,size:size||1});}
function puff(a,col){const p=P(a.x,a.z);const n=reduced?6:16;for(let i=0;i<n;i++){const t=rnd(0,TAU),s=rnd(25,80);parts.push({x:p.x,y:p.y-p.s*.7,vx:Math.cos(t)*s,vy:Math.sin(t)*s-30,life:1,col,r:rnd(2,5)});}}
function ring(a,col,r1){rings.push({x:a.x,z:a.z,r:.2,r1:r1||1.6,life:1,col});}

/* ---------- impact grammar ---------- */
const IMPACT_TUNING={
  sparkScale:       {def:1,   min:0, max:2,   step:.05,label:'Spark size'},
  sparkCount:       {def:7,   min:0, max:16,  step:1,  label:'Spark particles'},
  critSparkScale:   {def:1.7, min:1, max:3,   step:.05,label:'Crit / ability spark size'},
  koFlashMs:        {def:35,  min:0, max:120, step:5,  label:'Knockout flash (ms)'},
  koFlashPerSec:    {def:2,   min:0, max:3,   step:1,  label:'Knockout flashes per second, max'},
  koShakePx:        {def:3,   min:0, max:10,  step:.5, label:'Knockout shake (px)'},
  koShakeMs:        {def:120, min:0, max:400, step:10, label:'Knockout shake length (ms)'},
  bigFlashMs:       {def:100, min:0, max:200, step:5,  label:'3-star / boss flash (ms)'},
  bigFlashAlpha:    {def:.28, min:0, max:.5,  step:.01,label:'3-star / boss screen flash strength'},
  bigShakePx:       {def:6,   min:0, max:14,  step:.5, label:'3-star / boss shake (px)'},
  bigShakeMs:       {def:220, min:0, max:500, step:10, label:'3-star / boss shake length (ms)'},
  contactFlashAlpha:{def:.8,  min:0, max:1,   step:.05,label:'Contact flash strength'}
};
const IMPACT_MAX_FLASHES_PER_SEC=3;  // hard ceiling, not a slider
const impactSettings={};for(const k in IMPACT_TUNING)impactSettings[k]=IMPACT_TUNING[k].def;
let impactForceReduced=null;          // null = follow the phone setting; the test bench can force it
let impactT=0;
const impactSparks=[],impactFlashes=[],impactShakes=[],impactFlashTimes=[],impactKoTimes=[],brandStamps=[],impactLastBig=new Map();
function impactReduced(){return impactForceReduced==null?reduced:impactForceReduced;}

/* The contact point: the victim's chest, nudged toward the attacker; 'toward' is the screen angle to the attacker. */
function impactContact(e){
  const v=e.at,a=e.from||v;let dx=a.x-v.x,dz=a.z-v.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  const p=P(v.x+dx*.35,v.z+dz*.35),pa=P(a.x,a.z),pv=P(v.x,v.z);
  return {x:p.x,y:p.y-p.s*ARENA_CAM.bodyWorld*.55,s:p.s,toward:Math.atan2(pa.y-pv.y,pa.x-pv.x)};
}
function impactCanFlash(list,perSec){
  while(impactFlashTimes.length&&impactT-impactFlashTimes[0]>1)impactFlashTimes.shift();
  while(list&&list.length&&impactT-list[0]>1)list.shift();
  return impactFlashTimes.length<IMPACT_MAX_FLASHES_PER_SEC&&!(list&&list.length>=perSec);
}
function impactFlash(c,ms,alpha,screen,list){
  if(impactReduced()||ms<=0||alpha<=0)return false;
  impactFlashTimes.push(impactT);if(list)list.push(impactT);
  impactFlashes.push({x:c.x,y:c.y,r:c.s*ARENA_CAM.bodyWorld*.8,t0:impactT,dur:ms/1000,alpha,screen});return true;
}
function impactShakeAdd(px,ms){if(impactReduced()||px<=0||ms<=0)return;impactShakes.push({amp:px,t0:impactT,dur:ms/1000,ph:Math.random()*100});}
function impactSpark(c,big,col){
  const st=impactSettings,scale=st.sparkScale*(big?st.critSparkScale:1);if(scale<=0)return;
  const n=impactReduced()?3:Math.round(st.sparkCount*(big?1.6:1));
  impactSparks.push({kind:'star',x:c.x,y:c.y,life:1,decay:big?9:12,size:c.s*.55*scale,col:col||'#fff3c4',rot:c.toward});
  const away=c.toward+Math.PI;
  for(let i=0;i<n;i++){const a=away+rnd(-1.2,1.2),sp=rnd(60,160)*scale;impactSparks.push({kind:'dot',x:c.x,y:c.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-20,life:1,decay:rnd(3,5),r:rnd(1.2,2.4)*Math.max(.6,scale),col:col||'#ffd27a',g:120});}
}
function impactBig(e,c){
  const id=e.attacker==null?'big':e.attacker;
  if(impactT-(impactLastBig.has(id)?impactLastBig.get(id):-9)<.25)return;  // a cast and its hit count once
  impactLastBig.set(id,impactT);
  if(impactCanFlash(null))impactFlash(c,impactSettings.bigFlashMs,impactSettings.bigFlashAlpha,true);
  impactShakeAdd(impactSettings.bigShakePx,impactSettings.bigShakeMs);
}
/* Feed one contact event on its contact frame.
   type: 'hit' | 'crit' | 'ko' | 'cast' | 'brand' | 'recruit'
   e: { at:{x,z} victim (or caster) position, from:{x,z} attacker position, attacker, victim,
        crit, ability, star (1..3), boss, color } — positions in world units, as actors carry them. */
function fxEvent(type,e){
  if(!e||!e.at)return;
  const big=!!(e.ability&&(e.star===3||e.boss));
  if(type==='hit'||type==='crit'){
    const strong=type==='crit'||e.crit||e.ability,c=impactContact(e);
    impactSpark(c,strong,e.color);
    if(big)impactBig(e,c);
  } else if(type==='ko'){
    const c=impactContact(e);
    if(impactCanFlash(impactKoTimes,impactSettings.koFlashPerSec)&&impactFlash(c,impactSettings.koFlashMs,impactSettings.contactFlashAlpha,false,impactKoTimes))impactShakeAdd(impactSettings.koShakePx,impactSettings.koShakeMs);
    // the knockout puff itself is puff(), which combat already calls on a knockout
  } else if(type==='cast'){
    if(e.star===3||e.boss)impactBig(e,impactContact({at:e.at,from:e.at}));
  } else if(type==='brand'){
    const p=P(e.at.x,e.at.z);brandStamps.push({x:p.x,y:p.y,t:performance.now()/1000});if(brandStamps.length>6)brandStamps.shift();
    impactSparks.push({kind:'ring',x:p.x,y:p.y,life:1,decay:impactReduced()?6:2.4,size:p.s,k:groundRatio(e.at.z),col:e.color||C.sigil});
  }
  // 'recruit': the flight to the bench is drawn by the sprite player; nothing here yet.
}
/* Brand stamp lookup for sigil() in board.js: a recent stamp at this screen spot, or null. */
function brandStampAt(x,y,R){const now=performance.now()/1000;for(let i=brandStamps.length-1;i>=0;i--){const b=brandStamps[i];if(now-b.t>1){brandStamps.splice(i,1);continue;}if(Math.hypot(b.x-x,b.y-y)<R*1.2)return b.t;}return null;}
/* Screen offset for the whole frame; board.js applies it at the start of drawBoard(). */
function impactShake(){let x=0,y=0;for(const s of impactShakes){const k=1-(impactT-s.t0)/s.dur,a=s.amp*k*k,q=(impactT-s.t0)*60+s.ph;x+=a*Math.sin(q*1.9);y+=a*Math.cos(q*2.3);}return {x,y};}
function impactUpdate(dt){
  impactT+=dt;
  for(let i=impactSparks.length-1;i>=0;i--){const p=impactSparks[i];p.life-=dt*p.decay;if(p.life<=0){impactSparks.splice(i,1);continue;}if(p.vx!=null){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g||0)*dt;p.vx*=1-dt*3;}}
  for(let i=impactFlashes.length-1;i>=0;i--)if(impactT-impactFlashes[i].t0>impactFlashes[i].dur)impactFlashes.splice(i,1);
  for(let i=impactShakes.length-1;i>=0;i--)if(impactT-impactShakes[i].t0>impactShakes[i].dur)impactShakes.splice(i,1);
}
function drawImpact(){
  for(const p of impactSparks){
    ctx.globalAlpha=Math.max(0,Math.min(1,p.life));
    if(p.kind==='dot'){ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.r*(.5+p.life*.5),0,TAU);ctx.fill();}
    else if(p.kind==='star'){const s=p.size*(1.15-p.life*.3);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.col;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?s*.22:s*(i%4?.7:1);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.restore();}
    else if(p.kind==='ring'){const r=p.size*(1.6-p.life*.9);ctx.strokeStyle=p.col;ctx.lineWidth=3*p.life+1;ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*p.k,0,0,TAU);ctx.stroke();}
  }
  ctx.globalAlpha=1;
  for(const f of impactFlashes){
    const k=1-(impactT-f.t0)/f.dur;
    if(f.screen){ctx.fillStyle='rgba(255,255,255,'+(f.alpha*k)+')';ctx.fillRect(-24,-24,W+48,H+48);}
    const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,f.r);g.addColorStop(0,'rgba(255,255,255,'+((f.screen?.9:f.alpha)*k)+')');g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.fillRect(f.x-f.r,f.y-f.r,f.r*2,f.r*2);
  }
}

function drawFx(dt){
  impactUpdate(dt);
  for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.life-=dt*2.2;if(r.life<=0){rings.splice(i,1);continue;}const p=P(r.x,r.z),rad=(r.r+(r.r1-r.r)*(1-r.life))*p.s;ctx.strokeStyle=rgba(r.col,r.life);ctx.lineWidth=3*r.life+1;ctx.beginPath();ctx.ellipse(p.x,p.y,rad,rad*groundRatio(r.z),0,0,TAU);ctx.stroke();}
  for(const s of shots){
    const p=P(s.x,s.z),r=Math.max(2.5,p.s*(s.big?.22:.12));
    s.trail.forEach((t,i)=>{const q=P(t[0],t[1]);ctx.fillStyle=rgba(s.col,(i+1)/s.trail.length*.35);ctx.beginPath();ctx.arc(q.x,q.y-q.s*.9,r*.8,0,TAU);ctx.fill();});
    ctx.fillStyle=s.col;ctx.shadowColor=s.col;ctx.shadowBlur=reduced?0:10;ctx.beginPath();ctx.arc(p.x,p.y-p.s*.9,r,0,TAU);ctx.fill();ctx.shadowBlur=0;
  }
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt*1.8;if(p.life<=0){parts.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.life+1,0,TAU);ctx.fill();}
  ctx.globalAlpha=1;
  drawImpact();
  for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.life-=dt*1.25;if(f.life<=0){floats.splice(i,1);continue;}f.y-=dt*34;const pop=f.life>.85?1+(f.life-.85)*2.2:1;ctx.globalAlpha=Math.min(1,f.life*1.7);const fs=Math.max(11,13*f.size*pop);ctx.font='800 '+fs+'px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3.5;ctx.strokeStyle='rgba(0,0,0,.75)';ctx.strokeText(f.txt,f.x,f.y);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y);}
  ctx.globalAlpha=1;
}
