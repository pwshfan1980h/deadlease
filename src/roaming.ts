import {enemies,enemyRenames} from './enemies';
import {rooms,type Room} from './world';
export type VisitorRole='neutral'|'attackable'|'hostile';
export interface Visitor {id:string;name:string;role:VisitorRole;zones:string[];description:string;arrival:string;departure:string;speech?:string}
export const visitors:Record<string,Visitor>={
 courier:{id:'courier',name:'scrap courier',role:'neutral',zones:['district','quay','reed','foundry','glass','crown','sewer'],description:'A traveler carrying a canvas sack of replacement parts. Unarmed, in a hurry, and uninterested in a fight.',arrival:'A scrap courier steps into view, checking the address on a folded route card.',departure:'The scrap courier shoulders the sack and moves on.',speech:'“Warm lamps mean shelter. Iron rungs mean another way through. Don’t trust a quiet drain.”'},
 ferret:{id:'ferret',name:'coupon ferret',role:'attackable',zones:['district'],description:'A ferret noses through the litter for food. It leaves you alone unless provoked.',arrival:'A coupon ferret scurries into view and begins sorting the litter.',departure:'The coupon ferret snatches a paper scrap and scurries out of sight.'},
 tadpole:{id:'tadpole',name:'compliance tadpole',role:'attackable',zones:['sewer','reed'],description:'A rubber-tailed amphibian searches a puddle for insects. It will defend itself if attacked.',arrival:'A compliance tadpole wriggles into view, stamping the wet ground.',departure:'The compliance tadpole slips into a drain with a wet slap.'},
 raider:{id:'raider',name:'dock raider',role:'hostile',zones:['quay'],description:'A harbor predator looking for an unwary traveler. Attacks on sight.',arrival:'A dock raider steps out from cover and lunges at you!',departure:'The dock raider vanishes behind the seawall.'},
 stalker:{id:'stalker',name:'marsh stalker',role:'hostile',zones:['reed'],description:'A patient hunter in the reeds. Attacks on sight.',arrival:'A marsh stalker breaks from the reeds and strikes!',departure:'The marsh stalker fades into the reeds.'},
 hound:{id:'hound',name:'furnace hound',role:'hostile',zones:['foundry'],description:'A heat-scarred scavenger with an industrial appetite. Attacks on sight.',arrival:'A furnace hound rounds the machinery and springs at you!',departure:'The furnace hound disappears between the boilers.'},
 wraith:{id:'wraith',name:'glass wraith',role:'hostile',zones:['glass'],description:'A sharp-edged shape hunting reflections. Attacks on sight.',arrival:'A glass wraith slides from a reflection and lashes out!',departure:'The glass wraith dissolves into broken reflections.'},
 collector:{id:'collector',name:'storm collector',role:'hostile',zones:['crown'],description:'An enforcement machine stalking the causeway. Attacks on sight.',arrival:'A storm collector turns toward you. Its steel arm strikes!',departure:'The storm collector marches into the rain.'},
 lurker:{id:'lurker',name:'drain lurker',role:'hostile',zones:['district','sewer'],description:'A scavenger crawling out of the drainage system. Attacks on sight.',arrival:'A drain lurker crawls into view and snaps at you!',departure:'The drain lurker slips back into the darkness.'}
};
for(const v of Object.values(visitors)){for(const [old,name] of Object.entries(enemyRenames)){v.name=v.name.replaceAll(old,name);v.description=v.description.replaceAll(old,name);v.arrival=v.arrival.replaceAll(old,name);v.departure=v.departure.replaceAll(old,name)}}
visitors.courier.zones.push('shallows','wilds','bellwether');
visitors.ferret.zones.push('shallows');visitors.tadpole.zones.push('shallows');
const humanRegions:Record<string,string[]>={'alley marksman':['district','bellwether'],'chain brawler':['quay'],'fen trapper':['reed','wilds'],'slag burner':['foundry'],'mirror sniper':['glass'],'coil zealot':['crown'],'sump knifer':['sewer','shallows'],'street cutthroat':['district','wilds','bellwether'],'harbor gunner':['quay'],'reed poacher':['reed','wilds'],'tread brute':['foundry'],'shard duelist':['glass'],'storm deserter':['crown'],'drain scavenger':['sewer','shallows']};
for(const [name,regions] of Object.entries(humanRegions)){const id=name.replaceAll(' ','-');visitors[id]={id,name,role:name==='drain scavenger'?'attackable':'hostile',zones:regions,description:enemies[name].windup+(name==='drain scavenger'?' They leave you alone unless attacked.':' Attacks on sight.'),arrival:'A '+name+' emerges from cover.'+(name==='drain scavenger'?' They watch you warily.':' They attack!'),departure:'The '+name+' disappears down the passage.'}}
export function visitorsFor(room:Room){return Object.values(visitors).filter(v=>v.zones.includes(room.zone)&&(!room.safe||v.role==='neutral'))}
export function visitorAllowed(id:string,room:Room){return Object.hasOwn(visitors,id)&&visitorsFor(room).some(v=>v.id===id)}
export type ActivityEvent={type:'arrival'|'departure';visitor:Visitor};
/** Session-local room activity. Paused time is not accrued; no offline catch-up. */
export class RoomActivity {
 private remaining:number;
 private current:Visitor|null=null;
 private previous='';
 constructor(private room:Room,private random:()=>number=Math.random){this.remaining=this.delay(60000,120000)}
 private delay(min:number,max:number){return min+this.random()*(max-min)}
 advance(milliseconds:number):ActivityEvent|null{
  this.remaining-=Math.max(0,Math.min(milliseconds,1000));if(this.remaining>0)return null;
  if(this.current){const visitor=this.current;this.current=null;this.previous=visitor.id;this.remaining=this.delay(120000,240000);return {type:'departure',visitor}}
  const pool=visitorsFor(this.room),choices=pool.filter(v=>v.id!==this.previous),options=choices.length?choices:pool;
  if(!options.length)return null;
  this.current=options[Math.min(options.length-1,Math.floor(this.random()*options.length))];this.remaining=this.delay(18000,30000);
  return {type:'arrival',visitor:this.current};
 }
}
