# Development log

## Baseline
- Repaired missing map context/scaling, terrain baking, shared runtime state, and landmark lookup.
- Saved a full baseline archive outside the checkout at `/tmp/glowport88-baseline.tar.gz`.
- Established a self-starting Chromium regression runner. Fourteen baseline checks passed, including campaign intro, purchase/equip, UI, police response, and save/restore.
- Inspected actual baseline gameplay and the provided reference. Baseline is legible but flat, repetitive, and lacks meaningful roof/facade detail.
- Introduced a pinned development-only Playwright dependency. The delivered game itself needs only a static HTTP server.
