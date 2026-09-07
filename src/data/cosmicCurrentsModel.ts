export type Vec3 = [number, number, number];
export type RGB = [number, number, number];

export type LandmarkKind =
  | 'home'
  | 'galaxy'
  | 'cluster'
  | 'region'
  | 'supercluster'
  | 'repeller';

export interface Landmark {
  id: string;
  label: string;
  shortLabel: string;
  kind: LandmarkKind;
  galacticLongitude: number;
  galacticLatitude: number;
  distanceMpc: number;
  position: Vec3;
  color: RGB;
  markerSize: number;
  description: string;
}

export interface GalaxyField {
  positions: Float32Array<ArrayBuffer>;
  colors: Float32Array<ArrayBuffer>;
  sizes: Float32Array<ArrayBuffer>;
  count: number;
}

export interface ConvergencePoint {
  label: string;
  position: Vec3;
}

export const MODEL_RADIUS_MPC = 285;
export const MAX_GALAXIES = 48_000;

export const MODEL_DISCLOSURE =
  'Named structures use published sky directions and approximate distances. When the CF4 badge is active, tracer directions come from the public Cosmicflows-4 velocity grid. The surrounding galaxy point cloud remains a pedagogical reconstruction, not a one-to-one catalog plot.';

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function galacticToCartesian(
  longitudeDegrees: number,
  latitudeDegrees: number,
  distanceMpc: number,
): Vec3 {
  const longitude = (longitudeDegrees * Math.PI) / 180;
  const latitude = (latitudeDegrees * Math.PI) / 180;
  const cosLatitude = Math.cos(latitude);
  return [
    distanceMpc * cosLatitude * Math.cos(longitude),
    distanceMpc * cosLatitude * Math.sin(longitude),
    distanceMpc * Math.sin(latitude),
  ];
}

function makeLandmark(
  id: string,
  label: string,
  shortLabel: string,
  kind: LandmarkKind,
  longitude: number,
  latitude: number,
  distanceMpc: number,
  color: RGB,
  markerSize: number,
  description: string,
): Landmark {
  return {
    id,
    label,
    shortLabel,
    kind,
    galacticLongitude: longitude,
    galacticLatitude: latitude,
    distanceMpc,
    position: galacticToCartesian(longitude, latitude, distanceMpc),
    color,
    markerSize,
    description,
  };
}

export const LANDMARKS: Landmark[] = [
  {
    id: 'milky-way',
    label: 'Milky Way',
    shortLabel: 'You are here',
    kind: 'home',
    galacticLongitude: 0,
    galacticLatitude: 0,
    distanceMpc: 0,
    position: [0, 0, 0],
    color: [1, 0.85, 0.38],
    markerSize: 17,
    description: 'Our galaxy, carried with the Local Group through the nearby cosmic velocity field.',
  },
  makeLandmark(
    'andromeda',
    'Andromeda Galaxy',
    'Andromeda',
    'galaxy',
    121.17,
    -21.57,
    0.778,
    [0.48, 0.92, 1],
    11,
    'The largest nearby galaxy and the other dominant member of the Local Group.',
  ),
  makeLandmark(
    'virgo',
    'Virgo Cluster',
    'Virgo',
    'cluster',
    283.8,
    74.5,
    16.5,
    [0.38, 1, 0.78],
    18,
    'The nearest massive galaxy cluster and a small-scale convergence region in local-flow models.',
  ),
  makeLandmark(
    'hydra-centaurus',
    'Hydra–Centaurus region',
    'Hydra–Centaurus',
    'region',
    302,
    21,
    52,
    [1, 0.48, 0.18],
    19,
    'A broad concentration of clusters and filaments historically associated with the Great Attractor flow.',
  ),
  makeLandmark(
    'great-attractor',
    'Classical Great Attractor region',
    'Great Attractor region',
    'region',
    307,
    9,
    66,
    [1, 0.12, 0.52],
    22,
    'A gravitational basin inferred from galaxy motions—not a single hidden object or black hole.',
  ),
  makeLandmark(
    'norma',
    'Norma Cluster (Abell 3627)',
    'Norma',
    'cluster',
    325.3,
    -7.2,
    68,
    [1, 0.34, 0.1],
    17,
    'A rich cluster behind the Milky Way’s dusty plane, near the historical Great Attractor direction.',
  ),
  makeLandmark(
    'perseus-pisces',
    'Perseus–Pisces supercluster',
    'Perseus–Pisces',
    'supercluster',
    150,
    -13,
    75,
    [0.34, 0.58, 1],
    18,
    'A major filamentary concentration on another side of the local cosmic web.',
  ),
  makeLandmark(
    'coma',
    'Coma Cluster',
    'Coma',
    'cluster',
    58.1,
    88,
    100,
    [0.68, 0.43, 1],
    17,
    'A massive, well-studied cluster in the Coma supercluster complex.',
  ),
  makeLandmark(
    'shapley',
    'Shapley Concentration',
    'Shapley',
    'supercluster',
    312,
    30,
    200,
    [1, 0.22, 0.74],
    27,
    'One of the largest nearby concentrations of matter; large-scale flows bend in its direction.',
  ),
  makeLandmark(
    'dipole-repeller',
    'Dipole Repeller',
    'Dipole Repeller',
    'repeller',
    94,
    -16,
    230,
    [0.24, 0.75, 1],
    26,
    'An underdense direction that contributes to our motion because comparatively little matter pulls from that side.',
  ),
];

