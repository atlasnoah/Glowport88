# Mobile browser testing · 0.4.2

Open https://atlasnoah.github.io/Glowport88/?v=0.4.2-navigation on your phone. No download or developer account is required. Start / Continue resumes local progress; New Story starts fresh. Both portrait and landscape keep the canvas, thumb controls and current objective accessible.

Story navigation now points to the objective building entrance from the street, then to the exact objective inside. An EXIT marker guides you out when the next objective is elsewhere. Between operations, NEXT JOB marks the next story lead; the objective panel names it and explains Phone → Jobs acceptance. Existing saves keep their progress.

## Controls

| Control | On foot | Driving |
| --- | --- | --- |
| Left stick | Move; small deflections walk more slowly | Up accelerates, down reverses, left/right steer |
| Right stick | Drag to aim; pull farther to fire. Touchdown alone does not shoot. | Not used; hold Brake to stop |
| Interact / Exit | Doors, conversations, objectives, enter vehicle | Exit after slowing down |
| Weapon | Cycle owned weapons | Disabled |
| Reload | Reload equipped weapon | Not needed |
| Crouch / Stand | Toggle stealth movement | Disabled |
| Sprint / Turbo | Hold to run | Hold for boost |
| Fire | Hold to attack in facing direction | Disabled |
| Brake | Not needed | Hold to stop |
| Expand / Shrink | Optional browser fullscreen | Optional browser fullscreen |

Tap map, story, save, phone and pause in the toolbar. Conversations, phone jobs/properties, shop purchases, heist timing and arcade controls all accept taps. Lists scroll normally; the game freezes while a modal is open. Fingers on the sticks do not scroll the page or accidentally shoot from canvas taps.

## Saving and interruptions

The existing browser storage key is preserved. Autosave runs periodically and when the page is hidden/closed; normal active play pauses when backgrounded. Returning requires Resume. Controls release on touch cancellation, lost capture, orientation changes, blur and page hiding, so leaving a finger down does not keep movement or firing stuck. In-progress lock-breach UI backs out when backgrounded; reopen it to retry. Arcade exits with its earned result.

Room identity, safe interior coordinates and crouch state now save as well as campaign/progression state. Save availability depends on browser storage. Progress is local to the browser/device, not a cross-device account. Private browsing and clearing website data can remove it.

## Implemented compatibility work

Movement has a continuous radial dead zone for fine positioning. Driving filters tiny unwanted movement on each axis. Aim direction is normalized; separate fire-on/fire-off thresholds prevent jitter. Action buttons activate once when released inside and cancel when released outside. Keyboard/assistive activation remains available.

Touch uses independent captured pointers and aggregate firing, so lifting the movement thumb does not release the aiming thumb. Holding Fire retains the last aiming direction when the aiming thumb lifts. Keyboard, mouse and touch input are combined as independent sources; releasing one cannot cancel another. A held action cannot double-activate through a delayed compatibility click. Keyboard/mouse input remains available on desktop; the disabled touch controller does not clear desktop input on scene transitions. Weapon cycling skips unowned slots, which also makes the retained pistol/fists tutorial playable by touch.

The former 7200×5040 backing canvas used about 145 MB of raw pixels and exceeded common mobile canvas size limits. The city now uses lazy 1024×1024 terrain tiles with six-slot LRU caching: at most 24 MiB of terrain pixel buffers, explicitly released on eviction. All approved PNGs, art.js, city coordinates and 800×450 camera resolution remain unchanged. The exact coordinate/seam checks pass; clipped scaled sprites have small browser raster-sampling differences documented in terrain-cache-results.json.

## Validation scope

`npm run test:mobile` executes 21 Chromium phone-emulation scenarios, including trusted multi-touch gestures, actual movement/shooting/driving, dialogue, phone scrolling, heists, arcade, background handlers and room save/reload. Actual screenshots are artifacts/mobile-portrait.png and artifacts/mobile-landscape.png. The test report records the cache budget and measured desktop-emulation bake time.

`npm run test:touch` adds 17 isolated controller regressions, including cancellation, native/compatibility click handling, hysteresis, pointer ownership, capture failure, foreground transitions, accessibility activation and removal. Unchanged controller frames produce zero presentation mutations.

The navigation suite adds 11 browser scenarios, including an actual touch investigation/handoff/completion/acceptance chain and a sweep of all 177 post-training story stages. The full npm test command also runs the existing 43 browser checks, model/content/art checks and accelerated campaign integration. Packaging checks separately verify desktop and touch play with all asset subrequests blocked. Public delivery is checked using a certificate-verified download, SHA-256 equality, and browser playback of those deployed bytes.

Physical iPhones/Android devices, iOS Safari, real browser address-bar resizing, low-memory device behavior, thermal/battery use, and prolonged mobile sessions remain unverified. Please test on your phone as development continues. This browser beta is not an App Store submission or a store-approval claim.
