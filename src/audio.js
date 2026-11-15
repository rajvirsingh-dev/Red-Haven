import {Howl} from 'howler';
import ambienceUrl from './audio/habitat.wav';
import cueUrl from './audio/cues.wav';

const ambience = new Howl({src:[ambienceUrl],loop:true,volume:.18,preload:true});
const cues = new Howl({src:[cueUrl],volume:.45,sprite:{
  select:[0,320], work:[500,340], message:[1000,420], warning:[1500,430], success:[2000,470],
}});
let enabled = false;
let channel = null;

export function setSound(on) {
  enabled=on;
  if(!enabled) cues.stop();
  syncSound();
}

function syncSound() {
  if(enabled&&!document.hidden) {
    if(channel===null) channel=ambience.play();
  } else if(channel!==null) {
    ambience.stop(channel);
    channel=null;
  }
}
document.addEventListener('visibilitychange',syncSound);

export function playSound(name) {
  if(enabled&&!document.hidden) cues.play(name);
}
