"""Original deterministic pixel artwork. No reference-image pixels are used.
Run from any directory with Python 3 + Pillow. PNGs are runtime assets; no build is needed to play.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import math, random, json
OUT=Path(__file__).resolve().parents[1]/'Glowport88'/'assets'
OUT.mkdir(parents=True,exist_ok=True)
INK='#101528'; EDGE='#596380'; CYAN='#7fe9df'; GOLD='#ffd69a'
manifest={}
atlas=Image.new('RGBA',(512,512));cursor=0

def sprite(name,w,h,paint):
 global cursor
 x=(cursor%8)*64;y=(cursor//8)*64;cursor+=1
 im=Image.new('RGBA',(w,h));d=ImageDraw.Draw(im);paint(d,im)
 atlas.alpha_composite(im,(x,y));manifest[name]=[x,y,w,h]

def material(name,base,colors,kind):
 def paint(d,im):
  rng=random.Random(name);d.rectangle((0,0,15,15),fill=base)
  for _ in range(18 if kind=='grain' else 4):
   x=rng.randrange(16);y=rng.randrange(16);d.point((x,y),fill=rng.choice(colors))
  if kind=='brick':
   for y in [0,8]:
    d.line((0,y,15,y),fill=colors[0]);d.line((4 if y==0 else 12,y,4 if y==0 else 12,y+7),fill=colors[0])
   d.line((1,1,14,1),fill=colors[-1])
  if kind=='slab':
   d.line((0,15,15,15),fill=colors[0]);d.line((15,0,15,15),fill=colors[0]);d.line((1,0,14,0),fill=colors[-1])
  if kind=='wood':
   for y in [0,8]:
    d.line((0,y,15,y),fill=colors[0]);d.line((4 if y==0 else 12,y,4 if y==0 else 12,y+7),fill=colors[0])
  if kind=='metal':
   for y in [0,4,8,12]:d.line((0,y,15,y),fill=colors[0]);d.line((0,y+1,15,y+1),fill=colors[-1])
 sprite(name,16,16,paint)
for name,b,cs,k in [
 ('asphalt','#252c40',['#22283a','#30374a','#293247'],'grain'),
 ('pavement','#44475d',['#292e44','#484d64','#60647a'],'slab'),
 ('concrete','#343c52',['#242c41','#424b62','#505b72'],'slab'),
 ('roof','#353850',['#282c43','#40425d','#494c65'],'grain'),
 ('roof-teal','#30444e',['#21363f','#36505a','#49606a'],'grain'),
 ('roof-rust','#514151',['#362f45','#654a58','#765666'],'grain'),
 ('brick','#584153',['#30283f','#614559','#775268'],'brick'),
 ('brick-blue','#3f4b65',['#232d48','#42546e','#576780'],'brick'),
 ('brick-warm','#66515a',['#3e3546','#735b64','#846b70'],'brick'),
 ('grass','#243d40',['#1b3038','#2b4949','#36534d'],'grain'),
 ('metal','#41495f',['#242d43','#46536b','#5d6a80'],'metal'),
 ('wood','#514652',['#423a49','#574a56','#5d505c'],'wood'),
 ('tile','#4d465e',['#363247','#5c526b','#706279'],'slab')]:material(name,b,cs,k)

def window(d,im):
 d.rectangle((0,0,23,23),fill=INK);d.rectangle((1,1,22,21),fill='#566078');d.rectangle((3,3,20,19),fill='#29455d')
 d.polygon([(3,3),(20,3),(3,19)],fill='#44798b');d.polygon([(12,3),(18,3),(3,18),(3,13)],fill='#68a2aa')
 d.rectangle((11,3,12,20),fill='#19293e');d.line((3,13,20,13),fill='#19293e');d.line((0,22,23,22),fill='#778097');d.line((2,23,23,23),fill=INK)
sprite('window',24,24,window)
def warm(d,im):
 window(d,im);d.rectangle((3,3,20,19),fill='#a7716f');d.rectangle((4,4,19,14),fill='#e4ac89');d.rectangle((6,4,17,9),fill='#f6cda0');d.line((11,3,11,20),fill='#615066');d.line((3,14,20,14),fill='#5a4458');d.rectangle((4,16,9,19),fill='#67506a');d.rectangle((17,13,19,19),fill='#67506a')
sprite('window-warm',24,24,warm)
def vent(d,im):
 d.polygon([(0,3),(4,0),(26,0),(30,4),(30,20),(26,24),(0,24)],fill=INK);d.rectangle((2,3,27,21),fill='#6c7486');d.line((3,2,25,2),fill='#a1a7ac');d.rectangle((4,5,19,19),fill='#333e53');d.ellipse((5,6,18,18),fill='#778893',outline='#233446');d.ellipse((8,9,15,16),fill='#28374c');d.line((7,8,17,17),fill='#384b5f');d.line((7,17,17,8),fill='#384b5f')
 for y in range(6,19,3):d.line((22,y,26,y),fill='#29384d')
 d.line((6,22,28,22),fill='#222d42')
sprite('ac',32,26,vent)
def door(d,im):
 d.rectangle((0,0,21,31),fill=INK);d.rectangle((2,1,19,29),fill='#596178');d.rectangle((4,3,17,27),fill='#25435a');d.polygon([(5,4),(16,4),(5,18)],fill='#6298a6');d.rectangle((10,3,11,28),fill='#242e49');d.line((5,21,16,21),fill='#80e3df');d.rectangle((8,16,9,19),fill=GOLD);d.rectangle((12,16,13,19),fill=GOLD);d.rectangle((0,30,21,31),fill='#a3a5ae')
sprite('door',22,32,door)
def vending(d,im):
 d.rectangle((2,2,21,33),fill=INK);d.rectangle((0,0,19,31),fill='#844564');d.rectangle((1,1,18,3),fill='#df7d9d');d.rectangle((2,5,13,22),fill='#13273d');d.rectangle((3,6,12,20),fill='#54888e')
 for x in [4,8]:
  for y in [8,13,18]:d.rectangle((x,y,x+2,y+2),fill=GOLD if y==13 else '#97d9c9')
 d.rectangle((15,8,17,12),fill=CYAN);d.rectangle((3,25,13,28),fill=INK);d.line((1,30,18,30),fill='#bc7a94');d.point((16,18),fill=GOLD)
sprite('vending',24,36,vending)
def bench(d,im):
 d.rectangle((2,16,5,21),fill=INK);d.rectangle((26,16,29,21),fill=INK)
 for y in [3,7,11]:d.rectangle((0,y,31,y+2),fill='#99757a');d.line((1,y,30,y),fill='#bd9290')
 d.rectangle((0,14,31,16),fill='#66516b');d.line((1,14,30,14),fill='#b49191')
sprite('bench',32,24,bench)
def bin(d,im):
 d.polygon([(1,5),(23,5),(21,22),(3,22)],fill='#2c4f56',outline=INK);d.rectangle((0,2,24,7),fill='#568079',outline=INK);d.line((3,3,21,3),fill='#89a495')
 for x in [5,10,15,20]:d.line((x,9,x,19),fill='#446970')
 d.rectangle((3,23,6,25),fill=INK);d.rectangle((19,23,22,25),fill=INK);d.rectangle((8,10,15,14),fill='#778f86')
sprite('dumpster',26,28,bin)
def plant(d,im):
 d.polygon([(7,22),(24,22),(21,32),(10,32)],fill='#7b5966',outline=INK);d.rectangle((6,21,25,24),fill='#ad7b80');d.line((16,22,16,7),fill='#407764')
 for x,y in [(8,13),(21,11),(11,5),(23,19),(7,21),(16,11)]:d.ellipse((x-4,y-4,x+4,y+4),fill='#437e6e',outline='#263e46');d.line((x-2,y,x+1,y-2),fill='#77a584')
sprite('planter',32,34,plant)
def lamppost(d,im):
 d.rectangle((12,16,15,45),fill=INK);d.line((13,17,13,43),fill='#647c87');d.rectangle((9,43,18,47),fill='#303d53');d.rectangle((8,12,19,18),fill='#5d8490',outline=INK);d.ellipse((7,2,20,15),fill='#73c8d2',outline='#303b57');d.ellipse((9,3,18,11),fill='#c0ffed');d.rectangle((11,0,16,3),fill='#648f98')
sprite('lamp',28,48,lamppost)
def tree(d,im):
 rng=random.Random(88);d.rectangle((21,27,25,44),fill='#3d3442');d.line((23,29,23,43),fill='#80616a')
 for _ in range(44):
  x=rng.randrange(7,38);y=rng.randrange(5,28)
  if (x-23)**2/19**2+(y-18)**2/15**2<1:d.ellipse((x-5,y-4,x+5,y+4),fill=rng.choice(['#223e45','#2b5452','#376960','#487c6d']))
 d.line((11,13,16,10),fill='#75a28a');d.line((27,7,31,9),fill='#75a28a')
sprite('tree',48,48,tree)
def drain(d,im):
 d.rectangle((0,0,19,9),fill='#5a6072');d.rectangle((1,1,18,8),fill=INK)
 for x in range(3,18,3):d.line((x,2,x,7),fill='#536276')
sprite('drain',20,10,drain)
def furniture(d,im):
 d.rectangle((0,5,41,24),fill='#302637',outline=INK);d.rectangle((2,0,39,11),fill='#916071',outline=INK);d.rectangle((3,3,38,8),fill='#b57d8a');d.rectangle((4,12,37,20),fill='#7b536b');d.rectangle((0,7,6,21),fill='#ad7388');d.rectangle((35,7,41,21),fill='#ad7388');d.line((21,12,21,20),fill='#513e58');d.rectangle((3,24,6,26),fill=INK);d.rectangle((35,24,38,26),fill=INK)
sprite('sofa',44,28,furniture)
def arcade(d,im):
 d.polygon([(3,0),(24,0),(27,13),(24,35),(1,35),(1,12)],fill='#362e56',outline=INK);d.rectangle((4,2,23,7),fill='#d16caa');d.rectangle((5,9,22,22),fill=INK);d.rectangle((7,11,20,20),fill='#367389');d.line((8,18,18,13),fill=CYAN);d.rectangle((2,24,25,27),fill='#6b5a83');d.rectangle((9,23,10,26),fill='#ff9b9c');d.point((19,25),fill=GOLD);d.rectangle((6,30,20,32),fill=INK)
sprite('arcade',28,36,arcade)
def table(d,im):
 d.ellipse((0,3,33,19),fill=INK);d.ellipse((0,0,33,16),fill='#967178',outline='#c49894');d.rectangle((14,17,18,25),fill='#4b4058');d.line((8,25,24,25),fill=INK);d.rectangle((9,4,13,8),fill='#b5d6c5');d.rectangle((21,3,24,9),fill='#7aa9a1');d.line((21,3,24,3),fill=GOLD)
sprite('table',34,28,table)
def bed(d,im):
 d.rectangle((0,0,47,37),fill='#40384d',outline=INK);d.rectangle((2,3,45,34),fill='#b2abb0');d.rectangle((4,5,19,13),fill='#eee3ca');d.rectangle((27,5,42,13),fill='#eee3ca');d.rectangle((3,16,44,32),fill='#657c8c');d.line((4,18,43,18),fill='#91a9ad');d.rectangle((3,28,44,34),fill='#465b75');d.rectangle((2,36,5,39),fill=INK);d.rectangle((42,36,45,39),fill=INK)
sprite('bed',48,40,bed)
def terminal(d,im):
 d.rectangle((1,0,26,22),fill=INK);d.rectangle((3,2,24,17),fill='#678a95');d.rectangle((5,4,22,14),fill='#162e44');d.line((7,7,18,7),fill=CYAN);d.line((7,10,14,10),fill='#78b8ad');d.rectangle((11,18,16,23),fill='#59687c');d.polygon([(2,23),(25,23),(28,28),(0,28)],fill='#747c8e');d.line((4,25,23,25),fill='#2e3e52')
sprite('terminal',30,30,terminal)
def palm(d,im):
 d.polygon([(23,23),(29,25),(28,43),(24,45),(22,40)],fill=INK)
 d.polygon([(23,24),(26,25),(25,42),(23,43)],fill='#997f79')
 for y in range(29,43,4):d.line((23,y,26,y-1),fill='#5c5263')
 for k in range(7):
  a=k*math.pi*2/7;vx=math.cos(a);vy=math.sin(a)
  pts=[(24,20),(24+vx*10-vy*5,20+vy*8+vx*5),(24+vx*21,20+vy*16+4),(24+vx*12+vy*2,20+vy*10-vx*2)]
  d.polygon(pts,fill=['#336a61','#3d7e6d','#4a8c75'][k%3])
  d.line((24,20,24+vx*18,20+vy*14+3),fill='#6ca28a')
 d.ellipse((21,17,27,23),fill='#82ae8d')
sprite('palm',48,48,palm)
atlas.save(OUT/'city-atlas.png',optimize=True)
# Authored body shapes, four directions, eight poses (idle, walking x4, aim, recoil, reload).
char=Image.new('RGBA',(32*8,40*4*12))
shirts=['#d46191','#4c9b94','#c69864','#8278ae','#6a907b','#a27e8b','#547d9f','#a66572','#a29c79','#606e87','#685b90','#399c98']
skins=['#d8aa86','#a57360','#efc4a0','#bf8c71','#8f6055','#d6a17e']
for variant in range(12):
 for direction in range(4):
  for frame in range(8):
   im=Image.new('RGBA',(32,40));d=ImageDraw.Draw(im);shirt=shirts[variant];skin=skins[variant%6];hair=['#222438','#4b343e','#8c655b','#be9c7b'][variant%4]
   stride=[0,-2,0,2,0,0,0,0][frame];bob=1 if frame in [2,4] else 0
   def R(box,c):d.rectangle(tuple(round(v) for v in box),fill=c)
   # boots and fitted trousers
   R((10,27,14,34+stride),'#172237');R((18,27,22,34-stride),'#172237');R((9,33+stride,14,35+stride),'#0d1629');R((18,33-stride,23,35-stride),'#0d1629');R((10,32+stride,14,32+stride),'#687b91');R((18,32-stride,22,32-stride),'#687b91')
   d.polygon([(9,15+bob),(23,15+bob),(25,27),(20,29),(10,28),(7,23)],fill=INK)
   R((10,16+bob,21,26),shirt);R((10,17+bob,12,24),'#b8aaa9' if variant==0 else '#83949c');R((18,17+bob,21,26),'#363e55');R((13,16+bob,16,22),'#202b42');R((10,27,21,28),'#6ba9b2')
   # neck, face, ears, hairstyle
   R((13,13+bob,18,16+bob),skin);d.polygon([(10,5+bob),(22,5+bob),(23,10+bob),(20,15+bob),(12,15+bob),(9,10+bob)],fill=INK);R((11,6+bob,21,12+bob),skin);R((12,13+bob,19,14+bob),'#b67e70');R((10,4+bob,21,7+bob),hair);R((9,7+bob,11,10+bob),hair);R((20,7+bob,22,10+bob),hair);R((12,3+bob,19,4+bob),hair)
   if variant==0:R((10,5+bob,14,6+bob),'#8e77b5');R((9,8+bob,10,10+bob),'#5bc5c7')
   if direction==0:
    R((12,10+bob,13,10+bob),INK);R((19,10+bob,20,10+bob),INK);R((13,12+bob,18,12+bob),'#f0bd98')
   elif direction==3:R((10,5+bob,21,12+bob),hair);R((11,13+bob,20,14+bob),hair);R((13,18+bob,18,23+bob),'#b59fa8' if variant==0 else '#52667a')
   else:
    left=direction==1;R((16 if left else 10,6+bob,21 if left else 15,12+bob),hair);R((10 if left else 21,10+bob,11 if left else 22,12+bob),skin);R((12 if left else 19,9+bob,13 if left else 20,10+bob),INK)
   arm=1 if frame in [1,4] else -1
   R((7,18+bob,10,24+arm),shirt);R((8,24+arm,10,27+arm),skin);R((22,18+bob,24,24-arm),shirt);R((22,24-arm,24,27-arm),skin)
   if frame in [5,6]:
    gx=4 if direction==1 else 23 if direction==2 else 17;gy=20 if direction in [1,2] else 24 if direction==0 else 14
    R((gx,gy,gx+5,gy+2),'#a9a9b5');R((gx+2,gy+2,gx+3,gy+5),INK)
    if frame==6:d.polygon([(gx-3,gy-2),(gx-6,gy),(gx-3,gy+2),(gx,gy)],fill=GOLD)
   if frame==7:R((13,21,19,24),skin);R((16,19,18,25),INK)
   char.alpha_composite(im,(frame*32,(variant*4+direction)*40))
char.save(OUT/'characters.png',optimize=True)
# Cars: eight colours, 16 quantized directions. Fixed pixel rotations prevent blurry outlines.
vehicles=Image.new('RGBA',(64*16,64*8))
for variant,color in enumerate(['#d4769b','#60a7a6','#b9ad98','#7894bb','#cf9d69','#9180ab','#c2c9cc','#385a74']):
 im=Image.new('RGBA',(32,48));d=ImageDraw.Draw(im)
 d.rounded_rectangle((4,1,27,46),radius=4,fill=INK);d.rectangle((2,7,5,14),fill=INK);d.rectangle((26,7,29,14),fill=INK);d.rectangle((2,32,5,40),fill=INK);d.rectangle((26,32,29,40),fill=INK)
 d.rounded_rectangle((5,2,26,44),radius=3,fill=color);d.line((7,3,24,3),fill='#ece0cd');d.line((6,6,6,40),fill='#c3c8c5');d.line((25,6,25,40),fill='#47546b');d.rectangle((7,6,24,13),fill='#405b73');d.polygon([(8,7),(23,7),(10,12),(8,12)],fill='#96bcc4');d.line((8,13,23,13),fill=INK);d.rectangle((8,16,23,29),fill=color);d.line((9,17,22,17),fill='#d3c9bd');d.rectangle((7,31,24,37),fill='#29435b');d.polygon([(8,32),(23,32),(11,36),(8,36)],fill='#7699ad');d.line((7,40,24,40),fill='#626476');d.rectangle((6,3,10,4),fill='#fff1bf');d.rectangle((21,3,25,4),fill='#fff1bf');d.rectangle((6,42,10,44),fill='#e97586');d.rectangle((21,42,25,44),fill='#e97586');d.rectangle((13,43,18,44),fill='#d2c8b3');d.rectangle((4,18,5,25),fill='#23394e');d.rectangle((26,18,27,25),fill='#23394e');d.line((7,28,7,30),fill=INK);d.line((24,28,24,30),fill=INK)
 if variant==7:
  d.rectangle((8,16,23,29),fill='#cad4cd');d.rectangle((7,20,24,23),fill='#2a3653');d.rectangle((8,18,15,20),fill='#e3678e');d.rectangle((16,18,23,20),fill='#6c95ef')
 for angle in range(16):
  cell=Image.new('RGBA',(64,64));rot=im.rotate(-angle*22.5,resample=Image.Resampling.NEAREST,expand=True);cell.alpha_composite(rot,((64-rot.width)//2,(64-rot.height)//2));vehicles.alpha_composite(cell,(angle*64,variant*64))
vehicles.save(OUT/'vehicles.png',optimize=True)
(OUT/'atlas.json').write_text(json.dumps(manifest,indent=2)+'\n')
# A JS descriptor keeps the game usable on file:// as well as through a static server.
(OUT/'atlas.js').write_text('window.GLOWPORT_ATLAS='+json.dumps(manifest,separators=(',',':'))+';\n')
print('Wrote original material, prop, character, and vehicle atlases to',OUT)
# Original dialogue portraits: Vee, player, Jax, Roxy, DJ Sol, Mika; three expressions.
portraits=Image.new('RGBA',(64*6,80*3))
for person in range(6):
 for expression in range(3):
  im=Image.new('RGBA',(64,80));d=ImageDraw.Draw(im)
  skin=['#bd8d77','#d1a082','#b17a64','#b99282','#956c60','#d7af91'][person]
  shadow=['#895c60','#8b5f66','#7b5156','#886573','#634e5b','#9b7777'][person]
  hair=['#28364a','#22243c','#725955','#b2698e','#292538','#51434b'][person]
  coat=['#4d9e9b','#ce799e','#a28371','#8070b5','#727b9a','#aa946f'][person]
  d.polygon([(1,80),(4,59),(17,51),(22,48),(43,48),(47,54),(60,62),(64,80)],fill=INK)
  d.polygon([(5,80),(8,61),(23,53),(42,53),(57,64),(60,80)],fill=coat)
  d.polygon([(10,62),(22,55),(24,79),(10,79)],fill='#4f596c');d.polygon([(42,55),(55,64),(57,79),(40,79)],fill='#303b53')
  d.polygon([(24,45),(40,45),(42,56),(32,64),(23,55)],fill=shadow);d.polygon([(27,47),(38,47),(38,54),(32,58),(27,54)],fill=skin)
  d.polygon([(18,15),(25,10),(40,11),(47,18),(47,35),(41,46),(32,51),(22,45),(16,33)],fill=INK)
  d.polygon([(20,18),(28,13),(39,14),(44,20),(43,36),(38,44),(31,47),(24,42),(19,31)],fill=skin)
  d.polygon([(19,22),(24,18),(24,36),(31,44),(36,45),(31,47),(24,42),(19,31)],fill=shadow)
  d.polygon([(34,18),(40,21),(41,34),(36,39),(31,38),(34,31)],fill='#dcb59a' if person!=4 else '#b18a78')
  d.polygon([(15,19),(17,10),(25,5),(40,6),(47,13),(50,24),(44,28),(42,18),(33,14),(22,23),(20,33),(16,31)],fill=hair)
  d.line((22,12,31,9,41,11),fill='#88849b',width=2)
  if person==0:
   d.polygon([(18,18),(23,11),(30,9),(27,20),(19,29),(17,37),(15,25)],fill='#438a91');d.line((19,20,26,13),fill='#7ac7bb',width=2);d.rectangle((17,34,19,38),fill='#cbaa86')
  if person==1:d.polygon([(23,9),(32,5),(42,10),(33,10),(27,18),(20,20)],fill='#6c6595')
  if person==2:d.polygon([(23,38),(31,41),(41,36),(38,46),(31,49),(24,44)],fill='#66525a')
  if person==3:d.polygon([(14,13),(23,8),(20,27),(17,43),(12,39)],fill='#a76eac');d.polygon([(42,12),(48,15),(50,42),(43,40)],fill='#775b92')
  if person==4:
   d.ellipse((12,7,49,27),fill=hair);d.rectangle((17,24,21,37),fill='#56667b');d.rectangle((44,24,48,37),fill='#56667b');d.line((19,20,19,11,42,11,46,24),fill='#8aa0b0',width=2)
  eyeY=28 if expression!=1 else 29
  d.line((24,eyeY-2,29,eyeY-3 if expression==2 else eyeY-2),fill=hair);d.line((36,eyeY-2,41,eyeY-3 if expression==2 else eyeY-2),fill=hair)
  if expression==1:d.line((24,eyeY+1,29,eyeY),fill=INK);d.line((36,eyeY,41,eyeY+1),fill=INK)
  else:
   d.rectangle((24,eyeY,29,eyeY+2),fill='#d9d5c2');d.rectangle((36,eyeY,41,eyeY+2),fill='#e7dcc6');d.rectangle((27,eyeY,28,eyeY+2),fill='#283c49');d.rectangle((38,eyeY,39,eyeY+2),fill='#283c49')
  d.line((32,30,31,35,34,36),fill=shadow);d.line((29,40,36,40 if expression!=2 else 39),fill='#6b4c5a');d.point((35,41),fill='#efbca3')
  d.line((13,65,19,69,14,76),fill='#a3b6b6');d.line((49,66,51,77),fill='#738b9d');d.line((31,64,31,79),fill='#1f2b40');d.rectangle((39,68,45,69),fill='#bdd2c6')
  portraits.alpha_composite(im,(person*64,expression*80))
portraits.save(OUT/'portraits.png',optimize=True)
