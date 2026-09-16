import {it,expect} from 'vitest';
import {createGame,command,enemyFor,engageVisitor} from '../src/engine';

function fight(){const g=createGame();g.room='alley';g.previous='steps';g.discovered.push('steps','alley');g.encounter=enemyFor('alley');g.encounter.phase=2;return g}
it('impact events match landed damage, preserve timing, and never mark a miss as an enemy hit',()=>{
 let hit=false,miss=false;
 for(let seed=1;seed<100000&&(!hit||!miss);seed+=113){
  const g=fight();g.rng=seed;const result=command(g,'attack'),impacts=result.sounds?.filter(e=>e.impact)??[];
  if(result.messages.some(m=>m.startsWith('HIT / You '))){hit=true;expect(impacts).toContainEqual({cue:'attack-impact',delay:140,impact:'enemy'})}
  else{miss=true;expect(impacts.some(e=>e.impact==='enemy')).toBe(false)}
  expect(impacts).toContainEqual({cue:'attack-impact',delay:520,impact:'player'});
 }
 expect(hit&&miss).toBe(true);
});
it('healing before an enemy hit still emits feedback even when net HP rises',()=>{
 const g=fight();g.player.hp=5;g.encounter!.phase=0;g.rng=1;
 const result=command(g,'heal');expect(result.state.player.hp).toBeGreaterThan(g.player.hp);expect(result.sounds?.some(e=>e.impact==='player')).toBe(true);
});
it('wind-ups, recovery, and information commands do not shake the player',()=>{
 for(const phase of [1,3]){const g=fight();g.encounter!.phase=phase;expect(command(g,'brace').sounds?.some(e=>e.impact==='player')??false).toBe(false)}
 expect(command(fight(),'look').sounds).toBeUndefined();
});
it('damaging abilities emit enemy impact; nondamaging abilities do not',()=>{
 const medic=createGame('Mara','Baseline','Street Medic');medic.room='alley';medic.encounter=enemyFor('alley');medic.encounter.phase=3;
 expect(command(medic,'use triage').sounds?.some(e=>e.impact==='enemy')).toBe(false);
 const g=fight();
 const damaging=createGame('Mara','Baseline','Ferryman');damaging.room=g.room;damaging.encounter=enemyFor(g.room);damaging.encounter.phase=3;
 expect(command(damaging,'use low water').sounds?.some(e=>e.impact==='enemy')).toBe(true);
});
it('hostile roaming opening damage has the same structured player impact event',()=>{
 const g=createGame();g.room='steps';g.previous='clinic';g.discovered.push('steps');g.rng=1;
 const result=engageVisitor(g,'lurker');expect(result.changed).toBe(true);expect(result.sounds?.some(e=>e.impact==='player')).toBe(true);
});
