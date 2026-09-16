# Browser expansion — historical implementation report

This report describes earlier Deadlease milestones. Its counts, enemy names, layout descriptions, and environment/QA limitations are historical. For current FREEBORN behavior, use [the frontier pass](design/FREEBORN-pass.md), [motion and jobs boards](design/MOTION-AND-BOARDS.md), and the latest [verification report](evidence/full-verification.json). Planned mechanics are separately tracked in [the development todo](design/DEVELOPMENT-TODO.md); a planned checkbox is not evidence of implementation.

## Final Hermes verification (supersedes historical QA notes below)

- **54 tests pass across 14 browser-side files**; **38 Python tests pass**. All 41 recorded Python source/data/asset hashes remain unchanged.
- Production build and deterministic atlas audit pass. Clean isolated `npm ci` installed 104 packages; npm's local allow-scripts policy skipped the optional fsevents install script with a warning, without blocking installation/build/play.
- `npm run test:browser` passed real production Chromium: compact 1280×800 layout, exact atlas crops, palette changes, atlas-only PNG requests, combat, saves, two-tab conflict protection, export/import, corrupt IndexedDB quarantine/recovery and mobile overflow. Evidence: `evidence/qa-production-qzCDwS/browser-verification.json`.
- Independent `node scripts/hermes-verify-production.mjs` passed both alternate palettes, malformed import rejection and all production play/save/map checks with **zero console, page or failed-network errors**. Evidence: `evidence/hermes-production-verification.json`.
- Real screenshots were visually inspected: `evidence/hermes-production-clinic.png`, `hermes-production-combat.png`, `hermes-production-geography.png`, `hermes-production-sewer-map.png`, `hermes-production-tidal.png`, `hermes-production-ember.png`, `hermes-production-mobile.png`. All paths are under `/Users/willm/District67/browser/`.
- Starter foes are now the weak **coupon ferret** and **compliance tadpole**, with original quest room IDs and original weak balance retained. A failing-then-passing regression test covers their tone and threat caps. Copied original prose is overridden only for these browser rooms; Python is untouched.
- Independent final re-verification passed with no findings: `FINAL_REVERIFY.json`. The final malformed-class import bug was reproduced, fixed with three regressions, and checked independently; imports preserve existing slots/backups.
- Local preview: **http://127.0.0.1:4178/** while the server runs. No deployment or accounts were created. Programmatic counts are in `evidence/hermes-final-counts.json`.

Earlier CLI notes about unavailable browser launches or pending runtime checks are historical; Hermes executed the actual browser scenarios outside that CLI sandbox. Full campaign route/balance coverage is automated rules-engine testing, not a claim of a human playthrough of every room or subjective audio audition.

Implemented in `browser/` from `.hermes/plans/deadlease-browser-expansion.md`. This is a playable React/TypeScript/Vite RPG with a standalone deterministic rules engine. No Python source, original portrait, original sound, or Python save was modified. No backend, accounts, multiplayer, deployment, paid generation or git commit was added.

## Result

- **122 individually named and described connected rooms**, across **7 level-banded areas**.
- **10 classes**, **3 origins**, **40 meaningful abilities**, at levels **1, 3, 6 and 10**.
- **7 quests**: original pump story and both original endings, five regional artifact quests, and a final erase/disclose ledger quest.
- **11 safe refuges**, **11 human guard presences**, **4 sewer entrances**, **41 repeatable enemy locations**.
- Geographic map with **168 street/channel segments** and **244 separate building footprints**, terrain, coastline, marsh waterways and shafts.
- **122 distinct 256×144 pixel compositions**, each with explicitly directed focal props; **366 room sprites** across three palettes, packed with portraits/icons into **24 area/shared PNG atlases**.
- **9 original portrait recipes/assets preserved**, **27 native portrait sprites**, **9 native icon sprites**, **8 unchanged original WAV assets** and **3 verified Helton Yan WAVs**.
- **54 browser-side tests pass**, across 14 files. TypeScript checking and the production build pass.
- **38 original Python tests pass** before and after implementation. Original source hash verification passes.
- Prior independent review fixes preserved; all four `RULES_REVIEW.json` findings are addressed in [RULES_DISPOSITION.md](RULES_DISPOSITION.md).

