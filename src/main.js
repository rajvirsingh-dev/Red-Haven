import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-700.css';
import './style.css';
import {createOutpost} from './scene.js';
import {setSound,playSound} from './audio.js';
import {store} from './store.js';
import {plans,chapters,choices,forecast,achievements,checkPlan,flareFor,shelterPower,source,flareCount,warningTomorrow,contractCompleted} from './mission.js';

const icons={
  air:'<path d="M8 15H4a2 2 0 1 1 0-4h12a3 3 0 1 0-3-3M7 18h7a2.5 2.5 0 1 1-2.5 2.5"/>',
  power:'<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
  food:'<path d="M4 4v6a3 3 0 0 0 6 0V4M7 4v16m10 0V4c-3 1-4 4-4 8h4"/>',
  sound:'<path d="M3 9v6h4l5 4V5L7 9H3m12 0a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18m-9-9c4 4 4 14 0 18-4-4-4-14 0-18Z"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  reset:'<path d="M3 11a9 9 0 1 1 2 7m-2-7V5m0 6h6"/>',
};
const icon=name=>`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const stations={
  spacecraft:['Landed spacecraft','Your first shelter and the starting point for the ten-day assignment.'],
  habitat:['Habitat','A working habitat reduces the power cost of maximum oxygen production.'],
  greenhouse:['Greenhouse','Fund the grow lights to advance crops. The first harvest is available on day seven.'],
  solar:['Solar array','Solar panels recharge stored power each day. Output depends on your arrival site and the training scenario.'],
  relay:['Earth relay','Send a message and receive a reply after a simulated round trip. Repair the relay for the full mission report.'],
  cargo:['Cargo depot','Pip can retrieve each cargo cache once. Recovery uses two units of power.'],
};
const fields={priority:'Mission objective',site:'Surface arrival route',cargo:'Carrier configuration',budget:'Budget allowance',payload:'Optional payload'};
let draft={priority:'shelter',site:'plain',cargo:'battery',budget:'standard',payload:'none'};
let task='reserve', support=3, selectedStation='', display='home';
let enableSound=store.getState().sound;

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
      <div class="markers">${Object.entries(stations).map(([key,[name]])=>`<button data-location="${key}" hidden>${name}</button>`).join('')}</div>
      <div class="station-note" hidden></div>
      <div class="map-help">Drag to orbit <span>·</span> Scroll or pinch to zoom <span>·</span> Select a station to inspect</div>
      <div class="map-fallback">The visual map needs WebGL. The mission controls remain available.</div>
    </section>
    <aside class="panel" id="panel" aria-label="Mission controls"></aside>
  </main>
  <dialog id="science"><div class="dialog-top"><h2>Science log</h2><button data-act="close">Close</button></div><div id="science-content"></div></dialog>
  <dialog id="restart"><h2>Start a new mission?</h2><p>This will replace your saved mission when you confirm a new plan.</p><div class="row"><button data-act="cancel-new">Cancel</button><button class="primary" data-act="new-confirm">Plan new mission</button></div></dialog>`;
const panel=document.querySelector('#panel');
const map=document.querySelector('.map');
const note=document.querySelector('.station-note');
const science=document.querySelector('#science');
const restart=document.querySelector('#restart');
const scene=createOutpost(map,document.querySelector('.markers'));

