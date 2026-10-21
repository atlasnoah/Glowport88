# Glowport ’88 mission tracker

## Main campaign

Forty authored main mission definitions span five acts. The first six bridge the existing tutorial. The other thirty-four contain 177 objective stages, including evidence chains, convoy tailing, escort/protection, timed driving, heist sequences, police escapes, and decisions. This inventory records authored content. All 34 new main missions also pass three accelerated adapter choice sweeps; browser scenarios cover their shared mechanics. A continuous human playthrough remains outstanding. No 10–20 hour duration claim is supported yet.

The art, renderer, camera, and square city grid are not changed by the campaign catalogue. All mission locations are existing landmarks. Stable mission/stage IDs support saved checkpoints and test fixtures. Main prerequisites are sequential and do not require optional side missions, property purchases, or a particular earlier decision.

### Act 1: SMALL-TIME TROUBLE

A rent-money job becomes evidence of a city for sale.

| ID | Mission | Objectives | Authorship / validation status |
| --- | --- | --- | --- |
| m01 | A CITY FOR SALE | legacy | Existing tutorial browser baseline passed; new bridge needs integrated regression |
| m02 | A LITTLE INSURANCE | legacy | Existing tutorial browser baseline passed; new bridge needs integrated regression |
| m03 | LEARN THE HARDWARE | legacy | Existing tutorial browser baseline passed; new bridge needs integrated regression |
| m04 | PAPER TARGETS | legacy | Existing tutorial browser baseline passed; new bridge needs integrated regression |
| m05 | THE FIRST THREAT | legacy | Existing tutorial browser baseline passed; new bridge needs integrated regression |
| m06 | EVERYONE KNOWS SOMEONE | legacy | Existing tutorial browser baseline passed; new bridge needs integrated regression |
| m07 | DEAD AIR | investigate → collect → deliver → talk | Authored; full mission playthrough unrun |
| m08 | CHANGE OF A LIFETIME | talk → acquire vehicle → heist → collect → escape → deliver → talk | Authored; full mission playthrough unrun |

### Act 2: DANGEROUS CONNECTIONS

The underground has a price. Someone has already paid it.

| ID | Mission | Objectives | Authorship / validation status |
| --- | --- | --- | --- |
| m09 | THE FIXER | combat → investigate → talk → choice | Authored; full mission playthrough unrun |
| m10 | EAST SPAN RUN | acquire vehicle → collect → drive route → deliver → talk | Authored; full mission playthrough unrun |
| m11 | COLD STORAGE | stealth → investigate → collect → deliver → talk | Authored; full mission playthrough unrun |
| m12 | THE AMBUSH | combat → collect → chase → escape → deliver → talk | Authored; full mission playthrough unrun |
| m13 | UNDERGROUND FREQUENCY | collect → deliver → defend → talk → choice | Authored; full mission playthrough unrun |
| m14 | NORTH OF THE LIGHTS | stealth → investigate → collect → drive route → deliver | Authored; full mission playthrough unrun |
| m15 | PAYROLL PARADOX | investigate → acquire vehicle → chase → heist → collect → escape → deliver | Authored; full mission playthrough unrun |
| m16 | SPLIT SIGNAL | drive route → interact → defend → investigate → choice | Authored; full mission playthrough unrun |

### Act 3: BUILDING AN EMPIRE

Build a network, take Meridian’s money, discover what it funds.

| ID | Mission | Objectives | Authorship / validation status |
| --- | --- | --- | --- |
| m17 | AN OLD DEBT | stealth → investigate → collect → escape → deliver → talk | Authored; full mission playthrough unrun |
| m18 | A ROOM OF ONE’S OWN | combat → collect → escort → deliver → choice | Authored; full mission playthrough unrun |
| m19 | COLLATERAL NOISE | escort → defend → talk → choice | Authored; full mission playthrough unrun |
| m20 | ROUTE TO RESPECT | acquire vehicle → race → interact → drive route → talk | Authored; full mission playthrough unrun |
| m21 | EMPTY APARTMENT | investigate → combat → escort → talk | Authored; full mission playthrough unrun |
| m22 | FAMILY RECEIPTS | stealth → collect → escape → deliver → talk | Authored; full mission playthrough unrun |
| m23 | THE THREE KEYS | collect → deliver → escort → defend → talk | Authored; full mission playthrough unrun |
| m24 | GLASS HOUSES | investigate → acquire vehicle → heist → collect → race → deliver → talk | Authored; full mission playthrough unrun |

