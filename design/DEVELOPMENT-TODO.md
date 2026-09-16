# FREEBORN — development todo

Status: in progress. Checked implementation tasks have passed their recorded verification; unchecked tasks remain planned. See the milestone record below.

Visual priority override (latest user playtest): finish the scene/UI pass below before resuming feature phases.

Build in this order: room interactions → enemy behavior → backpack synergies → courier reputation → discoveries → tutorial. Complete a playable, tested increment in each phase before expanding it. The tutorial comes last so it teaches the finished controls and mechanics.

## Current priority — transcript space and medical progression

User accepted the improved readability/art, then requested a transcript-led layout and lasting conditions as a money sink.

- [x] Small room painting beside player data; large transient hover/focus preview; tall transcript by default.
- [x] Put inhabitants, ground items and illustrated encounters inside the transcript; restore clickable actions alongside typing, preserving hidden prose opportunities.
- [x] Separate grey italic command guidance from green world/dialogue/combat text; remove command syntax and level/turn explanations from NPC speech. Unit coverage and browser color/typography assertions added.
- [x] Red HP gauge, yellow stamina gauge, radiation number with ☢ symbol; visible condition/implant labels.
- [x] Six lasting conditions from attack families and radiation, with defensive counterplay and paid treatment.
- [x] Dr. Pell and Ripper Voss, three implant paths with three ranks, and the Spare Parts mission as an alternative to buying an upgrade.
- [x] v5 migration, persistence and resource-accounting tests; responsive UI/focus tests; full regression gate and public verification. Published Pages `21f64db`; implementation source `32be3bd`.
- [x] Three fresh public play sessions with buttons and typing; record progression, fishing, medical recovery and terminal death. Fix invalid combat button availability and pass release checks. See [playtest report](PLAYTEST-2026-09-16-BUTTONS.md).
- [ ] Follow up on playtest usability: fishing-kit alias, courier destination directions, compact-arrival warning before high-level territory, and individual loot selection.
- [x] Audit 89 rendered transcript entries and screenshots across dialogue, jobs, exploration, combat, progression and injury; record category misses in [TRANSCRIPT-CATEGORY-AUDIT.md](TRANSCRIPT-CATEGORY-AUDIT.md).
- [ ] Finish semantic transcript categories: non-Type control advice, system notices, stronger player-command separation and warning/refusal emphasis. Current audit is only a partial pass.
- [x] NPC reply chirps and distinct level-up fanfare; verify dialogue routing, earned-level triggers, pause/mute/reload behavior and audio assets. See [AUDIO-FEEDBACK.md](AUDIO-FEEDBACK.md).
- [x] Correct minimap SVG focus artifacts, floor framing, label/marker readability and room-inspection hit targets; verify all 149 markers and five window sizes. See [MINIMAP-REVIEW.md](MINIMAP-REVIEW.md).
- [ ] Human visual acceptance of minimap rendering after fixes.
- [x] Reset the transcript on room changes and show its top with command focus retained; verify fades, stairs, blocked movement, retreat and revisits. See [ROOM-TRANSCRIPTS.md](ROOM-TRANSCRIPTS.md).
- [ ] Human acceptance of room-by-room transcript flow.
- [ ] Human listening acceptance of reply chirps and level-up prominence. Music received positive feedback; preserve current mix.
- [ ] Human acceptance of transcript height, hover behavior and injury frequency/treatment costs.

Verification: 154 unit tests, production build, asset audit and 14 browser suites pass. Source mirror builds independently. Live Pages assets match the tested hashes; doctor conversation, restored controls, intake, downward travel, revival and persistent death pass.

Rules and commands: [MEDICINE.md](MEDICINE.md).

## Previous pass — scene and terminal presentation

User withdrew the 3440×1440 design target. Use a centered frame near 4:3 (up to 1440×1080), preserving the large scene / compact player data / transcript stack. Ordinary desktop windows come first; ultrawide gets quiet gutters. Keep complete 16:9 paintings visible inside the scene.

