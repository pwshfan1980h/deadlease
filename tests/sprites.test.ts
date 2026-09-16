// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {Sprite,spriteManifest,areaAtlasKeys,retainAreaAtlases,loadAtlas} from '../src/sprites';
import {rooms} from '../src/world';
it('requests only current/adjacent area and shared atlases in the active palette',()=>{
 const area=rooms['quay-0'];const expected=new Set([area.zone,'shared']);
 for(const r of Object.values(rooms))if(r.zone===area.zone)for(const id of Object.values(r.exits))expected.add(rooms[id].zone);
 const keys=areaAtlasKeys(area,'ember');expect(new Set(keys.map(k=>spriteManifest.atlases[k].group))).toEqual(expected);
 expect(keys.every(k=>k.startsWith('ember/'))).toBe(true);expect(keys.length).toBeLessThan(Object.keys(spriteManifest.atlases).length/3);
});
it('crops at native dimensions, switches palettes, cancels obsolete loads and evicts distant cache entries',async()=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 const requested:any[]=[];vi.stubGlobal('Image',class{onload=()=>{};onerror=()=>{};src='';constructor(){requested.push(this)}});
 const ctx={clearRect:vi.fn(),drawImage:vi.fn(),imageSmoothingEnabled:true};vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx as any);
 const div=document.createElement('div'),root=createRoot(div);
 try{
 await act(async()=>root.render(createElement(Sprite,{id:'room/clinic',palette:'original',label:'Clinic'})));
 const obsolete=requested[0];await act(async()=>root.render(createElement(Sprite,{id:'room/clinic',palette:'tidal',label:'Clinic'})));
 await act(async()=>obsolete.onload());expect(ctx.drawImage).not.toHaveBeenCalled();
 const active=requested.find(i=>i.src.includes('tidal-district'));await act(async()=>active.onload());
 const s=spriteManifest.sprites['tidal/room/clinic'];expect(ctx.drawImage).toHaveBeenCalledWith(active,s.x,s.y,256,144,0,0,256,144);expect(ctx.imageSmoothingEnabled).toBe(false);
 retainAreaAtlases(rooms['quay-0'],'ember');expect(requested.slice(2).every(i=>i.src.includes('/atlases/ember-'))).toBe(true);
 const n=requested.length;void loadAtlas('tidal/district-0');expect(requested.length).toBe(n+1);
 }finally{await act(async()=>root.unmount());vi.restoreAllMocks();vi.unstubAllGlobals()}
});
