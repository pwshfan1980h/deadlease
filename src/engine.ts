import {runRecord,resolveLethal,drone,type Run} from './runs';
import {enemyRole,behaviorIntent} from './enemyBehavior';
import {missions,missionKey,missionActive,missionDone,missionProgress,resolveMission,missionConversation,missionJournal,recordCatch} from './missions';
import {normalizeCommand,flavorFor,type Flavor} from './verbs';
import {challengeFor,puzzleAt,puzzleObjects,puzzleFlag,type Challenge,type TimingOutcome} from './challenges';
import {fish,fishingKit,fishingSpot,fishingOutcome,fishingEnemyFor,fishingWarning} from './fishing';
import {theftFlag,alarmFlag,subduedFlag,theftEnemyFor,activeAlarm,theftChance,theftDescription} from './theft';
import {bags,canCarry,reconcilePack,unpacked,capacity} from './backpack';
import {BALANCE as B,PUMP_REWARDS,SKILLS,type Skill} from './config';
import {createPlayer,abilities,classes,gainXP,learn,maxHP,maxStamina,type Player} from './progression';
import {items,weaponAttack,favoredWeapons} from './items';
import {enemyDefinition} from './enemies';
import {deliveryRoutes,type CourierState} from './courier';
import {roomObjects,resolveObject,theftObjects,type ObjectVerb} from './roomObjects';
import {rooms,zones} from './world';
import {quests} from './quests';
import {visitors,visitorAllowed} from './roaming';
import pumpText from './data/original-quest.json';
export interface Encounter {id:string;name:string;level:number;hp:number;maxHP:number;damage:number;armor:number;phase:number;heat:number;morale:'fighting'|'surrendered'|'defiant'}
export type PumpState='new'|'accepted'|'repaired'|'commons'|'lease';
export interface Game {version:4;run:Run;bleed:number;courier:CourierState;lootPity:number;player:Player;room:string;previous:string;discovered:string[];defeated:Record<string,number>;scrounged:string[];loot:Record<string,Record<string,number>>;pump:PumpState;quests:Record<string,string>;rewards:string[];encounter:Encounter|null;turns:number;rng:number;shield:number;exposed:number;exposeTurns:number;cooldowns:Record<string,number>}
export interface CombatCue {cue:string;delay:number;impact?:'player'|'enemy'}
export interface Result {state:Game;changed:boolean;messages:string[];sound:string;sounds?:CombatCue[];challenge?:Challenge;discovery?:{item:string;first:boolean};flavor?:Flavor}
export function createGame(name='Mara',origin='Baseline',cls='Enforcer',bonus='Tech',seed=670122,runId?:string):Game{
 return {version:4,run:runRecord(seed>>>0||1,runId),bleed:0,courier:{route:null,completed:0},lootPity:0,player:createPlayer(name,origin,cls,bonus),room:'clinic',previous:'clinic',discovered:['clinic'],defeated:{},scrounged:[],loot:Object.fromEntries(Object.values(rooms).map(r=>[r.id,{...r.loot}])),pump:'new',quests:{},rewards:[],encounter:null,turns:0,rng:seed>>>0||1,shield:0,exposed:0,exposeTurns:0,cooldowns:{}};
}
export function random(g:Game){let x=g.rng;x^=x<<13;x^=x>>>17;x^=x<<5;g.rng=x>>>0;return g.rng/4294967296}
export function enemyFor(room:string):Encounter{
 const r=rooms[room];const original:Record<string,[number,number,number]>={'scrap weasel':[22,5,0],'sump toad':[28,6,1],'checkpoint bruiser':[34,7,2]};const old=original[r.enemy];
 const def=enemyDefinition(r.enemy);const hp=old?.[0]??Math.round((B.enemyHPBase+r.level*B.enemyHPLevel)*def.hpScale);
 return {id:room,name:r.enemy,level:r.level,hp,maxHP:hp,damage:old?.[1]??Math.max(2,Math.round((B.enemyDamageBase+r.level*B.enemyDamageLevel)*def.damageScale)),armor:old?.[2]??Math.floor(r.level/2),phase:0,heat:0,morale:'fighting'};
}
export function roamingEnemyFor(room:string,visitorId:string):Encounter{
 const r=rooms[room],v=visitors[visitorId];
 if(!r||!visitorAllowed(visitorId,r)||v.role==='neutral'||r.safe)throw Error('Invalid roaming encounter');
 const original=Object.values(rooms).find(candidate=>candidate.enemy===v.name)!;
 const template=enemyFor(original.id),level=r.level;
 const hp=v.name==='scrap weasel'?22:v.name==='sump toad'?28:Math.round((B.enemyHPBase+level*B.enemyHPLevel)*enemyDefinition(v.name).hpScale);
 return {...template,id:'roaming:'+visitorId+':'+room,level,hp,maxHP:hp,damage:v.name==='scrap weasel'?5:v.name==='sump toad'?6:Math.max(2,Math.round((B.enemyDamageBase+level*B.enemyDamageLevel)*enemyDefinition(v.name).damageScale)),armor:Math.floor(level/2)};
}
export function engageVisitor(source:Game,visitorId:string,initiatedByPlayer=false):Result{
 const reject=(message:string):Result=>({state:source,changed:false,messages:[message],sound:'error'});
 const r=rooms[source.room];
 if(source.run.status==='dead')return reject('This run has ended. Begin a new patient.');
 if(source.encounter)return reject('Resolve the current encounter first.');
 if(!visitorAllowed(visitorId,r))return reject('That visitor is not here.');
 const v=visitors[visitorId];
 if(v.role==='neutral'||r.safe)return reject('This traveler is neutral. There is no fight to pick.');
 if(!initiatedByPlayer&&v.role!=='hostile')return reject('It leaves you alone.');
 if(source.turns>=B.maxCounter)return reject('This archival save has reached the supported turn limit.');
 const g=structuredClone(source);g.encounter=roamingEnemyFor(g.room,visitorId);
 if(initiatedByPlayer)return command(g,'attack '+v.name);
 const messages=[v.arrival];g.turns++;const hit=respond(g,messages);
 const sound=g.run.status==='dead'?'death':g.run.revivals>source.run.revivals?'attack-revive':'attack-'+enemyDefinition(v.name).kind;
 return {state:g,changed:true,messages,sound,sounds:[{cue:'attack-'+enemyDefinition(v.name).kind,delay:0},...(hit?[{cue:'attack-impact',delay:140,impact:'player' as const}]:[]),...(sound==='death'?[{cue:'death',delay:620}]:sound==='attack-revive'?[{cue:'attack-revive',delay:400}]:[])]};
}
export function enterEncounter(g:Game){if(g.run.status==='dead')return;const alarm=activeAlarm(g);if(alarm){g.encounter=theftEnemyFor(alarm.id);return}const r=rooms[g.room];if(r.enemy&&!r.safe&&(g.defeated[r.id]===undefined||(r.respawn&&g.turns-g.defeated[r.id]>=B.respawnTurns)))g.encounter=enemyFor(r.id)}
export function intent(e:Encounter){return behaviorIntent(e)??['STRIKE · a measured attack is next.','WIND-UP · '+enemyDefinition(e.name).windup+' No damage this response.','HEAVY STRIKE · '+(e.damage*B.spikeMultiplier)+'–'+(e.damage*B.spikeMultiplier+B.enemyVariance-1)+' raw damage next! Brace, cover, interrupt or flee.','RECOVERING · no damage this response. Attack or heal.'][e.phase]}
export function incomingDamage(raw:number,armor:number,shield:number,brace:boolean,cover:boolean,insulation:number){
 let n=Math.max(1,raw-armor-insulation);if(brace)n=Math.max(1,Math.floor(n*B.braceSpikeFactor)-B.braceFlat);if(cover)n=Math.max(1,Math.floor(n*B.coverFactor));return Math.max(1,n-shield);
}
function baseRoomDescription(g:Game){
 if(g.room==='pump'&&['repaired','commons','lease'].includes(g.pump))return 'The ceramic cartridge holds. Water fills the TEAMWORK mug and keeps going. For once, a machine is doing what it says on the plate.';
 if(g.room==='booth'&&g.pump!=='new'&&g.pump!=='accepted')return g.pump==='repaired'?'PUMP STATUS: ACTIVE. COMMONS and SYNDICATE receivers wait. Give key commons or give key syndicate. The decision is permanent.':'PUMP STATUS: ACTIVE. ACCESS ASSIGNED: '+(g.pump==='lease'?'syndicate':g.pump).toUpperCase()+'. Water runs through the district again.';
 return rooms[g.room].description;
}
export function roomDescription(g:Game){if(g.encounter?.id.startsWith('fishing:'))return g.encounter.name==='pallid bankmaw'?'Something enormous has followed the line ashore. Pale jaws scrape the bank; four heavy feet block the waterline. The old predator attacks on sight.':'A fish-shaped quadruped scrabbles onto the bank, gills flared and teeth bared. It attacks before you can lift the rod.';const alarm=activeAlarm(g);if(alarm)return theftDescription(alarm,g);return [baseRoomDescription(g),...theftObjects.filter(object=>object.room===g.room).map(object=>theftDescription(object,g)),...puzzleObjects.filter(object=>object.room===g.room).map(object=>g.rewards.includes(puzzleFlag(object.id))?object.empty:object.description),...(fishingSpot(g.room)?[fishingSpot(g.room)!.description,fishingWarning,...(rooms[g.room].safe?['The watch protects the shelter, not the waterline.']:[])]:[])].join(' ')}
export const HELP=`EXPLORE: n/s/e/w/up/down; go <direction>; look; talk <name>; inspect <target/item/room/stat>; take all; scrounge; rest.
COMBAT: attack [target]; aim (firearm); brace (free, halve damage −6); cover (3 stamina, reduce damage 65%); heal / use medical supplies; use <ability>; flee (parting attack in cover).
VISITORS: inspect <name>; talk <name>; attack <name>. Neutral travelers pass peacefully; defensive creatures fight back; hostiles attack on sight. Room activity runs in real time; combat waits for commands.
PACK: inventory (drag items; R rotate; arrows + Enter also work); drop <item>; equip canvas satchel / field backpack / expedition frame. Grit adds pack rows.
PROGRESS: inventory; equip <item>; buy <item>; sell <item>; jobs; skills; train <skill>; learn <class ability>; stats; journal.
MISSIONS: talk to people for personal requests; missions for progress; accept mission <id>; report <id> at the giver. Board jobs remain separate.
INTERACTIONS: inspect <object>; pick <lock>; hack <terminal>; fish at accessible water with a packed telescopic fishing kit; eat <fish>. Fishing requires two timed Space presses.
JOBS: read board / inspect board (where posted); jobs (work journal anywhere); accept <route-id>; deliver parcel. Repeatable paid routes connect the clinic, freight yard and Bellwether.
QUESTS: install component; give key commons OR give key syndicate; deliver <artifact>; resolve erase OR resolve disclose; depart (city ending at Crown Receiver after the ledger).
SYSTEM: help; view (enlarge art); map [surface/sewers/local/world]; map fog/labels/hazards on/off; settings; menu; palette original/ember/tidal; mute; volume master/effects/ambience/music <0–100>; save; load; load auto; export; import.
Up/Down history · Tab minimap · Ctrl+Space completion · Escape close overlay / pause · PageUp/PageDown log. Reading and invalid commands never advance combat. Hunting grounds return after 12 world turns; leave and re-enter. Safe refuges restore HP/stamina and clear radiation. Type spare to accept an offered surrender. Bleeding costs 2 HP per combat action; heal stops it. Death ends the run. A packed Stitch Drone rescues you once per item; unpacked drones cannot activate. Level cap 10.`;
export function look(g:Game){const r=rooms[g.room];if(g.run.status==='dead')return ['RUN ENDED / '+g.player.name+' · '+g.run.cause+' · '+r.name+'. Begin a new patient.'];return [r.name+' / '+zones[r.zone].name+' / level '+r.level,roomDescription(g),...(r.guard&&!g.encounter&&!theftObjects.some(object=>object.room===g.room&&g.rewards.includes(alarmFlag(object.id)))?[r.guard+' protects this refuge.']:[]),...(r.npc?['Here: '+r.npc+'. talk '+r.npc]:[]),...(r.warning&&!g.encounter?[r.warning]:[]),...(g.encounter?[g.encounter.name+' · HP '+g.encounter.hp+'/'+g.encounter.maxHP,intent(g.encounter)]:[]),...(Object.keys(g.loot[g.room]).length?['Ground: '+Object.entries(g.loot[g.room]).map(([k,v])=>k+' ×'+v).join(', ')]:[]),'Exits: '+Object.entries(r.exits).map(([d,id])=>d+' → '+rooms[id].name+' [L'+rooms[id].level+']').join(' · ')]}
export function clearEncounter(g:Game){g.encounter=null;g.shield=0;g.exposed=0;g.exposeTurns=0;g.bleed=0}
function rewardKill(g:Game,m:string[],peace=false){if(g.encounter&&g.encounter.hp<=0){
 const e=g.encounter,roaming=e.id.startsWith('roaming:'),theft=e.id.startsWith('theft:'),fishing=e.id.startsWith('fishing:');
 if(theft)g.rewards.push(subduedFlag(e.id.slice(6)));else if(!roaming&&!fishing)g.defeated[g.room]=g.turns;
 const factor=peace?.5:1,xp=Math.floor(e.level*B.enemyXPLevel*factor),credits=Math.floor(e.level*B.enemyCreditsLevel*factor);gainXP(g.player,xp);g.player.credits=Math.min(B.maxCounter,g.player.credits+credits);
 m.push((peace?'RESOLVED / ':'DEFEATED / ')+e.name+'. +'+xp+' XP, +'+credits+' credits. '+(theft?'The watch response is over.':fishing?'The bank is clear again.':roaming?'The passing threat is gone.':rooms[g.room].respawn?'Returns after 12 turns away.':'This opponent stays cleared.'));
 if(!peace){g.run.kills++;g.player.inventory.salvage=(g.player.inventory.salvage??0)+1;rollSpoils(g,m);rollFishingGear(g,m);if(e.level>=3&&random(g)<.03){g.loot[g.room][drone]=(g.loot[g.room][drone]??0)+1;m.push('FOUND / A sealed Stitch Drone lies among the wreckage.');}}
 reconcilePack(g.player);if(unpacked(g.player).length)m.push('PACK FULL / Salvage is unpacked. Make room in inventory before traveling.');clearEncounter(g);
}}
function morale(g:Game,m:string[]){const e=g.encounter;if(!e||e.id.startsWith('theft:')||e.morale!=='fighting'||e.hp>Math.floor(e.maxHP*.2))return;
 const role=enemyRole(e.name);if(role==='cutthroat'){e.morale='surrendered';e.phase=3;m.push('SURRENDER / '+e.name+' lowers their weapon. “Enough.” Type spare, or attack to refuse.');}
 else if(role==='marksman'&&e.phase===2){m.push('RETREAT / '+e.name+' abandons the firing position and runs.');e.hp=0;rewardKill(g,m,true)}
}
export function rollSpoils(g:Game,m:string[]){
 g.lootPity++;if(g.lootPity<3&&random(g)>=.35)return;g.lootPity=0;
 const level=Math.max(g.player.level,rooms[g.room].level),favored=favoredWeapons(g.player.className,level);
 const offClass=Object.keys(items).filter(id=>items[id].damage&&items[id].tier!<=level&&!items[id].classes?.includes(g.player.className));
 const pool=random(g)<.85||!offClass.length?favored:offClass;
 const best=Math.max(...pool.map(id=>items[id].tier!));const candidates=pool.filter(id=>items[id].tier===best);
 const id=candidates[Math.floor(random(g)*candidates.length)];if(!id)return;
 g.loot[g.room][id]=Math.min(B.maxInventory,(g.loot[g.room][id]??0)+1);m.push('FOUND / '+id+' lies on the ground. Take it if you have room.');
}
export function rollFishingGear(g:Game,m:string[]){
 const wet=['sewer','shallows','quay','reed','wilds'].includes(rooms[g.room].zone);
 if(random(g)>=(wet?.18:.04))return;
 const id=random(g)<.3?fishingKit:'fishing bait';g.loot[g.room][id]=Math.min(B.maxInventory,(g.loot[g.room][id]??0)+1);m.push('FOUND / '+id+' lies among the salvage.');
}
export function abilitySound(cls:string,id:string,kinds:string[]){
 if(!kinds.includes('damage')&&!kinds.includes('leech'))return kinds.includes('heal')?'heal':'block';
 if(cls==='Wirewright'||cls==='Street Medic')return 'electric';
 if(cls==='Ash Warden')return 'fire';if(cls==='Sump Apostle'||kinds.includes('leech'))return 'drain';
 if(cls==='Glassrunner'||cls==='Ferryman')return 'blade';
 if(cls==='Surveyor'||cls==='Enforcer'||cls==='Advocate')return 'rifle';
 return id==='shrapnel fan'?'rifle':'blunt';
}
export function courierJournal(g:Game){const active=g.courier.route?deliveryRoutes[g.courier.route]:null;return active?['COURIER / '+active.cargo+' for '+rooms[active.to].name+'. '+active.credits+' credits on delivery. Type deliver parcel there.']:['COURIER / '+g.courier.completed+' deliveries completed.',...Object.values(deliveryRoutes).filter(route=>route.from===g.room).map(route=>route.id+' / '+route.name+' to '+rooms[route.to].name+' · '+route.credits+' credits. Type accept '+route.id), 'Freight Yard and Reclamation Clinic offer local work. Freight Yard and Bellwether Post offer long-distance dispatches.'];}
function respond(g:Game,m:string[],brace=false,cover=false,interrupt=false,flee=false){
 const e=g.encounter;if(!e||e.morale==='surrendered')return false;let hit=false;const role=e.id.startsWith('theft:')?'standard':enemyRole(e.name);
 if(interrupt){e.phase=3;if(role==='brute')e.heat=3;m.push(role==='marksman'?'INTERRUPTED / The aimed attack collapses. A hurried snapshot is next.':'INTERRUPTED / The attack collapses. Enemy now recovering.');return false}
 const phase=e.phase;
 if(role==='marksman'&&phase===0){e.phase=cover?2:1;m.push(cover?'AIM BROKEN / You slip behind cover. The marksman abandons the shot and reloads.':'AIM / The marksman settles their sights. Cover, brace or interrupt the shot.');return false}
 if(role==='marksman'&&phase===2){e.phase=3;m.push('RELOAD / The marksman feeds a new round.');return false}
 if(role==='brute'&&phase===3&&e.heat>0){e.heat--;if(e.heat===0)e.phase=0;m.push('COOLING / The tread brute vents heat. '+e.heat+'/3 heat remains.');return false}
 const attacking=role==='marksman'?(phase===1||phase===3):(phase===0||phase===2);
 if(attacking){
  const heavy=role==='marksman'?phase===1:phase===2,multiplier=heavy?(role==='marksman'?2:B.spikeMultiplier):1;
  if(heavy||random(g)<B.enemyAccuracy){
   const armor=(g.player.armor?items[g.player.armor].armor??0:0)+(g.player.className==='Ash Warden'?B.ashArmor:0),insulation=heavy&&g.player.armor?items[g.player.armor].insulation??0:0;
   const raw=e.damage*multiplier+Math.floor(random(g)*B.enemyVariance);let damage=incomingDamage(raw,armor,g.shield,brace,cover,insulation);
   if(flee&&g.player.className==='Ferryman')damage=Math.max(1,Math.floor(damage*B.ferrymanFactor));
   const unshielded=incomingDamage(raw,armor,0,brace,cover,insulation);g.shield=Math.max(0,g.shield-unshielded);hit=true;g.player.hp=Math.max(0,g.player.hp-damage);
   m.push((heavy?'SPIKE':'HIT')+' / '+e.name+' deals '+damage+' HP.');
   if(role==='cutthroat'&&!brace&&!cover&&g.player.hp>0){g.bleed=3;m.push('BLEEDING / 2 HP for the next 3 combat actions. Heal or cleanse to stop it; guarded cuts do not reopen it.');}
  }else m.push('MISS / The enemy strikes wet concrete.');
  if(role==='brute')e.heat=Math.min(3,e.heat+(phase===2?2:1));
 }else {m.push(phase===1?'WIND-UP / '+enemyDefinition(e.name).windup+' A heavy strike is next.':'RECOVER / '+enemyDefinition(e.name).recovery);if(role==='brute'&&phase===1)e.heat=Math.min(3,e.heat+1)}
 e.phase=(e.phase+1)%4;if(g.exposeTurns>0&&--g.exposeTurns===0)g.exposed=0;
 if(g.player.hp===0)resolveLethal(g,e.name,m);if(g.encounter)m.push(intent(g.encounter));return hit;
}
export function command(source:Game,text:string,options:{timing?:TimingOutcome;interactive?:boolean}={}):Result{
 const raw=normalizeCommand(text);let [verb,...args]=raw.split(' ');let arg=args.join(' ');if(verb==='give'&&arg==='key syndicate')arg='key lease';
 verb=({a:'attack',l:'look',i:'inventory',inv:'inventory',get:'take',grab:'take',snatch:'steal',swipe:'steal',pocket:'steal'} as Record<string,string>)[verb]??verb;
 const unchanged=(message:string|string[]):Result=>({state:source,changed:false,messages:Array.isArray(message)?message:[message],sound:'error'});
 const read=(m:string|string[])=>({...unchanged(m),sound:'submit'});
 if(source.run.status==='dead')return read('This run has ended. Begin a new patient.');
 if(!raw)return read([]);
 const flavor=flavorFor(source,verb,arg,roomDescription(source));
 if(flavor&&(!source.encounter||['inspect','search','listen','smell'].includes(verb)))return {...read(flavor.message),flavor};
 if(['inspect','read','search'].includes(verb)){const object=puzzleAt(source,arg);if(object)return read(source.rewards.includes(puzzleFlag(object.id))?object.empty:object.description)}
 if(verb==='use'&&((items[arg]?.food??0)>0||(items[arg]?.foodStamina??0)>0))verb='eat';
 if(verb==='help')return read(HELP);
 if(['read','inspect','look'].includes(verb)&&arg){
  const target=arg.replace(/^at /,'').replace(/^the /,''),matches=resolveObject(source.room,target);
  if(matches.length>1)return read('Which one? '+matches.map(object=>object.id).join(' / ')+'.');
  if(matches.length===1){const object=matches[0];return read(object.verbs.includes(verb as ObjectVerb)?object.action==='jobs'?courierJournal(source):theftDescription(object,source):'There is nothing to read on the '+object.name+'.');}
  if(roomObjects.some(object=>object.action==='jobs'&&(object.aliases.includes(target)||object.id===target)))return read('There is no jobs board here. Boards are posted at Reclamation Clinic, Freight Yard, and Bellwether Post. Type jobs to check your work journal.');
  if(verb==='read')return read('Nothing readable by that name here. Type look to see the room.');
 }
 if(verb==='look')return read(look(source));
 if(verb==='inventory')return read(Object.entries(source.player.inventory).map(([k,v])=>`${k} ×${v} · ${items[k].description}`));
 if(verb==='stats')return read(`${source.player.name} / ${source.player.origin} / ${source.player.className} · Level ${source.player.level} · ${source.player.xp} XP · ${Object.entries(source.player.stats).map(([k,v])=>k+' '+v).join(' · ')} · ${source.player.credits} credits · ${source.player.debt} debt`);
 if(verb==='skills')return read([Object.entries(source.player.skills).map(([k,v])=>k+' '+v+'/5').join(' · '),source.player.points+' training points. '+classes[source.player.className].passive,...classes[source.player.className].abilities.map(id=>abilities[id].name+' [L'+abilities[id].level+'] '+abilities[id].description)]);
 if(verb==='journal')return read(journal(source));
 if(verb==='jobs')return read(courierJournal(source));
 if(verb==='missions')return read(missionJournal(source));
 if(verb==='inspect'){
  if(arg==='target'&&source.encounter)return read(`${source.encounter.name}: ${source.encounter.hp} HP, ${source.encounter.armor} armor, ${source.encounter.damage} base damage. ${intent(source.encounter)}`);
  if(Object.hasOwn(items,arg))return read(items[arg].description);
  if(Object.hasOwn(abilities,arg))return read(abilities[arg].description+` Costs ${abilities[arg].cost} stamina. Cooldown ${abilities[arg].cooldown} actions.`);
  const r=Object.values(rooms).find(r=>(r.id===arg||r.name.toLowerCase()===arg)&&source.discovered.includes(r.id));
  if(r)return read(r.id===source.room?roomDescription(source):r.description);
  const details:Record<string,string>={grit:'Physical strength: each point above 3 adds a backpack row, up to three extra rows. HP = 24 + 6×Grit + 6×(level−1). Stamina = 12 + 3×Grit + 2×(level−1).',reflex:'Each point adds 2 percentage points to basic attack accuracy.',wits:'Each point above 4 adds 2 HP to supply healing.',nerve:'Each point above 4 discounts merchant prices by 1 credit.',radiation:'At 50+: −15 accuracy. Clinic/refuge rest clears exposure. Radborn and insulated armor reduce incoming exposure.',brace:'Free defensive action. Halves incoming damage, then subtracts 6. Enemy responds.',cover:'Costs 3 stamina. Reduces incoming damage by 65%. Enemy responds.'};
  return read(Object.hasOwn(details,arg)?details[arg]:'Nothing known by that name. Inspect target, a discovered room, item, attribute or ability.');
 }
 if(source.turns>=B.maxCounter)return unchanged('This archival save has reached the supported turn limit. Export it to retain the record.');
 const challenge=challengeFor(source,verb,arg);
 if(typeof challenge==='string')return unchanged(challenge);
 if(challenge&&!options.timing&&(challenge.kind!=='strike'||options.interactive))return {...read([]),challenge};
 if(challenge?.kind==='fishing'&&options.timing==='skill')return unchanged('Fishing requires both timing checks.');
 const g=structuredClone(source);const sounds:CombatCue[]=[];const p=g.player;const r=rooms[g.room];const m:string[]=[];let sound='submit';let response=false;let brace=false;let cover=false;let interrupt=false;let retreat=false;let discovery:Result['discovery'];
 const directions:Record<string,string>={north:'n',south:'s',east:'e',west:'w',n:'n',s:'s',e:'e',w:'w',up:'up',down:'down',u:'up',d:'down'};
 const propertyTargets=['take','steal'].includes(verb)&&arg!=='all'&&!(verb==='take'&&Object.hasOwn(g.loot[g.room],arg))?resolveObject(g.room,arg).filter(object=>object.action==='theft'):[];
 if(propertyTargets.length>1)return unchanged('Which one? '+propertyTargets.map(object=>object.name+' ('+object.id+')').join(' / ')+'.');
 if(verb==='spare'||(verb==='accept'&&arg==='surrender')){if(!g.encounter||g.encounter.morale!=='surrendered')return unchanged('Nobody is offering surrender.');m.push('SPARED / You let them lower the weapon and leave.');g.encounter.hp=0;g.turns++;rewardKill(g,m,true);return {state:g,changed:true,messages:m,sound:'submit'};}
 if(flavor){m.push(flavor.message,'The opponent does not wait for your performance.');response=true;}
 else if(challenge&&challenge.kind!=='strike'){
  const success=options.timing==='success'||(options.timing==='skill'&&random(g)<Math.min(.9,.45+p.skills.Tech*.08));
  if(challenge.kind==='fishing'){
   if(p.inventory['fishing bait'])consume(p,'fishing bait');
   if(success){
    const spot=fishingSpot(g.room)!,outcome=fishingOutcome(spot,random(g));
    if('enemy' in outcome){g.encounter=fishingEnemyFor(g.room,outcome.enemy);response=true;m.push('THE LINE GOES HEAVY / '+(outcome.enemy==='pallid bankmaw'?'A huge pallid bankmaw tears through the waterline. This old predator could kill you.':'A mudskipper hound lunges ashore on four clawed feet.')+' It attacks!');}
    else {const id=outcome.fish,first=!g.rewards.includes('fish:'+id);p.inventory[id]=(p.inventory[id]??0)+1;if(first)g.rewards.push('fish:'+id);gainXP(p,2);discovery={item:id,first};
     m.push('CAUGHT / '+id+'. '+fish.find(f=>f.id===id)!.description);recordCatch(g,m);if(first)m.push(spot.rumor);sound='loot';}
   }else m.push(options.timing==='cancel'?'You reel in an empty line.':'The line goes slack. The fish gets away.');
  }else{
   const object=puzzleAt(g,arg)!;
   if(success){g.rewards.push(puzzleFlag(object.id));sound='loot';
    if(challenge.kind==='lock'){p.inventory[fishingKit]=(p.inventory[fishingKit]??0)+1;p.inventory['fishing bait']=(p.inventory['fishing bait']??0)+3;discovery={item:fishingKit,first:true};m.push('OPEN / Three pins lift. Inside: a telescopic fishing kit and three bait tins. The collapsed kit occupies one pack cell.');}
    else{p.credits+=30;m.push('SIGNAL ACCEPTED / The terminal releases a forgotten maintenance payment. +30 credits. The display marks the transfer complete.');}
   }else m.push(challenge.kind==='lock'?'The pins fall back. The tackle box stays locked.':'The terminal rejects the unfinished handshake. Its queued credit remains untouched.');
  }
 }else if(verb==='eat'){
  const food=items[arg];if(!food||!p.inventory[arg]||!((food.food??0)>0||(food.foodStamina??0)>0))return unchanged('That is not something you can eat.');
  if(p.hp===maxHP(p)&&p.stamina===maxStamina(p))return unchanged('You are already fed and rested. Keep it for later.');
  consume(p,arg);p.hp=Math.min(maxHP(p),p.hp+(food.food??0));p.stamina=Math.min(maxStamina(p),p.stamina+(food.foodStamina??0));m.push('ATE / '+arg+'. You recover your strength.');sound='heal';response=!!g.encounter;
 }else if(propertyTargets.length===1){
  const object=propertyTargets[0];if(object.action!=='theft')return unchanged('That cannot be taken.');
  if(g.encounter)return unchanged('Resolve the encounter first. Fight or flee.');
  if(g.rewards.includes(theftFlag(object.id)))return unchanged('The '+object.name+' is already gone.');
  if((p.inventory[object.item]??0)+object.count>B.maxInventory||!canCarry(p,{[object.item]:object.count}))return unchanged('There is no room for that in your pack. You leave it untouched.');
  const subdued=g.rewards.includes(subduedFlag(object.id));
  if(subdued||(object.chance>0&&random(g)<theftChance(object,p))){
   g.rewards.push(theftFlag(object.id));p.inventory[object.item]=(p.inventory[object.item]??0)+object.count;
   m.push(subdued?'TAKEN / '+object.count+' '+object.item+'. The watch no longer bars your way.':object.success);sound='loot';
  }else{
   g.rewards.push(alarmFlag(object.id));g.encounter=theftEnemyFor(object.id);m.push(object.caught);response=true;
  }
 }else if(verb==='steal')return unchanged('You see nothing by that name here.');
 else if(directions[verb]||verb==='go'){
  const d=directions[verb==='go'?arg:verb];if(!d||!r.exits[d]||(verb!=='go'&&arg))return unchanged('No exit that way. Type look.');
  if(g.encounter)return unchanged('An opponent bars the way. Fight or flee.');
  reconcilePack(p);if(unpacked(p).length)return unchanged('Your pack will not close. Open inventory to repack, equip a larger backpack, or drop spare items.');
  g.previous=g.room;g.room=r.exits[d];if(!g.discovered.includes(g.room))g.discovered.push(g.room);enterEncounter(g);m.push(...look(g));
 }else if(['attack','aim','brace','cover','heal','flee','rest','use'].includes(verb)){
  if(verb==='use'&&arg==='medical supplies'){verb='heal';arg=''}
  if(['attack','aim','brace','cover','flee'].includes(verb)&&!g.encounter)return unchanged('No active opponent.');
  if(['brace','cover','heal','flee','rest'].includes(verb)&&arg)return unchanged('This action takes no argument.');
  if(['attack','aim'].includes(verb)&&arg&&!['target',g.encounter!.name].includes(arg))return unchanged('That target is not here.');
  response=verb!=='rest';
  if(verb==='rest'){
   if(g.encounter)return unchanged('Cannot rest during combat. Fight or flee.');
   p.hp=r.safe?maxHP(p):Math.min(maxHP(p),p.hp+B.restHP);p.stamina=r.safe?maxStamina(p):Math.min(maxStamina(p),p.stamina+B.restStamina+p.skills.Tech*B.techRestRecovery);if(r.safe)p.radiation=0;
   m.push(r.safe?'REFUGE / Guards keep watch. HP and stamina restored; radiation cleared.':'REST / Recovered HP and stamina. Exposure still applies here.');sound='heal';
  }else if(verb==='attack'||verb==='aim'){
   const weapon=items[p.weapon];const cost=p.className==='Surveyor'?B.surveyorAimCost:B.aimCost;
   if(verb==='aim'&&(weapon.skill!=='Firearms'||p.stamina<cost))return unchanged('Aim requires a firearm and '+cost+' stamina.');
   if(g.encounter!.morale==='surrendered'){g.encounter!.morale='defiant';m.push('REFUSED / They snatch their weapon back up.');}
   if(verb==='aim')p.stamina-=cost;
   const skill=p.skills[weapon.skill!];const chance=Math.max(B.minAccuracy,Math.min(B.maxAccuracy,B.baseAccuracy+B.reflexAccuracy*p.stats.Reflex+B.skillAccuracy*skill+(verb==='aim'?B.aimAccuracy:0)+(p.className==='Glassrunner'?B.glassAccuracy:0)-(p.radiation>=B.radThreshold?B.radPenalty:0)));
   if(random(g)*100<chance){const damage=Math.max(1,weapon.damage!+B.skillDamage*skill+Math.floor(random(g)*B.damageVariance)-Math.max(0,g.encounter!.armor-g.exposed));g.encounter!.hp-=damage;m.push('HIT / Your '+p.weapon+' deals '+damage+' damage.')}else m.push('MISS / Your '+p.weapon+' attack misses.');
   if(verb==='attack')p.stamina=Math.min(maxStamina(p),p.stamina+B.attackRecovery+(p.className==='Wirewright'?B.wireRecovery:0));sound='attack-'+weaponAttack(p.weapon);sounds.push({cue:sound,delay:0},{cue:m.some(line=>line.startsWith('MISS'))?'attack-miss':'attack-impact',delay:140,...(!m.some(line=>line.startsWith('MISS'))?{impact:'enemy' as const}:{})});
  }else if(verb==='brace'){brace=true;if(p.className==='Enforcer')p.stamina=Math.min(maxStamina(p),p.stamina+B.enforcerRecovery);m.push('BRACE / Halve incoming damage, then reduce it by 6.');sound='attack-block';}
  else if(verb==='cover'){if(p.stamina<B.coverCost)return unchanged('Cover costs 3 stamina. Brace is free.');p.stamina-=B.coverCost;cover=true;m.push('COVER / Incoming damage reduced by 65%.');}
  else if(verb==='heal'){if((p.hp===maxHP(p)&&!g.bleed)||!p.inventory['medical supplies'])return unchanged('Healing needs an injury and medical supplies.');consume(p,'medical supplies');g.bleed=0;const amount=B.healBase+B.healMedicine*p.skills.Medicine+B.healWits*(p.stats.Wits-4)+(p.className==='Street Medic'?B.medicBonus:0);p.hp=Math.min(maxHP(p),p.hp+amount);m.push('HEAL / Patched for up to '+amount+' HP. One supply consumed.');sound='heal';}
  else if(verb==='flee'){cover=true;retreat=true;m.push('FLEE / Retreating in cover; one parting response.');}
  else if(verb==='use'){
   const a=abilities[arg];if(!a||!p.abilities.includes(arg))return unchanged('Learn an available class ability first. See skills.');
   if(!g.encounter)return unchanged('Class abilities require an active encounter. Rest safely outside combat.');
   if(p.stamina<a.cost)return unchanged('Not enough stamina. Basic attack restores 2; brace is free.');
   if((g.cooldowns[arg]??0)>g.turns)return unchanged('Ability cooling down for '+(g.cooldowns[arg]-g.turns)+' actions.');
   if(challenge?.kind==='strike'&&options.timing==='success')m.push('CRITICAL / Perfect timing.');
   if(g.encounter.morale==='surrendered'){g.encounter.morale='defiant';m.push('REFUSED / They grab their weapon.');}
   p.stamina-=a.cost;g.cooldowns[arg]=g.turns+a.cooldown+1;m.push(a.name.toUpperCase()+' / '+a.description);
   for(const effect of a.effects){switch(effect.kind){
    case 'damage':g.encounter.hp-=Math.max(1,Math.round(effect.power*(options.timing==='success'?1.5:1))-Math.max(0,g.encounter.armor-g.exposed));break;
    case 'leech':{const n=Math.min(g.encounter.hp,Math.max(1,Math.round(effect.power*(options.timing==='success'?1.5:1))-Math.max(0,g.encounter.armor-g.exposed)));g.encounter.hp-=n;p.hp=Math.min(maxHP(p),p.hp+n);break}
    case 'heal':g.bleed=0;p.hp=Math.min(maxHP(p),p.hp+effect.power);break;
    case 'shield':g.shield=Math.min(B.shieldCap,g.shield+effect.power);break;
    case 'interrupt':interrupt=true;break;
    case 'cover':cover=true;break;
    case 'cleanse':g.bleed=0;p.radiation=Math.max(0,p.radiation-effect.power);break;
    case 'stamina':p.stamina=Math.min(maxStamina(p),p.stamina+effect.power);break;
    case 'expose':g.exposed=effect.power;g.exposeTurns=B.exposureDuration;break;
   }}sound='attack-'+abilitySound(p.className,a.id,a.effects.map(e=>e.kind));sounds.push({cue:sound,delay:0});if(a.effects.some(e=>e.kind==='damage'||e.kind==='leech'))sounds.push({cue:'attack-impact',delay:140,impact:'enemy'});
  }
 }else{
  const result=worldAction(g,verb,arg,m);if(result!==true)return unchanged(result);sound=['take','scrounge','install','give','deliver','resolve','buy','sell'].includes(verb)?'loot':'submit';
 }
 if(sound==='attack-block'&&!sounds.length)sounds.push({cue:sound,delay:0});
 g.turns++;rewardKill(g,m);morale(g,m);if(response&&g.encounter&&g.bleed){g.player.hp=Math.max(0,g.player.hp-2);g.bleed--;m.push('BLEED / 2 HP lost; '+g.bleed+' actions remain.');sounds.push({cue:'attack-drain',delay:0,impact:'player'});if(!g.player.hp)resolveLethal(g,'bleeding',m);}
 if(response&&g.encounter&&g.run.revivals===source.run.revivals){const enemy=g.encounter,phase=enemy.phase,delay=sounds.length?380:0;if(!interrupt){const aimed=!enemy.id.startsWith('theft:')&&enemyRole(enemy.name)==='marksman';const cue=(aimed?phase===0:phase===1)?'attack-windup':(aimed?phase===2:phase===3)?'attack-recover':'attack-'+enemyDefinition(enemy.name).kind;sounds.push({cue,delay});}else sounds.push({cue:'attack-block',delay:220});if(respond(g,m,brace,cover,interrupt,retreat))sounds.push({cue:'attack-impact',delay:delay+140,impact:'player'});}
 if(retreat&&g.encounter&&g.run.revivals===source.run.revivals){const from=g.room;g.room=g.previous;g.previous=from;clearEncounter(g);enterEncounter(g);m.push(...look(g));}
 const exposure=rooms[g.room].radiation;
 if(exposure&&g.run.status==='alive'){let n=p.origin==='Radborn'?Math.max(1,Math.floor(exposure*B.radbornFactor)):exposure;if(p.armor&&items[p.armor].insulation)n=Math.max(1,Math.floor(n*B.insulationFactor));if(p.className==='Sump Apostle')n=Math.max(1,n-B.sumpReduction);p.radiation=Math.min(100,p.radiation+n);m.push('RAD / +'+n+' exposure ('+p.radiation+'/100).');}
 if(p.level>source.player.level)m.push('LEVEL '+p.level+' / Resources restored. '+p.points+' points available: train a skill or learn a class tier.');
 if(verb==='take'&&!discovery){const id=[fishingKit,...fish.map(f=>f.id)].find(id=>(p.inventory[id]??0)>(source.player.inventory[id]??0));if(id)discovery={item:id,first:!source.player.inventory[id]}}
 reconcilePack(p);
 p.credits=Math.min(B.maxCounter,p.credits);for(const id of Object.keys(p.inventory))p.inventory[id]=Math.min(B.maxInventory,p.inventory[id]);
 if(g.run.status==='dead'){sound='death';discovery=undefined;sounds.push({cue:'death',delay:620})}else if(g.run.revivals>source.run.revivals){sound='attack-revive';sounds.push({cue:'attack-revive',delay:620})}return {state:g,changed:true,messages:m,sound,...(sounds.length?{sounds}:{}),...(discovery?{discovery}:{}),...(flavor?{flavor}:{})};
}
export function consume(p:Player,item:string){if(--p.inventory[item]<=0)delete p.inventory[item]}
export function journal(g:Game):string[]{return [
 'THE WATER BELONGS TO / '+(g.pump==='lease'?'syndicate':g.pump).toUpperCase()+'. '+(g.pump==='commons'?pumpText.commons:g.pump==='lease'?pumpText.lease:'Talk technician at Toll Square → take pump component in Scrap Alley → install component in Pump Hall → Control Booth: give key commons OR give key syndicate.'),
 ...(g.rewards.includes('freeborn')?['FREEBORN / You reached the city. Your journey is complete. The estuary remains available for free exploration.']:['THE CITY / Survive the estuary and reach Crown Receiver. Settle the master ledger, then depart for the city.']),
 ...courierJournal(g),
 ...missionJournal(g),
 ...(g.rewards.some(id=>id.startsWith('fish:'))?['CATCHES / '+fish.filter(f=>g.rewards.includes('fish:'+f.id)).map(f=>f.id).join(', ')+' ('+fish.filter(f=>g.rewards.includes('fish:'+f.id)).length+'/'+fish.length+').']:[]),
 ...Object.values(quests).map(q=>q.title.toUpperCase()+' / '+(g.quests[q.id]??'undiscovered')+'. '+(g.quests[q.id]==='done'?q.ending:g.quests[q.id]==='erase'?'Debts erased. The evidence of who profited is gone too.':g.quests[q.id]==='disclose'?'Debts exposed. Survivors can name the owners, but must still contest their claims.':q.brief))
]}
export function stock(g:Game){const r=rooms[g.room];if(g.run.status==='dead'||(!r.safe&&r.id!=='kiosk'))return [];return Object.keys(items).filter(id=>(id!==drone||g.room==='clinic')&&items[id].tier&&items[id].tier!<=Math.max(r.level,g.player.level))}
export function price(g:Game,id:string){return Math.max(1,items[id].price-g.player.skills.Influence-(g.player.stats.Nerve-4)-(g.player.className==='Advocate'?B.advocateDiscount:0))}
function award(g:Game,key:string,xp:number){if(!g.rewards.includes(key)){g.rewards.push(key);gainXP(g.player,xp)}}
function worldAction(g:Game,verb:string,arg:string,m:string[]):true|string{
 const p=g.player,r=rooms[g.room];if(g.encounter)return 'Resolve the encounter first. Fight, use an ability, heal, brace or flee.';
 const mission=resolveMission(arg);
 if((verb==='accept'&&mission)||verb==='report'){
  if(!mission||mission.giver!==g.room)return 'Return to the person who offered that mission.';
  if(missionDone(g,mission))return 'That mission has already been paid. The giver remembers your help.';
  if(verb==='accept'){
   if(missionActive(g,mission))return 'You already accepted that mission. Type missions for your progress.';
   g.rewards.push(missionKey(mission.id,'active'));m.push('ACCEPTED / '+mission.title+'. '+mission.target+' catches from now on. '+(mission.waters.length?'Use the water named by the giver.':'Any fishing spot counts.')+' Keep the fish; return to '+mission.person+' for payment.');
  }else {
   if(!missionActive(g,mission)||missionProgress(g,mission)<mission.target)return 'The mission is not ready to report. Type missions for the remaining count.';
   g.rewards.push(missionKey(mission.id,'done'));p.credits+=mission.credits;gainXP(p,mission.xp);m.push(mission.person+': '+mission.thanks,'MISSION COMPLETE / '+mission.title+'. +'+mission.credits+' credits, +'+mission.xp+' XP.');
  }
 }else if(verb==='accept'){
  const route=deliveryRoutes[arg];if(!route||route.from!==g.room)return 'No such job here. Type jobs.';
  if(g.courier.route)return 'Finish your current delivery first. Type jobs.';
  if(!canCarry(p,{'sealed parcel':1}))return 'Make room for the 2×2 parcel before accepting.';
  g.courier.route=route.id;p.inventory['sealed parcel']=1;m.push('COURIER / Carry '+route.cargo+' to '+rooms[route.to].name+'. Payment: '+route.credits+' credits.');
 }else if(verb==='deliver'&&arg==='parcel'){
  const route=g.courier.route?deliveryRoutes[g.courier.route]:null;
  if(!route||route.to!==g.room||!p.inventory['sealed parcel'])return 'Bring your sealed parcel to the address listed under jobs.';
  consume(p,'sealed parcel');p.credits+=route.credits;gainXP(p,route.xp);g.courier.completed=Math.min(B.maxCounter,g.courier.completed+1);g.courier.route=null;
  m.push('DELIVERED / '+route.cargo+'. +'+route.credits+' credits, +'+route.xp+' XP. Type jobs for the return route.');
 }else if(verb==='depart'){
  if(arg||g.room!=='crown-15'||!['erase','disclose'].includes(g.quests.ledger))return 'The city ferry leaves from Crown Receiver after you settle the master ledger. Finish The Last Account first.';
  if(g.rewards.includes('freeborn'))return 'You have reached the city. This is free exploration of the estuary you left behind.';
  g.rewards.push('freeborn');m.push('FREEBORN / A ferry carries you toward the towers. Your work order stays on the dock. You arrive under your own name. Journey complete.');
 }else if(verb==='talk'){
  const aliases:Record<string,string>={pell:'clerk',iona:'technician',moth:'broker',sera:'warden',fen:'warden',rusk:'warden',vale:'warden',orra:'warden',hal:'warden',sen:'archivist',ada:'postkeeper'};
  if(!r.npc||(aliases[arg]??arg)!==r.npc)return 'That person is not here. Type look.';
  if(r.npc==='clerk')m.push('Pell: “Rest here any time. No charge. The replacement body is where we get you. Iona needs a runner in Toll Square.”');
  if(r.npc==='technician'){if(g.pump==='new')g.pump='accepted';m.push('Iona: “Ceramic component. Scrap Alley. Install it in Pump Hall. Then give the key to commons or the syndicate at Control Booth. Fixing things is easy. Owning them is the disease.”');}
  if(r.npc==='postkeeper')m.push('Ada: “District mail? Set it on the dry table. I have a return bag whenever you’re ready.” Type jobs.');
  if(['broker','clerk'].includes(r.npc))m.push('COURIER WORK / Type jobs to see paid deliveries from here.');
  if(r.npc==='broker')m.push('Moth: “Buy medical supplies, armor vest or a weapon. Sell salvage. Everything guaranteed until you leave.”');
  m.push(...missionConversation(g));
  if(['warden','archivist'].includes(r.npc)){
   const q=Object.values(quests).find(q=>q.giver===g.room);if(q){if(!g.quests[q.id])g.quests[q.id]='accepted';m.push(q.title+' / '+(g.quests[q.id]==='done'?q.ending:q.brief));}
   else if(missions.some(m=>m.giver===g.room)){}
   else if(r.zone==='glass')m.push('Vale’s watch: “Prism Tip is sheltered. Find Keeper Vale at Glaziers Hearth, south through the diamond. Keep your shield between you and the glass.”');
   else m.push('Orra: “Beyond this bunker: level eight to ten. They charge in amber before they strike. Bring insulation. Brace or break the charge. They return after twelve turns. We will always let you back in.”');
   m.push(r.guard+' keeps weapons lowered. Rest here freely; merchants sell region-appropriate gear.');
  }
 }else if(verb==='take'){
  const loot=g.loot[g.room];const targets=arg==='all'?Object.keys(loot):[arg];if(!targets.length||targets.some(x=>!Object.hasOwn(loot,x)))return 'That is not on the ground. Try look or take all.';
  if(targets.some(id=>(p.inventory[id]??0)+loot[id]>B.maxInventory))return 'Inventory stack full. Make space before taking these items.';
  if(!canCarry(p,Object.fromEntries(targets.map(id=>[id,loot[id]]))))return 'No room in your backpack. Repack or take a smaller item; the loot stays here.';
  for(const id of targets){p.inventory[id]=(p.inventory[id]??0)+loot[id];delete loot[id]}m.push('TAKEN / '+targets.join(', '));
 }else if(verb==='scrounge'){
  if(arg||!r.salvage||g.scrounged.includes(g.room))return 'No fresh scrap here. Each marked room can be scrounged once.';
  if((p.inventory['medical supplies']??0)>=B.maxInventory)return 'Medical supplies stack full. Make space before scrounging.';
  if(!canCarry(p,{'medical supplies':1}))return 'No room for another supply. Repack first; the scrap stays untouched.';
  g.scrounged.push(g.room);const credits=B.scroungeBase+B.scroungeSkill*p.skills.Survival+(p.className==='Scavenger'?B.scavengerBonus:0);p.credits+=credits;p.inventory['medical supplies']=(p.inventory['medical supplies']??0)+1;award(g,'scrounge:'+g.room,B.scroungeXP);m.push('SCROUNGE / One medical supply, '+credits+' credits and 10 XP. Scrap exhausted.');
 }else if(verb==='equip'){
  if(Object.hasOwn(bags,arg)){
   if(arg!=='canvas satchel'&&!p.inventory[arg])return 'You do not own that backpack.';
   const candidate=structuredClone(p);candidate.pack.bag=arg;reconcilePack(candidate);
   if(unpacked(candidate).length)return 'Your gear will not fit in that backpack. Make room before changing packs.';
   p.pack=candidate.pack;const c=capacity(p);m.push('EQUIPPED / '+arg+' · '+c.width+'×'+c.height+' cells.');return true;
  }
  if(!Object.hasOwn(p.inventory,arg)||(!items[arg].damage&&!items[arg].armor))return 'You do not own that equipment.';
  if(items[arg].damage)p.weapon=arg;else p.armor=arg;m.push('EQUIPPED / '+arg);
 }else if(verb==='buy'){
  if(!stock(g).includes(arg))return 'Not sold here. Visit a guarded refuge; higher-level regions stock stronger equipment.';
  if((p.inventory[arg]??0)>=B.maxInventory)return 'Inventory stack full. Purchase cancelled.';
  if(!canCarry(p,{[arg]:1})&&!items[arg].backpack)return 'No room in your backpack. Purchase cancelled; credits kept.';
  const cost=price(g,arg);if(p.credits<cost)return 'You need '+cost+' credits.';p.credits-=cost;p.inventory[arg]=(p.inventory[arg]??0)+1;
  if(items[arg].backpack){const candidate=structuredClone(p);candidate.pack.bag=arg;reconcilePack(candidate);if(unpacked(candidate).length===0)p.pack=candidate.pack;else if(!canCarry({...p,inventory:{...p.inventory,[arg]:p.inventory[arg]-1}},{[arg]:1}))return 'The new pack cannot hold your gear. Purchase cancelled.'}
  m.push('BOUGHT / '+arg+' for '+cost+' credits.');
 }else if(verb==='drop'){
  if(!p.inventory[arg])return 'You do not have that item.';
  if(items[arg].quest)return 'Keep the quest artifact. Drop spare equipment or supplies instead.';
  if((p.weapon===arg||p.armor===arg||p.pack.bag===arg)&&p.inventory[arg]===1)return 'Equip something else before dropping worn equipment.';
  if((g.loot[g.room][arg]??0)>=B.maxInventory)return 'No more room for that item on the ground.';
  consume(p,arg);g.loot[g.room][arg]=(g.loot[g.room][arg]??0)+1;m.push('DROPPED / '+arg+'. It stays here.');
 }else if(verb==='sell'){
  if(!stock(g).length||!p.inventory[arg]||items[arg]?.quest)return 'Sell spare gear or salvage at a trader. Quest parcels and artifacts cannot be sold.';if((p.weapon===arg||p.armor===arg||p.pack.bag===arg)&&p.inventory[arg]===1)return 'Equip something else before selling worn gear.';const value=arg==='salvage'?B.salvagePrice:Math.max(1,Math.floor(price(g,arg)*.35));consume(p,arg);p.credits+=value;m.push('SOLD / '+arg+' for '+value+' credits.');
 }else if(verb==='train'){
  const skill=SKILLS.find(s=>s.toLowerCase()===arg);if(!skill||p.points<1||p.skills[skill]>=B.skillCap)return 'Train a skill below rank 5 using one point.';p.points--;p.skills[skill]++;m.push('TRAINED / '+skill+' '+p.skills[skill]+'/5.');
 }else if(verb==='learn'){
  if(!learn(p,arg))return 'Learning needs one point, the required level, and an unlearned ability from your class.';m.push('LEARNED / '+abilities[arg].name+'. use '+arg);
 }else if(verb==='install'){
  if(g.room!=='pump'||!['component','pump component'].includes(arg)||!p.inventory['pump component']||!['new','accepted'].includes(g.pump))return 'Install component in Pump Hall with the ceramic pump component.';
  consume(p,'pump component');p.inventory['access key']=1;g.pump='repaired';award(g,'pump',PUMP_REWARDS.repairXP);m.push('PUMP REPAIRED / Water hammers through the pipes. The console prints an access key. North: Control Booth. give key commons OR give key syndicate.');
 }else if(verb==='give'){
  if(g.room!=='booth'||g.pump!=='repaired'||!p.inventory['access key']||!['key commons','key lease','key syndicate'].includes(arg))return 'At Control Booth after repairs: give key commons OR give key syndicate. The choice is permanent.';
  g.pump=arg==='key commons'?'commons':'lease';consume(p,'access key');p.credits+=g.pump==='commons'?PUMP_REWARDS.commonsCredits:PUMP_REWARDS.leaseCredits;award(g,'ending',PUMP_REWARDS.endingXP);m.push(pumpText[g.pump],'THE WATER BELONGS TO / '+(g.pump==='lease'?'syndicate':g.pump).toUpperCase()+'. The estuary remains open.');
 }else if(verb==='deliver'||verb==='resolve'){
  const q=Object.values(quests).find(q=>q.giver===g.room&&(verb==='resolve'?q.id==='ledger':q.item===arg));
  if(!q||g.quests[q.id]!=='accepted'||!p.inventory[q.item]||(verb==='resolve'&&!['erase','disclose'].includes(arg))||(q.id==='ledger'&&verb!=='resolve'))return 'Accept the quest and bring its artifact to the named recipient. Journal lists locations and choices.';
  consume(p,q.item);g.quests[q.id]=q.id==='ledger'?arg:'done';award(g,q.id,q.xp);p.credits+=q.credits;
  m.push(q.ending,q.id==='ledger'?(arg==='erase'?'ERASE / Every clone debt dissolves. So does the evidence against its owners. The city can start over without a record of who hurt it.':'DISCLOSE / Every ledger becomes public. The city learns who bought it. Tomorrow the debtors must decide what that knowledge is worth.'):q.xp+' XP · '+q.credits+' credits');
  if(q.id==='ledger'&&arg==='erase')p.debt=0;if(q.id==='ledger')m.push('Beyond the receiver, city lights rise through the rain. The ferry is ready. Type depart to finish your journey.');
 }else return 'Unknown command. Type help.';
 return true;
}
