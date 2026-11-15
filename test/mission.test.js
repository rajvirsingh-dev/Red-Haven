import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startMission, forecast, resolveDay, nextDay, extend, choices, plans, retry, checkPlan, flareFor, shelterPower, achievements,prepareDay,forecastTask,executeTask,finishWorkday,supplyStatus} from '../src/mission.js';

function run(plan) {
  let state = startMission(plan, 147);
  for (let day = 1; day <= 10; day++) {
    const action = day === 10 ? 'report' : choices(state).find(x => x.id === 'repair' && day === 1)?.id ?? 'reserve';
    state = nextDay(resolveDay(state, {action, support: 3}));
  }
  return state;
}

test('all 18 planning combinations have a survival route and an endless continuation', () => {
  for (const priority of plans.priority) for (const site of plans.site) for (const cargo of plans.cargo) {
    const ending = run({priority:priority.id, site:site.id, cargo:cargo.id});
    assert.equal(ending.phase,'review');
    assert.equal(ending.log.length,10);
    assert.equal(extend(ending).day,11);
  }
});

test('preview matches resolution, a resolved day cannot award twice, and retry restores a failed day', () => {
  const state = startMission({priority:'shelter',site:'ridge',cargo:'supplies'},147);
  const input = {action:'brace',support:3};
  const result = resolveDay(state,input);
  assert.deepEqual(forecast(state,input),result.result);
  assert.equal(resolveDay(result,input),result);
  const bad = {...state, oxygen:1};
  const failure = resolveDay(bad,{action:'reserve',support:0});
  assert.equal(failure.phase,'failed');
  assert.deepEqual(retry(failure),bad);
});

test('endless can operate sustainably for 100 days and never repeats one-use cargo', () => {
  let state = extend(run({priority:'shelter',site:'ridge',cargo:'battery'}));
  for(let day=11;day<=110;day++){
    if(state.phase==='contract') state=nextDay(state,'shelter');
    const task=state.integrity<80&&forecast(state,{action:'maintain',support:3}).valid?'maintain':'reserve';
    const resolved=resolveDay(state,{action:task,support:3});
    assert.equal(resolved.phase,'debrief',JSON.stringify(resolved.result));
    state=nextDay(resolved);
  }
  assert.equal(state.day,111);
});

test('delivery checks explain failed constraints and compatible payload reaches day one', () => {
  const base = {priority:'signal',site:'ridge',cargo:'materials',budget:'lean',payload:'module'};
  assert.deepEqual(checkPlan(base).filter(check=>!check.ok).map(check=>check.name),
    ['Payload mass','Mission budget','Connector']);
  assert.throws(()=>startMission(base));
  const good = {...base,site:'plain',cargo:'supplies',budget:'standard'};
  assert.ok(checkPlan(good).every(check=>check.ok));
  const mission = startMission(good);
  assert.equal(mission.energy,5);
  assert.equal(mission.relay,true);
});

test('record-backed warning predicts the exact shelter charge', () => {
  const day = {...startMission({priority:'shelter',site:'plain',cargo:'battery'}),day:5,hazard:'storm'};
  assert.equal(flareFor(day).flrID,'2024-05-08T01:33:00-FLR-001');
  assert.equal(shelterPower(day),3);
  assert.equal(forecast(day,{action:'reserve',support:3}).shelter,3);
  assert.equal(forecast({...day,shield:true},{action:'reserve',support:3}).shelter,0);
});

test('a mission can finish all three objectives and a one-use cache remains consumed', () => {
  let state = startMission({priority:'garden',site:'plain',cargo:'battery',payload:'tools'});
  const itinerary=['repair','parts','grow','brace','remote','grow','harvest','relay','reserve','report'];
  for (const [index, action] of itinerary.entries()) {
    if(index>1) assert.ok(!choices(state).some(choice=>choice.id==='parts'));
    const resolved=resolveDay(state,{action,support:3});
    assert.equal(resolved.phase,'debrief');
    state=nextDay(resolved);
  }
  assert.equal(state.phase,'review');
  assert.ok(achievements(state).every(([, achieved])=>achieved));
});

test('two-slot workdays remain survivable for all 18 baseline manifests',()=>{
  for(const priority of plans.priority)for(const site of plans.site)for(const cargo of plans.cargo){
    let state=startMission({priority:priority.id,site:site.id,cargo:cargo.id});
    for(let day=1;day<=10;day++){
      state=prepareDay(state);
      assert.equal(prepareDay(state),state,'Solar recharge must apply once');
      for(let slot=0;slot<2;slot++){
        const action=day===1&&slot===0?'repair':'reserve';
        state=executeTask(state,action,action==='repair'?'mika':'pip');
        assert.equal(state.workday.completed.length,slot+1);
      }
      assert.equal(executeTask(state,'reserve','pip'),state,'No third work slot');
      const night=finishWorkday(state,3);
      assert.equal(night.phase,'debrief',JSON.stringify({priority,site,cargo,day}));
      assert.equal(finishWorkday(night,3),night,'Cannot resolve a night twice');
      state=nextDay(night);
    }
    assert.equal(state.phase,'review');
    assert.equal(state.log.length,10);
  }
});

test('mining consumes suit oxygen and deposits while specialties and robot assignment change costs',()=>{
  const initial=prepareDay(startMission({priority:'shelter',site:'plain',cargo:'battery'}));
  const mika=forecastTask(initial,'mine','mika');
  const pip=forecastTask(initial,'mine','pip');
  assert.equal(mika.taskPower,1);
  assert.equal(mika.suitOxygen,1);
  assert.equal(pip.taskPower,2);
  assert.equal(pip.suitOxygen,0);
  const mined=executeTask(initial,'mine','mika');
  assert.equal(mined.parts,initial.parts+2);
  assert.equal(mined.oxygen,initial.oxygen-1);
  assert.equal(mined.food,initial.food);
  assert.equal(supplyStatus(mined).ore,2);
  assert.equal(mined.experience.mika,1);
  assert.equal(executeTask(mined,'mine','mika'),mined,'Deposit work is limited to one expedition per day');
  const depleted={...initial,deposits:{ore:0,ice:0}};
  assert.ok(!choices(depleted).some(task=>['mine','ice'].includes(task.id)));
  const legacy={...initial};delete legacy.deposits;delete legacy.experience;
  assert.equal(executeTask(legacy,'mine','mika').experience.mika,1);
});

test('two work slots, overnight supplies, retry, and saved work remain consistent',()=>{
  let state=prepareDay(startMission({priority:'garden',site:'ridge',cargo:'supplies'}));
  assert.equal(finishWorkday(state,3),state);
  state=executeTask(state,'mine','mika');
  state=JSON.parse(JSON.stringify(state));
  state=prepareDay(state);
  assert.equal(state.workday.completed.length,1);
  state=executeTask(state,'ice','sol');
  const failed=finishWorkday({...state,oxygen:1},0);
  assert.equal(failed.phase,'failed');
  const restored=prepareDay(retry(failed));
  assert.equal(restored.workday.completed.length,0);
  assert.equal(restored.parts,4);
  assert.equal(restored.experience.mika,0);
  const storm={...state,day:5,hazard:'storm',workday:{completed:[]}};
  assert.equal(forecastTask(storm,'remote','mika').valid,false);
  assert.ok(!choices(storm).some(task=>task.id==='mine'));
});
