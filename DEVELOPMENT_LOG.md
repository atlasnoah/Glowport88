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
