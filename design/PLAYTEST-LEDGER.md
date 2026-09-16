# FREEBORN — playtest accountability

Implementation verification and Will's playtest sign-off are separate. Never mark human approval from an automated result. At each playable milestone, record the build, reproducible steps, expected behavior, automation evidence, and Will's feedback. Carry unresolved feedback into the next milestone.

## Current milestone: runs, revival, and enemy roles

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
