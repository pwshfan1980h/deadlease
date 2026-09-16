import {it,expect} from 'vitest';
import {createGame,command,enemyFor,intent} from '../src/engine';
import {rooms} from '../src/world';
import {encode,decode} from '../src/saves';
import {gainXP,classes} from '../src/progression';
function fight(name:string){const room=Object.values(rooms).find(r=>r.enemy===name)!;const g=createGame();gainXP(g.player,2700);g.room=g.previous=room.id;g.discovered.push(room.id);g.encounter=enemyFor(room.id);g.rng=1;return g}
it('marksmen aim, can have aim broken by cover, and reload after a telegraphed shot',()=>{
 const g=fight('alley marksman');expect(intent(g.encounter!)).toContain('AIMING');const covered=command(g,'cover').state;expect(covered.encounter?.phase).toBe(2);expect(covered.player.hp).toBe(g.player.hp);expect(intent(covered.encounter!)).toContain('RELOADING');
 let r=command(g,'brace').state;expect(r.encounter?.phase).toBe(1);expect(r.player.hp).toBe(g.player.hp);expect(intent(r.encounter!)).toContain('AIMED SHOT');r=command(r,'cover').state;expect(r.encounter?.phase).toBe(2);expect(r.player.hp).toBeLessThan(g.player.hp);expect(decode(encode(r))).toEqual(r);const hp=r.player.hp;r=command(r,'brace').state;expect(r.player.hp).toBe(hp);expect(r.encounter?.phase).toBe(3);
});
it('cutthroats cause bounded bleeding only on unguarded hits; reading is free and treatment clears it',()=>{
 const g=fight('street cutthroat');let r=command(g,'dance').state;expect(r.bleed).toBe(3);expect(command(r,'inspect target').state).toEqual(r);const hp=r.player.hp;r=command(r,'brace').state;expect(r.player.hp).toBe(hp-2);expect(r.bleed).toBe(2);expect(decode(encode(r))).toEqual(r);
 r.encounter!.phase=3;r=command(r,'heal').state;expect(r.bleed).toBe(0);expect(command(g,'brace').state.bleed).toBe(0);expect(command(g,'cover').state.bleed).toBe(0);
});
it('tread brutes build heat and must vent it over multiple safe responses',()=>{
 let g=fight('tread brute');for(let i=0;i<3;i++)g=command(g,'brace').state;expect(g.encounter?.heat).toBe(3);expect(g.encounter?.phase).toBe(3);expect(intent(g.encounter!)).toContain('OVERHEATED');const hp=g.player.hp;
 for(let n=2;n>=0;n--){g=command(g,'brace').state;expect(g.encounter?.heat).toBe(n);expect(g.player.hp).toBe(hp);expect(decode(encode(g))).toEqual(g)}expect(g.encounter?.phase).toBe(0);
});
it('a spared human resolves and pays once; refusing surrender prevents another offer',()=>{
 let g=fight('street cutthroat');g.encounter!.hp=Math.floor(g.encounter!.maxHP*.2);g=command(g,'brace').state;expect(g.encounter?.morale).toBe('surrendered');expect(decode(encode(g))).toEqual(g);const before=g.player.credits;const spared=command(g,'spare').state;expect(spared.encounter).toBeNull();expect(spared.run.kills).toBe(0);expect(spared.player.credits).toBeGreaterThan(before);expect(command(spared,'spare').changed).toBe(false);expect(decode(encode(spared))).toEqual(spared);
 g.rng=999999;const refused=command(g,'attack').state;if(refused.encounter)expect(refused.encounter.morale).toBe('defiant');
});
it('wounded marksmen may abandon a reload; no kill count or duplicated resident reward',()=>{
 const g=fight('alley marksman');g.encounter!.hp=1;g.encounter!.phase=2;const r=command(g,'brace').state;expect(r.encounter).toBeNull();expect(r.run.kills).toBe(0);expect(r.defeated[r.room]).toBeDefined();expect(decode(encode(r))).toEqual(r);expect(command(r,'spare').changed).toBe(false);
});

it('every class can use basic counters across all role phases and persist each result',()=>{
 for(const cls of Object.keys(classes))for(const name of ['alley marksman','street cutthroat','tread brute'])for(let phase=0;phase<4;phase++)for(const action of ['brace','cover']){
  const template=fight(name),g=createGame('Counter','Baseline',cls,'Tech');gainXP(g.player,2700);g.room=g.previous=template.room;g.discovered=template.discovered;g.encounter=template.encounter;g.encounter!.phase=phase;if(name==='tread brute'&&phase===3)g.encounter!.heat=3;
  const r=command(g,action);expect(r.changed).toBe(true);expect(r.state.run.status).toBe('alive');expect(r.state.bleed).toBe(0);expect(decode(encode(r.state))).toEqual(r.state);
 }
});
it('bleeding expires after three actions, clears on retreat, and never ticks on invalid commands',()=>{
 let g=fight('street cutthroat');g.bleed=3;for(const action of ['nonsense','spare','read imaginary'])expect(command(g,action).state).toEqual(g);
 for(let remaining=2;remaining>=0;remaining--){g=command(g,'brace').state;expect(g.bleed).toBe(remaining);expect(decode(encode(g))).toEqual(g)}
});
