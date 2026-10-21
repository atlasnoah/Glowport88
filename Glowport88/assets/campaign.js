/* Glowport '88 — authored main campaign. No artwork or renderer is replaced.
 * The first six missions bridge the existing tested tutorial. Their cash rewards
 * are paid by the legacy tutorial; reward.cash=0 prevents a second payment.
 * Later missions use the reusable objective engine. Content is authored here;
 * complete-campaign duration and end-to-end readiness require playtesting.
 */
window.GlowportCampaign=(()=>{
'use strict';
const acts=[
 {id:1,title:'SMALL-TIME TROUBLE',theme:'A rent-money job becomes evidence of a city for sale.'},
 {id:2,title:'DANGEROUS CONNECTIONS',theme:'The underground has a price. Someone has already paid it.'},
 {id:3,title:'BUILDING AN EMPIRE',theme:'Build a network, take Meridian’s money, discover what it funds.'},
 {id:4,title:'THE CITY TURNS AGAINST YOU',theme:'Save the people behind the evidence before the city buries them.'},
 {id:5,title:'THE GLOWPORT FINALE',theme:'One operation. Five districts. Decide who gets to own the truth.'}
];
const characters={
 VEE:{name:'Vee',role:'Former Meridian risk analyst',motivation:'Protect Mika and dismantle the system she helped design.',flaw:'Treats friends like variables when frightened.',arc:'From controlled secrecy to trusting the city with the truth.'},
 JAX:{name:'Jax',role:'Record-shop owner and former money courier',motivation:'Keep his neighborhood and make his old debts mean something.',flaw:'Mistakes silence for safety.',arc:'Stops hiding copies and starts standing behind them.'},
 ROXY:{name:'Roxy',role:'Arcade mechanic and street-network runner',motivation:'Make sure no one disappears without someone noticing.',flaw:'Laughs first, worries later.',arc:'Becomes the crew’s practical heart.'},
 'DJ SOL':{name:'DJ Sol',role:'Pirate radio host',motivation:'Let Glowport speak for itself.',flaw:'Sometimes confuses an audience with a community.',arc:'Learns that keeping people safe matters more than a spectacular show.'},
 MIKA:{name:'Mika',role:'Dockworker and witness',motivation:'Expose the burned shipments without sacrificing her family.',flaw:'Years of threats make trust difficult.',arc:'Chooses to testify on her own terms.'},
 HOLLIS:{name:'Detective Hollis',role:'Vice detective on Meridian’s payroll',motivation:'Survive the scandal with a pension and a story.',flaw:'Calls every compromise a temporary measure.',arc:'Can be used as a witness, rejected, or absorbed into a new corrupt bargain.'},
 VIOLET:{name:'Miss Violet',role:'Hotel proprietor with an unusually effective address book',motivation:'Keep Glowport’s people housed.',flaw:'Has normalized doing terrible things for good reasons.',arc:'Offers power; the player decides what it should cost.'},
 VALE:{name:'Director Vale',role:'Meridian city-acquisition chief',motivation:'Turn neighborhoods into controllable financial assets.',flaw:'Believes everyone is merely waiting for the right offer.',arc:'Faces a public reckoning, a hostile takeover, or a private settlement.'},
 MAYOR:{name:'Mayor Bellweather',role:'Public face of the city’s sale',motivation:'Remain indispensable to whoever wins.',flaw:'Thinks public relations is a substitute for reality.',arc:'His signed orders become the campaign’s final piece of leverage.'}
};
const s=(type,where,label,extra={})=>({type,where,label,...extra});
const talk=(where,speaker,text,extra={})=>s('talk',where,'Talk to '+speaker,{inside:true,speaker,text,...extra});
const drive=(where,label,checkpoints=3,timeLimit=240,extra={})=>s('drive_route',where,label,{checkpoints,timeLimit,checkpoint:true,...extra});
const fight=(where,label,count=3,extra={})=>s('combat',where,label,{count,checkpoint:true,...extra});
const escape=(where,label,heat=2,hold=6)=>s('escape',where,label,{heat,maxWanted:0,hold,timeLimit:240,checkpoint:true});
const collect=(where,item,label,extra={})=>s('collect',where,label,{item,inside:true,...extra});
const deliver=(where,item,label,extra={})=>s('deliver',where,label,{item,...extra});
const search=(where,label,entries)=>s('investigate',where,label,{inside:true,clues:entries.map((n,i)=>({x:[211,651,403][i],y:[223,195,149][i],label:n[0],text:n[1]})),checkpoint:true});
const choice=(where,speaker,text,choices)=>s('choice',where,'Make your decision',{inside:true,speaker,text,choices});
const heist=(where,label,beats=4,extra={})=>s('heist',where,label,{inside:true,beats,checkpoint:true,...extra});
const escort=(where,fromWhere,label,extra={})=>s('escort',where,label,{fromWhere,count:1,timeLimit:240,checkpoint:true,...extra});
const missions=[];
function add(id,act,title,intro,stages,cash,reputation=2,extra={}){
 const number=Number(id.slice(1));
 missions.push({id,kind:'main',act,title,requires:number>1?['m'+String(number-1).padStart(2,'0')]:[],intro,stages:stages.map((stage,i)=>({id:id+'-s'+(i+1),...stage})),reward:{cash,reputation},...extra});
}
const line=(speaker,text)=>({speaker,text});

// ACT I — the six retained tutorial beats, then a real job with consequences.
add('m01',1,'A CITY FOR SALE',[line('VEE','Violet Hotel. Ask for a room with a view of impending disaster.')],[s('legacy','hotel','Meet Vee and learn what Meridian is buying',{chapter:1})],0,1,{legacyReward:130});
add('m02',1,'A LITTLE INSURANCE',[line('VEE','Neon Armory sells insurance in nine-millimeter installments. Start with the sensible option.')],[s('legacy','armory','Purchase the 9MM pistol through the shop',{chapter:2})],0,1,{legacyReward:100});
add('m03',1,'LEARN THE HARDWARE',[line('ROXY','Fists first, pistol second. This is also my approach to fixing arcade cabinets. It is a bad approach.')],[s('legacy','armory','Practice switching from fists to your pistol',{chapter:3})],0,1,{legacyReward:100});
add('m04',1,'PAPER TARGETS',[line('VEE','Three practice targets outside. Learn where your shots go before someone starts returning them.')],[s('legacy','armory','Shoot all three marked practice targets',{chapter:4})],0,1,{legacyReward:180});
add('m05',1,'THE FIRST THREAT',[line('VEE','Meridian sent collectors to Dockside. They are collecting people. Make room for a witness to get away.')],[s('legacy','warehouse','Defeat the two Meridian enforcers',{chapter:5})],0,2,{legacyReward:450});
add('m06',1,'EVERYONE KNOWS SOMEONE',[line('VEE','Find Roxy by Star Arcade. She knows every broken machine and half the people responsible.')],[s('legacy','arcade','Question Roxy about the missing broadcast',{chapter:6})],0,1,{legacyReward:260});
add('m07',1,'DEAD AIR',[
 line('ROXY','Dead Air Radio lost a whole hour of tape. Not erased—physically ripped out. Someone was in a hurry.'),
 line('VEE','Follow the power trail, recover the cartridge, and get it to Jax. No heroics. I have already budgeted for some heroics.')
],[
 search('radio','Reconstruct the interrupted broadcast',[
  ['MIXING DESK','A torn splice marks the stolen hour. Its service tag points to the east archive circuit.'],
  ['ARCHIVE POWER','Reset the isolated relay. The recorder wakes with one unplayed cartridge still inside.'],
  ['LAST TRANSMISSION','A voice lists shell companies, unpaid tenants, and one standing order: clear the blocks.']
 ]),
 collect('radio','broadcast_tape','Take the recovered broadcast cartridge'),
 deliver('records','broadcast_tape','Carry the cartridge to the Record Exchange',{inside:true}),
 talk('records','JAX','This is a payment schedule pretending to be a radio show. Meridian bought city hall, and city hall gave them the keys.')
],320,3);
add('m08',1,'CHANGE OF A LIFETIME',[
 line('JAX','A Meridian collector uses East Diner’s till to hide eviction cash. We take the lockbox, photograph the slips, leave the tips.'),
 line('VEE','A small job. Quiet. Quick. I dislike how reassuring this sounds.')
],[
 talk('diner','EDDIE','Their collector made me a bank branch with worse coffee. The lockbox is under the counter. Do not touch my emergency pie fund.'),
 s('acquire_vehicle','diner','Secure a getaway car before opening the lockbox'),
 heist('diner','Open the collector’s lockbox without destroying the receipts',3,{approach:'quiet'}),
 collect('diner','rent_receipts','Take the signed rent receipts and leave the staff tips'),
 escape('motel','Lose the collector’s police escort',1,5),
 deliver('motel','rent_receipts','Deliver the receipts to Vee at Palm Motel',{inside:true}),
 talk('motel','VEE','The cash was bait. Every lockbox was tagged. They let us take it because they wanted to know who would come asking. We are not small-time anymore.')
],850,4,{setFlag:'firstJobCompromised'});

// ACT II — the underground network, the first large score, and the leak.
add('m09',2,'THE FIXER',[
 line('JAX','I used to move Meridian envelopes. I told myself paper was not a weapon. That was a convenient lie.'),
 line('VEE','Jax can decode the receipts. First, make sure the people watching his shop lose interest.')
],[
 fight('records','Drive the Meridian spotters away from the shop',2),
 search('records','Decode the collector’s payment trail',[
  ['SLEEVE NOTES','Jax hid account numbers in fake album reviews. The two-star review is a municipal bond.'],
  ['CATALOGUE','Match the dates to the city’s eviction notices. Every notice follows a payment by one day.'],
  ['THE FIXER','A recurring signature belongs to Detective Hollis, a vice officer with a private delivery route.']
 ]),
 talk('records','JAX','Hollis is the door into their operation. He is also a coward. That makes him dangerous in a very predictable way.'),
 choice('records','JAX','How much of your plan do I get to know?',[
  {label:'You are in the crew. We share the risks.',flag:'jaxPartnership',value:'partner'},
  {label:'Keep your shop safe. I will handle the street.',flag:'jaxPartnership',value:'protected'}
 ])
],650,3);
add('m10',2,'EAST SPAN RUN',[
 line('JAX','Hollis has a meeting at East Diner. This duplicate cartridge is our introduction. The original stays somewhere dry.'),
 line('ROXY','Use the marked route. If a cop asks, you are delivering jazz. That is technically a threat, but not a charge.')
],[
 s('acquire_vehicle','records','Borrow or steal a car for the duplicate cartridge'),
 collect('records','duplicate_tape','Collect Jax’s duplicate cartridge'),
 drive('diner','Follow the timed route to Hollis’s meeting',3,210),
 deliver('diner','duplicate_tape','Hand over the duplicate without leaving your getaway behind',{needsCar:true}),
 talk('diner','HOLLIS','You have no idea how many people already own this town. I can sell you a name. I cannot sell you safety.')
],700,3);
add('m11',2,'COLD STORAGE',[
 line('HOLLIS','Dockside 88. Night manifests. I did not tell you that. You overheard a very informative sandwich.'),
 line('VEE','Go in quietly. We need the original ledger, not a room full of witnesses who saw us take it.')
],[
 s('stealth','warehouse','Reach Dockside’s service entrance without an active pursuit',{radius:80,timeLimit:150}),
 search('warehouse','Find the shipping ledger behind the false manifest',[
  ['MANIFEST','The same crate was logged twice under two companies with the same accountant.'],
  ['CUSTOMS SEAL','The seal’s number is genuine. The dockworker who signed it has been declared missing.'],
  ['COLD LEDGER','The ledger contains payment for a warehouse fire before the fire happened.']
 ]),
 collect('warehouse','shipping_ledger','Take the original shipping ledger'),
 deliver('hotel','shipping_ledger','Bring the ledger back to Vee',{inside:true}),
 talk('hotel','VEE','They paid to empty the blocks, then paid to make the records disappear. Someone at that dock is still alive. We need to find them first.')
],900,4);
add('m12',2,'THE AMBUSH',[
 line('ROXY','The warehouse cameras switched back on. Every exit except the one they want you to use is suddenly locked.'),
 line('VEE','They want the ledger. Give them a reason to duck instead.')
],[
 fight('warehouse','Break Meridian’s warehouse ambush',4),
 collect('warehouse','guard_radio','Recover the captain’s dropped radio',{inside:false}),
 s('chase','warehouse','Tail the captain’s response car long enough to identify its control channel',{duration:16,timeLimit:120,checkpoint:true}),
 escape('pier','Break pursuit before meeting the dock contact',2,6),
 deliver('pier','guard_radio','Give the radio to Roxy at the boathouse',{inside:true}),
 talk('pier','ROXY','Their captain called the operation a rehearsal. I hate a theater kid with a security budget.')
],1100,4);
add('m13',2,'UNDERGROUND FREQUENCY',[
 line('ROXY','Cassette Club has a pirate transmitter in the sound booth. DJ Sol says the license is spiritually valid.'),
 line('DJ SOL','Bring the receiver. I can turn accounting fraud into a city-wide singalong.')
],[
 collect('pier','guard_receiver','Pick up the decoded security receiver'),
 deliver('club','guard_receiver','Carry the receiver to DJ Sol',{inside:true}),
 s('defend','club','Protect the club entrance while Sol copies the frequencies',{duration:18,count:3,checkpoint:true}),
 talk('club','DJ SOL','Every district is listening, but Meridian can trace this transmitter. We need the clean unit at Crescent Lookout.'),
 choice('club','DJ SOL','What do we say on the air tonight?',[
  {label:'Tell people where to find shelter.',flag:'firstBroadcast',value:'shelter'},
  {label:'Name Meridian and ask the city to resist.',flag:'firstBroadcast',value:'resist'}
 ])
],950,4);
add('m14',2,'NORTH OF THE LIGHTS',[
 line('VEE','Crescent Lookout stores Meridian’s spare transmitters. One of them was never registered. That one is ours.'),
 line('DJ SOL','We are stealing a radio so we can report a theft of democracy. There is a symmetry here.')
],[
 s('stealth','observatory','Reach the receiver building without leading police to the door',{radius:75,timeLimit:180}),
 search('observatory','Locate a transmitter outside Meridian’s registry',[
  ['FREQUENCY LOG','Most units report their serial numbers every thirty seconds. One test channel never checks in.'],
  ['ANTENNA CONTROL','Retune the array. The clean channel lights a service locker in the archive.'],
  ['UNREGISTERED UNIT','The locker holds a transmitter and a pencilled note: for emergencies they cannot authorize.']
 ]),
 collect('observatory','clean_transmitter','Take the unregistered transmitter'),
 drive('club','Carry the transmitter back along Sol’s relay route',2,240),
 deliver('club','clean_transmitter','Install the clean transmitter at Cassette Club',{inside:true,needsCar:true})
],1200,4);
add('m15',2,'PAYROLL PARADOX',[
 line('MISS VIOLET','Meridian is moving a warehouse payroll tonight. Those wages were stolen from people who still live here. I would like them unstolen.'),
 line('VEE','We recon the unloading schedule, take a car, lift the shipment during the transfer, and leave before Hollis calls his friends.')
],[
 search('warehouse','Recon the cash-shipment transfer',[
  ['SHIFT SHEET','The cash arrives between guard changes. The relief team signs in before the van is unloaded.'],
  ['CAMERA LOOP','A loading camera sees the pavement, not the counter. The blind side lasts long enough.'],
  ['PAYROLL TAG','The real payroll crate carries a violet customs mark. The other crates are empty decoys.']
 ]),
 s('acquire_vehicle','warehouse','Choose a getaway vehicle for the payroll'),
 s('chase','warehouse','Tail the payroll convoy into its unloading window',{duration:20,timeLimit:120,checkpoint:true}),
 heist('warehouse','Break the payroll crate seals in sequence',5,{approach:'loud'}),
 collect('warehouse','payroll_bag','Take the seized wage bag'),
 escape('pier','Lose the response before leading anyone to the crew',2,7),
 deliver('pier','payroll_bag','Return the wage bag to Miss Violet’s courier',{inside:true,needsCar:true})
],2400,6);
add('m16',2,'SPLIT SIGNAL',[
 line('DJ SOL','Backup relay at Star Arcade. Once it is live, the payroll records go on every radio in Glowport.'),
 line('VEE','Stay on the route. Nobody outside this room has the rendezvous. Nobody.')
],[
 drive('arcade','Activate Star Arcade’s backup relay on the marked route',3,210),
 s('interact','arcade','Patch the relay into the arcade’s power bus',{inside:true,text:'The transmitter locks. A second carrier cuts across it before Sol can speak.'}),
 s('defend','pier','Hold the boathouse while the crew evacuates',{duration:20,count:4,checkpoint:true}),
 search('pier','Trace the hijacked transmission',[
  ['BURNT RECEIVER','A private channel carried the rendezvous before the crew arrived.'],
  ['CALL RECORD','The leak used a Meridian analyst access code. The timestamp predates the payroll job.'],
  ['SECOND SIGNAL','Someone in the crew gave Meridian the address. The broadcast was not the trap; the crew was.']
 ]),
 choice('pier','VEE','Someone sold the address. We find them, but we do not turn on each other in the street.',[
  {label:'Keep the crew together until we have proof.',flag:'crewResponse',value:'together'},
  {label:'Compartmentalize everything. Nobody gets the full plan.',flag:'crewResponse',value:'compartments'}
 ])
],1500,6);

// ACT III — build a network that can survive, then discover the real business.
add('m17',3,'AN OLD DEBT',[
 line('JAX','I worked for Meridian. I moved their payments. When I understood what they were buying, I kept copies. Then I kept quiet.'),
 line('VEE','The copies are in the shop. Bring them out before the people who wrote them arrive.')
],[
 s('stealth','records','Reach Jax’s back room without a police tail',{radius:75,timeLimit:150}),
 search('records','Find Jax’s hidden backup drive',[
  ['FALSE BAND','A fake band’s catalogue number repeats the date Jax quit Meridian.'],
  ['SIDE B','The sleeves lead to a locker receipt paid for by the mayor’s campaign office.'],
  ['BACKUP DRIVE','Every payment has a copy. The largest account is marked SIREN, not real estate.']
 ]),
 collect('records','jax_backup','Take the backup drive'),
 escape('motel','Shake the watchers before the backup reaches a safe room',1,6),
 deliver('motel','jax_backup','Store the backup with Miss Violet',{inside:true}),
 talk('motel','MISS VIOLET','People call this a motel. I prefer to think of it as an extremely discreet civic institution. We can make room for your operation.')
],1600,5);
add('m18',3,'A ROOM OF ONE’S OWN',[
 line('MISS VIOLET','Meridian bought the paper underneath half this block. A deed in their collector’s case says they bought my rooms too. They did not ask me.'),
 line('ROXY','Find the deed, make a copy, and bring the clerk home. She is the only person who knows which ice machine eats evidence.')
],[
 fight('motel','Protect Palm Motel’s residents from the collectors',3),
 collect('motel','motel_deed','Recover the residents’ original lease file'),
 escort('hotel','motel','Escort the threatened night clerk to Violet Hotel'),
 deliver('hotel','motel_deed','Give Miss Violet the lease file',{inside:true}),
 choice('hotel','MISS VIOLET','A safe room is a start. Do you want the key, or do you want everyone to know the door is open?',[
  {label:'Keep the address quiet for people in danger.',flag:'safehousePolicy',value:'quiet'},
  {label:'Make it a neighborhood refuge.',flag:'safehousePolicy',value:'public'}
 ])
],1900,5,{setFlag:'safehouseAccess'});
add('m19',3,'COLLATERAL NOISE',[
 line('ROXY','The Gutter Saints and Coal Runners both want Meridian off their corners. They would also like each other off the planet.'),
 line('VEE','Get their messengers to one table. Protect the meeting. We cannot afford a private war on top of the public one.')
],[
 escort('diner','pier','Bring the Gutter Saints’ messenger to the truce meeting'),
 s('defend','diner','Protect the meeting from Meridian provocateurs',{duration:18,count:3,checkpoint:true}),
 talk('diner','ROXY','Turns out the man who shot at both gangs was on the same payroll. Amazing what a shared accounting problem can do for peace.'),
 choice('diner','ROXY','Who do we put in charge of protecting the relay routes?',[
  {label:'The Saints know every street. Back their patrols.',flag:'gangAlliance',value:'saints'},
  {label:'The Runners move supplies. Back their couriers.',flag:'gangAlliance',value:'runners'},
  {label:'Neither gang gets a monopoly. Keep it civilian.',flag:'gangAlliance',value:'civilian'}
 ])
],1700,5);
add('m20',3,'ROUTE TO RESPECT',[
 line('BOBBY TWO-CARS','I can get you a garage contact, but first you have to win a race. It is a professional credential, like dentistry.'),
 line('ROXY','Take the route, keep the car, and do not let Bobby negotiate your prize money.')
],[
 s('acquire_vehicle','arcade','Choose a car for the underground qualifying run'),
 s('race','diner','Complete the Eastside qualifying route',{checkpoints:3,timeLimit:180,checkpoint:true}),
 s('interact','diner','Register the result with the race marshal',{text:'The marshal stamps your card. Bobby tries to autograph it. Nobody asks him to.'}),
 drive('motel','Bring the qualifying car to the garage contact',2,210),
 talk('motel','BOBBY TWO-CARS','You are in. Storage, repair contacts, recovery jobs. Finally, a business where losing a car counts as inventory management.')
],2000,5,{setFlag:'garageAccess'});
add('m21',3,'EMPTY APARTMENT',[
 line('MIKA','My sister’s building is on the clearance list. They have not told the tenants. They have told the demolition company.'),
 line('VEE','Get the residents’ file, stop the eviction crew, and move the family before the locks change.')
],[
 search('hotel','Locate the occupied-building notice',[
  ['TENANT LIST','The city database calls the building vacant. Forty-three names disagree.'],
  ['CONTRACT DATE','The demolition order predates the inspection that supposedly justified it.'],
  ['MOVING ORDERS','Security is coming before the notice can be appealed. The family must leave now.']
 ]),
 fight('motel','Clear the eviction crew from the temporary shelter',3),
 escort('clinic','motel','Bring Mika’s family to a protected room'),
 talk('clinic','MIKA','You helped them without asking for the ledger first. I was not expecting that. I think that is what makes it matter.')
],2100,6);
add('m22',3,'FAMILY RECEIPTS',[
 line('HOLLIS','The mayor’s charity paid for those evictions. I have copies. I would like to trade them for a future in which I can sleep indoors.'),
 line('JAX','Take the copies. Trust the signatures. Trust him exactly as far as you can throw a campaign donor.')
],[
 s('stealth','diner','Reach Hollis’s dead drop without an active tail',{radius:75,timeLimit:150}),
 collect('diner','charity_accounts','Collect the charity’s original accounts'),
 escape('records','Lose Hollis’s watchers before entering the Record Exchange',2,7),
 deliver('records','charity_accounts','Cross-check the charity accounts against Jax’s records',{inside:true}),
 talk('records','JAX','The charity paid the gangs to scare tenants, paid the police to arrest the gangs, then charged the city for restoring order. Three invoices for the same misery.')
],2200,5);
add('m23',3,'THE THREE KEYS',[
 line('VEE','A clean receiver, a trusted front, a crew that can get home. Those are the keys. The stolen money only buys us time.'),
 line('MISS VIOLET','I have a business front available. The previous owner retired to a country with an admirable extradition policy.')
],[
 collect('armory','relay_equipment','Pick up the relay equipment from the armory contact'),
 deliver('club','relay_equipment','Let Sol tune the equipment away from Meridian’s registry',{inside:true}),
 escort('warehouse','club','Escort the technician to the freight depot'),
 s('defend','warehouse','Protect the installation until the crew has a secure channel',{duration:22,count:3,checkpoint:true}),
 talk('warehouse','VEE','We have a place to work and people who can protect it. This is the part where an empire is supposed to become someone else’s problem. Let us try something better.')
],2500,6,{setFlag:'businessAccess'});
add('m24',3,'GLASS HOUSES',[
 line('JAX','Meridian is shipping jewels through an armory locker. The stones are insurance against the city ever seeing the bank accounts.'),
 line('VEE','Recon the locker, take a car, open it cleanly, and get the stones out. Their emergency reserve becomes our evidence fund.')
],[
 search('armory','Recon Meridian’s concealed jewel shipment',[
  ['DELIVERY NOTE','The jewels arrived in gun cases. The insurance lists municipal property as collateral.'],
  ['LOCKER ROTATION','The lock changes sequence with each guard shift. The current pattern is on the service card.'],
  ['SIREN INVOICE','The shipment funds SIREN: a city-wide system for tracking and clearing people, not merely buildings.']
 ]),
 s('acquire_vehicle','armory','Secure a getaway car for the shipment'),
 heist('armory','Open the insured shipment locker',5,{approach:'quiet'}),
 collect('armory','siren_jewels','Take the jewels and their SIREN invoice'),
 s('race','pier','Clear the shipment corridor before it is sealed',{checkpoints:3,timeLimit:180,checkpoint:true}),
 deliver('pier','siren_jewels','Hand the sealed evidence case to Miss Violet’s courier',{inside:true,needsCar:true}),
 talk('pier','VEE','SIREN turns every receiver, payment card, and address into a leash. They were not buying the city. They were building a way to decide who is allowed to stay.')
],4200,8);

// ACT IV — Meridian retaliates and the crew must become more than a conspiracy.
add('m25',4,'EVICTION NOTICE',[
 line('MISS VIOLET','They have arrived at Palm Motel with a court order, three vans, and a man who calls himself a compliance specialist.'),
 line('ROXY','We are fresh out of compliance. Bring something else.')
],[
 s('defend','motel','Hold the motel while the residents evacuate',{duration:24,count:4,checkpoint:true}),
 escort('hotel','motel','Escort Miss Violet and the lease archive to the hotel'),
 talk('hotel','MISS VIOLET','They mistook shelter for territory. A common mistake among men who have never had to ask for either.'),
 choice('hotel','VEE','Our locations are compromised. What do we tell the neighborhood?',[
  {label:'Warn everyone and organize open shelters.',flag:'retaliationResponse',value:'organize'},
  {label:'Move quietly and protect the witness network.',flag:'retaliationResponse',value:'evacuate'}
 ])
],2800,6);
add('m26',4,'THE WITNESS',[
 line('MIKA','I watched them burn the manifests. Then they told my family I had died in the fire. I need you to understand what they can do.'),
 line('VEE','Mika has the missing account. She gets to the clinic alive. Everything else is secondary.')
],[
 fight('warehouse','Break the security cordon around Mika’s hiding place',3),
 escort('clinic','warehouse','Protect Mika on the way to Marina Clinic',{timeLimit:240}),
 search('clinic','Corroborate Mika’s account without exposing her family',[
  ['INTAKE RECORD','The clinic treated dockworkers before the official time of the warehouse fire.'],
  ['MEDICAL TAPE','A security-radio recording orders the exits locked while workers are still inside.'],
  ['WITNESS STATEMENT','Mika identifies Director Vale’s voice. Her account ties SIREN to the fire.']
 ]),
 choice('clinic','MIKA','I will testify. But I decide what happens to my name.',[
  {label:'Keep her identity private until she is safe.',flag:'witnessPolicy',value:'protect'},
  {label:'Let Mika speak publicly on her own terms.',flag:'witnessPolicy',value:'public'}
 ])
],3000,7,{setFlag:'witnessSafe'});
add('m27',4,'FALSE FLAG',[
 line('HOLLIS','The mayor called your crew terrorists. Meridian is staging the evidence at East Diner. I am not asking you to trust me. I am asking you to hurry.'),
 line('ROXY','They cannot even frame us without making Eddie host the meeting.')
],[
 fight('diner','Clear Meridian’s staged roadblock at East Diner',4),
 s('chase','diner','Stay on the fleeing security captain until his dispatch can be recorded',{duration:20,timeLimit:120,checkpoint:true}),
 collect('diner','forged_warrant','Recover the prepared warrant and planted evidence',{inside:false}),
 escape('clinic','Break the coordinated police response',3,8),
 deliver('clinic','forged_warrant','Give the warrant to Mika’s legal contact',{inside:true}),
 talk('clinic','MIKA','Their story says we attacked first. Their own warrant was signed yesterday. We can prove this was planned.')
],3200,7,{setFlag:'clinicContact'});
add('m28',4,'KNOCK KNOCK',[
 line('JAX','There are people outside the hotel pretending not to know one another. They all have the same haircut. Subtlety has taken the evening off.'),
 line('VEE','Get the emergency archive, draw them away, and keep the radio station alive.')
],[
 s('stealth','hotel','Slip into the hotel archive without an active police tail',{radius:80,timeLimit:180}),
 collect('hotel','emergency_archive','Collect the crew’s emergency archive'),
 escape('radio','Draw the watchers away from the hotel',2,7),
 deliver('radio','emergency_archive','Move the archive to the backup studio',{inside:true}),
 s('defend','radio','Protect Sol while the archive is duplicated',{duration:22,count:4,checkpoint:true})
],3300,6);
add('m29',4,'LIQUID ASSETS',[
 line('MISS VIOLET','Meridian uses the hotel conference suite as a clearinghouse. Tomorrow, every remaining city reserve leaves through that terminal.'),
 line('JAX','We are robbing a bank that is pretending to be a breakfast meeting. Finally, my two least favorite institutions in one room.')
],[
 search('hotel','Plan the clearinghouse operation',[
  ['TRANSFER LIST','The clearing terminal holds wages, deposits, and the city’s emergency reserve in one release window.'],
  ['ACCESS CYCLE','Three authorization steps and a manual release. Break the sequence and the reserve freezes.'],
  ['GETAWAY WINDOW','Hollis can delay the first dispatch. After that, every patrol in Glowport gets the same address.']
 ]),
 s('acquire_vehicle','hotel','Choose the clearinghouse getaway vehicle'),
 heist('hotel','Execute the clearinghouse authorization sequence',6,{approach:'loud'}),
 collect('hotel','city_reserve','Take custody of the city reserve transfer'),
 escape('pier','Escape the clearinghouse response before the reserve can be seized',3,9),
 deliver('pier','city_reserve','Deliver the protected transfer to Miss Violet',{inside:true,needsCar:true}),
 choice('pier','MISS VIOLET','The city’s money is in our hands. That is a more dangerous sentence than it sounds.',[
  {label:'Ring-fence wages and tenant deposits first.',flag:'reservePolicy',value:'restitution'},
  {label:'Fund the final operation before returning the reserve.',flag:'reservePolicy',value:'operation'}
 ])
],6500,9);
add('m30',4,'BACKUP FREQUENCY',[
 line('DJ SOL','They are shutting the registered transmitters down one by one. The clean backup needs power, an operator, and a driver with excellent poor judgment.'),
 line('ROXY','I have two of those. Guess which one I need you for.')
],[
 collect('club','backup_carrier','Pick up Sol’s clean carrier assembly'),
 drive('radio','Run the carrier through the closing relay corridor',3,210),
 s('defend','radio','Keep the studio open while the carrier is installed',{duration:24,count:4,checkpoint:true}),
 deliver('radio','backup_carrier','Install the backup carrier in the archive circuit',{inside:true,needsCar:true}),
 talk('radio','DJ SOL','One clean broadcast. After that they find this place. Let us make it something worth remembering.')
],4000,7);
add('m31',4,'THE WHOLE TRUTH',[
 line('VEE','Crescent Lookout. Just us. There is something I should have told you before you ever walked into the hotel.'),
 line('JAX','Bring the access logs. Whatever happens, keep the conversation about proof, not fear.')
],[
 search('observatory','Compare the leak against Meridian’s analyst logs',[
  ['ACCESS LOG','The rendezvous code was issued to Vee while she still worked at Meridian.'],
  ['SECURITY ORDER','The leak moved a security team away from Mika’s family. The crew became the distraction.'],
  ['UNSENT MESSAGE','Vee drafted a warning, then deleted it. She chose the outcome and denied the crew a choice.']
 ]),
 talk('observatory','VEE','I leaked the address to draw their security away from Mika. I told myself I could control what happened next. I used you the way they taught me to use everyone.'),
 choice('observatory','VEE','I cannot ask you to forgive it. I can ask what we do now.',[
  {label:'Stay. From now on, nobody makes that choice alone.',flag:'veeDecision',value:'forgive'},
  {label:'Help us finish, but the crew makes the decisions.',flag:'veeDecision',value:'accountable'},
  {label:'You are out of command. Give Roxy the codes.',flag:'veeDecision',value:'replace'}
 ]),
 collect('observatory','analyst_codes','Secure the analyst access codes for the crew'),
 deliver('arcade','analyst_codes','Give Roxy custody of the final-operation codes',{inside:true})
],3500,8);
add('m32',4,'THE LONG NIGHT',[
 line('ROXY','Vale has a list of everyone who helped us. The dockworker, the clerk, Sol’s engineer. We have a list of addresses and a car. Let us be faster.'),
 line('MIKA','This time nobody gets left off the list because they are inconvenient to save.')
],[
 fight('pier','Clear the boathouse extraction point',3),
 escort('clinic','pier','Escort the threatened crew members to the clinic'),
 s('defend','clinic','Hold the clinic while the last witness is moved',{duration:25,count:4,checkpoint:true}),
 talk('clinic','ROXY','They are safe. Not comfortable, not finished being scared, but safe. Now we stop running from the thing that keeps doing this.'),
 choice('clinic','MIKA','We can still leave. Or we can make sure nobody else has to.',[
  {label:'Finish the broadcast. Put the whole record beyond their reach.',flag:'finalIntent',value:'expose'},
  {label:'Take their control system away before they can use it again.',flag:'finalIntent',value:'seize'}
 ])
],4200,8);

// ACT V — one coordinated operation, followed by an explicit ending choice.
add('m33',5,'FIVE DISTRICTS, ONE CITY',[
 line('DJ SOL','One transmitter can be cut. Five district relays are a chorus. The receivers have to agree before the final carrier goes live.'),
 line('ROXY','Drive the sync route. I will keep the receivers awake with a screwdriver and deeply personal insults.')
],[
 s('acquire_vehicle','arcade','Take a car for the district synchronization run'),
 drive('observatory','Synchronize the Crescent Heights relay',3,240),
 collect('observatory','north_sync','Collect the northern relay confirmation'),
 drive('diner','Synchronize the Eastside relay before the window closes',3,240),
 deliver('diner','north_sync','Patch the confirmation into the Eastside relay',{inside:true,needsCar:true}),
 s('defend','diner','Protect the technicians while the district handshake completes',{duration:20,count:3,checkpoint:true})
],4500,7);
add('m34',5,'BAD RECEPTION',[
 line('DJ SOL','Three jammers. They do not need to beat our signal. They just need to make the truth sound like a faulty appliance.'),
 line('JAX','Take their service records. I want the invoice for censorship framed in the shop.')
],[
 search('radio','Identify the jammer’s service channel',[
  ['INTERFERENCE','The interference repeats on a maintenance clock, not a broadcast clock.'],
  ['SERVICE PANEL','A contractor control channel links the jammer to Meridian’s district equipment.'],
  ['OVERRIDE','The manual override works only after the local controller is physically reset.']
 ]),
 s('interact','observatory','Disable the northern jammer controller',{inside:true,text:'The northern controller goes dark. Sol counts one clean district on the air.'}),
 fight('club','Remove the security team protecting the downtown jammer',3),
 s('interact','club','Disable the downtown jammer controller',{inside:true,text:'The final interference band falls away. Five clear receivers answer Sol’s test call.'}),
 talk('club','DJ SOL','For the first time all night, the silence is ours to decide what to do with.')
],4800,7);
add('m35',5,'NO MAN’S LAND',[
 line('HOLLIS','Vale is moving the last access officer out of Dockside. Without her key, your vault operation becomes an expensive argument with a door.'),
 line('VEE','Get her out. Give her a choice about what happens next. We have made enough decisions for other people.')
],[
 fight('warehouse','Break the access officer’s security escort',4),
 escort('hotel','warehouse','Protect the access officer on the way to Violet Hotel'),
 talk('hotel','ACCESS OFFICER NIA','I signed maintenance orders. Then they became clearance orders. If my key opens that vault, I want the record to show why I gave it to you.'),
 collect('hotel','vault_key','Accept Nia’s vault access key'),
 choice('hotel','HOLLIS','I can testify too. I would prefer a witness chair to an evidence locker.',[
  {label:'Take his testimony, and keep a copy of every crime.',flag:'hollisFate',value:'witness'},
  {label:'Give him no deal. The records can speak for themselves.',flag:'hollisFate',value:'no_deal'}
 ])
],5000,8);
add('m36',5,'CLEAN HANDS',[
 line('JAX','The mayor will say the signatures are forged. We need the original authorization book from his unofficial office.'),
 line('MISS VIOLET','An unofficial office in my motel. I charge double for corruption and he is still behind on the bill.')
],[
 s('stealth','motel','Reach the mayor’s unofficial office without a police tail',{radius:80,timeLimit:180}),
 heist('motel','Open the mayoral authorization cabinet',5,{approach:'quiet'}),
 collect('motel','signed_orders','Take the original clearance authorizations'),
 escape('records','Lose the mayor’s private protection detail',2,8),
 deliver('records','signed_orders','Authenticate the signatures against Jax’s archive',{inside:true}),
 talk('records','JAX','No shell company. No proxy. His name, his order, his city’s people on the other side of the page.')
],5200,8);
add('m37',5,'OPEN CHANNELS',[
 line('DJ SOL','I have the story. I have the recordings. I have developed a deeply irritating conscience. I would like to survive long enough to use all three.'),
 line('ROXY','We get Sol to the studio, build the last patch, and keep the doors open. Nobody improvises a heroic last stand without asking.')
],[
 s('defend','club','Protect Sol’s departure from Cassette Club',{duration:20,count:4,checkpoint:true}),
 escort('radio','club','Escort Sol to Dead Air Radio'),
 search('radio','Bring the independent broadcast patch online',[
  ['ISOLATOR','Disconnect the studio from the registered city feed. Meridian loses its remote cutoff.'],
  ['BACKUP POWER','Tie the carrier to the emergency bus. Roxy signs the inspection slip: probably fine.'],
  ['OPEN CHANNEL','Five district receivers answer. The final patch is ready for the vault archive.']
 ]),
 talk('radio','DJ SOL','When this goes live, let the people hear each other too. Otherwise we have only changed the voice at the top of the dial.')
],5400,8);
add('m38',5,'ONE LAST EXIT',[
 line('BOBBY TWO-CARS','I have planned a perfect getaway. It has one car, three turns, and only one small issue involving the car.'),
 line('ROXY','Secure the vehicle yourself. Test the exit route. Bobby is in charge of the sandwiches, where the consequences are smaller.')
],[
 s('acquire_vehicle','motel','Choose the finale’s getaway car'),
 collect('armory','escape_kit','Collect the crew’s emergency tool and medical kit'),
 s('race','pier','Test the finale’s escape corridor',{checkpoints:3,timeLimit:180,checkpoint:true}),
 deliver('pier','escape_kit','Stash the emergency kit at the fallback boathouse',{inside:true,needsCar:true}),
 choice('pier','ROXY','One fallback route. Who gets the first seat if things go wrong?',[
  {label:'The witnesses and civilians. We cover the rear.',flag:'evacuationPriority',value:'civilians'},
  {label:'The evidence and transmitter. Protect the operation.',flag:'evacuationPriority',value:'evidence'}
 ])
],5600,8);
add('m39',5,'PROOF AGAINST POWER',[
 line('VEE','The vault has the city-wide SIREN archive. The codes can expose it, destroy its hold, or hand that hold to someone new.'),
 line('MIKA','Whatever you choose, do not call it inevitable. People have spent this whole story doing that to us.')
],[
 search('observatory','Verify the archive’s chain of authority',[
  ['THE ORDER','The mayor authorized civilian tracking as a temporary emergency measure. It has no expiry date.'],
  ['THE BUYER','Vale promised control of SIREN to whichever national bidder paid first. Glowport is the demonstration.'],
  ['THE KILL SWITCH','The same vault session can publish the archive or transfer its authority. The city’s future is a permission setting.']
 ]),
 collect('observatory','authority_record','Take the original authority record'),
 deliver('hotel','authority_record','Give the crew a complete copy before the finale',{inside:true}),
 talk('hotel','VEE','No private plan this time. Everyone knows what the key can do. When we reach the carrier, the choice is yours—and the consequences are ours.')
],6000,9);
add('m40',5,'GLOWPORT RISING',[
 line('ROXY','All five districts are ready. Nia’s key is good. Sol is on the carrier. Jax has copies of the copies. We are as prepared as this city has ever allowed anyone to be.'),
 line('VEE','Dockside houses Meridian’s emergency vault. Take the archive, bring the crew out, and decide what the city hears next.')
],[
 s('acquire_vehicle','hotel','Take the finale’s getaway vehicle'),
 drive('warehouse','Reach Meridian’s emergency vault along the synchronized route',4,240),
 heist('warehouse','Execute the corporate-vault access sequence',6,{approach:'finale'}),
 fight('warehouse','Break Vale’s final security response',5,{dialogue:[line('VALE','There is still a price at which you walk away. Everyone has one. You have simply made yours inconvenient.')]}),
 escape('radio','Break pursuit before the archive reaches the live carrier',3,10),
 escort('radio','warehouse','Bring the archive courier and surviving crew to Sol’s carrier',{timeLimit:240}),
 choice('radio','VEE','The carrier is live. The archive is yours. What do we give Glowport?',[
  {label:'Broadcast everything. Return the reserve and let the city decide.',flag:'cityFuture',value:'public',ending:'broadcast'},
  {label:'Seize SIREN. Protect the neighborhoods with power of our own.',flag:'cityFuture',value:'crew',ending:'control'},
  {label:'Take Vale’s settlement. Save the crew and leave the system standing.',flag:'cityFuture',value:'settlement',ending:'deal'}
 ])
],18000,12,{finale:true});

const endings={
 broadcast:{title:'THE CITY HAS A VOICE',text:'Sol plays the archive on every district carrier. Mika testifies under protections the crew helped build. The mayor loses his office; Meridian loses its charter. Nothing is magically fixed, but the record is public and the neighborhoods get to argue about their future in daylight. Vee stays to answer for her own choices. Free roam continues in a city that remembers what you did.'},
 control:{title:'A DIFFERENT HAND ON THE DIAL',text:'The crew takes SIREN’s authority away from Meridian and keeps the keys. Evictions stop. So do questions the new network does not want asked. Roxy insists on a civilian council; Violet says power can learn manners. Vee knows exactly how this kind of promise begins. Free roam continues under a new, uneasy balance.'},
 deal:{title:'THE PRICE OF QUIET',text:'Vale buys a settlement, a protected exit for the witnesses, and a silence he calls stability. The crew survives with money and places to hide. Mika keeps one copy, Jax keeps another, and Sol leaves a clean frequency open every night. The city carries on. So does the question of what it would take to return. Free roam continues with Meridian wounded but standing.'}
};
// Zero-based expanded-mission indices for legacy chapter indices 0..20. Legacy
// "No Signal Lost" and "Split Signal" are combined in m16. A legacy completed
// campaign (story===21) is handled by the adapter, not by indexing this array.
const legacyMap=[0,1,2,3,4,5,6,8,9,10,11,12,13,15,15,16,25,26,29,30,39];
return {version:1,acts,characters,missions,endings,legacyMap,byId:id=>missions.find(m=>m.id===id)};
})();
