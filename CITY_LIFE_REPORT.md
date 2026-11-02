# Glowport ’88 · City diversity and ambient navigation · 0.6.4

Baseline: the verified **0.6.3** city and corner HUD at `b334fc070b9d06a84084093834b5577ccd2d0b65`. Rollback reference: `rollback/before-city-life-0.6.3`. Work is isolated on `codex/city-life-traffic`; `main` is unchanged.

## Preserved city and gameplay

The recovered generator is retained. The world remains **7200×5040**, with the same **808 building footprints and doors, 35 roads, 66px road widths, five districts and twelve landmarks**. The original sixteen residential substitutions remain intact. No roads, lots, terrain, collision footprints or landmark positions were regenerated.

All eight PNGs, the HUD/menu markup and styles, camera scale, character/vehicle/interior rendering and lighting functions match 0.6.3. Story definitions, side quests, encounters, combat, inventory, player vehicle profiles and controls remain unchanged. Save schema **6**, map version **3** and existing storage keys are retained. Ambient graphs derive from the original grid, independently of the game's seeded content generator.

## Ambient traffic

The baseline's five independent rectangular circuits had no alternate route or stuck recovery. A reproducible parked-car obstruction stopped **all eleven downtown cars**: each moved **zero pixels over the final sixty seconds** after 300 seconds of queue settling. Ten incorrectly reported speed 1.6 while stationary. The separate unblocked thirty-minute baseline did not produce a permanent natural jam; that distinction is recorded in `artifacts/citylife-baseline-traffic.json`.

`ambient-traffic.js` indexes the existing 300 intersections and directed lanes. Vehicles choose further destinations, turn between streets and districts, reserve a junction only when its exit is clear, accelerate/brake smoothly and maintain following gaps. It honors the existing visible lights' timing. Base cruise targets increase **15%** without compounding on save reload; rain, mist, turns and hazards still reduce speed. Player handling is unchanged.

The ordinary ambient budget is **43 cars**, excluding player-owned and mission vehicles. Replenishment checks safe spacing and stays outside the camera. Parked vehicles close obstructed lane edges to new routes. Cars already trapped behind a blocker can yield, check the opposing lane and walkways, then make a smooth, collision-checked turn back to the previous junction. A blocked approach cannot hold the intersection reservation. Unrecoverable ordinary cars are reused only outside view. Inactive ordinary wrecks are cleaned up outside view. Healthy former chase cars retire only after quest protection ends, a full sixty-second contact grace period passes and they are outside view; repeated completed jobs cannot grow the parked population indefinitely. Owned, driven, story-target and encounter vehicles are protected. Visible cars wait if a recovery turn is unsafe; recovery never visibly teleports them or removes persistent vehicles. The original starter car stays in place. A stricter rolling-motion test exposed this parked starter blocking both lanes and uncovered the reservation starvation; the exact fixture is now a regression.

## Civilian roaming

`ambient-pedestrians.js` caches a graph of the existing sidewalks and painted crossings. Civilians follow schedules, turn corners, wait before entering a crossing, continue once committed, pause between trips and route around parked vehicles. Blocked or displaced walkers recover through collision-checked walking connectors. Lateral avoidance stays within the existing pavement band; a displaced walker can return to the same-side curb without crossing a street centerline. A specific walker stranded 19.8px from the curb exposed the former 18px recovery cutoff, now covered by deeper-displacement tests. Mission actors are excluded.

The existing bounded civilian pool is reused outside the camera, with quieter residential/industrial areas and more downtown activity. The cap is **170**; this seed starts **163** valid civilians. Cached path trees have a fixed **128-tree limit**, approximately 2.46 MiB of typed arrays.

Profiling also identified synchronous schedule changes: all 163 civilians rebuilt routes in a single frame, taking 69–305 ms at the measured boundaries. The host now spreads ambient routine changes over roughly three simulated seconds, with at most eight scheduled reroutes per update. Forced initialization and save loading remain immediate. All 163 residents changed routines exactly once within 3.0–3.1 simulated seconds, and an interrupted-clock test exercised the eight-change cap. Measured peak schedule routing work fell from 209/64/298 ms to 33/6/10 ms at the three tested boundaries. These are cloud measurements, not phone FPS guarantees.

The existing mobile regression also exposed a preexisting 0.6.3 click-through: the Interact release opened a dialogue under the finger, and its compatibility click selected the first new response. Response buttons now require their own pointer press for pointer clicks; native keyboard/assistive activation remains available. The story, choices, interface appearance and control scheme are unchanged. Actual touch recovery, keyboard selection and the 21-check mobile suite passed afterward.

## Neighborhood details

`neighborhood-details.js` deterministically annotates **72 existing facades in eighteen compact blocks**:

| Purpose | Facades | Details |
| --- | ---: | --- |
| Residential | 32 | 24 houses using the four approved designs, plus eight apartments |
| Industrial | 12 | Two illustrated workshop/freight silhouettes per block, local signs and equipment |
| Mixed-use | 12 | Apartments, shops and local businesses |
| Older neighborhoods | 8 | Weathered apartments, smaller businesses and decorative wear |
| Commercial | 8 | Existing neon architectural cells, office/restaurant/hotel/storefront variation |

The four reused home designs are the porch bungalow, urban duplex, Victorian townhouse and mid-century garage house. No house replaces downtown or a landmark. Selected facades stay at least 360px from landmark approaches. **136 small decorative props** fit entirely inside existing impassable footprints; they add no collision or light and cannot obstruct sidewalks, roads or doors. No new oversized lawns or empty terrain were added. Original light positions, colors, radii and powers remain identical for every building.

