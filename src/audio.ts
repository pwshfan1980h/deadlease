import type {Game,Result} from './engine';
import {rooms} from './world';
import {maxStamina} from './progression';
export interface Preferences {palette:string;muted:boolean;master:number;effects:number;ambience:number;music:number;fontSize:number;motion:boolean}
export const defaultPreferences:Preferences={palette:'original',muted:false,master:.45,effects:.5,ambience:.12,music:.24,fontSize:15,motion:true};
const cues:Record<string,string>={gunshot:'helton-rapid',hit:'helton-hit',death:'helton-death'};
export function travelProfile(before:Game,after:Game,command:string){
 // Death/clone relocation, failed movement, reading, and save loads aren't footsteps.
 if(before.room===after.room||after.run.status==='dead'||after.player.debt>before.player.debt)return null;
 const from=rooms[before.room],to=rooms[after.room];
 const surface=from.layer!==to.layer?'ladder':to.layer===-1||to.id==='sump'?'water':['reed','wilds'].includes(to.zone)?'mud':to.zone==='quay'?'water':to.zone==='glass'?'glass':to.zone==='foundry'||['pump','booth','relay','yard','tunnel'].includes(to.id)?'metal':'stone';
 const retreat=command.trim().toLowerCase()==='flee';
 const arrival=after.encounter?'danger':to.radiation>0?'radiation':to.safe&&!from.safe?'refuge':null;
 return {surface,arrival,rate:retreat?1.24:after.player.stamina<maxStamina(after.player)*.25?.82:1};
}
export class Sound {
 private cache=new Map<string,HTMLAudioElement>();
 private prefs=defaultPreferences;
 private travelCount=0;
 private ambienceRequested=false;
 private battleActive=false;
 private musicAudio:HTMLAudioElement|null=null;
 private fade:ReturnType<typeof setInterval>|null=null;
 private scheduled=new Set<ReturnType<typeof setTimeout>>();
 private activeCombat=new Set<HTMLAudioElement>();
 private activeTravel=new Set<HTMLAudioElement>();
 apply(prefs:Preferences){this.prefs=prefs;for(const [name,audio] of this.cache){audio.volume=this.volume(name);if(prefs.muted)audio.pause()}
  if(prefs.muted){this.cancelCombat();this.stopFade();if(this.musicAudio){this.musicAudio.volume=0;this.musicAudio.pause()}}else {this.battle(this.battleActive);if(this.ambienceRequested)this.play('ambience');}
 }
 private volume(name:string){return this.prefs.muted?0:this.prefs.master*(name==='ambience'?this.prefs.ambience*(this.battleActive?.3:1):this.prefs.effects)}
 private stopFade(){if(this.fade!==null){clearInterval(this.fade);this.fade=null}}
 battle(active:boolean){
  this.battleActive=active;
  const ambience=this.cache.get('ambience');if(ambience)ambience.volume=this.volume('ambience');
  if(typeof Audio==='undefined'||this.prefs.muted)return;
  if(!active&&!this.musicAudio)return;
  try{
   if(!this.musicAudio){this.musicAudio=new Audio('./assets/music/dark-fog.mp3');this.musicAudio.loop=true;this.musicAudio.volume=0}
   const a=this.musicAudio,target=active?this.prefs.master*this.prefs.music:0;
   // Resume after autoplay denial or mute, but never restart for each combat turn.
   if(active&&target>0&&a.paused)void a.play().catch(()=>{});
   this.stopFade();const from=a.volume;let tick=0;
   if(from===target){if(!active||target===0)a.pause();return}
   this.fade=setInterval(()=>{a.volume=from+(target-from)*(++tick/18);if(tick>=18){this.stopFade();if(!active||target===0)a.pause()}},50);
  }catch{/* Music cannot block the game on unsupported or unavailable audio. */}
 }
 play(name:string,rate=1){
  if(name==='ambience')this.ambienceRequested=true;
  if(!name||typeof Audio==='undefined'||this.prefs.muted)return;
  try{let a=this.cache.get(name);if(!a){a=new Audio('./assets/sounds/'+(cues[name]??name)+'.wav');a.loop=name==='ambience';this.cache.set(name,a)}a.volume=this.volume(name);a.playbackRate=rate;if(name!=='ambience')a.currentTime=0;else if(!a.paused)return;void a.play().catch(()=>{});return a;}catch{/* Audio failure must never block play. */}
 }
 cancelEffects(){this.cancelCombat();for(const a of this.activeTravel)a.pause();this.activeTravel.clear()}
 private cancelCombat(){for(const timer of this.scheduled)clearTimeout(timer);this.scheduled.clear();for(const a of this.activeCombat)a.pause();this.activeCombat.clear()}
 sequence(result:Result){
  this.cancelCombat();
  if(!result.sounds?.length){this.play(result.sound);return}
  if(this.prefs.muted)return;
  for(const event of result.sounds){const play=()=>{const a=this.play(event.cue);if(a)this.activeCombat.add(a)};
   if(!event.delay)play();else{const timer=setTimeout(()=>{this.scheduled.delete(timer);play()},event.delay);this.scheduled.add(timer)}
  }
 }
 travel(before:Game,after:Game,command:string){
  const profile=travelProfile(before,after,command);if(!profile)return false;
  // A new move cuts off the prior steps so rapid commands cannot build a wall of sound.
  for(const a of this.activeTravel)a.pause();this.activeTravel.clear();
  const variant=1+(this.travelCount++%3);
  const step=this.play(`travel-${profile.surface}-${variant}`,profile.rate);if(step)this.activeTravel.add(step);
  if(profile.arrival){const arrival=this.play(`travel-${profile.arrival}-1`);if(arrival)this.activeTravel.add(arrival)}
  return true;
 }
 close(){this.cancelCombat();this.ambienceRequested=false;this.stopFade();this.musicAudio?.pause();this.battleActive=false;for(const a of this.cache.values())a.pause();this.activeTravel.clear()}
}
