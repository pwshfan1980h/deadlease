import {chromium} from 'playwright';
import {preview} from 'vite';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createGame,enemyFor} from '../src/engine.ts';
import {encode} from '../src/saves.ts';
import {rooms} from '../src/world.ts';
import locations from '../src/generated/location-art.json' with {type:'json'};
import {newGame} from './intake-helper.mjs';
const out=new URL('../evidence/scene-terminal-pass/',import.meta.url);await fs.mkdir(out,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4201,strictPort:true}}),browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1080},reducedMotion:'reduce'}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
const input=page.getByRole('textbox',{name:'Command',exact:true});
async function settled(){await page.waitForFunction(()=>document.querySelector('.room-panel')?.getAttribute('aria-busy')==='false'&&!document.querySelector('.command-hint')?.textContent.includes('SAVING…'))}
async function cmd(text){const before=await page.locator('.log').textContent();await input.fill(text);await input.press('Enter');await page.waitForFunction(before=>document.querySelector('.log')?.textContent!==before,before);await settled()}
async function load(g){await page.getByLabel('Import save file').setInputFiles({name:'scene.json',mimeType:'application/json',buffer:Buffer.from(encode(g))});await page.getByRole('heading',{name:rooms[g.room].name,exact:true}).waitFor();await settled();await page.locator('.room-panel img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())))}
const color=selector=>page.locator(selector).first().evaluate(e=>getComputedStyle(e).color);
const shot=name=>page.screenshot({path:new URL(name+'.png',out).pathname,fullPage:true});
try{
 await page.goto('http://127.0.0.1:4201/');await newGame(page,'Mara');await settled();
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).cursor),'auto');assert.equal(await color('.log'),'rgb(167, 249, 135)');assert.equal(await page.locator('.log').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
 const g=createGame();g.loot.clinic={knife:2,'medical supplies':1};await load(g);
 assert.deepEqual(await page.locator('.ground-items li').allTextContents(),['knife ×2','medical supplies']);assert.equal(await color('.ground-items'),'rgb(177, 180, 178)');assert.equal(await page.locator('.ground-items button,.ground-items .item-mention').count(),0);
 await cmd('look around');assert.equal(await color('.ground-text'),'rgb(177, 180, 178)');await shot('1440-ground-items');await cmd('take knife');assert.equal(await page.locator('.ground-items').innerText(),'medical supplies');await cmd('take all');assert.equal(await page.locator('.ground-items').count(),0);checks.push('Immediate plain grey ground inventory, grey transcript ground list, typed pickup updates without stale items');
 const kiosk=createGame();kiosk.room=kiosk.previous='kiosk';kiosk.discovered.push('kiosk');await load(kiosk);assert(!(await page.locator('.log').innerText()).includes('sealed medical kit'));await cmd('look around');assert.equal(await color('.item-mention'),'rgb(101, 255, 114)');assert((await page.locator('.log .item-mention').allTextContents()).includes('sealed medical kit'));await shot('1440-item-prose');checks.push('Detailed prose requires look around; actual item mentions highlighted green without revealing hidden objects on arrival');
 const square=createGame();square.room=square.previous='square';square.discovered.push('square');await load(square);assert(await page.locator('.npc .name-neutral').isVisible());await cmd('talk technician');assert(await page.locator('.log .name-neutral').count());
 await load(createGame());for(const [direction,id] of [['s','steps'],['down','sewer-0'],['up','steps']]){await cmd(direction);assert.equal(await page.locator('.room-title h2').innerText(),rooms[id].name);assert(await page.locator('.scene-painting img').evaluate(i=>i.complete&&i.naturalWidth>0));await shot('route-'+id)}checks.push('Adjacent outdoor and vertical travel arrives with decoded matching art; neutral inhabitants remain immediately visible');
 // Gate an uncached neighbor image. Movement must retain the source until decode,
 // and repeated commands/map keys cannot cross a second boundary while loading.
 let releaseImage,requestedImage;
 const requestSeen=new Promise(resolve=>{requestedImage=resolve});
 const imageGate=new Promise(resolve=>{releaseImage=resolve});
 await page.route('**/assets/locations/quay-11.jpg',async route=>{requestedImage();await imageGate;await route.continue()});
 const slow=createGame();slow.room=slow.previous='quay-10';slow.discovered.push('quay-10');await load(slow);await requestSeen;
 await input.fill('s');await input.press('Enter');await page.locator('.travel-loading').waitFor();
 assert.equal(await page.locator('.room-title h2').innerText(),rooms['quay-10'].name);
 assert((await page.locator('.scene-painting img').getAttribute('src')).includes('quay-10.jpg'));
 await input.fill('s');await input.press('Enter');await input.press('Tab');assert.equal(await page.locator('.minimap-dialog[open]').count(),0);
 releaseImage();await page.getByRole('heading',{name:rooms['quay-11'].name,exact:true}).waitFor();await settled();
 assert(await page.locator('.scene-painting img').evaluate(i=>i.complete&&i.naturalWidth>0));
 assert.equal(await page.locator('.room-title h2').innerText(),rooms['quay-11'].name);await page.unroute('**/assets/locations/quay-11.jpg');
 checks.push('Delayed destination keeps the old scene; duplicate movement and map invocation blocked until decoded arrival');
 // Decode every shipped room image in the browser, including rooms not on the playtest route.
 const decoded=await page.evaluate(async paths=>{let next=0,count=0;async function worker(){while(next<paths.length){const src=paths[next++],img=new Image();img.src=src;await img.decode();if(img.naturalWidth<1400)throw Error('Undersized scene '+src);count++}}await Promise.all([worker(),worker(),worker(),worker()]);return count},Object.values(locations));
 assert.equal(decoded,Object.keys(rooms).length);checks.push('All '+decoded+' unique room paintings decode successfully in the production build');
 const fight=createGame();fight.room=fight.previous='tunnel';fight.discovered.push('tunnel');fight.encounter=enemyFor('tunnel');await load(fight);await cmd('brace');assert.equal(await color('.encounter .name-enemy'),'rgb(255, 121, 121)');assert(await page.locator('.log .name-enemy').count());
 for(const [width,height] of [[1440,1080],[1280,800],[1024,720],[3440,1440],[390,844]]){
  await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const frame=await page.locator('.playing').boundingBox(),scene=await page.locator('.room-panel').boundingBox(),player=await page.locator('.player-card').boundingBox(),terminal=await page.locator('.terminal').boundingBox();
  assert(scene.y+scene.height<=player.y+.5);assert(player.y+player.height<=terminal.y+.5);assert(frame.width<=1441);if(width>800){const command=await input.boundingBox();assert(command.y+command.height<=height,'input remains within viewport');assert(scene.height>=250)}
  assert(await page.locator('.scene-painting img').evaluate(i=>getComputedStyle(i).objectFit==='contain'));await shot(width+'-combat');
 }
 checks.push('Scene, compact player strip, green terminal fit standard, short, ultrawide and mobile widths; full art preserved; visible mouse fallback');
 await page.setViewportSize({width:1024,height:720});await page.keyboard.press('Escape');await page.getByRole('button',{name:'Settings',exact:true}).press('Enter');
 await page.getByRole('dialog').getByLabel('Text size').selectOption('18');await page.getByRole('dialog').getByLabel('Palette').selectOption('tidal');await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 assert.equal(await page.locator('.log p').first().evaluate(e=>getComputedStyle(e).fontSize),'18px');assert.equal(await color('.log'),'rgb(167, 249, 135)');
 const largeInput=await input.boundingBox();assert(largeInput.y+largeInput.height<=720);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('1024-large-text');
 checks.push('Largest text setting keeps input visible on a short desktop; terminal palette stays green when UI palette changes');

 assert.deepEqual(errors,[]);await fs.writeFile(new URL('verification.json',out),JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve))}
