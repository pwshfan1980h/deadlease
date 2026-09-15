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