- [x] Brief room arrivals; detailed prose and exit directions require `look around`. Unit coverage verifies that looking costs no turn.
- [x] High-contrast green-on-black transcript, faction/hostility name colors, restored fallback cursor. Unit and browser checks pass, including large text and UI palette changes.
- [x] Item mentions in prose use brighter green; actual ground items appear immediately as a plain grey list. Ground transcript listings also stay grey. Unit checks and browser pickup assertions pass.
- [x] Install unique generated paintings for all 149 locations. Per-room prompts, hashes, dimensions and generation receipts live under `design/location-art/`; runtime and provenance maps cover every room without biome fallbacks.
- [x] Inspect all 149 scenes in 17 contact sheets, correct misleading ladders and permanent foreground enemies, and review neighboring/vertical routes. Browser checks verify every image decodes and delayed travel blocks duplicate movement and map invocation.
- [x] Complete production build, asset audit, 145 unit tests and all 13 browser suites. Standard/short desktop, 18px text, ultrawide and mobile checks pass; reports are in `design/verification/`.
- [x] Record evidence and commit/push source (`56fd3b9`); publish Pages build `eec035a` and pass live hash checks, keyboard intake, downward travel, revival and persistent-death smoke tests. See `design/verification/deployment.json`.
- [ ] User visual acceptance: scene scale, terminal readability, item color distinction, encounter overlays, scene continuity. Automated tests do not establish acceptance.

## Roguelike identity and run length

User direction: FREEBORN is intended to be a roguelike that takes at least roughly 30–45 minutes. Working pacing target: about 45 minutes for an ordinary successful run, with 30 minutes as the lower design target. This is a design goal to measure, not a claim about the current build or a mandatory real-time gate. Early defeats may be shorter; deliberate farming may extend a run. Skilled play and exceptional builds can finish faster without being penalized.

Confirmed user decision: death ends the run and the player starts a fresh character. Same-character clinic revival has been replaced; see the runs milestone below. Use the death experience as the bridge into a new clinic intake; do not automatically resume the dead character. Completing the city crossing is a successful run ending. Permanent gameplay upgrades between runs have not been requested.

Implemented exception: a packed revival drone can intercept a lethal event before final death. This consumes an earned item and continues the current run; it does not restore automatic clinic revival. Without an eligible drone, death still ends the run.

### Cross-cutting work alongside Phases 1–5, before the tutorial

- [x] Confirm the death rule: death ends the run; the next attempt uses a fresh character.
- [x] Implement a terminal dead-run state and a death summary, followed by the option to begin fresh clinic intake. Reset character levels, gear, money, quests, deliveries, and run-specific world state; no automatic resource carryover.
- [x] Preserve current settings between runs.
- [ ] Preserve tutorial dismissal preferences once the tutorial exists. Permanent gameplay unlocks remain a separate future decision.
- [x] Give each new run a fresh seed and identity; keep reloads within a living run stable. Separate historical run summaries from playable saves.
- [x] Store terminal death and the ended-run seal atomically before enabling New patient; verify reload, aborted writes/retry, two tabs and stale import protection.
- [ ] Add process-kill tests during intake and repeated finalization stress tests beyond the existing busy guard and cancellation checks.
- [ ] Define successful-run summary and post-credits behavior explicitly; keep any free exploration clearly separate from a new scored attempt.
- [x] Document migration for existing living characters and preserve recoverable legacy save data. Do not retroactively kill existing characters or erase backups when introducing the new rules.
- [ ] Define the required path to the city and optional branches. Do not require visiting all 149 rooms or every biome simply to meet a duration target.
- [ ] Prototype a 45-minute pacing model: approximately 5 minutes to orient and get useful gear, 10 to establish a build, 20 for regional choices and escalating encounters, and 10 for the final approach and ending. These are playtest hypotheses, not timers or forced stages.
- [ ] Introduce an early meaningful reward or build decision, then sustain that rhythm through enemy roles, loot, discoveries, and courier choices.
- [ ] Define per-run variation: loot, encounter composition, job offers, and discovery placement are candidates. Start with variation on authored geography; procedural map generation is not yet required or approved as scope.
- [x] Persist the run seed and generated outcomes so loading a save continues the same run rather than rerolling claimed rewards. Keep varied runs reproducible for debugging.
- [ ] Make powerful farming routes optional and rewarding. Do not enforce duration through inflated health, mandatory grinding, unskippable prose, real-time waits, or automatic scaling that cancels earned strength.
- [ ] Measure human playtime across first-time exploration, a knowledgeable direct route, a courier/farming build, and a lucky strong build. Record class, seed, route, outcome, active playtime, and separately noted idle/paused time.
- [ ] Verify representative classes and seeds have viable routes and resources; include poor drops as well as unusually strong ones. Do not mistake fast automated command replay for evidence of human run length.
- [ ] Add regression coverage for death/victory boundaries, fresh-character resets, seed persistence, reloads, and rewards. Record pacing observations and tuning changes in milestone documentation.

