'use strict';
// Isolated production renderer tests in Chromium: recorded geometry ignores paint
// colours, while pixel hashes verify deterministic output. The contact sheet is a
// review artifact; these assertions cannot substitute for an art review.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'Glowport88/assets/environment-art.js');
const artifactPath = path.join(root, 'artifacts');
const passed = [];
function check(name, run) { run(); passed.push(name); console.log('PASS environment art:', name); }

(async () => {
  new vm.Script(fs.readFileSync(sourcePath, 'utf8'), { filename: sourcePath });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 670 }, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#101b27;color:#eee6ce;font-family:monospace}canvas{display:block;image-rendering:pixelated}</style></head><body><canvas id="sheet" width="900" height="670"></canvas></body></html>');
    // A command spy on real contexts exercises the same Canvas implementation as
    // the game, including its offscreen sprite contexts. Ignore colours in the
    // geometry signature so palette swaps cannot pass as separate architectures.
    await page.evaluate(() => {
      window.__environmentProbe = { commands: [], surfaces: [], recording: false };
      const createElement = document.createElement.bind(document);
      document.createElement = function (name, options) {
        const element = createElement(name, options);
        if (String(name).toLowerCase() === 'canvas') __environmentProbe.surfaces.push(element);
        return element;
      };
      const methods = ['fillRect', 'strokeRect', 'clearRect', 'rect', 'moveTo', 'lineTo', 'translate', 'scale', 'rotate', 'arc', 'ellipse', 'quadraticCurveTo', 'bezierCurveTo', 'drawImage'];
      for (const method of methods) {
        const original = CanvasRenderingContext2D.prototype[method];
        CanvasRenderingContext2D.prototype[method] = function (...args) {
          if (__environmentProbe.recording) __environmentProbe.commands.push([method, ...args.filter(value => typeof value === 'number')]);
          return Reflect.apply(original, this, args);
        };
      }
    });
    await page.addScriptTag({ path: sourcePath });
    const result = await page.evaluate(() => {
      const E = window.GlowportEnvironment;
      if (!E) throw new Error('GlowportEnvironment must be exposed in the browser');
      for (const method of ['drawBuilding', 'drawLot', 'drawSpace', 'diagnostics', 'clearCache']) {
        if (typeof E[method] !== 'function') throw new Error('Missing renderer method: ' + method);
      }
      const hash = values => {
        let value = 2166136261;
        for (const byte of values) value = Math.imul(value ^ byte, 16777619);
        return (value >>> 0).toString(16).padStart(8, '0');
      };
      const textHash = value => hash(new TextEncoder().encode(JSON.stringify(value)));
      const fixture = variant => ({ x: 30, y: 20, w: 110, h: 92, kind: 'house', variant, district: 'south', lot: { x: 4, y: 4, w: 162, h: 148 }, doorX: 85, doorY: 112 });
      const specimen = document.createElement('canvas');
      specimen.width = 180; specimen.height = 170;
      const context = specimen.getContext('2d', { willReadFrequently: true });
      context.imageSmoothingEnabled = false;
      const render = (building, capture = true) => {
        context.clearRect(0, 0, specimen.width, specimen.height);
        __environmentProbe.recording = false;
        E.drawLot(context, building);
        __environmentProbe.commands = [];
        __environmentProbe.recording = capture;
        E.drawBuilding(context, building);
        __environmentProbe.recording = false;
        const commands = __environmentProbe.commands;
        const pixels = context.getImageData(0, 0, specimen.width, specimen.height).data;
        let opaquePixels = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) opaquePixels++;
        return { commands, geometryHash: textHash(commands), pixelHash: hash(pixels), opaquePixels };
      };
      const variants = [];
      for (let variant = 0; variant < 15; variant++) {
        E.clearCache();
        const first = render(fixture(variant));
        E.clearCache();
        const second = render(fixture(variant));
        variants.push({ variant, name: E.architectures?.[variant]?.name, ...first, repeatGeometryHash: second.geometryHash, repeatPixelHash: second.pixelHash });
      }
      const badCoordinates = [];
      const integerMethods = new Set(['fillRect', 'clearRect', 'rect', 'translate', 'drawImage']);
      const pathMethods = new Set(['strokeRect', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo']);
      for (const variant of variants) {
        for (const command of variant.commands) {
          const numbers = command.slice(1);
          // A 1px Canvas stroke uses half-pixel endpoints to align with the
          // physical pixel grid. Filled raster primitives remain integer based.
          if (numbers.some(number => !Number.isFinite(number) || (integerMethods.has(command[0]) && !Number.isInteger(number)) || (pathMethods.has(command[0]) && !Number.isInteger(number * 2)))) {
            badCoordinates.push({ variant: variant.variant, command });
          }
        }
      }
      // Run each building family without relying on any approved landmark atlas.
      const families = [];
      for (const [index, kind] of ['apartment', 'commercial', 'industrial', 'civic', 'special'].entries()) {
        E.clearCache();
        const rendered = render({ ...fixture(index), kind, name: 'CITY TEST' });
        families.push({ kind, geometryHash: rendered.geometryHash, opaquePixels: rendered.opaquePixels });
      }
      const spaces = [];
      for (const [kind, variant] of [...Array.from({ length: 5 }, (_, index) => ['park', index]), ['community', 0], ['plaza', 0], ['parking', 0]]) {
        context.clearRect(0, 0, specimen.width, specimen.height);
        __environmentProbe.commands = []; __environmentProbe.recording = true;
        E.drawSpace(context, { x: 4, y: 4, w: 168, h: 152, kind, variant, district: 'south' });
        __environmentProbe.recording = false;
        const pixels = context.getImageData(0, 0, specimen.width, specimen.height).data;
        let opaquePixels = 0;
        for (let index = 3; index < pixels.length; index += 4) if (pixels[index]) opaquePixels++;
        spaces.push({ kind, variant, geometryHash: textHash(__environmentProbe.commands), pixelHash: hash(pixels), commands: __environmentProbe.commands.length, opaquePixels });
      }
      const details=[];
      for(const kind of ['bench','busstop','bicycle','phonebooth','noticeboard','roadsign','parkingmeter','dumpster','barrier','hydrant','trashbin','powerpole']){
        context.clearRect(0,0,specimen.width,specimen.height);E.drawDetail(context,{kind,x:85,y:85,label:'PALM ST'});
        const pixels=context.getImageData(0,0,specimen.width,specimen.height).data;let opaquePixels=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])opaquePixels++;
        details.push({kind,pixelHash:hash(pixels),opaquePixels});
      }
      // Real layout paths may approach from a side or the north. Render their
      // exact polylines and ensure fencing leaves a car-width opening.
      const accessCanvas=document.createElement('canvas');accessCanvas.width=280;accessCanvas.height=250;
      const accessContext=accessCanvas.getContext('2d',{willReadFrequently:true});
      const pathBuilding={x:50,y:45,w:90,h:70,kind:'house',variant:0,district:'west',lot:{x:20,y:20,w:160,h:180,fence:'wood',mailbox:false,flowers:false,approach:[{x:95,y:126},{x:180,y:126},{x:180,y:40},{x:230,y:40}],driveway:[{x:150,y:150},{x:230,y:150}],drivewayW:42}};
      E.drawLot(accessContext,pathBuilding);
      const pixel=(x,y)=>Array.from(accessContext.getImageData(x,y,1,1).data);
      const access={northEndpoint:pixel(225,40),driveCenter:pixel(220,150),driveUpper:pixel(220,132),driveLower:pixel(220,168),fenceOpening:pixel(178,150)};
      accessContext.clearRect(0,0,280,250);E.drawLot(accessContext,{...pathBuilding,kind:'apartment'});access.nonhomeEndpoint=pixel(225,40);
      const garage={x:195,y:180,w:24,h:26},garageBuilding={...pathBuilding,lot:{...pathBuilding.lot,garage}};
      accessContext.clearRect(0,0,280,250);E.drawLot(accessContext,garageBuilding);access.unregisteredGarage=pixel(207,199);
      accessContext.clearRect(0,0,280,250);E.drawLot(accessContext,{...garageBuilding,solidRects:[garage]});access.registeredGarage=pixel(207,199);
      E.clearCache();
      // Unique actual roof materials exceed the cache budget even when the
      // same structural home stamp is shared across differently sized parcels.
      const cacheSurfaceStart = __environmentProbe.surfaces.length;
      for (let index = 0; index < 200; index++) {
        const building = fixture(index % 15);
        building.w = 80 + index % 50;
        building.h = 68 + Math.floor(index / 50);
        building.roof = '#'+(0x456789+index*157).toString(16).padStart(6,'0');
        E.drawBuilding(context, building);
      }
      const bounded = E.diagnostics();
      const sizeBeforeHit = bounded.size;
      const hitsBefore = bounded.hits;
      const last = fixture(199 % 15); last.w = 80 + 199 % 50; last.h = 68 + Math.floor(199 / 50);last.roof='#'+(0x456789+199*157).toString(16).padStart(6,'0');
      E.drawBuilding(context, last);
      const afterHit = E.diagnostics();
      const cacheSurfaces = __environmentProbe.surfaces.slice(cacheSurfaceStart);
      const residentSurfaces = cacheSurfaces.filter(surface => surface.width > 0 && surface.height > 0);
      const residentBytes = residentSurfaces.reduce((bytes, surface) => bytes + surface.width * surface.height * 4, 0);
      const zeroedEvictions = cacheSurfaces.filter(surface => surface.width === 0 && surface.height === 0).length;
      E.clearCache();
      const cleared = E.diagnostics();
      const allSurfacesReleased = cacheSurfaces.every(surface => surface.width === 0 && surface.height === 0);
      const metadata = (E.architectures || []).map(item => ({ ...item }));
      return {
        metadata,
        variants: variants.map(({ commands, ...variant }) => ({ ...variant, commands: commands.length })),
        badCoordinates: badCoordinates.slice(0, 12),
        families,
        spaces,
        details,
        access,
        cache: { bounded, afterHit, cleared, sizeBeforeHit, hitsBefore, allocatedSurfaces: cacheSurfaces.length, residentSurfaces: residentSurfaces.length, residentBytes, zeroedEvictions, allSurfacesReleased }
      };
    });

    check('fifteen named architectures have distinct recorded geometry', () => {
      assert.equal(result.metadata.length, 15);
      assert.equal(new Set(result.metadata.map(item => item.id)).size, 15);
      assert(result.metadata.every(item => typeof item.name === 'string' && item.name.length > 2));
      assert.equal(new Set(result.variants.map(item => item.geometryHash)).size, 15, 'Palette-independent drawing geometry must distinguish all architectures');
      assert(result.variants.every(item => item.commands > 20 && item.opaquePixels > 2500), 'Every architecture must render a substantial detailed building');
    });
    check('all fifteen renders repeat exactly after cache disposal', () => {
      for (const variant of result.variants) {
        assert.equal(variant.geometryHash, variant.repeatGeometryHash, variant.name + ' geometry changed on repeat');
        assert.equal(variant.pixelHash, variant.repeatPixelHash, variant.name + ' pixels changed on repeat');
      }
    });
    check('raster coordinates are integers and strokes use the pixel grid', () => assert.deepEqual(result.badCoordinates, []));
    check('apartment, commercial, industrial, civic and special render independently', () => {
      assert(result.families.every(item => item.opaquePixels > 2500));
      assert.equal(new Set(result.families.map(item => item.geometryHash)).size, 5);
    });
    check('five park layouts and community, plaza and parking spaces render distinctly', () => {
      assert(result.spaces.every(item => item.commands > 20 && item.opaquePixels > 2500));
      assert.equal(new Set(result.spaces.map(item => item.geometryHash)).size, 8);
    });
    check('ordinary city details render as twelve distinct native pixel props',()=>{
      assert.equal(result.details.length,12);assert(result.details.every(d=>d.opaquePixels>20),'Every prop must paint visible pixels');
      assert.equal(new Set(result.details.map(d=>d.pixelHash)).size,12);
    });
    check('side and north paths reach streets and vehicle-width openings stay clear', () => {
      assert.deepEqual(result.access.northEndpoint,[186,178,154,255]);
      assert.deepEqual(result.access.nonhomeEndpoint,[186,178,154,255]);
      for(const pixel of [result.access.driveCenter,result.access.driveUpper,result.access.driveLower,result.access.fenceOpening])assert.deepEqual(pixel,[164,164,146,255],'A driveable approach must keep its width and explicit fence opening');
      assert.equal(result.access.unregisteredGarage[3],0,'A detached garage without matching collision metadata must stay absent');
      assert.equal(result.access.registeredGarage[3],255,'A registered detached garage must render');
    });
    check('sprite cache is bounded, reused and releases evicted surfaces', () => {
      const { bounded, afterHit, cleared, sizeBeforeHit, hitsBefore, allocatedSurfaces, residentSurfaces, residentBytes, zeroedEvictions, allSurfacesReleased } = result.cache;
      assert(Number.isInteger(bounded.limit) && bounded.limit > 0 && bounded.limit <= 128);
      assert(bounded.size > 0 && bounded.size <= bounded.limit);
      assert(Number.isFinite(bounded.bytes) && bounded.bytes > 0);
      assert.equal(residentSurfaces, bounded.size, 'Reported cache size must match live backing stores');
      assert.equal(residentBytes, bounded.bytes, 'Reported cache bytes must match live backing stores');
      assert.equal(afterHit.size, sizeBeforeHit);
      assert(afterHit.hits > hitsBefore, 'Rendering the last sprite again must hit the cache');
      assert(allocatedSurfaces > bounded.limit, 'The test must allocate enough sprites to exercise eviction');
      assert(zeroedEvictions > 0, 'Eviction must release a backing store');
      assert.equal(cleared.size, 0);
      assert.equal(cleared.bytes, 0);
      assert(allSurfacesReleased, 'Clear must release every cached backing store');
    });

    await page.evaluate(() => {
      const E = GlowportEnvironment, canvas = document.querySelector('#sheet'), context = canvas.getContext('2d');
      context.imageSmoothingEnabled = false;
      context.fillStyle = '#101b27'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#f0e9d2'; context.font = 'bold 21px monospace'; context.fillText('GLOWPORT ’88 — ORIGINAL NEIGHBORHOOD ARCHITECTURE', 22, 31);
      context.font = '12px monospace'; context.fillStyle = '#94b5bc'; context.fillText('15 construction types · equal 110 × 92 footprints · production pixel renderer', 22, 53);
      for (let variant = 0; variant < 15; variant++) {
        const x = 12 + variant % 5 * 177, y = 69 + Math.floor(variant / 5) * 190;
        const building = { x: x + 31, y: y + 12, w: 110, h: 92, kind: 'house', variant, district: 'south', lot: { x: x + 4, y: y + 1, w: 162, h: 148 }, doorX: x + 86, doorY: y + 104 };
        context.fillStyle = '#1e3039'; context.fillRect(x, y, 173, 182);
        E.drawLot(context, building); E.drawBuilding(context, building);
        context.fillStyle = '#f0e9d2'; context.font = 'bold 11px monospace';
        const name = String(E.architectures[variant].name);
        context.fillText(String(variant + 1).padStart(2, '0') + ' ' + name, x + 7, y + 166, 161);
      }
      context.font = '11px monospace'; context.fillStyle = '#94b5bc'; context.fillText('Chromium canvas capture • geometry, deterministic pixels and bounded cache checked separately', 22, 658);
    });
    fs.mkdirSync(artifactPath, { recursive: true });
    await page.screenshot({ path: path.join(artifactPath, 'environment-contact-sheet.png') });
    check('standalone Chromium rendering raises no runtime errors', () => assert.deepEqual(errors, []));
    fs.writeFileSync(path.join(artifactPath, 'environment-art-results.json'), JSON.stringify({
      time: new Date().toISOString(), passed, errors, ...result,
      scope: 'Isolated production Canvas renderer in desktop Chromium. Recorded paint-independent geometry distinguishes 15 house architectures; exact pixels verify repeatability, not visual quality. Cache reuse, 128-surface ceiling, eviction and explicit backing-store disposal are checked. The labeled contact sheet supports separate human art review. Host zoning, collisions, landmark preservation, gameplay and real-device performance require their integration suites.'
    }, null, 2));
    console.log(`${passed.length} environment art checks passed`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
