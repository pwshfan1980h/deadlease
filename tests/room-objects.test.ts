import {it,expect} from 'vitest';
import {createGame,command,look} from '../src/engine';
import {encode,decode} from '../src/saves';
import {objectsHere,objectCommands,roomObjects} from '../src/roomObjects';
import {completions} from '../src/App';
import {rooms} from '../src/world';

it('every courier board is described, has a unique ID, and exposes real local commands',()=>{
 expect(new Set(roomObjects.map(o=>o.id)).size).toBe(roomObjects.length);
 for(const o of roomObjects.filter(object=>object.action==='jobs')){const g=createGame();g.room=o.room;
  expect(rooms[o.room].safe).toBe(true);expect(look(g).join(' ')).toContain(o.description);
  expect(objectCommands(o.room)).toContain(o.hint);expect(completions('read b',g)).toContain('read board');
 }
});
it('natural board aliases resolve to the existing work journal without changing the save',()=>{
 for(const room of ['clinic','yard','bellwether-1']){
  const g=createGame();g.room=g.previous=room;g.discovered=[...new Set(['clinic',room])];const before=encode(g),expected=command(g,'jobs').messages;
  for(const text of ['read board','read jobs board','inspect board','look at board','read notice board','inspect dispatch notice','  READ   BOARD  ']){
   const result=command(g,text);expect(result.changed).toBe(false);expect(result.messages).toEqual(expected);expect(encode(result.state)).toBe(before);
  }
 }
});
it('absent boards give directions, leave the run intact, and do not leak local completion hints',()=>{
 const g=command(createGame(),'s').state,before=encode(g);
 for(const text of ['read board','look at board','inspect board']){const result=command(g,text);expect(result.messages.join(' ')).toContain('There is no jobs board here');expect(encode(result.state)).toBe(before)}
 expect(objectsHere(g.room)).toEqual([]);expect(completions('read b',g)).toEqual([]);expect(command(g,'inspect knife').messages.join(' ')).not.toContain('board');
});
it('a board reflects parcel custody through reload, completed payment, and the next return job',()=>{
 let g=command(createGame(),'accept freight-return').state;g=decode(encode(g));expect(command(g,'read board').messages.join(' ')).toContain('Type deliver parcel there');
 for(const direction of ['e','e','e'])g=command(g,direction).state;
 g=command(g,'deliver parcel').state;const before=encode(g);expect(command(g,'read board').messages.join(' ')).toContain('accept clinic-run');
 expect(command(g,'deliver parcel').changed).toBe(false);expect(encode(g)).toBe(before);expect(g.courier.completed).toBe(1);
});
