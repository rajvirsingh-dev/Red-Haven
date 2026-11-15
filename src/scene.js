import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export function createOutpost(host, markers) {
  let renderer;
  try { renderer=new T.WebGLRenderer({antialias:true}); } catch {
    host.classList.add('no-webgl');
    return { update() {}, focus() {} };
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
  controls.minDistance=18;
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
  const blue=mat('#31576f',{metalness:.25,roughness:.44});
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
  mesh(new T.CylinderGeometry(1.05,.25,.45,20,1,true),white,dish);
  cylinder(dish,0,.38,0,.045,.045,.76,steel);
  sphere(dish,0,.79,0,.13,warm);
  const cache=group(8,6);
  pad(cache,3.8,3.1);
  const crates=[box(cache,-.75,.62,0,1.18,.89,1,trim),box(cache,.75,.62,0,1.18,.89,1,white)];
  const rover=group(-1.5,4.2);
  box(rover,0,.62,0,1.48,.34,1.82,white);
  box(rover,0,1,0.38,1.02,.4,.77,steel);
  box(rover,0,1.01,.79,.74,.23,.09,cyan);
  for (const x of [-.77,.77]) for(const z of [-.62,.62]) {
    cylinder(rover,x,.34,z,.31,.31,.22,black).rotation.z=Math.PI/2;
  }
  const anchors={spacecraft:[-7,4.25,3],habitat:[0,2.8,0],greenhouse:[7,3.05,0],solar:[-4,2.35,-6.7],relay:[5,4.25,-6.4],cargo:[8,1.64,6]};
  const move={start:-Infinity,target:new T.Vector3(), active:false};
  const origin=rover.position.clone(), projected=new T.Vector3();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let desiredTarget=controls.target.clone();
  let state=null;
  const resize=()=>{const {clientWidth:w,clientHeight:h}=host;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}};
  new ResizeObserver(resize).observe(host);resize();
  renderer.setAnimationLoop(()=>{
    if(document.hidden) return;
    const now=performance.now();
    if(move.active) {
      const t=Math.min(1,(now-move.start)/2400);
      const position=t<.5?t*2:2-t*2;
      const path=position*position*(3-2*position);
      rover.position.lerpVectors(origin,move.target,path);
      rover.rotation.y=Math.atan2(move.target.x-origin.x,move.target.z-origin.z)+(t>.5?Math.PI:0);
      move.active=t<1;
      if(t>=1) crates.forEach((crate,i)=>crate.visible=!state?.caches[i?'parts':'air']);
    }
    controls.target.lerp(desiredTarget,reduced.matches?1:.08);
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
      desiredTarget=point ? new T.Vector3(point[0]*.65,.5,point[2]*.65) : new T.Vector3(0,0,0);
    },
    update(next,animate=false) {
      state=next;
      const storm=next?.hazard==='storm';
      scene.fog.color.set(storm?'#754f58':'#8f6459');
      sun.intensity=storm?1.7:3.7;
      warm.emissiveIntensity=next?.habitat?1.45:.42;
      cyan.emissiveIntensity=next?.relay?1.4:.55;
      const task=next?.result?.selected.id;
      if(animate&&!reduced.matches&&['air','parts','remote'].includes(task)){
        move.start=performance.now();move.active=true;
        // Follow the service road south of the habitat to the cargo pad.
        move.target.set(task==='remote'?5.8:6.5,0,task==='remote'?4.35:6.4);
      } else if(!move.active) crates.forEach((crate,i)=>crate.visible=!next?.caches[i?'parts':'air']);
    },
  };
}
