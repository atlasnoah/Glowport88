# Faster escapes and a slightly larger minimap · 0.6.5

Baseline: verified 0.6.4 (`dfad716`). This is a narrow player-driving and HUD-size adjustment. The city, artwork, lighting, story, mission coordinates, ambient navigation and police settings are retained.

## Changes

- Player-controlled forward top speeds increase **25%**, and forward acceleration increases **20%**. The existing vehicle models keep their differences, upgrades and Turbo. Working damaged vehicles keep at least **75%** of their new forward top speed; destroyed vehicles remain disabled. Reverse speed/acceleration, steering and braking retain their previous values. The workshop directory displays the corresponding new player speed/acceleration.
- `GlowportVehicles.playerProfile()` keeps this adjustment separate from the existing AI/race profiles.
- The existing minimap is about **13% larger**: its phone container grows 96→108 px, short-landscape 78→88 px, desktop maximum 210→236 px. Its logical 220×150 map, 800×450 game canvas, visual style and content are preserved. Shared layout reservations grow with it so prompts and controls remain clear.

Production files: `Glowport88/Glowport88_ArtRehaul_v11.html`, `Glowport88/assets/vehicle-system.js`, `Glowport88/assets/hud.css`. Test/package/documentation and release evidence accompany the change.

## Executed verification

| Check | Result |
| --- | --- |
| New actual-host escape suite | **7 passed**: all ten models at 1/50/100% condition, keyboard/phone driving, real foot-police pursuit, brakes/reverse/steering/Turbo, disabled cars and save/reload |
| Actual pursuit | A 1%-health van reached 164.12 px/s; the real officer moved at 91 px/s. Gap grew 100→355 px over four seconds without Turbo, identically with W and the phone joystick |
| New minimap suite | **15 guards passed** across 1440×1000, 390×844, 844×390, 844×320 and 320×568; displayed growth 12.9–13.9%, exact fixed-world/minimap pixels, no overlaps or overflow, usable prompts/map/phone/touch controls |
| City/art preservation | **49 comparisons and five HUD viewports passed**; unchanged geography, PNGs, lights, sprites, interiors and full-map content. Source guards allow only the explicit player-profile addition, matching directory numbers and minimap-width constants |
| Existing relevant regressions | Vehicle model 13, police model 11, actual vehicle host 6, mobile 21 and encounter host 6 passed, including real race/save behavior |
| Syntax and asset references | Passed |

The older full 390-stage mission audit remains documented in `CITY_LIFE_REPORT.md`; it was not repeated for this small adjustment. Current relevant driving, pursuit, touch, racing and save paths were executed. These are Chromium desktop/touch-emulation checks, not physical-phone or Safari certification.

Matched screenshots: [phone before](minimap-size-before-phone.png) · [phone after](minimap-size-after-phone.png). Detailed evidence: `artifacts/escape-speed-host-results.json`, `minimap-size-results.json` and the refreshed preservation/relevant-regression reports. `npm run test:escape` runs both new suites. The earlier source-preservation test now retains byte-for-byte guards for all unrelated vehicle/style code while permitting these specifically authorized changes.

## Delivery

**Published and verified:** [Play 0.6.5](https://atlasnoah.github.io/Glowport88/?v=0.6.5-escape). Choose **Start / Continue**; existing vehicle condition and upgrades are retained.

- Tested source: [`8f47fe888d31c492c511533593370daced53578e`](https://github.com/atlasnoah/Glowport88/commit/8f47fe888d31c492c511533593370daced53578e), pushed on `codex/faster-escape-minimap`; `main` is unchanged. Later evidence/report commits do not change the game payload.
- Game deployment: [`eeccd586e5ddd2722ac86f0098c104ca371046c9`](https://github.com/atlasnoah/Glowport88/commit/eeccd586e5ddd2722ac86f0098c104ca371046c9).
- Standalone/live SHA-256: `5dcb08dd1375dd182a7e8e62884871b32b6db4abc70f45a13eb2521d030ffa3b`.
- Standalone checks pass desktop/mobile rendering, controls, menus, mission guidance, save reload and production/debug save isolation, with zero subresource requests.
- `node tests/public-demo.cjs` passes: certificate-verified HTTPS bytes match the tested standalone. Playback of those exact public bytes verifies the faster player profile, damaged-vehicle minimum, enlarged phone minimap, HUD, touch movement, phone/map, story entrance guidance and East Diner acceptance, without script errors. Six public screenshot/evidence files match local hashes.

[Phone before](https://atlasnoah.github.io/Glowport88/escape-update/minimap-size-before-phone.png) · [Phone after](https://atlasnoah.github.io/Glowport88/escape-update/minimap-size-after-phone.png).

Direct public-origin cloud Chromium navigation remains blocked by proxy certificate trust (`ERR_CERT_AUTHORITY_INVALID`); no TLS bypass was used. Normal verified HTTPS downloads and exact downloaded-byte playback passed. Physical-phone/Safari testing is not claimed. Delivery evidence is in `artifacts/public-demo-results.json`, `escape-public-build.json`, `escape-public-evidence-results.json`, `escape-public-direct-browser.json` and `escape-public-delivery-results.json`.
