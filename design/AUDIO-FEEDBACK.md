# Conversation and level-up feedback

## Sound direction

- NPC response: a short four-note radio-like synth phrase, 0.72 seconds. Three variants rotate; each new reply stops the previous phrase. This replaces the generic submit beep for successful conversations, doctors, mission turn-ins with spoken thanks, speaking visitors and clinic intake.
- Level gain: a distinct 1.85-second rising phrase with a lower octave and sustained closing chord. Twice the chirp's peak amplitude before the shared effects-volume setting; no clipping. One fanfare per level-gaining action, even when that action grants several ranks.
- Both use the existing master/effects sliders and global mute. Music remains unchanged. The user reported that the music sounded good; further hands-on playtesting remains pending.

Generation: `scripts/build-feedback-audio.mjs`; provenance, durations and hashes: `public/assets/feedback-audio-provenance.json`. All four cues are original synthesis, shipped as local WAV files. `npm run audio:rebuild` regenerates them along with the existing synth assets.

## Trigger and lifecycle checks

- Talking successfully uses `npc-reply`; reading status, inspecting, and rejected talk do not.
- The fanfare compares the action's previous and resulting level, rather than looking for text in the transcript. Loading/resuming an already-leveled save doesn't trigger it.
- It starts just after the action's scheduled combat cues. A following ordinary command does not cancel a pending celebration.
- Pause/title/close, mute and death stop the celebration; replacing the current character/save clears pending feedback.
- `tests/audio.test.ts` checks routing, variant rotation, volume/mute, timing/cancellation and WAV bounds.
- `npm run test:feedback` exercises actual browser audio playback for intake, typed/clicked conversations, doctor, mute, pause, courier leveling, combat leveling and reload. Controlled fixtures select XP thresholds; they do not claim a natural campaign playthrough.
- Browser playback/decoding and signal checks establish that the cues trigger and are technically valid. Human listening acceptance—tone, balance against music and repetition comfort—remains pending.

## Suggested human check

Talk to the clerk and doctor, then earn a level from a fight or delivery. Reply sounds should be brief conversational chirps; the level cue should be unmistakable and more celebratory. Try your normal effects/music settings and report if either feels shrill, too loud, or repetitive.
