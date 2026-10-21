# Test results · Midnight Signal milestone

## Executed and passed

`npm test` executes JavaScript syntax/asset-reference checks, mission logic tests, and **26 real Chromium browser checks** (20 smoke checks + 6 deeper gameplay checks). No browser JavaScript errors or missing game assets occurred in the final runs.

The smoke suite verifies menu/Start, rendered city pixels and unchanged world dimensions (7200×5040, 20×15 road grid), movement/camera response, map/journal/pause, simulation freeze under pause, vehicle entry/driving/braking/exit, hotel entry/exit, introductory conversation and reward, purchase through the actual shop UI, weapon equip/fire/reload, police response with fair spawn distance, save/reload, New Story, legacy-save migration, all three stages of an investigation, clinic purchase, interactive arcade lifecycle, and six room appearances. Day/night/rain screenshots are captured.

The deeper suite fires real aimed projectiles at all three practice targets, completes the two-enforcer combat encounter, follows Roxy's conversation into the radio chapter, tests a persisted delivery deadline and retry, renders the delivery map, probes menu keyboard safety, and advances traffic/NPC simulation by 30 seconds while checking finite vehicle positions and NPC/building separation. Fixture positioning is used to reach scenarios quickly; this is not an uninterrupted campaign playthrough.

Mission logic tests cover evidence order, correct-room isolation, route coordinate bounds, delayed timer activation, countdown on foot after activation, timeout/reset, successful checkpoint progression, and state retention. A separate undefined-variable audit reported zero errors. `git diff --check` passed. Frozen `npm ci` was executed successfully.

The standalone HTML was rebuilt and tested separately with all subresource requests blocked: Start, rendered pixels, save/reload, and map passed without asset requests. Direct `file://` navigation is blocked by this cloud browser's administrator policy, so the standalone was served over HTTP for this test. Opening the file directly on another machine has not been verified here.

## Evidence

- `artifacts/smoke-results.json`: named smoke outcomes from the current run.
- `artifacts/gameplay-results.json`: deeper gameplay outcomes.
- `artifacts/release-results.json`: standalone bundle check.
- `artifacts/baseline.png`: original working prototype.
- `artifacts/city-day.png`, `city-night-rain.png`: actual current city rendering.
- `artifacts/hotel.png`, `armory.png`, `arcade.png`, `clinic.png`, `club.png`, `warehouse.png`: actual room rendering.
- `artifacts/conversation.png`, `arcade-activity.png`, `delivery-map.png`: actual interaction UI.
- `artifacts/standalone.png`: actual bundled build rendering.

Day/night, dialogue, hotel, armory, nightclub, and delivery-map captures were visually inspected. Screenshots are captured from Chromium, not generated promotional images. The original illustrated asset sheets are separately documented in `Glowport88/assets/README.md`.

## Remaining validation and limitations

- The complete 21-chapter campaign has not been played end to end. Later combat chapters, every investigation variant, full driving-route navigation, all ending paths, and all side-job types need regression coverage.
- Delivery sequencing/deadlines are tested; a continuous trip across the entire city is not established by fixture-based checks.
- The arcade opens, accepts input, freezes the main simulation, exits cleanly, and applies its entry cost. Winning/high-score balance and a full 20-second session have not been browser-tested.
- Diner/motel service code is implemented but only the clinic and arcade services have browser transaction coverage.
- The 30-second simulation is not a long-duration congestion, pathfinding, performance, or memory soak test. Low-end hardware and Firefox/Safari are untested.
- Building shells repeat. Illustrated architecture/furniture and smaller drawn character sprites still need style/scale harmonization. Some prop/fence art is decorative rather than separately collidable.
- Lighting has fixture pools, bloom, rain reflections, vehicle beams, and a day/night exposure pass; it does not implement ray-traced or polygonal shadow occlusion.
- Basic NPC schedules, relationships, navigation, traffic, combat, and police systems are retained/refined rather than comprehensively rewritten. Coordinated search AI, stealth, cover, vehicle-entry animation, property ownership, clothing, and cinematic cutscenes remain future work.

These limits describe a playable development milestone, not a completed commercial release or a claim that every requested roadmap item is finished.
