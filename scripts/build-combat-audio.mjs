// Original synthesized combat Foley. No external samples or runtime synthesis cost.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const rate=22050,files={},dir=new URL('../public/assets/sounds/',import.meta.url);
for(const kind of ['pistol','rifle','blade','blunt','electric','fire','claw','drain','miss','impact','block','heal','windup','recover','revive']){
 let seed=6701+[...kind].reduce((n,c)=>n+c.charCodeAt(0),0),low=0,phase=0;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1};
 const length=['windup','drain','heal','revive'].includes(kind)?.7:.46,pcm=new Float64Array(Math.ceil(rate*length));
 for(let i=0;i<pcm.length;i++){
  const t=i/rate,n=noise();low=.88*low+.12*n;const attack=Math.min(1,t/.004),tail=Math.min(1,(length-t)/.025);let v=0;
  if(kind==='pistol'||kind==='rifle'){const pulses=kind==='rifle'?[0,.095]:[0];for(const at of pulses){const u=t-at;if(u>=0)v+=.38*n*Math.exp(-u*52)+.23*Math.sin(2*Math.PI*95*u)*Math.exp(-u*23)}}
  if(kind==='blade')v=.22*n*Math.sin(Math.PI*Math.min(1,t/.18))**2*Math.exp(-t*6)+.08*Math.sin(2*Math.PI*1250*t)*Math.exp(-t*22);
  if(kind==='blunt'||kind==='impact')v=.37*Math.sin(2*Math.PI*(90*t-65*t*t))*Math.exp(-t*24)+.4*low*Math.exp(-t*34);
  if(kind==='electric'){phase+=2*Math.PI*(170+850*t)/rate;v=.17*Math.sin(phase)*Math.exp(-t*5)+.14*n*(Math.sin(2*Math.PI*47*t)>.2?1:.15)*Math.exp(-t*9)}
  if(kind==='fire')v=.65*low*Math.sin(Math.PI*t/length)+.1*n*Math.exp(-t*7);
  if(kind==='claw')v=.26*n*Math.exp(-t*20)+.14*Math.sin(2*Math.PI*(210*t-180*t*t))*Math.exp(-t*15);
  if(kind==='drain')v=.22*Math.sin(2*Math.PI*(330*t-180*t*t))*Math.sin(Math.PI*t/length)+.2*low*Math.exp(-t*6);
  if(kind==='miss')v=.3*low*Math.sin(Math.PI*t/length)**2+.07*n*Math.sin(Math.PI*t/length)**3;
  if(kind==='block')v=.15*(Math.sin(2*Math.PI*630*t)+.5*Math.sin(2*Math.PI*947*t))*Math.exp(-t*13)+.15*n*Math.exp(-t*36);
  if(kind==='heal')v=.10*(Math.sin(2*Math.PI*330*t)+Math.sin(2*Math.PI*440*t))*Math.sin(Math.PI*t/length)**2;
  if(kind==='windup')v=.2*low*t/length+.1*Math.sin(2*Math.PI*(90*t+120*t*t))*Math.sin(Math.PI*t/length);
  if(kind==='revive')v=.09*(Math.sin(2*Math.PI*(220*t+220*t*t))+Math.sin(2*Math.PI*(330*t+330*t*t)))*Math.sin(Math.PI*t/length)**2+.18*low*Math.exp(-t*35);
  if(kind==='recover')v=.22*low*Math.exp(-t*9)+.035*n*Math.exp(-t*7);
  pcm[i]=Math.max(-.9,Math.min(.9,v*attack*tail));
 }
 const out=Buffer.alloc(44+pcm.length*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(pcm.length*2,40);
 let peak=0;pcm.forEach((v,i)=>{const sample=Math.round(v*32767);peak=Math.max(peak,Math.abs(sample));out.writeInt16LE(sample,44+i*2)});
 const name='attack-'+kind;await fs.writeFile(new URL(name+'.wav',dir),out);files[name]={sha256:createHash('sha256').update(out).digest('hex'),peak};
}
await fs.writeFile(new URL('../public/assets/combat-audio-provenance.json',import.meta.url),JSON.stringify({creator:'FREEBORN / original synthesized combat Foley',source:'scripts/build-combat-audio.mjs',sampleRate:rate,format:'16-bit mono PCM',files},null,2)+'\n');
console.log('Built '+Object.keys(files).length+' attack and response cues.');
