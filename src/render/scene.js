/* src/render/scene.js — owner: Engineering. Draws one frame: board, then everything sorted by depth, then effects. */
function draw(now,dt){
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
  drawBoard(now);
  const camp=S.phase==='prep'||S.phase==='results';
  const items=[];
  if(camp){
    for(const u of S.board){if(drag&&drag.moved&&drag.u===u)continue;const [x,z]=cellW(u.c,u.r),p=P(x,z);items.push({y:p.y,f:()=>figure(u,p.x,p.y,p.s,now,{team:'you',stars:true,sel:S.sel&&S.sel.uid===u.uid})});}
    S.bench.forEach((u,i)=>{if(drag&&drag.moved&&drag.u===u)return;const p=BSLOTS[i].ctr;items.push({y:p.y,f:()=>figure(u,p.x,p.y+p.s*.3,p.s*.9,now,{team:'you',stars:true,sel:S.sel&&S.sel.uid===u.uid})});});
  } else {
    for(const a of S.actors){
      if(a.ko||(a.gone&&!a.fleeingOut))continue;
      let x=a.x,z=a.z;
      if(a.lunge>0&&a.target){const dx=a.target.x-a.x,dz=a.target.z-a.z,l=Math.hypot(dx,dz)||1,k=Math.sin(a.lunge*Math.PI)*.3;x+=dx/l*k;z+=dz/l*k;}
      let al=1;if(a.fleeingOut){a.fade=Math.max(0,a.fade-dt*1.6);al=a.fade;z-=(1-a.fade)*1.5;}
      const p=P(x,z);
      items.push({y:p.y,f:()=>figure(a,p.x,p.y,p.s,now,{team:a.team,bars:a,runner:a.runner&&!a.gone,branded:a.branded,fleeing:a.fleeing,alpha:al,flash:a.flash,stun:a.stun,root:a.root,knock:a.knock})});
    }
    S.bench.forEach((u,i)=>{const p=BSLOTS[i].ctr;items.push({y:p.y,f:()=>figure(u,p.x,p.y+p.s*.3,p.s*.9,now,{team:'you',stars:true,alpha:.55})});});
  }
  items.sort((a,b)=>a.y-b.y).forEach(i=>i.f());
  drawFx(dt);
  if(drag&&drag.moved){figure(drag.u,drag.x,drag.y+20,Math.max(22,BSLOTS[0].ctr.s*1.05),now,{team:'you',stars:true,alpha:.85});}
}
