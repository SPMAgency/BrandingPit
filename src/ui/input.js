/* src/ui/input.js — owner: Engineering. Taps, drag and drop, branding taps, the unit card. */
/* ---------- input: drag and drop in camp, tap to brand in the Raid ---------- */
let drag=null;
function unitAtPoint(x,y){
  const s=slotAt(x,y);if(s&&S.bench[s.i])return {u:S.bench[s.i],from:'bench'};
  let best=null,bd=1e9;
  for(const u of S.board){const [wx,wz]=cellW(u.c,u.r),p=P(wx,wz);const cy=p.y-p.s*.7,d=(x-p.x)**2+(y-cy)**2;if(d<(p.s*.95)**2&&d<bd){bd=d;best=u;}}
  if(best)return {u:best,from:'board'};
  const c=cellAt(x,y);if(c){const u=S.board.find(b=>b.c===c.c&&b.r===c.r);if(u)return {u,from:'board'};}
  return null;
}
function pt(e){const b=cv.getBoundingClientRect();return [e.clientX-b.left,e.clientY-b.top];}
/* Unit card: long-press on touch, hover with a mouse. Tap in the Raid still brands. */
let press=null,detailSrc=null,detailT=0;
const raidPhase=()=>S.phase==='scout'||S.phase==='raid'||S.phase==='flee';
function actorAt(x,y,team){let best=null,bd=1e9;for(const a of S.actors){if(!live(a)||(team&&a.team!==team))continue;const p=P(a.x,a.z);const d=(p.x-x)**2+(p.y-p.s*.7-y)**2;if(d<(p.s*1.2)**2&&d<bd){bd=d;best=a;}}return best;}
function srcAt(x,y){
  if(raidPhase()){const a=actorAt(x,y);if(a)return {u:a,actor:a,team:a.team};const s=slotAt(x,y);if(s&&S.bench[s.i])return {u:S.bench[s.i],team:'you'};return null;}
  const h=unitAtPoint(x,y);return h?{u:h.u,team:'you'}:null;
}
function showDetail(src){detailSrc=src;$('detail').innerHTML=detailFor(src);$('detail').hidden=false;detailT=0;}
function hideDetail(){detailSrc=null;$('detail').hidden=true;}
function clearPress(){if(press&&press.timer)clearTimeout(press.timer);press=null;}
function brandAt(x,y){
  const best=actorAt(x,y,'pen');if(!best)return;
  if(best.branded){floatAt(best,'Already branded',C.muted,.9,2.6);return;}
  if(S.brands<=0){floatAt(best,'No brands left',C.ember,.9,2.6);return;}
  best.branded=true;S.brands--;S.actors.forEach(a=>{if(a.team==='you')a.rt=0;});
  floatAt(best,'Branded',C.sigil,1.2,2.6);renderHud();
}
cv.addEventListener('pointerdown',e=>{
  const [x,y]=pt(e);
  if(detailSrc&&e.pointerType!=='mouse')hideDetail();
  const src=srcAt(x,y);clearPress();
  press={x0:x,y0:y,id:e.pointerId,src,long:false,moved:false,timer:null};
  if(src)press.timer=setTimeout(()=>{if(press&&!press.moved){press.long=true;showDetail(src);drag=null;}},380);
  if(raidPhase()||S.phase!=='prep')return;
  const hit=unitAtPoint(x,y);
  if(S.itemSel!=null&&hit){clearPress();equip(hit.u);return;}
  if(!hit){S.sel=null;render();return;}
  drag={u:hit.u,from:hit.from,x0:x,y0:y,x,y,moved:false,id:e.pointerId};
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove',e=>{
  const [x,y]=pt(e);
  if(press&&e.pointerId===press.id&&Math.hypot(x-press.x0,y-press.y0)>8){press.moved=true;if(press.timer){clearTimeout(press.timer);press.timer=null;}}
  if(e.pointerType==='mouse'&&!e.buttons&&!drag){const s=srcAt(x,y);if(s){if(!detailSrc||detailSrc.u!==s.u)showDetail(s);}else if(detailSrc)hideDetail();}
  if(!drag||e.pointerId!==drag.id)return;drag.x=x;drag.y=y;if(Math.hypot(x-drag.x0,y-drag.y0)>8)drag.moved=true;
});
cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')hideDetail();});
cv.addEventListener('pointerup',e=>{
  const pr=press&&press.id===e.pointerId?press:null;clearPress();
  if(pr&&pr.long){drag=null;return;}
  if(raidPhase()){if(pr&&!pr.moved&&S.phase!=='flee'){const [x,y]=pt(e);brandAt(x,y);}return;}
  if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;
  if(!d.moved){S.sel={uid:d.u.uid};render();return;}
  const [x,y]=pt(e);
  if(y>H-46&&d.u.key!=='cmd'){release(d.u);return;}
  const s=slotAt(x,y),c=cellAt(x,y);
  if(s){
    if(d.u.key==='cmd'){flash('The commander stays on the board.');return;}
    const other=S.bench[s.i];
    if(d.from==='bench'){const i=S.bench.indexOf(d.u);if(other){S.bench[s.i]=d.u;S.bench[i]=other;}else{S.bench.splice(i,1);S.bench.splice(Math.min(s.i,S.bench.length),0,d.u);}}
    else{
      S.board=S.board.filter(u=>u!==d.u);
      if(other){S.bench[s.i]={uid:d.u.uid,key:d.u.key,star:d.u.star,items:d.u.items};S.board.push({uid:other.uid,key:other.key,star:other.star,items:other.items,c:d.u.c,r:d.u.r});}
      else S.bench.push({uid:d.u.uid,key:d.u.key,star:d.u.star,items:d.u.items});
    }
    fillBench();S.sel=null;render();return;
  }
  if(c&&c.r>=GATE){
    const there=S.board.find(u=>u.c===c.c&&u.r===c.r);
    if(d.from==='board'){if(there&&there!==d.u){there.c=d.u.c;there.r=d.u.r;}d.u.c=c.c;d.u.r=c.r;}
    else{
      if(there){
        if(there.key==='cmd'){flash('The commander stays on the board.');return;}
        const i=S.bench.indexOf(d.u);S.bench[i]={uid:there.uid,key:there.key,star:there.star,items:there.items};
        S.board=S.board.map(u=>u===there?{uid:d.u.uid,key:d.u.key,star:d.u.star,items:d.u.items,c:c.c,r:c.r}:u);
      } else {
        if(S.board.length>=BOARD){flash('The board holds 8, commander included.');return;}
        S.bench=S.bench.filter(u=>u!==d.u);S.board.push({uid:d.u.uid,key:d.u.key,star:d.u.star,items:d.u.items,c:c.c,r:c.r});fillBench();
      }
    }
    S.sel={uid:d.u.uid};render();return;
  }
  if(c&&c.r<GATE)flash('Place fighters on your side of the gate.');
});
cv.addEventListener('pointercancel',()=>{drag=null;clearPress();});
function detailFor(src){
  const u=src.u,team=src.team,a=src.actor,d=defOf(u.key),camp=!raidPhase();
  const tr=team==='you'?(camp?boardTR():TR):null;
  const st=a||computeStats(u,team,tr);
  const star=team==='you'?(u.star||0):1,col=colOf(u.key);
  let h='<div class="hd"><div class="pt" style="background:'+col+'">'+(u.key==='cmd'?'C':d.name[0])+'</div><div><div class="nm">'+d.name+(star?' <span style="color:'+STARC[star-1]+'">'+'★'.repeat(star)+'</span>':'')+'</div><div class="sub">'+(team==='you'?'Your fighter':'Wild · in the pen')+' · '+(d.cls||'No attribute yet')+(d.tier?' · tier '+d.tier:'')+'</div></div></div>';
  const hp=a?Math.max(0,Math.round(a.hp))+' / '+Math.round(a.max):Math.round(st.max);
  const mana=st.maxMana?(a?Math.round(a.mana):st.mana)+' / '+st.maxMana:'—';
  h+='<div class="stats"><div><span>HP</span>'+hp+'</div><div><span>Mana</span>'+mana+'</div><div><span>Attack</span>'+Math.round(st.atk)+'</div><div><span>Atk speed</span>'+st.as.toFixed(2)+'</div><div><span>Armor</span>'+Math.round(st.armor)+'</div><div><span>Magic res</span>'+Math.round(st.mr)+'</div><div><span>Range</span>'+st.range+'</div><div><span>Crit</span>'+Math.round(st.crit*100)+'% · '+Math.round(st.critD*100)+'%</div></div>';
  if(u.key==='cmd')h+='<div class="ab"><b>Magic attack</b> · none learned yet. Win a ghost fight to learn one.</div>';
  else{const ab=ABIL[d.cls];h+='<div class="ab"><b>'+ab.n+'</b> · '+ab.mana+' mana. '+ab.d+'</div>';}
  if(d.cls){
    if(team==='you'){const cnt=traitCounts(camp?S.board:S.actors.filter(x=>x.team==='you'))[d.cls]||0,r=TRAITS[d.cls].r,k=rankOf(d.cls,cnt);h+='<div><b>'+d.cls+' '+cnt+' / '+(r.find(t=>t>cnt)||r[r.length-1])+'</b> <span class="muted">'+(k>=0?'active':'inactive')+' · '+TRAITS[d.cls].d+'</span></div>';}
    else h+='<div class="muted">Wild fighters have no trait bonuses.</div>';
    h+='<div><span class="up">Strong vs '+BEATS[d.cls]+'</span> <span class="muted">(+15% damage)</span> · <span class="dn">Weak vs '+BEATEN[d.cls]+'</span></div>';
  }
  if((u.items||[]).length)h+='<div>'+u.items.map(n=>'<b>'+n+'</b> <span class="muted">'+ISTAT[n].d+'</span>').join('<br>')+'</div>';
  if(a&&a.runner)h+='<div style="color:var(--sigil)">Runner: heads for the exit about 5 seconds in.</div>';
  if(a&&a.loot)h+='<div class="muted">Carries an item part: '+a.loot+'</div>';
  if(a&&a.branded)h+='<div style="color:var(--sigil)">Branded: your board is focusing it.</div>';
  return h;
}
function release(u){S.board=S.board.filter(x=>x!==u);S.bench=S.bench.filter(x=>x!==u);S.items.push(...(u.items||[]));fillBench();S.sel=null;flash('Released '+defOf(u.key).name+'. Its items went back to your tray.');render();}
function equip(u){
  const name=S.items[S.itemSel];if(!name)return;
  if(u.key==='cmd'){flash('The commander uses magic attacks, not items.');return;}
  u.items=u.items||[];if(u.items.length>=3){flash(defOf(u.key).name+' already holds 3 items.');return;}
  u.items.push(name);S.items.splice(S.itemSel,1);S.itemSel=null;S.sel={uid:u.uid};render();
}
let flashT=0;function flash(m){$('info').innerHTML='<b>'+m+'</b>';flashT=2;}
