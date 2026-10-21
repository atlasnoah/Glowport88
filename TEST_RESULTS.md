# Test results — Living City 0.5.0

## Executed validation

The release runs `npm test`, `npm run release`, `npm run test:release`, and `node tests/public-demo.cjs`. Named JSON reports in artifacts and the final CLI transcript record outcomes. The full source suite is rerun after the final gameplay fixes; packaged and public-byte checks run against the resulting standalone HTML.

| Suite | Checks / scope |
| --- | --- |
| Retained browser/controller suites | 92: smoke 20, combat/gameplay 6, overhaul 17, navigation 11, isolated touch 17, mobile 21 |
| East Diner | 14 actual E/menu/touch, briefing, vehicle, radius, route/reload, priority, food/exit and combat scenarios |
| Vehicle host | 6 real-game driving/disabled vehicle/garage purchase/upgrades/modal/persistence scenarios |
| City/audio host | 8 real-game cassette geometry/interaction/receipts/reload/audio-input/settings/NPC scenarios |
| Encounter host | 6 mobile repair, wallet-return, blackout, physical race/save/results, journal and error checks |
| Endurance | 5 accelerated simulation, bounded memory/entities/saves, all 32 offer expirations, reload and error checks |
| Living mission model | 17 interaction, requirement, priority, callback, retry/restart, item/reward, optional-job and failure cleanup checks |
| Encounter director | 14 catalogue compatibility, context/geometry/variety/scenes/reactions/blackout/roads/rivals/cleanup/memory checks |
| Vehicle models and workshop | 13 mixed handling/economy/persistence and mobile workshop checks |
| City/audio policies | 13 mixed geometry/receipts/behavior/traffic/audio-fallback/gesture/UI/voice-budget checks |
| Existing models/content | 16 mission-engine tests, 11 police tests, progression/income/inventory/storage, save backups/recovery, objective logic, content/prerequisites/geometry/art, terrain caching and campaign integration |

The 131 retained/new gameplay, controller and soak scenarios above are browser-host checks; the additional focused suites mix model tests with their own small browser/UI cases. This avoids counting every assertion as a separate browser playthrough.

All seven approved art PNG SHA256 values, art.js, 800×450 camera, 7200×5040 city and 20×15 road grid are preserved. Screenshots cover original city/interiors/night/rain, new diner interaction/touch, garage and radio UI.

## What the campaign coverage establishes

All 40 main and 20 side mission definitions remain. There are 32 event definitions (12 added). All 92 definitions register and pass prerequisite/stage structure checks. The navigation sweep checks all 177 post-training main objectives in world/correct-room/wrong-room coordinates.

`campaign-playthrough.cjs` resolves 86 post-training main/side/event definitions across three ordered choice sweeps and 1,013 objective resolutions. It runs the production evaluator and actions with deterministic travel/combat, and invokes the successful heist boundary. The six opening missions retain separate actual browser coverage. This proves much more than catalogue presence but is not a continuous human campaign, every branch combination, or a duration measurement.

Dedicated East Diner tests use real input to start available missions, enter/exit, read briefings, inspect clues, run m10 checkpoints/handoff, avoid encounter-stealing priority, choose side jobs/services, and shoot four m27 combat opponents. New event browser scenarios play lawful timing, complete wallet/blackout chains and physical race rival/save/result behavior. Travel positioning is explicit fixture work.

## Endurance and performance

`living-endurance-results.json` records 21,600 real city updates over three accelerated 12-minute game days, sampled weather, finite and collision-safe NPC positions, bounded counts, periodic rendering, terrain LRU limits, save payload/key bounds and retained JavaScript heap after explicit GC. It also force-tests expiration of every event offer without cash, leftover scene actors, temporary cars or mission enemies.

The exact final measured wall time, CPU-update median/p95/p99/max, retained JS heap and entity/terrain bounds are in that report. Earlier runs observed clear, mist, rain and cloudy weather, at most 162 civilians and 44 cars, with 20 MiB of terrain surfaces within the 24 MiB budget. These measurements are accelerated CPU integration measurements and exclude GPU/process memory; they do not certify physical-device FPS, battery performance or a long real-time player session.

## Packaging and delivery

The standalone checker blocks subresource requests and verifies desktop Start/render/save/map/phone/mission plus mobile layout, trusted touch/release, 60 phone jobs, entrance arrows, 32 events, 10 vehicle models, 12 cassette sites and four radio stations. It also loads the same standalone bytes under a simulated production HTTPS origin: normal play hides QA hooks; `?debug=1` uses a separate save; normal-origin progress remains unchanged. Simulated New Story backup failure preserves the old save and keeps the menu usable.

The public checker uses normal certificate-verified HTTPS download, exact SHA256 equality, and local Chromium playback of those deployed bytes with subresources blocked. It checks mobile Start/movement/phone/map, catalogue/modules, entrance guidance, actual story completion and on-foot direct diner mission acceptance. Cloud Chromium's external proxy trust database limits direct remote navigation; TLS verification is never disabled.

Deployment evidence and exact URL/checksum are in `public-demo-results.json`. The intended 0.5.0 URL is https://atlasnoah.github.io/Glowport88/?v=0.5.0-living-city; publication is claimed only after this verification succeeds.

## Failures found and resolved

- Reproduced and fixed prompt/execution disagreement, differing clue radii, encounter-stealing priority and missing direct mission acceptance.
- Restored the vehicle-entry helper removed during host refactoring; added disabled-vehicle checks.
- Fixed the garage adapter's locations API fallback and zero-health persistence/display/free resurrection.
- Fixed failed-mission actors, expired encounter scenes and expired hustle opponent cleanup.
- Corrected QA assumptions about stale future-mission fixture completion, regenerating health, moving traffic/door-wall placement, and legitimate pagehide autosave before a debug navigation.
- Updated fixed catalogue-size and original short-event assumptions to validate the expanded content.

These failures were investigated and rerun; a failed intermediate attempt is not counted as passed.

## Not run / limitations

Firefox and WebKit were requested through separate Playwright installations; both CDN workflows returned HTTP 403 Domain forbidden. Neither browser ran. No physical iPhone/Android/Safari was attached. Availability evidence is in `browser-availability.json`. Subjective listening/art review, complete human campaign and side arcs, all branch combinations, campaign duration, real-time long-session play, platform store approval and native-device certification remain unverified.

See LIVING_CITY_REPORT.md, ENCOUNTER_CATALOGUE.md and LIVING_CITY_BACKLOG.md for implemented scope and unfinished brief requirements. This is a working browser development milestone, not a certified finished 10–20-hour commercial release.

## Final executed status

Full `npm test` exited 0 after the final gameplay fixes. All 131 named host/controller/soak checks and the focused/model suites passed. The standalone test exited 0 with zero subresource requests, debug-save isolation and backup-quota safety. The CLI transcript is `artifacts/living-final-validation.txt`.

The final soak measured 51038ms wall time for 21,600 updates; update median/p95/p99 were 1.9/4.1/7.4ms. Retained JS heap was 4863236 → 5547452 bytes after explicit GC. These are cloud CPU measurements, not phone FPS.
