// Vitrine réfrigérée : caisson sombre, deux portes vitrées, quatre étagères.
import * as THREE from 'three';
import type { Category } from '../../types';
import { commitProducts, fillShelf } from '../products';
import { type BayBuild, box } from './context';
import {
  type MarketMaterials,
  fridgeGlass,
  ledCold,
  standardMaterial,
} from './materials';

const W = 2.95;
const D = 0.8;
const H = 2.14;
const DOOR_W = (W - 0.18) / 2;
const DOOR_H = H - 0.36;
/** Plan des portes, devant le caisson. */
const FRONT = D / 2 + 0.02;
const SHELF_YS = [0.34, 0.78, 1.22, 1.66] as const;
const FEATURE_SHELF = 2;

/** Dos, flancs, dessus, socle et paroi intérieure claire. */
function cabinet({ metalDark }: MarketMaterials): THREE.Mesh[] {
  const back = box(metalDark, [W, H, 0.06], [0, H / 2, -D / 2]);
  const sideL = box(
    metalDark,
    [0.07, H, D - 0.06],
    [-W / 2 + 0.035, H / 2, 0.01],
  );
  const sideR = sideL.clone();
  sideR.position.set(W / 2 - 0.035, H / 2, 0.01);
  const top = box(metalDark, [W - 0.04, 0.08, D - 0.06], [0, H - 0.04, 0.01]);
  const base = box(metalDark, [W - 0.2, 0.12, D - 0.14], [0, 0.09, 0.02]);
  const interior = box(
    standardMaterial(0xf6f3ec, 0.62),
    [W - 0.16, H - 0.3, 0.02],
    [0, H / 2, -D / 2 + 0.08],
  );
  return [back, sideL, sideR, top, base, interior];
}

/** Cadre d'une porte centrée en `cx` : deux montants, deux traverses. */
function doorFrame(cx: number, metalDark: THREE.Material): THREE.Mesh[] {
  const left = box(
    metalDark,
    [0.035, DOOR_H, 0.04],
    [cx - DOOR_W / 2 + 0.02, H / 2, FRONT],
  );
  const right = left.clone();
  right.position.set(cx + DOOR_W / 2 - 0.02, H / 2, FRONT);
  const upper = box(
    metalDark,
    [DOOR_W, 0.035, 0.04],
    [cx, H / 2 + DOOR_H / 2, FRONT],
  );
  const lower = upper.clone();
  lower.position.set(cx, H / 2 - DOOR_H / 2, FRONT);
  return [left, right, upper, lower];
}

/** Porte `i` (0 : gauche, 1 : droite) : vitre, cadre et poignée côté centre. */
function door(
  { metalDark, bumper }: MarketMaterials,
  i: number,
): THREE.Object3D[] {
  const cx = i === 0 ? -DOOR_W / 2 - 0.02 : DOOR_W / 2 + 0.02;
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W - 0.06, DOOR_H - 0.06),
    fridgeGlass,
  );
  glass.position.set(cx, H / 2 + 0.02, FRONT);
  const frame = doorFrame(cx, metalDark);
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8),
    bumper,
  );
  handle.position.set(cx + (i === 0 ? 0.52 : -0.52), H / 2, D / 2 + 0.05);
  return [glass, ...frame, handle];
}

/** Meneau central et barre de protection. */
function front({ metalDark, bumper }: MarketMaterials): THREE.Mesh[] {
  const mid = box(metalDark, [0.04, H - 0.28, 0.05], [0, H / 2, FRONT]);
  const rail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, W - 0.15, 12),
    bumper,
  );
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, 0.3, D / 2 + 0.07);
  return [mid, rail];
}

/** Tablette, réglette LED froide, puis les produits. */
function addShelf(build: BayBuild, y: number, feature: boolean): void {
  const { bay, materials } = build;
  bay.add(
    box(materials.whiteShelf, [W - 0.22, 0.02, D - 0.18], [0, y, 0]),
    box(ledCold, [W - 0.3, 0.006, 0.016], [0, y + 0.04, -D / 2 + 0.14]),
  );
  const heroes = fillShelf(
    build.stock,
    build.category,
    y + 0.012,
    W - 0.3,
    D - 0.1,
    feature,
  );
  heroes.forEach((item) => bay.add(item));
}

/** Gabarit de frigo ; `feature` met un produit en avant (3e étagère). */
export function createFridge(
  category: Category,
  materials: MarketMaterials,
  feature: boolean,
): THREE.Group {
  const build: BayBuild = {
    bay: new THREE.Group(),
    stock: [],
    category,
    materials,
  };
  build.bay.add(...cabinet(materials));
  for (let i = 0; i < 2; i += 1) build.bay.add(...door(materials, i));
  build.bay.add(...front(materials));
  SHELF_YS.forEach((y, shelf) =>
    addShelf(build, y, feature && shelf === FEATURE_SHELF),
  );
  commitProducts(build.bay, category, build.stock, []);
  return build.bay;
}
