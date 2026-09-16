# FREEBORN — scene and terminal direction

## Current playtest direction

The user rejected the previous text-heavy, low-contrast presentation. This pass is a candidate for hands-on review, not a claim that the visual direction is approved.

The game uses a centered frame near 4:3, capped at 1440×1080. It scales to the available desktop height. Wide monitors keep dark gutters rather than stretching the transcript across the screen. On narrow screens the same stack flows vertically. The complete 16:9 location painting remains visible without cropping.

Reading order:

1. Large room painting, room name, immediate inhabitants, threats, and loose items.
2. Compact player identity and resource strip.
3. Black transcript, command input, and typed command references.

Room arrivals announce the place and any immediate threat. `look around` reveals the authored description, opportunities, warnings, and directions. The minimap remains the main navigation reference. Deep details stay out of the permanent room panel.

## Text colors

- Transcript prose: pale phosphor green on black, unaffected by interface palette selection.
- Item names in prose: brighter green and bold. The item catalog and authored theft-object names supply the vocabulary; names remain plain text, not links or buttons.
- Items actually on the ground: plain grey list, visible immediately and derived from current room loot. Counts greater than one are shown. Pickups update the list. `Ground:` entries in the transcript are also grey.
- Neutral character names: blue. Hostile names: red. Clinic, Commons, Union, and Syndicate affiliations retain separate colors.
- Names and items are rendered as escaped React text. Matching is case-insensitive and respects word boundaries.

The pointer is visible as a fallback. Typing still drives movement, conversations, and combat. Inventory dragging and existing puzzle/timing controls retain their supported mouse behavior.

## Paintings and continuity

Each location receives its own complete painting. Eye-level industrial noir uses charcoal, bone, rust, steel blue, and amber lamps. Shared materials and weather connect neighboring rooms. The location's authored architecture and focal object distinguish it from its neighbors.

Actual vertical connections must be visible in the relevant scenes. Rooms with no vertical exit must not suggest a usable ladder or shaft. The sewer review caught and corrected this mismatch in several first drafts. Prominent encounter characters belong in live overlays rather than permanent scenery.

Prompts: `location-art/prompts.json`. Installed receipts: `location-art/receipts/`. Superseded receipts preserve corrected image history. `scripts/install-location-art.mjs manifest` rebuilds the runtime mapping and public provenance from installed receipts. Full completion requires all 149 room IDs, unique files and hashes, decoded media, and visual review; a partial set or biome fallback does not qualify.

Travel warms the destination and adjacent scene images. The old scene stays in place during loading, then fades out; the updated room fades in. Movement, map invocation, and imports are guarded during traversal. Reduced-motion preferences skip the animated portion.

## Verification and human review

`npm run test:scenes` exercises item colors, grey ground inventory and pickups, detail discovery, neutral/hostile names, adjacent and vertical scene travel, and desktop/mobile bounds. The existing browser suites retain coverage of clinic intake, combat, inventory, jobs, theft, timing interactions, fishing, saves, death, and revival. `scripts/review-location-art.mjs` renders labeled contact sheets of installed paintings for review.

Hands-on acceptance is still required for scene scale, reading comfort, tonal coherence between rooms, and whether the game feels like a text RPG. See `PLAYTEST-LEDGER.md`.
