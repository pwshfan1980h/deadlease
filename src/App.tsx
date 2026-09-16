import {ailments,doctors} from './medicine';
import {CharacterName,TranscriptText} from './Transcript';
import {RunEnd} from './RunEnd';
import {freshIdentity} from './runs';
import {TimingGame,ItemDiscovery} from './TimingGame';
import type {Challenge,TimingOutcome} from './challenges';
import {PauseMenu} from './PauseMenu';
import {objectsHere,objectCommands} from './roomObjects';
import {TitleAtmosphere,useImpactFeedback} from './Motion';
import {Ending} from './Ending';
import {Minimap} from './Minimap';
import {Inventory} from './Inventory';
import {deliveryRoutes} from './courier';
import {placeBundle,type Placement} from './backpack';
import {useState,useRef,useEffect,type KeyboardEvent} from 'react';
import {createGame,command,engageVisitor,arrival,journal,intent,HELP,type Game} from './engine';
import {classes,abilities,maxHP,maxStamina,xpForLevel} from './progression';
import {SKILLS,BALANCE} from './config';
import {items} from './items';
import {rooms,zones} from './world';
import {palettes} from './visual-data';
import {SaveRepository,IndexedDBDriver,encode,decode,type Backup,type StorageDriver} from './saves';
import {Sound,defaultPreferences,type Preferences} from './audio';
import {Scene,Portrait,EnemyPortrait} from './visuals';
import {scenePaintings,warmScene} from './paintings';
import {RoomActivity,type Visitor} from './roaming';
import {ClinicIntake,type IntakePanel} from './ClinicIntake';
type Panel='Atlas'|'Inventory'|'Progression'|'Journal'|'Settings'|'Help';
const panels:{name:Panel;command:string}[]=[{name:'Atlas',command:'map'},{name:'Inventory',command:'inventory'},{name:'Progression',command:'skills'},{name:'Journal',command:'journal'},{name:'Settings',command:'settings'},{name:'Help',command:'help'}];
const commonCommands=['status','talk doctor','treat all','implants','upgrade dermal weave','upgrade adrenal regulator','upgrade targeting optic','accept spare parts','report spare parts','spare','accept surrender','depart','missions','jobs','deliver parcel',...Object.keys(deliveryRoutes).map(id=>'accept '+id),'view','map surface','map sewers','map local','map world','map fog on','map fog off','map labels on','map labels off','map hazards on','map hazards off','pause','menu','help','look','stats','skills','journal','inventory','map','settings','attack','aim','brace','cover','heal','flee','rest','scrounge','take all','save','load','load auto','export','import','mute','up','down','go north','go south','go east','go west','go up','go down','install component','give key commons','give key syndicate','resolve erase','resolve disclose'];
export function completions(prefix:string,g:Game,visitor?:Visitor|null){return [...commonCommands,...objectCommands(g.room),...(visitor?['inspect '+visitor.name,...(visitor.role==='neutral'?['talk '+visitor.name]:['attack '+visitor.name])]:[]),...Object.keys(items).flatMap(id=>['equip '+id,'buy '+id,'sell '+id,'inspect '+id,'deliver '+id]),...classes[g.player.className].abilities.flatMap(id=>['use '+id,'learn '+id,'inspect '+id]),...SKILLS.map(s=>'train '+s.toLowerCase()),...['clerk','technician','broker','warden','archivist','postkeeper'].map(n=>'talk '+n)].filter(c=>c.startsWith(prefix.toLowerCase()))}
function download(raw:string,name:string){const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function App({initialGame,storageDriver}:{initialGame?:Game;storageDriver?:StorageDriver}){
 const [game,setGame]=useState<Game|null>(initialGame??null),[panel,setPanel]=useState<Panel>('Atlas'),[prefs,setPrefs]=useState<Preferences>(defaultPreferences),[entry,setEntry]=useState(''),[logs,setLogs]=useState<string[]>(initialGame?arrival(initialGame):[]),[notice,setNotice]=useState(''),[booted,setBooted]=useState(false),[saving,setSaving]=useState(false),[blocked,setBlocked]=useState(false),[backups,setBackups]=useState<Backup[]>([]);
 const [visitor,setVisitor]=useState<Visitor|null>(null);const visitorRef=useRef<Visitor|null>(null);
 const [activityVersion,setActivityVersion]=useState(0);
 const [atTitle,setAtTitle]=useState(!initialGame),[creating,setCreating]=useState(false);
 const [intakePanel,setIntakePanel]=useState<IntakePanel>(null),[intakeStep,setIntakeStep]=useState<'identity'|'training'>('identity'),[finalizing,setFinalizing]=useState(false),[intakeError,setIntakeError]=useState('');
 const previousGame=useRef<Game|null>(null);const [recovering,setRecovering]=useState(false);
 const [name,setName]=useState('Mara'),[origin,setOrigin]=useState('Baseline'),[cls,setClass]=useState('Enforcer'),[bonus,setBonus]=useState('Tech');
 const gameRef=useRef(game),repo=useRef<SaveRepository|null>(null),driver=useRef<StorageDriver|null>(null),audio=useRef<Sound|null>(null),input=useRef<HTMLInputElement>(null),file=useRef<HTMLInputElement>(null),logEl=useRef<HTMLDivElement>(null),follow=useRef(true),manualScroll=useRef(false),history=useRef<string[]>([]),histIndex=useRef(0),queue=useRef(Promise.resolve()),blockedRef=useRef(false);
 const [panelOpen,setPanelOpen]=useState(false);
 const [timing,setTiming]=useState<{challenge:Challenge;text:string;source:Game}|null>(null);const timingRef=useRef<typeof timing>(null);
 const [discovery,setDiscovery]=useState<{item:string;first:boolean}|null>(null);const lastFlavor=useRef('');
 const [pauseOpen,setPauseOpen]=useState(false);const pauseRef=useRef(false);
 const [inventoryOpen,setInventoryOpen]=useState(false);
 const [mapOpen,setMapOpen]=useState(false);const [endingOpen,setEndingOpen]=useState(false);
 const [travelFade,setTravelFade]=useState<'out'|'in'|'loading'|''>('');const traveling=useRef(false);
 const [travelDirection,setTravelDirection]=useState('south');
 const [pageHidden,setPageHidden]=useState(()=>typeof document!=='undefined'&&document.hidden);
 useEffect(()=>{const update=()=>setPageHidden(document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update)},[]);
 const showImpacts=useImpactFeedback(prefs.motion&&!pauseOpen&&!pageHidden&&!atTitle&&!creating&&!recovering&&!inventoryOpen&&!mapOpen&&!endingOpen);
 const mounted=useRef(true);useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[]);
 const [mapRequest,setMapRequest]=useState<{text:string;serial:number}|null>(null);
 const append=(messages:string[])=>setLogs(old=>[...old,...messages].slice(-BALANCE.logLimit));
 function error(e:unknown){setNotice(String(e instanceof Error?e.message:e));}
 useEffect(()=>{
  let live=true;audio.current=new Sound();
  (async()=>{try{
   const d=storageDriver??new IndexedDBDriver();driver.current=d;const r=new SaveRepository(d);repo.current=r;
   const pref=await d.read('preferences');if(pref){try{const p=JSON.parse(pref);if((p.motion===undefined||typeof p.motion==='boolean')&&Object.hasOwn(palettes,p.palette)&&typeof p.muted==='boolean'&&['master','effects','ambience'].every(k=>typeof p[k]==='number'&&p[k]>=0&&p[k]<=1)&&(p.music===undefined||(typeof p.music==='number'&&p.music>=0&&p.music<=1))&&[14,15,16,18].includes(p.fontSize)){if(live)setPrefs({...defaultPreferences,...p})}}catch{}}
   if(!initialGame&&await d.read('auto')!==undefined){try{const loaded=await r.load('auto');if(live){setGame(loaded);gameRef.current=loaded;setLogs(['AUTOSAVE / Journey resumed.',...arrival(loaded)])}}catch(e){if(live){blockedRef.current=true;setBlocked(true);error(e)}}}
  }catch(e){if(live)error('Local storage unavailable. Play remains available; export regularly. '+String(e))}finally{if(live)setBooted(true)}})();
  return()=>{live=false;audio.current?.close()};
 },[initialGame,storageDriver]);
 useEffect(()=>{const root=document.documentElement;root.dataset.palette=prefs.palette;const names=['soot','gunmetal','ash','bone','amber','red','green','teal'];names.forEach((n,i)=>root.style.setProperty('--'+n,palettes[prefs.palette][i]));root.style.setProperty('--font-size',prefs.fontSize+'px');audio.current?.apply(prefs);if(booted&&driver.current)void driver.current.update('preferences',()=>({value:JSON.stringify(prefs)})).catch(error)},[prefs,booted]);
 useEffect(()=>{audio.current?.battle(!atTitle&&!creating&&!!game?.encounter)},[game?.encounter?.id,booted,atTitle,creating]);
 useEffect(()=>{if(atTitle&&booted)document.querySelector<HTMLButtonElement>('.title-menu button:not(:disabled)')?.focus()},[atTitle,booted]);
 useEffect(()=>{if(!atTitle&&!pauseOpen&&!intakePanel&&!inventoryOpen&&!mapOpen)input.current?.focus()},[atTitle,pauseOpen,intakePanel,booted,inventoryOpen,mapOpen]);
 useEffect(()=>{if(follow.current&&logEl.current)logEl.current.scrollTop=logEl.current.scrollHeight},[logs]);
 useEffect(()=>{const el=logEl.current;if(!el||typeof ResizeObserver==='undefined')return;const observer=new ResizeObserver(()=>{if(follow.current)el.scrollTop=el.scrollHeight});observer.observe(el);return()=>observer.disconnect()},[atTitle,!!game]);
 useEffect(()=>{
  if(atTitle||!game)return;
  const escape=(event:globalThis.KeyboardEvent)=>{
   if(event.key!=='Escape'||event.defaultPrevented||event.repeat||pauseRef.current||document.querySelector('dialog[open]'))return;
   const target=event.target;
   if(target instanceof Element&&target.closest('select,textarea')&&target!==input.current)return;
   event.preventDefault();
   if(panelOpen){setPanelOpen(false);input.current?.focus();return}
   if(traveling.current||finalizing)return;
   pauseRef.current=true;setPauseOpen(true);setNotice('');audio.current?.close();
  };
  window.addEventListener('keydown',escape);
  return()=>window.removeEventListener('keydown',escape);
 },[atTitle,!!game,panelOpen,finalizing]);
 function closePause(){pauseRef.current=false;setPauseOpen(false);audio.current?.play('ambience');audio.current?.battle(!creating&&!recovering&&!!gameRef.current?.encounter);input.current?.focus()}
 useEffect(()=>{
  visitorRef.current=null;setVisitor(null);
  if(!booted||atTitle||creating||recovering||!gameRef.current||gameRef.current.run.status==='dead'||gameRef.current.encounter)return;
  const room=gameRef.current.room,activity=new RoomActivity(rooms[room]);
  const timer=setInterval(()=>{
   const current=gameRef.current;
   if(!current||current.run.status==='dead'||pauseRef.current||traveling.current||current.room!==room||current.encounter||blockedRef.current||document.hidden||document.querySelector('dialog[open],.reference-panel:not([hidden]) .settings'))return;
   const event=activity.advance(250);if(!event)return;
   if(event.type==='departure'){visitorRef.current=null;setVisitor(null);append([event.visitor.departure]);return}
   if(event.visitor.role==='hostile'){
    const result=engageVisitor(current,event.visitor.id);append(result.messages);
    if(result.changed){commit(result.state);audio.current?.battle(!!result.state.encounter);audio.current?.sequence(result);showImpacts(result);deathExperience(current,result.state)}
    // Even a lethal opening strike must not leave this room's timer running.
    clearInterval(timer);setActivityVersion(v=>v+1);
   }else {append([event.visitor.arrival]);visitorRef.current=event.visitor;setVisitor(event.visitor)}
  },250);
  return()=>clearInterval(timer);
 },[booted,atTitle,creating,recovering,game?.room,game?.encounter?.id,activityVersion]);
 useEffect(()=>{if(!timing&&!discovery&&!document.querySelector('dialog[open]'))input.current?.focus()},[timing,discovery]);
 useEffect(()=>{if(!booted||creating||!game||game.run.status==='dead')return;let active=true;const id=game.run.id;const timer=setInterval(()=>{void repo.current?.terminal(id).then(ended=>{if(active&&ended&&gameRef.current?.run.id===id&&gameRef.current.run.status==='alive'){const before=gameRef.current;resetActivity();commit(ended);deathExperience(before,ended);setNotice('This run ended in another session. Its record is preserved.')}}).catch(error)},1000);return()=>{active=false;clearInterval(timer)}},[booted,creating,game?.run.id,game?.run.status]);
 function clearInteractions(){timingRef.current=null;setTiming(null);setDiscovery(null);lastFlavor.current=''}
 function finishTiming(outcome:TimingOutcome){const pending=timingRef.current;if(!pending)return;timingRef.current=null;setTiming(null);if(gameRef.current!==pending.source){setNotice('The situation changed. Try the action again.');return}void run(pending.text,outcome)}
 function resetActivity(){visitorRef.current=null;setVisitor(null);setActivityVersion(v=>v+1)}
 const save=(slot:string,g:Game)=>{
  if(!repo.current){setNotice('Storage unavailable. Export JSON to keep this journey.');return Promise.resolve()}
  setSaving(true);const next=queue.current.then(()=>repo.current!.save(slot,g));queue.current=next.catch(()=>{});return next.then(()=>{if(slot==='manual')setNotice('Manual save written.')}).catch(e=>{if(slot==='auto'){blockedRef.current=true;setBlocked(true)}error(e)}).finally(()=>setSaving(false));
 };
 function commit(g:Game,auto=true){gameRef.current=g;setGame(g);if(auto&&!blockedRef.current)void save('auto',g)}
 async function load(slot:string){if(traveling.current)return;manualScroll.current=false;follow.current=true;try{await queue.current;if(!repo.current)throw Error('Storage unavailable. Import an exported save.');const loaded=await repo.current.load(slot);clearInteractions();resetActivity();commit(loaded,false);setAtTitle(false);setCreating(false);setRecovering(false);setIntakePanel(null);setInventoryOpen(false);setMapOpen(false);previousGame.current=null;if(slot==='auto'){blockedRef.current=false;setBlocked(false)}if(pauseRef.current)closePause();setLogs(['LOADED / '+slot,...arrival(loaded)]);setNotice('Loaded '+slot+' save.');input.current?.focus()}catch(e){error(e)}}
 async function run(text:string,resolution?:TimingOutcome):Promise<string[]|undefined>{
  const g=gameRef.current;if(!g||g.run.status==='dead'||pauseRef.current||timingRef.current||discovery||traveling.current||endingOpen)return;const cmd=text.trim().toLowerCase();if(!cmd)return;manualScroll.current=false;follow.current=true;
  if(cmd==='pause'){setPanelOpen(false);pauseRef.current=true;setPauseOpen(true);setNotice('');audio.current?.close();return}
  if(creating){
   setEntry('');
   if(cmd==='talk clerk'||cmd==='talk registrar'){append(['› '+text,'CLINIC CLERK / “Let’s put a name to that face.”']);setIntakeError('');setIntakePanel(intakeStep)}
   else if(cmd==='menu')returnToMenu();
   else if(cmd==='look')append(['› '+text,'A clerk waits beside your bed, an open register in one hand.']);
   else append(['› '+text,'CLINIC CLERK / “A moment. We need to finish your discharge.” Type talk clerk.']);
   return;
  }
  if(recovering){
   setEntry('');
   if(cmd==='talk clerk'||cmd==='talk registrar'){append(['› '+text]);setIntakePanel('recovery')}
   else if(cmd==='menu')returnToMenu();
   else append(['› '+text,'CLINIC CLERK / “Before you go—your discharge.” Type talk clerk.']);
   return;
  }
  if(!resolution){history.current.push(text);histIndex.current=history.current.length;}setEntry('');audio.current?.battle(!!g.encounter);audio.current?.play('ambience');
  if(mapOpen){return ['Close the map with Tab or Escape before acting.']}
  if(cmd==='map'||cmd.startsWith('map ')){if(g.encounter){append(['The map stays folded during an encounter.']);return}}
  if(cmd==='map'){append(['› '+text]);openMap();return}
  if(cmd==='view'){
   const picture=document.querySelector<HTMLDialogElement>('.room-panel .art-dialog');
   append(['› '+text,...(picture?[]:['There is no enlarged artwork for this location.'])]);picture?.showModal();return;
  }
  if(cmd.startsWith('map ')){
   const option=cmd.slice(4),valid=/^(surface|sewers|local|world)$/.test(option)||/^(fog|labels|hazards)( (on|off))?$/.test(option);
   const place=g.discovered.find(id=>id===option||rooms[id].name.toLowerCase()===option);
   append(['› '+text,...(!valid&&!place?['Map: surface, sewers, local, world, fog/labels/hazards on/off, or a discovered place name.']:[])]);
   if(valid||place){setPanel('Atlas');setPanelOpen(false);setMapOpen(true);setMapRequest(old=>({text:place?'place '+place:option,serial:(old?.serial??0)+1}))}return;
  }
  if(['inventory','inv','i'].includes(cmd)){setPanel('Inventory');setPanelOpen(false);setInventoryOpen(true);append(['› '+text]);return}
  if(['skills','journal','settings','audio','help'].includes(cmd)){setPanelOpen(true);setPanel(({map:'Atlas',inventory:'Inventory',skills:'Progression',journal:'Journal',settings:'Settings',audio:'Settings',help:'Help'} as Record<string,Panel>)[cmd]);append(['› '+text]);if(['settings','audio'].includes(cmd))void repo.current?.backups().then(setBackups).catch(error);return}
  if(cmd==='menu'){returnToMenu();return}
  if(cmd==='save'){await save('manual',g);return}if(cmd==='load'||cmd==='load auto'){await load(cmd==='load'?'manual':'auto');return}
  if(cmd==='export'){try{download(encode(g),'freeborn-turn-'+g.turns+'.json');setNotice('Exported valid JSON.')}catch(e){error(e)}return}
  if(cmd==='import'){file.current?.click();return}
  if(cmd==='mute'){setPrefs(p=>({...p,muted:!p.muted}));return}
  if(cmd.startsWith('palette ')){const key=cmd.slice(8);if(Object.hasOwn(palettes,key))setPrefs(p=>({...p,palette:key}));else setNotice('Palette: original, ember or tidal.');return}
  if(cmd.startsWith('volume ')){const [,key,value]=cmd.split(' '),n=Number(value);if(['master','effects','ambience','music'].includes(key)&&value!==undefined&&Number.isFinite(n)&&n>=0&&n<=100)setPrefs(p=>({...p,[key]:n/100}));else setNotice('volume master/effects/ambience/music 0–100');return}
  const occupant=visitorRef.current;
  if(occupant){
   if(cmd==='inspect '+occupant.name||cmd==='inspect visitor'||cmd==='inspect target'){append(['› '+text,occupant.description]);return}
   if(cmd==='talk '+occupant.name){append(['› '+text,occupant.speech??'It watches you without answering.']);return}
   if(cmd==='attack '+occupant.name||cmd==='a '+occupant.name||['attack','a','attack target'].includes(cmd)){
    const result=engageVisitor(g,occupant.id,true);append(['› '+text,...result.messages]);
    if(result.changed){resetActivity();commit(result.state);audio.current?.battle(!!result.state.encounter);audio.current?.sequence(result);showImpacts(result);deathExperience(g,result.state)}
    return;
   }
  }
  const result=command(g,text,{interactive:true,timing:resolution});
  if(result.challenge){const pending={challenge:result.challenge,text,source:g};timingRef.current=pending;setTiming(pending);audio.current?.cancelEffects();showImpacts({state:g,changed:false,messages:[],sound:''});if(result.challenge.kind==='fishing')audio.current?.play('travel-water-1',.85);return}
  if(result.flavor){if(lastFlavor.current===result.flavor.id)result.messages[0]=result.flavor.again;lastFlavor.current=result.flavor.id}else if(result.changed)lastFlavor.current='';
  if(result.discovery)setDiscovery(result.discovery);
  const moved=result.state.room!==g.room&&result.state.run.status==='alive';
  const reduced=!prefs.motion||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(moved){const from=rooms[g.room],to=rooms[result.state.room];setTravelDirection(to.layer!==from.layer?(to.layer<from.layer?'down':'up'):to.x!==from.x?(to.x>from.x?'east':'west'):(to.y>from.y?'south':'north'));}
  if(moved){traveling.current=true;setTravelFade('loading');await warmScene(result.state.room);if(!mounted.current)return;if(!reduced){setTravelFade('out');await new Promise(resolve=>setTimeout(resolve,160));if(!mounted.current)return;}}
  if(result.changed)commit(result.state);
  if(!g.rewards.includes('freeborn')&&result.state.rewards.includes('freeborn'))setEndingOpen(true);
  audio.current?.battle(!!result.state.encounter);if(!audio.current?.travel(g,result.state,cmd)||result.sounds?.length)audio.current?.sequence(result);
  showImpacts(result);deathExperience(g,result.state);
  if(moved){if(!reduced){setTravelFade('in');await new Promise(resolve=>setTimeout(resolve,220));if(!mounted.current)return;}setTravelFade('');traveling.current=false;}
  append(['› '+text,...result.messages,...(/^look(?: around)?$/.test(cmd)&&occupant?['Here now: '+occupant.name+'. '+occupant.description]:[])]);input.current?.focus();return result.messages;
 }
 async function finishIntake(){
  if(finalizing)return;setFinalizing(true);setIntakeError('');
  try{
   const identity=freshIdentity(),g=createGame(name,origin,cls,bonus,identity.seed,identity.id);await queue.current;
   if(previousGame.current&&repo.current)await repo.current.recover('manual',previousGame.current);
   resetActivity();commit(g);previousGame.current=null;setCreating(false);setIntakePanel(null);setNotice('');setPanelOpen(false);setPanel('Atlas');
   setLogs(['CLINIC CLERK / “'+g.player.name+'. Right. Your things are by the door. Iona is waiting in Toll Square.”','CLINIC CLERK / “Need money? Read the jobs board by the door. Paid runs, whenever you need them.”']);
   audio.current?.play('submit');audio.current?.play('ambience');
  }catch(e){setIntakeError(e instanceof Error?e.message:String(e))}finally{setFinalizing(false)}
 }
 function deathExperience(before:Game,after:Game){
  if(before.run.status==='dead'||after.run.status!=='dead')return;clearInteractions();resetActivity();audio.current?.battle(false);
  setInventoryOpen(false);setMapOpen(false);setRecovering(true);setIntakePanel(null);setIntakeError('');setEntry('');setPanelOpen(false);setPanel('Atlas');
 }
 function dismissIntake(){
  setIntakePanel(null);
  if(intakePanel==='backstory')setLogs(['CLINIC CLERK / “Easy. Stay with me. Can you tell me who you are?”','Type talk clerk.']);
  if(intakePanel==='death')setLogs(['CLINIC CLERK / “'+gameRef.current?.player.name+'? You’re back. Let me check your record.”','Type talk clerk.']);
  if(intakePanel==='recovery'){setRecovering(false);append(['CLINIC CLERK / “You’re clear to go.”'])}
  input.current?.focus();
 }
 function returnToMenu(){
  clearInteractions();
  pauseRef.current=false;setPauseOpen(false);setPanelOpen(false);
  if(creating){const previous=previousGame.current;gameRef.current=previous;setGame(previous);setLogs(previous?arrival(previous):[]);previousGame.current=null}
  setCreating(false);setRecovering(false);setIntakePanel(null);setInventoryOpen(false);setMapOpen(false);setAtTitle(true);setNotice('');audio.current?.close();
 }
 function openMap(){
  if(gameRef.current?.run.status==='dead'||pauseRef.current||traveling.current||atTitle||creating||recovering||inventoryOpen||gameRef.current?.encounter||document.querySelector('dialog[open]')){setNotice('The map is available while exploring.');return}
  setPanelOpen(false);setPanel('Atlas');setMapRequest(old=>({text:'world',serial:(old?.serial??0)+1}));setMapOpen(true);
 }
 function key(e:KeyboardEvent<HTMLInputElement>){
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();histIndex.current=Math.max(0,Math.min(history.current.length,histIndex.current+(e.key==='ArrowUp'?-1:1)));setEntry(history.current[histIndex.current]??'')}
  if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();openMap();return}
  if(e.code==='Space'&&e.ctrlKey&&entry.trim()&&game){const options=completions(entry,game,visitor);if(options.length){e.preventDefault();setEntry(options[0]);if(options.length>1)setNotice('Completions: '+options.slice(0,5).join(' · '))}}
  if(e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();logEl.current?.scrollBy({top:e.key==='PageUp'?-220:220});follow.current=e.key==='PageDown'}
 }
 async function importFile(f:File|undefined){if(!f||traveling.current)return;manualScroll.current=false;follow.current=true;try{if(f.size>BALANCE.maxSaveBytes)throw Error('Save file exceeds one megabyte.');const raw=await f.text(),g=decode(raw);await queue.current;if(repo.current)await repo.current.import(raw,'manual');clearInteractions();resetActivity();commit(g);setAtTitle(false);setCreating(false);setRecovering(false);setIntakePanel(null);setInventoryOpen(false);setMapOpen(false);previousGame.current=null;if(pauseRef.current)closePause();setLogs(['IMPORTED / Valid browser save.',...arrival(g)]);setNotice('Imported valid save into manual slot and loaded it.')}catch(e){error(e)}if(file.current)file.current.value=''}
 async function recover(slot='auto'){if(!game||!repo.current)return;try{await queue.current;await repo.current.recover(slot,game);if(slot==='auto'){blockedRef.current=false;setBlocked(false)}setNotice(slot+' recovered. Previous bytes retained in quarantine.')}catch(e){error(e)}}
 async function newTenant(){
  clearInteractions();await queue.current;if(gameRef.current?.run.status==='dead'&&(blockedRef.current||!repo.current)){setNotice('Keep this run record: restore storage and retry saving before starting the next patient. You can export the record.');return}previousGame.current=gameRef.current;
  const preview=createGame('Unknown patient');resetActivity();commit(preview,false);
  setRecovering(false);setName('');setOrigin('Baseline');setClass('Enforcer');setBonus('Tech');setEntry('');setIntakeError('');setIntakeStep('identity');setIntakePanel('backstory');setCreating(true);setAtTitle(false);setNotice('');setPanelOpen(false);setPanel('Atlas');setLogs([]);audio.current?.close();audio.current?.play('ambience');
 }
 useEffect(()=>{if(!game)return;for(const id of [game.room,...Object.values(rooms[game.room].exits)])void warmScene(id)},[game?.room]);
 function actionButton(text:string,label=text,unavailable=false,reason?:string){return <button key={text} type="button" title={reason} disabled={unavailable||!!travelFade||pauseOpen||!!timing||!!discovery||mapOpen||inventoryOpen||endingOpen||game?.run.status==='dead'} onClick={()=>{follow.current=true;void run(text)}}>{label}</button>}
 const p=game?.player,r=game?rooms[game.room]:rooms.clinic;
 return <div className={"app "+(atTitle?"at-title":"playing")} data-paused={pauseOpen} data-motion={prefs.motion?"on":"off"} data-page-hidden={pageHidden}>

 <input hidden ref={file} type="file" accept=".json,application/json" aria-label="Import save file" onChange={e=>void importFile(e.target.files?.[0])}/>
 {notice&&<div className={'notice '+(blocked?'danger':'')} role="status">{notice}</div>}
 {atTitle?<main className="title-screen">
  <img className="title-art" src={scenePaintings.clinic} alt=""/>
  <TitleAtmosphere/>
  <div className="title-menu"><h1>FREEBORN<span>.</span></h1><p>They brought you back to work. Find a way to live.</p>
   <nav aria-label="Main menu" onKeyDown={e=>{if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const options=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));const i=options.indexOf(document.activeElement as HTMLButtonElement);options[(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length]?.focus()}}>
    {game&&<button className="title-action" onClick={()=>{setAtTitle(false);setNotice('');audio.current?.play('ambience');audio.current?.battle(!!game.encounter)}}>{game.run.status==='dead'?'Run record':'Continue'}</button>}
    <button className="title-action" disabled={!booted} onClick={()=>void newTenant()}>New game</button>
    <button onClick={()=>void load('manual')} disabled={!booted}>Load game</button>
    <button onClick={()=>file.current?.click()}>Import save</button>
    <button disabled={!booted} aria-pressed={prefs.motion} onClick={()=>setPrefs(p=>({...p,motion:!p.motion}))}>Motion: {prefs.motion?'on':'off'}</button>
   </nav><p className="title-keys">↑↓ choose · Enter confirm</p>
  </div>
 </main>:game?<>
 <div className="district-bar"><span>{zones[r.zone].name.toUpperCase()}</span><span>{game.encounter?'ENCOUNTER ACTIVE':r.safe?'GUARDED REFUGE':'EXPLORING'} · TURN {game.turns}</span></div>
 <main className="play-grid"><div className="play-column">
 <section className={"room-panel travel-"+travelFade} aria-busy={!!travelFade} data-travel-direction={travelDirection}>
  <div className="room-title"><div><h2>{r.name}</h2></div><span className={'pill '+(r.safe&&!game.encounter?'teal':'amber')}>{game.encounter?'L'+game.encounter.level:r.safe?'SAFE':r.layer<0?'BELOW':'OUTSIDE'}</span></div>
  <div className={"room-body"+(game.encounter?" in-combat":"")}><Scene room={r} palette={prefs.palette} caption={false}/></div>
 </section>

 <section className="terminal"><div className="section-heading"><span>TRANSCRIPT</span><span className="muted">PgDn ↓</span></div><div className="log" ref={logEl} role="log" aria-label="Field log" aria-live="polite" onWheel={()=>{manualScroll.current=true}} onTouchMove={()=>{manualScroll.current=true}} onPointerDown={e=>{if(!(e.target as HTMLElement).closest('button'))manualScroll.current=true}} onScroll={()=>{const el=logEl.current;if(el&&manualScroll.current)follow.current=el.scrollHeight-el.scrollTop-el.clientHeight<32}}>{logs.map((line,i)=><p key={i} className={line.startsWith('›')?'log-command':''}><TranscriptText text={line} playerName={game.player.name}/></p>)} <section className="room-occupants" aria-label="Room occupants and items">
  <div className="scene-contents">
  {creating&&<p className="room-presence">A clerk waits beside your bed.</p>}
  {!creating&&(r.npc||r.guard)&&<div className="npc room-presence">
   {r.npc&&<div><CharacterName name={r.npc==='warden'&&r.guard?r.guard.split(' — ')[0]:({technician:'Iona',broker:'Moth',archivist:'Sen',postkeeper:'Ada'}[r.npc]??r.npc)}/></div>}
   {r.guard&&r.npc!=='warden'&&!game.encounter&&!objectsHere(game.room).some(object=>game.rewards.includes('alarm:'+object.id))&&<div><CharacterName name={r.guard.split(' — ')[0]}/></div>}
  </div>}
  {!creating&&doctors[r.id]&&<span className="room-presence"><CharacterName name={doctors[r.id].name} tone="clinic"/></span>}
  {!creating&&Object.keys(game.loot[game.room]??{}).length>0&&<ul className="ground-items" aria-label="Items on the ground">{Object.entries(game.loot[game.room]).filter(([,count])=>count>0).map(([item,count])=><li key={item}>{item}{count>1?" ×"+count:""}</li>)}</ul>}
  </div>
  {!game.encounter&&visitor&&<div className="visitor room-presence" aria-label="Passing visitor"><CharacterName name={visitor.name} tone={visitor.role==='hostile'?'enemy':'neutral'}/></div>}
  {r.radiation>0&&<span className="scene-hazard">RADIATION</span>}
  {game.encounter&&<div className="encounter"><div className="enemy-title"><EnemyPortrait name={game.encounter.name} palette={prefs.palette}/><div><strong><CharacterName name={game.encounter.name.toUpperCase()} hostile/></strong><p>HP {game.encounter.hp}/{game.encounter.maxHP}</p><p className="enemy-intent">{intent(game.encounter)}</p></div></div></div>}
 </section> {game.encounter&&<div className="transcript-combat">  <div className="command-options" aria-label="Combat commands">{actionButton('attack')}{actionButton('aim','aim',items[p!.weapon].skill!=='Firearms'||p!.stamina<(p!.className==='Surveyor'?BALANCE.surveyorAimCost:BALANCE.aimCost),'Requires a firearm and '+(p!.className==='Surveyor'?BALANCE.surveyorAimCost:BALANCE.aimCost)+' stamina')}{actionButton('brace')}{actionButton('cover','cover',p!.stamina<BALANCE.coverCost,'Requires '+BALANCE.coverCost+' stamina')}{actionButton('heal','heal',!p!.inventory['medical supplies']||(p!.hp===maxHP(p!)&&!game.bleed),'Requires medical supplies and missing HP or bleeding')}{actionButton('flee')}</div>
  <div className="ability-commands">{p!.abilities.map(id=><p className={(game.cooldowns[id]??0)>game.turns||p!.stamina<abilities[id].cost?'muted':''} key={id} title={abilities[id].description}>{actionButton('use '+id,abilities[id].name,(game.cooldowns[id]??0)>game.turns||p!.stamina<abilities[id].cost)}<small>{abilities[id].cost} STA{(game.cooldowns[id]??0)>game.turns?' · '+(game.cooldowns[id]-game.turns)+' turns':''}</small></p>)}</div></div>}{!recovering&&!game.encounter&&<div className="command-options world-actions" aria-label="Available commands">{creating?actionButton('talk clerk'):<> {actionButton('look around')}{actionButton('rest')}{r.npc&&actionButton('talk '+r.npc)}{doctors[r.id]&&actionButton('talk doctor')}{Object.keys(game.loot[game.room]??{}).length>0&&actionButton('take all')}{Object.keys(r.exits).map(d=>actionButton(({n:'north',s:'south',e:'east',w:'west'} as Record<string,string>)[d]??d))}</>}</div>}</div>

  <div className="panel-commands" aria-label="Panel commands">{panels.map(x=>actionButton(x.command,x.command,creating||recovering||(x.command==='map'&&!!game.encounter)))}{!creating&&actionButton('status')}</div>
 <form className="command-form" onSubmit={e=>{e.preventDefault();void run(entry)}}><span aria-hidden="true">›</span><label className="sr-only" htmlFor="command">Command</label><input id="command" ref={input} autoComplete="off" spellCheck={false} value={entry} onChange={e=>setEntry(e.target.value)} onKeyDown={key} placeholder={creating||recovering?'Type talk clerk…':'Type a command… try help'}/><span className="submit-hint" aria-hidden="true">↵</span></form><div className="command-hint">↑↓ history · Tab map · Ctrl+Space complete · Esc pause <span>{creating?'AWAITING DISCHARGE':saving?'SAVING…':blocked?'AUTOSAVE BLOCKED':'LOCAL AUTOSAVE'}</span></div></section>
 </div>
 <aside className="sidebar">{creating?<section className="player-card intake-record"><span className="eyebrow">CLINIC RECORD</span><h3>Unknown patient</h3></section>:<section className="player-card"><div className="player-identity"><Portrait name={p!.origin.toLowerCase()} palette={prefs.palette} label={p!.origin+' original portrait'}/><div><div className="eyebrow">SURVIVOR / LEVEL {p!.level}</div><h3>{p!.name}</h3><span className="small muted">{p!.origin} · {p!.className}</span></div><span className="level-number">{String(p!.level).padStart(2,'0')}</span></div><div className="resource"><label>HP {game.bleed>0&&<span className="red">· BLEED {game.bleed}</span>} <strong>{p!.hp}/{maxHP(p!)}</strong></label><meter aria-label="Health" min={0} max={maxHP(p!)} value={p!.hp}/></div><div className="resource stamina"><label>STAMINA <strong>{p!.stamina}/{maxStamina(p!)}</strong></label><meter aria-label="Stamina" min={0} max={maxStamina(p!)} value={p!.stamina}/></div><div className="resource rad" aria-label={"Radiation: "+p!.radiation+" out of 100"}><span aria-hidden="true">☢</span> <strong>{p!.radiation}</strong></div><div className="wallet"><span><b className="amber">{p!.credits}</b> credits</span>{p!.debt>0&&<span><b>{p!.debt}</b> clinic debt</span>}<span>{p!.inventory['medical supplies']??0} supplies</span></div><div className="body-status" aria-label="Lasting conditions">{p!.body.ailments.map(id=><span className="ailment" key={id} title={ailments[id].description}>{id}</span>)}{Object.entries(p!.body.implants).map(([id,n])=><span className="implant" key={id}>{id} {n}</span>)}</div><div className="small muted loadout">{p!.weapon} / {p!.armor??'no armor'}</div></section>}

 <section className="detail-panel reference-panel" aria-label={panel} hidden={!panelOpen}><div className="section-heading"><span>{panel==='Atlas'?'ESTUARY ATLAS':panel.toUpperCase()}</span><span className="muted">Esc close</span></div>
 {panel==='Progression'&&<><p className="amber">{p!.points} training points · {p!.xp} XP {p!.level<10?' / '+xpForLevel(p!.level+1)+' next':' / LEVEL CAP'}</p><p className="small">{classes[p!.className].passive}</p><div className="skill-grid">{SKILLS.map(s=><div className="skill-line" key={s}><span>{s} <b>{p!.skills[s]}/5</b></span>{p!.skills[s]<5&&actionButton('train '+s.toLowerCase(),'Train '+s,p!.points<1)}</div>)}</div>{classes[p!.className].abilities.map(id=>{const a=abilities[id],known=p!.abilities.includes(id);return <div className="list-card" key={id}><span className="eyebrow amber">TIER {a.level} · {a.cost} STA · {a.cooldown} ACTION COOLDOWN</span><h3>{a.name}</h3><p>{a.description}</p><p className="command-note">{known?'Learned':p!.level<a.level?'Unlocks at level '+a.level:<>{actionButton('learn '+id,'Learn '+a.name,p!.points<1)} · 1 point</>}</p></div>})}</>}
 {panel==='Journal'&&<>{journal(game).map((text,i)=><article className="list-card" key={i}><span className="eyebrow amber">{i===0?'DISTRICT STORY':'REGIONAL JOURNEY '+i}</span><p>{text}</p></article>)}{r.id==='crown-15'&&game.quests.ledger==='accepted'&&p!.inventory['master ledger']&&<div className="command-options"><code>resolve erase</code><code>resolve disclose</code></div>}</>}
 {panel==='Settings'&&<div className="settings"><label>Palette<select aria-label="Palette" value={prefs.palette} onChange={e=>setPrefs({...prefs,palette:e.target.value})}><option value="original">Noir · charcoal & rust</option><option value="ember">Ember · paper & violet</option><option value="tidal">Tidal · cold harbor</option></select></label><div className="swatches">{palettes[prefs.palette].map(c=><span key={c} style={{background:c}} title={c}/>)}</div><label>Text size<select value={prefs.fontSize} onChange={e=>setPrefs({...prefs,fontSize:Number(e.target.value)})}>{[14,15,16,18].map(n=><option key={n} value={n}>{n}px</option>)}</select></label><label className="checkbox"><input type="checkbox" checked={prefs.motion} onChange={e=>setPrefs({...prefs,motion:e.target.checked})}/> Atmospheric motion (respects reduced motion)</label><label className="checkbox"><input type="checkbox" checked={prefs.muted} onChange={e=>setPrefs({...prefs,muted:e.target.checked})}/> Mute all sound</label>{(['master','effects','ambience','music'] as const).map(k=><label key={k}>{k} · {Math.round(prefs[k]*100)}%<input type="range" min={0} max={100} value={prefs[k]*100} onChange={e=>setPrefs({...prefs,[k]:Number(e.target.value)/100})}/></label>)}<p className="small muted">Combat uses original synthesized cues for guns, blades, impacts, electricity and fire, with separate enemy responses; travel uses original terrain-specific Foley, with faster retreats and slower exhausted footsteps. Traversal fades with directional movement. Title atmosphere and the death pulse can be disabled with Atmospheric motion. Reduced-motion preferences also disable them. Music fades in during encounters and out after combat. Sound starts after interaction and falls back silently if unavailable.</p><p className="small">Battle music: <a href="https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1300031">“Dark Fog”</a> by Kevin MacLeod (incompetech.com), licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Original recording; playback volume and fades applied in-game.</p><p className="small"><a href="https://heltonyan.itch.io/retro-mecha-sfx">FREE Retro Mecha SFX</a> · <a href="https://heltonyan.itch.io/pixelcombat">FREE Pixel Combat SFX</a> by Helton Yan, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Moonsec converted these to 16-bit mono 44.1 kHz; Deadlease copies them unchanged. <a href="./assets/ATTRIBUTION.md">Full asset credits</a>.</p><h3>Local saves</h3><div className="action-row"><button onClick={()=>void save('manual',game)}>Manual save</button><button onClick={()=>void load('manual')}>Load manual</button><button onClick={()=>void load('auto')}>Load autosave</button><button onClick={()=>void run('export')}>Export JSON</button><button onClick={()=>file.current?.click()}>Import JSON</button></div><p className="small muted">Import validates before replacing the manual slot. Autosave follows world actions. Corrupt slots are retained and cannot be silently overwritten.</p>{blocked&&<button className="primary" onClick={()=>void recover()}>Recover autosave from current game</button>}<button onClick={()=>void recover('manual')}>Recover manual from current game</button><button onClick={()=>void newTenant()}>Create another survivor</button><button onClick={()=>void repo.current?.backups().then(setBackups).catch(error)}>Refresh quarantine</button>{backups.map(b=><div className="list-card" key={b.id}><p>{b.slot} · {new Date(b.at).toLocaleString()}</p><button onClick={()=>download(b.raw,'freeborn-quarantine-'+b.id+'.json')}>Download preserved bytes</button></div>)}</div>}
 {panel==='Help'&&<div className="help">{HELP.split('\n').map((s,i)=><p key={i}>{s}</p>)}<p>Type a command and press Enter. Use Tab to toggle the minimap, Ctrl+Space to complete a command and ↑/↓ to recall previous commands. Type commands or use the action buttons. Hidden opportunities still need observation and experimentation.</p><p>At the clinic: talk clerk → south → east → talk technician. Scrap Alley lies south of Clinic Steps. At Clinic Steps, type down to enter the manhole; up returns to the street.</p><p>Art and sound: <a href="./assets/ATTRIBUTION.md">asset credits and licenses</a>. All game assets remain local.</p></div>}
 </section></aside></main></>:null}
 {game?.run.status==='dead'&&!atTitle&&!creating&&<RunEnd game={game} busy={saving} blocked={blocked||!repo.current} onRetry={()=>void recover('auto')} onNew={()=>void newTenant()} onTitle={returnToMenu} onExport={()=>download(encode(game),'freeborn-ended-'+game.run.id+'.json')}/>}
 {timing&&!atTitle&&<TimingGame challenge={timing.challenge} onFinish={finishTiming}/>}
 {discovery&&!atTitle&&<ItemDiscovery {...discovery} onClose={()=>{setDiscovery(null);input.current?.focus()}}/>}
 {pauseOpen&&game&&!atTitle&&<PauseMenu name={creating?'Unknown patient':game.player.name} location={r.name} prefs={prefs} onPrefs={setPrefs} onResume={closePause} onTitle={returnToMenu} onSave={()=>save('manual',game)} onLoad={load} onExport={()=>{try{download(encode(game),'freeborn-turn-'+game.turns+'.json');setNotice('Exported valid JSON.')}catch(e){error(e)}}} onImport={()=>file.current?.click()} busy={saving} canSave={!creating&&!recovering} blocked={blocked} notice={notice}/>}
 {endingOpen&&game&&<Ending name={game.player.name} onClose={()=>{setEndingOpen(false);input.current?.focus()}}/>}
 {mapOpen&&game&&!atTitle&&<Minimap game={game} palette={prefs.palette} request={mapRequest} onRequest={text=>setMapRequest(old=>({text,serial:(old?.serial??0)+1}))} onClose={()=>{setMapOpen(false);input.current?.focus()}}/>}
 {inventoryOpen&&game&&!atTitle&&<Inventory game={game} onClose={()=>{setInventoryOpen(false);input.current?.focus()}} onPlace={(key:string,at:Placement)=>{const current=gameRef.current;if(!current||current.run.status==='dead')return false;const next=structuredClone(current);if(!placeBundle(next.player,key,at))return false;commit(next);return true}} onCommand={run}/>}
 {creating&&<ClinicIntake panel={intakePanel} name={recovering?p!.name:name} origin={recovering?p!.origin:origin} cls={recovering?p!.className:cls} bonus={bonus} debt={p?.debt??0} busy={finalizing} error={intakeError} onName={setName} onOrigin={setOrigin} onClass={setClass} onBonus={setBonus} onDismiss={dismissIntake} onNext={()=>{if(!name.trim()){setIntakeError('The clerk waits for your name.');return}setIntakeError('');setIntakeStep('training');setIntakePanel('training')}} onBack={()=>{setIntakeStep('identity');setIntakePanel('identity')}} onFinish={()=>void finishIntake()}/> }
 </div>;
}
