// Publish the tested game to main. Editable code and docs live on the source branch.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const stage=fileURLToPath(new URL('../.pages-deploy/',import.meta.url));
const git=(...args)=>execFileSync('git',args,{cwd:stage,encoding:'utf8'}).trim();
const remote=git('remote','get-url','origin');
if(remote!=='https://github.com/pwshfan1980h/deadlease.git')throw Error('Unexpected Pages repository: '+remote);
if(git('branch','--show-current')!=='main')throw Error('Pages checkout must be on main.');
if(git('status','--porcelain'))throw Error('Review existing Pages checkout changes before publishing.');
// Never replace the staged or public build unless all release checks pass.
execFileSync('npm',['run','test:all'],{cwd:root,stdio:'inherit'});
for(const name of await fs.readdir(stage))if(!['.git','README.md'].includes(name))await fs.rm(new URL('../.pages-deploy/'+name,import.meta.url),{recursive:true,force:true});
await fs.cp(new URL('../dist/',import.meta.url),stage,{recursive:true});
await fs.copyFile(new URL('../design/README-pages.md',import.meta.url),new URL('../.pages-deploy/README.md',import.meta.url));
git('add','.');
if(git('status','--porcelain')){git('commit','-m','Publish FREEBORN playtest build');execFileSync('git',['push','origin','main'],{cwd:stage,stdio:'inherit'})}
console.log('Pages: https://pwshfan1980h.github.io/deadlease/ (allow deployment to finish)');
