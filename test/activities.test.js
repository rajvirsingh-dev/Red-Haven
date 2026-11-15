import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pipeStart,pipeSolution,rotatePipe,pipesConnected,drillAligned,drillTargets,harvestPlants} from '../src/puzzles.js';
import {tutorial} from '../src/interaction.js';

test('ice pipes require a connected route and rotation can solve every tile',()=>{
  assert.equal(pipesConnected(pipeStart),false);
  assert.equal(pipesConnected(pipeSolution),true);
  const board=[...pipeStart];
  for(let index=0;index<board.length;index++){
    let turns=0;
    while(board[index]!==pipeSolution[index]&&turns++<4)board[index]=rotatePipe(board[index]);
    assert.equal(board[index],pipeSolution[index]);
  }
  assert.equal(pipesConnected(board),true);
  board[5]=2;
  assert.equal(pipesConnected(board),false);
});

test('drill and harvest conditions check the player’s actual choices',()=>{
  for(const [index,target] of drillTargets.entries()){
    assert.equal(drillAligned(target,index),true);
    assert.equal(drillAligned(target+5,index),true);
    assert.equal(drillAligned(target+6,index),false);
  }
  assert.equal(harvestPlants.filter(plant=>plant.ready).length,3);
  for(const plant of harvestPlants)assert.equal(plant.ready,plant.maturity>=80&&plant.moisture>=60);
});

test('tutorial highlights change with real daily progress and end after day one',()=>{
  const start={day:1,mode:'story',phase:'plan',workday:{completed:[]}};
  assert.equal(tutorial(start,0,false).target,'#mission-strip');
  assert.equal(tutorial(start,1,false).role,'mika');
  assert.equal(tutorial({...start,workday:{completed:[{}]}},0,false).target,'[data-task=mine]');
  assert.equal(tutorial({...start,workday:{completed:[{},{}]}},0,false).role,'sol');
  assert.equal(tutorial({...start,day:2},0,false),null);
  assert.equal(tutorial(start,0,true),null);
});
