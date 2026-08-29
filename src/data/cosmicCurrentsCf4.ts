import type { Vec3 } from './cosmicCurrentsModel';

const CF4_MIRROR_COMMIT = 'b1fb135ca45dafaf1831a2e8dd9875ff3046a8ef';
export const CF4_VELOCITY_URL =
  `https://raw.githubusercontent.com/manlius/laniakea/${CF4_MIRROR_COMMIT}/` +
  '2_CF4_streamlines/CF4_new_64-z008_velocity.npy';

export const CF4_DOWNLOAD_BYTES = 3_145_856;
export const CF4_SOURCE_NOTE =
  'Cosmicflows-4 64³ peculiar-velocity grid, mirrored as NumPy data by the open laniakea visualization project.';

const GRID_SIZE = 64;
const GRID_SIDE_MPC = 1000;
const CELL_MPC = GRID_SIDE_MPC / GRID_SIZE;
const COMPONENT_STRIDE = GRID_SIZE * GRID_SIZE * GRID_SIZE;

// Rows are the SGX, SGY and SGZ basis vectors expressed in Galactic Cartesian coordinates.
// The transform follows the de Vaucouleurs supergalactic system definition:
// north supergalactic pole l=47.37°, b=+6.32°; SGL=0 toward l=137.37°, b=0°.
const GALACTIC_TO_SUPERGALACTIC = [
  -0.73574257, 0.6772613, 0,
  -0.07455378, -0.08099147, 0.99392259,
  0.6731453, 0.73127117, 0.11008126,
] as const;

