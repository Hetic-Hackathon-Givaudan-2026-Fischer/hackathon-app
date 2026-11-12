// Portes coulissantes de l'entrée : elles s'ouvrent à l'approche du joueur.
import type * as THREE from 'three';
import type { BoxCollider } from '../../types';

/** Vantail : sa position fermée, sa course et l'obstacle qui le suit. */
export interface DoorLeaf {
  leaf: THREE.Group;
  closedX: number;
  travel: number;
  half: number;
  block: BoxCollider;
}

/** Porte d'une ouverture ; `open` va de 0 (fermée) à 1 (ouverte). */
export interface Door {
  x0: number;
  x1: number;
  z: number;
  leaves: DoorLeaf[];
  open: number;
}

const DOOR_NEAR = 1.8;
const DOOR_FAR = 3.6;

/** Ouverture visée : complète sur le seuil, lissée selon la distance. */
function openingGoal(door: Door, px: number, pz: number): number {
  const clampedX = Math.min(Math.max(px, door.x0), door.x1);
  const distance = Math.hypot(px - clampedX, pz - door.z);
  const span = DOOR_FAR - DOOR_NEAR;
  const t = Math.min(1, Math.max(0, (distance - DOOR_NEAR) / span));
  const eased = t * t * (3 - 2 * t);
  const inSlab =
    px > door.x0 - 0.3 && px < door.x1 + 0.3 && Math.abs(pz - door.z) < 0.7;
  return inSlab ? 1 : 1 - eased;
}

/** Place les vantaux et déplace leurs obstacles avec eux. */
function moveLeaves(door: Door): void {
  door.leaves.forEach((item) => {
    const x = item.closedX + item.travel * door.open;
    item.leaf.position.x = x;
    item.block.minX = x - item.half;
    item.block.maxX = x + item.half;
  });
}

export function slideDoors(
  doors: readonly Door[],
  position: THREE.Vector3,
  dt: number,
): void {
  doors.forEach((door) => {
    const goal = openingGoal(door, position.x, position.z);
    door.open += (goal - door.open) * (1 - Math.exp(-7 * dt));
    moveLeaves(door);
  });
}
