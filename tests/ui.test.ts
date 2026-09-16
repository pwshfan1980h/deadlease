import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {App,completions} from '../src/App';
import {createGame} from '../src/engine';
it('opens on a focused game menu with no registration form or product labels',()=>{
 const html=renderToStaticMarkup(createElement(App));for(const label of ['Main menu','New game','Load game','Import save'])expect(html).toContain(label);
 for(const label of ['Begin tenancy','Your next life','SINGLE-PLAYER','NO ACCOUNT','LOCAL ONLY','122 places','deterministic'])expect(html).not.toContain(label);
});
it('renders painted scene, command entry, resource labels, movement, panels and contextual actions',()=>{
 const html=renderToStaticMarkup(createElement(App,{initialGame:createGame()}));expect(html).not.toContain('DEADLEASE');expect(html).not.toContain('masthead');
 for(const text of ['Reclamation Clinic','assets/locations/clinic.jpg','Enlarge Reclamation Clinic','Command','inventory','skills','journal','settings','map','look around','HP','STAMINA'])expect(html).toContain(text);
});
it('offers keyboard completion for multiword abilities, items, directions and safe commands',()=>{
 const g=createGame();expect(completions('use riot',g)).toContain('use riot stance');expect(completions('equip battered',g)).toContain('equip battered handgun');expect(completions('go s',g)).toContain('go south');
});
