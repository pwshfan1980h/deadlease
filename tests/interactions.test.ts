import {it,expect} from 'vitest';
import {createGame,command,enemyFor,rollFishingGear,stock} from '../src/engine';
import {normalizeCommand} from '../src/verbs';
import {fishingKit,fish,fishingSpots,catchAt} from '../src/fishing';
import {challengeFor,timingHit,targetWindow,morseSymbol,puzzleFlag} from '../src/challenges';
import {reconcilePack,footprints,unpacked} from '../src/backpack';
import {encode,decode} from '../src/saves';
import {items} from '../src/items';
function prepared(room='sewer-0'){const g=createGame();g.room=g.previous=room;g.discovered=[...new Set(['clinic',room])];Object.assign(g.player.inventory,{[fishingKit]:1,'fishing bait':4,'lock tools':1,'expedition frame':1});g.player.pack.bag='expedition frame';reconcilePack(g.player);return g}
it('broad playful verbs and physical targets have harmless authored responses outside combat',()=>{
 const g=createGame(),before=encode(g);
 for(const text of ['dance','dance again','do a little dance','sing','hum','whistle','laugh','cry','smile','shrug','nod','wave','bow','salute','clap','stretch','jump','hop','spin','sit','stand','kneel','crouch','yell','curse','wait','listen','smell','punch wall','hit the wall','kick floor','touch wall','lick wall','hug wall','examine the bed','search window']){const result=command(g,text);expect(result.flavor,text).toBeTruthy();expect(result.changed,text).toBe(false);expect(encode(result.state)).toBe(before)}
 expect(command(g,'dance').flavor?.again).toBe('You dance again.');expect(command(g,'punch wall').messages[0]).toContain('fisticuffs');
 for(const text of ['dance and steal gun','can I steal gun','give me 999 credits','fish nonsense','punch unicorn'])expect(command(g,text).changed).toBe(false);
 expect(normalizeCommand('  Pick UP the kit! ')).toBe('take the kit');expect(normalizeCommand('go fishing')).toBe('fish');
});
it('a combat emote spends a turn and faces the enemy, while observing stays free',()=>{
 const g=prepared('alley');g.encounter=enemyFor('alley');g.encounter.phase=2;const before=encode(g);expect(command(g,'listen').changed).toBe(false);expect(encode(g)).toBe(before);
 const result=command(g,'dance');expect(result.changed).toBe(true);expect(result.state.turns).toBe(g.turns+1);expect(result.state.player.hp).toBeLessThan(g.player.hp);expect(decode(encode(result.state))).toEqual(result.state);
});
it('fishing requires a packed one-cell kit, accessible water, catch capacity, and a real timing result',()=>{
 expect(footprints[fishingKit]).toEqual([1,1,1]);expect(stock(createGame())).toContain(fishingKit);expect(stock(createGame())).toContain('fishing bait');expect(stock(createGame())).toContain('lock tools');
 const g=prepared(),before=encode(g),pending=command(g,'fish');expect(pending.challenge?.kind).toBe('fishing');expect(pending.changed).toBe(false);expect(encode(g)).toBe(before);expect(command(g,'fish',{timing:'skill'}).changed).toBe(false);
 const missing=structuredClone(g);delete missing.player.inventory[fishingKit];reconcilePack(missing.player);expect(command(missing,'fish').challenge).toBeUndefined();
 const loose=structuredClone(g);delete loose.player.pack.layout[fishingKit+':0'];expect(command(loose,'fish').challenge).toBeUndefined();
 const dry=prepared('clinic');expect(command(dry,'fish').challenge).toBeUndefined();const full=structuredClone(g);full.player.inventory.salvage=1000;reconcilePack(full.player);expect(command(full,'fish').challenge).toBeUndefined();
});
it('all fourteen catches are reachable across three weighted sites, fit their art cells and save correctly',()=>{
 const reachable=new Set<string>();for(const spot of fishingSpots){for(let n=0;n<1000;n++)reachable.add(catchAt(spot,n/1000));const g=prepared(spot.room),result=command(g,'fish',{timing:'success'});expect(result.changed).toBe(true);expect(result.discovery?.item).toBeTruthy();expect(result.state.turns).toBe(g.turns+1);expect(result.state.player.inventory['fishing bait']).toBe(3);expect(unpacked(result.state.player)).toEqual([]);expect(decode(encode(result.state))).toEqual(result.state)}
 expect(reachable.size).toBe(14);expect(fish).toHaveLength(14);expect(new Set(fish.map(f=>f.art)).size).toBe(14);for(const f of fish){expect(reachable.has(f.id)).toBe(true);expect(items[f.id]).toBeTruthy();expect(footprints[f.id].slice(0,2)).toEqual([f.width,f.height])}
});
it('misses and cancellation use one cast without a catch; a lure works without consumable bait',()=>{
 const g=prepared();for(const timing of ['miss','cancel'] as const){const r=command(g,'fish',{timing});expect(r.state.turns).toBe(g.turns+1);expect(r.state.player.inventory['fishing bait']).toBe(3);expect(r.discovery).toBeUndefined();expect(r.state.rewards).toEqual(g.rewards);expect(decode(encode(r.state))).toEqual(r.state)}
 delete g.player.inventory['fishing bait'];reconcilePack(g.player);expect(command(g,'fish',{timing:'success'}).discovery).toBeTruthy();
});
it('three-pin locks and Morse terminals pay only once, survive reload, and leave rewards after failure',()=>{
 let g=prepared('shallows-0');expect(command(g,'open box').changed).toBe(false);expect(command(g,'pick lock').challenge?.stages).toBe(3);const missed=command(g,'pick lock',{timing:'miss'}).state;expect(missed.rewards).not.toContain(puzzleFlag('lamplight-tackle'));g=command(missed,'pick lock',{timing:'success'}).state;expect(g.player.inventory[fishingKit]).toBe(2);g=decode(encode(g));expect(command(g,'pick lock',{timing:'success'}).changed).toBe(false);
 g=prepared('relay');expect(command(g,'hack terminal').challenge?.pattern).toBe('.-..');const money=g.player.credits;g=command(g,'hack terminal',{timing:'success'}).state;expect(g.player.credits).toBe(money+30);expect(command(decode(encode(g)),'hack terminal',{timing:'success'}).changed).toBe(false);
});
it('special timing adds only damage, spends the usual cost/cooldown/turn, and misses retain the normal attack',()=>{
 const g=prepared('alley');g.encounter=enemyFor('alley');g.encounter.phase=3;const pending=command(g,'use riot stance',{interactive:true});expect(pending.challenge?.kind).toBe('strike');expect(pending.state).toBe(g);
 const normal=command(g,'use riot stance'),miss=command(g,'use riot stance',{timing:'miss'}),critical=command(g,'use riot stance',{timing:'success'});expect(miss.state).toEqual(normal.state);expect(critical.state.encounter!.hp).toBe(normal.state.encounter!.hp-3);expect(critical.state.shield).toBe(normal.state.shield);expect(critical.state.player.stamina).toBe(normal.state.player.stamina);expect(critical.state.cooldowns).toEqual(normal.state.cooldowns);expect(critical.state.turns).toBe(normal.state.turns);expect(decode(encode(critical.state))).toEqual(critical.state);
});
it('timing windows and Morse distinguish valid presses, edges, gaps and wrong lengths',()=>{
 const c=challengeFor(prepared(),'fish','');if(!c||typeof c==='string')throw Error();const w=targetWindow(c,0);expect(timingHit(c,0,(w.start+w.end)/2*c.period)).toBe(true);expect(timingHit(c,0,0)).toBe(false);
 expect([79,80,300,301,349,350,900,901].map(morseSymbol)).toEqual([null,'.','.',null,null,'-','-',null]);
});
it('fish can be eaten or sold; equipment drops supplement rather than replace class weapons',()=>{
 let g=prepared('clinic');g.player.inventory['silver sprat']=2;g.player.hp-=12;reconcilePack(g.player);g=command(g,'eat silver sprat').state;expect(g.player.inventory['silver sprat']).toBe(1);expect(g.player.hp).toBe(44);const credits=g.player.credits;g=command(g,'sell silver sprat').state;expect(g.player.credits).toBeGreaterThan(credits);expect(g.player.inventory['silver sprat']).toBeUndefined();expect(decode(encode(g))).toEqual(g);
 const found=new Set<string>();for(let n=1;n<100000;n+=733){const sample=prepared();sample.rng=n;rollFishingGear(sample,[]);for(const id of [fishingKit,'fishing bait'])if(sample.loot[sample.room][id])found.add(id)}expect([...found].sort()).toEqual(['fishing bait',fishingKit].sort());
});
it('puzzle and catch flags cannot claim undiscovered locations or nonexistent fish',()=>{
 for(const flag of ['puzzle:relay-terminal','fish:lastlight sturgeon','fish:imaginary whale']){const g=createGame();g.rewards.push(flag);expect(()=>decode(JSON.stringify(g))).toThrow()}
});
