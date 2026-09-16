// Fail-fast release checks. The browser suites always exercise this local build.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const env={...process.env};delete env.PLAYTEST_URL;
const stages=['test','build','audit:assets','test:browser','test:noir','test:roaming','test:clinic','test:inventory','test:frontier','test:motion','test:boards','test:pause','test:theft','test:interactions','test:runs','test:scenes'];
const started=new Date().toISOString(),results=[];
const report=new URL('../evidence/full-verification.json',import.meta.url);
fs.mkdirSync(new URL('../evidence/',import.meta.url),{recursive:true});
for(const stage of stages){
 console.log(`\nChecking ${stage}`);
 const start=Date.now();
 const result=spawnSync('npm',['run',stage],{cwd:root,env,stdio:'inherit',timeout:300000});
 const passed=result.status===0&&!result.error;
 results.push({stage,passed,seconds:Math.round((Date.now()-start)/1000),...(result.error?{error:result.error.message}:{})});
 fs.writeFileSync(report,JSON.stringify({started,finished:new Date().toISOString(),passed:passed&&results.length===stages.length,results},null,2)+'\n');
 if(!passed){console.error(`Verification stopped at ${stage}. Nothing has been published.`);process.exit(result.status||1)}
}
console.log('\nAll release checks passed. Evidence: evidence/full-verification.json');
