import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {App,completions} from '../src/App';
import {createGame,command,look,enterEncounter,type Game} from '../src/engine';
import {theftObjects,objectCommands,roomObjects} from '../src/roomObjects';
import {theftFlag,alarmFlag,subduedFlag,theftEnemyFor,theftChance} from '../src/theft';
import {encode,decode} from '../src/saves';
import {gainXP,maxHP,maxStamina} from '../src/progression';
import {reconcilePack} from '../src/backpack';
import {rooms} from '../src/world';

function at(room:string,seed=1){const g=createGame('Mara','Baseline','Enforcer','Tech',seed);g.room=room;g.previous=room==='kiosk'?'clinic':room==='yard'?'relay':room;g.discovered=[...new Set(['clinic',g.previous,room])];return g}
function veteran(room:string,seed=1){const g=at(room,seed);gainXP(g.player,10000);g.player.inventory['medical supplies']=15;g.player.inventory['expedition frame']=1;g.player.pack.bag='expedition frame';g.player.inventory['storm harness']=1;g.player.armor='storm harness';g.player.inventory['riot carbine']=1;g.player.weapon='riot carbine';reconcilePack(g.player);return g}
function failedSeed(room:string,action:string){for(let seed=10000;seed<100000;seed+=1000){const result=command(at(room,seed),action);if(result.state.encounter)return seed}throw Error('No failed seed')}
it('valuable property lives in prose and is never advertised in hints, completions, or ground loot',()=>{
 for(const object of theftObjects){const g=at(object.room);expect(look(g).join(' ')).toContain(object.description);expect(g.loot[g.room][object.item]).toBeUndefined();expect(object.hint).toBeUndefined();
  expect(objectCommands(g.room).some(c=>c.endsWith(object.name))).toBe(false);
  for(const prefix of ['steal','grab','pick up'])expect(completions(prefix,g)).toEqual([]);
  const html=renderToStaticMarkup(createElement(App,{initialGame:g}));const hints=html.split('aria-label="Available commands"')[1].split('</div>')[0];expect(hints).not.toContain(object.name);expect(hints).not.toContain('steal');
  const before=encode(g);for(const verb of ['inspect','look at','look at the']){const result=command(g,verb+' '+object.name);expect(result.changed).toBe(false);expect(encode(result.state)).toBe(before);expect(result.messages.join(' ')).toContain(object.description)}
  expect(command(g,'take all').changed).toBe(false);expect(encode(g)).toBe(before);
 }
});
it('natural acquisition aliases resolve to the same seeded theft without mutating the source',()=>{
 const g=at('kiosk'),before=encode(g);
 const expected=command(g,'steal medical kit');expect(expected.changed).toBe(true);expect(expected.state.encounter).toBeNull();expect(expected.state.player.inventory['medical supplies']).toBe(g.player.inventory['medical supplies']+3);
 for(const text of ['grab kit','take medical kit','get the kit','pick up the sealed medical kit','swipe kit','pocket medical kit','snatch kit','  GRAB   the kit from the crate  '])expect(command(g,text).state).toEqual(expected.state);
 expect(encode(g)).toBe(before);expect(expected.state.turns).toBe(g.turns+1);expect(decode(encode(expected.state))).toEqual(expected.state);
 expect(look(expected.state).join(' ')).toContain('empty rectangle');expect(look(expected.state).join(' ')).not.toContain('A sealed medical kit sits');
 const repeat=command(decode(encode(expected.state)),'grab kit');expect(repeat.changed).toBe(false);expect(repeat.state).toEqual(expected.state);
});
it('failure creates a persistent armed encounter and rejects services or repeated attempts during combat',()=>{
 const g=at('kiosk',failedSeed('kiosk','steal kit')),result=command(g,'steal kit');const caught=result.state;
 expect(caught.encounter?.id).toBe(theftFlag('kiosk-medical-kit'));expect(caught.rewards).toContain(alarmFlag('kiosk-medical-kit'));expect(caught.player.inventory).toEqual(g.player.inventory);expect(caught.turns).toBe(g.turns+1);expect(result.sounds?.length).toBeGreaterThan(0);expect(decode(encode(caught))).toEqual(caught);
 for(const text of ['steal kit','grab kit','buy medical supplies','rest','e','deliver parcel']){const rejected=command(caught,text);expect(rejected.changed).toBe(false);expect(rejected.state).toEqual(caught)}
 const escaped=command(caught,'flee').state;expect(escaped.room).toBe('clinic');expect(escaped.encounter).toBeNull();expect(decode(encode(escaped))).toEqual(escaped);
 const returned=command(decode(encode(escaped)),'e').state;expect(returned.encounter?.id).toBe(theftFlag('kiosk-medical-kit'));expect(returned.encounter?.maxHP).toBe(caught.encounter?.maxHP);expect(decode(encode(returned))).toEqual(returned);
});
it('the watched gun kills an unprepared survivor before acquisition and preserves the alarm in the terminal record',()=>{
 const g=at('yard'),result=command(g,'grab gun');expect(result.changed).toBe(true);expect(result.state.run.status).toBe('dead');expect(result.state.room).toBe('yard');expect(result.state.player.inventory['coil carbine']).toBeUndefined();expect(result.state.rewards).toContain(alarmFlag('yard-watch-gun'));expect(result.sound).toBe('death');expect(result.sounds?.some(c=>c.impact==='player')).toBe(true);expect(decode(encode(result.state))).toEqual(result.state);
 const returned=decode(encode(result.state));returned.room='yard';returned.previous='relay';returned.discovered=[...new Set([...returned.discovered,'relay'])];enterEncounter(returned);expect(returned.encounter).toBeNull();expect(returned.run.status).toBe('dead');expect(decode(encode(returned))).toEqual(returned);
});
it('a strong earned build can survive and defeat the fixed watch, claim the gun once, and recover a dropped gun',()=>{
 let g=veteran('yard');const initial=g.player.inventory['coil carbine']??0;g=command(g,'grab gun').state;expect(g.encounter?.level).toBe(8);expect(g.player.debt).toBe(0);
 for(let i=0;i<40&&g.encounter;i++){
  const next=command(g,g.encounter.phase===2?'brace':g.player.hp<50?'heal':'attack');expect(next.changed).toBe(true);g=decode(encode(next.state));
 }
 expect(g.room).toBe('yard');expect(g.encounter).toBeNull();expect(g.rewards).toContain(subduedFlag('yard-watch-gun'));expect(g.defeated.yard).toBeUndefined();
 const paidXP=g.player.xp,paidCredits=g.player.credits;
 g=command(g,'grab gun from the table').state;expect(g.player.inventory['coil carbine']).toBe(initial+1);expect(g.rewards).toContain(theftFlag('yard-watch-gun'));expect(decode(encode(g))).toEqual(g);
 expect(command(g,'grab gun').changed).toBe(false);expect(g.player.xp).toBe(paidXP);expect(g.player.credits).toBe(paidCredits);
 g=command(g,'drop coil carbine').state;expect(g.loot.yard['coil carbine']).toBe(1);g=command(g,'take coil carbine').state;expect(g.player.inventory['coil carbine']).toBe(1);expect(g.loot.yard['coil carbine']).toBeUndefined();expect(decode(encode(g))).toEqual(g);
 for(const d of ['w','e'])g=command(g,d).state;expect(g.encounter).toBeNull();expect(g.player.xp).toBe(paidXP);expect(g.rewards.filter(id=>id===subduedFlag('yard-watch-gun'))).toHaveLength(1);
});
it('full packs, wrong locations, ambiguous nouns and non-property targets leave gameplay and RNG untouched',()=>{
 const full=at('kiosk');full.player.inventory.salvage=1000;reconcilePack(full.player);const before=encode(full);expect(command(full,'grab kit').changed).toBe(false);expect(encode(full)).toBe(before);
 const g=createGame();for(const action of ['grab gun','steal coat','grab __proto__','steal constructor']){const result=command(g,action);expect(result.changed).toBe(false);expect(result.state).toEqual(g)}
 const duplicate={...theftObjects[0],id:'temporary-test-kit'};roomObjects.push(duplicate);try{const g=at('kiosk'),result=command(g,'grab kit');expect(result.changed).toBe(false);expect(result.messages.join(' ')).toContain('Which one?');expect(result.state).toEqual(g)}finally{roomObjects.pop()}
});
it('ground collection does not silently steal matching property; stolen gear can be sold without restoring it',()=>{
 let g=at('kiosk');g.loot.kiosk['medical supplies']=1;g=command(g,'take medical supplies').state;expect(g.rewards).not.toContain(theftFlag('kiosk-medical-kit'));expect(g.rewards).not.toContain(alarmFlag('kiosk-medical-kit'));
 g=command(g,'steal kit').state;const n=g.player.inventory['medical supplies'];g=command(g,'sell medical supplies').state;expect(g.player.inventory['medical supplies']).toBe(n-1);expect(command(g,'grab kit').changed).toBe(false);expect(decode(encode(g))).toEqual(g);
});
it('theft response validation rejects forged flags, wrong rooms, changed templates, and missing active guards',()=>{
 const valid=command(at('kiosk',failedSeed('kiosk','steal kit')),'steal kit').state;
 for(const change of [(g:Game)=>{g.rewards=[]},(g:Game)=>{g.encounter=null},(g:Game)=>{g.encounter!.damage=1},(g:Game)=>{g.rewards.push(theftFlag('kiosk-medical-kit'))},(g:Game)=>{g.rewards.push(subduedFlag('kiosk-medical-kit'))},(g:Game)=>{g.encounter=theftEnemyFor('yard-watch-gun')}]){const broken=structuredClone(valid);change(broken);expect(()=>decode(JSON.stringify(broken))).toThrow()}
 const forged=at('yard');forged.rewards.push(theftFlag('yard-watch-gun'));expect(()=>decode(JSON.stringify(forged))).toThrow(/guarded property/);
 const older=createGame();expect(decode(JSON.stringify(older))).toEqual(older);expect(older.rewards).toEqual([]);
});
it('chance uses existing skills without scaling the watch, and fixed-danger property cannot be lucked past',()=>{
 const kit=theftObjects[0],gun=theftObjects[2],g=createGame(),trained=structuredClone(g.player);trained.skills.Survival=5;
 expect(theftChance(kit,trained)).toBeGreaterThan(theftChance(kit,g.player));expect(theftChance(gun,trained)).toBe(0);expect(theftEnemyFor(gun.id)).toMatchObject({level:8,damage:26,maxHP:140});
 const advanced=veteran('yard');expect(maxHP(advanced.player)).toBeGreaterThan(maxHP(g.player));expect(maxStamina(advanced.player)).toBeGreaterThan(maxStamina(g.player));
 for(const object of theftObjects){expect(rooms[object.room].enemy).toBe('');expect(rooms[object.room].safe).toBe(true)}
});