export const LANDMARK_BY_ID = Object.fromEntries(
  LANDMARKS.map((item) => [item.id, item]),
) as Record<string, Landmark>;

const VIRGO = LANDMARK_BY_ID.virgo.position;
const HYDRA = LANDMARK_BY_ID['hydra-centaurus'].position;
const GREAT_ATTRACTOR = LANDMARK_BY_ID['great-attractor'].position;
const SHAPLEY = LANDMARK_BY_ID.shapley.position;
const PERSEUS = LANDMARK_BY_ID['perseus-pisces'].position;
const REPELLER = LANDMARK_BY_ID['dipole-repeller'].position;

function lerp(first: number, second: number, amount: number): number {
  return first + (second - first) * amount;
}

function lerpVec3(first: Vec3, second: Vec3, amount: number): Vec3 {
  return [
    lerp(first[0], second[0], amount),
    lerp(first[1], second[1], amount),
    lerp(first[2], second[2], amount),
  ];
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return amount * amount * (3 - 2 * amount);
}

export function convergenceForScale(scale: number): ConvergencePoint {
  const normalized = clamp(scale, 0, 1);
  if (normalized < 0.48) {
    const amount = smoothstep(0.08, 0.48, normalized);
    return {
      label: amount < 0.52 ? 'Virgo Cluster' : 'between Virgo and Hydra–Centaurus',
      position: lerpVec3(VIRGO, HYDRA, amount),
    };
  }
  const amount = smoothstep(0.48, 0.94, normalized);
  return {
    label: amount < 0.53 ? 'Hydra–Centaurus region' : 'Shapley Concentration',
    position: lerpVec3(GREAT_ATTRACTOR, SHAPLEY, amount),
  };
}

export function localGroupVelocityDirection(): Vec3 {
  return galacticToCartesian(276, 30, 1);
}

function addAttraction(
  point: Vec3,
  center: Vec3,
  weight: number,
  softening: number,
  output: Vec3,
): void {
  const dx = center[0] - point[0];
  const dy = center[1] - point[1];
  const dz = center[2] - point[2];
  const distanceSquared = dx * dx + dy * dy + dz * dz + softening * softening;
  const inverseDistance = 1 / Math.sqrt(distanceSquared);
  const strength = (weight * softening * softening) / distanceSquared;
  output[0] += dx * inverseDistance * strength;
  output[1] += dy * inverseDistance * strength;
  output[2] += dz * inverseDistance * strength;
}

export function proceduralVelocityAt(
  point: Vec3,
  scale: number,
  expansionMix: number,
  output: Vec3,
): Vec3 {
  output[0] = 0;
  output[1] = 0;
  output[2] = 0;

  const localWeight = 1 - smoothstep(0.18, 0.62, scale);
  const regionalWeight = 0.38 + 0.82 * (1 - Math.abs(scale - 0.52) * 1.45);
  const largeWeight = smoothstep(0.42, 0.92, scale);

  addAttraction(point, VIRGO, 1.28 * localWeight + 0.2, 25, output);
  addAttraction(point, HYDRA, 1.0 * regionalWeight, 48, output);
  addAttraction(point, GREAT_ATTRACTOR, 0.78 * regionalWeight, 58, output);
  addAttraction(point, SHAPLEY, 1.48 * largeWeight + 0.16, 105, output);
  addAttraction(point, PERSEUS, 0.24 + 0.18 * (1 - largeWeight), 72, output);
  addAttraction(point, REPELLER, -(0.46 + 0.38 * largeWeight), 112, output);

  // A restrained curl prevents the illustrative fallback from collapsing into
  // perfectly radial spokes. It is visual scaffolding, not an extra force.
  output[0] += Math.sin(point[1] * 0.018 + point[2] * 0.011) * 0.09;
  output[1] += Math.sin(point[2] * 0.016 - point[0] * 0.009) * 0.075;
  output[2] += Math.sin(point[0] * 0.013 + point[1] * 0.008) * 0.06;

  const radius = Math.hypot(point[0], point[1], point[2]);
  if (radius > 0.001 && expansionMix > 0) {
    const hubbleStrength = 0.72 + radius / 210;
    output[0] = lerp(output[0], (point[0] / radius) * hubbleStrength, expansionMix);
    output[1] = lerp(output[1], (point[1] / radius) * hubbleStrength, expansionMix);
    output[2] = lerp(output[2], (point[2] / radius) * hubbleStrength, expansionMix);
  }

  const magnitude = Math.hypot(output[0], output[1], output[2]);
  if (magnitude > 2.2) {
    const ratio = 2.2 / magnitude;
    output[0] *= ratio;
    output[1] *= ratio;
    output[2] *= ratio;
  }
  return output;
}

