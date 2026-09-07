import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Exercise the real flight simulation without a browser or a GPU. Only renderer,
// input listeners, and audio output are omitted from the fixture.
const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: {
    contents: `export * from './src/components/fly/world';
      export * from './src/components/fly/engine';
      export * from './src/components/fly/scenery';
      export { Vector3, Group, Scene, Fog } from 'three';`,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  logLevel: 'silent',
});
const code = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text + '\n//# sourceURL=flight-test-bundle.mjs').toString('base64')}`
);
const {
  createWorld,
  spawnFlight,
  readJourney,
  journeyUrl,
  safeHeight,
  FlightEngine,
  Scenery,
  Vector3,
  Group,
  Scene,
  Fog,
  disposeObject,
} = code;

function simulation(seed = '1788825600', planet = 0) {
  const world = createWorld(seed, planet);
  const engine = Object.create(FlightEngine.prototype);
  Object.assign(engine, {
    seed,
    world,
    flight: spawnFlight(world),
    phase: 'surface',
    phaseTime: 0,
    clock: 0,
    cruise: false,
    boosting: false,
    assisted: false,
    keys: new Set(),
    pointer: { x: 0, y: 0 },
    target: new Vector3(),
    forward: new Vector3(),
    position: new Vector3(),
    rings: new Group(),
    ringTargets: [],
    ringIndex: 0,
    gate: null,
    scene: new Scene(),
    scenery: new Scenery(world),
    fog: new Fog(world.fog, 1600, 5400),
    audio: { chime() {} },
  });
  return engine;
}
function cleanup(engine) {
  engine.scenery.dispose();
  disposeObject(engine.rings);
}

test('a shared journey uses a captured timestamp and rejects unsupported versions', () => {
  assert.deepEqual(readJourney('', 1788825600123), { seed: '1788825600', unsupported: false });
  assert.equal(readJourney('?seed=000123&v=1', 0).seed, '123');
  assert.equal(readJourney('?seed=0&v=1', 0).seed, '0');
  assert.equal(readJourney('?seed=123&v=2').unsupported, true);
  for (const seed of ['NaN', '-1', 'Infinity', '12.2', '1e4', '12345678901234']) {
    assert.equal(readJourney(`?seed=${seed}`, 9000).seed, '9');
  }
  assert.equal(
    journeyUrl('https://www.roughatsea.com/fly?unrelated=1#old', '1788825600'),
    'https://www.roughatsea.com/fly?seed=1788825600&v=1',
  );
});

test('version 1 preserves a known journey and varies subsequent planets', () => {
  const world = createWorld('1788825600', 0);
  assert.equal(world.name, 'Velane');
  assert.ok(Math.abs(world.height(1000, -2000) - 339.50589505857505) < 1e-9);
  const points = [
    [0, 0],
    [1000, -2000],
    [-9320, 12210],
    [1000000, -999999],
  ];
  const sample = (w) => points.map(([x, z]) => w.height(x, z));
  assert.deepEqual(sample(world), sample(createWorld('1788825600', 0)));
  assert.notDeepEqual(sample(world), sample(createWorld('1788825601', 0)));
  assert.notDeepEqual(sample(world), sample(createWorld('1788825600', 1)));
  assert.equal(createWorld('1788825600', 1).violet, true);
});

test('terrain streaming stays bounded and neighboring chunk heights match', () => {
  const world = createWorld('1788825600', 0),
    scenery = new Scenery(world);
  scenery.update(0, 100, 0, 0, true);
  assert.equal(scenery.terrain.children.length, 81);
  const first = scenery.terrain.children.find(
    (mesh) => mesh.position.x === 0 && mesh.position.z === 0,
  );
  const second = scenery.terrain.children.find(
    (mesh) => mesh.position.x === 850 && mesh.position.z === 0,
  );
  const a = first.geometry.attributes.position,
    b = second.geometry.attributes.position;
  for (let row = 0; row <= 36; row++) assert.equal(a.getY(row * 37 + 36), b.getY(row * 37));
  for (let i = 1; i <= 12; i++) scenery.update(i * 850, 100, -i * 850, i, true);
  assert.equal(scenery.terrain.children.length, 81);
  scenery.dispose();
});

test('terrain assistance prevents boosted dives from crossing the ground', () => {
  for (const planet of [0, 1]) {
    const engine = simulation('1788825600', planet);
    engine.flight.throttle = 1;
    engine.keys.add('ShiftLeft');
    engine.keys.add('ArrowDown');
    engine.keys.add('ArrowRight');
    for (let step = 0; step < 1800; step++) {
      engine.simulate(1 / 30);
      const f = engine.flight;
      assert.ok(Number.isFinite(f.x + f.y + f.z + f.speed));
      assert.ok(f.y >= engine.world.height(f.x, f.z) + 31.99);
    }
    assert.equal(engine.phase, 'surface');
    cleanup(engine);
  }
});

test('cruise explores the surface indefinitely without departing automatically', () => {
  const engine = simulation();
  engine.cruise = true;
  for (let i = 0; i < 14400; i++) engine.simulate(1 / 60);
  assert.equal(engine.phase, 'surface');
  assert.ok(engine.flight.z < -20000);
  assert.ok(engine.flight.y < 1500);
  assert.ok(Math.abs(engine.flight.x - engine.world.canyon(engine.flight.z)) < 600);
  cleanup(engine);
});

test('ascent, ring cruise, deliberate hyperspace, and arrival repeat across worlds', () => {
  const engine = simulation();
  for (let trip = 0; trip < 3; trip++) {
    engine.cruise = false;
    engine.flight.throttle = 0.75;
    engine.keys.add('ArrowUp');
    engine.keys.add('ShiftLeft');
    for (let i = 0; i < 3600 && engine.phase !== 'orbit'; i++) engine.simulate(1 / 60);
    assert.equal(engine.phase, 'orbit');
    assert.equal(engine.ringTargets.length, 7);
    engine.keys.clear();
    engine.cruise = true;
    for (let i = 0; i < 18000 && engine.ringIndex < 6; i++) engine.simulate(1 / 60);
    assert.equal(engine.ringIndex, 6, 'cruise reaches the final ring');
    assert.equal(engine.phase, 'orbit', 'the journey waits for deliberate boost');
    engine.keys.add('ShiftLeft');
    for (let i = 0; i < 18000 && engine.phase === 'orbit'; i++) engine.simulate(1 / 60);
    assert.equal(engine.phase, 'hyperspace');
    engine.keys.clear();
    for (let i = 0; i < 420; i++) engine.simulate(1 / 60);
    assert.equal(engine.world.index, trip + 1);
    assert.equal(engine.phase, 'arrival');
    for (let i = 0; i < 18000 && engine.phase === 'arrival'; i++) engine.simulate(1 / 60);
    assert.equal(engine.phase, 'surface');
  }
  cleanup(engine);
});

test('skipped rings never lock the gate and descending from orbit stays on the same planet', () => {
  const engine = simulation();
  engine.flight.y = 5200;
  engine.simulate(1 / 60);
  engine.flight.y = 4150;
  engine.flight.pitch = -0.1;
  engine.simulate(1 / 60);
  assert.equal(engine.phase, 'surface');
  assert.equal(engine.world.index, 0);
  assert.equal(engine.ringTargets.length, 0);
  engine.flight.y = 5200;
  engine.simulate(1 / 60);
  const gate = engine.ringTargets.at(-1);
  Object.assign(engine.flight, { x: gate.x, y: gate.y, z: gate.z });
  engine.keys.add('ShiftLeft');
  engine.simulate(1 / 60);
  assert.equal(engine.phase, 'hyperspace');
  assert.equal(engine.ringIndex, 0);
  cleanup(engine);
});

test('swept terrain clearance also protects the path between samples', () => {
  const world = createWorld('1788825600', 0);
  const floor = safeHeight(world, -500, 300, 1500, -1000);
  for (let i = 0; i <= 2000; i++) {
    const t = i / 2000;
    assert.ok(floor > world.height(-500 + t * 2000, 300 - t * 1300) + 20);
  }
});
