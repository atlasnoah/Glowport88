/* Glowport '88: one authoritative, deterministic street and parcel layout. */
(function (global) {
  'use strict';

  const EPS = 0.0001;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const point = p => ({x: Number(p.x), y: Number(p.y)});
  const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const intersects = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w > b.x - pad && a.y < b.y + b.h + pad && a.y + a.h > b.y - pad;
  const bounds = (a, b, pad = 0) => ({x: Math.min(a.x, b.x) - pad, y: Math.min(a.y, b.y) - pad, w: Math.abs(a.x - b.x) + pad * 2, h: Math.abs(a.y - b.y) + pad * 2});
  const cross = (a, b) => a.x * b.y - a.y * b.x;

  function project(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    const x = a.x + dx * t, y = a.y + dy * t;
    return {x, y, t, d: Math.hypot(p.x - x, p.y - y)};
  }

  // Liang-Barsky clipping also handles horizontal, vertical and very short lanes.
  function lineRect(a, b, box, pad = 0) {
    const x0 = box.x - pad, x1 = box.x + box.w + pad, y0 = box.y - pad, y1 = box.y + box.h + pad;
    const dx = b.x - a.x, dy = b.y - a.y;
    let lo = 0, hi = 1;
    for (const [p, q] of [[-dx, a.x - x0], [dx, x1 - a.x], [-dy, a.y - y0], [dy, y1 - a.y]]) {
      if (Math.abs(p) < EPS) { if (q < 0) return false; }
      else {
        const u = q / p;
        if (p < 0) lo = Math.max(lo, u); else hi = Math.min(hi, u);
        if (lo > hi) return false;
      }
    }
    return true;
  }

  function segmentBoxDistance(a, b, box) {
    if (lineRect(a, b, box)) return 0;
    const corners = [{x: box.x, y: box.y}, {x: box.x + box.w, y: box.y}, {x: box.x, y: box.y + box.h}, {x: box.x + box.w, y: box.y + box.h}];
    const endpointDistance = p => Math.hypot(Math.max(box.x - p.x, 0, p.x - box.x - box.w), Math.max(box.y - p.y, 0, p.y - box.y - box.h));
    return Math.min(endpointDistance(a), endpointDistance(b), ...corners.map(p => project(p, a, b).d));
  }

  function index(cellSize = 240) {
    const cells = new Map();
    function keys(b) {
      const result = [];
      for (let y = Math.floor(b.y / cellSize); y <= Math.floor((b.y + b.h) / cellSize); y++)
        for (let x = Math.floor(b.x / cellSize); x <= Math.floor((b.x + b.w) / cellSize); x++) result.push(x + ':' + y);
      return result;
    }
    return {
      add(item, b = item) { for (const key of keys(b)) { if (!cells.has(key)) cells.set(key, []); cells.get(key).push(item); } },
      query(b) { const found = new Set(); for (const key of keys(b)) for (const item of cells.get(key) || []) found.add(item); return Array.from(found); }
    };
  }

  function create(options = {}) {
    const MW = options.MW || 7200, MH = options.MH || 5040;
    const lands = options.lands || [];
    const roads = [], segments = [], buildings = (options.landmarkBuildings || []).slice();
    const landmarks = options.landmarks || buildings.map(b => b.landmark).filter(Boolean);
    const trees = [], debris = [], streetlights = [], spaces = [], lots = [], access = [], details = [], districtRoutes = {};
    const neighborhoods = [{id: 'east-diner', district: 'east', name: 'EAST DINER NEIGHBORHOOD', x0: 5580, x1: 6380, y0: 1900, y1: 2480}];
    const roadIndex = index(280), buildingIndex = index(220), lotIndex = index(220), spaceIndex = index(280), reservedIndex = index(220);
    const reserved = [], rawSegments = [];
    let seed = 0x88c17a, houseCount = 0, serial = 0;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const pick = a => a[Math.floor(random() * a.length)];
    const districtAt = (x, y) => lands.find(d => x >= d.x0 && x < d.x1 && y >= d.y0 && y < d.y1) || lands.find(d => d.id === 'west') || {id: x < 2200 ? 'west' : x > 5000 ? 'east' : y < 1530 ? 'north' : y > 3530 ? 'south' : 'core', roofs: ['#7d8194']};
    const boxInside = b => b.x >= 76 && b.y >= 76 && b.x + b.w <= MW - 76 && b.y + b.h <= MH - 76;
    for (const b of buildings) buildingIndex.add(b);

    function road(name, district, coords, w, type = 'residential', extra = {}) {
      const points = coords.map(p => Array.isArray(p) ? {x: p[0], y: p[1]} : point(p));
      const r = {id: 'road-' + roads.length, name, district, points, w, type, vehicle: w >= 42 && type !== 'walkway', ...extra};
      roads.push(r);
      const bb = {x: Math.min(...points.map(p => p.x)) - w / 2, y: Math.min(...points.map(p => p.y)) - w / 2, w: 0, h: 0};
      bb.w = Math.max(...points.map(p => p.x)) + w / 2 - bb.x; bb.h = Math.max(...points.map(p => p.y)) + w / 2 - bb.y;
      r.bounds = bb; roadIndex.add(r, bb);
      for (let i = 1; i < points.length; i++) if (length(points[i - 1], points[i]) > EPS) {
        const s = {a: points[i - 1], b: points[i], w, path: r, road: r, vehicle: r.vehicle};
        segments.push(s); rawSegments.push(s);
      }
      return r;
    }

    // Only three long avenues cross the city. Local streets merge into larger,
    // quieter blocks, while the compact downtown retains a useful street grid.
    road('Sunset Parkway', 'west', [[1960, 280], [1960, 4770]], 80, 'avenue');
    road('Harbor Avenue', 'east', [[5200, 280], [5200, 4770]], 80, 'avenue');
    road('Neon Grand Avenue', 'core', [[190, 2540], [7010, 2540]], 84, 'avenue');
    road('Crescent Boulevard', 'north', [[1960, 840], [5200, 840]], 66, 'avenue');
    road('Palm Boulevard', 'south', [[1960, 4240], [5200, 4240]], 66, 'coastal');
    road('Cassette Avenue', 'core', [[3400, 840], [3400, 4240]], 70, 'avenue');

    districtRoutes.west = road('Sunset Treeway', 'west', [[1960, 840], [1320, 840], [700, 960], [450, 1380], [360, 2020], [430, 2650], [650, 3200], [1040, 3560], [1590, 3700], [1960, 3560], [1960, 840]], 54, 'residential', {loop: true});
    road('Rosewood Crescent', 'west', [[1960, 840], [1760, 420], [1300, 350], [920, 500], [820, 760], [1320, 840]], 50, 'residential');
    road('Palm Motel Road', 'west', [[435, 1520], [1121, 1520], [1960, 1520]], 54, 'neighborhood');
    road('Dead Air Road', 'west', [[380, 2200], [1060, 2200], [1960, 2200]], 56, 'neighborhood');
    road('Maple Bend', 'west', [[1960, 1860], [1570, 1780], [1250, 1800], [980, 1940], [800, 2200]], 48, 'residential');
    road('Willow Family Loop', 'west', [[430, 2650], [800, 2540], [1260, 2620], [1580, 2860], [1620, 3160], [1260, 3320], [850, 3220], [650, 3200]], 50, 'residential');
    road('Star Arcade Road', 'west', [[1040, 3560], [1481, 3560], [1960, 3560]], 56, 'neighborhood');
    road('Palmetto Crescent', 'west', [[1960, 3560], [1960, 4240], [1640, 4540], [1100, 4680], [600, 4460], [420, 4000], [650, 3600], [1040, 3560]], 50, 'residential');
    road('Peach Tree Lane', 'west', [[1960, 1180], [1640, 1100], [1360, 1100], [1120, 1180], [840, 1300], [435, 1520]], 48, 'residential');
    road('Sunset School Street', 'west', [[1960, 1860], [1750, 1600], [1480, 1510], [1280, 1580], [900, 1700], [650, 1830], [390, 1810]], 48, 'residential');
    road('Cypress Lane', 'west', [[1960, 2540], [1710, 2390], [1450, 2430], [1160, 2330], [860, 2370], [660, 2540]], 48, 'residential');
    road('Willow East Link', 'west', [[1620, 3160], [1820, 3040], [1960, 2880]], 46, 'residential');
    road('South Sunset Lane', 'west', [[1960, 3900], [1700, 4000], [1400, 3900], [1130, 3820], [850, 3970], [420, 4000]], 48, 'residential');
    road('Palmetto Garden Lane', 'west', [[1960, 4580], [1690, 4350], [1450, 4180], [1400, 3900]], 48, 'residential');

    districtRoutes.north = road('Crescent Heights Scenic Loop', 'north', [[2320, 840], [2280, 480], [2560, 300], [3100, 240], [3760, 280], [4320, 350], [4680, 560], [4840, 840], [4480, 1100], [3880, 1220], [3200, 1200], [2620, 1110], [2320, 840]], 54, 'residential', {loop: true});
    road('Crescent School Turnoff', 'north', [[2620, 1110], [2320, 1180], [1960, 1180]], 80, 'residential');
    road('Crescent Estate Lane', 'north', [[2280, 480], [2640, 680], [3100, 580], [3400, 460], [3880, 460], [4330, 510], [4680, 560]], 48, 'residential');
    road('Crescent Garden Terrace', 'north', [[2620, 1110], [2820, 1390], [3340, 1410], [3900, 1410], [4480, 1300], [4840, 840]], 48, 'residential');

    districtRoutes.core = road('Downtown Circuit', 'core', [[2680, 1860], [4480, 1860], [4480, 3220], [2680, 3220], [2680, 1860]], 66, 'downtown', {loop: true});
    road('Armory Street', 'core', [[1960, 2200], [5200, 2200]], 66, 'downtown');
    road('Violet North Street', 'core', [[2320, 1520], [4840, 1520]], 60, 'downtown');
    road('Violet South Street', 'core', [[2320, 3560], [4840, 3560]], 60, 'downtown');
    road('Record Service Alley', 'core', [[3040, 1860], [3040, 2880], [3760, 2880], [3760, 3220]], 28, 'alley', {vehicle: false});
    road('Cassette Service Alley', 'core', [[4480, 1860], [4840, 1860], [4840, 3220], [4480, 3220]], 28, 'alley', {vehicle: false});
    road('Downtown West Street', 'core', [[2320, 1520], [2320, 3560]], 58, 'downtown');
    road('Downtown East Street', 'core', [[4840, 1520], [4840, 3560]], 58, 'downtown');
    road('Record Avenue', 'core', [[3040, 1520], [3040, 3560]], 54, 'downtown');
    road('Violet Avenue', 'core', [[3760, 1520], [3760, 3560]], 54, 'downtown');
    road('Arcade Avenue', 'core', [[4120, 1520], [4120, 3560]], 54, 'downtown');
    road('Neon South Street', 'core', [[2320, 2880], [4840, 2880]], 58, 'downtown');

    districtRoutes.south = road('Palm Waterfront Drive', 'south', [[1960, 4240], [2300, 4580], [2921, 4580], [3400, 4700], [4000, 4740], [4620, 4570], [5200, 4240], [1960, 4240]], 58, 'coastal', {loop: true});
    road('Bungalow Bend', 'south', [[1960, 3560], [2400, 3650], [3000, 3760], [3620, 3680], [4240, 3650], [4800, 3820], [5200, 4240]], 50, 'residential');
    road('Seafoam Lane', 'south', [[2320, 3560], [2500, 3900], [2980, 4050], [3400, 3980], [3720, 3970], [4100, 3900], [4480, 4030], [4800, 3820]], 48, 'residential');
    road('Boathouse Neighborhood Lane', 'south', [[2300, 4580], [2340, 4300], [2600, 4240]], 48, 'residential');
    road('Marina Garden Lane', 'south', [[3400, 4240], [3440, 4470], [3720, 4530], [4050, 4460], [4400, 4490], [4620, 4570]], 48, 'residential');

    districtRoutes.east = road('Eastside Freight Loop', 'east', [[5200, 1520], [5800, 1400], [6500, 1520], [6820, 1920], [6880, 2540], [6680, 3220], [6100, 3560], [5520, 3420], [5200, 3220], [5200, 1520]], 70, 'industrial', {loop: true});
    road('East Diner Road', 'east', [[5200, 2200], [5801, 2200], [6847, 2200]], 58, 'neighborhood');
    road('Dockside Access', 'east', [[5200, 2880], [6140, 2880], [6780, 2880]], 64, 'industrial');
    road('Foundry Workers Crescent', 'east', [[5200, 840], [5480, 420], [6000, 310], [6600, 420], [6870, 800], [6720, 1150], [6200, 1260], [5700, 1160], [5200, 840]], 50, 'residential', {loop: true});
    road('Eastside Garden Loop', 'east', [[5200, 4240], [5520, 3860], [6120, 3740], [6660, 3980], [6880, 4440], [6560, 4780], [5960, 4750], [5480, 4580], [5200, 4240]], 50, 'residential', {loop: true});
    road('Foundry Logistics Road', 'east', [[5200, 1860], [5680, 1750], [6200, 1830], [6580, 1830], [6820, 1920]], 62, 'industrial');
    road('Dockyard Service Road', 'east', [[5560, 1520], [5560, 2540], [5740, 2880], [5700, 3450]], 58, 'industrial');
    road('Freight Factory Road', 'east', [[6500, 1520], [6470, 2200], [6460, 2540], [6490, 2880], [6680, 3220]], 62, 'industrial');
    road('Foundry Family Lane', 'east', [[5200, 840], [5540, 740], [5780, 620], [6280, 600], [6600, 820], [6720, 1150]], 48, 'residential');
    road('Worker Garden Lane', 'east', [[5520, 3860], [5650, 4180], [5800, 4420], [6200, 4440], [6570, 4290], [6660, 3980]], 48, 'residential');

    // Short local links make the interiors of the large blocks inhabited,
    // while their curves and varied junctions preserve the suburban character.
    road('Sunset West Garden Lane', 'west', [[450, 1380], [190, 1580], [170, 2200], [190, 2540]], 46, 'residential');
    road('Maple Garden Link', 'west', [[1320, 840], [1400, 1160], [1480, 1510]], 46, 'residential');
    road('Willow Parkside Lane', 'west', [[1040, 3560], [1080, 3180], [1240, 2940], [1260, 2620]], 46, 'residential');
    road('Palmetto West Link', 'west', [[600, 4460], [710, 4190], [850, 3970]], 46, 'residential');
    road('Crescent Overlook Lane', 'north', [[2280, 480], [2520, 520], [2840, 840], [3200, 1010], [3710, 1040], [4120, 940], [4480, 1100]], 48, 'residential');
    road('Palm Bay Gardens', 'south', [[2400, 3650], [2250, 3900], [2280, 4100], [2500, 4240]], 48, 'residential');
    road('Marina Cottage Lane', 'south', [[3720, 3970], [3740, 4180], [3720, 4530]], 46, 'residential');
    road('Foundry North Homes', 'east', [[5480, 420], [5480, 210], [6000, 160], [6460, 230], [6600, 420]], 48, 'residential');
    road('Worker Bay Terrace', 'east', [[5960, 4750], [5990, 4520], [6200, 4440]], 46, 'residential');
    road('Diner Magnolia Lane', 'east', [[5800, 1400], [6000, 1640], [6050, 1900], [6240, 2010], [6340, 2200]], 48, 'residential');
    road('Diner Palm Lane', 'east', [[5801, 2200], [5801, 2380], [6040, 2420], [6290, 2360], [6460, 2540]], 48, 'residential');

    function culdesac(name, district, coords) {
      const end = coords[coords.length - 1], cx = end[0], cy = end[1], r = 45;
      const stem = road(name, district, coords, 48, 'culdesac', {deadEnd: true, turningRadius: r + 24});
      // The turning circle is actual drivable geometry, including its radial
      // connection, so a car can turn around without crossing anyone's yard.
      const ring = [[cx, cy], [cx + r, cy]];
      for (let i = 1; i <= 12; i++) ring.push([cx + Math.cos(i * Math.PI / 6) * r, cy + Math.sin(i * Math.PI / 6) * r]);
      road(name + ' Turning Circle', district, ring, 48, 'turnaround', {loop: false, turningCircle: true});
      stem.turnaround = {x: cx, y: cy, r: r + 24};
    }
    culdesac('Juniper Court', 'west', [[920, 500], [620, 520], [480, 700]]);
    culdesac('Garden Court', 'west', [[1570, 1780], [1550, 1900], [1460, 2000]]);
    culdesac('Willow Court', 'west', [[1260, 2620], [1140, 2850], [1000, 2900]]);
    culdesac('Palmetto Court', 'west', [[1100, 4680], [1120, 4400], [980, 4190]]);
    culdesac('Lookout Estates', 'north', [[3100, 240], [3000, 450], [2880, 560]]);
    culdesac('Crescent Gardens', 'north', [[4320, 350], [4330, 510], [4200, 600]]);
    culdesac('Marina Bungalow Court', 'south', [[3000, 3760], [2860, 3950], [2700, 4010]]);
    culdesac('Seafoam Court', 'south', [[4620, 4570], [4580, 4340], [4430, 4180]]);
    culdesac('Foundry Family Court', 'east', [[6200, 1260], [6180, 980], [6000, 900]]);
    culdesac('Worker Garden Court', 'east', [[6120, 3740], [6120, 3980], [5940, 4110]]);

    // Keep the twelve established buildings and exact mission entrances. Each
    // receives a visible frontage and a separate pedestrian approach.
    for (const l of landmarks) {
      const b = l.building || buildings.find(v => v.landmark === l);
      if (!b) continue;
      const door = {x: Number.isFinite(l.x) ? l.x : b.doorX, y: Number.isFinite(l.y) ? l.y : b.doorY};
      const row = door.y + 53, left = door.x < 1960 ? 1960 : door.x > 5200 ? 5200 : door.x < 3400 ? 2680 : 4480;
      // Existing main routes already supply most frontages. A short, explicit
      // connection also protects compatibility with any moved/custom landmark.
      if (!segments.some(s => s.vehicle && project({x: door.x, y: row}, s.a, s.b).d < 1)) road(l.name + ' Frontage', b.district || l.district, [[left, row], [door.x, row]], 54, 'frontage');
      const approach = road(l.name + ' Approach', b.district || l.district, [[door.x, row], [door.x, door.y]], 14, 'walkway', {vehicle: false, landmark: l.key});
      const corridor = {x: door.x - 24, y: b.y + b.h + 3, w: 48, h: row - b.y - b.h + 28};
      reserved.push(corridor); reservedIndex.add(corridor);
      access.push({key: l.key, building: b, door, road: {x: door.x, y: row}, approach});
    }
    const schoolForecourt = {x: 2230, y: 1090, w: 220, h: 190};
    reserved.push(schoolForecourt); reservedIndex.add(schoolForecourt);

    function roadHits(box, padding = 0) {
      for (const r of roadIndex.query(box)) for (let i = 1; i < r.points.length; i++) if (segmentBoxDistance(r.points[i - 1], r.points[i], box) < r.w / 2 + padding) return true;
      return false;
    }
    function canLot(box) {
      return boxInside(box) && !roadHits(box, 7) && !lotIndex.query(box).some(l => intersects(box, l, 7)) && !buildingIndex.query(box).some(b => intersects(box, b, 22)) && !reservedIndex.query(box).some(b => intersects(box, b));
    }
    function clearLine(a, b, radius = 9, ignore = null) {
      return !buildingIndex.query(bounds(a, b, radius)).some(v => v !== ignore && lineRect(a, b, v, radius));
    }
    const weights = {
      west: [['house', 66], ['apartment', 12], ['commercial', 5], ['civic', 3], ['park', 14]],
      north: [['house', 74], ['apartment', 9], ['commercial', 3], ['civic', 2], ['park', 12]],
      core: [['house', 8], ['commercial', 38], ['apartment', 29], ['civic', 6], ['industrial', 4], ['park', 15]],
      south: [['house', 61], ['apartment', 15], ['commercial', 8], ['civic', 3], ['park', 13]],
      east: [['house', 47], ['apartment', 11], ['commercial', 6], ['industrial', 19], ['civic', 3], ['park', 14]]
    };
    function zoneFor(d, r) {
      if (r.type === 'industrial' && d === 'east') return random() < .78 ? 'industrial' : random() < .5 ? 'civic' : 'park';
      const n = random() * 100; let total = 0;
      for (const [kind, value] of weights[d] || weights.west) { total += value; if (n < total) return kind; }
      return 'house';
    }
    const palettes = {
      west: ['#ce9c89', '#90aaa0', '#c4aa87', '#a6a7b8', '#9cab82'],
      north: ['#d3bf9c', '#b5c5b6', '#b8b5ce', '#c5b7a7', '#9fb9b1'],
      south: ['#d5b18c', '#a6bdb0', '#c7adbe', '#adc9c6', '#d1c49b'],
      east: ['#a4ada1', '#c1a38e', '#999fb0', '#b2b29b', '#b49d96'],
      core: ['#899bab', '#ad96aa', '#a5ada0', '#8a97ac', '#b4aaa4']
    };
    const names = {commercial: ['CORNER MARKET', 'LAUNDROMAT', 'PALM COFFEE', 'VIDEO RENTAL', 'FAMILY BAKERY', 'NIGHT PHARMACY', 'SCOOPS', 'NEON NOODLES'], apartment: ['PALM COURT', 'CITY FLATS', 'SUNSET APARTMENTS', 'CRESCENT TERRACE'], industrial: ['FREIGHT & STORAGE', 'AUTO WORKS', 'MACHINE SHOP', 'HARBOR SUPPLY', 'POWER SUBSTATION'], civic: ['COMMUNITY HALL', 'NEIGHBORHOOD SCHOOL', 'FIRE STATION', 'CITY LIBRARY']};

    function approachFor(b, lot, near) {
      const door = {x: b.doorX, y: b.doorY};
      const candidates = [[door, near]];
      // South-facing homes on the north side of a road have a direct garden
      // walk; other lots use their open side yard rather than the house itself.
      for (const x of [lot.x + 3, lot.x + lot.w - 3]) candidates.push([door, {x, y: door.y}, {x, y: near.y}, near]);
      for (const path of candidates) if (path.slice(1).every((p, i) => clearLine(path[i], p, 9, null) && !lineRect(path[i], p, b, 9))) return path;
      return null;
    }

    function addParcel(r, sample, tangent, side, forcedKind = null) {
      const d = districtAt(sample.x, sample.y).id, kind = forcedKind || zoneFor(d, r);
      const upscale = d === 'north', core = d === 'core';
      const w = kind === 'house' ? 68 + Math.floor(random() * (upscale ? 49 : 39)) : kind === 'industrial' ? 142 + Math.floor(random() * 68) : kind === 'apartment' ? 100 + Math.floor(random() * 32) : 82 + Math.floor(random() * (core ? 48 : 34));
      const h = kind === 'house' ? 58 + Math.floor(random() * (upscale ? 39 : 29)) : kind === 'industrial' ? 100 + Math.floor(random() * 42) : kind === 'apartment' ? 102 + Math.floor(random() * 40) : 72 + Math.floor(random() * 34);
      const lw = kind === 'park' ? 152 : w + (upscale ? 56 : kind === 'house' ? 40 : 28), lh = kind === 'park' ? 142 : h + (upscale ? 60 : kind === 'house' ? 44 : 32);
      const nx = -tangent.y * side, ny = tangent.x * side;
      const offset = (Math.abs(nx) * lw + Math.abs(ny) * lh) / 2 + r.w / 2 + 12;
      const cx = sample.x + nx * offset, cy = sample.y + ny * offset;
      const lot = {x: Math.round(cx - lw / 2), y: Math.round(cy - lh / 2), w: lw, h: lh};
      if (!canLot(lot)) return false;
      if (kind === 'park') {
        const space = {...lot, id: 'space-' + spaces.length, kind: random() < .18 ? 'community' : core ? 'plaza' : 'park', type: core ? 'plaza' : 'park', district: d, variant: spaces.length % 5};
        spaces.push(space); debris.push({...space, type: space.kind === 'community' ? 'park' : space.kind}); spaceIndex.add(space); lotIndex.add(space);
        for (let i = 0; i < 6; i++) trees.push({x: lot.x + 18 + random() * (lot.w - 36), y: lot.y + 18 + random() * (lot.h - 36), size: 10 + random() * 6, kind: d === 'south' ? 'palm' : 'round', c: '#3f805d'});
        return true;
      }
      const b = {id: 'parcel-' + serial++, x: Math.round(cx - w / 2), y: Math.round(cy - h / 2 - 9), w, h, district: d, kind, zone: kind === 'house' ? 'residential' : kind, variant: kind === 'house' ? houseCount % 15 : serial % 6, roof: pick((lands.find(v => v.id === d) || {}).roofs || ['#7e8296']), palette: pick(palettes[d] || palettes.west), name: kind === 'house' ? '' : pick(names[kind]), lot};
      const entry = [.505, .505, .81, .425, .36, .5, .54, .505, .5, .61, .67, .505, .45, .48, .45];
      b.doorX = Math.round(b.x + b.w * (kind === 'house' ? entry[b.variant] : .5)); b.doorY = b.y + b.h + 11;
      const near = {x: sample.x, y: sample.y};
      // Test the footprint before the approach, including its own north wall.
      if (roadHits(b, 13) || buildingIndex.query(b).some(v => intersects(b, v, 24))) return false;
      const path = approachFor(b, lot, near);
      if (!path) return false;
      buildingIndex.add(b);
      lot.kind = kind; lot.district = d; lot.buildingId = b.id; lot.variant = b.variant;
      lot.frontY = b.y + b.h + 2;
      const parking = {x: b.x + b.w - 24, y: b.y + b.h + 23};
      const drives = [[parking, near], [parking, {x: near.x, y: parking.y}, near], [parking, {x: parking.x, y: near.y}, near]];
      const driveway = kind === 'house' && drives.find(ps => ps.slice(1).every((p, i) => clearLine(ps[i], p, 19)));
      lot.driveway = driveway || null; lot.drivewayW = 40;
      lot.drivewayX = driveway ? parking.x - 20 : null;
      lot.parking = driveway ? parking : null;
      lot.approach = path; lot.access = near; lot.style = d === 'north' ? 'estate' : d === 'east' ? 'worker' : d === 'south' ? 'coastal' : 'suburban';
      lot.fence = kind === 'house' && random() < .74 ? (d === 'east' ? 'chain' : random() < .35 ? 'hedge' : 'wood') : null;
      lot.flowers = kind === 'house' && random() < .62; lot.patio = kind === 'house' && random() < .4; lot.mailbox = kind === 'house';
      lot.parkedCar = !!driveway && random() < .3;
      // Garage architecture stays within the building's collision footprint.
      // A detached solid may be added only with matching collision geometry.
      lot.garage = null;
      buildings.push(b); lots.push(lot); lotIndex.add(lot);
      if (kind === 'house') houseCount++;
      // Trees sit in reserved back corners, leaving the front garden walk open.
      for (let i = 0; i < (upscale ? 2 : random() < .7 ? 1 : 0); i++) {
        const tx = i ? lot.x + lot.w - 13 : lot.x + 13, ty = lot.y + 13;
        if (clearLine({x: tx, y: ty}, {x: tx, y: ty}, 12)) trees.push({x: tx, y: ty, size: upscale ? 16 : 11 + random() * 3, kind: d === 'south' ? 'palm' : 'round', c: pick(['#477c58', '#5b8d65', '#387451'])});
      }
      return true;
    }

    // Purposeful neighborhood anchors sit on the diner's existing main road.
    const dinerStreet = roads.find(r => r.name === 'East Diner Road');
    function dinerBusiness(name, variant, x) {
      const start = buildings.length;
      for (const candidate of [x, x - 110, x + 110, x - 220, x + 220, 6120, 6100, 6140, 6110, 5650, 5770, 6290]) for (const side of [-1, 1]) if (addParcel(dinerStreet, {x: candidate, y: 2200}, {x: 1, y: 0}, side, 'commercial')) {
        const b = buildings[start]; b.name = name; b.variant = variant; b.neighborhood = 'east-diner'; return b;
      }
      return null;
    }
    const dinerParking = {x: 5935, y: 2250, w: 160, h: 90, kind: 'parking', type: 'parking', district: 'east', neighborhood: 'east-diner', variant: 0, id: 'east-diner-parking', access: {x: 6015, y: 2200}};
    if (canLot(dinerParking)) { spaces.push(dinerParking); debris.push(dinerParking); spaceIndex.add(dinerParking); lotIndex.add(dinerParking); }
    dinerBusiness('EAST DINER FUEL', 2, 5990);
    const corner = dinerBusiness('MAGNOLIA CORNER STORE', 0, 6170);
    if (!corner) {
      const lane = roads.find(r => r.name === 'Diner Palm Lane'), len = Math.hypot(250, -60), start = buildings.length;
      for (const x of [6180, 6210, 6150, 6240]) { let placed = false; for (const side of [-1, 1]) if (addParcel(lane, {x, y: 2420 - (x - 6040) * 60 / 250}, {x: 250 / len, y: -60 / len}, side, 'commercial')) { const b = buildings[start]; b.name = 'MAGNOLIA CORNER STORE'; b.variant = 0; b.neighborhood = 'east-diner'; placed = true; break; } if (placed) break; }
    }

    // Parcel frontage is sampled from actual streets, not the old anchor grid.
    // A deterministic spacing change and road bends break up repeated rows.
    const parcelRoads = roads.filter(r => r.vehicle && r.type !== 'turnaround' && r.type !== 'frontage');
    for (let pass = 0; pass < 6; pass++) for (const r of parcelRoads) {
      let carry = pass === 0 ? 70 + random() * 35 : pass === 1 ? 130 : pass === 2 ? 190 : pass === 3 ? 40 : pass === 4 ? 100 : 225;
      for (let i = 1; i < r.points.length; i++) {
        const a = r.points[i - 1], b = r.points[i], len = length(a, b), tangent = {x: (b.x - a.x) / len, y: (b.y - a.y) / len};
        for (let u = carry; u < len - 24; u += r.type === 'industrial' ? 238 : r.district === 'north' ? 196 : r.type === 'downtown' ? 150 : 164) {
          const sample = {x: a.x + tangent.x * u, y: a.y + tangent.y * u};
          for (const side of [-1, 1]) addParcel(r, sample, tangent, side);
        }
        carry = pass === 0 ? 80 + random() * 35 : pass === 1 ? 130 : pass === 2 ? 190 : pass === 3 ? 40 : pass === 4 ? 100 : 225;
      }
    }

    // Complete a few intentionally large communal spaces inside merged blocks.
    const greens = [
      ['west', 650, 1100, 280, 190, 'community'], ['west', 690, 3750, 310, 220, 'park'],
      ['north', 3500, 350, 290, 195, 'park'], ['south', 3530, 4380, 300, 190, 'park'],
      ['east', 5610, 4350, 260, 180, 'community']
    ];
    for (const [district, x, y, w, h, kind] of greens) {
      const box = {x, y, w, h};
      if (!canLot(box)) continue;
      const s = {...box, kind, type: 'park', district, variant: spaces.length % 5, id: 'space-' + spaces.length};
      spaces.push(s); debris.push({...s, type: 'park'}); spaceIndex.add(s); lotIndex.add(s);
      for (let i = 0; i < 8; i++) trees.push({x: x + 18 + random() * (w - 36), y: y + 18 + random() * (h - 36), size: 11 + random() * 6, kind: district === 'south' ? 'palm' : 'round', c: '#4c865d'});
    }

    // Verify every driveway against the completed neighborhood, rather than
    // assuming a later neighboring parcel cannot obstruct its turn.
    for (const b of buildings) if (b.lot?.driveway && !b.lot.driveway.slice(1).every((p, i) => clearLine(b.lot.driveway[i], p, 19))) { b.lot.driveway = null; b.lot.parking = null; b.lot.parkedCar = false; }

    // Ordinary street furniture follows district land use and actual curbs.
    // Small props remain scenery so they never steal an essential walking lane.
    for (const r of roads) {
      if (!r.vehicle || r.type === 'turnaround' || r.type === 'frontage') continue;
      let serial = 0;
      for (let i = 1; i < r.points.length; i++) {
        const a = r.points[i - 1], b = r.points[i], len = length(a, b), dx = (b.x - a.x) / len, dy = (b.y - a.y) / len;
        for (let u = 110; u < len - 60; u += 330) {
          const side = serial++ % 2 ? -1 : 1, offset = r.w / 2 + 18, x = Math.round(a.x + dx * u - dy * offset * side), y = Math.round(a.y + dy * u + dx * offset * side);
          if (solid(x, y, 12) || isRoad(x, y) || access.some(l => length({x, y}, l.door) < 65)) continue;
          const pool = r.district === 'core' ? ['busstop', 'parkingmeter', 'phonebooth', 'bicycle', 'bench', 'trashbin'] : r.type === 'industrial' ? ['dumpster', 'barrier', 'roadsign', 'powerpole'] : ['powerpole', 'bench', 'hydrant', 'noticeboard', 'bicycle', 'streetname'];
          const type = pool[(details.length + serial) % pool.length];
          details.push({type, kind: type, x, y, district: r.district, text: r.name.toUpperCase(), w: 18, h: 26});
        }
      }
    }

    // Roadside lamps have actual curb offsets and never occupy an entrance.
    for (const s of segments) {
      if (s.path.type === 'walkway' || s.path.type === 'turnaround' || s.path.type === 'alley') continue;
      const len = length(s.a, s.b), dx = (s.b.x - s.a.x) / len, dy = (s.b.y - s.a.y) / len;
      for (let u = 75; u < len - 48; u += s.path.type === 'industrial' ? 190 : 160) for (const side of [-1, 1]) {
        const x = s.a.x + dx * u - dy * side * (s.w / 2 + 10), y = s.a.y + dy * u + dx * side * (s.w / 2 + 10);
        if (x > 40 && y > 40 && x < MW - 40 && y < MH - 40 && !buildingIndex.query({x: x - 12, y: y - 12, w: 24, h: 24}).some(b => !b.rejected && intersects({x: x - 7, y: y - 7, w: 14, h: 14}, b)) && !reserved.some(c => x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h)) streetlights.push({x, y, district: s.path.district, residential: s.path.type === 'residential'});
      }
    }

    function solid(x, y, radius = 0) {
      if (x - radius < 22 || y - radius < 22 || x + radius > MW - 22 || y + radius > MH - 22) return true;
      return buildingIndex.query({x: x - radius, y: y - radius, w: radius * 2, h: radius * 2}).some(b => !b.rejected && x > b.x - radius && x < b.x + b.w + radius && y > b.y - radius && y < b.y + b.h + radius);
    }
    function nearestSafe(x, y, radius = 9, opts = {}) {
      if (typeof radius === 'object') { opts = radius; radius = opts.vehicle ? 19 : 9; }
      if (!solid(x, y, radius) && (!opts.vehicle || isRoad(x, y, radius))) return {x, y};
      const near = nearest(x, y, {vehicle: !!opts.vehicle, radius});
      if (near && !solid(near.x, near.y, radius)) return {x: near.x, y: near.y};
      for (let r = 24; r < 520; r += 24) for (let i = 0; i < 20; i++) {
        const a = i * Math.PI / 10, p = {x: clamp(x + Math.cos(a) * r, 24 + radius, MW - 24 - radius), y: clamp(y + Math.sin(a) * r, 24 + radius, MH - 24 - radius)};
        if (!solid(p.x, p.y, radius) && (!opts.vehicle || isRoad(p.x, p.y, radius))) return p;
      }
      return near ? {x: near.x, y: near.y} : {x: 1960, y: 2540};
    }

    // Split every actual crossing, including a local lane joining the middle
    // of an avenue. Visual roads and graph topology cannot silently diverge.
    const split = rawSegments.map(() => [0, 1]);
    function addT(i, t) { if (t >= -EPS && t <= 1 + EPS) split[i].push(clamp(t, 0, 1)); }
    for (let i = 0; i < rawSegments.length; i++) for (let j = i + 1; j < rawSegments.length; j++) {
      const s = rawSegments[i], t = rawSegments[j];
      if (!intersects(bounds(s.a, s.b, .1), bounds(t.a, t.b, .1))) continue;
      const r = {x: s.b.x - s.a.x, y: s.b.y - s.a.y}, v = {x: t.b.x - t.a.x, y: t.b.y - t.a.y}, q = {x: t.a.x - s.a.x, y: t.a.y - s.a.y}, den = cross(r, v);
      if (Math.abs(den) > EPS) {
        const u = cross(q, v) / den, w = cross(q, r) / den;
        if (u >= -EPS && u <= 1 + EPS && w >= -EPS && w <= 1 + EPS) { addT(i, u); addT(j, w); }
      } else if (Math.abs(cross(q, r)) < .01) {
        for (const p of [t.a, t.b]) { const p0 = project(p, s.a, s.b); if (p0.d < .01) addT(i, p0.t); }
        for (const p of [s.a, s.b]) { const p0 = project(p, t.a, t.b); if (p0.d < .01) addT(j, p0.t); }
      }
    }
    const nodes = [], edges = [], nodeIds = new Map(), edgeIds = new Map(), edgeIndex = index(280);
    function nodeFor(p) {
      const key = Math.round(p.x * 1000) + ':' + Math.round(p.y * 1000);
      if (!nodeIds.has(key)) { nodeIds.set(key, nodes.length); nodes.push({id: nodes.length, x: p.x, y: p.y, edges: []}); }
      return nodeIds.get(key);
    }
    for (let i = 0; i < rawSegments.length; i++) {
      const s = rawSegments[i], ts = Array.from(new Set(split[i].map(t => Math.round(t * 10000000) / 10000000))).sort((a, b) => a - b);
      for (let j = 1; j < ts.length; j++) {
        const a = nodeFor({x: s.a.x + (s.b.x - s.a.x) * ts[j - 1], y: s.a.y + (s.b.y - s.a.y) * ts[j - 1]}), b = nodeFor({x: s.a.x + (s.b.x - s.a.x) * ts[j], y: s.a.y + (s.b.y - s.a.y) * ts[j]});
        if (a === b) continue;
        const key = Math.min(a, b) + ':' + Math.max(a, b), previous = edgeIds.get(key);
        if (previous != null) { if (s.w > edges[previous].w) { edges[previous].w = s.w; edges[previous].road = s.path; edges[previous].vehicle = s.vehicle; } continue; }
        const e = {id: edges.length, a, b, w: s.w, road: s.path, segment: s, vehicle: s.vehicle, length: length(nodes[a], nodes[b])};
        edgeIds.set(key, e.id); edges.push(e); nodes[a].edges.push(e.id); nodes[b].edges.push(e.id); edgeIndex.add(e, bounds(nodes[a], nodes[b], s.w / 2));
      }
    }
    const intersections = nodes.filter(n => n.edges.filter(id => edges[id].vehicle).length >= 3).map(n => ({x: n.x, y: n.y, degree: n.edges.length}));

    function roadEligible(e, opts) { return !opts.vehicle || (e.vehicle && e.w >= (opts.radius || 19) * 2 + 2); }
    function nearest(x, y, opts = {}) {
      if (typeof x === 'object') { opts = y || {}; y = x.y; x = x.x; }
      const p = {x, y}; let best = null;
      for (let range = 120; range <= 960; range *= 2) {
        const candidates = edgeIndex.query({x: x - range, y: y - range, w: range * 2, h: range * 2});
        for (const e of candidates) {
          if (!roadEligible(e, opts)) continue;
          const hit = project(p, nodes[e.a], nodes[e.b]);
          if ((!best || hit.d < best.d) && !solid(hit.x, hit.y, opts.radius || (opts.vehicle ? 19 : 9))) best = {...hit, w: e.w, width: e.w, road: e.road, segment: e.segment, edge: e};
        }
        if (best && best.d < range) return best;
      }
      for (const e of edges) if (roadEligible(e, opts)) {
        const hit = project(p, nodes[e.a], nodes[e.b]);
        if ((!best || hit.d < best.d) && !solid(hit.x, hit.y, opts.radius || (opts.vehicle ? 19 : 9))) best = {...hit, w: e.w, width: e.w, road: e.road, segment: e.segment, edge: e};
      }
      return best;
    }
    function isRoad(x, y, radius = 0) {
      if (typeof x === 'object') { radius = y || 0; y = x.y; x = x.x; }
      for (const r of roadIndex.query({x: x - 1, y: y - 1, w: 2, h: 2})) {
        if (!r.vehicle || r.w / 2 < radius) continue;
        for (let i = 1; i < r.points.length; i++) if (project({x, y}, r.points[i - 1], r.points[i]).d <= r.w / 2 - radius + .01) return true;
      }
      return false;
    }

    // Cache shortest-path trees by fixed graph origin. Projected endpoints move
    // independently, so choosing their cheaper endpoint must happen every call.
    const routeCache = new Map();
    function treeFrom(start, opts, radius) {
      const key = (opts.vehicle ? 'v:' : 'p:') + radius + ':' + start;
      if (routeCache.has(key)) { const tree = routeCache.get(key); routeCache.delete(key); routeCache.set(key, tree); return tree; }
      const costs = new Float64Array(nodes.length); costs.fill(Infinity); costs[start] = 0;
      const previous = new Int32Array(nodes.length); previous.fill(-1);
      const heap = [{id: start, cost: 0}];
      function push(value) { let i = heap.length; heap.push(value); while (i) { const parent = (i - 1) >> 1; if (heap[parent].cost <= value.cost) break; heap[i] = heap[parent]; i = parent; } heap[i] = value; }
      function pop() { const first = heap[0], last = heap.pop(); if (heap.length) { let i = 0; while (i * 2 + 1 < heap.length) { let child = i * 2 + 1; if (child + 1 < heap.length && heap[child + 1].cost < heap[child].cost) child++; if (heap[child].cost >= last.cost) break; heap[i] = heap[child]; i = child; } heap[i] = last; } return first; }
      while (heap.length) {
        const next = pop(); if (next.cost > costs[next.id] + .0001) continue;
        for (const edgeId of nodes[next.id].edges) {
          const e = edges[edgeId]; if (!roadEligible(e, {...opts, radius})) continue;
          const id = e.a === next.id ? e.b : e.a, cost = next.cost + e.length;
          if (cost + .0001 < costs[id]) { costs[id] = cost; previous[id] = next.id; push({id, cost}); }
        }
      }
      const tree = {costs, previous}; routeCache.set(key, tree);
      if (routeCache.size > 128) routeCache.delete(routeCache.keys().next().value);
      return tree;
    }
    function footConnector(p, radius) {
      if (solid(p.x, p.y, radius)) return null;
      const near = nearest(p.x, p.y, {radius}); if (!near) return null;
      if (clearLine(p, near, radius)) return {near, points: length(p, near) > .05 ? [point(p), point(near)] : [point(p)]};
      // Side and north-facing parcels deliberately route around their own house.
      // Reuse that authored garden walk instead of dropping the requested door.
      const localLots = lotIndex.query({x: p.x - 5, y: p.y - 5, w: 10, h: 10});
      let best = null;
      for (const lot of localLots) {
        const approach = lot.approach; if (!approach?.length) continue;
        for (let i = 0; i < approach.length; i++) {
          if (!clearLine(p, approach[i], radius)) continue;
          const points = [point(p), ...approach.slice(i).map(point)], end = points.at(-1), projected = nearest(end.x, end.y, {radius});
          if (!projected || !clearLine(end, projected, radius)) continue;
          if (length(end, projected) > .05) points.push(point(projected));
          const cost = points.slice(1).reduce((sum, q, j) => sum + length(points[j], q), 0);
          if (!best || cost < best.cost) best = {near: projected, points, cost};
        }
      }
      if (best) return best;
      // Free sidewalk/park endpoints can use the closest visible street segment.
      for (const range of [160, 360, 760]) {
        const candidates = [];
        for (const e of edgeIndex.query({x: p.x - range, y: p.y - range, w: range * 2, h: range * 2})) {
          const hit = project(p, nodes[e.a], nodes[e.b]);
          if (hit.d > range || solid(hit.x, hit.y, radius) || !clearLine(p, hit, radius)) continue;
          candidates.push({...hit, w: e.w, road: e.road, segment: e.segment, edge: e});
        }
        candidates.sort((a, b) => a.d - b.d);
        if (candidates.length) return {near: candidates[0], points: [point(p), point(candidates[0])]};
      }
      return null;
    }
    function route(from, to, opts = {}) {
      if (!from || !to || !Number.isFinite(from.x) || !Number.isFinite(from.y) || !Number.isFinite(to.x) || !Number.isFinite(to.y)) return null;
      const radius = opts.radius || (opts.vehicle ? 19 : 9);
      const startLink = opts.vehicle ? null : footConnector(from, radius), endLink = opts.vehicle ? null : footConnector(to, radius);
      const start = opts.vehicle ? nearest(from.x, from.y, {...opts, radius}) : startLink?.near;
      const end = opts.vehicle ? nearest(to.x, to.y, {...opts, radius}) : endLink?.near;
      if (!start || !end) return null;
      const finish = path => {
        const ps = [...(startLink?.points || []), ...path.map(point), ...(endLink?.points.slice().reverse() || [])];
        return ps.filter((p, i) => !i || length(p, ps[i - 1]) > .05);
      };
      if (start.edge.id === end.edge.id) return finish([start, end]);
      let best = null;
      for (const a of [start.edge.a, start.edge.b]) {
        const tree = treeFrom(a, opts, radius);
        for (const b of [end.edge.a, end.edge.b]) {
          const cost = length(start, nodes[a]) + tree.costs[b] + length(nodes[b], end);
          if (!Number.isFinite(cost) || best && cost >= best.cost) continue;
          best = {cost, a, b, tree};
        }
      }
      if (!best) return null;
      const ids = []; for (let id = best.b; id >= 0; id = best.tree.previous[id]) ids.push(id); ids.reverse();
      return finish([start, ...ids.map(id => nodes[id]), end]);
    }

    const navigation = {nodes, edges, intersections, nearest, route, routePath: route, path: route, isRoad, districtRoutes, access};
    const collision = {solid, nearestSafe, clearLine};
    function components(vehicle) {
      const seen = new Set(); let count = 0;
      for (const node of nodes) {
        if (seen.has(node.id) || !node.edges.some(id => !vehicle || edges[id].vehicle)) continue;
        count++; const queue = [node.id]; seen.add(node.id);
        for (let i = 0; i < queue.length; i++) for (const id of nodes[queue[i]].edges) {
          const e = edges[id]; if (vehicle && !e.vehicle) continue;
          const next = e.a === queue[i] ? e.b : e.a; if (!seen.has(next)) { seen.add(next); queue.push(next); }
        }
      }
      return count;
    }
    function diagnostics() {
      const buildingsByKind = {}, zones = {}, byDistrict = {}, variants = new Set();
      for (const b of buildings) {
        buildingsByKind[b.kind] = (buildingsByKind[b.kind] || 0) + 1;
        const zone = b.zone || (b.kind === 'landmark' ? 'special' : b.kind); zones[zone] = (zones[zone] || 0) + 1;
        if (!byDistrict[b.district]) byDistrict[b.district] = {total: 0, house: 0, commercial: 0, apartment: 0, industrial: 0, civic: 0, landmark: 0};
        byDistrict[b.district].total++; byDistrict[b.district][b.kind] = (byDistrict[b.district][b.kind] || 0) + 1;
        if (b.kind === 'house') variants.add(b.variant);
      }
      zones.park = spaces.filter(s => ['park', 'community', 'plaza'].includes(s.kind)).length;
      const overlaps = [];
      for (const b of buildings) for (const r of roadIndex.query(b)) {
        for (let i = 1; i < r.points.length; i++) if (segmentBoxDistance(r.points[i - 1], r.points[i], b) < r.w / 2) { overlaps.push({building: b.id || (b.landmark || {}).key, road: r.name}); break; }
      }
      const landmarkConnectivity = access.map(a => ({key: a.key, foot: !!route(access[0].door, a.door), vehicle: !!route(access[0].road, a.road, {vehicle: true}), doorClear: !solid(a.door.x, a.door.y, 9)}));
      return {buildings: buildings.length, buildingsByKind, zones, byDistrict, houseVariants: Array.from(variants).sort((a, b) => a - b), neighborhoods: neighborhoods.map(n => ({...n})), driveways: lots.filter(l => l.driveway).length, streetDetails: details.length, roads: roads.length, curvedRoads: roads.filter(r => r.points.length >= 4 && r.type !== 'downtown' && r.type !== 'walkway').length, culdesacs: roads.filter(r => r.deadEnd).length, navNodes: nodes.length, navEdges: edges.length, components: components(false), vehicleComponents: components(true), roadBuildingOverlaps: overlaps, landmarkConnectivity};
    }
    return {MW, MH, roads, segments, buildings, trees, debris, streetlights, spaces, lots, access, details, neighborhoods, districtRoutes, intersections, navigation, collision, diagnostics,
      queryRoads: (x, y, w, h) => roadIndex.query({x, y, w, h}),
      queryBuildings: (x, y, w, h) => buildingIndex.query({x, y, w, h}).filter(b => !b.rejected),
      querySpaces: (x, y, w, h) => spaceIndex.query({x, y, w, h})};
  }

  global.GlowportCityLayout = {create};
  if (typeof module !== 'undefined' && module.exports) module.exports = global.GlowportCityLayout;
})(typeof window !== 'undefined' ? window : globalThis);
