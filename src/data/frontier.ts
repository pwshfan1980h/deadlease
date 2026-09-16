import type {Room,Zone} from '../world';
export const frontierZones:Record<string,Zone>={
 shallows:{name:'Lamplight Drains',band:[1,2],shape:'shallow western maintenance loop',terrain:'sewer',description:'West of Hal’s undercroft, low brick channels offer a gentler first expedition.'},
 wilds:{name:'The Long Dike',band:[2,4],shape:'southern wilderness road with a reedland loop',terrain:'marsh',description:'Beyond Reed Terminus, the dike crosses open wetlands to Bellwether.'},
 bellwether:{name:'Bellwether',band:[2,3],shape:'small frontier town around a post yard',terrain:'city',description:'A distant settlement of ferrymen, mechanics and couriers. Warm lamps mark the post.'}
};
// id, x, y, level, name, description, enemy (empty for peaceful rooms), safe
const rows:[string,number,number,number,string,string,string,boolean][]=[
 ['shallows-0',-1,1,1,'Lamplight Junction','Dry bricks lead west beneath low arches. Hal has tied amber lamps along the shallow channel. The stronger currents of the deep drains lie back to the east.','',false],
 ['shallows-1',-2,1,1,'Copper Run','Copper pipes sweat above ankle-deep water. A human scavenger blocks the ledge with a stolen pipe wrench, watching your hands rather than your face.','drain scavenger',false],
 ['shallows-2',-3,1,1,'Lampkeeper Nook','A stove warms a dry recess behind wire mesh. A calm watch tends the lamps and trades spare tools with anyone willing to lower their weapon.','',true],
 ['shallows-3',-3,2,1,'Settling Steps','Broad steps descend into a shallow settling pool. A small sump toad noses through floating leaves, its heavy tail brushing the lowest step.','sump toad',false],
 ['shallows-4',-2,2,2,'Broken Sieve','A split filter basket catches scraps of fabric and driftwood. Someone has laid boards across the channel, leaving a dry route around the deepest water.','',false],
 ['shallows-5',-1,2,2,'Wrench Bend','Water curls around a tight brick elbow. A scavenger with a patched respirator works a wrench free from a valve and turns at the sound of your boots.','drain scavenger',false],
 ['shallows-6',-3,3,1,'Dry Sump','The waterline has fallen below a bed of clean gravel. Small tracks pass between discarded tins, then disappear beneath a loose drainage grate.','scrap weasel',false],
 ['shallows-7',-2,3,2,'Inspection Ledge','A narrow inspection ledge ends at a sealed flood door. Chalk arrows point back toward the lamps; beyond the steel you can hear a much deeper current.','',false],
 ['wilds-0',3,8,2,'Last Streetlight','The last streetlight leans above the end of the paving. South, a gravel dike cuts across open wetlands. Bellwether’s bell is faint enough to mistake for wind.','',false],
 ['wilds-1',3,9,2,'Rook Causeway','Rooks lift from the gravel ahead of you. There are no roofs now, only reeds, a low grey sky and the distant line of the road raised above the tide.','',false],
 ['wilds-2',3,10,2,'Broken Toll','A collapsed toll hut gives shelter to a cutthroat with a hooked knife. The road continues beyond the wreckage toward a small bridge over black water.','street cutthroat',false],
 ['wilds-3',3,11,2,'Wayfarer Fire','A watch has kept a cooking fire alive beneath a rock overhang. Travelers dry their socks here, share directions and sleep with their packs under their heads.','',true],
 ['wilds-4',3,12,3,'Wind Pump Rise','A wooden wind pump turns slowly above the dike. Through its legs you glimpse a poacher waiting with a rifle laid across a rolled raincoat.','reed poacher',false],
 ['wilds-5',3,13,3,'Blackwater Bridge','The bridge flexes over a wide tidal creek. Its handrail carries fresh rope repairs and a painted bell, the first sign that Bellwether is close.','',false],
 ['wilds-6',4,10,2,'Heron Track','A narrow footpath leaves the dike and follows a line of pale stones. Herons stand knee-deep in the water, perfectly still until your shadow reaches them.','',false],
 ['wilds-7',4,11,3,'Reed Hide','A hunter’s hide stands on stilts above the pools. A reed poacher moves behind its woven screen, the end of a rifle following the path below.','reed poacher',false],
 ['wilds-8',4,12,4,'Sunken Orchard','The crowns of dead fruit trees break the water. A reed strider moves between them with long careful steps, scarcely disturbing their reflections.','reed strider',false],
 ['wilds-9',5,10,2,'Salt Meadow','Dry grass ripples over a ridge of pale salt. Beyond it the open marsh runs to the horizon, crossed by nothing but bird tracks and the wind.','',false],
 ['wilds-10',5,11,3,'Lost Survey Camp','Collapsed canvas clings to rusted poles. A cold kettle still hangs above the fire pit, and the survey stakes now point into water too deep to cross.','',false],
 ['wilds-11',5,12,3,'Flood Marker','A carved post records floods taller than a person. Old bootprints turn back from its base toward the dike, where a shelter fire still shows through the mist.','',false],
 ['bellwether-0',3,14,2,'Bellwether Gate','Warm lanterns hang from a low timber gate. An armed town watch checks incoming packs and points couriers toward the post yard just south of the bridge.','',true],
 ['bellwether-1',3,15,2,'Bellwether Post','Mailbags hang beneath the post yard awning. Postkeeper Ada sorts parcels on a long wooden table, setting aside a dry place for deliveries from District 67.','',true],
 ['bellwether-2',4,14,2,'Rope Market','Rope makers share a covered market with a traveling gunsmith. The watch keeps the aisles clear, and every stall has a lamp burning above its wares.','',true],
 ['bellwether-3',4,15,2,'Lantern Inn','A broad stove heats the inn’s common room. Boots steam beneath long benches while exhausted travelers trade stories over bowls of root broth.','',true],
 ['bellwether-4',5,14,3,'East Workshops','The town’s last workshop opens onto an unguarded track. A cutthroat has crept between the shuttered sheds, looking for packs left outside the doors.','street cutthroat',false],
 ['bellwether-6',6,14,3,'Smugglers Lane','Behind the workshops, a narrow lane descends toward an abandoned landing. A street cutthroat waits between stacked crates, watching the bags of travelers who leave the market.','street cutthroat',false],
 ['bellwether-5',5,15,3,'Bell Tower Yard','The low bell tower overlooks the wetlands and the distant industrial haze. Its rope is freshly repaired, and an armed watch keeps the yard open to travelers.','',true]
];
export const frontierRooms:Room[]=rows.map(([id,x,y,level,name,description,enemy,safe])=>({id,x,y,level,name,description,enemy,safe,zone:id.split('-')[0],layer:id.startsWith('shallows')?-1:0,exits:{},guard:safe?'Lantern watch — calm armed human':'',npc:id==='bellwether-1'?'postkeeper':'',warning:safe?'Weapons stay lowered here. Rest freely and trade supplies.':'',respawn:!!enemy,radiation:0,salvage:!safe,loot:(!safe?{salvage:1}:{}) as Record<string,number>,scene:id.startsWith('shallows')?'sewer':id.startsWith('wilds')?'marsh':'street'}));