### Act 4: THE CITY TURNS AGAINST YOU

Save the people behind the evidence before the city buries them.

| ID | Mission | Objectives | Authorship / validation status |
| --- | --- | --- | --- |
| m25 | EVICTION NOTICE | defend → escort → talk → choice | Authored; full mission playthrough unrun |
| m26 | THE WITNESS | combat → escort → investigate → choice | Authored; full mission playthrough unrun |
| m27 | FALSE FLAG | combat → chase → collect → escape → deliver → talk | Authored; full mission playthrough unrun |
| m28 | KNOCK KNOCK | stealth → collect → escape → deliver → defend | Authored; full mission playthrough unrun |
| m29 | LIQUID ASSETS | investigate → acquire vehicle → heist → collect → escape → deliver → choice | Authored; full mission playthrough unrun |
| m30 | BACKUP FREQUENCY | collect → drive route → defend → deliver → talk | Authored; full mission playthrough unrun |
| m31 | THE WHOLE TRUTH | investigate → talk → choice → collect → deliver | Authored; full mission playthrough unrun |
| m32 | THE LONG NIGHT | combat → escort → defend → talk → choice | Authored; full mission playthrough unrun |

### Act 5: THE GLOWPORT FINALE

One operation. Five districts. Decide who gets to own the truth.

| ID | Mission | Objectives | Authorship / validation status |
| --- | --- | --- | --- |
| m33 | FIVE DISTRICTS, ONE CITY | acquire vehicle → drive route → collect → drive route → deliver → defend | Authored; full mission playthrough unrun |
| m34 | BAD RECEPTION | investigate → interact → combat → interact → talk | Authored; full mission playthrough unrun |
| m35 | NO MAN’S LAND | combat → escort → talk → collect → choice | Authored; full mission playthrough unrun |
| m36 | CLEAN HANDS | stealth → heist → collect → escape → deliver → talk | Authored; full mission playthrough unrun |
| m37 | OPEN CHANNELS | defend → escort → investigate → talk | Authored; full mission playthrough unrun |
| m38 | ONE LAST EXIT | acquire vehicle → collect → race → deliver → choice | Authored; full mission playthrough unrun |
| m39 | PROOF AGAINST POWER | investigate → collect → deliver → talk | Authored; full mission playthrough unrun |
| m40 | GLOWPORT RISING | acquire vehicle → drive route → heist → combat → escape → escort → choice | Authored; full mission playthrough unrun |

## Finale and consequences

The finale offers three explicit ending receipts, followed by free roam:

| Ending | Choice | Result |
| --- | --- | --- |
| broadcast | Publish the archive and return the reserve | Meridian’s charter is exposed; witnesses retain agency; the city has the public record. |
| control | Keep SIREN under the crew’s authority | Evictions stop, but power and accountability become the crew’s unfinished conflict. |
| deal | Take Vale’s settlement and protect the crew | Witnesses survive, Meridian remains, and hidden copies keep a future challenge possible. |

Earlier decisions persist flags for Jax’s role, the first broadcast, crew secrecy, shelter policy, gang alliance, witness privacy, reserve allocation, Vee’s authority, Hollis’s treatment, and evacuation priority. Persistent flags are authored in the catalogue. The host game must apply visible reactions/reward modifiers; their existence alone does not establish branching gameplay.

## Legacy integration

The old twenty-one-chapter save sequence maps to expanded zero-based mission indices:

`[0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 15, 16, 25, 26, 29, 30, 39]`

Old “No Signal Lost” and “Split Signal” are combined in m16. Completed legacy campaigns require explicit host migration rather than indexing beyond this map. Legacy tutorial cash rewards remain in the original tested code; the catalogue pays zero additional cash for m01–m06 to avoid duplicate rewards.

## Side stories and encounters

Optional-story and random-encounter catalogues are separate modules. Their acceptance, cooldown, unlock, and test status must be tracked by the integration report. Do not count authored optional definitions as played content or multiply estimated minutes to manufacture a campaign-length claim.

## Remaining campaign validation

- Complete a new save from m01 through m40 without calling mission-completion helpers.
- Verify all heists, escort survival, chase loss/retry, stealth detection, drive checkpoints, wanted-state escapes, and death handling.
- Save/reload in every objective family and at checkpoint failures.
- Exercise all three finales and keep free roam available afterward.
- Verify earlier choice flags produce the host game’s documented consequences.
- Measure actual human playtime, pacing, repetition, and difficulty before quoting duration.
