# Test results — The Great City Rebuild · 0.6.0

This report describes the rebuilt world. The previous release results remain in [TEST_RESULTS_0.5.0.md](TEST_RESULTS_0.5.0.md). The full `npm test` suite exited 0. Final renderer changes passed the focused architecture, lighting, terrain, world, performance and standalone release checks. Exact release/public verification is recorded in CITY_REBUILD_REPORT.md and its linked artifacts.

| Suite | Executed scope |
| --- | --- |
| Retained browser/controller suites | 131 gameplay, navigation, touch, mobile, East Diner, vehicle/city/encounter host and endurance checks |
| Rebuilt-world browser integration | 10 checks: all 132 landmark routes through host collision, original entrance actions, facade blocking, GPS, home approaches, 170 driveways, diner services/parking, map/minimap pixels, traffic progress, curved-road driving/reverse and terrain bounds |
| Actual browser save migration | 5 checks: v4 load, exact backup retention, blocked vehicles, authored outdoor route geometry and browser errors |
| Host audit | 4 checks: old AI chase circuit, preserved progress/rewards, escort corners and passenger dropoff safety |
| Architecture renderer | 9 focused Chromium geometry/pixel/cache/detail checks; fifteen structural variants remain distinct without colors |
| Lighting | Clear8AM/noon identity, local night falloff, sparse rain, explicit mist, stable index and exact regional/curved-road/marking tile equality |
| Static world | Connected foot/vehicle graphs, all 132 landmark routes, all 252 home-door round trips, all 170 driveways, ten cul-de-sacs, deterministic generation, protected doors and zero road/building overlaps |
| Existing models/content | Mission engine, police, progression, saves, living missions/events/vehicles/city/audio, approved PNG hashes and content graphs |
| Accelerated campaign | 86 post-training definitions, three ordered choice sweeps, 1,013 objective resolutions with deterministic travel/combat and successful heist boundary |
| Paired visual/performance evidence | Fourteen actual before/after canvas views, true cold/hot tile draws, CPU updates and bounded surfaces |

The world keeps the original twelve landmark rectangles and doors, 7200×5040 bounds, 800×450 view, 40 main missions, 20 side stories, 32 encounters and all seven approved PNGs. The former20×15 road arrays are compatibility anchors; actual road geometry, navigation, collision, GPS and maps are rebuilt.

The source suite is `npm test`. Packaging is `npm run release` followed by `npm run test:release`. Public delivery uses certificate-verified HTTPS, exact SHA-256 equality with the tested standalone file, then isolated mobile Chromium playback of the deployed bytes with subresource requests blocked. Production QA hooks are hidden; debug saves are isolated. Native file URLs and direct external Chromium HTTPS are limited by this cloud environment; TLS checks are retained.

Terrain cache surface accounting is separate from the bounded architecture sprite cache. CPU cloud measurements do not establish physical-phone FPS, GPU/process memory or battery life. Accelerated objective resolution is not a continuous human campaign playthrough; duration, every branch combination, actual iOS/Android/Safari and native store approval remain unverified.

See [CITY_REBUILD_REPORT.md](CITY_REBUILD_REPORT.md) for the complete layout/zoning, screenshots, final measured performance, executed validation, resolved failures, deployment evidence and known limits.
