import archive from './flares.json' with {type:'json'};

export const plans = {
  priority: [
    {id:'shelter', name:'Dependable Shelter', desc:'Repair the habitat and reinforce the storm shelter.'},
    {id:'garden', name:'First Garden', desc:'Harvest the greenhouse crop and save its research log.'},
    {id:'signal', name:'Signal Home', desc:'Repair the Earth relay and deliver a mission report.'},
  ],
  site: [
    {id:'plain', name:'Open Plain', desc:'Generate 2 more power each day. Reinforcing the shelter costs more.'},
    {id:'ridge', name:'Crater Ridge', desc:'Reinforce the shelter with fewer materials and less power.'},
  ],
  cargo: [
    {id:'battery', name:'Battery Carrier', desc:'Start with 7 more power and 8 more battery capacity, with only 2 spare parts.'},
    {id:'supplies', name:'Life Support Kit', desc:'Start with 5 more oxygen and 4 more meals.'},
    {id:'materials', name:'Construction Kit', desc:'Start with 5 more parts for repairs and shielding.'},
  ],
  budget: [
    {id:'standard',name:'Standard',desc:'24 credits for the delivery.',limit:24},
    {id:'lean',name:'Lean',desc:'20 credits for the delivery.',limit:20},
  ],
  payload: [
    {id:'none',name:'Baseline cargo',desc:'Keep the carrier’s standard load.'},
    {id:'oxygen',name:'Extra oxygen',desc:'+3 oxygen. Adds 6 kg and 2 credits.'},
    {id:'tools',name:'Tool crate',desc:'+2 parts. Adds 8 kg and 3 credits.'},
    {id:'module',name:'Relay module',desc:'Repairs the relay on arrival. Adds 12 kg, 4 credits, and draws 3 startup power. Requires Open Plain.'},
  ],
};

const carrier = {
  battery:{mass:78,price:19,energy:15,capacity:26,oxygen:6,food:12,parts:2},
  supplies:{mass:66,price:14,energy:8,capacity:18,oxygen:11,food:16,parts:4},
  materials:{mass:74,price:16,energy:8,capacity:18,oxygen:6,food:12,parts:9},
};
const routes = {plain:{limit:92,price:1},ridge:{limit:84,price:2}};
const addOns = {
  none:{mass:0,price:0,draw:0,oxygen:0,parts:0},
  oxygen:{mass:6,price:2,draw:0,oxygen:3,parts:0},
  tools:{mass:8,price:3,draw:0,oxygen:0,parts:2},
  module:{mass:12,price:4,draw:3,oxygen:0,parts:0},
};

export function checkPlan(plan) {
  const kit=carrier[plan.cargo], route=routes[plan.site], extra=addOns[plan.payload??'none'];
  const budget=plans.budget.find(option=>option.id===(plan.budget??'standard'))?.limit;
  if(!kit||!route||!extra||!budget||!plans.priority.some(p=>p.id===plan.priority)) return [];
  const mass=kit.mass+extra.mass;
  const spend=kit.price+route.price+extra.price;
  return [
    {name:'Payload mass',value:mass+' / '+route.limit+' kg',ok:mass<=route.limit,fix:'Choose a lighter carrier, remove the extra payload, or use Open Plain.'},
    {name:'Mission budget',value:spend+' / '+budget+' credits',ok:spend<=budget,fix:'Select Standard allowance, or choose a lower-cost manifest.'},
    {name:'Startup power',value:(4+extra.draw)+' / '+kit.energy+' power required',ok:4+extra.draw<=kit.energy,fix:'Choose a higher-charge carrier or remove the relay module.'},
    {name:'Connector',value:plan.payload==='module'?'High-power relay':'Standard equipment',ok:plan.payload!=='module'||plan.site==='plain',fix:'Use Open Plain for the relay connector, or remove the module.'},
  ];
}

export const source = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-05-08&endDate=2024-05-17';
export const flareCount = archive.length;
export function flareFor(state) {
  const day = state.mode==='story'?5:state.day + (state.day%5===3?1:0);
  return state.mode==='story' ? archive[0] : archive[hash(state.seed,day)%archive.length];
}
export function shelterPower(state) {
  const observation=flareFor(state).classType;
  return observation.startsWith('X') ? (Number(observation.slice(1))>=2?4:3) : 2;
}
export function warningTomorrow(state) {
  return state.mode==='story' ? state.day===4 : conditions({...state,day:state.day+1})==='storm';
}

