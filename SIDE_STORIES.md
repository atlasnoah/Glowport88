# Glowport side stories and street encounters

This catalogue contains 20 authored optional mission definitions and 20 contextual encounter definitions. It preserves the current art, map, locations, and sprite sheets. The game uses the same mission evaluator for main stories, side stories, and accepted encounters. These are implemented data definitions; browser playability must be established by the integrated mission-handler tests. No campaign-duration claim is made here.

## Recurring contacts

Each contact has four linked missions. The first unlocks in Act I; later jobs require the previous job and an Act II–V progression gate. A contact's final decision is recorded in persistent flags. Rewards apply after successful objectives, rather than when a job is simply selected.

| Contact | Mission | Gate | Main mechanics |
| --- | --- | --- | --- |
| Darla Diamond | Darla Returns the Package | Act I | Collect a master tape, timed checkpoint drive, defend a street show, conversation |
| Darla Diamond | Wardrobe Malfunction | Act II | Investigate a shipment, infiltrate, recover costumes, vehicle delivery |
| Darla Diamond | Stunt Double Entry | Act III | Acquire a car, checkpoint race, protect a film crew, lose pursuit |
| Darla Diamond | One Last Comeback | Act IV | Investigate contract fraud, archive heist, broadcast delivery, rights decision |
| Bobby Two-Cars | Two Cars, One Brain | Act I | Acquire a car, recover duplicate titles, checkpoint drive, handover |
| Bobby Two-Cars | The Wrong Hearse | Act II | Trace medical supplies, infiltrate a seized-vehicle bay, return a cooler |
| Bobby Two-Cars | VIN and Vengeance | Act III | Decode impound records, retrieve keys, chase/intercept a transport, defend a recovery |
| Bobby Two-Cars | One Honest Car | Act IV | Records heist, security fight, delivery route, restitution decision |
| Uncle Static | Domestic Surveillance | Act I | Inspect appliances, collect a decoder, deliver it, decide how to use evidence |
| Uncle Static | The Toaster Has Lawyers | Act II | Salvage equipment, infiltrate, copy a frequency table, timed drive |
| Uncle Static | Tin-Foil Convoy | Act III | Acquire transport, escort a witness, defend a motel, revelation |
| Uncle Static | Everything Is Listening | Act IV | Reconstruct surveillance, archive heist, fight a cleanup team, privacy decision |
| Miss Violet | Tea and Consequences | Act I | Collect receipts, deliver a tea tin, stop debt collectors, character introduction |
| Miss Violet | Pension Plan | Act II | Investigate relief payments, infiltrate payroll office, recover and return funds |
| Miss Violet | Old Girls’ Network | Act III | Acquire a car, move a witness, protect a motel, deliver and protect a statement |
| Miss Violet | A Quiet Retirement | Act IV | Retrieve a key, vault heist, escape pursuit, return a ledger, closure |
| DJ Sol | A Song for the Block | Act I | Collect a tape, repair a broadcast path through clues, defend the station |
| DJ Sol | Borrowed Airwaves | Act II | Infiltrate a tower, copy calibration, timed drive, escort an engineer |
| DJ Sol | Dead Man’s Request | Act III | Decode a worker's message, stop a security team, escape, deliver testimony |
| DJ Sol | The Last Request Show | Act V | Retrieve testimony, broadcast heist, defend transmission, witness-privacy decision |

There are 89 side-story stages. Side missions follow playable sequences; introductory or final conversations accompany mechanical objectives rather than substituting for every objective. Resolution choices include explicit donation/fee and reputation tradeoffs, in addition to preserving different values in `darla_finale`, `bobby_finale`, `static_finale`, `violet_witness`, and `sol_finale`.

## Contextual encounters

Each event has a unique category, district restrictions, an act gate, a per-type cooldown, and a rarity weight. All are repeatable with separate engine run identifiers. A sampled event must appear naturally during exploration; ignoring its world marker does not force acceptance or penalize the player. Accepted events can offer help, refusal, exploitation, or paid settlement where appropriate.