**Done when:** observed ordinary successful runs support the intended 30–45-minute experience, with a satisfying early game and finish, while short defeats, optional longer farming, and earned fast victories behave according to the agreed rules.

## Loot, farming, and player power

User direction: random loot is welcome, repeatable farming is valid play, and builds may become overwhelmingly powerful—even effectively godlike. A player choosing to repeat missions, earn a large stockpile, and spend it to reach the ending is an acceptable route through FREEBORN. Fifty grenades is the motivating example, not a claim that grenades are implemented yet.

- Preserve the agreed mostly class-matched drops and guaranteed class shop options while allowing random surprises.
- Reward preparation, repeated work, and strong item combinations. Do not add diminishing returns, daily limits, enemy scaling, or hard counters simply to cancel earned power.
- Make ordinary progression satisfying without requiring farming; let farming make the journey substantially easier for players who choose it.
- Distinguish intended repeatable rewards from state bugs: a newly accepted and completed mission earns another payment; replaying the delivery command for an already completed mission does not.
- Test powerful combinations and large legitimate stockpiles for correct behavior, readable UI, and reliable saves. High damage or easy victories alone are not failures.
- Keep inventory space and stack rules understandable, but tune them to support the stockpiling fantasy rather than silently making it impossible. Any future storage solution is a separate design decision.

## Established baseline

- [x] Record the starting point: 149 rooms, 10 regions, 23 enemy identities, class-favored equipment, paid deliveries, and the city ending.
- [x] Record existing validation: 92 unit tests, production build, asset audit, and six browser suites passed in the frontier pass. See `../evidence/full-verification.json`; this records the previous implementation run, not a test run for this planning document.
- [x] Preserve the product direction: painted industrial noir, typed exploration/combat, stacked room/player/transcript UI, and mouse interaction for inventory and suitable physical puzzles.
- [x] Keep the real city as the destination/credits, with distant skyline glimpses late in the game. Bellwether remains a frontier town.

## Rules for completing every phase

Environmental audio research and its implementation checklist are in [the ambient audio shortlist](AMBIENT-AUDIO.md). Initial source/license research is complete; auditioning, integration, and audio verification remain planned. Start with sewer drips, street rain, and wilderness wind alongside the main feature phases. The tutorial remains last.

- [ ] Define the mechanics, commands, state changes, and acceptance criteria before coding that phase.
- [ ] Implement the smallest complete encounter or interaction first, then expand content after it works.
- [ ] Keep persistent state serializable and validated. Add migration fixtures whenever the save schema changes; preserve conflict detection, quarantine, and export/import.
- [ ] Test meaningful outcomes, rejected actions, and interruption/reload cases. Rejected or informational commands must not spend resources or advance turns.
- [ ] Check keyboard focus, modal exclusivity, travel transitions, rare roaming events, death, and ending interactions wherever affected.
- [ ] Update player-facing help and authoring/technical documentation alongside the feature.
- [ ] Run targeted checks while developing and the full `npm run test:all` release gate before handing over a playable milestone.
- [ ] Inspect affected UI at 3440×1440, 1280×800, and 390×844. Record screenshots and browser errors; automated assertions do not replace visual inspection or listening to sound changes.
- [ ] Record what passed, unresolved issues, and a short reproducible player test route. Mark implementation tasks complete only when their acceptance checks pass.

These recurring checkboxes describe the process for each phase, not a one-time substitute for later verification.

## 1. Discoverable room interactions

Goal: players learn what they can do from the room and its inhabitants.

### Build

- [x] Add authored readable room objects with stable IDs, visible names, aliases, descriptions, and supported verbs.
- [x] Add persistent theft objects, a three-pin tackle box, and a Morse relay terminal with reward-once state.
- [ ] Extend persistent interactions to searchable remains and the rest of the planned discovery set.
- [x] Put a jobs board or dispatch notice in Reclamation Clinic, Freight Yard, and Bellwether Post; mention it naturally in each room description.
- [x] Accept `read board`, `read jobs board`, `inspect board`, and `jobs` for the same local work listing. Explain clearly when there is no board nearby.
- [x] Give the clinic clerk one brief, in-world pointer to paid work during early play, without repeating it on every visit.
- [ ] Add a small starter set of useful objects: a supply locker, searchable remains, and an inspectable machine. Avoid naming usable objects that silently reject every sensible command.
- [ ] Define consistent `look`, `inspect`, `read`, `search`, and `open` behavior. Resolve ambiguous names with a short clarification instead of choosing the wrong target.
- [x] Derive board hints and completion from the same local object definitions; no board hints appear elsewhere.
- [ ] Extend that shared hint/completion model to the next object types, without revealing hidden objects.
- [x] Distinguish free scenery inspection from actions that cost a turn or consume something; combat emotes allow an enemy response.

