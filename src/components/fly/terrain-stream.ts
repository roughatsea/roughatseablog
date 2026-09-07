import * as THREE from 'three';
import { buildTerrainData, type TerrainData, type TerrainResponse } from './terrain';
import { smooth, type World } from './world';

export type DetailTier = 0 | 1 | 2;
type TileJob = { id: number; key: string; cx: number; cz: number; resolution: number };
type Tile = { mesh: THREE.Mesh; resolution: number };

export function surfaceMaterial(world: World) {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  const uniforms = {
    surfaceTime: { value: 0 },
    surfaceOrigin: { value: new THREE.Vector3() },
    horizonFade: { value: 0 },
    strataPhase: { value: world.phase },
    shallowWater: { value: new THREE.Color(world.water).multiplyScalar(0.85) },
    deepWater: { value: new THREE.Color(world.water).multiplyScalar(0.43) },
  };
  // Land and water share one depth-tested surface. No coplanar water layer,
  // transparency sorting, or animated shoreline geometry is involved.
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      `attribute float waterDepth; varying float vWaterDepth; varying vec3 vSurfacePosition; varying vec2 vLocalHorizon; uniform vec3 surfaceOrigin;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vWaterDepth = waterDepth;
        vec3 localSurface = (modelMatrix * vec4(position, 1.0)).xyz;
        vLocalHorizon = localSurface.xz;
        vSurfacePosition = localSurface + surfaceOrigin;`,
      );
    shader.fragmentShader = `varying float vWaterDepth; varying vec3 vSurfacePosition; varying vec2 vLocalHorizon;
      uniform float surfaceTime; uniform float strataPhase; uniform float horizonFade; uniform vec3 shallowWater; uniform vec3 deepWater;\n${shader.fragmentShader}`
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        // Blend the streamed terrain into the globe before the square tile window
        // becomes visible from above. Surface flight remains fully opaque.
        // Even with the 350m forward lead and tile rounding, coverage extends
        // at least 3050m in every direction. Finish this fade inside that bound.
        diffuseColor.a *= 1.0 - horizonFade * smoothstep(2200.0, 3000.0, length(vLocalHorizon));
        // Filter the rock bands in screen space before they become smaller than
        // a pixel. The horizontal periods divide the floating origin's 8192m
        // wrap, keeping their position continuous throughout a long journey.
        float strataCoordinate = vSurfacePosition.y * .065
          + sin(vSurfacePosition.x * .001533980788 + vSurfacePosition.z * .000766990394 + strataPhase) * 1.4;
        float strataFilter = 1.0 - smoothstep(.65, 2.6, fwidth(strataCoordinate));
        diffuseColor.rgb *= .97 + .10 * sin(strataCoordinate) * strataFilter;
        float shoreWidth = max(3.0, fwidth(vWaterDepth) * 1.5);
        float riverMask = smoothstep(-shoreWidth * .35, shoreWidth * .65, vWaterDepth);
        float depthColor = smoothstep(3.0, 30.0, vWaterDepth);
        vec3 liquidColor = mix(shallowWater, deepWater, depthColor);
        float ripples = sin(vSurfacePosition.x * .0245436926 + vSurfacePosition.z * .0122718463 + surfaceTime * .38)
          * sin(vSurfacePosition.z * .0490873852 - surfaceTime * .25);
        liquidColor *= 1.0 + .025 * ripples;
        diffuseColor.rgb = mix(diffuseColor.rgb, liquidColor, riverMask);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .5, riverMask);',
      );
  };
  material.customProgramCacheKey = () => 'fly-shared-shoreline-filtered-strata-horizon-v4';
  return { material, uniforms };
}

export function terrainGeometry(data: TerrainData) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
  geometry.setAttribute('waterDepth', new THREE.BufferAttribute(data.waterDepth, 1));
  geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/** Bounded streaming queue; workers never change visible meshes directly. */
export class TerrainStream {
  root = new THREE.Group();
  readonly tile = 850;
  readonly radius = 4;
  readonly surface;
  private tiles = new Map<string, Tile>();
  private wanted = new Map<string, TileJob>();
  private pending: TileJob[] = [];
  private inFlight = new Map<number, TileJob>();
  private completed: { job: TileJob; data: TerrainData }[] = [];
  private worker: Worker | null = null;
  private serial = 0;
  private centerKey = '';
  private disposed = false;
  private tier: DetailTier = 0;
  private centerX = 0;
  private centerZ = 0;
  private initialized = false;
  workerFailed = false;

