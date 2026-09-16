import {it,expect} from 'vitest';
import {createGame,command,enemyFor} from '../src/engine';
import {attackVerb,weaponChance,weaponDamage,responseRange} from '../src/combat';
import {reconcilePack} from '../src/backpack';
import {rooms} from '../src/world';
function fight(enemy='scrap weasel'){const room=Object.values(rooms).find(r=>r.enemy===enemy)!;const g=createGame();g.room=g.previous=room.id;g.discovered.push(room.id);g.encounter=enemyFor(room.id);return g}
it('inspect is free, works by enemy name, exposes current weapon math and identifies immediate lethal danger',()=>{
 const g=fight();g.player.hp=1;g.encounter!.phase=2;const snapshot=structuredClone(g);const r=command(g,'inspect scrap weasel');expect(r.state).toBe(g);expect(r.changed).toBe(false);expect(g).toEqual(snapshot);expect(r.messages.join(' ')).toContain('Lethal next response');expect(r.messages.join(' ')).toContain(weaponChance(g.player)+'% hit');expect(r.messages.join(' ')).toContain('brace');expect(command(g,'inspect target').messages).toEqual(r.messages);
});
it('fire and shoot use the firearm attack exactly; mismatched verbs neither consume a turn nor roll RNG',()=>{
 const g=fight();for(const verb of ['fire','shoot','fire at scrap weasel'])expect(command(g,verb)).toEqual(command(g,'attack'));
 g.player.weapon='knife';g.player.inventory.knife=1;reconcilePack(g.player);expect(command(g,'fire').state).toBe(g);expect(command(g,'slash')).toEqual(command(g,'attack'));expect(attackVerb('knife')).toBe('slash');expect(attackVerb('pry bar')).toBe('strike');expect(attackVerb('stun baton')).toBe('shock');
});
it('forecast damage bounds match observed hits over many seeds, including armor, exposure and injuries',()=>{
 for(const weapon of ['battered handgun','knife','stun baton'])for(let seed=1;seed<70;seed++){
  const g=fight();g.rng=seed*99991;g.player.weapon=weapon;g.player.inventory[weapon]=1;g.player.body.ailments=['brain damage'];g.player.body.implants['targeting optic']=1;g.exposed=2;g.exposeTurns=2;const low=weaponDamage(g.player,g.encounter!,g.exposed,0),high=weaponDamage(g.player,g.encounter!,g.exposed,3);const r=command(g,'attack'),hit=r.messages.find(m=>m.startsWith('HIT / You '));if(hit){const damage=Number(hit.match(/for (\d+) damage/)![1]);expect(damage).toBeGreaterThanOrEqual(low);expect(damage).toBeLessThanOrEqual(high)}
 }
});
it('response forecast matches all phases of standard, marksman and brute, including guarded hits',()=>{
 for(const enemy of ['scrap weasel','alley marksman','tread brute'])for(let phase=0;phase<4;phase++)for(const action of ['dance','brace','cover']){
  const g=fight(enemy);g.encounter!.phase=phase;const range=responseRange(g,action==='brace',action==='cover');const r=command(g,action),hit=r.messages.find(m=>/^(HIT|SPIKE) \/ .* deals \d+ HP/.test(m));if(hit){const damage=Number(hit.match(/deals (\d+) HP/)![1]);expect(damage).toBeGreaterThanOrEqual(range[0]);expect(damage).toBeLessThanOrEqual(range[1])}else if(!r.messages.some(m=>m.startsWith('MISS')))expect(range).toEqual([0,0]);
 }
});