### Test and document

- [ ] Test aliases, ambiguous targets, wrong-room attempts, repeated searches, full packs, quest-item custody, and save/reload of opened objects.
- [x] Browser-play a fresh character discovering a board, accepting a delivery, reaching the destination, and collecting payment without opening global help.
- [x] Document the object schema, verb rules, and how authors add a new interaction.

**Done when:** a new player can discover and finish the first courier job from room descriptions, dialogue, and local hints alone.

## 2. Distinct enemy behavior

Goal: enemy roles change the player's decisions, not just names, portraits, and numbers.

### Build

- [x] Specify an explicit, deterministic enemy behavior model with readable intent and recovery states.
- [x] Start with three roles: marksman aim/reload, cutthroat bleeding attacks, and tread-brute heat/overheat.
- [x] Give each role a clear counter using existing actions such as cover, brace, healing, interruption, or retreat. Explain the counter through short intent text.
- [x] Define bleed duration, stacking limits, cleansing, and whether it persists after combat. Prevent invisible damage during menus or idle time.
- [x] Add morale to selected humans: eligible enemies may flee or surrender. Define what the player can type and how the encounter ends.
- [x] Define XP, loot, room clearance, and respawn rules for kills, escapes, and accepted surrender; never pay twice for one encounter.
- [x] Expand tested roles across appropriate biomes, preserving easy starter encounters and safe refuges.
- [x] Match sound and portrait presentation to the active behavior; avoid adding noisy narration on every action.

### Test and document

- [x] Test each state transition, counter, status expiry, lethal hit, simultaneous effects, interrupted wind-up, fleeing, surrender, and repeated reward attempt.
- [x] Round-trip saves during each new combat state; migrate existing encounters without corrupting their progress.
- [x] Browser-play all three roles and surrender; unit-test basic counters for every class and each phase.
- [ ] Human-play early/mid/late builds for difficulty and readability; record equipment, seed and feedback.
- [x] Document role definitions, status rules, tuning values, and encounter authoring examples.

**Done when:** the player can read an enemy's intent, choose an effective response, and recognize a meaningful difference between the three initial roles.

## 3. Backpack synergies

Goal: item placement creates understandable choices while keeping packing enjoyable.

### Build

- [ ] Define adjacency first: orthogonal edge contact, no diagonal bonuses, rotated footprints respected. Document stacking and equipped-item participation; allow deliberately powerful combinations.
- [ ] Prototype three small synergy families, such as medical supplies beside a field kit, ammunition beside a matching firearm, and an insulated tool beside electrical equipment. Exact items and values remain tuning decisions.
- [ ] Compute bonuses from owned, packed items and their current positions; do not store an independently editable bonus total.
- [ ] Explain active bonuses and their source in item inspection. Preview what moving or rotating an item would change.
- [ ] Establish combat rearrangement rules before enabling combat bonuses. Prevent free healing, stamina restoration, or repeated triggers from moving the same item back and forth.
- [ ] Handle finite stacks, duplicate items, consumption, selling, dropping, bag upgrades, strength rows, and the Unpacked tray consistently.
- [ ] Keep new equipment and supporting items available through sensible loot/shop sources rather than requiring one rare drop.

### Revival drone item

User idea: a self-reviving drone carried in the player's pack. **Stitch Drone** is implemented. Footprint, recovery amount, rarity, and price remain subject to human playtesting.

