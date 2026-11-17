# Test results · Pursuit, driving, combat and mission moments · 0.6.6

The current dedicated feature coverage passes **71 checks**: patrol 12 model / 9 actual-host, pursuit HUD 6, driving 11 model/audio / 5 actual-host, combat 7 model / 7 actual-host, narrative 9 model / 5 actual-host. The initial feature suite also passed the exact preservation comparison; the nine-check pursuit host was rerun after the final route fix.

The complete actual-host mission audit passed **92 definitions / 390 authored stages**, across 176 completed runs and 580 objective resolutions, using 628 real projectile shots and 121 real timing inputs. Every existing playable entrance passed 48 free-roam round trips plus 12 active mission states. Fixtures accelerate travel, provide equipment/invulnerability and control time; mission evaluators and normal input/projectile/timing handlers remain production code.

All 15 fixed city views, four interiors, character/vehicle probes and full map match 0.6.5 exactly. Five actual HUD viewports retain the larger minimap and accessible controls. Existing core, restoration, migration, mobile, East Diner, vehicle, encounter, UI/arcade, audio and save regressions passed before the full chain reached its discovered mission bug. The complete citylife suite passed, including 49 environmental comparisons and 30 simulated minutes in the actual host; the existing three-day / 2160-second endurance test also passed. The final escape suite passed 7 vehicle/input/save checks and 15 minimap guards. Final syntax/asset references passed.

The initial `npm test` run **failed** at an event escape stage because a nearby foot officer advanced a nonexistent route. This was fixed, a focused regression was added, and the entire actual-host mission audit passed on rerun. Search save testing also found and fixed imported wanted state being cleared on reload. One concurrent audit retry timed out during startup; the final audit ran sequentially and passed. No failed test was relabeled as a pass.

Standalone desktop/emulated-phone checks, new-module loading, save isolation and zero-subresource playback passed. Source archive CRC passed. Public-byte delivery verification is pending. See [GAME_FEEL_REPORT.md](GAME_FEEL_REPORT.md) and [machine-readable coverage](artifacts/gamefeel-suite-results.json). Historical reports remain in `TEST_RESULTS_0.6.5.md` and earlier versioned files.

Phone checks use Chromium emulation. Physical iPhone/Android hardware, Safari, subjective balance and uninterrupted human campaign duration remain unverified.
