import {rooms,type Room} from './world';
import {palettes,hash,WIDTH,HEIGHT} from './visual-data';
export {palettes,hash,WIDTH,HEIGHT,mapGeometry} from './visual-data';
export type {PaletteName} from './visual-data';
export function scenePixels(r:Room):Uint8Array{
 const pixels=new Uint8Array(WIDTH*HEIGHT);let seed=hash(r.id+r.name);
 const rand=(n:number)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n};
 function rect(x:number,y:number,w:number,h:number,c:number){for(let j=Math.max(0,Math.floor(y));j<Math.min(HEIGHT,y+h);j++)for(let i=Math.max(0,Math.floor(x));i<Math.min(WIDTH,x+w);i++)pixels[j*WIDTH+i]=c}
 function line(x:number,y:number,x2:number,y2:number,c:number){let dx=Math.abs(x2-x),sx=x<x2?1:-1,dy=-Math.abs(y2-y),sy=y<y2?1:-1,err=dx+dy;for(;;){rect(x,y,1,1,c);if(x===x2&&y===y2)break;let e=2*err;if(e>=dy){err+=dy;x+=sx}if(e<=dx){err+=dx;y+=sy}}}
 function window(x:number,y:number,w=5,h=8){rect(x,y,w+2,h+2,0);rect(x+1,y+1,w,h,rand(4)?4:7);rect(x+Math.floor(w/2),y+1,1,h,1)}
 function building(x:number,y:number,w:number,h:number){rect(x,y,w,h,1);rect(x,y,w,2,2);rect(x+w-3,y,3,h,0);for(let wy=y+8;wy<y+h-8;wy+=15)for(let wx=x+7;wx<x+w-7;wx+=13)window(wx,wy,4,6);rect(x+5,y+h-16,10,16,0)}
 rect(0,0,256,144,0);rect(0,12,256,72,1);
 // Broken distant skyline; each authored location seeds its own silhouette, weather and props.
 for(let x=0;x<256;x+=12){const h=10+rand(29);rect(x,75-h,10+rand(7),h,0)}
 rect(0,84,256,60,1);for(let i=0;i<80;i++)rect(rand(256),87+rand(57),1+rand(8),1,rand(3)?0:2);
 const terrain=r.scene;
 if(terrain==='clinic'){
  rect(10,20,236,95,1);rect(10,20,236,3,2);for(let x=16;x<240;x+=28)line(x,24,x,110,0);
  rect(20,42,57,32,0);rect(25,47,47,22,3);rect(45,50,7,16,5);rect(40,55,17,6,5);
  rect(92,75,79,24,2);rect(96,70,66,19,3);rect(93,98,4,24,0);rect(163,98,4,24,0);
  rect(180,36,47,72,0);rect(184,40,39,20,7);rect(186,44,15,2,1);rect(186,49,28,2,1);rect(186,67,32,3,2);rect(185,82,22,12,3);
  line(132,21,132,43,2);rect(109,42,48,4,3);
 }else if(terrain==='pump'){
  for(let x=12;x<256;x+=41){rect(x,19,8,98,2);rect(x+2,21,4,96,1)}
  rect(61,48,125,64,0);rect(67,51,111,55,2);for(let x=74;x<176;x+=17)rect(x,52,8,51,4);
  rect(102,59,34,36,1);rect(111,67,16,20,7);rect(109,96,20,8,0);rect(187,102,7,9,3);line(0,122,256,122,2);
 }else if(terrain==='sewer'){
  rect(0,0,256,110,0);for(let x=0;x<256;x+=40){rect(x,20,7,94,2);rect(x+7,20,28,4,2);rect(x+7,24,28,2,1)}
  rect(0,110,256,34,7);for(let i=0;i<42;i++)rect(rand(256),112+rand(32),8+rand(20),1,1);
  rect(0,92,256,14,1);rect(0,94,256,2,2);if(r.exits.up){for(let y=20;y<100;y+=9)rect(197,y,20,2,4);rect(195,16,2,87,2);rect(217,16,2,87,2)}
  rect(44,35,94,5,2);rect(130,35,8,64,2);rect(133,39,2,54,0);
 }else if(terrain==='water'){
  rect(0,81,256,63,7);for(let i=0;i<70;i++)rect(rand(256),83+rand(61),3+rand(24),1,rand(2)?0:1);
  rect(0,105,184,10,2);rect(0,108,184,7,1);for(let x=13;x<184;x+=31)rect(x,114,6,30,0);
  rect(37,27,4,77,2);line(38,27,142,40,2);line(38,29,111,29,2);line(109,29,109,66,4);rect(103,65,13,7,2);
  rect(195,99,45,7,0);rect(202,91,30,8,1);line(216,49,216,99,2);line(216,49,239,89,3);
 }else if(terrain==='marsh'){
  rect(0,89,256,55,7);for(let i=0;i<90;i++)rect(rand(256),89+rand(55),6+rand(17),1,1);
  for(let i=0;i<54;i++){let x=rand(256),y=100+rand(44),h=10+rand(25);line(x,y,x-3,y-h,6);rect(x-5,y-h,4,7,4)}
  for(let i=0;i<11;i++)rect(80+i*7,88+i*5,32,4,2);rect(182,51,44,47,1);rect(178,49,52,4,2);window(192,62,8,12);
 }else if(terrain==='industrial'){
  building(7,39,75,69);building(174,58,72,50);rect(27,11,16,40,2);rect(51,22,12,24,0);
  rect(94,42,69,71,0);rect(102,49,52,61,2);rect(111,63,34,42,5);rect(118,81,21,24,4);rect(103,108,65,6,0);
  for(let x=0;x<256;x+=24)rect(x,126,13,3,4);line(0,136,256,136,2);
 }else if(terrain==='glass'){
  for(let i=0;i<7;i++){const x=12+i*35,h=40+rand(37);rect(x,99-h,24,h,7);rect(x+3,103-h,18,h-7,1);line(x,99-h,x+22,96,3);line(x+22,99-h,x,96,2)}
  for(let i=0;i<30;i++){const x=rand(256),y=113+rand(30);line(x,y,x+rand(10),y-4,7)}
 }else if(terrain==='storm'){
  rect(0,90,256,54,0);for(let y=93;y<144;y++)rect(128-(y-85),y,2*(y-85),1,2);
  rect(104,21,45,72,1);rect(109,15,34,7,2);for(let y=28;y<83;y+=12)rect(113,y,25,3,4);
  line(29,9,43,27,7);line(43,27,31,36,7);line(31,36,57,53,7);line(204,6,196,26,7);line(196,26,211,30,7);
  rect(177,81,16,29,1);rect(180,75,10,9,2);rect(180,86,10,4,4);rect(176,111,5,15,2);rect(190,111,5,15,2);
 }else{
  building(0,27,70,88);building(188,14,68,101);building(83,49,55,38);rect(147,65,30,22,0);
  for(let i=0;i<5;i++)line(74+i*24,91,35+i*43,144,0);line(0,116,256,116,2);
  rect(8,90,54,15,0);rect(12,93,44,6,4);rect(79,100,20,14,2);rect(80,99,19,3,0);
 }
 // Hand-directed focal landmarks make individual rooms legible within their regional visual language.
 const prop=sceneDirections[r.id],px=89+(hash(r.id)%27),py=94;
 const box=(dx:number,dy:number,w:number,h:number,c:number)=>rect(px+dx,py+dy,w,h,c);
 const stroke=(x:number,y:number,x2:number,y2:number,c:number)=>line(px+x,py+y,px+x2,py+y2,c);
 if(['ledger','papers','charts','names','notices','sign','station','marks','tiles'].includes(prop)){
  box(-7,-33,54,42,0);box(-4,-30,48,34,prop==='ledger'?4:3);for(let y=-25;y<0;y+=5)box(1,y,20+rand(16),1,1);box(2,9,4,13,2);box(34,9,4,13,2);
 }else if(['valve','pump','gears','gauge','clock','compass','turbine'].includes(prop)){
  box(-9,-19,65,6,2);box(12,-36,28,35,2);box(16,-32,20,27,0);box(19,-26,14,15,4);box(25,-29,2,21,1);box(17,-20,19,2,1);box(24,-2,5,25,2);if(prop==='turbine'){stroke(26,-16,1,-44,3);stroke(26,-16,54,-38,3);stroke(26,-16,39,10,3)}
 }else if(['fountain','vat','pool','well','trough','weir','filter','crucible','bubbles'].includes(prop)){
  box(-13,-8,74,27,2);box(-8,-5,64,16,7);box(-3,-2,38,1,3);box(-16,18,79,4,0);if(prop==='fountain'||prop==='well'){box(21,-35,6,32,2);box(10,-36,30,5,2);stroke(10,-31,1,-5,7);stroke(37,-31,49,-5,7)}else if(prop==='filter'){box(4,-26,40,18,1);for(let x=8;x<42;x+=6)box(x,-23,3,15,6)}
 }else if(['bell','lamps','buoy','bollard','crystals','spike'].includes(prop)){
  box(19,-43,4,45,2);box(10,-28,23,22,4);box(5,-7,34,5,4);box(18,-1,7,8,2);if(prop==='buoy'){box(2,9,40,7,5);box(20,-44,3,8,3)}
 }else if(['boat','tram','container','warehouse','bunker','lift','court','fridge','vending'].includes(prop)){
  box(-16,-36,80,52,0);box(-13,-33,74,44,2);box(-7,-27,60,17,1);box(2,-25,15,13,7);box(24,-25,15,13,7);box(-7,-4,60,2,0);box(-7,14,12,8,0);box(41,14,12,8,0);if(prop==='fridge'||prop==='vending'){box(12,-42,29,63,3);box(15,-37,23,22,1);box(33,-8,2,12,0)}
 }else if(['tree','plant','nets','rope','bones','threads','chain','drips','eye'].includes(prop)){
  box(20,-45,6,64,2);for(let i=0;i<5;i++){stroke(23,-32+i*9,2,-43+i*8,6);stroke(24,-30+i*9,48,-40+i*8,6);if(prop==='nets'||prop==='rope'||prop==='chain'){stroke(2,-43+i*8,48,-40+i*8,4);stroke(i*8+3,-43,i*8+3,1,2)}}
 }else if(['crane','gantry','ladder','rails','rail','antenna','tower','pipes','tubes','gutter'].includes(prop)){
  box(-9,-49,5,72,2);box(43,-49,5,72,2);for(let y=-46;y<20;y+=10)box(-4,y,47,3,prop==='antenna'?7:2);if(prop==='crane'){stroke(-9,-49,74,-49,3);stroke(74,-49,74,-11,4);box(67,-11,15,5,2)}
 }else if(['statue','shield','hammer','anvil','scale','telescope','camera','paddles'].includes(prop)){
  box(0,12,49,10,2);box(17,-24,11,38,2);box(8,-39,32,17,3);box(15,-33,5,4,0);box(31,-33,5,4,0);if(prop==='telescope'){box(-11,-35,70,10,7);box(-13,-38,7,16,2)}if(prop==='anvil'){box(-12,-13,75,9,2);box(8,-4,29,17,0)}
 }else if(['grate','gate','barrier','palisade','teeth','shards','studs','stones'].includes(prop)){
  for(let x=-14;x<65;x+=13){box(x,-15-rand(12),6,45,2);box(x+1,-20,4,4,4)}box(-17,-3,82,5,prop==='barrier'?5:0);
 }else if(prop!=='bed'){
  box(-8,0,68,5,2);box(-4,5,4,19,0);box(49,5,4,19,0);for(let i=0;i<4;i++){const h=8+rand(17);box(-1+i*14,-h,11,h,prop==='soup'?4:prop==='rats'?6:2);box(1+i*14,-h+3,6,2,0)}
 }
 // Location props: sign, lamps, scrap, guarded figure; seeded detail is stable across palette changes.
 const sx=12+rand(23);rect(sx,113,30,15,0);rect(sx+2,115,26,10,2);for(let i=0;i<5;i++)rect(sx+4+i*4,118,2,2+(hash(r.name)>>i&3),0);
 if(r.safe){rect(222,98,10,20,6);rect(224,91,7,8,3);rect(220,118,5,12,0);rect(230,118,5,12,0);rect(234,103,3,22,2)}
 for(let i=0;i<12;i++){const x=rand(256),y=rand(87);line(x,y,x-2,y+5,2)}
 return pixels;
}
export function colorize(pixels:Uint8Array,palette:string[]){const rgb=palette.map(h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);const out=new Uint8ClampedArray(pixels.length*4);pixels.forEach((c,i)=>{out.set(rgb[c],i*4);out[i*4+3]=255});return out}
export function remapPortrait(data:Uint8ClampedArray,palette:string[]){
 // Source pixels remain in the Python prototype's fixed palette.
 const original=['#111719','#202B2D','#899794','#DED8C5','#D9A441','#DF7464','#A4B875','#70B4B0'].map(h=>parseInt(h.slice(1),16));const target=palette.map(h=>parseInt(h.slice(1),16));const out=new Uint8ClampedArray(data);
 for(let i=0;i<data.length;i+=4){const n=(data[i]<<16)|(data[i+1]<<8)|data[i+2];const idx=original.indexOf(n);if(idx<0)throw Error('Portrait contains a color outside the original palette.');const c=target[idx];out[i]=c>>16;out[i+1]=(c>>8)&255;out[i+2]=c&255}return out;
}
export const sceneDirections:Record<string,string>={};
Object.assign(sceneDirections,{clinic:'bed',steps:'notices',square:'fountain',kiosk:'vending',alley:'fridge',tunnel:'valve',sump:'vat',pump:'pump',booth:'console',gate:'barrier',relay:'antenna',yard:'container'});
const regionalProps:Record<string,string[]>={
 shallows:['lamps','pipes','soup','stairs','filter','valve','grate','gate'],
 wilds:['lamps','stones','barrier','soup','turbine','rope','stones','nets','tree','stones','charts','marks'],
 bellwether:['gate','papers','rope','soup','tools','bell','crates'],
 quay:['awning','scale','rope','crates','stairs','bell','chain','warehouse','gauge','lamps','crane','teeth','names','nets','boat','gate','buoy','bollard'],
 reed:['palisade','tree','court','tram','basket','pool','filter','telescope','gantry','stones','weir','papers','ladder','kiln','rail','charts','filter','station'],
 foundry:['soup','clock','ledger','rivets','grate','tubes','statue','molds','hammer','trough','crucible','furnace','patterns','gutter','anvil','gears','papers','chairs'],
 glass:['compass','pool','lens','camera','mirror','bottles','shield','sign','notices','mirror','well','tree','shards','mirror','tiles','stairs','plant','grave'],
 crown:['bunker','marks','studs','antenna','lift','tower','spike','antenna','paddles','barrier','rails','teeth','turbine','chairs','ledger','console','gears','sign'],
 sewer:['mats','coins','valve','pipes','crystals','eye','chain','bones','fridge','bench','drips','pump','bubbles','rats','anchor','shrine','ladder','pipes','threads','gears']
};
for(const [zone,props] of Object.entries(regionalProps))props.forEach((prop,i)=>sceneDirections[zone+'-'+i]=prop);
