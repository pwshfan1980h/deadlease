# Deadlease — painted industrial noir

Approved direction: painted industrial noir, charcoal and bone, oxidized rust, warm practical lamps, cold slate daylight. Green is a scarce radiation cue, not an overall color cast.

## Visual grammar

- Rooms are environmental paintings with a clear focal object and three depth planes. Show how people live here: coats, paper notices, chipped mugs and repaired infrastructure. Keep the dry bureaucratic humor in the prose and small props.
- Preserve each full 16:9 composition in the room panel. Desktop pairs art and prose; mobile stacks them. Typing `view` opens the full location image in a keyboard-accessible modal.
- Keep UI surfaces neutral, borders subdued, typography legible. Amber indicates selected controls; slate indicates navigation; bone is health; yellow-green is radiation; rust-red warns of combat.
- Enemy portraits share materials and light, but use individual silhouettes. Every current enemy has its own painting; no generic scavenger portrait substitution.
- Paintings retain authored colors when UI palettes change.

## Implemented slice

Three room paintings: clinic, steps, pump. Nine enemy portraits: coupon ferret, compliance tadpole, guard, dock raider, marsh stalker, furnace hound, glass wraith, storm collector, drain lurker. Generated via the built-in image tool. Exact prompts: `painting-prompts.json`. Runtime mapping: `src/paintings.ts`.

The remaining 119 room illustrations and friendly/player portraits are still legacy art. This is a playable direction prototype, not a claim that all 122 rooms have been repainted.

## Sound

Travel material follows the destination, with ladder priority when changing layers. Actual new encounters take precedence over radiation arrival cues. Entering refuge from outside produces a quiet release. Footsteps vary between three takes, quicken while fleeing and slow below 25% stamina. A new move stops the previous sequence. Invalid moves, reading and death relocation do not produce travel sounds.

Battle music: **Dark Fog** by Kevin MacLeod (Incompetech), 71 BPM, CC BY 4.0. Original MP3 bundled locally; attribution in Settings and asset credits. 900 ms entry/exit fades, independent music slider, ambience reduced during combat. The earlier procedural synth remains as a retained source asset. Existing Helton Yan combat effects retain their credits.

## Next visual improvements

1. Repaint the rest of the starting district, prioritizing square, alley, sump and booth. Each needs a unique composition, not a recolored clinic.
2. Establish one key painting per outer region before producing its other rooms: tidal pewter quay, ochre reed marsh, ember foundry, pale fractured glassworks, storm-blue crown, black-water sewers.
3. Replace friendly and player portraits to remove the remaining pixel/painting mismatch.
4. Create changed-state pump/booth paintings and restrained combat-state emphasis. Avoid motion that interferes with reading.
5. Compress production copies of the paintings after the art is locked; preserve source originals and full-view quality.

## Rebuild

`npm run audio:rebuild` reproduces the original travel and music WAVs. `npm run build` repacks legacy atlases and builds the application. Paintings are authored assets and are not overwritten by the atlas builder.

## Backpack and atlas interaction pass

The world, compact character strip and transcript form one vertical stack. Borders are quiet separators; no gameplay logo or permanent reference sidebar. Clinic intake and death recovery take place over the scene.

Inventory deliberately restores the pointer. Painted items have rectangular footprints, finite bundles, 90-degree rotation and collision previews on a stitched canvas grid. The atlas uses a fixed popover and world extent with a ring around the current position. Tab toggles it only during exploration; travel cannot occur through the modal.

Item illustrations were generated using the built-in image tool. Assets: `public/assets/items/noir-inventory-atlas.png` (23 item paintings in a 5×5 sheet) and `public/assets/items/noir-backpacks.png` (three bag designs). Prompts: `inventory-art-prompt.txt`, `backpack-art-prompt.txt`. Runtime uses SVG viewports over the original sheets without changing the authored pixels.
