# Glowport ’88 · Midnight Signal

An original open-world neon pixel-art browser crime adventure. Version 0.6.1 restores the authentic dense neon city from Living City 0.5.0: its original 808 buildings, 20×15 road grid, five districts, illustrated artwork and 800×450 presentation in the 7200×5040 world. Four residential designs replace only 16 existing facades across four existing blocks; their footprints and streets stay unchanged.

The implemented catalogue has **40 main missions in five acts**, **20 connected side stories** for five recurring contacts, and **32 contextual encounter types**. Multi-stage objectives include ordered investigations, timed driving routes, combat, protected escorts, stealth, physical vehicle pursuits, interactive heists, police searches, branching decisions, and three endings with free roam. The phone, properties, income, garages, tuning, skills, inventory, checkpoints, and saves are connected to gameplay.

[Play the browser demo](https://atlasnoah.github.io/Glowport88/?v=0.6.1-original-city). Tap **Start / Continue** to resume; **New Story** is optional. Existing saves migrate without duplicate tutorial payments. The original map and nighttime atmosphere are restored. Recent mission, interaction, touch, event and save improvements remain, with street-following GPS adapted to the original roads. It remains a development build with touch controls and a bounded terrain cache for phones. Duration remains unmeasured; an uninterrupted human playthrough of all missions and balance tuning are outstanding.

## Play on a phone

Open [the mobile browser demo](https://atlasnoah.github.io/Glowport88/?v=0.6.1-original-city), tap **Start / Continue**, and use portrait or landscape. The left stick moves or drives; drag the right stick to aim and fire; simply touching it does not shoot. **INTERACT** handles people, doors, objectives and cars. **WEAPON** cycles only owned weapons. **RELOAD**, **CROUCH**, hold **SPRINT/TURBO**, and **BRAKE** work without a keyboard. Tap **PHONE** for Jobs and contacts. **EXPAND** is offered only when browser fullscreen is available; fullscreen is optional.

The game autosaves on browser background/pagehide and pauses active play. Tap Resume after returning. Room position and crouch state survive reload. Saves remain local to each browser/device; desktop progress does not automatically transfer to a phone. Avoid clearing website data if you want to keep a test save.

The phone layout and real multi-touch gestures are tested in Chromium emulation at 390×844, 844×390, 844×320, and 320×568. Actual iPhones/Android devices and Safari still need hands-on testing. See [MOBILE_TESTING.md](MOBILE_TESTING.md).

## Play locally

Use Python 3 from the project root:

```sh
python3 -m http.server 8000 --directory Glowport88
```

Open `Glowport88_ArtRehaul_v11.html` through your local server in a modern desktop browser. The original filename is retained for compatibility. No app dependencies, credentials, or external services are needed. Keep `assets/` beside the HTML. The self-contained release is `dist/Glowport88-Midnight-Signal.html`.

WASD / arrows move; Shift runs; E interacts; mouse aims; click or F fires; 1–5 equip; R reloads; M opens the map; J opens the journal; Escape pauses. **P opens the phone** for Jobs, contact calls, messages, properties, and status. **C toggles crouching** for stealth. After the first six training missions, use E / INTERACT at the next story marker, or accept the next operation through Phone → Jobs. Optional jobs temporarily suspend the current main objective and resume it afterward. Retry failed checkpoints from the story panel or Phone → Contacts. In a car, W accelerates, S reverses, A/D steer, Space brakes, and E exits after slowing down. The story arrows guide to building entrances, then switch to room objectives; an EXIT marker shows when to leave for the next location. Between operations, NEXT JOB marks the next available story lead; E / INTERACT starts its briefing on foot or in a car. The pink marker follows the campaign. Cyan room markers guide investigations. Gold route checkpoints guide delivery missions. Service markers offer clinic care, diner food, motel rest, and the Dead Drop arcade cabinet.

Progress uses browser local storage under the existing save key. Version 6 saves retain mission objectives, choices, endings, suspended operations, actors, police searches, inventory, property, vehicles, skills, and reward receipts. Version 5 saves from the suburban overhaul migrate to the original roads; blocked positions and obsolete paths are repaired while progress remains. Original migration bytes and earlier backups are retained when storage permits; a failed required backup does not overwrite the old save. Earlier saves migrate to their corresponding expanded story chapter; completed old campaigns remain completed in free roam. Switching host/port or opening a standalone file uses a different browser storage origin. Keep a copy of browser data when moving installations.

## Develop and test

```sh
npm ci
npm test
```

Tests use Playwright and an installed Chromium at `/usr/bin/chromium`. Set `CHROMIUM_PATH` to another Chromium binary when needed. They start their own temporary server, exercise real gameplay, and write screenshots/results to `artifacts/`. See `TEST_RESULTS.md` for coverage limits.

**Preserve the approved artwork.** Asset regeneration is optional and is not part of setup or this restoration. For an explicitly authorized art task, install `tools/requirements-art.txt` for Python (the prepared environment already has Pillow 12.3.0) and run `python3 tools/build_assets.py`. The illustrated architectural sheet is committed artwork; it is not regenerated by that script. To rebuild the standalone HTML and source ZIP, run `python3 tools/build_release.py`.

The HTML hosts the recovered original world generation, movement, combat, traffic and rendering integration. `restored-city.js` indexes that original geometry for shared navigation/collision; it does not generate a replacement city. `residential-infill.js` selects the limited facade substitutions, and `art.js` uses the original illustrated renderer. Mission-engine, campaign, side-content, gameplay, police-system, progression, phone, art, and arcade modules live in `Glowport88/assets/`. The 0.6.0 `city-layout.js` and `environment-art.js` remain historical source files and are no longer loaded by the game. Asset layout/provenance is documented in that directory. `ART_DIRECTION.md`, `DEVELOPMENT_LOG.md`, and `ROADMAP.md` record artistic choices and continuation priorities.

This is a substantial development milestone, not a finished commercial release. See the test report for untested campaign paths and known limitations.

## Living City 0.5.0

ACTIONS chooses between overlapping doors, jobs, people and services. East Diner has food, Eddie and a local notice board. At Palm Motel, choose PALM GARAGE to purchase/store/repair/customize vehicles. SOUND offers four original procedural stations and independent audio controls. Explore for twelve cassette stories; inspect them in the journal’s CASSETTES section. Phone → Contacts includes checkpoint restart and putting optional work aside.

See [LIVING_CITY_REPORT.md](LIVING_CITY_REPORT.md) for the repair, implemented systems, testing and known limits; [ENCOUNTER_CATALOGUE.md](ENCOUNTER_CATALOGUE.md) lists all 32 event chains. [LIVING_CITY_BACKLOG.md](LIVING_CITY_BACKLOG.md) records unfinished requirements.

## Original city restoration · 0.6.1

The environmental baseline is the actual `c9b4af6` Living City implementation recovered from Git. Before any residential additions, all 21 controlled browser views matched that historical version pixel for pixel. The original roads, districts, 808 building footprints, terrain, foliage, decorations and lamp positions remain intact. Downtown and all twelve landmarks are excluded from the 16 facade substitutions.

The four new illustrated designs are a porch bungalow, urban duplex, Victorian townhouse and mid-century garage house. The original rich blue/purple shadows, cyan/pink neon, signage, characters, cars and interiors remain. Only three daylight overlay strengths are reduced slightly; full-night rendering remains identical to the recovered renderer.

See [RESTORATION_REPORT.md](RESTORATION_REPORT.md) for staged recovery, comparison screenshots, save compatibility and the current delivery status. `npm run test:restoration` runs original geometry, limited infill, migration, lighting and repeatable browser visual checks. The [0.6.0 rebuild report](CITY_REBUILD_REPORT.md) and [test results](TEST_RESULTS_0.6.0.md) describe the superseded suburban release.
