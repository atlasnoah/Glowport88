# Development log

## Baseline
- Repaired missing map context/scaling, terrain baking, shared runtime state, and landmark lookup.
- Saved a full baseline archive outside the checkout at `/tmp/glowport88-baseline.tar.gz`.
- Established a self-starting Chromium regression runner. Fourteen baseline checks passed, including campaign intro, purchase/equip, UI, police response, and save/restore.
- Inspected actual baseline gameplay and the provided reference. Baseline is legible but flat, repetitive, and lacks meaningful roof/facade detail.
- Introduced a pinned development-only Playwright dependency. The delivered game itself needs only a static HTTP server.

## Atlas renderer and art foundation
- Added reproducible original PNG atlases: 13 surface materials, reusable street/interior props, 384 character poses (12 appearances × 4 directions × 8 poses), and 128 vehicle direction/colour cells.
- Added a separate art module for terrain baking, storefront composition, fixture lighting, weather reflections, sprites, and room identities. Removed the former generic building renderer and rectangular landmark light overlay.
- Preserved all city footprints, road coordinates, mission doors, campaign state, and save key.
- Fixed simulation time continuing while menus, conversations, or pause overlays are open.
- Fifteen browser smoke checks pass. Inspected actual day, night/rain, and hotel screenshots. Remaining art concerns: repetition, dark night exposure, and oversized/simple indoor furniture. Further polish is in progress.

## Investigations, activities, and visual refinement
- Integrated the first illustrated building sheet (original generated artwork with embedded provenance). Added authored character portraits and animated pose selection.
- Added evidence chains for radio/warehouse/observatory/record-shop chapters; final evidence cannot be collected before the room clues. Progress survives reload and old saves initialize missing state.
- Driving chapters now have checkpoint routes, delivery windows, and retryable timeout behavior. Deadline logic has direct tests; full driving chapters still need browser campaign coverage.
- Added clinic care, diner meals, motel rest, and a playable arcade cabinet with movement, collectible tapes, interference hazards, a deadline, and earned rewards.
- Opening dialogue records Vee trust and changes later Vee conversation text. This is a small relationship feature, not a branched campaign.
- Added loading-state protection for Start/New Story and prevented gameplay keyboard actions from firing on the main menu or under overlays.
- Expanded browser checks to 20 passing checks, including actual shop UI purchase, ammunition/reload behavior, vehicle operation, investigations, and arcade/clinic transactions.

## Final art and stability pass
- Added six unlettered neighborhood shells to reduce repeated named storefronts, plus twelve illustrated furniture props integrated in actual rooms.
- Added room collision metadata, persistent visible investigation stations, palm variants, less noisy floor materials, clearer room signage, and route markers on maps.
- Preserved the original 7200×5040 world and 20×15 road grid; browser assertions cover those dimensions.
- Added fair offscreen police spawn selection, menu keyboard guards, input reset on New Story, and save validation while preserving accumulated valid reserve ammunition.
- Added six deeper browser checks that shoot training targets, complete the two-enforcer fight, progress Roxy, validate delivery failure/retry, and simulate thirty seconds of NPC/traffic behavior. Combined suite: 26 browser checks, plus syntax/mission logic checks, passing.
- Separate undefined-variable audit: zero errors. Frozen dependency installation passed. Actual screenshots were inspected; remaining style/scale and campaign coverage gaps are recorded.
- Produced a self-contained HTML bundle and verified it with subresource requests blocked. The cloud browser disallows direct file navigation, so the bundle was tested through a temporary HTTP server. No direct-file compatibility claim is made.
- This session implements a substantial playable milestone rather than every master-directive feature. The full campaign regression, true light occlusion, richer AI/mission branching, and further art polish are explicitly deferred in ROADMAP.md.

## Delivery
- Final source regression: 20 smoke + 6 deeper browser checks passed, with mission logic/syntax checks and no browser errors. Final standalone check passed with every asset subrequest blocked.
- Release outputs: `dist/Glowport88-Midnight-Signal.html`, its SHA-256 manifest, and `artifacts/Glowport88-Midnight-Signal.zip` containing editable source, original raster assets, generation tools, tests, screenshots, and reports. The ZIP excludes dependencies and Git internals and was CRC-verified.
- Reusable cloud install/start instructions were saved to the environment configuration draft. Saving does not publish the environment or verify a fresh task restoration.
- At the earlier art milestone implementation commits were local. A later authorized delivery pushed the standalone to gh-pages; the current overhaul updates that demo after validation.


## Gameplay overhaul · 2026-10-21

