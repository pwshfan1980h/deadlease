import {useEffect,useState,useId,useRef} from 'react';
import {mapGeometry} from './visual-data';
import {rooms,zones,type Room} from './world';
import type {Game} from './engine';
import {Sprite,retainAreaAtlases} from './sprites';
import {scenePaintings,enemyPaintings,biomePaintings} from './paintings';
function Painting({src,label,className}:{src:string;label:string;className:string}){
 const dialog=useRef<HTMLDialogElement>(null);
 return <><button className={'painting-open '+className} aria-label={'Enlarge '+label} onClick={()=>dialog.current?.showModal()}><img src={src} alt={label}/><span className="painting-hint">Type view to enlarge</span></button><dialog ref={dialog} className="art-dialog" aria-label={label} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}}><button className="art-close" onClick={()=>dialog.current?.close()} autoFocus>Close artwork ×</button><img src={src} alt={label}/><p>{label}</p></dialog></>;
}
export function Scene({room,palette,caption=true}:{room:Room;palette:string;caption?:boolean}){
 useEffect(()=>{retainAreaAtlases(room,palette)},[room,palette]);
 const src=scenePaintings[room.id]??biomePaintings[room.zone];
 return <figure className={'vignette'+(src?' painted-scene':'')} key={room.id}>{src?<Painting src={src} label={room.name} className="scene-painting"/>:<Sprite id={'room/'+room.id} palette={palette} label={`${room.name}, pixel scene`}/>}{caption&&<figcaption>{room.layer===-1?'DRAINS':'ESTUARY SURVEY'} / {room.x},{room.y}</figcaption>}</figure>;
}
export function EnemyPortrait({name,palette}:{name:string;palette:string}){
 const src=enemyPaintings[name];
 return src?<Painting src={src} label={name} className="enemy-painting"/>:<Portrait name="creature" palette={palette} label={name}/>;
}
export function Portrait({name,palette,label}:{name:string;palette:string;label:string}){
 return <Sprite id={'portrait/'+name} palette={palette} label={label} className="portrait"/>;
}
const geometry=mapGeometry();
export function Atlas({game,palette="original",request}:{game:Game;palette?:string;request?:{text:string;serial:number}|null}){
 const [layer,setLayer]=useState(rooms[game.room].layer),[fog,setFog]=useState(false),[labels,setLabels]=useState(true),[hazards,setHazards]=useState(true),[selected,setSelected]=useState(game.room),[zoom,setZoom]=useState(false);
 useEffect(()=>{setLayer(rooms[game.room].layer);setSelected(game.room)},[game.room]);
 useEffect(()=>{
  if(!request)return;const [action,value]=request.text.split(' ');
  if(action==='surface')setLayer(0);if(action==='sewers')setLayer(-1);
  if(action==='local')setZoom(true);if(action==='world')setZoom(false);
  const update=(old:boolean)=>value?value==='on':!old;
  if(action==='fog')setFog(update);if(action==='labels')setLabels(update);if(action==='hazards')setHazards(update);
  if(action==='place'&&game.discovered.includes(value)){setSelected(value);setLayer(rooms[value].layer)}
 },[request]);
 const uid=useId().replace(/:/g,'');const mask='fog'+uid;
 const visible=(id:string)=>game.discovered.includes(id);
 const current=rooms[game.room];const selectedRoom=rooms[selected];
 const extent=zoom?`${current.x-3.5} ${current.y-3.5} 7 7`:'-6.2 -8.3 18.8 25.2';
 return <div className="atlas"><div className="toolbar"><button aria-pressed={layer===0} onClick={()=>setLayer(0)}>Surface</button><button aria-pressed={layer===-1} onClick={()=>setLayer(-1)}>Sewers</button><button aria-pressed={zoom} onClick={()=>setZoom(true)}>Local zoom</button><button aria-pressed={!zoom} onClick={()=>setZoom(false)}>Whole estuary</button></div>
 <div className="map-options"><label><input type="checkbox" checked={fog} onChange={e=>setFog(e.target.checked)}/> Fog</label><label><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/> Labels</label><label><input type="checkbox" checked={hazards} onChange={e=>setHazards(e.target.checked)}/> Hazards</label></div>
 <svg className="geographic-map" viewBox={extent} role="img" aria-label={`Geographic ${layer===0?'surface':'sewer'} map with terrain, streets, footprints and discovery fog`}>
  <defs><pattern id={'water'+uid} width=".6" height=".4" patternUnits="userSpaceOnUse"><path d="M0 .2h.3" stroke="var(--teal)" strokeWidth=".025"/></pattern><mask id={mask}><rect x="-20" y="-20" width="50" height="50" fill="black"/>{game.discovered.filter(id=>rooms[id].layer===layer).map(id=><circle key={id} cx={rooms[id].x} cy={rooms[id].y} r=".83" fill="white"/>)}</mask></defs>
  <rect x="-20" y="-20" width="50" height="50" fill="var(--soot)"/>
  <g className="map-terrain" mask={fog?`url(#${mask})`:undefined}>
  {layer===0?<>
   <rect x="-8" y="-10" width="24" height="28" fill={`url(#water${uid})`}/>
   <path d="M-5.8 -2.8 L-1 -3 0 -8 4 -8 6 -6.5 3 -4 10 -4 10 -.5 11.8 -.6 11.8 5.8 5.6 5.8 5.6 4.5 10.4 4.5 10.4 .5 4.5 .5 4.5 8 2 8 1.5 6 -.6 8 -1.5 3 -4 8 -4.7 5 -4 2 -5.8 1Z" fill="var(--gunmetal)" stroke="var(--ash)" strokeWidth=".035"/>
   <path d="M2.4 7.5H5.8V13.5H6V16H2.3Z" fill="#504A3F" stroke="var(--ash)" strokeWidth=".025"/><path d="M-.5 2.6H3.5V7.8L2.4 6.7 1.6 7.3 .5 6.8-.5 7.8Z" fill="#655640"/>
   <path d="M.5 3v3M2.5 3v3M0 4.5h3.5" stroke="var(--teal)" strokeWidth=".18"/>
   <path d="M-3 -2.5 -5.5 0 -3 2.5 -.5 0Z" fill="var(--ash)"/>
   <path d="M3.6 -3.5h6v3h-6Z" fill="var(--soot)"/>
  </>:<><rect x="-3.6" y="-3.6" width="11.2" height="7.2" fill="var(--gunmetal)"/><path d="M-.5 1h8M-.5 2h8M3 -3.5v5.5" stroke="var(--teal)" strokeWidth=".32"/></>}
  {geometry.streets.filter(s=>s.layer===layer).map(s=><g key={s.id+s.to}><path d={`M${s.x} ${s.y}L${s.x2} ${s.y2}`} stroke="var(--soot)" strokeWidth=".17"/><path d={`M${s.x} ${s.y}L${s.x2} ${s.y2}`} stroke="var(--ash)" strokeWidth=".025" strokeDasharray=".07 .08"/></g>)}
  {geometry.buildings.filter(b=>b.layer===layer).map((b,i)=><rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--soot)" stroke="var(--ash)" strokeWidth=".018"/>)}
  {geometry.shafts.map(s=><g key={s.id} aria-label={layer===0?'Ladder down':'Ladder up'}><title>{layer===0?'Ladder down — type down here':'Ladder up — type up here'}</title><path d={`M${s.x-.38} ${s.y-.12}v.3m.16 -.3v.3m-.16 -.24h.16m-.16 .09h.16m-.16 .09h.16`} fill="none" stroke="var(--amber)" strokeWidth=".045"/></g>)}
  </g>
  {Object.values(rooms).filter(r=>r.layer===layer&&visible(r.id)).map(r=><g key={r.id} role="button" tabIndex={0} aria-label={r.name+' map location'} onClick={()=>setSelected(r.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setSelected(r.id)}} className="map-location">
   <circle cx={r.x} cy={r.y} r=".22" fill="transparent"/><circle cx={r.x} cy={r.y} r={r.id===game.room?.18:.065} fill={r.id===game.room?'var(--amber)':r.safe?'var(--teal)':'var(--bone)'}/>
   {hazards&&r.warning&&!r.safe&&<path d={`M${r.x-.15} ${r.y-.15}l.15 -.24 .15 .24Z`} fill="var(--red)"/>}
   {labels&&(selected===r.id||r.id===game.room)&&<text x={r.x+.25} y={r.y-.2} fontSize=".24" fill="var(--bone)" stroke="var(--soot)" strokeWidth=".035" paintOrder="stroke">{r.name}</text>}
   <title>{`${r.name} · ${zones[r.zone].name} · L${r.level}`}</title>
  </g>)}
  {current.layer===layer&&<g className="map-player" data-room={game.room} aria-label={'You are here: '+current.name}><circle cx={current.x} cy={current.y} r=".29" fill="none" stroke="var(--amber)" strokeWidth=".04"/><circle cx={current.x} cy={current.y} r=".095" fill="var(--bone)"/></g>}
  {!zoom&&labels&&layer===0&&([['DISTRICT 67',1,-.9],['SALT QUAY',8.1,3.2],['CINDER UNION',6.4,-4.4],['REEDWARD FEN',1.7,8.4],['VITREOUS WARD',-3.1,-3.25],['SURVEY CROWN',2,-8.05],['LONG DIKE',4.4,9],['BELLWETHER',4.1,16.1]] as [string,number,number][]).map(([name,x,y])=><text key={name} x={x} y={y} textAnchor="middle" className="map-region" fill="var(--ash)" fontSize=".25" letterSpacing=".05">{name}</text>)}
  <text x={zoom?current.x-3:-5.7} y={zoom?current.y-3:-7.7} fontSize=".35" fill="var(--ash)">N ↑</text>
 </svg>
 <div className="map-legend"><span className="amber"><Sprite id="icon/you" palette={palette} label="Current location"/> You</span><span className="teal"><Sprite id="icon/refuge" palette={palette} label="Refuge"/> Refuge</span><span className="teal"><Sprite id="icon/shaft" palette={palette} label="Ladder"/> Ladder ↕</span><span>▰ Building</span></div>
 <p className="small">{visible(selected)?`${selectedRoom.name} · L${selectedRoom.level} · ${zones[selectedRoom.zone].shape}`:'Select a discovered location.'}</p>
 {visible(selected)&&['down','up'].filter(d=>selectedRoom.exits[d]).map(d=><p className="map-vertical small" key={d}>{d==='down'?'↓':'↑'} <code>{d}</code> → {rooms[selectedRoom.exits[d]].name}</p>)}
 <p className="muted small">{game.discovered.length} / {Object.keys(rooms).length} surveyed. Uncheck Fog to view terrain; unseen encounters remain hidden. Map markers inspect locations.</p></div>;
}
