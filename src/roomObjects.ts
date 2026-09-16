export type ObjectVerb='read'|'inspect'|'look';
interface ObjectBase {id:string;room:string;name:string;aliases:string[];description:string;verbs:ObjectVerb[];hint?:string}
export interface BoardObject extends ObjectBase {action:'jobs';hint:string}
export interface TheftObject extends ObjectBase {
 action:'theft';item:string;count:number;chance:number;emptyDescription:string;
 guard:{name:string;level:number;hp:number;damage:number;armor:number;phase:number};
 caught:string;success:string;
}
export type RoomObject=BoardObject|TheftObject;
const board=(room:string,description:string):BoardObject=>({id:room+'-jobs-board',room,name:'jobs board',aliases:['board','jobs board','job board','notice board','dispatch board','dispatch notice'],description,verbs:['read','inspect','look'],action:'jobs',hint:'read board'});
/** A hint is opt-in. Prose-only opportunities never enter command hints or completion. */
export const roomObjects:RoomObject[]=[
 board('clinic','A jobs board hangs beside the clinic door. Delivery slips are pinned beneath a handwritten promise: PAY ON ARRIVAL.'),
 board('yard','A jobs board is bolted to the freight office wall. Local delivery slips hang beside a weather-stained dispatch for Bellwether.'),
 board('bellwether-1','A jobs board beneath the awning lists paid return deliveries to District 67. Ada keeps the slips dry beneath a sheet of glass.'),
 {id:'kiosk-medical-kit',room:'kiosk',name:'sealed medical kit',aliases:['kit','medical kit','sealed medical kit','medical supplies','kit from crate','kit from the crate','medical kit from the crate'],action:'theft',verbs:['inspect','look'],item:'medical supplies',count:3,chance:.45,
  description:'A sealed medical kit sits on a restocking crate beside the vending machine. The attendant turns away to count ration tins; a watchman stands within shouting distance.',
  emptyDescription:'An empty rectangle in the dust marks where the medical kit sat on the restocking crate.',
  guard:{name:'checkpoint bruiser',level:3,hp:52,damage:9,armor:2,phase:0},
  caught:'The attendant catches your wrist before the kit leaves the crate. “Watch!” A checkpoint bruiser draws a club and comes at you.',
  success:'You slide the sealed kit into your pack while the attendant counts tins. Three medical supplies, unnoticed.'},
 {id:'bellwether-coat',room:'bellwether-1',name:'insulated coat',aliases:['coat','insulated coat','coat from hook','coat from the hook'],action:'theft',verbs:['inspect','look'],item:'insulated coat',count:1,chance:.25,
  description:'An insulated coat hangs from a brass hook behind Ada’s table, copper lining visible at the cuff. Its owner plays cards nearby, a loaded pistol under one hand.',
  emptyDescription:'The brass hook behind Ada’s table is bare; the insulated coat is gone.',
  guard:{name:'alley marksman',level:5,hp:74,damage:15,armor:3,phase:0},
  caught:'A chair scrapes. The coat’s owner pins the sleeve beneath a boot before you can take it, and draws the pistol. The card game is over.',
  success:'The card players argue over a hand. You fold the coat copper-side inward and slip it into your pack.'},
 {id:'yard-watch-gun',room:'yard',name:'watch gun',aliases:['gun','rifle','carbine','coil carbine','watch gun','gun on table','gun on the table','gun from table','gun from the table','gun off the table','rifle from the table','carbine from the table'],action:'theft',verbs:['inspect','look'],item:'coil carbine',count:1,chance:0,
  description:'Inside the watch office, a coil carbine lies on a table beneath the lamp. A harbor gunner covers it with a braced rifle, finger already on the trigger. The ceasefire ends at that table; reaching for the gun would draw an immediate killing burst.',
  emptyDescription:'The watch-office table is bare. Only an oil-dark outline remains where the coil carbine lay.',
  guard:{name:'harbor gunner',level:8,hp:140,damage:26,armor:6,phase:2},
  caught:'Your hand crosses the watch-office table. The harbor gunner fires before you can lift the carbine.',
  success:'With the gunner down, you lift the coil carbine from the table and stow it.'}
];
export const objectsHere=(room:string)=>roomObjects.filter(object=>object.room===room);
export const objectCommands=(room:string)=>objectsHere(room).filter(object=>object.hint).flatMap(object=>object.verbs.flatMap(verb=>object.aliases.map(alias=>verb+' '+alias)));
export function resolveObject(room:string,target:string){const noun=target.replace(/^the /,'');return objectsHere(room).filter(object=>object.aliases.includes(noun)||object.id===noun)}
export const theftObjects=roomObjects.filter((object):object is TheftObject=>object.action==='theft');