- Inspected and browser-tested the prior baseline before editing. Saved /tmp/glowport-gameplay-baseline.tar.gz; retained all seven approved art hashes, the renderer, perspective, world and road grid.
- Implemented the reusable mission lifecycle, original five-act catalogue, recurring side arcs, contextual encounters, gameplay adapter, police model, phone, progression/economy and version 3 migration. Detailed content inventories are in MISSION_TRACKER.md and SIDE_STORIES.md.
- Connected actual objective actions to the existing city, combat, traffic, room interactions and rendering. Added queued/skippable dialogue, camera easing, checkpoints/retries, real item handoffs and three endings/free roam.
- Added persistent choice/relationship effects, funding versus restitution, crew protection, equipment discounts, nearby radio reactions, performance payouts, property recovery/income/storage, repairs and tuning. Kept UI services transactional and saveable.
- Browser tests caught encounter markers detached from their objectives, impossible indoor car requirements, and escort actions consuming vehicle-entry input. Corrected these and added coverage. Also preserved controlled cars, removed regenerated stored identities on load, and prevented restarting the active mission through the phone.
- Expanded regression to 43 Chromium scenarios and model/content checks. Three accelerated adapter sweeps resolve 910 objectives across 74 new definitions; the host substitutes travel/combat and the heist success boundary. This is not a timed human campaign playthrough. No duration estimate is asserted.
- Rebuilt the standalone demo, source archive and checksums after validation. See TEST_RESULTS.md for current evidence and ROADMAP.md for remaining human playtesting, balancing, performance and platform work.

## Public demo delivery

- Committed the gameplay overhaul as a6b288d and pushed its reviewable source to codex/gameplay-overhaul, leaving main untouched. Updated the authorized gh-pages demo in dd10d70.
- Verified the public HTTPS response and SHA-256 against the tested standalone. Start, phone/jobs, map and all 40/20/20 definitions passed when playing the downloaded public bytes with subresources blocked. Direct cloud Chromium HTTPS navigation is limited by a read-only proxy certificate database; no certificate verification was disabled.
- Saved updated reusable startup instructions in the cloud environment draft. The install command remains the verified frozen npm ci workflow. Draft persistence does not publish a new environment snapshot; review/save Environment settings and publish to reuse those instructions.
- Campaign duration remains unmeasured. All remaining human campaign validation and balance work is recorded in ROADMAP.md.

## Mobile browser beta · 2026-10-21

- Preserved the prior source in /tmp/glowport-before-mobile.tar.gz before edits. Added touch-controls.js and mobile.css while keeping approved art PNGs and art.js unchanged.
- Implemented independent captured thumb sticks, aggregated firing, owned-weapon cycling, driving, accessible tap actions and portrait/landscape layouts. Actual phone-emulation screenshots were inspected.
- Replaced the 36-million-pixel offscreen world surface with six bounded 1024px lazy terrain tiles. Cache tests verify coordinate seams, bounded sprite-sampling differences, eviction disposal and reuse. The observed mobile-emulation cache held 20 MiB, below its 24 MiB budget.
- Added autosave and release/pause on browser interruption, preserved exact safe room coordinates on reload, and fixed disabled touch-state transitions clearing desktop keys. Old-save fixtures are now installed on the menu so they test migration without conflicting with intentional pagehide autosave.
- Seventeen mobile browser checks pass, including native multi-touch, driving, touch conversations/heists/arcade, scrolling menus, background handling and save/reload. Full regression and release/public verification are recorded in TEST_RESULTS.md and artifacts. These are emulated devices; physical phone/Safari checks are still required.

- Final mobile milestone committed as cd64578 and published to the authorized gh-pages demo in 62c8920. All 60 source browser checks and standalone desktop/touch checks pass. Public delivery verification downloaded the live 0.4.0 release with normal TLS validation, matched SHA-256 aaa2194c107b8c8cefa19fb56956a2353d8b696c9d6e6bc9b22c8362ba2c1f71, and passed real touch movement, Start, phone jobs and map while playing those deployed bytes locally with subresources blocked. Source is pushed to codex/gameplay-overhaul; main remains untouched.

## Touch refinements · 2026-10-21

- Saved /tmp/glowport-before-touch-refinement.tar.gz before edits. Independent audit reproduced a native long-press duplicate action, loss of aim during Fire handoff, unwanted orthogonal driving drift and 900 DOM mutations over 60 unchanged controller updates.
- Reworked gesture ownership and captured release actions, continuous movement response, deliberate right-stick dragging/fire hysteresis, retained Fire aim, and combined hardware/touch/mouse input. Added active/disabled/origin feedback and supported-only fullscreen visibility. Approved artwork, renderer and missions stay unchanged.
- Seventeen isolated controller browser checks and twenty-one integrated mobile checks pass, including the reproduced bugs, capture fallback, stale gestures, native compatibility clicks, accessibility, hybrid input and short landscape. Full desktop/gameplay and packaging regression is included in the final npm test/release checks. Physical-device testing remains outstanding.

