// Mise en rayon : un arôme par produit, facings, fusion par matériau.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Category, ShelfFlavor } from '../../types';
import { cached } from '../shared/cache';
import { categoryIdOf, variantOf } from './catalog';
import { markFeatured } from './featured';
import { BUILDERS } from './models';

export const FACINGS = 4;
const PRODUCT_SCALE = 1.85;
const FEATURE_SLOT = 1;
const PICK_LIFT = 0.22;

/** Une étagère à garnir, dans le repère du meuble. */
export interface ShelfLevel {
  y: number;
  width: number;
  depth: number;
  feature: boolean;
}

/** Géométries d'un même matériau, à fusionner en un seul maillage. */
interface MaterialBucket {
  material: THREE.Material;
  geometries: THREE.BufferGeometry[];
}

const templates = new Map<string, THREE.Group>();
const PICK_GEO = new THREE.BoxGeometry(0.48, 0.46, 0.36);
const PICK_MAT = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
  colorWrite: false,
});

function templateFor(
  category: Category,
  variant: number,
  flavor: ShelfFlavor,
): THREE.Group {
  const id = categoryIdOf(category);
  const { key, color, name } = variantOf(id, variant, flavor);
  return cached(templates, key, () => BUILDERS[id](color, name));
}

function facing(
  category: Category,
  variant: number,
  flavor: ShelfFlavor,
): THREE.Group {
  const item = templateFor(category, variant, flavor).clone(true);
  item.rotation.y = 0;
  item.scale.setScalar(PRODUCT_SCALE);
  return item;
}

function flavorAt(flavors: readonly ShelfFlavor[], index: number): ShelfFlavor {
  const flavor = flavors[index % flavors.length];
  if (!flavor) throw new Error('Aucun arôme à poser');
  return flavor;
}

/** Volume invisible visé par le scan : il porte l'arôme du produit. */
function createPick(
  position: THREE.Vector3,
  category: Category,
  flavor: ShelfFlavor,
): THREE.Mesh {
  const pick = new THREE.Mesh(PICK_GEO, PICK_MAT);
  pick.position.copy(position);
  pick.position.y += PICK_LIFT;
  pick.userData.stock = true;
  pick.userData.pick = true;
  pick.userData.category = category;
  pick.userData.trendId = flavor.id;
  return pick;
}

function bucketFor(
  buckets: Map<string, MaterialBucket>,
  material: THREE.Material,
): MaterialBucket {
  return cached(buckets, material.uuid, () => ({ material, geometries: [] }));
}

/** Range les géométries du groupe, passées en repère parent, par matériau. */
function bakeInto(
  buckets: Map<string, MaterialBucket>,
  group: THREE.Object3D,
  matrix: THREE.Matrix4,
): void {
  group.updateMatrix();
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (!(child.material instanceof THREE.Material)) return;
    child.updateMatrix();
    const geometry = child.geometry.clone();
    geometry.applyMatrix4(matrix.multiplyMatrices(group.matrix, child.matrix));
    bucketFor(buckets, child.material).geometries.push(geometry);
  });
}

/** Fusionne puis libère les copies (mergeGeometries rend null en cas d'échec). */
function mergeBucket(bucket: MaterialBucket): THREE.BufferGeometry | null {
  const merged = mergeGeometries(bucket.geometries, false);
  for (const geometry of bucket.geometries) geometry.dispose();
  return merged;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  const materials = Array.isArray(material) ? material : [material];
  for (const item of materials) item.dispose();
}

/** Libère ce qui n'est pas partagé (fusion, matériaux clonés des vedettes). */
function disposeStock(object: THREE.Object3D): void {
  object.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      if (node.userData.ownedGeometry) node.geometry.dispose();
      if (node.userData.ownedMaterial) disposeMaterial(node.material);
    } else if (node instanceof THREE.Sprite && node.userData.ownedMaterial) {
      node.material.dispose();
    }
  });
}

/** Retire les produits déjà posés sur le meuble. */
function clearStock(group: THREE.Group): void {
  const roots: THREE.Object3D[] = [];
  group.traverse((child) => {
    if (child.userData.stock && !child.parent?.userData.stock)
      roots.push(child);
  });
  for (const root of roots) {
    root.parent?.remove(root);
    disposeStock(root);
  }
}

/** Fusionne les produits ordinaires en un maillage par matériau. */
function commitProducts(
  parent: THREE.Object3D,
  groups: THREE.Object3D[],
): void {
  const buckets = new Map<string, MaterialBucket>();
  const matrix = new THREE.Matrix4();
  for (const group of groups) bakeInto(buckets, group, matrix);
  for (const bucket of buckets.values()) {
    const merged = mergeBucket(bucket);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, bucket.material);
    mesh.userData.stock = true;
    mesh.userData.ownedGeometry = true;
    parent.add(mesh);
  }
}

interface FlavorCursor {
  index: number;
}

/**
 * Pose quatre produits sur une étagère.
 * `best` : arôme le plus en tendance du meuble, mis au centre et en vedette.
 */
function fillShelf(
  bucket: THREE.Object3D[],
  picks: THREE.Object3D[],
  category: Category,
  flavors: readonly ShelfFlavor[],
  cursor: FlavorCursor,
  level: ShelfLevel,
  best: number | null,
): THREE.Object3D[] {
  const featured: THREE.Object3D[] = [];
  const { width, depth, y, feature } = level;
  const gap = (width - 0.42) / (FACINGS - 1);
  for (let i = 0; i < FACINGS; i += 1) {
    const spotlight = feature && i === FEATURE_SLOT;
    const rank = spotlight && best !== null ? best : cursor.index;
    if (!(spotlight && best !== null)) cursor.index += 1;
    const flavor = flavorAt(flavors, rank);
    const item = facing(category, spotlight ? 0 : i, flavor);
    item.position.set(-width / 2 + 0.21 + i * gap, y, depth / 2 - 0.14);
    if (spotlight) {
      markFeatured(item);
      item.userData.stock = true;
      featured.push(item);
    } else {
      bucket.push(item);
    }
    picks.push(createPick(item.position, category, flavor));
  }
  return featured;
}

/** Garnit le meuble avec les arômes de sa rubrique, à partir de `offset`. */
export function stockBay(
  bay: THREE.Group,
  category: Category,
  levels: readonly ShelfLevel[],
  flavors: readonly ShelfFlavor[],
  offset: number,
): void {
  clearStock(bay);
  if (flavors.length === 0) return;
  const featuredBay = levels.some((level) => level.feature);
  const cursor = { index: featuredBay ? offset + 1 : offset };
  const bucket: THREE.Object3D[] = [];
  const picks: THREE.Object3D[] = [];
  const heroes = levels.flatMap((level) =>
    fillShelf(
      bucket,
      picks,
      category,
      flavors,
      cursor,
      level,
      level.feature ? offset : null,
    ),
  );
  heroes.forEach((item) => bay.add(item));
  commitProducts(bay, bucket);
  picks.forEach((pick) => bay.add(pick));
}
