# GLOWPORT ’88 — The Great City Rebuild · 0.6.0

## 1. Implemented world layout

The existing 7200×5040 seamless city now contains **415 buildings, 252 homes, 94 actual roads, 44 roads with multi-segment bends, ten cul-de-sacs, 170 vehicle-width driveways and 397 contextual street props**. Roads form one connected walking graph and one connected vehicle graph, with 434 nodes and 563 edges. The 800×450 view, twelve original story entrances, interiors and approved PNG artwork remain intact.

The old twenty-by-fifteen coordinate arrays remain compatibility anchors for original landmark placement and old mission data. They no longer generate the active streets, collision, traffic paths or maps. `city-layout.js` supplies the shared geometry, parcels, spatial indexes, route graph and collision queries; `environment-art.js` supplies the new neighborhood architecture. Regional turf, gravel and a sandy Palm South edge replace large stretches of generic blue paving.

## 2. Zoning

District-weighted parcels are sampled from actual road frontage with varied spacing and sizes; failed parcels remain open rather than becoming automatic shops. Placement rejects roads, other properties, protected entrances and incompatible access paths. Six deterministic infill passes populate connected local streets without reinstating a universal grid.

| Zone | Parcels | Share of 468 zoned parcels |
| --- | ---: | ---: |
| Houses | 252 | 53.8% |
| Commercial | 55 | 11.8% |
| Apartments / mixed use | 44 | 9.4% |
| Industrial and civic | 52 | 11.1% |
| Parks, community spaces and plazas | 53 | 11.3% |
| Preserved specialty landmarks | 12 | 2.6% |

Parking is additional supporting space. The suggested global percentages are approximate; local frontage and district character determine actual placement. Sunset has 109 homes and seven commercial buildings; Crescent has 37 homes and one commercial building. Downtown has 29 commercial buildings and fifteen apartment buildings; Eastside has 29 industrial buildings and 42 homes.

## 3. Residential architecture

**Fifteen structurally distinct designs** are implemented: cottage, two-story family, ranch, split-level, duplex, townhouses, row homes, bungalow, upscale garden house, weathered saltbox, starter, wraparound porch, attached garage, detached garage and corner-lot L house. Tests compare geometry without colors, so palette changes do not count as new designs.

Lots combine lawns, gardens, paths, mailboxes, patios, fences, trees and collision-checked driveways. Actual parked vehicle entities use eligible drives. All detached garage masses stay inside tested collision footprints; unsupported external garage drawings are omitted. The sprite cache is bounded to 128 entries and 8 MiB and releases evicted surfaces.

[View the architecture contact sheet](artifacts/environment-contact-sheet.png).

## 4. Redesigned districts

| Area | Implemented identity |
| --- | --- |
| Neon Downtown | Compact connected avenues and streets, commercial/apartment concentration, service alleys, public plazas, focused neon and the highest traffic allocation. |
| Sunset Residential | 109 homes, treeways, connected crescents, local businesses, community spaces and quieter traffic. |
| Crescent Heights | Larger landscaped lots, 37 homes, scenic loop, estate courts and the lowest traffic allocation. |
| Palm South | Bungalow streets, apartments, nostalgic coastal drive, gardens, recreation and a sandy southern margin. |
| Eastside Industrial | Freight roads, factories/loading forms, civic utilities, worker homes and garden streets, with delivery/pickup/van traffic. |
| East Diner neighborhood | A named sub-neighborhood inside the existing `east` mission district, with the preserved diner, East Diner Fuel, Magnolia Corner Store, parking and connected residential streets. The HUD and map identify it while existing mission IDs remain compatible. |

Citizen schedules use the shared graph and validated sidewalk offsets. Police cars use roads; officers and escort contacts use collision-safe walking routes. Ambient traffic uses bounded real-road district circuits with width-aware lanes, junction signals and weather/hazard responses. Cul-de-sac out-and-return paths and actual player reverse gear are tested; bespoke destination choices and reverse maneuvers for every ambient car are not claimed.

## 5. Lighting diagnosis and fix

The persistent haze came from multiple overlays: a permanent seven-percent blue host wash, an all-day ambient tint, glow effects active in daylight and a full-scene vignette. Dense overlapping sources compounded the effect, and terrain rebakes rebuilt the light index unnecessarily.

The host wash is removed. Clear morning and midday lighting now leave the scene pixels unchanged. Night ambient darkness is separate from local street, neon and vehicle lights, with short falloff. Rain uses sparse streaks and splashes; only actual `MIST` selects fog. `GlowportArt.lighting` independently configures ambient, shadows, streetlights, neon, vehicles and weather. A stable per-world spatial emitter index is independent of terrain tile eviction.

The new diagonal roads also exposed native Canvas stroke/clip differences between full and tiled surfaces. World-aligned integer raster spans now render roads, curbs, markings and wear consistently, without allocating larger terrain surfaces.

## 6. Before and after screenshots

The preserved baseline is source commit `c9b4af6`. Matching real canvas captures cover clear morning, clear midday, sunset, clear night, rain day/night, mist, downtown neon night and residential streetlight night, plus district views.

