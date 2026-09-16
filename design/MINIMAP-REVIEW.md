# Minimap rendering review — 16 September 2026

## Reproduced problems and corrections

- **Huge gold blocks after keyboard input.** The generic `:focus-visible` HTML outline was applied to SVG room groups. Its pixel lengths became map units, producing an enormous rectangle when zoomed. Map locations now use a small, non-scaling SVG focus ring.
- **Sewers lost in empty space.** Both floors used the tall surface-world frame. Each floor now has stable bounds derived from all its rooms, with padding. Movement and discovery do not change those bounds.
- **Unreadable labels and weak player marker.** Room labels now render at 12 screen pixels, regional names at 10, and the player ring at least 16 pixels across, independent of zoom/window dimensions. Selected labels stay inside the frame, with conflicting region headings suppressed.
- **Decoration competed with actual passages.** Reduced building/water contrast, strengthened continuous route lines, and removed the decorative sewer pipes that could look like additional passages. Dim dots indicate unsurveyed positions while Fog is off; their names and encounters remain hidden.
- **Player marker intercepted room inspection.** The overlay no longer intercepts pointer events. Clicking the current room inspects it normally.
- **Inspection shifted the map slightly.** Reserved space for room details and ladder exits keeps the drawing viewport stable.
- **Local view on the wrong floor.** Floor changes return to the full-floor view. Local zoom centers the inspected room; without a valid inspected/current location on that floor, it stays unavailable. Off-floor selection details and player marker stay hidden.

The room graph was checked against every drawn route and ladder. No missing passage was found. No geography, travel rule, encounter, or save schema was changed.

## Verification

Release gate passed: 163 unit tests, 16 browser suites, production build and asset audit. Published Pages `9e8ea44`; live JS/CSS hashes and public smoke checks passed; compact results are in `verification/minimap.json` and `verification/full-verification.json`.

`tests/map-layout.test.ts` checks padded floor bounds, fixed overview framing, local-room centering, every passage exactly once, and aligned ladder endpoints.

`npm run test:minimap` checks an isolated browser/save:

- 1440×900, 1280×800, 1024×720, 3440×1440 and 390×844 framing and readable label/marker dimensions.
- Surface/sewer, local/world, fog and label shortcuts; focus restoration and unchanged save data.
- Inspection of all 149 room markers, correct selected labels, no clipped labels and no moving viewport.
- Non-scaling focus ring after mixing clicks and keyboard shortcuts.

Existing inventory/map checks still cover Tab toggle, fresh position on reopening, blocked travel/time, automatic floor selection, combat exclusion and modal bounds. Screenshots and the compact map report are produced under `evidence/minimap-review/`.

## Human retest — pending

1. Open Tab at the clinic, click its marker, then press L and W. No gold block should obscure the map.
2. Walk south, down, and open Tab. The sewer network should fill the available space; your marker should be on Steps Undercroft.
3. Inspect another known room. Its name should remain legible and the overview should stay still. L zooms into the inspected location.
4. Escape should restore command input. Inspecting a map location must never move the character.

The surface geography is tall, so its full overview still has side gutters. Local zoom provides close inspection without stretching or distorting the world. Automated verification is separate from human visual approval.
