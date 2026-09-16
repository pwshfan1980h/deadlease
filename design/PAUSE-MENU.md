# FREEBORN — Escape menu

## Player behavior

Press **Escape** in the world to pause. Your command draft remains intact. Use arrows and Enter to choose an option, or Tab / Shift+Tab to move between controls. Escape goes back from a submenu, cancels a confirmation, or resumes from the main pause menu.

- **Resume:** return to the same room and command draft.
- **Settings:** master/effects/ambience/music volume, mute, text size, palette, and atmospheric motion. Preferences persist automatically and still respect system reduced motion.
- **Controls:** concise reference for movement, exploration, combat, packing, and keyboard controls.
- **Save & load:** manual save, confirmed loading of manual/autosave, JSON export, and validated import. Import explicitly replaces the manual slot and loads the selected character. Invalid files retain the current game. Incomplete clinic intake/recovery cannot be saved or exported from this menu.
- **Credits:** music/sound credits and a link to the full asset attribution file.
- **Return to title:** a confirmation defaults to staying. Continue is available on the title. An autosave-blocked warning directs players to export before leaving.

An already-open inventory, map, art, ending, or clinic dialog owns Escape; closing it does not also open pause. Existing reference panels close first. Native selects may use Escape to close their own dropdown first. Pause does not interrupt the short traversal transition or character finalization. The typed `pause` command also opens this menu; the existing typed `menu` command still returns to title.

## Technical behavior

`src/PauseMenu.tsx` owns presentation, subpages, safe-default confirmations, and keyboard focus containment. `src/pause.css` styles the menu in the existing charcoal/bone/amber palette. `src/App.tsx` owns the pause flag and existing game/storage/audio operations.

The immediate pause ref rejects world commands and map opening and prevents the roaming timer from advancing. The timer remains allocated, so the visitor's existing timing is preserved instead of reset or caught up after pause. Existing pending autosaves may finish. Pausing does not alter serialized gameplay state or consume a turn.

Opening pause closes active audio and cancels scheduled combat cues; resume requests ambience and the current encounter's music without replaying old attack sounds. Motion feedback is disabled while paused. Settings remain editable in silence. Save failures remain visible in the menu. Storage validation, quarantine, and conflict handling continue to use the existing repository; the typed settings panel retains advanced recovery controls.

This is a UI/lifecycle change, with no save schema migration or change to death rules. Planned permadeath and the revival drone remain separate tasks. The tutorial remains last.

## Verification

`npm run test:pause` uses isolated browser storage and a production preview on port 4196. It covers:

- Draft preservation, no turn/save changes on pause, arrows/Enter, nested Escape, focus containment.
- Existing overlay precedence, settings persistence across reload, title/Continue.
- Manual save, export, load confirmation/cancellation, invalid and valid import.
- Three simulated minutes paused in combat, five while exploring, with no gameplay/transcript changes; no additional audio playback while paused.
- Incomplete clinic intake cannot overwrite a finalized character through menu save/export.
- Screenshots and sizing checks at 3440×1440, 1280×800, and 390×844.

Evidence: `../evidence/pause-menu/verification.json` and screenshots in that directory. Audio checks measure playback calls, not a listening review. Simulated pause duration is not evidence of human run length. The pause suite is part of `npm run test:all`.

Manual route: Continue → type half a command → Esc → Settings → adjust volume → Esc → Esc → finish the command. Open the map and inventory and verify one Escape closes each. In an encounter, pause and resume without advancing the enemy. Save, move rooms, then load the manual save. Export a backup before experimenting with import or advanced recovery.
