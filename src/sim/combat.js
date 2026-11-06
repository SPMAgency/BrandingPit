/* src/sim/combat.js — owner: Actions/Functions. Damage, healing, knockouts, attacks, abilities, the fight tick. */

function deal(src,tgt,amt,type,o){
  o=o||{};if(!live(tgt))return 0;
  let crit=false;
  if(o.canCrit){if(o.forceCrit||Math.random()<src.crit){crit=true;amt*=src.critD;}}
  if(src&&src.cls&&tgt.cls&&BEATS[src.cls]===tgt.cls)amt*=1+COUNTER;
  if(type==='phys')amt*=100/(100+tgt.armor);else if(type==='magic')amt*=100/(100+tgt.mr);
  amt=Math.max(1,Math.round(amt));
  let rest=amt;if(tgt.shield>0){const ab=Math.min(tgt.shield,rest);tgt.shield-=ab;rest-=ab;}
  tgt.hp-=rest;tgt.flash=1;
  if(tgt.maxMana)tgt.mana=Math.min(tgt.maxMana,tgt.mana+Math.min(amt*.05,10));
  if(src)src.dmgDone+=amt;S.dmg+=amt;
  if(!o.silent)floatAt(tgt,crit?amt+'!':String(amt),DMGC[type],crit?1.35:1);
  if(tgt.hp<=0)knockOut(tgt,src);
  return amt;
}
function heal(tgt,amt){if(!live(tgt))return;const h=Math.round(Math.min(amt,tgt.max-tgt.hp));if(h<=0)return;tgt.hp+=h;floatAt(tgt,'+'+h,DMGC.heal,1);}
function knockOut(t){
  t.ko=true;t.hp=0;t.koAt=S.t;occ.delete(K(t.c,t.r));puff(t,colOf(t.key));
  if(t.team==='pen'){S.log.recruits.push(t.key);floatAt(t,'Recruited',C.sigil,1.15,2.5);if(t.loot){S.log.loot.push(t.loot);floatAt(t,'+ '+t.loot,C.muted,.9,3.1);}}
  else floatAt(t,'Knocked out',C.muted,1,2.4);
}
function shoot(src,tgt,col,big,onHit){shots.push({x:src.x,z:src.z,tgt,col,big,spd:big?8:11,onHit,trail:[]});}
function onAttackHit(a,t){
  if(!live(t))return;
  let mult=1;
  if(a.team==='you'&&a.cls==='Warrior'&&TR.Warrior>=0){mult+=t.wstack;t.wstack=Math.min([1,2,3.5][TR.Warrior],t.wstack+.5);}
  deal(a,t,a.atk*mult*rnd(.95,1.05),'phys',{canCrit:true});
  if(a.team!=='you'||!a.cls)return;
  const k=TR[a.cls];if(k==null||k<0)return;
  if(a.cls==='Judge Mark'&&Math.random()<[.05,.18,.35][k]){t.slow=2;floatAt(t,'Slowed',C.mana,.8,2.3);}
  if(a.cls==='Ember Keeper'&&a.hits%5===0){t.burn=3;t.burnDps=Math.max(t.burnDps,t.max*.03);if(k>=1)deal(a,t,t.max*.03,'magic');}
  if(a.cls==='Gusting Shallow'&&a.hits%3===0){t.stun=Math.max(t.stun,[1.5,3][k]);floatAt(t,'Stunned',C.ink,.8,2.3);}
  if(a.cls==='Leaf in the Wind'&&Math.random()<.2){t.root=1.5;blink(a,t);}
}
function blink(a,t){
  const opts=nbrs(t.c,t.r).filter(p=>!occ.has(K(p.c,p.r)));if(!opts.length)return;
  opts.sort((p,q)=>dist(q,a)-dist(p,a));const b=opts[0];occ.delete(K(a.c,a.r));a.c=b.c;a.r=b.r;occ.set(K(b.c,b.r),a);const [x,z]=cellW(b.c,b.r);a.x=a.fx=x;a.z=a.fz=z;a.prog=1;puff(a,'#a6cc5c');
}
function cast(a,t){
  a.mana=0;const ab=a.cls,p=a.ap;ring(a,CLASSES[ab]||C.sigil,1.3);
  if(ab==='Warrior'){[t,...S.actors.filter(o=>o.team===t.team&&live(o)&&o!==t&&dist(o,t)<=1)].forEach(o=>deal(a,o,a.atk*1.8*p,'phys',{canCrit:true}));ring(t,'#e0704f',1.8);}
  else if(ab==='Healer'){const al=S.actors.filter(o=>o.team===a.team&&live(o)).sort((x,y)=>x.hp/x.max-y.hp/y.max)[0];if(al){heal(al,(a.atk*2.5+80)*p);ring(al,'#5fcf8e',1.4);}}
  else if(ab==='Mage'){shoot(a,t,'#b39bff',true,()=>{deal(a,t,a.atk*3.2*p,'magic');ring(t,'#9d7ff2',1.4);});}
  else if(ab==='Judge Mark'){a.shield=a.max*.3*p;a.shieldT=4;}
  else if(ab==='Ember Keeper'){shoot(a,t,'#ff9a4a',true,()=>{deal(a,t,a.atk*1.5*p,'magic');t.burn=3;t.burnDps=Math.max(t.burnDps,t.max*.03);ring(t,'#ff8a3d',1.2);});}
  else if(ab==='Gusting Shallow'){t.stun=Math.max(t.stun,1.5);t.knock=.6;deal(a,t,a.atk*1.2*p,'phys');ring(t,'#79cfe6',1.3);}
  else if(ab==='Quiet Concern'){deal(a,t,a.atk*2*p,'phys',{canCrit:true,forceCrit:true});}
  else if(ab==='Leaf in the Wind'){blink(a,t);t.root=1.5;deal(a,t,a.atk*1.5*p,'phys',{canCrit:true});}
}
let reviveUsed=false;
function sim(dt){
  if(!reviveUsed&&TR.Healer>=0){
    const kos=S.actors.filter(a=>a.team==='you'&&a.ko&&S.t-a.koAt>.8);
    if(kos.length){
      const k=TR.Healer;let pickU=null,pct=.5;
      const cmd=kos.find(a=>a.key==='cmd');
      if(cmd&&k>=2){pickU=cmd;pct=k>=3?1:.5;}
      else{const units=kos.filter(a=>a.key!=='cmd').sort((x,y)=>y.dmgDone-x.dmgDone);if(units.length){pickU=units[0];pct=k>=1?1:.5;}}
      if(pickU){
        let cell={c:pickU.c,r:pickU.r};if(occ.has(K(cell.c,cell.r))){const f=nbrs(cell.c,cell.r).find(p=>!occ.has(K(p.c,p.r)));if(f)cell=f;else cell=null;}
        if(cell){reviveUsed=true;pickU.ko=false;pickU.hp=pickU.max*pct;pickU.c=cell.c;pickU.r=cell.r;const [x,z]=cellW(cell.c,cell.r);pickU.x=pickU.fx=x;pickU.z=pickU.fz=z;pickU.prog=1;occ.set(K(cell.c,cell.r),pickU);ring(pickU,'#5fcf8e',1.8);floatAt(pickU,'Revived',DMGC.heal,1.15,2.4);}
      }
    }
  }
  for(const a of S.actors){
    a.lunge=Math.max(0,a.lunge-dt*5);a.flash=Math.max(0,a.flash-dt*6);if(a.knock)a.knock=Math.max(0,a.knock-dt);
    if(!live(a))continue;
    if(a.burn>0){a.burn-=dt;a._bt=(a._bt||0)+dt;if(a._bt>=1){a._bt=0;deal(null,a,a.burnDps,'magic');}if(!reduced&&Math.random()<dt*8){const p=P(a.x,a.z);parts.push({x:p.x+rnd(-6,6),y:p.y-p.s*rnd(.4,1.3),vx:rnd(-8,8),vy:-30,life:.7,col:'#ff8a3d',r:2});}}
    if(!live(a))continue;
    if(a.shieldT>0){a.shieldT-=dt;if(a.shieldT<=0)a.shield=0;}
    a.slow=Math.max(0,a.slow-dt);a.root=Math.max(0,a.root-dt);
    if(a.stun>0){a.stun-=dt;continue;}
    if(a.prog<1){a.prog=Math.min(1,a.prog+dt*a.spd);const [tx,tz]=cellW(a.c,a.r);a.x=a.fx+(tx-a.fx)*a.prog;a.z=a.fz+(tz-a.fz)*a.prog;if(a.prog<1)continue;}
    a.cd-=dt;a.rt-=dt;
    if(a.runner&&!a.fleeing&&S.t>=a.fleeAt){a.fleeing=true;floatAt(a,'Running!',C.sigil,1.15,2.5);}
    if(a.fleeing){
      if(a.root>0)continue;
      if(a.r===0){a.gone=true;occ.delete(K(a.c,a.r));S.log.fled.push(a.key);puff(a,C.muted);floatAt(a,'Escaped',C.muted,1.1,2.4);}
      else stepToward(a,null,1.45,true);
      continue;
    }
    const brandedAlive=a.team==='you'&&S.actors.some(o=>o.branded&&live(o));
    if(!a.target||!live(a.target)||a.rt<=0||(brandedAlive&&!a.target.branded)){a.target=chooseTarget(a);a.rt=.6;}
    const t=a.target;if(!t)continue;
    const d=dist(a,t);
    if(a.maxMana&&a.mana>=a.maxMana&&(d<=a.range+1||a.cls==='Leaf in the Wind'||a.cls==='Healer')){cast(a,t);continue;}
    if(d<=a.range){
      if(a.cd<=0){
        a.cd=1/(a.as*(a.slow>0?.7:1));a.hits++;
        if(a.maxMana)a.mana=Math.min(a.maxMana,a.mana+10);
        if(a.range>1)shoot(a,t,a.team==='you'?'#cfe8ff':'#ffd0b0',false,()=>onAttackHit(a,t));
        else{a.lunge=1;onAttackHit(a,t);}
      }
    } else if(a.root<=0) stepToward(a,t,a.team==='you'?2.8:2.4,false);
  }
  for(let i=shots.length-1;i>=0;i--){
    const s=shots[i],t=s.tgt;const dx=t.x-s.x,dz=t.z-s.z,l=Math.hypot(dx,dz);
    s.trail.push([s.x,s.z]);if(s.trail.length>6)s.trail.shift();
    if(l<.35||!live(t)){shots.splice(i,1);if(live(t))s.onHit();continue;}
    const m=Math.min(l,s.spd*dt);s.x+=dx/l*m;s.z+=dz/l*m;
  }
}
