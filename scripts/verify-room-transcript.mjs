import {chromium} from 'playwright';
import {preview} from 'vite';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createGame,command} from '../src/engine.ts';
import {encode} from '../src/saves.ts';
import {rooms} from '../src/world.ts';
const server=process.env.PLAYTEST_URL?null:await preview({preview:{host:'127.0.0.1',port:4205,strictPort:true}});
const url=process.env.PLAYTEST_URL||'http://127.0.0.1:4205/';
const out=new URL('../evidence/room-transcript/',import.meta.url);await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1024,height:720}}),errors=[],checks=[];
page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
const input=page.getByRole('textbox',{name:'Command',exact:true}),log=page.locator('.log');
async function state(){return page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('deadlease-v2',1);r.onsuccess=()=>resolve(r.result)});try{return await new Promise(resolve=>{const r=db.transaction('slots').objectStore('slots').get('auto');r.onsuccess=()=>resolve(JSON.parse(r.result))})}finally{db.close()}})}
async function settled(){await page.waitForFunction(()=>document.querySelector('.room-panel')?.getAttribute('aria-busy')==='false'&&!document.querySelector('.command-hint')?.textContent.includes('SAVING…'))}
async function lines(){return page.locator('.log > p').allTextContents()}
async function cmd(text){await input.fill(text);await input.press('Enter');await settled()}
async function top(){await page.waitForFunction(()=>document.querySelector('.log').scrollTop===0);assert(await input.evaluate(e=>document.activeElement===e))}
async function travel(text,button,motion){
 const source=await state(),expected=command(source,text);assert.notEqual(expected.state.room,source.room);
 if(button)await page.getByRole('button',{name:button,exact:true}).click();else {await input.fill(text);await input.press('Enter')}
 if(motion){await page.locator('.travel-in').waitFor();assert.deepEqual(await lines(),expected.messages.map(m=>m.replace(/^HINT \/ /,'')))}
 await page.getByRole('heading',{name:rooms[expected.state.room].name,exact:true}).waitFor();await settled();
 assert.deepEqual(await lines(),expected.messages.map(m=>m.replace(/^HINT \/ /,'')));await top();
 await page.locator('.log img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await page.waitForTimeout(100);await top();
 return expected;
}
try{
 await page.goto(url);const g=createGame('Room Test');await page.getByLabel('Import save file').setInputFiles({name:'room.json',mimeType:'application/json',buffer:Buffer.from(encode(g))});await page.getByRole('heading',{name:'Reclamation Clinic',exact:true}).waitFor();await settled();
 const roster=page.getByLabel('Characters here',{exact:true});
 assert.deepEqual(await roster.locator('li').allTextContents(),['Clerk','Clinic orderly','Dr. Pell']);
 await cmd('look around');await cmd('look around');assert.equal(await roster.count(),1);assert.deepEqual(await roster.locator('li').allTextContents(),['Clerk','Clinic orderly','Dr. Pell']);assert(!(await lines()).some(line=>/^Here:|^Here now:|tends a surgical bench|protects this refuge|^Ground:/.test(line)));
 await page.screenshot({path:new URL('clinic-single-roster.png',out).pathname});
 await cmd('dance');await cmd('talk doctor');await cmd('look around');assert(await log.evaluate(e=>e.scrollHeight>e.clientHeight&&e.scrollTop>0));
 const beforeBlocked=await lines();await cmd('n');assert.deepEqual((await lines()).slice(0,beforeBlocked.length),beforeBlocked);assert.equal((await state()).room,'clinic');
 await travel('s',null,true);assert.equal(await roster.count(),0);assert(!(await lines()).join(' ').includes('Dr. Pell'));await input.press('ArrowUp');assert.equal(await input.inputValue(),'s');await input.fill('');
 await travel('down','down',true);assert(await page.locator('.room-occupants').isVisible());assert.deepEqual(await roster.locator('li').allTextContents(),['Drainwatch Hal']);await travel('up','up',true);
 checks.push('Animated typed/button travel and stairs replace old text before fade-in, start at top, retain command focus/history; blocked exit preserves history');
 await page.emulateMedia({reducedMotion:'reduce'});await cmd('look around');const sameRoom=await lines();await cmd('dance');assert.deepEqual((await lines()).slice(0,sameRoom.length),sameRoom);
 await page.setViewportSize({width:390,height:844});await travel('s','south',false);assert((await state()).encounter);assert(await page.locator('.log .encounter').isVisible());
 await top();
 await page.screenshot({path:new URL('combat-arrival-top.png',out).pathname});
 await page.setViewportSize({width:1280,height:800});await top();await page.setViewportSize({width:390,height:844});await top();
 const arrivalLines=await lines();await cmd('brace');assert.deepEqual((await lines()).slice(0,arrivalLines.length),arrivalLines);await page.waitForFunction(()=>{const e=document.querySelector('.log');return e.scrollHeight-e.scrollTop-e.clientHeight<2});
 const escaped=await travel('flee','flee',false);assert(escaped.messages.some(m=>m.startsWith('FLEE /')));assert.equal((await state()).room,'steps');
 await travel('n',null,false);assert(!(await lines()).join(' ').includes('Dr. Pell'));assert(!(await log.textContent()).includes('FLEE /'));
 await page.screenshot({path:new URL('clinic-return-clean.png',out).pathname});
 checks.push('Reduced-motion combat arrival holds top through art decode and resize; next action follows new results; retreat keeps parting response but drops prior combat; return visits start clean');
 for(const [room,expected] of [['square',['Iona']],['bellwether-0',['Lantern watch','Ripper Voss']],['bellwether-1',['Ada','Lantern watch']]]){
  const local=createGame('Roster Test');local.room=local.previous=room;local.discovered.push(room);await page.getByLabel('Import save file').setInputFiles({name:'roster.json',mimeType:'application/json',buffer:Buffer.from(encode(local))});await page.getByRole('heading',{name:rooms[room].name,exact:true}).waitFor();await settled();await cmd('look around');assert.equal(await roster.count(),1);assert.deepEqual(await roster.locator('li').allTextContents(),expected);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 checks.push('One complete live roster survives repeated look commands; empty rooms remove it, warden aliases deduplicate, named NPCs and doctors match each destination on compact screens');
 assert.deepEqual(errors,[]);const report={passed:true,checks,errors};await fs.writeFile(new URL('verification.json',out),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();if(server)await new Promise(resolve=>server.httpServer.close(resolve))}
