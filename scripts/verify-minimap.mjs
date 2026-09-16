import {chromium} from 'playwright';
import {preview} from 'vite';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createGame} from '../src/engine.ts';
import {encode} from '../src/saves.ts';
import {rooms} from '../src/world.ts';
import {mapBounds} from '../src/map-layout.ts';
const server=process.env.PLAYTEST_URL?null:await preview({preview:{host:'127.0.0.1',port:4193,strictPort:true}});
const url=process.env.PLAYTEST_URL||'http://127.0.0.1:4193/';
const out=new URL('../evidence/minimap-review/',import.meta.url);await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],checks=[];
page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
const input=page.getByRole('textbox',{name:'Command',exact:true});
async function rawSave(){return page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('deadlease-v2',1);r.onsuccess=()=>resolve(r.result)});try{return await new Promise(resolve=>{const r=db.transaction('slots').objectStore('slots').get('auto');r.onsuccess=()=>resolve(r.result)})}finally{db.close()}})}
async function fixture(room,all=true){
 const g=createGame('Cartographer');g.room=room;g.previous=room;g.discovered=all?Object.keys(rooms):[room];if(rooms[room].enemy)g.defeated[room]=g.turns;
 const raw=encode(g);await page.getByLabel('Import save file').setInputFiles({name:'map.json',mimeType:'application/json',buffer:Buffer.from(raw)});
 await page.waitForFunction(name=>document.querySelector('.room-title')?.textContent.includes(name),rooms[room].name);
 await page.waitForFunction(()=>!document.querySelector('.command-hint')?.textContent.includes('SAVING…'));
 await input.press('Tab');await page.locator('.minimap-dialog[open]').waitFor();
}
async function settled(){await page.waitForTimeout(150)}
async function inspect(){await settled();return page.locator('.geographic-map').evaluate(svg=>{
 const matrix=svg.getScreenCTM(),box=svg.getBoundingClientRect();
 const label=svg.querySelector('.map-place-label'),lb=label?.getBoundingClientRect();
 const marker=svg.querySelector('.map-player')?.getBoundingClientRect();
 const inside=b=>!b||b.left>=box.left-1&&b.top>=box.top-1&&b.right<=box.right+1&&b.bottom<=box.bottom+1;
 return {regionsInside:[...svg.querySelectorAll('.map-region')].every(e=>inside(e.getBoundingClientRect())),labelPixels:label?parseFloat(getComputedStyle(label).fontSize)*matrix.a:0,labelInside:inside(lb),markerInside:inside(marker),markerWidth:marker?.width,svgHeight:box.height,viewBox:svg.getAttribute('viewBox')};
})}
try{
 await page.goto(url);await fixture('clinic',false);
 assert.equal((await inspect()).viewBox,'-3.5 -3.5 7 7');assert.equal(await page.getByRole('button',{name:'Local zoom',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.getByRole('checkbox',{name:'Fog',exact:true}).count(),0);assert.equal(await page.locator('.map-location').count(),1);assert.equal(await page.locator('.map-terrain [aria-label^="Ladder"]').count(),0);
 for(const [width,height] of [[1440,900],[1280,800],[1024,720],[3440,1440],[390,844]]){
  await page.setViewportSize({width,height});const measured=await inspect();
  assert(Math.abs(measured.labelPixels-12)<.1);assert(measured.labelInside);assert(measured.regionsInside);assert(measured.markerInside);assert(measured.markerWidth>=15.9);assert(measured.svgHeight>150);
  const dialog=await page.locator('.minimap-dialog').boundingBox();assert(dialog.x>=0&&dialog.y>=0&&dialog.x+dialog.width<=width&&dialog.y+dialog.height<=height);
  await page.screenshot({path:new URL(`${width}-surface.png`,out).pathname});
 }
 checks.push('Readable 12px room label and >=16px player ring; no clipping at 1440, 1280, 1024, 3440 and 390px widths');
 await page.setViewportSize({width:1440,height:900});const before=await rawSave();
 await page.keyboard.press('b');assert.equal((await inspect()).viewBox,mapBounds(-1).join(' '));assert.equal(await page.locator('.map-player').count(),0);assert.equal(await page.locator('.map-place-label').count(),0);assert(await page.getByRole('button',{name:'Local zoom',exact:true}).isDisabled());
 await page.keyboard.press('s');await page.keyboard.press('l');assert.equal((await inspect()).viewBox,'-3.5 -3.5 7 7');await page.screenshot({path:new URL('local-clinic.png',out).pathname});
 await page.keyboard.press('w');await page.keyboard.press('g');await settled();assert.equal(await page.locator('.map-place-label').count(),0);await page.keyboard.press('g');
 await page.keyboard.press('f');await settled();assert(await page.locator('.map-terrain').getAttribute('mask'));await page.keyboard.press('f');await settled();assert(await page.locator('.map-terrain').getAttribute('mask'));assert.deepEqual(await page.locator('.map-region').allTextContents(),['DISTRICT 67']);
 assert.equal(await rawSave(),before);await page.keyboard.press('Escape');assert(await input.evaluate(e=>document.activeElement===e));
 await input.fill('map fog off');await input.press('Enter');await settled();assert.equal(await page.locator('.minimap-dialog').count(),0);assert((await page.locator('.log').textContent()).includes('Fog of war is always on'));await input.press('Tab');assert.equal((await inspect()).viewBox,'-3.5 -3.5 7 7');assert(await page.locator('.map-terrain').getAttribute('mask'));await page.keyboard.press('Escape');
 await input.fill('s');await input.press('Enter');await page.waitForFunction(()=>document.querySelector('.room-panel')?.getAttribute('aria-busy')==='false'&&!document.querySelector('.command-hint')?.textContent.includes('SAVING…'));await input.press('Tab');assert.equal((await inspect()).viewBox,'-3.5 -2.5 7 7');assert.equal(await page.locator('.map-location').count(),2);assert.equal(await page.locator('mask circle').count(),2);assert((await page.locator('.map-vertical').textContent()).includes('Unexplored'));await page.screenshot({path:new URL('discovery-expands-fog.png',out).pathname});await page.keyboard.press('Escape');
 checks.push('Fog always applied: no checkbox, F cannot disable it, legacy map fog off rejected; only discovered markers, ladders and region names; exploration expands reveal; every reopen returns to local view at player');
 checks.push('Floor/local/world/labels shortcuts; off-floor player and selection hidden; inspection preserves save and restores command focus');
 await fixture('sewer-0');const floorSave=await rawSave();assert.equal(await page.locator('.map-player').getAttribute('data-room'),'sewer-0');
 assert.equal((await inspect()).viewBox,'-3.5 -2.5 7 7');await page.getByRole('button',{name:'Whole estuary',exact:true}).click();assert.equal((await inspect()).viewBox,mapBounds(-1).join(' '));
 const initial=await page.locator('.geographic-map').boundingBox();
 for(const room of Object.values(rooms).filter(r=>r.layer===-1)){
  await page.locator(`.map-location[data-room="${room.id}"]`).click();const measured=await inspect();assert.equal(await page.locator('.map-place-label').textContent(),room.name);assert(measured.labelInside,room.id+' label clipped');assert.deepEqual(await page.locator('.geographic-map').boundingBox(),initial);
 }
 await page.locator('.map-location[data-room="sewer-7"]').click();await page.keyboard.press('l');assert.equal((await inspect()).viewBox,'3.5 -2.5 7 7');await page.keyboard.press('w');await settled();
 const focusStyle=await page.locator('.map-location[data-room="sewer-7"]').evaluate(e=>({outline:getComputedStyle(e).outlineStyle,vector:getComputedStyle(e.querySelector('.map-hit-target')).vectorEffect}));assert.equal(focusStyle.outline,'none');assert.equal(focusStyle.vector,'non-scaling-stroke');
 await page.screenshot({path:new URL('sewers-surveyed.png',out).pathname});
 assert.equal(await rawSave(),floorSave);await page.keyboard.press('Escape');
 await fixture('bellwether-6');await page.getByRole('button',{name:'Whole estuary',exact:true}).click();assert((await inspect()).labelInside);assert((await inspect()).markerInside);await page.screenshot({path:new URL('bellwether-edge.png',out).pathname});
 const surfaceFrame=await page.locator('.geographic-map').boundingBox();
 for(const room of Object.values(rooms).filter(r=>r.layer===0)){
  await page.locator(`.map-location[data-room="${room.id}"]`).click();assert((await inspect()).labelInside,room.id+' label clipped');assert.equal(await page.locator('.map-place-label').textContent(),room.name);assert.deepEqual(await page.locator('.geographic-map').boundingBox(),surfaceFrame);
 }
 checks.push('SVG keyboard focus uses a non-scaling ring, never a giant outline over the map');
 checks.push('All 149 discovered room labels inspected without clipping or viewport shifts; local zoom centers selected room; surface/sewer edge markers fit');
 assert.deepEqual(errors,[]);const report={passed:true,url,checks,errors};await fs.writeFile(new URL('verification.json',out),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();if(server)await new Promise(resolve=>server.httpServer.close(resolve))}
