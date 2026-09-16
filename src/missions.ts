import type {Game} from './engine';
export interface Mission {id:string;title:string;giver:string;person:string;target:number;waters:string[];credits:number;xp:number;offer:string;thanks:string}
export const missions:Mission[]=[
 {id:'five-from-the-water',title:'Five from the Water',giver:'sewer-0',person:'Hal',target:5,waters:[],credits:60,xp:30,offer:'“I need to know what still lives down here. Land five fish, anywhere in the estuary, then tell me what you found. Keep the catches. Count starts when you agree.”',thanks:'“Five living things. More than I expected. Here—something for the trouble.”'},
 {id:'harbor-sample',title:'Under the Pilings',giver:'quay-0',person:'Sera',target:3,waters:['quay-0'],credits:45,xp:25,offer:'“Three catches from these pilings. Tell me what comes up. Keep or sell them; I need a count, not a smell in my office.”',thanks:'“That explains the torn nets. I’ll move the swimmers upstream. You earned this.”'},
 {id:'creek-census',title:'What the Creek Keeps',giver:'bellwether-1',person:'Ada',target:5,waters:['wilds-5'],credits:100,xp:45,offer:'“The bridge keeper stopped writing. Catch five fish at Blackwater Bridge and report what is living there. Mind the claw marks. You can keep what you land.”',thanks:'“I’ll put your findings in the next city bag. Perhaps someone there will finally read them.”'}
];
export const missionKey=(id:string,step:string|number)=>'mission:'+id+':'+step;
export const missionRefs=missions.flatMap(m=>['active','done',...Array.from({length:m.target},(_,i)=>i+1)].map(step=>missionKey(m.id,step)));
export const missionActive=(g:Game,m:Mission)=>g.rewards.includes(missionKey(m.id,'active'));
export const missionDone=(g:Game,m:Mission)=>g.rewards.includes(missionKey(m.id,'done'));
export const missionProgress=(g:Game,m:Mission)=>Array.from({length:m.target},(_,i)=>i+1).filter(n=>g.rewards.includes(missionKey(m.id,n))).length;
export function resolveMission(text:string){const name=text.replace(/^mission /,'');return missions.find(m=>m.id===name||m.title.toLowerCase()===name)}
export function missionConversation(g:Game){return missions.filter(m=>m.giver===g.room).flatMap(m=>{
 if(missionDone(g,m))return [m.person+': '+m.thanks];
 if(missionActive(g,m)){const ready=missionProgress(g,m)===m.target;return [m.person+': '+(ready?'“You have the count? Tell me what you found.”':'“Come back when you have the count.”'),'MISSION / '+m.title+' — '+missionProgress(g,m)+'/'+m.target+' catches.',...(ready?['Type report '+m.id+'.']:[])];}
 return [m.person+': '+m.offer,'MISSION / '+m.title+' · '+m.credits+' credits, '+m.xp+' XP.','Type accept mission '+m.id+'.'];
})}
export function missionJournal(g:Game){const active=missions.filter(m=>missionActive(g,m));return ['MISSIONS / Personal requests from people. Talk to residents to find them.',...active.map(m=>m.title+' / '+(missionDone(g,m)?'completed':missionProgress(g,m)+'/'+m.target+' catches'+(missionProgress(g,m)===m.target?' · ready to report':''))+' · '+m.person+' · '+m.credits+' credits'+(missionDone(g,m)?' paid':'. Return to the giver; report '+m.id+'.'))]}
/** Count only actual catches after acceptance; hostile reels and bought fish never count. */
export function recordCatch(g:Game,messages:string[]){for(const m of missions){if(!missionActive(g,m)||missionDone(g,m)||(m.waters.length&&!m.waters.includes(g.room)))continue;const n=missionProgress(g,m);if(n>=m.target)continue;g.rewards.push(missionKey(m.id,n+1));messages.push('MISSION / '+m.title+' '+(n+1)+'/'+m.target+'.'+(n+1===m.target?' Return to '+m.person+'.':''))}}
