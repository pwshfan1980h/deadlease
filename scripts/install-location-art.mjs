import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),[id,source]=process.argv.slice(2);
const catalog=JSON.parse(await fs.readFile(new URL('design/location-art/prompts.json',root),'utf8'));
if(id==='manifest'){
 const receipts=new URL('design/location-art/receipts/',root),files={};
 for(const file of (await fs.readdir(receipts)).filter(f=>f.endsWith('.json')).sort()){const entry=JSON.parse(await fs.readFile(new URL(file,receipts),'utf8'));files[entry.id]=entry}
 await fs.writeFile(new URL('src/generated/location-art.json',root),JSON.stringify(Object.fromEntries(Object.values(files).map(f=>[f.id,'./assets/locations/'+f.id+'.jpg'])),null,2)+'\n');
 await fs.writeFile(new URL('public/assets/location-art-provenance.json',root),JSON.stringify({tool:catalog.tool,expected:catalog.locations.length,files},null,2)+'\n');console.log(Object.keys(files).length+'/'+catalog.locations.length+' location scenes installed');
}else{
 const entry=catalog.locations.find(p=>p.id===id);if(!entry||!source)throw Error('Expected a catalog room ID and generated PNG path');
 const data=await fs.readFile(source);if(data.subarray(1,4).toString()!=='PNG')throw Error('Expected generated PNG');
 const target=new URL('public/assets/locations/'+id+'.jpg',root);await fs.mkdir(new URL('public/assets/locations/',root),{recursive:true});
 execFileSync('sips',['-s','format','jpeg','-s','formatOptions','84',source,'--out',fileURLToPath(target)],{stdio:'ignore'});
 const result=await fs.readFile(target),record={id,name:entry.name,width:data.readUInt32BE(16),height:data.readUInt32BE(20),file:'locations/'+id+'.jpg',sha256:createHash('sha256').update(result).digest('hex'),bytes:result.length,prompt:entry.prompt,source};
 await fs.writeFile(new URL('design/location-art/receipts/'+id+'.json',root),JSON.stringify(record,null,2)+'\n');console.log(id+': '+record.width+'x'+record.height+', '+Math.round(result.length/1024)+' KB');
}
