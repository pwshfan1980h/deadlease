# FREEBORN

The current game is FREEBORN: clinic-revived workers crossing the estuary toward a real city. See [the frontier and immersion pass](design/FREEBORN-pass.md) for the new regions, human enemies, class loot, courier work and city ending.

Next development milestones, acceptance criteria, testing, and documentation are tracked in [the development todo](design/DEVELOPMENT-TODO.md). The dismissible, in-play tutorial is the final phase.

Press **Escape** in the world for Resume, Settings, Controls, Save & load, Credits, and Return to title. See [the pause-menu guide](design/PAUSE-MENU.md) for keyboard behavior and verification.

The [interaction and fishing guide](design/INTERACTIONS.md) covers prose-only theft, scenery verbs, timed specials/locks/Morse, three fishing sites, fourteen catches, hostile fishing creatures, and missions from people. From the clinic: buy a telescopic fishing kit, go south then down, talk to Hal, and type `fish`. The collapsed kit uses one pack cell; every reel requires two timed Space presses. `missions` tracks personal requests; `jobs` keeps board contracts separate.

The [runs and combat guide](design/RUNS-AND-COMBAT.md) explains permadeath, packed revival drones, aiming/reload, bleeding, overheat and surrender. [Playtest sign-off](design/PLAYTEST-LEDGER.md) stays separate from automated verification. Six disposable saves let you test the new mechanics without a long journey.

The [environmental audio shortlist](design/AMBIENT-AUDIO.md) proposes biome soundscapes, initial CC0 source candidates, and the listening/testing checklist. These sounds are researched but not yet installed.

The [motion and jobs-board guide](design/MOTION-AND-BOARDS.md) covers animated title/travel/death presentation, hit reactions, reduced motion, and the first room-interaction milestone. At the clinic, type `read board` to discover paid work. Its original revival notes are historical; current rules are in the run guide below.


An offline single-player command RPG in the Marrow Estuary. District 67 is the starting neighborhood; the original Python app, assets and saves remain unchanged.

```sh
# From the source-branch repository root (or the local browser/ directory)
npm ci
npm run dev
```

Open the printed localhost URL. Node 24.18.0 was used. No API keys, accounts or backend are needed.

```sh
npm run assets:rebuild  # one command: editable art recipes → packed PNGs + JSON manifest
npm test
npm run audit:assets   # read-only pixel, packing and audio provenance audit
npm run build          # also rebuilds atlases, checks TypeScript, creates dist/
npm run preview
```

The noir art includes responsive landscape paintings and distinct painted portraits for 23 resident enemy identities and two fishing predators; type `view` to enlarge the current scene. The frontier pass adds four landscapes and fourteen human or humanoid portraits. Other rooms still use native 256×144 legacy scenes. The desktop workspace stacks the room, player data and command transcript. Tab opens the fixed map popover while exploring; travel pauses until it closes. Local and whole-estuary views are available. Atlas PNGs load for the current and adjacent areas plus shared portraits/icons, in the selected palette. Paintings load separately and preserve their authored colors.

Start with `talk clerk`, `s`, `e`, `talk technician`. `help` lists commands. The command input supports history, completion and log scrolling. Gameplay requires typed commands; nearby exits and available actions appear as non-clickable hints. Type `map`, `inventory`, `skills`, `journal`, `settings`, or `help` to open the relevant popover or reference panel. At Clinic Steps, type `down` to descend through the manhole into Steps Undercroft, then `up` to return. The map follows the current floor and marks ladders. Settings includes palettes, text size, audio credits, saves and recovery. A stale tab cannot silently overwrite another session: load the latest save, or explicitly recover a living branch. An ended identity cannot be restored through recovery. Conflicting branches can be downloaded from quarantine.

[Asset credits](public/assets/ATTRIBUTION.md) include the verified Helton Yan mecha effects, CC BY 4.0 links and conversion disclosure.

Hermes verified the real production build at **http://127.0.0.1:4178/**. To repeat the automated production scenarios after building:

