import {it,expect} from 'vitest';
import {createGame,command,enemyFor} from '../src/engine';
import {gainXP,maxHP,maxStamina} from '../src/progression';
import {resolveLethal} from '../src/runs';
import {reconstructAtClinic,recoveryFee} from '../src/reconstruction';
import {decode,encode,SaveRepository,type StorageDriver,type WriteDecision} from '../src/saves';
import {reconcilePack} from '../src/backpack';
import {treatmentCost} from '../src/medicine';
function dead(){let g=command(createGame(),'accept freight-return').state;gainXP(g.player,180);g.player.body.implants['dermal weave']=2;g.player.body.commission='done';g.player.credits=101;g.player.radiation=83;g.room=g.previous='alley';g.discovered.push('alley');g.encounter=enemyFor(g.room);g.player.inventory['medical supplies']=12;reconcilePack(g.player);resolveLethal(g,'scrap weasel',[]);return g}
it('reconstructs the same character with map, quests, parcel, gear layout, implants, levels and clinic trust intact',()=>{
 const source=dead(),snapshot=encode(source),{state:g,messages}=reconstructAtClinic(source,'recovered');
 expect(encode(source)).toBe(snapshot);expect(g.run.status).toBe('alive');expect(g.run.recoveries).toBe(1);expect(g.run.seed).toBe(source.run.seed);expect(g.run.revivals).toBe(0);expect(g.run.kills).toBe(source.run.kills);
 for(const key of ['discovered','quests','rewards','courier','loot','defeated','scrounged','rng','turns'] as const)expect(g[key]).toEqual(source[key]);
 for(const key of ['name','inventory','pack','body','level','xp','points','skills','abilities','weapon','armor'] as const){if(key==='body')continue;expect(g.player[key]).toEqual(source.player[key])}
 expect(g.player.body.implants).toEqual(source.player.body.implants);expect(g.player.body.commission).toBe('done');expect(g.player.body.ailments).toEqual(['torn ligaments']);expect(g.player.credits).toBe(85);expect(g.player.hp).toBe(maxHP(g.player));expect(g.player.stamina).toBe(maxStamina(g.player));expect(g.player.radiation).toBe(0);expect(g.room).toBe('clinic');expect(g.previous).toBe('clinic');expect(g.encounter).toBeNull();expect(messages.join(' ')).toContain('repair bench');expect(decode(encode(g))).toEqual(g);
});
it('being broke never blocks recovery; repeated injuries do not stack or erase existing conditions',()=>{
 let g=dead();g.player.credits=0;g.player.body.commission='none';
 for(let n=1;n<=8;n++){g=reconstructAtClinic(g,'life-'+n).state;expect(g.run.recoveries).toBe(n);expect(g.player.credits).toBe(0);expect(g.player.body.ailments.length).toBe(Math.min(n,6));expect(g.player.body.commission).toBe('none');expect(()=>encode(g)).not.toThrow();resolveLethal(g,'test',[])}
 expect(recoveryFee(g)).toBe(0);expect(()=>reconstructAtClinic(createGame())).toThrow();
});
it('Pell recognizes recovered patients and earned help; treatment discount is earned, not gained by dying',()=>{
 let g=reconstructAtClinic(dead()).state;expect(command(g,'talk doctor').messages.join(' ')).toContain('thanks to you');expect(treatmentCost(g.player,'torn ligaments',true)).toBe(36);expect(treatmentCost(g.player,'torn ligaments',false)).toBe(60);
 const treated=command(g,'treat torn ligaments').state;expect(treated.player.credits).toBe(g.player.credits-36);expect(treated.player.body.ailments).toEqual([]);
 g.player.body.commission='none';expect(command(g,'talk doctor').messages.join(' ')).toContain('repair holding');g.run.recoveries=3;expect(command(g,'talk doctor').messages.join(' ')).toContain('know your scars');expect(treatmentCost(g.player,'torn ligaments',true)).toBe(45);
});
it('v5 living and dead saves migrate without losing state, while malformed recovery counts are rejected',()=>{
 for(const original of [createGame(),dead()]){const old:any=structuredClone(original);old.version=5;delete old.run.recoveries;const migrated=decode(JSON.stringify(old));expect(migrated).toEqual({...original,version:6});}
 for(const value of [-1,1.5,'1',10000001]){const g:any=createGame();g.run.recoveries=value;expect(()=>encode(g)).toThrow()}
});
class Memory implements StorageDriver {
 slots=new Map<string,string>();fail=false;
 async read(k:string){return this.slots.get(k)}
 async update(k:string,f:(old:string|undefined)=>WriteDecision){const d=f(this.slots.get(k));if(this.fail)throw Error('storage full');if(d.error)throw Error(d.error);if(d.reconstruction&&this.slots.has('reconstructed:'+d.reconstruction))throw Error('already happened');if(d.value){this.slots.set(k,d.value);if(d.reconstruction)this.slots.set('reconstructed:'+d.reconstruction,d.value)}}
 async backups(){return []}
}
it('recovery commits once, rejects stale branches, and retries an aborted write without a second charge',async()=>{
 const d=new Memory(),a=new SaveRepository(d),b=new SaveRepository(d),g=dead();await a.save('auto',g);await b.load('auto');d.fail=true;await expect(a.reconstruct(g)).rejects.toThrow('storage full');expect(decode((await d.read('auto'))!)).toEqual(g);d.fail=false;
 const recovered=await a.reconstruct(g);expect((await a.load('auto')).player.credits).toBe(85);await expect(b.reconstruct(g)).rejects.toThrow('record changed');expect(await b.load('auto')).toEqual(recovered.state);
 await expect(a.recover('auto',g)).rejects.toThrow('already happened');expect(await a.load('auto')).toEqual(recovered.state);
});
