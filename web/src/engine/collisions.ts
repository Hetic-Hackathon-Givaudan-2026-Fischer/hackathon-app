// Collisions du joueur avec le mobilier, dans le plan XZ.
import type { BoxCollider, Collider, RotatedCollider } from './types';

function isRotated(collider: Collider): collider is RotatedCollider {
  return 'cos' in collider;
}

function insideBox(box: BoxCollider, x: number, z: number, radius: number) {
  return (
    x > box.minX - radius &&
    x < box.maxX + radius &&
    z > box.minZ - radius &&
    z < box.maxZ + radius
  );
}

function insideRotated(
  box: RotatedCollider,
  x: number,
  z: number,
  radius: number,
) {
  const dx = x - box.cx;
  const dz = z - box.cz;
  const lx = dx * box.cos - dz * box.sin;
  const lz = dx * box.sin + dz * box.cos;
  return (
    lx > box.minLX - radius &&
    lx < box.maxLX + radius &&
    lz > box.minLZ - radius &&
    lz < box.maxLZ + radius
  );
}

/** Vrai si un disque de rayon `radius` en (x, z) touche un obstacle. */
export function collides(
  colliders: readonly Collider[],
  x: number,
  z: number,
  radius: number,
): boolean {
  return colliders.some((collider) =>
    isRotated(collider)
      ? insideRotated(collider, x, z, radius)
      : insideBox(collider, x, z, radius),
  );
}
