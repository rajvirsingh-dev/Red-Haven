export const pipeStart = [0,12,6,0,5,3,9,5];
export const pipeSolution = [0,6,12,0,10,9,3,10];
export const rotatePipe = mask => ((mask << 1) & 15) | ((mask >> 3) & 1);
// Indices that water from the intake (left of tile 4) can reach through matching openings.
export function flowReach(tiles) {
  const seen=new Set();
  if(!(tiles[4]&8))return seen;
  const queue=[4];
  const links=[[-4,1,4],[1,2,8],[4,4,1],[-1,8,2]];
  while(queue.length){
    const index=queue.shift();
    if(seen.has(index))continue;
    seen.add(index);
    for(const [offset,exit,entry] of links){
      const next=index+offset;
      if(next<0||next>=8||offset===1&&index%4===3||offset===-1&&index%4===0)continue;
      if((tiles[index]&exit)&&(tiles[next]&entry))queue.push(next);
    }
  }
  return seen;
}
export function pipesConnected(tiles) {return flowReach(tiles).has(7)&&!!(tiles[7]&2);}
// Moves a piece into slot `to` (or back to the tray when `to` is negative), swapping with any occupant.
export function movePiece(slots,piece,to) {
  const next=[...slots],from=next.indexOf(piece);
  if(to<0){if(from>=0)next[from]=null;return next;}
  const occupant=next[to]??null;
  next[to]=piece;
  if(from>=0&&from!==to)next[from]=occupant;
  return next;
}
export const drillTargets=[28,72,46];
export function drillAligned(aim,index){return Math.abs(aim-drillTargets[index])<=5;}
export const harvestPlants=[
  {label:'Aster',maturity:92,moisture:72,ready:true},
  {label:'Nova',maturity:49,moisture:68,ready:false},
  {label:'Ember',maturity:89,moisture:35,ready:false},
  {label:'Terra',maturity:85,moisture:63,ready:true},
  {label:'Luna',maturity:76,moisture:80,ready:false},
  {label:'Vega',maturity:97,moisture:84,ready:true},
];
