"""Bundle the browser game into one offline HTML file, retaining editable sources."""
from pathlib import Path
import base64,hashlib,json,re,zipfile
ROOT=Path(__file__).resolve().parents[1];GAME=ROOT/'Glowport88';DIST=ROOT/'dist';DIST.mkdir(exist_ok=True)
html=(GAME/'Glowport88_ArtRehaul_v11.html').read_text()
html=re.sub(r'<link rel="stylesheet" href="(assets/[^"]+\.css)">',lambda m:'<style>'+(GAME/m[1]).read_text()+'</style>',html)
images={p.stem:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode() for p in (GAME/'assets').glob('*.png')}
def embed(match):
 code=(GAME/match[1]).read_text()
 if match[1]=='assets/art.js':
  code=code.replace("const base=new URL('.',document.currentScript.src);",'const embeddedImages='+json.dumps(images,separators=(',',':'))+';')
  code=code.replace("im.src=new URL(name+'.png',base).href",'im.src=embeddedImages[name]')
 return '<script>'+code.replace('</script','<\\/script')+'</script>'
html=re.sub(r'<script src="([^"]+)"></script>',embed,html)
out=DIST/'Glowport88-Midnight-Signal.html';out.write_text(html)
(DIST/'SHA256SUMS').write_text(hashlib.sha256(out.read_bytes()).hexdigest()+'  '+out.name+'\n')
print('Built',out,'('+str(out.stat().st_size)+' bytes)')
# Archive sources, original assets, tests, evidence and the standalone build. Never include dependencies or Git metadata.
archive=ROOT/'artifacts'/'Glowport88-Midnight-Signal.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(ROOT.rglob('*')):
  rel=p.relative_to(ROOT)
  if not p.is_file() or any(part in ['.git','node_modules','__pycache__'] for part in rel.parts) or p.suffix=='.zip' or p.name in ['smoke-failure.txt']:continue
  z.write(p,'Glowport88/'+str(rel))
print('Built',archive)
