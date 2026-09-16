import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {sliderPosition,targetWindow,timingHit,morseSymbol,type Challenge,type TimingOutcome} from './challenges';
import {ItemArt} from './Inventory';
import {items} from './items';
import './timing.css';
export function TimingGame({challenge,onFinish}:{challenge:Challenge;onFinish:(outcome:TimingOutcome)=>void}){
 const dialog=useRef<HTMLDialogElement>(null),done=useRef(false),elapsed=useRef(0),stageRef=useRef(0),held=useRef(false),holdStart=useRef(0);
 const [stage,setStage]=useState(0),[clock,setClock]=useState(0),[holding,setHolding]=useState(false);
 const finishRef=useRef(onFinish);finishRef.current=onFinish;
 function finish(outcome:TimingOutcome){if(done.current)return;done.current=true;finishRef.current(outcome)}
 useEffect(()=>{const el=dialog.current;el?.showModal();el?.focus();let frame=0,last=performance.now();
  const tick=(now:number)=>{const dt=now-last;last=now;if(!document.hidden&&!done.current){elapsed.current+=Math.min(dt,100);setClock(elapsed.current);if(elapsed.current>=10000)finish('miss')}if(!done.current)frame=requestAnimationFrame(tick)};
  const visibility=()=>{last=performance.now();if(document.hidden){held.current=false;setHolding(false)}};
  document.addEventListener('visibilitychange',visibility);frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);el?.close()};
 },[]);
 function advance(success:boolean){if(!success){finish('miss');return}if(stageRef.current+1>=challenge.stages){finish('success');return}stageRef.current++;elapsed.current=0;setClock(0);setStage(stageRef.current)}
 function down(){if(done.current||held.current)return;held.current=true;holdStart.current=elapsed.current;setHolding(true);if(challenge.kind!=='morse')advance(timingHit(challenge,stageRef.current,elapsed.current))}
 function up(){if(!held.current)return;held.current=false;setHolding(false);if(challenge.kind==='morse')advance(morseSymbol(elapsed.current-holdStart.current)===challenge.pattern?.[stageRef.current])}
 function key(e:KeyboardEvent){
  if(e.code==='Space'){e.preventDefault();e.stopPropagation();if(!e.repeat)down()}
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish('cancel')}
  if(e.key==='Enter'){e.preventDefault();e.stopPropagation();if(challenge.kind!=='fishing')finish(challenge.kind==='strike'?'miss':'skill')}
  if(e.key==='Tab'){e.preventDefault();dialog.current?.querySelector<HTMLButtonElement>('button')?.focus()}
 }
 const target=targetWindow(challenge,stage),position=sliderPosition(clock,challenge.period||1);
 return <dialog ref={dialog} tabIndex={-1} className={'timing-game timing-'+challenge.kind} aria-labelledby="timing-title" onKeyDown={key} onKeyUp={e=>{if(e.code==='Space'){e.preventDefault();e.stopPropagation();up()}}} onCancel={e=>{e.preventDefault();finish('cancel')}}>
  {challenge.kind==='fishing'&&<div className="fishing-water"><img src={'./assets/paintings/fishing-'+challenge.scene+'.png'} alt="Fishing line above dark estuary water"/><div className="fishing-ripple"/></div>}
  <div className="timing-content"><span className="eyebrow">{challenge.kind==='fishing'?(stage===0?'SET THE HOOK':'REEL IT IN'):challenge.kind==='lock'?'PIN '+(stage+1)+' OF 3':challenge.kind==='morse'?'CONTACT KEY':'SPECIAL ATTACK'}</span><h2 id="timing-title">{challenge.title}</h2><p>{challenge.description}</p>
   {challenge.kind==='morse'?<><div className="morse-code" aria-label={'Morse code '+challenge.pattern?.split('').map(s=>s==='.'?'dot':'dash').join(' ')}>{challenge.pattern?.split('').map((symbol,i)=><span key={i} className={i<stage?'matched':i===stage?'current':''}>{symbol==='.'?'·':'—'}</span>)}</div><p className="morse-hold">{holding?(clock-holdStart.current<350?'DOT ·':'DASH —'):'Release between signals'}</p></>:<div className="timing-track" role="meter" aria-label="Timing slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(position*100)}><span className="timing-target" style={{left:target.start*100+'%',width:challenge.width*100+'%'}}/><span className="timing-needle" style={{left:position*100+'%'}}/></div>}
   <div className="timing-progress" aria-label={(stage)+' of '+challenge.stages+' complete'}>{Array.from({length:challenge.stages},(_,i)=><span className={i<stage?'set':''} key={i}/>)}</div>
   <button className="timing-press" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);down()}} onPointerUp={up} onPointerCancel={()=>{held.current=false;setHolding(false)}}>{challenge.kind==='morse'?'Press / hold Space':'Press Space in amber'}</button>
   <p className="timing-footer">{challenge.kind==='fishing'?'Esc reel in empty':challenge.kind==='strike'?'Enter / Esc normal ability':'Enter use Tech · Esc abandon'} · {Math.max(0,10-Math.floor(clock/1000))}s</p>
  </div>
 </dialog>;
}
export function ItemDiscovery({item,first,onClose}:{item:string;first:boolean;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=dialog.current;el?.showModal();el?.focus();return()=>el?.close()},[]);
 return <dialog ref={dialog} tabIndex={-1} className="item-discovery" aria-labelledby="discovery-title" onCancel={e=>{e.preventDefault();onClose()}} onKeyDown={e=>{if(['Enter','Escape',' '].includes(e.key)){e.preventDefault();e.stopPropagation();if(!e.repeat)onClose()}if(e.key==='Tab'){e.preventDefault();dialog.current?.querySelector('button')?.focus()}}}>
  <span className="eyebrow">{first?'NEW DISCOVERY':'IN YOUR PACK'}</span><div className="discovery-art"><ItemArt id={item}/></div><h2 id="discovery-title">{item}</h2><p>{items[item].description}</p><button onClick={onClose}>Continue</button><p className="small muted">Enter / Esc</p>
 </dialog>;
}
