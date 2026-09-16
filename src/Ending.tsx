import {useEffect,useRef} from 'react';
export function Ending({name,onClose}:{name:string;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close()},[]);
 return <dialog ref={dialog} className="ending-dialog" aria-labelledby="ending-title" onCancel={e=>{e.preventDefault();onClose()}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();onClose()}}}>
  <img src="./assets/paintings/city-horizon.png" alt="A distant city of lit towers and small aircraft beyond the estuary"/>
  <div className="ending-copy"><p className="eyebrow">THE CROSSING</p><h2 id="ending-title">Freeborn.</h2><p>The ferry leaves the causeway behind. Tower lights climb through the rain. For once, nobody at the far end is waiting to put you back to work.</p><p>You give your name. Just your name.</p><p className="amber">{name} reached the city.</p><hr/><p className="small muted">FREEBORN · An Estuary story<br/>Created with Will<br/>Painted world and characters generated with OpenAI<br/>Original synthesized travel and combat sound<br/>Additional sound by Helton Yan<br/>“Dark Fog” by Kevin MacLeod · CC BY 4.0</p><p className="small"><a href="./assets/ATTRIBUTION.md">Full credits</a></p><button autoFocus onClick={onClose}>Return to the estuary</button><p className="small muted">Journey complete. Enter or Escape returns to free exploration.</p></div>
 </dialog>
}
