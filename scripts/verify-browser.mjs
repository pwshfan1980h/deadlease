import {newGame} from './intake-helper.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {preview} from 'vite';
const evidence=await fs.mkdtemp(path.resolve('evidence/qa-production-'));
const manifest=JSON.parse(await fs.readFile('src/generated/atlas.json','utf8'));
await fs.mkdir(path.join(evidence,'tmp'));process.env.TMPDIR=path.join(evidence,'tmp');
const server=await preview({preview:{host:'127.0.0.1',port:4187,strictPort:true}});
const closeServer=()=>new Promise((resolve,reject)=>server.httpServer.close(e=>e?reject(e):resolve()));
let browser;
try { browser=await chromium.launch({headless:true}); } catch (error) { await closeServer(); throw error; }
const context=await browser.newContext({viewport:{width:1280,height:800}});
const page=await context.newPage();
const pngRequests=[];page.on('request',r=>{if(new URL(r.url()).pathname.endsWith('.png'))pngRequests.push(r.url())});
async function compact(){
 assert.equal(await page.getByLabel('Import save file').isVisible(),false);
 for(const selector of ['.command-form','.log']){
  const box=await page.locator(selector).boundingBox();assert(box&&box.y>=0&&box.y+box.height<=800,selector+' must fit 1280x800');
 }
 const painted=page.locator('.vignette .scene-painting');if(await painted.count()){await page.waitForFunction(()=>document.querySelector('.scene-painting img')?.naturalWidth>0);const scene=await painted.boundingBox();assert(scene.width>=140&&scene.height>=120)}else if(await page.locator('.vignette canvas').count()){const scene=await page.locator('.vignette canvas').boundingBox();assert.equal(scene.width,256);assert.equal(scene.height,144)}
 assert.equal(await page.locator('.masthead').count(),0);
}
async function crops(){
 await page.waitForFunction(()=>[...document.querySelectorAll('canvas[data-sprite]')].every(c=>c.getContext('2d').getImageData(0,0,1,1).data[3]===255));
 const correct=await page.evaluate(async m=>{
  const palette=document.documentElement.dataset.palette;
  for(const canvas of document.querySelectorAll('canvas[data-sprite]')){
   const s=m.sprites[palette+'/'+canvas.dataset.sprite],a=m.atlases[s.atlas];
   const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='./'+a.file});
   const expected=document.createElement('canvas');expected.width=s.width;expected.height=s.height;const ctx=expected.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(image,s.x,s.y,s.width,s.height,0,0,s.width,s.height);
   const pixels=canvas.getContext('2d').getImageData(0,0,s.width,s.height).data,reference=ctx.getImageData(0,0,s.width,s.height).data;
   if(!pixels.every((v,i)=>v===reference[i]))return false;
  }return true;
 },manifest);assert(correct,'Every visible atlas crop matches after palette switch');
}
async function stored(target=page){return target.evaluate(async()=>{
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('deadlease-v2',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 try{return await new Promise((resolve,reject)=>{const r=db.transaction('slots').objectStore('slots').get('auto');r.onsuccess=()=>resolve(JSON.parse(r.result));r.onerror=()=>reject(r.error)})}finally{db.close()}
})}
async function cmd(text,target=page){
 const count=await target.locator('.log').textContent();await target.getByRole('textbox',{name:'Command',exact:true}).fill(text);await target.getByRole('textbox',{name:'Command',exact:true}).press('Enter');if(await target.locator('.timing-strike[open]').count())await target.keyboard.press('Enter');
 await target.waitForFunction(before=>document.querySelector('.log')?.textContent!==before,count);
 await target.waitForFunction(()=>!document.querySelector('.command-hint').textContent.includes('SAVING…')&&document.querySelector('.room-panel')?.getAttribute('aria-busy')==='false');
}
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4187');
 assert.equal(await page.getByLabel('Import save file').isVisible(),false);
 await newGame(page);
 await page.getByRole('heading',{name:'Reclamation Clinic',exact:true}).waitFor();
 await compact();await crops();
 await cmd('map');assert.equal(await page.getByRole('button',{name:'Whole estuary',exact:true}).getAttribute('aria-pressed'),'true');await page.keyboard.press('Escape');
 await page.screenshot({path:path.join(evidence,'compact-clinic.png')});
 await cmd('s');await cmd('s');await page.getByText('STRIKE · a measured attack is next.',{exact:true}).first().waitFor();await compact();await crops();await page.screenshot({path:path.join(evidence,'compact-combat.png')});
 // Run seeds vary damage; finish the encounter instead of assuming three hits.
 for(let turns=0;turns<8&&await page.locator('.encounter').count();turns++)await cmd('attack');
 assert.equal(await page.locator('.encounter').count(),0,'Opening encounter defeated before map/loot checks');await cmd('take all');
 await cmd('map');await page.getByRole('button',{name:'Sewers',exact:true}).click();await page.getByRole('button',{name:'Surface',exact:true}).click();await page.keyboard.press('Escape');
 await cmd('settings');await page.getByLabel('Palette').selectOption('tidal');
 assert.equal(await page.locator('html').getAttribute('data-palette'),'tidal');await crops();
 await page.getByRole('button',{name:'Manual save',exact:true}).click();await page.getByText('Manual save written.',{exact:true}).waitFor();
 await page.screenshot({path:path.join(evidence,'browser-desktop.png'),fullPage:true});
 await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('heading',{name:'Scrap Alley',exact:true}).waitFor();assert.equal(await page.locator('html').getAttribute('data-palette'),'tidal');
 await cmd('settings');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON',exact:true}).click();const download=await downloadPromise;await download.saveAs(path.join(evidence,'browser-export.json'));
 await page.getByLabel('Import save file').setInputFiles(path.join(evidence,'browser-export.json'));await page.getByText('IMPORTED / Valid browser save.',{exact:true}).waitFor();assert.equal((await stored()).room,'alley');
 // Two genuine pages share this context/IndexedDB but retain independent save expectations.
 const stale=await page.context().newPage();await stale.goto('http://127.0.0.1:4187');await stale.getByRole('button',{name:'Continue',exact:true}).click();await stale.getByRole('heading',{name:'Scrap Alley',exact:true}).waitFor();
 await cmd('n');const latest=await stored();await cmd('e',stale);await stale.getByRole('status').filter({hasText:'changed in another session'}).waitFor();assert.deepEqual(await stored(),latest);await stale.close();await cmd('s');
 // Exercise real IndexedDB quarantine and explicit recovery in the browser.
 await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('deadlease-v2',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});await new Promise((resolve,reject)=>{const tx=db.transaction('slots','readwrite');tx.objectStore('slots').put('CORRUPT BROWSER TEST','auto');tx.oncomplete=resolve;tx.onerror=reject});db.close()});
 await page.reload();await page.getByRole('button',{name:'Load game',exact:true}).click();await page.getByRole('heading',{name:'Scrap Alley',exact:true}).waitFor();
 await cmd('settings');await page.getByRole('button',{name:'Recover autosave from current game',exact:true}).click();await page.getByText('auto recovered. Previous bytes retained in quarantine.',{exact:true}).waitFor();
 const backups=await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('deadlease-v2',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return await new Promise((resolve,reject)=>{const req=db.transaction('quarantine').objectStore('quarantine').getAll();req.onsuccess=()=>{db.close();resolve(req.result)};req.onerror=reject})});
 assert(backups.some(b=>b.raw==='CORRUPT BROWSER TEST'));
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(evidence,'browser-mobile.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile horizontal overflow');
 assert(pngRequests.length>0);assert(pngRequests.every(url=>url.includes('/assets/atlases/')||url.includes('/assets/paintings/')),'Production must request local atlases or paintings only');assert.deepEqual(errors,[]);await fs.writeFile(path.join(evidence,'browser-verification.json'),JSON.stringify({passed:true,errors,pngRequests,checks:['1280x800 compact layout','native atlas crops','palette crop switch','production atlas requests','cross-tab conflict','create','move','fight','loot','map layers','palette','manual save','autosave reload','export','import','IndexedDB quarantine/recovery','mobile overflow']},null,2));
 console.log('Evidence: '+evidence);
 console.log('PASS: real Chromium create/move/combat/map/palette/save/reload/export/import/mobile; no page errors.');
}finally{await browser.close();await closeServer()}
