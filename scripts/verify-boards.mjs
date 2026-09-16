import {chromium} from 'playwright';
import {preview} from 'vite';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {newGame} from './intake-helper.mjs';
import {createGame} from '../src/engine.ts';
import {encode} from '../src/saves.ts';
const out=new URL('../evidence/jobs-board-pass/',import.meta.url);await fs.mkdir(out,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4195,strictPort:true}}),browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:3440,height:1440}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
const input=page.getByRole('textbox',{name:'Command',exact:true});
async function state(){return page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('deadlease-v2',1);r.onsuccess=()=>resolve(r.result)});try{return await new Promise(resolve=>{const r=db.transaction('slots').objectStore('slots').get('auto');r.onsuccess=()=>resolve(JSON.parse(r.result))})}finally{db.close()}})}
async function settled(){await page.waitForFunction(()=>document.querySelector('.room-panel')?.getAttribute('aria-busy')==='false'&&!document.querySelector('.command-hint')?.textContent.includes('SAVING…'))}
async function cmd(text){const before=await page.locator('.log').textContent();await input.fill(text);await input.press('Enter');await page.waitForFunction(before=>document.querySelector('.log')?.textContent!==before,before);await settled()}
async function shot(name){await page.locator('.room-panel img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await page.screenshot({path:new URL(name+'.png',out).pathname});}
try{
 await page.goto('http://127.0.0.1:4195/');await newGame(page,'Rhea');await settled();
 assert((await page.locator('.room-body').innerText()).includes('jobs board'));assert((await page.locator('.log').innerText()).includes('Need money? Read the jobs board'));
 assert(await page.getByLabel('Available commands').getByText('read board',{exact:true}).isVisible());
 const initial=await state();await input.fill('read b');await input.press('Control+Space');assert.equal(await input.inputValue(),'read board');await cmd('read board');assert.deepEqual(await state(),initial);
 assert((await page.locator('.log').innerText()).includes('accept freight-return'));await shot('3440-clinic-board');
 await cmd('accept freight-return');assert.equal((await state()).courier.route,'freight-return');await cmd('inspect board');assert((await page.locator('.log').innerText()).includes('Type deliver parcel there'));
 for(const step of ['e','e','e'])await cmd(step);assert.equal((await state()).room,'yard');assert((await page.locator('.room-body').innerText()).includes('jobs board'));
 assert(await page.getByLabel('Available commands').getByText('deliver parcel',{exact:true}).isVisible());await cmd('deliver parcel');assert.equal((await state()).player.credits,initial.player.credits+14);await cmd('read jobs board');assert((await page.locator('.log').innerText()).includes('accept clinic-run'));await shot('3440-yard-board');
 const paid=await state();await cmd('deliver parcel');assert.deepEqual(await state(),paid);
 await cmd('accept clinic-run');for(const step of ['w','w','w'])await cmd(step);await cmd('deliver parcel');assert.equal((await state()).courier.completed,2);assert.equal((await page.locator('.log').innerText()).split('Need money? Read the jobs board').length-1,1);checks.push('Fresh character discovers work through room, clerk and local hint; keyboard completion; paid local round trip without global help; no duplicate payout or repeated introduction');
 await cmd('s');const outside=await state();await cmd('read board');assert((await page.locator('.log').innerText()).includes('There is no jobs board here'));assert.deepEqual(await state(),outside);assert.equal(await page.getByLabel('Available commands').getByText('read board',{exact:true}).count(),0);checks.push('Wrong-room reading is informative, free and does not show a nonexistent board hint');
 const remote=createGame('Rhea');remote.room=remote.previous='bellwether-1';remote.discovered.push('bellwether-1');await page.getByLabel('Import save file').setInputFiles({name:'post.json',mimeType:'application/json',buffer:Buffer.from(encode(remote))});await page.getByRole('heading',{name:'Bellwether Post',exact:true}).waitFor();await settled();await cmd('look at board');assert((await page.locator('.log').innerText()).includes('accept district-return'));await shot('3440-bellwether-board');
 for(const [width,height] of [[1280,800],[390,844]]){await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot(width+'-board')}
 checks.push('Bellwether return dispatch discoverable through its board; compact layouts fit');assert.deepEqual(errors,[]);await fs.writeFile(new URL('verification.json',out),JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve))}
