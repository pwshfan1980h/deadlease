import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createGame,command,enemyFor,engageVisitor} from '../src/engine';
import {drone,freshIdentity} from '../src/runs';
import {reconcilePack,footprints} from '../src/backpack';
import {maxHP} from '../src/progression';
import {encode,decode} from '../src/saves';
function fight(){const g=createGame();g.room='alley';g.previous='steps';g.discovered.push('steps','alley');g.encounter=enemyFor(g.room);g.encounter.phase=2;g.player.hp=1;return g}
it('lethal damage seals a terminal record, rejects every further command and starts fresh without inherited progress',()=>{
 const g=fight(),result=command(g,'brace'),dead=result.state;expect(dead.run.status).toBe('dead');expect(dead.run.endedTurn).toBe(dead.turns);expect(dead.run.cause).toBe('scrap weasel');expect(dead.room).toBe('alley');expect(dead.player.hp).toBe(0);expect(dead.player.debt).toBe(0);expect(result.sound).toBe('death');expect(decode(encode(dead))).toEqual(dead);
 for(const text of ['rest','heal','attack','flee','dance','fish','accept freight-return','take all','spare'])expect(command(dead,text).state).toBe(dead);
 const a=freshIdentity(),b=freshIdentity();expect(a.id).not.toBe(b.id);const next=createGame('New','Baseline','Enforcer','Tech',a.seed,a.id);expect(next.run.id).not.toBe(dead.run.id);expect(next.room).toBe('clinic');expect(next.turns).toBe(0);expect(next.rewards).toEqual([]);expect(next.courier).toEqual({route:null,completed:0});expect(next.player.hp).toBe(maxHP(next.player));
});
it('one packed 2x2 drone intercepts lethal damage and preserves the same encounter',()=>{
 const g=fight();g.player.inventory[drone]=2;g.bleed=0;reconcilePack(g.player);expect(footprints[drone]).toEqual([2,2,1]);const result=command(g,'brace'),r=result.state;
 expect(r.run.status).toBe('alive');expect(r.run.revivals).toBe(1);expect(r.player.hp).toBe(Math.ceil(maxHP(r.player)/2));expect(r.player.inventory[drone]).toBe(1);expect(r.room).toBe(g.room);expect(r.encounter?.hp).toBe(g.encounter?.hp);expect(r.encounter?.phase).toBe(3);expect(result.sound).toBe('attack-revive');expect(decode(encode(r))).toEqual(r);
 r.player.hp=1;r.encounter!.phase=2;const second=command(r,'brace').state;expect(second.run.revivals).toBe(2);expect(second.player.inventory[drone]).toBeUndefined();second.player.hp=1;second.encounter!.phase=2;expect(command(second,'brace').state.run.status).toBe('dead');
});
it('unpacked drones cannot activate and an unpacked lower-index drone does not displace the actual consumed one',()=>{
 const g=fight();g.player.inventory[drone]=1;expect(command(g,'brace').state.run.status).toBe('dead');
 g.player.inventory[drone]=2;reconcilePack(g.player);delete g.player.pack.layout[drone+':0'];const surviving=command(g,'brace').state;expect(surviving.run.revivals).toBe(1);expect(surviving.player.inventory[drone]).toBe(1);expect(decode(encode(surviving))).toEqual(surviving);
});
it('bleeding rescue cancels the remaining enemy response and consumes only one drone',()=>{
 const g=fight();g.bleed=3;g.player.inventory[drone]=2;reconcilePack(g.player);const r=command(g,'brace').state;expect(r.run.revivals).toBe(1);expect(r.player.hp).toBe(maxHP(r.player)/2);expect(r.bleed).toBe(0);expect(r.encounter?.phase).toBe(2);expect(r.player.inventory[drone]).toBe(1);expect(decode(encode(r))).toEqual(r);
});
it('a drone rescue during flight keeps the survivor with the opponent; death closes parcel custody',()=>{
 const g=fight();g.player.inventory[drone]=1;reconcilePack(g.player);const rescued=command(g,'flee').state;expect(rescued.room).toBe(g.room);expect(rescued.encounter).toBeTruthy();
 let carrier=command(createGame(),'accept freight-return').state;carrier.room=g.room;carrier.previous=g.previous;carrier.discovered=g.discovered;carrier.encounter=g.encounter;carrier.player.hp=1;const dead=command(carrier,'brace').state;expect(dead.run.status).toBe('dead');expect(dead.courier.route).toBeNull();expect(dead.player.inventory['sealed parcel']).toBeUndefined();expect(decode(encode(dead))).toEqual(dead);
});
it('lethal roaming strikes use the same drone/death rules and produce valid saves',()=>{
 const g=createGame();g.room=g.previous='steps';g.discovered.push('steps');g.player.hp=1;g.rng=1;g.player.inventory[drone]=1;reconcilePack(g.player);const r=engageVisitor(g,'lurker');expect(r.state.run.revivals).toBe(1);expect(r.sound).toBe('attack-revive');expect(decode(encode(r.state))).toEqual(r.state);
});
it('real v3 fixtures migrate deterministically without losing character, pack, or encounter health',()=>{
 for(const name of ['living','combat']){const raw=readFileSync('tests/fixtures/run-migration/'+name+'-v3.json','utf8'),old=JSON.parse(raw),g=decode(raw);expect(g.version).toBe(4);expect(g.player).toEqual(old.player);expect(g.run.status).toBe('alive');expect(decode(raw)).toEqual(g);expect(g.bleed).toBe(0);if(old.encounter){expect(g.encounter?.hp).toBe(old.encounter.hp);expect(g.encounter?.phase).toBe(old.encounter.phase)}expect(decode(encode(g))).toEqual(g)}
});
it('forged terminal state and invalid combat status are rejected',()=>{
 for(const change of [(g:any)=>g.player.hp=0,(g:any)=>g.run.status='dead',(g:any)=>g.run.endedTurn=1,(g:any)=>g.run.id='../escape',(g:any)=>g.bleed=4,(g:any)=>g.encounter.heat=2,(g:any)=>g.encounter.morale='surrendered']){const g=fight();change(g);expect(()=>encode(g)).toThrow()}
});
