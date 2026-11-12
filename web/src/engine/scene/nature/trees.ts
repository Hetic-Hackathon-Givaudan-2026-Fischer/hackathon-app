// Végétation haute : feuillus, sapins et buissons autour du magasin.
// L'ordre des tirages de `rand()` fixe la disposition : ne pas le changer.
import * as THREE from 'three';
import { matte } from './materials';
import { onMarket } from './placement';
import { jitter, pick, ringSpot, rng, type Random, type Spot } from './random';

interface TreeMaterials {
  trunk: THREE.MeshStandardMaterial;
  bark: THREE.MeshStandardMaterial;
  foliage: readonly THREE.MeshStandardMaterial[];
}

function treeMaterials(): TreeMaterials {
  return {
    trunk: matte(0x5a3b2a, 0.92),
    bark: matte(0x3d2618, 0.9),
    foliage: [
      matte(0x2f6a2c, 0.82),
      matte(0x3f8a38, 0.82),
      matte(0x1f4d1c, 0.82),
      matte(0x4c9a40, 0.8),
    ],
  };
}

function addTrunk(
  tree: THREE.Group,
  rand: Random,
  h: number,
  mat: THREE.Material,
): void {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 + rand() * 0.08, 0.22 + rand() * 0.1, h, 6),
    mat,
  );
  trunk.position.y = h / 2;
  tree.add(trunk);
}

function addBranch(
  tree: THREE.Group,
  rand: Random,
  h: number,
  mat: THREE.Material,
): void {
  const branch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.055, 0.7 + rand() * 0.5, 5),
    mat,
  );
  branch.position.set(
    jitter(rand, 0.2),
    h * (0.45 + rand() * 0.35),
    jitter(rand, 0.2),
  );
  branch.rotation.z = jitter(rand, 1.1);
  branch.rotation.x = jitter(rand, 0.8);
  tree.add(branch);
}

function addCanopy(
  tree: THREE.Group,
  rand: Random,
  h: number,
  mat: THREE.Material,
): void {
  const foliage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.85 + rand() * 0.45, 0),
    mat,
  );
  foliage.position.set(
    jitter(rand, 1.1),
    h + 0.15 + rand() * 0.9,
    jitter(rand, 1.1),
  );
  foliage.scale.set(1 + rand() * 0.3, 0.9 + rand() * 0.4, 1 + rand() * 0.3);
  tree.add(foliage);
}

/** Feuillu n° `index` : tronc, deux branches, trois touffes. */
function buildTree(
  rand: Random,
  mats: TreeMaterials,
  index: number,
): THREE.Group {
  const tree = new THREE.Group();
  const h = 2.4 + rand() * 2.4;
  addTrunk(tree, rand, h, mats.trunk);
  for (let b = 0; b < 2; b += 1) addBranch(tree, rand, h, mats.bark);
  for (let f = 0; f < 3; f += 1) {
    addCanopy(tree, rand, h, pick(mats.foliage, index + f));
  }
  return tree;
}

/** Tire des places jusqu'à en trouver une hors du magasin, à 26 m ou plus. */
function treeSpot(rand: Random): Spot {
  let spot: Spot;
  do {
    spot = ringSpot(rand, 23, 38);
  } while (onMarket(spot.x, spot.z) || Math.hypot(spot.x, spot.z) < 26);
  return spot;
}

export function addTrees(scene: THREE.Scene): void {
  const mats = treeMaterials();
  const rand = rng(42);
  for (let i = 0; i < 36; i += 1) {
    const tree = buildTree(rand, mats, i);
    const spot = treeSpot(rand);
    tree.position.set(spot.x, 0, spot.z);
    tree.rotation.y = rand() * Math.PI;
    tree.scale.setScalar(0.8 + rand() * 0.7);
    scene.add(tree);
  }
}

/** Sapin : tronc et quatre cônes empilés (seule la hauteur est tirée). */
function buildPine(
  rand: Random,
  trunkMat: THREE.Material,
  needleMat: THREE.Material,
): THREE.Group {
  const pine = new THREE.Group();
  const h = 3.2 + rand() * 2.2;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.16, h, 6),
    trunkMat,
  );
  trunk.position.y = h / 2;
  pine.add(trunk);
  for (let l = 0; l < 4; l += 1) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.15 - l * 0.2, 1.2, 6),
      needleMat,
    );
    cone.position.y = 1.3 + l * 0.78;
    pine.add(cone);
  }
  return pine;
}

export function addPines(scene: THREE.Scene): void {
  const trunkMat = matte(0x4a3426, 0.9);
  const needleMat = matte(0x1e4d32, 0.78);
  const rand = rng(77);
  for (let i = 0; i < 16; i += 1) {
    const pine = buildPine(rand, trunkMat, needleMat);
    const spot = ringSpot(rand, 28, 32);
    if (onMarket(spot.x, spot.z)) continue;
    pine.position.set(spot.x, 0, spot.z);
    pine.scale.setScalar(0.85 + rand() * 0.5);
    scene.add(pine);
  }
}

/** Buisson : trois boules de feuillage en alternant les deux verts. */
function buildBush(rand: Random, mats: readonly THREE.Material[]): THREE.Group {
  const bush = new THREE.Group();
  for (let k = 0; k < 3; k += 1) {
    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.4 + rand() * 0.22, 0),
      pick(mats, k),
    );
    blob.position.set(
      jitter(rand, 0.5),
      0.28 + rand() * 0.2,
      jitter(rand, 0.5),
    );
    bush.add(blob);
  }
  return bush;
}

export function addBushes(scene: THREE.Scene): void {
  const mats = [matte(0x3a7d34, 0.85), matte(0x2d5e28, 0.85)];
  const rand = rng(19);
  for (let i = 0; i < 24; i += 1) {
    const bush = buildBush(rand, mats);
    const spot = ringSpot(rand, 27, 20);
    if (onMarket(spot.x, spot.z)) continue;
    bush.position.set(spot.x, 0, spot.z);
    scene.add(bush);
  }
}
