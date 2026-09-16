import type {Game,Encounter} from './engine';
import type {Player} from './progression';
import {items,weaponAttack} from './items';
import {accuracyModifier} from './medicine';
import {enemyRole} from './enemyBehavior';
import {BALANCE as B} from './config';

export function attackVerb(weapon:string){return {pistol:'fire',rifle:'fire',blade:'slash',blunt:'strike',electric:'shock',fire:'burn',claw:'claw',drain:'drain'}[weaponAttack(weapon)]}
export function weaponChance(p:Player,aim=false){return Math.max(B.minAccuracy,Math.min(B.maxAccuracy,B.baseAccuracy+B.reflexAccuracy*p.stats.Reflex+B.skillAccuracy*p.skills[items[p.weapon].skill!]+accuracyModifier(p)+(aim?B.aimAccuracy:0)+(p.className==='Glassrunner'?B.glassAccuracy:0)-(p.radiation>=B.radThreshold?B.radPenalty:0)))}
export function weaponDamage(p:Player,e:Encounter,exposed:number,roll:number){return Math.max(1,items[p.weapon].damage!+B.skillDamage*p.skills[items[p.weapon].skill!]+roll-Math.max(0,e.armor-exposed))}
export function incomingDamage(raw:number,armor:number,shield:number,brace:boolean,cover:boolean,insulation:number){let n=Math.max(1,raw-armor-insulation);if(brace)n=Math.max(1,Math.floor(n*B.braceSpikeFactor)-B.braceFlat);if(cover)n=Math.max(1,Math.floor(n*B.coverFactor));return Math.max(1,n-shield)}
/** Forecast the next response if the foe survives; no RNG or game mutation. */
export function responseRange(g:Game,brace=false,cover=false):[number,number]{
 const e=g.encounter;if(!e||e.morale==='surrendered')return [0,0];
 const role=e.id.startsWith('theft:')?'standard':enemyRole(e.name),attacking=role==='marksman'?[1,3].includes(e.phase):[0,2].includes(e.phase);
 if(!attacking)return [0,0];
 const heavy=role==='marksman'?e.phase===1:e.phase===2,multiplier=heavy?(role==='marksman'?2:B.spikeMultiplier):1;
 const armor=(g.player.armor?items[g.player.armor].armor??0:0)+(g.player.className==='Ash Warden'?B.ashArmor:0),insulation=heavy&&g.player.armor?items[g.player.armor].insulation??0:0;
 return [0,B.enemyVariance-1].map(roll=>incomingDamage(e.damage*multiplier+roll,armor,g.shield,brace,cover,insulation)) as [number,number];
}
export function combatAssessment(g:Game){
 const e=g.encounter;if(!e)return [];
 const p=g.player,chance=weaponChance(p),low=weaponDamage(p,e,g.exposed,0),high=weaponDamage(p,e,g.exposed,B.damageVariance-1),next=responseRange(g),braced=responseRange(g,true),covered=responseRange(g,false,true),bleed=g.bleed?2:0;
 const attacks=Math.ceil(e.hp/((low+high)/2*chance/100));
 // A conservative equipment/health estimate, not a simulated victory probability.
 const heavyPhase=!e.id.startsWith('theft:')&&enemyRole(e.name)==='marksman'?1:2;
 const spike=responseRange({...g,encounter:{...e,phase:heavyPhase}})[1];
 const threat=e.morale==='surrendered'?'Surrendered':p.hp<=next[1]+bleed?'Lethal next response':p.hp<=spike+bleed?'Dangerous':attacks>6?'Hard fight':attacks>3?'Contested':'Favorable';
 const range=(r:[number,number])=>r[0]===r[1]?String(r[0]):r[0]+'–'+r[1];
 return ['ASSESS / '+e.name+' · '+threat+' · '+e.hp+'/'+e.maxHP+' HP · '+e.armor+' armor.',
  'WEAPON / '+p.weapon+' · '+attackVerb(p.weapon)+' · '+chance+'% hit · '+low+'–'+high+' damage on hit.'+(items[p.weapon].skill==='Firearms'?' Aim: '+weaponChance(p,true)+'% hit / '+(p.className==='Surveyor'?B.surveyorAimCost:B.aimCost)+' stamina.':''),
  'RESPONSE / If the enemy survives: '+range(next)+' HP on hit; brace '+range(braced)+'; cover '+(p.stamina>=B.coverCost?range(covered):'unavailable (3 stamina)')+'.'+(bleed?' Bleeding also costs 2 HP before their response.':''),
  'HINT / Inspect is free. Threat is an estimate; misses, skills, healing and timing change the fight.'];
}
