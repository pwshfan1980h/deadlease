import {it,expect} from 'vitest';
import {createGame,command,engageVisitor,roamingEnemyFor} from '../src/engine';
import {visitors,visitorsFor,RoomActivity} from '../src/roaming';
import {rooms} from '../src/world';
import {decode,encode} from '../src/saves';
function at(id:string){const g=createGame();g.room=id;g.previous=id;g.discovered=[...new Set(['clinic',id])];return g}
it('limits refuges to neutral visitors and respects regional habitats',()=>{
 for(const r of Object.values(rooms))for(const v of visitorsFor(r)){expect(v.zones).toContain(r.zone);if(r.safe)expect(v.role).toBe('neutral')}
 expect([...new Set(visitorsFor(rooms.steps).map(v=>v.role))]).toEqual(['neutral','attackable','hostile']);
});
it('has rare arrivals, short stays and a long quiet interval without idle chatter',()=>{
 const clock=new RoomActivity(rooms.steps,()=>.5);let time=0;
 const advance=(ms:number)=>{const events=[];for(let n=0;n<ms;n+=250){time+=250;const e=clock.advance(250);if(e)events.push({time,...e})}return events};
 expect(advance(89750)).toEqual([]);const arrivals=advance(250);expect(arrivals[0]).toMatchObject({time:90000,type:'arrival',visitor:{id:'lurker'}});
 expect(advance(23750)).toEqual([]);expect(advance(250)[0]).toMatchObject({time:114000,type:'departure'});
 expect(advance(179750)).toEqual([]);expect(advance(250)[0].type).toBe('arrival');
});
it('neutral visitors cannot be forced into encounters; defensive visitors only fight when attacked',()=>{
 const g=at('steps');expect(engageVisitor(g,'courier',true).state).toEqual(g);expect(engageVisitor(g,'ferret').changed).toBe(false);
 const result=engageVisitor(g,'ferret',true);expect(result.changed).toBe(true);expect(result.state.turns).toBe(1);expect(result.state.encounter?.id).toBe('roaming:ferret:steps');expect(decode(encode(result.state))).toEqual(result.state);
 expect(engageVisitor(at('clinic'),'lurker').changed).toBe(false);expect(engageVisitor(g,'__proto__',true).changed).toBe(false);
});
it('hostiles strike first exactly once; combat then advances only through commands',()=>{
 const g=at('steps'),result=engageVisitor(g,'lurker');expect(result.changed).toBe(true);expect(result.state.turns).toBe(1);expect(result.state.encounter?.phase).toBe(1);expect(result.messages.some(m=>/HIT|MISS/.test(m))).toBe(true);
 expect(command(result.state,'look').state).toEqual(result.state);expect(engageVisitor(result.state,'lurker').changed).toBe(false);
 expect(decode(encode(result.state))).toEqual(result.state);expect(command(decode(encode(result.state)),'brace')).toEqual(command(result.state,'brace'));
});
it('roaming victory does not defeat the resident or alter quest loot; fleeing preserves saves',()=>{
 let g=at('steps');g=engageVisitor(g,'ferret',true).state;const loot=structuredClone(g.loot);for(let n=0;g.encounter&&n<20;n++)g=command(g,'attack').state;
 expect(g.encounter).toBeNull();expect(g.defeated).toEqual({});for(const [room,ground] of Object.entries(loot))for(const [item,count] of Object.entries(ground))expect(g.loot[room][item]).toBe(count);expect(()=>encode(g)).not.toThrow();
 g=command(createGame(),'s').state;g=engageVisitor(g,'lurker').state;g=command(g,'flee').state;expect(g.room).toBe('clinic');expect(g.encounter).toBeNull();expect(()=>encode(g)).not.toThrow();
});
it('validates roaming templates and still rejects forged encounters',()=>{
 for(const v of Object.values(visitors).filter(v=>v.role!=='neutral')){
  const r=Object.values(rooms).find(r=>!r.safe&&v.zones.includes(r.zone))!;const g=at(r.id);if(r.enemy)g.defeated[r.id]=0;g.encounter=roamingEnemyFor(r.id,v.id);expect(decode(encode(g))).toEqual(g);
  g.encounter.damage+=1;expect(()=>encode(g)).toThrow();
 }
 const g=at('steps');g.encounter=roamingEnemyFor('steps','ferret');g.encounter.id='roaming:ferret:wrong-room';expect(()=>encode(g)).toThrow();
 const safe=createGame();safe.encounter=roamingEnemyFor('steps','ferret');expect(()=>encode(safe)).toThrow();
});
it('a lethal opening strike returns a valid terminal record',()=>{
 const g=at('steps');g.player.hp=1;g.rng=1;const r=engageVisitor(g,'lurker');expect(r.state.room).toBe('steps');expect(r.state.run.status).toBe('dead');expect(r.state.player.debt).toBe(0);expect(r.state.encounter).toBeNull();expect(()=>encode(r.state)).not.toThrow();
});
