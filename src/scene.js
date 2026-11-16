import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export function createOutpost(host, markers) {
  let renderer;
  try { renderer=new T.WebGLRenderer({antialias:true}); } catch {
    host.classList.add('no-webgl');
    return { update() {}, focus() {}, preview() {}, stationAt() {return null;}, highlight() {}, listen() {}, tripTime() {return 0;}, finish() {}, project() {return null;} };
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
  controls.maxDistance=90;
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
  // The half-cylinder axis is turned from Y to X so the glass follows the hoops and the bed length.
  const roof=mesh(new T.CylinderGeometry(1.74,1.74,4.4,24,1,true,0,Math.PI),glass,greenhouse,0,.96,0);
  roof.rotation.set(0,0,Math.PI/2);roof.castShadow=false;
  for(const x of [-2.2,2.2]){
    const end=mesh(new T.CircleGeometry(1.74,24,0,Math.PI),glass,greenhouse,x,.96,0);
    end.rotation.y=Math.PI/2;end.castShadow=false;
  }
  for(const x of [-2.2,-1.1,0,1.1,2.2]) {
    mesh(new T.TorusGeometry(1.76,.045,6,24,Math.PI),steel,greenhouse,x,.96,0).rotation.y=Math.PI/2;
  }
  box(greenhouse,0,.96+1.76,0,4.44,.07,.09,steel);
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
    const body=new T.Group();g.add(body);
    const hip=x=>{const h=new T.Group();h.position.set(x,.49,0);body.add(h);box(h,0,-.24,0,.2,.48,.24,black);return h;};
    const leftLeg=hip(-.15),rightLeg=hip(.15);
    box(body,0,.68,0,.63,.52,.39,uniform);
    box(body,0,.67,-.28,.45,.47,.22,white);
    const arm=new T.Group();arm.position.set(.39,.89,0);body.add(arm);
    box(arm,0,-.2,0,.17,.45,.19,white);
    const pick=new T.Group();arm.add(pick);
    box(pick,0,-.5,.08,.06,.6,.06,steel);
    box(pick,0,-.78,.08,.08,.08,.5,oreMat).rotation.x=.25;
    const hammer=new T.Group();arm.add(hammer);
    box(hammer,0,-.48,.06,.05,.42,.05,steel);
    box(hammer,0,-.7,.06,.13,.13,.26,black);
    const offArm=new T.Group();offArm.position.set(-.4,.89,0);body.add(offArm);
    box(offArm,0,-.22,0,.17,.45,.19,white);
    sphere(body,0,1.17,0,.31,white);
    box(body,0,1.2,.27,.4,.19,.1,black);
    if(id==='pip') {
      box(body,0,1.21,.33,.24,.05,.025,cyan);
      cylinder(body,0,1.61,0,.022,.022,.32,steel);
      sphere(body,0,1.8,0,.06,warm);
    }
    const carry=box(body,0,.72,.42,.36,.3,.3,mat('#c86d3d'));
    carry.visible=false;pick.visible=hammer.visible=false;
    const ring=mesh(new T.RingGeometry(.5,.58,28),new T.MeshBasicMaterial({color:['#ee9866','#acd29b','#94cbd6'][index],side:T.DoubleSide}),g,0,.025,0);
    ring.rotation.x=-Math.PI/2;
    workers[id]={g,body,leftLeg,rightLeg,arm,offArm,pick,hammer,carry,ring,home:g.position.clone(),heading:Math.PI};
    g.rotation.y=Math.PI;
  }
  const rover=group(-1.6,5.7);
  box(rover,0,.62,0,1.48,.34,1.82,white);
  box(rover,0,1,0.38,1.02,.4,.77,steel);
  box(rover,0,1.01,.79,.74,.23,.09,cyan);
  for (const x of [-.77,.77]) for(const z of [-.62,.62]) {
    cylinder(rover,x,.34,z,.31,.31,.22,black).rotation.z=Math.PI/2;
  }
  const stationGroups={spacecraft:craft,habitat,greenhouse,solar,relay,cargo:cache,ore,ice};
  const footprints={spacecraft:[3.4,5],habitat:[3.6,3.4],greenhouse:[3.2,3.4],solar:[4.8,2.4],relay:[2.2,4.5],cargo:[2.4,2],ore:[2,1.6],ice:[2,1.6]};
  const hidden=new T.MeshBasicMaterial({visible:false});
  const proxies=[],rings={};
  for(const [id,g] of Object.entries(stationGroups)){
    const [radius,tall]=footprints[id];
    const proxy=new T.Mesh(new T.CylinderGeometry(radius,radius,tall,16),hidden);
    proxy.position.set(0,tall/2,0);proxy.userData.station=id;g.add(proxy);proxies.push(proxy);
    const ring=new T.Mesh(new T.RingGeometry(radius+.15,radius+.45,48),new T.MeshBasicMaterial({color:'#ffd49d',transparent:true,opacity:.75,depthWrite:false,side:T.DoubleSide}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.3;ring.visible=false;ring.renderOrder=2;g.add(ring);rings[id]=ring;
  }
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();
  let highlighted={available:[],hover:null};
  const anchors={spacecraft:[-7,4.25,3],habitat:[0,2.8,0],greenhouse:[7,3.05,0],solar:[-4,2.35,-6.7],relay:[5,4.25,-6.4],cargo:[8,1.64,6],ore:[13,1.5,7],ice:[12,1.5,-10]};
  const move={start:-Infinity,target:new T.Vector3(), active:false};
  const origin=rover.position.clone(), projected=new T.Vector3();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let desiredTarget=controls.target.clone();
  let cameraTrip=null;
  // Each site has a standing spot beside it (never inside the rocks or walls), a point to face,
  // and waypoints that thread between buildings. Crew leave their line-up along the lane at z=4.
  const sites={
    ore:{stand:[10.75,6.4],face:[13,7],via:[[10.75,4]]},
    ice:{stand:[10.9,-7.5],face:[12,-10],via:[[11,4],[11,-7.5]]},
    cargo:{stand:[6.1,6.2],face:[7.25,6],via:[[6.1,4]]},
    greenhouse:{stand:[5.6,3],face:[7,1.2],via:[[5.6,4]]},
    relay:{stand:[5,-3.9],face:[5,-6.4],via:[[3.75,4],[3.75,-3.9]]},
    solar:{stand:[-2.6,-4.6],face:[-4,-6.7],via:[[-3.5,4],[-3.5,-4.6]]},
    habitat:{stand:[1.4,2.75],face:[1.4,1.7],via:[[1.4,4]]},
    door:{stand:[0,2.75],face:[0,1.8],via:[[0,4]]},
  };
  const styles={mine:'dig',ice:'dig',repair:'hammer',brace:'hammer',maintain:'hammer',relay:'hammer',
    report:'radio',beacon:'radio',pulse:'radio',grow:'tend',harvest:'tend',air:'lift',parts:'lift',remote:'inspect'};
  const burstColors={mine:['#6b5446','#9a7a5f','#4e3d33'],ice:['#e3f7fa','#a9dde6','#ffffff'],hammer:['#ffe3a3','#ffbf5e','#fff6d8'],
    radio:['#9ff0ff','#d9fbff'],tend:['#9fd27a','#c9ef94','#6ea83f'],lift:['#c9a27e','#a98466'],inspect:['#9ff0ff','#ffe3a3']};
  const carryLook={mine:'#5b4a3f',ice:'#cdeef2',air:'#e7d5b3',parts:'#c86d3d',harvest:'#8fc56a'};
  function siteFor(task){
    if(task==='mine')return 'ore';
    if(task==='ice')return 'ice';
    if(['air','parts'].includes(task))return 'cargo';
    if(['grow','harvest'].includes(task))return 'greenhouse';
    if(['relay','report','beacon','pulse'].includes(task))return 'relay';
    if(task==='remote')return 'solar';
    return styles[task]?'habitat':'door';
  }
  function routeFor(id,task){
    const home=workers[id].home,site=sites[siteFor(task)];
    const points=[home.clone(),new T.Vector3(home.x,0,4),...site.via.map(([x,z])=>new T.Vector3(x,0,z)),new T.Vector3(site.stand[0],0,site.stand[1])];
    return points.filter((p,i)=>i===0||p.distanceTo(points[i-1])>.05);
  }
  const routeLength=points=>points.slice(1).reduce((sum,p,i)=>sum+p.distanceTo(points[i]),0);
  const WORK=2600;
  function timing(id,task){
    const walk=Math.min(2600,Math.max(1100,routeLength(routeFor(id,task))/5.2*1000));
    return {walk,work:WORK,total:walk*2+WORK};
  }
  // A small pool of particle cubes for rock chips, ice shards, sparks, and leaves.
  const particles=[];
  const particleGeometry=new T.BoxGeometry(.09,.09,.09);
  for(let i=0;i<60;i++){
    const p=new T.Mesh(particleGeometry,new T.MeshBasicMaterial({color:'#fff'}));
    p.visible=false;p.userData={born:0,ttl:1};scene.add(p);particles.push(p);
  }
  function burst(at,colors,{count=9,speed=2.6,lift=2.4,gravity=7,size=1}={}){
    if(reduced.matches)return;
    for(let n=0;n<count;n++){
      const p=particles.find(q=>!q.visible);
      if(!p)return;
      p.visible=true;p.position.copy(at);
      p.material.color.set(colors[n%colors.length]);
      const a=Math.random()*Math.PI*2;
      p.userData={born:performance.now(),ttl:550+Math.random()*450,gravity,size:size*(.6+Math.random()*.8),
        v:new T.Vector3(Math.cos(a)*speed*Math.random(),lift*(.5+Math.random()*.7),Math.sin(a)*speed*Math.random()),spin:Math.random()*8};
      p.scale.setScalar(p.userData.size);
    }
  }
  const depositChunks={ore:ore.children.slice(0,7),ice:ice.children.slice(0,7)};
  for(const chunk of [...depositChunks.ore,...depositChunks.ice])chunk.userData.base=chunk.position.clone();
  function showDeposits(deposits){
    if(!deposits)return;
    for(const kind of ['ore','ice'])depositChunks[kind].forEach((chunk,i)=>chunk.visible=i<deposits[kind]*2+1);
  }
  let pendingDeposits=null,listener=()=>{};
  const expeditions=new Map();
  const digging=()=>[...expeditions.values()].some(trip=>!trip.collected&&styles[trip.task]==='dig');
  function resetWorker(id){
    const person=workers[id];
    person.g.position.copy(person.home);person.g.visible=true;
    person.heading=Math.PI;person.g.rotation.y=Math.PI;person.body.position.y=0;person.body.rotation.x=0;
    person.leftLeg.rotation.x=person.rightLeg.rotation.x=person.arm.rotation.x=person.offArm.rotation.x=0;
    person.carry.visible=person.pick.visible=person.hammer.visible=false;
  }
  function endExpedition(id,silent=false){
    const trip=expeditions.get(id);
    if(!trip)return;
    if(!trip.collected){trip.collected=true;if(!silent)collect(trip);}
    expeditions.delete(id);resetWorker(id);
    if(!digging())showDeposits(pendingDeposits);
  }
  function collect(trip){
    if(styles[trip.task]==='dig'&&!digging())showDeposits(pendingDeposits);
    listener('collect',{crew:trip.id,task:trip.task,station:siteFor(trip.task)==='door'?'habitat':siteFor(trip.task)});
  }
  function turnTo(person,target){
    let delta=target-person.heading;
    delta=Math.atan2(Math.sin(delta),Math.cos(delta));
    person.heading+=delta*.25;person.g.rotation.y=person.heading;
  }
  function walkRoute(points,progress,person,now){
    const lengths=points.slice(1).map((p,i)=>p.distanceTo(points[i]));
    let distance=lengths.reduce((sum,n)=>sum+n,0)*progress;
    for(let i=0;i<lengths.length;i++){
      if(distance<=lengths[i]||i===lengths.length-1){
        person.g.position.lerpVectors(points[i],points[i+1],Math.min(1,distance/Math.max(.001,lengths[i])));
        turnTo(person,Math.atan2(points[i+1].x-points[i].x,points[i+1].z-points[i].z));
        break;
      }
      distance-=lengths[i];
    }
    const stride=Math.sin(now*.016);
    person.leftLeg.rotation.x=stride*.6;person.rightLeg.rotation.x=-stride*.6;
    person.offArm.rotation.x=-stride*.5;person.arm.rotation.x=stride*.5;
    person.body.position.y=Math.abs(Math.cos(now*.016))*.06;
    person.body.rotation.x=0;
  }
  function frameTrip(points){
    if(reduced.matches)return;
    const bounds=new T.Box3().setFromPoints(points);
    const center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()).length();
    desiredTarget=center.setY(.6);
    const distance=Math.max(15,size*1.35+8)*Math.min(1.6,Math.max(1,.95/camera.aspect));
    const to=desiredTarget.clone().add(new T.Vector3(24,20,30).normalize().multiplyScalar(distance));
    cameraTrip={start:performance.now(),from:camera.position.clone(),to,targetFrom:controls.target.clone()};
    focused='trip';
  }
  function animateWork(trip,person,local,now){
    const style=styles[trip.task]??'rest';
    const site=sites[siteFor(trip.task)];
    turnTo(person,Math.atan2(site.face[0]-person.g.position.x,site.face[1]-person.g.position.z));
    person.leftLeg.rotation.x=person.rightLeg.rotation.x=0;
    person.body.position.y=0;person.body.rotation.x=0;
    const front=new T.Vector3(Math.sin(person.heading),0,Math.cos(person.heading));
    const strikeAt=y=>person.g.position.clone().addScaledVector(front,.75).setY(y);
    let period=0,phase=0;
    if(style==='dig'){
      period=820;phase=(local%period)/period;
      // Slow wind-up overhead, then a fast swing down into the rock.
      person.arm.rotation.x=phase<.62?-.5-2.2*Math.sin(phase/.62*Math.PI/2):-2.7+2.4*Math.pow((phase-.62)/.38,2);
      person.body.rotation.x=phase<.62?-.05:.18*((phase-.62)/.38);
      person.offArm.rotation.x=person.arm.rotation.x*.6;
    } else if(style==='hammer'){
      period=480;phase=(local%period)/period;
      person.arm.rotation.x=phase<.55?-1-Math.sin(phase/.55*Math.PI/2):-2+1.3*((phase-.55)/.45);
      person.offArm.rotation.x=-1.1;
    } else if(style==='tend'){
      period=1100;phase=(local%period)/period;
      person.body.position.y=-.14;person.body.rotation.x=.35;
      person.leftLeg.rotation.x=person.rightLeg.rotation.x=-.5;
      person.arm.rotation.x=-1.2+Math.sin(phase*Math.PI*2)*.35;person.offArm.rotation.x=-1-Math.sin(phase*Math.PI*2)*.3;
    } else if(style==='lift'){
      period=1300;phase=(local%period)/period;
      const bend=Math.sin(phase*Math.PI);
      person.body.rotation.x=.45*bend;person.body.position.y=-.08*bend;
      person.arm.rotation.x=person.offArm.rotation.x=-.4-bend;
      person.carry.visible=local>WORK*.45;
      if(person.carry.visible)person.carry.material.color.set(carryLook[trip.task]);
    } else if(style==='radio'||style==='inspect'){
      period=700;phase=(local%period)/period;
      person.arm.rotation.x=-2.3+Math.sin(local*.012)*.15;person.offArm.rotation.x=-.9;
      if(style==='radio')cyan.emissiveIntensity=1.1+Math.sin(local*.02)*.6;
    } else {
      person.g.visible=local<300||local>WORK-300; // step inside the habitat for the shift
    }
    if(period){
      const beat=Math.floor(local/period);
      const hitPhase=style==='dig'?.95:style==='hammer'?.9:.5;
      if(phase>=hitPhase&&trip.lastBeat!==beat){
        trip.lastBeat=beat;
        const colors=burstColors[style==='dig'?trip.task:style];
        if(style==='dig'){
          burst(strikeAt(.35),colors,{count:10,speed:2.8,lift:2.8});
          const chunks=depositChunks[trip.task==='mine'?'ore':'ice'].filter(chunk=>chunk.visible);
          const hitChunk=chunks[beat%Math.max(1,chunks.length)];
          if(hitChunk)hitChunk.userData.shake=now;
        } else if(style==='hammer')burst(strikeAt(.75),colors,{count:7,speed:2.2,lift:2,gravity:5,size:.7});
        else if(style==='tend')burst(strikeAt(.75),colors,{count:5,speed:.8,lift:1.4,gravity:-.4,size:.9});
        else if(style==='lift')burst(strikeAt(.12),colors,{count:6,speed:1.6,lift:.8,gravity:3});
        else burst(style==='radio'?new T.Vector3(5,3.2,-6.4):strikeAt(1.3),colors,{count:5,speed:.9,lift:1.8,gravity:-.6,size:.7});
        listener('strike',{crew:trip.id,task:trip.task});
      }
    }
  }
  let state=null,focused=null;
  // Tall phone screens see less of the outpost sideways, so the overview camera pulls back.
  const overview=()=>new T.Vector3(24,20,30).multiplyScalar(Math.min(1.8,Math.max(1,.95/camera.aspect)));
  const resize=()=>{const {clientWidth:w,clientHeight:h}=host;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(!focused&&!cameraTrip)camera.position.copy(overview());}};
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
    for(const [id,trip] of expeditions){
      const person=workers[id],elapsed=now-trip.start,{walk,work,total}=trip.timing;
      if(elapsed>=total){endExpedition(id);continue;}
      person.pick.visible=styles[trip.task]==='dig'&&elapsed>=walk&&elapsed<walk+work;
      person.hammer.visible=styles[trip.task]==='hammer'&&elapsed>=walk&&elapsed<walk+work;
      if(elapsed<walk){walkRoute(trip.path,elapsed/walk,person,now);person.carry.visible=false;}
      else if(elapsed<walk+work)animateWork(trip,person,elapsed-walk,now);
      else {
        if(!trip.collected){trip.collected=true;person.g.visible=true;collect(trip);}
        walkRoute(trip.back,(elapsed-walk-work)/walk,person,now);
        person.carry.visible=!!carryLook[trip.task];
        if(person.carry.visible){person.carry.material.color.set(carryLook[trip.task]);person.arm.rotation.x=person.offArm.rotation.x=-1.25;}
      }
    }
    if(![...expeditions.values()].some(trip=>styles[trip.task]==='radio'))cyan.emissiveIntensity=state?.relay?1.4:.55;
    for(const p of particles){
      if(!p.visible)continue;
      const age=(now-p.userData.born)/p.userData.ttl;
      if(age>=1){p.visible=false;continue;}
      const dt=1/60;
      p.userData.v.y-=p.userData.gravity*dt;
      p.position.addScaledVector(p.userData.v,dt);
      if(p.position.y<.04){p.position.y=.04;p.userData.v.multiplyScalar(.4);p.userData.v.y=Math.abs(p.userData.v.y)*.3;}
      p.rotation.x+=p.userData.spin*dt;p.rotation.y+=p.userData.spin*dt;
      p.scale.setScalar(Math.max(.01,p.userData.size*(1-age*age)));
    }
    for(const chunk of [...depositChunks.ore,...depositChunks.ice]){
      if(!chunk.userData.shake)continue;
      const since=now-chunk.userData.shake;
      if(since<220){const k=(1-since/220)*.08;chunk.position.set(chunk.userData.base.x+(Math.random()-.5)*k,chunk.userData.base.y+(Math.random()-.5)*k,chunk.userData.base.z+(Math.random()-.5)*k);}
      else {chunk.position.copy(chunk.userData.base);chunk.userData.shake=0;}
    }
    if(move.active) {
      const t=Math.min(1,(now-move.start)/4200);
      const position=t<.5?t*2:2-t*2;
      const path=position*position*(3-2*position);
      rover.position.lerpVectors(origin,move.target,path);
      rover.rotation.y=Math.atan2(move.target.x-origin.x,move.target.z-origin.z)+(t>.5?Math.PI:0);
      move.active=t<1;
      if(t>=1) crates.forEach((crate,i)=>crate.visible=!state?.caches[i?'parts':'air']);
    }
    for(const [id,ring] of Object.entries(rings)){
      const hover=highlighted.hover===id,available=highlighted.available.includes(id);
      ring.visible=hover||available;
      if(!ring.visible)continue;
      ring.material.color.set(hover?'#ffe2a8':'#b4e08f');
      ring.material.opacity=hover?.95:.45+Math.sin(now*.005)*.2;
      ring.scale.setScalar(hover&&!reduced.matches?1+Math.sin(now*.012)*.04:1);
    }
    if(!cameraTrip)controls.target.lerp(desiredTarget,reduced.matches?1:.08);
    controls.update();
    for(const [id,[x,y,z]] of Object.entries(anchors)){
      const el=markers.querySelector('[data-location='+id+']');
      if(!el) continue;
      projected.set(x,y,z).project(camera);
      const visible=projected.z<1&&Math.abs(projected.x)<.95&&Math.abs(projected.y)<.86;
      el.hidden=!visible;
      el.style.left=(50+projected.x*50)+'%';
      el.style.top=(50-projected.y*50)+'%';
    }
    renderer.render(scene,camera);
  });
  return {
    focus(id) {
      const point=anchors[id];
      desiredTarget=point ? new T.Vector3(point[0],Math.max(.8,point[1]*.36),point[2]) : new T.Vector3(0,0,0);
      focused=point?id:null;
      const close=point?new T.Vector3(6.4,5.2,8):overview();
      const to=point?desiredTarget.clone().add(close):close;
      if(reduced.matches) {camera.position.copy(to);controls.target.copy(desiredTarget);cameraTrip=null;}
      else cameraTrip={start:performance.now(),from:camera.position.clone(),to,targetFrom:controls.target.clone()};
    },
    stationAt(x,y) {
      const bounds=renderer.domElement.getBoundingClientRect();
      if(x<bounds.left||x>bounds.right||y<bounds.top||y>bounds.bottom)return null;
      pointer.set((x-bounds.left)/bounds.width*2-1,-(y-bounds.top)/bounds.height*2+1);
      raycaster.setFromCamera(pointer,camera);
      return raycaster.intersectObjects(proxies,false)[0]?.object.userData.station??null;
    },
    highlight(next={}) {highlighted={available:next.available??[],hover:next.hover??null};},
    preview(id) {
      for(const [member,person] of Object.entries(workers))person.ring.visible=member===id;
    },
    listen(fn){listener=fn;},
    tripTime(task,crew){return reduced.matches?0:timing(workers[crew]?crew:'pip',task).total;},
    finish(id){
      if(id){endExpedition(id);return;}
      for(const key of [...expeditions.keys()])endExpedition(key);
      move.active=false;rover.position.copy(origin);rover.rotation.y=0;
      crates.forEach((crate,i)=>crate.visible=!state?.caches[i?'parts':'air']);
      showDeposits(state?.deposits);
    },
    project(station){
      const point=anchors[station];
      if(!point)return null;
      projected.set(point[0],point[1]*.8,point[2]).project(camera);
      if(projected.z>1)return null;
      return {x:(projected.x+1)/2*host.clientWidth,y:(1-projected.y)/2*host.clientHeight};
    },
    update(next,animate=false) {
      const previous=state;
      state=next;
      const storm=next?.hazard==='storm';
      scene.fog.color.set(storm?'#754f58':'#8f6459');
      sun.intensity=storm?1.7:3.7;
      warm.emissiveIntensity=next?.habitat?1.45:.42;
      cyan.emissiveIntensity=next?.relay?1.4:.55;
      pendingDeposits=next?.deposits??null;
      // A new day, a retry, or leaving the mission sends everyone home.
      if(!next||next.day!==previous?.day||(next.workday?.completed.length??0)<(previous?.workday?.completed.length??0)){
        for(const key of [...expeditions.keys()])endExpedition(key,true);
      }
      const actionResult=next?.phase==='plan'?next.fieldResult:null;
      const task=animate?actionResult?.selected.id:null;
      if(task&&!reduced.matches){
        const id=workers[actionResult.assignee]?actionResult.assignee:'pip';
        if(expeditions.has(id))endExpedition(id);
        const path=routeFor(id,task);
        expeditions.set(id,{id,task,path,back:[...path].reverse(),start:performance.now(),timing:timing(id,task),collected:false,lastBeat:-1});
        frameTrip(path);
      }
      // Rocks stay in place until a crew member actually breaks them loose.
      if(!digging())showDeposits(next?.deposits);
      if(task&&!reduced.matches&&['air','parts'].includes(task)){
        move.start=performance.now();move.active=true;
        // The rover swings round the south side of the cargo pad to load the crate.
        move.target.set(8,0,8.7);
      } else if(!move.active) crates.forEach((crate,i)=>crate.visible=!next?.caches[i?'parts':'air']);
    },
  };
}