**Hermes has actual browser access at http://127.0.0.1:4178.** Prior production screenshots and runtime evidence exist and were preserved. `../BROWSER_RUNTIME_QA.md` reports successful browser creation, movement, combat, map, palette, manual save, reload and export checks before an import-notice assertion failed. That assertion now checks the persistent import log and stored state. This follow-up used CLI checks only and did not attempt browser launches. Its updated compact layout, actual PNG requests/crops and native cross-tab transaction behavior await Hermes QA; jsdom and shared-driver tests are not presented as browser verification.

## Startup and tooling

```sh
cd browser
npm ci
npm run dev
```

Open the localhost URL printed by Vite. The checked versions are Node 24.18.0, npm 11.16.0, React 19.2.7, TypeScript 6.0.3, Vite 8.2.0, Vitest 4.1.10 and Playwright 1.62.1. Registry DNS was unavailable during implementation. Already installed local packages and available cache entries supplied the dependencies, and the lockfile was reconciled to the pinned manifest. A clean network-backed `npm ci` could not be exercised here.

```sh
npm run assets:rebuild
npm test
npm run audit:assets
npm run build
npm run preview
npm run test:browser
```

`test:browser` starts a production preview on exclusive port 4187 and isolated Chromium pages. It checks 1280×800 layout, hidden inputs, native atlas crops after palette changes, PNG requests, creation, movement, combat, loot, map layers, saves, export/import, two-tab conflicts, quarantine/recovery, mobile overflow and page errors. It uses persistent log/state predicates instead of fixed command delays. Each run writes a fresh `evidence/qa-production-*` directory, preserving Hermes's earlier files. The revised scenario was syntax-checked but not launched by this CLI session.

`dist/` is the production output. `scripts/local-preview.mjs` is only an offline inspection utility. Normal play should use a stable localhost origin for predictable storage. Nothing was deployed.

## World and quests

| Area | Rooms | Levels | Shape |
| --- | ---: | --- | --- |
| District 67 | 12 | 1–3 | Original compact street grid |
| Salt Quay | 18 | 2–4 | Harbor hook: east, south, then west |
| Reedward Fen | 18 | 3–5 | Forked southern floodplain |
| Cinder Union | 18 | 4–6 | Broad industrial slab |
| Vitreous Ward | 18 | 6–8 | Western diamond with southern tail |
| Survey Crown | 18 | 8–10 | Long causeway and branching crown |
| Underlease | 20 | 2–5 | Parallel channels and northern spine |

All exits are reciprocal and move exactly one coordinate in the indicated direction. Vertical exits share surface coordinates. Sewer shafts are at **Clinic Steps, Toll Square, Freight Yard and Pump Hall**. Guarded refuges never start encounters and provide free recovery. Their merchants stock region-appropriate gear. The original hostile contract guard remains at Security Gate.

Copied JSON preserves the original room prose and Commons/Lease ending prose. Installing the component repairs the pump, produces the access key and changes location descriptions. Giving the key in Control Booth makes a permanent choice. Exploration continues afterward.

Regional quests:

- Sera, Customs Awning → Receiver Pier → weather recording.
- Fen, Reedward Shelter → Fen Catwalk → filter core.
- Rusk, Union Canteen → Governor Cage → governor spindle.
- Vale, Glaziers Hearth → Refraction Well → lens fragment.
- Hal, Steps Undercroft → Outfall Shrine → drain seal.
- Sen, Crown Receiver → Ledger Vault → master ledger; **erase** debts or **disclose** their owners.

Artifacts are irreplaceable, cannot be sold, and have validated ground/carried/consumed custody. Quest and scrounge rewards occur once. Ordinary starting enemies stay defeated; repeatable hunting grounds deliberately provide recurring rewards.

## Classes and progression

