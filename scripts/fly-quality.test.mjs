import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: {
    contents: `export { FlightPerformance } from './src/components/fly/performance';
      export { buildShip } from './src/components/fly/ship';
      export { disposeObject } from './src/components/fly/scenery';
      export { Box3 } from 'three';`,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  logLevel: 'silent',
});
const { FlightPerformance, buildShip, disposeObject, Box3 } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

function runFrames(performance, seconds, frameDuration) {
  let elapsed = 0;
  const changes = [];
  while (elapsed < seconds) {
    const milliseconds = typeof frameDuration === 'function' ? frameDuration() : frameDuration;
    elapsed += milliseconds / 1000;
    if (performance.record(milliseconds)) changes.push(performance.detail);
  }
  return changes;
}

test('auto quality settles after a reduction instead of repeatedly changing sharpness', () => {
  const performance = new FlightPerformance();
  // This common boundary case is too slow at full resolution but display-capped
  // at 60 fps after reducing load. Stable 60 fps must not cause another promotion.
  const changes = runFrames(performance, 150, () => (performance.detail === 0 ? 30 : 1000 / 60));
  assert.deepEqual(changes, [1]);
  assert.equal(performance.detail, 1);
  assert.ok(Math.abs(performance.fps - 60) < 0.01);
});

test('repeated long foreground frames reduce load while an isolated stall does not', () => {
  const stalled = new FlightPerformance();
  assert.deepEqual(runFrames(stalled, 60, 300), [1, 2]);
  assert.equal(stalled.detail, 2);
  assert.ok(Number.isFinite(stalled.fps) && stalled.fps > 0);
  assert.ok(Number.isFinite(stalled.p95));

  const occasionalStall = new FlightPerformance();
  runFrames(occasionalStall, 15, 1000 / 60);
  assert.equal(occasionalStall.record(1200), false);
  assert.deepEqual(runFrames(occasionalStall, 20, 1000 / 60), []);
  assert.equal(occasionalStall.detail, 0);
  for (const invalid of [NaN, Infinity, -Infinity, 0, -1]) {
    assert.equal(occasionalStall.record(invalid), false);
  }
  assert.ok(Number.isFinite(occasionalStall.fps));
});

test('pause resets stale timing evidence without undoing a successful quality reduction', () => {
  const performance = new FlightPerformance();
  runFrames(performance, 10, 30);
  assert.equal(performance.detail, 1);
  performance.reset();
  assert.equal(performance.detail, 1);
  assert.equal(performance.fps, 0);
  assert.equal(performance.p95, 0);
  assert.deepEqual(runFrames(performance, 45, 1000 / 60), []);
  assert.equal(performance.detail, 1);
  assert.ok(Math.abs(performance.fps - 60) < 0.01);
});

test('manual graphics modes hold their settings and selecting auto starts a fresh assessment', () => {
  const performance = new FlightPerformance();
  for (const [mode, detail] of [
    ['high', 0],
    ['balanced', 1],
  ]) {
    assert.equal(performance.setMode(mode), detail);
    assert.deepEqual(runFrames(performance, 60, 40), []);
    assert.equal(performance.detail, detail);
    assert.equal(performance.mode, mode);
  }
  assert.equal(performance.setMode('auto'), 0);
  assert.equal(performance.fps, 0);
  assert.deepEqual(runFrames(performance, 40, 40), [1, 2]);
  assert.equal(performance.setMode('high'), 0);
  assert.equal(performance.resolutionScale, 1);
});

