# Room-by-room transcripts

On successful travel to a different room, replace the transcript with that action's arrival/result messages and scroll to the top. The command input remains focused. The departure command and previous room's dialogue/combat history are removed; keyboard command history remains available with Up/Down.

The transcript swaps with the destination scene before its fade-in. While destination art is loading, the old room and its transcript remain together. Delayed encounter artwork and viewport resizing must not pull a fresh arrival to the bottom.

- Horizontal and vertical travel, movement buttons, typed directions and successful retreats share this behavior.
- A retreat retains its own parting-hit and escape results so damage is still explained.
- Failed movement, same-room actions and combat that does not change rooms retain the current transcript.
- The next accepted command follows its new results normally. Returning to a previously visited room starts a fresh transcript.
- Immediate inhabitants, ground items and encounter art/actions remain visible within the room view. Save data and world progression are unaffected. Active courier instructions can be recalled with `jobs` or by reading a posted board.

## Verification

Pages build `0c7790f`: 163 unit tests, 17 browser suites, build, asset audit and public smoke checks passed. Live verification includes a clean Clinic Steps transcript at scroll position zero.

`npm run test:room-transcript` exercises animated and reduced-motion traversal, buttons, typing, stairs, failed exits, combat entry, retreat, revisits, input focus, keyboard history, and resizing. The scene suite additionally checks that an intentionally delayed destination image preserves the source transcript until arrival.

Screenshots and focused results: `evidence/room-transcript/`. Compact report: `design/verification/room-transcript.json`.

## Human retest — pending

Read or talk enough to fill the clinic transcript, then move south. Only Clinic Steps' arrival should remain, at the top. Try down/up, enter Scrap Alley, and flee. The retreat should explain its parting attack without retaining earlier combat history. Type `look around` to build the new room's transcript normally.

## One current occupant roster

Each room has one **Here:** roster built from its current NPC, guard, doctor and passing visitor. Named identities replace role aliases; a warden who is also the guard appears once. The active enemy uses its illustrated encounter entry, not an extra friendly/visitor label. Alarmed or defeated watch entries are not shown as friendly guards. Visitor entries are bound to their current room and disappear when the visitor leaves or becomes an encounter.

`look` / `look around` returns detail, warnings and exits; it no longer appends separate NPC, doctor, guard, enemy-stat or ground-item lists. Ground items retain their single live grey list. Authored prose, dialogue and arrival/departure events may naturally mention people; these are not additional live rosters. Repeated looks do not accumulate obsolete occupant lists.

Regression coverage: `tests/presence.test.ts` checks the clinic, all 149 room identities, warden aliases, visitors, cleared enemies and watch alarms. The room-transcript browser suite checks repeated looks, empty rooms, named residents and doctors across travel and compact layouts. The roaming suite checks the visitor entering/leaving the same roster. Human acceptance remains pending.

The visual playthrough now uses a fixed combat seed and fails immediately on death, so a random loss cannot silently redirect its scripted pump route through clinic recovery. This is test harness behavior only; production randomness and difficulty are unchanged.
