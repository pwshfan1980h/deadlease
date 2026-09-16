// Read-only contact sheets of the generated paintings, in world catalog order.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {createServer} from 'node:http';
const catalog=JSON.parse(await fs.readFile('design/location-art/prompts.json','utf8')).locations;
const receipts=new Set((await fs.readdir('design/location-art/receipts')).map(f=>f.replace('.json','')));
const jobs=catalog.filter(r=>receipts.has(r.id)),out='evidence/location-art-review';await fs.mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const id=decodeURIComponent(req.url.slice(1));if(!receipts.has(id))throw Error('Unknown asset');res.setHeader('Content-Type','image/jpeg');res.end(await fs.readFile('public/assets/locations/'+id+'.jpg'))}catch{res.statusCode=404;res.end()}});
await new Promise(resolve=>server.listen(4202,'127.0.0.1',resolve));const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1200,height:780}});
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
try{for(let i=0;i<jobs.length;i+=9){const group=jobs.slice(i,i+9);await page.setContent('<style>*{box-sizing:border-box}body{margin:0;background:#080a0a;color:#dfd6c7;font:13px monospace;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}figure{margin:0}img{display:block;width:100%;aspect-ratio:16/9}figcaption{padding:6px 0}</style>'+group.map(r=>'<figure><img src="http://127.0.0.1:4202/'+r.id+'"><figcaption>'+escape(r.id+' / '+r.name)+'</figcaption></figure>').join(''));await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));await page.screenshot({path:out+'/'+String(i/9+1).padStart(2,'0')+'.png'});}console.log(jobs.length+' paintings in '+Math.ceil(jobs.length/9)+' contact sheets')}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
