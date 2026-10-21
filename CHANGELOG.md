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
