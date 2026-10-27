# Glowport ’88 · Original city restoration · 0.6.1

This corrective release restores the actual pre-suburban Glowport environment. It keeps the current gameplay improvements and makes limited facade substitutions inside the original city. The 0.6.0 Great City Rebuild is superseded.

## Recovered version and files

The environmental baseline is **`c9b4af6`**, the verified Living City 0.5.0 source immediately before the major suburban overhaul. Git history identifies `53e7a66` as that later overhaul. The recovered baseline was checked out separately for browser comparisons; the current project was not reset wholesale.

Recovered from the original implementation:

- `Glowport88/Glowport88_ArtRehaul_v11.html`: original districts, world generation, road placement, building generation/density, twelve landmarks, terrain decorations, trees, streetlights, maps, street signals and original traffic/pedestrian spawning.
- `Glowport88/assets/art.js`: original terrain/building/interior/sprite rendering, illustrated facades, neon palette and atmosphere. Its Stage A SHA-256 was `fd658afd96c0a5488a7ce844dfe18ef280cbe8d711e8a692b9c45cd8ec1d1b47`. Later edits are limited to the selected illustrated residential substitutions and daylight scalars described below.
- All seven approved original PNGs remain unchanged. `tests/fixtures/original-neon-art.js` retains the immutable original renderer for focused regression comparisons.

The world is again **7200×5040**, with the original **800×450 camera**, **808 buildings**, **20 vertical and 15 horizontal streets**, **66px street widths**, five original district boundaries and all twelve landmark positions/doors. Original building rectangles, roof/name/kind metadata, spacing, sidewalks, parks, trees, debris and lamps match the historical source. No new streets, cul-de-sacs or large residential lawns were added. The former 0.6.0 procedural world and environment renderers are no longer loaded.

`assets/restored-city.js` indexes this recovered geometry for current shared navigation and collision. It does not generate a substitute map.

## Controlled stages

| Stage | Change and verified evidence |
| --- | --- |
| A · Restore | Commit `0952adc`. Recovered original environment first. **21/21** fixed-camera, fixed-hour/weather browser views matched historical RGBA pixels exactly. Original world-array hashes, actors/vehicles and four interior renders also matched. |
| B · Limited diversity | Commit `5a2f707`. Added one illustrated facade in each of four existing blocks. All original geometry stayed unchanged. Raw-terrain differences remained within selected facade envelopes. |
| C · Neighborhood refinement | Commit `d611976`. Expanded those same four blocks to four facade substitutions each: **16/808 buildings (1.98%)**, four of 266 original blocks. Raw terrain outside selected facade envelopes remained identical. |
| D · Lighting | Commit `9153604`. Restored original lighting first, then made the small daylight-only refinements below. All four full-night city comparisons and four neighborhood night comparisons remained unchanged from the pre-refinement stage. |
| E · Regression/release | Complete `npm test` passed with exit code 0, including the final 21 city views and eight residential day/night views. Final raw-terrain differences outside the exact facade draw rectangles are zero. Packaging and public delivery are recorded below. |

[City comparison gallery](artifacts/restoration-visual-comparison.html) · [Residential comparison gallery](artifacts/restoration-infill-comparison.html)

These galleries let reviewers select the historical original and each subsequent stage at the same camera, resolution, hour, weather and frozen clock. The city set covers all twelve landmarks, downtown day/night, residential day/night, intersections, rain, mist and dawn/sunset. Separate captures include East Diner, Marina Clinic, Violet Hotel, four interiors, the world map, characters and vehicles. Static pixel comparisons omit transient actors/UI; actual host screenshots and sprite probes are separate evidence.

| Reference | Original screenshot | Restored screenshot |
| --- | --- | --- |
| Downtown neon | [Original](artifacts/restoration-original-downtown-neon-night.png) | [Verified final](artifacts/restoration-final-downtown-neon-night.png) |
| East Diner | [Original](artifacts/restoration-original-diner-day.png) | [Verified final](artifacts/restoration-final-diner-day.png) |
| Sunset residential block | [Original night](artifacts/restoration-infill-original-west-3-7-night.png) | [Verified limited additions](artifacts/restoration-infill-final-west-3-7-night.png) |
| Superseded suburban result | [0.6.0 Crescent Heights](artifacts/rebuild-after-crescent-day.png) | [Recovered original Crescent Heights](artifacts/restoration-stage-d-crescent-day.png) |

## Residential designs

The new transparent illustrated atlas, `assets/residential-illustrated.png`, follows the original blue/purple pixel-art buildings, roof detail, amber windows and cyan/pink accents. It adds four structural designs: **porch bungalow, urban duplex, Victorian townhouse, mid-century garage house**. This is the deliberately small initial selection, not the proposed eventual 10–15-design catalogue.

