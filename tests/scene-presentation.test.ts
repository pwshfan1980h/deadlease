import {it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createGame,command,arrival,enemyFor,look} from '../src/engine';
import {App} from '../src/App';
import {TranscriptText,nameTone,CharacterName} from '../src/Transcript';
it('highlights item mentions in prose while ground lists remain plain grey text',()=>{
 const prose=renderToStaticMarkup(createElement(TranscriptText,{text:'Iona puts a coil carbine beside the sealed medical kit. Knife and knife-edge.'}));
 expect(prose).toContain('name-neutral">Iona');expect(prose).toContain('item-mention">coil carbine');expect(prose).toContain('item-mention">sealed medical kit');expect(prose).toContain('item-mention">Knife');expect(prose).not.toContain('item-mention">knife</span>-edge');
 const ground=renderToStaticMarkup(createElement(TranscriptText,{text:'Ground: knife ×2, medical supplies ×1'}));expect(ground).toContain('ground-text');expect(ground).not.toContain('item-mention');
 const g=createGame();g.loot.clinic={'knife':2,'medical supplies':1};
 const html=renderToStaticMarkup(createElement(App,{initialGame:g}));expect(html).toContain('aria-label="Items on the ground"');expect(html).toContain('<li>knife ×2</li>');expect(html).toContain('<li>medical supplies</li>');
 delete g.loot.clinic.knife;delete g.loot.clinic['medical supplies'];expect(renderToStaticMarkup(createElement(App,{initialGame:g}))).not.toContain('aria-label="Items on the ground"');
});
it('arrivals omit detail and navigation while explicit look around is free and complete',()=>{
 const g=createGame(),moved=command(g,'s');expect(moved.messages).not.toContain(look(moved.state)[1]);expect(arrival(g)).toEqual(['Reclamation Clinic.']);expect(moved.messages.join(' ')).not.toMatch(/manhole|Exits:|Ground:/);
 const detail=command(moved.state,'look around');expect(detail.changed).toBe(false);expect(detail.state).toBe(moved.state);expect(detail.messages.join(' ')).toContain('manhole');expect(detail.messages.join(' ')).toContain('Ways out:');expect(detail.messages.join(' ')).not.toContain('→');
});
it('the scene immediately presents inhabitants and threats without dumping room prose or destinations',()=>{
 let g=createGame();let html=renderToStaticMarkup(createElement(App,{initialGame:g}));expect(html).toContain('name-clinic');expect(html).toContain('clerk');expect(html).not.toContain('REPLACEMENT IS NOT A REFUND');expect(html).not.toContain('Clinic Steps');expect(html).not.toContain('EXITS');
 g.room=g.previous='tunnel';g.discovered.push('tunnel');g.encounter=enemyFor('tunnel');html=renderToStaticMarkup(createElement(App,{initialGame:g}));expect(html).toContain('name-enemy');expect(html).toContain('STREET CUTTHROAT');expect(html).toContain('scene-painting');expect(html).toContain('enemy-painting');expect(html).not.toContain('Pipes cross the ceiling');
});
it('transcript colors only identified names, with hostile priority and safe literal text',()=>{
 const html=renderToStaticMarkup(createElement(TranscriptText,{text:'Iona talks to street cutthroat. CLINIC CLERK watches Rusk. <script>bad</script>'}));expect(html).toContain('name-neutral">Iona');expect(html).toContain('name-enemy">street cutthroat');expect(html).toContain('name-clinic">CLINIC CLERK');expect(html).toContain('name-union">Rusk');expect(html).toContain('&lt;script&gt;');expect(nameTone('UNKNOWN')).toBe('neutral');expect(renderToStaticMarkup(createElement(TranscriptText,{text:'The clerkship remains vacant.'}))).not.toContain('character-name');
});

it('treats player names literally and keeps unprovoked visitors neutral when requested',()=>{
 const html=renderToStaticMarkup(createElement(TranscriptText,{text:'Ari (X) draws a knife.',playerName:'Ari (X)'}));expect(html).toContain('name-neutral">Ari (X)');expect(html).toContain('item-mention">knife');expect(renderToStaticMarkup(createElement(CharacterName,{name:'street cutthroat',tone:'neutral'}))).toContain('name-neutral');
});