| Class | Distinct role | Four abilities |
| --- | --- | --- |
| Enforcer | Shields and controlled force | Riot stance; Breach shot; Hold the line; Final notice |
| Scavenger | Scrap recovery and defense | Scrap shield; Shrapnel fan; Jury rig; Wrecking claim |
| Street Medic | Triage and nerve blocks | Triage; Nerve block; Chelation; Resuscitate |
| Wirewright | Interrupts and stamina | Short circuit; Capacitor tap; Ground loop; Blackout |
| Ferryman | Cover, retreat and siphons | Low water; Boat hook; Second wind; Undertow |
| Advocate | Exposure and forced pauses | Stay order; Fine print; Reparations; Void contract |
| Glassrunner | Evasive armor breaks | Mirror step; Edge alignment; Splinter veil; Perfect fracture |
| Ash Warden | Shields and cleansing | Ash mantle; Kiln breath; Firebreak; Phoenix shift |
| Surveyor | Precise ranged pressure | Range mark; Warning shot; Dead reckoning; Horizon cut |
| Sump Apostle | Siphons and exposure control | Borrowed pulse; Silt baptism; Deep hunger; Estuary heart |

Each class has its own starting skills, equipment and passive. Origin/class choices are independent. Baseline gains a selected bonus rank; Splice changes Reflex/Nerve; Radborn changes Grit/Reflex and reduces radiation. All classes retain basic survival actions, shops and quest access.

The first ability starts learned. Each later level grants one point shared between skill training and learning class abilities. Tiers unlock at 3, 6 and 10, costing one point each. Skill cap is 5; level cap is 10. Total XP for level L is `60 × (L−1) × L / 2`; level 10 requires 2700 XP. Level-up restores resources. Reading, rest and talking grant no repeatable XP.

## Rules and named balance

`src/config.ts` contains typed `BALANCE` and `PUMP_REWARDS`. Ability costs/cooldowns/effects are typed `Ability` content in `progression.ts`; equipment and prices are typed `Item` content in `items.ts`; regional rewards are typed `Quest` content in `quests.ts`; bands and room-specific enemies are in `world.ts`.

- HP: `24 + 6×Grit + 6×(level−1)`. Stamina: `12 + 3×Grit + 2×(level−1)`.
- Explicit nonzero Xorshift32 RNG state is serialized. Identical snapshots and command streams reproduce identical outcomes.
- Entry announces an encounter without attacking. Reads and invalid actions change neither turns, RNG nor exposure.
- Basic accuracy: `58 + 2×Reflex + 4×weapon skill`, plus modifiers, clamped to 10–95%. Damage: weapon base + twice skill + 0–3, minus remaining armor, minimum 1.
- Aim costs 4 stamina and adds 25 percentage points; Surveyors pay 2. Basic attack restores 2 stamina, plus one for Wirewrights.
- Enemies cycle **strike → charge → spike → recovery**. Strike has 85% accuracy. Charge/recovery deal no damage. Spike always hits for triple base + 0–2. The intent displays the honest raw range before the next action.
- Free brace halves damage after armor/insulation, then subtracts 6. Cover costs 3 stamina and reduces damage by 65%. Flee takes one covered response before returning to the adjacent previous room; Ferrymen further halve it.
- Armor reduces hits. Insulation also reduces spikes and radiation. Shields absorb damage across responses. Incoming successful hits always chip at least 1 HP. Interrupts cancel the response and send the enemy into recovery.
- Ability damage is deterministic before armor. Every declared damage/healing/shield/cleanse/stamina/exposure/interrupt effect is tested. Cover abilities are tested against actual charged responses. Cooldowns use saved absolute action turns.
- Supplies heal `18 + 3×Medicine + 2×(Wits−4)`, plus the Medic passive. Refuges restore all resources and clear radiation freely. Other rest is partial and retains local exposure.
- Radiation caps at 100, with −15 accuracy at 50+. Origin, insulation and Apostle passive mitigate positive exposure.
- Death restores a clinic clone, clears temporary effects, preserves gear/discovery/quests and adds 25 debt. Debt never blocks recovery or progression.
- Repeatable enemies return on re-entry after **12 world turns**. Lower bands support sustainable grinding; the Crown warns explicitly of high-level charged collectors.
- Credits/inventory saturate safely. At the supported archival limit of 10,000,000 turns, additional world actions are refused without damaging state; reads and exports remain available.

## UI, art and sound

The command interface has history, Tab prefix completion, Escape focus, PageUp/PageDown log scrolling and an explicit Latest control. New log entries preserve old-text reading position. Contextual controls cover movement, people, combat, loot and quest decisions. Panels contain the atlas, equipment/shops, skill/class progression, journal, help and settings. Resource meters, original portraits, readable font-size choices and keyboard focus states are implemented. The desktop layout now uses a 72px header, bounded scrollable room/log/sidebar panels and a reserved command form. Autosave progress is inline; it adds no banner. Hidden file controls have an explicit CSS override. Hermes will verify the revised 1280×800 layout.

