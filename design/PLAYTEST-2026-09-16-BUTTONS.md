# Restored-button playtest — 16 September 2026

Three fresh characters played on public Pages build `21f64db`, using the actual interface with clicks and typed commands. No imported saves, granted equipment, injected progress or altered RNG. Isolated Chromium contexts preserved Will's live game. Save state was read only to record outcomes. These were agent-driven play sessions, not completed human campaign runs or evidence of 30–45-minute pacing.

## Outcomes

| Character | Window | Turns | Outcome |
| --- | --- | --- | --- |
| Rook — Enforcer | 1440×1000 | 40 | Level 3; four enemies defeated; pump repaired and Commons chosen; learned Breach shot with the restored button; equipped earned patrol pistol; bought dermal weave for 80 credits and rested to 72 HP. Stopped alive in clinic with 2 credits. |
| Mire — Street Medic | 1280×800 | 27 | Cleared a shallow-sewer scavenger; bought lock tools; attempted the tackle-box lock; bought the one-cell telescopic kit; completed five hook-and-reel catches and Hal's mission for 60 credits. Mission persisted after reload. Stopped alive with 68 credits. |
| Vex — Glassrunner | 1024×720 | 47 | Caught stealing at kiosk; suffered brain damage from a heavy hit; healed, fled and rested. Rest retained the injury; insufficient-credit treatment charged nothing. Returned, used Mirror step and brace to beat the watch, acquired class weapon and armor, beat two more enemies, sold salvage, paid 75 credits for repair. Then deliberately challenged the high-level Crown route: ignoring a 63–65-damage heavy warning ended the run. Reload showed Run record; New patient returned to turn-zero clinic intake. |

138 recorded actions, including 93 button actions, plus intake, skill selection, timing inputs and modal interactions. No browser page exceptions in these sessions. Full per-action state/transcript recordings and screenshots are in `evidence/player-runs-buttons/`; compact durable results are in [verification/player-runs-buttons.json](verification/player-runs-buttons.json).

## Bug found and fixed

The Medic's melee weapon still had an enabled **aim** button. Clicking it correctly refused the command without spending a turn, but advertised an unavailable action. Combat buttons now match the engine's prerequisites:

- Aim requires a firearm and sufficient stamina, including the Surveyor's two-stamina discount.
- Cover requires three stamina.
- Heal requires supplies and either missing HP or active bleeding. Bleeding at full HP remains healable.
- Disabled controls explain their requirement on hover; typed commands retain their explanatory responses.

Focused production-browser tests cover these cases alongside existing shared command-path, focus, resizing, modal and medical persistence checks. Final release `6732b09` passed 154 unit tests, all 14 browser suites, build and asset audit before publication. Live verification is recorded in `verification/deployment.json`.

## Play observations

- The transcript grouping worked: current enemy art, its intent and combat controls stayed together, with the command field visible at all three tested desktop sizes. Clicking and typing mixed without losing control.
- Heavy warnings mattered. The Enforcer's brace reduced a sump heavy hit to 1 HP; the Glassrunner survived the watch with deliberate defense, but died after ignoring the Crown warning.
- The lasting injury created a concrete financial setback: the Glassrunner finished treatment with 1 credit. Three early wins plus salvage sales funded recovery. That demonstrates a viable recovery path, not that the fee is balanced for every build.
- Backpack rejection was safe: an oversized **take all** left the checkpoint loot on the ground. Individual `take armor vest` and `take salvage` worked. A clearer path to selecting a subset would improve this moment.
- Fishing produced one saint's thumb and four bottlebellies. Hook/reel, discovery art, cancel/timeout, mission progress, reward and reload worked. This sample is too small to judge fish variety or rare hostile catches; those remain covered separately by controlled regression tests.
- `buy fishing kit` did not resolve; the prompted full name `buy telescopic fishing kit` did. Add a forgiving alias in a future interaction pass.
- The courier board offered a destination and payment but no route cue. A first-time player who has never seen Freight Yard can wander toward the level-eight Crown gate while looking for it. Add a short diegetic direction or destination marker; don't expose the whole route.
- Level-eight territory can be reached very early. The warning refuge and heavy-attack text make the danger legible when inspected, but the compact arrival alone deserves a stronger danger cue before leaving the refuge.

## Remaining human checks

- Judge button density and enemy portrait size at your normal window dimensions.
- Try scroll-back during a long fight, then submit a new action; latest output should come back into view.
- Judge whether injury frequency and the treatment fee feel fair.
- Play a full city-bound run and record active time. These three sessions did **not** establish campaign completion time, endgame balance, or subjective audio quality.

Human acceptance remains pending; automated play and Will's approval are tracked separately.
