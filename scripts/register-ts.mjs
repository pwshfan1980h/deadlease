import {registerHooks} from 'node:module';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
registerHooks({
 resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(specifier.startsWith('.'))for(const suffix of ['.ts','.tsx']){const url=new URL(specifier+suffix,context.parentURL);if(fs.existsSync(url))return {url:url.href,shortCircuit:true}}throw error}},
 load(url,context,next){if(url.endsWith('.ts')||url.endsWith('.tsx'))return {format:'module',source:ts.transpileModule(fs.readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText,shortCircuit:true};if(url.endsWith('.json')&&url.includes('/src/data/'))return {format:'module',source:'export default '+fs.readFileSync(fileURLToPath(url),'utf8'),shortCircuit:true};return next(url,context)}
});
