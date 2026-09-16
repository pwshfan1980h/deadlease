# FINAL-001 fix

Added a string-type guard for `player.className` in `src/saves.ts` before `createPlayer` performs class lookup. Regression tests use the reported level-3 Enforcer with `className: ['Enforcer']`: decode must reject it, and imports into both auto and manual slots must reject it while preserving exact prior bytes and leaving backups unchanged.

Actual validation commands, run from `browser/` in this order:

| Stage | Command | Result |
| --- | --- | --- |
| RED, tests added before source fix | `npm test -- --no-cache tests/saves.test.ts -t FINAL-001` | Exit 1; 3 failed, 13 skipped. Decode accepted the array; both imports resolved, replaced prior slot bytes, and created backups. |
| GREEN, after string guard | `npm test -- --no-cache tests/saves.test.ts -t FINAL-001` | Exit 0; 3 passed, 13 skipped. |
| Full browser unit suite | `npm test -- --no-cache` | Exit 0; 14 files, 54 tests passed, including both starter-tone tests. |
| TypeScript | `./node_modules/.bin/tsc --noEmit --incremental false` | Exit 0; no diagnostics. |

File-hash comparison confirmed only `src/saves.ts` and `tests/saves.test.ts` changed before adding this report. Existing user/Hermes files, including `tests/starter-tone.test.ts` and `FINAL_REVIEW.json`, were preserved. No commit or browser launch; no other application changes.
