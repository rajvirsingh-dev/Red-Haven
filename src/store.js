import {createStore} from 'zustand/vanilla';
import {persist} from 'zustand/middleware';
import {startMission,resolveDay,nextDay,retry,extend} from './mission.js';

export const store = createStore(persist((set,get)=>({
  mission:null, sound:false,
  start:plan=>set({mission:startMission(plan,crypto.getRandomValues(new Uint32Array(1))[0])}),
  commit:plan=>set({mission:resolveDay(get().mission,plan)}),
  continue:priority=>set({mission:nextDay(get().mission,priority)}),
  retry:()=>set({mission:retry(get().mission)}),
  extend:()=>set({mission:extend(get().mission)}),
  setSound:sound=>set({sound}),
}),{
  name:'redhaven-v1',version:1,
  partialize:({mission,sound})=>({mission,sound}),
}));
