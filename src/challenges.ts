import type {Game} from './engine';
import {abilities} from './progression';
import {canCarry} from './backpack';
import {fishingKit,fishingSpot,fishById} from './fishing';
export type TimingOutcome='success'|'miss'|'cancel'|'skill';
export interface Challenge {kind:'strike'|'lock'|'morse'|'fishing';title:string;stages:number;period:number;width:number;pattern?:string;scene?:string;description:string}
export const puzzleObjects=[
 {id:'lamplight-tackle',room:'shallows-0',name:'tackle box',aliases:['box','tackle box','locker','lock','tackle locker'],description:'A battered tackle box is wedged above the waterline. Coiled line peeks beneath its lid; the small brass lock has three pins.',empty:'The tackle box stands open, its little brass lock hanging loose.'},
 {id:'relay-terminal',room:'relay',name:'relay terminal',aliases:['terminal','relay terminal','console','relay console','relay lamp'],description:'Under the aerial, a relay terminal blinks a short Morse handshake above a recessed contact key. A maintenance credit remains queued on its cracked display.',empty:'The relay terminal displays TRANSFER COMPLETE. Its contact key has gone quiet.'}
];
export function puzzleAt(g:Game,target:string){return puzzleObjects.find(o=>o.room===g.room&&(o.aliases.includes(target.replace(/^the /,''))||o.id===target))}
export const puzzleFlag=(id:string)=>'puzzle:'+id;
export function challengeFor(g:Game,verb:string,arg:string):Challenge|string|null {
 if(verb==='use'&&abilities[arg]?.effects.some(e=>e.kind==='damage'||e.kind==='leech')){
  const a=abilities[arg];if(!g.encounter||!g.player.abilities.includes(arg)||g.player.stamina<a.cost||(g.cooldowns[arg]??0)>g.turns)return null;
  return {kind:'strike',title:a.name,stages:1,period:1500,width:.18,description:'Space in the amber window adds 50% to damage. A miss, Enter, or Escape performs the normal ability.'};
 }
 if(verb==='fish'){
  if(arg&&!['here','water','in water','in the water'].includes(arg))return 'There is no fishing access by that name here.';
  if(g.encounter)return 'Resolve the encounter before casting.';
  const spot=fishingSpot(g.room);if(!spot)return 'There is no accessible fishing water here.';
  if(!g.player.inventory[fishingKit]||!Object.keys(g.player.pack.layout).some(k=>k.startsWith(fishingKit+':')))return 'You need a packed telescopic fishing kit. Local traders sell them.';
  if(!spot.table.every(([id])=>canCarry(g.player,{[id]:1})))return 'Make room for a catch before casting. The largest fish here needs up to '+Math.max(...spot.table.map(([id])=>fishById(id)!.width))+' columns and '+Math.max(...spot.table.map(([id])=>fishById(id)!.height))+' rows.';
  return {kind:'fishing',title:spot.name,scene:g.room==='sewer-0'?'drains':g.room==='wilds-5'?'creek':'jetty',stages:2,period:1900,width:g.player.inventory['fishing bait']?.32:.24,description:'Space in amber to hook, then reel. Both timing checks are required. Escape reels in empty. Casting uses one turn; optional bait is consumed.'};
 }
 const object=puzzleAt(g,arg);if(!object||!['pick','unlock','hack','open'].includes(verb))return null;
 if(g.encounter)return 'Resolve the encounter first.';
 if(g.rewards.includes(puzzleFlag(object.id)))return 'You already dealt with the '+object.name+'.';
 if(object.id==='lamplight-tackle'){
  if(verb==='hack')return 'This is a mechanical lock.';
  if(verb==='open')return 'The tackle box is locked. Three small pins sit behind the keyway.';
  if(!g.player.inventory['lock tools'])return 'You need lock tools for the brass pins.';
  if(!canCarry(g.player,{[fishingKit]:1,'fishing bait':3}))return 'Your pack has no room for the tackle. Make space first.';
  return {kind:'lock',title:'Three brass pins',stages:3,period:1900,width:.28,description:'Set three pins in a row with Space in amber. A miss releases the pins. Enter uses Tech instead; Escape abandons the attempt. One turn per attempt.'};
 }
 if(verb!=='hack')return 'The terminal accepts a signal through its contact key.';
 return {kind:'morse',title:'Relay handshake',stages:4,period:0,width:0,pattern:'.-..',description:'Match the code with Space: dot = short tap (80–300ms), dash = hold (350–900ms). Enter uses Tech instead; Escape abandons the attempt. One turn per attempt.'};
}
export function sliderPosition(elapsed:number,period:number){const phase=(Math.max(0,elapsed)/period)%2;return phase<=1?phase:2-phase}
export function targetWindow(challenge:Challenge,stage:number){const center=[.62,.36,.72][stage%3];return {start:center-challenge.width/2,end:center+challenge.width/2}}
export function timingHit(challenge:Challenge,stage:number,elapsed:number){const p=sliderPosition(elapsed,challenge.period),w=targetWindow(challenge,stage);return p>=w.start&&p<=w.end}
export function morseSymbol(ms:number){return ms>=80&&ms<=300?'.':ms>=350&&ms<=900?'-':null}
