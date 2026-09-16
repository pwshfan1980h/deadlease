import {useEffect,useRef,type KeyboardEvent} from 'react';
import type {Game} from './engine';
import {rooms} from './world';
import {recoveryFee,recoveryInjury} from './reconstruction';
import {DeathSignal} from './Motion';
export function RunEnd({game,notice,busy,blocked,onRetry,onWake,onLoad,onTitle,onExport}:{game:Game;notice:string;busy:boolean;blocked:boolean;onRetry:()=>void;onWake:()=>void;onLoad:()=>void;onTitle:()=>void;onExport:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current;el?.showModal();el?.querySelector<HTMLButtonElement>('button')?.focus();return()=>el?.close()},[]);
 useEffect(()=>{const el=ref.current;if(!busy&&el&&(document.activeElement===el||!el.contains(document.activeElement)))el.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()},[busy,blocked]);
 function key(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!e.repeat&&!busy)onTitle()}if(e.key==='Tab'){const all=Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);if(!all.length){e.preventDefault();return}const i=all.indexOf(document.activeElement as HTMLButtonElement);e.preventDefault();all[(i+(e.shiftKey?-1:1)+all.length)%all.length]?.focus()}}
 return <dialog ref={ref} className="clinic-dialog death-screen run-end" aria-labelledby="run-end-title" onKeyDown={key} onCancel={e=>{e.preventDefault();if(!busy)onTitle()}}>
  <DeathSignal/><p className="eyebrow">RECOVERY SIGNAL</p><h2 id="run-end-title">Everything goes quiet.</h2><p>Rain against the window. A familiar lamp. Dr. Pell is calling your name.</p>
  <dl><dt>Last place</dt><dd>{rooms[game.room].name}</dd><dt>Cause</dt><dd>{game.run.cause}</dd><dt>Journey</dt><dd>Level {game.player.level} · {game.turns} {game.turns===1?'turn':'turns'} · {game.discovered.length} places</dd><dt>Record</dt><dd>{game.run.kills} defeats · {game.run.revivals} drone rescues · {game.run.recoveries} clinic recoveries</dd><dt>Work</dt><dd>{game.courier.completed} deliveries · {game.rewards.filter(r=>r.startsWith('mission:')&&r.endsWith(':done')).length} missions</dd></dl>
  {notice&&<p role="alert">{notice}</p>}{blocked&&<p role="alert">The run record could not be saved. Export it now; retry storage before waking at the clinic. <button disabled={busy} onClick={onRetry}>Retry saving record</button></p>}<div className="intake-actions"><button className="primary" disabled={busy||blocked} onClick={onWake}>{busy?'Saving recovery record…':'Wake at clinic'}</button>{notice&&<button disabled={busy} onClick={onLoad}>Load latest autosave</button>}<button disabled={busy} onClick={onTitle}>Return to title</button><button disabled={busy} onClick={onExport}>Export record</button></div><p className="small muted">Reconstruction: {recoveryFee(game)} credits (15% of what you carry). {recoveryInjury(game)?"Lasting injury: "+recoveryInjury(game)+".":"Existing injuries remain; none will stack."} Your map, quests, levels, implants and gear stay with you. An empty purse will not prevent recovery.</p>
 </dialog>;
}
