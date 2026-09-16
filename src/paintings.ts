import {enemies} from './enemies';
/** Painted assets keep their authored color; interface palettes never recolor a painting. */
export const scenePaintings:Record<string,string>={
 'crown-15':'./assets/paintings/city-horizon.png','crown-17':'./assets/paintings/city-horizon.png',clinic:'./assets/paintings/clinic.png',steps:'./assets/paintings/steps.png',pump:'./assets/paintings/pump.png',
};
export const enemyPaintings:Record<string,string>=Object.fromEntries(Object.entries(enemies).map(([name,def])=>[name,'./assets/paintings/'+def.art+'.png']));
export const biomePaintings:Record<string,string>={shallows:'./assets/paintings/shallow-drains.png',wilds:'./assets/paintings/dike-wilderness.png',bellwether:'./assets/paintings/bellwether-town.png'};
