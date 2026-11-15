import {crew,crewMember,milestoneProgress,choices,plans} from './mission.js';
import {objectiveSteps} from './objectives.js';
import {captainMessage} from './messages.js';

export function captainInbox(state){
  const message=captainMessage(state);
  const eta=days=>days===0?'Today':days===1?'1 day':days+' days';
  return '<details class="captain-inbox" open><summary>Captain’s inbox · Day '+state.day+'</summary><p class="sender">'+message.received+'</p>'+
    '<p>'+message.text+'</p><div class="arrival-countdown"><div><span>'+message.supplyLabel+'</span><strong>'+eta(message.supplyEta)+'</strong></div>'+
    '<div><span>'+message.crewLabel+'</span><strong>'+eta(message.crewEta)+'</strong></div></div><small>'+message.detail+' '+message.crates+' cargo crate(s) remain at the depot.</small></details>';
}

export function objectiveChecklist(state){
  const steps=objectiveSteps(state);
  const available=state.phase==='plan'?choices(state):[];
  const name=plans.priority.find(priority=>priority.id===state.priority).name;
  return '<section class="objective-checklist"><h2>'+name+'</h2><p>'+steps.filter(step=>step.done).length+' / '+steps.length+' steps completed</p><ol>'+
    steps.map((step,index)=>{
      const actionable=step.action&&!step.done&&available.some(task=>task.id===step.action)&&state.workday?.completed.length<2;
      return '<li class="'+(step.done?'checked':'')+'"><input type="checkbox" disabled '+(step.done?'checked':'')+' aria-label="'+step.title+' completed">'+
        '<div><strong>'+step.title+'</strong><p>'+step.detail+'</p>'+
        (actionable?'<button data-objective="'+step.action+'">Queue this step</button>':'')+'</div></li>';
    }).join('')+'</ol></section>';
}

export function portrait(id) {
  return '<span class="crew-portrait '+id+'" aria-hidden="true"><i></i></span>';
}
export function crewPanel(state,selected) {
  return '<section class="crew-roster"><h2>Assign your crew</h2><p>Drag a crew member onto a task or station. Or select a person, then a task.</p><div class="crew-list">'+crew.map(member=>
    '<button draggable="true" data-crew="'+member.id+'" aria-pressed="'+(member.id===selected)+'" title="'+member.specialty+'">'+portrait(member.id)+
    '<strong>'+member.name+'</strong><small>'+member.role+'</small><span>'+(state.experience?.[member.id]??0)+' tasks</span></button>').join('')+
    '</div><p class="specialty">'+crewMember(selected).name+' · '+crewMember(selected).specialty+'</p></section>';
}
export function dayProgress(state) {
  const completed=state.workday?.completed.length??0;
  const done=['debrief','review'].includes(state.phase);
  return '<div class="daily-status"><strong>DAY '+state.day+(state.mode==='story'?' / 10':' · ENDLESS')+'</strong><span>'+
    (state.phase==='plan'?completed+' / 2 crew tasks':state.phase==='debrief'?'Day complete':state.phase==='failed'?'Training paused':state.phase==='review'?'Mission complete':'New contract')+
    '</span><progress max="3" value="'+(done?3:completed)+'" aria-label="Daily progress"></progress></div>';
}
export function workSlots(state) {
  const tasks=state.workday?.completed??[];
  return '<div class="work-slots" aria-label="Daily work slots">'+[0,1].map(i=>
    '<div class="'+(tasks[i]?'done':'')+'"><span>'+ (tasks[i]?'Complete':'Work slot '+(i+1))+'</span><strong>'+
    (tasks[i]?crewMember(tasks[i].assignee).name+' · '+tasks[i].name:'Choose an assignment')+'</strong></div>').join('')+'</div>';
}
export function milestones(state) {
  return '<details class="objectives"><summary>Mission milestones · '+milestoneProgress(state).filter(x=>x.done).length+' / 4</summary>'+
    milestoneProgress(state).map(item=>'<p class="'+(item.done?'earned':'')+'">'+(item.done?'Complete · ':'In progress · ')+item.name+'</p>').join('')+'</details>';
}

export function tutorial(state,lesson,skip) {
  if(skip||state.day!==1||state.mode!=='story')return null;
  const completed=state.workday?.completed.length??0;
  if(state.phase==='debrief')return {role:'sol',title:'Ready for tomorrow',text:'Your work is saved. You now know how to assign crew, collect supplies, and keep the air system running. Continue to Day 2 when you are ready.',target:'[data-act=next]'};
  if(state.phase!=='plan')return null;
  if(completed===2)return {role:'sol',title:'Keep everyone breathing',text:'Choose 3 power for life support to make 3 oxygen. Your crew uses 2 oxygen and 1 meal overnight. Check the night forecast, then end the day.',target:'[data-field=support]'};
  if(completed===1)return {role:'pip',title:'Bring something back',text:'Try mining the ore seam for spare parts or collecting ice for oxygen. Pick a task, assign a crew member, and send them out. Each completed task fills one of today’s two work slots.',target:'[data-task=mine]'};
  const lessons=[
    {role:'pip',title:'Welcome to Redhaven',text:'Your oxygen, power, meals, and parts are always at the top. These supplies keep the outpost running. You have two crew work slots each day.',target:'#mission-strip',next:true},
    {role:'mika',title:'Choose someone for the job',text:'I’m Mika, the engineer. Select me below, or drag my portrait onto Restore habitat. My specialty saves power on repairs and mining.',target:'[data-crew=mika]',next:true},
    {role:'mika',title:'Give your crew a task',text:'Select Restore habitat. The card shows its power and parts costs. Dragging a power or parts chip onto the card also queues the task.',target:'[data-task=repair]',next:true},
    {role:'mika',title:'Send the crew',text:'Review the assignment and press Send crew. Watch your astronaut travel, work, and return. The next task becomes available when the expedition finishes.',target:'[data-act=work]'},
  ];
  return lessons[Math.min(lesson,lessons.length-1)];
}
