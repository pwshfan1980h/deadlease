export type AttackKind='pistol'|'rifle'|'blade'|'blunt'|'electric'|'fire'|'claw'|'drain';
export interface EnemyDef {kind:AttackKind;human:boolean;windup:string;recovery:string;hpScale:number;damageScale:number;art:string}
const foe=(kind:AttackKind,human:boolean,windup:string,recovery:string,art:string,hpScale=1,damageScale=1):EnemyDef=>({kind,human,windup,recovery,art,hpScale,damageScale});
/** Names are visible identities. Art filenames remain stable across editorial changes. */
export const enemyRenames:Record<string,string>={
 'coupon ferret':'scrap weasel','compliance tadpole':'sump toad',guard:'checkpoint bruiser','dock raider':'quay reaver','marsh stalker':'reed strider','furnace hound':'cinder maw','glass wraith':'mirror husk','storm collector':'storm revenant','drain lurker':'culvert maw'
};
export const enemies:Record<string,EnemyDef>={
 'mudskipper hound':foe('claw',false,'It plants four webbed feet and flares its gills, gathering itself to pounce.','It skids on its wet belly, scrabbling to turn.','mudskipper-hound'),
 'pallid bankmaw':foe('claw',false,'Its pale bulk rises on four legs. The jaws open wide enough to take the railing with you.','It drags its heavy jaw through the boards, hauling its bulk around.','pallid-bankmaw'),
 'scrap weasel':foe('claw',false,'It crouches low, claws scraping for purchase.','It backs off, panting.','coupon-ferret'),
 'sump toad':foe('blunt',false,'Its throat swells as it braces its heavy tail.','It drags its tail back through the water.','compliance-tadpole'),
 'checkpoint bruiser':foe('blunt',true,'The bruiser plants both feet and raises the club.','The bruiser staggers back to recover their balance.','guard'),
 'quay reaver':foe('blade',true,'The reaver draws the hook back for a vicious swing.','The reaver hauls the hook free and catches their breath.','dock-raider'),
 'reed strider':foe('claw',false,'The strider folds its legs beneath it, ready to spring.','It pulls its claws free of the mud.','marsh-stalker'),
 'cinder maw':foe('fire',false,'Heat builds behind its cracked iron jaws.','Its jaws hang open, bleeding heat.','furnace-hound'),
 'mirror husk':foe('blade',false,'Its glass limbs draw together into a cutting edge.','Shards settle back into their loose orbit.','glass-wraith'),
 'storm revenant':foe('electric',false,'Amber current arcs between its shoulder coils.','The coils discharge harmlessly into the wet ground.','storm-collector'),
 'culvert maw':foe('claw',false,'It grips the brickwork, drawing its head back to lunge.','It recoils into a knot of scraping limbs.','drain-lurker'),
 'street cutthroat':foe('blade',true,'The cutthroat feints left and winds up a lunging cut.','The cutthroat retreats a pace to reset their footing.','street-cutthroat',.85,1),
 'harbor gunner':foe('rifle',true,'The gunner shoulders the rifle and settles their aim.','The gunner ducks behind cover to reload.','harbor-gunner',.85,1.1),
 'reed poacher':foe('rifle',true,'The poacher kneels, lining up a shot through the reeds.','The poacher works the bolt with muddy hands.','reed-poacher',.9,1),
 'tread brute':foe('blunt',true,'The brute locks both tank treads and raises a steel ram.','The treads grind backward as the ram resets.','tread-brute',1.2,.9),
 'shard duelist':foe('blade',true,'The duelist turns a mirrored blade toward your throat.','The duelist circles away, breathing hard.','shard-duelist',.85,1.1),
 'storm deserter':foe('rifle',true,'The deserter braces a long rifle against a broken railing.','The deserter ejects a smoking cartridge.','storm-deserter',.9,1.05),
 'alley marksman':foe('pistol',true,'The marksman steadies a pistol against the wall.','The marksman crouches to reload.','alley-marksman',.8,.85),
 'chain brawler':foe('blunt',true,'The brawler swings a loop of chain overhead.','The brawler coils the chain around a forearm.','chain-brawler',1.1,.9),
 'fen trapper':foe('blade',true,'The trapper draws a snare tight and reaches for a skinning knife.','The trapper resets the line between the reeds.','fen-trapper',.85,.95),
 'slag burner':foe('fire',true,'The burner opens a fuel valve. The pilot flame grows.','The burner closes the valve to repressurize the tank.','slag-burner',.9,1.1),
 'mirror sniper':foe('rifle',true,'A glint in the shattered glass betrays the sniper’s aim.','The sniper slips behind the glass to reload.','mirror-sniper',.75,1.15),
 'coil zealot':foe('electric',true,'The zealot lifts a staff. Current crawls along the copper wire.','The zealot grounds the staff and draws a ragged breath.','coil-zealot',.85,1.1),
 'sump knifer':foe('blade',true,'The knifer shifts weight onto the front foot, blade low.','The knifer ducks back into the doorway.','sump-knifer',.8,.85),
 'drain scavenger':foe('blunt',true,'The scavenger grips a pipe wrench with both hands.','The scavenger backs away, boots splashing in the runoff.','drain-scavenger',.8,.8)
};
export const enemyDefinition=(name:string)=>enemies[name]??enemies['checkpoint bruiser'];
