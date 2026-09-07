import { createWorld, type World } from './world';
import { buildTerrainData, type TerrainRequest, type TerrainResponse } from './terrain';

const worker = globalThis as unknown as {
  onmessage: ((event: MessageEvent<TerrainRequest>) => void) | null;
  postMessage: (message: TerrainResponse, transfer?: Transferable[]) => void;
};
let cachedKey = '';
let cachedWorld: World;

worker.onmessage = ({ data: request }) => {
  try {
    const start = performance.now();
    const key = `${request.version}:${request.seed}:${request.index}`;
    if (key !== cachedKey) {
      cachedWorld = createWorld(request.seed, request.index, request.version);
      cachedKey = key;
    }
    const data = buildTerrainData(
      cachedWorld,
      request.cx,
      request.cz,
      request.resolution,
      request.tileSize,
    );
    worker.postMessage({ id: request.id, data, generatedMs: performance.now() - start }, [
      data.positions.buffer,
      data.normals.buffer,
      data.colors.buffer,
      data.waterDepth.buffer,
      data.indices.buffer,
    ]);
  } catch (error) {
    worker.postMessage({
      id: request.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