function randomFactory(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function gaussian(random: () => number): number {
  const u = Math.max(1e-7, random());
  const v = Math.max(1e-7, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function colorForPosition(position: Vec3, random: () => number): RGB {
  const distanceToShapley = Math.hypot(
    position[0] - SHAPLEY[0],
    position[1] - SHAPLEY[1],
    position[2] - SHAPLEY[2],
  );
  const distanceToGa = Math.hypot(
    position[0] - GREAT_ATTRACTOR[0],
    position[1] - GREAT_ATTRACTOR[1],
    position[2] - GREAT_ATTRACTOR[2],
  );
  if (distanceToShapley < 55 || distanceToGa < 38) {
    return [0.77 + random() * 0.22, 0.16 + random() * 0.2, 0.48 + random() * 0.36];
  }
  const cool = random();
  return [0.34 + cool * 0.28, 0.52 + cool * 0.34, 0.76 + random() * 0.24];
}

function writeGalaxy(
  index: number,
  point: Vec3,
  random: () => number,
  positions: Float32Array,
  colors: Float32Array,
  sizes: Float32Array,
  sizeBias = 0,
): void {
  const offset = index * 3;
  positions[offset] = point[0];
  positions[offset + 1] = point[1];
  positions[offset + 2] = point[2];
  const color = colorForPosition(point, random);
  colors[offset] = color[0];
  colors[offset + 1] = color[1];
  colors[offset + 2] = color[2];
  sizes[index] = 0.8 + random() * 1.8 + sizeBias;
}

export function generateGalaxyField(): GalaxyField {
  const random = randomFactory(0x5ea5ea);
  const positions = new Float32Array(MAX_GALAXIES * 3);
  const colors = new Float32Array(MAX_GALAXIES * 3);
  const sizes = new Float32Array(MAX_GALAXIES);
  let count = 0;

  const clusters = [VIRGO, HYDRA, GREAT_ATTRACTOR, SHAPLEY, PERSEUS, LANDMARK_BY_ID.coma.position];
  const clusterCounts = [2500, 3400, 4200, 5100, 3100, 2200];
  const clusterSpreads = [9, 20, 22, 38, 27, 20];
  clusters.forEach((center, clusterIndex) => {
    for (let index = 0; index < clusterCounts[clusterIndex] && count < MAX_GALAXIES; index += 1) {
      const spread = clusterSpreads[clusterIndex];
      const radialFade = 0.22 + Math.pow(random(), 1.9);
      const point: Vec3 = [
        center[0] + gaussian(random) * spread * radialFade,
        center[1] + gaussian(random) * spread * radialFade,
        center[2] + gaussian(random) * spread * radialFade * 0.68,
      ];
      writeGalaxy(count, point, random, positions, colors, sizes, 0.35);
      count += 1;
    }
  });

  const filaments: Array<[Vec3, Vec3, number, number]> = [
    [[0, 0, 0], VIRGO, 2300, 3.5],
    [VIRGO, HYDRA, 3100, 7.5],
    [HYDRA, GREAT_ATTRACTOR, 2300, 8],
    [GREAT_ATTRACTOR, SHAPLEY, 5000, 14],
    [[0, 0, 0], PERSEUS, 3300, 9],
    [VIRGO, LANDMARK_BY_ID.coma.position, 2200, 8],
  ];
  filaments.forEach(([start, end, amount, spread]) => {
    for (let index = 0; index < amount && count < MAX_GALAXIES; index += 1) {
      const t = random();
      const wave = Math.sin(t * Math.PI * 2.1) * spread * 0.32;
      const point: Vec3 = [
        lerp(start[0], end[0], t) + gaussian(random) * spread + wave,
        lerp(start[1], end[1], t) + gaussian(random) * spread * 0.72,
        lerp(start[2], end[2], t) + gaussian(random) * spread * 0.6 - wave * 0.4,
      ];
      writeGalaxy(count, point, random, positions, colors, sizes);
      count += 1;
    }
  });

  while (count < MAX_GALAXIES) {
    const radius = MODEL_RADIUS_MPC * Math.cbrt(random());
    const cosine = random() * 2 - 1;
    const sine = Math.sqrt(1 - cosine * cosine);
    const azimuth = random() * Math.PI * 2;
    const point: Vec3 = [
      radius * sine * Math.cos(azimuth),
      radius * sine * Math.sin(azimuth),
      radius * cosine * 0.78,
    ];
    const repellerDistance = Math.hypot(
      point[0] - REPELLER[0],
      point[1] - REPELLER[1],
      point[2] - REPELLER[2],
    );
    if (repellerDistance < 82 && random() < 0.9) {
      continue;
    }
    writeGalaxy(count, point, random, positions, colors, sizes);
    count += 1;
  }

  return { positions, colors, sizes, count };
}
