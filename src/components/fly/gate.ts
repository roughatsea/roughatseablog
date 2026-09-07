type Point = { x: number; y: number; z: number };

/** Intersect the entire movement segment with the gate's forward-facing plane.
 * This catches fast crossings but excludes reverse entry and near misses.
 * The radius is the clear opening inside the final torus (340 - 18 metres).
 */
export function crossesGate(from: Point, to: Point, center: Point, normal: Point, radius = 322) {
  const ax = from.x - center.x,
    ay = from.y - center.y,
    az = from.z - center.z;
  const bx = to.x - center.x,
    by = to.y - center.y,
    bz = to.z - center.z;
  const before = ax * normal.x + ay * normal.y + az * normal.z;
  const after = bx * normal.x + by * normal.y + bz * normal.z;
  if (before >= 0 || after < 0) return false;
  const t = -before / (after - before);
  const x = ax + (bx - ax) * t,
    y = ay + (by - ay) * t,
    z = az + (bz - az) * t;
  return x * x + y * y + z * z < radius * radius;
}
