import {it,expect,vi} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {Sound} from '../src/audio';
it('uses only verified Helton Yan mecha combat cues with shipped credit and change disclosure',()=>{
 const paths:string[]=[];vi.stubGlobal('Audio',class{volume=0;loop=false;currentTime=0;constructor(path:string){paths.push(path)}play(){return Promise.resolve()}pause(){}});
 try{const sound=new Sound();sound.play('gunshot');sound.play('hit');sound.play('death');expect(paths).toEqual(['./assets/sounds/helton-rapid.wav','./assets/sounds/helton-hit.wav','./assets/sounds/helton-death.wav']);sound.close();
 for(const p of paths)expect(existsSync('public/'+p)).toBe(true);
 const credits=readFileSync('public/assets/ATTRIBUTION.md','utf8');for(const text of ['Helton Yan','https://heltonyan.itch.io/retro-mecha-sfx','https://heltonyan.itch.io/pixelcombat','https://creativecommons.org/licenses/by/4.0/','44.1','No further'])expect(credits).toContain(text);
 }finally{vi.unstubAllGlobals()}
});

import {travelProfile,defaultPreferences} from '../src/audio';
import {createGame,command,enemyFor} from '../src/engine';
it('chooses travel Foley from actual transitions, with ladder, hazard, fatigue and retreat precedence',()=>{
 const g=createGame();expect(travelProfile(g,g,'look')).toBeNull();
 const steps=command(g,'south').state;expect(travelProfile(g,steps,'south')).toMatchObject({surface:'stone',rate:1});
 const below=command(steps,'down').state;expect(travelProfile(steps,below,'down')).toMatchObject({surface:'ladder'});
 const danger=command(steps,'south').state;expect(travelProfile(steps,danger,'south')).toMatchObject({arrival:'danger'});
 const back=command(danger,'flee').state;expect(travelProfile(danger,back,'flee')).toMatchObject({rate:1.24});
 const tired=structuredClone(steps);tired.player.stamina=1;expect(travelProfile(g,tired,'s')?.rate).toBe(.82);
 const died=structuredClone(g);died.player.debt+=25;expect(travelProfile(steps,died,'flee')).toBeNull();
 for(const [room,surface] of [['pump','metal'],['quay-1','water'],['reed-1','mud'],['glass-1','glass'],['sump','water']]){const to=structuredClone(g);to.room=room;expect(travelProfile(g,to,'e')?.surface).toBe(surface)}
 const rad=structuredClone(g);rad.room='sump';expect(travelProfile(g,rad,'e')?.arrival).toBe('radiation');rad.encounter=enemyFor('sump');expect(travelProfile(g,rad,'e')?.arrival).toBe('danger');
 expect(travelProfile(steps,g,'n')?.arrival).toBe('refuge');
});
it('cycles footstep variations, interrupts prior movement, and respects mute and effects volume',()=>{
 const made:{path:string;volume:number;playbackRate:number;pause:ReturnType<typeof vi.fn>}[]=[];
 vi.stubGlobal('Audio',class{volume=0;loop=false;currentTime=0;playbackRate=1;pause=vi.fn();constructor(public path:string){made.push(this)}play(){return Promise.resolve()}});
 try{const sound=new Sound(),g=createGame(),next=command(g,'s').state;sound.apply({...defaultPreferences,master:.5,effects:.4});
 for(let i=0;i<4;i++)sound.travel(g,next,'s');
 expect(made.map(a=>a.path)).toEqual([1,2,3].map(v=>`./assets/sounds/travel-stone-${v}.wav`));expect(made[0].volume).toBe(.2);expect(made[0].pause).toHaveBeenCalled();
 sound.apply({...defaultPreferences,muted:true});sound.travel(next,command(next,'down').state,'down');expect(made).toHaveLength(3);expect(made.every(a=>a.volume===0)).toBe(true);sound.close();
 }finally{vi.unstubAllGlobals()}
});
it('fades the Incompetech battle track in and out, preserves its playhead, and stops immediately when muted',()=>{
 vi.useFakeTimers();
 const made:{path:string;volume:number;paused:boolean;currentTime:number;loop:boolean;play:ReturnType<typeof vi.fn>;pause:ReturnType<typeof vi.fn>}[]=[];
 vi.stubGlobal('Audio',class{volume=0;paused=true;currentTime=0;loop=false;play=vi.fn(()=>{this.paused=false;return Promise.resolve()});pause=vi.fn(()=>{this.paused=true});constructor(public path:string){made.push(this)}});
 try{const sound=new Sound();sound.apply({...defaultPreferences,master:.5,music:.4});sound.battle(true);vi.advanceTimersByTime(950);
 const a=made[0];expect(a.path).toBe('./assets/music/dark-fog.mp3');expect(a.loop).toBe(true);expect(a.volume).toBeCloseTo(.2);a.currentTime=12;
 sound.battle(true);vi.advanceTimersByTime(950);expect(a.currentTime).toBe(12);expect(a.play).toHaveBeenCalledTimes(1);
 sound.battle(false);vi.advanceTimersByTime(950);expect(a.volume).toBe(0);expect(a.paused).toBe(true);
 sound.battle(true);vi.advanceTimersByTime(200);sound.apply({...defaultPreferences,muted:true});expect(a.volume).toBe(0);expect(a.paused).toBe(true);expect(vi.getTimerCount()).toBe(0);
 sound.apply(defaultPreferences);vi.advanceTimersByTime(950);expect(a.paused).toBe(false);sound.close();expect(a.paused).toBe(true);expect(vi.getTimerCount()).toBe(0);
 }finally{vi.unstubAllGlobals();vi.useRealTimers()}
});

