# Clinic continuity and readable combat

## Confirmed direction

The player keeps their map, quests, levels, implants and gear after death. Recovery costs credits and leaves a treatable injury. This replaces the earlier fresh-character-on-death decision. The clinic should become a recurring relationship: a place whose staff know the survivor and remember help given to them.

## Implemented rules

- Lethal damage first checks for a packed Stitch Drone. Its existing rescue stays in the same fight, without a reconstruction fee or new reconstruction injury.
- Without a drone, the death experience records what happened. **Wake at clinic** reconstructs the same character at Reclamation Clinic. **Return to clinic** on the title opens that experience after a reload.
- Fee: 15% of carried credits, rounded up. Zero credits means a zero fee. No new debt, lost gear, or mandatory payment gate.
- One absent lasting injury is added in this order: torn ligaments, infected wound, nerve burns, brain damage, marrow rot, radiation sickness. Existing injuries stay. Once all six exist, repeated deaths do not stack copies. This deterministic order is the first tuning pass, not random hidden punishment.
- Health/stamina refill to the injured body's current maximum; radiation exposure clears. Combat effects and cooldowns clear. World progress, discoveries, loot, quests, active courier route and parcel, character progression, implants, inventory and exact pack placement persist.
- The failed opponent is not awarded or cleared by dying. Returning may mean fighting them again.
- Pell recognizes the first recovery and repeated recoveries. Completing **Spare Parts** earns recognition and 20% off injury treatment at Pell's clinic, rounded up per condition. Voss's prices and implant costs remain as before. Dying does not earn trust or discounts.
- Starting **New game** is still an explicit fresh-character choice.

The recovery crew bringing the body and pack home is the current fiction. Pell's recognition makes continuity personal. A deeper clinic quest chain, individual staff relationships and dialogue reacting to major world choices are next-stage content, not implemented here.

## Saves and failure behavior

v6 adds `run.recoveries`, separate from `run.revivals` (drone rescues). v2–v5 saves migrate on read; original stored bytes are not rewritten by loading. An old dead save can now enter the recovery flow. Items removed under the old death rules cannot be recreated from absent historical data.

Each life still has an immutable `ended:<id>` checkpoint. Reconstruction retains the campaign state and RNG but uses a new life identity. The new autosave and `reconstructed:<old-id>` receipt commit in one IndexedDB transaction. The UI shows the living state only after that succeeds. A failed write leaves the death, credits and injury state unchanged; retry is safe. A second tab cannot reconstruct the same death again. Loading the latest autosave rejoins the winning recovery. Import/recovery cannot overwrite it with that already-reconstructed dead state.

This is local continuity, not server anti-cheat. Exported JSON and clearing browser storage remain under the player's control.

## Combat clarity

`inspect target`, `inspect enemy`, or `inspect <current enemy name>` gives a free assessment using current HP, weapon skill, injuries, implants, radiation, armor and exposure effects. It displays:

- A qualitative threat label with target HP/armor.
- Basic hit chance and actual damage range on a hit; firearm aim chance and stamina cost.
- The next enemy response's damage on a hit, including brace/cover alternatives and a separate bleeding warning.

The estimate does not roll RNG or spend a turn. It is not a win probability: kills, interruption, morale, healing, misses and special attacks affect the outcome. The existing visible intent remains the guide to the enemy's next action. Weapon hit/damage math is shared between assessment and execution.

The primary button reads `attack (fire)`, `attack (slash)`, `attack (strike)`, `attack (shock)`, etc. Hit/miss prose describes the equipped weapon's action. `fire`/`shoot` are firearm aliases; `slash`, `shock`, `burn` and `drain` require a matching weapon. `attack` remains universal. Aim is a shot, with explicit aiming prose. This is a readability pass over the existing rules; it does not add player magazines, ammunition or new resistances.

## Rules research and platform decision

Primary sources consulted 2026-09-16:

- [Cairn 2E core rules](https://cairnrpg.com/second-edition/players-guide/core-rules/): automatic hits, armor-reduced weapon damage and meaningful risky situations offer a lightweight alternative. Adopting it wholesale would replace FREEBORN's accuracy/aim system. Its CC BY-SA rules require appropriate licensing if text is adapted.
- [Wesnoth defense and resistance](https://wiki.wesnoth.org/Defense_and_resistance) and [combat simulation API](https://wiki.wesnoth.org/LuaAPI/wesnoth): useful examples of separating hit probability from damage and making combat outcomes calculable. Future weapon resistances should remain readable, not become a hidden modifier pile.
- [Tauri architecture](https://v2.tauri.app/concept/architecture/): a possible future desktop package, using a WebView. It would retain the frontend and would not inherently fix focus, layout or state bugs.

Decision for this increment: retain the TypeScript engine, expose its actual math and test browser interactions. No third-party rules text or engine code was copied. No Python port or server/database migration is needed for this feature. Record concrete browser failures (focus loss, scroll jumps, audio, storage) before changing platforms.

## Verification and human review

Automated evidence: `tests/reconstruction.test.ts`, `tests/combat-assessment.test.ts`, `npm run test:recovery`, existing run/save/medicine suites, full release gate and public smoke. Browser scenarios cover an interrupted write, safe retry, two tabs, retained parcel and map, treatment discount, reload, refocused command input and a subsequent firearm fight. Screenshots: `evidence/clinic-recovery/`.

Human sign-off remains pending. Check whether Pell feels familiar, whether 15% plus injury is fair, whether threat labels help choose a response, and whether the firearm interaction is readable. More clinic story content and deeper weapon mechanics remain backlog items.

Release verification: 174 unit tests / 29 files, build and asset audit, 18 browser suites, and public smoke all passed. Published Pages: `77ead33`. Receipts: `verification/clinic-recovery.json`, `verification/full-verification.json`, `verification/deployment.json`. Human acceptance remains pending.
