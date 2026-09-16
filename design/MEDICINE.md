# District 67 — lasting conditions and augmentation

This is a run-based progression system. A fresh patient has no lasting conditions or implants. A revival drone preserves the current body, including injuries and implants.

## Conditions

| Condition | Effect | Clinic fee | Sources |
| --- | --- | ---: | --- |
| Brain damage | −12 percentage points to weapon accuracy | 75 | Severe blunt impacts: bruisers, tread brutes, chain brawlers, heavy tails |
| Torn ligaments | −6 maximum stamina | 45 | Severe blade, firearm and other physical hits |
| Infected wound | Medical supplies heal 8 less HP | 35 | Contaminated heavy hits in drains, shallows and fen |
| Nerve burns | −4 maximum stamina | 55 | Electrical and fire attacks |
| Marrow rot | −10 maximum HP | 90 | Higher-level culvert maws and the pallid bankmaw |
| Radiation sickness | −6 maximum HP, −6 weapon accuracy | 60 | Crossing 75 radiation from below |

An unguarded heavy hit must actually damage a living player for at least 40% of their maximum HP; level 3+ enemies need 25%. Armor and shields can reduce damage below that threshold. Brace, cover and interruption prevent traumatic conditions. Heavy-attack intent warns about lasting injuries. Conditions never stack copies, do not add passive real-time damage, and remain through resting, supplies, leveling and save/reload. Radiation cleansing removes exposure, not established sickness.

These are balancing starting points, not a claim of an approved difficulty curve. Boss-like enemies use their actual attack family, level and damage, including fishing predators. Money spent on treatment competes with upgrades and equipment. No automatic debt or forced purchase occurs.

## Doctors and commands

Dr. Pell: Reclamation Clinic. Ripper Voss: Bellwether Gate (clinic fee +15 per condition).

`status` / `condition` lists effects. `talk doctor` gives treatment prices, implants and the commission. `treat brain damage` treats one condition; `treat all` treats all. Insufficient funds, wrong location, combat and duplicate treatment change nothing. Treatment repairs the condition but does not refill HP or stamina; rest afterward.

`implants` lists current ranks and prices. `upgrade <name>` installs a rank, up to three per implant, without consuming training points or requiring a level.

| Implant | Benefit per rank | Credit prices |
| --- | --- | --- |
| Dermal weave | +12 maximum HP | 80 / 160 / 280 |
| Adrenal regulator | +6 maximum stamina | 80 / 160 / 280 |
| Targeting optic | +6 weapon accuracy | 100 / 180 / 300 |

Existing maximum weapon accuracy still applies. Implants increase potential resources; they do not instantly refill them.

## Doctor commission

`accept spare parts` at either doctor. Collect 3 salvage through existing exploration/combat, return and `report spare parts`. Goods are consumed once and one implant-rank voucher is awarded. The next valid upgrade uses that voucher before credits. A capped/invalid upgrade cannot waste it. Completion and redemption persist across reloads. `missions` and `journal` retain progress. This first commission is once per run; repeatable courier jobs remain a source of upgrade/treatment cash.

## Persistence and verification

Browser save v5 adds `player.body` with conditions, implant ranks, commission status and voucher. v2/v3/v4 saves migrate in memory; existing player progression, run identity and inventory remain. Stored bytes are only rewritten by normal explicit/autosave operations. Unknown conditions/implants, duplicate conditions, invalid ranks and inconsistent vouchers are rejected. Existing ended-run protection and conflict detection continue to apply.

Automated tests cover migration, persistence, prices, partial treatment, insufficient funds, no duplicate commission rewards, three implant ranks, real enemy-family injury events and defensive prevention. Human playtesting must judge frequency, cost and recovery burden.

## Disposable human test

Import [07-medical.json](playtest-saves/07-medical.json) in a separate test run/profile. It intentionally supplies all six conditions, 500 credits and 3 salvage; it is a mechanics fixture, not evidence of earned balance or run pacing. Try `status`, `talk doctor`, `treat brain damage`, `rest`, `accept spare parts`, `report spare parts`, `upgrade dermal weave`, and reload. Check that treatment removes only the selected condition and the mission upgrade spends no credits. Avoid importing over a character you want to retain without exporting it first.
