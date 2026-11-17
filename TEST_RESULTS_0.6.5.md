# Test results · Faster escapes and larger minimap · 0.6.5

Passed: seven new actual-host vehicle/pursuit checks, fifteen minimap guards across five viewports, 49 preservation comparisons/five HUD layouts, thirteen vehicle-model, eleven police-model, six vehicle-host, 21 mobile and six encounter-host checks, plus syntax/asset references.

A badly damaged van actually drove 164 px/s versus a running officer’s 91 px/s without Turbo; the gap increased with keyboard and phone joystick. Brakes, reverse, steering, Turbo, disabled vehicles and damaged/upgraded save reload passed. Minimap growth is 12.9–13.9%; fixed game/map pixels, original geography/art/lighting and usable controls remain verified.

The full 390-stage audit was not repeated for this narrowly scoped adjustment. Current driving, pursuit, racing, touch and save paths were executed. Historical reports: `TEST_RESULTS_0.6.4.md`, `CITY_LIFE_REPORT.md`. No physical-phone/Safari or balance-duration claim.

See [ESCAPE_UPDATE_REPORT.md](ESCAPE_UPDATE_REPORT.md) for implementation, files, evidence and delivery status.

Standalone and public delivery passed. Certificate-verified HTTPS bytes equal the tested release; exact downloaded-byte mobile playback verifies the new speed profile and 108px phone minimap plus existing touch/HUD/map/phone/story interactions. Six public screenshot/evidence hashes match. Direct external cloud Chromium remains proxy-trust blocked without TLS bypass; scope is documented in the release report.
