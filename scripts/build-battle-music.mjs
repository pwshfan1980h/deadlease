// Original 72 BPM, eight-bar synth composition. No samples, external music, or network.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const rate=32000,bpm=72,beat=60/bpm,duration=32*beat,n=Math.round(rate*duration);
const left=new Float64Array(n),right=new Float64Array(n),tau=Math.PI*2;
let seed=67072;
const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1};
function event(at,length,sample,pan=0){
 const start=Math.round(at*rate);let lp=0;
 for(let j=0;j<length*rate;j++){const t=j/rate;lp=.91*lp+.09*noise();const s=sample(t,lp);const i=(start+j)%n;left[i]+=s*(1-pan*.35);right[i]+=s*(1+pan*.35)}
}
// Quiet, harmonically stable industrial drone. Quantized frequencies and modulation
// complete whole cycles across the loop, keeping the seam continuous.
for(const [freq,amp,phase] of [[73.416,.052,0],[110,.027,1.3],[155.56,.011,2.1]]){
 const f=Math.round(freq*duration)/duration;
 for(let i=0;i<n;i++){const t=i/rate,breath=.7+.3*Math.cos(tau*t/duration*2+phase),s=amp*Math.sin(tau*f*t+phase)*breath;left[i]+=s;right[i]+=amp*Math.sin(tau*f*t+phase+.16)*breath}
}
for(let bar=0;bar<8;bar++){
 const root=[36.708,36.708,32.703,34.648,36.708,36.708,32.703,34.648][bar];
 for(const b of [0,2.5])event((bar*4+b)*beat,1.7,(t)=>{
  const env=Math.min(1,t/.04)*Math.exp(-t*2.7);
  return env*(.14*Math.sin(tau*root*t)+.035*Math.sin(tau*root*2*t)+.012*Math.sin(tau*root*3*t));
 });
 for(const b of [0,2])event((bar*4+b)*beat,.5,t=>.23*Math.sin(tau*(44*t+38*.018*(1-Math.exp(-t/.018))))*Math.exp(-t*13)*Math.min(1,t/.004));
 event((bar*4+2)*beat,.35,(t,ns)=>.16*ns*Math.exp(-t*23)*Math.min(1,t/.004)+.022*Math.sin(tau*184*t)*Math.exp(-t*28),.15);
 for(const b of [1,3,3.5])event((bar*4+b)*beat,.16,(t,ns)=>.065*ns*Math.exp(-t*38)*Math.min(1,t/.002),b===1?-.65:.65);
 // Sparse metallic minor-second motif; enough space to read and think.
 if(bar%2===0){const freq=bar===4?311.127:293.665;
  event((bar*4+1.5)*beat,2.8,t=>.033*(Math.sin(tau*freq*t)+.22*Math.sin(tau*freq*2.01*t))*Math.exp(-t*2)*Math.min(1,t/.015),-.4);
  event((bar*4+2.25)*beat,2,t=>.012*Math.sin(tau*freq*t)*Math.exp(-t*2.5)*Math.min(1,t/.03),.6);
 }
}
let peak=0;for(let i=0;i<n;i++){left[i]=Math.tanh(left[i]*1.25);right[i]=Math.tanh(right[i]*1.25);peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]))}
const out=Buffer.alloc(44+n*4);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(2,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*4,28);out.writeUInt16LE(4,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(n*4,40);
const gain=.67/peak;for(let i=0;i<n;i++){out.writeInt16LE(Math.round(left[i]*gain*32767),44+i*4);out.writeInt16LE(Math.round(right[i]*gain*32767),46+i*4)}
const dir=new URL('../public/assets/music/',import.meta.url);await fs.mkdir(dir,{recursive:true});await fs.writeFile(new URL('under-pressure.wav',dir),out);
await fs.writeFile(new URL('provenance.json',dir),JSON.stringify({title:'Under Pressure',creator:'Deadlease / original procedural synthesizer composition',source:'scripts/build-battle-music.mjs',bpm,bars:8,duration:n/rate,sampleRate:rate,channels:2,peak:.67,file:'under-pressure.wav',sha256:createHash('sha256').update(out).digest('hex'),notes:'Generated sine harmonics, deterministic filtered noise, synthesized percussion. No borrowed samples or music.'},null,2)+'\n');
console.log('Built Under Pressure: original 72 BPM stereo synth loop.');
