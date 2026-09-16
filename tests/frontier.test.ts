import {enemyRole} from '../src/enemyBehavior';
import {it,expect,vi} from 'vitest';
import {createGame,command,enemyFor,rollSpoils,stock,intent} from '../src/engine';
import {rooms,zones} from '../src/world';
import {enemies} from '../src/enemies';
import {items,favoredWeapons,weaponAttack} from '../src/items';
import {classes,gainXP,maxHP} from '../src/progression';
import {encode,decode} from '../src/saves';
import {reconcilePack,footprints} from '../src/backpack';
import {deliveryRoutes} from '../src/courier';
import {Sound,defaultPreferences} from '../src/audio';
import legacy from '../src/data/legacy-v2-world.json';
function at(room:string){const g=createGame();g.room=g.previous=room;g.discovered=[...new Set(['clinic',room])];if(rooms[room].enemy)g.encounter=enemyFor(room);return g}
function step(g:ReturnType<typeof createGame>,text:string){const r=command(g,text);expect(r.changed,r.messages.join(' ')).toBe(true);expect(()=>encode(r.state)).not.toThrow();return r.state}
it('every biome has multiple human enemy identities and each has contextual windups',()=>{
 for(const zone of Object.keys(zones)){const humans=new Set(Object.values(rooms).filter(r=>r.zone===zone&&enemies[r.enemy]?.human).map(r=>r.enemy));expect(humans.size,zone).toBeGreaterThanOrEqual(2)}
 for(const r of Object.values(rooms).filter(r=>r.enemy)){const e=enemyFor(r.id);e.phase=1;expect(intent(e)).toContain(enemyRole(e.name)==='marksman'?'AIMED SHOT':enemies[e.name].windup);e.phase=2;expect(intent(e)).toContain(enemyRole(e.name)==='marksman'?'RELOADING':'HEAVY STRIKE');expect(intent(e)).not.toMatch(/lease|invoice/i)}
});
it('the clinic reaches the shallow sewer without an enemy and it stays level 1–2 without radiation',()=>{
 let g=createGame();for(const c of ['s','down','w'])g=step(g,c);expect(g.room).toBe('shallows-0');expect(g.encounter).toBeNull();
 for(const r of Object.values(rooms).filter(r=>r.zone==='shallows')){expect(r.level).toBeLessThanOrEqual(2);expect(r.radiation).toBe(0);if(r.enemy)expect(enemyFor(r.id).damage).toBeLessThanOrEqual(6)}
});
it('local courier routes pay only once at the destination and can be repeated through return trips',()=>{
 let g=createGame();const start=g.player.credits;
 g=step(g,'accept freight-return');expect(command(g,'accept freight-return').changed).toBe(false);expect(command(g,'deliver parcel').changed).toBe(false);
 expect(command(g,'drop sealed parcel').changed).toBe(false);expect(command(g,'sell sealed parcel').changed).toBe(false);
 for(const c of ['e','e','e'])g=step(g,c);expect(g.room).toBe('yard');g=step(g,'deliver parcel');expect(g.player.credits).toBe(start+14);expect(g.courier.completed).toBe(1);expect(command(g,'deliver parcel').changed).toBe(false);
 g=step(g,'accept clinic-run');for(const c of ['w','w','w'])g=step(g,c);g=step(g,'deliver parcel');expect(g.player.credits).toBe(start+28);g=step(g,'accept freight-return');expect(g.player.inventory['sealed parcel']).toBe(1);
});
it('courier acceptance is atomic for a full pack and death closes the unfinished delivery',()=>{
 const full=createGame();full.player.inventory.salvage=500;const before=structuredClone(full);expect(command(full,'accept freight-return').state).toEqual(before);
 let g=step(createGame(),'accept freight-return');g.room='crown-2';g.previous='crown-1';g.discovered.push('crown-2','crown-1');g.encounter=enemyFor(g.room);g.encounter.phase=2;g.player.hp=1;
 g=step(g,'brace');expect(g.run.status).toBe('dead');expect(g.courier.route).toBe('freight-return');expect(g.player.inventory['sealed parcel']).toBe(1);
});
it('long-distance dispatches cross the wilderness to a separate guarded town',()=>{
 expect(deliveryRoutes['bellwether-run'].to).toBe('bellwether-1');expect(deliveryRoutes['district-return'].to).toBe('yard');
 expect(rooms['reed-17'].exits.s).toBe('wilds-0');expect(rooms['wilds-5'].exits.s).toBe('bellwether-0');expect(rooms['bellwether-1'].safe).toBe(true);
});
it('class weapons are always stocked at an appropriate tier and occupy deliberate pack shapes',()=>{
 for(const cls of Object.keys(classes))for(const xp of [0,360,1260]){const g=createGame('Mara','Baseline',cls);gainXP(g.player,xp);const options=favoredWeapons(cls,g.player.level);expect(options.length).toBeGreaterThan(0);for(const id of options){expect(stock(g)).toContain(id);expect(footprints[id][0]).toBeGreaterThanOrEqual(3);expect(weaponAttack(id)).toBeTruthy()}}
});
it('deterministic loot strongly favors the class, allows surprises, and never goes three kills without a weapon',()=>{
 for(const cls of Object.keys(classes)){const g=createGame('Mara','Baseline',cls);let favored=0,total=0,quiet=0;
  for(let i=0;i<600;i++){const messages:string[]=[];rollSpoils(g,messages);if(messages.length){const id=messages[0].slice(8).split(' lies')[0];total++;if(items[id].classes?.includes(cls))favored++;quiet=0}else quiet++;expect(quiet).toBeLessThan(3)}
  expect(favored/total).toBeGreaterThan(.73);expect(favored/total).toBeLessThan(.96);expect(g.player.inventory).not.toHaveProperty('patrol pistol');
 }
});
it('spare weapons can be sold, equipped gear and parcels cannot, and buy/sell cannot create money',()=>{
 let g=createGame();g.player.credits=100;g=step(g,'buy patrol pistol');const paid=100-g.player.credits;g=step(g,'sell patrol pistol');expect(g.player.credits).toBeLessThan(100);expect(paid).toBeGreaterThan(0);expect(command(g,'sell battered handgun').changed).toBe(false);
});
it('misses still play the attempted weapon and human windups do not use machine narration',()=>{
 let missed=false;for(let seed=1;seed<100000&&!missed;seed+=113){const g=at('tunnel');g.rng=seed;g.player.weapon='knife';g.player.inventory.knife=1;g.encounter!.phase=1;const r=command(g,'attack');expect(r.sound).toBe('attack-blade');expect(r.sounds?.some(e=>e.cue==='attack-windup')).toBe(true);expect(r.messages.join(' ')).not.toMatch(/capacitor|invoice|lease/i);if(r.messages.some(m=>m.startsWith('MISS'))){missed=true;expect(r.sounds?.some(e=>e.cue==='attack-miss')).toBe(true)}}expect(missed).toBe(true);
});
function v2(room='clinic'){const g:any=at(room);g.version=2;delete g.player.body;delete g.courier;delete g.lootPity;delete g.run;delete g.bleed;for(const id of Object.keys(g.loot))if(!Object.hasOwn(legacy,id))delete g.loot[id];if(g.encounter){const r=legacy[room as keyof typeof legacy];const base:Record<string,number[]>={'coupon ferret':[22,5,0],'compliance tadpole':[28,6,1],guard:[34,7,2]};const old=base[r.enemy];const hp=old?.[0]??14+r.level*10;g.encounter={id:room,name:r.enemy,level:r.level,hp:hp-1,maxHP:hp,damage:old?.[1]??3+r.level*2,armor:old?.[2]??Math.floor(r.level/2),phase:2};}return g}
it('old saves migrate map, enemy names and learned actions while corrupt legacy encounters remain rejected',()=>{
 for(const room of ['clinic','alley','crown-4']){const old=v2(room),g=decode(JSON.stringify(old));expect(g.version).toBe(6);expect(Object.keys(g.loot)).toHaveLength(Object.keys(rooms).length);expect(g.player.name).toBe(old.player.name);expect(()=>encode(g)).not.toThrow();if(g.encounter){expect(g.encounter.name).toBe(rooms[room].enemy);expect(g.encounter.phase).toBe(2);old.encounter.damage++;expect(()=>decode(JSON.stringify(old))).toThrow(/legacy enemy/)}}
 const old=v2();old.player=createGame('Mara','Baseline','Advocate').player;delete old.player.body;old.player.abilities=['stay order'];old.cooldowns={'stay order':0};const g=decode(JSON.stringify(old));expect(g.player.abilities).toEqual(['disarming feint']);expect(g.cooldowns).toEqual({'disarming feint':0});
 const missing=v2();delete missing.loot.alley;expect(()=>decode(JSON.stringify(missing))).toThrow();
});
it('legacy wandering combat survives a room gaining a new resident',()=>{
 const old=v2('tunnel');old.encounter={id:'roaming:ferret:tunnel',name:'coupon ferret',level:legacy.tunnel.level,hp:15,maxHP:22,damage:5,armor:Math.floor(legacy.tunnel.level/2),phase:1};
 const g=decode(JSON.stringify(old));expect(g.encounter?.name).toBe('scrap weasel');expect(g.defeated.tunnel).toBe(g.turns);expect(()=>encode(g)).not.toThrow();
 old.encounter=null;expect(decode(JSON.stringify(old)).defeated.tunnel).toBe(old.turns);
});
it('bracing plays the defensive cue before the enemy response',()=>{
 const r=command(at('tunnel'),'brace');expect(r.sounds?.[0]).toEqual({cue:'attack-block',delay:0});expect(r.sounds?.[1].delay).toBe(380);
});
it('parcel tampering, unknown delivery routes and invalid loot pity are rejected',()=>{
 for(const edit of [(g:any)=>g.courier.route='nowhere',(g:any)=>g.courier.route='clinic-run',(g:any)=>g.player.inventory['sealed parcel']=1,(g:any)=>g.lootPity=3]){const g=createGame();edit(g);reconcilePack(g.player);expect(()=>decode(JSON.stringify(g))).toThrow()}
});
it('muting or replacing an attack cancels delayed responses and close leaves no audio timers',()=>{
 vi.useFakeTimers();const paths:string[]=[];vi.stubGlobal('Audio',class{volume=0;currentTime=0;loop=false;paused=true;constructor(path:string){paths.push(path)}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}});
 try{const sound=new Sound(),result=command(at('tunnel'),'attack');sound.sequence(result);sound.apply({...defaultPreferences,muted:true});vi.advanceTimersByTime(1000);expect(paths.length).toBe(1);sound.apply(defaultPreferences);sound.sequence(result);sound.sequence({...result,sound:'submit',sounds:[]});vi.advanceTimersByTime(1000);expect(paths.some(p=>p.includes('attack-impact'))).toBe(false);sound.close();expect(vi.getTimerCount()).toBe(0)}finally{vi.unstubAllGlobals();vi.useRealTimers()}
});

it('the distant city is an ending after the ledger, with no premature departure or duplicate reward',()=>{
 expect(command(at('crown-15'),'depart').changed).toBe(false);
 let g=at('crown-15');g.quests.ledger='accepted';g.player.inventory['master ledger']=1;delete g.loot['crown-14']['master ledger'];reconcilePack(g.player);
 g=step(g,'resolve disclose');g=step(g,'depart');expect(g.rewards).toContain('freeborn');expect(g.room).toBe('crown-15');expect(command(g,'depart').changed).toBe(false);
 const bad=createGame();bad.rewards.push('freeborn');expect(()=>encode(bad)).toThrow();
});
