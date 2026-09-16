import {expect,it} from 'vitest';
import {mapBounds,mapFrame} from '../src/map-layout';
import {mapGeometry} from '../src/visual-data';
import {rooms} from '../src/world';

it('frames every floor independently with room-marker padding',()=>{
 for(const layer of [0,-1]){
  const [x,y,w,h]=mapBounds(layer);
  for(const room of Object.values(rooms).filter(r=>r.layer===layer)){
   expect(room.x-x).toBeGreaterThanOrEqual(1.5);expect(room.y-y).toBeGreaterThanOrEqual(1.5);
   expect(x+w-room.x).toBeGreaterThanOrEqual(1.5);expect(y+h-room.y).toBeGreaterThanOrEqual(1.5);
   expect(mapFrame(layer,false,room.id)).toEqual(mapBounds(layer));
  }
 }
 expect(mapBounds(-1)[3]).toBeLessThan(mapBounds(0)[3]/2);
});
it('local inspection centers the inspected room and never uses another floor as its center',()=>{
 expect(mapFrame(-1,true,'sewer-7')).toEqual([3.5,-2.5,7,7]);
 expect(mapFrame(-1,true,'clinic')).toEqual(mapBounds(-1));
});
it('draws every same-floor passage once and ladders at both matching endpoints',()=>{
 const geometry=mapGeometry();const routes=geometry.streets.map(s=>[s.id,s.to].sort().join('|'));
 expect(new Set(routes).size).toBe(routes.length);
 for(const room of Object.values(rooms))for(const destination of Object.values(room.exits)){
  const other=rooms[destination];
  if(other.layer===room.layer)expect(routes).toContain([room.id,other.id].sort().join('|'));
  else {const shaft=geometry.shafts.find(s=>s.x===room.x&&s.y===room.y);expect(shaft).toBeDefined();expect([room.x,room.y]).toEqual([other.x,other.y])}
 }
});

it('starts close to the player with permanent discovery fog and no unseen locations or ladders',async()=>{
 const {createElement}=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
 const {Atlas}=await import('../src/visuals');const {createGame}=await import('../src/engine');
 const g=createGame();const html=renderToStaticMarkup(createElement(Atlas,{game:g}));
 expect(html).toContain('viewBox="-3.5 -3.5 7 7"');expect(html).toContain('class="map-terrain" mask="url(');
 expect(html).toContain('aria-pressed="true">Local zoom');expect(html).not.toContain('> Fog</label>');
 expect(html).not.toContain('Clinic Steps map location');expect(html).not.toContain('Ladder down —');
 g.room='steps';g.discovered.push('steps');const explored=renderToStaticMarkup(createElement(Atlas,{game:g}));
 expect(explored).toContain('viewBox="-3.5 -2.5 7 7"');expect(explored).toContain('Ladder down —');
 expect(explored).toContain('Unexplored</p>');expect(explored).not.toContain('Steps Undercroft');
});
