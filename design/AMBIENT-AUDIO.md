# FREEBORN — environmental audio shortlist

Research: 2026-09-15. Status: proposed; source metadata and licenses checked, recordings not yet auditioned or installed. This document does not mark an audio implementation complete.

## Direction

Give each environment a quiet continuous background plus occasional distinct sounds. Leave space for reading, footsteps, attacks, and music. The current `src/audio.ts` uses one shared `ambience.wav`; contextual travel sounds and combat ducking already exist.

Start with sewers, rainy streets, and exposed wilderness. These should create the clearest audible change on an ordinary early journey.

| Environment | Continuous background | Occasional detail | Character |
| --- | --- | --- | --- |
| Lamplight Drains | Gentle water flow and faint ventilation | Individual drips, small drip clusters, distant pipe knock | Close, damp brick; short reflections |
| Deep Drains | Lower, more distant water flow | Drips with longer tails; rare metal resonance | Larger empty chambers, without constant ominous stings |
| District 67 / clinic | Rain on exposed surfaces; filtered rain indoors | Gutter spill, electrical relay, roof tick | Shelter audibly softens the street |
| Salt Quay | Water against pilings | Rope strain, timber creak, very rare distant horn | Open water and decaying infrastructure |
| Long Dike / Reedward Fen | Wind through grass or reeds, low water movement | Occasional reed rustle or distant bird | Space and relative quiet outside civilization |
| Cinder Union | Distant motor and ventilation | Steam release, cooling metal settling | Machinery has weight, but does not hammer continuously |
| Vitreous Ward | Thin drafts through abandoned structures | Loose pane or frame creak | Fragile, empty architecture; avoid constant glass breaking |
| Survey Crown | Exposed wind | Distant thunder, cable vibration | Height and exposure; a faint distant aircraft near the city vista could foreshadow the ending |
| Bellwether refuges | Muffled weather, a small stove where described | Timber settling, a rare distant bell | A warmer resting place after the wilderness |

Only attach sounds to things supported by the room. A stove or aircraft here is a content proposal, not an assertion that every relevant room already contains one. Avoid ambient footsteps, speech, gunshots, and creature cries that players could mistake for an actual enemy arrival.

## Verified source candidates

The source pages below list CC0. Keep source, author, license, acquisition date, and any edits in the asset manifest even when attribution is optional. Audition originals before selecting; the descriptions below are source metadata, not listening judgments.

| Candidate | Author / source | Potential use | Selection note |
| --- | --- | --- | --- |
| [Dripping water loop](https://opengameart.org/content/dripping-water-loop) | Independent.nu, submitted by qubodup; OpenGameArt | Sewer background | Listed FLAC is approximately 1.3 MB; check whether its drip rhythm becomes recognizable |
| [Water drop / Splash](https://freesound.org/people/bxyorna/sounds/410335/) | bxyorna; Freesound | Sparse individual drips | 1.083-second mono recording; useful candidate for subtle panning and room-specific reflections. Download requires login |
| [Rain (loopable)](https://opengameart.org/content/rain-loopable) | Ylmir; OpenGameArt | Streets and sheltered clinic rain | Four 25–45-second recordings, supplied as MP3 or OGG; check loop boundaries and stereo processing |
| [wind1](https://opengameart.org/content/wind1) | Luke.RUSTLTD; OpenGameArt | Dike and Crown wind | Five one-minute synthesized variants; select one or two after checking for obvious repetition |

Natural water and rain are good recording candidates. Low motor hum, ventilation, electrical buzz, and distant pipe resonance can also be synthesized locally, following the existing attack/travel audio workflow. Specific harbor, reed, and stove recordings still need sourcing and auditioning.

## Mix and behavior proposal

- Prototype one background loop and at most two simultaneous detail sounds. Start very quietly; avoid normalizing every drip to the same loudness as an attack.
- Try varied drip spacing around 3–12 seconds, with occasional clusters and longer gaps. Reserve conspicuous pipe knocks or horns for much longer intervals, initially 30–90 seconds. Tune by listening, not by treating these numbers as fixed rules.
- Use several source variations before applying small pitch/volume differences. Keep stereo position modest; drips should inhabit a room rather than jump between ears.
- Crossfade environment changes over roughly 1–2 seconds. Continue the same background across neighboring rooms with the same profile instead of restarting it at every step.
- Tie background changes to the visible destination during traversal. Cancel obsolete transitions on rapid movement; never accumulate abandoned loops.
- Keep the existing combat ambience reduction (to 30% of its normal level). Suppress conspicuous background details during combat and death/intake presentation so attacks and dialogue remain clear.
- Preserve master mute and the ambience slider. Start only after the player's audio gesture; suspend environmental audio on hidden tabs and outside the active world. Resume without replaying missed events.
- Use separate cosmetic randomness. Ambient playback must not consume loot/combat random draws, change saves, advance turns, or add transcript chatter.
- Consider a state-reactive pump: once repaired, nearby rooms gain a quiet running-water/mechanical sound. This makes a completed action perceptible without another status message.
- Bundle selected compressed files with the game and load relevant profiles on demand. Do not hotlink sound libraries. Existing static hosting needs no new backend for this approach.

## Implementation and verification queue

- [x] Inspect current ambience routing and identify the shared-loop limitation.
- [x] Find initial water, rain, and wind candidates and check their source-page licenses.
- [ ] Audition candidates; select, edit, compress, and record provenance. Reject audible seams, distracting rhythms, clipping, or distracting stereo movement.
- [ ] Implement profile mapping with room overrides, cancellable fades, bounded detail scheduling, and audio lifecycle cleanup.
- [ ] Ship a complete first slice: clinic/street → Lamplight Drains → street, then exposed wilderness.
- [ ] Test rapid travel, same-profile travel, mute/unmute, zero ambience volume, hidden-tab resume, failed media playback, combat ducking, death, and return to title.
- [ ] Assert that sounds never alter game state, gameplay randomness, or the transcript. Verify no extra active loops/timers remain after leaving the world.
- [ ] Listen on headphones and speakers through a 30–45-minute session, including quiet reading and repeated courier trips; record repetition and fatigue observations.
- [ ] Document player settings and profile authoring; run the normal release gate before marking implementation complete.

This is cross-cutting immersion work alongside the existing roadmap. The tutorial remains last.
