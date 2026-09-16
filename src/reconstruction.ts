import type {Game} from './engine';
import {maxHP,maxStamina} from './progression';
import {injury,type Ailment} from './medicine';
import {freshIdentity} from './runs';
import {instruction} from './instructions';

export const recoveryFee=(g:Game)=>Math.ceil(g.player.credits*.15);
const recoveryInjuries:Ailment[]=['torn ligaments','infected wound','nerve burns','brain damage','marrow rot','radiation sickness'];
export const recoveryInjury=(g:Game)=>recoveryInjuries.find(id=>!g.player.body.ailments.includes(id));
/** Pure reconstruction of a sealed death. Persistence must commit this before play resumes. */
export function reconstructAtClinic(source:Game,id:string=freshIdentity().id){
 if(source.run.status!=='dead')throw Error('Only a recorded death can be reconstructed.');
 if(id===source.run.id)throw Error('Reconstruction requires a new life identity.');
 const g=structuredClone(source),cost=recoveryFee(g),condition=recoveryInjury(g),messages:string[]=[];
 g.run={...g.run,id,status:'alive',cause:'',endedTurn:null,recoveries:g.run.recoveries+1};
 g.room=g.previous='clinic';g.encounter=null;g.bleed=g.shield=g.exposed=g.exposeTurns=0;g.cooldowns={};
 g.player.credits-=cost;
 if(condition)injury(g.player,condition,messages);
 g.player.hp=maxHP(g.player);g.player.stamina=maxStamina(g.player);g.player.radiation=0;
 const welcome=g.run.recoveries===1?'There you are, '+g.player.name+'. Follow the lamp. I’ve got you.':g.run.recoveries===2?'Same eyes. Same stubborn fool. Welcome back, '+g.player.name+'.':'I know that breathing. Easy, '+g.player.name+'. You’re home for now.';
 return {state:g,messages:['Reclamation Clinic.','Dr. Pell: “'+welcome+'”',...(g.player.body.commission==='done'?['Dr. Pell: “That repair bench you helped fix? It helped me bring you back.”']:[]),'RECOVERY / '+cost+' credits. Your map, work, levels, implants and belongings are intact. Health and stamina restored; radiation cleared.',...messages,instruction('Talk doctor for treatment. You can leave now; an empty purse never prevents recovery.')]};
}
