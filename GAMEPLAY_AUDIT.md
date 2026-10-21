# Gameplay overhaul audit

## Baseline established before integration

The pre-overhaul `npm test` run exited successfully. JavaScript syntax/asset-reference checks and the existing investigation/delivery logic tests passed. Real Chromium executed **20 smoke checks and 6 deeper gameplay checks**, all passing. The browser suites regenerated their normal screenshots/results files.

The baseline checks cover Start, rendered city pixels, movement/camera response, map/journal/pause, time freeze, driving/braking/exit, room entry/exit, the tutorial conversation/purchase/equip sequence, projectile fire/reload, police response, old saves, investigations, clinic/arcade transactions, room art, rain/night, training targets, the tutorial fight, Roxy, delivery timeout/retry, and a 30-second NPC/traffic probe. These do not establish a complete campaign playthrough or gameplay duration.

## Art and geography preservation snapshot

The approved art is unchanged by this audit. These SHA-256 values were captured before any integration edits:

| Existing asset | SHA-256 |
| --- | --- |
| `buildings-illustrated.png` | `4e0aaad31c743d1bd779f2f194557dbba922316959f9232eee983cd732cc438e` |
| `characters.png` | `0e3ea49095f5d519601cbd587862454eadbe4fbcba7f75c1c167fe33d5dabd8b` |
| `city-atlas.png` | `964bbaf24f1d374e5992ee60756c45223a27b9e1e720c0dafefaaa4a0ac7dd4f` |
| `furniture-illustrated.png` | `00ca5377c351f078ad3d4d39ac8c3687b1d9734c5b8e85671124d33bb6960b49` |
| `neighborhoods-illustrated.png` | `de124d9ae06e1e88faffc733ca8215aa5f7c0790346699ae09ae517576d23166` |
| `portraits.png` | `4506507edf4b0be8e70901065f3aa51ffa66ec28d05cc367cf0d35e4cd39935e` |
| `vehicles.png` | `1c6e15cf1c96ba2de9d181a4acfbd3687de4cc517099f1f1e4593183dc58c3ef` |

Source camera/resolution constants: `W=800`, `H=450`, `MW=7200`, `MH=5040`. The connected street grid has 20 columns at `160+i*360` and 15 rows at `160+i*340`. The baseline day length is 720 simulation seconds starting at 8:20 AM. The new content validator checks the existing art hashes and camera/grid constants in addition to catalogue structure.

## Integration hazards and required tests

1. **One campaign authority.** Legacy `storyAt`, `doStory`, `storyAdvance`, map/HUD/prompt, and room-collision functions all read `world.story` directly. After the first six tutorial missions bridge to the new engine, legacy handlers must stop awarding rewards or advancing a second storyline. Test one actual objective completion and verify one reward, one stage event, and one saved completion.
2. **Explicit save migration.** The old v2 save is a whitelist and omits every new system. Persist mission state/checkpoints, economy, phone/messages, flags, choices, inventory, ownership, police search state, and acquired vehicles. Test old saves before/during/after tutorials, completed campaign migration, malformed optional fields, and reload during a non-first objective. Do not infer progression merely from array position after inserting missions.
3. **Failure precedes actor cleanup.** `hospital()` clears all enemies. Without failing an active combat/protection/heist mission first, the evaluator can read an empty enemy array as victory after death. Test death and failed escort, checkpoint retry, and no duplicate money/inventory rewards.
4. **Clock and input ownership.** The old update guard freezes simulation under pause, journal, map, shop, dialogue, and arcade. Phone and cinematic states must join the guard. Both keyboard and pointer/fire handlers must respect these states, and closing the phone must release held movement/fire controls. Test Escape, number keys, and clicking through overlay edges.
5. **Police owns wanted decay.** Legacy update independently reduces wanted after eight seconds. Remove that decay if the new module owns pursuit/search/line-of-sight. Otherwise an escape objective can succeed while police can still see the player. Test visible pursuit, a real occluding wall, last-known search, and a reachable escape completion.
6. **Action precedence and range.** Important doors precede some NPC/car interactions. Objective actions should not award progress at arbitrary distance or through the wrong interior. Test genuine E interactions at heist/stealth/evidence/escort stages, not direct `completeStage` calls.
7. **Actor identity and stage baselines.** Count only mission-owned enemy kills and escort health, preserve actors across save or recreate them deliberately at checkpoint, and capture initial inventory/vehicle state per stage. An unrelated street fight, empty initial enemy array, or pre-owned generic item must not silently satisfy the wrong objective.
8. **Recovery and free roam.** Failed or abandoned side missions/events must not strand the main campaign. Reaccepting a mission must restore a valid checkpoint and remove obsolete actors. After an ending, free roam, map, shops, phone, and saving should remain functional.
9. **Catalogue data is not playability.** The structural validator checks counts, graphs, fields, branches, locations, and art preservation. Passing it means the data is internally consistent; only actual browser objectives establish that mission mechanics work. Do not turn generated forty-entry data into an hours-played claim.
10. **Release parity.** Rebuild the standalone after integration, verify newly added scripts are embedded and no network subresources are required, and refresh the deployed demo only after the browser checks pass.

## Coverage to add before calling the overhaul complete

- Complete Act I from a clean save with actual objective conditions and checkpoint retry.
- Exercise each new mechanic in Chromium: heist input sequence, escort/protection, stealth detection, inventory delivery, route/race deadline, police escape, and meaningful branch choice.
- Test phone acceptance/contacts/unlocks and real economy transactions including insufficient funds, upgrades, income caps, and garage store/retrieve.
- Verify natural encounter spawning, district/act gates, cooldowns, ignoring/accepting, and at least two outcomes for one encounter.
- Run the forty-mission main campaign and all twenty side missions end to end. Until then, describe them as authored mission content with specifically tested mechanics, not a proven 10–20 hour campaign.

Final integration results should be appended to this audit rather than replacing the baseline evidence.

## Catalogue validation result

`node tests/campaign-content.cjs` passed after the content modules were authored. It verified all 80 definitions register in the real mission engine: 40 main missions (eight in each of five acts), 20 side missions (four for each of five recurring contacts), and 20 distinct encounter categories. It checks prerequisite cycles/unknown IDs, branch targets and forward progression, supported objective types, finite rewards/deadlines, valid existing locations, investigation clue coordinates, legacy mappings, multi-objective mission structure, several heist sequences, and multiple explicit final endings. All seven approved PNG hashes and the camera/world/road constants still matched the baseline.

The authored catalogue contains six retained legacy tutorial stages plus 177 new main-campaign stages, 89 side-story stages, and 51 encounter stages. These totals describe definitions, not elapsed gameplay or completed end-to-end browser tests. The scenario-based overhaul browser suite is separate and will record its actual outcomes in `artifacts/overhaul-results.json` once integration is ready.


## Final integration evidence

The complete npm test command passes: 43 real Chromium checks, 16 mission-engine tests, 11 police-model tests, progression/economy checks, catalogue/art checks, and three accelerated adapter choice sweeps totaling 910 objective resolutions across all 74 new definitions. The first six main missions retain separate tutorial browser coverage. Standalone packaging passes with zero subresource requests.

The accelerated host replaces travel/combat and the heist success boundary. Browser scenarios separately exercise actual combat, heist timing, driving, escort, stealth, pursuit, investigations, garage transactions, encounter dialogue, endings, and reload. These layers provide transition and mechanic coverage without establishing uninterrupted campaign navigation, all possible choice combinations, human difficulty, or a measured duration. See TEST_RESULTS.md for the current limitations.
