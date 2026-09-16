# Transcript category audit — 16 September 2026

## Verdict: partially distinct, not yet consistently scannable

Reviewed public Pages `a9057fc`: **89 rendered entries across seven captured views** (73 entries plus the same 16-line doctor conversation at a smaller window). Read every entry and its computed text styles; visually inspected screenshots at 1280×900 and 1024×720. Fresh clinic intake followed by isolated fixture states for jobs, room loot, combat, progression and injury. This was a presentation audit, not a natural full-run playtest. No user save touched; no browser page errors. Game presentation was not changed by this audit.

### What stands out

- Grey italic control hints are clearly distinct from green prose. The doctor offer is outside the hint and reads as speech.
- Red enemy names, blue neutral names and amber clinic names are distinct from ordinary green text.
- Grey upright ground listings are distinct from green world prose. Their typography, rather than grey hue alone, separates them from instructions.

### What does not

1. **Instruction coverage is incomplete.** The previous pass catches explicit hints and `Type …` sentences. `use breach shot`, `Attack or heal`, and `Cover or brace prevents the cut` still appear green. These are concrete misses against the requested interface/world distinction.
2. **Player commands and results are too similar in hue.** The `›` prefix and extra spacing do most of the work; pale green command text alone is a weak scan cue. Item highlighting also appears inside echoed commands, adding visual noise.
3. **Warnings and refusals blend into routine results.** Brain damage, unaffordable treatment, ordinary status and purchased equipment all share normal green text and similar weight. Readers must decode the words to establish importance.
4. **System messages are still green.** Imported-save confirmations are not world events, but currently look like them. Autosave/resume and other system notices should follow an explicit category rule.
5. **Items are only moderately distinct.** Bold brighter green helps, but item and prose colors are close in luminance. Keep the requested green and use weight consistently; do not depend on hue alone.
6. **Dialogue is recognizable by the speaker and quotation marks, not by block hierarchy.** Doctor speech is interleaved with a long price/status list. At 1024×720 the start of the conversation scrolls out before the last offer; distinct typography survives, but context is harder to scan.

### Recommended next pass

- Tag messages/segments by their actual role (world, dialogue, control hint, player command, result, warning, system) when authored. Avoid relying on the word “Type” to identify instructions.
- Finish moving all control advice to grey italic text, preferably on a separate line when it follows a result.
- Keep world/dialogue/combat green; distinguish player command echoes with a neutral near-white prompt and clearer spacing. Keep names faction-colored and item mentions green in world text.
- Give warnings/refusals a consistent short label and stronger weight; use a small amber/red label only if desired, without recoloring the whole combat log.
- Use modest spacing or a small speech indent for dialogue. Avoid more boxes and borders.
- Shorten the first doctor response: surface immediate condition and offer, with the detailed implant catalogue available through its existing command.

### Measured colors

All sampled text is readable against black; low black-background contrast is not the main problem. The problem is inconsistent meaning and similar visual emphasis.

| Category | Color | Style | Approx. contrast against black |
| --- | --- | --- | --- |
| World prose | `#a7f987` | upright | 16.54:1 |
| Instructions | `#a5aaa7` | italic | 8.91:1 |
| Ground items | `#b1b4b2` | upright | 10.04:1 |
| Player command | `#d7ffbc` | upright, `›` | 18.92:1 |
| Item mention | `#65ff72` | bold | 16.10:1 |

These measurements establish foreground/background contrast, not human recognition speed or color-vision accessibility. The scan judgments above come from screenshot inspection, not a measured human glance test.

## Line-by-line record

The doctor conversation is recorded once below; view 02 repeats it at 1024×720. Full segment-level colors and styles are in `verification/transcript-category-audit.json`. Screenshots are in `../evidence/transcript-category-audit/`. Reproduce with `node --import ./scripts/register-ts.mjs scripts/audit-transcript.mjs`.

### 01-doctor

