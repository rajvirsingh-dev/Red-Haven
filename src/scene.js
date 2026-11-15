import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export function createOutpost(host, markers) {
  let renderer;
  try { renderer=new T.WebGLRenderer({antialias:true}); } catch {
    host.classList.add('no-webgl');
    return { update() {}, focus() {}, preview() {} };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.22;
  host.prepend(renderer.domElement);
  const scene=new T.Scene();
  scene.background=new T.Color('#68504e');
  scene.fog=new T.FogExp2('#8f6459',0.018);
  const camera=new T.PerspectiveCamera(38,1,0.1,220);
  camera.position.set(24,20,30);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.target.set(0,0,0);
  controls.enableDamping=true;
  controls.enablePan=false;
  controls.minDistance=5;
  controls.maxDistance=65;
  controls.maxPolarAngle=Math.PI/2.2;
  controls.update();
  scene.add(new T.HemisphereLight('#ffe5bb','#7a442f',2.05));
  const sun=new T.DirectionalLight('#ffcc94',3.7);
  sun.position.set(-16,25,-9);
  sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28});
  sun.shadow.mapSize.set(1536,1536);
  sun.shadow.bias=-0.0005;
  scene.add(sun);
  const mat=(color,props={})=>new T.MeshStandardMaterial({color,roughness:0.86,...props});
  const white=mat('#e7d5b3'), black=mat('#303c3b'), steel=mat('#6a7975'), trim=mat('#c86d3d');
  const cyan=mat('#93dccc',{emissive:'#3ab3a7',emissiveIntensity:0.7});
  const warm=mat('#ffd49d',{emissive:'#ff8f42',emissiveIntensity:0.5});
  const dirt=mat('#af633f',{vertexColors:true});
  let rng=2143;
  function random(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;}
  const mesh=(geometry,material,parent,x=0,y=0,z=0)=>{
    const object=new T.Mesh(geometry,material);
    object.position.set(x,y,z); object.castShadow=true; object.receiveShadow=true; parent.add(object);
    return object;
  };
  const box=(parent,x,y,z,w,h,d,m)=>mesh(new T.BoxGeometry(w,h,d),m,parent,x,y,z);
  const cylinder=(parent,x,y,z,r1,r2,h,m,n=12)=>mesh(new T.CylinderGeometry(r1,r2,h,n),m,parent,x,y,z);
  const sphere=(parent,x,y,z,r,m,n=12)=>mesh(new T.SphereGeometry(r,n,Math.max(6,n/2)),m,parent,x,y,z);
  const group=(x,z)=>{const g=new T.Group();g.position.set(x,0,z);scene.add(g);return g;};
  const height=(x,z)=> {
    const distance=Math.hypot(x,z);
    return distance<17 ? 0 : (Math.sin(x*0.22)*Math.sin(z*0.24)*1.5 + Math.cos(z*0.31)*0.7)*Math.min(1,(distance-17)/12);
  };
  const geo=new T.PlaneGeometry(170,170,108,108);
  geo.rotateX(-Math.PI/2);
  const verts=geo.attributes.position, colors=[];
  for(let i=0;i<verts.count;i++){
    const x=verts.getX(i),z=verts.getZ(i);
    verts.setY(i,height(x,z)-0.035);
    const tint=0.72+0.22*random()+0.11*Math.sin(x*0.29+z*0.15);
    colors.push(tint,tint,tint);
  }
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  mesh(geo,dirt,scene).castShadow=false;
  const rocks=[mat('#7b442e'),mat('#874e39'),mat('#9b6049'),mat('#684b44')];
  const rockGeometry=new T.DodecahedronGeometry(1,0);
  for(let i=0;i<155;i++){
    const angle=random()*Math.PI*2,r=13+random()*54, x=Math.cos(angle)*r,z=Math.sin(angle)*r;
    const size=r>29?0.4+random()*5:0.2+random()*0.72;
    const rock=mesh(rockGeometry,rocks[i%rocks.length],scene,x,height(x,z)+size*.12,z);
    rock.rotation.set(random()*2,random()*6,random()*2);
    rock.scale.set(size*(.7+random()),size*(.35+random()*.7),size);
  }
  const footing=mat('#65493f');
  function pad(g,w,d){
    box(g,0,0.11,0,w,.22,d,footing);
    for(const x of [-w/2+.18,w/2-.18]) for(const z of [-d/2+.18,d/2-.18]){
      box(g,x,.24,z,.22,.05,.22,warm);
    }
  }
  const craft=group(-7,3);
  pad(craft,6.4,6);
  cylinder(craft,0,2.2,0,1.05,1.58,2.65,white);
  cylinder(craft,0,3.77,0,.26,1.05,.54,black);
  cylinder(craft,0,.67,0,.72,.95,.62,steel);
  for(let i=0;i<4;i++){
    const support=new T.Group();support.rotation.y=i*Math.PI/2;craft.add(support);
    const leg=box(support,1.48,.89,0,.15,1.55,.18,white);leg.rotation.z=.37;
    box(support,1.76,.3,0,.57,.12,.5,steel);
    box(support,.93,2.53,0,.19,.34,.52,cyan);
  }
  box(craft,0,1.47,1.5,.53,.9,.15,black);
  box(craft,0,.64,2,.55,.08,1.24,steel).rotation.x=-.36;
  const habitat=group(0,0);
  pad(habitat,6.4,4.6);
  box(habitat,0,1.29,0,5.5,1.95,3.6,white);
  box(habitat,0,2.35,0,5.2,.2,3.4,steel);
  for(const x of [-2.41,-.79,.79,2.41]) box(habitat,x,1.27,1.83,.14,1.94,.22,trim);
  for(const x of [-1.6,1.6]) box(habitat,x,1.52,1.84,1,.48,.08,cyan);
  box(habitat,0,.97,1.85,.89,1.31,.11,black);
  box(habitat,0,.3,2.21,1.14,.13,.95,steel);
  for(const x of [-1.1,0,1.1]) box(habitat,x,2.6,-.4,.84,.31,1.4,white);
  const greenhouse=group(7,0);
  pad(greenhouse,5.4,4.5);
  box(greenhouse,0,.62,0,4.6,.67,3.5,white);
  const glass=mat('#85c3a0',{transparent:true,opacity:.38,depthWrite:false,side:T.DoubleSide});
  const roof=mesh(new T.CylinderGeometry(1.76,1.76,4.5,18,1,false,0,Math.PI),glass,greenhouse,0,.97,0);
  roof.rotation.set(0,Math.PI/2,Math.PI/2);
  for(const x of [-2.2,-1.1,0,1.1,2.2]) {
    mesh(new T.TorusGeometry(1.76,.04,6,18,Math.PI),steel,greenhouse,x,.97,0).rotation.y=Math.PI/2;
  }
  const crop=mat('#6d9f51');
  for(const z of [-.83,.83]){
    box(greenhouse,0,1,z,4.2,.19,.63,black);
    for(let i=0;i<8;i++) {
      const plant=sphere(greenhouse,-1.87+i*.52,1.22,z,.22,crop,8);
      plant.scale.set(1,.65+random(),1.07);
    }
  }
  const solar=group(-4,-6.7);
  const blue=mat('#163f67',{metalness:.25,roughness:.44,emissive:'#173951',emissiveIntensity:.25});
  for(const x of [-3,0,3]) {
    cylinder(solar,x,.72,0,.09,.16,1.4,steel);
    const panel=new T.Group();panel.position.set(x,1.54,0);panel.rotation.x=.31;solar.add(panel);
    box(panel,0,0,0,2.6,.105,2,steel);
    for(let i=0;i<5;i++) for(let j=0;j<4;j++) box(panel,-1.01+i*.505,.062,-.72+j*.48,.46,.045,.435,blue);
  }
  const relay=group(5,-6.4);
  pad(relay,3.5,3.5);
  cylinder(relay,0,1.4,0,.13,.3,2.7,white);
  const dish=new T.Group();dish.position.set(0,2.95,0);dish.rotation.set(.55,0,-.45);relay.add(dish);
  const dishSurface=mat('#e5d6b9',{side:T.DoubleSide,metalness:.25,roughness:.5});
  mesh(new T.LatheGeometry([new T.Vector2(.03,0),new T.Vector2(.4,.08),new T.Vector2(.85,.26),new T.Vector2(1.3,.55)],28),dishSurface,dish);
  cylinder(dish,0,.38,0,.045,.045,.76,steel);
  sphere(dish,0,.79,0,.13,warm);
  const cache=group(8,6);
  pad(cache,3.8,3.1);
  const crates=[box(cache,-.75,.62,0,1.18,.89,1,trim),box(cache,.75,.62,0,1.18,.89,1,white)];
  const ore=group(13,7);
  const ice=group(12,-10);
  const oreMat=mat('#665447',{metalness:.55,roughness:.52});
  const iceMat=mat('#abd2d6',{metalness:.15,roughness:.22});
  for(const [deposit,material] of [[ore,oreMat],[ice,iceMat]]) {
    for(let i=0;i<7;i++){
      const chunk=mesh(rockGeometry,material,deposit,(random()-.5)*2.1,.3+random()*.3,(random()-.5)*1.6);
      chunk.scale.set(.4+random()*.5,.35+random()*.5,.4+random()*.4);
    }
    const mast=cylinder(deposit,-1.4,.8,0,.035,.035,1.6,steel);
    box(deposit,mast.position.x+.2,1.45,0,.45,.25,.06,trim);
  }
  const workers={};
  for(const [index,id] of ['mika','sol','pip'].entries()) {
    const g=group(-2.6+index*1.25,3.4);
    const uniform=mat(['#d77e4d','#a1b775','#6ba9b8'][index]);
    const leftLeg=box(g,-.15,.25,0,.2,.48,.24,black);
    const rightLeg=box(g,.15,.25,0,.2,.48,.24,black);
    box(g,0,.68,0,.63,.52,.39,uniform);
    box(g,0,.67,-.28,.45,.47,.22,white);
    const arm=new T.Group();arm.position.set(.39,.89,0);g.add(arm);
    box(arm,0,-.2,0,.17,.45,.19,white);
    const pick=box(arm,0,-.49,.15,.06,.56,.06,steel);
    box(arm,.05,-.72,.15,.55,.065,.09,oreMat);
    pick.visible=id!=='pip';
    box(g,-.4,.66,0,.17,.45,.19,white);
    sphere(g,0,1.17,0,.31,white);
    box(g,0,1.2,.27,.4,.19,.1,black);
    if(id==='pip') {
      box(g,0,1.21,.33,.24,.05,.025,cyan);
      cylinder(g,0,1.61,0,.022,.022,.32,steel);
      sphere(g,0,1.8,0,.06,warm);
    }
    const carry=box(g,-.4,.6,.29,.32,.3,.3,trim);
    carry.visible=false;
    const ring=mesh(new T.RingGeometry(.5,.58,28),new T.MeshBasicMaterial({color:['#ee9866','#acd29b','#94cbd6'][index],side:T.DoubleSide}),g,0,.025,0);
    ring.rotation.x=-Math.PI/2;
    workers[id]={g,leftLeg,rightLeg,arm,carry,ring,home:g.position.clone()};
  }
  const rover=group(-1.5,4.2);
  box(rover,0,.62,0,1.48,.34,1.82,white);
  box(rover,0,1,0.38,1.02,.4,.77,steel);
  box(rover,0,1.01,.79,.74,.23,.09,cyan);
  for (const x of [-.77,.77]) for(const z of [-.62,.62]) {
    cylinder(rover,x,.34,z,.31,.31,.22,black).rotation.z=Math.PI/2;
  }
  const anchors={spacecraft:[-7,4.25,3],habitat:[0,2.8,0],greenhouse:[7,3.05,0],solar:[-4,2.35,-6.7],relay:[5,4.25,-6.4],cargo:[8,1.64,6],ore:[13,1.5,7],ice:[12,1.5,-10]};
  const move={start:-Infinity,target:new T.Vector3(), active:false};
  const origin=rover.position.clone(), projected=new T.Vector3();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let desiredTarget=controls.target.clone();
  let cameraTrip=null;
  let expedition=null;
  const destinations={ore:[12,0,7],ice:[11,0,-9],cargo:[6.5,0,6.3],greenhouse:[5.4,0,3.3],relay:[5,0,-4.1],solar:[-4,0,-4.5],habitat:[0,0,2.8]};
  function destinationFor(task){
    if(task==='mine') return 'ore';
    if(task==='ice') return 'ice';
    if(['air','parts'].includes(task))return 'cargo';
    if(['grow','harvest'].includes(task))return 'greenhouse';
    if(['relay','report','beacon','pulse'].includes(task))return 'relay';
    return task==='remote'?'solar':'habitat';
  }
  function clearExpedition() {
    if(!expedition)return;
    const person=workers[expedition.id];
    person.g.position.copy(person.home);
    person.leftLeg.rotation.x=person.rightLeg.rotation.x=person.arm.rotation.x=0;
    person.carry.visible=false;
    expedition=null;
  }
  function walkRoute(points,progress,person){
    const lengths=points.slice(1).map((p,i)=>p.distanceTo(points[i]));
    let distance=lengths.reduce((sum,n)=>sum+n,0)*progress;
    for(let i=0;i<lengths.length;i++){
      if(distance<=lengths[i]||i===lengths.length-1){
        person.g.position.lerpVectors(points[i],points[i+1],Math.min(1,distance/Math.max(.001,lengths[i])));
        person.g.rotation.y=Math.atan2(points[i+1].x-points[i].x,points[i+1].z-points[i].z);
        return;
      }
      distance-=lengths[i];
    }
  }
  let state=null;
  const resize=()=>{const {clientWidth:w,clientHeight:h}=host;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}};
  new ResizeObserver(resize).observe(host);resize();
  renderer.setAnimationLoop(()=>{
    if(document.hidden) return;
    const now=performance.now();
    if(cameraTrip) {
      const t=Math.min(1,(now-cameraTrip.start)/850);
      const eased=1-Math.pow(1-t,3);
      camera.position.lerpVectors(cameraTrip.from,cameraTrip.to,eased);
      controls.target.lerpVectors(cameraTrip.targetFrom,desiredTarget,eased);
      if(t===1)cameraTrip=null;
    }
    if(expedition) {
      const person=workers[expedition.id];
      const t=Math.min(1,(now-expedition.start)/6200);
      const walking=t<.34||t>.66;
      if(t<.34) walkRoute(expedition.path,t/.34,person);
      else if(t>.66) walkRoute([...expedition.path].reverse(),(t-.66)/.34,person);
      else {
        person.g.position.copy(expedition.path.at(-1));
        person.arm.rotation.x=Math.sin(now*.018)*.85-.4;
        person.g.rotation.y=-.7;
      }
      if(walking) {
        person.leftLeg.rotation.x=Math.sin(now*.017)*.5;
        person.rightLeg.rotation.x=-person.leftLeg.rotation.x;
        person.arm.rotation.x=person.rightLeg.rotation.x*.4;
      }
      person.carry.visible=expedition.collection&&t>.6&&t<.98;
      if(t>=1) clearExpedition();
    }
    if(move.active) {
      const t=Math.min(1,(now-move.start)/2400);
      const position=t<.5?t*2:2-t*2;
      const path=position*position*(3-2*position);
      rover.position.lerpVectors(origin,move.target,path);
      rover.rotation.y=Math.atan2(move.target.x-origin.x,move.target.z-origin.z)+(t>.5?Math.PI:0);
      move.active=t<1;
      if(t>=1) crates.forEach((crate,i)=>crate.visible=!state?.caches[i?'parts':'air']);
    }
    if(!cameraTrip)controls.target.lerp(desiredTarget,reduced.matches?1:.08);
    controls.update();
    for(const [id,[x,y,z]] of Object.entries(anchors)){
      const el=markers.querySelector('[data-location='+id+']');
      if(!el) continue;
      projected.set(x,y,z).project(camera);
      const visible=projected.z<1&&Math.abs(projected.x)<.95&&Math.abs(projected.y)<.86;
      el.hidden=!visible&&host.clientWidth>710;
      el.style.left=(50+projected.x*50)+'%';
      el.style.top=(50-projected.y*50)+'%';
    }
    renderer.render(scene,camera);
  });
  return {
    focus(id) {
      const point=anchors[id];
      desiredTarget=point ? new T.Vector3(point[0],Math.max(.8,point[1]*.36),point[2]) : new T.Vector3(0,0,0);
      const close=point?new T.Vector3(6.4,5.2,8):new T.Vector3(24,20,30);
      const to=point?desiredTarget.clone().add(close):close;
      if(reduced.matches) {camera.position.copy(to);controls.target.copy(desiredTarget);cameraTrip=null;}
      else cameraTrip={start:performance.now(),from:camera.position.clone(),to,targetFrom:controls.target.clone()};
    },
    preview(id) {
      for(const [member,person] of Object.entries(workers))person.ring.visible=member===id;
    },
    update(next,animate=false) {
      state=next;
      const storm=next?.hazard==='storm';
      scene.fog.color.set(storm?'#754f58':'#8f6459');
      sun.intensity=storm?1.7:3.7;
      warm.emissiveIntensity=next?.habitat?1.45:.42;
      cyan.emissiveIntensity=next?.relay?1.4:.55;
      const actionResult=next?.phase==='plan'?next.fieldResult:next?.result;
      const task=actionResult?.selected.id;
      if(!animate&&next?.phase!=='debrief')clearExpedition();
      if(animate&&task!=='reserve'&&!reduced.matches){
        clearExpedition();
        const id=actionResult.assignee??'pip';
        const person=workers[id]??workers.pip;
        const destination=destinationFor(task);
        const target=new T.Vector3(...destinations[destination]);
        // Service lanes keep crew outside building footprints.
        const road=destination==='ice'||destination==='relay'?11:target.x;
        const path=[person.home.clone(),new T.Vector3(road,0,4.15),new T.Vector3(road,0,target.z),target];
        expedition={id,start:performance.now(),path,collection:['mine','ice','air','parts','harvest'].includes(task)};
      }
      if(next?.deposits) {
        ore.children.slice(0,7).forEach((chunk,i)=>chunk.visible=i<next.deposits.ore*2+1);
        ice.children.slice(0,7).forEach((chunk,i)=>chunk.visible=i<next.deposits.ice*2+1);
      }
      if(animate&&!reduced.matches&&['air','parts','remote'].includes(task)){
        move.start=performance.now();move.active=true;
        // Follow the service road south of the habitat to the cargo pad.
        move.target.set(task==='remote'?5.8:6.5,0,task==='remote'?4.35:6.4);
      } else if(!move.active) crates.forEach((crate,i)=>crate.visible=!next?.caches[i?'parts':'air']);
    },
  };
}
