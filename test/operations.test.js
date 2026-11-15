import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startMission,prepareDay,executeTask,finishWorkday,nextDay,forecast,forecastTask,plans,achievements} from '../src/mission.js';
import {captainMessage} from '../src/messages.js';
import {objectiveSteps} from '../src/objectives.js';

const manifest={priority:'shelter',site:'plain',cargo:'battery'};
test('night damage is persistent, preventable, repairable, and visible in the forecast',()=>{
 const base=startMission(manifest);
 const storm={...base,day:5,hazard:'storm'};
 assert.equal(forecast(storm,{action:'reserve',support:3}).next.integrity,82);
 assert.equal(forecast({...storm,shield:true},{action:'reserve',support:3}).next.integrity,100);
 const fault={...base,day:9,hazard:'fault'};
 assert.equal(forecast(fault,{action:'reserve',support:3}).next.integrity,90);
 assert.equal(forecast({...fault,inspection:true},{action:'reserve',support:3}).next.integrity,100);
 const repair=prepareDay({...base,integrity:40,parts:4});
 assert.equal(executeTask(repair,'maintain','mika').integrity,60);
 const critical={...storm,integrity:10};
 assert.match(forecast(critical,{action:'reserve',support:3}).failure,/integrity reached zero/);
 assert.equal(forecastTask(repair,'maintain','mika').damage.length,0);
 const legacy={...base};delete legacy.integrity;
 assert.equal(forecast(legacy,{action:'reserve',support:3}).next.integrity,100);
});

test('daily captain packets count down to actual supplies and crew transfer',()=>{
 const base=startMission(manifest);
 assert.equal(captainMessage(base).crewEta,9);
 assert.equal(captainMessage({...base,day:10}).crewEta,0);
 const extended={...base,mode:'endless',day:14};
 assert.equal(captainMessage(extended).supplyDay,15);
 assert.equal(captainMessage(extended).supplyEta,1);
 assert.equal(captainMessage(extended).crewDay,21);
 assert.equal(captainMessage({...extended,caches:{air:true,parts:false}}).crates,1);
});

test('all 18 starting configurations can complete the checklists with assigned work',()=>{
 const itinerary={1:[['repair','mika'],['mine','mika']],2:[['parts','pip'],['ice','sol']],3:[['grow','sol'],['relay','mika']],4:[['brace','mika'],['grow','sol']],5:[['remote','pip'],['reserve','pip']],6:[['report','pip'],['reserve','pip']],7:[['harvest','sol'],['reserve','pip']],8:[['beacon','pip'],['reserve','pip']],9:[['reserve','pip'],['reserve','pip']],10:[['report','pip'],['reserve','pip']]};
 for(const priority of plans.priority)for(const site of plans.site)for(const cargo of plans.cargo){
  let state=startMission({priority:priority.id,site:site.id,cargo:cargo.id});
  for(let day=1;day<=10;day++){
   state=prepareDay(state);
   for(const [action,member] of itinerary[day]){
    const previous=state;state=executeTask(state,action,member);
    assert.notEqual(state,previous,JSON.stringify({priority,site,cargo,day,action}));
   }
   const resolved=finishWorkday(state,3);
   assert.equal(resolved.phase,'debrief');
   state=nextDay(resolved);
  }
  assert.equal(state.phase,'review');
  assert.ok(achievements(state).every(([,done])=>done));
  assert.ok(objectiveSteps(state).every(step=>step.done));
  assert.equal(state.integrity,100);
 }
});
