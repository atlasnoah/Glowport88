# Mission and entrance verification · 0.6.2

- Fixed checkpoint decision replay so recorded choices, relationship effects and paid choices remain consistent without duplicate consequences or repeat charges.
- Preserved retrieved personal vehicles before their first drive; phone garage storage/retrieval now validates safe exits, available pickup space and stopped/unwanted state before changing inventory.
- Fixed rival cars spawning into one another, freezing when the player exits, and continuing after destruction.
- Fixed menu/dialogue/overlay keyboard activation and focus, phone/workshop action refresh focus, arcade keyboard controls and lost pointer capture, and paused sound previews.
- Centered continued saves before the first simulation frame and corrected engine-part delivery interaction from a car.
- Added actual-host mission completion, every playable entrance, indoor objective reachability and targeted bug regressions. Original city geometry, artwork and lighting remain unchanged; saves retain schema 6/map 3.
- See BUGFIX_REPORT.md and TEST_RESULTS.md for executed verification and delivery.

---

# Original city restoration · 0.6.1

- Recovered the authentic `c9b4af6` Living City map generation and illustrated neon renderer instead of creating another map. Restored all 808 original building footprints, 35 streets at their original 66px widths, district boundaries, landmarks, terrain, sidewalks, street details and original traffic circuits.
- Preserved newer mission acceptance, East Diner interaction, navigation arrows, touch controls, events, vehicles, shops, combat, progression, audio and save recovery. Adapted shared pathfinding/collision to the original grid without regenerating world geometry.
- Introduced four detailed illustrated residential designs on only 16 existing facades across four original blocks. Downtown, landmarks, building dimensions, doors, terrain and streets are unchanged.
- Reduced only small daylight wash, ambient and halo strengths. Full-night atmosphere, cyan/pink light sources, shadows, weather effects and original illustrated sprites remain intact.
- Added version-six/map-three migration retaining v5 and earlier durable backups, earned progress, receipts, vehicles and active/suspended objectives while repairing obsolete street positions and routes.
- Added staged, fixed-camera browser screenshots, exact original-world hashes, raw-terrain facade-bound checks, original-renderer night comparisons and real-host save migration coverage. See RESTORATION_REPORT.md and TEST_RESULTS.md for executed results and delivery status.

---

# The Great City Rebuild · 0.6.0

- Replaced the city-wide street grid and repeated storefront generation with one connected, district-zoned road/parcel/navigation/collision model, curved subdivisions and ten cul-de-sacs.
- Added fifteen structurally distinct house architectures, residential lots, varied apartment/commercial/civic/industrial buildings, public spaces and ordinary street details; preserved the original landmark/interior artwork and all twelve story entrances.
- Removed the persistent blue daytime wash, all-day lighting overlays and oversized bloom. Added independently configurable ambient, shadows, streetlight, neon, vehicle and weather components, stable light indexing and exact world-aligned terrain rasterization.
- Updated traffic, citizen and police routes, full map, minimap and street-following GPS. Preserved existing mission acceptance, touch controls and campaign content.
- Added version-five save/route migration with original-save backups, blocked-position recovery and retained vehicle upgrades, choices, objective progress and reward receipts.
- Added geometry/collision/driveway/architecture/lighting/migration/browser route tests and real before/after captures. See CITY_REBUILD_REPORT.md for executed results and development limitations.

---

# The Living City · 0.5.0

- Fixed reproduced East Diner prompt/execution disagreement, encounter-stealing priority, clue radius mismatches and confusing on-foot driving interactions. E/touch now use one resolver; ACTIONS exposes alternatives and story markers start the actual briefing.
- Added 12 event definitions (32 total), safe contextual street scenes, persistent outcome memory, blackout repair, accident hazards, lawful timing activities and physical race rivals with saved progress/results. Retained all 20 old event IDs and original stage slots.
- Added 10 vehicle handling profiles,9 purchasable models, Palm workshop, paint/trim, real upgrades and paid repairs; disabled cars remain disabled through storage/loading.
- Added 12 collectible cassette stories, citizen danger/shelter/return states and traffic responses, bounded roadblock cleanup, four original synthesized radio stations and audio settings, and journal sections.
- Added mission recovery/optional-job resumption with reward protection, version 4 save backups/recovery and isolated developer-query saves.
- Added focused diner, mission, encounter, vehicle, city/audio, save, host and multi-day endurance coverage. This is a development milestone; see LIVING_CITY_REPORT.md and LIVING_CITY_BACKLOG.md for tested scope and remaining work.

---

# Story navigation fix · 0.4.2

- Restored street arrows for indoor objectives by guiding to the building entrance, then switching to the correct clue or objective inside.
- Added an exit marker when the next objective is outdoors or in another building.
- Added a next-story waypoint between operations, with the next mission named in the objective panel and Phone → Jobs acceptance guidance. Failed checkpoints retain Retry; completed campaigns retain free roam.
- Kept actual objective coordinates, route checkpoints, pursuit targets, mission acceptance, saves, artwork and touch controls intact.

---

# Touch refinement · 0.4.1

- Fixed a verified long-press double-activation bug. Actions activate once on release inside, cancel outside, and ignore trailing pointer clicks.
- Added continuous low-speed movement, per-axis steering/throttle filtering, deliberate drag-to-fire, unit aiming and firing hysteresis.
- Preserved aiming direction when switching from the aiming stick to held Fire; keyboard/mouse/touch releases no longer erase other input sources.
- Added consistent pointer ownership/window fallback, stronger canceled/modal/destroyed gesture handling, clear active/disabled feedback, supported-only fullscreen visibility, and short landscape sizing.
- Cached touch presentation state instead of rewriting it every frame. Added 17 isolated controller checks and expanded mobile scenarios from 17 to 21. Artwork and mission content are unchanged.

