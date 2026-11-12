// Mise en rayon : modèles par variante, facings, fusion par matériau.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Category } from '../../types';
import { cached } from '../shared/cache';
import { categoryIdOf, variantOf } from './catalog';
import { markFeatured } from './featured';
import { BUILDERS } from './models';

const FACINGS = 4;
const PRODUCT_SCALE = 1.85;
const FEATURE_SLOT = 1;

/** Géométries d'un même matériau, à fusionner en un seul maillage. */
interface MaterialBucket {
  material: THREE.Material;
  geometries: THREE.BufferGeometry[];
}

const templates = new Map<string, THREE.Group>();

function templateFor(category: Category, variant: number): THREE.Group {
  const id = categoryIdOf(category);
  const { key, color, name } = variantOf(id, variant);
  return cached(templates, key, () => {
    const template = BUILDERS[id](color, name);
    template.userData.category = category;
    return template;
  });
}

function facing(category: Category, variant: number): THREE.Group {
  const item = templateFor(category, variant).clone(true);
  item.rotation.y = 0;
  item.scale.setScalar(PRODUCT_SCALE);
  item.userData.category = category;
  return item;
}

/**
 * Pose quatre produits sur une tablette. Les produits ordinaires vont dans
 * `bucket` (fusionnés plus tard) ; les vedettes sont rendues à part.
 */
export function fillShelf(
  bucket: THREE.Object3D[],
  category: Category,
  y: number,
  width: number,
  depth: number,
  feature = false,
): THREE.Object3D[] {
  const featured: THREE.Object3D[] = [];
  const gap = (width - 0.42) / (FACINGS - 1);
  for (let i = 0; i < FACINGS; i += 1) {
    const spotlight = feature && i === FEATURE_SLOT;
    const item = facing(category, spotlight ? 0 : i);
    item.position.set(-width / 2 + 0.21 + i * gap, y, depth / 2 - 0.14);
    if (spotlight) markFeatured(item);
    (spotlight ? featured : bucket).push(item);
  }
  return featured;
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

/** Fusionne les produits ordinaires en un maillage par matériau. */
export function commitProducts(
  parent: THREE.Object3D,
  category: Category,
  groups: THREE.Object3D[],
  productMeshes: THREE.Mesh[],
): void {
  const buckets = new Map<string, MaterialBucket>();
  const matrix = new THREE.Matrix4();
  for (const group of groups) bakeInto(buckets, group, matrix);
  for (const bucket of buckets.values()) {
    const merged = mergeBucket(bucket);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, bucket.material);
    mesh.userData.category = category;
    parent.add(mesh);
    productMeshes.push(mesh);
  }
}
