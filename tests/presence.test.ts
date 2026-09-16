import {it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createGame,command,enemyFor} from '../src/engine';
import {roomCharacters} from '../src/presence';
import {rooms} from '../src/world';
import {visitors} from '../src/roaming';
import {theftEnemyFor,alarmFlag,subduedFlag} from '../src/theft';
import {App} from '../src/App';

it('clinic has one complete roster and looking never appends partial NPC or ground lists',()=>{
 const g=createGame();expect(roomCharacters(g).map(p=>p.name)).toEqual(['Clerk','Clinic orderly','Dr. Pell']);
 for(const text of ['look','look around']){const r=command(g,text);expect(r.state).toBe(g);expect(r.messages.join('\n')).not.toMatch(/Here:|Here now:|tends a surgical bench|protects this refuge|Ground:/);expect(r.messages.join(' ')).toContain('jobs board');}
 const html=renderToStaticMarkup(createElement(App,{initialGame:g}));expect(html.match(/aria-label="Characters here"/g)).toHaveLength(1);expect(html.match(/>Clerk<\/span>/g)).toHaveLength(1);expect(html.match(/>Clinic orderly<\/span>/g)).toHaveLength(1);expect(html.match(/>Dr\. Pell<\/span>/g)).toHaveLength(1);
});
it('all locations use unique current identities, including named NPCs and warden/guard aliases',()=>{
 for(const room of Object.values(rooms)){const g=createGame();g.room=room.id;if(room.enemy)g.encounter=enemyFor(room.id);const people=roomCharacters(g),names=people.map(p=>p.name.toLowerCase());expect(new Set(names).size,room.id).toBe(names.length);expect(people.filter(p=>p.kind==='enemy').map(p=>p.name)).toEqual(g.encounter?[g.encounter.name]:[]);expect(names).not.toContain('technician');expect(names).not.toContain('postkeeper');if(room.npc==='warden')expect(names.filter(n=>n===room.guard.split(' — ')[0].toLowerCase())).toHaveLength(1);}
 const g=createGame();g.room='sewer-0';expect(roomCharacters(g).map(p=>p.name)).toEqual(['Drainwatch Hal']);g.room='steps';expect(roomCharacters(g)).toEqual([]);g.room='bellwether-0';expect(roomCharacters(g).map(p=>p.name)).toEqual(['Lantern watch','Ripper Voss']);
});
it('visitors join and leave the same roster, with no duplicate entry during combat',()=>{
 const g=createGame(),visitor=visitors.courier;expect(roomCharacters(g,visitor).filter(p=>p.kind==='visitor')).toEqual([{name:visitor.name,kind:'visitor',tone:'neutral'}]);expect(roomCharacters(g).some(p=>p.name===visitor.name)).toBe(false);
 g.room='alley';g.encounter=enemyFor('alley');expect(roomCharacters(g,visitors.ferret)).toEqual([{name:'scrap weasel',kind:'enemy',tone:'enemy'}]);g.encounter=null;expect(roomCharacters(g)).toEqual([]);
 g.room='clinic';expect(roomCharacters(g,visitors.ferret).some(p=>p.kind==='visitor')).toBe(false);
});
it('alarmed or defeated watch is not listed again as a friendly refuge guard',()=>{
 const g=createGame();g.room='yard';expect(roomCharacters(g).map(p=>p.name)).toContain('Freight watch');g.rewards.push(alarmFlag('yard-watch-gun'));g.encounter=theftEnemyFor('yard-watch-gun');expect(roomCharacters(g).map(p=>p.name)).not.toContain('Freight watch');expect(roomCharacters(g).filter(p=>p.kind==='enemy').map(p=>p.name)).toEqual(['harbor gunner']);g.encounter=null;g.rewards.push(subduedFlag('yard-watch-gun'));expect(roomCharacters(g).map(p=>p.name)).not.toContain('Freight watch');
});
