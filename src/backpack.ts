import {fish,fishingKit} from './fishing';
import {items,weaponAttack} from './items';
import type {Player} from './progression';
export interface Placement {x:number;y:number;rotated:boolean}
export interface Pack {bag:string;layout:Record<string,Placement>}
export interface Bundle {key:string;id:string;count:number}
export const bags:Record<string,{width:number;rows:number;description:string}>={
 'canvas satchel':{width:6,rows:3,description:'A patched clinic-issue satchel.'},
 'field backpack':{width:7,rows:4,description:'Reinforced canvas, deep pockets, brass buckles.'},
 'expedition frame':{width:8,rows:5,description:'A steel carrying frame for long trips below the city.'}
};
// Width × height in pack cells; supplies and scrap have finite stack sizes.
export const footprints:Record<string,[number,number,number]>={
 'battered handgun':[2,2,1],knife:[1,2,1],'pry bar':[3,1,1],'stun baton':[3,1,1],
 'service rifle':[4,2,1],'arc cutter':[3,2,1],'coil carbine':[4,2,1],'ceramic cleaver':[3,1,1],
 'armor vest':[2,2,1],'union plate':[3,3,1],'insulated coat':[2,3,1],'storm harness':[3,2,1],
 'medical supplies':[2,2,5],'lock tools':[2,1,1],salvage:[1,1,5],
 'pump component':[2,2,1],'access key':[1,1,1],'filter core':[2,2,1],'weather recording':[2,1,1],
 'governor spindle':[3,1,1],'lens fragment':[1,1,1],'master ledger':[2,2,1],'drain seal':[2,2,1],
 'field backpack':[2,3,1],'expedition frame':[3,3,1]
};
footprints[fishingKit]=[1,1,1];footprints['fishing bait']=[1,1,10];for(const f of fish)footprints[f.id]=[f.width,f.height,3];
for(const [id,item] of Object.entries(items))if(!footprints[id])footprints[id]=item.damage?[weaponAttack(id)==='rifle'?4:3,weaponAttack(id)==='rifle'?2:1,1]:[2,2,1];
export function capacity(p:Player,bag=p.pack?.bag??'canvas satchel'){
 const base=bags[bag];const strengthRows=Math.max(0,Math.min(3,p.stats.Grit-3));
 return {width:base.width,height:base.rows+strengthRows,strengthRows};
}
export function bundles(p:Player):Bundle[]{
 return Object.entries(p.inventory).flatMap(([id,n])=>{
  const count=n-(p.pack?.bag===id?1:0),limit=footprints[id]?.[2]??1;
  return Array.from({length:Math.ceil(count/limit)},(_,index)=>({key:id+':'+index,id,count:Math.min(limit,count-index*limit)}));
 });
}
export function size(id:string,rotated=false){const [w,h]=footprints[id]??[1,1,1];return rotated?{w:h,h:w}:{w,h}}
export function fits(p:Player,key:string,id:string,at:Placement,layout=p.pack.layout){
 const {width,height}=capacity(p),{w,h}=size(id,at.rotated);
 if(!Number.isInteger(at.x)||!Number.isInteger(at.y)||at.x<0||at.y<0||at.x+w>width||at.y+h>height)return false;
 for(const [other,pos] of Object.entries(layout)){
  if(other===key)continue;const otherId=other.slice(0,other.lastIndexOf(':'));const s=size(otherId,pos.rotated);
  if(at.x<pos.x+s.w&&at.x+w>pos.x&&at.y<pos.y+s.h&&at.y+h>pos.y)return false;
 }
 return true;
}
/** Keep existing positions and rotations. Fill gaps only for newly acquired bundles. */
export function reconcilePack(p:Player){
 p.pack??={bag:'canvas satchel',layout:{}};
 const all=bundles(p),layout:Pack['layout']={},pending:Bundle[]=[];
 for(const b of all){const at=p.pack.layout[b.key];if(at&&fits(p,b.key,b.id,at,layout))layout[b.key]=at;else pending.push(b)}
 const {width,height}=capacity(p);const failed=new Set<string>();
 for(const b of pending){
  if(failed.has(b.id))continue;
  let found=false;
  for(const rotated of [false,true]){for(let y=0;y<height&&!found;y++)for(let x=0;x<width&&!found;x++){
   const at={x,y,rotated};if(fits(p,b.key,b.id,at,layout)){layout[b.key]=at;found=true}
  }if(found)break}
  if(!found)failed.add(b.id);
 }
 p.pack.layout=layout;
}
export function unpacked(p:Player){return bundles(p).filter(b=>!p.pack.layout[b.key])}
export function canCarry(p:Player,add:Record<string,number>){
 const candidate=structuredClone(p);for(const [id,n] of Object.entries(add))candidate.inventory[id]=(candidate.inventory[id]??0)+n;
 reconcilePack(candidate);return unpacked(candidate).length===0;
}
export function placeBundle(p:Player,key:string,at:Placement){
 const b=bundles(p).find(b=>b.key===key);if(!b||!fits(p,key,b.id,at))return false;
 p.pack.layout[key]={...at};return true;
}
export function validPack(p:Player){
 const pack=p.pack;if(!pack||typeof pack!=='object'||Array.isArray(pack)||Object.keys(pack).sort().join('|')!=='bag|layout'||!Object.hasOwn(bags,pack.bag)||pack.bag!=='canvas satchel'&&!p.inventory[pack.bag])return false;
 if(!pack.layout||typeof pack.layout!=='object'||Array.isArray(pack.layout))return false;
 const owned=new Map(bundles(p).map(b=>[b.key,b.id]));const accepted:Pack['layout']={};
 for(const [key,pos] of Object.entries(pack.layout)){
  if(!pos||typeof pos!=='object'||Array.isArray(pos)||Object.keys(pos).sort().join('|')!=='rotated|x|y'||typeof pos.rotated!=='boolean'||!owned.has(key)||!fits(p,key,owned.get(key)!,pos,accepted))return false;
  accepted[key]=pos;
 }
 return true;
}
export function worn(p:Player,id:string){return p.weapon===id||p.armor===id||p.pack.bag===id}
