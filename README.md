# Glowport ’88 · Midnight Signal

An original open-world neon pixel-art browser crime adventure. The Great City Rebuild combines the approved landmark and interior artwork with new residential architecture, connected neighborhood streets and clearer lighting in the existing 800×450 view and 7200×5040 world.

The implemented catalogue has **40 main missions in five acts**, **20 connected side stories** for five recurring contacts, and **32 contextual encounter types**. Multi-stage objectives include ordered investigations, timed driving routes, combat, protected escorts, stealth, physical vehicle pursuits, interactive heists, police searches, branching decisions, and three endings with free roam. The phone, properties, income, garages, tuning, skills, inventory, checkpoints, and saves are connected to gameplay.

[Play the browser demo](https://atlasnoah.github.io/Glowport88/?v=0.6.0-city-rebuild). Tap **Start / Continue** to resume; **New Story** is optional. Existing saves migrate without duplicate tutorial payments. The Great City Rebuild adds residential neighborhoods, fifteen house architectures, curved roads and cul-de-sacs, street-following GPS and crisp local lighting. It remains a development build with touch controls and a bounded terrain cache for phones. Duration remains unmeasured; an uninterrupted human playthrough of all missions and balance tuning are outstanding.

## Play on a phone

Open [the mobile browser demo](https://atlasnoah.github.io/Glowport88/?v=0.6.0-city-rebuild), tap **Start / Continue**, and use portrait or landscape. The left stick moves or drives; drag the right stick to aim and fire; simply touching it does not shoot. **INTERACT** handles people, doors, objectives and cars. **WEAPON** cycles only owned weapons. **RELOAD**, **CROUCH**, hold **SPRINT/TURBO**, and **BRAKE** work without a keyboard. Tap **PHONE** for Jobs and contacts. **EXPAND** is offered only when browser fullscreen is available; fullscreen is optional.

The game autosaves on browser background/pagehide and pauses active play. Tap Resume after returning. Room position and crouch state survive reload. Saves remain local to each browser/device; desktop progress does not automatically transfer to a phone. Avoid clearing website data if you want to keep a test save.

The phone layout and real multi-touch gestures are tested in Chromium emulation at 390×844, 844×390, 844×320, and 320×568. Actual iPhones/Android devices and Safari still need hands-on testing. See [MOBILE_TESTING.md](MOBILE_TESTING.md).

## Play locally

Use Python 3 from the project root:

```sh
python3 -m http.server 8000 --directory Glowport88
```

Open `Glowport88_ArtRehaul_v11.html` through your local server in a modern desktop browser. The original filename is retained for compatibility. No app dependencies, credentials, or external services are needed. Keep `assets/` beside the HTML. The self-contained release is `dist/Glowport88-Midnight-Signal.html`.

WASD / arrows move; Shift runs; E interacts; mouse aims; click or F fires; 1–5 equip; R reloads; M opens the map; J opens the journal; Escape pauses. **P opens the phone** for Jobs, contact calls, messages, properties, and status. **C toggles crouching** for stealth. After the first six training missions, use E / INTERACT at the next story marker, or accept the next operation through Phone → Jobs. Optional jobs temporarily suspend the current main objective and resume it afterward. Retry failed checkpoints from the story panel or Phone → Contacts. In a car, W accelerates, S reverses, A/D steer, Space brakes, and E exits after slowing down. The story arrows guide to building entrances, then switch to room objectives; an EXIT marker shows when to leave for the next location. Between operations, NEXT JOB marks the next available story lead; E / INTERACT starts its briefing on foot or in a car. The pink marker follows the campaign. Cyan room markers guide investigations. Gold route checkpoints guide delivery missions. Service markers offer clinic care, diner food, motel rest, and the Dead Drop arcade cabinet.

Progress uses browser local storage under the existing save key. Version 3 saves retain mission objectives, choices, endings, suspended operations, actors, police searches, inventory, property, vehicles, skills, and reward receipts. Earlier saves migrate to their corresponding expanded story chapter; completed old campaigns remain completed in free roam. Switching host/port or opening a standalone file uses a different browser storage origin. Keep a copy of browser data when moving installations.

## Develop and test

```sh
npm ci
npm test
```

Tests use Playwright and an installed Chromium at `/usr/bin/chromium`. Set `CHROMIUM_PATH` to another Chromium binary when needed. They start their own temporary server, exercise real gameplay, and write screenshots/results to `artifacts/`. See `TEST_RESULTS.md` for coverage limits.

**Preserve the approved artwork.** Asset regeneration is optional and is not part of setup or this gameplay overhaul. For an explicitly authorized art task, install `tools/requirements-art.txt` for Python (the prepared environment already has Pillow 12.3.0) and run `python3 tools/build_assets.py`. The illustrated architectural sheet is committed artwork; it is not regenerated by that script. To rebuild the standalone HTML and source ZIP, run `python3 tools/build_release.py`.

The HTML hosts movement, combat, traffic, navigation and rendering integration; city-layout.js owns the road graph/parcels/collision, environment-art.js owns the new neighborhood architecture, and mission-engine, campaign, side-content, gameplay, police-system, progression, phone, art, and arcade modules live in `Glowport88/assets/`. Asset layout/provenance is documented in that directory. `ART_DIRECTION.md`, `DEVELOPMENT_LOG.md`, and `ROADMAP.md` record artistic choices and continuation priorities.

This is a substantial development milestone, not a finished commercial release. See the test report for untested campaign paths and known limitations.

## Living City 0.5.0

ACTIONS chooses between overlapping doors, jobs, people and services. East Diner has food, Eddie and a local notice board. At Palm Motel, choose PALM GARAGE to purchase/store/repair/customize vehicles. SOUND offers four original procedural stations and independent audio controls. Explore for twelve cassette stories; inspect them in the journal’s CASSETTES section. Phone → Contacts includes checkpoint restart and putting optional work aside.

See [LIVING_CITY_REPORT.md](LIVING_CITY_REPORT.md) for the repair, implemented systems, testing and known limits; [ENCOUNTER_CATALOGUE.md](ENCOUNTER_CATALOGUE.md) lists all 32 event chains. [LIVING_CITY_BACKLOG.md](LIVING_CITY_BACKLOG.md) records unfinished requirements.

## The Great City Rebuild · 0.6.0

The existing story, interiors, forty main missions, twenty side missions, thirty-two encounters and mobile controls continue in a city rebuilt around residential zoning and connected road geometry. The twelve original landmark doors stay fixed. East Diner gains its own neighborhood, streets, fuel stop, market and parking. Clear weather has no permanent blue/fog filter; independent ambient, shadow, streetlight, neon, vehicle and weather settings live in `GlowportArt.lighting`.

Version-five saves keep the same normal browser key, preserve the original pre-migration bytes and repair blocked positions and old routes without paying rewards again. Debug-query saves remain separate. Use Start / Continue to resume; New Story is optional.

See [CITY_REBUILD_REPORT.md](CITY_REBUILD_REPORT.md) for the implemented layout, zoning, screenshots, executed tests, performance comparison, release evidence and known limits. `npm run test:rebuild` runs the dedicated architecture, lighting, geometry, migration and real-browser route checks. The earlier [Living City report](LIVING_CITY_REPORT.md) records the previous 0.5.0 release.