- [x] Add a single-use, automatically armed revival drone with a visible packed/ready state. Footprint: 2×2 cells; each drone occupies its own space.
- [x] Trigger only when the player would otherwise die and an eligible drone is actually packed. An owned drone left in the Unpacked tray must clearly show that it cannot activate.
- [x] Consume exactly one drone, restore a useful fraction of health, and keep the character in the current room and encounter. Do not reset the enemy, pay rewards, teleport to the clinic, or open the new-character flow.
- [x] Resolve revival before recording terminal death. End the current damage resolution so remaining ticks from that same action cannot immediately consume another drone; clearly return control to the player. Define treatment of ongoing bleeding (cleared); radiation persists but has no independent lethal tick, and no burning-over-time status exists yet so the player has an actionable chance to survive.
- [x] Allow multiple legitimately acquired drones within normal packing rules, with one consumed per rescue. No arbitrary one-rescue-per-run restriction; accumulating insurance is a valid build choice.
- [x] Provide rare loot and a deliberate earnable acquisition route, such as an expensive clinic purchase or a courier unlock. Do not require a drone to complete a normal run.
- [x] Add matching item art, a brief mechanical activation sound, and a concise transcript event such as: “Your Stitch Drone tears free of the pack. A shock pulls you back.” Avoid a blocking cutscene.
- [x] Test packed versus unpacked eligibility, multiple drones, lethal enemy attacks, bleeding damage over time, consumption/layout updates, save/reload after rescue, and final death after the last drone is used.
- [x] Verify saving is atomic: a reload must never preserve restored health while bringing back the consumed drone. Test death/revival ordering and repeated input with the run-state changes.
- [x] Document the exact activation and recovery rules in item inspection and the developer combat guide. Browser-play one rescued lethal hit followed by a later true run-ending death.

- [ ] Extend revival coverage when independently lethal environmental hazards or a burning status are added.

### Test and document

- [ ] Test touching edges versus corners, rotations, multiple neighbors, stack caps, duplicate sources, consumed items, unpacked items, and exact save/reload results.
- [ ] Test repeated rearrangement for unintended resource duplication and verify bonuses disappear when their source is removed. Preserve strong combinations that follow the documented rules.
- [ ] Browser-play mouse and keyboard arrangements with visible previews; verify layout changes do not duplicate items or accidentally advance turns.
- [ ] Document synergy calculation, timing, caps, and how designers author a new effect.

**Done when:** a player can arrange useful combinations, understand their effects, and observe the promised benefits—including very strong outcomes—without item duplication or incorrect state changes.

## 4. Courier reputation and choices

Goal: deliveries develop into relationships and meaningful work beyond repeating a payout.

### Build

- [ ] Define a small courier reputation progression and visible unlock requirements. Preserve existing delivery completion totals during migration.
- [ ] Unlock better routes and trusted contacts through completed work; keep starter work available as dependable income.
- [ ] Show destination, cargo size, known route danger, payment, and any special terms before acceptance.
- [ ] Introduce a few authored cargo decisions: suspicious contents, a disputed recipient, or a request for a detour. Telegraph stakes without revealing every outcome.
- [ ] Add concise reactions from the clerk, freight broker, and Ada as trust changes.
- [ ] Define cancellation, replacement, failed delivery, and return-to-sender rules. Death closes the run's active job; its parcel and rewards never transfer to the next character. Protect living players from becoming permanently stuck with unusable cargo.
- [ ] Tune pay against route length, danger, pack space, and weapon/shop costs. Support repeated missions and substantial stockpiles; avoid making repetitive grinding mandatory for ordinary progression. Reject duplicate completion claims, not legitimate repeat runs.

### Test and document

- [ ] Test eligibility thresholds, one-time unlocks, branching outcomes, parcel custody, full packs, replayed commands, death, and import/reload mid-job.
- [ ] Verify reputation and payment occur once for the correct outcome; preserve existing repeatable routes.
- [ ] Test many legitimate repeat deliveries followed by bulk purchases, saving/loading, and consuming the stockpile in combat. Verify the game honors earned power without accidental quantity loss, overflow, or duplicate payments.
- [ ] Browser-play a local delivery, a long delivery, a newly unlocked job, and both outcomes of one cargo decision.
- [ ] Document route/choice authoring, reputation thresholds, economy targets, and migration behavior.

**Done when:** deliveries visibly change opportunities and relationships while remaining a reliable way to earn money.

## 5. Discoveries off the main road

Goal: reward curiosity with authored discoveries and useful changes to the world.

### Build

- [ ] Add a first set of five discoveries: a hidden cache, a locked maintenance room, a stranded traveler, a far-side shortcut, and an environmental clue chain.
- [ ] Place clues in existing room objects, sounds, and descriptions. Keep important paths discoverable without guessing an exact phrase.
- [ ] Make rewards varied: equipment, money, a contact, information, or reduced travel distance.
- [ ] Define persistent open/rescued/unlocked states and update room text and map connections from that state.
- [ ] Keep shortcut links geographically coherent and reciprocal once opened. Test both ends and both map floors where relevant.
- [ ] Prototype one optional physical lock interaction after the typed object system works. Use the allowed mouse exception and provide a keyboard alternative; failure must not make the main story unwinnable.
- [ ] Keep surprise encounters and ambient messages sparse. Avoid piling scripted interruptions onto rare wandering events.