Only facade artwork changes. Each selected building retains its exact original footprint, door, kind, roof metadata and position. `assets/residential-infill.js` adds one bounded metadata field to select a sprite; it does not create properties, grass or roads. The four chosen original blocks are in Sunset District, Crescent Heights, Palm South and Eastside. Downtown, all landmark buildings and their approaches are excluded; selected sites are at least 320px from landmark doors. Each region gets four closely placed facades within its existing city block. Eastside retains the rest of its original industrial streets and businesses.

Artwork provenance, crop cells and SHA-256 are recorded in `assets/residential-illustrated.json`. The new atlas SHA-256 is `15fe7966f78c070dee7506086006cfd27eb72bd5a76c7a1f68615170ce43aae5`.

## Lighting refinement

The original lighting was restored and visually verified before adjustment. The remaining clarity issue was the blue host wash combined with fixed daylight ambient/halo overlays. Three strengths now taper slightly with the original day/night curve:

| Component | Original daylight | Refined daylight | Full night |
| --- | --- | --- | --- |
| Host blue wash | 0.070 | 0.045 | Original 0.070 |
| Ambient base | 0.070 | 0.040 | Original curve unchanged |
| Halo strength | 0.230 | 0.190 | Original curve unchanged |

Neon cores, source colors, light radii, source positions, vignette, shadows, rain/mist and vehicle lights remain original. Focused Chromium RGBA comparisons of the original and refined atmosphere at 23:00 in CLEAR, RAIN and MIST have **zero differing channels**. Actual city and residential full-night scene hashes also stay identical to Stage C. Daylight and dusk differ intentionally and are captured for review; no uniform brightness increase or green/gray palette replacement was introduced.

## Gameplay and saved progress

Current mission/gameplay, encounter, vehicle, city/audio, phone, police, progression, touch and interaction systems remain in place. The release retains 40 main missions, 20 side stories, 32 encounter types, ten vehicle handling profiles, twelve cassette stories and four original radio stations. Mission acceptance and the shared E/touch action resolver, East Diner alternatives, next-story arrows, street-following GPS, safe passenger exits, contact-follow routes and vehicle restoration fixes remain.

Saves use the same normal browser key with **schema 6 / map version 3**. Migration retains mission/stage/run/checkpoint progress, elapsed time, inventory, choices, claimed rewards, receipts, car models/upgrades/damage and completed content. Obsolete suburban positions and paths are projected onto safe original streets. The v5 source bytes receive a durable `.backup.v5-to-v6`; existing v4-to-v5 and first-migration backups are retained. If a required backup cannot be written, the old primary save is not overwritten. Debug saves remain isolated. Saves remain local to their browser/device/origin.

Actual phone-sized Chromium migration checks loaded synthetic v5 saves using former curved-road coordinates. They verified safe player/car placement and all preserved progress, a restored chase target moving only 1.168px on its first physics frame, all 34 authored outdoor driving/racing/stealth route definitions and zero missing-asset/script errors.

## Executed validation

Focused results already executed successfully:

- **8 restored-city geometry/navigation checks:** authentic original hashes, one connected foot/vehicle network, all 132 landmark pair routes, all 808 original building-door accesses, original collision boundaries, legal corner clearance, moving-route endpoint projections and original street widths.
- **7 controlled-infill checks:** initial four/refined sixteen selection, unchanged original building properties/terrain/roads, protected landmarks/downtown, deterministic bounded selection, reversibility and selected entrance access.
- **7 migration model checks** and **6 actual-host migration checks:** v5/older backup retention and recovery, active/suspended/rival routes, choices/inventory/receipts, actor/vehicle preservation, future-save guards, quota failures and recoverable route failure.
- **Lighting comparisons:** twelve day/dusk/night clear/rain/mist scenes plus host wash bounds and visible cyan/pink sources; full-night original renderer identity.
- **Staged browser visuals:** Stage A 21 exact historical scenes; Stage B/C/D 21 matched city views plus eight block day/night views, unchanged original geometry and bounded terrain caches, with no browser errors. Stage D preserves the four full-night city scenes and four block night scenes exactly.
- **Comparison gallery:** real desktop 1440px and mobile 390px browser layout/navigation checks; image references present and no horizontal overflow or browser errors.

