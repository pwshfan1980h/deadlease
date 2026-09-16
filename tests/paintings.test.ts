import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const PNG={sync:{read:(data:Buffer)=>{expect(data.subarray(1,4).toString()).toBe('PNG');return {width:data.readUInt32BE(16),height:data.readUInt32BE(20)}}}};
import {fishingThreats} from '../src/fishing';
import {rooms} from '../src/world';
import {scenePaintings,enemyPaintings,biomePaintings} from '../src/paintings';
it('ships a distinct painted portrait for every enemy used in the world',()=>{
 const names=[...new Set([...Object.values(rooms).map(r=>r.enemy).filter(Boolean),...fishingThreats])];
 expect(Object.keys(enemyPaintings).sort()).toEqual(names.sort());
 expect(new Set(Object.values(enemyPaintings)).size).toBe(names.length);
 for(const path of Object.values(enemyPaintings)){const img=PNG.sync.read(readFileSync('public/'+path));expect(img.width).toBe(img.height);expect(img.width).toBeGreaterThanOrEqual(1000)}
});
it('ships the three pilot scenes at landscape resolution',()=>{
 for(const [id,path] of Object.entries(scenePaintings)){expect(rooms[id]).toBeDefined();const img=PNG.sync.read(readFileSync('public/'+path));expect(img.width/img.height).toBeCloseTo(16/9,2);expect(img.width).toBeGreaterThan(1000)}
});

it('ships landscape paintings for the shallow sewer, wilderness and second town',()=>{for(const zone of ['shallows','wilds','bellwether']){const img=PNG.sync.read(readFileSync('public/'+biomePaintings[zone]));expect(img.width/img.height).toBeCloseTo(16/9,2);expect(img.width).toBeGreaterThan(1000)}});
