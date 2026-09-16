import type {Game} from './engine';
import type {NameTone} from './Transcript';
import {rooms} from './world';
import {doctors} from './medicine';
import {theftObjects} from './roomObjects';
import {alarmFlag} from './theft';
import {visitorAllowed,type Visitor} from './roaming';

export interface PresentCharacter {name:string;kind:'resident'|'visitor'|'enemy';tone?:NameTone}
const npcNames:Record<string,string>={clerk:'Clerk',technician:'Iona',broker:'Moth',archivist:'Sen',postkeeper:'Ada'};
/** Current room occupants, not a transcript of everyone who has passed through. */
export function roomCharacters(g:Game,visitor:Visitor|null=null):PresentCharacter[]{
 const room=rooms[g.room],present:PresentCharacter[]=[],guard=room.guard.split(' — ')[0];
 const guardPresent=!!guard&&!g.encounter&&!theftObjects.some(object=>object.room===g.room&&g.rewards.includes(alarmFlag(object.id)));
 if(room.npc&&room.npc!=='warden')present.push({name:npcNames[room.npc]??room.npc,kind:'resident'});
 if(guardPresent)present.push({name:guard,kind:'resident'});
 else if(room.npc==='warden'&&!guard)present.push({name:'Warden',kind:'resident'});
 if(doctors[g.room])present.push({name:doctors[g.room].name,kind:'resident',tone:'clinic'});
 if(g.encounter)present.push({name:g.encounter.name,kind:'enemy',tone:'enemy'});
 else if(visitor&&visitorAllowed(visitor.id,room))present.push({name:visitor.name,kind:'visitor',tone:visitor.role==='hostile'?'enemy':'neutral'});
 // The enemy card is that character's one roster entry, even if an alias overlaps.
 const unique=new Map<string,PresentCharacter>();
 for(const person of present)unique.set(person.name.toLowerCase(),person);
 return [...unique.values()];
}
