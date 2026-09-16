# Deadlease asset credits

## Helton Yan sounds — Creative Commons Attribution 4.0

Creator: **Helton Yan**. Packs: [FREE Retro Mecha SFX](https://heltonyan.itch.io/retro-mecha-sfx) and [FREE Pixel Combat SFX](https://heltonyan.itch.io/pixelcombat). Licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

| Shipped file | Source recording | In-game use |
| --- | --- | --- |
| sounds/helton-rapid.wav | Mecha Laser Machine Gun / Moonsec rapid.wav | Stylized ranged attack |
| sounds/helton-hit.wav | Mecha Laser Pistol hit / Moonsec hit.wav | Stylized impact / ability |
| sounds/helton-death.wav | Explosion Forced Shutdown / Moonsec death.wav | Clone death |

Changes: Moonsec converted the originals to **16-bit mono 44.1 kHz**. **No further edits, trimming or normalization** were applied for Deadlease; these are byte-identical copies of the identified Moonsec files. Playback gain follows the user's volume settings. These are designed laser/mecha effects, not realistic firearm recordings.

The source mapping is recorded in Moonsec commit `666a715cd4504fd3bdfd9c5cacf579ca12e3f88e`. `audio-provenance.json` records titles, license/source links, change disclosure, and shipped SHA-256 digests. The Moonsec project was read only. No unrelated voices, music or unverified cues were copied.

## Original District67 assets and browser art

The eight original WAV files remain byte-identical to `src/district67/assets/sounds/`. Original deterministic compositions and synthesized PCM were created by Hermes using `tools/generate_assets.py`; existing provenance is retained in [ORIGINAL-ATTRIBUTION.md](ORIGINAL-ATTRIBUTION.md). Original portraits are read from the unchanged Python source assets and packed at native 64×64 resolution, with exact palette substitutions for Ember/Tidal.

Browser room recipes in `browser/src/art.ts` create all 122 distinct 256×144 compositions. `browser/src/icon-art.ts` supplies three native 16×16 map symbols. `npm run assets:rebuild` deterministically packs rooms into area PNG atlases and portraits/icons into a shared atlas for each palette, with two-pixel edge extrusion and an automatic JSON rectangle manifest. Runtime draws cropped atlases without smoothing. No loose room, portrait or icon PNGs ship.

The original eight-color palette is unchanged. Ember and Tidal use exact RGB substitution. Source recipes, names, prose, quests, classes and ability descriptions were authored for this expansion; original room and ending prose remains in copied JSON. No external room imagery or image-model generation was used.

Sound begins after a user gesture. Master/effects/ambience volume and mute persist. Missing or rejected playback never prevents gameplay. File identity and PCM headroom are audited; no subjective human audition is claimed.

## September 2026 painted noir revision

The browser's default palette now uses neutral charcoal, bone, rust/amber and slate. The Python prototype keeps its source palette. Legacy atlas portraits are mapped from that fixed source palette into the selected browser palette.

`paintings/` contains three full-scene paintings (Reclamation Clinic, Clinic Steps, Pump Hall) and nine distinct enemy portraits. These were generated with the built-in OpenAI image generation tool on 2026-09-15, using the new clinic painting as a style reference. Prompts are recorded in `browser/design/painting-prompts.json`. They are authored-color PNGs, independently loaded and never palette-remapped. Other rooms currently use their legacy indexed scenes. This revision supersedes the historical “no image-model generation” and “no loose PNGs” statements above for these new paintings.

## Travel Foley and retained procedural music

- `sounds/travel-*.wav`: 21 original synthesized PCM cues from `browser/scripts/build-travel-audio.mjs`. Six surfaces have three variations each; refuge, danger and radiation each have an arrival cue. Source and byte hashes: `travel-audio-provenance.json`.
- `music/under-pressure.wav`: **Under Pressure**, an original procedural 72 BPM, eight-bar synth composition for Deadlease. Sine harmonics, filtered deterministic noise, synthesized bass and percussion; no third-party music or samples. Source: `browser/scripts/build-battle-music.mjs`. Byte hash and format: `music/provenance.json`.

## Battle music — Incompetech

“Dark Fog” Kevin MacLeod (incompetech.com)  
Licensed under Creative Commons: By Attribution 4.0 License  
https://creativecommons.org/licenses/by/4.0/

- Track page: https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1300031
- Original download: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dark%20Fog.mp3
- Local file: `music/dark-fog.mp3`; source and byte hash: `music/incompetech.json`.
- The MP3 is unmodified. Playback volume adjustment, looping and encounter fades are applied in-game.

Music has a separate persistent volume control, fades at encounter boundaries and resumes without restarting each combat turn. Mute stops all channels. The earlier generated Under Pressure asset and generator are retained, but Dark Fog is the active battle track.

## Painted inventory objects and backpacks

`items/noir-inventory-atlas.png` and `items/noir-backpacks.png` were generated for Deadlease using OpenAI's built-in image generation tool (September 2026). Industrial noir art direction: worn canvas, iron, brass, bone and rust. Runtime displays item regions from the original sheets and rotates the presentation for packing. No external stock art is used for these assets. Exact authoring prompts are retained in the source project at `design/inventory-art-prompt.txt` and `design/backpack-art-prompt.txt`.


## FREEBORN expansion (September 2026)

The fourteen human enemy illustrations, Lamplight Drains, Long Dike, Bellwether, and the distant city view were generated with the built-in OpenAI image generation tool. Prompts and project paths are recorded in `design/freeborn-art-prompts.json`. Existing paintings retain their original credits.

Combat Foley in `attack-*.wav` is original procedural synthesis, generated by `scripts/build-combat-audio.mjs`. It uses no third-party samples. These 16-bit mono PCM files run at 22.05 kHz; hashes and peak levels are recorded in `combat-audio-provenance.json`.

## Fishing illustrations (September 2026)

`items/estuary-fishing-atlas.png` contains the collapsed kit, bait tin, and fourteen original catches. `paintings/fishing-jetty.png`, `fishing-drains.png`, and `fishing-creek.png` provide the three fishing views. Generated with OpenAI’s built-in image generation tool; original PNGs, with runtime atlas cropping and CSS ripple/reveal animations. Prompts: `design/fishing-art-prompts.json`. Dimensions and hashes: `fishing-art-provenance.json`.

Fishing predators `paintings/mudskipper-hound.png` and `paintings/pallid-bankmaw.png` were generated using the same built-in tool and art direction. Prompts: `design/fishing-predator-prompts.json`; hashes and dimensions are included in `fishing-art-provenance.json`.

## Stitch Drone and revival cue

`items/stitch-drone.png` is original generated industrial-noir item art made with the built-in OpenAI image generation tool; exact prompt: `design/stitch-drone-prompt.json`, dimensions/hash: `run-art-provenance.json`. No bitmap edits. `sounds/attack-revive.wav` is original procedural synthesis from `scripts/build-combat-audio.mjs`; no external samples.

## Complete location painting pass (September 2026)

All 149 `locations/*.jpg` scenes were generated with OpenAI’s built-in image generation tool for FREEBORN. Individual full-scene paintings replace shared room backgrounds. Original PNGs were converted to JPEG at quality 84 for web delivery without cropping. Targeted generated edits remove misleading vertical passages, permanent encounter figures, and unwanted lettering. Exact prompts and edit references, dimensions, and SHA-256 hashes are recorded in `location-art-provenance.json`; source authoring catalog and per-room receipts are in `design/location-art/`.

## Conversation and level-up feedback

`sounds/npc-reply-1.wav` through `npc-reply-3.wav` and `sounds/level-up.wav` are original offline synth compositions generated by `scripts/build-feedback-audio.mjs`. No external recordings or samples. Three 0.72-second conversational phrases and one 1.85-second rising fanfare; 22.05 kHz, mono, 16-bit PCM. Exact hashes, peaks and RMS levels: `feedback-audio-provenance.json`.
