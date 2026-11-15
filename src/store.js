import {createStore} from 'zustand/vanilla';
import {persist} from 'zustand/middleware';
import {startMission,resolveDay,nextDay,retry,extend,prepareDay,executeTask,finishWorkday} from './mission.js';

export const store = createStore(persist((set,get)=>({
  mission:null, sound:false,briefingStep:null,
  start:plan=>set({mission:startMission(plan,crypto.getRandomValues(new Uint32Array(1))[0]),briefingStep:0}),
  advanceBriefing:step=>set({briefingStep:Math.max(0,Math.min(3,step))}),
  commit:plan=>set({mission:resolveDay(get().mission,plan)}),
  continue:priority=>set({mission:nextDay(get().mission,priority)}),
  retry:()=>set({mission:retry(get().mission)}),
  extend:()=>set({mission:extend(get().mission)}),
  setSound:sound=>set({sound}),
  music:0.35,effects:0.65,
  setVolume:(channel,volume)=>set({[channel]:volume}),
  prepare:()=>set({mission:prepareDay(get().mission)}),
  assign:(task,member)=>set({mission:executeTask(get().mission,task,member)}),
  finish:support=>set({mission:finishWorkday(get().mission,support)}),
}),{
  name:'redhaven-v1',version:1,
  partialize:({mission,sound,music,effects,briefingStep})=>({mission,sound,music,effects,briefingStep}),
}));
