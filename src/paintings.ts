import locationArt from './generated/location-art.json' with {type:'json'};
import {enemies} from './enemies';
/** Painted assets keep their authored color; interface palettes never recolor a painting. */
export const scenePaintings:Record<string,string>=locationArt;
export const enemyPaintings:Record<string,string>=Object.fromEntries(Object.entries(enemies).map(([name,def])=>[name,'./assets/paintings/'+def.art+'.png']));
export const biomePaintings:Record<string,string>={shallows:'./assets/paintings/shallow-drains.png',wilds:'./assets/paintings/dike-wilderness.png',bellwether:'./assets/paintings/bellwether-town.png'};

const decodedScenes=new Map<string,Promise<void>>();
/** Decode before crossing; adjacent scenes are warmed in the background. Failed media never traps input. */
export function warmScene(id:string):Promise<void>{
 const src=scenePaintings[id];if(!src||typeof Image==='undefined')return Promise.resolve();
 const cached=decodedScenes.get(src);if(cached)return cached;
 const pending=new Promise<void>(resolve=>{const img=new Image();let done=false;const finish=(ok:boolean)=>{if(done)return;done=true;clearTimeout(timer);if(!ok)decodedScenes.delete(src);resolve()};const timer=setTimeout(()=>finish(false),4000);img.onload=()=>{void img.decode().then(()=>finish(true),()=>finish(false))};img.onerror=()=>finish(false);img.src=src;});decodedScenes.set(src,pending);return pending;
}