### Test and document

- [ ] Test discovery order, repeat visits, alternative solutions, reward-once behavior, full packs, interruption, death, and saved world-state restoration.
- [ ] Verify new links do not bypass required ending conditions or strand a player after retreat/load.
- [ ] Browser-play the clue chain and shortcut from discovery through return travel; check map and prose agree.
- [ ] Document each discovery's clues, conditions, resolution, rewards, failure behavior, and manual test route.

**Done when:** exploration yields at least one meaningful discovery of each planned type, with understandable clues and persistent consequences.

## 6. Dismissible tutorial — LAST

Goal: explain UI sections and controls while the player makes real early-game progress.

### Build

- [ ] Use short, non-modal contextual tips attached to the relevant section. No separate tutorial map, forced action sequence, required acknowledgements, or progress reset.
- [ ] Explain the room section: current place, visible occupants/objects, loot, exits, and up/down travel.
- [ ] Explain the compact player section: health, stamina, radiation, money, and equipped gear.
- [ ] Explain the transcript and command input: recent events, local action hints, typing and Enter, history, and completion.
- [ ] Introduce Tab/minimap only while it is available; explain that travel is blocked while the map is open.
- [ ] Introduce inventory when it becomes useful: open/close, drag or keyboard move, rotation, grid capacity, and the finished synergy rules.
- [ ] Introduce enemy intent and defensive responses at the first appropriate encounter, without pausing or creating additional enemy turns.
- [ ] Trigger tips from actual events and skip lessons the player has already demonstrated. Do not repeat the same tip every room or force an experienced player backward.
- [ ] Offer dismiss-this-tip and disable-all-tips controls; allow re-enabling/resetting the guide in settings/help. Persist preferences and tutorial progress with an explicit policy for new characters and imported saves.
- [ ] Keep only one tip visible. Defer tips during intake, backstory, death, ending, travel fades, and unrelated dialogs. Preserve input focus and existing Escape/Tab behavior.
- [ ] Keep tips out of the main gameplay transcript, avoid repeated screen-reader announcements, and respect reduced motion and text-size settings.

### Test and document

- [ ] Test new players, experienced players, out-of-order actions, skipped steps, dismiss-one, disable-all, reload, new character, import, and re-enable/reset.
- [ ] Prove showing/dismissing tips does not alter room, turns, combat, inventory, money, quests, or courier progress.
- [ ] Verify typing continues uninterrupted and tips never intercept an intended map/inventory close or obscure the command line.
- [ ] Browser-play the real clinic-to-first-delivery route with tips enabled, disabled halfway through, and disabled from the start; verify equivalent gameplay outcomes for the same commands.
- [ ] Inspect tip placement at all target widths and with increased text size; check first combat, first inventory use, and starting a fresh character after death with previously dismissed tips still disabled.
- [ ] Document trigger conditions, persistence policy, dismissal controls, and how authors add a tip without coupling it to gameplay rules.

**Done when:** a new player learns the three UI sections and essential controls during normal progress, and can dismiss the entire guide at any time without losing progress or access to anything.

## Handoff and documentation

- [ ] Keep this checklist current as work lands; append a brief milestone record with changed files, checks, evidence, and known limitations.
- [ ] Update `../README.md` and `FREEBORN-pass.md` links as new feature guides become authoritative.
- [x] Reconcile the historical `../IMPLEMENTATION.md` report with current FREEBORN systems. Clearly label old counts, enemy names, UI descriptions, and obsolete QA limitations as historical.
- [ ] Maintain a player command reference and a developer content-authoring guide; document rules that players must understand in the game itself as well.
- [ ] Keep save fixtures from the pre-roadmap version and each subsequent schema version, including active combat, active delivery, and rearranged inventory.
- [ ] Provide a short ordered playtest sheet for each milestone. Distinguish automated coverage from human visual/audio/usability review.
- [ ] Publish only the tested build when deployment is requested; record the revision/build and deployed URL separately from local completion.

## First implementation slice

