import {it,expect} from 'vitest';
import {command,createGame,clearEncounter,type Game} from '../src/engine';
import {classes,origins} from '../src/progression';
import {quests} from '../src/quests';
function at(g:Game,room:string){g.room=room;if(!g.discovered.includes(room))g.discovered.push(room);clearEncounter(g);return g}
it('all 30 builds can complete both permanent original pump choices through real commands',()=>{
 for(const cls of Object.keys(classes))for(const origin of origins)for(const ending of ['commons','lease']){
  let g=createGame('Mara',origin,cls);for(const cmd of ['s','e','talk technician','w','s'])g=command(g,cmd).state;
  let n=0;while(g.encounter&&n++<30)g=command(g,g.player.hp<20&&g.player.inventory['medical supplies']?'heal':'attack').state;
  expect(g.encounter).toBeNull();expect(g.room).toBe('alley');g=command(g,'take all').state;at(g,'pump');g=command(g,'install component').state;expect(g.pump).toBe('repaired');expect(g.player.inventory['access key']).toBe(1);
  at(g,'booth');g=command(g,'give key '+ending).state;expect(g.pump).toBe(ending);const before=structuredClone(g);expect(command(g,'give key '+ending).state).toEqual(before);expect(g.player.inventory['access key']).toBeUndefined();
 }
});
it('regional quests have distinct artifacts, recipients, one-time rewards and a final moral choice',()=>{
 expect(Object.keys(quests).length).toBeGreaterThanOrEqual(6);let g=createGame();
 for(const q of Object.values(quests)){at(g,q.giver);g=command(g,'talk '+(q.id==='ledger'?'archivist':'warden')).state;expect(g.quests[q.id]).toBe('accepted');
 at(g,q.location);g=command(g,'take all').state;at(g,q.giver);const cmd=q.id==='ledger'?'resolve disclose':'deliver '+q.item;g=command(g,cmd).state;expect(g.quests[q.id]).toBe(q.id==='ledger'?'disclose':'done');const xp=g.player.xp;expect(command(g,cmd).changed).toBe(false);expect(g.player.xp).toBe(xp);}
});
it('scrounge exhausts locally, shops honor ownership/prices and training spends points once',()=>{
 let g=createGame();at(g,'steps');g=command(g,'scrounge').state;expect(command(g,'scrounge').changed).toBe(false);at(g,'yard');g.player.credits=200;
 g=command(g,'buy armor vest').state;g=command(g,'equip armor vest').state;expect(g.player.armor).toBe('armor vest');expect(command(g,'sell pump component').changed).toBe(false);
 g.player.points=1;g=command(g,'train tech').state;expect(g.player.skills.Tech).toBe(2);expect(g.player.points).toBe(0);expect(command(g,'train tech').changed).toBe(false);
});
it('guarded refuges provide unlimited recovery but no XP; hostile rooms block economic actions',()=>{
 let g=createGame();g.player.hp=1;g.player.radiation=99;const r=command(g,'rest');expect(r.state.player.radiation).toBe(0);expect(r.state.player.xp).toBe(0);
 g=command(command(g,'s').state,'s').state;for(const cmd of ['scrounge','take all','buy medical supplies','train tech','talk warden','install component'])expect(command(g,cmd).changed).toBe(false);
});
