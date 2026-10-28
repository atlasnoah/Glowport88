# Glowport ’88 · Mission, entrance and bug verification · 0.6.2

This release fixes confirmed runtime bugs and verifies mission completion and every existing playable entrance. It preserves the restored original city: all 808 building footprints, 35 streets, original artwork, residential infill and lighting. Save schema 6/map 3 and the normal browser save key remain compatible.

## Missions and entrances

The actual Chromium host completed all **40 main missions, 20 side missions and 32 encounter missions**. This includes the six original tutorials, successive story acceptance through E, side-job acceptance through Phone → Jobs, and encounter-offer dialogue. The runner uses real weapon/projectile damage, objective handlers, police simulation, protected contacts, inventory handoffs and the timing minigame's meter/buttons. It never calls direct stage completion, overrides objective evaluation, sets success flags, or reduces enemy health by assignment.

The completed audit contains **176 successful runs**, including **84 alternate/mixed-choice paths**, **580 objective resolutions** and an explicit **390/390 unique authored-stage assertion**. It used **631 real projectile shots** and **121 timing-button inputs**. The mixed Apartment Zero archive handoff is included; uniform choice sweeps alone did not cover it.

QA shortens travel, supplies equipment and invulnerability, accelerates simulation and controls the browser animation clock. This establishes objective and branch finishability; it does not establish normal difficulty, a campaign duration, all possible choice combinations or uninterrupted human play.

All **12 existing supported interiors** pass entry, movement and exit checks: Violet Hotel, Neon Armory, Cassette Club, Record Exchange, Dead Air Radio, Star Arcade, Palm Motel, Dockside 88, East Diner, Marina Clinic, Crescent Lookout and Bayfront Boathouse. The audit performed **48 free-roam round trips** (36 keyboard walks from three approaches and 12 actual phone touch routes), checked every interior during an active mission, and completed the fresh hotel introduction through movement and conversation. Where another service has higher priority, the advertised ACTIONS menu provides the door choice; the motel garage is one such case. Decorative building facades were not converted into new interiors.

Two independent room audits cover all **390 authored stages**, including **137 indoor stages** and **338 objective/exit standpoint checks**. They inspect the actual padded furniture/mission collision boundaries and walk 21 distinct collision configurations using keyboard handlers and 3,225 production movement frames. No blocked objectives, invalid interior keys, or blocked playable doors were found.

## Bugs fixed

| Problem | Result |
| --- | --- |
| Replaying checkpoint choices could stack permanent relationship effects, switch an already-recorded branch, or demand payment again with an empty wallet. Stale choice callbacks could act after a reset. | Recorded decisions and their consequences survive retry/load exactly once; replay offers the recorded decision, preserves paid-choice completion and ignores stale callbacks. |
| A purchased/retrieved car could disappear if saved before its first drive. | Stable personal vehicles are serialized immediately, including parked upgrades/paint; repeated loads do not duplicate the starter or retrieved car. |
| Phone garage storage could place the player inside a building; pickup could overlap a car or consume stored inventory before finding safe space. | Exit/pickup space and stopped/search state are validated before inventory changes. All three storage properties have safe tested exits; failed requests preserve car, inventory and cash. |
| Race rivals spawned into the player/each other, froze when the player got out, or kept moving after destruction. | Separate safe starting positions, continuing race simulation on foot, and stopped destroyed opponents; saved races resume without duplicates. |
| Menu Tab/Space/Enter, dialogue Enter and overlay focus could activate the wrong action or underlying controls. | Native focused-button activation, deliberate bare-Enter continuation, selected dialogue responses and bounded window focus. |
| Phone/workshop actions removed their focused buttons and left keyboard focus behind the dialog. | Focus follows the replacement action or a safe in-dialog fallback; Tab recaptures outside focus. |
| Arcade capture suppressed native keyboard buttons; lost pointer capture left movement held. | Keyboard navigation/activation, return focus and reliable movement release. |
| SOUND test cues were cancelled by the paused host on the next frame. | A bounded preview finishes while game time stays paused; mute, close and background cancellation remain effective. |
| Continued on-foot saves initially showed the old camera position. | Camera centers on the restored player/vehicle before its first simulation frame. |
| Engine-part handoffs from a car measured the player's stale walking position. | Prompt and action use the same controlled-car position; stopped-car delivery pays once and retains the vehicle. |

The focused regression suites execute **48 checks** for these cases. Before-fix failures were reproduced; fixes include real browser controls and saved-state transitions.

## Validation and limits

Current evidence is in `artifacts/all-missions-host-results.json`, `all-entrances-host-results.json`, `mission-geometry-audit-results.json`, `room-reachability-results.json` and the eight focused audit reports. Commands are `npm test`, `npm run test:bugs`, `npm run test:playability`, `npm run release`, `npm run test:release` and `node tests/public-demo.cjs`. The complete regression prefix (including all 48 bug checks) exited 0. The four new playability suites also each executed successfully; the default test script now includes them for future runs. The earlier accelerated adapter integration still passes 1,013 objectives across three choice sweeps. Three simulated days, save migration, all 14 East Diner checks, mobile controls and restoration comparisons pass. All 29 static city/residential images remain byte-identical to the verified 0.6.1 restoration.

`npm run release` and `npm run test:release` passed. The bundled HTML supports desktop/mobile Start, render, save/reload, map, phone, touch movement/driving and story entrance guidance with zero subresource requests. Production QA visibility, isolated debug saves and quota-safe New Story backups passed. Public delivery is recorded below.

A baseline run exposed two fixed-wall-clock test assumptions under concurrent browser load: movement after a 1.35-second wait and firing after 470ms. Focused reruns passed; those assertions now wait, with a deadline, for the actual advertised interaction or ammunition change. The original action, movement and post-release assertions remain. Test harness setup errors during development (door argument shadowing and failure to bring a required parked car to an indoor delivery) were corrected without changing production rules.

Physical iPhone/Android, Safari/Firefox, subjective speaker/audio quality, every historical save and human balancing remain unverified. Accelerated CPU/endurance checks do not establish physical-device frame rate or battery performance. Direct external cloud Chromium HTTPS may be blocked by its proxy trust setup; delivery verification retains normal certificate-verified HTTPS and exact-byte browser playback.

## Verified delivery

Publication pending final verification. The intended playable URL is https://atlasnoah.github.io/Glowport88/?v=0.6.2-bugfix. This section will record the tested source, Pages deployment and exact release checksum.
