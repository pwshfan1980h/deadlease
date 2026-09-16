import {it,expect} from 'vitest';
import {createGame,command} from '../src/engine';
import {gainXP} from '../src/progression';
import {encode,decode,SaveRepository,type StorageDriver,type WriteDecision} from '../src/saves';
class Memory implements StorageDriver {slots=new Map<string,string>();quarantine:string[]=[];async read(k:string){return this.slots.get(k)}async update(k:string,f:(old:string|undefined)=>WriteDecision){const d=f(this.slots.get(k));if(d.quarantine!==undefined)this.quarantine.push(d.quarantine);if(d.value!==undefined)this.slots.set(k,d.value);if(d.error)throw Error(d.error)}async backups(){return this.quarantine.map((raw,i)=>({id:i,slot:'auto',raw,reason:'invalid',at:0}))}}
it('roundtrips complete state and deterministic continuation with a bounded versioned envelope',()=>{
 let g=createGame();for(const c of ['s','s','attack'])g=command(g,c).state;expect(decode(encode(g))).toEqual(g);expect(command(decode(encode(g)),'attack')).toEqual(command(g,'attack'));expect(()=>decode('x'.repeat(1000001))).toThrow();
});
it('strictly rejects corrupt scalar, reference, equipment, progress, quest and enemy fields',()=>{
 const edits:((g:any)=>void)[]=[g=>g.version=99,g=>g.surprise=1,g=>g.player.hp=-1,g=>g.player.hp=true,g=>g.player.hp=9999,g=>g.player.stats.Grit=99,g=>g.player.className='Ghost',g=>g.player.skills.Tech=9,g=>g.player.skills.Fake=1,g=>g.player.weapon='salvage',g=>g.player.armor='armor vest',g=>g.player.inventory['unknown']=1,g=>g.player.inventory.knife=0,g=>g.player.abilities.push('blackout'),g=>g.player.level=10,g=>g.player.points=99,g=>g.room='void',g=>g.previous='void',g=>g.discovered=[],g=>g.discovered.push('clinic'),g=>g.rng=0,g=>g.turns=1.5,g=>g.defeated.clinic=0,g=>g.scrounged.push('clinic'),g=>g.loot.alley.salvage=100001,g=>g.pump='repaired',g=>g.player.inventory['access key']=1,g=>g.quests.fake='done',g=>g.rewards.push('ending'),g=>g.cooldowns.blackout=10,g=>g.shield=5,g=>g.encounter={id:'alley'},g=>g.loot.alley['pump component']=0];
 for(const edit of edits){const g:any=createGame();edit(g);expect(()=>decode(JSON.stringify(g)),edit.toString()).toThrow();}
});
it('refuses arbitrary JSON shapes and does not accept prototype keys',()=>{
 for(const raw of ['null','[]','true','{}','{"__proto__":{"polluted":true}}','{"version":1}'])expect(()=>decode(raw)).toThrow();expect(({} as any).polluted).toBeUndefined();
});
it('quarantines corrupt autosaves, refuses overwrite, recovers explicitly and keeps manual independent',async()=>{
 const driver=new Memory(),repo=new SaveRepository(driver);const g=createGame();await repo.save('manual',g);driver.slots.set('auto','broken');
 await expect(repo.load('auto')).rejects.toThrow();expect(driver.quarantine).toContain('broken');expect(driver.slots.get('auto')).toBe('broken');
 await expect(repo.save('auto',g)).rejects.toThrow();expect(driver.slots.get('auto')).toBe('broken');expect(await repo.load('manual')).toEqual(g);
 await repo.recover('auto',g);expect(await repo.load('auto')).toEqual(g);expect(driver.quarantine).toContain('broken');
});
it('rejects invalid imports before replacing either valid slot',async()=>{
 const driver=new Memory(),repo=new SaveRepository(driver);const g=createGame();await repo.save('auto',g);await expect(repo.import('garbage','auto')).rejects.toThrow();expect(await repo.load('auto')).toEqual(g);
});
it('FINAL-001: rejects an array className when decoding',()=>{
 const g=createGame();gainXP(g.player,180);expect(decode(encode(g))).toEqual(g);
 const raw=JSON.stringify({...g,player:{...g.player,className:[g.player.className]}});
 expect(()=>decode(raw)).toThrow(/Invalid save/);
});
it.each(['auto','manual'])('FINAL-001: rejects an array className import and preserves prior %s slot bytes',async(slot)=>{
 const driver=new Memory(),repo=new SaveRepository(driver);await repo.save(slot,createGame());const prior=await driver.read(slot);
 const g=createGame();gainXP(g.player,180);
 const raw=JSON.stringify({...g,player:{...g.player,className:[g.player.className]}});
 await expect.soft(repo.import(raw,slot)).rejects.toThrow(/Invalid save/);
 expect.soft(await driver.read(slot)).toBe(prior);
 expect(driver.quarantine).toEqual([]);
});
it('review regression: rejects coerced equipment, noncanonical names and omitted hostile encounters',()=>{
 const mutations:((g:any)=>void)[]=[g=>g.player.weapon=['battered handgun'],g=>{g.player.inventory['armor vest']=1;g.player.armor=['armor vest']},g=>g.player.name='\nMara\n',g=>{g.room='alley';g.previous='steps';g.discovered=['clinic','steps','alley']}];
 for(const mutate of mutations){const g:any=createGame();mutate(g);expect(()=>decode(JSON.stringify(g))).toThrow()}
});
it('review regression: every accepted boundary action leaves a serializable state',()=>{
 let g=createGame();g.player.credits=10000000;g=command(g,'s').state;g=command(g,'scrounge').state;expect(()=>encode(g)).not.toThrow();
 g=createGame();g.turns=10000000;const r=command(g,'rest');expect(()=>encode(r.state)).not.toThrow();
});
it('rejects stale tab writes inside the atomic update and retains both recoverable branches',async()=>{
 const driver=new Memory(),a=new SaveRepository(driver),b=new SaveRepository(driver);await a.save('auto',createGame());
 let ga=await a.load('auto');let gb=await b.load('auto');for(const c of ['s','scrounge','n'])ga=command(ga,c).state;
 await a.save('auto',ga);gb=command(gb,'e').state;
 await expect(b.save('auto',gb)).rejects.toThrow(/changed in another session/);
 expect(await a.load('auto')).toEqual(ga);expect(driver.quarantine).toContain(encode(gb));
 await expect(b.save('auto',gb)).rejects.toThrow();
 await b.recover('auto',gb);expect(await b.load('auto')).toEqual(gb);expect(driver.quarantine).toContain(encode(ga));
});
it('does not overwrite an existing slot a fresh repository never observed',async()=>{
 const d=new Memory(),a=new SaveRepository(d);await a.save('manual',createGame());
 await expect(new SaveRepository(d).save('manual',command(createGame(),'s').state)).rejects.toThrow(/changed in another session/);
});
it('explicit valid import backs up replaced bytes, invalid import preserves them',async()=>{
 const d=new Memory(),a=new SaveRepository(d);const g=createGame();await a.save('manual',g);
 const next=command(g,'s').state;await new SaveRepository(d).import(encode(next),'manual');
 expect(d.quarantine).toContain(encode(g));expect(await a.load('manual')).toEqual(next);
});
it('full inventory refuses purchases and ground collection without consuming credits or loot',()=>{
 let g=createGame();g.player.inventory['medical supplies']=100000;
 let r=command(g,'buy medical supplies');expect(r.changed).toBe(false);expect(r.state).toEqual(g);
 g=createGame();for(const c of ['s','s'])g=command(g,c).state;while(g.encounter)g=command(g,'attack').state;expect(g.room).toBe('alley');expect(g.loot.alley.salvage).toBe(2);g.player.inventory.salvage=100000;expect(()=>encode(g)).not.toThrow();
 r=command(g,'take all');expect(r.changed).toBe(false);expect(r.state).toEqual(g);
});
it('inherited inspect keys always return ordinary strings and never advance play',()=>{
 for(const name of ['__proto__','constructor','toString','valueOf']){const g=createGame(),r=command(g,'inspect '+name);expect(r.changed).toBe(false);expect(r.state).toEqual(g);expect(r.messages.every(m=>typeof m==='string')).toBe(true)}
});
it('compares content even when two branches have the same turn and keeps the old expectation after a failed transaction',async()=>{
 const d=new Memory(),a=new SaveRepository(d),b=new SaveRepository(d);await a.save('auto',createGame());const g=await b.load('auto');
 await a.save('auto',command(g,'s').state);await expect(b.save('auto',command(g,'e').state)).rejects.toThrow(/another session/);
 await b.load('auto');const next=command(await a.load('auto'),'n').state;
 const update=d.update.bind(d);d.update=async()=>{throw Error('transaction aborted')};await expect(a.save('auto',next)).rejects.toThrow(/aborted/);d.update=update;
 await a.save('auto',next);expect(await b.load('auto')).toEqual(next);
});
