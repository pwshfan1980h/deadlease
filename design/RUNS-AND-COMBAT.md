# Runs, revival and enemy roles

This is the current rules reference. It supersedes the historical clinic-revival descriptions in earlier milestone reports. Human feel and run duration remain unverified until Will playtests them; use [the sign-off ledger](PLAYTEST-LEDGER.md).

## Death and a fresh patient

Lethal damage ends the run at the room where it happened. The death screen records the cause, level, turns, visited locations, kills, drone rescues and completed work. It offers **New patient**, **Return to title** and **Export record**. Tab/Shift+Tab moves between controls; Enter activates them. Escape returns to the title. The title shows **Run record** for a dead autosave.

New patient begins the same in-world clinic intake: dismissible backstory, `talk clerk`, name/origin, then class/bonus skill. Finalizing creates a cryptographically random run identity and RNG seed. All gear, money, levels, world changes, mission progress and delivery progress start fresh. Preferences remain separate and survive. There is no new clone debt. Historical debt in older saves is retained. Cancelling intake restores the preceding session; it never revives a dead character.

The active delivery is closed on death and its parcel removed. Other inventory and quest state stay in the terminal record for inspection/export; the engine refuses all gameplay commands against that record. No idle timer resumes it.

### Saving and migration

The run milestone introduced **v4** (now extended by **v5** medical state; see [MEDICINE.md](MEDICINE.md)): `run` records identity, initial seed, status, cause, terminal turn, kills and rescues; `bleed` tracks the status duration. Encounters add `heat` and `morale`.

Versions 2 and 3 migrate without discarding living characters, pack positions, earned rewards, encounter HP or phase. New effects begin neutral. Reading does not rewrite legacy bytes. The next successful save now writes v5, retaining the v4 run fields. Pre-change v3 living and combat fixtures live in `tests/fixtures/run-migration/`.

An accepted terminal write stores the slot and `ended:<run-id>` together in one IndexedDB transaction. The first terminal record is immutable. Load resolves an older living slot to that ended record. Import, explicit recovery and ordinary save all reject a living state with a sealed identity. A stale tab cannot overwrite the seal, even if it has not received the one-second notification poll. Conflicting bytes remain in quarantine. A dead screen blocks New patient while recording or after a storage failure; **Retry saving record** explicitly recovers the terminal autosave and quarantines previous bytes. Export remains available on failure.

This is local run continuity, not server-enforced anti-cheat. Clearing browser storage, changing exported JSON or importing into another browser is outside this guarantee. Distinct pre-v4 snapshots have no shared historical identity; each raw legacy snapshot gets a stable migration identity. Living manual saves can still replay a living run. Completed history currently has no gallery; the current record/export and preserved per-run entries are the implemented surface.

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

Use a separate browser profile or export your current save first: importing a test patient deliberately replaces the active session. Files in [playtest-saves](playtest-saves/) are disposable fixtures, not real player saves. Each has a distinct identity. Once a fixture dies in a profile it stays dead there; use a fresh profile to repeat that same death case.

1. **01-packed-drone.json:** import, open `inventory`, inspect both drones, Escape, type `brace`. Expect one drone consumed, half HP and the same enemy. Reload; it should stay consumed.
2. **02-unpacked-drone.json:** import and `brace`. Expect final death despite owning a drone outside the grid. Inspect the summary, reload, then New patient. Expect clean clinic intake, no inherited progress.
3. **03-marksman.json:** type `cover`, then `brace`. Watch aiming change to reloading, with no damage during those two responses. Try a fresh copy with `brace` first to allow the aimed shot.
4. **04-cutthroat.json:** type `dance` to expose yourself, then inspect HP/transcript. `look` and Escape/pause should not tick bleeding. `heal` should stop it.
5. **05-tread-brute.json:** `brace` three times to see heat reach three, then watch three cooling turns. Do those openings feel legible and useful?
6. **06-surrender.json:** type `brace`, then `spare`. Expect reduced payment and no kill credit. `spare` again should do nothing.

Report `case / pass or fail / what happened / what felt wrong` in the [ledger](PLAYTEST-LEDGER.md). In particular, judge sound, readability at 3440×1440, and whether the choices are fun. Automation cannot provide that sign-off.

## Developer verification and scope

`npm run test:runs` exercises the production build with real IndexedDB, two tabs, stale-tab rejection, reloads, fresh intake, preferences, drones, bleeding, all three roles and surrender. It records screenshots at 3440×1440, 1280×800 and 390×844. `tests/runs.test.ts` and `tests/enemy-behavior.test.ts` cover pure rules and malformed saves. Run `npm run test:all` for the complete gate; do not rebuild `dist/` while a browser suite is using it.

Runtime modules: `runs.ts`, `enemyBehavior.ts`, `engine.ts`, `saves.ts`, `RunEnd.tsx` and `App.tsx`. Add role membership in `enemyBehavior.ts`, then add counter/state/save tests. Fixed watch encounters explicitly bypass human morale and marksman behavior.

The city ending/free-exploration behavior is unchanged; a separate successful-run summary is still planned. No tutorial, backpack synergies, courier reputation, new ambient recordings or AI director has been added in this milestone. The ordinary 30–45-minute target still needs human timing. No external database or server is required for these local rules.
