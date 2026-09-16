# Motion and jobs-board milestone

## Implemented behavior

### Motion

- Title: the existing clinic painting slowly moves beneath rain, mist, and warm light. The title settles into place; menu controls work immediately.
- Travel: the existing 160 ms departure and 220 ms arrival now move a short distance in the direction of travel. Ladders use a stronger vertical movement. The command line and player strip remain still. No additional waiting time was added.
- Death: a full-screen, one-shot pulse trails into a flat line while the light fades. Escape, the dismiss control, and the current continue action work throughout the animation.
- Hits: actual damage events identify the affected side. Enemy artwork shakes for 210 ms at the player's impact cue; the player portrait reacts at the enemy's later impact cue. Compact layouts that hide the portrait use the HP readout. Misses, wind-ups, and recovery do not produce hit reactions. Fatal hits yield to the death screen; a defeated enemy's removed art is not held on screen to delay gameplay.
- Motion can be disabled from the title or settings. The preference persists independently of character saves. OS reduced motion also suppresses motion. Background-page atmosphere pauses, and pending hit animations are cancelled when leaving gameplay or changing the motion preference.

Animation is presentation, not a turn clock. Command outcomes and save transactions remain immediate; the short travel transition retains its existing input guard. Death still uses the current clinic recovery rules. The separately planned terminal run state and revival drone are **not implemented by this milestone**.

### Jobs boards

Reclamation Clinic, Freight Yard, and Bellwether Post now describe a physical jobs board. After first character creation, the clerk gives one short introduction to paid work; room revisits and save reloads do not replay it.

At these locations, `read board`, `read jobs board`, `inspect board`, `look at board`, and the authored board aliases show the same work listing as `jobs`. Reading is free and does not mutate the save. Active parcel details replace offers until the delivery is completed, as with the existing work journal.

Local hints show `read board`; Ctrl+Space completes local object commands. Away from a board, attempts to read one give its locations and point to the portable `jobs` journal. Existing typed mission acceptance and delivery remain unchanged.

## Authoring and implementation

`src/roomObjects.ts` defines the first readable objects. Each has a stable `id`, `room`, visible `name`, accepted `aliases`, a room `description`, supported `verbs`, an `action`, and an optional concise `hint`. Board descriptions are appended when the world is assembled. Only objects with an explicit hint enter completion and local hints; valuable opportunities can be prose-only.

The later [interaction pass](INTERACTIONS.md) adds persistent `theft` objects with state-aware prose and watch encounters. Persistent lockers, searchable remains, machine actions, and their state/migrations remain separate Phase 1 work. Do not invent a new action value without adding its engine behavior and tests. Prefer specific nouns; multiple local matches are rejected with a choice of IDs rather than acting on the wrong object.

`src/Motion.tsx` contains the decorative title layers, death signal, and transient hit feedback. `src/motion.css` owns timing and motion overrides. `CombatCue.impact` in `src/engine.ts` marks landed damage alongside the matching audio event. These cues are not serialized into saves. `Sound.sequence` and the visual feedback use the same millisecond offsets. Actual audible timing still depends on the browser's audio loading and playback.

When adding an attack, emit an impact only for actual damage; net HP differences cannot identify all hits because an action can heal before an enemy responds. Never attach gameplay effects to animation completion callbacks.

## Generated video feasibility

Short video assets can be included in a static Pages build. GitHub's published-site limit is 1 GB and its soft bandwidth limit is 100 GB/month ([official limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), checked September 2026).

Proposed first video scope: one 5–10 second title loop, followed by an optional short death clip. Aim for compressed 720p/1080p assets of a few megabytes each and measure the result; do not create a video for every room. Use an MP4 source, a static poster, silent inline playback, and lazy loading. Reduced motion, playback failure, or unavailable media should keep the static art visible. Pause when hidden and stop when leaving the screen. Gameplay controls and death dismissal must never wait for video playback.

This milestone uses existing paintings plus CSS/SVG/browser animation. No AI-generated video has been created or added. A video-generation tool is not currently available in this task. The `motion-playtest.webm` evidence is a recording of the implemented UI, not generative footage.

## Verification and repeatable player routes

- `tests/motion.test.ts`: landed hit/miss timing, healing before damage, non-damaging responses, ability effects, and hostile visitor impacts.
- `tests/room-objects.test.ts`: authored descriptions, scoped completion, board aliases, unchanged state, wrong-room handling, active parcel reload, and completed payment.
- `npm run test:motion`: title/menu responsiveness, persisted motion preference, background pause, walking/ladders, audio/visual dispatch offsets, reduced motion, death dismissal, and responsive screenshots. Evidence: `evidence/motion-pass/`.
- `npm run test:boards`: fresh character → clerk/room clue → `read board` → accept → clinic/yard round trip → payment, without global help; also absent boards and Bellwether. Evidence: `evidence/jobs-board-pass/`.
- Both suites are part of `npm run test:all`. Record final outcome in `evidence/full-verification.json` and the development todo after checks pass.

Manual animation check: watch the title, toggle Motion off/on, create a character, then walk `s`, `down`, `up`. Fight in Scrap Alley and compare successful hits with misses and wind-ups. The text entry must remain steady. Test death using an isolated throwaway character/save; keep personal saves untouched.

Manual board check: create a character, follow the clerk's board clue, `read board`, `accept freight-return`, `e`, `e`, `e`, `deliver parcel`. Read the yard board, accept the clinic return, and retrace three westward moves. The second delivery should pay once and leave further work available.

Final verification: `npm run test:all` passed all 101 unit tests, build, asset audit, and eight browser suites. Settings Escape behavior with focused motion checkboxes is explicitly checked. Visual evidence was reviewed at ultrawide, compact desktop, and mobile sizes.
