// Briques communes aux modèles de produits.
import * as THREE from 'three';
import { faceLabel } from '../labels';

/** Position (x, y, z) dans le repère du produit, le sol en y = 0. */
export type Vec3 = readonly [number, number, number];

/** Construit le modèle d'une variante à partir de sa teinte et de son nom. */
export type ProductBuilder = (color: number, name: string) => THREE.Group;

export function box(
  width: number,
  height: number,
  depth: number,
): THREE.BoxGeometry {
  return new THREE.BoxGeometry(width, height, depth);
}

export function cylinder(
  top: number,
  bottom: number,
  height: number,
  segments: number,
): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(top, bottom, height, segments);
}

/** Maillage posé en `position`. */
export function part(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: Vec3,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  return mesh;
}

/** Anneau couché à plat (bord de pot, rebord de canette) à la hauteur `y`. */
export function lyingRing(
  geometry: THREE.TorusGeometry,
  material: THREE.Material,
  y: number,
): THREE.Mesh {
  const ring = part(geometry, material, [0, y, 0]);
  ring.rotation.x = Math.PI / 2;
  return ring;
}

/** Étiquette du produit posée en `position`. */
export function labelAt(
  name: string,
  width: number,
  height: number,
  position: Vec3,
): THREE.Mesh {
  const label = faceLabel(name, width, height);
  label.position.set(...position);
  return label;
}

/** Regroupe les pièces dans l'ordre donné. */
export function assemble(...parts: THREE.Object3D[]): THREE.Group {
  const group = new THREE.Group();
  group.add(...parts);
  return group;
}
