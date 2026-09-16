import {it,expect} from 'vitest';
import {createGame,command,enemyFor} from '../src/engine';
import {ailments,implants,newBody,accuracyModifier,injury} from '../src/medicine';
import {maxHP,maxStamina,gainXP,xpForLevel} from '../src/progression';
import {reconcilePack} from '../src/backpack';
import {rooms} from '../src/world';
import {enemyDefinition} from '../src/enemies';
import {encode,decode} from '../src/saves';
it('v4 migrates additively while strict body validation rejects corrupt medical state',()=>{
 const old:any=createGame();old.version=4;delete old.player.body;const raw=JSON.stringify(old),g=decode(raw);expect(g.version).toBe(5);expect(g.player.body).toEqual(newBody());expect(JSON.stringify(old)).toBe(raw);expect(g.run).toEqual(old.run);
 for(const edit of [(b:any)=>b.ailments=['imaginary'],(b:any)=>b.ailments=['brain damage','brain damage'],(b:any)=>b.implants={'dermal weave':4},(b:any)=>b.implants={'bad':1},(b:any)=>b.voucher=true,(b:any)=>b.commission='paid']){const bad=createGame();edit(bad.player.body);expect(()=>encode(bad)).toThrow()}
});
it('injuries persist through rest, healing, leveling and reload; new patients start clean',()=>{
 let g=createGame();injury(g.player,'brain damage',[]);injury(g.player,'infected wound',[]);g.player.hp=20;
 g=command(g,'heal').state;expect(g.player.hp).toBe(30);g=command(g,'rest').state;gainXP(g.player,60);
 expect(decode(encode(g)).player.body.ailments).toEqual(['brain damage','infected wound']);expect(accuracyModifier(g.player)).toBe(-12);expect(createGame().player.body).toEqual(newBody());
});
it('doctors charge once, support individual treatment, and reject poor or wrong-room patients without mutation',()=>{
 let g=createGame();g.player.body.ailments=['brain damage','torn ligaments'];g.player.stamina=maxStamina(g.player);g.player.credits=74;
 expect(command(g,'treat brain damage').state).toBe(g);g.player.credits=120;g=command(g,'treat brain damage').state;expect(g.player.credits).toBe(45);expect(g.player.body.ailments).toEqual(['torn ligaments']);g=command(g,'treat all').state;expect(g.player.credits).toBe(0);expect(g.player.body.ailments).toEqual([]);expect(command(g,'treat').changed).toBe(false);expect(()=>encode(g)).not.toThrow();
 g.room=g.previous='steps';g.discovered.push('steps');expect(command(g,'upgrade dermal weave').state).toBe(g);
});
it('credits buy three meaningful ranks without altering the leveling budget',()=>{
 let g=createGame();g.player.credits=3000;const hp=maxHP(g.player),stamina=maxStamina(g.player);
 for(const id of Object.keys(implants))for(let n=1;n<=3;n++){g=command(g,'upgrade '+id).state;expect(g.player.body.implants[id as keyof typeof implants]).toBe(n);expect(()=>encode(g)).not.toThrow()}
 expect(maxHP(g.player)).toBe(hp+36);expect(maxStamina(g.player)).toBe(stamina+18);expect(accuracyModifier(g.player)).toBe(18);expect(g.player.level).toBe(1);expect(g.player.points).toBe(0);expect(command(g,'upgrade dermal weave').state).toBe(g);
});
it('a real salvage commission consumes goods once and awards exactly one free rank',()=>{
 let g=createGame();g=command(g,'accept spare parts').state;expect(command(g,'report spare parts').changed).toBe(false);g.player.inventory.salvage=6;reconcilePack(g.player);
 g=command(g,'report spare parts').state;expect(g.player.inventory.salvage).toBe(3);expect(g.player.body.voucher).toBe(true);expect(()=>encode(g)).not.toThrow();expect(command(g,'report spare parts').changed).toBe(false);
 const credits=g.player.credits;g=command(decode(encode(g)),'upgrade targeting optic').state;expect(g.player.credits).toBe(credits);expect(g.player.body.voucher).toBe(false);expect(command(g,'upgrade targeting optic').changed).toBe(false);
});
it('heavy attacks from multiple enemy families inflict lasting conditions; guarding prevents them',()=>{
 const outcomes=new Set<string>();
 for(const kind of ['blunt','electric','claw','blade','fire']){
  const room=Object.values(rooms).find(r=>r.enemy&&!r.safe&&enemyDefinition(r.enemy).kind===kind&&r.level>=3);expect(room).toBeTruthy();
  const g=createGame();g.room=g.previous=room!.id;g.discovered.push(g.room);g.encounter=enemyFor(g.room);g.encounter.phase=2;gainXP(g.player,xpForLevel(room!.level));g.player.hp=maxHP(g.player);
  // Tune HP to survive this real template while crossing the severe-hit threshold.
  const hit=command(g,'dance');for(const id of hit.state.player.body.ailments)outcomes.add(id);expect(command(g,'brace').state.player.body.ailments).toEqual([]);
 }
 expect(outcomes.size).toBeGreaterThanOrEqual(3);
});
it('all ailment effects remain bounded and curable; radiation exposure can become lasting sickness',()=>{
 let g=createGame();g.player.body.ailments=Object.keys(ailments) as (keyof typeof ailments)[];g.player.hp=maxHP(g.player);g.player.stamina=maxStamina(g.player);expect(()=>encode(g)).not.toThrow();expect(maxHP(g.player)).toBeGreaterThan(0);expect(maxStamina(g.player)).toBeGreaterThan(0);g.player.credits=1000;g=command(g,'treat').state;expect(g.player.body.ailments).toEqual([]);
 const wet=Object.values(rooms).find(r=>r.radiation>0)!;g.room=g.previous=wet.id;g.discovered.push(wet.id);g.encounter=enemyFor(wet.id);g.player.radiation=74;g=command(g,'brace').state;expect(g.player.body.ailments).toContain('radiation sickness');expect(()=>encode(g)).not.toThrow();
});
it('Bellwether ripper treats and upgrades, capped upgrades preserve vouchers, combat blocks surgery',()=>{
 let g=createGame();g.room=g.previous='bellwether-0';g.discovered.push(g.room);g.player.body.ailments=['brain damage'];g.player.credits=90;
 expect(command(g,'talk ripper').messages[0]).toContain('Ripper Voss');g=command(g,'treat brain damage').state;expect(g.player.credits).toBe(0);expect(g.player.body.ailments).toEqual([]);
 g.player.body.commission='done';g.player.body.voucher=true;g.player.body.implants['dermal weave']=3;expect(command(g,'upgrade dermal weave').state).toBe(g);g=command(g,'upgrade targeting optic').state;expect(g.player.body.voucher).toBe(false);expect(g.player.body.implants['targeting optic']).toBe(1);expect(()=>encode(g)).not.toThrow();
 const fought=createGame();fought.encounter=enemyFor('gate');for(const cmd of ['treat all','upgrade dermal weave','accept spare parts'])expect(command(fought,cmd).state).toBe(fought);
});
it('the higher-level culvert disease occurs in actual combat and survives a revival drone',()=>{
 const room=Object.values(rooms).find(r=>r.enemy==='culvert maw'&&r.level>=3)!;let g=createGame();g.room=g.previous=room.id;g.discovered.push(room.id);g.encounter=enemyFor(room.id);g.encounter.phase=2;gainXP(g.player,xpForLevel(room.level));g=command(g,'dance').state;expect(g.player.body.ailments).toContain('marrow rot');expect(()=>encode(g)).not.toThrow();
 g.player.hp=1;g.player.inventory['stitch drone']=1;reconcilePack(g.player);g.encounter!.phase=2;g=command(g,'brace').state;expect(g.run.revivals).toBe(1);expect(g.player.body.ailments).toContain('marrow rot');expect(()=>encode(g)).not.toThrow();
});