function button(act,label,{disabled=false,secondary=false}={}) {
  return `<button class="${secondary?'secondary':'primary'}" data-act="${act}" ${disabled?'disabled':''}>${label} ${secondary?'':icon('arrow')}</button>`;
}
function name(field,id){return plans[field].find(option=>option.id===id)?.name??id;}
function heading(title,body){return `<h1>${title}</h1><p class="intro">${body}</p>`;}
function select(field) {
 return `<label class="select-label">${fields[field]}<select data-field="${field}">${plans[field].map(p=>`<option value="${p.id}" ${draft[field]===p.id?'selected':''}>${p.name}</option>`).join('')}</select>
 <small>${plans[field].find(p=>p.id===draft[field]).desc}</small></label>`;
}
function metric(kind,label,value,limit) {
  return `<div class="metric"><span>${icon(kind)} ${label}</span><strong>${value}<small>/ ${limit}</small></strong>
  <meter aria-label="${label}" min="0" max="${limit}" value="${value}"></meter></div>`;
}
function resources(s){
  return `<div class="resources">${metric('air','Oxygen',s.oxygen,16)}${metric('power','Power',s.energy,s.capacity)}${metric('food','Meals',s.food,20)}</div>
    <div class="inventory"><span><strong>${s.parts}</strong> spare parts</span><span>Shelter <strong>${s.shield?'reinforced':'basic'}</strong></span><span>Crop <strong>${s.crop}/3</strong></span></div>`;
}
function step(s){
 return `<div class="sol"><span>${s.mode==='story'?'STORY MISSION':'ENDLESS / CONTRACT '+Math.ceil((s.day-10)/10)}</span><strong>DAY ${s.day}${s.mode==='story'?' / 10':''}</strong></div>
  <div class="timeline" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i class="${i<((s.day-1)%10)+1?'filled':''}"></i>`).join('')}</div>`;
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
    +button('extend','Continue to Endless Mode');
}
function view() {
 const {mission:s,sound}=store.getState();
 const soundButton=document.querySelector('[data-act=sound]');
 soundButton.setAttribute('aria-pressed',String(sound));
 soundButton.innerHTML=icon('sound')+' <span>Sound '+(sound?'on':'off')+'</span>';
 const active=document.activeElement;
 const fieldFocus=active?.dataset.field;
 const taskFocus=active?.dataset.task;
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
 } else if(s) {
   const header=step(s)+resources(s);
   if(s.phase==='review') panel.innerHTML=header+missionReview(s);
   else if(s.phase==='contract'){
     const last=s.log.slice(-10);
     panel.innerHTML=header+heading('Keep the Light On','The crew changes, but the outpost stays. Choose the objective for your next ten-day contract.')
       +(last.length&&s.day>11?`<p>Last contract: ${contractCompleted(s)?'objective achieved':'objective incomplete'} · ${last.length} days completed. Latest task: ${last.at(-1).task}.</p>`:'')
       +`<div class="contracts">${plans.priority.map(p=>`<button data-contract="${p.id}"><strong>${p.name}</strong><small>${p.desc}</small></button>`).join('')}</div>`;
   } else if(s.phase==='failed'){
     panel.innerHTML=header+heading('Training paused',s.result.failure)+`<p class="mission-call">“This is why we train. Let’s look at the decision that left you short.” — Reyes</p>`+button('retry','Retry this day');
   } else if(s.phase==='debrief'){
     const {result:r}=s;
     panel.innerHTML=header+heading('Day '+s.day+' complete',r.selected.name+' used '+r.cost+' power. Solar panels generated '+r.solar+' power.')
       +(r.communications?`<div class="notice"><strong>Earth reply · +32 simulated minutes</strong><p>${r.message}</p></div>`:'')
       +(r.fault?`<p>Battery fault reduced storage capacity by ${r.fault}.</p>`:'')
       +(r.supply?'<p>Scheduled delivery added power, oxygen, meals, and parts.</p>':'')
       +button('next',s.day===10&&s.mode==='story'?'Review mission':'Continue to day '+(s.day+1));
   } else {
     const options=choices(s);
     if(!options.some(x=>x.id===task)) task='reserve';
     const result=forecast(s,{action:task,support});
     const chapter=s.mode==='story'?chapters[s.day-1]:s.hazard==='storm'?['Shelter drill','Mika','Keep the team inside while we ride out today’s training exercise.']:s.hazard==='fault'?['Battery maintenance','Mika','Our battery capacity is under pressure. Review today’s energy forecast.']:['Outpost operations','Pip','Check your reserves and choose one task. Supply deliveries are scheduled every five days.'];
     panel.innerHTML=header+heading(chapter[0],chapter[2])+`<p class="speaker">— ${chapter[1]} · ${name('priority',s.priority)}</p>`+bulletin(s)
       +`<label class="select-label">Life support<select id="support" data-field="support" aria-label="Life support">${[0,1,2,3].map(x=>`<option value="${x}" ${x===support?'selected':''}>${x} power → ${x} oxygen${x===3&&!s.habitat?' (+1 startup power)':''}</option>`).join('')}</select><small>Your crew uses 2 oxygen and 1 meal per day.</small></label>
         <fieldset><legend>Choose one task</legend><div class="tasks">${options.map(x=>`<button type="button" data-task="${x.id}" aria-pressed="${x.id===task}"><strong>${x.name}</strong><small>${x.power} power${x.parts?' · '+x.parts+' parts':''}</small><span>${x.desc}</span></button>`).join('')}</div></fieldset>
         <div class="forecast ${!result.valid||result.failure?'bad':''}" role="status"><strong>Night forecast</strong><p>${result.valid?(result.failure||('Oxygen '+result.next.oxygen+' · Power '+result.next.energy+' · Meals '+result.next.food+' · Parts '+result.next.parts)):result.message}</p></div>`
       +button('commit','Confirm the day',{disabled:!result.valid});
   }
 }
 if(fieldFocus) panel.querySelector('[data-field='+fieldFocus+']')?.focus({preventScroll:true});
 if(taskFocus) panel.querySelector('[data-task='+taskFocus+']')?.focus({preventScroll:true});
}
function moveTo(next) {
 display=next;
 view();
 panel.scrollTop=0;
 panel.querySelector('h1')?.setAttribute('tabindex','-1');
 panel.querySelector('h1')?.focus({preventScroll:true});
}
function defaults(){task='reserve';support=3;}
store.subscribe((state,previous)=>{
  scene.update(state.mission,state.mission?.phase==='debrief'&&previous.mission?.phase==='plan');
  view();
});
scene.update(store.getState().mission);
view();

document.addEventListener('change',e=>{
 const field=e.target.dataset.field;
 if(!field) return;
 if(field==='support') support=Number(e.target.value);
 else draft[field]=e.target.value;
 playSound('select');view();
});
document.addEventListener('click',e=>{
 const clicked=e.target.closest('button');
 if(!clicked) return;
 const {act,location,task:taskId,contract}=clicked.dataset;
 const api=store.getState();
 if(taskId){task=taskId;playSound('select');view();return;}
 if(contract) {defaults();api.continue(contract);moveTo('mission');return;}
 if(location){
  scene.focus(location);selectedStation=location;
  note.innerHTML=`<strong>${stations[location][0]}</strong><p>${stations[location][1]}</p><button data-act="hide-note" aria-label="Close station details">Close</button>`;
  note.hidden=false;playSound('select');return;
 }
 if(!act) return;
 if(enableSound&&act!=='sound') setSound(true);
 switch(act) {
  case 'home': moveTo('home'); break;
  case 'resume': defaults();moveTo('mission');break;
  case 'new': if(api.mission) restart.showModal();else moveTo('setup');break;
  case 'cancel-new': restart.close();break;
  case 'new-confirm': restart.close();moveTo('setup');break;
  case 'start':
   defaults();api.start(draft);playSound('success');moveTo('mission');break;
  case 'commit': {
   api.commit({action:task,support});
   const s=store.getState().mission;
   playSound(s.phase==='failed'?'warning':task==='report'?'message':'work');
   moveTo('mission');break;
  }
  case 'retry':defaults();api.retry();moveTo('mission');break;
  case 'next': {
   defaults();api.continue();
   const s=store.getState().mission;
   playSound(s.phase==='review'?'success':s.hazard==='storm'?'warning':'select');
   moveTo('mission');break;
  }
  case 'extend':defaults();api.extend();playSound('success');moveTo('mission');break;
  case 'science':scienceLog(api.mission);science.showModal();break;
  case 'close':science.close();break;
  case 'hide-note':note.hidden=true;document.querySelector('[data-location='+selectedStation+']')?.focus();break;
  case 'reset-view':scene.focus(null);note.hidden=true;break;
  case 'sound':
   enableSound=!api.sound;api.setSound(enableSound);setSound(enableSound);playSound('select');break;
 }
});
