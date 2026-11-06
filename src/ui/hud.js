/* src/ui/hud.js — owner: Engineering. HUD, trait panel, item tray, results and help overlays. */
/* ---------- DOM ---------- */
function renderHud(){
  [...$('brands').children].forEach((i,n)=>i.classList.toggle('used',n>=S.brands));
  const lbl={prep:'Camp',scout:'Scout',raid:'Raid',flee:'Raid',results:'Spoils'}[S.phase];
  $('phaseLbl').textContent='Round '+S.round+' · '+lbl;
  let p='';for(let i=0;i<6;i++){const r=S.round+i;p+='<i class="'+(r%3===0?'boss':'')+(i===0?' now':'')+'" title="Round '+r+(r%3===0?' boss':'')+'"></i>';}
  $('pips').innerHTML=p;
}
function renderTraits(){
  const list=S.phase==='prep'||S.phase==='results'?S.board:S.actors.filter(a=>a.team==='you');
  const cnt=traitCounts(list);
  const rows=Object.keys(cnt).map(c=>{const k=rankOf(c,cnt[c]),r=TRAITS[c].r,next=r.find(t=>t>cnt[c]);return {c,n:cnt[c],k,txt:cnt[c]+' / '+(next||r[r.length-1])};}).sort((a,b)=>(b.k-a.k)||(b.n-a.n));
  $('traits').innerHTML=rows.map(t=>'<button class="trait '+(t.k>=0?'t'+(t.k+1):'off')+'" data-trait="'+t.c+'"><span class="hx">'+t.n+'</span><span>'+t.c+'<br><span class="n">'+t.txt+'</span></span></button>').join('');
}
function infoUnit(u){
  const d=defOf(u.key),it=(u.items||[]);
  if(u.key==='cmd')return '<b>Commander</b> · no attribute yet · '+d.hp+' HP · '+d.atk+' attack<br>Casts a magic attack once one is learned from a ghost-fight win.';
  const m=STAR[u.star-1],ab=ABIL[d.cls];
  return '<b>'+d.name+'</b> · '+d.cls+' · '+'★'.repeat(u.star)+' · '+Math.round(d.hp*STARHP[u.star-1])+' HP · '+Math.round(d.atk*m)+' attack · range '+d.range+'<br><b>'+ab.n+'</b> ('+ab.mana+' mana): '+ab.d+(it.length?'<br>Items: '+it.join(', '):'');
}
function infoText(){
  if(S.phase==='scout'||S.phase==='raid'||S.phase==='flee')return 'Tap wild fighters to <b>brand</b> them; your board focuses branded targets. Gold-glowing <b>runners</b> flee through the exit row.';
  if(S.phase==='results')return '';
  if(S.wait.length)return '<b>Bench is full.</b> Drag a fighter onto the board or into the release strip, or tap a waiting recruit to let it go.';
  if(S.itemSel!=null){const n=S.items[S.itemSel];return '<b>'+n+'</b>: '+ISTAT[n].d+'. Tap a fighter to equip it (3 items max).';}
  if(S.sel){const u=[...S.board,...S.bench].find(x=>x.uid===S.sel.uid);if(u)return infoUnit(u);}
  return 'Drag fighters between the board and the bench. Board <b>'+S.board.length+'/8</b> · Bench <b>'+S.bench.length+'/8</b>. Three copies merge to a higher star.';
}
function render(){
  renderHud();renderTraits();
  const prep=S.phase==='prep';
  $('lureRow').hidden=!prep;
  if(prep)$('lureRow').innerHTML='<span class="lbl">Lure</span>'+S.lures.map(l=>'<button class="lure" aria-pressed="'+(l===S.lure)+'" data-lure="'+l+'"><span class="dot" style="background:'+CLASSES[l]+'"></span>'+l+'</button>').join('');
  let ir='';
  if(prep&&(S.items.length||S.comps.length||S.wait.length)){
    if(S.items.length)ir+='<span class="lbl">Items</span>'+S.items.map((n,i)=>'<button class="item" aria-pressed="'+(S.itemSel===i)+'" data-item="'+i+'"><i style="background:'+ISTAT[n].c+'"></i>'+n+'</button>').join('');
    if(S.comps.length)ir+='<span class="lbl">Parts</span><span class="tag">'+S.comps.join(', ')+'</span>';
    if(S.wait.length)ir+='<span class="lbl">Waiting</span>'+S.wait.map(u=>'<button class="tag wait" data-wait="'+u.uid+'" title="Release">'+defOf(u.key).name+' ✕</button>').join('');
  }
  $('itemRow').innerHTML=ir;$('itemRow').hidden=!ir;
  if(flashT<=0)$('info').innerHTML=infoText();
  const go=$('goBtn');go.hidden=!(prep||S.phase==='results');
  if(prep){go.textContent='Start Raid';go.disabled=S.wait.length>0;}
  if(S.phase==='results'){go.textContent='Back to camp';go.disabled=false;}
  $('timebar').hidden=!(S.phase==='raid'||S.phase==='flee');
  $('pill').hidden=!(S.phase==='scout'||prep);
  if(prep)$('pill').innerHTML='The pen opens when the Raid starts';
  renderResults();
}
function tagFor(k){return '<span class="tag"><span class="dot" style="background:'+colOf(k)+'"></span>'+defOf(k).name+'</span>';}
let helpOpen=false;
function renderResults(){
  const ov=$('overlay');
  if(helpOpen)return;
  if(S.phase!=='results'){ov.hidden=true;return;}
  const L=S.log;let h='<h2>Raid over</h2>';
  h+='<h3>Recruited '+L.recruits.length+'</h3>'+(L.recruits.length?'<div class="chips">'+L.recruits.map(tagFor).join('')+'</div>':'<p>No one this time. Brand early and push past the gate.</p>');
  if(L.merges.length)h+='<h3>Merged</h3><div class="chips">'+L.merges.map(m=>'<span class="tag merge">'+defOf(m.key).name+' '+'★'.repeat(m.star)+'</span>').join('')+'</div>';
  if(L.fled.length)h+='<h3>Got away '+L.fled.length+'</h3><div class="chips">'+L.fled.map(tagFor).join('')+'</div>';
  if(L.loot.length)h+='<h3>Loot</h3><p>'+L.loot.join(', ')+(L.items.length?'. Combined into <b style="color:var(--ink)">'+L.items.join(', ')+'</b>. Equip it in camp.':'. One more part makes a full item.')+'</p>';
  if(S.wait.length)h+='<p><b style="color:var(--ember)">Bench full:</b> '+S.wait.length+' recruit'+(S.wait.length>1?'s are':' is')+' waiting for a slot.</p>';
  h+='<p>Everyone is back to full health. In the full game, the ghost fight comes next.</p>';
  $('card').innerHTML=h;ov.hidden=false;
}
$('helpBtn').addEventListener('click',()=>{
  helpOpen=!helpOpen;
  if(helpOpen){$('card').innerHTML='<h2>The Raid</h2><ul><li><b>Camp:</b> drag fighters between the board and the bench. Drag one to the bottom strip to release it. Tap an item, then a fighter, to equip it.</li><li><b>Press and hold</b> any fighter (or hover with a mouse) for its full card: stats, ability, trait, items and counters.</li><li><b>Traits</b> (top left) light up bronze, silver and gold as you field more of a class.</li><li><b>Counter wheel:</b> every class deals +15% damage to one class and takes +15% from another, so no single team beats everything.</li><li>Pick a <b>lure</b> to tilt the pen toward a class, then 2 seconds to scout and 15 seconds to fight.</li><li>Tap up to <b>3</b> wild fighters to brand them. Your board focuses branded targets.</li><li>Fighters fill their <b>blue mana bar</b> by attacking and taking hits, then cast their ability.</li><li>Damage: orange physical, blue magic, white true, green heals. Big numbers with ! are crits.</li><li>Every fighter you defeat joins your bench. Gold-glowing <b>runners</b> flee through the exit row.</li></ul><p>Prototype with placeholder fighters. Relics, magic attacks and the ghost fight come next.</p><button class="go" id="closeHelp">Close</button>';$('overlay').hidden=false;}
  else{$('overlay').hidden=true;render();}
});
document.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.id==='closeHelp'){helpOpen=false;$('overlay').hidden=true;render();return;}
  if(t.dataset.lure){S.lure=t.dataset.lure;render();return;}
  if(t.dataset.item!=null){const i=+t.dataset.item;S.itemSel=S.itemSel===i?null:i;S.sel=null;render();return;}
  if(t.dataset.wait){S.wait=S.wait.filter(u=>u.uid!==t.dataset.wait);render();return;}
  if(t.dataset.trait){const c=t.dataset.trait;flash(c+' ('+TRAITS[c].r.join(' / ')+'): '+TRAITS[c].d);return;}
  if(t.id==='goBtn'){if(S.phase==='prep')startRaid();else if(S.phase==='results')toCamp();}
});
