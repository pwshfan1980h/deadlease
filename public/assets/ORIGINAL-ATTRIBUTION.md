# District67 asset provenance

All nine pixel portraits, four icons and eight WAVs were created specifically for this project by Hermes using the reproducible source in `tools/generate_assets.py`. The packaged copies live at `src/district67/assets/`.

- **Portraits:** original, explicit pixel/polygon compositions, 64×64 RGB. Nine distinct silhouettes: three human-derived origins; Clerk Pell, technician Iona, broker Moth; gutter scavenger, escaped sump creature, contract guard. This is the slice's deliberately code-authored pixel art, not scraped art, AI image-model output, or an external game rip. No temporary placeholder PNGs remain.
- **Icons:** original 16×16 pixel symbols for health, radiation, supplies, clinic. Map markers are simple drawn lines and text glyphs.
- **Sound:** original standard-library PCM synthesis, mono 16-bit / 22050 Hz. Submit, error, hit, gunshot, heal, loot, death and a four-second industrial sine-tone ambience loop. These are synthetic game cues, not field recordings. No voice or music samples.
- **Palette:** exactly the approved eight base RGB colors in `district67.resources.PALETTE`. Portraits are nearest-neighbor scaled. Text antialiasing and OS-owned window chrome are not palette-limited pixel assets.
- **Fonts:** the application uses an installed monospace font (Menlo on the verified Mac, then DejaVu Sans Mono/Courier fallback). Native pygame_gui widgets use their bundled font, supplied and licensed by that dependency. No proprietary font is copied into this project.
- **Writing:** original District67 prose. General post-atomic corporate-survival inspiration was read at <https://mudstats.com/World/HellMOO>. No HellMOO names, rooms, prose, graphics or sounds are included.

`tools/audit_assets.py` validates palette membership, portrait count, text contrast and PCM peaks. Waveform safety and real mixer output were verified; subjective listening quality is not claimed as a human audio audition.
