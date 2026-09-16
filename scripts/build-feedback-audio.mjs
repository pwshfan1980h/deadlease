// Original offline synth: conversational radio chirps and a weightier level fanfare.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const rate=22050,files={},dir=new URL('../public/assets/sounds/',import.meta.url);
function tone(pcm,at,length,freq,gain,{sweep=0,rich=false}={}){
 for(let i=0;i<Math.ceil(length*rate);i++){const t=i/rate,u=t/length,j=Math.round(at*rate)+i;if(j>=pcm.length)break;
  const phase=2*Math.PI*(freq*t+sweep*t*t/(2*length)),env=Math.min(1,t/.012)*Math.min(1,(length-t)/.06)*Math.exp(-u*.8);
  pcm[j]+=gain*env*(Math.sin(phase)+(rich?.26:.12)*Math.sin(2*phase)+.08*Math.sin(3*phase));
 }
}
async function write(name,pcm,peakTarget){
 const peak=Math.max(...pcm.map(Math.abs)),scale=peakTarget/peak;const out=Buffer.alloc(44+pcm.length*2);
 out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(pcm.length*2,40);
 let sum=0;for(let i=0;i<pcm.length;i++){const v=pcm[i]*scale;sum+=v*v;out.writeInt16LE(Math.round(v*32767),44+i*2)}
 await fs.writeFile(new URL(name+'.wav',dir),out);files[name]={sha256:createHash('sha256').update(out).digest('hex'),peak:Math.round(peakTarget*32767),duration:pcm.length/rate,rms:Math.sqrt(sum/pcm.length)};
}
for(const [index,notes] of [[392,523,466,587],[440,392,523,659],[349,466,523,466]].entries()){
 const pcm=new Float64Array(Math.round(.72*rate));notes.forEach((f,i)=>tone(pcm,[0,.13,.27,.43][i],i===3?.25:.115,f,.26,{sweep:i%2?-30:45}));await write('npc-reply-'+(index+1),pcm,.42);
}
const fanfare=new Float64Array(Math.round(1.85*rate));
for(const [i,f] of [293.66,349.23,440,587.33].entries()){tone(fanfare,i*.17,.32,f,.28,{rich:true});tone(fanfare,i*.17,.3,f/2,.15,{rich:true})}
for(const f of [146.83,293.66,440,587.33])tone(fanfare,.68,1.1,f,f<200?.27:.16,{rich:true});
await write('level-up',fanfare,.84);
await fs.writeFile(new URL('../public/assets/feedback-audio-provenance.json',import.meta.url),JSON.stringify({creator:'FREEBORN / original synthesized feedback',source:'scripts/build-feedback-audio.mjs',sampleRate:rate,format:'16-bit mono PCM',files},null,2)+'\n');console.log('Built three reply chirps and one level-up fanfare.');
