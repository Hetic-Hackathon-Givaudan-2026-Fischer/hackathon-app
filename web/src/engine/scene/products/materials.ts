// Matériaux standard des emballages, partagés entre tous les produits.
import * as THREE from 'three';
import { cached } from '../shared/cache';

/** Réglages acceptés en plus de la couleur. */
export type Finish = Pick<
  THREE.MeshStandardMaterialParameters,
  'roughness' | 'metalness' | 'transparent' | 'opacity'
>;

const ROUGHNESS = 0.48;
const METALNESS = 0.04;

const materials = new Map<string, THREE.MeshStandardMaterial>();

function finishKey(color: number, finish: Finish): string {
  return [
    color,
    finish.roughness ?? ROUGHNESS,
    finish.metalness ?? METALNESS,
    finish.transparent ? 1 : 0,
    finish.opacity ?? 1,
  ].join('|');
}

/** Matériau standard : un seul exemplaire par couleur et réglages. */
export function standard(
  color: number,
  finish: Finish = {},
): THREE.MeshStandardMaterial {
  return cached(
    materials,
    finishKey(color, finish),
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: ROUGHNESS,
        metalness: METALNESS,
        ...finish,
      }),
  );
}
