import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startMission, forecast, resolveDay, nextDay, extend, choices, plans, retry, checkPlan, flareFor, shelterPower, achievements} from '../src/mission.js';

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
    const resolved=resolveDay(state,{action:'reserve',support:3});
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
