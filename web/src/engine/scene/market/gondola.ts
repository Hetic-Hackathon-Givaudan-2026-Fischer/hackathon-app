// Gondole : fond en toile, montants, trois étagères et têtes de gondole.
import * as THREE from 'three';
import { menuColor } from '../../../brand';
import type { Category } from '../../types';
import { type ShelfLevel } from '../products';
import { type BayBuild, box } from './context';
import { GONDOLA_DEPTH, GONDOLA_LEN } from './layout';
import { type MarketMaterials, ledWarm } from './materials';
import { categoryIndex } from './plan';
import { endCapTexture } from './textures';
import { cached } from '../shared/cache';

/** Côté d'une tête de gondole (0 : pas de tête). */
export type Cap = -1 | 0 | 1;

export interface GondolaSpec {
  category: Category;
  capNorth: Cap;
  capSouth: Cap;
  /** Rayon vedette : un produit mis en avant sur la 2e étagère. */
  hero: boolean;
}

const W = GONDOLA_LEN;
const D = GONDOLA_DEPTH;
const H = 2.08;
const SHELF_YS = [0.72, 1.18, 1.64] as const;
const FEATURE_SHELF = 1;

const endCapMaterials = new Map<number, THREE.MeshStandardMaterial>();
const accentMaterials = new Map<string, THREE.MeshStandardMaterial>();

function accentMaterial(color: string): THREE.MeshStandardMaterial {
  return cached(
    accentMaterials,
    color,
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.46,
        metalness: 0.16,
      }),
  );
}

/** Tête de gondole sur le flanc `side` (±1). */
function endCap(name: string, index: number, side: Cap): THREE.Mesh {
  const map = endCapTexture(name, index);
  const material = cached(
    endCapMaterials,
    index,
    () => new THREE.MeshStandardMaterial({ map, roughness: 0.72 }),
  );
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.28), material);
  plate.position.set(side * 1.52, 1.12, 0.02);
  plate.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
  return plate;
}

/** Fond, montants, liseré de rubrique et chapeau. */
function gondolaFrame(
  materials: MarketMaterials,
  accent: string,
): THREE.Mesh[] {
  const { metal, pegboard } = materials;
  const back = box(pegboard, [W - 0.04, H, 0.04], [0, H / 2, -D / 2 + 0.02]);
  const left = box(metal, [0.05, H, D - 0.05], [-W / 2 + 0.025, H / 2, 0.02]);
  const right = left.clone();
  right.position.set(W / 2 - 0.025, H / 2, 0.02);
  const stripe = box(accentMaterial(accent), [W, 0.03, 0.02], [0, 0.66, D / 2]);
  const top = box(metal, [W - 0.08, 0.04, D - 0.05], [0, H, 0.015]);
  return [back, left, right, stripe, top];
}

/** Hauteur, largeur et profondeur utiles de chaque tablette. */
export function gondolaLevels(hero: boolean): ShelfLevel[] {
  return SHELF_YS.map((y, shelf) => ({
    y: y + 0.014,
    width: W - 0.12,
    depth: D,
    feature: hero && shelf === FEATURE_SHELF,
  }));
}

/** Tablette, bord et réglette LED. Les produits sont posés ensuite. */
function addShelf(build: BayBuild, y: number): void {
  const { bay, materials } = build;
  bay.add(
    box(materials.whiteShelf, [W - 0.08, 0.028, D - 0.06], [0, y, 0.01]),
    box(materials.metal, [W - 0.1, 0.022, 0.028], [0, y - 0.018, D / 2 - 0.03]),
    box(ledWarm, [W - 0.22, 0.008, 0.018], [0, y + 0.02, -0.05]),
  );
}

/** Gabarit de gondole, sans les produits (posés quand les arômes sont connus). */
export function createGondola(
  spec: GondolaSpec,
  materials: MarketMaterials,
): THREE.Group {
  const { category } = spec;
  const index = categoryIndex(category);
  const build: BayBuild = { bay: new THREE.Group(), category, materials };
  build.bay.add(...gondolaFrame(materials, menuColor(index)));
  if (spec.capNorth) build.bay.add(endCap(category.name, index, spec.capNorth));
  if (spec.capSouth) build.bay.add(endCap(category.name, index, spec.capSouth));
  SHELF_YS.forEach((y) => addShelf(build, y));
  return build.bay;
}
