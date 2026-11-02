# Test results · City diversity and ambient navigation · 0.6.4

The tests were executed in resumed groups. An uninterrupted final `npm test` invocation is not claimed. Test definitions and meaningful assertions were retained; new tests check the requested ambient behavior and preserved city.

| Coverage | Executed result |
| --- | --- |
| Ambient traffic | 14 checks pass, including exact starter-car pileup recovery, protected/visible vehicles, healthy post-chase retirement, signals, repeated saves and thirty simulated minutes |
| Ambient pedestrians | 12 model checks pass, including deep curb displacement, parked obstacles, crossing/peer behavior and thirty minutes of actual walking |
| Pedestrian host recovery | Eighteen simulated minutes with all 163 citizens; all 48 rolling 120-second progress windows pass; every-update pavement/collision/visible-jump checks pass |
| Routine scheduling | Six actual-host checks pass: all 163 routine changes finish within 3.0–3.1 simulated seconds; eight-change cap exercised; protected actors and initialization intact |
| Neighborhoods | Eight guards pass: 72 annotated facades, eighteen blocks, 136 contained props, original sixteen homes and all original geometry/light fields preserved |
| Visual preservation | 49 paired scenes pass: thirteen established views pixel-identical, 36 intentional block views change only inside exact facade bounds; five HUD viewports and original sprite/interior/map probes pass |
| Mission completion | All 92 primary definitions, 176 completed runs, 580 objective resolutions and 390 distinct authored stages pass through actual browser handlers, with 628 real shots and 121 timing inputs |
| Entrances/rooms | All twelve buildings, 48 keyboard/touch round trips, twelve active mission states, fresh hotel introduction, 137 interior stages and 21 movement/collider configurations pass |
| Existing bug guards | All 48 guards pass across their executed groups |
| Mobile and keyboard after dialogue correction | Mobile 21, keyboard/host edges eight and choice recovery five pass |
| Final-source retirement host | Five checks pass: three real chase/contact completions, offscreen grace, visible/mission protection, bounded fleet and reloaded owned/driven cars |
| Original restoration | Geometry, door routes, save migration, lighting, 21 historical views, eight infill views and responsive galleries pass |
| Existing models/gameplay | Syntax, content, 1,013 accelerated campaign objectives, smoke, gameplay, navigation, touch, vehicle, Living City and encounter suites pass in the recorded segments |

The strict thirty-minute joint host run also passed every overlapping 120-second progress window for **all 43 traffic cars and all 163 civilians**, while keeping populations bounded and detecting no visible teleport, invalid road movement or browser error. This run loaded the final motion/recovery code before the additional offscreen healthy-car retirement patch; that lifecycle-only change passed fourteen module guards and five final-source actual-host checks, including three real completed chases. Its original loaded hashes remain in the evidence rather than being rewritten. Final-source lifecycle and standalone checks pass; public delivery also passes: verified HTTPS bytes match the tested standalone, exact-byte mobile playback supports the new modules and existing controls/mission guidance, and seven public gallery/evidence files match local hashes. Direct cloud Chromium origin navigation remains proxy-trust blocked without a TLS bypass.

The original three-day production-update endurance test passed 21,600 updates with 163 civilians, 44 total cars, bounded saves/heap and at most 20 MiB of terrain cache. The final-source rerun passed: cloud median/p95/p99 2.1/4.8/9.0 ms, maximum 389 ms, 7.1→8.2 MB retained JS heap after GC, and at most 20 MiB terrain; no physical-device FPS claim.

Failures found and corrected: permanent starter-car traffic starvation, a pedestrian stranded beyond an 18px curb limit, synchronous whole-population schedule routing, healthy former chase-car accumulation, a preexisting mobile dialogue compatibility-click selecting a response without its own press, and responsive comparison-gallery overflow. Initial startup and meter-timing failures passed unchanged isolated reruns; a new-test browser-context mistake and an offscreen-visibility assertion were corrected in the harness. Final checks do not count those failed attempts as passes.

The historical `test:hud` suite freezes the complete 0.6.3 game payload for its interface-only release. The current preservation suite checks unchanged HUD markup/styles and five actual layouts while permitting authorized ambient code and facade annotations.

See [CITY_LIFE_REPORT.md](CITY_LIFE_REPORT.md) and `artifacts/citylife-regression-execution.json` for detailed evidence and scope. Chromium emulation and accelerated fixtures do not certify physical iPhone/Android performance, Safari, balance, every emergent traffic arrangement or a continuous human campaign playthrough. Previous reports remain in `TEST_RESULTS_0.6.3.md` and `TEST_RESULTS_0.6.2.md`.