The complete `npm test` run passed: syntax/content checks, mission/police/progression/save models, accelerated campaign integration (86 definitions, three choice sweeps, 1,013 objectives), tiled-terrain seams, actual gameplay, GPS, touch controls, mobile play, all 14 East Diner checks, vehicle/city/encounter host checks, endurance and every restoration suite. Final captures retain every original geometry hash, original character/vehicle sprites and four interiors. All four full-night city views and four residential block night views remain exact; daylight and selected facades differ intentionally. The stricter final terrain comparison uses the renderer's actual `x-3, y-3, w+6, h+20` facade rectangles and finds **zero changed pixels outside them**. No required check failed.

The accelerated endurance run completed three simulated days / 21,600 updates with finite positions, no civilian centers in buildings, bounded entities/saves/terrain and no critical browser errors. Update CPU time measured median 1.7ms / p95 3.3ms. These are cloud simulation samples, not device FPS.

| Matched terrain sampling | Original c9b4af6 | Final restoration |
| --- | --- | --- |
| Cold view median / p95 | 70.8 / 104.2ms | 46.3 / 87.8ms |
| Cached view median / p95 | 0.0 / 0.1ms | 0.0 / 0.1ms |
| Peak terrain surfaces | 24MiB | 24MiB |

These measurements cover the same nine view positions and 20 cached draws each; they are individual cloud runs, not a claim of a general speed increase. `npm run release` and `npm run test:release` also passed: the self-contained HTML starts, renders, saves/reloads and supports desktop/mobile controls with zero subresource requests. Production hides QA commands, isolates debug saves and preserves progress if a New Story backup hits storage quota. Source commands and machine-readable results are retained in [TEST_RESULTS.md](TEST_RESULTS.md) and `artifacts/`.

## Performance and remaining limits

Terrain retains six lazily baked 1024px tiles and a 24MiB surface budget. Original-versus-restored cold/hot measurements use the same fixed camera locations, recorded in the corresponding visual result JSONs. These are cloud Chromium CPU/cache measurements; they do not establish physical-phone FPS, GPU/process memory or battery life.

Physical iPhone/Android, Safari and Firefox checks remain unexecuted. A continuous human campaign playthrough, every branch combination and balance/duration certification remain outstanding. Automated accelerated mission sweeps and host interaction checks do not replace that playthrough. This is a playable development build, not a finished store-approved commercial release.

## Playable delivery

**Published and verified:** [Play Glowport ’88 · restored original city](https://atlasnoah.github.io/Glowport88/?v=0.6.1-original-city). Use **Start / Continue** to resume existing progress.

- Tested release source: [`4bc54f4f79fc49318985fde045e49d9e73153e71`](https://github.com/atlasnoah/Glowport88/commit/4bc54f4f79fc49318985fde045e49d9e73153e71), pushed on `codex/restore-original-city`; `main` remains unchanged. Subsequent report/evidence commits do not change the game payload.
- Pages deployment: [`c8383a38f8f2b86117003022b71823bd6810c3d3`](https://github.com/atlasnoah/Glowport88/commit/c8383a38f8f2b86117003022b71823bd6810c3d3). The live `build.json` identifies 0.6.1, original commit `c9b4af6`, 808 buildings, 35 roads, sixteen residential facades, schema 6 and map 3.
- Exact standalone/public SHA-256: `eeed920efb719c230c267ee279e6a097dcf51d28faeddd2f03e3f27da7dedae8`.
- **PASS** `node tests/public-demo.cjs`: normal certificate-verified HTTPS download matched the tested standalone byte for byte. Playback of those exact downloaded bytes in isolated 390×844 mobile Chromium passed Start, touch movement, phone/jobs, map, story entrance guidance and direct East Diner mission acceptance. Content remains 40 main / 20 side / 32 encounter types, ten vehicle models and twelve placed cassettes; no script errors.
- **PASS** both [public city comparisons](https://atlasnoah.github.io/Glowport88/restoration/restoration-visual-comparison.html) and [public residential comparisons](https://atlasnoah.github.io/Glowport88/restoration/restoration-infill-comparison.html), plus six representative original/final PNG downloads, match tested local hashes. Local gallery browsers verified 184 PNG references, eighteen stage selections and 58 scene jumps across desktop/phone layouts, with no overflow or browser errors.

The separate direct external Chromium probe is **environment-blocked** by `ERR_CERT_AUTHORITY_INVALID` in the cloud proxy trust setup. TLS checks were not disabled. The verified-HTTPS-download/exact-byte-playback checks above passed; direct public-origin Chromium navigation and physical handheld testing are not claimed. Evidence is in `artifacts/public-demo-results.json`, `restoration-public-build.json`, `restoration-public-gallery-results.json` and `restoration-public-direct-browser.json`.
