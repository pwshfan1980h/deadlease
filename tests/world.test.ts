import {describe,it,expect} from 'vitest';
import {rooms, zones, vectors, opposite} from '../src/world';
describe('authored geographic world',()=>{
 it('has at least 100 unique named, described, reachable rooms',()=>{
  const all=Object.values(rooms); expect(all.length).toBeGreaterThanOrEqual(100);
  expect(new Set(all.map(r=>r.name)).size).toBe(all.length);
  expect(new Set(all.map(r=>`${r.x},${r.y},${r.layer}`)).size).toBe(all.length);
  all.forEach(r=>expect(r.description.length).toBeGreaterThan(65));
  const seen=new Set(['clinic']); const todo=['clinic']; while(todo.length) for(const dest of Object.values(rooms[todo.pop()!].exits)) if(dest&&!seen.has(dest)){seen.add(dest);todo.push(dest)}
  expect(seen.size).toBe(all.length);
 });
 it('has reciprocal, geographically honest exits and level bands',()=>{
  for(const r of Object.values(rooms)) for(const [d,id] of Object.entries(r.exits)){
   const t=rooms[id!]; expect(t.exits[opposite[d]]).toBe(r.id); const v=vectors[d];
   expect([t.x-r.x,t.y-r.y,t.layer-r.layer]).toEqual(v);
  }
  expect(Object.keys(zones).length).toBeGreaterThanOrEqual(7);
  for(const r of Object.values(rooms)){expect(r.level).toBeGreaterThanOrEqual(zones[r.zone].band[0]);expect(r.level).toBeLessThanOrEqual(zones[r.zone].band[1]);}
 });
 it('provides several sewer entries, guarded refuges and warned repeatable danger',()=>{
  expect(Object.values(rooms).filter(r=>r.exits.down).length).toBeGreaterThanOrEqual(3);
  expect(Object.values(rooms).filter(r=>r.safe&&r.guard).length).toBeGreaterThanOrEqual(5);
  expect(Object.values(rooms).some(r=>r.level>=8&&r.respawn&&r.warning.length>30)).toBe(true);
 });
});
