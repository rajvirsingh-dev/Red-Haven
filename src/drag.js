// Pointer-based dragging keeps the item visible on mouse, pen, and touch screens.
export function installAssignmentDrag({canDrag,onDrop,onCancel}) {
  let pending=null,active=null,ghost=null,target=null,suppressUntil=0,scrollFrame=0,point=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function highlight(next){
    target?.classList.remove('drop-hover');target=next;target?.classList.add('drop-hover');
    if(ghost)ghost.querySelector('small').textContent=target?'Release to assign':'Drag onto a task or station';
    ghost?.classList.toggle('over-target',!!target);
  }
  function move(x,y){
    point={x,y};
    ghost.style.left=x+'px';ghost.style.top=y+'px';
    highlight(document.elementFromPoint(x,y)?.closest('[data-task]:not(:disabled),[data-location]:not([hidden])')??null);
  }
  function autoScroll(){
    if(!active)return;
    const panel=document.querySelector('.panel'),bounds=panel.getBoundingClientRect();
    if(point.x>=bounds.left&&point.x<=bounds.right&&panel.scrollHeight>panel.clientHeight){
      const delta=point.y<bounds.top+55?-9:point.y>bounds.bottom-55?9:0;
      if(delta){panel.scrollTop+=delta;move(point.x,point.y);}
    }else if(document.documentElement.scrollHeight>innerHeight){
      const delta=point.y<65?-9:point.y>innerHeight-65?9:0;
      if(delta){window.scrollBy(0,delta);move(point.x,point.y);}
    }
    scrollFrame=requestAnimationFrame(autoScroll);
  }
  function begin(e){
    active=pending;
    ghost=document.createElement('div');ghost.className='drag-ghost';ghost.setAttribute('aria-hidden','true');
    const portrait=active.source.querySelector('.crew-portrait');
    if(portrait)ghost.append(portrait.cloneNode(true));
    else {const badge=document.createElement('span');badge.className='drag-resource';badge.textContent=active.item.resource==='power'?'ϟ':'▣';ghost.append(badge);}
    const copy=document.createElement('div'),title=document.createElement('strong'),hint=document.createElement('small');
    title.textContent=active.item.crew?active.source.querySelector('strong').textContent:
      active.item.resource==='power'?'Power allocation':active.source.querySelector('strong').textContent+' spare parts';
    hint.textContent='Drag onto a task or station';copy.append(title,hint);ghost.append(copy);document.body.append(ghost);
    active.source.classList.add('drag-origin');document.body.classList.add('assigning');
    active.source.setPointerCapture(e.pointerId);move(e.clientX,e.clientY);
    scrollFrame=requestAnimationFrame(autoScroll);
  }
  function finish(accepted=false){
    const item=active?.item,destination=target,source=active?.source,card=ghost;
    cancelAnimationFrame(scrollFrame);
    source?.classList.remove('drag-origin');highlight(null);
    document.body.classList.remove('assigning');pending=null;active=null;ghost=null;
    if(!card)return;
    suppressUntil=Date.now()+350;
    const bounds=(accepted?destination:source)?.getBoundingClientRect();
    if(!reduced()&&bounds){
      card.style.transition='left .18s ease, top .18s ease, opacity .18s ease, transform .18s ease';
      card.style.left=bounds.left+bounds.width/2+'px';card.style.top=bounds.top+bounds.height/2+'px';
      card.style.transform='translate(-50%,-50%) scale(.7)';card.style.opacity='0';setTimeout(()=>card.remove(),200);
    }else card.remove();
    if(accepted&&destination)onDrop(item,destination);else onCancel?.();
  }
  document.addEventListener('pointerdown',e=>{
    const source=e.target.closest('[data-crew],[data-resource]');
    if(!source||e.button!==0||!e.isPrimary||!canDrag())return;
    pending={source,id:e.pointerId,x:e.clientX,y:e.clientY,item:source.dataset.crew?{crew:source.dataset.crew}:{resource:source.dataset.resource}};
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
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();finish();}});
  document.addEventListener('click',e=>{if(Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('dragstart',e=>{if(e.target.closest('[data-crew],[data-resource]'))e.preventDefault();});
}