| Line | Category | Displayed text | Review |
| --- | --- | --- | --- |
| 1 | Dialogue | `CLINIC CLERK / “Rhea. Right. Your things are by the door. Iona is waiting in Toll Square.”` | Recognizable speaker and quotation; body stays green. |
| 2 | Dialogue | `CLINIC CLERK / “Need money? Read the jobs board by the door. Paid runs, whenever you need them.”` | Recognizable speaker and quotation; body stays green. |
| 3 | Player command | `› talk doctor` | Weak contrast from results; identified mainly by › and spacing. |
| 4 | Dialogue | `Dr. Pell: “I can repair what the streets did, or make you harder to break.”` | Recognizable speaker and quotation; body stays green. |
| 5 | Status | `CONDITION / No lasting injuries.` | Correct green world/result treatment; category relies on wording. |
| 6 | Status | `IMPLANTS / None installed.` | Correct green world/result treatment; category relies on wording. |
| 7 | Instruction | `Visit a doctor for lasting conditions. Type talk doctor for prices. Rest, supplies and revival drones do not cure them.` | Clear grey italic guidance, but long; wraps at 1024px. |
| 8 | Instruction | `Type treat <condition> or treat all.` | Clear: grey and italic; no item/name color leakage. |
| 9 | Upgrade listing | `dermal weave · rank 0/3 · +12 maximum HP per rank. Next: 80 credits.` | Correct green world/result treatment; category relies on wording. |
| 10 | Instruction | `Type upgrade dermal weave.` | Clear: grey and italic; no item/name color leakage. |
| 11 | Upgrade listing | `adrenal regulator · rank 0/3 · +6 maximum stamina per rank. Next: 80 credits.` | Correct green world/result treatment; category relies on wording. |
| 12 | Instruction | `Type upgrade adrenal regulator.` | Clear: grey and italic; no item/name color leakage. |
| 13 | Upgrade listing | `targeting optic · rank 0/3 · +6 percentage points to weapon accuracy per rank. Next: 100 credits.` | Correct green world/result treatment; category relies on wording. |
| 14 | Instruction | `Type upgrade targeting optic.` | Clear: grey and italic; no item/name color leakage. |
| 15 | Dialogue + item | `Dr. Pell: “Bring me three pieces of salvage for the repair bench and I’ll fit an implant for you. No charge.”` | Good: named speaker, quotation and green item; command is outside speech. |
| 16 | Instruction | `Type accept spare parts.` | Clear: grey and italic; no item/name color leakage. |

### 03-jobs

| Line | Category | Displayed text | Review |
| --- | --- | --- | --- |
| 1 | System feedback | `IMPORTED / Valid browser save.` | MISS: technical interface feedback is green. |
| 2 | Arrival | `Reclamation Clinic.` | Correct green world/result treatment; category relies on wording. |
| 3 | Player command | `› read board` | Weak contrast from results; identified mainly by › and spacing. |
| 4 | Job status | `COURIER / 0 deliveries completed.` | Correct green world/result treatment; category relies on wording. |
| 5 | Job offer + instruction | `freight-return / Freight return to Freight Yard · 14 credits. Type accept freight-return` | Hint color works; inline placement is less scannable than a separate line. |
| 6 | World information | `Freight Yard and Reclamation Clinic offer local work. Freight Yard and Bellwether Post offer long-distance dispatches.` | Correct green world/result treatment; category relies on wording. |
| 7 | Player command | `› accept freight-return` | Weak contrast from results; identified mainly by › and spacing. |
| 8 | Job accepted | `COURIER / Carry repaired instruments to Freight Yard. Payment: 14 credits.` | Correct green world/result treatment; category relies on wording. |
| 9 | Player command | `› jobs` | Weak contrast from results; identified mainly by › and spacing. |
| 10 | Job status + instruction | `COURIER / repaired instruments for Freight Yard. 14 credits on delivery. Type deliver parcel there.` | Hint color works; inline placement is less scannable than a separate line. |

### 04-room-items

| Line | Category | Displayed text | Review |
| --- | --- | --- | --- |
| 1 | System feedback | `IMPORTED / Valid browser save.` | MISS: technical interface feedback is green. |
| 2 | Arrival | `Ration Kiosk.` | Correct green world/result treatment; category relies on wording. |
| 3 | Player command | `› look around` | Weak contrast from results; identified mainly by › and spacing. |
| 4 | Location heading | `Ration Kiosk / District 67 / level 1` | Correct green world/result treatment; category relies on wording. |
| 5 | World prose + items | `A vending machine offers nutrition, consolation, and an apology in three payment plans. Its medical drawer still works. A small placard reads: buy medical supplies (8 credits). A sealed medical kit sits on a restocking crate beside the vending machine. The attendant turns away to count ration tins; a watchman stands within shouting distance.` | Items are bold brighter green, but same hue/luminance family as surrounding prose. Placard still reads like shop command syntax. |
| 6 | Inhabitant | `Kiosk watch — calm armed human protects this refuge.` | Correct green world/result treatment; category relies on wording. |
| 7 | World information | `A calm human watch checks weapons, offers directions and enforces a ceasefire. Free rest and medical decontamination are available.` | Correct green world/result treatment; category relies on wording. |
| 8 | Ground items | `Ground: knife ×2` | Ground grey is clear; upright text distinguishes it from grey italic instructions. |
| 9 | Exits | `Ways out: south, east, west, north.` | Correct green world/result treatment; category relies on wording. |
| 10 | Player command + item | `› take knife` | Weak contrast from results; identified mainly by › and spacing. |
| 11 | Pickup result | `TAKEN / knife` | Correct green world/result treatment; category relies on wording. |

### 05-combat

