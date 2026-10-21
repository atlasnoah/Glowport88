# Next validation and development

The gameplay overhaul implements the 40-main / 20-side / 20-encounter catalogue through shared objective handlers, phone, progression, properties, garages, a police detection/search model, choices and endings. All original approved artwork and city geometry remain intact. See TEST_RESULTS.md for executed coverage and limits.

1. Complete a continuous human playthrough of all 40 main missions from New Story. Record actual elapsed play time and any navigational, combat, escort, stealth, pursuit, or checkpoint friction. Do not describe accelerated fixture runs as a measured campaign.
2. Play each recurring contact’s complete four-mission arc. Verify all encounter branches in the actual city and tune frequency, spawn context, and rewards. Three integration choice sweeps cover each option, not every combination of choices.
3. Balance the economy, passive income, skills, main mission bonuses, police search pressure, crew protection, and finale consequences against observed play. Expand persistent faction reactions and crew-specific heist approaches where they add meaningful decisions.
4. Run longer traffic/NPC/police performance and memory soak tests across every district. Profile before changing terrain or rendering architecture. Add browser coverage for failed escorts, stealth alarms, death/arrest retry, indoor vehicle handoffs, and service variants.
5. Test responsive phone access and implement complete touch movement/aiming controls if mobile play is required. Verify Firefox/Safari and low-end desktop hardware.

Keep using the existing checkout; do not create a Git worktree unless explicitly requested. Preserve all approved art PNGs, art.js, camera resolution, grid constants, doors, existing saves, and user edits. Run npm test, rebuild with npm run release, then npm run test:release before publishing a new demo. Keep actual screenshots, reports, the release manifest, and stable commits current.
