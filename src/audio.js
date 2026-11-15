import {Howl} from 'howler';
import ambienceUrl from './audio/habitat.wav';
import cueUrl from './audio/cues.wav';
import musicUrl from './audio/music.wav';
import effectsUrl from './audio/effects.wav';

const ambience = new Howl({src:[ambienceUrl],loop:true,volume:.18,preload:true});
const cues = new Howl({src:[cueUrl],volume:.45,sprite:{
  select:[0,320], work:[500,340], message:[1000,420], warning:[1500,430], success:[2000,470],
}});
let enabled = false;
let channel = null;
const music=new Howl({src:[musicUrl],loop:true,volume:.35,preload:true});
const fieldSounds=new Howl({src:[effectsUrl],volume:.65,sprite:{
  mine:[0,650],ice:[700,650],radio:[1400,650],assign:[2100,650],
  delivery:[2800,650],milestone:[3500,650],grow:[4200,650],steps:[4900,650],
}});
let musicChannel=null,workLoop=null,context='calm';
let musicLevel=.35,effectsLevel=.65;
export function setVolumes(background,effects){
  musicLevel=background;effectsLevel=effects;
  music.volume(context==='storm'?musicLevel*.65:musicLevel);
  cues.volume(effectsLevel*.7);fieldSounds.volume(effectsLevel);ambience.volume(effectsLevel*.22);
}
export function setAudioContext(hazard){
  context=hazard==='storm'?'storm':'calm';
  music.rate(context==='storm'?.84:1);
  music.volume(context==='storm'?musicLevel*.65:musicLevel);
}
export function stopWorkSound(){
  if(workLoop!==null){clearInterval(workLoop);workLoop=null;}
}
export function playTaskSound(task){
  stopWorkSound();
  const cue=task==='mine'?'mine':task==='ice'?'ice':
    ['relay','report','beacon','pulse'].includes(task)?'radio':
    ['grow','harvest'].includes(task)?'grow':['air','parts'].includes(task)?'delivery':'steps';
  playSound(cue);
  let count=0;
  if(task!=='reserve')workLoop=setInterval(()=>{
    if(++count>=5){stopWorkSound();return;}
    playSound(cue);
  },950);
}

export function setSound(on) {
  enabled=on;
  if(!enabled) {cues.stop();fieldSounds.stop();stopWorkSound();}
  syncSound();
}

function syncSound() {
  if(enabled&&!document.hidden) {
    if(channel===null) channel=ambience.play();
    if(musicChannel===null) musicChannel=music.play();
  } else if(channel!==null) {
    ambience.stop(channel);
    channel=null;
  }
  if((!enabled||document.hidden)&&musicChannel!==null){music.stop(musicChannel);musicChannel=null;stopWorkSound();}
}
document.addEventListener('visibilitychange',syncSound);

export function playSound(name) {
  if(enabled&&!document.hidden) {
    if(['mine','ice','radio','assign','delivery','milestone','grow','steps'].includes(name))fieldSounds.play(name);
    else cues.play(name);
  }
}
