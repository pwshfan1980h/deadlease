import {rooms} from './world';

// One stable frame per floor: walking or discovering rooms never shifts the atlas.
export function mapBounds(layer:number){
 const floor=Object.values(rooms).filter(room=>room.layer===layer);
 const left=Math.min(...floor.map(room=>room.x))-1.5;
 const top=Math.min(...floor.map(room=>room.y))-1.5;
 return [left,top,Math.max(...floor.map(room=>room.x))-left+1.5,Math.max(...floor.map(room=>room.y))-top+1.5] as const;
}
export function mapFrame(layer:number,local:boolean,roomId:string){
 const room=rooms[roomId];
 return local&&room.layer===layer?[room.x-3.5,room.y-3.5,7,7] as const:mapBounds(layer);
}