  constructor(public world: World) {
    this.surface = surfaceMaterial(world);
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('./terrain.worker.ts', import.meta.url), {
          type: 'module',
        });
        this.worker.onmessage = (event: MessageEvent<TerrainResponse>) => {
          if (this.disposed) return;
          const job = this.inFlight.get(event.data.id);
          this.inFlight.delete(event.data.id);
          if ('error' in event.data) {
            this.fallback();
            return;
          }
          if (job && !this.disposed && this.wanted.get(job.key)?.id === job.id)
            this.completed.push({ job, data: event.data.data });
        };
        this.worker.onerror = () => this.fallback();
      } catch {
        this.fallback();
      }
    }
  }

  private fallback() {
    this.worker?.terminate();
    this.worker = null;
    this.workerFailed = true;
    this.inFlight.clear();
    this.centerKey = '';
  }

  private install(job: TileJob, data: TerrainData) {
    const previous = this.tiles.get(job.key);
    const mesh = new THREE.Mesh(terrainGeometry(data), this.surface.material);
    mesh.position.set(job.cx * this.tile, 0, job.cz * this.tile);
    this.root.add(mesh);
    if (previous) {
      this.root.remove(previous.mesh);
      previous.mesh.geometry.dispose();
    }
    this.tiles.set(job.key, { mesh, resolution: job.resolution });
  }

  setDetail(tier: DetailTier) {
    if (this.tier !== tier) {
      this.tier = tier;
      this.centerKey = '';
    }
  }
  get stats() {
    return {
      tiles: this.tiles.size,
      pending: this.pending.length + this.inFlight.size + this.completed.length,
      worker: this.worker !== null,
    };
  }

  update(x: number, y: number, z: number, time: number, initial = false, vx = 0, vz = 0) {
    if (this.disposed) return;
    this.root.position.set(-x, -y, -z);
    this.root.visible = y < 5200;
    const opacity = 1 - smooth(1800, 5100, y);
    if (this.surface.material.transparent !== opacity < 1) {
      this.surface.material.transparent = opacity < 1;
      this.surface.material.needsUpdate = true;
    }
    this.surface.material.opacity = opacity;
    this.surface.uniforms.horizonFade.value = smooth(1800, 2200, y);
    this.surface.uniforms.surfaceTime.value = time;
    this.surface.uniforms.surfaceOrigin.value.set(x % 8192, y, z % 8192);
    if (y > 5200) return;
    // Bias work toward the direction of travel while retaining a full window.
    const cx = Math.round((x + Math.max(-350, Math.min(350, vx * 0.8))) / this.tile);
    const cz = Math.round((z + Math.max(-350, Math.min(350, vz * 0.8))) / this.tile);
    this.centerX = cx;
    this.centerZ = cz;
    const centerKey = `${cx},${cz}:${this.tier}`;
    if (!this.initialized) {
      this.initialized = true;
      // Immediate low-cost coverage; the worker upgrades these without a blank frame.
      for (let ix = cx - 1; ix <= cx + 1; ix++)
        for (let iz = cz - 1; iz <= cz + 1; iz++) {
          const job = { id: ++this.serial, key: `${ix},${iz}`, cx: ix, cz: iz, resolution: 12 };
          this.install(job, buildTerrainData(this.world, ix, iz, 12, this.tile));
        }
    }
    if (centerKey !== this.centerKey) {
      this.centerKey = centerKey;
      this.pending = [];
      this.wanted.clear();
      for (const [key, tile] of this.tiles) {
        const [ix, iz] = key.split(',').map(Number);
        if (Math.abs(ix - cx) > this.radius || Math.abs(iz - cz) > this.radius) {
          this.root.remove(tile.mesh);
          tile.mesh.geometry.dispose();
          this.tiles.delete(key);
        }
      }
      const levels = [
        [48, 28, 14],
        [36, 24, 12],
        [28, 18, 10],
      ][this.tier];
      // A result can finish between frames, just before the streaming window moves.
      // Retain its ID and buffers as well as running work when the desired LOD matches.
      const reusable = new Map(
        [...this.inFlight.values(), ...this.completed.map(({ job }) => job)].map((job) => [
          `${job.key}:${job.resolution}`,
          job,
        ]),
      );
      for (let ix = cx - this.radius; ix <= cx + this.radius; ix++)
        for (let iz = cz - this.radius; iz <= cz + this.radius; iz++) {
          const distance = Math.max(Math.abs(ix - cx), Math.abs(iz - cz));
          const resolution = levels[distance <= 1 ? 0 : distance <= 2 ? 1 : 2];
          const key = `${ix},${iz}`;
          if (this.tiles.get(key)?.resolution === resolution) continue;
          const retained = reusable.get(`${key}:${resolution}`);
          const job = retained ?? { id: ++this.serial, key, cx: ix, cz: iz, resolution };
          this.wanted.set(key, job);
          if (!retained) this.pending.push(job);
        }
      this.pending.sort(
        (a, b) => (a.cx - cx) ** 2 + (a.cz - cz) ** 2 - ((b.cx - cx) ** 2 + (b.cz - cz) ** 2),
      );
      this.completed = this.completed.filter(({ job }) => this.wanted.get(job.key)?.id === job.id);
    }
    // Limit GPU uploads as well as worker dispatch; neither creates a frame burst.
    for (let i = 0; i < 2 && this.completed.length; i++) {
      const { job, data } = this.completed.shift()!;
      if (this.wanted.get(job.key)?.id === job.id) {
        this.install(job, data);
        this.wanted.delete(job.key);
      }
    }
    if (this.worker) {
      while (this.pending.length && this.inFlight.size < 2) {
        const job = this.pending.shift()!;
        this.inFlight.set(job.id, job);
        this.worker.postMessage({
          ...job,
          seed: this.world.seed,
          index: this.world.index,
          version: this.world.version,
          tileSize: this.tile,
        });
      }
    } else {
      const count = initial && typeof window === 'undefined' ? this.pending.length : 1;
      for (let i = 0; i < count && this.pending.length; i++) {
        const job = this.pending.shift()!;
        this.install(job, buildTerrainData(this.world, job.cx, job.cz, job.resolution, this.tile));
        this.wanted.delete(job.key);
      }
    }
  }

  dispose() {
    this.disposed = true;
    this.worker?.terminate();
    this.worker = null;
    this.tiles.forEach(({ mesh }) => mesh.geometry.dispose());
    this.tiles.clear();
    this.root.clear();
    this.surface.material.dispose();
    this.pending = [];
    this.completed = [];
    this.inFlight.clear();
    this.wanted.clear();
  }
}
