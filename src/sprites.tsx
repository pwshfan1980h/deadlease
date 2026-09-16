import {useEffect,useRef} from 'react';
import data from './generated/atlas.json';
import {rooms,type Room} from './world';
interface SpriteRect {atlas:string;x:number;y:number;width:number;height:number;padding:number;area:string;palette:string}
interface AtlasFile {file:string;width:number;height:number;group:string;palette:string}
export const spriteManifest=data as {sprites:Record<string,SpriteRect>;atlases:Record<string,AtlasFile>};
const cache=new Map<string,Promise<HTMLImageElement>>();
export function areaAtlasKeys(room:Room,palette:string){
 const areas=new Set([room.zone,'shared']);
 for(const r of Object.values(rooms))if(r.zone===room.zone)for(const id of Object.values(r.exits))areas.add(rooms[id].zone);
 return Object.entries(spriteManifest.atlases).filter(([,a])=>a.palette===palette&&areas.has(a.group)).map(([key])=>key);
}
export function loadAtlas(key:string){
 let promise=cache.get(key);if(promise)return promise;
 promise=new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Atlas unavailable: '+key));img.src='./'+spriteManifest.atlases[key].file});
 cache.set(key,promise);void promise.catch(()=>{if(cache.get(key)===promise)cache.delete(key)});return promise;
}
export function retainAreaAtlases(room:Room,palette:string){
 const wanted=new Set(areaAtlasKeys(room,palette));for(const key of cache.keys())if(!wanted.has(key))cache.delete(key);
 for(const key of wanted)void loadAtlas(key).catch(()=>{});
}
export function Sprite({id,palette,label,className}:{id:string;palette:string;label:string;className?:string}){
 const ref=useRef<HTMLCanvasElement>(null),s=spriteManifest.sprites[`${palette}/${id}`];
 useEffect(()=>{let cancelled=false;const ctx=ref.current?.getContext('2d');if(!ctx)return;
 ctx.clearRect(0,0,s.width,s.height);
 void loadAtlas(s.atlas).then(img=>{if(cancelled)return;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,s.x,s.y,s.width,s.height,0,0,s.width,s.height)}).catch(()=>{});
 return()=>{cancelled=true};
 },[s]);
 return <canvas ref={ref} width={s.width} height={s.height} className={className} role="img" aria-label={label} data-sprite={id} data-atlas={s.atlas}/>;
}
