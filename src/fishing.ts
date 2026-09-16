import type {Encounter} from './engine';
export const fishingKit='telescopic fishing kit';
export interface Fish {id:string;description:string;value:number;heal:number;stamina:number;art:number;width:number;height:number}
export const fish:Fish[]=[
 {id:'silver sprat',description:'An ordinary fish. This feels suspicious.',value:10,heal:8,stamina:0,art:2,width:2,height:1},
 {id:'bottlebelly',description:'You can see a bottle cap turning slowly inside its transparent stomach. The flesh around it is edible.',value:16,heal:12,stamina:0,art:3,width:2,height:1},
 {id:'choir eel',description:'Its five mouths hum different notes. Together they almost remember a song. Better sold than eaten.',value:42,heal:0,stamina:0,art:4,width:3,height:1},
 {id:'suture skate',description:'Every patch of skin seems to belong to a different fish. The stitches are growing.',value:30,heal:0,stamina:0,art:5,width:2,height:2},
 {id:'mothfin',description:'Dusty fins fold over its eyes when the light gets too bright. Edible, if you can bear the accusing silence.',value:24,heal:6,stamina:10,art:6,width:2,height:1},
 {id:'lantern pike',description:'A warm lamp glows beneath its jaw. Nothing you can find explains the wick.',value:54,heal:0,stamina:0,art:7,width:3,height:1},
 {id:'clockwork smelt',description:'Its gills tick. It keeps worse time when anyone is watching.',value:36,heal:0,stamina:0,art:8,width:2,height:1},
 {id:'teacup crab',description:'A furious little crab lives in a porcelain cup. It regards you as an uninvited guest.',value:28,heal:0,stamina:0,art:9,width:1,height:1},
 {id:'widow sole',description:'A black lace fin trails behind it. There is something mournful about its second eye.',value:34,heal:16,stamina:0,art:10,width:2,height:1},
 {id:'saint\'s thumb',description:'A thumb-shaped fish with a halo of golden fin. It blesses nothing. Salty, nourishing flesh.',value:60,heal:24,stamina:6,art:11,width:1,height:1},
 {id:'gutter crown',description:'The smallest fish in the channel wears a crown of bent wire. It has the attitude to match.',value:48,heal:0,stamina:0,art:12,width:1,height:1},
 {id:'umbrella ray',description:'It opens and closes like a broken umbrella. Rain seems to fall upward beneath it.',value:75,heal:0,stamina:0,art:13,width:2,height:2},
 {id:'wirejaw gar',description:'A living snarl of wire teeth. It bites through the hook and then politely hangs on.',value:62,heal:0,stamina:0,art:14,width:3,height:1},
 {id:'lastlight sturgeon',description:'Ancient plates cradle one stubborn light. For a moment, the water looks like a street you remember.',value:120,heal:0,stamina:0,art:15,width:3,height:2}
];
export interface FishingSpot {room:string;name:string;description:string;table:[string,number][];rumor:string}
export const fishingSpots:FishingSpot[]=[
 {room:'sewer-0',name:'Lamplit channel',description:'Below Hal’s ledge, small rings spread across a quiet channel. An old float hangs from a nail beside a dry place to sit.',table:[['bottlebelly',35],['choir eel',20],['clockwork smelt',18],['suture skate',14],['gutter crown',10],["saint's thumb",3]],rumor:'Scratches beside the water point west toward Lamplight Junction. Someone drew a little tackle box beneath them.'},
 {room:'quay-0',name:'Sheltered pilings',description:'Beyond the awning, a low platform reaches between the harbor pilings. Silver flashes gather beneath a frayed fishing line tied to the rail.',table:[['silver sprat',40],['teacup crab',22],['widow sole',18],['lantern pike',10],['wirejaw gar',7],['umbrella ray',3]],rumor:'A tide-polished sign points along the harbor wall toward Receiver Pier. The scratched word beneath it is WEATHER.'},
 {room:'wilds-5',name:'Blackwater Bridge',description:'A gap in the bridge rail overlooks a still pocket of creek. Large shapes turn beneath the reeds; someone has worn a smooth seat into the timber.',table:[['mothfin',35],['bottlebelly',20],['lantern pike',18],['wirejaw gar',12],['umbrella ray',10],['lastlight sturgeon',5]],rumor:'Across the creek, Bellwether’s lamps pick out the road south. The post pays for deliveries back to District 67.'}
];
export const fishingSpot=(room:string)=>fishingSpots.find(spot=>spot.room===room);
export function catchAt(spot:FishingSpot,roll:number){let n=Math.min(.999999,Math.max(0,roll))*spot.table.reduce((sum,[,weight])=>sum+weight,0);return spot.table.find(([,weight])=>(n-=weight)<0)![0]}
export const fishById=(id:string)=>fish.find(f=>f.id===id);
export const fishingThreats=['mudskipper hound','pallid bankmaw'] as const;
export type FishingThreat=typeof fishingThreats[number];
/** 87% catches, 12% ordinary hostile quadruped, 1% dangerous old predator. */
export function fishingOutcome(spot:FishingSpot,roll:number):{fish:string}|{enemy:FishingThreat}{
 if(roll<.01)return {enemy:'pallid bankmaw'};
 if(roll<.13)return {enemy:'mudskipper hound'};
 return {fish:catchAt(spot,(roll-.13)/.87)};
}
export function fishingEnemyFor(room:string,name:string):Encounter{
 if(!fishingSpot(room)||!fishingThreats.includes(name as FishingThreat))throw Error('Invalid fishing encounter');
 const deadly=name==='pallid bankmaw',level=deadly?8:room==='sewer-0'?2:room==='quay-0'?4:5;
 const hp=deadly?150:20+level*8;
 return {id:'fishing:'+name+':'+room,name,level,hp,maxHP:hp,damage:deadly?28:3+level*2,armor:deadly?6:Math.floor(level/2),phase:0,heat:0,morale:'fighting'};
}
export const fishingWarning='Four-toed tracks climb from the water. Much deeper gouges cross the older marks.';
