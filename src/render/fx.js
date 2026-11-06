/* src/render/fx.js — owner: Arena. Effects: damage numbers, particles, rings, projectiles. Spawners here; drawn by drawFx(). */
const floats=[],parts=[],shots=[],rings=[];
function headPos(a,lift){const p=P(a.x,a.z);return {x:p.x,y:p.y-p.s*(lift==null?1.9:lift),s:p.s};}
function floatAt(a,txt,col,size,lift){const h=headPos(a,lift);floats.push({x:h.x+rnd(-8,8),y:h.y,txt,col,life:1,size:size||1});}
function puff(a,col){const p=P(a.x,a.z);const n=reduced?6:16;for(let i=0;i<n;i++){const t=rnd(0,TAU),s=rnd(25,80);parts.push({x:p.x,y:p.y-p.s*.7,vx:Math.cos(t)*s,vy:Math.sin(t)*s-30,life:1,col,r:rnd(2,5)});}}
function ring(a,col,r1){rings.push({x:a.x,z:a.z,r:.2,r1:r1||1.6,life:1,col});}
function drawFx(dt){
  for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.life-=dt*2.2;if(r.life<=0){rings.splice(i,1);continue;}const p=P(r.x,r.z),rad=(r.r+(r.r1-r.r)*(1-r.life))*p.s;ctx.strokeStyle=rgba(r.col,r.life);ctx.lineWidth=3*r.life+1;ctx.beginPath();ctx.ellipse(p.x,p.y,rad,rad*.42,0,0,TAU);ctx.stroke();}
  for(const s of shots){
    const p=P(s.x,s.z),r=Math.max(2.5,p.s*(s.big?.22:.12));
    s.trail.forEach((t,i)=>{const q=P(t[0],t[1]);ctx.fillStyle=rgba(s.col,(i+1)/s.trail.length*.35);ctx.beginPath();ctx.arc(q.x,q.y-q.s*.9,r*.8,0,TAU);ctx.fill();});
    ctx.fillStyle=s.col;ctx.shadowColor=s.col;ctx.shadowBlur=reduced?0:10;ctx.beginPath();ctx.arc(p.x,p.y-p.s*.9,r,0,TAU);ctx.fill();ctx.shadowBlur=0;
  }
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt*1.8;if(p.life<=0){parts.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.life+1,0,TAU);ctx.fill();}
  ctx.globalAlpha=1;
  for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.life-=dt*1.25;if(f.life<=0){floats.splice(i,1);continue;}f.y-=dt*34;const pop=f.life>.85?1+(f.life-.85)*2.2:1;ctx.globalAlpha=Math.min(1,f.life*1.7);const fs=Math.max(11,13*f.size*pop);ctx.font='800 '+fs+'px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3.5;ctx.strokeStyle='rgba(0,0,0,.75)';ctx.strokeText(f.txt,f.x,f.y);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y);}
  ctx.globalAlpha=1;
}
