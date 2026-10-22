'use strict';
const assert = require('node:assert/strict');
const {create} = require('../Glowport88/assets/city-layout.js');

function fixture() {
  const lands = [
    {id: 'west', x0: 28, x1: 2200, y0: 28, y1: 5012, roofs: ['#79768e', '#ac778a', '#ba9776']},
    {id: 'core', x0: 2200, x1: 5000, y0: 1530, y1: 3530, roofs: ['#7d668b', '#748ca2', '#9b6c88']},
    {id: 'north', x0: 2200, x1: 5000, y0: 28, y1: 1530, roofs: ['#658da0', '#8e9274', '#797a9d']},
    {id: 'south', x0: 2200, x1: 5000, y0: 3530, y1: 5012, roofs: ['#a48a74', '#83a09c', '#87748b']},
    {id: 'east', x0: 5000, x1: 7172, y0: 28, y1: 5012, roofs: ['#7e9299', '#967c72', '#716b90']}
  ];
  // Established 0.5.0 rectangles and entrances, deliberately circular exactly
  // like the host objects: the rebuild must preserve the original references.
  const old = [
    ['hotel', 'core', 3559, 2386, 141, 88, 3630, 2487], ['armory', 'core', 3942, 2046, 118, 88, 4001, 2147],
    ['club', 'core', 4302, 3066, 118, 88, 4361, 3167], ['records', 'core', 2862, 3066, 118, 88, 2921, 3167],
    ['radio', 'west', 1001, 2046, 118, 88, 1060, 2147], ['arcade', 'west', 1422, 3406, 118, 88, 1481, 3507],
    ['motel', 'west', 1062, 1366, 118, 88, 1121, 1467], ['warehouse', 'east', 6060, 2713, 160, 101, 6140, 2827],
    ['diner', 'east', 5742, 2046, 118, 88, 5801, 2147], ['observatory', 'north', 3582, 686, 118, 88, 3641, 787],
    ['clinic', 'south', 3942, 4086, 118, 88, 4001, 4187], ['pier', 'south', 2862, 4426, 118, 88, 2921, 4527]
  ];
  const landmarkBuildings = [], landmarks = [];
  for (const [key, district, x, y, w, h, doorX, doorY] of old) {
    const l = {key, name: key.toUpperCase(), district, x: doorX, y: doorY};
    const b = {kind: 'landmark', district, x, y, w, h, doorX, doorY, landmark: l};
    l.building = b; landmarks.push(l); landmarkBuildings.push(b);
  }
  return {MW: 7200, MH: 5040, lands, roadXs: Array.from({length: 20}, (_, i) => 160 + i * 360), roadYs: Array.from({length: 15}, (_, i) => 160 + i * 340), STREET: 66, landmarkBuildings, landmarks};
}

const input = fixture(), before = input.landmarkBuildings.map(b => [b, b.x, b.y, b.w, b.h, b.doorX, b.doorY]);
const started = performance.now(), city = create(input), elapsed = performance.now() - started, d = city.diagnostics();
assert.equal(d.components, 1, 'all pedestrian roads connect');
assert.equal(d.vehicleComponents, 1, 'all drivable roads connect');
assert.deepEqual(d.roadBuildingOverlaps, [], 'visible roads never cross a footprint');
assert.equal(d.houseVariants.length, 15, 'all fifteen architectural house variants occur');
assert.ok(d.buildingsByKind.house > 140, 'whole residential neighborhoods are present');
assert.ok(d.curvedRoads >= 10 && d.culdesacs >= 6, 'actual curved streets and dead ends replace the grid');
for (const district of ['west', 'north', 'south', 'east']) assert.ok(d.byDistrict[district].house > d.byDistrict[district].commercial * (district === 'east' ? 2 : 3), district + ' has homes rather than repeated storefronts');
assert.ok(d.byDistrict.core.commercial + d.byDistrict.core.apartment > d.byDistrict.core.house, 'downtown remains dense and mixed');
for (const [b, ...rect] of before) {
  assert.ok(city.buildings.includes(b), 'original landmark object retained');
  assert.deepEqual([b.x, b.y, b.w, b.h, b.doorX, b.doorY], rect, 'landmark rectangles and doors unchanged');
}
assert.ok(d.landmarkConnectivity.every(a => a.foot && a.vehicle && a.doorClear), 'all twelve preserved entrances are reachable');
assert.ok(!city.collision.solid(2320, 1180, 19) && city.navigation.isRoad(2320, 1180, 19), 'legacy driving test position remains on real road');
for (const x of [2250, 2320, 2390]) for (const y of [1110, 1180, 1250]) assert.ok(!city.collision.solid(x, y, 19), 'school forecourt keeps test maneuvering space');