Boards and the next interaction slice are complete: persistent theft, a timed tackle lock, a Morse terminal, scenery verbs, fishing and personal catch missions. The next approved slice—permadeath, revival drone and distinct enemy roles—is implemented. Remaining: backpack synergies, courier reputation, searchable remains and the rest of the discovery set; use the ledger for playtest feedback before tuning. Tutorial code begins only after Phases 1–5 are complete and their controls are stable.


## Verified milestone — motion and jobs boards (September 15, 2026)

- [x] Title atmosphere with immediate keyboard controls, motion toggle, reduced-motion support, and hidden-page pause.
- [x] Directional travel and ladder transitions with stationary command entry.
- [x] Dismissible, one-shot death-screen animation. Current revival rules preserved pending the separate permadeath implementation.
- [x] Enemy/player art hit reactions driven by damage events and timed to impact audio; compact HP fallback, no hit shake on misses or wind-ups.
- [x] First Phase 1 board slice implemented, tested, and documented.
- [x] Full release gate passed, including the settings Escape fix: **101 unit tests across 20 files; production build; asset audit; all eight browser suites**. Report: `../evidence/full-verification.json` (completed 2026-09-16T00:59:26.211Z / September 15 local).
- [x] Visually inspected title, death, combat, and board views at target sizes; browser checks include 3440×1440, 1280×800, and 390×844. Impact audio dispatch timing was checked automatically; this is not a claim of a separate listening session.
- [x] Added player test routes and implementation/authoring notes in [Motion and jobs boards](MOTION-AND-BOARDS.md); README links updated and the old implementation report explicitly labeled historical.

Primary changes: `src/Motion.tsx`, `src/motion.css`, `src/roomObjects.ts`, `src/App.tsx`, `src/ClinicIntake.tsx`, `src/engine.ts`, `src/audio.ts`, and `src/world.ts`. New focused tests and `test:motion` / `test:boards` are included in the full gate.

Evidence: `../evidence/motion-pass/`, including `motion-playtest.webm`, and `../evidence/jobs-board-pass/`. Video is a UI test recording, not generated cinematic footage. No new save schema was needed; motion is a backward-compatible preference and board reading has no persistent state.

Remaining scope: other Phase 1 objects, new enemy mechanics, backpack synergies, courier reputation, discoveries, permadeath/run pacing, revival drone, and tutorial last. Generated video remains a feasible future media option; no generative-video tool is currently available in this task. This milestone is local and has not been published to GitHub Pages.

## Verified milestone — Escape menu (September 15, 2026)

- [x] Add a keyboard-first pause menu: Resume, Settings, Controls, Save & load, Credits, Return to title.
- [x] Preserve command drafts, close existing overlays first, contain keyboard focus, and restore command focus on resume.
- [x] Freeze roaming activity and reject world actions while paused; cancel queued attack audio and resume the appropriate soundscape.
- [x] Reuse validated save/import/export operations, confirm loads and return-to-title, display failures, and prevent incomplete intake from being saved through the menu.
- [x] Persist audio, palette, text-size, and motion preferences; respect reduced motion.
- [x] Verify keyboard interaction, save round trips, malformed import, combat/exploration pause timing, title/Continue, clinic guards, and 3440/1280/390px layouts. Visually inspect screenshots at all three sizes.
- [x] Pass the full release gate: **101 unit tests, production build, asset audit, and nine browser suites**. Report completed 2026-09-16T01:12:50.682Z. After correcting the final help-text wording, rebuild and rerun the strengthened pause suite with every simulated interval executed and audio-resume assertions; both passed.
- [x] Add [Escape-menu documentation](PAUSE-MENU.md), update player help/README, and include `test:pause` in the release gate.

Primary changes: `src/PauseMenu.tsx`, `src/pause.css`, `src/App.tsx`, the Escape help text in `src/engine.ts`, `scripts/verify-pause.mjs`, and the former Escape-clear expectations in `scripts/verify-noir.mjs`. Evidence: `../evidence/pause-menu/`. No save schema or combat/death rule changes. Local build only; this milestone has not been published to GitHub Pages. The existing feature order and tutorial-last requirement remain unchanged.


## Verified milestone — interactions, fishing, and personal missions (September 15, 2026)

