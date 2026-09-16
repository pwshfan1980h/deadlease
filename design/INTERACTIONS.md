# FREEBORN — authored interactions and timing

## Design contract

Valuable opportunities belong in room prose, not action buttons or autocomplete. Inspecting is free. Deliberate actions have authored consequences. Ordinary `take all` only collects ground loot; it never takes owned property. Threat strength is fixed by the place, not scaled to cancel a strong build.

Theft's first verified slice covers the Ration Kiosk medical kit, Bellwether Post coat, and Freight Yard watch gun. Synonyms include take/get/grab/pick up and steal/swipe/snatch/pocket. Lower-risk items use the run's seeded RNG plus Reflex/Survival; the watched gun cannot be stolen unnoticed. Failure starts a real encounter before awarding the item. The gunner opens with a lethal burst against a starting character. A well-equipped survivor can defeat the gunner and take the carbine.

Alarms survive flight, clinic recovery, and reload. Re-entering restores the undefeated watch at full health; saved active fights retain current health/phase. Killing a watch pays once, stops its response, and allows the item to be claimed once. Dropping/selling stolen gear does not replenish the original object. Current death rules still revive at the clinic; terminal run-ending death remains separate roadmap work.

Persistence uses validated `theft:<object>`, `alarm:<object>`, and `subdued:<object>` keys in the existing v3 rewards ledger. Old v3 files need no new field; v2 migration remains supported. Validation checks discovery, flag relationships, and exact encounter templates, with a narrow exception for authored watch encounters in refuges. Unknown guards, altered stats, missing alarms, and absent unresolved encounters are rejected.

## Current expansion checklist

- [x] Prose-only theft, persistent consequences, fixed watch encounters, natural aliases, and no duplicated property or kill rewards.
- [x] Theft unit/browser checks, full release gate, and screenshots at 3440/1280/390px. See `../evidence/theft-pass/release-verification.json` (110 unit tests and ten browser suites).
- [x] Broader deterministic verb/target parser, playful repeated emotes, and contextual scenery responses.
- [x] Shared keyboard timing interaction: special-attack critical window, three-pin lock, Morse matching, and fishing.
- [x] Three fishing sites, store/loot gear, catches, consumption/sale, and persistence checks.
- [x] Final combined release gate, visual review, and authoring/playtest documentation.

## Dungeon master architecture

Start with authored intent and target resolution. A director can choose eligible events and narration using world state, history, and the run seed. Keep consequences inside validated game rules, and preserve the player's earned power. Ambient activity remains sparse.

A language model could later translate unusual phrasing into a typed candidate intent or narrate an approved outcome. It must not directly write game state, create rewards, decide item custody, or override combat. Uncertain interpretations should offer a clarification; unrecognized commands should remain harmless. This build does not integrate a model or send commands to an external service. A hosted model would need a server-side proxy rather than a secret embedded in GitHub Pages.

## Commands and consequences

`src/verbs.ts` normalizes aliases and resolves authored verb/target pairs. It does not infer a destructive action from a question or run multiple actions from a sentence. Unknown targets remain harmless. Add aliases narrowly and test them against theft, combat, quest items, and ground loot.

- `dance`, `sing`, `hum`, `whistle`, `laugh`, `cry`, `smile`, `shrug`, `nod`, `wave`, `bow`, `salute`, `clap`, `stretch`, `jump`, `spin`, `sit`, `stand`, `kneel`, `crouch`, `shout`, `curse`, and `wait` have authored responses. Repeating an emote changes its line without flooding the transcript automatically.
- `punch wall` engages the wall in fisticuffs. Touching, inspecting, searching, pushing, pulling, and several playful verbs recognize a bounded set of scenery nouns when the room supports them. These are flavor responses; they do not invent loot or open exits.
- Flavor is free while exploring. Performing an emote or physical gesture during combat gives the opponent one response. Inspection, searching scenery, listening, and smelling remain free observations.
- Persistent property and puzzle objects resolve through their authored rules. Their valuable commands are absent from local hint/completion lists; descriptive clues remain visible. Generic Help/Controls explains interaction controls without listing hidden rewards.

## Timing interactions

`src/challenges.ts` supplies specifications and pure grading helpers. `TimingGame.tsx` captures actual Space press/release timing. The engine returns a pending challenge without changing the run, then resolves a single outcome. UI resolution checks that its original game state is still current. Import/load clears pending interactions; only completed outcomes autosave. Closing the tab while a challenge is unfinished returns to the pre-attempt save.

| Interaction | Input | Success | Miss / Escape |
|---|---|---|---|
| Damaging special ability | One Space press in amber | 50% extra damage; usual cost, cooldown, other effects, and opponent response | Normal ability still happens |
| Three-pin tackle lock | Three consecutive Space presses | Kit + three bait tins, once | Pins reset; reward remains |
| Relay terminal | Match `.-..` using Space hold/release | 30 credits, once | Credit remains queued |
| Fishing | Two Space presses: hook, then reel | Weighted catch + 2 XP, or a hostile creature | Empty line; no catch |

