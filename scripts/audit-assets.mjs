// Read-only verification. Never regenerates assets or overwrites QA evidence.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import {palettes,scenePixels,colorize,remapPortrait} from '../src/art.ts';
import {iconPixels} from '../src/icon-art.ts';
import {rooms} from '../src/world.ts';
const root=new URL('../',import.meta.url),assets=new URL('public/assets/',root);
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await fs.readFile(new URL('src/generated/atlas.json',root),'utf8'));
assert.deepEqual(manifest.palettes,palettes);assert(manifest.maxSize<=2048);assert(manifest.padding>=2);
const images=new Map();
for(const [id,a] of Object.entries(manifest.atlases)){
 assert(/^assets\/atlases\/[a-z0-9-]+\.png$/.test(a.file));const img=PNG.sync.read(await fs.readFile(new URL('public/'+a.file,root)));images.set(id,img);
 assert.equal(img.width,a.width);assert.equal(img.height,a.height);assert(a.width<=manifest.maxSize&&a.height<=manifest.maxSize);
 const allowed=new Set(palettes[a.palette].map(c=>parseInt(c.slice(1),16)));
 for(let i=0;i<img.data.length;i+=4){assert.equal(img.data[i+3],255);assert(allowed.has((img.data[i]<<16)|(img.data[i+1]<<8)|img.data[i+2]),'Unexpected atlas pixel');}
}
const portraits=['baseline','splice','radborn','clerk','technician','broker','scavenger','creature','guard'];
let checked=0;
for(const [palette,colors] of Object.entries(palettes)){
 const expected=Object.values(rooms).map(r=>({id:'room/'+r.id,width:256,height:144,area:r.zone,rgba:colorize(scenePixels(r),colors)}));
 for(const name of portraits){const img=PNG.sync.read(await fs.readFile(new URL('art-source/portraits/'+name+'.png',root)));expected.push({id:'portrait/'+name,width:64,height:64,area:'shared',rgba:remapPortrait(img.data,colors)})}
 for(const [name,pixels] of Object.entries(iconPixels))expected.push({id:'icon/'+name,width:16,height:16,area:'shared',rgba:colorize(pixels,colors)});
 for(const source of expected){
  const s=manifest.sprites[palette+'/'+source.id];assert(s,'Missing sprite '+source.id);const a=manifest.atlases[s.atlas],img=images.get(s.atlas),p=s.padding;
  assert.equal(s.palette,palette);assert.equal(a.palette,palette);assert.equal(s.area,source.area);assert.equal(a.group,source.area);assert.equal(s.width,source.width);assert.equal(s.height,source.height);assert.equal(p,manifest.padding);
  for(const n of [s.x,s.y,s.width,s.height,p])assert(Number.isInteger(n));assert(s.x>=p&&s.y>=p&&s.x+s.width+p<=img.width&&s.y+s.height+p<=img.height);
  for(const t of Object.values(manifest.sprites))if(s!==t&&s.atlas===t.atlas)assert(s.x+s.width+p<=t.x-t.padding||t.x+t.width+t.padding<=s.x-p||s.y+s.height+p<=t.y-t.padding||t.y+t.height+t.padding<=s.y-p,'Overlapping padded sprites');
  for(let y=-p;y<s.height+p;y++)for(let x=-p;x<s.width+p;x++){
   const from=(Math.max(0,Math.min(s.height-1,y))*s.width+Math.max(0,Math.min(s.width-1,x)))*4,to=((s.y+y)*img.width+s.x+x)*4;
   for(let c=0;c<4;c++)assert.equal(img.data[to+c],source.rgba[from+c],`Crop/extrusion mismatch ${source.id}`);
  }checked++;
 }
}
assert.equal(checked,Object.keys(manifest.sprites).length);
for(const dir of ['scenes','portraits'])await assert.rejects(fs.access(new URL(dir,assets)));
const shipped=await fs.readdir(new URL('atlases/',assets));assert.deepEqual(shipped.sort(),Object.values(manifest.atlases).map(a=>a.file.split('/').pop()).sort());
const provenance=JSON.parse(await fs.readFile(new URL('audio-provenance.json',assets),'utf8'));
const travel=JSON.parse(await fs.readFile(new URL('travel-audio-provenance.json',assets),'utf8'));
const combat=JSON.parse(await fs.readFile(new URL('combat-audio-provenance.json',assets),'utf8'));
const sounds=[];
for(const name of ['submit','error','hit','gunshot','heal','loot','death','ambience',...Object.keys(provenance.files),...Object.keys(travel.files),...Object.keys(combat.files)]){
 const data=await fs.readFile(new URL('sounds/'+name+'.wav',assets));
 if(provenance.files[name])assert.equal(sha(data),provenance.files[name].sha256);
 else if(combat.files[name])assert.equal(sha(data),combat.files[name].sha256);
 else if(travel.files[name])assert.equal(sha(data),travel.files[name].sha256);
 else assert.equal(sha(data),sha(await fs.readFile(new URL('art-source/sounds/'+name+'.wav',root))));
 assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WAVE');
 let fmt,pcm;for(let p=12;p+8<=data.length;){const id=data.toString('ascii',p,p+4),size=data.readUInt32LE(p+4);assert(p+8+size<=data.length);if(id==='fmt ')fmt=data.subarray(p+8,p+8+size);if(id==='data')pcm=data.subarray(p+8,p+8+size);p+=8+size+(size%2)}
 assert(fmt&&pcm);assert.equal(fmt.readUInt16LE(0),1);assert.equal(fmt.readUInt16LE(2),1);assert.equal(fmt.readUInt16LE(14),16);assert.equal(fmt.readUInt32LE(4),provenance.files[name]?44100:22050);
 let peak=0;for(let i=0;i<pcm.length;i+=2)peak=Math.max(peak,Math.abs(pcm.readInt16LE(i)));assert(peak<32767);sounds.push({name,peak,sha256:sha(data)});
}
assert.deepEqual((await fs.readdir(new URL('sounds/',assets))).sort(),sounds.map(s=>s.name+'.wav').sort());
const music=JSON.parse(await fs.readFile(new URL('music/provenance.json',assets),'utf8'));
const musicData=await fs.readFile(new URL('music/'+music.file,assets));
assert.equal(sha(musicData),music.sha256);assert.equal(musicData.toString('ascii',0,4),'RIFF');
assert.equal(musicData.readUInt16LE(22),2);assert.equal(musicData.readUInt32LE(24),32000);
let musicPeak=0;for(let i=44;i<musicData.length;i+=2)musicPeak=Math.max(musicPeak,Math.abs(musicData.readInt16LE(i)));
assert(musicPeak>0&&musicPeak<32767);
for(const offset of [0,2])assert(Math.abs(musicData.readInt16LE(44+offset)-musicData.readInt16LE(musicData.length-4+offset))<1200,'Synth loop has a discontinuous seam');
const licensed=JSON.parse(await fs.readFile(new URL('music/incompetech.json',assets),'utf8'));
const mp3=await fs.readFile(new URL('music/dark-fog.mp3',assets));
assert.equal(sha(mp3),licensed.sha256);assert(mp3.length>1000000);assert.equal(mp3.toString('ascii',0,3),'ID3');
assert.equal(licensed.isrc,'USUAN1300031');assert.equal(licensed.license,'CC BY 4.0');
const fishingArt=JSON.parse(await fs.readFile(new URL('fishing-art-provenance.json',assets),'utf8'));
for(const [file,entry] of Object.entries(fishingArt.files)){const data=await fs.readFile(new URL(file,assets));assert.equal(sha(data),entry.sha256);const img=PNG.sync.read(data);assert.equal(img.width,entry.width);assert.equal(img.height,entry.height);if(file.includes('atlas')){assert.equal(img.width,img.height);assert(img.width>=1024)}}
const runArt=JSON.parse(await fs.readFile(new URL('run-art-provenance.json',assets),'utf8'));for(const [file,entry] of Object.entries(runArt.files)){const data=await fs.readFile(new URL(file,assets));assert.equal(sha(data),entry.sha256);const img=PNG.sync.read(data);assert.equal(img.width,entry.width);assert.equal(img.height,entry.height)}
const credits=await fs.readFile(new URL('ATTRIBUTION.md',assets),'utf8');for(const text of ['Dark Fog','Kevin MacLeod','https://creativecommons.org/licenses/by/4.0/'])assert(credits.includes(text));
assert.deepEqual((await fs.readdir(new URL('music/',assets))).sort(),['dark-fog.mp3','incompetech.json','provenance.json','under-pressure.wav']);
console.log(JSON.stringify({passed:true,sprites:checked,atlases:images.size,nativeRoom:[256,144],maxSize:manifest.maxSize,padding:manifest.padding,sounds,music:{title:licensed.title,sha256:licensed.sha256,retainedSynth:{title:music.title,peak:musicPeak,sha256:music.sha256}}},null,2));
