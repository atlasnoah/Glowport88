# Test results · Mobile browser build 0.4.2

## Executed checks

`npm ci --cache /tmp/glowport-npm-cache --no-audit --no-fund` installs the frozen lockfile successfully. `npm test` runs syntax/asset-reference validation, the retained evidence/delivery logic suite, 16 mission-engine tests, 11 police model tests, progression/economy persistence checks, catalogue/geometry/art validation, accelerated campaign integration, and **75 gameplay browser checks** (20 smoke + 6 combat/gameplay + 17 overhaul + 21 mobile + 11 navigation scenarios), plus **17 isolated touch-controller browser checks**.

The navigation suite checks street entrance arrows for indoor objectives, correct room clues, exit guidance, actual touch investigation/collection/delivery/completion, next-story preview and Phone Jobs acceptance, save/reload, route and pursuit targets, retry and ending free roam. A catalogue sweep checks all 177 post-training main stages across outdoor/correct-room/wrong-room coordinate spaces. These checks use fixture travel and do not establish a complete human playthrough.

The mobile suite uses portrait 390×844, landscape 844×390, short landscape 844×320, and small-phone 320×568 contexts with real CDP multi-touch. It covers simultaneous movement/aim/fire and independent release, cancellation, actual driving/steering/braking/exit, touch conversations, owned-weapon switching/fire/reload/crouch, native list swipes, modal time freeze, background input release/pause, a real heist timing sequence, arcade controls, exact room save/reload and desktop input compatibility. Additional checks cover long-press single activation/drag-away cancellation, hybrid hardware keys, aim-to-Fire handoff and hidden unsupported fullscreen. The isolated controller suite covers radial precision, normalized aim/fire hysteresis, independent/duplicate pointer ownership, stale capture/click events, modal and destruction cleanup, accessible activation, window motion fallback, and zero unchanged-frame DOM mutations. Actual-device and Safari validation is still outstanding.

Terrain tests cover ten exact coordinate/seam views, ten actual-art crop comparisons with documented raster-sampling tolerance, LRU budget/reuse/eviction and disposal. The game allocates 1024px terrain surfaces with a six-tile/24 MiB budget instead of one 36-million-pixel world canvas. All original art files are unchanged.

The approved hashes of all seven art PNGs and the camera/world/grid constants match their pre-overhaul baseline. The art renderer and original asset files were not regenerated.

The browser checks exercise Start, movement, driving/braking, buildings, real shop purchases, aimed training shots and combat kills, conversations, pause/modal input isolation, map/journal, services, old-save migration, actual ordered clues with reload, deadline failure/checkpoint retry, the real heist timing input, street encounter acceptance, all three final decisions/free roam, line-of-sight pursuit/search, a complete Uncle Static story with item consumption and exactly one payout, route checkpoints, passenger pickup/delivery, crouch-gated stealth, a physical traffic pursuit, and garage repair/tuning/storage/retrieval/reload. Browser scenarios use fixture positioning to avoid travel; they do not bypass their objective handlers. No critical browser errors or missing assets occurred.

`tests/campaign-playthrough.cjs` uses the production adapter and objective evaluators with a deterministic host: **74 new main/side/event definitions**, three ordered choice sweeps, and **910 objective resolutions**. It exercises every authored option across those sweeps, inventory handoffs, all three endings, performance payouts, reward receipts, optional-job suspension/resumption, garage identities, and completed-save migration. Movement and combat are substituted, and it invokes the successful heist boundary instead of playing the timing UI. This is integration coverage, not a full browser playthrough or a duration measurement. The six retained opening missions have separate smoke/combat browser coverage.

`npm run release && npm run test:release` verifies the self-contained HTML through a temporary HTTP server while blocking subresource requests. Desktop startup, rendered pixels, save/reload, map, phone, and a new campaign objective are checked, plus mobile Start/layout/real touch movement/input release/phone jobs/story entrance guidance with asset subrequests blocked. Direct file navigation remains restricted by this cloud browser policy.

## Published delivery

The mobile 0.4.2 release uses https://atlasnoah.github.io/Glowport88/?v=0.4.2-navigation. Its tested checksum is generated in dist/SHA256SUMS; public verification records the deployed checksum in artifacts/public-demo-results.json.

`node tests/public-demo.cjs` downloads the public file with normal TLS verification, checks that hash, and plays the downloaded bytes in Chromium with subresources blocked. The public check covers mobile Start, touch movement, all 40/20/20 definitions, 60 phone jobs, map, and a rendered street arrow for an indoor story objective. Direct external navigation in cloud Chromium hit its read-only NSS proxy-trust database; TLS verification was not disabled. This check verifies deployed bytes plus local playback, not direct external browser navigation.

## Evidence

- `artifacts/smoke-results.json`, `gameplay-results.json`, `overhaul-results.json`: actual named browser outcomes.
- `artifacts/campaign-playthrough-results.json`: accelerated integration scope and objective counts.
- `artifacts/navigation-results.json`, `navigation-entrance.png`: 11 navigation regressions and entrance guidance on a phone viewport.
- `artifacts/touch-controls-results.json`: 17 isolated controller regressions.
- `artifacts/mobile-results.json`, `mobile-portrait.png`, `mobile-landscape.png`: actual phone-emulation outcomes/screenshots.
- `artifacts/terrain-cache-results.json`: coordinate/art comparisons, memory bounds and disposal.
- `artifacts/release-results.json`, `standalone-mobile.png`: standalone desktop/touch checks.
- `artifacts/public-demo-results.json`, `public-demo.png`: verified public delivery and browser playback of downloaded release bytes.
- `artifacts/overhaul-phone.png`, `overhaul-heist.png`, `overhaul-ending.png`: actual new gameplay screens.
- `artifacts/city-day.png`, `city-night-rain.png`, and room captures: existing artwork in the running game.
- `GAMEPLAY_AUDIT.md`, `MISSION_TRACKER.md`, `SIDE_STORIES.md`: baseline audit and authored content inventory.

## Outstanding validation

No 10–20-hour claim is supported yet. A continuous human playthrough of all 40 main missions, full city navigation, every choice combination, every complete side arc, difficulty/economy balance, prolonged traffic/police soak tests, and Firefox/Safari and physical mobile devices remain unverified. Touch controls have emulation coverage, not real-device certification. Individual objective handlers and accelerated transitions have substantially more coverage than those complete player experiences. Existing arcade high-score balance and diner/motel service paths still need deeper testing.

The existing art, layout, light effects, basic civilian AI and traffic renderer are preserved. This does not add full tactical cover, crew-command AI, clothing, articulated vehicle-entry animation, or cinematic animation production. Heists share a timing mechanic with distinct authored preparation/escape sequences; they are not bespoke minigames for every target. NPC reactions and contact memory are lightweight persistent systems. These are concrete limits of this playable development build.
