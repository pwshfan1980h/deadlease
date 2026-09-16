import {it,expect} from 'vitest';
import {classes,abilities,origins,createPlayer,gainXP,learn,maxHP,maxStamina,xpForLevel} from '../src/progression';
it('creates all 30 origin/class combinations with bounded resources and distinct packages',()=>{
 expect(Object.keys(classes)).toHaveLength(10);expect(origins).toHaveLength(3);
 for(const cls of Object.keys(classes)) for(const origin of origins){const p=createPlayer('Mara',origin,cls,'Tech');expect(p.hp).toBe(maxHP(p));expect(p.stamina).toBe(maxStamina(p));expect(p.inventory[p.weapon]).toBe(1);expect(p.abilities).toHaveLength(1);}
 expect(()=>createPlayer('<script>','Baseline','Enforcer','Tech')).toThrow();
});
it('offers 40 meaningful class abilities across levels 1, 3, 6 and 10',()=>{
 expect(Object.keys(abilities)).toHaveLength(40);
 for(const [cls,c] of Object.entries(classes)){
  expect(c.abilities.map(id=>abilities[id].level)).toEqual([1,3,6,10]);
  const p=createPlayer('Mara','Baseline',cls,'Tech');expect(learn(p,c.abilities[3])).toBe(false);
  gainXP(p,xpForLevel(10));expect(p.level).toBe(10);expect(p.points).toBe(9);
  for(const id of c.abilities.slice(1)){expect(learn(p,id)).toBe(true);expect(learn(p,id)).toBe(false);expect(abilities[id].description.length).toBeGreaterThan(30);expect(abilities[id].effects.length).toBeGreaterThan(0);}
  const other=Object.values(classes).find(x=>x!==c)!;expect(learn(p,other.abilities[1])).toBe(false);
  gainXP(p,999999);expect(p.level).toBe(10);expect(p.points).toBe(6);
 }
});
it('levels at exact thresholds and refuses negative XP',()=>{
 const p=createPlayer('Mara','Baseline','Enforcer','Tech');gainXP(p,xpForLevel(2)-1);expect(p.level).toBe(1);gainXP(p,1);expect(p.level).toBe(2);expect(p.hp).toBe(maxHP(p));expect(()=>gainXP(p,-1)).toThrow();
});
