import {pipeStart,rotatePipe,flowReach,pipesConnected,drillTargets,drillAligned,harvestPlants,movePiece} from './puzzles.js';
import {playSound} from './audio.js';
import {installPieceDrag} from './piece-drag.js';

const directions=['up','right','down','left'];
const openings=mask=>directions.filter((_,i)=>mask&(1<<i)).join(' and ');

export function playActivity(task) {
  const kinds={mine:'drill',ice:'pipes',air:'manifest',parts:'manifest',harvest:'harvest'};
  const kind=kinds[task];
  if(!kind)return Promise.resolve(true);
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');
    dialog.className='activity-dialog';
    const labels={drill:['Drill the ore seam','Grab the drill bit, drag it over the glowing fracture, and let go to drill. Three clean hits free the ore.'],
      pipes:['Recover the ice','Drag pipe sections into the empty slots to carry ice from the intake to the processor. Tap a placed section to rotate it.'],
      manifest:['Decode the cargo manifest','Remember the order of three supply seals, then drag each seal into its slot to open the correct crate.'],
      harvest:['Select a healthy harvest','Drag the three plants with maturity at least 80% and moisture at least 60% into the harvest crate.']};
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let hit=0,aim=12,revealed=true,message='',locked=false,done=false,selected=null;
    // Pipes: six loose sections, a board of 8 cells where pipeStart zeros are rock.
    const pipeMasks=pipeStart.filter(Boolean);
    let board=Array(8).fill(null);
    // Manifest: three seal slots holding seal ids.
    const names=['Air','Tools','Seeds','Water'];
    const manifest=task==='air'?[0,3,1]:[1,2,3];
    let slots=[null,null,null],wrong=false;
    const picked=new Set();

    const tiles=()=>board.map(piece=>piece===null?0:pipeMasks[piece]);
    const pipePiece=(piece,where,wet=false)=>'<button class="pipe-tile'+(wet?' flowing':'')+(selected===piece?' selected':'')+'" data-piece="'+piece+'" aria-pressed="'+(selected===piece)+'" aria-label="Pipe section, openings '+openings(pipeMasks[piece])+', '+where+'">'+
      directions.map((direction,i)=>'<i class="'+direction+(pipeMasks[piece]&(1<<i)?' open':'')+'"></i>').join('')+'</button>';
    const sealChip=seal=>'<button class="seal-chip" data-piece="'+seal+'">'+names[seal]+'</button>';
    const plantCard=i=>{const plant=harvestPlants[i];return '<button class="plant-card" data-piece="'+i+'" aria-pressed="'+picked.has(i)+'" aria-label="'+plant.label+', maturity '+plant.maturity+'%, moisture '+plant.moisture+'%'+(picked.has(i)?', in the crate':'')+'"><span class="plant-shape" aria-hidden="true"></span><strong>'+plant.label+'</strong><span>Maturity '+plant.maturity+'%</span><span>Moisture '+plant.moisture+'%</span></button>';};

    function render(){
      const [title,intro]=labels[kind];
      let body='';
      if(kind==='drill') {
        body='<div class="drill-rock" tabindex="0" role="slider" aria-label="Drill position. Arrow keys move the drill, Enter drills." aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(aim)+'">'+
          '<span class="drill-band" style="left:'+drillTargets[hit]+'%"></span><span class="drill-aim" style="left:'+aim+'%"><span class="drill-bit"></span></span></div>'+
          '<div class="drill-progress" aria-hidden="true">'+[0,1,2].map(i=>'<span class="'+(i<hit?'done':'')+'"></span>').join('')+'</div>'+
          '<p>Stable fractures extracted · '+hit+' / 3</p>';
      } else if(kind==='pipes') {
        const wet=flowReach(tiles());
        body='<div class="pipe-labels"><span>Ice intake →</span><span>→ Processor</span></div><div class="pipe-grid">'+pipeStart.map((start,index)=>{
          if(!start)return '<div class="pipe-rock" aria-hidden="true"></div>';
          const piece=board[index];
          return '<div class="pipe-slot'+(piece===null?' empty':'')+'" data-drop="'+index+'">'+(piece===null?'<button class="slot-place" data-place="'+index+'" aria-label="Empty pipe slot '+(index+1)+(selected!==null?', place the selected section here':'')+'"></button>':pipePiece(piece,'slot '+(index+1),wet.has(index)))+'</div>';
        }).join('')+'</div>'+
          '<div class="piece-tray pipe-tray" data-drop="tray"><span class="zone-label">Spare sections</span>'+(board.filter(piece=>piece!==null).length===pipeMasks.length?'<em>All sections placed · drag one here to take it out</em>':pipeMasks.map((_,piece)=>board.includes(piece)?'':pipePiece(piece,'in the tray')).join(''))+'</div>';
      } else if(kind==='manifest') {
        body=revealed?'<div class="manifest-sequence">'+manifest.map((n,i)=>'<div><span>Seal '+(i+1)+'</span><strong>'+names[n]+'</strong></div>').join('')+'</div><button class="primary" data-game="remember">I remember the sequence</button>':
          '<div class="manifest-sequence'+(wrong?' wrong':'')+'">'+slots.map((seal,i)=>'<div class="seal-slot" data-drop="'+i+'"><span>Seal '+(i+1)+'</span>'+(seal===null?'<em>Drop a seal</em>':sealChip(seal))+'</div>').join('')+'</div>'+
          '<div class="piece-tray seal-tray" data-drop="tray"><span class="zone-label">Supply seals</span>'+names.map((_,seal)=>slots.includes(seal)?'':sealChip(seal)).join('')+'</div>'+
          '<button class="secondary" data-game="reveal">Study manifest again</button>';
      } else {
        body='<div class="piece-tray plant-bed" data-drop="bed"><span class="zone-label">Grow beds</span>'+harvestPlants.map((_,i)=>picked.has(i)?'':plantCard(i)).join('')+'</div>'+
          '<div class="piece-tray harvest-crate" data-drop="crate"><span class="zone-label">Harvest crate · '+picked.size+' / 3</span>'+(picked.size?[...picked].sort().map(plantCard).join(''):'<em>Drag ripe plants here</em>')+'</div>'+
          '<button class="primary" data-game="harvest">Confirm the harvest</button>';
      }
      dialog.innerHTML='<div class="dialog-top"><h2>'+title+'</h2><button data-game="cancel">Cancel</button></div><p>'+intro+'</p>'+body+'<p class="puzzle-feedback" role="status">'+message+'</p>';
      dialog.classList.toggle('solved',done);
    }
    function finish(success){
      if(dialog.open)dialog.close();
      dialog.remove();resolve(success);
    }
    function succeed(sound,text){
      done=true;locked=true;message=text;playSound(sound);render();
      setTimeout(()=>finish(true),reducedMotion?150:750);
    }
    function refocus(selector){dialog.querySelector(selector)?.focus();}

    // Drill: drag the bit along the rock, release to drill.
    function setAim(value){
      aim=Math.max(0,Math.min(100,value));
      const bit=dialog.querySelector('.drill-aim'),rock=dialog.querySelector('.drill-rock');
      if(bit)bit.style.left=aim+'%';
      rock?.setAttribute('aria-valuenow',Math.round(aim));
      rock?.classList.toggle('on-target',drillAligned(aim,hit));
    }
    function drill(){
      if(locked)return;
      if(drillAligned(aim,hit)){
        playSound('mine');hit++;
        if(hit===3){succeed('mine','Ore seam freed.');return;}
        message='Clean hit. Drag the drill to the next fracture.';
      } else {playSound('warning');message='That rock is unstable. Drag the drill into the glowing fracture band before letting go.';}
      render();refocus('.drill-rock');setAim(aim);
    }
    let drillPointer=null;
    const aimFromPointer=e=>{const bounds=dialog.querySelector('.drill-rock').getBoundingClientRect();return (e.clientX-bounds.left)/bounds.width*100-drillPointer.offset;};
    dialog.addEventListener('pointerdown',e=>{
      if(kind!=='drill'||locked||e.button!==0||!e.target.closest('.drill-aim'))return;
      const bounds=dialog.querySelector('.drill-rock').getBoundingClientRect();
      drillPointer={id:e.pointerId,offset:0};
      drillPointer.offset=(e.clientX-bounds.left)/bounds.width*100-aim;
      e.target.closest('.drill-aim').setPointerCapture?.(e.pointerId);
      dialog.querySelector('.drill-rock').classList.add('grabbed');
      e.preventDefault();
    });
    dialog.addEventListener('pointermove',e=>{if(drillPointer?.id===e.pointerId)setAim(aimFromPointer(e));});
    dialog.addEventListener('pointerup',e=>{
      if(drillPointer?.id!==e.pointerId)return;
      setAim(aimFromPointer(e));drillPointer=null;
      dialog.querySelector('.drill-rock')?.classList.remove('grabbed');
      drill();
    });
    dialog.addEventListener('pointercancel',()=>{drillPointer=null;dialog.querySelector('.drill-rock')?.classList.remove('grabbed');});
    dialog.addEventListener('keydown',e=>{
      if(kind!=='drill'||!e.target.matches('.drill-rock'))return;
      const step=e.shiftKey?10:2;
      if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();setAim(aim-step);}
      else if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();setAim(aim+step);}
      else if(e.key==='Enter'||e.key===' '){e.preventDefault();drill();}
    });

    // Shared piece moves for pipes, seals, and plants.
    function checkManifest(){
      if(slots.includes(null))return;
      if(slots.every((seal,i)=>seal===manifest[i])){succeed('delivery','Seals accepted. The crate unlocks.');return;}
      playSound('warning');wrong=true;locked=true;message='The seal order was different. Study the manifest and try again.';
      setTimeout(()=>{wrong=false;locked=false;slots=[null,null,null];render();},reducedMotion?200:650);
    }
    function checkPipes(){
      if(pipesConnected(tiles())){succeed('ice','Flow established. Ice is moving to the processor.');return;}
      const placed=board.filter(piece=>piece!==null).length;
      message=placed===pipeMasks.length?'Every slot is filled, but the flow stops short. Tap a placed section to rotate it.':placed+' / '+pipeMasks.length+' sections placed.';
    }
    function place(piece,drop){
      if(kind==='pipes'){board=movePiece(board,piece,drop==='tray'?-1:Number(drop));selected=null;checkPipes();}
      if(kind==='manifest'){slots=movePiece(slots,piece,drop==='tray'?-1:Number(drop));message='';checkManifest();}
      if(kind==='harvest'){if(drop==='crate')picked.add(piece);else picked.delete(piece);message='';}
    }
    installPieceDrag(dialog,{
      canDrag:()=>!locked&&kind!=='drill',
      onDrop(piece,drop){
        if(locked)return;
        playSound('select');place(Number(piece),drop);
        if(!done)render();
      },
    });

    dialog.addEventListener('cancel',e=>{e.preventDefault();if(!done)finish(false);});
    dialog.addEventListener('click',e=>{
      const button=e.target.closest('button');
      if(!button)return;
      const action=button.dataset.game;
      if(action==='cancel'){if(!done){playSound('select');finish(false);}return;}
      if(locked)return;
      playSound('select');
      if(action==='remember'){revealed=false;slots=[null,null,null];message='';}
      if(action==='reveal'){revealed=true;message='';}
      if(action==='harvest'){
        const correct=harvestPlants.every((plant,i)=>picked.has(i)===plant.ready);
        if(correct){succeed('grow','A healthy harvest is packed.');return;}
        playSound('warning');message='Check both conditions. Only the three mature plants with enough moisture belong in the crate.';
      }
      // Tap alternatives to dragging.
      const piece=button.dataset.piece!==undefined?Number(button.dataset.piece):null;
      let focus=null;
      if(kind==='pipes'&&piece!==null){
        if(board.includes(piece)){pipeMasks[piece]=rotatePipe(pipeMasks[piece]);selected=null;checkPipes();focus='[data-piece="'+piece+'"]';}
        else {selected=selected===piece?null:piece;message=selected===null?'':'Section selected. Tap an empty slot to place it.';focus='[data-piece="'+piece+'"]';}
      }
      if(kind==='pipes'&&button.dataset.place!==undefined){
        if(selected===null)message='Drag a spare section here, or tap one first.';
        else {focus='[data-piece="'+selected+'"]';place(selected,button.dataset.place);}
      }
      if(kind==='manifest'&&piece!==null){
        place(piece,slots.includes(piece)?'tray':String(slots.indexOf(null)));
        if(!slots.includes(piece))focus='.seal-tray [data-piece="'+piece+'"]';
      }
      if(kind==='harvest'&&piece!==null){place(piece,picked.has(piece)?'bed':'crate');focus='[data-piece="'+piece+'"]';}
      if(done)return;
      render();
      if(focus)refocus(focus);
    });
    document.body.append(dialog);render();dialog.showModal();
  });
}
