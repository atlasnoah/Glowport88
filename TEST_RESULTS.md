# Test results · Mission and entrance verification · 0.6.2

The bug pass preserves the restored original city. Earlier restoration results are retained in [TEST_RESULTS_0.6.1.md](TEST_RESULTS_0.6.1.md).

| Executed validation | Result |
| --- | --- |
| Complete regression prefix (`npm test`, before adding the four playability suites to its final command) | Exit 0: model/content checks, 1,013 accelerated campaign objectives, terrain seams, desktop/GPS/touch/mobile play, all 14 East Diner checks, vehicle/city/encounter integration, three simulated days, restoration visuals and all 48 new bug regressions |
| `node tests/all-missions-host.cjs` | 92 primary definitions: 40 main, 20 side and 32 events; 176 completed runs with 84 alternate/mixed paths and 580 objective resolutions; explicit 390/390 authored-stage coverage; 631 real shots and 121 timing inputs; no errors/failures |
| `node tests/all-entrances-host.cjs` | All 12 playable interiors: 48 keyboard/touch street-entry, room-walk and exit round trips, 12 active-mission states and fresh hotel introduction; no errors |
| `node tests/mission-geometry-audit.cjs` | All 92 definitions/390 stages, 137 indoor stages/21 room configurations and all authored outdoor target doors accessible |
| `node tests/room-reachability.cjs` | 338 objective/exit standpoint checks; 21 collision configurations walked over 3,225 production movement frames; no invalid room keys or blocked targets |
| Eight focused bug suites | 48 checks pass: checkpoint replay/save, vehicles/garages, phone/workshop focus, races and all 32 event scenes, sound preview, keyboard/camera/handoff, arcade/pointer release |
| Visual preservation | All 21 city and eight residential static PNGs byte-identical to verified 0.6.1; original geometry, art and lighting modules unchanged |

The final default `npm test` now also includes `npm run test:playability`, which chains the four new suites above. Each new suite executed separately against the same frozen production code; an unexecuted invocation is not counted as an additional pass. Build, standalone playback and public delivery are recorded in [BUGFIX_REPORT.md](BUGFIX_REPORT.md).

The mission runner uses production E/ACTIONS/phone acceptance, projectile damage and timing controls. QA accelerates travel/time and supplies equipment/invulnerability. No evaluator, enemy health, completion method or success flag is replaced. This verifies finishability and authored branch access, not normal difficulty, every choice combination, physical phones or campaign duration. Mobile checks use Chromium touch emulation. Public delivery retains certificate-verified HTTPS and exact-byte browser playback.

Initial fixed-time movement/fire assertions were unreliable under concurrent browser load. Focused reruns passed; bounded waits now observe the advertised interaction/ammunition change while retaining action and release assertions. Harness setup errors involving door argument shadowing and an indoor delivery's required parked car were corrected without changing production rules.

**Release/delivery PASS:** `npm run release`, `npm run test:release` and `node tests/public-demo.cjs`. The public payload matches the tested SHA-256 and supports isolated mobile playback without script errors. Production QA visibility, debug-save isolation and New Story backup-quota safety pass. Published mission/entrance evidence, screenshots and comparison galleries also match local hashes over certificate-verified HTTPS. Direct public-origin cloud Chromium remains environment-blocked by its proxy trust setup; verification was not bypassed. Full source/Pages commits and checksum are in the bugfix report.
