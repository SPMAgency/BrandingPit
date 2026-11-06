/* src/render/units.js — owner: Animations. Draws fighters: placeholder figures, health and mana bars, stars, items. Becomes the sprite-atlas player. */
function bars(x,y,s,a,team){
  const w=Math.max(36,s*1.45),h=Math.max(5,s*.17),x0=x-w/2;
  ctx.fillStyle='rgba(8,6,12,.85)';ctx.fillRect(x0-1.5,y-1.5,w+3,h+(a.maxMana?h*.55+2:0)+3);
  const tot=a.max+(a.shield||0),hpw=w*Math.max(0,a.hp)/tot;
  ctx.fillStyle=team==='you'?C.you:C.foe;ctx.fillRect(x0,y,hpw,h);
  if(a.shield>0){ctx.fillStyle='#f3f3f3';ctx.fillRect(x0+hpw,y,w*a.shield/tot,h);}
  ctx.fillStyle='rgba(0,0,0,.55)';const step=w*100/tot;if(step>2.2)for(let t=step;t<hpw;t+=step)ctx.fillRect(x0+t,y,(Math.round((t/step))%10===0)?1.6:.8,h*(Math.round(t/step)%10===0?1:.6));
  if(a.maxMana){ctx.fillStyle='#1c2440';ctx.fillRect(x0,y+h+1.5,w,h*.55);ctx.fillStyle=C.mana;ctx.fillRect(x0,y+h+1.5,w*a.mana/a.maxMana,h*.55);}
  return {w,h};
}
const STARC=['#c98a52','#d6dde6','#f2b84b'];
function figure(u,x,y,s,now,o){
  const col=colOf(u.key),team=o.team;
  ctx.save();ctx.globalAlpha=o.alpha==null?1:o.alpha;
  const lift=(o.knock?Math.sin(o.knock/.6*Math.PI)*s*.9:0);
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(x,y,s*.58,s*.24,0,0,TAU);ctx.fill();
  if(o.runner){const p=.5+.5*Math.sin(now*7);ctx.fillStyle=rgba(C.sigil,.18+.25*p);ctx.beginPath();ctx.ellipse(x,y,s*1.05,s*.45,0,0,TAU);ctx.fill();}
  if(o.root>0){ctx.strokeStyle='#8fd16a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,s*.62,s*.27,0,0,TAU);ctx.stroke();}
  ctx.lineWidth=Math.max(2,s*.09);ctx.strokeStyle=team==='pen'?C.foe:C.you;ctx.beginPath();ctx.ellipse(x,y,s*.5,s*.21,0,0,TAU);ctx.stroke();
  if(o.branded)sigil(x,y,s*.85,reduced?0:now*1.5);
  const by=y-lift, bw=s*.42, top=by-s*1.32;
  const gr=ctx.createLinearGradient(0,top,0,by);gr.addColorStop(0,rgba('#ffffff',.0));
  ctx.beginPath();ctx.moveTo(x-bw,by-s*.08);ctx.lineTo(x-bw,top+bw);ctx.arc(x,top+bw,bw,Math.PI,0);ctx.lineTo(x+bw,by-s*.08);ctx.ellipse(x,by-s*.08,bw,bw*.42,0,0,Math.PI);ctx.closePath();
  ctx.fillStyle=col;ctx.fill();
  const sh=ctx.createLinearGradient(x-bw,0,x+bw,0);sh.addColorStop(0,'rgba(255,255,255,.28)');sh.addColorStop(.45,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(0,0,0,.32)');ctx.fillStyle=sh;ctx.fill();
  if(o.flash>0){ctx.fillStyle='rgba(255,255,255,'+(o.flash*.6)+')';ctx.fill();}
  ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=1;ctx.stroke();
  if(u.key==='cmd'){ctx.fillStyle=C.sigil;ctx.beginPath();const cy=top-s*.05;ctx.moveTo(x-bw*.7,cy);ctx.lineTo(x-bw*.45,cy-s*.22);ctx.lineTo(x,cy-s*.08);ctx.lineTo(x+bw*.45,cy-s*.22);ctx.lineTo(x+bw*.7,cy);ctx.closePath();ctx.fill();}
  ctx.fillStyle='rgba(10,8,14,.78)';ctx.font='700 '+(s*.55)+'px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(u.key==='cmd'?'C':defOf(u.key).name[0],x,top+bw*1.25);
  if(o.stun>0){for(let i=0;i<3;i++){const a=now*5+i*TAU/3;ctx.fillStyle='#ffe58a';ctx.beginPath();ctx.arc(x+Math.cos(a)*s*.35,top-s*.15+Math.sin(a)*s*.12,Math.max(1.5,s*.06),0,TAU);ctx.fill();}}
  if(o.bars){
    const y0=top-s*.5-(o.stun>0?s*.2:0);const b=bars(x,y0,s,o.bars,team);
    if(u.star){const n=u.star,ss=Math.max(7,s*.24);ctx.fillStyle=STARC[n-1];ctx.font='700 '+ss+'px '+FONT;ctx.fillText('★'.repeat(n),x,y0-ss*.6);}
    const it=u.items||[];if(it.length){const sz=Math.max(6,s*.22);it.forEach((n,i)=>{ctx.fillStyle=ISTAT[n].c;ctx.fillRect(x-(it.length*(sz+2))/2+i*(sz+2),y0+b.h*1.6+4,sz,sz);});}
  } else if(o.stars&&u.star){const ss=Math.max(7,s*.26);ctx.fillStyle=STARC[u.star-1];ctx.font='700 '+ss+'px '+FONT;ctx.fillText('★'.repeat(u.star),x,top-s*.28);
    const it=u.items||[];const sz=Math.max(5,s*.18);it.forEach((n,i)=>{ctx.fillStyle=ISTAT[n].c;ctx.fillRect(x-(it.length*(sz+2))/2+i*(sz+2),y+s*.28,sz,sz);});}
  if(o.sel){ctx.strokeStyle=C.sigil;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,s*.72,s*.3,0,0,TAU);ctx.stroke();}
  if(o.fleeing){ctx.fillStyle=C.sigil;ctx.font='700 '+s*.5+'px '+FONT;ctx.fillText('↑',x+bw*1.6,top+bw);}
  ctx.restore();
}
