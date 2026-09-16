import {unpacked,reconcilePack} from '../src/backpack';
import {it,expect} from 'vitest';
import {command,createGame,type Game} from '../src/engine';
import {classes,origins,maxHP} from '../src/progression';
import {encode,decode} from '../src/saves';
import {rooms} from '../src/world';
import {quests} from '../src/quests';
function step(g:Game,cmd:string){const result=command(g,cmd);expect(result.changed,cmd+': '+result.messages.join(' ')).toBe(true);expect(()=>encode(result.state),cmd).not.toThrow();return decode(encode(result.state))}
it('all 60 original ending playthroughs travel through the sewers without teleportation and save after every action',()=>{
 for(const cls of Object.keys(classes))for(const origin of origins)for(const ending of ['commons','lease']){
  let g=createGame('Mara',origin,cls);for(const c of ['s','e','talk technician','w','s'])g=step(g,c);
  let n=0;while(g.encounter&&n++<30)g=step(g,g.player.hp<20&&g.player.inventory['medical supplies']?'heal':'attack');
  for(const c of ['take all','n','down','rest','s','e','e','e','up','install component','n','give key '+ending]){g=step(g,c);let guard=0;while(g.encounter&&guard++<40)g=step(g,g.player.hp<25&&g.player.inventory['medical supplies']?'heal':g.encounter.phase===2?'brace':'attack');}
  expect(g.pump).toBe(ending);expect(g.room).toBe('booth');expect(g.player.debt).toBe(0);
 }
});
function path(from:string,to:string){const queue=[from],prev:Record<string,[string,string]>={};const seen=new Set([from]);while(queue.length){const id=queue.shift()!;if(id===to)break;for(const [dir,next] of Object.entries(rooms[id].exits))if(!seen.has(next)){seen.add(next);prev[next]=[id,dir];queue.push(next)}}const dirs:string[]=[];while(to!==from){const [p,d]=prev[to];dirs.unshift(d);to=p}return dirs}
it('sustained grinding reaches level ten, unlocks all tiers, and can finish every regional quest',()=>{
 let g=createGame('Pilot','Radborn','Street Medic');let deaths=0;
 function act(c:string){g=step(g,c)}
 function fight(){let guard=0;while(g.encounter&&guard++<80){
  const learned=g.player.abilities.filter(id=>(g.cooldowns[id]??0)<=g.turns);
  if(g.player.hp<maxHP(g.player)-20&&g.player.stamina>=3&&learned.includes('triage'))act('use triage');
  else if(g.player.hp<35&&g.player.inventory['medical supplies'])act('heal');
  else if(g.encounter.phase===2&&g.player.stamina>=4&&learned.includes('nerve block'))act('use nerve block');
  else if(g.encounter.phase===2)act('brace');
  else act('attack');
  if(g.run.status==='dead'){deaths++;break}
 }expect(guard).toBeLessThan(80)}
 function travel(to:string){let guard=0;while(g.room!==to&&guard++<300){
  // The playtest pilot now manages finite pack space as a player must.
  reconcilePack(g.player);
  if(rooms[g.room].safe){while(g.player.inventory.salvage)act('sell salvage');
   for(const bag of ['field backpack','expedition frame']){if(g.player.pack.bag===bag||g.player.inventory[bag])continue;const buy=command(g,'buy '+bag);if(buy.changed)g=decode(encode(buy.state))}
  }
  while(unpacked(g.player).length){const spare=Object.keys(g.player.inventory).find(id=>['salvage','medical supplies'].includes(id));expect(spare,'a full pack can shed surplus supplies').toBeTruthy();act('drop '+spare)}
  const d=path(g.room,to)[0];act(d);fight();if(rooms[g.room].safe)act('rest');}expect(g.room).toBe(to)}
 // Scrounging and lower-band repeatable rooms provide a risk-controlled way to finance gear.
 for(let loop=0;g.player.level<10&&loop<150;loop++){
  travel('quay-0');act('rest');if(!g.player.armor&&g.player.credits>=18){act('buy armor vest');act('equip armor vest')}
  for(const room of ['quay-1','quay-2','quay-3','quay-4','quay-5','quay-6']){travel(room);if(!g.scrounged.includes(room))act('scrounge')}
  travel('quay-0');act('rest');
  for(const id of classes[g.player.className].abilities.slice(1)){const res=command(g,'learn '+id);if(res.changed)g=decode(encode(res.state))}
 }
 expect(g.player.level).toBe(10);expect(g.player.abilities).toHaveLength(4);
 travel('crown-0');act('rest');act('buy storm harness');act('equip storm harness');act('buy ceramic cleaver');act('equip ceramic cleaver');
 for(const q of Object.values(quests)){travel(q.giver);act('talk '+(q.id==='ledger'?'archivist':'warden'));travel(q.location);act('take all');travel(q.giver);act(q.id==='ledger'?'resolve erase':'deliver '+q.item);}
 expect(Object.values(g.quests).filter(s=>s==='done'||s==='erase')).toHaveLength(6);expect(deaths).toBeLessThan(5);
});
