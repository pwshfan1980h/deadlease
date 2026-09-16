import {reconcilePack,type Pack} from './backpack';
import {BALANCE as B,SKILLS,type Skill,type Stat} from './config';
export const origins=['Baseline','Splice','Radborn'] as const;
export type Origin=typeof origins[number];
export type EffectKind='damage'|'heal'|'shield'|'interrupt'|'cleanse'|'stamina'|'expose'|'leech'|'cover';
export interface Effect {kind:EffectKind;power:number}
export interface Ability {id:string;name:string;className:string;level:number;cost:number;cooldown:number;description:string;effects:Effect[]}
export interface ClassDef {description:string;weapon:string;skills:Partial<Record<Skill,number>>;abilities:string[];passive:string}
export interface Player {name:string;origin:Origin;className:string;bonus:Skill;stats:Record<Stat,number>;skills:Record<Skill,number>;inventory:Record<string,number>;pack:Pack;weapon:string;armor:string|null;abilities:string[];hp:number;stamina:number;radiation:number;credits:number;debt:number;xp:number;level:number;points:number}
export const abilities:Record<string,Ability>={};
export const classes:Record<string,ClassDef>={};
type Tier=[string,number,number,string,Effect[]];
const e=(kind:EffectKind,power:number):Effect=>({kind,power});
function cls(name:string,description:string,weapon:string,skills:Partial<Record<Skill,number>>,passive:string,tiers:Tier[]){
 const ids=tiers.map(([title,cost,cooldown,description,effects],i)=>{
  const id=title.toLowerCase();abilities[id]={id,name:title,className:name,level:[1,3,6,10][i],cost,cooldown,description,effects};return id;
 });classes[name]={description,weapon,skills,passive,abilities:ids};
}
cls('Enforcer','Hold the line with shields and deliberate force.','battered handgun',{Firearms:2,Melee:1},'Brace additionally restores 2 stamina.',[
 ['Riot stance',3,2,'Raise a 12-point shield and deal 6 guaranteed damage.',[e('shield',12),e('damage',6)]],
 ['Breach shot',5,3,'Deal 22 damage and expose armor by 3 for three responses.',[e('damage',22),e('expose',3)]],
 ['Hold the line',7,4,'Gain 28 shield and interrupt the current enemy response.',[e('shield',28),e('interrupt',1)]],
 ['Last stand',10,5,'Deal 55 guaranteed damage behind a 20-point shield.',[e('damage',55),e('shield',20)]]
]);
cls('Scavenger','Turn wreckage into stamina, cover, and sharp edges.','pry bar',{Survival:2,Tech:1},'Scrounging yields 4 extra credits.',[
 ['Scrap shield',2,2,'Gain 10 shield and recover 4 stamina from spare cells.',[e('shield',10),e('stamina',4)]],
 ['Shrapnel fan',4,3,'Deal 24 damage and strip 2 armor for three responses.',[e('damage',24),e('expose',2)]],
 ['Jury rig',6,4,'Restore 28 HP and recover 12 stamina without supplies.',[e('heal',28),e('stamina',12)]],
 ['Wrecking blow',9,5,'Deal 48 damage and salvage a 30-point protective shield.',[e('damage',48),e('shield',30)]]
]);
cls('Street Medic','Stay alive with supply-free triage and nerve blocks.','stun baton',{Medicine:2,Influence:1},'Basic heal restores 4 additional HP.',[
 ['Triage',3,2,'Restore 18 HP without consuming a medical supply.',[e('heal',18)]],
 ['Nerve block',4,3,'Deal 16 damage and cancel the next enemy response.',[e('damage',16),e('interrupt',1)]],
 ['Chelation',6,4,'Clear 60 radiation and restore 32 HP in one action.',[e('cleanse',60),e('heal',32)]],
 ['Resuscitate',10,5,'Restore 65 HP and gain 20 shield against the response.',[e('heal',65),e('shield',20)]]
]);
cls('Wirewright','Disrupt machines and redirect stored power.','stun baton',{Tech:2,Firearms:1},'Every basic attack restores 1 extra stamina.',[
 ['Short circuit',3,3,'Deal 10 damage and interrupt even a charged strike.',[e('damage',10),e('interrupt',1)]],
 ['Capacitor tap',4,3,'Deal 18 damage and recover 10 stamina from the target.',[e('damage',18),e('stamina',10)]],
 ['Ground loop',6,4,'Take cover from this response and remove 30 radiation.',[e('cover',1),e('cleanse',30)]],
 ['Blackout',11,5,'Deal 52 damage and cancel the enemy response entirely.',[e('damage',52),e('interrupt',1)]]
]);
cls('Ferryman','Evade the tide and wear down bigger opponents.','pry bar',{Melee:2,Survival:1},'Flee reduces the parting attack by another half.',[
 ['Low water',2,2,'Deal 8 damage while taking cover from the next response.',[e('damage',8),e('cover',1)]],
 ['Boat hook',4,3,'Deal 21 damage and interrupt the target before its attack.',[e('damage',21),e('interrupt',1)]],
 ['Second wind',5,4,'Recover 18 stamina and 20 HP, then face the response.',[e('stamina',18),e('heal',20)]],
 ['Undertow',9,4,'Siphon 44 HP from the enemy as guaranteed damage and healing.',[e('leech',44)]]
]);
cls('Advocate','Read opponents, break their guard and keep allies alive.','battered handgun',{Influence:2,Medicine:1},'Merchant prices are discounted by 2 additional credits.',[
 ['Disarming feint',3,3,'Cancel the response and gain 8 shield for later attacks.',[e('interrupt',1),e('shield',8)]],
 ['Find the gap',4,3,'Expose 6 armor for three responses and deal 12 damage.',[e('expose',6),e('damage',12)]],
 ['Field recovery',6,4,'Siphon 28 HP and clear 20 radiation through emergency care.',[e('leech',28),e('cleanse',20)]],
 ['Decisive blow',10,5,'Deal 50 damage, expose 8 armor, and cancel this response.',[e('expose',8),e('damage',50),e('interrupt',1)]]
]);
cls('Glassrunner','Precise cuts, evasive cover, and surgical armor breaks.','knife',{Melee:2,Tech:1},'Basic attacks gain 8 percentage points of accuracy.',[
 ['Mirror step',3,2,'Deal 12 damage and take cover from this response.',[e('damage',12),e('cover',1)]],
 ['Edge alignment',4,3,'Expose 5 armor before dealing 20 guaranteed damage.',[e('expose',5),e('damage',20)]],
 ['Splinter veil',6,4,'Deal 30 damage and form a 16-point shield.',[e('damage',30),e('shield',16)]],
 ['Perfect fracture',10,5,'Expose 10 armor and deal 62 guaranteed damage.',[e('expose',10),e('damage',62)]]
]);
cls('Ash Warden','Absorb industrial punishment and purge contamination.','pry bar',{Survival:2,Melee:1},'All armor gains 1 flat damage reduction.',[
 ['Ash mantle',3,2,'Raise an 18-point shield and remove 10 radiation.',[e('shield',18),e('cleanse',10)]],
 ['Kiln breath',4,3,'Deal 25 damage and remove 20 radiation.',[e('damage',25),e('cleanse',20)]],
 ['Firebreak',6,4,'Gain 32 shield and cover against the current response.',[e('shield',32),e('cover',1)]],
 ['Phoenix shift',10,5,'Restore 45 HP, remove all radiation, and deal 35 damage.',[e('heal',45),e('cleanse',100),e('damage',35)]]
]);
cls('Surveyor','Read the warning, mark weak points, strike at range.','battered handgun',{Firearms:2,Tech:1},'Aim costs 2 stamina instead of 4.',[
 ['Range mark',2,2,'Expose 4 armor and deal 10 guaranteed damage.',[e('expose',4),e('damage',10)]],
 ['Warning shot',4,3,'Deal 18 damage and interrupt the incoming attack.',[e('damage',18),e('interrupt',1)]],
 ['Dead reckoning',6,3,'Deal 38 damage and recover 6 stamina.',[e('damage',38),e('stamina',6)]],
 ['Horizon cut',10,5,'Deal 68 guaranteed damage, ideal for ending a charged encounter.',[e('damage',68)]]
]);
cls('Sump Apostle','Turn exposure into endurance with siphons and cleansing.','stun baton',{Medicine:1,Survival:2},'Positive radiation exposure is reduced by 1, minimum 1.',[
 ['Borrowed pulse',3,2,'Siphon 12 HP from the enemy without medical supplies.',[e('leech',12)]],
 ['Silt baptism',4,3,'Remove 45 radiation and gain 14 shield.',[e('cleanse',45),e('shield',14)]],
 ['Deep hunger',6,4,'Siphon 32 HP and recover 8 stamina.',[e('leech',32),e('stamina',8)]],
 ['Estuary heart',10,5,'Siphon 48 HP, remove 50 radiation, and gain 20 shield.',[e('leech',48),e('cleanse',50),e('shield',20)]]
]);
export function maxHP(p:Player){return B.hpBase+B.hpGrit*p.stats.Grit+B.hpLevel*(p.level-1)}
export function maxStamina(p:Player){return B.staminaBase+B.staminaGrit*p.stats.Grit+B.staminaLevel*(p.level-1)}
export function xpForLevel(level:number){return B.xpStep*(level-1)*level/2}
export function createPlayer(name:string,origin:string='Baseline',className='Enforcer',bonus:string='Tech'):Player{
 if(!/^[\p{L}\p{N} _-]{1,20}$/u.test(name.trim())||!origins.includes(origin as Origin)||!Object.hasOwn(classes,className)||!SKILLS.includes(bonus as Skill))throw Error('Choose a valid name (1–20 letters/numbers), origin, class and skill.');
 const c=classes[className];const stats={Grit:4,Reflex:4,Wits:4,Nerve:4};
 if(origin==='Splice'){stats.Reflex++;stats.Nerve--}if(origin==='Radborn'){stats.Grit++;stats.Reflex--}
 const skills=Object.fromEntries(SKILLS.map(k=>[k,c.skills[k]??0])) as Record<Skill,number>;if(origin==='Baseline')skills[bonus as Skill]++;
 const p:Player={name:name.trim(),origin:origin as Origin,className,bonus:bonus as Skill,stats,skills,inventory:{[c.weapon]:1,'medical supplies':className==='Street Medic'?5:3},pack:{bag:'canvas satchel',layout:{}},weapon:c.weapon,armor:null,abilities:[c.abilities[0]],hp:0,stamina:0,radiation:0,credits:20,debt:0,xp:0,level:1,points:0};
 if(className==='Enforcer')p.inventory.knife=1;if(className==='Scavenger')p.inventory['lock tools']=1;
 p.hp=maxHP(p);p.stamina=maxStamina(p);reconcilePack(p);return p;
}
export function gainXP(p:Player,amount:number){
 if(!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid XP');p.xp=Math.min(B.maxCounter,p.xp+amount);
 while(p.level<B.maxLevel&&p.xp>=xpForLevel(p.level+1)){p.level++;p.points++;p.hp=maxHP(p);p.stamina=maxStamina(p)}
}
export function learn(p:Player,id:string){const a=abilities[id];if(!a||a.className!==p.className||a.level>p.level||p.abilities.includes(id)||p.points<1)return false;p.points--;p.abilities.push(id);return true}
