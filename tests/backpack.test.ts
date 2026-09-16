import {it,expect} from 'vitest';
import {createGame,command} from '../src/engine';
import {capacity,bundles,reconcilePack,placeBundle,unpacked,validPack} from '../src/backpack';
import {encode,decode} from '../src/saves';
it('Grit and purchased backpacks expand the actual capacity',()=>{
 const g=createGame(),rad=createGame('Rhea','Radborn');expect(capacity(g.player)).toMatchObject({width:6,height:4});expect(capacity(rad.player)).toMatchObject({width:6,height:5});
 g.player.credits=60;const r=command(g,'buy field backpack');expect(r.changed).toBe(true);expect(r.state.player.pack.bag).toBe('field backpack');expect(capacity(r.state.player)).toMatchObject({width:7,height:5});expect(validPack(r.state.player)).toBe(true);expect(decode(encode(r.state))).toEqual(r.state);
});
it('multi-cell items rotate, reject overlaps and bounds, and retain positions after saving',()=>{
 const g=createGame();const p=g.player,original=structuredClone(p);
 expect(placeBundle(p,'knife:0',{x:4,y:3,rotated:true})).toBe(true);
 expect(placeBundle(p,'knife:0',{x:5,y:3,rotated:true})).toBe(false);
 expect(placeBundle(p,'knife:0',{x:0,y:0,rotated:false})).toBe(false);
 expect(p.inventory).toEqual(original.inventory);expect(g.turns).toBe(0);expect(decode(encode(g)).player.pack.layout['knife:0']).toEqual({x:4,y:3,rotated:true});
});
it('full packs reject purchases and loot atomically; dropped gear stays recoverable',()=>{
 const g=createGame();g.player.inventory['medical supplies']=25;reconcilePack(g.player);g.player.credits=100;
 expect(command(g,'buy armor vest').state).toBe(g);
 g.loot.clinic['armor vest']=1;const attempt=command(g,'take all');expect(attempt.changed).toBe(false);expect(attempt.state.loot.clinic['armor vest']).toBe(1);
 const dropped=command(g,'drop knife').state;expect(dropped.player.inventory.knife).toBeUndefined();expect(dropped.loot.clinic.knife).toBe(1);expect(decode(encode(dropped))).toEqual(dropped);
 const smaller=createGame();const out=command(smaller,'drop knife').state;const back=command(out,'take knife').state;expect(back.player.inventory.knife).toBe(1);expect(back.loot.clinic.knife).toBeUndefined();expect(validPack(back.player)).toBe(true);
});
it('finite supplies form separate bundles and consuming removes only empty bundles',()=>{
 let g=createGame();g.player.inventory['medical supplies']=6;reconcilePack(g.player);expect(bundles(g.player).filter(b=>b.id==='medical supplies').map(b=>b.count)).toEqual([5,1]);
 g.player.hp=10;g=command(g,'heal').state;expect(g.player.inventory['medical supplies']).toBe(5);expect(g.player.pack.layout['medical supplies:1']).toBeUndefined();expect(validPack(g.player)).toBe(true);
});
it('legacy saves migrate without losing overflow; malformed layouts are rejected',()=>{
 const old:any=createGame();delete old.player.pack;old.player.inventory['medical supplies']=60;
 const g=decode(JSON.stringify(old));expect(g.player.inventory['medical supplies']).toBe(60);expect(unpacked(g.player).length).toBeGreaterThan(0);expect(command(g,'s').changed).toBe(false);expect(()=>encode(g)).not.toThrow();
 for(const mutation of [(p:any)=>p.pack.layout['knife:0']={x:0,y:0,rotated:false},(p:any)=>p.pack.bag='expedition frame',(p:any)=>p.pack.layout['ghost:0']={x:0,y:0,rotated:false},(p:any)=>p.pack.layout['knife:0'].x=-1]){const broken=createGame();mutation(broken.player);expect(()=>decode(JSON.stringify(broken))).toThrow()}
});
it('changing to a smaller bag never discards belongings or charges a turn on failure',()=>{
 let g=createGame();g.player.credits=100;g=command(g,'buy field backpack').state;g.player.inventory['union plate']=2;reconcilePack(g.player);
 expect(unpacked(g.player)).toHaveLength(0);const result=command(g,'equip canvas satchel');expect(result.changed).toBe(false);expect(result.state).toBe(g);
});
it('extra copies of worn equipment can be dropped without removing the equipped copy',()=>{
 let g=createGame();g.player.inventory['battered handgun']=2;reconcilePack(g.player);g=command(g,'drop battered handgun').state;
 expect(g.player.weapon).toBe('battered handgun');expect(g.player.inventory['battered handgun']).toBe(1);expect(g.loot.clinic['battered handgun']).toBe(1);expect(command(g,'drop battered handgun').changed).toBe(false);expect(()=>encode(g)).not.toThrow();
});
it('a full pack does not consume a scrounge site, award XP or remove quest loot',()=>{
 let g=command(createGame(),'s').state;g.player.inventory['medical supplies']=25;reconcilePack(g.player);
 const before=structuredClone(g),result=command(g,'scrounge');expect(result.changed).toBe(false);expect(result.state).toEqual(before);expect(result.messages.join(' ')).toContain('No room');
 g=createGame();expect(command(g,'drop battered handgun').changed).toBe(false);
 g.player.inventory['pump component']=1;delete g.loot.alley['pump component'];reconcilePack(g.player);
 expect(command(g,'drop pump component').state).toBe(g);expect(()=>encode(g)).not.toThrow();
});
it('many attempted arrangements never overlap, escape the grid or change ownership',()=>{
 const g=createGame(),p=g.player;const owned=structuredClone(p.inventory);let seed=67;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed};
 for(let n=0;n<300;n++){
  const b=bundles(p)[random()%bundles(p).length],before=structuredClone(p.pack);
  const accepted=placeBundle(p,b.key,{x:random()%9-1,y:random()%7-1,rotated:!!(random()%2)});
  if(!accepted)expect(p.pack).toEqual(before);
  const cells=new Set<string>(),cap=capacity(p);
  for(const bundle of bundles(p)){
   const pos=p.pack.layout[bundle.key];if(!pos)continue;
   // Independent cell-by-cell check rather than calling the placement validator.
   const dimensions:Record<string,[number,number]>={'battered handgun':[2,2],knife:[1,2],'medical supplies':[2,2]};
   const [a,b]=dimensions[bundle.id],width=pos.rotated?b:a,height=pos.rotated?a:b;
   for(let y=pos.y;y<pos.y+height;y++)for(let x=pos.x;x<pos.x+width;x++){
    expect(x>=0&&x<cap.width&&y>=0&&y<cap.height).toBe(true);expect(cells.has(`${x},${y}`)).toBe(false);cells.add(`${x},${y}`);
   }
  }
  expect(p.inventory).toEqual(owned);expect(g.turns).toBe(0);
 }
 expect(decode(encode(g))).toEqual(g);
});