Vignettes are **256×144**, never hero art. Explicit focal landmarks complement regional backgrounds: clinic bed, fountain, refrigerator, valves, harbor bell, buoy, filters, governor gears, mirror planes and ledger. `evidence/room-contact-sheet.png` is a generated **asset inspection sheet**, not a browser screenshot. It was visually inspected.

The map draws land, estuary water, marsh channels, streets, separate footprints, sewer channels and shafts. Discovered location markers inspect and never teleport. Fog hides unexplored geography. Turning fog off reveals terrain but not unseen encounter markers or labels. Surface/sewer, labels, hazards and local zoom are separate controls. Local zoom is the default; Whole estuary is explicit.

Original, Ember and Tidal each contain eight distinct RGB values. Original values are exact. UI/map semantic colors switch with the palette; raster pixels and portraits use exact RGB substitution and nearest-neighbor rendering. Text/SVG edge antialiasing is allowed. Provenance is in `public/assets/ATTRIBUTION.md` and `ORIGINAL-ATTRIBUTION.md`.

Three verified Helton Yan cues from Moonsec are used for ranged attacks (Mecha Laser Machine Gun), impacts (Mecha Laser Pistol hit), and clone death (Explosion Forced Shutdown). These are stylized laser/mecha cues. Shipped Settings credits, `ATTRIBUTION.md` and `audio-provenance.json` provide creator/pack links, CC BY 4.0, hashes and change disclosure: Moonsec converted to 16-bit mono 44.1 kHz; Deadlease copied the files without further edits. No unverified voices/music were copied; Moonsec was read only. The eight original attributed WAVs remain intact; other gameplay/ambience cues use those originals. Playback starts after interaction; master/effects/ambience volumes and mute persist. Missing files, denied autoplay and audio failures do not block play. File identity and PCM headroom are audited; no subjective human audition is claimed.

## Editable atlas pipeline

Run `npm run assets:rebuild` from `browser/`; `npm run build` runs it automatically. `src/art.ts` retains editable deterministic room recipes and focal directions; `src/icon-art.ts` holds three 16×16 icon recipes. Original 64×64 portrait assets are read directly from the unchanged Python project. Runtime palette/map data lives in `visual-data.ts`, keeping raster recipes out of the runtime dependency graph.

`scripts/build-atlases.mjs` sorts stable IDs and uses simple shelf packing with a 2048×2048 upper bound. Rooms are grouped by area, and portraits/icons share a group. Each palette has separate exact lossless RGB PNGs. Two pixels of edge/corner extrusion surround every native-sized crop. The current world fits in 24 files (seven areas plus shared, times three palettes), covering 402 sprites. More sprites automatically spill to numbered pages without hand-edited coordinates.

`src/generated/atlas.json` records stable `palette/room/id`, `palette/portrait/name` and `palette/icon/name` keys, file references, rectangles, native dimensions, area, palette values and padding. `src/sprites.tsx` draws only the specified source rectangle using `drawImage` with smoothing disabled; it never generates or recolors pixels at runtime. The cache retains only the active palette's current area, areas joined by exits, and shared group. Leaving that neighborhood or changing palette drops obsolete application cache entries; obsolete async crops cannot repaint a new scene. The browser may retain its ordinary HTTP cache.

The build script removes only replaced generated `browser/public/assets/scenes`, `portraits`, and obsolete atlas PNGs. Original source assets, Python files and evidence are untouched. `audit:assets` is read only: it checks every room/portrait/icon against source pixels, exact palettes, dimensions, file membership, texture bounds, padded nonoverlap and edge extrusion. It also checks original and licensed audio identity and non-clipping PCM. `12-asset-audit.json`, `12-build.txt`, `12-python-preservation.txt` and `12-python-tests.txt` record this follow-up; earlier evidence remains historical.

## Persistence and recovery