export const chapters = [
  ['A Light in the Window','Mika','The spacecraft is down safely. Redhaven is still dark. We have ten days to make it ready for the next crew.'],
  ['Footprints in Red Dust','Pip','I found the missing cargo. The rover can carry one crate today. Do you want emergency air or parts?'],
  ['A Small Green Promise','Sol','These plants started growing before we arrived. Keep their lights on and they could be ready by day seven.'],
  ['The Sun Sends a Warning','Reyes','A historical solar observation sets up our storm exercise. Use today to prepare your shelter.'],
  ['Everyone Inside','Mika','The storm exercise has begun. Keep the crew inside. Pip can still inspect the panels remotely.'],
  ['The Plan We Have Now','Reyes','This is our scheduled review. Send the latest report or use the time to revise your mission priority.'],
  ['Something Fresh','Sol','Check our harvest. A bowl of greens would be a welcome change from packaged meals.'],
  ['A Voice Across the Crater','Pip','The transport is looking for our beacon. We can leave it on or send shorter bursts.'],
  ['One More Night','Mika','A battery fault has cut our storage. Save enough power for the air system before you finish tomorrow’s work.'],
  ['Redhaven Answers','Reyes','The transport is at the crater rim. Make your final handover, and tell us what you learned.'],
];

const action = (id,name,desc,power=0,parts=0) => ({id,name,desc,power,parts});
const reserve = action('reserve','Conserve power','Pause optional work and save power for the next day.');
const lights = action('grow','Light the greenhouse','Advance the crop by one stage.',2);
const radio = action('report','Send status report','Send a message and wait for a reply during this turn.',2);
const repair = action('repair','Restore habitat','Repair the habitat and reduce tomorrow’s life-support demand.',2,2);
const relay = action('relay','Repair Earth relay','Open the long-range link for your mission report.',2,2);
const harvest = action('harvest','Harvest and log','Add 3 meals and record the experiment.',1);

export const crew = [
  {id:'mika',name:'Mika',role:'Engineer',color:'#ee9866',specialty:'Repairs, shielding, and mining cost 1 less power.',tasks:['repair','maintain','relay','brace','mine']},
  {id:'sol',name:'Sol',role:'Botanist',color:'#acd29b',specialty:'Growing, harvesting, and ice recovery cost 1 less power.',tasks:['grow','harvest','ice']},
  {id:'pip',name:'Pip',role:'Field robot',color:'#94cbd6',specialty:'Cargo recovery and remote inspection cost 1 less power. Mining uses no suit oxygen.',tasks:['air','parts','remote']},
];
export function crewMember(id='pip') { return crew.find(member=>member.id===id); }
export function taskStation(id) {
  if(['mine','ice'].includes(id)) return id==='mine'?'ore':'ice';
  if(['air','parts'].includes(id)) return 'cargo';
  if(['grow','harvest'].includes(id)) return 'greenhouse';
  if(['relay','report','beacon','pulse'].includes(id)) return 'relay';
  if(id==='remote') return 'solar';
  return 'habitat';
}
export function supplyStatus(state) {
  return state.deposits??{ore:3,ice:3};
}
export function milestoneProgress(s) {
  return [
    {name:'Ready for the storm',done:s.habitat&&s.shield},
    {name:'Fresh food on Mars',done:s.harvested},
    {name:'A signal to Earth',done:s.relay&&s.report},
    {name:'Field explorer',done:(s.collected??0)>=3},
  ];
}

