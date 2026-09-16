# FREEBORN — scene and terminal direction

## Current playtest direction

The user approved the increased clarity and new art, then asked for more transcript space. The current candidate uses a compact room thumbnail beside the player data and a tall transcript beneath it. The frame is capped at 1440px wide and fills the viewport height; wide monitors keep quiet gutters.

Reading order:

1. Small room painting/name beside identity, red HP gauge, yellow stamina gauge, ☢ radiation count, money and lasting condition/implant labels.
2. Tall black transcript containing room inhabitants, plain grey loose items, and an illustrated current encounter with enemy intent.
3. Clickable exploration/combat actions within the transcript; panel buttons and the typed command line below. Both inputs run the same engine.

Hover or keyboard focus on the room thumbnail opens a large, uncropped preview. Leaving, blurring or Escape dismisses it; the preview never steals input focus. Clicking or typing `view` still opens the explicit artwork dialog, including on touch screens. The transcript does not resize on hover: its space is always available.

Room arrivals announce the place and any immediate threat. `look around` reveals the authored description, opportunities, warnings, and directions. The minimap remains the main navigation reference. Deep details stay out of the permanent room panel.

## Text colors

- World prose, dialogue and combat results: pale phosphor green on black, unaffected by interface palette selection.
- Control instructions: muted grey (`#a5aaa7`), italic, on the same black transcript. Keep item/name highlighting out of instructional text. Explicit interface messages use `instruction()`; appended `Type …` sentences also render as hints. Typed player command echoes keep their existing treatment.
- Characters never speak command syntax or explain keyboard controls, levels or turn counters. Put the human-facing hint outside the quotation, preferably on its own line. Doctor, mission, clerk, merchant and regional warning dialogue follow this rule.
- Item names in prose: brighter green and bold. The item catalog and authored theft-object names supply the vocabulary; names remain plain text, not links or buttons.
- Items actually on the ground: plain grey list, visible immediately and derived from current room loot. Counts greater than one are shown. Pickups update the list. `Ground:` entries in the transcript are also grey.
- Neutral character names: blue. Hostile names: red. Clinic, Commons, Union, and Syndicate affiliations retain separate colors.
- Names and items are rendered as escaped React text. Matching is case-insensitive and respects word boundaries.

The user restored clickable buttons. Both buttons and typing drive movement, conversations and combat. Hidden valuable actions stay discoverable through prose rather than prominent buttons. Inventory dragging and existing puzzle/timing controls retain their supported mouse behavior.

## Paintings and continuity

Each location receives its own complete painting. Eye-level industrial noir uses charcoal, bone, rust, steel blue, and amber lamps. Shared materials and weather connect neighboring rooms. The location's authored architecture and focal object distinguish it from its neighbors.

Actual vertical connections must be visible in the relevant scenes. Rooms with no vertical exit must not suggest a usable ladder or shaft. The sewer review caught and corrected this mismatch in several first drafts. Prominent encounter characters belong in live overlays rather than permanent scenery.

Prompts: `location-art/prompts.json`. Installed receipts: `location-art/receipts/`. Superseded receipts preserve corrected image history. `scripts/install-location-art.mjs manifest` rebuilds the runtime mapping and public provenance from installed receipts. Full completion requires all 149 room IDs, unique files and hashes, decoded media, and visual review; a partial set or biome fallback does not qualify.

Travel warms the destination and adjacent scene images. The old scene stays in place during loading, then fades out; the updated room fades in. Movement, map invocation, and imports are guarded during traversal. Reduced-motion preferences skip the animated portion.

## Verification and human review

`npm run test:scenes` exercises item colors, grey ground inventory and pickups, detail discovery, neutral/hostile names, adjacent and vertical scene travel, and desktop/mobile bounds. The existing browser suites retain coverage of clinic intake, combat, inventory, jobs, theft, timing interactions, fishing, saves, death, and revival. `scripts/review-location-art.mjs` renders labeled contact sheets of installed paintings for review.

Hands-on acceptance is still required for scene scale, reading comfort, tonal coherence between rooms, and whether the game feels like a text RPG. See `PLAYTEST-LEDGER.md`.