## Executed verification

- **14 traffic checks passed**, including thirty simulated minutes at 100ms steps, straight driving, turns, safe following, four-way junction throughput, visible-signal obedience, pedestrian yielding, offscreen recovery, inactive-wreck cleanup and repeated saved-speed restoration. The standalone module soak kept 43 cars, recorded 3.63 million pixels of travel and 4,025 turns, and attempted zero invalid road steps; all cars visited at least three districts.
- **12 pedestrian checks passed**, including thirty minutes across real original geometry: all 85 test walkers traveled over 1,000px, with 7,278 trips, 9,931 crossings, no building collisions or visible jumps. Explicit regressions cover blocked sidewalks, opposing walkers, ten formerly frozen junction positions and deeper same-side curb displacement. A separate actual-host eighteen-minute test requires every one of 163 civilians to move in every rolling 120-second window and checks the pavement band at every update; all 48 windows passed, with no building collisions, pavement departures or visible jumps.
- **Eight neighborhood checks passed**: deterministic selection, exact original geometry/properties, protected old homes and landmarks, accessible doors, contained props, two industrial silhouettes and unchanged light fields.
- **49 paired static views passed**: all thirteen established city/landmark views remain pixel-identical to 0.6.3. Thirty-six neighborhood day/night views change only inside the exact 72 reviewed facade bounds, with **zero changed pixels outside those bounds**. Original sprite/interior probes, full-map appearance and five real desktop/phone HUD viewports passed.
- The original restoration suites also passed: geometry/routes, save migration, lighting, 21 visual views and eight infill views. The older infill mask now includes only validated later facade annotations; original sixteen-home counts and all outside-bound pixels remain guarded.

- **Strict thirty-minute joint host: eight checks passed**, including every overlapping 120-second window for every ambient car and civilian. Minimum per-window travel was 2,230px per car and 818px per civilian, versus a 30px guard. Populations stayed at 43 ambient cars plus the starter and 163 civilians. It recorded 3.73 million vehicle pixels, 4,397 turns, 14,595 pedestrian trips, zero pedestrian route failures, zero invalid road steps and no visible jumps or browser errors. Protected actors, main/side/event starts, actual East Diner E entry/exit, current saves and an older ring-traffic save passed. This run precedes only the later healthy-unowned-car retirement patch; original loaded hashes are retained, with that lifecycle change verified separately.
- **All 390 authored mission stages passed** in the actual browser: 92 definitions, 176 runs, 580 objectives, 628 real projectile shots and 121 real timing inputs. All twelve entrances passed 48 keyboard/touch round trips plus twelve active-mission states; room geometry and 21 production movement configurations passed. The 48 earlier bug guards and other existing suites passed in resumed segments.

- **Final-source retirement host: five checks passed**. Three actual m12 chases finished through production tail timers and E contacts. Active targets survived, visible completed cars remained through the grace, offscreen healthy unowned cars retired, and the fleet returned to 43 ambient cars plus the starter each time. Reloaded owned/driven cars survived unchanged. This test uses the exact final traffic module, with its source hashes recorded.
- **Final-source visual and scheduling reruns passed** after the dialogue and recovery fixes: the same 49 strict comparisons and six routine-budget checks remain green.

- **Final-source three-day production endurance: five checks passed** over 21,600 actual updates and 2,160 simulated seconds. Civilian, vehicle, enemy, save and heap counts stayed bounded; all 32 encounter offers expired cleanly and save reload passed. Cloud update median/p95/p99 were 2.1/4.8/9.0 ms; maximum was 389 ms. The earlier 0.6.3 sample was 1.8/4.4/8.6 ms. These include cloud scheduling and are not physical-device FPS. Retained JS heap after explicit GC was 7.1→8.2 MB; terrain stayed at most 20 MiB.

**Standalone release passed** `npm run release` and `npm run test:release`: desktop/mobile start, rendering, touch movement, map/phone, mission entrance guidance, save/reload and isolated developer saves, with zero subresource requests. Public delivery is the remaining check.

## Files

Production: `Glowport88/Glowport88_ArtRehaul_v11.html` (ambient integration and bounded schedules), `Glowport88/assets/ambient-traffic.js`, `ambient-pedestrians.js`, `neighborhood-details.js`, and additive facade hooks in `art.js`.

Verification: `tests/ambient-traffic.cjs`, `ambient-pedestrians.cjs`, `neighborhood-details.cjs`, `citylife-preservation.cjs`, `citylife-host.cjs`, `citylife-retirement-host.cjs`, `ambient-schedules-host.cjs`, `ambient-pedestrian-recovery-host.cjs`, strictly scoped updates to `restoration-infill-visual.cjs` and gallery CSS, and public delivery assertions in `public-demo.cjs`. Package metadata/scripts, release output, README, changelog, development log, this report and evidence were updated. `TEST_RESULTS_0.6.3.md` preserves the previous release report.

## Screenshots and limits

[Before/after gallery](artifacts/citylife-visual-comparison.html) · [Residential night](artifacts/citylife-after-block-01-residential-night.png) · [Industrial night](artifacts/citylife-after-block-09-industrial-night.png) · [Phone HUD](artifacts/citylife-after-hud-phone.png).

Accelerated Chromium checks verify actual movement and production interactions; they do not establish physical-phone FPS, Safari behavior, every possible emergent traffic situation, human campaign duration or commercial-release readiness. Ambient activity has extra CPU cost; timings and bounded memory are reported without claiming identical performance. No difficulty or gameplay balance changes are intended.

## Delivery

The verified playable URL, tested source commit and release checksum will be recorded after publishing and checking the actual public bytes.
