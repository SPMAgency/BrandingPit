/* src/core/util.js — owner: Engineering. Small shared helpers. */
/* ---------- misc ---------- */
const defOf=k=>k==='cmd'?CMD:ROSTER[k];
const colOf=k=>k==='cmd'?C.sigil:CLASSES[ROSTER[k].cls];
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function rgba(hex,a){const n=parseInt(hex.slice(1),16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')';}
function rollLures(){S.lures=shuffle(Object.keys(CLASSES)).slice(0,3);S.lure=S.lures[0];}
function traitCounts(list){const n={};for(const u of list){if(u.key==='cmd')continue;const c=ROSTER[u.key].cls;n[c]=(n[c]||0)+1;}return n;}
function rankOf(cls,n){const r=TRAITS[cls].r;let k=-1;r.forEach((t,i)=>{if(n>=t)k=i;});return k;}
function fillBench(){while(S.wait.length&&S.bench.length<BENCH)S.bench.push(S.wait.shift());}