test('the detailed ship stays finite, compact, and within a bounded geometry/draw budget', () => {
  const craft = buildShip();
  const materials = new Set();
  const hullBounds = new Box3();
  let meshes = 0;
  let triangles = 0;
  craft.ship.updateMatrixWorld(true);
  craft.ship.traverse((mesh) => {
    if (!mesh.isMesh) return;
    meshes++;
    const geometry = mesh.geometry;
    for (const attribute of Object.values(geometry.attributes)) {
      assert.ok(attribute.array.every(Number.isFinite), `${mesh.name} has invalid geometry`);
    }
    const vertices = geometry.getAttribute('position').count;
    if (geometry.index) {
      assert.ok(geometry.index.array.every((index) => index >= 0 && index < vertices));
    }
    triangles += (geometry.index?.count ?? vertices) / 3;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      materials.add(material);
    }
    if (!craft.exhaust.getObjectById(mesh.id)) {
      hullBounds.union(
        new Box3()
          .setFromBufferAttribute(geometry.getAttribute('position'))
          .applyMatrix4(mesh.matrixWorld),
      );
    }
  });
  assert.ok(meshes <= 12, `${meshes} meshes exceeds the ship draw budget`);
  assert.ok(materials.size <= 10, `${materials.size} ship materials exceeds the budget`);
  assert.ok(triangles > 0 && triangles <= 10000, `${triangles} triangles exceeds the budget`);
  assert.ok(hullBounds.max.x - hullBounds.min.x < 20);
  assert.ok(hullBounds.max.z - hullBounds.min.z < 16);
  assert.ok(hullBounds.min.z < -5, 'the nose extends in local -Z');
  disposeObject(craft.ship);
});

test('ship animation is smooth across frame rates and keeps exhaust attached to the nozzles', () => {
  const slowFrames = buildShip();
  const fastFrames = buildShip();
  const anchor = slowFrames.exhaust.position.clone();
  const geometries = [];
  slowFrames.ship.traverse((mesh) => {
    if (mesh.isMesh) geometries.push([mesh, mesh.geometry]);
  });
  for (let index = 0; index < 90; index++)
    slowFrames.update(1200, true, 0.5, 0.3, index / 30, 1 / 30);
  for (let index = 0; index < 360; index++)
    fastFrames.update(1200, true, 0.5, 0.3, index / 120, 1 / 120);
  assert.ok(Math.abs(slowFrames.exhaust.scale.z - fastFrames.exhaust.scale.z) < 1e-6);
  assert.ok(slowFrames.exhaust.scale.z > 2 && slowFrames.exhaust.scale.z < 2.5);
  assert.deepEqual(slowFrames.exhaust.position, anchor);
  const pausedScale = slowFrames.exhaust.scale.z;
  slowFrames.update(45, false, 0, 0, 3, 0);
  assert.equal(
    slowFrames.exhaust.scale.z,
    pausedScale,
    'paused frames do not advance throttle response',
  );
  for (let index = 0; index < 300; index++)
    slowFrames.update(45, false, 0, 0, 3 + index / 60, 1 / 60);
  assert.ok(slowFrames.exhaust.scale.z < 1);
  for (const [mesh, geometry] of geometries) {
    assert.equal(mesh.geometry, geometry, 'flight animation never rebuilds geometry');
    assert.ok(Math.abs(mesh.rotation.x) < 1e-6, 'control surfaces return to neutral');
  }
  disposeObject(slowFrames.ship);
  disposeObject(fastFrames.ship);
});

test('normal ship disposal releases every retained geometry and shared material exactly once', () => {
  const craft = buildShip();
  const resources = new Map();
  craft.ship.traverse((mesh) => {
    if (!mesh.isMesh) return;
    resources.set(mesh.geometry, 0);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      resources.set(material, 0);
    }
  });
  for (const resource of resources.keys()) {
    resource.addEventListener('dispose', () =>
      resources.set(resource, resources.get(resource) + 1),
    );
  }
  disposeObject(craft.ship);
  for (const count of resources.values()) assert.equal(count, 1);
});

test('production UI omits development diagnostics and scenario controls', async () => {
  const production = await build({
    entryPoints: [
      fileURLToPath(new URL('../src/components/fly/FlyExperience.tsx', import.meta.url)),
    ],
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'esm',
    minify: true,
    loader: { '.css': 'empty' },
    define: { 'import.meta.env.DEV': 'false' },
    logLevel: 'silent',
  });
  const output = production.outputFiles.map((file) => file.text).join('\n');
  for (const marker of ['Flight diagnostics', 'inspector-scenarios', 'data-metric', 'Frame p95']) {
    assert.ok(!output.includes(marker), `development UI leaked into production: ${marker}`);
  }
  assert.ok(output.includes('flight-graphics'), 'ordinary graphics selection remains available');
});
