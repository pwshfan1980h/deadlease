import {Fragment} from 'react';
import {enemies} from './enemies';
import {visitors} from './roaming';
import {items} from './items';
import {theftObjects} from './roomObjects';
/** Presentation affiliations only. Hostile identity always overrides faction color. */
export type NameTone='neutral'|'enemy'|'clinic'|'commons'|'syndicate'|'union';
const identities:Record<string,NameTone>={
 'clinic clerk':'clinic','clinic orderly':'clinic',clerk:'clinic',
 Moth:'neutral',Pell:'clinic','Lantern watch':'neutral',Iona:'neutral',technician:'neutral',broker:'neutral',Hal:'neutral','Drainwatch Hal':'neutral',Sera:'neutral','Dockwatch Sera':'neutral',Fen:'neutral','Warden Fen':'neutral',Vale:'neutral','Keeper Vale':'neutral',Orra:'neutral','Warden Orra':'neutral',Sen:'neutral',archivist:'neutral',Ada:'neutral',postkeeper:'neutral',warden:'neutral','freight watch':'neutral','kiosk watch':'neutral',
 Rusk:'union','Steward Rusk':'union','Cinder Union':'union',Commons:'commons',Syndicate:'syndicate',
};
for(const name of Object.keys(enemies))identities[name]='enemy';
for(const v of Object.values(visitors))if(!Object.hasOwn(identities,v.name))identities[v.name]=v.role==='hostile'?'enemy':'neutral';
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const lookup=new Map(Object.entries(identities).map(([name,tone])=>[name.toLowerCase(),tone]));
const itemNames=new Set([...Object.keys(items),...theftObjects.map(object=>object.name)].map(name=>name.toLowerCase()));
const mentionNames=[...Object.keys(identities),...itemNames];
const matcher=(values:string[])=>new RegExp('(?<![\\w-])('+values.sort((a,b)=>b.length-a.length).map(escape).join('|')+')(?![\\w-])','gi');
const names=matcher(mentionNames);
export function nameTone(name:string):NameTone{return lookup.get(name.toLowerCase())??'neutral'}
export function CharacterName({name,hostile=false,tone}:{name:string;hostile?:boolean;tone?:NameTone}){return <span className={'character-name name-'+(hostile?'enemy':tone??nameTone(name))}>{name}</span>}
export function TranscriptText({text,playerName}:{text:string;playerName?:string}){
 if(text.startsWith('Ground: '))return <span className="ground-text">{text}</span>;
 let index=0;const parts=[];for(const match of text.matchAll(playerName?matcher([...mentionNames,playerName]):names)){if(match.index!>index)parts.push(<Fragment key={'t'+index}>{text.slice(index,match.index)}</Fragment>);parts.push(itemNames.has(match[0].toLowerCase())?<span className="item-mention" key={'i'+match.index}>{match[0]}</span>:<CharacterName key={'n'+match.index} name={match[0]}/>);index=match.index!+match[0].length}parts.push(<Fragment key={'t'+index}>{text.slice(index)}</Fragment>);return <>{parts}</>;
}