export function choices(s) {
  if(s.day === 5 || s.hazard === 'storm') {
    return [action('reserve','Shelter and conserve','Bring everyone inside. Spend extra power maintaining the shelter if it is unfinished.'),
      action('remote','Send Pip to inspect','Keep the crew inside and inspect the panels remotely. Reduces the battery fault on day nine.',2)];
  }
  const options = [reserve];
  if((s.integrity??100)<100)options.push(action('maintain','Maintain the outpost','Restore 20 integrity using 2 spare parts.',2,2));
  const deposits=supplyStatus(s);
  if(deposits.ore>0) options.push(action('mine','Mine the ore seam','Collect 2 spare parts. Uses 1 suit oxygen for a human crew member.',2));
  if(deposits.ice>0) options.push(action('ice','Collect and process ice','Recover 3 oxygen after processing. Uses 1 suit oxygen for a human crew member.',2));
  if(!s.habitat) options.push(repair);
  if(!s.relay && s.day >= 3) options.push(relay);
  if(!s.shield) options.push(action('brace','Reinforce shelter','Prepare shielding before the solar storm.',s.site==='ridge'?1:2,s.site==='ridge'?2:3));
  if(s.crop < 3) options.push(lights);
  else if(s.day>=7&&(s.mode==='endless'||!s.harvested)) options.push(harvest);
  if(s.day>=2 && s.day!==5) {
    if(!s.caches.air) options.push(action('air','Recover air crate','Drive the rover to collect 5 oxygen. This cache can be collected once.',2));
    if(!s.caches.parts) options.push(action('parts','Recover parts crate','Drive the rover to collect 4 parts. This cache can be collected once.',2));
  }
  if(s.day>=6) options.push(radio);
  if(s.day===6) for(const priority of plans.priority.filter(p=>p.id!==s.priority)) {
    options.push(action('plan-'+priority.id,'Replan: '+priority.name,'Spend this turn reviewing the new priority with your crew.'));
  }
  if(s.day===8) options.push(action('beacon','Run the beacon','Guide the transport with a continuous signal.',4),
    action('pulse','Pulse the beacon','Use short bursts to save power while the transport navigates.',1));
  return options;
}

