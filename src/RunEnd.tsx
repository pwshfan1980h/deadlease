import {useEffect,useRef,type KeyboardEvent} from 'react';
import type {Game} from './engine';
import {rooms} from './world';
import {DeathSignal} from './Motion';
export function RunEnd({game,busy,blocked,onRetry,onNew,onTitle,onExport}:{game:Game;busy:boolean;blocked:boolean;onRetry:()=>void;onNew:()=>void;onTitle:()=>void;onExport:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current;el?.showModal();el?.querySelector<HTMLButtonElement>('button')?.focus();return()=>el?.close()},[]);
 useEffect(()=>{const el=ref.current;if(!busy&&el&&(document.activeElement===el||!el.contains(document.activeElement)))el.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()},[busy,blocked]);
 function key(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!e.repeat&&!busy)onTitle()}if(e.key==='Tab'){const all=Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);if(!all.length){e.preventDefault();return}const i=all.indexOf(document.activeElement as HTMLButtonElement);e.preventDefault();all[(i+(e.shiftKey?-1:1)+all.length)%all.length]?.focus()}}
 return <dialog ref={ref} className="clinic-dialog death-screen run-end" aria-labelledby="run-end-title" onKeyDown={key} onCancel={e=>{e.preventDefault();if(!busy)onTitle()}}>
  <DeathSignal/><p className="eyebrow">RUN ENDED</p><h2 id="run-end-title">Everything goes quiet.</h2><p>{game.player.name} never reached the next shelter. The clinic will wake someone else.</p>
  <dl><dt>Last place</dt><dd>{rooms[game.room].name}</dd><dt>Cause</dt><dd>{game.run.cause}</dd><dt>Journey</dt><dd>Level {game.player.level} · {game.turns} {game.turns===1?'turn':'turns'} · {game.discovered.length} places</dd><dt>Record</dt><dd>{game.run.kills} defeats · {game.run.revivals} drone rescues</dd><dt>Work</dt><dd>{game.courier.completed} deliveries · {game.rewards.filter(r=>r.startsWith('mission:')&&r.endsWith(':done')).length} missions</dd></dl>
  {blocked&&<p role="alert">The run record could not be saved. Export it now; retry storage before starting another patient. <button disabled={busy} onClick={onRetry}>Retry saving record</button></p>}<div className="intake-actions"><button className="primary" disabled={busy||blocked} onClick={onNew}>{busy?'Recording this life…':'New patient'}</button><button disabled={busy} onClick={onTitle}>Return to title</button><button disabled={busy} onClick={onExport}>Export record</button></div><p className="small muted">This run stays ended. A new patient begins with a fresh pack and no inherited progress.</p>
 </dialog>;
}
