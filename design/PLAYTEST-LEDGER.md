# FREEBORN — playtest accountability

## Fresh-run button review — 16 September 2026

Three fresh public sessions completed: Enforcer (40 turns), Street Medic (27 turns), Glassrunner (47 turns, ended). Mixed clicks/typing, pump progression, real fishing mission, injury and paid repair, retreat, and persistent death tested. One unavailable-action button issue found and fixed. See [full report](PLAYTEST-2026-09-16-BUTTONS.md). This is agent verification; human acceptance and full-run pacing remain pending.

## Current priority: transcript and lasting conditions

Published candidate: Pages `6732b09` (combat button availability fix). 154 unit tests, 14 browser suites, build, asset audit and public smoke checks passed. Reports: `verification/medical-verification.json`, `verification/full-verification.json`, `verification/deployment.json`. A disposable [medical test save](playtest-saves/07-medical.json) is available; export a wanted character before importing any fixture.

- [ ] Judge the compact room/player header and tall transcript at your normal window size.
- [ ] Hover over the room image, leave it, then type `view` and Escape. Check that normal command input stays comfortable.
- [ ] Check red HP, yellow stamina, ☢ radiation and lasting-condition labels.
- [ ] Try both clicking and typing travel/combat actions. Enemy art, inhabitants and grey ground items should be part of the transcript; resizing should retain the latest entry when you were following it.
- [ ] At the clinic type `talk doctor`, `accept spare parts`; return with three salvage and `report spare parts`, then choose `upgrade dermal weave` (or another offered implant).
- [ ] After a severe unguarded hit, check `status`. Rest should not cure the condition. A doctor should quote and charge the treatment price; `treat <condition>` repairs only that condition.
- [ ] Compare income, treatment costs and implant power. Report whether injuries feel consequential or too frequent/punishing.

Human acceptance: **pending**. Rules and prices: [MEDICINE.md](MEDICINE.md).

## Previous pass: scene and terminal

User feedback received: previous room descriptions, UI contrast, scene size and art were unsatisfactory. This feedback sets the current priority; it is not a sign-off on the replacement visuals.

Published candidate: Pages `eec035a`, implementation source `56fd3b9`. All 149 room paintings installed and visually reviewed; 145 unit tests, 13 browser suites, production build, asset audit and public smoke checks pass. Reports: `verification/full-verification.json`, `verification/scene-verification.json`, `verification/deployment.json`.

- [ ] Start a new patient. Judge the large scene / compact player strip / terminal proportions in your usual window.
- [ ] Walk south. Before `look around`, check that the room stays concise; after it, check the manhole clue. Go `down`, then `up`, and judge whether the paintings feel connected.
- [ ] Find loose loot. It should be immediately listed in grey. `take all` should remove it from the list.
- [ ] At the kiosk, type `look around`. The sealed medical kit should be green in the prose; it must not appear in the grey ground list.
- [ ] Enter combat. Check green-on-black transcript readability and red enemy names; check that immediate people and threats remain easy to identify.
- [ ] Resize the window. The command line should stay visible on desktop and the full painting should remain uncropped. The pointer should be available without making clicks necessary.

Human acceptance of this pass: **pending**. Automated verification and artwork-generation receipts are tracked separately in `DEVELOPMENT-TODO.md` and `VISUAL-DIRECTION.md`.


Implementation verification and Will's playtest sign-off are separate. Never mark human approval from an automated result. At each playable milestone, record the build, reproducible steps, expected behavior, automation evidence, and Will's feedback. Carry unresolved feedback into the next milestone.

## Previous milestone: runs, revival, and enemy roles

Status: implemented, automation verified and published; ready for Will’s playtest. Pages build: `39447ff`; [play FREEBORN](https://pwshfan1980h.github.io/deadlease/). See [rules and six disposable test saves](RUNS-AND-COMBAT.md#quick-human-playtest). Compact release reports live in `verification/`; generated screenshots remain in `../evidence/run-pass/`.

| Case | Automated verification | Will's sign-off |
| --- | --- | --- |
| Lethal damage ends a run; reload cannot resume that dead character | Passed — unit + production browser | Not tested |
| Fresh clinic intake resets gear, missions, money and world progress; settings persist | Passed — unit + production browser | Not tested |
| Packed Stitch Drone consumes exactly one unit, restores control in the same encounter | Passed — unit + production browser | Not tested |
| An unpacked drone does not rescue the player; multiple packed drones work on separate lethal actions | Passed — unit + production browser | Not tested |
| Marksman intent makes cover/reload opportunities understandable | Passed — unit + production browser | Not tested |
| Cutthroat bleeding is visible, turn-based and treatable | Passed — unit + production browser | Not tested |
| Tread brute heat/overheat creates a clear opportunity | Passed — unit + production browser | Not tested |
| Human morale/surrender outcomes feel fair and reward only once | Passed — unit + production browser | Not tested |

Storage failure/retry, stale imports, two open tabs, legacy migration, and each class’s basic combat counters are also checked. Audio dispatch and artwork rendering are checked; this does not substitute for listening or judging play feel.

### Your report format

`Case / pass or fail / what happened / what felt wrong`.

A save export and the last few transcript lines help reproduce a failure. A short plain-language report is enough to start. No human test is currently signed off for this milestone.

## Previous milestone: interactions and fishing

125 unit tests, build, asset audit and eleven browser suites passed. See `../evidence/interaction-pass/release-verification.json` and `INTERACTIONS.md` for the route. Will's hands-on sign-off remains **not recorded**.