function hash(seed, day) {
  let n = Math.imul(seed ^ day, 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}

function conditions(s) {
  return s.mode==='story' ? (s.day===5?'storm': s.day===9?'fault':'clear')
    : s.day % 5 === 4 ? (hash(s.seed,s.day)%2?'storm':'fault') : 'clear';
}

export function startMission(plan, seed=147) {
  const {site,cargo,priority,budget='standard',payload='none'} = plan;
  const checks=checkPlan(plan);
  if(!checks.length||checks.some(check=>!check.ok)) throw new Error('Resolve all mission plan checks first.');
  const {energy,capacity,oxygen,food,parts}=carrier[cargo];
  const extra=addOns[payload];
  return {mode:'story',phase:'plan',day:1,seed,site,cargo,priority,originalPriority:priority,
    budget,payload,energy:energy-extra.draw,capacity,oxygen:oxygen+extra.oxygen,food,parts:parts+extra.parts,crop:1,harvested:false,
    habitat:false,relay:payload==='module',shield:false,inspection:false,report:false,beacon:null,
    caches:{air:false,parts:false},deposits:{ore:3,ice:3},experience:{mika:0,sol:0,pip:0},
    collected:0,commendations:[],integrity:100,hazard:'clear',log:[],result:null};
}

const max = (value,limit) => Math.min(limit,Math.max(0,value));
export function forecast(state,{action:id,support,assignee='pip'}) {
  const selected=choices(state).find(item=>item.id===id);
  const member=crewMember(assignee);
  if(!member) return {valid:false,message:'Assign Mika, Sol, or Pip to this task.'};
  if(id==='remote'&&assignee!=='pip') return {valid:false,message:'Only Pip can inspect outdoors during the shelter exercise.'};
  if(!selected || ![0,1,2,3].includes(support)) return {valid:false,message:'Choose a task and a life-support setting.'};
  const storm=state.hazard==='storm';
  const clearYield=state.site==='plain'?8:6;
  const solar=state.solarApplied?0:storm ? clearYield-3 : clearYield;
  const fault=state.solarApplied?0:state.hazard==='fault'&&!state.inspection ? 5 : 0;
  const capacity=Math.max(8,state.capacity-fault);
  const shelter=!state.workSession&&storm&&!state.shield ? shelterPower(state):0;
  const essential=support===3&&!state.habitat ? 1:0;
  const available=Math.min(capacity,state.energy+solar);
  const discount=member.tasks.includes(id)&&selected.power>0?1:0;
  const taskPower=selected.power-discount;
  const cost=taskPower+support+essential+shelter;
  const collecting=['mine','ice'].includes(id);
  const suitOxygen=collecting&&assignee!=='pip'?1:0;
  if(cost>available || selected.parts>state.parts) return {valid:false,message:'This plan needs more power or spare parts.'};
  const supply=!state.workSession&&state.mode==='endless'&&state.day%5===0;
  const damage=[];
  if(!state.workSession){
    if(storm&&!state.shield)damage.push({amount:18,reason:'Unreinforced storm shelter strained the outpost systems.'});
    if(state.hazard==='fault'&&!state.inspection)damage.push({amount:10,reason:'An uninspected battery fault damaged the power system.'});
    if(state.oxygen+support-2<3)damage.push({amount:8,reason:'Low oxygen reserves strained the emergency air system.'});
  }
  const integrity=max((state.integrity??100)+(id==='maintain'?20:0)-damage.reduce((sum,item)=>sum+item.amount,0),100);
  const next = {
    integrity,
    capacity, energy:max(available-cost+(supply?4:0),capacity),
    oxygen:max(state.oxygen + support - (state.workSession?0:2) - suitOxygen + (id==='air'?5:0)+(id==='ice'?3:0)+(supply?2:0),16),
    food:max(state.food-(state.workSession?0:1)+(id==='harvest'?3:0)+(supply?6:0),20),
    parts:max(state.parts-selected.parts+(id==='parts'?4:0)+(id==='mine'?2:0)+(supply?3:0),16),
    crop:id==='harvest'&&state.mode==='endless'?0:Math.min(3,state.crop+(id==='grow'?1:0)),
    harvested:state.harvested||id==='harvest', habitat:state.habitat||id==='repair',
    relay:state.relay||id==='relay', shield:state.shield||id==='brace',
    inspection:state.inspection||id==='remote', report:state.report||(id==='report'&&state.relay),
    beacon:id==='beacon'?'continuous':id==='pulse'?'pulsed':state.beacon,
    priority:id.startsWith('plan-')?id.slice(5):state.priority,
    caches:{air:state.caches.air||id==='air',parts:state.caches.parts||id==='parts'},
    deposits:{ore:supplyStatus(state).ore-(id==='mine'?1:0),ice:supplyStatus(state).ice-(id==='ice'?1:0)},
    experience:{...(state.experience??{mika:0,sol:0,pip:0}),[assignee]:(state.experience?.[assignee]??0)+(id==='reserve'?0:1)},
    collected:(state.collected??0)+(['mine','ice','air','parts'].includes(id)?1:0),
  };
  const failure=integrity===0?'Outpost integrity reached zero. Prepare shielding, inspect the battery, and schedule maintenance.':
    next.oxygen===0?'Oxygen reached zero. Allocate more power to life support.':
    next.food===0?'The final meal is gone. Plan an earlier harvest or start with more supplies.':null;
  const message=id==='report'?(state.relay?'Mission report delivered.':'Short status received. Repair the relay to deliver a full report.'):'';
  const earned=milestoneProgress(next).filter(item=>item.done&&!(state.commendations??[]).includes(item.name)).map(item=>item.name);
  next.commendations=[...(state.commendations??[]),...earned];
  return {valid:true, solar,cost,taskPower,discount,suitOxygen,assignee,earned,damage,supply,fault,shelter,selected,next,failure,message,
    communications:id==='report'?{sentMinute:0,oneWayMinutes:16,replyMinute:32}:null};
}

export function resolveDay(state,input) {
  if(state.phase!=='plan') return state;
  const result=forecast(state,input);
  if(!result.valid) return state;
  return {...state,...result.next,phase:result.failure?'failed':'debrief', result,
    checkpoint:state,log:[...state.log.slice(state.mode==='endless'?-29:0),{day:state.day,action:result.selected.id,task:result.selected.name,
      oxygen:result.next.oxygen,energy:result.next.energy,food:result.next.food,
      integrity:result.next.integrity,assignee:result.assignee,priority:result.next.priority}]};
}

export function retry(s) { return s.phase==='failed' ? s.checkpoint : s; }

export function nextDay(s, priority) {
  if(s.phase==='contract') return {...s,phase:'plan',priority,deposits:{ore:3,ice:3}};
  if(s.phase!=='debrief') return s;
  const reset={...s,result:null,checkpoint:null,dayStart:null,workday:null,solarApplied:false};
  if(s.mode==='story'&&s.day===10) return {...reset,phase:'review'};
  reset.day++;
  reset.phase=s.mode==='endless'&&reset.day%10===1?'contract':'plan';
  reset.hazard=conditions(reset);
  return reset;
}

export function extend(s) {
  if(s.phase!=='review') return s;
  return {...s, mode:'endless',phase:'contract',day:11,hazard:'clear',dayStart:null,workday:null,solarApplied:false,food:Math.min(20,s.food+6),
    oxygen:Math.min(16,s.oxygen+2),parts:Math.min(16,s.parts+3),energy:Math.min(s.capacity,s.energy+4)};
}

export function achievements(s) {
  return [
    ['Everyone Home',s.mode==='endless'||s.phase==='review'],
    ['A Place to Return To',s.habitat&&s.shield],
    ['The First Garden',s.harvested],
    ['A Voice Across Mars',s.relay&&s.report],
  ];
}

export function contractCompleted(s) {
  const recent=s.log.slice(-10);
  if(s.priority==='garden') return recent.some(day=>day.action==='harvest');
  if(s.priority==='signal') return s.relay&&recent.some(day=>day.action==='report');
  return s.habitat&&s.shield;
}

export function prepareDay(state) {
  if(state.phase!=='plan'||state.workday)return state;
  const solar=state.hazard==='storm'?(state.site==='plain'?5:3):(state.site==='plain'?8:6);
  const fault=state.hazard==='fault'&&!state.inspection?5:0;
  const capacity=Math.max(8,state.capacity-fault);
  return {...state,capacity,energy:Math.min(capacity,state.energy+solar),solarApplied:true,
    dayStart:state,workday:{completed:[],solar,fault},fieldResult:null};
}

export function forecastTask(state,id,assignee) {
  if(state.phase!=='plan'||!state.workday||state.workday.completed.length>=2)
    return {valid:false,message:'Your two work slots are complete. Check life support and end the day.'};
  if(state.workday.completed.some(item=>item.id===id)&&id!=='reserve')
    return {valid:false,message:'This task is already complete today. Choose another assignment.'};
  const result=forecast({...state,workSession:true},{action:id,support:0,assignee});
  if(result.valid&&result.next.oxygen===0)
    return {valid:false,message:'Keep at least 1 oxygen in reserve for this expedition. Assign Pip or collect ice first.'};
  return result;
}

export function executeTask(state,id,assignee) {
  const result=forecastTask(state,id,assignee);
  if(!result.valid)return state;
  return {...state,...result.next,fieldResult:result,workday:{...state.workday,
    completed:[...state.workday.completed,{id,name:result.selected.name,assignee,power:result.taskPower,communications:result.communications,message:result.message}]}};
}

export function finishWorkday(state,support) {
  if(state.phase!=='plan'||!state.workday||state.workday.completed.length<2)return state;
  const resolved=resolveDay(state,{action:'reserve',support});
  if(resolved===state)return state;
  const completed=state.workday.completed;
  const taskNames=completed.map(task=>task.name).join(' + ');
  resolved.result={...resolved.result,solar:state.workday.solar,fault:state.workday.fault,
    cost:resolved.result.cost+completed.reduce((sum,item)=>sum+item.power,0),
    selected:{...resolved.result.selected,name:taskNames},earned:state.fieldResult?.earned??[]};
  const transmitted=completed.find(task=>task.communications);
  if(transmitted)Object.assign(resolved.result,{communications:transmitted.communications,message:transmitted.message});
  resolved.log=resolved.log.map((entry,index)=>index===resolved.log.length-1?
    {...entry,task:taskNames,action:completed.find(task=>task.id==='report'||task.id==='harvest')?.id??completed[0].id,assignments:completed}:entry);
  resolved.checkpoint=state.dayStart;
  return resolved;
}
