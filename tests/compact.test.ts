// @vitest-environment jsdom
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {App} from '../src/App';
import {createGame} from '../src/engine';
it('computed import input stays hidden in creation and gameplay despite generic input styles',()=>{
 const style=document.createElement('style');style.textContent=readFileSync('src/style.css','utf8');document.head.append(style);
 try{for(const initialGame of [undefined,createGame()]){document.body.innerHTML=renderToStaticMarkup(createElement(App,{initialGame}));expect(getComputedStyle(document.querySelector('input[type=file]')!).display).toBe('none')}}finally{style.remove();document.body.innerHTML=''}
});
it('keeps minimap closed until invoked during exploration',()=>{
 const html=renderToStaticMarkup(createElement(App,{initialGame:createGame()}));expect(html).not.toContain('minimap-dialog');expect(html).toContain('Tab map');
});
