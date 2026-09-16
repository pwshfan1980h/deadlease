import {useEffect,useRef} from 'react';
import type {Result} from './engine';

/** Decorative motion only: no gameplay state or input capture. */
export function TitleAtmosphere(){
 return <div className="title-atmosphere" aria-hidden="true"><i className="title-lamplight"/><i className="title-mist"/><i className="title-rain rain-distant"/><i className="title-rain rain-near"/></div>;
}

export function DeathSignal(){
 return <div className="death-signal" aria-hidden="true">
  <span className="death-horizon"/>
  <svg viewBox="0 0 640 120" preserveAspectRatio="xMidYMid meet" focusable="false">
   <path className="death-trace" pathLength="1" d="M0 60 H135 L148 53 L160 60 H188 L200 72 L211 20 L225 98 L236 60 H284 L296 55 L309 60 H350 L362 68 L374 37 L384 79 L397 60 H640"/>
   <path className="death-flatline" pathLength="1" d="M397 60 H640"/>
  </svg>
 </div>;
}

/** Shares impact timing with sound; actual damage events decide what reacts.
 * Browser animations own their delays, and are cancelled on a new action/screen. */
export function useImpactFeedback(enabled:boolean){
 const animations=useRef<Animation[]>([]),frame=useRef<number|null>(null);
 const cancel=()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;for(const animation of animations.current)animation.cancel();animations.current=[]};
 useEffect(()=>{const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');const change=()=>cancel();media?.addEventListener?.('change',change);return()=>{cancel();media?.removeEventListener?.('change',change)}},[enabled]);
 return (result:Result)=>{
  cancel();
  if(!enabled||document.querySelector('.app[data-motion="off"]')||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||!result.sounds?.some(e=>e.impact))return;
  frame.current=requestAnimationFrame(()=>{
   frame.current=null;if(document.hidden||document.querySelector('dialog[open]'))return;
   for(const event of result.sounds??[]){
    if(!event.impact)continue;
    let target=document.querySelector<HTMLElement>(event.impact==='enemy'?'.enemy-painting':'.player-identity .portrait');
    // Compact layouts omit the portrait; use the health readout in its place.
    if(event.impact==='player'&&(!target||!target.getClientRects().length))target=document.querySelector('.player-card .resource');
    if(!target?.animate)continue;
    const animation=target.animate([{transform:'translate(0,0)'},{transform:'translate(-5px,1px)'},{transform:'translate(4px,-1px)'},{transform:'translate(-3px,0)'},{transform:'translate(2px,0)'},{transform:'translate(0,0)'}],{duration:210,delay:event.delay,easing:'ease-out'});
    animation.id='impact-'+event.impact;animations.current.push(animation);
   }
  });
 };
}
