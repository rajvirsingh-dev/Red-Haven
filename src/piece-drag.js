// Pointer dragging for minigame pieces inside an activity dialog.
// Pieces carry [data-piece], drop zones carry [data-drop]. A tap without movement stays a normal click.
export function installPieceDrag(root,{canDrag=()=>true,onDrop}) {
  let pending=null,active=null,ghost=null,target=null,suppressClick=false;
  function highlight(next){
    if(next&&!root.contains(next))next=null;
    if(next===target)return;
    target?.classList.remove('drop-hover');target=next;target?.classList.add('drop-hover');
  }
  function move(x,y){
    ghost.style.left=x-active.dx+'px';ghost.style.top=y-active.dy+'px';
    highlight(document.elementFromPoint(x,y)?.closest('[data-drop]')??null);
  }
  function begin(e){
    active=pending;
    const bounds=active.source.getBoundingClientRect();
    active.dx=active.x-bounds.left;active.dy=active.y-bounds.top;
    ghost=active.source.cloneNode(true);
    ghost.classList.add('piece-ghost');ghost.setAttribute('aria-hidden','true');ghost.removeAttribute('data-piece');
    ghost.style.width=bounds.width+'px';ghost.style.height=bounds.height+'px';
    root.append(ghost);
    active.source.classList.add('piece-origin');root.classList.add('dragging-piece');
    active.source.setPointerCapture?.(e.pointerId);
  }
  function end(drop){
    const piece=active?.piece,destination=target,wasActive=!!active;
    highlight(null);ghost?.remove();ghost=null;
    active?.source.classList.remove('piece-origin');root.classList.remove('dragging-piece');
    pending=null;active=null;
    // Swallow only the click that the browser fires right after this drag's release.
    if(wasActive)suppressClick=true;
    if(drop&&destination)onDrop(piece,destination.dataset.drop);
  }
  root.addEventListener('pointerdown',e=>{
    suppressClick=false;
    const source=e.target.closest('[data-piece]');
    if(!source||e.button!==0||!e.isPrimary||!canDrag())return;
    pending={source,piece:source.dataset.piece,id:e.pointerId,x:e.clientX,y:e.clientY};
  });
  root.addEventListener('pointermove',e=>{
    if(!pending||pending.id!==e.pointerId)return;
    if(!active&&Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>=6)begin(e);
    if(active){e.preventDefault();move(e.clientX,e.clientY);}
  });
  root.addEventListener('pointerup',e=>{
    if(pending?.id!==e.pointerId)return;
    if(active){move(e.clientX,e.clientY);end(true);}else pending=null;
  });
  root.addEventListener('pointercancel',()=>end(false));
  root.addEventListener('keydown',e=>{suppressClick=false;if(e.key==='Escape'&&active){e.preventDefault();e.stopPropagation();end(false);}},true);
  root.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
  return {dragging:()=>!!active};
}
