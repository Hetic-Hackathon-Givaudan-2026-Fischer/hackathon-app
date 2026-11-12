// Mobilier stocké : gabarits clonés, posés dans les allées et au mur frais.
import * as THREE from 'three';
import type { BoxCollider, Category, ShelfKind } from '../../types';
import { type BuildContext, addBlock } from './context';
import { createFridge } from './fridge';
import { type Cap, type GondolaSpec, createGondola } from './gondola';
import { type ShelfLine, bayPresent, categoryIndex } from './plan';
import { aisleSignTexture } from './textures';
import { cached } from '../shared/cache';

/** Emplacement d'un meuble dans le magasin. */
interface BaySlot {
  category: Category;
  x: number;
  z: number;
  rotation: number;
}

const sectionSignGeo = new THREE.BoxGeometry(1.72, 0.46, 0.04);
const signMaterials = new Map<string, THREE.MeshStandardMaterial>();

function categorySignMaterial(category: Category): THREE.MeshStandardMaterial {
  return cached(
    signMaterials,
    category.id,
    () =>
      new THREE.MeshStandardMaterial({
        map: aisleSignTexture(category.name, categoryIndex(category)),
        roughness: 0.5,
      }),
  );
}

function cloneMaterial(
  material: THREE.Material | THREE.Material[],
): THREE.Material | THREE.Material[] {
  return Array.isArray(material)
    ? material.map((item) => item.clone())
    : material.clone();
}

/** Produit vedette : matériaux propres (il pulse seul) et pose de repos. */
function registerSpotlight(ctx: BuildContext, item: THREE.Object3D): void {
  item.traverse((node) => {
    if (node instanceof THREE.Mesh)
      node.material = cloneMaterial(node.material);
    else if (node instanceof THREE.Sprite)
      node.material = node.material.clone();
  });
  item.userData.base = item.position.clone();
  item.userData.baseRotY = item.rotation.y;
  item.userData.phase = ctx.spotlights.length * 1.37;
  ctx.spotlights.push(item);
}

/** Recense vedettes et maillages visables (rubrique héritée du parent). */
function registerChild(ctx: BuildContext, child: THREE.Object3D): void {
  if (child.userData.spotlight) registerSpotlight(ctx, child);
  if (!(child instanceof THREE.Mesh) || child.userData.halo) return;
  const inherited: unknown = child.parent?.userData.category;
  if (!child.userData.category && inherited)
    child.userData.category = inherited;
  if (child.userData.category) ctx.productMeshes.push(child);
}

/** Clone le gabarit `key` (construit au premier besoin) et l'enregistre. */
function stockedBay(
  ctx: BuildContext,
  cache: Map<string, THREE.Group>,
  key: string,
  build: () => THREE.Group,
): THREE.Group {
  const bay = cached(cache, key, build).clone(true);
  bay.traverse((child) => registerChild(ctx, child));
  return bay;
}

function bayCollider(
  { x, z, rotation }: BaySlot,
  kind: ShelfKind,
): BoxCollider {
  if (kind === 'fridge') {
    return { minX: x - 1.52, maxX: x + 1.52, minZ: z - 0.45, maxZ: z + 0.47 };
  }
  const [halfX, halfZ] = Math.abs(rotation) < 0.2 ? [1.52, 0.45] : [0.45, 1.52];
  return { minX: x - halfX, maxX: x + halfX, minZ: z - halfZ, maxZ: z + halfZ };
}

/** Pose le meuble ; les frigos portent l'enseigne de leur rubrique. */
function placeBay(
  ctx: BuildContext,
  bay: THREE.Group,
  slot: BaySlot,
  kind: ShelfKind,
): void {
  bay.position.set(slot.x, 0.1, slot.z);
  bay.rotation.y = slot.rotation;
  if (kind === 'fridge') {
    const sign = new THREE.Mesh(
      sectionSignGeo,
      categorySignMaterial(slot.category),
    );
    sign.position.set(0, 2.52, 0.34);
    bay.add(sign);
  }
  ctx.group.add(bay);
  ctx.colliders.push(bayCollider(slot, kind));
}

/** Têtes de gondole aux bouts libres d'une file, et rayon vedette au sud. */
function gondolaSpec(
  ctx: BuildContext,
  line: ShelfLine,
  lineIndex: number,
  index: number,
): GondolaSpec {
  const { plan } = ctx;
  const [north, south]: readonly [Cap, Cap] = line.rot > 0 ? [1, -1] : [-1, 1];
  const last = plan.runZ.length - 1;
  const openNorth = index === 0 || !bayPresent(plan, lineIndex, index - 1);
  const openSouth = index === last || !bayPresent(plan, lineIndex, index + 1);
  return {
    category: line.category,
    capNorth: openNorth ? north : 0,
    capSouth: openSouth ? south : 0,
    hero: index === last,
  };
}

export function addAisles(ctx: BuildContext): void {
  const cache = new Map<string, THREE.Group>();
  ctx.plan.lines.forEach((line, lineIndex) => {
    ctx.plan.runZ.forEach((z, index) => {
      if (!bayPresent(ctx.plan, lineIndex, index)) return;
      const spec = gondolaSpec(ctx, line, lineIndex, index);
      const key = `${spec.category.id}:${spec.capNorth}:${spec.capSouth}:${spec.hero ? 1 : 0}`;
      const bay = stockedBay(ctx, cache, key, () =>
        createGondola(spec, ctx.materials),
      );
      placeBay(
        ctx,
        bay,
        { category: line.category, x: line.x, z, rotation: line.rot },
        'gondola',
      );
    });
  });
}

/** Meneau entre deux frigos voisins. */
function addMullion(ctx: BuildContext, x: number): void {
  addBlock(
    ctx,
    ctx.materials.metalDark,
    [0.08, 2.14, 0.16],
    [x, 1.17, ctx.plan.fridgeZ],
  );
}

/** Frigos alignés au fond, séparés par des meneaux. */
export function addColdWall(ctx: BuildContext): void {
  const cache = new Map<string, THREE.Group>();
  const { fridges, fridgeZ } = ctx.plan;
  fridges.forEach((slot, index) => {
    const hero = index % 2 === 0;
    const key = `${slot.category.id}:${hero ? 1 : 0}`;
    const bay = stockedBay(ctx, cache, key, () =>
      createFridge(slot.category, ctx.materials, hero),
    );
    const place = {
      category: slot.category,
      x: slot.x,
      z: fridgeZ,
      rotation: 0,
    };
    placeBay(ctx, bay, place, 'fridge');
    const next = fridges[index + 1];
    if (next) addMullion(ctx, (slot.x + next.x) / 2);
  });
}
