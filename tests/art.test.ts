import {it,expect} from 'vitest';
import {palettes,scenePixels,colorize,mapGeometry} from '../src/art';
import {rooms} from '../src/world';
it('uses a neutral noir base with two eight-color alternatives',()=>{
 expect(palettes.original).toEqual(['#171719','#27272A','#A29D95','#E7DDCA','#D6A66A','#DE897A','#B6BE7E','#A6B5C5']);expect(Object.keys(palettes).length).toBeGreaterThanOrEqual(3);
 for(const p of Object.values(palettes)){expect(p).toHaveLength(8);expect(new Set(p).size).toBe(8)}
});
it('renders every room as deterministic distinct 256×144 indexed pixel art in all palettes',()=>{
 const hashes=new Set<string>();for(const r of Object.values(rooms)){
  const pixels=scenePixels(r);expect(pixels).toHaveLength(256*144);expect(scenePixels(r)).toEqual(pixels);expect(Math.max(...pixels)).toBeLessThan(8);
  hashes.add(Buffer.from(pixels).toString('base64'));
  for(const p of Object.values(palettes)){const rgba=colorize(pixels,p);expect(rgba).toHaveLength(256*144*4);expect(rgba[3]).toBe(255)}
 }expect(hashes.size).toBe(Object.keys(rooms).length);
});
it('map uses geographic streets and separate building footprints, with shared shaft coordinates',()=>{
 const geo=mapGeometry();expect(geo.streets.length).toBeGreaterThan(100);expect(geo.buildings.length).toBeGreaterThan(100);
 for(const shaft of geo.shafts){const r=rooms[shaft.id];expect(shaft.x).toBe(r.x);expect(shaft.y).toBe(r.y)}
});
it('each authored room has an explicit focal prop direction beyond shared regional scenery',async()=>{
 const {sceneDirections}=await import('../src/art');expect(Object.keys(sceneDirections).sort()).toEqual(Object.keys(rooms).sort());expect(new Set(Object.values(sceneDirections)).size).toBeGreaterThanOrEqual(20);
});
