import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import './fly-quality.test.mjs';

// Exercise the real flight simulation without a browser or a GPU. Only renderer,
// input listeners, and audio output are omitted from the fixture.
const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: {
    contents: `export * from './src/components/fly/world';
      export * from './src/components/fly/gate';
      export * from './src/components/fly/engine';
      export * from './src/components/fly/scenery';
      export * from './src/components/fly/terrain';
      export * from './src/components/fly/terrain-stream';
      export * from './src/components/fly/performance';
      export { buildLandmark } from './src/components/fly/landmarks';
      export { Vector3, Group, Scene, Fog, Triangle, MeshBasicMaterial } from 'three';`,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  // The browser bundles this module URL normally. Give mocked workers a file URL
  // because relative worker URLs cannot be resolved against this test's data URL.
  define: {
    'import.meta.url': JSON.stringify(
      new URL('../src/components/fly/terrain-stream.ts', import.meta.url).href,
    ),
  },
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
  buildTerrainData,
  TerrainStream,
  FlightPerformance,
  buildLandmark,
  avoidLandmarks,
  Triangle,
  MeshBasicMaterial,
} = code;

function simulation(seed = '1788825600', planet = 0, version = 2) {
  const world = createWorld(seed, planet, version);
  const engine = Object.create(FlightEngine.prototype);
  Object.assign(engine, {
    seed,
    version: world.version,
    world,
    performance: new FlightPerformance(),
    backgroundScene: new Scene(),
    nextScenery: null,
    renderer: { compile() {} },
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
  engine.nextScenery?.dispose();
  disposeObject(engine.rings);
}

function withTerrainWorker(run) {
  const previous = globalThis.Worker;
  class ControlledWorker {
    static instances = [];
    sent = [];
    outstanding = new Map();
    terminated = false;
    constructor() {
      ControlledWorker.instances.push(this);
    }
    postMessage(request) {
      assert.equal(this.terminated, false);
      this.sent.push(request);
      this.outstanding.set(request.id, request);
    }
    complete(request) {
      this.outstanding.delete(request.id);
      const data = buildTerrainData(
        createWorld(request.seed, request.index, request.version),
        request.cx,
        request.cz,
        request.resolution,
        request.tileSize,
      );
      this.onmessage({ data: { id: request.id, data, generatedMs: 0 } });
      return data;
    }
    terminate() {
      this.terminated = true;
    }
  }
  globalThis.Worker = ControlledWorker;
  try {
    run(ControlledWorker);
  } finally {
    if (previous === undefined) delete globalThis.Worker;
    else globalThis.Worker = previous;
  }
}

test('a shared journey uses a captured timestamp and rejects unsupported versions', () => {
  assert.deepEqual(readJourney('', 1788825600123), {
    seed: '1788825600',
    version: 2,
    unsupported: false,
  });
  assert.deepEqual(readJourney('?seed=1788825600'), {
    seed: '1788825600',
    version: 1,
    unsupported: false,
  });
  assert.equal(readJourney('?seed=000123&v=1', 0).seed, '123');
  assert.equal(readJourney('?seed=0&v=1', 0).seed, '0');
  assert.deepEqual(readJourney('?seed=123&v=2'), { seed: '123', version: 2, unsupported: false });
  assert.equal(readJourney('?seed=123&v=3').unsupported, true);
  for (const seed of ['NaN', '-1', 'Infinity', '12.2', '1e4', '12345678901234']) {
    assert.equal(readJourney(`?seed=${seed}`, 9000).seed, '9');
  }
  assert.equal(
    journeyUrl('https://www.roughatsea.com/fly?unrelated=1#old', '1788825600'),
    'https://www.roughatsea.com/fly?seed=1788825600&v=2',
  );
  assert.equal(
    journeyUrl('https://www.roughatsea.com/fly', '1788825600', 1),
    'https://www.roughatsea.com/fly?seed=1788825600&v=1',
  );
});

test('version 1 preserves a known journey and varies subsequent planets', () => {
  const points = [
    [0, 0],
    [1000, -2000],
    [-9320, 12210],
    [1000000, -999999],
  ];
  const sample = (w) => points.map(([x, z]) => w.height(x, z));
  // Captured from the production v1 generator, including a distant floating-origin location.
  const fixtures = [
    {
      name: 'Velane',
      id: 3855042061,
      heights: [197.14722037236837, 339.50589505857505, 525.2059198742917, 566.8929281007049],
    },
    {
      name: 'Nimalia',
      id: 3838264442,
      heights: [392.0442903441583, 280.4600580041863, 661.4330221165995, 290.4747121297007],
    },
  ];
  for (const [index, fixture] of fixtures.entries()) {
    const world = createWorld('1788825600', index, 1);
    assert.equal(world.name, fixture.name);
    assert.equal(world.id, fixture.id);
    assert.deepEqual(sample(world), fixture.heights);
    assert.deepEqual(world.landmarksNear(0), []);
    assert.notDeepEqual(sample(world), sample(createWorld('1788825601', index, 1)));
    assert.notDeepEqual(sample(world), sample(createWorld('1788825600', index, 2)));
  }
  assert.equal(createWorld('1788825600', 1, 1).violet, true);
});

test('version 2 produces continuous rivers, dry banks, varied valleys, and repeatable landmarks', () => {
  for (const seed of ['1788825600', '0', '92157', '1788825601'])
    for (const planet of [0, 1]) {
      const world = createWorld(seed, planet),
        again = createWorld(seed, planet);
      let narrow = Infinity,
        wide = 0;
      for (let z = -30000; z <= 30000; z += 173) {
        const x = world.canyon(z),
          width = world.valleyWidth(z);
        narrow = Math.min(narrow, width);
        wide = Math.max(wide, width);
        assert.ok(world.height(x, z) < world.waterLevel, 'the river remains connected');
        assert.ok(world.height(x + width, z) > world.waterLevel, 'valley banks stay dry');
        for (const dx of [-2500, -600, 0, 600, 2500]) {
          const height = world.height(x + dx, z);
          assert.ok(Number.isFinite(height) && height < 1400);
          assert.equal(height, again.height(x + dx, z));
        }
      }
      assert.ok(wide > narrow * 3, 'narrow passages open into broad valleys');
      assert.deepEqual(world.landmarksNear(-1300), again.landmarksNear(-1300));
      assert.equal(world.landmarksNear(-1300).length, 3);
      assert.ok(world.landmarksNear(-1300).every((l) => l.type === (planet ? 'spire' : 'arch')));
    }
});

test('water is a stable shared terrain surface and LOD boundaries retain matching normals', () => {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  for (const version of [1, 2]) {
    const world = createWorld('1788825600', 0, version);
    for (const [fine, coarse] of [
      [48, 28],
      [28, 14],
      [36, 24],
      [24, 12],
      [28, 18],
      [18, 10],
    ]) {
      const a = buildTerrainData(world, 0, 0, fine),
        b = buildTerrainData(world, 1, 0, coarse);
      const sharedRows = gcd(fine, coarse);
      for (let row = 0; row <= sharedRows; row++) {
        const ai = row * (fine / sharedRows) * (fine + 1) + fine;
        const bi = row * (coarse / sharedRows) * (coarse + 1);
        assert.equal(a.positions[ai * 3 + 1], b.positions[bi * 3 + 1]);
        assert.equal(a.waterDepth[ai], b.waterDepth[bi]);
        assert.deepEqual(a.normals.slice(ai * 3, ai * 3 + 3), b.normals.slice(bi * 3, bi * 3 + 3));
        assert.deepEqual(a.colors.slice(ai * 3, ai * 3 + 3), b.colors.slice(bi * 3, bi * 3 + 3));
      }
      assert.ok(a.skirtVertexCount > 0, 'skirts hide intermediate edges at a different LOD');
      assert.ok(a.indices.every((index) => index < a.positions.length / 3));
      assert.ok(
        a.waterDepth.some((depth) => depth < 0),
        'dry land retains signed depth for a continuous shoreline contour',
      );
      for (let i = 0; i < a.surfaceVertexCount; i++) {
        assert.ok(Math.abs(Math.hypot(...a.normals.slice(i * 3, i * 3 + 3)) - 1) < 1e-6);
        if (a.waterDepth[i] > 0) {
          assert.equal(a.positions[i * 3 + 1], world.waterLevel);
          assert.deepEqual(
            [...a.normals.slice(i * 3, i * 3 + 3)],
            [0, 1, 0],
            'water has a level lighting normal even beside a steep bank',
          );
        }
      }
    }
    assert.deepEqual(buildTerrainData(world, 0, 0, 28), buildTerrainData(world, 0, 0, 28));
  }
});

test('terrain streaming stays bounded while the shoreline remains opaque and stationary', () => {
  const stream = new TerrainStream(createWorld('1788825600', 0));
  stream.update(0, 100, 0, 0, true);
  assert.equal(stream.root.children.length, 81);
  assert.equal(stream.surface.material.transparent, false);
  assert.equal(stream.surface.material.depthWrite, true);
  const center = stream.root.children.find(
    (mesh) => mesh.position.x === 0 && mesh.position.z === 0,
  );
  const positions = center.geometry.attributes.position.array.slice();
  stream.update(0, 100, 0, 123);
  assert.deepEqual(
    center.geometry.attributes.position.array,
    positions,
    'ripples never displace shoreline vertices',
  );
  for (let i = 1; i <= 12; i++) {
    stream.update(i * 850, 100, -i * 850, i, true);
    assert.equal(stream.root.children.length, 81);
  }
  stream.dispose();
  stream.update(0, 100, 0, 124, true);
  assert.equal(stream.root.children.length, 0, 'a disposed stream cannot restart');
});

test('completed terrain jobs survive a streaming-window change without regeneration', () => {
  withTerrainWorker((ControlledWorker) => {
    const stream = new TerrainStream(createWorld('1788825600', 0));
    try {
      stream.update(0, 100, 0, 0, true);
      const worker = ControlledWorker.instances[0];
      assert.equal(worker.outstanding.size, 2);
      const completed = worker.sent.find((request) => request.cx === 0 && request.cz === 0);
      const data = worker.complete(completed);
      stream.update(850, 100, 0, 1);
      const center = stream.root.children.find(
        (mesh) => mesh.position.x === 0 && mesh.position.z === 0,
      );
      assert.equal(
        center.geometry.attributes.position.array,
        data.positions,
        'reuse the completed buffers at the requested LOD',
      );
      assert.equal(
        worker.sent.filter(
          (request) => request.key === completed.key && request.resolution === completed.resolution,
        ).length,
        1,
      );
      assert.ok(worker.outstanding.size <= 2);
    } finally {
      stream.dispose();
    }
  });
});

test('terrain workers reject stale results, bound dispatch, and stop after disposal', () => {
  withTerrainWorker((ControlledWorker) => {
    const stream = new TerrainStream(createWorld('1788825600', 1));
    stream.update(0, 100, 0, 0, true);
    const worker = ControlledWorker.instances[0],
      oldRequests = [...worker.sent];
    assert.equal(oldRequests.length, 2);
    stream.update(17000, 100, -17000, 1);
    oldRequests.forEach((request) => worker.complete(request));
    stream.update(17000, 100, -17000, 2);
    assert.equal(
      stream.root.children.length,
      0,
      'old world-space tiles are not installed after a distant move',
    );
    assert.equal(worker.outstanding.size, 2);
    const current = [...worker.outstanding.values()];
    worker.complete(current[0]);
    stream.update(17000, 100, -17000, 3);
    assert.equal(stream.root.children.length, 1);
    assert.ok(worker.outstanding.size <= 2);
    stream.dispose();
    assert.equal(worker.terminated, true);
    worker.complete(current[1]);
    stream.update(17000, 100, -17000, 4);
    assert.deepEqual(stream.stats, { tiles: 0, pending: 0, worker: false });
  });
});

test('a worker failure preserves visible terrain and falls back to one tile per frame', () => {
  withTerrainWorker((ControlledWorker) => {
    const stream = new TerrainStream(createWorld('1788825600', 0));
    try {
      stream.update(0, 100, 0, 0, true);
      const worker = ControlledWorker.instances[0];
      worker.onerror({ message: 'Worker unavailable' });
      assert.equal(worker.terminated, true);
      assert.equal(stream.workerFailed, true);
      assert.equal(stream.root.children.length, 9, 'keep the immediate surface coverage');
      stream.update(0, 100, 0, 1);
      const pending = stream.stats.pending;
      stream.update(0, 100, 0, 2);
      assert.equal(stream.stats.pending, pending - 1);
      assert.equal(stream.stats.worker, false);
    } finally {
      stream.dispose();
    }
  });
});

test('the real terrain worker transfers its buffers and changes cached worlds across versions', async () => {
  const bundle = await build({
    entryPoints: [
      fileURLToPath(new URL('../src/components/fly/terrain.worker.ts', import.meta.url)),
    ],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    logLevel: 'silent',
  });
  const previousMessage = globalThis.onmessage,
    previousPost = globalThis.postMessage;
  const posted = [];
  globalThis.postMessage = (message, transfer = []) => {
    const clone = structuredClone(message, { transfer });
    posted.push({ message: clone, detached: transfer.map((buffer) => buffer.byteLength === 0) });
  };
  try {
    await import(
      `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
    );
    for (const [id, version, index, seed] of [
      [1, 1, 0, '1788825600'],
      [2, 1, 0, '1788825600'],
      [3, 2, 1, '1788825600'],
      [4, 2, 1, '0'],
    ]) {
      const request = { id, version, index, seed, cx: 1, cz: -1, resolution: 14, tileSize: 850 };
      globalThis.onmessage({ data: request });
      const result = posted.at(-1);
      assert.equal(result.message.id, id);
      assert.deepEqual(
        result.message.data,
        buildTerrainData(createWorld(seed, index, version), 1, -1, 14, 850),
      );
      assert.deepEqual(
        result.detached,
        [true, true, true, true, true],
        'all five data buffers transfer ownership',
      );
    }
    globalThis.onmessage({
      data: { id: 5, seed: '0', version: 2, index: 0, cx: 0, cz: 0, resolution: 0, tileSize: 850 },
    });
    assert.equal(posted.at(-1).message.id, 5);
    assert.match(posted.at(-1).message.error, /resolution/i);
  } finally {
    if (previousMessage === undefined) delete globalThis.onmessage;
    else globalThis.onmessage = previousMessage;
    if (previousPost === undefined) delete globalThis.postMessage;
    else globalThis.postMessage = previousPost;
  }
});

function distanceToLandmark(mesh, point) {
  const position = mesh.geometry.attributes.position,
    index = mesh.geometry.index;
  const local = new Vector3(point.x, point.y, point.z).sub(mesh.position);
  const triangle = new Triangle(),
    closest = new Vector3();
  let distance = Infinity;
  const count = index ? index.count : position.count;
  for (let i = 0; i < count; i += 3) {
    triangle.a.fromBufferAttribute(position, index ? index.getX(i) : i);
    triangle.b.fromBufferAttribute(position, index ? index.getX(i + 1) : i + 1);
    triangle.c.fromBufferAttribute(position, index ? index.getX(i + 2) : i + 2);
    triangle.closestPointToPoint(local, closest);
    distance = Math.min(distance, local.distanceTo(closest));
  }
  return distance;
}

test('flight passes through arch openings and maintains clearance from actual arch and spire meshes', () => {
  for (const seed of ['1788825600', '0', '92157'])
    for (const planet of [0, 1]) {
      const world = createWorld(seed, planet);
      const landmark = world.landmarksNear(0).find((value) => Math.abs(value.z) < 2400);
      const mesh = buildLandmark(world, landmark, new MeshBasicMaterial());
      try {
        if (landmark.type === 'arch') {
          const target = {
            x: landmark.x,
            y: landmark.baseY + landmark.height * 0.3,
            z: landmark.z - 200,
          };
          const passage = avoidLandmarks(world, { ...target, z: landmark.z + 200 }, target);
          assert.deepEqual(
            passage,
            { ...target, assisted: false },
            'the arch has a usable open passage',
          );
          const beam = { x: landmark.x, y: landmark.baseY + landmark.height, z: landmark.z };
          const correction = avoidLandmarks(world, { ...beam, z: landmark.z + 200 }, beam);
          assert.equal(correction.assisted, true, 'swept flight detects the stone frame');
          assert.ok(
            distanceToLandmark(mesh, correction) >= 20,
            'the ship stays clear of the actual weathered mesh',
          );
        } else {
          const height = landmark.height * 0.5;
          const center = {
            x: landmark.x + height * 0.07,
            y: landmark.baseY + height,
            z: landmark.z - height * 0.045,
          };
          const correction = avoidLandmarks(world, { ...center, z: center.z + 400 }, center);
          assert.equal(correction.assisted, true, 'swept flight detects the tapered spire');
          assert.ok(
            distanceToLandmark(mesh, correction) >= 20,
            'the ship slides outside the mineral geometry',
          );
        }
      } finally {
        disposeObject(mesh);
      }
    }
});

test('adaptive quality responds to sustained slow frames without oscillating or overriding a manual choice', () => {
  const performance = new FlightPerformance();
  performance.record(NaN);
  performance.record(0);
  assert.equal(performance.detail, 0);
  for (let i = 0; i < 800; i++) performance.record(40);
  assert.equal(performance.detail, 2);
  assert.ok(performance.fps >= 24 && performance.fps <= 26);
  for (let i = 0; i < 4000; i++) performance.record(16.67);
  assert.equal(
    performance.detail,
    2,
    'keep a successful reduction through a display-capped frame rate',
  );
  performance.reset();
  assert.equal(
    performance.detail,
    2,
    'pause/resume resets measurement without changing image quality',
  );
  assert.equal(performance.fps, 0);
  performance.setMode('high');
  for (let i = 0; i < 800; i++) performance.record(40);
  assert.equal(performance.detail, 0, 'honor explicitly selected high quality');
  performance.setMode('balanced');
  assert.equal(performance.detail, 1);
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

test('ascent, ring cruise, automatic hyperspace, and arrival repeat across worlds', () => {
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
    assert.equal(engine.phase, 'orbit', 'the gate must actually be crossed');
    for (let i = 0; i < 18000 && engine.phase === 'orbit'; i++) engine.simulate(1 / 60);
    assert.equal(engine.phase, 'hyperspace');
    assert.equal(engine.boosting, false, 'cruise enters hyperspace without boost');
    engine.keys.clear();
    for (let i = 0; i < 420; i++) engine.simulate(1 / 60);
    assert.equal(engine.world.index, trip + 1);
    assert.equal(engine.phase, 'arrival');
    for (let i = 0; i < 18000 && engine.phase === 'arrival'; i++) engine.simulate(1 / 60);
    assert.equal(engine.phase, 'surface');
  }
  cleanup(engine);
});

test('legacy shared journeys retain version 1 through subsequent planet arrivals', () => {
  const engine = simulation('1788825600', 0, 1);
  try {
    for (let planet = 1; planet <= 3; planet++) {
      engine.enterNextWorld();
      assert.equal(engine.world.version, 1);
      assert.equal(engine.world.id, createWorld('1788825600', planet, 1).id);
      assert.equal(engine.phase, 'arrival');
    }
  } finally {
    cleanup(engine);
  }
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
  const normal = new Vector3(0, 0, 1).applyQuaternion(engine.gate.quaternion);
  Object.assign(engine.flight, {
    x: gate.x - normal.x,
    y: gate.y - normal.y,
    z: gate.z - normal.z,
    yaw: Math.atan2(normal.x, -normal.z),
    pitch: Math.asin(normal.y),
  });
  engine.simulate(1 / 60);
  assert.equal(engine.phase, 'hyperspace');
  assert.equal(engine.ringIndex, 0);
  cleanup(engine);
});

test('gate crossings use the opening and forward direction over the full flight segment', () => {
  const center = new Vector3(1200, 6000, -9000);
  const normal = new Vector3(0.6, 0.4, -0.8).normalize();
  const side = new Vector3(-normal.z, 0, normal.x).normalize();
  const point = (along, offset = 0) =>
    center.clone().addScaledVector(normal, along).addScaledVector(side, offset);
  assert.equal(code.crossesGate(point(-1), point(1), center, normal), true);
  assert.equal(
    code.crossesGate(point(-1000, -1000), point(1000, 1000), center, normal),
    true,
    'a fast diagonal crossing tests the intersection, not the endpoints',
  );
  assert.equal(code.crossesGate(point(1), point(-1), center, normal), false);
  assert.equal(code.crossesGate(point(-100), point(-1), center, normal), false);
  assert.equal(code.crossesGate(point(-10, 321), point(10, 321), center, normal), true);
  assert.equal(code.crossesGate(point(-10, 323), point(10, 323), center, normal), false);
  assert.equal(code.crossesGate(point(-10), point(-10), center, normal), false);
});

test('boost cannot activate the gate from behind, beside it, or before crossing', () => {
  for (const scenario of ['reverse', 'outside', 'approach']) {
    const engine = simulation();
    try {
      engine.flight.y = 5600;
      engine.simulate(1 / 60);
      const center = engine.ringTargets.at(-1);
      const normal = new Vector3(0, 0, 1).applyQuaternion(engine.gate.quaternion);
      const side = new Vector3(-normal.z, 0, normal.x).normalize();
      const direction = normal.clone().multiplyScalar(scenario === 'reverse' ? -1 : 1);
      const start = center
        .clone()
        .addScaledVector(normal, scenario === 'reverse' ? 1 : scenario === 'approach' ? -100 : -1);
      if (scenario === 'outside') start.addScaledVector(side, 325);
      Object.assign(engine.flight, {
        x: start.x,
        y: start.y,
        z: start.z,
        yaw: Math.atan2(direction.x, -direction.z),
        pitch: Math.asin(direction.y),
        speed: 1000,
      });
      engine.keys.add('ShiftLeft');
      engine.simulate(1 / 60);
      assert.equal(engine.phase, 'orbit', scenario);
    } finally {
      cleanup(engine);
    }
  }
});

test('swept terrain clearance also protects the path between samples', () => {
  const world = createWorld('1788825600', 0);
  const floor = safeHeight(world, -500, 300, 1500, -1000);
  for (let i = 0; i <= 2000; i++) {
    const t = i / 2000;
    assert.ok(floor > world.height(-500 + t * 2000, 300 - t * 1300) + 20);
  }
});