```sh
npm run test:browser
```

It starts an isolated production preview on port **4187** and writes to a new `evidence/qa-production-*` directory. Checks include 1280×800 layout, hidden file controls, exact atlas crops after palette changes, PNG network requests, two-tab IndexedDB conflicts, import, recovery and mobile overflow. The scenario passed in real Chromium, including exact atlas crops, two-tab conflict preservation, export/import and corrupt IndexedDB recovery. A second independent production scenario passed both alternate palettes, malformed imports, mobile overflow and zero browser console/page/network errors. Evidence: `evidence/qa-production-qzCDwS/browser-verification.json`, `evidence/hermes-production-verification.json`; screenshots use the `evidence/hermes-production-*.png` prefix.

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for architecture, balance, evidence and remaining QA, and [RULES_DISPOSITION.md](RULES_DISPOSITION.md) for review resolutions.


### Painted noir and contextual audio

The default interface now uses charcoal, bone, rust/amber and slate. Full location compositions fit beside the prose on desktop and stack on mobile. Combat prioritizes its enemy portrait and actions. The remaining room-art rollout is documented in [ART-DIRECTION.md](design/ART-DIRECTION.md).

Travel Foley varies with stone, metal, water, mud, glass and ladders, with retreat/fatigue pacing and danger/refuge/radiation arrival cues. Battles use **Dark Fog** by Kevin MacLeod (Incompetech), CC BY 4.0, with 900 ms fades, reduced ambience and a separate Music slider. The unmodified MP3 is bundled locally; attribution appears in Settings and asset credits. `npm run audio:rebuild` reproduces the travel cues and retained procedural synth, without modifying the licensed track.

`npm run test:noir` runs the production art/audio playthrough, including a natural Commons ending, every enemy image, music transitions, mute/persistence and desktop/mobile layout. Evidence is written to `evidence/noir-review/`.

### Game menu

FREEBORN opens on a full-screen title menu. **Continue** resumes the current autosave; **New game** immediately enters the clinic with a dismissible backstory. Type `talk clerk` to choose name/origin, then class/bonus skill. Death ends the run and opens its record; a new patient starts fresh. A packed Stitch Drone can consume itself to prevent that death. **Menu** returns from play without advancing a turn. Starting another character preserves the prior game in the manual slot, and backing out of creation retains the previous session.

### Rare roaming visitors

While you stay in a room, a visitor can appear after 60–120 seconds, linger for 18–30 seconds, then leave. Subsequent visits have 120–240 seconds of quiet between them. There is one arrival and one departure line, with no periodic idle chatter. Moving rooms starts a fresh wait.

- Neutral couriers can be inspected or spoken to. Guarded refuges admit neutral visitors only.
- Defensive creatures leave you alone unless attacked. Type `inspect <name>` or `attack <name>`; plain `attack` also targets the sole passing creature.
- Hostile hunters take one opening attack on arrival. Combat then waits for typed commands, and the encounter is included in saves. Defeating a wanderer never marks a resident quest enemy as defeated.

Room activity pauses during combat, the Escape menu, settings, artwork viewing, the title menu, hidden tabs, and blocked autosaves. Visits are session-local and reset on load; there is no offline simulation or catch-up burst. `npm run test:roaming` exercises real React/Chromium behavior with an accelerated test clock; production timing stays slow.

### Published playtest

Play: https://pwshfan1980h.github.io/deadlease/
Published build repository: https://github.com/pwshfan1980h/deadlease

The primary design target is **3440 × 1440**. Ultrawide uses a 3200px game frame with three stacked sections: the current room, a compact player strip, and the command transcript. Gameplay has no masthead or permanent sidebar. Smaller desktop and mobile layouts remain available.

GitHub Pages publishes the `main` branch of the dedicated build repository. Its local checkout is `.pages-deploy/` (ignored by source tooling); only compiled game files and asset credits are uploaded. Run `npm run deploy:pages` from this directory to build and publish a subsequent update. It verifies the destination and refuses an already-dirty deployment checkout. GitHub then runs its Pages deployment.

