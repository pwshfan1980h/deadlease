// Lightweight palette and geographic data used by the runtime; no raster recipes.
import {rooms} from './world';
export const palettes:Record<string,string[]>={
 original:['#171719','#27272A','#A29D95','#E7DDCA','#D6A66A','#DE897A','#B6BE7E','#A6B5C5'],
 ember:['#1C1420','#302337','#AD93A2','#F3DFCC','#EEAF69','#F58F91','#BED18A','#B5B5E7'],
 tidal:['#101D2B','#1D3245','#8FAAC2','#E4EBD6','#E3C476','#EF9293','#ABD3AB','#79CDCF']
};
export type PaletteName=keyof typeof palettes;
export const WIDTH=256,HEIGHT=144;
export function hash(text:string){let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
export function mapGeometry(){
 const streets:{id:string;to:string;x:number;y:number;x2:number;y2:number;layer:number}[]=[];
 const buildings:{id:string;x:number;y:number;w:number;h:number;layer:number}[]=[];
 for(const r of Object.values(rooms)){
  for(const dest of Object.values(r.exits)){const t=rooms[dest];if(r.id<t.id&&r.layer===t.layer)streets.push({id:r.id,to:t.id,x:r.x,y:r.y,x2:t.x,y2:t.y,layer:r.layer})}
  for(let i=0;i<(r.zone==='wilds'?0:2);i++)buildings.push({id:r.id,x:r.x-.38+i*.52,y:r.y-.38,w:.24+(hash(r.id+i)%8)/100,h:.22+(hash(r.name+i)%12)/100,layer:r.layer});
 }
 return {streets,buildings,shafts:Object.values(rooms).filter(r=>r.exits.down).map(r=>({id:r.id,x:r.x,y:r.y}))};
}