Slider targets move between stages. Fishing/lock traverse one direction in 1.9 seconds; special attacks take 1.5 seconds. Each stage has a ten-second deadline. Dot: 80–300ms; dash: 350–900ms. Release Space between stages; key-repeat cannot supply another press. Pointer press/release is also available for these permitted physical interactions.

Enter uses the normal ability for specials, or an explicit Tech roll for lock/hack (45% + 8 percentage points per Tech rank, capped at 90%). **Fishing has no Enter/skill bypass: both timing checks are mandatory.** A fishing cast or puzzle attempt costs one world turn, including failure or cancellation; rejected attempts cost nothing. Hidden tabs pause deadlines and discard an unfinished held key. Open dialogs block roaming, map access, and typed world actions. Reduced motion disables decorative ripples/reveals, while the gameplay timing meter remains active.

## Fishing content and economy

The reusable **telescopic fishing kit occupies 1×1** and must be packed. It includes a reusable lure, so bait is optional. A bait tin widens the timing window from 24% to 32% of the track and is consumed once per resolved cast. Fishing checks space for the site's largest possible catch before opening the minigame, preventing a successful catch from being lost to overflow. Repeat fishing and selling is supported without a daily limit or diminishing returns.

| Room | Fishing view | Examples |
|---|---|---|
| Steps Undercroft (`sewer-0`) | Lamplit channel / brick drains | Bottlebelly, choir eel, clockwork smelt, suture skate, gutter crown, saint's thumb |
| Customs Awning (`quay-0`) | Sheltered harbor pilings | Silver sprat, teacup crab, widow sole, lantern pike, wirejaw gar, umbrella ray |
| Blackwater Bridge (`wilds-5`) | Creek and reeds | Mothfin, bottlebelly, lantern pike, wirejaw gar, umbrella ray, lastlight sturgeon |

Fourteen catches have weighted site tables, distinct descriptions, generated art, and 1×1 through 3×2 inventory footprints. Catches stack three per bundle and rotate with the existing pack system. Five are edible: silver sprat, bottlebelly, mothfin, widow sole, and saint's thumb. `eat <fish>` / `use <fish>` restores the catalog's health/stamina amounts; combat eating allows an opponent response. Others are collectibles to sell. Existing merchant discounts and sale-price rules apply; the catch catalog's values are base item prices, not guaranteed sale payouts.

The kit (base 12 credits), bait (3), and lock tools are available at eligible refuge shops. Additional fishing gear drops supplement existing class weapon rolls: 18% after kills in wet zones, 4% elsewhere; the supplemental reward is 30% kit / 70% bait. It appears as ground loot and must be collected. The existing class-matched weapon selector is unchanged.

A successfully reeled line currently has an 87% catch chance, a 12% mudskipper hound chance, and a 1% pallid bankmaw chance. These are initial tuning values, not hidden scaling based on player strength. The quadruped is level 2/4/5 by fishing site; the rare bankmaw is always level 8, 150 HP, 28 base damage, and 6 armor. It can kill a weak or injured character. Both attack immediately through the normal enemy-response path. They can be fought or fled; no fish, catch XP, or mission progress is granted for reeling a hostile. Claw marks and old gouges in room prose suggest the danger. Guarded beds do not make the waterline safe.

Fishing encounters use `fishing:<name>:<room>` identities and strict template validation. They persist through reload with current HP/phase, allow no safe-room rest/shop/map bypass, and do not mark a resident enemy defeated when killed. Flight ends this temporary threat; it does not create a persistent watch alarm. Their portraits and prompts are recorded in [fishing-predator-prompts.json](fishing-predator-prompts.json).

First catches add `fish:<id>` to the validated rewards ledger and a line to the Journal catch list. A first catch also reveals an authored local clue. `puzzle:<id>` records solved puzzles and updates room prose. New flags fit the existing v3 schema and validate against discovered locations; old saves require no new fields. Saves preserve caught species even after their fish are eaten or sold.

## Missions from people, jobs from boards

`jobs` remains the existing courier-contract system. `missions` lists personal requests accepted from residents. A person offers the task during `talk <name>`; `accept mission <id>` starts counting, and `report <id>` pays at that person’s location. Journal includes both sections. Board listings do not reveal personal mission offers.

| Giver | Mission | Objective after acceptance | Reward |
|---|---|---|---|
| Hal, Steps Undercroft | `five-from-the-water` | Catch five fish at any fishing site | 60 credits, 30 XP |
| Sera, Customs Awning | `harbor-sample` | Catch three fish beneath the harbor pilings | 45 credits, 25 XP |
| Ada, Bellwether Post | `creek-census` | Catch five fish at Blackwater Bridge | 100 credits, 45 XP |

The giver asks for an account of the catches, not item handover: keep, eat, or sell them. Only successfully caught fish count; prior inventory, purchased fish, misses, cancellations and hostile creatures do not. Repeated species count. Progress persists through reload and selling. A catch can advance both an accepted general mission and a matching site-specific mission. Completed counts cap at the objective; payment is once per mission, with duplicate reports rejected without a turn. Courier jobs stay repeatable.