| Category | Event | District | Gameplay after intervention |
| --- | --- | --- | --- |
| Mugging | Not Your Wallet | Sunset | Stop two muggers or exploit a dropped bag |
| Passing pursuit | Lights in the Rearview | Eastside | Chase the company pursuit car, then escape |
| Ride request | One Last Bus | Sunset | Escort a night worker to the clinic |
| Store robbery | Open Late, Very Late | Eastside | Defend a shopkeeper from robbers |
| Car theft | Borrowed Without Asking | Downtown | Recover and return a stolen key envelope |
| Suspicious vehicle | Nothing to See Here | Eastside | Investigate a mislabelled medical shipment |
| Gang ambush | Wrong Turn, Right People | Eastside | Break a collection crew's ambush |
| Medical help | Minutes Matter | Palm South | Recover medicine and return it, or fund a replacement |
| Stranded driver | The Lawn-Mower Engine | Eastside | Collect and deliver a replacement relay |
| Street race | No Entry Fee, Allegedly | Palm South | Beat a short checkpoint time |
| Street brawl | You Owe Me a Chair | Downtown | Protect staff or pay to settle the dispute |
| Drunk pedestrian | The Mayor Is a Traffic Cone | Downtown | Escort a philosopher home or fund coffee and a call |
| Armored convoy | Heavy Metal Payroll | Eastside | Intercept security transport and extract payroll evidence |
| Corrupt officer | Cash or Citation | Downtown | Investigate the shakedown ledger or pay the bribe |
| Illegal delivery | Do Not Shake the Box | Eastside | Deliver a suspicious parcel or divert it to investigators |
| Lost tourist | The Scenic Route | Crescent | Escort a tourist, provide directions, or sell an overpriced map |
| Rival gang attack | Somebody Else’s Beef | Sunset | Protect and escort an innocent delivery driver |
| Runaway driver | No Questions, Please | Sunset | Escort an employee and break contact, or betray them |
| Nightclub dispute | Guest List of One | Downtown | Recover a fake promoter's contract or fund a cab |
| Bizarre opportunity | The Future of Refrigeration | Downtown | Investigate stolen bond certificates and deliver evidence |

There are 51 encounter stages. Event base cash rewards are zero: accepting a help option does not pay for work that has not happened. Actual final gameplay stages carry the assistance reward. Refusal branches can complete without reward; exploitation or paid-settlement options carry their explicit money/reputation consequence. Engine per-run claims prevent checkpoint replay from duplicating those rewards.

## Integration contract

`window.GlowportSideContent` exports `missions`, `events`, and `contacts`. Standard mission fields are `id`, `kind`, `title`, `requires`, `intro`, `stages`, and `reward`. Side missions add `contact` and `actUnlock`. Events add `category`, `where`, `districts`, `minAct`, `cooldown`, `rarity`, and `repeatable:true`.

Stage and choice `nextStage` can point to a later stage ID/index or `complete`. `givesItem` grants evidence only after a successful stage or accepted choice; `deliver.item` must be checked against inventory. Collect stages use their own `item`. These acquisition and handover rules prevent an unearned delivery from completing a mission.

Static validation checks catalogue counts, links, supported mechanics, location names, and branch targets. Full execution requires the root adapter's actual movement, driving, combat, interaction, inventory, and failure handlers. This document does not claim those browser scenarios passed before integration.

## Validation performed during integration

A static inventory/branch walk across all 80 main/side/event definitions found 141 complete paths and no missing item acquisitions or invalid branch targets. A conservative room-grid search found an accessible interaction-radius approach for all 78 investigation nodes. These are structural checks, not a campaign playthrough. A real Chromium scenario completed `side-static-1` through ordered clue dialogues, decoder collection, delivery/consumption, final choice, and one $300 reward without browser errors. Fixture positioning skipped travel; objective handlers were exercised through actual E/Enter input.
