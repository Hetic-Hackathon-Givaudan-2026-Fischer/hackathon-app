// Matériaux mats de la nature (terre, feuillage, pierre).
import * as THREE from 'three';

/** Matériau standard non métallique d'une couleur et d'une rugosité. */
export function matte(
  color: number,
  roughness: number,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}
