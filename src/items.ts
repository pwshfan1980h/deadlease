import {fish,fishingKit} from './fishing';
import type {AttackKind} from './enemies';
import type {Skill} from './config';
export interface Item {description:string;price:number;damage?:number;skill?:Skill;armor?:number;insulation?:number;tier?:number;quest?:boolean;backpack?:boolean;attack?:AttackKind;classes?:string[];art?:string;food?:number;foodStamina?:number}
export const items:Record<string,Item>={
 'stitch drone':{description:'Packed: automatically consumes itself on a lethal hit, restoring half health and stopping bleeding in the same encounter. Unpacked: cannot activate. One rescue per drone. 2×2 cells.',price:180,tier:1},
 'battered handgun':{description:'Firearms · 9 base damage. Aim spends 4 stamina for +25 accuracy.',damage:9,skill:'Firearms',price:20,tier:1},
 knife:{description:'Melee · 7 base damage. Reliable, no ammunition needed.',damage:7,skill:'Melee',price:5,tier:1},
 'pry bar':{description:'Melee · 9 base damage. The universal access credential.',damage:9,skill:'Melee',price:10,tier:1},
 'stun baton':{description:'Melee · 8 base damage. Warranty excludes screams.',damage:8,skill:'Melee',price:12,tier:1},
 'service rifle':{description:'Firearms · 16 base damage. Available in level 3+ refuges.',damage:16,skill:'Firearms',price:65,tier:3},
 'arc cutter':{description:'Melee · 18 base damage. Available in level 4+ refuges.',damage:18,skill:'Melee',price:80,tier:4},
 'coil carbine':{description:'Firearms · 24 base damage. Available in level 6+ refuges.',damage:24,skill:'Firearms',price:145,tier:6},
 'ceramic cleaver':{description:'Melee · 25 base damage. Available in level 6+ refuges.',damage:25,skill:'Melee',price:145,tier:6},
 'armor vest':{description:'Armor 2. Subtracts two from each incoming hit.',armor:2,price:18,tier:1},
 'union plate':{description:'Armor 5. Heavy recycled boiler plating.',armor:5,price:65,tier:4},
 'insulated coat':{description:'Armor 4; halves radiation exposure and reduces charged damage by 8.',armor:4,insulation:8,price:100,tier:6},
 'storm harness':{description:'Armor 8; halves radiation and reduces charged damage by 12.',armor:8,insulation:12,price:180,tier:8},
 'field backpack':{description:'7 columns of reinforced canvas. Rows increase with Grit. Equip to expand your pack.',price:45,tier:1,backpack:true},
 'expedition frame':{description:'8 columns on a steel carrying frame. Rows increase with Grit.',price:120,tier:4,backpack:true},
 'medical supplies':{description:'Consume to restore 18 + 3×Medicine + 2×(Wits−4) HP. Enemy responds.',price:8,tier:1},
 'lock tools':{description:'Original scavenger tools. Everyone can scrounge; Scavengers earn more.',price:8,tier:1},
 salvage:{description:'Any merchant buys one for 4 credits. Quest artifacts cannot be sold.',price:4},
 ...Object.fromEntries(['pump component','access key','filter core','weather recording','governor spindle','lens fragment','master ledger','drain seal'].map(x=>[x,{description:'Irreplaceable quest artifact. Consult the journal for its recipient.',price:0,quest:true}]))
};

// Each class has a dependable progression in shops and a favored drop pool.
export const classArsenal:Record<string,[string,string,string,AttackKind,string]>={
 Enforcer:['patrol pistol','breach shotgun','riot carbine','pistol','battered handgun'],
 Scavenger:['riveter hammer','scrap saw','demolition maul','blunt','pry bar'],
 'Street Medic':['shock prod','surgical lance','pulse baton','electric','stun baton'],
 Wirewright:['spark driver','voltaic lance','storm emitter','electric','arc cutter'],
 Ferryman:['boarding hook','tide axe','ferryman glaive','blade','pry bar'],
 Advocate:['holdout pistol','duelist revolver','peacekeeper rifle','pistol','battered handgun'],
 Glassrunner:['shard knife','mirror saber','prism edge','blade','knife'],
 'Ash Warden':['furnace hammer','slag splitter','kiln breaker','blunt','pry bar'],
 Surveyor:['scout rifle','marksman rifle','horizon rifle','rifle','service rifle'],
 'Sump Apostle':['siphon spike','marrow lance','deepwater staff','drain','stun baton']
};
for(const [cls,[early,middle,late,attack,art]] of Object.entries(classArsenal)){
 for(const [i,id] of [early,middle,late].entries()){
  const tier=[1,4,7][i],damage=[11,20,29][i],skill=attack==='pistol'||attack==='rifle'?'Firearms':'Melee';
  items[id]={description:`${skill} · ${damage} base damage. Favored by ${cls}.`,damage,skill,tier,price:[28,90,165][i],attack,classes:[cls],art};
 }
}
items['sealed parcel']={description:'A sealed courier parcel. Deliver it at the address listed under jobs. It survives clinic recovery.',price:0,quest:true,art:'weather recording'};
export function weaponAttack(id:string):AttackKind{return items[id]?.attack??(items[id]?.skill==='Firearms'?(id.includes('rifle')||id.includes('carbine')?'rifle':'pistol'):id.includes('baton')||id.includes('arc')?'electric':id.includes('knife')||id.includes('cleaver')?'blade':'blunt')}
export function favoredWeapons(className:string,level:number){return Object.keys(items).filter(id=>items[id].classes?.includes(className)&&items[id].tier!<=level)}

items[fishingKit]={description:'A collapsible pole, reel, hooks and reusable lure in one compact kit. Takes one cell. Fish at accessible water while it is packed; optional bait widens the timing window.',price:12,tier:1};
items['fishing bait']={description:'A small tin of worms. One bait is used per cast when available, widening the fishing timing window. The reusable lure works without bait.',price:3,tier:1};
for(const catchItem of fish)items[catchItem.id]={description:catchItem.description+(catchItem.heal||catchItem.stamina?' Eat to restore '+catchItem.heal+' HP and '+catchItem.stamina+' stamina.':' Collect it or sell it to a trader.'),price:catchItem.value,food:catchItem.heal,foodStamina:catchItem.stamina};
