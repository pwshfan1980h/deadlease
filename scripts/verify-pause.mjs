import {chromium} from 'playwright';
import {preview} from 'vite';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {newGame} from './intake-helper.mjs';
const out=new URL('../evidence/pause-menu/',import.meta.url);await fs.mkdir(out,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4196,strictPort:true}}),browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:3440,height:1440}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
await page.addInitScript(()=>{window.__soundEvents=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__soundEvents.push(this.src);return play.call(this)}});
const input=page.getByRole('textbox',{name:'Command',exact:true}),menu=page.locator('.pause-menu');
const button=name=>menu.getByRole('button',{name,exact:true});
async function settled(){await page.waitForFunction(()=>document.querySelector('.room-panel')?.getAttribute('aria-busy')==='false'&&!document.querySelector('.command-hint')?.textContent.includes('SAVING…'))}
async function cmd(text){await input.fill(text);await input.press('Enter');await settled()}
async function state(slot='auto'){return page.evaluate(async slot=>{const db=await new Promise(resolve=>{const r=indexedDB.open('deadlease-v2',1);r.onsuccess=()=>resolve(r.result)});try{return await new Promise(resolve=>{const r=db.transaction('slots').objectStore('slots').get(slot);r.onsuccess=()=>resolve(r.result?JSON.parse(r.result):null)})}finally{db.close()}},slot)}
async function open(){await input.press('Escape');await menu.waitFor();assert(await button('Resume').evaluate(e=>e===document.activeElement))}
async function resume(){await page.keyboard.press('Escape');await menu.waitFor({state:'detached'});assert(await input.evaluate(e=>e===document.activeElement))}
async function shot(name){await page.screenshot({path:new URL(name+'.png',out).pathname})}
try{
 await page.goto('http://127.0.0.1:4196/');await newGame(page,'Rhea');await settled();
 const initial=await state();await input.fill('inspect board');await open();await shot('3440-menu');
 await page.keyboard.press('ArrowDown');assert(await button('Settings').evaluate(e=>e===document.activeElement));await page.keyboard.press('Enter');
 await menu.getByLabel('Atmospheric motion',{exact:true}).uncheck();await menu.getByLabel('music volume',{exact:true}).fill('17');
 assert.equal(await page.locator('.app').getAttribute('data-motion'),'off');await page.keyboard.press('Escape');assert(await button('Resume').isVisible());await resume();assert.equal(await input.inputValue(),'inspect board');assert.deepEqual(await state(),initial);
 checks.push('Escape pauses without clearing draft or spending a turn; arrows/Enter and Escape back/resume work; settings update live');
 await input.press('Tab');await page.locator('.minimap-dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await menu.count(),0);await cmd('inventory');await page.locator('.inventory-dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await menu.count(),0);
 await cmd('help');await page.keyboard.press('Escape');assert.equal(await menu.count(),0);assert(await page.locator('.reference-panel').isHidden());await open();
 await button('Controls').press('Enter');assert((await menu.innerText()).includes('up / down'));await page.keyboard.press('Escape');
 for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await menu.evaluate(el=>el.contains(document.activeElement)))}
 checks.push('Map, inventory and reference panels close first without opening pause; focus remains inside pause');
 await button('Save & load').press('Enter');await button('Save game').press('Enter');await menu.getByRole('status').filter({hasText:'Manual save written.'}).waitFor();const saved=await state('manual');assert.deepEqual(saved,initial);
 const [download]=await Promise.all([page.waitForEvent('download'),button('Export save').press('Enter')]);const path=await download.path();const exported=JSON.parse(await fs.readFile(path,'utf8'));assert.equal(exported.player.name,'Rhea');
 await button('Load manual save').press('Enter');await page.keyboard.press('Escape');assert(await button('Save game').isVisible());await page.keyboard.press('Escape');await resume();
 await cmd('s');assert.equal((await state()).room,'steps');await open();await button('Save & load').press('Enter');await button('Load manual save').press('Enter');await button('Load save').press('Enter');await menu.waitFor({state:'detached'});await page.getByRole('heading',{name:'Reclamation Clinic',exact:true}).waitFor();
 checks.push('Manual save/export preserve character; load confirmation cancels safely and confirmed load restores the selected save');
 await open();await button('Save & load').press('Enter');await page.getByLabel('Import save file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{invalid')});assert(await menu.isVisible());await menu.getByRole('status').waitFor();
 await page.getByLabel('Import save file').setInputFiles({name:'rhea.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await menu.waitFor({state:'detached'});await settled();assert.deepEqual(await state(),initial);checks.push('Invalid import leaves pause and game intact; valid import resumes the imported character');
 await cmd('s');await cmd('s');assert(await page.locator('.encounter').isVisible());const combat=await state();await open();const sounds=await page.evaluate(()=>window.__soundEvents.length);const log=await page.locator('.log').innerText();
 await page.clock.install();await page.clock.runFor(180000);assert.deepEqual(await state(),combat);assert.equal(await page.locator('.log').innerText(),log);assert.equal(await page.evaluate(()=>window.__soundEvents.length),sounds);await page.clock.resume();await shot('3440-combat-paused');await resume();assert(await page.locator('.encounter').isVisible());assert((await page.evaluate(()=>window.__soundEvents.length))>sounds,'Resume restarts the current soundscape');
 checks.push('Combat remains unchanged while paused for three simulated minutes; audio stops and resumes with the encounter');
 await cmd('flee');await settled();await open();const idle=await state(),idleLog=await page.locator('.log').innerText();await page.clock.runFor(300000);assert.deepEqual(await state(),idle);assert.equal(await page.locator('.log').innerText(),idleLog);checks.push('Five simulated minutes of pause produce no roaming arrivals, attacks, transcript chatter or save changes');
 for(const [w,h] of [[1280,800],[390,844]]){await page.setViewportSize({width:w,height:h});await shot(w+'-menu');assert(await menu.evaluate(el=>el.getBoundingClientRect().width<=innerWidth&&el.getBoundingClientRect().height<=innerHeight));await button('Settings').press('Enter');await shot(w+'-settings');assert(await menu.evaluate(el=>el.scrollWidth<=el.clientWidth));await page.keyboard.press('Escape')}
 await button('Return to title').press('Enter');assert(await button('Stay here').evaluate(e=>e===document.activeElement));await page.keyboard.press('Escape');assert(await button('Resume').isVisible());await button('Return to title').press('Enter');await button('Return to title').press('Enter');await page.getByRole('button',{name:'Continue',exact:true}).waitFor();assert.equal(await menu.count(),0);await page.getByRole('button',{name:'Continue',exact:true}).press('Enter');await open();await button('Settings').press('Enter');assert.equal(await menu.getByLabel('music volume').inputValue(),'17');assert.equal(await menu.getByLabel('Atmospheric motion').isChecked(),false);
 await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).press('Enter');await open();await button('Settings').press('Enter');assert.equal(await menu.getByLabel('music volume').inputValue(),'17');checks.push('Compact layouts fit; return-to-title confirmation, Continue, and settings after reload work');
 // A new intake is never saved as a playable finalized character.
 await page.keyboard.press('Escape');await button('Return to title').press('Enter');await button('Return to title').press('Enter');await page.getByRole('button',{name:'New game',exact:true}).press('Enter');await page.locator('.clinic-dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await menu.count(),0);await open();await button('Save & load').press('Enter');assert(await button('Save game').isDisabled());assert(await button('Export save').isDisabled());checks.push('Clinic popovers retain Escape dismissal; unfinished intake cannot overwrite or export a playable save through pause');
 assert.deepEqual(errors,[]);await fs.writeFile(new URL('verification.json',out),JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve))}
