// Native 16×16 palette-index recipes. Coordinates are source art, never atlas rects.
function icon(kind:string){const p=new Uint8Array(256);for(let y=2;y<14;y++)for(let x=2;x<14;x++){
 if(kind==='refuge'&&(y>=7&&x>=4&&x<=11||y<7&&Math.abs(x-7.5)<y-1))p[y*16+x]=6;
 if(kind==='shaft'&&(x===7||x===8||y===7||y===8))p[y*16+x]=7;
 if(kind==='you'&&(x-7.5)**2+(y-7.5)**2<25)p[y*16+x]=4;
}return p}
export const iconPixels=Object.fromEntries(['you','refuge','shaft'].map(name=>[name,icon(name)]));