- Final touch refinement committed in 1d3cbb9 and published to gh-pages in ce4da89. All 64 integrated gameplay browser scenarios and 17 isolated controller scenarios pass; standalone desktop/mobile playback passes with all asset subrequests blocked. The first public check saw the prior cached release, so the fresh versioned URL https://atlasnoah.github.io/Glowport88/?v=0.4.1-touch was verified by normal HTTPS download, exact release hash bed6ccd2ad713612f6e2998cfaa211353a3a03624f6f458c467846962316bcf8, and mobile playback of those deployed bytes. Source remains on codex/gameplay-overhaul; main is untouched.


## Story navigation · 0.4.2

- Reproduced missing street arrows for indoor story objectives: world drawing required an outdoor marker while the maps separately projected room markers to their building entrances. 104 of 177 post-training main stages use indoor objectives.
- Separated navigation targets from semantic objective coordinates: streets guide to entrances, the correct room shows its objective, and other rooms show the lower exit. Completed operations preview the next available main story lead and explain Phone → Jobs acceptance. Checkpoint retry and ending free roam are preserved.
- Validation passed: full npm test (92 browser scenarios, model/content/art checks and accelerated campaign integration), standalone desktop/mobile playback with subresources blocked, and an explicit packaged entrance-arrow rendering regression. Navigation coverage includes all 177 post-training story stages plus real touch handoffs, next-job acceptance, retry and endings. Physical phones/Safari remain untested.
- Published tested source ccbc254 to codex/gameplay-overhaul and demo commit 3062cdc to gh-pages. Public 0.4.2 metadata and the exact standalone SHA-256 1959d065d7be8a53a8e0ff707bcfd5a3642b4913d1f36679ec8a209afab96f97 match. Certificate-verified public download plus mobile playback of those deployed bytes passes Start, touch movement, phone/jobs/map and the restored indoor-mission entrance arrow. Verified URL: https://atlasnoah.github.io/Glowport88/?v=0.4.2-navigation.


## Living City 0.5.0

- Read the full Living City brief, preserved stable 19abe84 and created codex/living-city-update. Baseline syntax/content,11 navigation browser checks and exact-byte0.4.2 public playback passed before production changes. Reproduced 10 diner/priority/radius/entry cases against a frozen baseline; evidence is in living-baseline-diner.json/png.
- Implemented shared interaction resolution, direct story acceptance, recovery, contextual encounter director and 12 additional encounter definitions; vehicle/garage, audio/city/collectible and journal/save integrations preserve approved artwork and existing mission IDs.
- Focused host tests found and fixed vehicle entry, garage API fallback, zero-health persistence/display, stale QA progression and health-regeneration assertion issues. Firefox browser installation was attempted; CDN downloads returned HTTP 403 Domain forbidden. Firefox/WebKit and real devices remain not run.
- Final source npm test exits0:131 retained/new host/controller/soak scenarios,17 mission interaction/recovery checks,14 director checks,13 vehicle/model/UI checks,13 city/audio checks, existing models/content/art and86-definition/1,013-objective integration. Three game days/21,600 actual city updates pass bounded scene cleanup, entities, terrain, retained JS heap and reload. Standalone desktop/mobile, production QA gating, debug-save isolation and backup-quota safety also pass with zero subresource requests.
- Published reviewed source f03182c to codex/living-city-update and tested demo 562549a to gh-pages. Public 0.5.0 metadata matched; certificate-verified download matched SHA256 51cd13889d9799aa229336d8f394391c9436f904dfb5c18e6d6ce4746d965dc6; playback of those exact bytes passed mobile movement, phone/map, entrance arrows,32 events/10 models/12 cassettes and actual on-foot diner mission acceptance with no errors. Verified URL: https://atlasnoah.github.io/Glowport88/?v=0.5.0-living-city. Main remains untouched.

## The Great City Rebuild · 0.6.0

- Preserved the published `c9b4af6` Living City baseline and captured matching real gameplay views and true cold/hot cache measurements before edits.
- Moved world generation into an authoritative geometry module; rendering, collision, traffic, citizens, police, objective checkpoint projection and GPS now share that street network. Legacy road arrays remain compatibility anchors for unchanged story doors.
- Added original procedural architecture and lots without changing the approved PNGs or landmark/interior rendering.
- Traced persistent haze to a host blue wash plus all-day ambient/bloom/vignette. Removed these in clear daylight, localized night sources and retained fog only for MIST.
- Browser integration revealed diagonal Canvas stroke clipping differences between full and tiled terrain. World-aligned integer span rasterization removed the mismatch without allocating larger surfaces.
- Added safe house-door approach connectors and corrected route-cache reuse for moving endpoints. Map and home-door collision checks exercise actual host geometry.
- Final test counts, screenshots, measurements and verified deployment details are recorded in CITY_REBUILD_REPORT.md and TEST_RESULTS.md.