- [x] Three prose-only theft opportunities, meaningful fixed-strength watch encounters, natural aliases, persistent alarms, and rewards once.
- [x] Broader authored scenery/gesture responses, including repeated dancing and wall fisticuffs; free observations and explicit combat action costs.
- [x] Shared Space timing for special-attack critical damage, three consecutive lock pins, and Morse tap/hold input.
- [x] Mandatory two-stage fishing (hook then reel), three sites, optional bait, shop and supplemental loot gear; collapsed kit occupies one cell.
- [x] Fourteen illustrated weird catches, variable rotatable footprints, eating/selling, catch discovery popovers, Journal collection, and three site paintings with browser animations.
- [x] Occasional hostile fish quadrupeds and rare deadly bankmaws, immediate normal combat, new portraits, exact saved encounters, flight, and no false resident-defeat flags.
- [x] Personal missions obtained from Hal, Sera, and Ada, separate from board jobs: acceptance, catch objectives, persistent counts, local turn-ins, and one-time payments.
- [x] Preserve old saves using validated additions to the existing rewards ledger; test malformed flags, duplicate actions, full packs, imports during timing, and combat/death boundaries.
- [x] Full release gate: **125 unit tests / 22 files; production build; asset audit; all eleven browser suites**. See `../evidence/interaction-pass/release-verification.json`.
- [x] Inspect rendered fishing, catches, inventory, mission and predator art; check 3440×1440, 1280×800 and 390×844 timing/catch views, keyboard focus and reduced motion.
- [x] Update Help, Escape controls, README, art attribution, hashed provenance, and [interaction authoring/playtest documentation](INTERACTIONS.md).

Primary additions: `src/verbs.ts`, `src/theft.ts`, `src/challenges.ts`, `src/TimingGame.tsx`, `src/timing.css`, `src/fishing.ts`, `src/missions.ts`; supporting changes in the engine, save validator, inventory, audio cancellation and App state coordination. Evidence: `../evidence/interaction-pass/` and `../evidence/theft-pass/`. New generated assets and exact prompts are listed in the interaction guide.

Known scope: initial authored interaction and mission set; no language model is running. A later director may choose validated authored events. The new personal missions currently count catches; other objective types need explicit rules/tests. Enemy behavior expansion, backpack synergies, courier reputation, remaining discoveries, terminal permadeath, revival drone, ambient sound integration, human run-duration measurement, and tutorial last remain open. This pass is local and has not been deployed.


## Verified milestone — runs, Stitch Drone and enemy roles (September 15, 2026)

- [x] Terminal death record, fresh clinic intake, random run identity/seed, settings retained and no inherited gameplay progress.
- [x] Atomic ended-run storage; reload/import/recovery and concurrent-tab protection; failed-write retry blocks intake until the record is preserved.
- [x] Strict v4 validation and living v2/v3 migration, with original v3 fixtures retained.
- [x] Packed 2×2 Stitch Drone, half-health rescue, single consumption, bleed cleansing, same encounter, multiple earned rescues, clinic purchase and rare drops.
- [x] Painted drone art, prompt/provenance and original synthesized activation cue.
- [x] Marksman aim/reload, knife bleeding, tread-brute heat, surrender/flight and distinct reward rules; existing fixed watch preserved.
- [x] 140 unit tests across 24 files; focused production run suite including storage fault injection and all target layouts. The final publication gate records all twelve browser suites separately in `verification/full-verification.json`.
- [x] Inspect death, pack art and role intent screenshots; keep sound/usability sign-off separate from automated dispatch checks.
- [x] Self-contained source branch with local atlas inputs; clean install, production build and asset audit succeeded without the sibling Python project.
- [x] Add [rules and manual test route](RUNS-AND-COMBAT.md), six disposable import fixtures and the [human sign-off ledger](PLAYTEST-LEDGER.md).

Primary modules: `src/runs.ts`, `src/enemyBehavior.ts`, `src/RunEnd.tsx`, `src/engine.ts`, `src/saves.ts`, `src/App.tsx`, inventory/item/audio support. Verification: `tests/runs.test.ts`, `tests/enemy-behavior.test.ts`, `scripts/verify-runs.mjs`, updated clinic/motion/theft regressions. Full local screenshots remain under `../evidence/run-pass/`.

Will's approval is **not recorded**. Remaining: successful-run summary, 30–45-minute human timing, backpack synergies, courier reputation, remaining discoveries, ambient integration and tutorial last. This milestone does not claim those are complete. Source/Pages commits and public smoke verification are recorded in `verification/deployment.json` after publication.

Publication verified: Pages `39447ff` is live. Public Chromium smoke passed fresh intake, downward travel, packed-drone rescue and terminal death/reload; JS, CSS, drone art and revival audio match tested SHA-256 hashes. See `verification/deployment.json`. The editable browser project is published on the `source` branch.
