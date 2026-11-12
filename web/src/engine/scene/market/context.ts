// Contexte de construction partagé par les modules du magasin.
import * as THREE from 'three';
import type { BoxCollider, Category, Collider } from '../../types';
import type { ShelfLevel } from '../products';
import type { Door } from './doors';
import type { MarketMaterials } from './materials';
import type { Plan } from './plan';

export type Vec3 = readonly [number, number, number];

/** Meuble posé, prêt à recevoir les arômes de sa rubrique. */
export interface PlacedBay {
  group: THREE.Group;
  category: Category;
  levels: readonly ShelfLevel[];
  offset: number;
}

/** Ce que chaque module remplit pendant `createMarket`. */
export interface BuildContext {
  plan: Plan;
  group: THREE.Group;
  productMeshes: THREE.Mesh[];
  colliders: Collider[];
  materials: MarketMaterials;
  doors: Door[];
  spotlights: THREE.Object3D[];
  bays: PlacedBay[];
  /** Prochain index d'arôme, par rubrique, pour ne pas répéter le même facing. */
  flavorOffsets: Map<string, number>;
  /** Dernier assortiment posé : évite de reconstruire à l'identique. */
  stockSignature: string | null;
}

/** Meuble en cours de montage (gondole ou frigo). */
export interface BayBuild {
  bay: THREE.Group;
  category: Category;
  materials: MarketMaterials;
}

/** Pavé de dimensions `size`, centré en `position`. */
export function box(
  material: THREE.Material,
  size: Vec3,
  position: Vec3,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  return mesh;
}

/** Emprise au sol d'un pavé centré en (x, z). */
export function footprint([x, , z]: Vec3, [w, , d]: Vec3): BoxCollider {
  return { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 };
}

/** Pavé posé dans le magasin ; `solid` en fait un obstacle. */
export function addBlock(
  ctx: BuildContext,
  material: THREE.Material,
  size: Vec3,
  position: Vec3,
  solid = false,
): void {
  ctx.group.add(box(material, size, position));
  if (solid) ctx.colliders.push(footprint(position, size));
}