Saves live in each browser and origin. To bring a localhost run to the hosted site, type `export` locally, then use Import save on the hosted title menu. There is no automatic cross-device save sync.

### Backpack and minimap

`inventory` (also `inv` or `i`) opens a painted, physical backpack. Drag multi-cell items into the grid, press **R** to rotate, or use arrows and Enter to pick up/place items. Escape cancels a carried item before closing the popover. Mouse controls are an intentional inventory exception; ordinary travel and combat remain typed. Rearrangement does not consume a turn.

- Canvas satchel: 6 columns, 3 base rows. Field backpack: 7 columns, 4 base rows. Expedition frame: 8 columns, 5 base rows. Grit, the current physical-strength attribute, adds one row per point above 3 (maximum 3 extra rows). Baseline starts at 6×4; Radborn starts at 6×5.
- Supplies and salvage stack in bundles of five. Equipment/artifacts have their own footprints. Equipped weapons and armor still occupy space; the active backpack itself does not.
- Larger bags can be purchased from merchants; an affordable, fitting backpack is equipped on purchase. Existing items retain their layout where possible. A smaller bag cannot be equipped if belongings would not fit.
- Full packs reject purchases/scrounging/ground collection without spending credits or removing loot. Kill rewards and oversized legacy saves remain intact in an Unpacked tray; repack, drop spare items or upgrade before traveling. Dropped non-quest items remain in the room. Quest artifacts and worn equipment cannot be dropped.
- Layout, rotations and backpack choice travel with autosave, manual save and JSON export. Older v2 saves gain a satchel on load, with all belongings retained.

**Tab** toggles a stationary minimap popover during exploration; Escape also closes it. It opens at a fixed world extent, on the current floor, with the player marker updated. Terrain is visible, but undiscovered encounters remain hidden. World actions and room activity pause while open. It is unavailable during combat, clinic intake, recovery or other modals. Map shortcuts: L local, W world, S surface, B below, F fog, G labels, H hazards. **Ctrl+Space** now completes commands; Tab retains normal focus navigation inside inventory and clinic popovers.

`npm run test:clinic` tests keyboard intake, the stack, map and death recovery. `npm run test:inventory` verifies drag/rotation/collisions, persistence, upgrades, modal guards and 3440/1280/390px layouts.

### Regression checks before publishing

Run **`npm run test:all`** for the full local release check: unit/campaign/save tests, TypeScript + production build, asset/audio integrity audit, then every Chromium playtest (general browser, art/audio, roaming, clinic/death, backpack/minimap, frontier, motion, jobs boards, and the Escape menu). It stops on the first failure and records the stage results in `evidence/full-verification.json`; browser suites also keep screenshots and their individual reports. Each stage has a five-minute timeout. Remote test URL overrides are ignored by this runner so it always checks the build being released.

**`npm run deploy:pages` now requires this complete check to pass before changing the deployment checkout or pushing.** Individual suites remain available for focused checks during development. Screenshots and layout assertions help catch visual regressions, but art quality, pacing and game feel still need human playtesting.

The [interaction guide](design/INTERACTIONS.md) records prose-only theft, consequences, and the planned verb/timing/fishing expansion.

### Source and publishing

The GitHub **source** branch contains the editable browser game, tests, art inputs and documentation. **main** contains the GitHub Pages build. Clone with `git clone --branch source https://github.com/pwshfan1980h/deadlease.git`; then `npm ci` and `npm run dev`. Atlas inputs are bundled under `art-source/`, so no sibling Python checkout is needed. Original Python files in the local District67 project are untouched.

`npm run test:all` performs unit tests, a production build, asset/provenance checks and twelve browser suites. Compact release reports are kept in `design/verification/`; large screenshots/videos are generated locally under ignored `evidence/`. For a publish checkout, run `git clone --branch main https://github.com/pwshfan1980h/deadlease.git .pages-deploy`, then `npm run deploy:pages`. The publish command runs the full gate before committing or pushing the built game.
