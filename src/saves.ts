import {newBody,ailments,implants} from './medicine';
import {runRecord,legacyRunId} from './runs';
import {enemyRole} from './enemyBehavior';
import {missions,missionKey,missionRefs,missionActive,missionDone,missionProgress} from './missions';
import {fish,fishingSpots,fishingEnemyFor} from './fishing';
import {puzzleObjects,puzzleFlag} from './challenges';
import {theftObjects} from './roomObjects';
import {theftFlag,alarmFlag,subduedFlag,theftEnemyFor,activeAlarm} from './theft';
import {reconcilePack,validPack} from './backpack';
import type {Game} from './engine';
export interface WriteDecision {value?:string;quarantine?:string;error?:string}
export interface Backup {id:number;slot:string;raw:string;reason:string;at:number}
export interface StorageDriver {read(key:string):Promise<string|undefined>;update(key:string,f:(old:string|undefined)=>WriteDecision,game?:Game):Promise<void>;backups():Promise<Backup[]>}
import {createGame,enemyFor,roamingEnemyFor} from './engine';
import {createPlayer,classes,abilities,maxHP,maxStamina,xpForLevel} from './progression';
import {BALANCE as B,SKILLS,STATS} from './config';
import {rooms} from './world';
import {items} from './items';
import {quests} from './quests';
import {deliveryRoutes} from './courier';
import legacyWorld from './data/legacy-v2-world.json';
function fail(message:string):never{throw Error('Invalid save: '+message)}
function object(v:unknown):asserts v is Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.prototype)fail('expected object')}
function keys(v:unknown,expected:string[]){object(v);if(Object.keys(v).sort().join('|')!==[...expected].sort().join('|'))fail('unexpected or missing fields')}
function integer(v:unknown,min=0,max=B.maxCounter):asserts v is number{if(typeof v!=='number'||!Number.isSafeInteger(v)||v<min||v>max)fail('numeric range')}
function refs(v:unknown,valid:string[]):asserts v is string[]{if(!Array.isArray(v)||v.some(x=>typeof x!=='string'||!valid.includes(x))||new Set(v).size!==v.length)fail('reference list')}
const abilityRenames:Record<string,string>={'final notice':'last stand','wrecking claim':'wrecking blow','stay order':'disarming feint','fine print':'find the gap','reparations':'field recovery','void contract':'decisive blow'};
/** Validate the old envelope and encounter before adapting it. Never rewrite stored bytes on load. */
function migrateV2(g:Record<string,unknown>){
 keys(g,Object.keys(createGame()).filter(k=>!['courier','lootPity','run','bleed'].includes(k)));
 object(g.loot);keys(g.loot,Object.keys(legacyWorld));
 if(typeof g.room!=='string'||!Object.hasOwn(legacyWorld,g.room))fail('legacy room');
 const room=g.room;object(g.player);const p=g.player;object(g.cooldowns);
 if(!Array.isArray(p.abilities)||p.abilities.some(id=>typeof id!=='string'))fail('legacy abilities');
 p.abilities=p.abilities.map(id=>abilityRenames[id]??id);
 g.cooldowns=Object.fromEntries(Object.entries(g.cooldowns).map(([id,n])=>[abilityRenames[id]??id,n]));
 if(g.encounter!==null){
  object(g.encounter);const e=g.encounter;keys(e,['id','name','level','hp','maxHP','damage','armor','phase']);
  const old=legacyWorld[room as keyof typeof legacyWorld];const roaming=typeof e.id==='string'&&e.id.startsWith('roaming:');
  const oldVisitor:Record<string,string>={ferret:'coupon ferret',tadpole:'compliance tadpole',raider:'dock raider',stalker:'marsh stalker',hound:'furnace hound',wraith:'glass wraith',collector:'storm collector',lurker:'drain lurker'};
  const visitor=roaming?(e.id as string).split(':')[1]:'';const name=roaming?oldVisitor[visitor]:old.enemy;if(!name)fail('legacy enemy');
  const base:Record<string,[number,number,number]>={'coupon ferret':[22,5,0],'compliance tadpole':[28,6,1],guard:[34,7,2]};
  const original=base[name],hp=original?.[0]??B.enemyHPBase+old.level*B.enemyHPLevel,damage=original?.[1]??B.enemyDamageBase+old.level*B.enemyDamageLevel;
  const armor=roaming?Math.floor(old.level/2):original?.[2]??Math.floor(old.level/2);
  if(e.id!==(roaming?'roaming:'+visitor+':'+room:room)||e.name!==name||e.level!==old.level||e.maxHP!==hp||e.damage!==damage||e.armor!==armor)fail('legacy enemy template');
  integer(e.hp,1,hp);integer(e.phase,0,3);
  const next=roaming?roamingEnemyFor(room,visitor):enemyFor(room);
  g.encounter={...next,hp:Math.max(1,Math.round(e.hp/hp*next.maxHP)),phase:e.phase};
 }
 if(rooms[room].enemy&&!legacyWorld[room as keyof typeof legacyWorld].enemy){
  // A survivor already standing here gets time to leave before a newly added resident returns.
  object(g.defeated);g.defeated[room]=g.turns;
 }
 for(const r of Object.values(rooms))if(!Object.hasOwn(legacyWorld,r.id))g.loot[r.id]={...r.loot};
 g.version=3;g.courier={route:null,completed:0};g.lootPity=0;
}
export function decode(raw:string):Game{
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>B.maxSaveBytes)fail('file exceeds one megabyte');
 const parsed=JSON.parse(raw);object(parsed);const wasV2=parsed.version===2;if(wasV2)migrateV2(parsed);
 if(parsed.version===3){keys(parsed,Object.keys(createGame()).filter(k=>!['run','bleed'].includes(k)));integer(parsed.rng,1,4294967295);parsed.run=runRecord(parsed.rng,legacyRunId(raw));parsed.bleed=0;parsed.version=4;if(parsed.encounter){object(parsed.encounter);if(!wasV2)keys(parsed.encounter,['id','name','level','hp','maxHP','damage','armor','phase']);parsed.encounter.heat=0;parsed.encounter.morale='fighting'}}
 if(parsed.version===4){object(parsed.player);keys(parsed.player,Object.keys(createPlayer('Mara')).filter(k=>k!=='body'&&(k!=='pack'||Object.hasOwn(parsed.player as object,'pack'))));parsed.player.body=newBody();parsed.version=5;}
 const g=parsed as unknown as Game;if(g.version!==5)fail('unsupported version (browser v2, v3, v4 or v5 required; Python saves are separate)');
 keys(g,Object.keys(createGame()));keys(g.run,['id','seed','status','cause','endedTurn','kills','revivals']);
 if(typeof g.run.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(g.run.id))fail('run identity');integer(g.run.seed,1,4294967295);integer(g.run.kills);integer(g.run.revivals);integer(g.bleed,0,3);
 if(!['alive','dead'].includes(g.run.status)||typeof g.run.cause!=='string'||g.run.cause.length>120)fail('run status');
 if(g.run.status==='alive'){if(g.run.cause||g.run.endedTurn!==null)fail('living run summary')}else {integer(g.run.endedTurn,0,g.turns);if(g.run.endedTurn!==g.turns||!g.run.cause||g.encounter||g.bleed||g.shield||g.exposed||g.exposeTurns||g.courier.route)fail('terminal run')}
 integer(g.lootPity,0,2);keys(g.courier,['route','completed']);integer(g.courier.completed);if(g.courier.route!==null&&(typeof g.courier.route!=='string'||!Object.hasOwn(deliveryRoutes,g.courier.route)))fail('courier route');object(g.player);const p=g.player;
 if(typeof p.className!=='string')fail('class name');
 const ref=createPlayer(p.name,p.origin,p.className,p.bonus);const legacyPack=!Object.hasOwn(p,'pack');if(legacyPack)p.pack={bag:'canvas satchel',layout:{}};keys(p,Object.keys(ref));if(p.name!==ref.name)fail("noncanonical name");keys(p.stats,[...STATS]);keys(p.skills,[...SKILLS]);
 if(JSON.stringify(STATS.map(s=>p.stats[s]))!==JSON.stringify(STATS.map(s=>ref.stats[s])))fail('attributes');
 keys(p.body,['ailments','implants','commission','voucher']);refs(p.body.ailments,Object.keys(ailments));object(p.body.implants);for(const [id,n] of Object.entries(p.body.implants)){if(!Object.hasOwn(implants,id))fail('implant');integer(n,1,3)}if(!['none','active','done'].includes(p.body.commission)||typeof p.body.voucher!=='boolean'||(p.body.voucher&&p.body.commission!=='done'))fail('medical commission');
 integer(p.level,1,10);integer(p.xp);if(p.xp<xpForLevel(p.level)||(p.level<10&&p.xp>=xpForLevel(p.level+1)))fail('XP/level mismatch');
 integer(p.hp,g.run.status==='dead'?0:1,maxHP(p));if(g.run.status==='dead'&&p.hp!==0)fail('dead run health');integer(p.stamina,0,maxStamina(p));integer(p.radiation,0,100);integer(p.credits);integer(p.debt);integer(p.points,0,9);
 let spent=0;for(const skill of SKILLS){integer(p.skills[skill],ref.skills[skill],B.skillCap);spent+=p.skills[skill]-ref.skills[skill]}
 refs(p.abilities,classes[p.className].abilities);if(!p.abilities.includes(classes[p.className].abilities[0])||p.abilities.some(id=>abilities[id].level>p.level))fail('ability tier');
 if(spent+p.points+p.abilities.length-1!==p.level-1)fail('training budget');
 object(p.inventory);for(const [id,n] of Object.entries(p.inventory)){if(!Object.hasOwn(items,id))fail('unknown item');integer(n,1,items[id].quest?1:B.maxInventory)}
 if((p.inventory['sealed parcel']??0)!==(g.courier.route?1:0))fail('parcel custody');
 if(legacyPack)reconcilePack(p);if(!validPack(p))fail('backpack layout');
 if(typeof p.weapon!=='string'||!Object.hasOwn(items,p.weapon)||!items[p.weapon].damage||!p.inventory[p.weapon])fail('weapon ownership');
 if(p.armor!==null&&(typeof p.armor!=='string'||!Object.hasOwn(items,p.armor)||!items[p.armor].armor||!p.inventory[p.armor]))fail('armor ownership');
 if(!Object.hasOwn(rooms,g.room)||!Object.hasOwn(rooms,g.previous))fail('room');
 refs(g.discovered,Object.keys(rooms));if(!g.discovered.includes('clinic')||!g.discovered.includes(g.room)||!g.discovered.includes(g.previous))fail('discovery');
 if(g.previous!==g.room&&!Object.values(rooms[g.room].exits).includes(g.previous))fail('retreat geography');
 integer(g.turns);integer(g.rng,1,4294967295);integer(g.shield,0,100);integer(g.exposed,0,10);integer(g.exposeTurns,0,4);
 if((g.exposed===0)!==(g.exposeTurns===0))fail('exposure duration');
 object(g.defeated);for(const [id,t] of Object.entries(g.defeated)){if(!Object.hasOwn(rooms,id)||!rooms[id].enemy||!g.discovered.includes(id))fail('defeated room');integer(t,0,g.turns)}
 refs(g.scrounged,Object.values(rooms).filter(r=>r.salvage).map(r=>r.id));if(g.scrounged.some(id=>!g.discovered.includes(id)))fail('scrounge discovery');
 keys(g.loot,Object.keys(rooms));for(const [id,loot] of Object.entries(g.loot)){object(loot);for(const [item,n] of Object.entries(loot)){if(!Object.hasOwn(items,item))fail('ground loot');if(items[item].quest&&!Object.hasOwn(rooms[id].loot,item))fail('artifact location');integer(n,1,items[item].quest?1:B.maxInventory)}}
 refs(g.rewards,[...missionRefs,...fish.map(f=>'fish:'+f.id),...puzzleObjects.map(o=>puzzleFlag(o.id)),...theftObjects.flatMap(object=>[theftFlag(object.id),alarmFlag(object.id),subduedFlag(object.id)]),'pump','ending','freeborn',...Object.keys(quests),...Object.values(rooms).filter(r=>r.salvage).map(r=>'scrounge:'+r.id)]);
 for(const mission of missions){
  const active=missionActive(g,mission),done=missionDone(g,mission),n=missionProgress(g,mission);
  if((active||done||n)&&(!active||!g.discovered.includes(mission.giver)))fail('mission acceptance');
  if(done&&n!==mission.target)fail('incomplete mission payment');
  for(let i=1;i<=n;i++)if(!g.rewards.includes(missionKey(mission.id,i)))fail('noncontiguous mission progress');
  if(n&&(!g.rewards.some(id=>id.startsWith('fish:'))||!(mission.waters.length?mission.waters:fishingSpots.map(s=>s.room)).some(id=>g.discovered.includes(id))))fail('mission catch evidence');
 }
 for(const object of puzzleObjects)if(g.rewards.includes(puzzleFlag(object.id))&&!g.discovered.includes(object.room))fail('puzzle discovery');
 for(const f of fish)if(g.rewards.includes('fish:'+f.id)&&!fishingSpots.some(spot=>g.discovered.includes(spot.room)&&spot.table.some(([id])=>id===f.id)))fail('fish discovery');
 for(const object of theftObjects){
  const taken=g.rewards.includes(theftFlag(object.id)),alarmed=g.rewards.includes(alarmFlag(object.id)),subdued=g.rewards.includes(subduedFlag(object.id));
  if((taken||alarmed||subdued)&&!g.discovered.includes(object.room))fail('theft discovery');
  if(subdued&&!alarmed)fail('theft response without alarm');
  if(taken&&alarmed&&!subdued)fail('property taken before resolving watch');
  if(taken&&object.chance===0&&!subdued)fail('guarded property bypass');
 }
 if(g.scrounged.some(id=>!g.rewards.includes('scrounge:'+id))||g.rewards.some(id=>id.startsWith('scrounge:')&&!g.scrounged.includes(id.slice(9))))fail('scrounge reward');
 if(!['new','accepted','repaired','commons','lease'].includes(g.pump))fail('pump state');
 const repaired=['repaired','commons','lease'].includes(g.pump),ended=['commons','lease'].includes(g.pump);
 if(g.rewards.includes('pump')!==repaired||g.rewards.includes('ending')!==ended||Boolean(p.inventory['access key'])!==(g.pump==='repaired'))fail('pump reward/key');
 if((p.inventory['pump component']??0)+(g.loot.alley['pump component']??0)!==(repaired?0:1))fail('pump component custody');
 object(g.quests);for(const [id,status] of Object.entries(g.quests)){if(!Object.hasOwn(quests,id)||!(id==='ledger'?['accepted','erase','disclose']:['accepted','done']).includes(status))fail('quest state')}
 for(const q of Object.values(quests)){
  const done=['done','erase','disclose'].includes(g.quests[q.id]);if(g.rewards.includes(q.id)!==done)fail('quest reward');
  if((p.inventory[q.item]??0)+(g.loot[q.location][q.item]??0)!==(done?0:1))fail('artifact custody');
 }
 if(g.rewards.includes('freeborn')&&!['erase','disclose'].includes(g.quests.ledger))fail('city ending before ledger');
 object(g.cooldowns);for(const [id,n] of Object.entries(g.cooldowns)){if(!p.abilities.includes(id))fail('cooldown ability');integer(n,0,g.turns+abilities[id].cooldown)}
 if(g.encounter!==null){
  const e=g.encounter;object(e);const roaming=typeof e.id==='string'&&e.id.startsWith('roaming:'),theft=typeof e.id==='string'&&e.id.startsWith('theft:'),fishing=typeof e.id==='string'&&e.id.startsWith('fishing:');
  let template;
  try{template=fishing?fishingEnemyFor(g.room,e.id.split(':')[1]):theft?theftEnemyFor(e.id.slice(6)):roaming?roamingEnemyFor(g.room,e.id.split(':')[1]):enemyFor(g.room)}catch{fail('encounter template')}
  keys(e,Object.keys(template));
  if(theft){if(activeAlarm(g)?.id!==e.id.slice(6))fail('unearned watch encounter')}else if((!fishing&&((!roaming&&!rooms[g.room].enemy)||rooms[g.room].safe))||activeAlarm(g))fail('safe encounter');
  if(roaming&&rooms[g.room].enemy&&g.defeated[g.room]===undefined)fail('undefeated resident');
  for(const k of ['id','name','level','maxHP','damage','armor'] as const)if(e[k]!==template[k])fail('enemy template');
  integer(e.hp,1,e.maxHP);integer(e.phase,0,3);integer(e.heat,0,3);if(enemyRole(e.name)!=='brute'&&e.heat)fail('unexpected heat');
  if(!['fighting','surrendered','defiant'].includes(e.morale))fail('morale');if(e.morale!=='fighting'&&(enemyRole(e.name)!=='cutthroat'||e.id.startsWith('theft:')))fail('unexpected morale');
  if(e.morale==='surrendered'&&(e.phase!==3||e.hp>Math.floor(e.maxHP*.2)))fail('surrender state');
  if(!theft&&!roaming&&!fishing&&g.defeated[g.room]!==undefined&&(!rooms[g.room].respawn||g.turns-g.defeated[g.room]<B.respawnTurns))fail('enemy respawn');
 }else if(g.run.status!=='dead'){if(activeAlarm(g))fail('missing watch encounter');if(g.shield||g.exposed||g.exposeTurns||g.bleed)fail('orphan combat effects');if(rooms[g.room].enemy&&g.defeated[g.room]===undefined)fail('missing undefeated encounter');}
 return g;
}
export function encode(g:Game){const raw=JSON.stringify(g);decode(raw);return raw}
export class SaveRepository {
 private expected=new Map<string,string|undefined>();
 constructor(private driver:StorageDriver){}
 async terminal(id:string){const raw=await this.driver.read('ended:'+id);return raw?decode(raw):null}
 private async playable(g:Game){if(g.run.status==='alive'&&await this.terminal(g.run.id))throw Error('This run has ended. Load its record or begin a new patient.');}
 async save(slot:string,g:Game){
  const raw=encode(g);await this.playable(g);
  // Compare the exact observed content inside the same read/write transaction.
  // A new repository only expects an empty slot; it cannot adopt unseen bytes.
  await this.driver.update(slot,old=>{
   if(old!==undefined){try{decode(old)}catch{return {quarantine:old,error:'Corrupt '+slot+' preserved and quarantined. Recover explicitly or load the other slot.'}}}
   if(old!==this.expected.get(slot)&&!(g.run.status==='dead'&&old!==undefined&&decode(old).run.id===g.run.id))return {quarantine:raw,error:slot+' changed in another session. Stored save preserved; your branch is in quarantine. Load the latest save or recover explicitly.'};
   return {value:raw,...(g.run.status==='dead'&&old!==undefined?{quarantine:old}:{})};
  },g);
  this.expected.set(slot,raw);
 }
 async load(slot:string){
  let result:Game|undefined,observed:string|undefined;
  await this.driver.update(slot,old=>{if(old===undefined)return {error:'No '+slot+' save exists.'};try{result=decode(old);observed=old;return {}}catch(e){return {quarantine:old,error:String(e)+'. Original slot preserved; use recovery.'}}});
  this.expected.set(slot,observed);return (await this.terminal(result!.run.id))??result!;
 }
 async recover(slot:string,g:Game){const raw=encode(g);await this.playable(g);await this.driver.update(slot,old=>({value:raw,...(old!==undefined?{quarantine:old}:{})}),g);this.expected.set(slot,raw)}
 async import(raw:string,slot:string){const g=decode(raw);await this.recover(slot,g);return g}
 backups(){return this.driver.backups()}
}
export class IndexedDBDriver implements StorageDriver {
 private db:Promise<IDBDatabase>;
 constructor(name='deadlease-v2'){
  this.db=new Promise((resolve,reject)=>{const req=indexedDB.open(name,1);req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('slots');db.createObjectStore('quarantine',{keyPath:'id',autoIncrement:true})};req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();resolve(req.result)};req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Database blocked by another tab. Close it and reload.'))});
 }
 async read(key:string){const db=await this.db;return new Promise<string|undefined>((resolve,reject)=>{const req=db.transaction('slots').objectStore('slots').get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
 async update(key:string,f:(old:string|undefined)=>WriteDecision,game?:Game){
  const db=await this.db;return new Promise<void>((resolve,reject)=>{
   const tx=db.transaction(['slots','quarantine'],'readwrite');let problem:string|undefined;
   tx.oncomplete=()=>problem?reject(Error(problem)):resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??Error('Save transaction aborted.'));
   const slots=tx.objectStore('slots'),req=slots.get(key);req.onsuccess=()=>{
    const apply=(ended:string|undefined)=>{try{
     const d=f(req.result);
     if(game?.run.status==='alive'&&ended){problem='This run has ended in another session. Load its record or begin a new patient.';if(d.value)tx.objectStore('quarantine').add({slot:key,raw:d.value,reason:problem,at:Date.now()});return}
     problem=d.error;if(d.quarantine!==undefined)tx.objectStore('quarantine').add({slot:key,raw:d.quarantine,reason:d.error??'Preserved run snapshot',at:Date.now()});
     if(d.value!==undefined){slots.put(d.value,key);if(game?.run.status==='dead'&&!ended)slots.put(d.value,'ended:'+game.run.id)}
    }catch(e){problem=String(e);tx.abort()}};
    if(game){const seal=slots.get('ended:'+game.run.id);seal.onsuccess=()=>apply(seal.result)}else apply(undefined);
   };
  });
 }
 async backups(){const db=await this.db;return new Promise<Backup[]>((resolve,reject)=>{const r=db.transaction('quarantine').objectStore('quarantine').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
}
