import * as THREE from 'three';
import { clamp, smooth, type World, type WorldLandmark } from './world';

type Point = { x: number; y: number; z: number };
const landmarkCache = new WeakMap<World, { sector: number; landmarks: WorldLandmark[] }>();

export function nearbyLandmarks(world: World, z: number) {
  const sector = Math.round(z / 5200);
  const cached = landmarkCache.get(world);
  if (cached?.sector === sector) return cached.landmarks;
  const landmarks = world.landmarksNear(z);
  landmarkCache.set(world, { sector, landmarks });
  return landmarks;
}

function archDimensions(landmark: WorldLandmark) {
  const thickness = clamp(landmark.width * 0.105, 24, 65);
  return {
    outerX: landmark.width / 2 + thickness,
    outerY: landmark.height + thickness,
    innerX: landmark.width / 2 - thickness,
    innerY: landmark.height - thickness,
    depth: clamp(landmark.width * 0.19, 42, 100),
  };
}

function spireRadius(width: number, fraction: number) {
  return width * 0.56 * Math.pow(Math.max(0, 1 - fraction), 0.58);
}

function archGeometry(landmark: WorldLandmark) {
  const { outerX, outerY, innerX, innerY, depth } = archDimensions(landmark);
  const shape = new THREE.Shape();
  shape.moveTo(-outerX, -80);
  shape.lineTo(-outerX, 0);
  shape.absellipse(0, 0, outerX, outerY, Math.PI, 0, true, 0);
  shape.lineTo(outerX, -80);
  shape.lineTo(innerX, -80);
  shape.lineTo(innerX, 0);
  shape.absellipse(0, 0, innerX, innerY, 0, Math.PI, false, 0);
  shape.lineTo(-innerX, -80);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelSize: 4,
    bevelThickness: 4,
    bevelSegments: 1,
    curveSegments: 22,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function spireGeometry(landmark: WorldLandmark) {
  const sides = 9;
  const fractions = [-0.16, 0, 0.13, 0.48, 0.77, 0.92, 1];
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row < fractions.length; row++) {
    const fraction = fractions[row];
    const y = fraction * landmark.height;
    const radius = spireRadius(landmark.width, Math.max(0, fraction));
    for (let side = 0; side < sides; side++) {
      const angle = (side / sides) * Math.PI * 2 + fraction * 0.14;
      const uneven = 0.94 + Math.sin(side * 3.71 + landmark.x * 0.002) * 0.06;
      positions.push(
        Math.cos(angle) * radius * uneven + y * 0.07,
        y,
        Math.sin(angle) * radius * uneven - y * 0.045,
      );
      if (row < fractions.length - 1) {
        const a = row * sides + side;
        const b = row * sides + ((side + 1) % sides);
        const c = a + sides;
        const d = b + sides;
        indices.push(a, c, b, b, c, d);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function buildLandmark(world: World, landmark: WorldLandmark, material: THREE.Material) {
  const geometry = landmark.type === 'arch' ? archGeometry(landmark) : spireGeometry(landmark);
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const low = new THREE.Color(world.low);
  const mid = new THREE.Color(world.mid);
  const high = new THREE.Color(world.high);
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i),
      y = position.getY(i),
      z = position.getZ(i);
    const weathering = world.noise((x + landmark.x) * 0.032, (y + landmark.z) * 0.026);
    if (landmark.type === 'arch') {
      // Duplicate extrusion vertices receive the same displacement, leaving no cracks.
      position.setXYZ(i, x + (weathering - 0.5) * 4, y + (weathering - 0.5) * 4, z);
    }
    const strata = 0.5 + Math.sin((y + landmark.baseY) * 0.065 + weathering * 1.6) * 0.5;
    color
      .copy(low)
      .lerp(mid, smooth(-40, landmark.height * 0.7, y))
      .lerp(high, smooth(landmark.height * 0.2, landmark.height, y) * 0.7)
      .multiplyScalar(0.88 + strata * 0.2);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = landmark.type === 'arch' ? 'Weathered stone arch' : 'Mineral spire';
  mesh.position.set(landmark.x, landmark.baseY, landmark.z);
  return mesh;
}

function resolveLandmark(landmark: WorldLandmark, point: Point, clearance: number): Point | null {
  const x = point.x - landmark.x;
  const y = point.y - landmark.baseY;
  const z = point.z - landmark.z;
  if (landmark.type === 'spire') {
    if (y < -80 || y > landmark.height + clearance) return null;
    const height = clamp(y, 0, landmark.height);
    const centerX = height * 0.07;
    const centerZ = -height * 0.045;
    const dx = x - centerX,
      dz = z - centerZ;
    const radius = spireRadius(landmark.width, height / landmark.height) + clearance;
    const distance = Math.hypot(dx, dz);
    if (distance >= radius) return null;
    const scale = radius / Math.max(distance, 0.001);
    return {
      x: landmark.x + centerX + (distance < 0.001 ? radius : dx * scale),
      y: point.y,
      z: landmark.z + centerZ + (distance < 0.001 ? 0 : dz * scale),
    };
  }
  const arch = archDimensions(landmark);
  if (Math.abs(z) > arch.depth / 2 + clearance + 4 || y < -80 - clearance) return null;
  const innerX = Math.max(10, arch.innerX - clearance - 5);
  const innerY = Math.max(10, arch.innerY - clearance - 5);
  const outerX = arch.outerX + clearance + 5;
  const outerY = arch.outerY + clearance + 5;
  const side = x < 0 ? -1 : 1;
  if (y <= 0) {
    if (Math.abs(x) < innerX || Math.abs(x) > outerX) return null;
    const boundary = Math.abs(x) - innerX < outerX - Math.abs(x) ? innerX : outerX;
    return { ...point, x: landmark.x + side * boundary };
  }
  const inner = Math.hypot(x / innerX, y / innerY);
  const outer = Math.hypot(x / outerX, y / outerY);
  if (inner < 1 || outer > 1) return null;
  const innerPoint = { x: x / inner, y: y / inner };
  const outerPoint = { x: x / outer, y: y / outer };
  const inward = Math.hypot(innerPoint.x - x, innerPoint.y - y);
  const outward = Math.hypot(outerPoint.x - x, outerPoint.y - y);
  const boundary = inward < outward ? innerPoint : outerPoint;
  return { x: landmark.x + boundary.x, y: landmark.baseY + boundary.y, z: point.z };
}

/** Sweep a flight step through actual arch frames and tapered spires. The open
 * arch passage is excluded, so low canyon flight can pass beneath the stone.
 * Applying each small movement to the corrected position produces a slide along
 * the safety margin instead of a destructive collision or a bounding-box wall.
 */
export function avoidLandmarks(world: World, from: Point, target: Point, clearance = 24) {
  if (world.version === 1 || Math.min(from.y, target.y) > 1450)
    return { ...target, assisted: false };
  const nearby = nearbyLandmarks(world, (from.z + target.z) * 0.5);
  if (!nearby.length) return { ...target, assisted: false };
  const minZ = Math.min(from.z, target.z) - clearance - 180;
  const maxZ = Math.max(from.z, target.z) + clearance + 180;
  if (!nearby.some((landmark) => landmark.z >= minZ && landmark.z <= maxZ))
    return { ...target, assisted: false };
  const distance = Math.hypot(target.x - from.x, target.y - from.y, target.z - from.z);
  const steps = Math.max(1, Math.ceil(distance / 14));
  const dx = (target.x - from.x) / steps;
  const dy = (target.y - from.y) / steps;
  const dz = (target.z - from.z) / steps;
  let current = { ...from };
  let assisted = false;
  for (let i = 0; i < steps; i++) {
    current = { x: current.x + dx, y: current.y + dy, z: current.z + dz };
    for (const landmark of nearby) {
      const corrected = resolveLandmark(landmark, current, clearance);
      if (corrected) {
        current = corrected;
        assisted = true;
      }
    }
  }
  // Avoid rounding drift in ordinary flight far from a landmark.
  return assisted ? { ...current, assisted } : { ...target, assisted: false };
}
