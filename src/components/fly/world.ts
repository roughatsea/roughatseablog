// Version 1 is part of a shared journey's identity. Keep these rules stable.
export const GENERATOR_VERSION = 1;
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
  const seed =
    value && /^\d{1,13}$/.test(value) ? String(Number(value)) : String(Math.floor(now / 1000));
  const version = params.get('v');
  return { seed, unsupported: version !== null && version !== String(GENERATOR_VERSION) };
}

export function journeyUrl(href: string, seed: string) {
  const url = new URL(href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('seed', seed);
  url.searchParams.set('v', String(GENERATOR_VERSION));
  return url.toString();
}

export type World = ReturnType<typeof createWorld>;

export function createWorld(seed: string, index: number) {
  const id = hashSeed(`${GENERATOR_VERSION}:${seed}:${index}`);
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
  return {
    id,
    index,
    name,
    violet,
    phase,
    width,
    noise,
    canyon,
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
    top = Math.max(top, world.height(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t));
  }
  return top + 32;
}
