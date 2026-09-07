import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Point = readonly [number, number];

/** A thin, beveled panel in the XZ plane, with its upper face pointing along +Y. */
function panel(points: readonly Point[], thickness: number, bevel = 0.06) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    steps: 1,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 1,
    curveSegments: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -thickness / 2, 0);
  return geometry;
}

/**
 * The craft faces local -Z. Static details are batched by material; only the two
 * elevons and the exhaust animate. All retained resources belong to descendants
 * of `ship`, so the scene's regular geometry/material disposal also releases them.
 */
export function buildShip() {
  const ship = new THREE.Group();
  ship.name = 'Wayfarer';
  const ivory = new THREE.MeshStandardMaterial({
    color: '#e9e0d1',
    metalness: 0.42,
    roughness: 0.38,
  });
  const graphite = new THREE.MeshStandardMaterial({
    color: '#203142',
    metalness: 0.64,
    roughness: 0.3,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: '#c3a374',
    metalness: 0.7,
    roughness: 0.33,
  });
  const paint = new THREE.MeshStandardMaterial({
    color: '#487783',
    metalness: 0.24,
    roughness: 0.48,
  });
  // Opaque glass avoids transparency sorting against the detailed canopy frame.
  const glass = new THREE.MeshStandardMaterial({
    color: '#102b3d',
    emissive: '#2b6d83',
    emissiveIntensity: 0.16,
    metalness: 0.5,
    roughness: 0.14,
  });
  const signals = new THREE.MeshBasicMaterial({
    vertexColors: true,
    toneMapped: false,
  });
  const core = new THREE.MeshBasicMaterial({
    color: '#c9faff',
    toneMapped: false,
  });
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const transform = new THREE.Object3D();

  function add(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    sx = 1,
    sy = 1,
    sz = 1,
    rx = 0,
    ry = 0,
    rz = 0,
  ) {
    transform.position.set(x, y, z);
    transform.scale.set(sx, sy, sz);
    transform.rotation.set(rx, ry, rz);
    transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
    // Primitives and extrusions use different index layouts. Normalize them
    // once at construction, not in the animation loop.
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) geometry.dispose();
    flat.clearGroups();
    const batch = batches.get(material) ?? [];
    batch.push(flat);
    batches.set(material, batch);
  }

  function box(
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    length: number,
    roll = 0,
  ) {
    add(new THREE.BoxGeometry(width, height, length), material, x, y, z, 1, 1, 1, 0, 0, roll);
  }

  function ring(
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    radius: number,
    tube: number,
  ) {
    add(new THREE.TorusGeometry(radius, tube, 5, 20), material, x, y, z);
  }

  function light(x: number, y: number, z: number, color: string, length = 0.5) {
    const geometry = new THREE.BoxGeometry(0.1, 0.13, length);
    const rgb = new THREE.Color(color);
    const colors = new Float32Array(geometry.getAttribute('position').count * 3);
    for (let index = 0; index < colors.length; index += 3) rgb.toArray(colors, index);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    add(geometry, signals, x, y, z);
  }

  const hull: Point[] = [
    [0, -6.65],
    [0.8, -5.8],
    [1.85, -3.15],
    [2.12, 1.6],
    [1.48, 4.55],
    [0, 5.05],
    [-1.48, 4.55],
    [-2.12, 1.6],
    [-1.85, -3.15],
    [-0.8, -5.8],
  ];
  add(panel(hull, 0.95, 0.24), ivory);
  add(
    panel(
      hull.map(([x, z]) => [x * 0.92, z * 0.97]),
      0.32,
      0.12,
    ),
    graphite,
    0,
    -0.57,
  );
  add(
    panel(
      [
        [0, -6.55],
        [0.34, -5.73],
        [0.36, -4.75],
        [-0.36, -4.75],
        [-0.34, -5.73],
      ],
      0.04,
      0.02,
    ),
    brass,
    0,
    0.69,
  );
  add(
    panel(
      [
        [-1.04, 0.85],
        [1.04, 0.85],
        [1.25, 2.75],
        [0.7, 4.55],
        [-0.7, 4.55],
        [-1.25, 2.75],
      ],
      0.36,
      0.12,
    ),
    ivory,
    0,
    0.81,
  );
  // Recessed dorsal heat exchanger, with separated ribs above a dark well.
  box(graphite, 0, 1.125, 2.68, 1.35, 0.1, 1.88);
  for (let index = 0; index < 7; index++) {
    box(brass, 0, 1.19, 1.94 + index * 0.245, 1.2, 0.075, 0.095);
  }
  box(paint, 0, 0.75, -5.06, 0.15, 0.08, 0.66);

  // A low, dark canopy, physically framed by two hoops and a center spine.
  add(
    new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    glass,
    0,
    0.7,
    -1.98,
    1.38,
    1.04,
    2.55,
  );
  add(
    new THREE.TorusGeometry(1, 0.055, 5, 40),
    graphite,
    0,
    0.73,
    -1.98,
    1.42,
    2.59,
    1,
    Math.PI / 2,
  );
  for (const z of [-2.9, -0.95]) {
    const radius = Math.sqrt(1 - ((z + 1.98) / 2.55) ** 2);
    const points = Array.from({ length: 13 }, (_, index) => {
      const angle = (index / 12) * Math.PI;
      return new THREE.Vector3(
        Math.cos(angle) * 1.395 * radius,
        0.7 + Math.sin(angle) * 1.055 * radius,
        z,
      );
    });
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, 0.05, 5, false), brass);
  }
  const spine = Array.from({ length: 17 }, (_, index) => {
    const angle = (index / 16) * Math.PI;
    return new THREE.Vector3(0, 0.7 + Math.sin(angle) * 1.07, -1.98 + Math.cos(angle) * 2.56);
  });
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spine), 16, 0.055, 5, false), graphite);

  const elevons: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const mirrored = (points: Point[]): Point[] => points.map(([x, z]) => [x * side, z]);
    add(
      panel(
        mirrored([
          [1.65, -1.6],
          [8.75, 2.0],
          [8.45, 4.18],
          [2.0, 2.75],
        ]),
        0.22,
        0.075,
      ),
      ivory,
      0,
      -0.14,
    );
    // Inset painted panels and restrained seams retain a readable silhouette.
    add(
      panel(
        mirrored([
          [2.42, -0.92],
          [5.07, 0.46],
          [4.7, 2.22],
          [2.42, 1.8],
        ]),
        0.035,
        0.018,
      ),
      paint,
      0,
      0.085,
    );
    add(
      panel(
        mirrored([
          [7.5, 1.62],
          [8.52, 2.14],
          [8.29, 3.86],
          [7.5, 3.69],
        ]),
        0.035,
        0.018,
      ),
      paint,
      0,
      0.085,
    );
    box(graphite, side * 3.65, 0.135, 2.34, 2.2, 0.08, 0.095);
    box(brass, side * 2.02, 0.48, -0.1, 0.1, 0.17, 1.42);
    for (let index = 0; index < 4; index++) {
      box(graphite, side * 2.75, 0.17, 0.68 + index * 0.23, 0.68, 0.06, 0.09);
    }

    // Engine pods preserve the original twin-engine layout and chase-view focus.
    const x = side * 6.3;
    add(
      new THREE.CylinderGeometry(0.95, 0.78, 4.65, 16),
      ivory,
      x,
      0.08,
      0.46,
      1,
      1,
      1,
      Math.PI / 2,
    );
    add(new THREE.SphereGeometry(1, 16, 8), graphite, x, 0.08, -1.86, 0.78, 0.78, 0.28);
    ring(brass, x, 0.08, -1.95, 0.66, 0.095);
    add(
      new THREE.CylinderGeometry(1.03, 0.95, 1.4, 16),
      graphite,
      x,
      0.08,
      3.05,
      1,
      1,
      1,
      Math.PI / 2,
    );
    ring(brass, x, 0.08, 2.42, 0.965, 0.09);
    ring(brass, x, 0.08, 3.57, 1.025, 0.1);
    add(
      new THREE.CylinderGeometry(0.95, 0.78, 0.72, 16, 1, true),
      graphite,
      x,
      0.08,
      4.0,
      1,
      1,
      1,
      Math.PI / 2,
    );
    ring(brass, x, 0.08, 4.34, 0.92, 0.065);
    ring(core, x, 0.08, 4.37, 0.61, 0.09);
    add(new THREE.SphereGeometry(1, 12, 8), core, x, 0.08, 4.35, 0.53, 0.53, 0.12);
    for (let index = 0; index < 8; index++) {
      const angle = (index / 8) * Math.PI * 2;
      box(
        brass,
        x + Math.sin(angle) * 1.01,
        0.08 + Math.cos(angle) * 1.01,
        3.0,
        0.085,
        0.09,
        0.76,
        -angle,
      );
    }
    box(paint, x, 1.02, 0.73, 0.24, 0.08, 2.85);
    box(graphite, side * 7.58, 0.18, 2.87, 0.32, 0.4, 1.84);
    // Canted vertical stabilizers, extruded as XZ panels then turned upright.
    const fin = panel(
      [
        [0, -0.88],
        [1.72, 0.35],
        [1.5, 1.04],
        [0, 0.92],
      ],
      0.12,
      0.055,
    );
    add(fin, ivory, side * 7.58, 0.26, 2.9, 1, 1, 1, 0, 0, Math.PI / 2 - side * 0.23);
    light(side * 8.4, 0.19, 2.97, side < 0 ? '#ff7967' : '#9ef5d9', 0.82);
    light(side * 1.34, 0.76, 3.77, '#c6f4ff', 0.38);

    const flap = new THREE.Mesh(
      panel(
        mirrored([
          [2.57, 0],
          [5.0, 0.6],
          [4.83, 1.29],
          [2.5, 0.74],
        ]),
        0.15,
        0.045,
      ),
      ivory,
    );
    flap.name = side < 0 ? 'Port elevon' : 'Starboard elevon';
    flap.position.set(0, -0.12, 2.47);
    ship.add(flap);
    elevons.push(flap);
  }

  for (const [material, geometries] of batches) {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((source) => source.dispose());
    if (!geometry) throw new Error('Could not assemble spacecraft geometry.');
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'Batched spacecraft detail';
    ship.add(mesh);
  }

  // Both plumes share one geometry and material. Scaling the group around the
  // nozzle plane stretches the exhaust without moving its attachment points.
  const exhaust = new THREE.Group();
  exhaust.position.set(0, 0.08, 4.42);
  const plumeParts = [-6.3, 6.3].map((x) => {
    const geometry = new THREE.ConeGeometry(0.69, 8, 18, 5, true);
    geometry.rotateX(Math.PI / 2);
    geometry.translate(x, 0, 4);
    return geometry;
  });
  const plumeGeometry = mergeGeometries(plumeParts, false)!;
  plumeParts.forEach((geometry) => geometry.dispose());
  const plumeMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { strength: { value: 0.3 }, breathing: { value: 1 } },
    vertexShader: `
      varying float axial;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        axial = position.z / 8.;
        vec4 p = modelViewMatrix * vec4(position, 1.);
        vNormal = normalize(normalMatrix * normal);
        vView = -p.xyz;
        gl_Position = projectionMatrix * p;
      }
    `,
    fragmentShader: `
      uniform float strength;
      uniform float breathing;
      varying float axial;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float edge = pow(abs(dot(normalize(vNormal), normalize(vView))), .45);
        float fade = pow(1. - axial, 1.5) * smoothstep(0., .08, axial);
        vec3 tint = mix(vec3(.72, .98, 1.), vec3(.12, .55, 1.), axial);
        gl_FragColor = vec4(tint, fade * edge * (.28 + strength * .48) * breathing);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const plumes = new THREE.Mesh(plumeGeometry, plumeMaterial);
  plumes.name = 'Twin ion exhaust';
  exhaust.add(plumes);
  ship.add(exhaust);

  let thrust = 0.3;
  const coreColor = new THREE.Color('#c9faff');
  return {
    ship,
    exhaust,
    update(speed: number, boost: boolean, bank: number, pitch: number, time: number, dt: number) {
      const elapsed = Math.max(0, Math.min(dt, 0.1));
      const response = 1 - Math.exp(-4 * elapsed);
      const requested = boost ? 1 : 0.18 + Math.min(Math.max(speed, 0) / 800, 1) * 0.42;
      thrust += (requested - thrust) * response;
      exhaust.scale.z = 0.65 + thrust * 1.65;
      plumeMaterial.uniforms.strength.value = thrust;
      // Slow, slight breathing preserves calm motion instead of rapid flicker.
      plumeMaterial.uniforms.breathing.value = 1 + Math.sin(time * 3.1) * 0.025;
      core.color.copy(coreColor).multiplyScalar(0.84 + thrust * 0.32);
      const banking = THREE.MathUtils.clamp(bank, -0.65, 0.65) * 0.42;
      const pitching = THREE.MathUtils.clamp(pitch, -0.6, 0.6) * 0.16;
      elevons[0].rotation.x += (-banking + pitching - elevons[0].rotation.x) * response;
      elevons[1].rotation.x += (banking + pitching - elevons[1].rotation.x) * response;
    },
  };
}
