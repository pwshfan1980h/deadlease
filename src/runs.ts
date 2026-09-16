import type {Game} from './engine';
import {maxHP} from './progression';
export interface Run {id:string;seed:number;status:'alive'|'dead';cause:string;endedTurn:number|null;kills:number;revivals:number;recoveries:number}
export const drone='stitch drone';
export function runRecord(seed:number,id='seed-'+seed):Run{return {id,seed,status:'alive',cause:'',endedTurn:null,kills:0,revivals:0,recoveries:0}}
export function freshIdentity(){const bytes=new Uint32Array(1);globalThis.crypto.getRandomValues(bytes);return {seed:bytes[0]||1,id:globalThis.crypto.randomUUID()}}
export function packedDrone(g:Game){return Object.keys(g.player.pack.layout).find(key=>key.startsWith(drone+':')&&Number(key.slice(drone.length+1))<(g.player.inventory[drone]??0))}
/** Resolve one lethal event. Callers stop this action's remaining damage on rescue. */
export function resolveLethal(g:Game,cause:string,messages:string[]):'revived'|'dead'{
 const key=packedDrone(g),p=g.player;
 if(key){
  const index=Number(key.slice(drone.length+1));if(--p.inventory[drone]<=0)delete p.inventory[drone];
  const layout:typeof p.pack.layout={};for(const [k,at] of Object.entries(p.pack.layout)){if(k===key)continue;const n=k.startsWith(drone+':')?Number(k.slice(drone.length+1)):-1;layout[n>index?drone+':'+(n-1):k]=at}p.pack.layout=layout;
  p.hp=Math.ceil(maxHP(p)*.5);g.bleed=0;g.run.revivals++;messages.push('REVIVED / Your Stitch Drone tears free of the pack. A shock pulls you back. Half health restored; bleeding stopped. One drone consumed.');return 'revived';
 }
 p.hp=0;g.run.status='dead';g.run.cause=cause;g.run.endedTurn=g.turns;g.encounter=null;g.bleed=0;g.shield=0;g.exposed=0;g.exposeTurns=0;
 messages.push('FALLEN / '+p.name+' died to '+cause+'. The clinic recovery crew is on its way.');return 'dead';
}
export function legacyRunId(raw:string){let h=2166136261;for(let i=0;i<raw.length;i++)h=Math.imul(h^raw.charCodeAt(i),16777619)>>>0;return 'legacy-'+h.toString(16)}