it('resumes requested ambience after unmuting, but keeps the title menu silent',()=>{
 const made:{path:string;paused:boolean}[]=[];
 vi.stubGlobal('Audio',class{volume=0;loop=false;currentTime=0;paused=true;constructor(public path:string){made.push(this)}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}});
 try{
  const sound=new Sound();sound.apply(defaultPreferences);expect(made).toHaveLength(0);
  sound.play('ambience');expect(made[0].paused).toBe(false);
  sound.apply({...defaultPreferences,muted:true});expect(made[0].paused).toBe(true);
  sound.apply(defaultPreferences);expect(made[0].paused).toBe(false);
  sound.close();sound.apply(defaultPreferences);expect(made[0].paused).toBe(true);
 }finally{vi.unstubAllGlobals()}
});

it('uses conversational chirps only for actual NPC replies, not data reads or rejected talk',()=>{
 const g=createGame();expect(command(g,'talk doctor').sound).toBe('npc-reply');expect(command(g,'talk clerk').sound).toBe('npc-reply');
 for(const text of ['status','look','jobs','talk nobody'])expect(command(g,text).sound).not.toBe('npc-reply');
 g.room='square';expect(command(g,'talk iona').sound).toBe('npc-reply');expect(command(g,'talk doctor').sound).not.toBe('npc-reply');
 g.room='sewer-0';g.rewards.push('mission:five-from-the-water:active',...Array.from({length:5},(_,i)=>'mission:five-from-the-water:'+(i+1)));expect(command(g,'report five-from-the-water').sound).toBe('npc-reply');
});
it('varies short reply phrases, interrupts old speech, and respects effect volume and mute',()=>{
 const made:{path:string;volume:number;pause:ReturnType<typeof vi.fn>;play:ReturnType<typeof vi.fn>}[]=[];
 vi.stubGlobal('Audio',class{volume=0;loop=false;currentTime=0;playbackRate=1;pause=vi.fn();play=vi.fn(()=>Promise.resolve());constructor(public path:string){made.push(this)}});
 try{const sound=new Sound();sound.apply({...defaultPreferences,master:.5,effects:.4});for(let i=0;i<4;i++)sound.play('npc-reply');
 expect(made.map(a=>a.path)).toEqual([1,2,3].map(i=>'./assets/sounds/npc-reply-'+i+'.wav'));expect(made[0].play).toHaveBeenCalledTimes(2);expect(made[0].pause).toHaveBeenCalled();expect(made.every(a=>a.volume===.2)).toBe(true);
 sound.apply({...defaultPreferences,muted:true});sound.play('npc-reply');expect(made.reduce((n,a)=>n+a.play.mock.calls.length,0)).toBe(4);sound.close();
 }finally{vi.unstubAllGlobals()}
});
it('plays one fanfare for a level gain, survives the next normal command, and cancels on pause, mute or death',()=>{
 vi.useFakeTimers();const made:{path:string;play:ReturnType<typeof vi.fn>;pause:ReturnType<typeof vi.fn>}[]=[];
 vi.stubGlobal('Audio',class{volume=0;loop=false;currentTime=0;playbackRate=1;play=vi.fn(()=>Promise.resolve());pause=vi.fn();constructor(public path:string){made.push(this)}});
 try{const sound=new Sound(),g=createGame(),after=structuredClone(g);after.player.level=3;
 const result={state:after,changed:true,messages:[],sound:'loot',sounds:[{cue:'attack-impact',delay:140}]};
 sound.sequence(result,g);sound.sequence(command(after,'look'),after);vi.advanceTimersByTime(600);const cue=made.find(a=>a.path.endsWith('/level-up.wav'))!;expect(cue.play).toHaveBeenCalledTimes(1);
 sound.sequence(command(after,'status'),after);vi.advanceTimersByTime(1000);expect(cue.play).toHaveBeenCalledTimes(1);
 sound.sequence(result,g);sound.close();vi.advanceTimersByTime(1000);expect(cue.play).toHaveBeenCalledTimes(1);expect(cue.pause).toHaveBeenCalled();
 sound.sequence(result,g);sound.apply({...defaultPreferences,muted:true});vi.advanceTimersByTime(1000);expect(cue.play).toHaveBeenCalledTimes(1);
 sound.apply(defaultPreferences);sound.sequence(result,g);const dead=structuredClone(after);dead.run.status='dead';sound.sequence({state:dead,changed:true,messages:[],sound:'death'},after);vi.advanceTimersByTime(1000);expect(cue.play).toHaveBeenCalledTimes(1);
 sound.close();expect(vi.getTimerCount()).toBe(0);
 }finally{vi.unstubAllGlobals();vi.useRealTimers()}
});
it('ships unclipped distinct chirps and a longer, stronger fanfare with silent endpoints',()=>{
 const inspect=(name:string)=>{const b=readFileSync('public/assets/sounds/'+name+'.wav');const rate=b.readUInt32LE(24);const samples=Array.from({length:(b.length-44)/2},(_,i)=>b.readInt16LE(44+2*i));return {duration:samples.length/rate,peak:Math.max(...samples.map(Math.abs)),first:samples[0],last:samples.at(-1)}};
 const chirp=inspect('npc-reply-1'),fanfare=inspect('level-up');expect(chirp.duration).toBeCloseTo(.72);expect(fanfare.duration).toBeCloseTo(1.85);expect(fanfare.peak).toBeGreaterThan(chirp.peak*1.9);
 for(const name of ['npc-reply-1','npc-reply-2','npc-reply-3','level-up']){const a=inspect(name);expect(a.peak).toBeLessThan(32767);expect(a.first).toBe(0);expect(a.last).toBe(0)}
});
