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
export function milestones(state) {
  return '<details class="objectives"><summary>Mission milestones · '+milestoneProgress(state).filter(x=>x.done).length+' / 4</summary>'+
    milestoneProgress(state).map(item=>'<p class="'+(item.done?'earned':'')+'">'+(item.done?'Complete · ':'In progress · ')+item.name+'</p>').join('')+'</details>';
}

export function tutorial(state,lesson,skip) {
  if(skip||state.day!==1||state.mode!=='story')return null;
  const completed=state.workday?.completed.length??0;
  if(state.phase==='debrief')return {role:'sol',title:'Ready for tomorrow',text:'Your work is saved. You now know how to assign crew, collect supplies, and keep the air system running. Continue to Day 2 when you are ready.',target:'[data-act=next]'};
  if(state.phase!=='plan')return null;
  if(completed===2)return {role:'sol',title:'Keep everyone breathing',text:'Both jobs are done. Press End Day, choose how much power goes to life support, and check the night forecast. Your crew uses 2 oxygen and 1 meal overnight.',target:'[data-act=end-day]'};
  if(completed===1)return {role:'pip',title:'Bring something back',text:'Drag a crew card onto the Ore seam for spare parts, or onto the Ice deposit for oxygen. I can work outside without using suit oxygen.',target:'[data-location=ore]'};
  const lessons=[
    {role:'pip',title:'Welcome to Redhaven',text:'Your oxygen, power, meals, and parts are in the top corner. These supplies keep the outpost running. You get two crew jobs each day.',target:'#mission-strip',next:true},
    {role:'mika',title:'Send me to work',text:'I’m Mika, the engineer. Drag my card from the bottom bar onto the Habitat. You can also tap my card, then tap the Habitat.',target:'[data-crew=mika]'},
    {role:'mika',title:'Pick a job',text:'Each job card shows its cost. Tap Restore habitat to send me out. Watch me walk over, work, and come back.',target:'[data-task=repair]'},
  ];
  return lessons[Math.min(lesson,lessons.length-1)];
}