Game payloads use **browser schema version 2**. IndexedDB database `deadlease-v2` uses database schema 1 with `slots` and `quarantine` stores. Auto/manual records include player, loot custody, discovery, defeat timestamps, one-time rewards, quests, active enemy/phase, shield/exposure/cooldowns, previous room, turn and RNG. Validated preferences are separate. Logs/history are session-only.

Validation rejects unexpected/missing fields, coerced scalar types, invalid references, impossible attributes/resources, XP/level mismatches, overspent training, foreign/locked abilities, unequipped ownership, duplicate discovery, false retreat geography, altered/missing enemies, premature respawns, impossible artifact/reward state and orphan combat effects. Files are limited to one megabyte. Unsupported versions, including Python saves, are rejected; no prior browser version existed to migrate.

Autosaves queue after accepted actions. Manual operations and imports serialize with that queue. Import validates before replacement; export validates before download. Corrupt originals remain in their slots and are copied into quarantine. Normal writes refuse corrupt-slot replacement and compare exact expected content inside the atomic IndexedDB update. Another session’s changes cause a conflict: stored content stays intact and the incoming branch is quarantined. Expected content advances only after successful transactions. A repository that has never observed an occupied slot cannot overwrite it. Loading the latest autosave resumes autosave after a conflict. Explicit valid import and recovery back up old bytes and replaces the chosen slot in one IndexedDB transaction. Both slots have recovery controls and quarantined bytes can be downloaded. Registering another tenant saves the current character to manual and preserves earlier manual bytes in quarantine.

No automatic destructive reset exists. If IndexedDB is unavailable, play continues with export guidance. Native IndexedDB cross-tab behavior is included in the revised production browser scenario for Hermes; atomic content comparison and failed-transaction expectation handling pass shared-driver tests here.

## RED → GREEN evidence

Behavior tests were written and run failing before each implemented slice. Dependency/startup failures were excluded from TDD evidence. Matching logs in `evidence/`:

| Slice | RED and GREEN filename prefix |
| --- | --- |
| Geography | `01-world-` |
| Classes/progression | `02-progression-` |
| Combat/counterplay | `03-combat-` |
| Quests/economy/training | `04-quests-` |
| Validation/quarantine | `05-saves-` |
| Indexed art/map | `06-art-` |
| React UI/completion | `07-ui-` |
| Review regressions | `08-review-` |
| React persistence/recovery | `10-interactions-` |
| Per-room art direction | `11-art-direction-` |
| Compact UI, atlas manifest, stale saves and remaining rules | `12-followups-` |
| Verified audio mapping before integration | `13-atlas-audio-RED.txt` |

Broader validation is in `09-campaign-check.txt` and `final-tests.txt`. Its initial route harness contained incorrect directions; the harness was corrected against existing geography without changing game rules. The final coverage includes:

- Graph reachability, reciprocal exits, coordinates, bands, refuges and shafts; every room's art dimensions, palette, determinism and explicit direction.
- All 30 builds, all 40 abilities and declared effects, tier gates, cooldowns, training budgets and caps.
- Seed continuation, safe reads/errors, charged damage, every cover ability, armor/insulation/shields, interrupts, fleeing, death and respawns.
- **60 real movement-based pump playthroughs**, through sewers and encounters, roundtripping every accepted action through save validation.
- A sustained grinding campaign reaching level 10, learning all Medic tiers, obtaining endgame gear and completing every regional quest through real routes.
- Malformed/oversized/unsupported saves, prototype/reference rejection, quarantine, refused overwrite, explicit recovery and invalid-import preservation.
- Actual React create/move/settings/save/recovery/new-tenant event handlers in jsdom with a memory driver.

`review.md` includes independent findings and their final resolved disposition. `python-preservation.txt` checks the pre-edit source hashes. `python-final.txt` records the unchanged Python suite. `asset-audit.json` records counts, palettes, PCM peaks and hashes. `build.txt` records the production build.

## Remaining limitations

Substantive follow-up implementation and CLI checks are complete. Hermes retains browser QA for the revised desktop layout, palette crops/network requests and native two-tab behavior. Prior genuine browser evidence is preserved, and no new browser execution is claimed by this CLI session. Human audio audition remains unverified. The game intentionally uses one enemy at a time and authored modular pixel scenery. It does not add real-time combat, multiplayer, live AI dialogue, cloud saves or deployment.
