import {it,expect} from 'vitest';
import {createGame,command} from '../src/engine';
import {fishingKit,fishingOutcome,fishingSpots,fishingEnemyFor} from '../src/fishing';
import {missions,missionKey,missionProgress} from '../src/missions';
import {encode,decode} from '../src/saves';
import {reconcilePack} from '../src/backpack';
function prepared(room='sewer-0',seed=314159){const g=createGame('Rhea','Baseline','Enforcer','Tech',seed);g.room=g.previous=room;g.discovered.push(room);Object.assign(g.player.inventory,{[fishingKit]:1,'fishing bait':10,'expedition frame':1});g.player.pack.bag='expedition frame';reconcilePack(g.player);return g}
it('fishing has bounded rare deadly outcomes and more frequent hostile quadrupeds',()=>{
 const counts={catch:0,ordinary:0,deadly:0};for(let i=0;i<10000;i++){const result=fishingOutcome(fishingSpots[0],i/10000);if('fish'in result)counts.catch++;else if(result.enemy==='pallid bankmaw')counts.deadly++;else counts.ordinary++}
 expect(counts).toEqual({catch:8700,ordinary:1200,deadly:100});
 const g=prepared('sewer-0',250),result=command(g,'fish',{timing:'success'});expect(result.state.encounter?.name).toBe('mudskipper hound');expect(result.state.encounter?.phase).toBe(1);expect(result.discovery).toBeUndefined();expect(result.state.player.inventory['fishing bait']).toBe(9);expect(result.state.turns).toBe(1);expect(result.state.rewards.some(r=>r.startsWith('fish:'))).toBe(false);expect(decode(encode(result.state))).toEqual(result.state);
 const deadly=command(prepared('sewer-0',1),'fish',{timing:'success'});expect(deadly.state.encounter?.name).toBe('pallid bankmaw');expect(deadly.state.player.hp).toBeLessThan(48);expect(deadly.state.encounter?.damage).toBe(28);
});
it('fishing predators save in refuges, can be fled or killed, and never clear resident enemies',()=>{
 let g=prepared();g.previous='steps';g.discovered.push('steps');g.encounter=fishingEnemyFor(g.room,'mudskipper hound');g.encounter.hp=1;g.encounter.phase=3;g=decode(encode(g));const killed=command(g,'use riot stance').state;expect(killed.encounter).toBeNull();expect(killed.defeated).toEqual({});expect(decode(encode(killed))).toEqual(killed);
 const escaped=command(g,'flee').state;expect(escaped.room).toBe('steps');expect(escaped.encounter).toBeNull();expect(decode(encode(escaped))).toEqual(escaped);
 const vulnerable=prepared('sewer-0',1);vulnerable.player.hp=1;const dead=command(vulnerable,'fish',{timing:'success'});expect(dead.state.room).toBe('sewer-0');expect(dead.state.run.status).toBe('dead');expect(dead.sound).toBe('death');expect(dead.discovery).toBeUndefined();expect(decode(encode(dead.state))).toEqual(dead.state);
 const forged=prepared();forged.encounter=fishingEnemyFor(forged.room,'pallid bankmaw');forged.encounter.damage=1;expect(()=>encode(forged)).toThrow();forged.encounter=fishingEnemyFor(forged.room,'mudskipper hound');forged.room='clinic';expect(()=>encode(forged)).toThrow();
});
it('people offer missions separately from board jobs and accept only at their location',()=>{
 const g=prepared(),talk=command(g,'talk hal');expect(talk.messages.join(' ')).toContain('accept mission five-from-the-water');expect(talk.messages.join(' ')).not.toContain('Orra:');expect(command(g,'missions').changed).toBe(false);expect(command(g,'read board').messages.join(' ')).not.toContain('five-from-the-water');
 const accepted=command(g,'accept mission five-from-the-water').state;expect(accepted.rewards).toContain(missionKey(missions[0].id,'active'));expect(accepted.courier).toEqual(g.courier);expect(command(accepted,'accept mission five-from-the-water').changed).toBe(false);expect(command(prepared('quay-0'),'accept mission five-from-the-water').changed).toBe(false);
});
it('five real catches count after acceptance, persist through sale/reload, and pay once at the giver',()=>{
 const m=missions[0];let g=command(prepared(),'fish',{timing:'success'}).state;g=command(g,'accept mission '+m.id).state;expect(missionProgress(g,m)).toBe(0);
 for(let i=0;i<5;i++){g.rng=314159;const result=command(g,'fish',{timing:'success'});expect(result.discovery).toBeTruthy();g=result.state;g=command(g,'sell '+result.discovery!.item).state;g=decode(encode(g));expect(missionProgress(g,m)).toBe(i+1)}
 const credits=g.player.credits;g=command(g,'report '+m.id).state;expect(g.player.credits).toBe(credits+60);const before=encode(g);expect(command(g,'report '+m.id).changed).toBe(false);expect(encode(g)).toBe(before);expect(command(g,'missions').messages.join(' ')).toContain('completed');
});
it('site-specific missions ignore wrong waters, misses, hostile reels, purchased fish and prior inventory',()=>{
 const m=missions[1];let g=command(prepared('quay-0'),'accept mission '+m.id).state;
 for(const timing of ['miss','cancel']as const)g=command(g,'fish',{timing}).state;expect(missionProgress(g,m)).toBe(0);
 g.rng=250;g=command(g,'fish',{timing:'success'}).state;expect(g.encounter).toBeTruthy();expect(missionProgress(g,m)).toBe(0);g.encounter=null;
 g.room=g.previous='sewer-0';g.discovered.push(g.room);g.rng=314159;g=command(g,'fish',{timing:'success'}).state;expect(missionProgress(g,m)).toBe(0);expect(command(g,'report '+m.id).changed).toBe(false);
 g.room=g.previous='quay-0';g.rng=314159;g=command(g,'fish',{timing:'success'}).state;expect(missionProgress(g,m)).toBe(1);expect(decode(encode(g))).toEqual(g);
});
it('mission flags reject forged payment, gaps, missing acceptance and missing water evidence',()=>{
 for(const flags of [[missionKey(missions[0].id,'done')],[missionKey(missions[0].id,1)],[missionKey(missions[0].id,'active'),missionKey(missions[0].id,2),'fish:bottlebelly'],[missionKey(missions[0].id,'active'),missionKey(missions[0].id,1)]]){const g=prepared();g.rewards.push(...flags);expect(()=>encode(g)).toThrow()}
});