[Open the paired visual comparison](https://atlasnoah.github.io/Glowport88/rebuild/rebuild-visual-comparison.html?v=0.6.0). [Full world map](artifacts/rebuild-world-map.png). [Phone view](artifacts/rebuild-mobile-city.png).

These are actual game renders. The comparison preserves landmark camera positions, times and weather; new world content intentionally changes pixels. CPU timing and render measurements are cloud Chromium measurements, not physical-phone FPS.

## 7. Navigation and collision validation

Dedicated static validation traverses all 132 walking/vehicle landmark-pair routes, every one of the 252 home entrances to the hotel and back, all 170 driveways at vehicle radius, and cul-de-sac return routes. It checks exact endpoints, original landmark rectangles, one connected graph per travel mode, no road/building overlaps and deterministic world generation. The route cache retains fixed-node trees and chooses fresh endpoint costs, preventing stale direction choices as actors move.

The actual browser host separately traverses all 132 landmark routes through production movement/collision, samples home approaches, checks real facade blocking, GPS lines, East Diner services/parking, full-map/minimap pixels, traffic movement, finite spawns, a keyboard-driven curved road and reverse input. Authoritative exact segment collision replaces coarse ray sampling near house corners.

## 8. Gameplay and save regressions

All forty main missions, twenty side stories, thirty-two encounters, ten vehicle models, twelve cassette sites and four procedural radio stations remain. Existing East Diner E/touch acceptance, vehicle acquisition, checkpoint handoffs, food, clue radii, exit actions and combat suites are retained.

Version-five saves preserve normal browser storage keys and version-four progress. Migration repairs blocked player/car/contact positions, route checkpoints, race rivals and AI chase circuit distances while retaining stage/run/progress, choices, inventory, upgrades, health and reward receipts. The first migration backup remains intact; a separate bounded `.backup.v4-to-v5` also preserves the latest pre-rebuild bytes through subsequent autosaves. Corruption recovery, quota safety and future-version protection remain tested.

Additional actual-host regressions reproduce and verify saved chase targets without a first-frame teleport, escorts around residential corners and passengers exiting beside walls. Debug-query saves remain isolated from normal play.

## 9. Performance



| CPU measurement (ms) | Before median / p95 | After median / p95 |
| --- | ---: | ---: |
| Cold draw | 53.1 / 158.1 | 65.4 / 123.2 |
| Cached draw | 0.3 / 1.1 | 0.1 / 0.3 |
| City update | 3.3 / 11.5 | 2.0 / 4.3 |

Final measured before/after results are recorded in [rebuild-performance-comparison.json](artifacts/rebuild-performance-comparison.json). Terrain remains bounded to six 1024px tiles / 24 MiB, independently of the 8 MiB architecture cache. Homes share canonical structural stamps with integer nearest-neighbor scaling, and road raster spans are batched without changing world coordinates. Offscreen building/road queries use spatial partitions; light emitters are indexed once; hot terrain draws reuse surfaces.

The measured cold median remains 12.3ms above the old build; cold p95, cached drawing and update times improved. First-time tile generation can still produce a brief hitch, especially on slower devices.

The accelerated endurance suite runs 21,600 actual city updates over three simulated days, checks entity/heap/save bounds and collision safety, then expires all 32 event offers. These tests do not certify GPU/process memory, battery life, physical-device FPS or an uninterrupted human session.

## 10. Modified files and commits

Production changes: `Glowport88/Glowport88_ArtRehaul_v11.html`; new `assets/city-layout.js` and `assets/environment-art.js`; revised `assets/art.js`, `assets/gameplay.js`, `assets/encounter-system.js`, `assets/save-system.js` and terrain-cache documentation. Package version and release/public checks are updated.

New focused suites cover layout, architecture, lighting, model/browser migration, host audit, real world integration and paired performance captures. [Complete changed-file list](artifacts/rebuild-changed-files.txt). Existing mobile input verification now waits for measured movement with a bounded timeout rather than assuming a fixed number of animation frames during a cold render. The full source remains editable; the release also bundles all required code/images into one standalone HTML.

Baseline/rollback commit: `c9b4af6`. Source and Pages release commits and exact SHA-256 are recorded in the delivery verification below.

## 11. Known limits

Palm South’s coastal treatment consists of its drive and sandy boundary within the retained rectangular land bounds.

- Physical iPhone/Android hardware, Safari/WebKit and Firefox were not available for this release. Chromium phone emulation and trusted multi-touch were executed.
- Full campaign definition/evaluator coverage and representative actual browser objectives do not equal a continuous human playthrough of every branch or establish campaign duration.
- Most new neighborhood buildings are exterior architecture. Garden fences, hedges and small street props are decorative; building and garage masses use solid collision.
- Citizen work/home/leisure simulation remains bounded and primarily pedestrian. Full autonomous household/commuter vehicle ownership, bespoke routines for every property and new enterable civic interiors are further work.
- This is a browser development release. Native store submission and store approval are separate tasks.

## 12. Delivery verification

The complete `npm test` source suite exited 0. The final rendering optimization also passed architecture, lighting, exact tile/seam, real-world collision/navigation, paired performance and standalone release checks. The retained 131 gameplay/controller/endurance checks plus five migration, four host-audit and ten rebuilt-world checks provide 150 named host/controller checks; focused renderer/model suites are additional.

The tested standalone file embeds all code and images. Public delivery is verified by normal HTTPS, exact release SHA-256 equality, and mobile browser playback of the deployed bytes. Source/Pages commit IDs and the verified link are appended after deployment verification.
