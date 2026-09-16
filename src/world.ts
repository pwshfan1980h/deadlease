export interface Room {id:string;name:string;description:string;x:number;y:number;layer:number;zone:string;level:number;exits:Record<string,string>;safe:boolean;guard:string;warning:string;respawn:boolean;enemy:string; npc:string; radiation:number;salvage:boolean;loot:Record<string,number>;scene:string}
export interface Zone {name:string;band:[number,number];shape:string;terrain:string;description:string}
export const rooms:Record<string,Room>={};
export const zones:Record<string,Zone>={};
export const vectors:Record<string,[number,number,number]>={n:[0,-1,0],s:[0,1,0],e:[1,0,0],w:[-1,0,0],down:[0,0,-1],up:[0,0,1]};
export const opposite:Record<string,string>={n:'s',s:'n',e:'w',w:'e',down:'up',up:'down'};
import original from './data/original-rooms.json';
import {estuary} from './data/estuary';
import {frontierZones,frontierRooms} from './data/frontier';
import {enemyRenames} from './enemies';
import {roomObjects} from './roomObjects';
Object.assign(zones,{
 district:{name:'District 67',band:[1,3],shape:'compact street grid',terrain:'city',description:'A borrowed coat. A broken pump. A district worth saving.'},
 quay:{name:'Salt Quay',band:[2,4],shape:'hook along the seawall',terrain:'water',description:'Follow the harbor wall east, then south and back west.'},
 reed:{name:'Reedward Fen',band:[3,5],shape:'forked floodplain',terrain:'marsh',description:'South of the district, causeways split around drainage beds.'},
 foundry:{name:'Cinder Union',band:[4,6],shape:'broad industrial slab',terrain:'industrial',description:'North of the quay, parallel production streets feed the furnace.'},
 glass:{name:'Vitreous Ward',band:[6,8],shape:'diamond with a narrow southern tail',terrain:'glass',description:'The western glassworks taper into an exposed southern passage.'},
 crown:{name:'The Survey Crown',band:[8,10],shape:'long causeway and branching crown',terrain:'storm',description:'A guarded approach north of the district leads to repeatable high-risk hunting.'},
 sewer:{name:'Deep Drains',band:[2,5],shape:'ladder with a northern service spine',terrain:'sewer',description:'Four surface ladders connect a continuous drainage system.'}
} satisfies Record<string,Zone>);
const defaults={layer:0,exits:{},safe:false,guard:'',warning:'',respawn:false,enemy:'',npc:'',radiation:0,salvage:false,loot:{},scene:'street'};
for(const [id,data] of Object.entries(original)){
 const r=data as {name:string;description:string;pos:number[];exits:Record<string,string>;enemy?:string;npc?:string;salvage?:boolean;radiation?:number;loot?:Record<string,number>};
 rooms[id]={...defaults,...r,id,x:r.pos[0],y:r.pos[1],zone:'district',level:id==='gate'?3:id==='sump'?2:1,exits:{...r.exits},loot:{...r.loot},safe:['clinic','yard','kiosk'].includes(id),guard:id==='clinic'?'Clinic orderly':id==='yard'?'Freight watch':'',scene:id==='clinic'?'clinic':id==='pump'?'pump':'street'};
}
// Browser tutorial wildlife keeps the original room/quest IDs and weak encounter balance.
rooms.alley.enemy='coupon ferret';
rooms.alley.description='Stripped appliances lean across a wet alley. A scrap weasel tears at a canvas bag beneath a dead refrigerator. Beside its nest lies the ceramic pump component Iona needs.';
rooms.sump.enemy='compliance tadpole';
rooms.sump.description='A sump toad drags its heavy tail through luminous runoff. Its scarred skin catches the light from a cracked pipe. [RAD] Exposure here: 8 per world action.';
const guards:Record<string,string>={quay:'Dockwatch Sera',reed:'Warden Fen',foundry:'Steward Rusk',glass:'Keeper Vale',crown:'Warden Orra',sewer:'Drainwatch Hal'};
const foes:Record<string,string>={quay:'dock raider',reed:'marsh stalker',foundry:'furnace hound',glass:'glass wraith',crown:'storm collector',sewer:'drain lurker'};
for(const [zone,lines] of Object.entries(estuary)) lines.split('\n').forEach((line,i)=>{
 const [pos,name,description]=line.split('|'); const [x,y]=pos.split(',').map(Number); const id=zone+'-'+i;
 const safe=i===0||(zone==='glass'&&i===6)||(zone==='crown'&&i===15);
 const band=zones[zone].band; const level=band[0]+i%(band[1]-band[0]+1);
 rooms[id]={...defaults,id,name,description,x,y,layer:zone==='sewer'?-1:0,zone,level,exits:{},safe,guard:safe?guards[zone]:'',npc:safe?(zone==='crown'&&i===15?'archivist':'warden'):'',scene:zones[zone].terrain,salvage:!safe,enemy:!safe&&(i%3===0||i===16||zone==='crown')?foes[zone]:'',respawn:!safe&&(i%3===0||zone==='crown'),warning:safe?'Guarded refuge. Rest restores all resources and clears radiation.':zone==='crown'?'DANGER / LEVEL 8–10. A visible wind-up telegraphs a heavy strike. Brace halves its force; interrupt cancels it; flee before the charge resolves.':'',radiation:!safe&&['reed','sewer'].includes(zone)?3:0,loot:!safe?{'salvage':1+(i%3)}:{}};
});
// Refuges keep ordinary encounters out. Deliberate theft can provoke their watch.
for(const room of Object.values(rooms))if(room.safe){room.guard=(room.guard||'Kiosk watch')+' — calm armed human';room.warning='A calm human watch checks weapons, offers directions and enforces a ceasefire. Free rest and medical decontamination are available.'}
rooms['reed-16'].loot['filter core']=1; rooms['quay-16'].loot['weather recording']=1;
rooms['foundry-15'].loot['governor spindle']=1; rooms['glass-10'].loot['lens fragment']=1;
rooms['crown-14'].loot['master ledger']=1; rooms['sewer-15'].loot['drain seal']=1;
// Keep former resident sites stable. Human variants occupy additional encounter sites.
const humanSites:Record<string,string>={tunnel:'street cutthroat','quay-8':'chain brawler','reed-10':'fen trapper','foundry-10':'slag burner','glass-5':'mirror sniper','crown-8':'coil zealot','crown-11':'coil zealot','sewer-5':'sump knifer','quay-4':'harbor gunner','reed-7':'reed poacher','foundry-8':'tread brute','glass-7':'shard duelist','crown-4':'storm deserter','crown-9':'storm deserter','sewer-2':'drain scavenger'};
for(const [id,enemy] of Object.entries(humanSites)){rooms[id].enemy=enemy;rooms[id].respawn=true;rooms[id].description+=' A '+enemy+' watches the passage ahead.'}
for(const room of Object.values(rooms)){room.enemy=enemyRenames[room.enemy]??room.enemy;for(const [old,name] of Object.entries(enemyRenames))if(old!=='guard')room.description=room.description.replaceAll(old,name).replaceAll(old[0].toUpperCase()+old.slice(1),name[0].toUpperCase()+name.slice(1));}
Object.assign(zones,frontierZones);for(const room of frontierRooms)rooms[room.id]=room;
rooms['shallows-5'].enemy='sump knifer';rooms['shallows-5'].description='A narrow doorway opens above the runoff. A sump knifer steps from the darkness, one hand braced against the bricks, the other hidden beneath a patched coat.';
rooms['wilds-6'].enemy='fen trapper';rooms['wilds-6'].respawn=true;rooms['bellwether-4'].enemy='alley marksman';
rooms['sewer-0'].description+=' The shallow Lamplight Drains lie west, level 1–2 with no radiation. The deep drains east are more dangerous.';
rooms['reed-17'].description+=' A gravel road continues south into the Long Dike wilderness and onward to Bellwether.';
// Surface adjacency creates streets; subterranean adjacency creates channels. Only these shafts cross layers.
const shafts=new Set(['steps','square','yard','pump']);
for(const r of Object.values(rooms))for(const [d,[dx,dy,dz]] of Object.entries(vectors)){
 if(dz && !(d==='down'?shafts.has(r.id):Object.values(rooms).some(s=>shafts.has(s.id)&&s.x===r.x&&s.y===r.y)))continue;
 const dest=Object.values(rooms).find(t=>t.x===r.x+dx&&t.y===r.y+dy&&t.layer===r.layer+dz);
 if(dest)r.exits[d]=dest.id;
}

// Surface entrances must be recognizable before the player opens the map.
const entrances:Record<string,string>={
 steps:'An open manhole beside the steps holds a ladder down to the lamplit undercroft.',
 square:'A lifted drain cover beside the fountain reveals iron rungs leading down.',
 yard:'A service hatch between the freight rails opens onto a ladder down into the drains.',
 pump:'A maintenance hatch beneath the pump gantry leads down to its foundations.'
};
for(const [id,description] of Object.entries(entrances))rooms[id].description+=' '+description;

rooms['crown-17'].name='Cityward Lookout';rooms['crown-17'].description='Across the estuary, towers rise above the rain. Small aircraft drift between their lit windows. The city is real, and still impossibly far. West along the causeway, the receiver keeps the last ferry running.';
rooms['crown-15'].description+=' Beyond Sen’s shelter, a ferry waits below a view of distant towers and aircraft. Settle the ledger to take the crossing.';
for(const object of roomObjects.filter(object=>object.action==='jobs'))rooms[object.room].description+=' '+object.description;
