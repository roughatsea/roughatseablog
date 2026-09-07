import * as THREE from 'three';
import { Atmosphere } from './atmosphere';
import { buildLandmark, nearbyLandmarks } from './landmarks';
import { TerrainStream, type DetailTier } from './terrain-stream';
import { smooth, type World } from './world';

export { buildShip } from './ship';
export { avoidLandmarks } from './landmarks';

export function disposeObject(root: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material)
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) =>
        materials.add(material),
      );
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

/** Local scenery and its celestial backdrop have independent depth buffers.
 * The local scene owns terrain, landmarks and clouds; the backdrop owns only
 * planet-scale geometry. All geometry uses the ship as its floating origin.
 */
export class Scenery {
  readonly root = new THREE.Group();
  readonly background: THREE.Group;
  readonly terrain: THREE.Group;
  readonly tile = 850;
  readonly radius = 4;
  private readonly stream: TerrainStream;
  private readonly atmosphere: Atmosphere;
  private readonly landmarks = new THREE.Group();
  private readonly landmarkMeshes = new Map<string, THREE.Mesh>();
  private readonly landmarkMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
  });
  private disposed = false;
  private landmarkSector = Number.NaN;

  constructor(public world: World) {
    this.root.name = 'Local flight scenery';
    this.stream = new TerrainStream(world);
    this.landmarkMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.horizonFade = this.stream.surface.uniforms.horizonFade;
      shader.vertexShader = `varying vec2 vLocalHorizon;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vLocalHorizon = (modelMatrix * vec4(position, 1.0)).xz;`,
      );
      shader.fragmentShader = `varying vec2 vLocalHorizon; uniform float horizonFade;\n${shader.fragmentShader}`.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        diffuseColor.a *= 1.0 - horizonFade * smoothstep(2200.0, 3000.0, length(vLocalHorizon));`,
      );
    };
    this.landmarkMaterial.customProgramCacheKey = () => 'fly-landmark-horizon-v1';
    this.terrain = this.stream.root;
    this.atmosphere = new Atmosphere(world);
    this.background = this.atmosphere.root;
    this.landmarks.name = 'World landmarks';
    this.root.add(this.terrain, this.landmarks, this.atmosphere.cloudRoot);
  }

  setDetail(tier: DetailTier) {
    this.stream.setDetail(tier);
  }

  get stats() {
    return this.stream.stats;
  }

  setArrivalTint(color: THREE.ColorRepresentation, strength = 0) {
    this.atmosphere.setArrivalTint(color, strength);
  }

  setTransit(amount: number) {
    this.atmosphere.setTransit(amount);
  }

  update(x: number, y: number, z: number, time: number, initial = false, vx = 0, vz = 0) {
    if (this.disposed) return;
    this.stream.update(x, y, z, time, initial, vx, vz);
    this.atmosphere.update(x, y, z, time);
    const opacity = 1 - smooth(1800, 5100, y);
    this.landmarks.visible = opacity > 0;
    this.landmarks.position.set(-x, -y, -z);
    if (this.landmarkMaterial.transparent !== opacity < 1) {
      this.landmarkMaterial.transparent = opacity < 1;
      this.landmarkMaterial.needsUpdate = true;
    }
    this.landmarkMaterial.opacity = opacity;
    if (!this.landmarks.visible) return;

    const sector = Math.round(z / 5200);
    if (sector === this.landmarkSector) {
      this.cullLandmarks(x, z);
      return;
    }
    this.landmarkSector = sector;
    const nearby = nearbyLandmarks(this.world, z);
    const wanted = new Set(nearby.map((landmark) => landmark.id));
    for (const [id, mesh] of this.landmarkMeshes) {
      if (!wanted.has(id)) {
        this.landmarks.remove(mesh);
        mesh.geometry.dispose();
        this.landmarkMeshes.delete(id);
      }
    }
    for (const landmark of nearby) {
      if (this.landmarkMeshes.has(landmark.id)) continue;
      const mesh = buildLandmark(this.world, landmark, this.landmarkMaterial);
      this.landmarkMeshes.set(landmark.id, mesh);
      this.landmarks.add(mesh);
    }
    this.cullLandmarks(x, z);
  }

  private cullLandmarks(x: number, z: number) {
    for (const mesh of this.landmarkMeshes.values()) {
      const dx = mesh.position.x - x;
      const dz = mesh.position.z - z;
      // Distant landmarks must never float outside the loaded terrain window.
      mesh.visible = dx * dx + dz * dz < 3400 * 3400;
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stream.dispose();
    this.atmosphere.dispose();
    for (const mesh of this.landmarkMeshes.values()) mesh.geometry.dispose();
    this.landmarkMeshes.clear();
    this.landmarkMaterial.dispose();
    this.landmarks.clear();
    this.root.clear();
  }
}
