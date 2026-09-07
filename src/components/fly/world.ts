// A generator version is part of a shared journey's identity. Never change v1 rules.
export const GENERATOR_VERSION = 2;
export type GeneratorVersion = 1 | 2;
export type WorldLandmark = {
  id: string;
  type: 'arch' | 'spire';
  x: number;
  z: number;
  width: number;
  height: number;
  baseY: number;
};
export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const damp = (a: number, b: number, rate: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-rate * dt));

export function hashSeed(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function randomSequence(seed: number) {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function readJourney(search: string, now = Date.now()) {
  const params = new URLSearchParams(search);
  const value = params.get('seed');
  const validSeed = value !== null && /^\d{1,13}$/.test(value);
  const seed = validSeed ? String(Number(value)) : String(Math.floor(now / 1000));
  const requested = params.get('v');
  // Early shared links did not include a version. They must still open their original world.
  const version: GeneratorVersion = requested === '1' || (requested === null && validSeed) ? 1 : 2;
  return {
    seed,
    version,
    unsupported: requested !== null && requested !== '1' && requested !== '2',
  };
}

export function journeyUrl(
  href: string,
  seed: string,
  version: GeneratorVersion = GENERATOR_VERSION,
) {
  const url = new URL(href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('seed', seed);
  url.searchParams.set('v', String(version));
  return url.toString();
}

export type World = ReturnType<typeof createWorld>;

export function createWorld(
  seed: string,
  index: number,
  version: GeneratorVersion = GENERATOR_VERSION,
) {
  const id = hashSeed(`${version}:${seed}:${index}`);
  const random = randomSequence(id);
  const violet = index % 2 === 1;
  const syllables = ['Aure', 'Sola', 'Vela', 'Orin', 'Ely', 'Nima', 'Ione', 'Cera'];
  const endings = ['lia', 'ris', 'thea', 'ra', 'ne', 'on'];
  const name =
    syllables[Math.floor(random() * syllables.length)] +
    endings[Math.floor(random() * endings.length)];
  const phase = random() * Math.PI * 2;
  const width = (145 + random() * 100) * (violet ? 1.4 : 1);
  const amplitude = 250 + random() * 240;
  const frequency = 0.0008 + random() * 0.0005;

  function lattice(x: number, z: number) {
    let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ id;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function noise(x: number, z: number) {
    const ix = Math.floor(x),
      iz = Math.floor(z);
    const sx = smooth(0, 1, x - ix),
      sz = smooth(0, 1, z - iz);
    const a = lattice(ix, iz) * (1 - sx) + lattice(ix + 1, iz) * sx;
    const b = lattice(ix, iz + 1) * (1 - sx) + lattice(ix + 1, iz + 1) * sx;
    return a * (1 - sz) + b * sz;
  }
  function canyon(z: number) {
    return (
      Math.sin(z * frequency + phase) * amplitude +
      Math.sin(z * frequency * 0.37 + phase) * amplitude * 0.9
    );
  }
  function height(x: number, z: number) {
    if (version === 2) return heightV2(x, z);
    // Exact original terrain, including its arithmetic order, for existing shared journeys.
    const distance = Math.abs(x - canyon(z));
    const valley = smooth(width * 0.55, width * 3.1, distance);
    const broad = noise(x * 0.0009, z * 0.0009);
    const detail = noise(x * 0.004, z * 0.004) * 0.7 + noise(x * 0.012, z * 0.012) * 0.3;
    const terraces = Math.sin(broad * 22 + detail * 2) * 24;
    const relief = violet
      ? 150 + broad * 540 + Math.pow(detail, 1.7) * 240
      : 180 + broad * 660 + detail * 130 + terraces;
    return 4 + valley * relief + (1 - valley) * detail * 20;
  }

  function valleyWidth(z: number) {
    if (version === 1) return width;
    // Kilometre-scale changes give each winding passage a spacious valley to open into.
    const opening = smooth(0.12, 0.88, 0.5 + 0.5 * Math.sin(z * 0.00058 + phase * 0.7));
    return width * (0.8 + opening * 2.5);
  }

  function heightV2(x: number, z: number) {
    const center = canyon(z);
    const distance = Math.abs(x - center);
    const opening = smooth(0.12, 0.88, 0.5 + 0.5 * Math.sin(z * 0.00058 + phase * 0.7));
    const basin = Math.pow(0.5 + 0.5 * Math.sin(z * 0.00077 + phase * 0.9), 10) * opening;
    const localWidth = width * (0.8 + opening * 2.5);
    const mainValley = smooth(localWidth * 0.5, localWidth * 2.6, distance);

    // A tributary splits away and rejoins the main route. Its raised floor stays dry,
    // providing branching paths without the disconnected puddles of the first world.
    const branchOffset = Math.sin(z * frequency * 0.44 + phase * 0.6) * (650 + opening * 620);
    const branchDistance = Math.abs(x - center - branchOffset);
    const branchStrength = smooth(200, 500, Math.abs(branchOffset)) * 0.86;
    const branchValley = smooth(width * 0.42, width * 1.7, branchDistance);
    const valley = Math.min(mainValley, 1 - branchStrength + branchValley * branchStrength);

    const broad = noise(x * 0.00082, z * 0.00082);
    const detail = noise(x * 0.0034, z * 0.0034) * 0.7 + noise(x * 0.009, z * 0.009) * 0.3;
    let relief: number;
    if (violet) {
      // Long intersecting mineral ridges distinguish the violet highlands from sandstone.
      const ridge = 1 - Math.abs(noise((x + z * 0.4) * 0.00145, (z - x * 0.35) * 0.0007) * 2 - 1);
      relief = valley * (190 + broad * 430 + ridge * ridge * 290 + detail * 100);
    } else {
      const wall = valley * (250 + broad * 570 + detail * 125);
      const band = wall / 78;
      const terraced = (Math.floor(band) + smooth(0.25, 0.84, band - Math.floor(band))) * 78;
      relief = wall * 0.38 + terraced * 0.62;
    }

    // One continuous river widens into sheltered lakes. All other valley floor is
    // above water, making its banks deliberate instead of noisy plane intersections.
    const dryFloor = 35 + noise(x * 0.0018, z * 0.0018) * 11;
    const riverWidth = 28 + opening * 20 + basin * 135;
    const river = 1 - smooth(riverWidth * 0.7, riverWidth * 1.75, distance);
    const bed = 13 - basin * 19;
    return clamp(dryFloor + relief - river * (dryFloor - bed), -12, 1280);
  }

  function landmarksNear(z: number): WorldLandmark[] {
    if (version === 1) return [];
    const segment = Math.round(z / 5200);
    const landmarks: WorldLandmark[] = [];
    // Only the nearest three are needed, however long the flight continues.
    for (let i = segment - 1; i <= segment + 1; i++) {
      const landmarkRandom = randomSequence(hashSeed(`${id}:landmark:${i}`));
      const landmarkZ = i * 5200 - 1500 + (landmarkRandom() - 0.5) * 700;
      const localWidth = valleyWidth(landmarkZ);
      const center = canyon(landmarkZ);
      const side = landmarkRandom() < 0.5 ? -1 : 1;
      if (violet) {
        const x = center + side * localWidth * 0.94;
        const baseY = height(x, landmarkZ) - 8;
        landmarks.push({
          id: `${id}:${i}`,
          type: 'spire',
          x,
          z: landmarkZ,
          width: 90 + landmarkRandom() * 70,
          height: Math.min(1280 - baseY, 230 + landmarkRandom() * 190),
          baseY,
        });
      } else {
        const span = localWidth * 1.18;
        const baseY =
          Math.max(height(center - span / 2, landmarkZ), height(center + span / 2, landmarkZ)) - 8;
        landmarks.push({
          id: `${id}:${i}`,
          type: 'arch',
          x: center,
          z: landmarkZ,
          width: span,
          height: Math.min(420, 110 + span * 0.42),
          baseY,
        });
      }
    }
    return landmarks;
  }

  return {
    seed,
    version,
    waterLevel: version === 1 ? 15 : 24,
    id,
    index,
    name,
    violet,
    phase,
    width,
    noise,
    canyon,
    valleyWidth,
    landmarksNear,
    height,
    subtitle: violet ? 'Violet highlands' : 'Amber canyons',
    skyTop: violet ? '#392d89' : '#1f5e91',
    skyHorizon: violet ? '#e6a3cd' : '#f7c6a2',
    fog: violet ? '#a68dd1' : '#d79d86',
    low: violet ? '#312856' : '#572e4e',
    mid: violet ? '#755193' : '#b76250',
    high: violet ? '#c496c8' : '#e6a272',
    water: violet ? '#56dbbb' : '#36b9bf',
    glow: violet ? '#c4ffb7' : '#95edee',
  };
}

export type FlightState = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  bank: number;
  speed: number;
  throttle: number;
};

export function spawnFlight(world: World): FlightState {
  const z = 0;
  const x = world.canyon(z);
  const yaw = Math.atan2(world.canyon(z - 80) - x, 80);
  return { x, y: world.height(x, z) + 105, z, yaw, pitch: 0, bank: 0, speed: 85, throttle: 0.28 };
}

// Sweep along the whole motion segment, so boost cannot tunnel through ridges.
export function safeHeight(world: World, x0: number, z0: number, x1: number, z1: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 18));
  let top = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    top = Math.max(top, world.waterLevel, world.height(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t));
  }
  return top + 32;
}