interface NpyResult {
  values: Float32Array;
  shape: number[];
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function parseNpyFloat32(buffer: ArrayBuffer): NpyResult {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (
    bytes.length < 16 ||
    bytes[0] !== 0x93 ||
    bytes[1] !== 0x4e ||
    bytes[2] !== 0x55 ||
    bytes[3] !== 0x4d ||
    bytes[4] !== 0x50 ||
    bytes[5] !== 0x59
  ) {
    throw new Error('The Cosmicflows download was not a valid NumPy array.');
  }

  const majorVersion = bytes[6];
  let headerLength: number;
  let headerStart: number;
  if (majorVersion === 1) {
    headerLength = view.getUint16(8, true);
    headerStart = 10;
  } else if (majorVersion === 2 || majorVersion === 3) {
    headerLength = view.getUint32(8, true);
    headerStart = 12;
  } else {
    throw new Error(`Unsupported NumPy format version ${majorVersion}.`);
  }

  const headerEnd = headerStart + headerLength;
  if (headerEnd > bytes.length) {
    throw new Error('The Cosmicflows NumPy header was truncated.');
  }
  const header = new TextDecoder('latin1').decode(bytes.subarray(headerStart, headerEnd));
  const descriptor = header.match(/['"]descr['"]\s*:\s*['"]([^'"]+)['"]/)?.[1];
  const fortranOrder = header.match(/['"]fortran_order['"]\s*:\s*(True|False)/)?.[1];
  const shapeText = header.match(/['"]shape['"]\s*:\s*\(([^)]*)\)/)?.[1];

  if (descriptor !== '<f4' && descriptor !== '|f4' && descriptor !== '=f4') {
    throw new Error(`Expected little-endian float32 Cosmicflows data; received ${descriptor ?? 'unknown'}.`);
  }
  if (fortranOrder !== 'False') {
    throw new Error('Fortran-ordered Cosmicflows arrays are not supported by this viewer.');
  }
  if (!shapeText) {
    throw new Error('The Cosmicflows NumPy array did not include a readable shape.');
  }
  const shape = shapeText
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
  const valueCount = shape.reduce((product, value) => product * value, 1);
  if (headerEnd % 4 !== 0) {
    throw new Error('The Cosmicflows NumPy payload was not float-aligned.');
  }
  if (headerEnd + valueCount * 4 > buffer.byteLength) {
    throw new Error('The Cosmicflows NumPy payload was incomplete.');
  }
  return {
    values: new Float32Array(buffer, headerEnd, valueCount),
    shape,
  };
}

function galacticToSupergalactic(point: Vec3, output: Vec3): void {
  const matrix = GALACTIC_TO_SUPERGALACTIC;
  output[0] = matrix[0] * point[0] + matrix[1] * point[1] + matrix[2] * point[2];
  output[1] = matrix[3] * point[0] + matrix[4] * point[1] + matrix[5] * point[2];
  output[2] = matrix[6] * point[0] + matrix[7] * point[1] + matrix[8] * point[2];
}

function supergalacticToGalactic(point: Vec3, output: Vec3): void {
  const matrix = GALACTIC_TO_SUPERGALACTIC;
  // A pure rotation: inverse = transpose.
  output[0] = matrix[0] * point[0] + matrix[3] * point[1] + matrix[6] * point[2];
  output[1] = matrix[1] * point[0] + matrix[4] * point[1] + matrix[7] * point[2];
  output[2] = matrix[2] * point[0] + matrix[5] * point[1] + matrix[8] * point[2];
}

export class CosmicflowsVelocityGrid {
  private readonly temporaryPosition: Vec3 = [0, 0, 0];
  private readonly temporaryVelocity: Vec3 = [0, 0, 0];

  constructor(private readonly values: Float32Array) {}

  sampleGalactic(position: Vec3, output: Vec3): boolean {
    galacticToSupergalactic(position, this.temporaryPosition);
    const gridX = (this.temporaryPosition[0] + GRID_SIDE_MPC / 2) / CELL_MPC - 0.5;
    const gridY = (this.temporaryPosition[1] + GRID_SIDE_MPC / 2) / CELL_MPC - 0.5;
    const gridZ = (this.temporaryPosition[2] + GRID_SIDE_MPC / 2) / CELL_MPC - 0.5;
    if (
      gridX < 0 || gridY < 0 || gridZ < 0 ||
      gridX >= GRID_SIZE - 1 || gridY >= GRID_SIZE - 1 || gridZ >= GRID_SIZE - 1
    ) {
      return false;
    }

    // The published cube is ordered (SGZ, SGY, SGX); the mirror's reference
    // integrator maps component 2->SGX, 1->SGY, 0->SGZ.
    this.temporaryVelocity[0] = this.trilinear(2, gridX, gridY, gridZ);
    this.temporaryVelocity[1] = this.trilinear(1, gridX, gridY, gridZ);
    this.temporaryVelocity[2] = this.trilinear(0, gridX, gridY, gridZ);
    if (
      !Number.isFinite(this.temporaryVelocity[0]) ||
      !Number.isFinite(this.temporaryVelocity[1]) ||
      !Number.isFinite(this.temporaryVelocity[2])
    ) {
      return false;
    }

    const rawMagnitude = Math.hypot(
      this.temporaryVelocity[0],
      this.temporaryVelocity[1],
      this.temporaryVelocity[2],
    );
    if (rawMagnitude < 1e-7) {
      return false;
    }

    // The release notes specify a factor of 52 for physical velocity values.
    // Rendering uses direction plus a compressed visual magnitude so outliers
    // cannot shoot tracers across the scene in one frame.
    const physicalSpeed = rawMagnitude * 52;
    const visualMagnitude = clamp(0.46 + physicalSpeed / 620, 0.42, 1.9);
    this.temporaryVelocity[0] = (this.temporaryVelocity[0] / rawMagnitude) * visualMagnitude;
    this.temporaryVelocity[1] = (this.temporaryVelocity[1] / rawMagnitude) * visualMagnitude;
    this.temporaryVelocity[2] = (this.temporaryVelocity[2] / rawMagnitude) * visualMagnitude;
    supergalacticToGalactic(this.temporaryVelocity, output);
    return true;
  }

  private trilinear(component: number, x: number, y: number, z: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const z1 = z0 + 1;
    const tx = x - x0;
    const ty = y - y0;
    const tz = z - z0;

    const at = (ix: number, iy: number, iz: number): number =>
      this.values[
        component * COMPONENT_STRIDE + iz * GRID_SIZE * GRID_SIZE + iy * GRID_SIZE + ix
      ];

    const c000 = at(x0, y0, z0);
    const c100 = at(x1, y0, z0);
    const c010 = at(x0, y1, z0);
    const c110 = at(x1, y1, z0);
    const c001 = at(x0, y0, z1);
    const c101 = at(x1, y0, z1);
    const c011 = at(x0, y1, z1);
    const c111 = at(x1, y1, z1);

    const c00 = c000 * (1 - tx) + c100 * tx;
    const c10 = c010 * (1 - tx) + c110 * tx;
    const c01 = c001 * (1 - tx) + c101 * tx;
    const c11 = c011 * (1 - tx) + c111 * tx;
    const c0 = c00 * (1 - ty) + c10 * ty;
    const c1 = c01 * (1 - ty) + c11 * ty;
    return c0 * (1 - tz) + c1 * tz;
  }
}

export async function loadCosmicflowsVelocityGrid(
  signal?: AbortSignal,
): Promise<CosmicflowsVelocityGrid> {
  const response = await fetch(CF4_VELOCITY_URL, {
    signal,
    mode: 'cors',
    credentials: 'omit',
    cache: 'force-cache',
  });
  if (!response.ok) {
    throw new Error(`Cosmicflows field download failed with HTTP ${response.status}.`);
  }
  const buffer = await response.arrayBuffer();
  const parsed = parseNpyFloat32(buffer);
  if (
    parsed.shape.length !== 4 ||
    parsed.shape[0] !== 3 ||
    parsed.shape[1] !== GRID_SIZE ||
    parsed.shape[2] !== GRID_SIZE ||
    parsed.shape[3] !== GRID_SIZE
  ) {
    throw new Error(`Unexpected Cosmicflows grid shape: ${parsed.shape.join(' × ')}.`);
  }
  return new CosmicflowsVelocityGrid(parsed.values);
}
