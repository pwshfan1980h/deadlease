import {fish,fishingKit} from './fishing';
import {useEffect,useRef,useState,type CSSProperties,type PointerEvent,type KeyboardEvent} from 'react';
import type {Game} from './engine';
import {stock,price} from './engine';
import {items} from './items';
import {bundles,capacity,footprints,size,fits,worn,type Placement} from './backpack';
const atlasItems=['battered handgun','knife','pry bar','stun baton','service rifle','arc cutter','coil carbine','ceramic cleaver','armor vest','union plate','insulated coat','storm harness','medical supplies','lock tools','salvage','pump component','access key','filter core','weather recording','governor spindle','lens fragment','master ledger','drain seal'];
export function ItemArt({id,rotated=false}:{id:string;rotated?:boolean}){
 if(id==='stitch drone')return <img className={'item-art'+(rotated?' rotated':'')} src="./assets/items/stitch-drone.png" alt=""/>;
 const fishingIndex=id===fishingKit?0:id==='fishing bait'?1:fish.find(f=>f.id===id)?.art;
 if(fishingIndex!==undefined){const x=fishingIndex%4*100,y=Math.floor(fishingIndex/4)*100,h=fishingIndex===8?90:100;return <svg aria-hidden="true" className={'item-art'+(rotated?' rotated':'')} viewBox={`${x} ${y} 100 100`}><svg x={x} y={y} width="100" height={h} viewBox={`${x} ${y} 100 ${h}`} overflow="hidden"><image href="./assets/items/estuary-fishing-atlas.png" width="400" height="400"/></svg></svg>}
 const index=atlasItems.indexOf(items[id]?.art??id);
 const bag=['canvas satchel','field backpack','expedition frame'].indexOf(id);
 if(bag>=0)return <svg aria-hidden="true" className={'item-art'+(rotated?' rotated':'')} viewBox={`${bag*100} 80 100 125`}><image href="./assets/items/noir-backpacks.png" width="300" height="300"/></svg>;
 const i=Math.max(0,index);
 return <svg aria-hidden="true" className={'item-art'+(rotated?' rotated':'')} viewBox={`${i%5*100} ${Math.floor(i/5)*100} 100 100`}><image href="./assets/items/noir-inventory-atlas.png" width="500" height="500"/></svg>;
}
interface Props {game:Game;onClose:()=>void;onPlace:(key:string,at:Placement)=>boolean;onCommand:(text:string)=>Promise<string[]|undefined>}
export function Inventory({game,onClose,onPlace,onCommand}:Props){
 const p=game.player,all=bundles(p),cap=capacity(p),layout=p.pack.layout;
 const [selected,setSelected]=useState(all[0]?.key??''),[held,setHeld]=useState<(Placement&{key:string})|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),grid=useRef<HTMLDivElement>(null),heldRef=useRef(held),drag=useRef<{x:number;y:number;moved:boolean;offsetX:number;offsetY:number}|null>(null);
 heldRef.current=held;
 const chosen=all.find(b=>b.key===selected)??all[0],carried=all.find(b=>b.key===held?.key),id=chosen?.id;
 const outside=all.filter(b=>!layout[b.key]);const valid=!!(held&&carried&&fits(p,held.key,carried.id,held));
 useEffect(()=>{dialog.current?.showModal();dialog.current?.querySelector<HTMLButtonElement>('.pack-item')?.focus();return()=>dialog.current?.close()},[]);
 function announce(text:string){setMessage(text)}
 function hold(key=chosen?.key){if(!key)return;setHeld({key,...(layout[key]??{x:0,y:0,rotated:false})});announce('Choose a space. R rotates; Enter places; Esc cancels.')}
 function put(at=heldRef.current){if(!at)return;const b=all.find(b=>b.key===at.key);if(!b||!onPlace(at.key,{x:at.x,y:at.y,rotated:at.rotated})){announce('That space is blocked. Find enough empty cells.');return false}setSelected(at.key);setHeld(null);announce('Packed '+b.id+'.');return true}
 function rotate(){
  const current=heldRef.current;if(current){setHeld({...current,rotated:!current.rotated});return}
  if(!chosen)return;const pos=layout[chosen.key];if(!pos){hold();return}
  const next={...pos,rotated:!pos.rotated};if(onPlace(chosen.key,next))announce('Rotated '+chosen.id+'.');else {setHeld({key:chosen.key,...next});announce('Turned item needs more room. Choose a space or Esc to cancel.')}
 }
 function coordinate(e:PointerEvent){const r=grid.current!.getBoundingClientRect();return {x:Math.floor((e.clientX-r.left)/(r.width/cap.width)),y:Math.floor((e.clientY-r.top)/(r.height/cap.height))}}
 function start(e:PointerEvent<HTMLButtonElement>,key:string){
  if(e.button!==0)return;e.preventDefault();e.stopPropagation();setSelected(key);e.currentTarget.focus();
  if(heldRef.current){put();return}
  const pos=layout[key]??{x:0,y:0,rotated:false},point=coordinate(e);
  drag.current={x:e.clientX,y:e.clientY,moved:false,offsetX:layout[key]?Math.max(0,point.x-pos.x):0,offsetY:layout[key]?Math.max(0,point.y-pos.y):0};
  setHeld({key,...pos});e.currentTarget.setPointerCapture(e.pointerId);
 }
 function move(e:PointerEvent){
  const current=heldRef.current;if(!current)return;
  if(drag.current&&Math.hypot(e.clientX-drag.current.x,e.clientY-drag.current.y)>4)drag.current.moved=true;
  const point=coordinate(e),b=all.find(b=>b.key===current.key);if(!b)return;const s=size(b.id,current.rotated);
  setHeld({...current,x:point.x-Math.min(drag.current?.offsetX??0,s.w-1),y:point.y-Math.min(drag.current?.offsetY??0,s.h-1)});
 }
 function end(){if(!drag.current)return;if(drag.current.moved){if(!put())setHeld(null)}else setHeld(null);drag.current=null}
 function key(e:KeyboardEvent){
  if(e.target instanceof Element&&e.target.closest('.pack-shop'))return;
  if(e.key==='Escape'){if(held){e.preventDefault();e.stopPropagation();setHeld(null);drag.current=null;announce('Move cancelled.')}return}
  if(e.key.toLowerCase()==='r'){e.preventDefault();rotate();return}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
   e.preventDefault();if(held){const b=all.find(b=>b.key===held.key)!;const s=size(b.id,held.rotated);setHeld({...held,x:Math.max(0,Math.min(cap.width-s.w,held.x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0))),y:Math.max(0,Math.min(cap.height-s.h,held.y+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)))});}
   else {const n=all.findIndex(b=>b.key===chosen?.key),next=all[(n+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+all.length)%all.length];if(next){setSelected(next.key);dialog.current?.querySelector<HTMLButtonElement>(`[data-key="${next.key}"]`)?.focus()}}return;
  }
  if((e.key==='Enter'||e.key===' ')&&e.target instanceof Element&&e.target.closest('.pack-item,.pack-grid')){e.preventDefault();if(held)put();else hold()}
 }
 async function act(text:string){if(busy)return;setBusy(true);setHeld(null);try{const result=await onCommand(text);announce(result?.join(' ')??'')}finally{setBusy(false)}}
 function tile(b:typeof all[number],unpacked=false){
  const at=layout[b.key],s=size(b.id,at?.rotated),equipped=worn(p,b.id);
  return <button key={b.key} type="button" className={'pack-item'+(selected===b.key?' selected':'')+(held?.key===b.key?' lifting':'')+(unpacked?' unpacked-item':'')} data-key={b.key} data-item={b.id} data-x={at?.x} data-y={at?.y} data-rotated={at?.rotated} aria-label={`${b.id}, ${s.w} by ${s.h}, ${b.count}${equipped?', equipped':''}`} aria-pressed={selected===b.key} tabIndex={chosen?.key===b.key?0:-1} style={at?{left:at.x/cap.width*100+'%',top:at.y/cap.height*100+'%',width:s.w/cap.width*100+'%',height:s.h/cap.height*100+'%'}:undefined} onFocus={()=>setSelected(b.key)} onPointerDown={e=>start(e,b.key)} onClick={e=>{if(e.detail===0){setSelected(b.key);hold(b.key)}}}>
   <ItemArt id={b.id} rotated={at?.rotated}/><span className="pack-item-label">{b.id}</span>{b.count>1&&<b className="pack-count">{b.count}</b>}{equipped&&<span className="pack-equipped" title="Equipped">◆</span>}
  </button>;
 }
 const occupied=Object.keys(layout).reduce((sum,k)=>{const b=all.find(b=>b.key===k);if(!b)return sum;const s=size(b.id);return sum+s.w*s.h},0);
 return <dialog ref={dialog} className="inventory-dialog" aria-labelledby="pack-title" onCancel={e=>{e.preventDefault();onClose()}} onKeyDown={key} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{setHeld(null);drag.current=null}}>
  <header className="pack-header"><span className="pack-bag-art"><ItemArt id={p.pack.bag}/></span><div><span className="eyebrow">{p.name} / BELONGINGS</span><h2 id="pack-title">{p.pack.bag}</h2></div><button aria-label="Close inventory" onClick={onClose}>×</button></header>
  <div className="pack-capacity"><span>{cap.width} × {cap.height} · {occupied}/{cap.width*cap.height} cells</span><span>Grit {p.stats.Grit} · +{cap.strengthRows} strength {cap.strengthRows===1?'row':'rows'}</span><span>{p.credits} cr</span></div>
  <div className="pack-body"><div className="pack-canvas"><div ref={grid} className="pack-grid" aria-label="Backpack grid" tabIndex={-1} style={{'--columns':cap.width,'--rows':cap.height,aspectRatio:`${cap.width} / ${cap.height}`} as CSSProperties} onPointerDown={e=>{if(held&&e.target===grid.current){const point=coordinate(e);put({...held,...point})}}}>
   {all.filter(b=>layout[b.key]).map(b=>tile(b))}
   {held&&carried&&<div className={'pack-preview '+(valid?'valid':'invalid')} style={{left:held.x/cap.width*100+'%',top:held.y/cap.height*100+'%',width:size(carried.id,held.rotated).w/cap.width*100+'%',height:size(carried.id,held.rotated).h/cap.height*100+'%'}}><ItemArt id={carried.id} rotated={held.rotated}/></div>}
  </div><p className="pack-stitch">RECLAMATION ISSUE / KEEP WHAT YOU CAN CARRY</p>
  {outside.length>0&&<section className="pack-overflow"><h3>Unpacked · {outside.length}</h3><p>Fit these before traveling. Nothing has been discarded.</p><div>{outside.slice(0,50).map(b=>tile(b,true))}</div>{outside.length>50&&<p>{outside.length-50} more bundles. Drop or sell excess items to make room.</p>}</section>}
  </div><aside className="pack-inspection">{id&&chosen&&<><div className="pack-detail-art"><ItemArt id={id}/></div><span className="eyebrow">{items[id].quest?'QUEST ARTIFACT':worn(p,id)?'EQUIPPED':'IN YOUR PACK'}</span><h3>{id}</h3><p>{items[id].description}</p>{id==='stitch drone'&&<p className="amber">{layout[chosen.key]?'PACKED · RESCUE READY':'UNPACKED · CANNOT RESCUE'}</p>}<p className="small muted">{size(id,layout[chosen.key]?.rotated).w} × {size(id,layout[chosen.key]?.rotated).h} cells · {chosen.count}/{footprints[id][2]} per bundle</p><div className="pack-actions"><button onClick={rotate}>Rotate <kbd>R</kbd></button><button onClick={()=>held?put():hold()}>{held?'Place':'Move'}</button>{(items[id].damage||items[id].armor||items[id].backpack)&&!worn(p,id)&&<button disabled={busy} onClick={()=>void act('equip '+id)}>Equip</button>}{((items[id].food??0)>0||(items[id].foodStamina??0)>0)&&<button disabled={busy} onClick={()=>void act('eat '+id)}>Eat</button>}{id==='medical supplies'&&<button disabled={busy} onClick={()=>void act('heal')}>Use supply</button>}{!items[id].quest&&(!worn(p,id)||p.inventory[id]>1)&&<button disabled={busy||!!game.encounter} onClick={()=>void act('drop '+id)}>Drop one</button>}{!items[id].quest&&stock(game).length>0&&(!worn(p,id)||p.inventory[id]>1)&&<button disabled={busy} onClick={()=>void act('sell '+id)}>Sell one · {id==='salvage'?4:Math.max(1,Math.floor(price(game,id)*.35))} cr</button>}</div></>}
  {stock(game).length>0&&<details className="pack-shop"><summary>Local trader</summary>{stock(game).map(id=><div key={id}><span>{id}</span><button disabled={busy||p.credits<price(game,id)} onClick={()=>void act('buy '+id)}>Buy · {price(game,id)} cr</button></div>)}</details>}
  </aside></div>
  <p className="pack-message" role="status">{message||'Drag to arrange. Turn an item to make it fit.'}</p><footer className="pack-keys">Drag or arrows + Enter · R rotate · Esc cancel / close</footer>
 </dialog>;
}