function validateRoute(path, vehicle, label) {
  assert.ok(path && path.length, label + ' has route');
  const radius = vehicle ? 19 : 9;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 7));
    for (let j = 0; j <= n; j++) {
      const x = a.x + (b.x - a.x) * j / n, y = a.y + (b.y - a.y) * j / n;
      assert.ok(!city.collision.solid(x, y, radius), label + ' remains collision-clear at ' + x + ',' + y);
      if (vehicle) assert.ok(city.navigation.isRoad(x, y, radius), label + ' stays on a real drivable street');
    }
  }
}
let tested = 0;
for (let i = 0; i < input.landmarks.length; i++) for (let j = i + 1; j < input.landmarks.length; j++) {
  const a = input.landmarks[i], b = input.landmarks[j];
  for (const vehicle of [false, true]) {
    const path = city.navigation.route(a, b, {vehicle});
    validateRoute(path, vehicle, a.key + '→' + b.key + (vehicle ? ' vehicle' : ' foot'));
    if (!vehicle) assert.ok(Math.hypot(path.at(-1).x - b.x, path.at(-1).y - b.y) < .1, 'walking route ends at exact story door');
    tested++;
  }
}
for (const r of city.roads.filter(r => r.deadEnd)) {
  const a = r.points[0], b = r.points.at(-1);
  validateRoute(city.navigation.route(a, b, {vehicle: true}), true, r.name + ' outward');
  validateRoute(city.navigation.route(b, a, {vehicle: true}), true, r.name + ' return');
}
for (const b of city.buildings.filter(b => b.kind === 'house')) {
  assert.ok(!city.collision.solid(b.doorX, b.doorY, 9), 'home entrance clear');
  validateRoute(b.lot.approach, false, 'garden walk ' + b.id);
  assert.ok(b.lot.approach.length >= 2 && city.navigation.isRoad(b.lot.access.x, b.lot.access.y), 'garden walk connects to actual street');
}
// Exact property endpoints must use real garden approaches, including homes
// on the south side of a road. A merely projected route can hide a bad connector.
for (const b of city.buildings.filter(b => b.kind === 'house')) {
  const door = {x: b.doorX, y: b.doorY}, destination = input.landmarks[0];
  const path = city.navigation.route(door, destination);
  assert.ok(path && Math.hypot(path[0].x - door.x, path[0].y - door.y) < .1, 'garden route preserves requested home endpoint ' + b.id);
  validateRoute(path, false, 'home-to-hotel ' + b.id);
  const reverse = city.navigation.route(destination, door);
  assert.ok(reverse && Math.hypot(reverse.at(-1).x - door.x, reverse.at(-1).y - door.y) < .1, 'garden route preserves destination ' + b.id);
  validateRoute(reverse, false, 'hotel-to-home ' + b.id);
  if (b.lot.driveway) validateRoute(b.lot.driveway, false, 'driveway foot ' + b.id);
}
assert.ok(city.buildings.length >= 400, 'subdivisions have sufficient purposeful density');
assert.ok(city.neighborhoods.some(n => n.id === 'east-diner' && n.district === 'east'), 'East Diner is a named neighborhood with compatible district id');
for (const name of ['EAST DINER FUEL', 'MAGNOLIA CORNER STORE']) assert.ok(city.buildings.some(b => b.name === name && b.neighborhood === 'east-diner'), 'Diner neighborhood contains ' + name);
assert.ok(city.spaces.some(s => s.id === 'east-diner-parking'), 'Diner neighborhood has a real parking parcel');
assert.ok(city.lots.filter(l => l.driveway).length >= 30, 'meaningful street-connected driveways');
for (const lot of city.lots.filter(l => l.driveway)) {
  assert.ok(lot.drivewayW >= 40 && city.navigation.isRoad(lot.driveway.at(-1).x, lot.driveway.at(-1).y), 'driveway connects to actual road at vehicle width');
  const path = lot.driveway;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], steps = Math.max(1, Math.ceil(Math.hypot(a.x - b.x, a.y - b.y) / 5));
    for (let n = 0; n <= steps; n++) assert.ok(!city.collision.solid(a.x + (b.x - a.x) * n / steps, a.y + (b.y - a.y) * n / steps, 19), 'actual car clearance along driveway');
  }
}
assert.ok(city.details.length >= 100 && new Set(city.details.map(d => d.type)).size >= 10, 'contextual ordinary street details');
for (const r of Object.values(city.districtRoutes)) {
  assert.deepEqual(r.points[0], r.points.at(-1), r.district + ' traffic loop closes');
  validateRoute(r.points, true, r.district + ' traffic loop');
}
const again = create(fixture());
const longEdge = city.navigation.edges.find(e => e.vehicle && e.length > 300), edgeA = city.navigation.nodes[longEdge.a], edgeB = city.navigation.nodes[longEdge.b];
const along = t => ({x: edgeA.x + (edgeB.x - edgeA.x) * t, y: edgeA.y + (edgeB.y - edgeA.y) * t});
const pathLength = ps => ps.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - ps[i].x, p.y - ps[i].y), 0);
city.navigation.route(along(.02), input.landmarks[0], {vehicle: true});
const movedWarm = city.navigation.route(along(.98), input.landmarks[0], {vehicle: true}), movedCold = again.navigation.route(along(.98), input.landmarks[0], {vehicle: true});
assert.ok(Math.abs(pathLength(movedWarm) - pathLength(movedCold)) < .1, 'cached routes reevaluate costs after moving along an edge');
assert.deepEqual(again.buildings.map(b => [b.kind, b.x, b.y, b.w, b.h, b.variant]), city.buildings.map(b => [b.kind, b.x, b.y, b.w, b.h, b.variant]), 'layout is seeded and deterministic');
assert.ok(elapsed < 2500, 'one-time layout construction remains bounded');
console.log(JSON.stringify({ok: true, elapsedMs: Math.round(elapsed), testedLandmarkRoutes: tested, ...d}, null, 2));
