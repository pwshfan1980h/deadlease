# Runs, revival and enemy roles

This is the current rules reference. The clinic-continuity decision supersedes earlier permadeath milestones. Human feel and journey duration remain unverified; use [the sign-off ledger](PLAYTEST-LEDGER.md).

## Death and clinic reconstruction

Without a packed drone, lethal damage opens a death experience. **Wake at clinic** restores the same character at Reclamation Clinic: map, quests, levels, implants, gear, pack placement and active delivery remain. The fee is 15% of carried credits, rounded up, plus one treatable lasting injury. An empty purse never blocks recovery. Pell recognizes previous recoveries and actual help given to the clinic. Completing Spare Parts earns 20% off his injury treatment.

The title offers **Return to clinic** for a dead autosave. **New game** remains an explicit fresh-character choice, with new identity/seed and no inherited gameplay progress. Preferences persist. Escape from death returns to the title; it does not reconstruct or charge the player.

### Saving and migration

The v6 envelope adds a clinic recovery count and retains the existing drone-rescue count. v2–v5 characters migrate without losing living progress. Death checkpoints remain immutable; reconstruction commits a new life identity and a one-use recovery receipt atomically before resuming play. Interrupted writes charge nothing. Stale tabs and imports cannot reconstruct the same death twice or replace its living autosave with the old dead record. **Load latest autosave** appears with an error so another tab can rejoin the successful recovery.

See [the full continuity, combat and migration guide](CLINIC-RECOVERY-AND-COMBAT.md) for details and research. This is local continuity, not server-enforced anti-cheat.

## Weapon actions and inspection

The attack button and prose distinguish firing, slashing, striking, shocking and other weapon families. `attack` always uses the equipped weapon; `fire`/`shoot` require a firearm. Aim fires with an accuracy bonus and stamina cost.

Use **inspect target** or `inspect <enemy name>` for a free, current-build threat assessment, hit chance, damage range, and the next enemy response with brace/cover comparisons. It does not advance turns or RNG. The label is an estimate, not a promised battle outcome.

## Stitch Drone

- A painted **2×2**, one-per-bundle item. It must be placed in the pack grid; owning one in overflow is insufficient.
- Automatic on lethal combat or bleed damage. No emergency click or command is needed.
- Consumes exactly one packed drone, restores **50% maximum HP rounded up**, and clears bleeding.
- Preserves enemy HP, the room and the current encounter. A rescue during flight keeps you in that fight.
- Cancels remaining damage in that command, so bleeding and an enemy response cannot consume two drones at once. Further lethal commands can consume further legitimately acquired drones.
- Buy at the clinic, base price **180 credits** before existing discounts. Defeated level-3+ enemies have a supplemental **3%** drone drop chance. It appears as ground loot and must be collected/packed. Surrender and flight do not roll loot.
- Distinct synthesized revival cue; prompt and hashed provenance: `stitch-drone-prompt.json`, `../public/assets/run-art-provenance.json`.

## Enemy roles

The roles use authored names and deterministic saved state. Enemy levels do not scale up to cancel earned player strength. Beginner creatures and the theft watch keep their existing behavior.

| Role | Sequence and counter | Applied enemies |
| --- | --- | --- |
| Marksman | Aim → aimed shot (2× base damage) → harmless reload → normal snapshot. Cover during aiming breaks the aimed shot and goes straight to reload. Brace/cover mitigate the shot; interruption sends the enemy to its snapshot phase. | Alley marksman, harbor gunner, mirror sniper, storm deserter, reed poacher |
| Cutthroat | Normal measured strike/wind-up/heavy/recovery cycle. An unguarded damaging cut causes bleeding. Brace or cover prevents a new bleed application. | Street cutthroat, sump knifer, shard duelist, fen trapper |
| Tread brute | Strike and wind-up build heat; heavy strike reaches 3 heat. Three recovery responses vent one heat each without attacking, then the cycle restarts. Interruption causes the full cooling window. | Tread brute |

Bleeding costs **2 HP at the start of each of the next three accepted combat actions**, before the enemy response. Another unguarded cut refreshes to three; it does not stack damage. Medical supplies, healing abilities and cleansing stop it. Finishing or leaving combat clears it. Free observation, unknown commands, idle time, inventory and pause do not tick it. The HP bar and transcript show its duration. Choosing a lethal finishing blow can end the encounter before another bleed tick.

### Morale and rewards

At 20% HP or less, eligible cutthroats offer surrender instead of attacking. Type **spare** or **accept surrender** to end the fight. Attacking/refusing makes that opponent defiant for the rest of the encounter. A badly wounded marksman in the reload phase instead flees.

Peaceful resolution pays half the normal XP and credits (rounded down), no salvage or random loot, and no kill count. Normal kills pay existing rewards and increment kills. Resident clearance and the existing authored respawn delay apply to both outcomes. A second `spare` never pays again. Fishing predators and theft watch encounters do not surrender.

## Quick human playtest

Use a separate browser profile or export your current save first: importing a test patient deliberately replaces the active session. Files in [playtest-saves](playtest-saves/) are disposable fixtures, not real player saves. Each has a distinct identity. A fixture death can be reconstructed once; use a fresh profile to repeat exactly the same imported death case.

1. **01-packed-drone.json:** import, open `inventory`, inspect both drones, Escape, type `brace`. Expect one drone consumed, half HP and the same enemy. Reload; it should stay consumed.
2. **02-unpacked-drone.json:** import and `brace`. Expect the death experience despite owning a drone outside the grid. Reload, then Wake at clinic. Expect the same gear and explored map, a 15% credit charge, and one injury.
3. **03-marksman.json:** type `cover`, then `brace`. Watch aiming change to reloading, with no damage during those two responses. Try a fresh copy with `brace` first to allow the aimed shot.
4. **04-cutthroat.json:** type `dance` to expose yourself, then inspect HP/transcript. `look` and Escape/pause should not tick bleeding. `heal` should stop it.
5. **05-tread-brute.json:** `brace` three times to see heat reach three, then watch three cooling turns. Do those openings feel legible and useful?
6. **06-surrender.json:** type `brace`, then `spare`. Expect reduced payment and no kill credit. `spare` again should do nothing.

Report `case / pass or fail / what happened / what felt wrong` in the [ledger](PLAYTEST-LEDGER.md). In particular, judge sound, readability at 3440×1440, and whether the choices are fun. Automation cannot provide that sign-off.

## Developer verification and scope

`npm run test:recovery` checks reconstruction, failed writes, duplicate prevention, clinic recognition and combat inspection. `npm run test:runs` exercises the production build with real IndexedDB, two tabs, stale-tab rejection, reloads, fresh intake, preferences, drones, bleeding, all three roles and surrender. It records screenshots at 3440×1440, 1280×800 and 390×844. `tests/runs.test.ts` and `tests/enemy-behavior.test.ts` cover pure rules and malformed saves. Run `npm run test:all` for the complete gate; do not rebuild `dist/` while a browser suite is using it.

Runtime modules: `runs.ts`, `enemyBehavior.ts`, `engine.ts`, `saves.ts`, `RunEnd.tsx` and `App.tsx`. Add role membership in `enemyBehavior.ts`, then add counter/state/save tests. Fixed watch encounters explicitly bypass human morale and marksman behavior.

The city ending/free-exploration behavior is unchanged; a separate successful-run summary is still planned. No tutorial, backpack synergies, courier reputation, new ambient recordings or AI director has been added in this milestone. The ordinary 30–45-minute target still needs human timing. No external database or server is required for these local rules.
