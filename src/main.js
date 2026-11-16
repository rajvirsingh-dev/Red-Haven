import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-700.css';
import './style.css';
import './crew.css';
import './activities.css';
import './hud.css';
import {createOutpost} from './scene.js';
import {setSound,playSound,setVolumes,setAudioContext,taskCue} from './audio.js';
import {store} from './store.js';
import {portrait,tutorial,captainInbox,objectiveChecklist} from './interaction.js';
import {playActivity} from './activities.js';
import {installCrewDrag} from './drag.js';
import {openingStory} from './story.js';
import {objectiveSteps} from './objectives.js';
import {plans,chapters,choices,forecast,achievements,checkPlan,flareFor,shelterPower,source,flareCount,warningTomorrow,contractCompleted,crew,crewMember,taskStation,supplyStatus,forecastTask,milestoneProgress} from './mission.js';

const icons={
  air:'<path d="M8 15H4a2 2 0 1 1 0-4h12a3 3 0 1 0-3-3M7 18h7a2.5 2.5 0 1 1-2.5 2.5"/>',
  power:'<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
  food:'<path d="M4 4v6a3 3 0 0 0 6 0V4M7 4v16m10 0V4c-3 1-4 4-4 8h4"/>',
  sound:'<path d="M3 9v6h4l5 4V5L7 9H3m12 0a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18m-9-9c4 4 4 14 0 18-4-4-4-14 0-18Z"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  reset:'<path d="M3 11a9 9 0 1 1 2 7m-2-7V5m0 6h6"/>',
  flag:'<path d="M5 21V4m0 0h11l-2 4 2 4H5"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  trophy:'<path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Zm0 2H4a3 3 0 0 0 3 4m10-4h3a3 3 0 0 1-3 4"/>',
  alert:'<path d="M12 3 2 20h20L12 3Zm0 6v5m0 3v.5"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  parts:'<path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 0v20M3 7l9 5 9-5"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
};
const icon=name=>`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const stations={
  spacecraft:['Landed spacecraft','Your first shelter and the starting point for the ten-day assignment.'],
  habitat:['Habitat','A working habitat reduces the power cost of maximum oxygen production.'],
  greenhouse:['Greenhouse','Fund the grow lights to advance crops. The first harvest is available on day seven.'],
  solar:['Solar array','Solar panels recharge stored power each day. Output depends on your arrival site and the training scenario.'],
  relay:['Earth relay','Send a message and receive a reply after a simulated round trip. Repair the relay for the full mission report.'],
  cargo:['Cargo depot','Pip can retrieve each cargo cache once. Recovery uses two units of power.'],
  ore:['Ore seam','Mine 2 spare parts per expedition. Three collections per mission or endless contract. Human expeditions use 1 suit oxygen.'],
  ice:['Ice deposit','Collect and process ice into 3 oxygen. Three collections per mission or endless contract. Human expeditions use 1 suit oxygen.'],
};
const crewTags={mika:'Repair · Mine',sol:'Plants · Ice',pip:'Cargo · Solar'};
const fields={priority:'Mission objective',site:'Surface arrival route',cargo:'Carrier configuration',budget:'Budget allowance',payload:'Optional payload'};
let draft={priority:'shelter',site:'plain',cargo:'battery',budget:'standard',payload:'none'};
let task='reserve', support=3, selectedStation='', display='home';
let enableSound=store.getState().sound;
let assignee='mika',replayStoryStep=null,sheetStation=null,sheetFocus=null,toastTimer=0,drawer=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let lesson=0;
try{lesson=Number(localStorage.getItem('redhaven-tutorial')??0);}catch{}

document.querySelector('#app').innerHTML=`
  <header class="bar"><button class="wordmark" data-act="home" aria-label="Redhaven home"><span class="logo"></span> REDHAVEN</button>
    <span class="bar-caption">MARS SURFACE MISSION</span>
    <div class="utilities"><button data-act="science">${icon('globe')} <span>Science log</span></button>
    <button data-act="sound" aria-pressed="false">${icon('sound')} <span>Sound off</span></button></div>
  </header>
  <main class="layout">
    <section class="map" aria-label="Three-dimensional Redhaven outpost">
      <div class="map-heading"><span class="live"></span> REDHAVEN OUTPOST</div>
      <div class="map-controls"><button data-act="reset-view" aria-label="Reset camera focus">${icon('reset')}</button></div>
      <div class="hud" hidden>
        <div class="hud-day"></div>
        <div class="hud-resources" id="mission-strip"></div>
        <nav class="hud-side" aria-label="Mission logs"></nav>
        <div class="hud-toast" role="status" aria-live="polite"></div>
        <div class="station-sheet" hidden></div>
        <div class="hud-bottom"><button class="skip-trips" data-act="skip-work" hidden>Skip ⏩</button><div class="crew-bar" aria-label="Crew"></div><button class="end-day" data-act="end-day"></button></div>
      </div>
      <div class="markers">${Object.entries(stations).map(([key,[name]])=>`<button data-location="${key}" hidden>${name}</button>`).join('')}</div>
      <div class="station-note" hidden></div>
      <div class="map-help">Drag to orbit <span>·</span> Scroll or pinch to zoom <span>·</span> Tap a building to inspect</div>
      <div class="map-fallback">The visual map needs WebGL. The mission controls remain available.</div>
    </section>
    <aside class="panel" id="panel" aria-label="Mission screen"></aside>
  </main>
  <dialog id="science"><div class="dialog-top"><h2>Science log</h2><button data-act="close">Close</button></div><div id="science-content"></div></dialog>
  <dialog id="hud-drawer" class="drawer"></dialog>
  <dialog id="night" aria-labelledby="night-title"></dialog>
  <dialog id="restart"><h2>Start a new mission?</h2><p>This will replace your saved mission when you confirm a new plan.</p><div class="row"><button data-act="cancel-new">Cancel</button><button class="primary" data-act="new-confirm">Plan new mission</button></div></dialog>`;
const panel=document.querySelector('#panel');
const map=document.querySelector('.map');
const note=document.querySelector('.station-note');
const science=document.querySelector('#science');
const restart=document.querySelector('#restart');
const scene=createOutpost(map,document.querySelector('.markers'));
const hud=document.querySelector('.hud');
const sheet=document.querySelector('.station-sheet');
const drawerDialog=document.querySelector('#hud-drawer');
const nightDialog=document.querySelector('#night');
const toast=document.querySelector('.hud-toast');
document.querySelector('.utilities').insertAdjacentHTML('beforeend','<button data-act="audio-settings" aria-label="Music and effects settings">Mix</button>');
document.querySelector('.utilities').insertAdjacentHTML('afterbegin','<button data-act="story" aria-label="Read the mission story">Story</button>');
map.insertAdjacentHTML('beforeend','<div class="coach" hidden></div><div class="pops" aria-hidden="true"></div>');
document.querySelector('#app').insertAdjacentHTML('beforeend','<dialog id="audio-settings"><div class="dialog-top"><h2>Mission audio</h2><button data-act="close-audio">Close</button></div><p>An original ambient score, mining tools, ice collection, crew assignments, and achievement chimes.</p><label class="mixer">Background music<input type="range" min="0" max="1" step=".05" data-volume="music" aria-label="Background music volume"></label><label class="mixer">Sound effects<input type="range" min="0" max="1" step=".05" data-volume="effects" aria-label="Sound effects volume"></label></dialog>');
document.querySelector('#app').insertAdjacentHTML('beforeend','<dialog id="mission-story" aria-labelledby="story-title"></dialog>');
const storyDialog=document.querySelector('#mission-story');
storyDialog.addEventListener('cancel',e=>{e.preventDefault();finishStory();});
setVolumes(store.getState().music,store.getState().effects);

function finishStory(){
  if(replayStoryStep!==null){replayStoryStep=null;view();}
  else store.getState().advanceBriefing(openingStory.length);
  if(display==='mission')scene.focus(null);
}
function showStory(s,playing){
  const step=replayStoryStep??(playing&&s.mode==='story'&&s.day===1?store.getState().briefingStep:null);
  if(step===null||step>=openingStory.length){if(storyDialog.open)storyDialog.close();return;}
  const beat=openingStory[step];
  storyDialog.innerHTML='<div class="story-top"><span>ARRIVAL BRIEFING · '+(step+1)+' / '+openingStory.length+'</span><button data-act="story-skip">'+(replayStoryStep!==null?'Close story':'Skip briefing')+'</button></div>'+
    '<div class="story-speaker">'+portrait(beat.role)+'<span>'+beat.speaker+'</span></div><h2 id="story-title">'+beat.title+'</h2><p class="story-text">'+beat.text+'</p><blockquote>“'+beat.quote+'”</blockquote><p class="story-fact">'+beat.fact+'</p>'+
    '<div class="story-actions"><div class="story-dots" aria-hidden="true">'+openingStory.map((_,i)=>'<i class="'+(i===step?'current':'')+'"></i>').join('')+'</div>'+button('story-next',step===openingStory.length-1?'Enter Redhaven':'Continue briefing')+'</div>';
  if(!storyDialog.open)storyDialog.showModal();
  storyDialog.querySelector('[data-act=story-next]').focus({preventScroll:true});
}

function button(act,label,{disabled=false,secondary=false}={}) {
  return `<button class="${secondary?'secondary':'primary'}" data-act="${act}" ${disabled?'disabled':''}>${label} ${secondary?'':icon('arrow')}</button>`;
}
function name(field,id){return plans[field].find(option=>option.id===id)?.name??id;}
function heading(title,body){return `<h1>${title}</h1><p class="intro">${body}</p>`;}
function select(field) {
 return `<label class="select-label">${fields[field]}<select data-field="${field}">${plans[field].map(p=>`<option value="${p.id}" ${draft[field]===p.id?'selected':''}>${p.name}</option>`).join('')}</select>
 <small>${plans[field].find(p=>p.id===draft[field]).desc}</small></label>`;
}
function bulletin(s){
  const flare=flareFor(s);
  if(!(warningTomorrow(s)||s.hazard==='storm')) return '';
  return `<div class="notice"><strong>${s.hazard==='storm'?'Shelter exercise':'Space weather briefing'}</strong>
    <p><a href="${flare.link}" target="_blank" rel="noreferrer">NASA archive: ${flare.classType} flare · ${flare.beginTime.slice(0,10)}</a></p>
    <p>Training rule: sheltering costs ${shelterPower(s)} extra power without reinforcement. ${s.hazard==='storm'?'Keep your crew inside today.':'Reinforce your shelter to avoid this cost during the next storm.'}</p></div>`;
}
function scienceLog(s){
 const flare=flareFor(s??{mode:'story'});
 document.querySelector('#science-content').innerHTML=`
   <h3>Solar activity and shelter</h3><p>Your training scenario uses a historical solar-flare record from NASA’s DONKI archive. The game’s shelter costs are simplified training rules. Flare class alone can’t tell us the radiation dose at a Mars outpost.</p>
   <dl><dt>Observation</dt><dd>${flare.classType} · ${flare.beginTime} UTC</dd><dt>Instrument</dt><dd>${flare.instruments.map(i=>i.displayName).join(', ')}</dd><dt>Record ID</dt><dd>${flare.flrID}</dd></dl>
   <p><a href="${flare.link}" target="_blank" rel="noreferrer">Open the NASA record</a> · <a href="${source}" target="_blank" rel="noreferrer">View all ${flareCount} archived records</a></p>
   <h3>Growing food</h3><p>NASA’s Veggie experiment grew lettuce for 33 days before harvest. Redhaven’s crop was already growing when your crew arrived. <a href="https://ntrs.nasa.gov/citations/20160004060" target="_blank" rel="noreferrer">NASA Veggie experiment</a></p>
   <h3>Waiting for Earth</h3><p>The training scenario uses a 16-minute one-way signal delay. The return signal takes another 16 minutes. The game compresses those minutes into a daily turn. <a href="https://ntrs.nasa.gov/citations/20220013418" target="_blank" rel="noreferrer">NASA Mars communications analysis</a></p>`;
}
function missionReview(s){
  const medals=achievements(s);
  const priorities={shelter:1,garden:2,signal:3};
  const fulfilled=medals[priorities[s.priority]][1];
  return heading('Mission report','The transport is here. Your crew is safe and ready to hand over Redhaven.')
    +`<div class="review"><p><b>Original objective</b> ${name('priority',s.originalPriority)}<br><b>Final objective</b> ${name('priority',s.priority)}<br><b>Outcome</b> ${fulfilled?'Objective achieved':'Crew survived · objective incomplete'}</p>
      <p><b>Surface plan</b> ${name('site',s.site)} · ${name('cargo',s.cargo)}</p><p><b>Transport</b> ${s.beacon==='continuous'?'Reached Redhaven early using the continuous beacon.':s.beacon==='pulsed'?'Arrived on time with help from the beacon pulses.':'Found Redhaven with its onboard navigation.'}</p>
      <ul class="medals">${medals.map(([label,won])=>`<li class="${won?'achieved':''}">${won?'Earned':'Open'} <b>${label}</b></li>`).join('')}</ul>
      <details><summary>All ten daily decisions</summary><ol>${s.log.map(row=>`<li>${row.task} · ${row.oxygen} oxygen · ${row.energy} power · ${row.food} meals</li>`).join('')}</ol></details></div>`
    +objectiveChecklist(s)+button('extend','Continue to Endless Mode');
}
function nightForecast(s){
 const r=forecast(s,{action:'reserve',support});
 return r.valid?(r.failure||('Oxygen '+r.next.oxygen+' · Power '+r.next.energy+' · Meals '+r.next.food+' · Integrity '+r.next.integrity+'%'+(r.damage.length?' · Damage '+r.damage.map(item=>item.amount+' ('+item.reason+')').join(' '):''))):r.message;
}
function chapterFor(s){
 return s.mode==='story'?chapters[s.day-1]:s.hazard==='storm'?['Shelter drill','Mika','Keep the team inside while we ride out today’s training exercise.']:s.hazard==='fault'?['Battery maintenance','Mika','Our battery capacity is under pressure. Review today’s energy forecast.']:['Outpost operations','Pip','Check your reserves and choose your crew jobs. Supply deliveries are scheduled every five days.'];
}
function inspectStation(location){
 if(!location){scene.focus(null);note.hidden=true;return;}
 scene.focus(location);selectedStation=location;
 note.innerHTML='<strong>'+stations[location][0]+'</strong><p>'+stations[location][1]+'</p><button data-act="hide-note" aria-label="Close station details">Close</button>';
 note.hidden=false;playSound('select');
}
function setLesson(value){
 lesson=value;
 try{localStorage.setItem('redhaven-tutorial',String(value));}catch{}
}
function showTutorial(s){
 const tip=tutorial(s,lesson,lesson<0);
 if(!tip)return;
 const coach=document.querySelector('.coach');
 coach.hidden=false;
 coach.innerHTML=portrait(tip.role)+'<div><strong>'+crewMember(tip.role).name+' · '+tip.title+'</strong><p>'+tip.text+'</p><div class="coach-actions">'+(tip.next?'<button data-act="tutorial-next">Got it</button>':'')+'<button data-act="tutorial-skip">Skip tutorial</button></div></div>';
 document.querySelector(tip.target)?.classList.add('tutorial-highlight');
}

// ---- Outpost HUD: day badge, resource bars, log buttons, crew cards, and the building action sheet.
// Each crew member on a trip is busy until they walk home; the rest of the crew stays available.
const working=new Map();
const crewBusy=id=>(working.get(id)?.until??0)>Date.now();
const anyoneOut=()=>[...working.keys()].some(crewBusy);
const lastValues={},bumps={};
const planning=()=>{const s=store.getState().mission;return display==='mission'&&s?.phase==='plan'?s:null;};
function say(text){
 if(!text)return;
 toast.textContent=text;toast.classList.add('show');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),4200);
}
function jobsAt(s,station){return choices(s).filter(option=>taskStation(option.id)===station);}
function workableAt(s,station,member){return jobsAt(s,station).filter(option=>forecastTask(s,option.id,option.id==='remote'?'pip':member).valid);}
function stationsFor(s,member){return Object.keys(stations).filter(id=>workableAt(s,id,member).length);}
function bar(kind,label,value,max){
 const fill=max?Math.max(0,Math.min(100,value/max*100)):Math.min(100,value*10);
 // Flash the bar green or red for a moment whenever its value changes.
 if(lastValues[kind]!==undefined&&lastValues[kind]!==value)bumps[kind]={dir:value>lastValues[kind]?'gain':'loss',at:Date.now()};
 lastValues[kind]=value;
 const bump=bumps[kind]&&Date.now()-bumps[kind].at<900?' '+bumps[kind].dir:'';
 return `<div class="res res-${kind}${max&&value/max<=.25?' low':''}${bump}" title="${label}"><span class="res-bar"><i style="width:${fill}%"></i><b>${value}${max?`<small> / ${max}</small>`:''}</b></span><span class="res-icon">${icon(kind)}</span><span class="sr-only">${label}</span></div>`;
}
function renderHud(s){
 const completed=s.workday?.completed.length??0,integrity=s.integrity??100;
 hud.querySelector('.hud-day').innerHTML=`<div class="day-badge"><small>DAY</small><strong>${s.day}</strong><small>${s.mode==='story'?'of 10':'endless'}</small></div>
   <div class="day-meta"><div class="job-pips" aria-label="${completed} of 2 jobs done">${[0,1].map(i=>`<i class="${i<completed?'done':''}"></i>`).join('')}<span>${completed} / 2 jobs</span></div>
   <div class="integrity-bar${integrity<60?' low':''}"><span>Integrity <b>${integrity}%</b></span><i><em style="width:${integrity}%"></em></i></div></div>`;
 hud.querySelector('.hud-resources').innerHTML=bar('air','Oxygen',s.oxygen,16)+bar('power','Power',s.energy,s.capacity)+bar('food','Meals',s.food,20)+bar('parts','Spare parts',s.parts,0)
   +`<div class="res-tags"><span>Shelter <b>${s.shield?'reinforced':'basic'}</b></span><span>Crop <b>${s.crop}/3</b></span></div>`;
 const steps=objectiveSteps(s),earned=milestoneProgress(s).filter(item=>item.done).length;
 hud.querySelector('.hud-side').innerHTML=`<button data-drawer="objective">${icon('flag')}<span>Goal</span><b>${steps.filter(step=>step.done).length}/${steps.length}</b></button>
   <button data-drawer="inbox">${icon('mail')}<span>Inbox</span></button>
   <button data-drawer="milestones">${icon('trophy')}<span>Medals</span><b>${earned}/4</b></button>
   ${bulletin(s)?`<button class="alert" data-drawer="weather">${icon('alert')}<span>Weather</span></button>`:''}
   <button data-act="reset-view">${icon('reset')}<span>View</span></button>`;
 const done=completed>=2;
 hud.querySelector('.crew-bar').innerHTML=crew.map(member=>{
   const out=crewBusy(member.id);
   return `<button class="crew-card${out?' out':''}" data-crew="${member.id}" aria-pressed="${member.id===assignee&&!out}" ${out||done?'disabled':''} title="${member.specialty}">
   ${portrait(member.id)}<strong>${member.name}</strong><small>${out?working.get(member.id).label:crewTags[member.id]}</small><span class="xp" aria-label="${s.experience?.[member.id]??0} jobs completed">★${s.experience?.[member.id]??0}</span>${out?'<span class="trip" aria-hidden="true"><i></i></span>':''}</button>`;}).join('');
 hud.querySelector('.skip-trips').hidden=!anyoneOut();
 const end=hud.querySelector('.end-day');
 end.disabled=!done;
 end.innerHTML=icon('moon')+`<strong>End Day ${s.day}</strong><small>${done?(anyoneOut()?'Crew heading home':'Plan the night'):(2-completed)+' job'+(completed===1?'':'s')+' left'}</small>`;
 tickTrips();
 for(const marker of document.querySelectorAll('.markers [data-location]')){
   const open=workableAt(s,marker.dataset.location,assignee).length;
   marker.dataset.jobs=open&&!done?open:'';
 }
 renderSheet(s);
}
function jobCard(s,option,member){
 const who=option.id==='remote'?'pip':member;
 const result=forecastTask(s,option.id,who);
 const special=crewMember(who).tasks.includes(option.id);
 const power=result.valid?result.taskPower:Math.max(0,option.power-(special?1:0));
 const left=option.id==='mine'?supplyStatus(s).ore:option.id==='ice'?supplyStatus(s).ice:null;
 const ok=result.valid&&!crewBusy(who);
 return `<button class="job-card${special?' special':''}${sheetFocus===option.id?' focus':''}" data-task="${option.id}" ${ok?'':'disabled'}>
   <strong>${option.name}</strong>
   <span class="job-cost"><span title="Power">${icon('power')}${power}</span>${option.parts?`<span title="Spare parts">${icon('parts')}${option.parts}</span>`:''}${result.valid&&result.suitOxygen?`<span title="Suit oxygen">${icon('air')}${result.suitOxygen}</span>`:''}${left!==null?`<span class="left">${left} left</span>`:''}</span>
   <small>${crewBusy(who)?crewMember(who).name+' is still out on a job. Pick someone else.':result.valid?option.desc:result.message}</small>
   ${special?`<em>${crewMember(who).name}’s specialty</em>`:''}${option.id==='remote'&&member!=='pip'?'<em>Pip goes</em>':''}</button>`;
}
function renderSheet(s){
 document.body.classList.toggle('sheet-open',!!sheetStation&&!!planning());
 if(!sheetStation){sheet.hidden=true;return;}
 const jobs=jobsAt(s,sheetStation),done=(s.workday?.completed.length??0)>=2;
 sheet.hidden=false;
 sheet.innerHTML=`<div class="sheet-head"><div><strong>${stations[sheetStation][0]}</strong><small>${stations[sheetStation][1]}</small></div><button data-act="close-sheet" aria-label="Close building actions">${icon('close')}</button></div>
   ${jobs.length&&!done?`<div class="sheet-crew"><span>Send</span>${crew.map(member=>`<button data-pick-crew="${member.id}" aria-pressed="${member.id===assignee}" class="${crewBusy(member.id)?'out':''}">${portrait(member.id)}<span>${member.name}</span></button>`).join('')}</div>`:''}
   <div class="sheet-jobs">${done?'<p class="sheet-empty">Both jobs are done today. Press End Day when you are ready.</p>':jobs.length?jobs.map(option=>jobCard(s,option,assignee)).join(''):'<p class="sheet-empty">No crew jobs here today.</p>'}</div>`;
}
function openSheet(station,member=assignee,focusTask=null){
 const s=planning();
 if(!s)return;
 if(crewBusy(member)){const free=crew.find(person=>!crewBusy(person.id));if(free)member=free.id;}
 assignee=member;sheetStation=station;sheetFocus=focusTask;
 scene.preview(assignee);playSound('select');
 if(lesson===1)setLesson(2);
 view();
 sheet.querySelector(focusTask?'[data-task="'+focusTask+'"]':'[data-task]:not(:disabled)')?.focus({preventScroll:true});
}
function closeSheet(){sheetStation=null;sheetFocus=null;view();}
function sendTask(id,member=assignee){
 const s=planning();
 if(!s)return;
 const who=id==='remote'?'pip':member;
 if(crewBusy(who)){playSound('warning');say(crewMember(who).name+' is still out on a job. Send someone else, or skip the animation.');return;}
 const result=forecastTask(s,id,id==='remote'?'pip':member);
 if(!result.valid){playSound('warning');say(result.message);return;}
 assignee=id==='remote'?'pip':member;task=id;
 sheetStation=null;sheetFocus=null;
 scene.preview(assignee);playSound('assign');view();
 runTask();
}
function drawerHtml(kind,s){
 const close=`<button data-act="close-drawer" aria-label="Close">${icon('close')}</button>`;
 if(kind==='objective')return `<div class="dialog-top"><h2>Mission goal</h2>${close}</div>`+objectiveChecklist(s);
 if(kind==='milestones')return `<div class="dialog-top"><h2>Milestones</h2>${close}</div><ul class="medals">${milestoneProgress(s).map(item=>`<li class="${item.done?'achieved':''}">${item.done?'Earned':'Open'} <b>${item.name}</b></li>`).join('')}</ul>`;
 if(kind==='weather')return `<div class="dialog-top"><h2>Space weather</h2>${close}</div>`+bulletin(s);
 const chapter=chapterFor(s);
 return `<div class="dialog-top"><h2>${chapter[0]}</h2>${close}</div><p class="intro">${chapter[2]}</p><p class="speaker">— ${chapter[1]} · ${name('priority',s.priority)}</p>`+captainInbox(s);
}
function openDrawer(kind){
 const s=planning();
 if(!s)return;
 drawer=kind;drawerDialog.innerHTML=drawerHtml(kind,s);
 if(!drawerDialog.open)drawerDialog.showModal();
 playSound('select');
}
function renderNight(s){
 const result=forecast(s,{action:'reserve',support});
 nightDialog.innerHTML=`<div class="dialog-top"><h2 id="night-title">Night ${s.day}</h2><button data-act="close-night">Close</button></div>
   <p>Send power to life support to make oxygen. Your crew uses 2 oxygen and 1 meal overnight.</p>
   <div class="support-options" role="group" aria-label="Life support power">${[0,1,2,3].map(x=>`<button data-support="${x}" aria-pressed="${x===support}"><strong>${icon('power')}${x}</strong><span>→ ${x} oxygen</span>${x===3&&!s.habitat?'<small>+1 startup power</small>':''}</button>`).join('')}</div>
   <div class="forecast ${!result.valid||result.failure?'bad':''}" role="status"><strong>Morning forecast</strong><p>${nightForecast(s)}</p></div>`
   +button('commit','End Day '+s.day,{disabled:!result.valid});
}
function tickTrips(){
 if(tickTrips.frame)return;
 const step=()=>{
   tickTrips.frame=0;
   let active=false;
   for(const [id,trip] of working){
     const bar=hud.querySelector('[data-crew="'+id+'"] .trip i');
     const progress=Math.min(1,(Date.now()-trip.start)/(trip.until-trip.start));
     if(bar)bar.style.width=progress*100+'%';
     if(progress<1)active=true;
   }
   if(active)tickTrips.frame=requestAnimationFrame(step);
 };
 tickTrips.frame=requestAnimationFrame(step);
}
function finishAnimation(id){
 // The scene reports the haul before the trip is forgotten, so skipped trips still show their rewards.
 if(id===undefined){scene.finish();for(const key of [...working.keys()])clearTimeout(working.get(key).timer);working.clear();}
 else {scene.finish(id);clearTimeout(working.get(id)?.timer);working.delete(id);}
 if(!working.size&&planning())scene.focus(null); // back to the whole outpost so every building is in reach
 view();
}
const popSymbols={oxygen:['air','oxygen'],energy:['power','power'],food:['food','meals'],parts:['parts','parts'],integrity:['flag','integrity']};
function popRewards(station,changes){
 const at=scene.project(station);
 const layer=document.querySelector('.pops');
 if(!at||!changes.length||reduced.matches)return;
 changes.forEach(([key,amount],index)=>{
   const pop=document.createElement('div');
   pop.className='pop '+(amount>0?'gain':'loss');
   pop.style.left=at.x+'px';pop.style.top=at.y+'px';pop.style.animationDelay=index*140+'ms';
   pop.innerHTML=icon(popSymbols[key][0])+`<b>${amount>0?'+':''}${amount}${key==='integrity'?'%':''}</b><span>${popSymbols[key][1]}</span>`;
   layer.append(pop);setTimeout(()=>pop.remove(),1900+index*140);
 });
}
let lastStrike=0;
scene.listen((type,{crew:id,task:job,station})=>{
 if(type==='strike'&&performance.now()-lastStrike>260){lastStrike=performance.now();playSound(taskCue(job));}
 if(type==='collect'){
   const trip=working.get(id);
   if(trip){popRewards(station,trip.gains);playSound(trip.gains.length?'delivery':'select');if(trip.earned)playSound('milestone');}
 }
});
async function runTask(){
 const s=store.getState().mission;
 const member=assignee,job=task;
 const result=forecastTask(s,job,member);
 if(crewBusy(member)||!result.valid)return;
 const selected=choices(s).find(option=>option.id===job);
 const completedActivity=await playActivity(job);
 if(!completedActivity){say('Job canceled. No resources were spent.');return;}
 const current=store.getState().mission;
 if(!planning()||crewBusy(member)||!forecastTask(current,job,member).valid)return;
 const duration=scene.tripTime(job,member);
 say(result.earned.length?'Milestone earned · '+result.earned.join(', '):crewMember(member).name+' is on the way: '+selected.name.toLowerCase()+'.');
 store.getState().assign(job,member);
 const after=store.getState().mission;
 // What this trip changed: costs pop up now over the site, gains when the crew gets the haul.
 const changes=Object.keys(popSymbols).map(key=>[key,(after[key]??0)-(current[key]??0)]).filter(([,amount])=>amount);
 const station=taskStation(job);
 popRewards(station,changes.filter(([,amount])=>amount<0));
 if(duration){
   const start=Date.now();
   working.set(member,{start,until:start+duration,label:selected.name,gains:changes.filter(([,amount])=>amount>0),earned:result.earned.length>0,
     timer:setTimeout(()=>finishAnimation(member),duration)});
 } else {
   popRewards(station,changes.filter(([,amount])=>amount>0));playSound(taskCue(job));
 }
 view();
}
function view() {
 const {mission:s,sound}=store.getState();
 const playing=s&&display==='mission';
 const plan=playing&&s.phase==='plan';
 showStory(s,playing);
 document.body.classList.toggle('in-mission',!!playing);
 hud.hidden=!playing;
 hud.classList.toggle('planning',!!plan);
 panel.hidden=!!plan;
 document.querySelector('.layout').classList.toggle('with-card',!plan);
 if(!plan){sheetStation=null;document.body.classList.remove('sheet-open');if(nightDialog.open)nightDialog.close();if(drawerDialog.open)drawerDialog.close();}
 if(playing)renderHud(s);
 if(plan&&nightDialog.open)renderNight(s);
 if(plan&&drawerDialog.open)drawerDialog.innerHTML=drawerHtml(drawer,s);
 const coach=document.querySelector('.coach');
 document.querySelectorAll('.tutorial-highlight').forEach(el=>el.classList.remove('tutorial-highlight'));
 coach.hidden=true;
 const soundButton=document.querySelector('[data-act=sound]');
 soundButton.setAttribute('aria-pressed',String(sound));
 soundButton.innerHTML=icon('sound')+' <span>Sound '+(sound?'on':'off')+'</span>';
 const fieldFocus=document.activeElement?.dataset.field;
 map.classList.toggle('intro-map',display==='home');
 if(display==='home'){
   panel.innerHTML=`<div class="splash"><p class="mission-label">JUNIOR COMMANDER TRAINING</p>${heading('Ten Days<br>Until Dawn','Your spacecraft is already on Mars. Keep your crew safe and prepare Redhaven for the people who come after you.')}
      <p class="mission-call">“Earth can hear you. Help takes time. Your crew needs you now.”</p>
      ${s?button('resume','Resume the mission'):button('new','Plan the mission')}
      ${s?button('new','Start a new mission',{secondary:true}):''}
      <p class="footnote">10-day story · Endless mode after handover · NASA historical observations</p></div>`;
   return;
 }
 if (display==='setup'){
   const checks=checkPlan(draft);
   panel.innerHTML=heading('Plan your mission','Choose what you’ll bring from the landed spacecraft. Every kilogram and credit changes what your crew can do.')
     +`<div class="selectors">${Object.keys(fields).map(select).join('')}</div>
       <div class="checks"><h2>Delivery check</h2>${checks.map(c=>`<div class="check ${c.ok?'good':'bad'}"><span>${c.ok?'Pass':'Fix'} · ${c.name}</span><strong>${c.value}</strong>${c.ok?'':`<small>${c.fix}</small>`}</div>`).join('')}</div>`
     +button('start','Begin Day 1',{disabled:checks.some(c=>!c.ok)});
 } else if(s&&!plan) {
   if(s.phase==='review') panel.innerHTML=missionReview(s);
   else if(s.phase==='contract'){
     const last=s.log.slice(-10);
     panel.innerHTML=heading('Keep the Light On','The crew changes, but the outpost stays. Choose the objective for your next ten-day contract.')
       +(last.length&&s.day>11?`<p>Last contract: ${contractCompleted(s)?'objective achieved':'objective incomplete'} · ${last.length} days completed. Latest task: ${last.at(-1).task}.</p>`:'')
       +`<div class="contracts">${plans.priority.map(p=>`<button data-contract="${p.id}"><strong>${p.name}</strong><small>${p.desc}</small></button>`).join('')}</div>`;
   } else if(s.phase==='failed'){
     panel.innerHTML=heading('Training paused',s.result.failure)+`<p class="mission-call">“This is why we train. Let’s look at the decision that left you short.” — Reyes</p>`+button('retry','Retry this day');
   } else if(s.phase==='debrief'){
     const {result:r}=s;
     panel.innerHTML=heading('Day '+s.day+' complete',r.selected.name+' used '+r.cost+' power. Solar panels generated '+r.solar+' power.')
       +(r.communications?`<div class="notice"><strong>Earth reply · +32 simulated minutes</strong><p>${r.message}</p></div>`:'')
       +(s.workday?`<div class="crew-debrief">${s.workday.completed.map(item=>`<p>${portrait(item.assignee)}<strong>${crewMember(item.assignee).name}</strong> ${item.name}</p>`).join('')}</div>`:'')
       +((s.commendations??[]).length?`<p class="commendation">Commendations earned · ${s.commendations.join(' · ')}</p>`:'')
       +(r.fault?`<p>Battery fault reduced storage capacity by ${r.fault}.</p>`:'')
       +(r.supply?'<p>Scheduled delivery added power, oxygen, meals, and parts.</p>':'')
       +`<div class="damage-report"><strong>Outpost integrity · ${s.integrity??100}%</strong>${r.damage?.length?r.damage.map(item=>`<p>−${item.amount} · ${item.reason}</p>`).join(''):'<p>No system damage tonight.</p>'}</div>`
       +button('next',s.day===10&&s.mode==='story'?'Review mission':'Continue to day '+(s.day+1));
   }
 }
 if(fieldFocus) panel.querySelector('[data-field='+fieldFocus+']')?.focus({preventScroll:true});
 if(playing&&!storyDialog.open)showTutorial(s);
}
function moveTo(next) {
 display=next;
 view();
 panel.scrollTop=0;
 panel.querySelector('h1')?.setAttribute('tabindex','-1');
 if(!panel.hidden)panel.querySelector('h1')?.focus({preventScroll:true});
}
function defaults(){task='reserve';support=3;sheetStation=null;sheetFocus=null;}
store.subscribe((state,previous)=>{
  if(state.mission!==previous.mission){
    scene.update(state.mission,state.mission?.fieldResult!==previous.mission?.fieldResult&&state.mission?.phase==='plan'&&!!state.mission?.fieldResult);
    setAudioContext(state.mission?.hazard);
  }
  view();
});
scene.update(store.getState().mission);
view();

document.addEventListener('input',e=>{
 const channel=e.target.dataset.volume;
 if(!['music','effects'].includes(channel))return;
 store.getState().setVolume(channel,Number(e.target.value));
 setVolumes(store.getState().music,store.getState().effects);
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&sheetStation&&!document.body.classList.contains('assigning')&&!document.querySelector('dialog[open]')){e.preventDefault();closeSheet();}
});

// Drag a crew card onto a building (3D model or label) or straight onto a job card.
let dragAvailable=[];
installCrewDrag({
 canDrag:()=>!!planning()&&!storyDialog.open&&(planning().workday?.completed.length??0)<2,
 stationAt:(x,y)=>scene.stationAt(x,y),
 describe(member,target){
   const s=planning();
   if(!target||!s)return {ok:false,text:'Drop on a glowing building'};
   if(target.task){const option=choices(s).find(x=>x.id===target.task);return {ok:true,text:'Release to start '+(option?.name.toLowerCase()??'this job')};}
   const open=workableAt(s,target.station,member).length;
   return open?{ok:true,text:stations[target.station][0]+' · '+open+' job'+(open>1?'s':'')}:{ok:false,text:stations[target.station][0]+' · no jobs today'};
 },
 onStart(member){
   const s=planning();
   dragAvailable=s?stationsFor(s,member):[];
   scene.highlight({available:dragAvailable});scene.preview(member);
   for(const marker of document.querySelectorAll('.markers [data-location]'))marker.classList.toggle('no-jobs',!dragAvailable.includes(marker.dataset.location));
 },
 onHover:station=>scene.highlight({available:dragAvailable,hover:station}),
 onEnd(){
   scene.highlight({});dragAvailable=[];
   document.querySelectorAll('.markers .no-jobs').forEach(marker=>marker.classList.remove('no-jobs'));
 },
 onDrop(member,target){
   if(!planning())return;
   if(target.task){sendTask(target.task,member);return;}
   const s=planning();
   if(!jobsAt(s,target.station).length){
     assignee=member;scene.preview(member);playSound('warning');say(stations[target.station][0]+' has no crew jobs today.');view();return;
   }
   openSheet(target.station,member);
 },
});

// Tapping a building in the 3D view opens its actions, like tapping a building in a base-builder.
let tap=null;
map.addEventListener('pointerdown',e=>{if(e.target.tagName==='CANVAS'&&e.isPrimary)tap={x:e.clientX,y:e.clientY,t:performance.now()};});
map.addEventListener('pointerup',e=>{
 if(!tap||e.target.tagName!=='CANVAS')return;
 const moved=Math.hypot(e.clientX-tap.x,e.clientY-tap.y),quick=performance.now()-tap.t<450;tap=null;
 if(moved>6||!quick||document.body.classList.contains('assigning'))return;
 const station=scene.stationAt(e.clientX,e.clientY);
 if(!station){if(sheetStation)closeSheet();return;}
 if(planning())openSheet(station);else inspectStation(station);
});

document.addEventListener('change',e=>{
 const field=e.target.dataset.field;
 if(!field) return;
 draft[field]=e.target.value;
 playSound('select');view();
});
document.addEventListener('click',e=>{
 const clicked=e.target.closest('button');
 if(!clicked)return;
 const {act,location,task:taskId,contract}=clicked.dataset;
 const api=store.getState();
 if(clicked.dataset.objective){
   const id=clicked.dataset.objective,specialist=crew.find(member=>member.tasks.includes(id))?.id??assignee;
   drawerDialog.close();openSheet(taskStation(id),specialist,id);return;
 }
 if(clicked.dataset.drawer){openDrawer(clicked.dataset.drawer);return;}
 if(clicked.dataset.crew){
   assignee=clicked.dataset.crew;scene.preview(assignee);playSound('assign');
   if(!sheetStation)say(crewMember(assignee).name+' is ready. Tap a building, or drag the card onto one.');
   view();return;
 }
 if(clicked.dataset.pickCrew){assignee=clicked.dataset.pickCrew;scene.preview(assignee);playSound('assign');view();sheet.querySelector('[data-pick-crew='+assignee+']')?.focus();return;}
 if(clicked.dataset.support!==undefined){support=Number(clicked.dataset.support);playSound('select');renderNight(store.getState().mission);nightDialog.querySelector('[data-support="'+support+'"]')?.focus();return;}
 if(taskId){sendTask(taskId);return;}
 if(contract) {defaults();api.continue(contract);api.prepare();moveTo('mission');return;}
 if(location){
  if(planning())openSheet(location);else inspectStation(location);
  return;
 }
 if(!act) return;
 if(enableSound&&act!=='sound') setSound(true);
 switch(act) {
  case 'story':replayStoryStep=0;view();scene.focus(openingStory[0].station);break;
  case 'story-skip':finishStory();break;
  case 'story-next': {
   const next=(replayStoryStep??api.briefingStep)+1;
   if(next>=openingStory.length){finishStory();break;}
   if(replayStoryStep!==null){replayStoryStep=next;view();}else api.advanceBriefing(next);
   scene.focus(openingStory[next].station);playSound('message');break;
  }
  case 'home': finishAnimation();defaults();moveTo('home'); break;
  case 'resume': defaults();api.prepare();moveTo('mission');break;
  case 'new': if(api.mission) restart.showModal();else moveTo('setup');break;
  case 'cancel-new': restart.close();break;
  case 'new-confirm': restart.close();moveTo('setup');break;
  case 'start':
   defaults();setLesson(0);api.start(draft);api.prepare();playSound('success');moveTo('mission');scene.focus('spacecraft');break;
  case 'skip-work':finishAnimation();playSound('select');break;
  case 'tutorial-next':setLesson(lesson+1);view();break;
  case 'tutorial-skip':setLesson(-1);view();break;
  case 'close-sheet':closeSheet();break;
  case 'close-drawer':drawerDialog.close();break;
  case 'end-day':{const s=planning();if(!s)break;if(anyoneOut())finishAnimation();renderNight(s);nightDialog.showModal();playSound('select');break;}
  case 'close-night':nightDialog.close();break;
  case 'audio-settings': {
   const mixer=document.querySelector('#audio-settings');
   mixer.querySelector('[data-volume=music]').value=api.music;
   mixer.querySelector('[data-volume=effects]').value=api.effects;
   mixer.showModal();break;
  }
  case 'close-audio':document.querySelector('#audio-settings').close();break;
  case 'commit': {
   if(anyoneOut())finishAnimation();
   nightDialog.close();
   api.finish(support);
   const s=store.getState().mission;
   playSound(s.phase==='failed'?'warning':'work');
   moveTo('mission');break;
  }
  case 'retry':defaults();api.retry();api.prepare();moveTo('mission');break;
  case 'next': {
   defaults();api.continue();api.prepare();
   const s=store.getState().mission;
   playSound(s.phase==='review'?'success':s.hazard==='storm'?'warning':'select');
   moveTo('mission');scene.focus(null);break;
  }
  case 'extend':defaults();api.extend();playSound('success');moveTo('mission');break;
  case 'science':scienceLog(api.mission);science.showModal();break;
  case 'close':science.close();break;
  case 'hide-note':note.hidden=true;document.querySelector('[data-location='+selectedStation+']')?.focus();break;
  case 'reset-view':inspectStation(null);if(sheetStation)closeSheet();break;
  case 'sound':
   enableSound=!api.sound;api.setSound(enableSound);setSound(enableSound);playSound('select');break;
 }
});
