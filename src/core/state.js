/* src/core/state.js — owner: Engineering. The run state S and a fresh run. */
let uidN=1;const uid=()=>'u'+(uidN++);
let S;
function fresh(){
  return {round:1,phase:'prep',brands:3,
    board:[{uid:uid(),key:'cmd',star:0,c:3,r:10,items:[]},{uid:uid(),key:'brasshorn',star:1,c:2,r:7,items:[]},{uid:uid(),key:'pebblejaw',star:1,c:4,r:7,items:[]},{uid:uid(),key:'glintwick',star:1,c:5,r:9,items:[]}],
    bench:[{uid:uid(),key:'brasshorn',star:1,items:[]},{uid:uid(),key:'mossling',star:1,items:[]},{uid:uid(),key:'sparkfen',star:1,items:[]}],
    wait:[],comps:['Moon Bead'],items:['Forge Gauntlet'],lures:[],lure:null,sel:null,itemSel:null,t:0,st:0,actors:[],log:null,dmg:0,pool:1};
}
