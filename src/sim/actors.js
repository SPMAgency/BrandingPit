/* src/sim/actors.js — owner: Actions/Functions. Fighter stats, spawning, targeting, movement. */
/* ---------- actors ---------- */
let occ=new Map();const K=(c,r)=>c+','+r;
let TR={};
function boardTR(){const cnt=traitCounts(S.board),r={};for(const c in cnt)r[c]=rankOf(c,cnt[c]);return r;}
function computeStats(u,team,tr){
  const d=defOf(u.key),star=u.star||1;
  const mh=team==='you'?(u.key==='cmd'?1:STARHP[star-1]):1,ma=team==='you'?(u.key==='cmd'?1:STAR[star-1]):1;
  /* Wild fighters start weaker than yours and catch up each round. */
  const sh=team==='pen'?.55+.08*(S.round-1):1,sa=team==='pen'?.6+.06*(S.round-1):1;
  const runner=team==='pen'&&d.tier===3;
  const it={hp:0,atk:0,armor:0,mr:0,as:0,ap:0,mana:0};(u.items||[]).forEach(n=>{const s=ISTAT[n];for(const k in s)if(k in it)it[k]+=s[k];});
  const st={max:(d.hp*mh*sh+it.hp)*(runner?.9:1),atk:d.atk*ma*sa*(1+it.atk),as:d.as*(1+it.as),range:d.range,
    armor:(d.armor||25)+it.armor,mr:(d.mr||25)+it.mr,ap:1+it.ap,crit:.25,critD:1.4,mana:it.mana,maxMana:d.cls?ABIL[d.cls].mana:0,runner};
  if(team==='you'&&d.cls&&tr){
    const k=tr[d.cls];
    if(d.cls==='Judge Mark'&&k>=0)st.armor*=1+[.2,.25,.4][k];
    if(d.cls==='Quiet Concern'&&k>=0){st.crit+=[.05,.3][k];st.critD+=[.05,1][k];}
    if(d.cls==='Leaf in the Wind'&&k>=1)st.as*=1.3;
  }
  return st;
}
function mkActor(u,team){
  const d=defOf(u.key),st=computeStats(u,team,team==='you'?TR:null);
  const [x,z]=cellW(u.c,u.r);
  const a=Object.assign({id:uid(),ref:u.uid,key:u.key,team,star:team==='you'?u.star:1,def:d,cls:d.cls,items:u.items||[],
    c:u.c,r:u.r,lc:null,x,z,fx:x,fz:z,prog:1,spd:2.7,
    cd:rnd(.1,.5),rt:0,target:null,ko:false,gone:false,branded:false,fleeing:false,fleeAt:rnd(4.5,6.5),
    loot:team==='pen'&&Math.random()<.35?pick(COMPS):null,lunge:0,flash:0,fade:1,
    stun:0,root:0,slow:0,burn:0,burnDps:0,shield:0,shieldT:0,hits:0,wstack:0,dmgDone:0,koAt:0},st);
  a.hp=a.max;
  occ.set(K(a.c,a.r),a);return a;
}
const live=a=>!a.ko&&!a.gone;
function chooseTarget(a){
  const foes=S.actors.filter(o=>o.team!==a.team&&live(o)&&!(o.fleeing&&a.team==='pen'));
  if(!foes.length)return null;
  let pool=foes;if(a.team==='you'){const br=foes.filter(o=>o.branded);if(br.length)pool=br;}
  let best=null,bd=1e9;for(const o of pool){const d=dist(a,o);if(d<bd){bd=d;best=o;}}return best;
}
function moveTo(a,cell,spd){occ.delete(K(a.c,a.r));a.lc={c:a.c,r:a.r};a.fx=a.x;a.fz=a.z;a.c=cell.c;a.r=cell.r;occ.set(K(cell.c,cell.r),a);a.prog=0;a.spd=spd;}
function stepToward(a,goal,spd,flee){
  const here=flee?a.r:dist(a,goal);
  const opts=nbrs(a.c,a.r).filter(p=>!occ.has(K(p.c,p.r))&&!(a.lc&&p.c===a.lc.c&&p.r===a.lc.r));
  if(!opts.length)return false;
  const sc=p=>(flee?p.r:dist(p,goal))+Math.random()*.25;
  opts.sort((p,q)=>sc(p)-sc(q));const b=opts[0],bs=flee?b.r:dist(b,goal);
  if(bs>here)return false;
  moveTo(a,b,spd);return true;
}
