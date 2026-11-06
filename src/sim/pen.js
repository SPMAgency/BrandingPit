/* src/sim/pen.js — owner: Actions/Functions. Builds the Raid pen for a round. */
/* ---------- pen ---------- */
function genPen(){
  const n=Math.min(8,6+(S.round>2)+(S.round>4));
  const p3=Math.min(.06+.04*S.round,.3),p2=Math.min(.25+.05*S.round,.45);
  const keys=Object.keys(ROSTER),pen=[];
  const cells=[];for(let r=1;r<=4;r++)for(let c=0;c<COLS;c++)cells.push({c,r});shuffle(cells);
  const near=[];for(let c=0;c<COLS;c++)near.push({c,r:5});shuffle(near);
  const tierPick=t=>{let pool=keys.filter(k=>ROSTER[k].tier===t);const l=pool.filter(k=>ROSTER[k].cls===S.lure);if(l.length&&Math.random()<.5)pool=l;return pick(pool);};
  let rare=0;
  for(let i=0;i<n;i++){const x=Math.random();let t=x<p3?3:x<p3+p2?2:1;if(i===n-1&&!rare)t=3;if(t===3)rare++;const cell=t===3?near.pop():cells.pop();pen.push({key:tierPick(t),c:cell.c,r:cell.r});}
  return pen;
}
