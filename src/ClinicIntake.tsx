import {DeathSignal} from './Motion';
import {useEffect,useRef,type KeyboardEvent} from 'react';
import {classes,origins} from './progression';
import {SKILLS} from './config';
export type IntakePanel='backstory'|'identity'|'training'|'death'|'recovery'|null;
interface Props {panel:IntakePanel;name:string;origin:string;cls:string;bonus:string;debt:number;busy:boolean;error:string;onName:(v:string)=>void;onOrigin:(v:string)=>void;onClass:(v:string)=>void;onBonus:(v:string)=>void;onDismiss:()=>void;onNext:()=>void;onBack:()=>void;onFinish:()=>void}
export function ClinicIntake(p:Props){
 function choose(e:KeyboardEvent<HTMLSelectElement>,update:(v:string)=>void){
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const options=Array.from(e.currentTarget.options);const current=e.currentTarget.selectedIndex;const index=e.key==='Home'?0:e.key==='End'?options.length-1:Math.max(0,Math.min(options.length-1,current+(e.key==='ArrowDown'?1:-1)));update(options[index].value)}
  if(e.key==='Enter'&&!e.ctrlKey&&!e.metaKey)e.preventDefault();
 }
 const modal=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const d=modal.current;if(p.panel){if(d&&!d.open)d.showModal();d?.querySelector<HTMLInputElement|HTMLSelectElement>('input,select')?.focus()}else if(d?.open)d.close()},[p.panel]);
 return <dialog ref={modal} className={"clinic-dialog"+(p.panel==='death'?' death-screen':'')} aria-labelledby="clinic-dialog-title" onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();if(p.busy)return;if(p.panel==='identity')p.onNext();else if(p.panel==='training')p.onFinish();else p.onDismiss()}}} onCancel={e=>{e.preventDefault();if(!p.busy)p.onDismiss()}} onClick={e=>{if(e.target===e.currentTarget&&!p.busy)p.onDismiss()}}>
  <button className="intake-close" aria-label={p.panel==='backstory'?'Dismiss backstory':p.panel==='death'?'Dismiss death scene':'Return to clinic'} disabled={p.busy} onClick={p.onDismiss}>×</button>
  {p.panel==='death'?<><DeathSignal/><h2 id="clinic-dialog-title">Everything goes quiet.</h2><p>The street falls away. Then rain against a window. A familiar lamp. Someone at the clinic is calling your name.</p><button className="primary" onClick={p.onDismiss} autoFocus>Open your eyes</button></>:p.panel==='recovery'?<><div className="eyebrow muted">CLINIC CLERK</div><h2 id="clinic-dialog-title">“Welcome back, {p.name}.”</h2><p>“Your things are here. So is your record. Try to keep this body a little longer.”</p><div className="recovery-record"><span>{p.origin} · {p.cls}</span><span>Clone debt · {p.debt} credits</span></div><button className="primary" onClick={p.onDismiss} autoFocus>Leave the bed</button></>:p.panel==='backstory'?<><h2 id="clinic-dialog-title">You wake.</h2><p>The clinic brought you back for another shift. Out here, the revived clear the streets and keep the pumps running. Somewhere beyond the marsh, people live without a work order. You mean to reach them.</p><button className="primary" onClick={p.onDismiss} autoFocus>Wake up</button></>:<>
   <div className="eyebrow muted">CLINIC CLERK</div>
   <h2 id="clinic-dialog-title">{p.panel==='identity'?'“What do I call you?”':'“What work did you do?”'}</h2>
   <form onSubmit={e=>{e.preventDefault();if(p.panel==='identity')p.onNext();else p.onFinish()}}>
    {p.panel==='identity'?<>
     <label>Name<input aria-label="Name" value={p.name} onChange={e=>p.onName(e.target.value)} maxLength={20} required autoComplete="off"/></label>
     <label>Origin<select aria-label="Origin" onKeyDown={e=>choose(e,p.onOrigin)} value={p.origin} onChange={e=>p.onOrigin(e.target.value)}>{origins.map(x=><option key={x}>{x}</option>)}</select></label>
     <p className="small muted">{p.origin==='Baseline'?'One extra rank in a skill of your choice.':p.origin==='Splice'?'+1 Reflex, −1 Nerve.':'+1 Grit, −1 Reflex. Less radiation exposure.'}</p>
    </>:<>
     <label>Class<select aria-label="Class" onKeyDown={e=>choose(e,p.onClass)} value={p.cls} onChange={e=>p.onClass(e.target.value)}>{Object.keys(classes).map(x=><option key={x}>{x}</option>)}</select></label>
     <p className="small muted">{classes[p.cls].description}</p>
     {p.origin==='Baseline'&&<label>Bonus skill<select aria-label="Bonus skill" onKeyDown={e=>choose(e,p.onBonus)} value={p.bonus} onChange={e=>p.onBonus(e.target.value)}>{SKILLS.map(x=><option key={x}>{x}</option>)}</select></label>}
    </>}
    {p.error&&<p className="red small" role="alert">{p.error}</p>}
    <div className="intake-actions">{p.panel==='training'&&<button type="button" disabled={p.busy} onClick={p.onBack}>Back</button>}<button className="primary" type="submit" disabled={p.busy}>{p.panel==='identity'?'Answer the clerk':p.busy?'Signing…':'Sign the register'}</button></div>
   </form>
  </>}
 <p className="intake-keys">Tab / ↑↓ choose · Ctrl+Enter confirm · Esc close</p>
 </dialog>;
}
