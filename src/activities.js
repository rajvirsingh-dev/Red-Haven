import {pipeStart,rotatePipe,pipesConnected,drillTargets,drillAligned,harvestPlants} from './puzzles.js';
import {playSound} from './audio.js';

export function playActivity(task) {
  const kinds={mine:'drill',ice:'pipes',air:'manifest',parts:'manifest',harvest:'harvest'};
  const kind=kinds[task];
  if(!kind)return Promise.resolve(true);
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');
    dialog.className='activity-dialog';
    const labels={drill:['Drill the ore seam','Align the drill with each stable fracture. Three clean hits free the ore.'],
      pipes:['Recover the ice','Rotate the pipe sections to connect the intake on the left to the processor on the right.'],
      manifest:['Decode the cargo manifest','Remember the order of three supply seals, then enter them to open the correct crate.'],
      harvest:['Select a healthy harvest','Pick the three plants with maturity at least 80% and moisture at least 60%.']};
    let hit=0,aim=50,tiles=[...pipeStart],revealed=true,answer=[],message='';
    const picked=new Set();
    const names=['Air','Tools','Seeds','Water'];
    const manifest=task==='air'?[0,3,1]:[1,2,3];
    function render(){
      const [title,intro]=labels[kind];
      let body='';
      if(kind==='drill') {
        body='<div class="drill-rock"><span class="drill-band" style="left:'+drillTargets[hit]+'%"></span><span class="drill-aim" style="left:'+aim+'%"></span></div>'+
          '<label class="mixer">Drill position · target '+(drillTargets[hit]-5)+'–'+(drillTargets[hit]+5)+'<input data-aim type="range" min="0" max="100" value="'+aim+'" aria-label="Drill alignment"></label>'+
          '<p>Stable fractures extracted · '+hit+' / 3. Arrow keys adjust the drill when the slider is focused.</p><button class="primary" data-game="drill">Drill this fracture</button>';
      } else if(kind==='pipes') {
        const directions=['up','right','down','left'];
        body='<div class="pipe-labels"><span>Ice intake →</span><span>→ Processor</span></div><div class="pipe-grid">'+tiles.map((mask,index)=>mask?
          '<button class="pipe-tile" data-pipe="'+index+'" aria-label="Rotate pipe '+(index+1)+', openings '+directions.filter((_,i)=>mask&(1<<i)).join(' and ')+'">'+directions.map((direction,i)=>'<i class="'+direction+' '+(mask&(1<<i)?'open':'')+'"></i>').join('')+'</button>':'<div class="pipe-rock" aria-hidden="true"></div>').join('')+'</div><button class="primary" data-game="flow">Run the processor</button>';
      } else if(kind==='manifest') {
        body=revealed?'<div class="manifest-sequence">'+manifest.map((n,i)=>'<div><span>Seal '+(i+1)+'</span><strong>'+names[n]+'</strong></div>').join('')+'</div><button class="primary" data-game="remember">I remember the sequence</button>':
          '<p>Enter the seals in their original order · '+answer.length+' / 3</p><div class="manifest-options">'+names.map((n,i)=>'<button data-seal="'+i+'">'+n+'</button>').join('')+'</div><button class="secondary" data-game="reveal">Study manifest again</button>';
      } else {
        body='<div class="plant-options">'+harvestPlants.map((plant,i)=>'<button class="'+(picked.has(i)?'picked':'')+'" data-plant="'+i+'" aria-pressed="'+picked.has(i)+'"><span class="plant-shape" aria-hidden="true"></span><strong>'+plant.label+'</strong><span>Maturity '+plant.maturity+'%</span><span>Moisture '+plant.moisture+'%</span></button>').join('')+'</div><button class="primary" data-game="harvest">Confirm the harvest</button>';
      }
      dialog.innerHTML='<div class="dialog-top"><h2>'+title+'</h2><button data-game="cancel">Cancel</button></div><p>'+intro+'</p>'+body+'<p class="puzzle-feedback" role="status">'+message+'</p>';
    }
    function finish(success){
      dialog.close();dialog.remove();resolve(success);
    }
    dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});
    dialog.addEventListener('input',e=>{
      if(e.target.matches('[data-aim]')){
        aim=Number(e.target.value);
        dialog.querySelector('.drill-aim').style.left=aim+'%';
      }
    });
    dialog.addEventListener('click',e=>{
      const button=e.target.closest('button');
      if(!button)return;
      playSound('select');
      const action=button.dataset.game;
      if(action==='cancel'){finish(false);return;}
      if(action==='drill'){
        if(drillAligned(aim,hit)){
          playSound('mine');hit++;
          if(hit===3){finish(true);return;}
          message='Clean hit. Align with the next fracture.';
        } else {playSound('warning');message='That rock is unstable. Move the drill into the highlighted fracture band.';}
      }
      if(button.dataset.pipe!==undefined){
        const i=Number(button.dataset.pipe);tiles[i]=rotatePipe(tiles[i]);message='';
      }
      if(action==='flow'){
        if(pipesConnected(tiles)){playSound('ice');finish(true);return;}
        message='The flow cannot reach the processor. Each pipe opening must meet its neighbor.';
      }
      if(action==='remember'){revealed=false;answer=[];message='';}
      if(action==='reveal'){revealed=true;answer=[];message='';}
      if(button.dataset.seal!==undefined){
        answer.push(Number(button.dataset.seal));
        if(answer.at(-1)!==manifest[answer.length-1]){
          playSound('warning');answer=[];message='The seal order was different. Study the manifest and try again.';
        }else if(answer.length===3){playSound('delivery');finish(true);return;}
        else message='Seal accepted.';
      }
      if(button.dataset.plant!==undefined){
        const index=Number(button.dataset.plant);
        if(picked.has(index))picked.delete(index);else picked.add(index);
      }
      if(action==='harvest'){
        const correct=harvestPlants.every((plant,i)=>picked.has(i)===plant.ready);
        if(correct){playSound('grow');finish(true);return;}
        message='Check both conditions. Choose only the three mature plants with enough moisture.';
      }
      render();
      if(action==='drill')dialog.querySelector('[data-aim]')?.focus();
      if(button.dataset.pipe!==undefined)dialog.querySelector('[data-pipe="'+button.dataset.pipe+'"]')?.focus();
    });
    document.body.append(dialog);render();dialog.showModal();
  });
}
