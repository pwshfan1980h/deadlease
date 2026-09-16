import {it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {rooms} from '../src/world';
import {palettes} from '../src/art';
it('ships bounded padded atlases with every room and portrait in each exact palette',()=>{
 const path='src/generated/atlas.json';expect(existsSync(path)).toBe(true);if(!existsSync(path))return;
 const m=JSON.parse(readFileSync(path,'utf8'));expect(m.maxSize).toBeLessThanOrEqual(2048);
 for(const palette of Object.keys(palettes))for(const r of Object.values(rooms)){
 const s=m.sprites[`${palette}/room/${r.id}`];expect(s).toMatchObject({width:256,height:144,area:r.zone,palette});expect(m.atlases[s.atlas].group).toBe(r.zone);
 }
 for(const palette of Object.keys(palettes))for(const name of ['baseline','splice','radborn','clerk','technician','broker','scavenger','creature','guard'])expect(m.sprites[`${palette}/portrait/${name}`]).toMatchObject({width:64,height:64});
 for(const [id,a] of Object.entries(m.atlases) as [string,any][]){expect(existsSync('public/'+a.file)).toBe(true);expect(a.width).toBeLessThanOrEqual(m.maxSize);expect(a.height).toBeLessThanOrEqual(m.maxSize);
 const sprites=Object.values(m.sprites).filter((s:any)=>s.atlas===id) as any[];
 for(const s of sprites){expect(s.padding).toBeGreaterThanOrEqual(2);expect(s.x-s.padding).toBeGreaterThanOrEqual(0);expect(s.y-s.padding).toBeGreaterThanOrEqual(0);expect(s.x+s.width+s.padding).toBeLessThanOrEqual(a.width);expect(s.y+s.height+s.padding).toBeLessThanOrEqual(a.height);
 for(const t of sprites)if(s!==t)expect(s.x+s.width+s.padding<=t.x-t.padding||t.x+t.width+t.padding<=s.x-s.padding||s.y+s.height+s.padding<=t.y-t.padding||t.y+t.height+t.padding<=s.y-s.padding).toBe(true)}
 }
 expect(existsSync('public/assets/scenes')).toBe(false);expect(existsSync('public/assets/portraits')).toBe(false);
});
it('audits exact palette pixels, recipe crops, extruded borders and licensed audio bytes',async()=>{
 const {execFileSync}=await import('node:child_process');
 const result=execFileSync(process.execPath,['--import','./scripts/register-ts.mjs','scripts/audit-assets.mjs'],{encoding:'utf8'});
 expect(JSON.parse(result)).toMatchObject({passed:true,sprites:(Object.keys(rooms).length+9+3)*Object.keys(palettes).length});
});
