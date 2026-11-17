# Pursuit, driving, combat and mission moments · 0.6.6

The baseline is the verified 0.6.5 source at `01887e7c81ea32a9eac3f1019d5e3a810c836144`. The update builds on the existing city and gameplay. It does not generate a replacement map.

## Changes

Patrol vehicles stay in their cars during a driving pursuit and follow the original road graph with lane offsets, conservative body clearance, turning slowdown and bounded route retries. Parked obstructions can trigger alternate routes. Pedestrians receive stopping clearance. A stopped patrol can dismount near a suspect on foot; a disabled patrol can safely dismount even if the player remains in a car. A regression found by the full mission audit is also fixed: an on-foot officer at a direct last-known target no longer tries to advance a missing vehicle route. Patrol speed is capped at 144; the slowest working player vehicle retains its prior minimum of approximately 164. Roadblocks use observed heading or last-known position, remain outside the camera, avoid landmarks/current objectives and occupied positions, and retain the existing spawn/expiry limits. Police awareness, reporting, search duration and foot speed remain unchanged. An integration bug found in save testing is fixed: loading now synchronizes world wanted level from the imported police state, so a saved chase/search is not silently cleared on its first tick. The HUD now reports SPOTTED, SEARCHING with a countdown/progress bar, and a brief confirmed ESCAPED state.

Driving adds gear/load/model-sensitive procedural engine sound, braking/steering tire sound, up to 80 tire-mark segments in two wheel trails that expire after six simulation seconds, and small brake/reverse light overlays. The four original radio stations, volume controls, gesture unlock, mute and pause behavior remain. No vehicle sprites or handling profiles were replaced.

Combat adds distinct firearm/melee sounds, short muzzle flashes and weapon tracers, confirmed-hit sparks/markers/damage text, and health bars based on actual enemy maximum health. Effects are capped at 96 particles and 24 flashes. Feedback cannot inflict damage or advance objectives. Enemies may use nearby original building corners, wait briefly, peek and re-engage; invalid/stuck/expired plans are abandoned. Protected, scripted, passive and escort actors are excluded. Original weapon damage, cooldowns, spread and ammunition remain unchanged.

Eight main missions (`m08`, `m12`, `m16`, `m20`, `m24`, `m28`, `m31`, `m40`) have additional authored briefings, nonblocking mid-operation radio and aftermaths. The crew decision, race result, Vee decisions and all three endings receive appropriate reactions. Radio stays available in Phone messages. Existing durable receipts prevent repeated messages or payments after reload/checkpoint retry. Earlier completed saves do not receive a batch of historical messages.

## Preservation and visual evidence

The new preservation suite compares against the actual archived 0.6.5 baseline at fixed camera coordinates, times and weather. All 15 city views, four interiors, character/vehicle sprite probes and full-map render matched exactly. All 808 building footprints/doors, 35 roads, 12 landmarks, original PNGs, lighting/art sources, 92 mission definitions with stages/rewards/choices, player/base vehicle profiles and schema-six/map-three saves remain intact. Five actual HUD viewports retain the larger minimap and accessible controls, including active pursuit status.

Before/after examples:

| Scene | Before | After |
| --- | --- | --- |
| Downtown at night | [0.6.5](artifacts/gamefeel-before-downtown-night.png) | [0.6.6](artifacts/gamefeel-after-downtown-night.png) |
| East Diner | [0.6.5](artifacts/gamefeel-before-diner-night.png) | [0.6.6](artifacts/gamefeel-after-diner-night.png) |
| Residential street | [0.6.5](artifacts/gamefeel-before-residential-night.png) | [0.6.6](artifacts/gamefeel-after-residential-night.png) |

Runtime examples: [phone HUD](artifacts/gamefeel-hud-phone.png), [short landscape HUD](artifacts/gamefeel-hud-short-landscape.png), [braking](artifacts/gamefeel-runtime-braking.png), [confirmed hit](artifacts/combat-feel-host-pistol.png), [mission aftermath](artifacts/mission-moments-phone.png).

## Validation and delivery

The dedicated feature coverage passes **71** checks. Patrol coverage is 12 model plus 9 actual-host checks; driving is 11 model/audio plus 5 actual-host; combat is 7 model plus 7 actual-host; mission moments are 9 model plus 5 actual-host; the pursuit HUD has 6 checks. Fixed visual comparisons and five HUD viewports also pass.

The current full actual-host audit completed 92 mission definitions and 390 authored stages through 176 completed runs / 580 objective resolutions, with 628 real projectile shots and 121 timing inputs. All 12 playable entrances passed 48 free-roam round trips plus 12 active mission states. Existing mobile, diner, save/migration, vehicle, encounter, audio, UI/arcade, restoration, three-day endurance and full citylife checks passed. The final escape-speed/minimap suite and syntax checks passed.

The initial full command failed on the direct-target officer crash described above; after its fix, the complete mission audit passed on rerun. A concurrent retry also hit a startup timeout; the final run was sequential. Details and fixture limits are in [TEST_RESULTS.md](TEST_RESULTS.md) and [gamefeel-suite-results.json](artifacts/gamefeel-suite-results.json).

The standalone build passes desktop and emulated phone playback with every subresource request blocked, including normal/debug save isolation and new-module checks. Its source archive passed CRC validation. The release is published at [Play Glowport ’88](https://atlasnoah.github.io/Glowport88/?v=0.6.6-feel). Tap **Start / Continue** to resume the existing browser save.

Implementation source: `51ec20a3dd2da3a6b8d53321a6b022df3888a077` on `codex/chases-driving-combat-missions`. The game payload was published by Pages commit `7ecdc8b`. Standalone/public SHA-256: `d5ea9e9fc060b4d2b4245f5839623883092ae889421d06dcac253de2785c82ab`. The source branch is pushed; `main` was not merged.

Certificate-verified HTTPS download matches the tested standalone exactly. Isolated emulated-phone playback of those exact deployed bytes passed Start, touch movement, HUD/new-module checks, phone/jobs, full map, indoor story entrance guidance and direct East Diner story acceptance, with no critical browser errors. Six published screenshot/evidence hashes match. Direct cloud Chromium origin navigation remains blocked by `ERR_CERT_AUTHORITY_INVALID`; no TLS bypass was used. This is a cloud proxy/trust limitation, and direct-origin Chromium playback is not claimed.

[Before/after gallery](https://atlasnoah.github.io/Glowport88/game-feel/gamefeel-comparison.html) · [public-byte results](artifacts/public-demo-results.json) · [direct cloud browser probe](artifacts/gamefeel-direct-browser-results.json) · [published evidence hashes](artifacts/gamefeel-public-proof-results.json).

Browser checks use Chromium, including touch emulation. Travel/equipment/invulnerability fixtures and controlled time accelerate mission tests; they do not certify difficulty or a continuous human campaign playthrough. Actual iPhone/Android hardware, Safari, subjective handling balance and game duration remain unverified. Patrol vehicle-to-officer transitions retain the existing presentation; a dismounted car snapshot is not added as a decorative nonphysical vehicle. No commercial-release or app-store approval claim is made.
