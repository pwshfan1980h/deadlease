import {useEffect,useRef,type KeyboardEvent} from 'react';
import type {Game} from './engine';
import {rooms} from './world';
import {Atlas} from './visuals';
export function Minimap({game,palette,request,onRequest,onClose}:{game:Game;palette:string;request:{text:string;serial:number}|null;onRequest:(text:string)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();dialog.current?.focus();return()=>dialog.current?.close()},[]);
 function key(e:KeyboardEvent){
  if(e.key==='Tab'){e.preventDefault();e.stopPropagation();onClose();return}
  const shortcut:Record<string,string>={l:'local',w:'world',s:'surface',b:'sewers',f:'fog',g:'labels',h:'hazards'};
  if(shortcut[e.key.toLowerCase()]){e.preventDefault();onRequest(shortcut[e.key.toLowerCase()])}
 }
 return <dialog ref={dialog} tabIndex={-1} className="minimap-dialog" aria-labelledby="minimap-title" onKeyDown={key} onCancel={e=>{e.preventDefault();onClose()}}>
  <header><div><span className="eyebrow">ESTUARY / YOUR POSITION</span><h2 id="minimap-title">{rooms[game.room].name}</h2></div><span className="small muted">Tab / Esc close</span></header>
  <Atlas game={game} palette={palette} request={request}/>
  <p className="minimap-keys">L local · W world · S surface · B below · F fog · G labels · H hazards</p><p className="small muted">Travel pauses while the map is open.</p>
 </dialog>;
}
