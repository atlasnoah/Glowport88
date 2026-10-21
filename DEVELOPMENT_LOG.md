# Development log

## Baseline
- Repaired missing map context/scaling, terrain baking, shared runtime state, and landmark lookup.
- Saved a full baseline archive outside the checkout at `/tmp/glowport88-baseline.tar.gz`.
- Established a self-starting Chromium regression runner. Fourteen baseline checks passed, including campaign intro, purchase/equip, UI, police response, and save/restore.
- Inspected actual baseline gameplay and the provided reference. Baseline is legible but flat, repetitive, and lacks meaningful roof/facade detail.
- Introduced a pinned development-only Playwright dependency. The delivered game itself needs only a static HTTP server.

## Atlas renderer and art foundation
- Added reproducible original PNG atlases: 13 surface materials, reusable street/interior props, 384 character poses (12 appearances × 4 directions × 8 poses), and 128 vehicle direction/colour cells.
- Added a separate art module for terrain baking, storefront composition, fixture lighting, weather reflections, sprites, and room identities. Removed the former generic building renderer and rectangular landmark light overlay.
- Preserved all city footprints, road coordinates, mission doors, campaign state, and save key.
- Fixed simulation time continuing while menus, conversations, or pause overlays are open.
- Fifteen browser smoke checks pass. Inspected actual day, night/rain, and hotel screenshots. Remaining art concerns: repetition, dark night exposure, and oversized/simple indoor furniture. Further polish is in progress.
