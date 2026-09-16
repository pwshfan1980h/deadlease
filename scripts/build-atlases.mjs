// Deterministic shelf packing. Editable sources remain art.ts and Python portraits.
import fs from 'node:fs/promises';
import {PNG} from 'pngjs';
import {palettes,scenePixels,colorize,remapPortrait} from '../src/art.ts';
import {rooms,zones} from '../src/world.ts';
import {iconPixels} from '../src/icon-art.ts';
const root=new URL('../',import.meta.url),out=new URL('public/assets/atlases/',root);
const maxSize=2048,padding=2;
const manifest={version:1,maxSize,padding,palettes,atlases:{},sprites:{}};
await fs.mkdir(out,{recursive:true});
const portraits=['baseline','splice','radborn','clerk','technician','broker','scavenger','creature','guard'];
const sourcePortraits=await Promise.all(portraits.map(async name=>({name,image:PNG.sync.read(await fs.readFile(new URL('art-source/portraits/'+name+'.png',root)))})));
for(const [palette,colors] of Object.entries(palettes)){
 const groups=Object.fromEntries(Object.keys(zones).sort().map(zone=>[zone,Object.values(rooms).filter(r=>r.zone===zone).map(r=>({id:'room/'+r.id,width:256,height:144,area:zone,data:colorize(scenePixels(r),colors)}))]));
 groups.shared=[...sourcePortraits.map(({name,image})=>({id:'portrait/'+name,width:image.width,height:image.height,area:'shared',data:remapPortrait(image.data,colors)})),...Object.entries(iconPixels).map(([name,pixels])=>({id:'icon/'+name,width:16,height:16,area:'shared',data:colorize(pixels,colors)}))];
 for(const [group,entries] of Object.entries(groups)){
  let page=0,x=0,y=0,rowHeight=0,packed=[];
  async function flush(){
   if(!packed.length)return;
   const width=Math.max(...packed.map(s=>s.x+s.width+padding)),height=Math.max(...packed.map(s=>s.y+s.height+padding));
   const image=new PNG({width,height});const bg=colors[0].slice(1);for(let i=0;i<image.data.length;i+=4){image.data[i]=parseInt(bg.slice(0,2),16);image.data[i+1]=parseInt(bg.slice(2,4),16);image.data[i+2]=parseInt(bg.slice(4,6),16);image.data[i+3]=255}
   const key=`${palette}/${group}-${page}`,file=`assets/atlases/${palette}-${group}-${page}.png`;
   for(const s of packed){
    // Duplicate nearest edge pixels through the entire gutter, including corners.
    for(let dy=-padding;dy<s.height+padding;dy++)for(let dx=-padding;dx<s.width+padding;dx++){
     const from=(Math.max(0,Math.min(s.height-1,dy))*s.width+Math.max(0,Math.min(s.width-1,dx)))*4;
     const to=((s.y+dy)*width+s.x+dx)*4;image.data.set(s.data.subarray(from,from+4),to);
    }
    manifest.sprites[`${palette}/${s.id}`]={atlas:key,x:s.x,y:s.y,width:s.width,height:s.height,padding,area:s.area,palette};
   }
   manifest.atlases[key]={file,width,height,group,palette};
   await fs.writeFile(new URL('public/'+file,root),PNG.sync.write(image,{colorType:2}));
   page++;x=0;y=0;rowHeight=0;packed=[];
  }
  for(const s of entries.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)){
   const w=s.width+padding*2,h=s.height+padding*2;if(w>maxSize||h>maxSize)throw Error('Sprite exceeds atlas bound: '+s.id);
   if(x+w>maxSize){x=0;y+=rowHeight;rowHeight=0}
   if(y+h>maxSize)await flush();
   packed.push({...s,x:x+padding,y:y+padding});x+=w;rowHeight=Math.max(rowHeight,h);
  }
  await flush();
 }
}
await fs.mkdir(new URL('src/generated/',root),{recursive:true});
await fs.writeFile(new URL('src/generated/atlas.json',root),JSON.stringify(manifest,null,2)+'\n');
// Cleanup is restricted to browser-generated output, never source assets/evidence.
const shipped=new Set(Object.values(manifest.atlases).map(a=>a.file.split('/').pop()));
for(const file of await fs.readdir(out))if(file.endsWith('.png')&&!shipped.has(file))await fs.unlink(new URL(file,out));
for(const directory of ['scenes','portraits'])await fs.rm(new URL('public/assets/'+directory,root),{recursive:true,force:true});
console.log(`Packed ${Object.keys(manifest.sprites).length} sprites into ${Object.keys(manifest.atlases).length} bounded PNG atlases.`);
