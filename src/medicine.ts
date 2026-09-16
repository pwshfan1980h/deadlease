import {instruction} from './instructions';
import {reconcilePack} from './backpack';
import {BALANCE} from './config';
import type {Player} from './progression';
import type {Game,Result} from './engine';
export const ailments={
 'brain damage':{cost:75,description:'Traumatic neural damage: −12 percentage points to weapon accuracy. Clinical repair required.'},
 'torn ligaments':{cost:45,description:'Damaged joints: −6 maximum stamina. Clinical repair required.'},
 'infected wound':{cost:35,description:'Deep infection: medical supplies restore 8 less HP. Clinical repair required.'},
 'nerve burns':{cost:55,description:'Damaged nerve pathways: −4 maximum stamina. Clinical repair required.'},
 'marrow rot':{cost:90,description:'Deep tissue disease: −10 maximum HP. Clinical repair required.'},
 'radiation sickness':{cost:60,description:'Lasting radiation damage: −6 maximum HP and −6 percentage points to weapon accuracy. Clearing exposure does not cure it.'},
} as const;
export type Ailment=keyof typeof ailments;
export const implants={
 'dermal weave':{description:'+12 maximum HP per rank.',costs:[80,160,280]},
 'adrenal regulator':{description:'+6 maximum stamina per rank.',costs:[80,160,280]},
 'targeting optic':{description:'+6 percentage points to weapon accuracy per rank.',costs:[100,180,300]},
} as const;
export type Implant=keyof typeof implants;
export interface Body {ailments:Ailment[];implants:Partial<Record<Implant,number>>;commission:'none'|'active'|'done';voucher:boolean}
export const newBody=():Body=>({ailments:[],implants:{},commission:'none',voucher:false});
export const rank=(p:Player,id:Implant)=>p.body.implants[id]??0;
export const impaired=(p:Player,id:Ailment)=>p.body.ailments.includes(id);
export const accuracyModifier=(p:Player)=>rank(p,'targeting optic')*6-(impaired(p,'brain damage')?12:0)-(impaired(p,'radiation sickness')?6:0);
export const doctors:Record<string,{name:string;clinic:boolean}>={clinic:{name:'Dr. Pell',clinic:true},'bellwether-0':{name:'Ripper Voss',clinic:false}};
export function bodyReport(p:Player){return ['CONDITION / '+(p.body.ailments.length?p.body.ailments.map(id=>id+': '+ailments[id].description).join(' '):'No lasting injuries.'),'IMPLANTS / '+(Object.entries(p.body.implants).map(([id,n])=>id+' rank '+n).join(' · ')||'None installed.'),instruction('Visit a doctor for lasting conditions. Type talk doctor for prices. Rest, supplies and revival drones do not cure them.')];}
export function medicalJournal(p:Player){return p.body.commission==='none'?[]:['PELL / Spare Parts — '+(p.body.commission==='done'?'Completed. '+(p.body.voucher?'One free implant rank available.':'Upgrade redeemed.'):'Bring 3 salvage to a doctor for one free implant rank.')];}
export function injury(p:Player,id:Ailment,m:string[]){if(!impaired(p,id)){p.body.ailments.push(id);m.push('INJURY / '+id+'. '+ailments[id].description);m.push(instruction('Type status for treatment options.'))}}
/** Handles only medical verbs; informational and rejected actions never advance the world. */
export function medicalCommand(source:Game,verb:string,arg:string):Result|null{
 const doctor=doctors[source.room],p=source.player;
 const result=(messages:string[],state=source):Result=>({state,changed:state!==source,messages,sound:state===source?'submit':'heal'});
 if(verb==='status'||verb==='condition')return result(bodyReport(p));
 if(verb==='inspect'&&(Object.hasOwn(ailments,arg)||Object.hasOwn(implants,arg)))return result([Object.hasOwn(ailments,arg)?ailments[arg as Ailment].description:implants[arg as Implant].description]);
 const talking=verb==='talk'&&['doctor','doc','ripper','ripper doc','pell','dr pell','dr. pell','voss','ripper voss'].includes(arg);
 const accepting=verb==='accept'&&['spare parts','spare-parts'].includes(arg),reporting=verb==='report'&&['spare parts','spare-parts'].includes(arg);
 if(!talking&&!accepting&&!reporting&&!['treat','implants','upgrade'].includes(verb))return null;
 if(!doctor)return result(['No doctor here. Dr. Pell works at Reclamation Clinic; Ripper Voss works at Bellwether Gate.']);
 if(source.encounter)return result(['The doctor cannot operate during a fight. Resolve the encounter first.']);
 if(talking||verb==='implants')return result([doctor.name+': “I can repair what the streets did, or make you harder to break.”',...bodyReport(p),...p.body.ailments.map(id=>'Treat '+id+' · '+(ailments[id].cost+(doctor.clinic?0:15))+' credits.'), instruction('Type treat <condition> or treat all.'),...Object.entries(implants).flatMap(([id,d])=>[id+' · rank '+rank(p,id as Implant)+'/3 · '+d.description+' '+(rank(p,id as Implant)<3?'Next: '+d.costs[rank(p,id as Implant)]+' credits.':'Fully installed.'),...(rank(p,id as Implant)<3?[instruction('Type upgrade '+id+'.')]:[])]),...(p.body.commission==='none'?[doctor.name+': “Bring me three pieces of salvage for the repair bench and I’ll fit an implant for you. No charge.”',instruction('Type accept spare parts.')]:medicalJournal(p))]);
 if(source.turns>=BALANCE.maxCounter)return result(['This archival save has reached the supported turn limit.']);
 const g=structuredClone(source),b=g.player.body;
 if(accepting){if(b.commission!=='none')return result(['That commission is already '+b.commission+'.']);b.commission='active';g.turns++;return result(['COMMISSION / Spare Parts. Bring 3 salvage to Dr. Pell or Ripper Voss. Reward: one free implant rank.',instruction('Type report spare parts when you return to a doctor.')],g)}
 if(reporting){if(b.commission!=='active')return result(['No active Spare Parts commission to report.']);if((p.inventory.salvage??0)<3)return result(['You need 3 salvage. The doctor leaves your pack untouched.']);g.player.inventory.salvage-=3;if(!g.player.inventory.salvage){delete g.player.inventory.salvage;delete g.player.pack.layout.salvage}reconcilePack(g.player);b.commission='done';b.voucher=true;g.turns++;return result(['COMMISSION COMPLETE / Three salvage delivered. Your next implant rank is free.',instruction('Type upgrade dermal weave, upgrade adrenal regulator, or upgrade targeting optic.')],g)}
 if(verb==='treat'){
  const selected=!arg||['all','injuries'].includes(arg)?b.ailments:b.ailments.filter(id=>id===arg);
  if(!selected.length)return result(['No matching condition needs treatment. Type status to check your injuries.']);
  const cost=selected.reduce((n,id)=>n+ailments[id].cost+(doctor.clinic?0:15),0);
  if(p.credits<cost)return result(['Treatment costs '+cost+' credits. Nothing charged. You can treat one condition at a time; clinic prices are lower.']);
  g.player.credits-=cost;b.ailments=b.ailments.filter(id=>!selected.includes(id));g.turns++;
  return result(['TREATED / '+doctor.name+' repairs '+selected.join(', ')+'. '+cost+' credits.'],g);
 }
 if(!Object.hasOwn(implants,arg))return result(['Choose dermal weave, adrenal regulator, or targeting optic. Type implants for prices.']);
 const id=arg as Implant,n=rank(p,id);if(n>=3)return result(['That implant is already at rank 3.']);const cost=b.voucher?0:implants[id].costs[n];if(p.credits<cost)return result(['That rank costs '+cost+' credits. No procedure performed.']);g.player.credits-=cost;b.implants[id]=n+1;if(b.voucher)b.voucher=false;g.turns++;return result(['INSTALLED / '+id+' rank '+(n+1)+'. '+implants[id].description+' '+cost+' credits.'],g);
}
