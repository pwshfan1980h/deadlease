// Read-only UI audit of the public build in an isolated profile. Fixtures select
// representative transcript states; this is not a natural campaign playthrough.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {createGame,enemyFor} from '../src/engine.ts';
import {gainXP,xpForLevel} from '../src/progression.ts';
import {encode} from '../src/saves.ts';
import {newGame} from './intake-helper.mjs';
const out=new URL('../evidence/transcript-category-audit/',import.meta.url);await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'}),errors=[],scenarios=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(8000);
async function settled(){await page.waitForFunction(()=>document.querySelector('.room-panel')?.getAttribute('aria-busy')==='false'&&!document.querySelector('.command-hint')?.textContent.includes('SAVING…'))}
async function cmd(text){await page.getByRole('textbox',{name:'Command',exact:true}).fill(text);await page.keyboard.press('Enter');await settled()}
async function load(g){await page.getByLabel('Import save file').setInputFiles({name:'audit.json',mimeType:'application/json',buffer:Buffer.from(encode(g))});await page.waitForFunction(async raw=>{const db=await new Promise(resolve=>{const r=indexedDB.open('deadlease-v2',1);r.onsuccess=()=>resolve(r.result)});try{return await new Promise(resolve=>{const r=db.transaction('slots').objectStore('slots').get('auto');r.onsuccess=()=>resolve(r.result===raw)})}finally{db.close()}},encode(g));await settled()}
async function capture(name){await page.locator('.room-panel img,.log img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));await page.waitForTimeout(250);const lines=await page.locator('.log > p').evaluateAll(nodes=>nodes.map((p,i)=>{const style=e=>{const s=getComputedStyle(e);return {color:s.color,fontStyle:s.fontStyle,fontWeight:s.fontWeight}};const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),parts=[];while(walker.nextNode()){const node=walker.currentNode;if(node.textContent.trim())parts.push({text:node.textContent,...style(node.parentElement),className:node.parentElement.className})}return {line:i+1,text:p.textContent,...style(p),parts}}));scenarios.push({name,lines});await page.locator('.log').evaluate(e=>e.scrollTop=0);await page.screenshot({path:new URL(name+'-top.png',out).pathname});await page.locator('.log').evaluate(e=>e.scrollTop=e.scrollHeight);await page.screenshot({path:new URL(name+'-bottom.png',out).pathname});console.log(name+': '+lines.length+' lines');}
try{
 await page.goto('https://pwshfan1980h.github.io/deadlease/?transcript-audit='+Date.now());await newGame(page,'Rhea');await cmd('talk doctor');await capture('01-doctor');
 await page.setViewportSize({width:1024,height:720});await capture('02-doctor-short-window');await page.setViewportSize({width:1280,height:900});
 await load(createGame('Rhea'));await cmd('read board');await cmd('accept freight-return');await cmd('jobs');await capture('03-jobs');
 const g=createGame('Rhea');g.room=g.previous='kiosk';g.discovered.push('kiosk');g.loot.kiosk={knife:2};await load(g);await cmd('look around');await cmd('take knife');await capture('04-room-items');
 const fight=createGame('Rhea');fight.room=fight.previous='tunnel';fight.discovered.push('tunnel');fight.encounter=enemyFor('tunnel');fight.encounter.phase=2;await load(fight);await cmd('look');await cmd('brace');await cmd('heal');await capture('05-combat');
 const trained=createGame('Rhea');gainXP(trained.player,xpForLevel(3));await load(trained);await cmd('learn breach shot');await cmd('buy knife');await cmd('equip knife');await cmd('go up');await capture('06-feedback');
 const injured=createGame('Rhea');injured.player.body.ailments=['brain damage'];await load(injured);await cmd('status');await cmd('treat brain damage');await capture('07-injury');
 await fs.writeFile(new URL('lines.json',out),JSON.stringify({url:page.url(),verifiedAt:new Date().toISOString(),errors,scenarios},null,2));console.log(JSON.stringify({scenarios:scenarios.length,lines:scenarios.reduce((n,s)=>n+s.lines.length,0),errors}));
}finally{await browser.close()}
