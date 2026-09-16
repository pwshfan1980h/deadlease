import {it,expect} from 'vitest';
import {createGame,command,enterEncounter,incomingDamage,intent} from '../src/engine';
import {abilities,classes,gainXP,learn,maxHP,maxStamina} from '../src/progression';
import {BALANCE as B} from '../src/config';
function fight(cls='Enforcer',room='alley'){const g=createGame('Mara','Baseline',cls);g.previous='steps';g.room=room;g.discovered.push(room);enterEncounter(g);return g}
it('moving starts an encounter without a free attack; inspection and invalid actions cost nothing',()=>{
 let g=createGame();g=command(g,'s').state;const hp=g.player.hp;g=command(g,'s').state;expect(g.encounter).not.toBeNull();expect(g.player.hp).toBe(hp);
 for(const cmd of ['help','look','inspect target','inventory','skills','journal','stats','n','rest','attack nobody','equip nonexistent','use void contract','brace nonsense']){const r=command(g,cmd);expect(r.changed).toBe(false);expect(r.state).toEqual(g)}
});
it('seeded actions reproduce state exactly, attacks advance one turn, damage never goes negative',()=>{
 const a=fight(),b=fight();expect(command(a,'attack')).toEqual(command(b,'attack'));expect(command(a,'attack').state.turns).toBe(a.turns+1);
 expect(incomingDamage(10,100,0,false,false,0)).toBe(1);
});
it('spikes are telegraphed and brace, cover, insulation and interrupts mitigate them',()=>{
 let g=fight('Enforcer','crown-2');g.encounter!.phase=2;g.player.hp=maxHP(g.player);expect(intent(g.encounter!)).toMatch(/HEAVY STRIKE/);
 const exposed=command(g,'attack').state.player.debt;
 const braced=command(g,'brace').state;expect(braced.player.debt).toBeLessThanOrEqual(exposed);
 expect(incomingDamage(60,0,0,true,false,0)).toBeLessThan(incomingDamage(60,0,0,false,false,0));
 expect(incomingDamage(60,0,0,false,true,0)).toBeLessThan(incomingDamage(60,0,0,false,false,0));
 expect(incomingDamage(60,0,0,false,false,12)).toBe(48);
 const w=fight('Wirewright');w.encounter!.phase=2;const r=command(w,'use short circuit');expect(r.state.player.hp).toBe(w.player.hp);expect(r.state.encounter!.phase).toBe(3);
});
it('death ends the run and preserves a non-playable record',()=>{
 const g=fight('Enforcer','crown-2');g.player.hp=1;g.encounter!.phase=2;const r=command(g,'attack').state;
 expect(r.room).toBe(g.room);expect(r.run.status).toBe('dead');expect(r.player.debt).toBe(0);expect(r.player.inventory).toEqual(g.player.inventory);expect(r.player.hp).toBe(0);expect(r.encounter).toBeNull();
});
it('flee returns to the adjacent previous room and clears temporary effects',()=>{
 const g=fight();const r=command(g,'flee');expect(r.changed).toBe(true);expect(r.state.room).toBe('steps');expect(r.state.encounter).toBeNull();expect(r.state.shield).toBe(0);
});
it('all 40 abilities have a real bounded effect, cost stamina, and enforce cooldowns',()=>{
 for(const [cls,c] of Object.entries(classes))for(const id of c.abilities){
  const g=fight(cls,'crown-2');gainXP(g.player,2700);c.abilities.slice(1).forEach(a=>learn(g.player,a));g.player.hp=40;g.player.radiation=80;g.encounter!.hp=500;g.encounter!.maxHP=500;
  const r=command(g,'use '+id);expect(r.changed,id).toBe(true);expect(r.state).not.toEqual(g);expect(r.state.cooldowns[id]).toBeGreaterThan(r.state.turns);expect(r.state.player.hp).toBeLessThanOrEqual(maxHP(g.player));expect(r.state.player.stamina).toBeLessThanOrEqual(maxStamina(g.player));expect(command(r.state,'use '+id).changed,id).toBe(false);
  const empty=structuredClone(g);empty.player.stamina=0;expect(command(empty,'use '+id).changed,id).toBe(false);expect(abilities[id].cost).toBeGreaterThan(0);
 }
});
it('repeatable grounds reset only after the configured cooldown, ordinary enemies stay defeated',()=>{
 for(const room of ['alley','crown-2']){const g=fight('Enforcer',room);g.encounter!.hp=1;g.player.skills.Firearms=5;g.rng=1;let r=command(g,'aim').state;if(r.encounter)r=command(r,'attack').state;expect(r.encounter).toBeNull();expect(r.defeated[room]).toBeDefined();enterEncounter(r);expect(r.encounter).toBeNull();r.turns+=B.respawnTurns;enterEncounter(r);expect(!!r.encounter).toBe(room!=='alley');}
});
it('review regression: every ability applies each declared effect, with honest fixed damage and telegraphs',()=>{
 for(const [cls,c] of Object.entries(classes))for(const id of c.abilities){const g=fight(cls,'crown-2');gainXP(g.player,2700);c.abilities.slice(1).forEach(a=>learn(g.player,a));g.player.hp=1;g.player.radiation=80;g.player.stamina=20;g.encounter!.hp=500;g.encounter!.maxHP=500;g.encounter!.phase=3;
 const a=abilities[id],r=command(g,'use '+id).state;let expectedHP=1,expectedEnemy=500,expectedShield=0,expectedStamina=20-a.cost,expectedRadiation=80,expose=0;
 for(const effect of a.effects){switch(effect.kind){case 'damage':expectedEnemy-=Math.max(1,effect.power-Math.max(0,g.encounter!.armor-expose));break;case 'leech':{const n=Math.max(1,effect.power-Math.max(0,g.encounter!.armor-expose));expectedEnemy-=n;expectedHP+=n;break}case 'heal':expectedHP+=effect.power;break;case 'shield':expectedShield+=effect.power;break;case 'cleanse':expectedRadiation=Math.max(0,expectedRadiation-effect.power);break;case 'stamina':expectedStamina+=effect.power;break;case 'expose':expose=effect.power;break;case 'interrupt':expect(r.encounter!.phase).toBe(3);break;}}
 expect(r.encounter!.hp,id).toBe(expectedEnemy);expect(r.player.hp,id).toBe(Math.min(maxHP(g.player),expectedHP));expect(r.shield,id).toBe(expectedShield);expect(r.player.radiation,id).toBe(expectedRadiation);expect(r.player.stamina,id).toBe(Math.min(maxStamina(g.player),expectedStamina));expect(r.exposed,id).toBe(expose);
 }
 const g=fight('Enforcer','crown-2');g.encounter!.phase=2;expect(intent(g.encounter!)).toContain(`${g.encounter!.damage*B.spikeMultiplier}–${g.encounter!.damage*B.spikeMultiplier+B.enemyVariance-1}`);
});
it('every cover ability reduces a charged response; unreadable/invalid commands preserve RNG and radiation',()=>{
 for(const [cls,c] of Object.entries(classes))for(const id of c.abilities.filter(id=>abilities[id].effects.some(e=>e.kind==='cover'))){
  const g=fight(cls,'crown-2');gainXP(g.player,2700);c.abilities.slice(1).forEach(a=>learn(g.player,a));g.encounter!.hp=500;g.encounter!.maxHP=500;g.encounter!.phase=2;
  const raw=command(g,'attack').state,covered=command(g,'use '+id).state;expect(covered.player.hp,id).toBeGreaterThan(raw.player.hp);expect(covered.player.debt).toBe(0);
 }
 const g=fight('Enforcer','sump');g.player.stamina=0;for(const cmd of ['aim','inspect target','help','heal nonexistent','north','buy knife']){const r=command(g,cmd);expect(r.changed).toBe(false);expect(r.state.rng).toBe(g.rng);expect(r.state.player.radiation).toBe(g.player.radiation)}
});
