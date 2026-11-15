export const pipeStart = [0,12,6,0,5,3,9,5];
export const pipeSolution = [0,6,12,0,10,9,3,10];
export const rotatePipe = mask => ((mask << 1) & 15) | ((mask >> 3) & 1);
export function pipesConnected(tiles) {
  if(!(tiles[4]&8))return false;
  const queue=[4],seen=new Set();
  const links=[[-4,1,4],[1,2,8],[4,4,1],[-1,8,2]];
  while(queue.length){
    const index=queue.shift();
    if(seen.has(index))continue;
    seen.add(index);
    if(index===7&&(tiles[index]&2))return true;
    for(const [offset,exit,entry] of links){
      const next=index+offset;
      if(next<0||next>=8||offset===1&&index%4===3||offset===-1&&index%4===0)continue;
      if((tiles[index]&exit)&&(tiles[next]&entry))queue.push(next);
    }
  }
  return false;
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