| Line | Category | Displayed text | Review |
| --- | --- | --- | --- |
| 1 | System feedback | `IMPORTED / Valid browser save.` | MISS: technical interface feedback is green. |
| 2 | Arrival | `Service Tunnel.` | Correct green world/result treatment; category relies on wording. |
| 3 | Enemy arrival | `street cutthroat blocks your way.` | Correct green world/result treatment; category relies on wording. |
| 4 | Enemy intent + advice | `HEAVY STRIKE / An unguarded hit causes bleeding. Cover or brace prevents the cut. Unguarded severe hits can leave lasting injuries.` | MISS: “Cover or brace prevents the cut” remains green. |
| 5 | Player command | `› look` | Weak contrast from results; identified mainly by › and spacing. |
| 6 | Location heading | `Service Tunnel / District 67 / level 1` | Correct green world/result treatment; category relies on wording. |
| 7 | World prose + enemy | `Pipes cross the ceiling like the handwriting of a frightened engineer. A maintenance arrow points east toward the sump. A dry recess offers a moment to rest. A street cutthroat watches the passage ahead.` | Correct green world/result treatment; category relies on wording. |
| 8 | Enemy status | `street cutthroat · HP 20/20` | Correct green world/result treatment; category relies on wording. |
| 9 | Enemy intent + advice | `HEAVY STRIKE / An unguarded hit causes bleeding. Cover or brace prevents the cut. Unguarded severe hits can leave lasting injuries.` | MISS: same guidance remains green. |
| 10 | Exits | `Ways out: north, east, west, south.` | Correct green world/result treatment; category relies on wording. |
| 11 | Player command | `› brace` | Weak contrast from results; identified mainly by › and spacing. |
| 12 | Defensive effect | `BRACE / Halve incoming damage, then reduce it by 6.` | Correct green world/result treatment; category relies on wording. |
| 13 | Incoming damage | `SPIKE / street cutthroat deals 2 HP.` | Correct green world/result treatment; category relies on wording. |
| 14 | Enemy recovery + advice | `RECOVERING · no damage this response. Attack or heal.` | MISS: “Attack or heal” remains green. |
| 15 | Player command | `› heal` | Weak contrast from results; identified mainly by › and spacing. |
| 16 | Healing result | `HEAL / Patched for up to 18 HP. One supply consumed.` | Correct green world/result treatment; category relies on wording. |
| 17 | Enemy action | `RECOVER / The cutthroat retreats a pace to reset their footing.` | Correct green world/result treatment; category relies on wording. |
| 18 | Enemy intent + advice | `CUTTING STRIKE / An unguarded hit causes bleeding. Cover or brace prevents the cut.` | MISS: “Cover or brace prevents the cut” remains green. |

### 06-feedback

| Line | Category | Displayed text | Review |
| --- | --- | --- | --- |
| 1 | System feedback | `IMPORTED / Valid browser save.` | MISS: technical interface feedback is green. |
| 2 | Arrival | `Reclamation Clinic.` | Correct green world/result treatment; category relies on wording. |
| 3 | Player command | `› learn breach shot` | Weak contrast from results; identified mainly by › and spacing. |
| 4 | Learned ability + instruction | `LEARNED / Breach shot. use breach shot` | MISS: “use breach shot” remains green; does not begin with Type. |
| 5 | Player command + item | `› buy knife` | Weak contrast from results; identified mainly by › and spacing. |
| 6 | Purchase result | `BOUGHT / knife for 5 credits.` | Correct green world/result treatment; category relies on wording. |
| 7 | Player command + item | `› equip knife` | Weak contrast from results; identified mainly by › and spacing. |
| 8 | Equipment result | `EQUIPPED / knife` | Correct green world/result treatment; category relies on wording. |
| 9 | Player command | `› go up` | Weak contrast from results; identified mainly by › and spacing. |
| 10 | Refusal + instruction | `No exit that way. Type look.` | Hint is correctly styled, but failed-action message has no strong scan cue. |

### 07-injury

| Line | Category | Displayed text | Review |
| --- | --- | --- | --- |
| 1 | System feedback | `IMPORTED / Valid browser save.` | MISS: technical interface feedback is green. |
| 2 | Arrival | `Reclamation Clinic.` | Correct green world/result treatment; category relies on wording. |
| 3 | Player command | `› status` | Weak contrast from results; identified mainly by › and spacing. |
| 4 | Lasting injury status | `CONDITION / brain damage: Traumatic neural damage: −12 percentage points to weapon accuracy. Clinical repair required.` | Important condition blends with routine green status. HUD has a red label, but transcript does not emphasize severity. |
| 5 | Status | `IMPLANTS / None installed.` | Correct green world/result treatment; category relies on wording. |
| 6 | Instruction | `Visit a doctor for lasting conditions. Type talk doctor for prices. Rest, supplies and revival drones do not cure them.` | Clear: grey and italic; no item/name color leakage. |
| 7 | Player command | `› treat brain damage` | Weak contrast from results; identified mainly by › and spacing. |
| 8 | Treatment refusal + advice | `Treatment costs 75 credits. Nothing charged. You can treat one condition at a time; clinic prices are lower.` | Refusal, cost and advice all green; refusal is not obvious without reading. |
