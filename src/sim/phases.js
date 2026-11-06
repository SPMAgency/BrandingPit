/* src/sim/phases.js — owner: Actions/Functions. Raid start and end, spoils, merging, back to camp. */
/* ---------- phases ---------- */
function startRaid(){
  occ=new Map();TR={};const cnt=traitCounts(S.board);for(const c in cnt)TR[c]=rankOf(c,cnt[c]);reviveUsed=false;
  S.actors=S.board.map(u=>mkActor(u,'you'));
  genPen().forEach(p=>S.actors.push(mkActor({key:p.key,star:1,c:p.c,r:p.r,items:[]},'pen')));
  S.pool=S.actors.reduce((s,a)=>s+a.max,0);S.dmg=0;
  S.log={recruits:[],fled:[],loot:[],merges:[],items:[]};
  S.brands=3;S.sel=null;S.itemSel=null;S.phase='scout';S.st=SCOUT;S.t=0;render();
}
function endRaid(){S.phase='flee';S.st=.8;for(const a of S.actors)if(a.team==='pen'&&live(a)){a.gone=true;a.fleeingOut=true;occ.delete(K(a.c,a.r));S.log.fled.push(a.key);}}
function settle(){
  S.log.recruits.forEach(k=>S.wait.push({uid:uid(),key:k,star:1,items:[]}));
  fillBench();mergeAll();fillBench();
  S.comps.push(...S.log.loot);
  while(S.comps.length>=2){const a=S.comps.shift(),b=S.comps.shift();const it=ITEMS[[a,b].sort().join('+')];S.items.push(it);S.log.items.push(it);}
  S.phase='results';S.actors=[];shots.length=0;render();
}
function mergeAll(){
  let again=true;
  while(again){
    again=false;
    const all=[...S.board.filter(u=>u.key!=='cmd').map(u=>({u,w:'board'})),...S.bench.map(u=>({u,w:'bench'})),...S.wait.map(u=>({u,w:'wait'}))];
    const g={};for(const e of all){if(e.u.star>=3)continue;const k=e.u.key+'|'+e.u.star;(g[k]=g[k]||[]).push(e);}
    for(const k in g){
      const l=g[k];if(l.length<3)continue;
      const ord={board:0,bench:1,wait:2};l.sort((a,b)=>ord[a.w]-ord[b.w]);
      const keep=l[0],drop=l.slice(1,3);
      drop.forEach(e=>{keep.u.items=keep.u.items.concat(e.u.items).slice(0,3);if(e.w==='board')S.board=S.board.filter(u=>u!==e.u);else if(e.w==='bench')S.bench=S.bench.filter(u=>u!==e.u);else S.wait=S.wait.filter(u=>u!==e.u);});
      keep.u.star++;if(S.log)S.log.merges.push({key:keep.u.key,star:keep.u.star});
      again=true;break;
    }
  }
}
function toCamp(){S.round++;S.phase='prep';S.sel=null;rollLures();render();}
