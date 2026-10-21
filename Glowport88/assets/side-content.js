/* Original authored side stories and contextual encounter catalogue.
 * These definitions use the same playable stage handlers as the main campaign.
 * Availability is progression-gated; encounters are sampled by district/cooldown.
 * Content data is not evidence of an end-to-end playtest or a duration estimate.
 */
window.GlowportSideContent=(()=>{
'use strict';
const say=(speaker,text)=>[{speaker,text}];
const stage=(type,where,label,extra={})=>({type,where,label,...extra});
const clues=(a,b,c)=>[
 {x:211,y:223,label:a[0],text:a[1]},
 {x:651,y:195,label:b[0],text:b[1]},
 {x:403,y:149,label:c[0],text:c[1]}
];
const choice=(label,flag,value,extra={})=>({label,flag,value,...extra});
function story(contact,key,n,title,actUnlock,intro,stages,cash,reputation=2){
 const id=`side-${key}-${n}`;
 return {id,kind:'side',title,contact,actUnlock,requires:n>1?[`side-${key}-${n-1}`]:[],intro:say(contact,intro),stages:stages.map((s,i)=>({id:`${id}-s${i+1}`,...s})),reward:{cash,reputation}};
}
const missions=[
 story('Darla Diamond','darla',1,'Darla Returns the Package',1,
  'My comeback needs a master tape, a crowd, and a driver who understands that publicity is legally distinct from evidence.',[
   stage('collect','records','Collect Darla’s surviving demo tape',{item:'darla-demo',text:'Jax finds the tape under COMEBACKS / UNSORTED. There is a lot of dust in that section.'}),
   stage('drive_route','club','Get the demo to the club before the support act finishes',{checkpoints:2,timeLimit:180,checkpoint:true}),
   stage('defend','club','Keep Meridian’s hired wreckers away from the street show',{count:2,duration:12,dialogue:say('DARLA','Those are not critics. Critics rarely arrive carrying tire irons.')}),
   stage('talk','club','Hear Darla’s first honest review',{speaker:'DARLA',text:'Three people clapped. One was a pigeon. I am counting the pigeon. Come back when I have a wardrobe budget.'})
  ],250),
 story('Darla Diamond','darla',2,'Wardrobe Malfunction',2,
  'Someone sold my stage clothes to a Meridian contractor. I can perform without dignity. I cannot perform without trousers.',[
   stage('investigate','warehouse','Trace the missing costume shipment',{inside:true,clues:clues(['DELIVERY LABEL','Darla’s costume cases were relabelled as executive upholstery.'],['RETURN SLIP','The return address is a shell company renting the club’s back room.'],['INVOICE','The invoice includes an extortion fee disguised as sequins.'])}),
   stage('stealth','warehouse','Slip past the loading crew without starting a gunfight',{inside:false,timeLimit:100,checkpoint:true}),
   stage('collect','warehouse','Recover the labelled costume case',{item:'darla-costume',text:'There are seventeen feather boas and a surprisingly serious contract inside.'}),
   stage('deliver','club','Return the costumes intact',{item:'darla-costume',needsCar:true}),
   stage('talk','club','Let Darla read the extortion invoice',{speaker:'DARLA',text:'They bought the venue to silence the neighborhood. The rhinestones were collateral damage. We are going to make them regret both.'})
  ],480),
 story('Darla Diamond','darla',3,'Stunt Double Entry',3,
  'The producer wants a dangerous chase. I want a producer with a conscience. Today we may have to settle for the chase.',[
   stage('acquire_vehicle','club','Find a working car for Darla’s location shoot'),
   stage('race','observatory','Hit the camera checkpoints before the light changes',{checkpoints:3,timeLimit:155,checkpoint:true}),
   stage('defend','observatory','Protect the film crew from Meridian’s shutdown team',{count:3,duration:15}),
   stage('escape','observatory','Lose the patrol before returning to the production van',{maxWanted:0,hold:6}),
   stage('talk','observatory','Hear what the camera actually recorded',{speaker:'DARLA',text:'The stunt footage caught a payoff between the producer and city hall. My best performance this year was accidentally investigative journalism.'})
  ],750,3),
 story('Darla Diamond','darla',4,'One Last Comeback',4,
  'I found the original contract. They own my name, my voice, and apparently my emotional weather. Let us terminate a few clauses.',[
   stage('investigate','hotel','Find the original recording-rights agreement',{inside:true,clues:clues(['CONTRACT','Meridian purchased Darla’s back catalogue through a city arts charity.'],['BANK SLIP','The charity paid the producer to suppress her neighborhood benefit concert.'],['SIDE LETTER','A signed side letter lets Darla release the recording if the charity’s fraud is exposed.'])}),
   stage('heist','warehouse','Recover the producer’s unedited master archive',{inside:true,beats:4,checkpoint:true}),
   stage('drive_route','radio','Deliver the archive to an independent transmitter',{checkpoints:3,timeLimit:195}),
   stage('choice','radio','Choose what Darla puts on the air',{speaker:'DARLA',text:'We can sell the scandal and buy back my career, or release the concert free and let the whole block own it. For once, I get to choose.',choices:[
    choice('Donate $100 to release the concert free. The neighborhood gets the rights.','darla_finale','community',{reward:{cash:-100,reputation:3}}),
    choice('Sell the documentary to fund an independent label. Take the $200 editing fee.','darla_finale','independent',{reward:{cash:200,reputation:1}})
   ]}),
   stage('talk','radio','Close Darla’s comeback story',{speaker:'DARLA',text:'No manager. No borrowed spotlight. Whatever happens next, it has my real name on it. And the pigeon still gets a credit.'})
  ],1100,4),

 story('Bobby Two-Cars','bobby',1,'Two Cars, One Brain',1,
  'Good news: I sold the car. Bad news: I sold the same car twice. We need a vehicle, its paperwork, and a smaller audience.',[
   stage('acquire_vehicle','hotel','Find a getaway car Bobby can actually identify'),
   stage('collect','warehouse','Recover the duplicate title papers',{item:'bobby-titles',text:'Both titles describe a different car. Both are signed BOBBY, PROBABLY.'}),
   stage('drive_route','pier','Move the paperwork before Bobby’s buyers meet',{checkpoints:2,timeLimit:180,checkpoint:true}),
   stage('deliver','pier','Hand the duplicate titles to the harbor clerk',{item:'bobby-titles',needsCar:true})
  ],280),
 story('Bobby Two-Cars','bobby',2,'The Wrong Hearse',2,
  'I borrowed what I thought was a luxury wagon. It is a clinic supply van, and the clinic has been very specific about needing it back.',[
   stage('investigate','warehouse','Identify the missing medical shipment',{inside:true,clues:clues(['CHASSIS TAG','The vehicle’s tag matches a clinic refrigeration unit.'],['DELIVERY NOTE','The supplies were diverted by Meridian security.'],['SPARE KEY','Bobby hid the spare key inside a novelty steering-wheel lock.'])}),
   stage('stealth','warehouse','Reach the seized-vehicle bay without alerting security',{inside:false,timeLimit:110,checkpoint:true}),
   stage('collect','warehouse','Secure the clinic’s insulated supply case',{item:'clinic-cooler'}),
   stage('deliver','clinic','Return the supply case by car',{item:'clinic-cooler',needsCar:true}),
   stage('talk','clinic','Let Bobby make his first useful delivery',{speaker:'BOBBY TWO-CARS',text:'Mara said I saved somebody’s treatment. Nobody has ever thanked me for returning a vehicle before. I may need a minute.'})
  ],520),
 story('Bobby Two-Cars','bobby',3,'VIN and Vengeance',3,
  'Meridian has a ledger of every car they quietly seized from this block. I would like to steal something morally complicated for a change.',[
   stage('investigate','armory','Decode the impound markings',{inside:true,clues:clues(['VIN RUBBING','Several seized cars were taken before their owners missed a payment.'],['AUCTION LIST','All buyers lead back to the same Meridian subsidiary.'],['LOCK CODE','A recovered lock code identifies the next transport.'])}),
   stage('collect','motel','Pick up the transport keys from Bobby’s contact',{item:'transport-keys'}),
   stage('acquire_vehicle','motel','Bring a working vehicle to the intercept'),
   stage('chase','pier','Tail and stop the impound transport before it leaves the harbor',{duration:22,timeLimit:150,checkpoint:true}),
   stage('defend','pier','Keep the residents’ vehicles out of Meridian’s hands',{count:3,duration:16})
  ],820,3),
 story('Bobby Two-Cars','bobby',4,'One Honest Car',4,
  'There is enough evidence in the impound office to return every stolen title. There is also enough money to disappear. I hate having options.',[
   stage('heist','warehouse','Break into the impound records vault',{inside:true,beats:4,checkpoint:true}),
   stage('combat','warehouse','Clear the security team blocking the exit',{count:3}),
   stage('drive_route','hotel','Bring the title archive back to the residents',{checkpoints:3,timeLimit:205}),
   stage('choice','hotel','Decide what Bobby does with the recovered fleet',{speaker:'BOBBY TWO-CARS',text:'A chop shop pays today. A neighborhood repair pool might keep people on the road for years. I am asking because I do not trust my first idea.',choices:[
    choice('Put $200 into returning the titles and starting a repair pool.','bobby_finale','repair_pool',{reward:{cash:-200,reputation:3}}),
    choice('Auction the unclaimed fleet legally. Share restitution and take a $250 fee.','bobby_finale','restitution',{reward:{cash:250,reputation:1}})
   ]}),
   stage('talk','hotel','Give Bobby a reason to keep one honest car',{speaker:'BOBBY TWO-CARS',text:'I kept one car. One title. One set of keys. It is a terrifying amount of personal growth. Thanks for not letting me drive away from it.'})
  ],1250,4),

 story('Uncle Static','static',1,'Domestic Surveillance',1,
  'Your toaster has been listening. Before you say anything: this time I brought receipts. And a toaster. Do not plug it in.',[
   stage('investigate','hotel','Test Static’s suspicious household appliances',{inside:true,clues:clues(['RADIO CLOCK','The clock broadcasts a short data burst every midnight.'],['ROOM PHONE','The phone’s service label belongs to a Meridian contractor.'],['TOASTER','The toaster is ordinary. Static is disappointed. The room phone is not.'])}),
   stage('collect','records','Collect Jax’s audio-decoder cassette',{item:'static-decoder'}),
   stage('deliver','observatory','Bring the decoder to Static’s receiver',{item:'static-decoder'}),
   stage('choice','observatory','Tell Static what the evidence actually proves',{speaker:'UNCLE STATIC',text:'So the phone is a bug and the toaster is innocent. I owe a very specific kitchen appliance an apology.',choices:[
    choice('Publish the real evidence. Leave the innocent toaster alone.','static_first_case','evidence'),
    choice('Keep the bug quiet and trace who is listening.','static_first_case','trace')
   ]})
  ],300),
 story('Uncle Static','static',2,'The Toaster Has Lawyers',2,
  'Someone sent me a cease-and-desist addressed to my kitchen. They want the receiver parts. We are going to borrow better ones.',[
   stage('collect','warehouse','Pick up the discarded receiver assembly',{item:'receiver-assembly'}),
   stage('stealth','armory','Cross the monitored service lane without firing',{inside:false,timeLimit:110,checkpoint:true}),
   stage('heist','records','Extract the contractor’s frequency table',{inside:true,beats:3}),
   stage('drive_route','observatory','Get the receiver to high ground before the trace closes',{checkpoints:2,timeLimit:185})
  ],560),
 story('Uncle Static','static',3,'Tin-Foil Convoy',3,
  'A maintenance worker wants to talk. They asked for a quiet car. I offered a quiet car wrapped in foil. Negotiations continue.',[
   stage('acquire_vehicle','observatory','Find a discreet car for Static’s witness'),
   stage('escort','motel','Take the frightened maintenance worker to the motel',{fromWhere:'observatory',checkpoint:true}),
   stage('defend','motel','Protect the motel while the witness copies the service logs',{count:3,duration:18}),
   stage('talk','motel','Listen to the witness and Static',{speaker:'UNCLE STATIC',text:'The appliances were a distraction. Meridian put the real listening system in its building-maintenance network. I was almost right, which is the most exhausting kind of right.'})
  ],850,3),
 story('Uncle Static','static',4,'Everything Is Listening',4,
  'We have the network map and a maintenance key. We can burn the system down, or turn its microphones toward the people who built it.',[
   stage('investigate','observatory','Reconstruct the citywide listening network',{inside:true,clues:clues(['RELAY MAP','The network reaches clinics, apartment lobbies, and every city permit office.'],['ACCESS LOG','City officials used it to target tenants resisting eviction.'],['MASTER KEY','The maintenance key can either erase the archive or open it to the public.'])}),
   stage('heist','radio','Take control of the surveillance archive',{inside:true,beats:5,checkpoint:true}),
   stage('combat','radio','Stop the contractor’s cleanup team',{count:3}),
   stage('choice','radio','Choose the fate of Static’s listening network',{speaker:'UNCLE STATIC',text:'I spent years wishing somebody would listen. I did not mean like this. The people in those recordings deserve a say.',choices:[
    choice('Erase private recordings and publish only the evidence of abuse.','static_finale','privacy',{reward:{cash:0,reputation:3}}),
    choice('Preserve a sealed legal archive and accept a $150 chain-of-custody fee.','static_finale','justice',{reward:{cash:150,reputation:1}})
   ]})
  ],1300,4),

 story('Miss Violet','violet',1,'Tea and Consequences',1,
  'Would you fetch my tea tin from Jax? If anyone asks, we are two ordinary people doing an ordinary favor. The tin is heavier than it looks.',[
   stage('collect','records','Collect Miss Violet’s sealed tea tin',{item:'violet-tea',text:'Under the tea is a stack of original rent receipts. The tin smells faintly of bergamot and leverage.'}),
   stage('deliver','hotel','Bring the tin to Miss Violet',{item:'violet-tea'}),
   stage('combat','warehouse','Send the residents’ violent debt collectors away',{count:2,checkpoint:true}),
   stage('talk','hotel','Discover who Miss Violet used to be',{speaker:'MISS VIOLET',text:'I used to balance books for men who never read books. Now I balance the neighborhood’s accounts. Tea? Do sit where I can see the door.'})
  ],350),
 story('Miss Violet','violet',2,'Pension Plan',2,
  'The clinic’s relief fund vanished into a Meridian account. I have seen this trick before. It is less charming when it involves pensioners.',[
   stage('investigate','clinic','Follow the missing relief payments',{inside:true,clues:clues(['RECEIPTS','The clinic received donations that never reached its accounts.'],['BILLING CODE','A false billing code routes the money to a freight subsidiary.'],['TRANSFER ORDER','The next withdrawal is scheduled at Dockside 88.'])}),
   stage('stealth','warehouse','Reach the payroll office before the transfer',{inside:false,timeLimit:105,checkpoint:true}),
   stage('heist','warehouse','Recover the diverted clinic payroll',{inside:true,beats:4,givesItem:'clinic-payroll'}),
   stage('deliver','clinic','Return the payroll records to Dr. Mara',{item:'clinic-payroll'})
  ],650),
 story('Miss Violet','violet',3,'Old Girls’ Network',3,
  'An old friend wants out of city hall. I promised a ride, not a rescue operation. Do keep your schedule flexible.',[
   stage('acquire_vehicle','hotel','Bring a working car for Violet’s city-hall contact'),
   stage('escort','motel','Move the contact from the hotel to a quiet room',{fromWhere:'hotel',checkpoint:true}),
   stage('defend','motel','Hold off the men trying to retrieve the contact',{count:3,duration:17}),
   stage('drive_route','radio','Get the sworn statement to an independent witness',{checkpoints:2,timeLimit:185}),
   stage('choice','radio','Choose how Violet protects her old friend',{speaker:'MISS VIOLET',text:'A public statement makes her a target. A sealed one gives the courts a chance. Both are better than letting her disappear.',choices:[
    choice('Release a redacted statement and protect the witness’s name.','violet_witness','redacted',{reward:{cash:0,reputation:2}}),
    choice('Seal the statement with the legal volunteers; collect the $100 courier fee.','violet_witness','sealed',{reward:{cash:100,reputation:1}})
   ]})
  ],980,3),
 story('Miss Violet','violet',4,'A Quiet Retirement',4,
  'There is one ledger I never gave back when I left the business. Meridian found it. I would rather they did not discover my annotations.',[
   stage('collect','pier','Collect Violet’s old vault key',{item:'violet-vault-key'}),
   stage('heist','warehouse','Recover Violet’s annotated account ledger',{inside:true,beats:5,checkpoint:true}),
   stage('escape','warehouse','Break contact with the pursuit before returning home',{maxWanted:0,hold:8}),
   stage('drive_route','hotel','Bring the ledger back to Violet',{checkpoints:3,timeLimit:215}),
   stage('talk','hotel','Help Violet close the last account',{speaker:'MISS VIOLET',text:'Every stolen payment is accounted for. The rest is for the people who lived through it. I think I shall retire properly now. On Thursdays, at least.'})
  ],1500,4),

 story('DJ Sol','sol',1,'A Song for the Block',1,
  'Meridian bought the station’s advertising minutes and used them to silence a tenant benefit. Bring me the demo. We will find our own airtime.',[
   stage('collect','records','Collect the neighborhood benefit master tape',{item:'sol-benefit-tape'}),
   stage('investigate','radio','Find a clean path through the station’s old equipment',{inside:true,clues:clues(['PATCH BAY','The public channel has been rerouted into a dead input.'],['POWER UNIT','A service switch will bring the old transmitter online.'],['TAPE DECK','The benefit tape is cued. The station finally sounds like the neighborhood.'])}),
   stage('defend','radio','Keep the broadcast on while the shutdown crew arrives',{count:2,duration:14,checkpoint:true}),
   stage('talk','radio','Listen to Sol sign off the first independent show',{speaker:'DJ SOL',text:'That was not a ratings win. It was a window opening. Same time next week, assuming we still own a window.'})
  ],320),
 story('DJ Sol','sol',2,'Borrowed Airwaves',2,
  'The tower has a second transmitter Meridian forgot to buy. We need its calibration code, a fast driver, and somebody willing to sing over static.',[
   stage('stealth','observatory','Reach the service entrance without drawing gunfire',{inside:false,timeLimit:110}),
   stage('heist','observatory','Copy the backup transmitter’s calibration code',{inside:true,beats:4,checkpoint:true}),
   stage('drive_route','club','Get the code to Sol’s live sound crew',{checkpoints:2,timeLimit:180}),
   stage('escort','radio','Bring the engineer safely back to the radio station',{fromWhere:'club'})
  ],650),
 story('DJ Sol','sol',3,'Dead Man’s Request',3,
  'A dockworker left me a request before disappearing. The song is a message. Find the other half before somebody erases the chorus.',[
   stage('investigate','warehouse','Decode the dockworker’s hidden message',{inside:true,givesItem:'dockworker-recording',clues:clues(['REQUEST SLIP','The request’s numbers match freight container seals.'],['VOICE MEMO','The worker recorded a threat from a Meridian supervisor.'],['DELIVERY ADDRESS','The surviving witness is being treated at Marina Clinic.'])}),
   stage('combat','radio','Stop the security crew hunting the recording',{count:3,checkpoint:true}),
   stage('escape','radio','Shake the pursuit before contacting the witness',{maxWanted:0,hold:6}),
   stage('deliver','clinic','Deliver the protected voice recording to the witness',{item:'dockworker-recording'})
  ],1000,3),
 story('DJ Sol','sol',4,'The Last Request Show',5,
  'We have names, voices, and one last clean frequency. I can make them hear everything. Help me make sure we do not turn the victims into another spectacle.',[
   stage('collect','records','Collect the final backup of the testimony',{item:'sol-final-broadcast'}),
   stage('heist','radio','Put the independent broadcast onto the emergency channel',{inside:true,beats:5,checkpoint:true}),
   stage('defend','radio','Keep the transmission alive through Meridian’s final interruption',{count:4,duration:22}),
   stage('choice','radio','Choose the form of Sol’s final broadcast',{speaker:'DJ SOL',text:'The city deserves the truth. The witnesses deserve a life afterward. Tell me where the line belongs.',choices:[
    choice('Broadcast verified evidence and protect the witnesses’ identities.','sol_finale','protected_truth',{reward:{cash:0,reputation:3}}),
    choice('Let the witnesses speak in their own words; take the $100 editing fee.','sol_finale','witness_voices',{reward:{cash:100,reputation:2}})
   ]}),
   stage('talk','radio','Stay for Sol’s final dedication',{speaker:'DJ SOL',text:'This one goes out to everyone who thought nobody was listening. Glowport, you have been heard. Try calling your mother before the next revolution.'})
  ],1800,5)
];

function encounter(id,category,title,where,districts,minAct,cooldown,rarity,intro,stages){
 const fullId=`event-${id}`;
 return {id:fullId,category,title,where,districts,minAct,cooldown,rarity,kind:'event',repeatable:true,requires:[],intro:say('STREET RADIO',intro),stages:stages.map((s,i)=>({id:`${fullId}-s${i+1}`,...s})),reward:{cash:0,reputation:0}};
}
const events=[
 encounter('mugging','mugging','Not Your Wallet','arcade',['west'],1,260,5,
  'Two men have cornered a courier outside the arcade. Nobody nearby is pretending convincingly not to notice.',[
   stage('choice','arcade','Decide whether to intervene',{speaker:'COURIER',text:'That bag has my whole week in it. Please.',choices:[
    choice('Step between the courier and the muggers.','event_mugging','help'),
    choice('Pocket the dropped cash and leave.','event_mugging','exploit',{nextStage:'complete',reward:{cash:45,reputation:-2}}),
    choice('Keep walking.','event_mugging','ignored',{nextStage:'complete'})
   ]}),
   stage('combat','arcade','Drive off the two muggers',{count:2,reward:{cash:110,reputation:2}})
  ]),
 encounter('passing-pursuit','passing_pursuit','Lights in the Rearview','diner',['east'],2,420,3,
  'A shaken driver has pulled in ahead of a patrol. The passenger is clutching a stack of eviction notices.',[
   stage('choice','diner','Choose whether to distract the pursuit',{speaker:'RUNAWAY DRIVER',text:'They called these stolen documents. They are my neighbors’ leases.',choices:[
    choice('Draw the patrol away so the residents can leave.','event_pursuit','distract'),
    choice('Report the car to the patrol.','event_pursuit','reported',{nextStage:'complete',reward:{cash:40,reputation:-1}}),
    choice('Stay clear of the chase.','event_pursuit','ignored',{nextStage:'complete'})
   ]}),
   stage('chase','motel','Tail and stop the company pursuit car while the residents escape',{duration:18,timeLimit:145}),
   stage('escape','motel','Break contact after the residents get away',{maxWanted:0,hold:6,reward:{cash:180,reputation:2}})
  ]),
 encounter('ride-request','ride_request','One Last Bus','motel',['west'],1,300,5,
  'The last bus never arrived. A tired night-shift worker is trying not to panic outside Palm Motel.',[
   stage('choice','motel','Answer the stranded worker',{speaker:'NIGHT WORKER',text:'I can pay a little. I just need to get to the clinic before my shift starts.',choices:[
    choice('Offer a fair ride to the clinic.','event_ride','help'),
    choice('Charge an outrageous emergency fare.','event_ride','exploit',{reward:{cash:45,reputation:-1}}),
    choice('Apologize and leave.','event_ride','ignored',{nextStage:'complete'})
   ]}),
   stage('escort','clinic','Take the worker from the motel to the clinic',{fromWhere:'motel',reward:{cash:65,reputation:1}})
  ]),
 encounter('store-robbery','store_robbery','Open Late, Very Late','diner',['east'],2,460,3,
  'A panicked shopkeeper is waving from the diner entrance. Two robbers have decided closing time is negotiable.',[
   stage('choice','diner','Respond to the robbery',{speaker:'SHOPKEEPER',text:'Please stop them before they hurt somebody.',choices:[
    choice('Help the shopkeeper hold the doorway.','event_robbery','help'),
    choice('Take a cut of the till and walk away.','event_robbery','complicit',{nextStage:'complete',reward:{cash:100,reputation:-3}}),
    choice('Leave before the shooting starts.','event_robbery','ignored',{nextStage:'complete'})
   ]}),
   stage('defend','diner','Protect the shop until the robbery crew retreats',{count:2,duration:12,reward:{cash:145,reputation:2}})
  ]),
 encounter('car-thief','car_theft','Borrowed Without Asking','hotel',['core'],1,340,4,
  'A resident spots somebody testing the locks on her parked car. The stranger insists he is an automotive poet.',[
   stage('choice','hotel','Choose a side in the parking dispute',{speaker:'CAR OWNER',text:'I know my keys are not in his hand. I am holding them.',choices:[
    choice('Recover the owner’s spare-key envelope.','event_car_theft','help'),
    choice('Sell the thief a convincing diversion.','event_car_theft','accomplice',{nextStage:'complete',reward:{cash:60,reputation:-2}}),
    choice('Refuse to get involved.','event_car_theft','ignored',{nextStage:'complete'})
   ]}),
   stage('collect','records','Recover the discarded key envelope',{item:'event-spare-keys'}),
   stage('deliver','hotel','Return the keys to the owner',{item:'event-spare-keys',reward:{cash:90,reputation:2}})
  ]),
 encounter('suspicious-van','suspicious_vehicle','Nothing to See Here','warehouse',['east'],2,480,3,
  'A refrigeration van is idling with no driver. The cargo paperwork has three different destinations and one suspicious smell.',[
   stage('choice','warehouse','Decide what to do with the abandoned van',{speaker:'DOCKHAND',text:'If that is fish, it has a very expensive security seal.',choices:[
    choice('Inspect the shipping paperwork.','event_van','investigate'),
    choice('Sell the location to a freight broker.','event_van','sold',{nextStage:'complete',reward:{cash:85,reputation:-1}}),
    choice('Leave the seal untouched.','event_van','ignored',{nextStage:'complete'})
   ]}),
   stage('investigate','warehouse','Identify the van’s real cargo',{inside:true,clues:clues(['SEAL','The security seal is for a medical contractor.'],['TEMPERATURE LOG','The cargo is a shipment of stolen clinic supplies.'],['MANIFEST','The destination is an unauthorized Meridian cold store.']),reward:{cash:125,reputation:2}})
  ]),
 encounter('alley-ambush','gang_ambush','Wrong Turn, Right People','warehouse',['east'],3,600,2,
  'A cargo runner has been boxed in by a gang collection crew. The runner is trying to look like a stack of crates.',[
   stage('choice','warehouse','Choose whether to help the runner',{speaker:'CARGO RUNNER',text:'I have forty dollars and a sandwich. Apparently that was not the agreed protection payment.',choices:[
    choice('Break the collection crew’s ambush.','event_ambush','help'),
    choice('Warn the crew that police are nearby and take a finder’s fee.','event_ambush','brokered',{nextStage:'complete',reward:{cash:55,reputation:-1}}),
    choice('Leave the alley alone.','event_ambush','ignored',{nextStage:'complete'})
   ]}),
   stage('combat','warehouse','Clear the gang’s ambush positions',{count:3,reward:{cash:160,reputation:2}})
  ]),
 encounter('medical-help','medical_assistance','Minutes Matter','clinic',['south'],1,360,5,
  'A civilian has collapsed near the clinic. Their friend is searching every empty pocket for the inhaler.',[
   stage('choice','clinic','Help the collapsed civilian',{speaker:'FRIEND',text:'Their medicine is in the coat we left at the diner. Please hurry.',choices:[
    choice('Go for the medicine.','event_medical','help'),
    choice('Pay for replacement medicine from the clinic.','event_medical','paid',{nextStage:'complete',reward:{cash:-50,reputation:2}}),
    choice('Leave the staff to handle it.','event_medical','ignored',{nextStage:'complete'})
   ]}),
   stage('collect','diner','Collect the inhaler from the lost-property box',{item:'event-inhaler',timeLimit:120}),
   stage('deliver','clinic','Get the medicine back to the clinic',{item:'event-inhaler',reward:{cash:60,reputation:3}})
  ]),
 encounter('stranded-driver','stranded_driver','The Lawn-Mower Engine','diner',['east'],1,300,5,
  'A driver’s engine is making the sound of a divorced lawn mower. The driver has reached the bargaining stage of grief.',[
   stage('choice','diner','Answer the stranded driver',{speaker:'STRANDED DRIVER',text:'A replacement relay is waiting by the freight office. I can pay you to fetch it.',choices:[
    choice('Fetch the replacement relay.','event_breakdown','help'),
    choice('Fetch it, but charge an emergency-service premium.','event_breakdown','premium',{reward:{cash:35,reputation:-1}}),
    choice('Keep moving.','event_breakdown','ignored',{nextStage:'complete'})
   ]}),
   stage('collect','warehouse','Collect the replacement engine relay',{item:'event-engine-relay'}),
   stage('deliver','diner','Return the relay to the driver',{item:'event-engine-relay',reward:{cash:140,reputation:1}})
  ]),
 encounter('street-race','street_race','No Entry Fee, Allegedly','pier',['south'],2,540,3,
  'A local racer offers a short point-to-point run. The trophy is a plastic flamingo with a surprisingly threatening expression.',[
   stage('choice','pier','Accept or refuse the street race',{speaker:'LOCAL RACER',text:'Three checkpoints. Clean driving. Please do not hit the flamingo; it has seniority.',choices:[
    choice('Take the race.','event_race','accepted'),
    choice('Decline the invitation.','event_race','declined',{nextStage:'complete'})
   ]}),
   stage('race','observatory','Beat the racer’s checkpoint time',{checkpoints:3,timeLimit:145,reward:{cash:220,reputation:2}})
  ]),
 encounter('street-argument','street_brawl','You Owe Me a Chair','club',['core'],2,380,4,
  'An argument over a borrowed chair has acquired spectators and two very committed troublemakers.',[
   stage('choice','club','Decide how to end the argument',{speaker:'BAR OWNER',text:'I own eight chairs. After tonight I may own six chairs and a witness statement.',choices:[
    choice('Protect the staff while they clear the pavement.','event_brawl','protect'),
    choice('Pay for a replacement chair and settle the dispute.','event_brawl','settled',{nextStage:'complete',reward:{cash:-35,reputation:2}}),
    choice('Leave them to argue.','event_brawl','ignored',{nextStage:'complete'})
   ]}),
   stage('defend','club','Keep the troublemakers away from the staff',{count:2,duration:10,reward:{cash:100,reputation:1}})
  ]),
 encounter('drunk-philosopher','drunk_pedestrian','The Mayor Is a Traffic Cone','club',['core'],1,420,4,
  'A very drunk pedestrian is delivering a passionate speech to a traffic cone. The cone is polling well.',[
   stage('choice','club','Deal with the sidewalk philosopher',{speaker:'SIDEWALK PHILOSOPHER',text:'This orange fellow is the only public servant who has ever listened to me. Help me get him home.',choices:[
    choice('Walk the philosopher safely to the motel.','event_drunk','help'),
    choice('Buy them a coffee and call a friend.','event_drunk','coffee',{nextStage:'complete',reward:{cash:-15,reputation:1}}),
    choice('Let the debate continue.','event_drunk','ignored',{nextStage:'complete'})
   ]}),
   stage('escort','motel','Get the philosopher home without another election',{fromWhere:'club',reward:{cash:50,reputation:2}})
  ]),
 encounter('security-convoy','armored_convoy','Heavy Metal Payroll','warehouse',['east'],3,720,1,
  'An armored security crew has stopped beside an unmarked payroll case. A dockworker recognizes the clinic relief-fund seal.',[
   stage('choice','warehouse','Decide whether to intercept the payroll',{speaker:'DOCKWORKER',text:'That money was donated for treatment. It is leaving in a truck with better armor than the clinic roof.',choices:[
    choice('Intercept the payroll transfer.','event_convoy','intercept'),
    choice('Report the transfer to the clinic’s legal volunteers.','event_convoy','reported',{nextStage:'complete',reward:{cash:35,reputation:1}}),
    choice('Leave the convoy alone.','event_convoy','ignored',{nextStage:'complete'})
   ]}),
   stage('chase','warehouse','Intercept the armored payroll escort and obtain its route case',{duration:22,timeLimit:155}),
   stage('heist','warehouse','Extract the relief-fund transfer records from the convoy office',{inside:true,beats:4,reward:{cash:260,reputation:3}})
  ]),
 encounter('shakedown','corrupt_officer','Cash or Citation','armory',['core'],2,600,2,
  'An officer has invented a parking violation while standing beside a perfectly legal bicycle.',[
   stage('choice','armory','Respond to the officer’s shakedown',{speaker:'CORRUPT OFFICER',text:'There is the written rule, and then there is the convenient cash interpretation.',choices:[
    choice('Pay the bribe and end the stop.','event_shakedown','paid',{nextStage:'complete',reward:{cash:-80,reputation:-1}}),
    choice('Recover the officer’s payment ledger.','event_shakedown','evidence'),
    choice('Refuse and leave the area.','event_shakedown','refused',{nextStage:'complete'})
   ]}),
   stage('stealth','armory','Reach the officer’s service locker without drawing attention',{inside:false,timeLimit:90}),
   stage('collect','armory','Copy the bribe-payment page',{item:'event-bribe-ledger',reward:{cash:140,reputation:2}})
  ]),
 encounter('illegal-parcel','illegal_delivery','Do Not Shake the Box','warehouse',['east'],2,450,3,
  'A courier offers a sealed parcel and an explanation that gets less convincing with every sentence.',[
   stage('choice','warehouse','Choose how to handle the suspicious parcel',{speaker:'PARCEL COURIER',text:'It is completely legal if nobody asks what it is. That is how legal works, right?',choices:[
    choice('Take the delivery and learn who is paying.','event_parcel','accepted',{givesItem:'event-suspicious-parcel'}),
    choice('Hand the parcel to the clinic’s investigators instead.','event_parcel','evidence',{nextStage:'event-illegal-parcel-evidence',givesItem:'event-suspicious-parcel'}),
    choice('Refuse the job.','event_parcel','declined',{nextStage:'complete'})
   ]}),
   stage('deliver','pier','Deliver the sealed parcel to the harbor contact',{item:'event-suspicious-parcel',needsCar:true,reward:{cash:210,reputation:-1},nextStage:'complete'}),
   stage('deliver','clinic','Bring the parcel to the clinic’s legal volunteers',{id:'event-illegal-parcel-evidence',item:'event-suspicious-parcel',reward:{cash:90,reputation:2}})
  ]),
 encounter('lost-tourist','lost_tourist','The Scenic Route','observatory',['north'],1,360,5,
  'A tourist is holding a city map upside down and looking for a hotel that closed in 1974.',[
   stage('choice','observatory','Help the lost tourist find a real destination',{speaker:'LOST TOURIST',text:'The brochure promised a charming downtown hotel and absolutely no conspiracy. I am willing to compromise on one of those.',choices:[
    choice('Give them a safe ride to Violet Hotel.','event_tourist','help'),
    choice('Sell them a wildly overpriced corrected map.','event_tourist','map_scam',{nextStage:'complete',reward:{cash:30,reputation:-1}}),
    choice('Point them toward the nearest bus stop.','event_tourist','directions',{nextStage:'complete',reward:{cash:0,reputation:1}})
   ]}),
   stage('escort','hotel','Bring the tourist from the lookout to the hotel',{fromWhere:'observatory',reward:{cash:95,reputation:1}})
  ]),
 encounter('rival-gang','rival_gang_attack','Somebody Else’s Beef','arcade',['west'],3,660,2,
  'A rival crew has mistaken a local delivery car for a gang vehicle. The driver would like their noodle order to become less political.',[
   stage('choice','arcade','Decide whether to help the delivery driver',{speaker:'DELIVERY DRIVER',text:'These are noodles. The only turf I am defending is the bottom of the carton.',choices:[
    choice('Protect the driver while they escape.','event_rivals','help'),
    choice('Take the gang’s offered hush money.','event_rivals','paid_off',{nextStage:'complete',reward:{cash:80,reputation:-2}}),
    choice('Keep clear of the dispute.','event_rivals','ignored',{nextStage:'complete'})
   ]}),
   stage('defend','arcade','Hold the rival crew away from the car',{count:3,duration:14}),
   stage('escort','diner','Get the shaken driver back to the diner',{fromWhere:'arcade',reward:{cash:170,reputation:2}})
  ]),
 encounter('runaway-driver','runaway_driver','No Questions, Please','motel',['west'],2,540,3,
  'A driver has abandoned a company car and is trying to hide a Meridian badge under their shoe.',[
   stage('choice','motel','Answer the runaway employee',{speaker:'RUNAWAY EMPLOYEE',text:'I drove their files around for years. Today I read one. Could you get me somewhere they cannot call my manager?',choices:[
    choice('Help the employee disappear into the clinic network.','event_runaway','help'),
    choice('Sell the employee’s location back to the company.','event_runaway','betrayed',{nextStage:'complete',reward:{cash:130,reputation:-3}}),
    choice('Offer directions but stay out of it.','event_runaway','directions',{nextStage:'complete'})
   ]}),
   stage('escort','clinic','Move the employee from the motel to the clinic',{fromWhere:'motel'}),
   stage('escape','clinic','Break contact before returning to the clinic entrance',{maxWanted:0,hold:6,reward:{cash:190,reputation:3}})
  ]),
 encounter('club-dispute','nightclub_dispute','Guest List of One','club',['core'],1,400,4,
  'A bouncer is trying to eject a promoter who insists the guest list is a legally binding constitution.',[
   stage('choice','club','Resolve the argument at the nightclub',{speaker:'BOUNCER',text:'He says his cousin owns the moon. I just need the entrance clear.',choices:[
    choice('Collect the promoter’s paperwork and find out who hired him.','event_club','investigate'),
    choice('Pay for a cab and get the promoter out of everyone’s night.','event_club','cab',{nextStage:'complete',reward:{cash:-25,reputation:1}}),
    choice('Let the bouncer handle it.','event_club','ignored',{nextStage:'complete'})
   ]}),
   stage('collect','records','Recover the promoter’s real contract',{item:'event-promotion-contract'}),
   stage('deliver','club','Return the contract and expose the fake booking',{item:'event-promotion-contract',reward:{cash:105,reputation:2}})
  ]),
 encounter('bizarre-offer','bizarre_opportunity','The Future of Refrigeration','records',['core'],2,700,1,
  'A stranger in a spotless suit wants you to transport an empty cooler. The cooler has a lawyer’s business card taped to it.',[
   stage('choice','records','Decide whether to accept the suspicious opportunity',{speaker:'REFRIGERATION VISIONARY',text:'Inside this cooler is the future. Do not open it. Also, please do not mention the future to customs.',choices:[
    choice('Inspect the supposedly empty cooler first.','event_cooler','inspect'),
    choice('Take a deposit, refuse the delivery, and report the scam.','event_cooler','reported',{nextStage:'complete',reward:{cash:40,reputation:1}}),
    choice('Decline the future of refrigeration.','event_cooler','declined',{nextStage:'complete'})
   ]}),
   stage('investigate','records','Identify the cooler’s improbable contents',{inside:true,givesItem:'event-cooler-bonds',clues:clues(['BUSINESS CARD','The business card belongs to a company that ceased existing twice.'],['COOLER LINING','The lining contains stolen municipal bond certificates.'],['LEGAL NOTE','A note says the bonds were intended to fund the city’s eviction program. The cooler is still empty of food.'])}),
   stage('deliver','clinic','Bring the certificates to the community legal volunteers',{item:'event-cooler-bonds',reward:{cash:185,reputation:3}})
  ])
];
return {missions,events,contacts:[
 {id:'darla',name:'Darla Diamond',where:'club',description:'A former star learning what a comeback is for.'},
 {id:'bobby',name:'Bobby Two-Cars',where:'motel',description:'An excellent driver with a complicated relationship to ownership.'},
 {id:'static',name:'Uncle Static',where:'observatory',description:'A conspiracy theorist who is occasionally, inconveniently correct.'},
 {id:'violet',name:'Miss Violet',where:'hotel',description:'A retired bookkeeper with a long memory and a very good tea tin.'},
 {id:'sol',name:'DJ Sol',where:'radio',description:'An independent radio host determined to leave the microphone on.'}
]};
})();
