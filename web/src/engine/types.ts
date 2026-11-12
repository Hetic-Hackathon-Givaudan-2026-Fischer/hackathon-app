// Contrats partagés entre les modules du moteur 3D : une seule source pour
// les formes échangées entre scene/market, scene/products, scene/scanner et
// l'expérience (boucle de rendu, contrôles, visée).
import type * as THREE from 'three';

/** Mobilier d'un rayon : vitrine réfrigérée ou gondole. */
export type ShelfKind = 'fridge' | 'gondola';

/** Rubrique du magasin, portée par `userData.category` des produits. */
export interface Category {
  id: string;
  name: string;
  blurb: string;
  type: ShelfKind;
  accent: number;
}

/** Une ligne de la fiche de scan : un arôme et ses données, déjà mises en forme. */
export interface ScanRow {
  label: string;
  value: string;
  detail: string | null;
}

/**
 * Fiche affichée sur la tablette après un scan. Construite hors du moteur
 * (données de l'API) : le moteur ne fait que la dessiner.
 */
export interface ScanCard {
  title: string;
  subtitle: string;
  rows: readonly ScanRow[];
  footnote: string | null;
}

/** Obstacle aligné sur les axes du monde (plan XZ). */
export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Obstacle tourné de `yaw` autour de (cx, cz), bornes en repère local. */
export interface RotatedCollider {
  cx: number;
  cz: number;
  cos: number;
  sin: number;
  minLX: number;
  maxLX: number;
  minLZ: number;
  maxLZ: number;
}

export type Collider = BoxCollider | RotatedCollider;

/** Ce que `createMarket` rend à l'expérience. */
export interface Market {
  group: THREE.Group;
  productMeshes: THREE.Mesh[];
  colliders: Collider[];
  updateDoors(position: THREE.Vector3, dt: number): void;
  updateSpotlights(time: number): void;
}

/** Scanner + tablette tenus en main (calque 1), et le faisceau (monde). */
export interface Gear {
  object: THREE.Group;
  beam: THREE.Group;
  fire(point: THREE.Vector3): void;
  deny(): void;
  show(card: ScanCard): void;
  update(
    dt: number,
    time: number,
    ready: boolean,
    moving: boolean,
    focus: number,
  ): void;
}
