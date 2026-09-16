import {newGame} from './intake-helper.mjs';
import {chromium} from 'playwright';
import {preview} from 'vite';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createGame,enemyFor} from '../src/engine.ts';
import {fishingEnemyFor} from '../src/fishing.ts';
import {rooms} from '../src/world.ts';
import {encode} from '../src/saves.ts';
import {gainXP,xpForLevel} from '../src/progression.ts';
import {enemyPaintings} from '../src/paintings.ts';
const evidence=new URL('../evidence/noir-review/',import.meta.url);await fs.mkdir(evidence,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4189,strictPort:true}});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
await page.addInitScript(()=>{const Native=window.Audio;window.__sounds=[];window.Audio=class extends Native{constructor(src){super(src);window.__sounds.push(this)}}});
const shot=async name=>page.screenshot({path:new URL(name+'.png',evidence).pathname,fullPage:true});
const music=async()=>page.evaluate(()=>{const a=window.__sounds.find(a=>a.src.includes('/music/'));return a?{time:a.currentTime,volume:a.volume,paused:a.paused,ready:a.readyState,src:a.src}:null});
async function state(){return page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('deadlease-v2',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{return await new Promise((resolve,reject)=>{const r=db.transaction('slots').objectStore('slots').get('auto');r.onsuccess=()=>resolve(JSON.parse(r.result));r.onerror=()=>reject(r.error)})}finally{db.close()}})}
async function cmd(text){const n=await page.locator('.log-command').count();const box=page.getByRole('textbox',{name:'Command',exact:true});await box.fill(text);await box.press('Enter');if(await page.locator('.timing-strike[open]').count())await page.keyboard.press('Enter');await page.waitForFunction(n=>document.querySelectorAll('.log-command').length>n,n);await page.waitForFunction(()=>!document.querySelector('.command-hint').textContent.includes('SAVING…'))}
async function fits(){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');for(const selector of ['.command-form','.log']){const b=await page.locator(selector).boundingBox();assert(b&&b.y>=0&&b.y+b.height<=page.viewportSize().height,selector+' visible')}if(await page.locator('.scene-painting').count()){const b=await page.locator('.scene-painting').boundingBox();assert(Math.abs(b.width/b.height-16/9)<.01,'uncropped scene ratio')}}
async function fight(){for(let i=0;i<15;i++){const s=await state();if(!s.encounter)return;await cmd(s.player.hp<18&&s.player.inventory['medical supplies']?'heal':'attack')}throw Error('Combat failed to resolve')}
try{
 await page.goto('http://127.0.0.1:4189');await page.locator('.title-screen').waitFor();await shot('title-desktop');await newGame(page);await page.locator('.scene-painting img').evaluate(i=>i.decode());await fits();
 assert(await page.locator('.room-panel').evaluate(e=>e.scrollHeight===e.clientHeight),'clinic actions fit without scrolling');await shot('desktop-clinic');
 const input=page.getByRole('textbox',{name:'Command',exact:true});
 assert(await input.evaluate(e=>e===document.activeElement),'command starts focused');
 await input.press('Tab');assert(await page.locator('.minimap-dialog').isVisible(),'Tab opens minimap');assert(!(await input.evaluate(e=>e===document.activeElement)),'map captures focus');await page.keyboard.press('Tab');assert(!(await page.locator('.minimap-dialog').isVisible()),'Tab closes minimap');
 await page.keyboard.press('Escape');assert(await page.locator('.pause-menu').isVisible(),'Escape opens pause');await page.keyboard.press('Escape');assert(await input.evaluate(e=>e===document.activeElement),'Resume returns command focus');
 await input.fill('go sou');await input.press('Shift+Tab');assert.equal(await input.inputValue(),'go sou','Shift+Tab never completes');
 await input.focus();await input.press('Control+Space');assert.equal(await input.inputValue(),'go south');await input.press('Escape');assert(await page.locator('.pause-menu').isVisible());await page.keyboard.press('Escape');assert.equal(await input.inputValue(),'go south','Pause preserves command draft');
 await cmd('look');await input.press('ArrowUp');assert.equal(await input.inputValue(),'look');await input.press('ArrowDown');assert.equal(await input.inputValue(),'');
 await input.fill('menu');await input.press('Enter');await page.getByRole('button',{name:'New game',exact:true}).click();await page.keyboard.press('Escape');await input.fill('menu');await input.press('Enter');await page.getByRole('button',{name:'Continue',exact:true}).click();assert.equal((await state()).room,'clinic');
 checks.push('Keyboard focus, ordinary Tab/Shift+Tab, prefix completion, Escape, history, and cancelled new-game continuation');

 await page.getByRole('button',{name:'Enlarge Reclamation Clinic',exact:true}).click();assert(await page.getByRole('dialog',{name:'Reclamation Clinic',exact:true}).isVisible());await page.keyboard.press('Escape');assert(await page.getByRole('button',{name:'Enlarge Reclamation Clinic',exact:true}).evaluate(e=>e===document.activeElement));checks.push('Full scene / enlargement / Escape focus restoration');
 await cmd('talk clerk');await cmd('s');await page.locator('.scene-painting img').evaluate(i=>i.decode());await shot('desktop-steps');assert.equal(await page.locator('.movement button,.command-options button,.panel-commands button').count(),0);assert(await page.locator('.vertical-exit').filter({hasText:'down'}).isVisible());const turn=(await state()).turns;await cmd('map');assert.equal((await state()).turns,turn,'opening a panel costs no turn');await page.keyboard.press('Escape');await cmd('down');await cmd('map');assert.equal((await state()).room,'sewer-0');assert.equal(await page.getByRole('button',{name:'Sewers',exact:true}).getAttribute('aria-pressed'),'true');assert(await page.locator('.map-vertical').filter({hasText:'up'}).isVisible());await shot('desktop-undercroft');await page.keyboard.press('Escape');await cmd('up');await cmd('map');assert.equal((await state()).room,'steps');assert.equal(await page.getByRole('button',{name:'Surface',exact:true}).getAttribute('aria-pressed'),'true');await page.keyboard.press('Escape');checks.push('Typed Enter submission; no gameplay buttons; map panel costs no turn; manhole down/up round trip follows map floor');await cmd('s');await page.locator('.enemy-painting img').evaluate(i=>i.decode());await fits();await shot('desktop-combat');
 await page.waitForFunction(()=>window.__sounds.some(a=>a.src.includes('/music/dark-fog.mp3')&&!a.paused&&a.currentTime>0&&a.volume>.1));const before=await music();await cmd('look');assert((await music()).time>=before.time,'music does not restart each turn');
 const count=await page.evaluate(()=>window.__sounds.filter(a=>a.src.includes('/travel-')).length);await cmd('up');assert.equal(await page.evaluate(()=>window.__sounds.filter(a=>a.src.includes('/travel-')).length),count,'blocked movement has no footsteps');
 await cmd('flee');await page.waitForFunction(()=>window.__sounds.find(a=>a.src.includes('/music/'))?.paused);assert(await page.evaluate(()=>window.__sounds.some(a=>a.src.includes('/travel-')&&a.playbackRate===1.24)));checks.push('Ladders, danger, blocked movement, retreat pacing, continuous music, combat exit fade');
 await cmd('s');await fight();await cmd('take all');await cmd('n');await cmd('e');await cmd('talk technician');await cmd('s');await fight();await cmd('e');await fight();await cmd('e');await page.locator('.scene-painting img').evaluate(i=>i.decode());await shot('desktop-pump');await cmd('install component');await cmd('n');await cmd('give key commons');assert.equal((await state()).pump,'commons');checks.push('Natural new-game playthrough: both tutorial enemies, loot, pump repair, Commons ending');
 // Isolated fixture imports exercise every enemy image in its actual encounter UI.
 for(const [name,path] of Object.entries(enemyPaintings)){const resident=Object.values(rooms).find(r=>r.enemy===name),room=resident??rooms['sewer-0'],g=createGame();g.room=g.previous=room.id;g.encounter=resident?enemyFor(room.id):fishingEnemyFor(room.id,name);g.discovered.push(room.id);
  await page.getByLabel('Import save file').setInputFiles({name:'qa.json',mimeType:'application/json',buffer:Buffer.from(encode(g))});await page.waitForFunction(name=>document.querySelector('.enemy-painting img')?.alt===name,name);await page.locator('.enemy-painting img').evaluate(i=>i.decode());assert((await page.locator('.enemy-painting img').getAttribute('src')).endsWith(path.slice(2)));
 }
 await shot('desktop-drain-lurker');checks.push('All 25 enemy portraits loaded in live encounter UI');
 await cmd('settings');await page.getByLabel('Mute all sound').check();assert(await page.evaluate(()=>window.__sounds.every(a=>a.paused)));await page.getByLabel('Mute all sound').uncheck();await page.waitForFunction(()=>window.__sounds.find(a=>a.src.includes('/music/'))?.paused===false);
 await page.waitForFunction(()=>window.__sounds.find(a=>a.src.includes('/sounds/ambience.wav'))?.paused===false);
 const slider=page.getByRole('slider',{name:/music/i});await slider.fill('35');
 await page.waitForFunction(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('deadlease-v2',1);r.onsuccess=()=>resolve(r.result)});try{return await new Promise(resolve=>{const r=db.transaction('slots').objectStore('slots').get('preferences');r.onsuccess=()=>resolve(JSON.parse(r.result).music===.35)})}finally{db.close()}});
 await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await cmd('settings');assert.equal(await page.getByRole('slider',{name:/music/i}).inputValue(),'35');checks.push('Global mute, unmute, music preference persistence');

 // Progression fixture checks the typed gear/merchant/ability workflow in real React UI.
 const trained=createGame();gainXP(trained.player,xpForLevel(3));trained.player.inventory.salvage=1;
 await page.getByLabel('Import save file').setInputFiles({name:'progression.json',mimeType:'application/json',buffer:Buffer.from(encode(trained))});await page.getByRole('heading',{name:'Reclamation Clinic',exact:true}).waitFor();
 await cmd('inventory');assert(await page.locator('.inventory-dialog').isVisible());await page.keyboard.press('Escape');await cmd('buy knife');await cmd('equip knife');assert.equal((await state()).player.weapon,'knife');
 await cmd('sell salvage');assert.equal((await state()).player.inventory.salvage,undefined);
 await cmd('skills');assert.equal(await page.locator('.detail-panel button').count(),0);await cmd('train survival');await cmd('learn breach shot');assert.equal((await state()).player.skills.Survival,1);assert((await state()).player.abilities.includes('breach shot'));await shot('desktop-progression');
 await cmd('journal');await cmd('help');await cmd('map');assert.equal((await state()).turns,5);await page.keyboard.press('Escape');
 await cmd('s');await cmd('s');assert.equal(await page.locator('.encounter button:visible').count(),1,'only the artwork enlargement remains clickable in combat');await cmd('use breach shot');assert.equal((await state()).encounter,null);await cmd('take all');
 await input.fill('save');await input.press('Enter');await page.getByText('Manual save written.',{exact:true}).waitFor();await cmd('n');await input.fill('load');await input.press('Enter');await page.getByRole('heading',{name:'Scrap Alley',exact:true}).waitFor();assert.equal((await state()).room,'steps','loading manual does not silently overwrite autosave');
 checks.push('Typed inventory, buying, equipping, selling, training, learning, panel changes, combat ability, loot, manual save/load');
 // Larger text and narrower desktop keep the command dock and full scene aspect ratio.
 const g=createGame();await page.getByLabel('Import save file').setInputFiles({name:'clinic.json',mimeType:'application/json',buffer:Buffer.from(encode(g))});await page.getByRole('heading',{name:'Reclamation Clinic',exact:true}).waitFor();
 await cmd('settings');await page.setViewportSize({width:1024,height:720});await page.getByLabel('Text size').selectOption('18');await cmd('map');await fits();await shot('desktop-1024-large-text');await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});await page.locator('.scene-painting img').evaluate(i=>i.decode());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const b=await page.locator('.scene-painting').boundingBox();assert(Math.abs(b.width/b.height-16/9)<.01);await shot('mobile-clinic');await page.getByRole('button',{name:'Enlarge Reclamation Clinic',exact:true}).click();await shot('mobile-artwork');await page.keyboard.press('Escape');checks.push('1024 desktop / 18px text / 390px mobile / uncropped mobile modal');
 assert.deepEqual(errors,[]);await fs.writeFile(new URL('verification.json',evidence),JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve))}
