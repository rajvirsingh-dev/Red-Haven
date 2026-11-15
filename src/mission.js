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

export function choices(s) {
  if(s.day === 5 || s.hazard === 'storm') {
    return [action('reserve','Shelter and conserve','Bring everyone inside. Spend extra power maintaining the shelter if it is unfinished.'),
      action('remote','Send Pip to inspect','Keep the crew inside and inspect the panels remotely. Reduces the battery fault on day nine.',2)];
  }
  const options = [reserve];
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
    caches:{air:false,parts:false},hazard:'clear',log:[],result:null};
}

const max = (value,limit) => Math.min(limit,Math.max(0,value));
export function forecast(state,{action:id,support}) {
  const selected=choices(state).find(item=>item.id===id);
  if(!selected || ![0,1,2,3].includes(support)) return {valid:false,message:'Choose a task and a life-support setting.'};
  const storm=state.hazard==='storm';
  const clearYield=state.site==='plain'?8:6;
  const solar=storm ? clearYield-3 : clearYield;
  const fault=state.hazard==='fault'&&!state.inspection ? 5 : 0;
  const capacity=Math.max(8,state.capacity-fault);
  const shelter=storm&&!state.shield ? shelterPower(state):0;
  const essential=support===3&&!state.habitat ? 1:0;
  const available=Math.min(capacity,state.energy+solar);
  const cost=selected.power+support+essential+shelter;
  if(cost>available || selected.parts>state.parts) return {valid:false,message:'This plan needs more power or spare parts.'};
  const supply=state.mode==='endless'&&state.day%5===0;
  const next = {
    capacity, energy:max(available-cost+(supply?4:0),capacity),
    oxygen:max(state.oxygen + support - 2 + (id==='air'?5:0)+(supply?2:0),16),
    food:max(state.food-1+(id==='harvest'?3:0)+(supply?6:0),20),
    parts:max(state.parts-selected.parts+(id==='parts'?4:0)+(supply?3:0),16),
    crop:id==='harvest'&&state.mode==='endless'?0:Math.min(3,state.crop+(id==='grow'?1:0)),
    harvested:state.harvested||id==='harvest', habitat:state.habitat||id==='repair',
    relay:state.relay||id==='relay', shield:state.shield||id==='brace',
    inspection:state.inspection||id==='remote', report:state.report||(id==='report'&&state.relay),
    beacon:id==='beacon'?'continuous':id==='pulse'?'pulsed':state.beacon,
    priority:id.startsWith('plan-')?id.slice(5):state.priority,
    caches:{air:state.caches.air||id==='air',parts:state.caches.parts||id==='parts'},
  };
  const failure=next.oxygen===0?'Oxygen reached zero. Allocate more power to life support.':
    next.food===0?'The final meal is gone. Plan an earlier harvest or start with more supplies.':null;
  const message=id==='report'?(state.relay?'Mission report delivered.':'Short status received. Repair the relay to deliver a full report.'):'';
  return {valid:true, solar,cost,supply,fault,shelter,selected,next,failure,message,
    communications:id==='report'?{sentMinute:0,oneWayMinutes:16,replyMinute:32}:null};
}

export function resolveDay(state,input) {
  if(state.phase!=='plan') return state;
  const result=forecast(state,input);
  if(!result.valid) return state;
  return {...state,...result.next,phase:result.failure?'failed':'debrief', result,
    checkpoint:state,log:[...state.log.slice(state.mode==='endless'?-29:0),{day:state.day,action:result.selected.id,task:result.selected.name,
      oxygen:result.next.oxygen,energy:result.next.energy,food:result.next.food,
      priority:result.next.priority}]};
}

export function retry(s) { return s.phase==='failed' ? s.checkpoint : s; }

export function nextDay(s, priority) {
  if(s.phase==='contract') return {...s,phase:'plan',priority};
  if(s.phase!=='debrief') return s;
  const reset={...s,result:null,checkpoint:null};
  if(s.mode==='story'&&s.day===10) return {...reset,phase:'review'};
  reset.day++;
  reset.phase=s.mode==='endless'&&reset.day%10===1?'contract':'plan';
  reset.hazard=conditions(reset);
  return reset;
}

export function extend(s) {
  if(s.phase!=='review') return s;
  return {...s, mode:'endless',phase:'contract',day:11,hazard:'clear',food:Math.min(20,s.food+6),
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
