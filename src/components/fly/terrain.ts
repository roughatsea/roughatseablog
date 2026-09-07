import { smooth, type GeneratorVersion, type World } from './world';

export type TerrainData = {
  positions: Float32Array<ArrayBuffer>;
  normals: Float32Array<ArrayBuffer>;
  colors: Float32Array<ArrayBuffer>;
  waterDepth: Float32Array<ArrayBuffer>;
  indices: Uint32Array<ArrayBuffer>;
  surfaceVertexCount: number;
  skirtVertexCount: number;
};

export type TerrainRequest = {
  id: number;
  seed: string;
  index: number;
  version: GeneratorVersion;
  cx: number;
  cz: number;
  resolution: number;
  tileSize: number;
};

export type TerrainResponse =
  { id: number; data: TerrainData; generatedMs: number } | { id: number; error: string };

// Match Three's default sRGB-to-linear conversion without importing a rendering
// dependency into the worker. Vertex colors are stored in linear working space.
function linearColor(hex: string) {
  const value = parseInt(hex.slice(1), 16);
  return [16, 8, 0].map((shift) => {
    const channel = ((value >>> shift) & 255) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
}

/** Positions are local to (cx * tileSize, 0, cz * tileSize).
 * Fixed world-space derivative samples keep normals equal across tile/LOD edges.
 * Their footprint spans several near-grid vertices to soften narrow rock strata.
 * Downward perimeter skirts cover the height difference at a finer/coarser edge.
 * Water shares the terrain mesh and depth buffer; no second intersecting plane.
 */
export function buildTerrainData(
  world: World,
  cx: number,
  cz: number,
  resolution = 40,
  tileSize = 850,
): TerrainData {
  if (!Number.isInteger(resolution) || resolution < 2 || resolution > 128)
    throw new RangeError('Terrain resolution must be an integer from 2 to 128.');
  if (!Number.isFinite(tileSize) || tileSize <= 0 || !Number.isInteger(cx) || !Number.isInteger(cz))
    throw new RangeError('Terrain tiles need integer coordinates and a positive size.');
  const stride = resolution + 1;
  const surfaceCount = stride * stride;
  const edgeCount = resolution * 4;
  const count = surfaceCount + edgeCount;
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const waterDepth = new Float32Array(count);
  const indices = new Uint32Array(resolution * resolution * 6 + edgeCount * 6);
  const low = linearColor(world.low),
    mid = linearColor(world.mid),
    high = linearColor(world.high);
  const epsilon = 64;
  const surface = (x: number, z: number) => Math.max(world.waterLevel, world.height(x, z));

  for (let row = 0; row <= resolution; row++) {
    const localZ = (row / resolution - 0.5) * tileSize;
    const z = cz * tileSize + localZ;
    for (let column = 0; column <= resolution; column++) {
      const index = row * stride + column;
      const localX = (column / resolution - 0.5) * tileSize;
      const x = cx * tileSize + localX;
      const height = world.height(x, z);
      const y = Math.max(world.waterLevel, height);
      positions.set([localX, y, localZ], index * 3);
      // Signed distance in height preserves the shoreline's zero crossing between
      // samples. Clamping dry vertices to zero spreads wet color across triangles.
      waterDepth[index] = world.waterLevel - height;

      if (height < world.waterLevel) {
        normals.set([0, 1, 0], index * 3);
      } else {
        const dx = surface(x + epsilon, z) - surface(x - epsilon, z);
        const dz = surface(x, z + epsilon) - surface(x, z - epsilon);
        const length = Math.hypot(dx, epsilon * 2, dz);
        normals.set([-dx / length, (epsilon * 2) / length, -dz / length], index * 3);
      }

      const middle = smooth(0, 280, height);
      const summit = smooth(240, 850, height) * 0.8;
      for (let channel = 0; channel < 3; channel++) {
        const base = low[channel] + (mid[channel] - low[channel]) * middle;
        // Fine strata are evaluated per fragment. Sampling them only at grid
        // vertices aliases into alternating bright/dark triangles on steep walls.
        colors[index * 3 + channel] = base + (high[channel] - base) * summit;
      }
    }
  }

  let offset = 0;
  for (let row = 0; row < resolution; row++) {
    for (let column = 0; column < resolution; column++) {
      const a = row * stride + column,
        b = a + 1,
        c = a + stride,
        d = c + 1;
      indices.set([a, c, b, b, c, d], offset);
      offset += 6;
    }
  }
  const edge: number[] = [];
  for (let column = 0; column <= resolution; column++) edge.push(column);
  for (let row = 1; row <= resolution; row++) edge.push(row * stride + resolution);
  for (let column = resolution - 1; column >= 0; column--) edge.push(resolution * stride + column);
  for (let row = resolution - 1; row > 0; row--) edge.push(row * stride);
  const skirtDepth = Math.max(110, (tileSize / resolution) * 2.5);
  for (let i = 0; i < edgeCount; i++) {
    const top = edge[i],
      bottom = surfaceCount + i;
    positions.set(positions.subarray(top * 3, top * 3 + 3), bottom * 3);
    positions[bottom * 3 + 1] -= skirtDepth;
    normals.set(normals.subarray(top * 3, top * 3 + 3), bottom * 3);
    colors.set(colors.subarray(top * 3, top * 3 + 3), bottom * 3);
    // Carry the surface color through a skirt; adjoining tiles hide it in normal use.
    waterDepth[bottom] = waterDepth[top];
    const next = (i + 1) % edgeCount;
    indices.set([top, edge[next], surfaceCount + next, top, surfaceCount + next, bottom], offset);
    offset += 6;
  }
  return {
    positions,
    normals,
    colors,
    waterDepth,
    indices,
    surfaceVertexCount: surfaceCount,
    skirtVertexCount: edgeCount,
  };
}