---

# Mobile browser beta · 0.4.0

- Added independent touch movement and aim/fire sticks, interaction, owned-weapon cycling, reload, crouch, sprint/turbo, brake, and optional fullscreen controls.
- Added portrait/landscape phone layouts, safe-area/dynamic-viewport sizing, compact objective/status, finger-sized targets, and touch-scrollable menus.
- Replaced the oversized whole-city canvas with bounded lazy terrain tiles while preserving all approved art and world/camera coordinates.
- Added background autosave/pause, cancellation/release handling, room-coordinate restoration, and guards against canvas-tap firing and disabled touch controls interfering with desktop input.
- Added 17 true-multitouch phone-emulation checks, terrain coordinate/art/cache checks, and standalone mobile playback validation. Physical iOS/Android and Safari testing remain pending.

---

# Gameplay overhaul · 0.3.0

- Added reusable multi-stage mission lifecycle, prerequisites, strict deadlines, failure/checkpoint retry, suspended main objectives, persisted decisions, and exactly-once reward events.
- Added 40 main missions over five acts, 20 side stories across Darla/Bobby/Static/Violet/Sol, and 20 district/cooldown encounter types. Retained the six tested opening training missions.
- Connected investigations, route driving/races, combat/protection, escorts, stealth, traffic pursuits, deliveries, interactive lock breaches, and escape objectives to the existing city.
- Added three final endings and free roam, crew trust/choice memory, operational funding/restitution effects, passenger protection, Jax discounts, nearby radio/NPC reactions, and clean-run/heist-precision rewards.
- Added phone messages/jobs/contacts/properties/status, six purchasable properties, income, upgrades, recovery, garage storage, repair, engine tuning, driving/shooting skills, equipment, and inventory.
- Replaced automatic heat decay with witnesses, dispatch, line-of-sight pursuit, last-known-position searches, fair reinforcements, roadblocks, and arrest handling.
- Added version 3 saves preserving objectives, police, actors, owned and controlled vehicles, properties, choices, inventory, and receipts. Old completed saves remain in free roam.
- Fixed encounter/objective placement, indoor handoffs with parked getaway cars, escort interception of vehicle interaction, regenerated stored-vehicle duplicates, and duplicate active-operation acceptance.
- Preserved every approved art PNG, art.js, camera resolution, and the square-grid city.
- Expanded automated coverage to 43 browser checks, model tests, content/art validation, and three accelerated campaign choice sweeps. Duration remains unmeasured; see TEST_RESULTS.md for limits.

---

# Midnight Signal · development milestone

## Visual rebuild
- Original illustrated architectural sheets: six landmark shells and six unlettered neighborhood shells, selected by district and labelled with existing business names.
- Original illustrated furniture sheet with twelve reusable prop types, used in distinct hotel, shop, clinic, club, arcade, and industrial rooms.
- Reproducible material, street prop, palm/tree, character, vehicle, and portrait atlases. Characters have four directions, walk poses, aim/recoil/reload poses; vehicles have sixteen quantized viewing directions and eight paint/siren schemes.
- Textured pavements, road wear, drains, curbs, crossings, courtyards, foliage, roof details, and illuminated storefronts.
- Fixture lighting with spatial buckets and cached glows; day/night exposure, headlights/taillights, emergency light pools, flicker, rain streaks/ripples/reflections, and mist.
- New title/menu/HUD/dialogue presentation and character portraits. Fixed overlapping room labels and introduced a visible asset-loading state.

## Gameplay and stability
- Repaired missing map context/scaling, landmark lookup, terrain baking, and runtime state initialization that prevented Start from working.
- Added multi-stage evidence investigations to existing radio, warehouse, observatory, and record-shop chapters. Final evidence is gated by earlier clues.
- Added timed checkpoint routes and retryable delivery windows to existing driving chapters, with route markers on HUD, world, minimap, and full map.
- Added clinic treatment, diner meals, motel rest, and the playable Dead Drop arcade activity.
- Added persisted Vee trust affecting later conversation wording, preserving the existing story and save key.
- Improved save validation/defaults for legacy and incomplete data.
- Prevented simulation time from advancing under pause/dialogue/menus/arcade; prevented gameplay keyboard actions on the main menu and under overlays.
- Increased opening-area pedestrian presence, made nearby-car interaction respect relative proximity, and placed police arrivals offscreen at a fair distance.
- Added impact sparks and oriented firing feedback; preserved combat, wanted levels, traffic routes, grid dimensions, landmarks, and the campaign.

## Engineering and delivery
- Separated asset/rendering, evidence/delivery logic, and arcade gameplay into modules.
- Added viewport culling before allocating render entries and spatially indexed fixture lighting.
- Added pinned Playwright tooling, self-starting test servers, syntax checks, mission tests, 26 browser checks, captured screenshots, and a standalone release check.
- Added original editable asset sources, a deterministic atlas builder, standalone HTML/ZIP packaging, documented setup, development log, art direction, roadmap, and test coverage limits.

See `TEST_RESULTS.md` and `ROADMAP.md` for incomplete features and untested paths. No claim is made that the full master directive or ten hours of development has been completed.
