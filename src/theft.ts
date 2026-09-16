import {theftObjects,type TheftObject} from './roomObjects';
import type {Game,Encounter} from './engine';
import type {Player} from './progression';
export const theftFlag=(id:string)=>'theft:'+id;
export const alarmFlag=(id:string)=>'alarm:'+id;
export const subduedFlag=(id:string)=>'subdued:'+id;
export function theftEnemyFor(id:string):Encounter {
 const object=theftObjects.find(object=>object.id===id);if(!object)throw Error('Unknown theft response');
 return {id:theftFlag(id),...object.guard,maxHP:object.guard.hp,heat:0,morale:'fighting'};
}
export function activeAlarm(g:Game){return theftObjects.find(object=>object.room===g.room&&g.rewards.includes(alarmFlag(object.id))&&!g.rewards.includes(subduedFlag(object.id)))}
export function theftChance(object:TheftObject,player:Player){
 if(object.chance===0)return 0;
 return Math.min(.85,object.chance+Math.max(0,player.stats.Reflex-3)*.025+player.skills.Survival*.04+(player.className==='Scavenger'?.1:0));
}
export function theftDescription(object:TheftObject,g:Game){
 if(g.rewards.includes(theftFlag(object.id)))return object.emptyDescription;
 if(g.rewards.includes(subduedFlag(object.id)))return 'The '+object.name+' remains where its owner left it. The armed response is over.';
 if(g.rewards.includes(alarmFlag(object.id)))return 'The '+object.name+' is still here. The watch has you covered and recognizes your face.';
 return object.description;
}
