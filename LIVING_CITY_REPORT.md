# GLOWPORT ’88 — Living City 0.5.0

## 1. East Diner repair

The reproduced problem was a mismatch between prompts and execution. Vehicle acquisition, route and combat stages advertised an E objective while the adapter returned false, allowing the host to enter a nearby building. An encounter offer ran before a tracked handoff, and investigation prompts used 85px while inspection required 54px. Reproduction evidence against preserved commit 19abe84 is in artifacts/living-baseline-diner.json and its screenshot.

The host now resolves one ordered list for both prompts and E/touch execution. Tracked objectives outrank unrelated encounters; required working cars receive priority while obtaining a vehicle; exits remain accessible. ACTIONS lists overlapping doors, service counters, jobs and civilians. Explanations and selection labels use the same activation radii as execution. Standard E can select these actions; Shift+E is retained only as an optional legacy shortcut.

An available story marker offers START on foot or in a car, presents the real mission introduction, and leaves vehicle acquisition/checkpoints/handoffs as separate requirements. East Span Run is current mission `m10`; False Flag is `m27`. The old chapter names remain in retained tutorial/migration code. No driving stage is silently completed by E.

Changed interfaces: host resolvedInteractions/action/updateHud, new interactions.js, and gameplay.interactions/_interactStage. The diner suite uses actual E, menu, touch, timing-independent dialogue and aimed weapon input, with fixture travel. It covers on-foot/car acceptance, valid/invalid radius, multiple approaches, clue radius, route progress and reload, stopped handoff with overlapping encounter, deliberate door/side-job access, food, exit and actual False Flag combat.

## 2. Mission audit

Forty existing main missions and 20 connected side missions are retained; no new main or side-contact campaign missions are claimed. Twelve events are added to the prior 20. Content checks validate all 92 registered definitions and preserve all approved PNG hashes plus camera/world/grid constants. All 177 post-training main stages retain navigation coordinate checks.

The accelerated campaign harness resolves 86 post-training main/side/event definitions over three choice sweeps. It uses actual objective evaluation but deterministic travel/combat and a successful heist boundary. Browser suites separately play representative investigation, heist, chase, driving, combat, rescue, decision and new encounter paths. This distinction matters: the whole campaign is not certified by a continuous human playthrough.

Checkpoint and operation restart preserve run/reward receipts; restarting after a recorded story decision is restricted to checkpoint recovery. Optional jobs can be put aside and resumed without a fresh payout ledger. Missing contacts, chase targets, mission packages and damaged objective data yield a failed checkpoint with an explicit recovery reason instead of forced completion. Failed objectives clear their temporary actors; expired offers clear their street scenes in the same update. Older malformed known missions retain identity and a retry path.

## 3. Random-event expansion

See ENCOUNTER_CATALOGUE.md for every ID, actual objective chain, choices and consequences. The 32 definitions include all 20 requested categories: stranded driver, robbery, suspicious parcel, race, missing person, police pursuit, accident, scam, blackout, wallet, mysterious passenger, performer, undercover officer, stolen vehicle, nightclub incident, transmission, shopkeeper, false accusation and wrong delivery.

The new director validates spawn geometry, adds visible original-sprite participants, bounded accident/breakdown/theft vehicles, context/cooldown/variety selection, persistent outcome memory, local blackout repair, accident traffic hazards, and two physical race rivals with saved progress and finish bonuses. Existing actor/dialogue/mission handlers remain authoritative. Some retained incidents are short; this is a substantial working expansion, not a claim of bespoke simulation for every event.

## 4. Implemented gameplay

- Unified E/touch interaction resolution and accessible ACTIONS alternatives; direct story-marker acceptance.
- East Diner staff conversation, food, notice-board access and stock-run encounter with an earned 20% food discount.
- Ten retro handling profiles, nine purchasable models and a police profile; actual acceleration/steering/braking/protection differences, disabled vehicles, paid repair, garage purchase/storage/retrieval, engine/handling/durability upgrades, seven paint finishes and trim. The approved original sprites are reused.
- Citizen behavior states with danger/return/shelter/rerouting effects, slower traffic in rain/mist, yielding to crossing pedestrians/pursuit/accident hazards, and bounded police roadblock cleanup.
- Twelve hidden original cassette collectibles with receipts, lore, reputation and a one-time completed archive award.
- Four original synthesized radio stations, effects, independent music/effects levels, mute, gesture-based unlock, pause/background handling and bounded voices. No external copyrighted recordings are used.
- Journal sections for main story, side missions, encounters, completions, cassettes and statistics.
- Version 4 local-save backups before migration, corruption recovery, future-version protection, backup before explicit New Story, and separate debug-query saves. Browser-local save key is retained for normal play.

## 5. Testing and limits

Repeatable commands: npm test; npm run test:diner; npm run test:living; npm run release; npm run test:release; node tests/public-demo.cjs. Executed results and exact suite counts are recorded in TEST_RESULTS.md and named artifacts JSON reports. The public verifier retains normal HTTPS certificate validation, checks the standalone SHA256 and plays exactly those downloaded bytes locally with subresources blocked.

Focused tests caught and fixed a removed vehicle-entry helper, garage host API mismatch, zero-health display/resurrection, old hardcoded catalogue counts, stale QA fixture progression and normal health-regeneration timing assumptions. These were fixed and rechecked; unexecuted browsers are not counted as passes.

Three accelerated game days use 21,600 actual city updates with periodic drawing and forced-GC heap samples. The report records CPU-update percentiles, retained JS heap and entity/terrain bounds. These measurements exclude GPU/process memory and do not establish physical-phone FPS. Full human playthrough, real hardware/Safari, broad branch combinations and subjective audio/art quality remain outstanding.

## 6. Repository and persistence

Development branch: codex/living-city-update, from stable 19abe84. Main is preserved. Significant modules: interactions.js, encounter-system.js, vehicle-system.js, living-city.js, city-audio.js, save-system.js; integration remains in the existing HTML/gameplay/mission-engine/phone/progression/side-content files. New focused model, host, diner, save and endurance tests accompany the systems. Normal saves retain the existing storage key and existing mission/event IDs; separate backups preserve pre-migration and explicit-new-story data.

## 7. Playable build

Verified release URL: https://atlasnoah.github.io/Glowport88/?v=0.5.0-living-city. The public 0.5.0 metadata, normal HTTPS download, exact standalone checksum and mobile playback with direct diner mission acceptance all passed. Evidence: artifacts/public-demo-results.json. Use Start / Continue for current progress. ACTIONS chooses local work/services; Palm Garage sells/customizes vehicles; SOUND controls radio/audio.

## 8. Remaining work

LIVING_CITY_BACKLOG.md separates unfinished brief requirements from implemented features. Campaign duration, full physical-device validation, deeper bespoke activities, broader NPC/faction simulation, wardrobe/stamina/health progression, native store packaging and submission remain future work.

## Release checkpoints

- `219b5db`: bounded city, audio, encounter, vehicle, interaction and save modules.
- `f03182c`: integrated Living City gameplay, focused QA, full regression evidence, documentation and standalone release.
- GitHub Pages `562549a`: published the tested 0.5.0 standalone.
- Verified standalone SHA256: `51cd13889d9799aa229336d8f394391c9436f904dfb5c18e6d6ce4746d965dc6`.
