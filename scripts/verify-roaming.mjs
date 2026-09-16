import {newGame} from './intake-helper.mjs';
import {chromium} from 'playwright';
import {preview} from 'vite';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out=new URL('../evidence/roaming-review/',import.meta.url);await fs.mkdir(out,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4191,strictPort:true}}),browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
await page.addInitScript(()=>{Math.random=()=>.5});
await page.clock.install();await page.clock.pauseAt(new Date());
const input=page.getByRole('textbox',{name:'Command',exact:true});
async function cmd(text){const n=await page.locator('.log-command').count();await input.fill(text);await input.press('Enter');await page.waitForFunction(n=>document.querySelectorAll('.log-command').length>n,n);await saved()}
async function saved(){await page.waitForFunction(()=>!document.querySelector('.command-hint').textContent.includes('SAVING…'))}
async function state(){return page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('deadlease-v2',1);r.onsuccess=()=>resolve(r.result)});try{return await new Promise(resolve=>{const r=db.transaction('slots').objectStore('slots').get('auto');r.onsuccess=()=>resolve(JSON.parse(r.result))})}finally{db.close()}})}
const shot=async name=>page.screenshot({path:new URL(name+'.png',out).pathname,fullPage:true});
try{
 await page.goto('http://127.0.0.1:4191');await newGame(page);await saved();
 const original=await state();await input.fill('inspect scrap');await page.clock.runFor(89000);assert.equal(await page.locator('.visitor').count(),0);
 await page.clock.runFor(1000);await page.locator('.visitor').waitFor();assert.equal(await input.inputValue(),'inspect scrap');assert(await input.evaluate(e=>e===document.activeElement));assert.deepEqual(await state(),original);
 await cmd('inspect scrap courier');await cmd('talk scrap courier');await cmd('attack scrap courier');assert.equal((await state()).encounter,null);await shot('neutral-visitor');
 await page.clock.runFor(24000);assert.equal(await page.locator('.visitor').count(),0);assert.equal(await page.getByText('The scrap courier shoulders the sack and moves on.',{exact:true}).count(),1);
 await page.clock.runFor(179000);assert.equal(await page.locator('.visitor').count(),0);checks.push('Rare neutral arrival/departure, inspect/talk, no fight, no save/turn mutation, no typing interruption or idle chatter');
 await page.evaluate(()=>{let n=0;Math.random=()=>++n===2?.3:.5});await cmd('s');await page.clock.runFor(90000);assert(await page.locator('.visitor').filter({hasText:'scrap weasel'}).isVisible());await shot('defensive-visitor');const before=await state();await cmd('inspect scrap weasel');assert.deepEqual(await state(),before);
 await cmd('attack');assert((await state()).encounter.id.startsWith('roaming:'));const fighting=await state();await page.clock.runFor(300000);assert.deepEqual(await state(),fighting);assert.equal(await page.locator('.visitor').count(),0);
 for(let n=0;(await state()).encounter&&n<15;n++)await cmd('attack');assert.equal((await state()).encounter,null);assert.deepEqual((await state()).defeated,{});checks.push('Defensive creature waits for named attack; combat freezes real-time activity; victory preserves resident enemies');
 await cmd('n');await page.evaluate(()=>{Math.random=()=>.5});await cmd('s');const hp=(await state()).player.hp;await page.clock.runFor(120000);await saved();assert.equal((await state()).encounter.name,'culvert maw');assert.equal((await state()).encounter.phase,1);assert((await state()).player.hp<=hp);await shot('hostile-arrival');
 const ambush=await state();await page.clock.runFor(600000);assert.deepEqual(await state(),ambush);await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();assert.equal(await page.locator('.enemy-painting img').getAttribute('alt'),'culvert maw');assert.deepEqual(await state(),ambush);await cmd('flee');assert.equal((await state()).room,'clinic');checks.push('Hostile takes opening strike once, then waits; roaming combat resumes from autosave and supports fleeing');
 const beforeInventory=await state();await cmd('inventory');await page.clock.runFor(240000);assert.equal(await page.locator('.visitor').count(),0);assert.deepEqual(await state(),beforeInventory);await page.keyboard.press('Escape');
 await cmd('settings');await page.clock.runFor(240000);assert.equal(await page.locator('.visitor').count(),0);await cmd('map');await page.clock.runFor(240000);assert.equal(await page.locator('.visitor').count(),0);await page.keyboard.press('Escape');await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}));await page.clock.runFor(300000);assert.equal(await page.locator('.visitor').count(),0);await page.evaluate(()=>{delete document.hidden});await page.clock.runFor(90000);assert(await page.locator('.visitor').isVisible());
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('mobile-visitor');
 await input.fill('menu');await input.press('Enter');const savedGame=await state();await page.clock.runFor(600000);assert.deepEqual(await state(),savedGame);checks.push('Inventory, map, settings, title and simulated hidden tab pause room activity; mobile visitor fits; no offline catch-up');
 assert.deepEqual(errors,[]);await fs.writeFile(new URL('verification.json',out),JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve))}
