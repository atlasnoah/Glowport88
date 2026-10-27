# Test results · Original city restoration · 0.6.1

The current release selectively restores the actual `c9b4af6` Living City environment while retaining current gameplay. The superseded suburban results are archived in [TEST_RESULTS_0.6.0.md](TEST_RESULTS_0.6.0.md); they are not evidence for this restored build.

## Executed focused checks

| Suite | Executed result |
| --- | --- |
| Original geometry/navigation | 8 checks pass: historical hashes, 808 buildings, 35 original roads/66px widths, connected foot/vehicle graphs, 132 landmark pair routes, 808 original building entrances and exact swept-circle corner collision |
| Limited residential selection | 7 checks pass: four initial/sixteen final facades in the same four original blocks; all original footprints, metadata, roads, terrain and protected landmarks/downtown retained |
| Save/route model migration | 7 checks pass: v5-to-v6/older backup recovery, preserved active/suspended/rival progress and receipts, actor safety, future-save and quota protection, recoverable invalid routes |
| Actual phone-sized host migration | 6 checks pass: obsolete suburban positions repaired, v5 bytes/older backups retained, car models/upgrades/damage preserved, chase resumes before first frame, 34 authored outdoor routes safe, no browser errors |
| Original atmosphere regression | Twelve clear/rain/mist day/dusk/night RGBA scene comparisons; full night exactly original, daylight scalar changes bounded in the test fixture, host wash bounds and visible cyan/pink sources checked |
| Historical visual restoration | Stage A: 21/21 static scenes exactly match original RGBA pixels; original world arrays, character/vehicle probe and four interiors exact |
| Controlled refinement visuals | Stage B/C/D retain original geometry and sprite/interior hashes. Eight matched block scenes show no raw-terrain differences outside selected facade envelopes. Stage D preserves all four city and four block full-night scenes from Stage C. No browser errors; terrain ≤24MiB |
| Gallery browser checks | Desktop 1440px/mobile 390px controls, image references and no-overflow checks pass without browser errors |

Stage A/B/C/D screenshots and JSON evidence are in `artifacts/restoration-*`. The visual galleries use the same 800×450 camera, coordinates, weather, hour and frozen clock. Static comparisons intentionally exclude moving actors/UI; actual host screenshots and original sprite probes are captured separately.

## Full release verification

**PASS:** the complete restored build's `npm test` exited 0. This includes syntax/content and mission/police/progression/save models; three accelerated campaign choice sweeps and 1,013 objectives; tiled-terrain seams; desktop gameplay; GPS; isolated touch controls; mobile play; all 14 East Diner checks; vehicle/city/encounter browser integration; three simulated days of bounded endurance; and all restoration suites. Final 21 city captures retain original geometry, sprite and interior hashes. Eight final residential day/night captures enforce the actual facade draw bounds and find zero changed raw-terrain pixels outside them. Four city and four block full-night scenes remain exact. No required check failed.

**PASS:** `npm run release` and `npm run test:release`. The bundled HTML supports desktop and mobile Start, rendering, save/reload, map, phone, touch driving/movement and story entrance guidance with zero subresource requests. Production hides QA controls; debug saves are isolated and failed New Story backup writes preserve progress. Public delivery verification is recorded in the restoration report.

The default `npm test` retains the prior browser/controller, mission/content, mobile, East Diner, encounter/vehicle/city host and endurance suites, then runs `npm run test:restoration`. The new restoration suites replace the obsolete 0.6.0 city-geometry expectations; historical rebuild tests remain available as source evidence but do not describe the current world.

Packaging commands are `npm run release` and `npm run test:release`. Public verification downloads the versioned HTTPS release with certificate validation, matches its SHA-256 to the tested standalone and plays those exact bytes in isolated mobile Chromium with subresources blocked. Production QA visibility, debug save isolation and backup-quota safety are checked by the standalone suite.

## Coverage limits

Synthetic migration fixtures and accelerated objective sweeps do not certify every historical save or a continuous human campaign. Actual iOS/Android, Safari/Firefox, every choice combination, campaign duration/balance and app-store approval remain unverified. Cloud CPU/cache and bounded-canvas measurements do not establish physical-device FPS, process/GPU memory or battery life. Direct external Chromium HTTPS and native file navigation are limited by this environment; no TLS validation is disabled.

See [RESTORATION_REPORT.md](RESTORATION_REPORT.md) for recovered files, staged changes, screenshots, preserved gameplay and the delivery record.
