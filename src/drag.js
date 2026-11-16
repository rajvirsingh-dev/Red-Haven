// Pointer-based crew dragging, in the spirit of deploying a unit from a card bar onto the map.
// A crew card can be dropped on a building in the 3D scene, on its label, or on a job card.
export function installCrewDrag({canDrag,stationAt,describe,onHover,onDrop,onStart,onEnd}) {
  let pending=null,active=null,ghost=null,target=null,suppressClick=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resolve(x,y){
    const el=document.elementFromPoint(x,y);
    const task=el?.closest('[data-task]:not(:disabled)');
    if(task)return {el:task,task:task.dataset.task,key:'task:'+task.dataset.task};
    const marker=el?.closest('[data-location]:not([hidden])');
    if(marker)return {el:marker,station:marker.dataset.location,key:'station:'+marker.dataset.location};
    if(el?.tagName==='CANVAS'){
      const station=stationAt(x,y);
      if(station)return {el:document.querySelector('[data-location="'+station+'"]'),station,key:'station:'+station};
    }
    return null;
  }
  function highlight(next){
    if((next?.key??null)===(target?.key??null))return;
    target?.el?.classList.remove('drop-hover');target=next;target?.el?.classList.add('drop-hover');
    onHover?.(target?.station??null);
    const hint=describe(active.crew,target);
    ghost.querySelector('small').textContent=hint.text;
    ghost.classList.toggle('over-target',!!target&&hint.ok);
    ghost.classList.toggle('over-blocked',!!target&&!hint.ok);
  }
  function move(x,y){
    ghost.style.left=x+'px';ghost.style.top=y+'px';
    highlight(resolve(x,y));
  }
  function begin(e){
    active=pending;
    ghost=document.createElement('div');ghost.className='drag-ghost';ghost.setAttribute('aria-hidden','true');
    ghost.append(active.source.querySelector('.crew-portrait').cloneNode(true));
    const copy=document.createElement('div'),title=document.createElement('strong'),hint=document.createElement('small');
    title.textContent=active.source.querySelector('strong').textContent;
    hint.textContent=describe(active.crew,null).text;copy.append(title,hint);ghost.append(copy);document.body.append(ghost);
    active.source.classList.add('drag-origin');document.body.classList.add('assigning');
    active.source.setPointerCapture?.(e.pointerId);
    onStart?.(active.crew);
  }
  function finish(accepted=false){
    const crew=active?.crew,destination=target,source=active?.source,card=ghost;
    target?.el?.classList.remove('drop-hover');target=null;
    source?.classList.remove('drag-origin');
    document.body.classList.remove('assigning');pending=null;active=null;ghost=null;
    if(!card)return;
    onEnd?.();
    suppressClick=true; // swallow only the click the browser fires for this release
    const bounds=(accepted&&destination?.el?destination.el:source)?.getBoundingClientRect();
    if(!reduced()&&bounds){
      card.style.transition='left .18s ease, top .18s ease, opacity .18s ease, transform .18s ease';
      card.style.left=bounds.left+bounds.width/2+'px';card.style.top=bounds.top+bounds.height/2+'px';
      card.style.transform='translate(-50%,-50%) scale(.6)';card.style.opacity='0';setTimeout(()=>card.remove(),200);
    }else card.remove();
    if(accepted&&destination)onDrop(crew,destination);
  }
  document.addEventListener('pointerdown',e=>{
    suppressClick=false;
    const source=e.target.closest('[data-crew]');
    if(!source||source.disabled||e.button!==0||!e.isPrimary||!canDrag())return;
    pending={source,id:e.pointerId,x:e.clientX,y:e.clientY,crew:source.dataset.crew};
  });
  document.addEventListener('pointermove',e=>{
    if(!pending||pending.id!==e.pointerId)return;
    if(!active&&Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>=6)begin(e);
    if(active){e.preventDefault();move(e.clientX,e.clientY);}
  },{passive:false});
  document.addEventListener('pointerup',e=>{
    if(pending?.id!==e.pointerId)return;
    if(active){move(e.clientX,e.clientY);finish(!!target);}else pending=null;
  });
  document.addEventListener('pointercancel',()=>finish());
  document.addEventListener('keydown',e=>{suppressClick=false;if(e.key==='Escape'&&active){e.preventDefault();finish();}});
  document.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('dragstart',e=>{if(e.target.closest('[data-crew]'))e.preventDefault();});
}