`src/missions.ts` owns giver, objective, allowed waters, rewards and dialogue. This first set supports catch objectives; future mission types should add explicit events and validation, not parse transcript text. Progress uses validated contiguous `mission:<id>:1…N` reward flags plus `active` and `done`, preserving the existing save schema. Validation rejects missing acceptance, undiscovered givers, gaps, invalid completion counts, and missing fishing-location/catch evidence.

## Art and presentation

Generated with OpenAI's built-in image generation tool, industrial noir palette:

- `public/assets/items/estuary-fishing-atlas.png`: collapsed kit, bait, fourteen catches in a 4×4 atlas.
- `public/assets/paintings/fishing-drains.png`, `fishing-jetty.png`, `fishing-creek.png`: site-specific fishing views.
- `public/assets/paintings/mudskipper-hound.png` and `pallid-bankmaw.png`: hostile fishing creatures, with distinct action/close compositions.
- CSS ripples and a catch reveal accompany the illustrated timing and discovery popovers. These are browser animations, not generated video.

Full authoring prompts: [fishing-art-prompts.json](fishing-art-prompts.json). Original generated PNGs remain unchanged; SVG crops select item art (with a tighter lower edge for the clockwork smelt to exclude its neighbor). Dimensions and SHA-256 hashes are audited from `public/assets/fishing-art-provenance.json`. Credits are in `public/assets/ATTRIBUTION.md`.

## Spoiler playtest route

1. Finish clinic intake. Try `dance` twice, `punch wall`, `listen`, and `inspect board`. Only the prose should change.
2. Buy a `telescopic fishing kit` and optionally `fishing bait`. Check `inventory`: the kit uses one cell. Keep space for a 3×1 or 2×2 fish at the first site.
3. From the clinic go `s`, then `down`. Read the water description. Type `fish`; Enter must not award anything. Hit Space in amber twice. Check the catch popover, inventory, and Journal.
4. Cast again and miss, then cast and Escape. Each resolved attempt spends one turn and, if available, one bait tin. Nothing is caught. Fish without bait to verify the reusable lure.
5. With lock tools, go west from Steps Undercroft to Lamplight Junction. Read/inspect the tackle box, then `pick lock`. Three pins yield a kit and bait once. Save/reload and try again; the reward must not duplicate.
6. At Rooftop Relay, `inspect terminal`, then `hack terminal`. Tap, hold, tap, tap (`.-..`). Inspect the transfer-complete prose and try again.
7. In combat, use a damaging class ability. Enter performs its normal effect; Space in amber increases damage. A miss still consumes the normal ability action. Try an emote only if willing to give the enemy a turn.
8. Visit the harbor and Blackwater Bridge to compare water art and catches. Sell fish at a trader; eat an edible fish while injured. Rotate a long catch in the pack.
9. Talk to Hal, accept `five-from-the-water`, and land five catches. Type `missions`, return to Hal, and `report five-from-the-water`. Verify payment once, including after reload. Seek Sera and Ada for local-water missions.
10. A hostile reel should switch directly into combat with an opening attack, no catch popover and no mission progress. Save/reload its current health and intent; try rest (blocked), then fight or flee. Rare bankmaws can kill: test only with a disposable run.
11. During a challenge test Tab, Escape, held Space, hiding the tab, and importing a different save. Finish with keyboard focus back at Command. Review at 3440×1440, 1280×800, and 390×844.

## Authoring and verification

Add fish in `src/fishing.ts`, including unique atlas index, dimensions, food values, and at least one weighted site table. Item definitions and backpack footprints derive from this catalog. Add a fishing room with stable ID, descriptive water clue, table, rumor, and matching scene selection in `challengeFor`. Add puzzles with stable IDs, aliases, visible clues, solved text, reward/cost rules, and save validation; never rely on presentation alone to prevent repeated rewards.

Focused checks: `npm test -- tests/interactions.test.ts tests/fishing-missions.test.ts tests/theft.test.ts`; production browser checks: `npm run test:interactions` and `npm run test:theft` after building. The new browser suite uses real Space keydown/keyup events and timed slider positions, not injected success results. An accelerated clock checks tab-hidden and timeout behavior. Visual evidence is in `evidence/interaction-pass/`; theft evidence remains in `evidence/theft-pass/`.

Scope limits: this is a bounded authored parser and initial interaction content set, not comprehensive natural-language understanding or an installed AI dungeon master. Fishing is repeatable; locks and the terminal are not. No new ambient audio library, permadeath, revival drone, broader discovery chain, or tutorial is included in this interaction slice. Existing clinic revival remains until its separate migration/test pass.

## Verified milestone

Full release gate passed 2026-09-16T02:02:47.670Z: **125 unit tests across 22 files, production build, asset audit, and all eleven browser suites**. Snapshot: `evidence/interaction-pass/release-verification.json`. New checks include actual timed catches, personal mission acceptance/progress/turn-in, immediate fishing attacks, saved combat, malformed states, cancellation, focus, and repeated rewards. Visually inspected the fishing, catch, inventory, mission and predator views at the tested sizes; no browser errors. This is automated playtesting plus screenshot review, not a measured human pacing or audio-listening session. Local build only; no deployment was performed.