## Original city restoration · 0.6.1 · 2026-10-27

- Followed the corrective brief by recovering the actual `c9b4af6` Living City world/renderer from Git, rather than designing another map. Preserved newer gameplay modules and selectively restored original generation, map/traffic/pedestrian rendering integration and illustrated atmosphere.
- Stage A (`0952adc`) restored all 808 buildings, 35 original streets at 66px widths, five district boundaries, twelve landmarks and original terrain/decoration/light arrays. All 21 deterministic historical views matched exact RGBA; actor/vehicle and four interior renders also matched before any new houses were added.
- Stage B (`5a2f707`) introduced four original-style illustrated residential facades across four existing blocks. Stage C (`d611976`) refined those same blocks to sixteen facade substitutions, 1.98% of original buildings. Original footprints, metadata, doors, streets, terrain and landmarks remain unchanged. Downtown is excluded; raw terrain outside facade envelopes is identical.
- Stage D (`9153604`) reduced only daylight blue wash/ambient/halo strengths, keeping original night curves, color sources, weather, sprites and shadows. Focused original-renderer night pixels and all captured city/block full-night scenes remain exact.
- Retained current mission acceptance/E/touch resolver, East Diner actions, next-story arrows, shared street GPS, events/vehicles/audio and original save key. Schema-six/map-three migration preserves v5 bytes and earlier backups, progress/receipts and vehicle state while repairing obsolete suburban positions/routes.
- Complete `npm test` passed, including 1,013 accelerated campaign objectives, all 14 East Diner browser checks, mobile/GPS/host regression, three simulated days and every restoration suite. Final strict terrain comparisons find zero changed pixels outside the sixteen actual facade draw rectangles. Standalone release build/playback also passed. Verified delivery is recorded in RESTORATION_REPORT.md and TEST_RESULTS.md. Physical devices and continuous human campaign validation remain outstanding.
- Pushed release source `4bc54f4` and published Pages `c8383a3`. Live build metadata and normal HTTPS downloads identify the restored 0.6.1 payload; its SHA-256 matches the tested standalone exactly. Downloaded-byte mobile playback and public comparison-gallery/image hashes pass. Direct external Chromium remains blocked by the cloud proxy trust setup; certificate validation was preserved.


## Mission and entrance verification · 0.6.2 · 2026-10-28

- Fixed checkpoint replay, undriven-car persistence, unsafe phone garage exits/pickups, race lifecycle/collisions, native keyboard/dialogue focus, phone/workshop refresh focus, arcade capture, sound previews, continued-save camera and in-car handoff issues. All 48 focused regressions pass.
- Actual browser host completed all 40 main, 20 side and 32 encounter definitions: 176 runs, 84 alternate/mixed paths, 580 objective resolutions and 390/390 authored stages. Used 631 real projectile shots and 121 timing inputs. QA accelerates travel/time and supplies equipment/invulnerability; production evaluation/completion handlers remain intact.
- All 12 playable entrances passed 48 keyboard/touch round trips and 12 active-mission interior states. Room audits cover 137 indoor stages, 338 standpoints and 21 walked collision configurations. No new entrance defect found; the motel garage's advertised ACTIONS alternative enters its room.
- Regression prefix, three-day soak, save migration and all 14 East Diner checks pass. All 29 static city/residential views remain byte-identical to restored 0.6.1. Final package/deployment evidence is in BUGFIX_REPORT.md. Physical devices, normal balancing and continuous human play remain outside verified scope.
- Pushed tested source `f1830cb` and published Pages `c6a4dbd`. Live 0.6.2 metadata and certificate-verified public download match the tested standalone SHA-256. Downloaded-byte mobile playback, public mission/entrance JSONs, screenshots and galleries pass. Direct public-origin cloud Chromium is environment-blocked by proxy trust; TLS validation was preserved.

## Corner HUD · 0.6.3 · 2026-10-29

- Added an interface-only corner layout following the supplied reference: minimap/health lower left, equipped weapon/ammo and cash upper right, speed lower right, compact objectives and a reserved phone objective strip.
- Kept every original inline game statement, existing JavaScript module and PNG asset byte-identical to 0.6.2. New HUD presentation reads existing status DOM text and adds no gameplay state or developer-API dependency.
- Passed 25 guards across five viewports and ten exact 800×450 before/after canvas captures. Mobile 21, smoke 20, navigation 11, all 12 entrances and host-edge eight checks pass. Corrected a visually detected narrow-screen context/health overlap with a shared prompt/ACTIONS stack.
- Screenshot, packaging and public-delivery evidence is recorded in HUD_REPORT.md. Physical devices/Safari are not covered by the Chromium checks.
