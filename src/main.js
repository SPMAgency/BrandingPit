/* src/main.js — owner: Engineering. Game loop and start-up. */
/* ---------- loop ---------- */
let last=performance.now(),lastTimer='',bannerT=0,lastMeter='';
function showBanner(t,d){$('banner').textContent=t;$('banner').hidden=false;bannerT=d;}
function frame(ts){
  const dt=Math.min(.05,(ts-last)/1000);last=ts;const now=ts/1000;
  if(flashT>0){flashT-=dt;if(flashT<=0&&S.phase==='prep')$('info').innerHTML=infoText();}
  if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('banner').hidden=true;}
  if(detailSrc&&detailSrc.actor){detailT+=dt;if(!live(detailSrc.actor))hideDetail();else if(detailT>.25){detailT=0;$('detail').innerHTML=detailFor(detailSrc);}}
  if(detailSrc&&!detailSrc.actor&&raidPhase()&&!S.bench.includes(detailSrc.u))hideDetail();
  if(S.phase==='scout'){S.st-=dt;$('pill').innerHTML='Scout · <b>'+Math.max(0,S.st).toFixed(1)+'s</b> · tap to brand';if(S.st<=0){S.phase='raid';S.t=0;render();showBanner('Raid!',.9);}}
  else if(S.phase==='raid'){
    S.t+=dt;sim(dt);
    const penLeft=S.actors.some(a=>a.team==='pen'&&live(a));
    if(!penLeft){S.phase='flee';S.st=1;showBanner('Pen cleared',1);}
    else if(S.t>=RAID){endRaid();showBanner('Time',.8);}
  } else if(S.phase==='flee'){S.t+=dt;sim(dt);S.st-=dt;if(S.st<=0)settle();}
  const left=S.phase==='raid'?Math.max(0,RAID-S.t):S.phase==='flee'?0:RAID;
  const tt=left.toFixed(1);if(tt!==lastTimer){$('timer').textContent=tt;$('timer').classList.toggle('hot',S.phase==='raid'&&left<5);$('timefill').style.transform='scaleX('+(left/RAID)+')';lastTimer=tt;}
  const fills=[0,1,2].map(i=>Math.max(0,Math.min(1,(S.dmg/(S.pool/4))-i)));const mk=fills.map(f=>f.toFixed(2)).join();
  if(mk!==lastMeter){[...$('meter').querySelectorAll('b')].forEach((b,i)=>b.style.width=(fills[i]*100)+'%');lastMeter=mk;}
  if(W>0&&CELLS.length)draw(now,dt);
  requestAnimationFrame(frame);
}
function start(data){
  S=fresh();
  if(data&&data.board&&data.bench){S.round=data.round||1;S.board=data.board;S.bench=data.bench;S.wait=data.wait||[];S.comps=data.comps||[];S.items=data.items||[];}
  rollLures();resize();render();requestAnimationFrame(frame);
  try{window.claude&&window.claude.hot&&window.claude.hot.snapshot&&window.claude.hot.snapshot(()=>({round:S.round,board:S.board,bench:S.bench,wait:S.wait,comps:S.comps,items:S.items}));}catch(e){}
}
const hot=window.claude&&window.claude.hot;
if(hot&&hot.ready)hot.ready(start);else start((hot&&hot.data)||{});
