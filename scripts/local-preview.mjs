// An offline inspection artifact; the normal app runs with Vite. No server, network or deployment.
import fs from 'node:fs/promises';
const dir=new URL('../dist/',import.meta.url);let html=await fs.readFile(new URL('index.html',dir),'utf8');
html=html.replace(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g,(_,src)=>`<script data-local-js="${src}"></script>`);
const match=html.match(/<script data-local-js="([^"]+)"><\/script>/);if(match){const js=await fs.readFile(new URL(match[1],dir),'utf8');html=html.replace(match[0],'<script type="module">'+js.replaceAll('</script','<\\/script')+'</script>')}
const css=html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);if(css)html=html.replace(css[0],'<style>'+await fs.readFile(new URL(css[1],dir),'utf8')+'</style>');
await fs.writeFile(new URL('local-preview.html',dir),html);console.log('dist/local-preview.html written for local browser inspection.');
