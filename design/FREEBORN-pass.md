# FREEBORN — frontier and immersion pass

## Premise

Clinics revive discarded people to keep the streets and machinery working. The player survives the work camps and estuary frontier to reach a real city. That city is the ending, not another playable region. Bellwether is a smaller frontier stop on the road.

The title is now FREEBORN. Existing save storage and the previously published repository address retain their old internal names so that changing the title does not strand saves or links.

## Playtest entry points

- **Early sewer:** from Reclamation Clinic, type `s`, `down`, `w`. Lamplight Drains is level 1–2, with no radiation and a guarded refuge in Lampkeeper Nook. Deep Drains remains the harder underground region.
- **First income:** at the clinic, `jobs`, then `accept freight-return`. Travel `e`, `e`, `e` to Freight Yard and `deliver parcel`. The return job is `accept clinic-run`, followed by three westward moves and another delivery. Each leg pays 14 credits. One round trip funds a class starter weapon.
- **Frontier:** continue south from Reed Terminus into the Long Dike. A camp halfway down provides free rest. Bellwether lies beyond Blackwater Bridge.
- **Long deliveries:** Freight Yard offers `accept bellwether-run`. Deliver at Bellwether Post for 90 credits. `talk ada` introduces the postkeeper; `jobs` offers the district return journey.
- **Ending:** complete the master-ledger quest at Crown Receiver. Type `depart` for the city arrival and credits. Escape or Enter returns to free exploration. Cityward Lookout and Crown Receiver show the distant skyline and aircraft.

## Content

149 rooms across 10 regions. 23 enemy identities, including 14 added human/humanoid types. The original nine enemies have new visible names. Every region has at least two resident human types. Refuges keep their neutral watch, and wandering encounters remain rare.

| Region | Added human types |
| --- | --- |
| District 67 | Street cutthroat, plus wandering alley marksman; existing checkpoint bruiser remains |
| Salt Quay | Harbor gunner, chain brawler |
| Reedward Fen | Reed poacher, fen trapper |
| Cinder Union | Tread brute, slag burner |
| Vitreous Ward | Shard duelist, mirror sniper |
| Survey Crown | Storm deserter, coil zealot |
| Deep Drains | Drain scavenger, sump knifer |
| Lamplight Drains | Drain scavenger, sump knifer |
| Long Dike | Street cutthroat, reed poacher, fen trapper |
| Bellwether outskirts | Alley marksman, street cutthroat |

Human attacks use contextual wind-ups and recovery text. Health and damage vary by role. Combat retains the readable four-response cycle, so these additions do not introduce hidden real-time attack timers.

## Sound and transitions

Fourteen original synthesized cues distinguish pistol and rifle fire, blades, blunt force, claws, electricity, fire, draining effects, misses, impacts, blocking, healing, wind-ups and recovery. The player's attempt plays before a delayed enemy response. Muting, closing audio, or starting another sequence cancels pending sounds.

Traversal fades the old room out over 160 ms, changes the room, and fades the new room in over 220 ms. The command line stays in place. Duplicate actions and minimap opening are blocked during the transition. Reduced-motion preferences skip the fade. Failed movement has no fade or footsteps.

## Equipment and income

Thirty additional class-favored weapons bring the weapon total to 38. Each of the ten classes has early, middle and late equipment. Shops include the appropriate class weapons based on player or local level. Players may equip any weapon.

Enemy victories have a 35% weapon-drop chance, with a weapon guaranteed by the third victory without one. 85% of weapon rolls favor the selected class. Drops remain on the ground and never force gear into a full pack. New weapons use existing inventory artwork appropriate to their weapon family; their names, statistics and grid shapes differ.

Spare gear can be sold. Worn final copies, quest artifacts and courier parcels cannot. Courier parcels use a 2×2 space, remain through clinic recovery, and pay only once at the correct destination. Return trips make courier work repeatable.

## Save and database decision

Browser saves already use IndexedDB with atomic conflict detection and quarantine. Version 2 and 3 saves now migrate to version 4 on load. The original frontier migration adapts enemy names, ability names and added map rooms; [the run migration](RUNS-AND-COMBAT.md) adds run identity and combat state. The existing stored bytes are not rewritten merely by reading a save. The next successful save writes the new format.

No server database is needed for this expansion. Add a backend when accounts, cloud saves, cross-device synchronization or a shared economy become requirements. Authored content remains local and works on static hosting.

## Artwork

The built-in OpenAI image generation tool produced fourteen new enemy paintings and four environment paintings. The second enemy set uses closeups and action compositions. Files are in `public/assets/paintings`; exact prompts and paths are in `design/freeborn-art-prompts.json`. Biome scenes currently share one environment painting within each new region, while the room names and descriptions remain unique.

## Verification

`npm run test:all` includes regression tests, the production build and asset audit, plus browser playtests for the original campaign, audio, roaming, clinic/death, inventory/minimap, and this frontier expansion. Evidence is stored in `evidence/frontier-pass` and `evidence/full-verification.json`.

## Later milestone

See [Motion and jobs boards](MOTION-AND-BOARDS.md) for the subsequent animation, hit-feedback, and courier-discovery work. The current [development todo](DEVELOPMENT-TODO.md) records verified progress and separates implemented features from future run-ending death rules.

See [Escape menu](PAUSE-MENU.md) for pause/resume, settings, controls, save management, and keyboard behavior.
