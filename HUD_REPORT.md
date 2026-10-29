# Glowport ’88 · Corner HUD · 0.6.3

This is an interface-only update based on the supplied GTA-style layout reference.

- Bottom left: visible minimap, north indicator, clock/weather, health bar and district name.
- Top right: current weapon silhouette/name, loaded and reserve ammunition, money and wanted indicators. Fists/bat display melee status instead of invented ammunition.
- Bottom right: existing driving speed in MPH; on-foot status otherwise.
- Top left on desktop: compact current objective. On phones, full objective/retry text moves to a reserved strip below the canvas, clear of the minimap and weapon display.
- Context prompts and ACTIONS stack together between the corner readouts; existing touch pads/bank and menus remain available.

The presentation mirrors existing status text using `assets/hud.js`; it never reads developer-only APIs or writes game state. `assets/hud.css` supplies the new layout. Host HTML changes are limited to markup and stylesheet/script links. All pre-existing JavaScript modules, the complete inline game script and every PNG remain byte-identical to **`4313c45` (verified 0.6.2)**. No world, road, building, character, lighting, mission, dialogue, economy, combat, save or control behavior was changed. The new vector weapon silhouettes are HUD graphics only.

## Executed checks

| Check | Result |
| --- | --- |
| New HUD suite | 25 guards pass at 1440×1000, 390×844, 844×390, 844×320 and 320×568 |
| Exact game-canvas comparison | All ten matched 800×450 scenes are byte-identical before/after at fixed camera/time/weather; original PNG and JavaScript hashes match |
| Live status | All five weapon silhouettes/names, firearm/melee ammo modes, actual health values/width and MPH readouts update correctly |
| Placement/input | Minimap/health, weapon/speed, context prompts, ACTIONS and full objectives fit; no corner-label overlaps; real touch movement/release, map, phone and 44px retry controls pass |
| Existing mobile suite | 21 browser checks pass, including driving, multi-touch, rotation, heist, arcade and save/reload |
| Existing smoke/navigation | 20 smoke and 11 navigation checks pass |
| Existing entrance suite | All 12 buildings: 48 keyboard/touch round trips, 12 active-mission interior states and fresh hotel introduction pass |
| Existing host-edge suite | Eight keyboard/dialogue/window-focus, save/camera and in-car handoff checks pass |
| Syntax and asset references | Pass |

The first five-viewport run encountered a transient short-landscape Start-click timeout; focused and final full reruns passed. Visual inspection also caught a narrow-screen prompt overlapping a health label; the final context stack and explicit overlap tests cover that correction. No old assertion was removed to obtain these results.

This UI pass did not rerun all 390 mission stages. Their previously verified game code remains byte-identical; the relevant entrance, navigation and real interaction suites were rerun. Chromium touch emulation is verified; physical phones and Safari/Firefox are not claimed.

`npm run release` and `npm run test:release` also passed. The standalone HTML renders the HUD and supports desktop/mobile controls, map/phone, story entrance guidance, save/reload and isolated debug saves with zero subresource requests.

## Screenshots and reproduction

[Desktop before](artifacts/hud-before-desktop.png) · [Desktop after](artifacts/hud-after-desktop.png) · [Phone after](artifacts/hud-after-phone.png) · [Short landscape](artifacts/hud-after-short-landscape.png)

Run `npm run test:hud` for the scoped UI baseline/placement checks. It reads committed original hashes and reference captures in `artifacts/hud-before-results.json`; the normal after run does not require a temporary historical checkout. Original-reference regeneration is documented in the test source. Machine evidence is in `artifacts/hud-after-results.json`.

## Delivery

**Published and verified:** [Play the updated HUD](https://atlasnoah.github.io/Glowport88/?v=0.6.3-hud). Choose **Start / Continue** to resume existing progress.

- Tested source: [`5340c4c41b230eadb55fdffde6a24da1e2bf455f`](https://github.com/atlasnoah/Glowport88/commit/5340c4c41b230eadb55fdffde6a24da1e2bf455f), pushed on `codex/gta-style-hud`; `main` remains unchanged. Later report/evidence commits do not change the game payload.
- Pages deployment: [`5cd4cfc3247662442cd792b5f3f457e0bed16373`](https://github.com/atlasnoah/Glowport88/commit/5cd4cfc3247662442cd792b5f3f457e0bed16373).
- Standalone/live SHA-256: `fd1065d3144672eeb6111e863f0e57f61890d5f3c689c7b2684af20aadb8361d`.
- **PASS** `node tests/public-demo.cjs`: certificate-verified HTTPS download matches the tested standalone. Isolated playback of those public bytes passes visible minimap/health, equipped-weapon mirroring/presenter readiness, touch movement, Start, phone/map, story guidance and East Diner acceptance without script errors.
- **PASS** public HUD evidence JSON and desktop/portrait/short-landscape/before screenshots match local hashes through normal HTTPS. [Desktop preview](https://atlasnoah.github.io/Glowport88/hud/hud-after-desktop.png) · [Phone preview](https://atlasnoah.github.io/Glowport88/hud/hud-after-phone.png).

The separate direct public-origin cloud Chromium probe is environment-blocked by `ERR_CERT_AUTHORITY_INVALID` in its proxy trust setup. No TLS validation was bypassed. Verified HTTPS downloads and playback of those exact bytes passed; direct external Chromium navigation and physical-device testing are not claimed. Delivery evidence is in `artifacts/public-demo-results.json`, `hud-public-build.json`, `hud-public-evidence-results.json` and `hud-public-direct-browser.json`.
