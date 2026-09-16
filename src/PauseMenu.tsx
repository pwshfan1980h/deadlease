import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import type {Preferences} from './audio';
import './pause.css';

type Page='main'|'settings'|'controls'|'saves'|'credits';
interface Props {
 name:string;location:string;prefs:Preferences;onPrefs:(prefs:Preferences)=>void;
 onResume:()=>void;onTitle:()=>void;onSave:()=>Promise<void>;onLoad:(slot:string)=>Promise<void>;
 onExport:()=>void;onImport:()=>void;busy:boolean;canSave:boolean;blocked:boolean;notice:string;
}
export function PauseMenu({name,location,prefs,onPrefs,onResume,onTitle,onSave,onLoad,onExport,onImport,busy,canSave,blocked,notice}:Props){
 const dialog=useRef<HTMLDialogElement>(null);
 const [page,setPage]=useState<Page>('main');
 const [confirm,setConfirm]=useState<'title'|'manual'|'auto'|null>(null);
 const [pending,setPending]=useState(false);
 const locked=busy||pending;
 useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close()},[]);
 useEffect(()=>{dialog.current?.querySelector<HTMLElement>('[data-initial],button:not(:disabled),input,select')?.focus()},[page,confirm]);
 function back(){if(pending)return;if(confirm)setConfirm(null);else if(page!=='main')setPage('main');else onResume()}
 function key(e:KeyboardEvent){
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!e.repeat)back();return}
  if(e.key==='Tab'){
   const controls=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')??[]);
   const first=controls[0],last=controls.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
   return;
  }
  if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key)||!(e.target instanceof HTMLButtonElement))return;
  const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);
  const index=buttons.indexOf(e.target);e.preventDefault();
  buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
 }
 async function action(fn:()=>Promise<void>){if(locked)return;setPending(true);try{await fn()}finally{setPending(false)}}
 const titles:Record<Page,string>={main:'Paused',settings:'Settings',controls:'Controls',saves:'Save & load',credits:'Credits'};
 return <dialog ref={dialog} className="pause-menu" aria-labelledby="pause-title" onKeyDown={key} onCancel={e=>{e.preventDefault();back()}}>
  <header><span className="eyebrow">{location}</span><h2 id="pause-title">{confirm?(confirm==='title'?'Return to title':'Load save'):titles[page]}</h2><p className="muted small">{name} · World paused</p></header>
  {confirm?<section className="pause-confirm">
   <p>{confirm==='title'?'Return to the title screen? You can continue this journey.':'Load the '+(confirm==='auto'?'autosave':'manual save')+'? This replaces the current in-memory progress.'}</p>
   {confirm==='title'&&blocked&&<p className="amber">Autosave is blocked. Export your save before leaving to keep a separate copy.</p>}
   <button data-initial disabled={locked} onClick={()=>setConfirm(null)}>Stay here</button>
   <button disabled={locked} onClick={()=>{if(confirm==='title')onTitle();else void action(async()=>{await onLoad(confirm);setConfirm(null)})}}>{confirm==='title'?'Return to title':'Load save'}</button>
  </section>:<>
   {page==='main'&&<nav aria-label="Pause menu">
    <button data-initial className="pause-resume" onClick={onResume}>Resume</button>
    <button onClick={()=>setPage('settings')}>Settings</button>
    <button onClick={()=>setPage('controls')}>Controls</button>
    <button onClick={()=>setPage('saves')}>Save & load</button>
    <button onClick={()=>setPage('credits')}>Credits</button>
    <button disabled={locked} onClick={()=>setConfirm('title')}>Return to title</button>
   </nav>}
   {page==='settings'&&<section className="pause-settings">
    <label><input type="checkbox" checked={prefs.muted} onChange={e=>onPrefs({...prefs,muted:e.target.checked})}/> Mute all sound</label>
    {(['master','effects','ambience','music'] as const).map(k=><label key={k}>{k} <span>{Math.round(prefs[k]*100)}%</span><input aria-label={k+' volume'} type="range" min="0" max="100" value={Math.round(prefs[k]*100)} onChange={e=>onPrefs({...prefs,[k]:Number(e.target.value)/100})}/></label>)}
    <label>Text size<select value={prefs.fontSize} onChange={e=>onPrefs({...prefs,fontSize:Number(e.target.value)})}>{[14,15,16,18].map(size=><option key={size} value={size}>{size}px</option>)}</select></label>
    <label>Palette<select value={prefs.palette} onChange={e=>onPrefs({...prefs,palette:e.target.value})}><option value="original">Noir · charcoal & rust</option><option value="ember">Ember · paper & violet</option><option value="tidal">Tidal · cold harbor</option></select></label>
    <label><input type="checkbox" checked={prefs.motion} onChange={e=>onPrefs({...prefs,motion:e.target.checked})}/> Atmospheric motion</label>
    <p className="small muted">System reduced-motion preferences are always respected. Settings save automatically.</p>
   </section>}
   {page==='controls'&&<section className="pause-controls">
    <dl><dt>Enter</dt><dd>Submit a typed command.</dd><dt>Esc</dt><dd>Close an overlay, or pause / resume.</dd><dt>Tab</dt><dd>Open / close the map while exploring.</dd><dt>↑ / ↓</dt><dd>Recall commands. Choose menu options here.</dd><dt>Ctrl + Space</dt><dd>Complete a command.</dd><dt>PgUp / PgDn</dt><dd>Scroll the transcript.</dd></dl>
    <p><code>north / south / east / west / up / down</code><br/>Follow the room’s listed exits.</p>
    <p><code>look · inspect … · talk … · read board · jobs</code><br/>Explore, talk, and find paid work. Board jobs are courier contracts; people offer missions. Type missions to check them.</p>
    <p><code>attack · aim · brace · cover · heal · flee</code><br/>Fight using the actions and abilities below the transcript.</p>
    <p><code>fish · pick … · hack …</code><br/>Space handles timing. Fishing needs a hook and reel press; locks need three pins; terminals use short and long holds. Damaging special abilities offer a critical timing window.</p>
    <p><code>inventory · skills · journal · help</code><br/>Open your equipment, progression, journal, or full command reference. Inventory shows its own packing and rotation controls.</p>
   </section>}
   {page==='saves'&&<section className="pause-saves">
    <p className="small muted">World actions autosave locally in this browser. Export a copy to move it to another device.</p>
    {!canSave&&<p className="amber">Finish clinic discharge to save this character. Existing saves can still be loaded.</p>}
    {blocked&&<p className="amber">Autosave is blocked. Export your current progress; typed settings has recovery tools and preserved backups.</p>}
    <button disabled={locked||!canSave} onClick={()=>void action(onSave)}>Save game</button>
    <button disabled={locked} onClick={()=>setConfirm('manual')}>Load manual save</button>
    <button disabled={locked} onClick={()=>setConfirm('auto')}>Load autosave</button>
    <button disabled={locked||!canSave} onClick={onExport}>Export save</button>
    <button disabled={locked} onClick={onImport}>Import save…</button>
    <p className="small muted">Import loads the selected valid save and replaces the manual slot. Invalid files leave your journey intact.</p>
   </section>}
   {page==='credits'&&<section className="pause-credits"><p>FREEBORN</p><p>Battle music: “Dark Fog” by Kevin MacLeod (incompetech.com), CC BY 4.0.</p><p>Additional combat sounds by Helton Yan, CC BY 4.0; conversion by Moonsec.</p><p>Full artist credits, sources, and license details are included in <a href="./assets/ATTRIBUTION.md" target="_blank" rel="noreferrer">asset credits</a>.</p></section>}
   {page!=='main'&&<button className="pause-back" onClick={()=>setPage('main')}>Back</button>}
  </>}
  {notice&&<p className="pause-notice" role="status">{notice}</p>}
  <footer>{locked?'Saving…':'↑↓ choose · Enter confirm · Tab focus · Esc back'}</footer>
 </dialog>;
}
