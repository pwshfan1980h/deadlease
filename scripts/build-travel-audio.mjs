// Original deterministic Foley synthesis. No third-party samples or runtime network access.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const rate=22050,dir=new URL('../public/assets/sounds/',import.meta.url),files={};
await fs.mkdir(dir,{recursive:true});
for(const surface of ['stone','metal','water','mud','glass','ladder','refuge','danger','radiation']){
 for(let variant=1;variant<=(['refuge','danger','radiation'].includes(surface)?1:3);variant++){
  let seed=67000+variant*137+[...surface].reduce((a,c)=>a+c.charCodeAt(0),0);
  const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1};
  const samples=new Float64Array(Math.floor(rate*1.12));
  const cue=['refuge','danger','radiation'].includes(surface);
  const times=cue?[0]:[0,.29+(variant-2)*.016,.62+(variant-2)*.023];
  for(const [step,start] of times.entries()){
   let low=0;
   for(let j=0;j<rate*.43;j++){
    const t=j/rate,index=Math.floor(start*rate)+j;if(index>=samples.length)break;
    const n=noise();low=low*.83+n*.17;
    const attack=Math.min(1,t/.007),body=Math.exp(-t*24),tail=Math.exp(-t*12);
    const pitch=(variant-2)*9+step*7;let v=0;
    if(surface==='stone')v=.28*low*body+.13*n*Math.exp(-t*65)+.14*Math.sin(2*Math.PI*(90+pitch)*t)*body;
    if(surface==='metal'||surface==='ladder')v=.11*n*body+.12*Math.sin(2*Math.PI*(surface==='ladder'?460+pitch:210+pitch)*t)*tail+.06*Math.sin(2*Math.PI*(717+pitch)*t)*Math.exp(-t*18);
    if(surface==='water')v=.40*low*Math.exp(-t*10)+.10*n*Math.exp(-t*19)+.07*Math.sin(2*Math.PI*(330*t-230*t*t))*Math.exp(-t*16);
    if(surface==='mud')v=.55*low*Math.exp(-t*17)+.10*Math.sin(2*Math.PI*(64+pitch)*t)*body;
    if(surface==='glass')v=.23*low*body+.09*n*Math.exp(-t*30)+.045*Math.sin(2*Math.PI*(1700+pitch)*t)*Math.exp(-t*18)+.03*Math.sin(2*Math.PI*2341*t)*tail;
    if(surface==='refuge')v=.10*(Math.sin(2*Math.PI*220*t)+.45*Math.sin(2*Math.PI*330*t))*Math.exp(-t*8);
    if(surface==='danger')v=.13*(Math.sin(2*Math.PI*65*t)+.4*Math.sin(2*Math.PI*69*t))*Math.exp(-t*7)+.07*low*tail;
    if(surface==='radiation')v=.12*n*Math.exp(-t*80)*(Math.sin(2*Math.PI*40*t)>0?1:0);
    samples[index]+=attack*v;
   }
  }
  const out=Buffer.alloc(44+samples.length*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(samples.length*2,40);
  let peak=0;for(let i=0;i<samples.length;i++){const value=Math.round(samples[i]*Math.min(1,(samples.length-i)/220)*32767);peak=Math.max(peak,Math.abs(value));out.writeInt16LE(value,44+i*2)}
  const name=`travel-${surface}-${variant}`;await fs.writeFile(new URL(name+'.wav',dir),out);files[name]={sha256:createHash('sha256').update(out).digest('hex'),peak};
 }
}
await fs.writeFile(new URL('../public/assets/travel-audio-provenance.json',import.meta.url),JSON.stringify({creator:'Deadlease / original procedural Foley',source:'scripts/build-travel-audio.mjs',sampleRate:rate,format:'16-bit mono PCM',files},null,2)+'\n');
console.log(`Built ${Object.keys(files).length} travel cues.`);
