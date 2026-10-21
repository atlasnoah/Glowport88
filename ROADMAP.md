# Development roadmap and continuation

## Completed milestone

- Working baseline repaired, backed up, and recorded in Git.
- Original art foundation and separate renderer, with source sprite sheets and deterministic drawn-asset tooling.
- First city art transformation: illustrated buildings, textured streets, props, foliage, district choices, and fixture lighting.
- Directional character/vehicle sprites, portraits, and first-pass distinct room artwork/collision bounds.
- Evidence chains, timed checkpoint deliveries, several business activities, and the playable arcade cabinet.
- Syntax/mission checks, 26 browser checks, screenshot evidence, standalone HTML, and source archive tooling.

## Exact next work

1. Run the entire 21-chapter campaign from a clean save. Extend `tests/gameplay.cjs` to cover all investigation variants, full checkpoint travel, mid-campaign fights, the finale, death/retry, and every reward. Use real objectives; do not call `storyAdvance()` to manufacture passing outcomes.
2. Test diner/motel purchases and a full arcade run. Check low-cash behavior, reward limits, and mobile input. Audit saved time jumps against event/mission expiration.
3. Harmonize visual scale between architecture, furniture, and people. Add more authored shell variants, distinct clinic/observatory/pier silhouettes, parking/loading alleys, and curated neighborhood compositions. Preserve the connected 7200×5040 grid and existing landmark doors.
4. Implement shared prop collision metadata and depth-aware occlusion for street decorations and room objects. Add real shadow occlusion and richer shop-window animation without washing out the scene.
5. Profile multiple districts and long play sessions. Audit NPC corner cases, vehicle intersections, sustained pursuits, memory, and frame time. Consider chunked terrain caching only if measurements justify replacing the current full-world bake.
6. Expand story with authored investigations, meaningful relationship consequences, stealth/cover, scripted chases, and retryable multi-objective missions. Existing trust changes dialogue wording; it is not yet a branched campaign.
7. Add distinct vehicle handling/classes, entry/exit animation, customizations, more civilian activity animations, and optional property/clothing systems after the playable core remains stable.

Keep incremental playable commits. Preserve old saves or provide explicit migrations. Use the existing checkout; do not create a Git worktree unless explicitly requested. Run `npm test` after significant changes; rebuild with `python3 tools/build_release.py` and run `node tests/release.cjs` before handing off a new standalone release. Inspect actual screenshots and update `TEST_RESULTS.md` instead of claiming unrun checks passed.
