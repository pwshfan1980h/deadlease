import type {Encounter} from './engine';
export type EnemyRole='standard'|'marksman'|'cutthroat'|'brute';
export function enemyRole(name:string):EnemyRole{
 if(['alley marksman','harbor gunner','mirror sniper','storm deserter','reed poacher'].includes(name))return 'marksman';
 if(['street cutthroat','sump knifer','shard duelist','fen trapper'].includes(name))return 'cutthroat';
 return name==='tread brute'?'brute':'standard';
}
export function behaviorIntent(e:Encounter):string|null{
 if(e.id.startsWith('theft:'))return null;
 const role=enemyRole(e.name);
 if(e.morale==='surrendered')return 'SURRENDER / Their weapon is down. Type spare to accept, or attack to refuse.';
 if(role==='marksman')return ['AIMING / No shot yet. Cover now breaks their aim and forces a reload.','AIMED SHOT / '+(e.damage*2)+'–'+(e.damage*2+2)+' raw damage next. Cover, brace, interrupt or flee.','RELOADING / No damage this response. Attack or heal.','SNAPSHOT / A hurried normal shot is next.'][e.phase];
 if(role==='brute'&&e.phase===3&&e.heat>0)return 'OVERHEATED / Heat '+e.heat+'/3. No attack while cooling. Take the opening.';
 if(role==='cutthroat'&&(e.phase===0||e.phase===2))return (e.phase===2?'HEAVY STRIKE':'CUTTING STRIKE')+' / An unguarded hit causes bleeding. Cover or brace prevents the cut.';
 return null;
}
