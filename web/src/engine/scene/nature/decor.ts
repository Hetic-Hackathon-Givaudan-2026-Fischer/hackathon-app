// Détails du paysage : fleurs, rochers et nuages.
// L'ordre des tirages de `rand()` fixe la disposition : ne pas le changer.
import * as THREE from 'three';
import { matte } from './materials';
import { onMarket } from './placement';
import { jitter, pick, ringSpot, rng, type Random } from './random';

const FLOWER_COUNT = 90;
const PETAL_COLORS = [
  0xff6b6b, 0xffd166, 0xf1faee, 0xc77dff, 0x4cc9f0, 0xf72585,
] as const;

interface Flowers {
  stems: THREE.InstancedMesh;
  heads: THREE.InstancedMesh;
}

function flowerMeshes(): Flowers {
  const stemGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.22, 5);
  stemGeo.translate(0, 0.11, 0);
  const headGeo = new THREE.SphereGeometry(0.04, 7, 5);
  headGeo.translate(0, 0.24, 0);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f });
  const stems = new THREE.InstancedMesh(stemGeo, stemMat, FLOWER_COUNT);
  const headMat = new THREE.MeshStandardMaterial({ roughness: 0.45 });
  const heads = new THREE.InstancedMesh(headGeo, headMat, FLOWER_COUNT);
  return { stems, heads };
}

export function addFlowers(scene: THREE.Scene): void {
  const { stems, heads } = flowerMeshes();
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const rand = rng(7);
  let placed = 0;
  while (placed < FLOWER_COUNT) {
    const spot = ringSpot(rand, 27, 22);
    if (onMarket(spot.x, spot.z)) continue;
    dummy.position.set(spot.x, 0, spot.z);
    dummy.rotation.set(0, rand() * Math.PI, 0);
    dummy.scale.setScalar(0.85 + rand() * 0.5);
    dummy.updateMatrix();
    stems.setMatrixAt(placed, dummy.matrix);
    heads.setMatrixAt(placed, dummy.matrix);
    heads.setColorAt(placed, color.setHex(pick(PETAL_COLORS, placed)));
    placed += 1;
  }
  scene.add(stems, heads);
}

/** Rocher n° `index` : tous ses tirages ont lieu avant le test du magasin. */
function buildRock(
  rand: Random,
  mats: readonly THREE.Material[],
  index: number,
): THREE.Mesh {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.28 + rand() * 0.5, 0),
    pick(mats, index),
  );
  const spot = ringSpot(rand, 27, 24);
  rock.position.set(spot.x, 0.1 + rand() * 0.08, spot.z);
  rock.rotation.set(rand() * 2, rand() * 2, rand() * 2);
  rock.scale.set(1 + rand(), 0.45 + rand() * 0.55, 0.75 + rand());
  return rock;
}

export function addRocks(scene: THREE.Scene): void {
  const mats = [matte(0x8d93a0, 0.95), matte(0x6d717a, 0.92)];
  const rand = rng(21);
  for (let i = 0; i < 20; i += 1) {
    const rock = buildRock(rand, mats, i);
    if (onMarket(rock.position.x, rock.position.z)) continue;
    scene.add(rock);
  }
}

/** Nuage : trois bouffées aplaties, puis sa place dans le ciel. */
function buildCloud(rand: Random, mat: THREE.Material): THREE.Group {
  const cloud = new THREE.Group();
  for (let k = 0; k < 3; k += 1) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(1.1 + rand() * 0.8, 8, 6),
      mat,
    );
    puff.position.set(jitter(rand, 3.2), rand() * 0.4, jitter(rand, 1.6));
    puff.scale.set(1.4, 0.55, 1);
    cloud.add(puff);
  }
  const spot = ringSpot(rand, 10, 40);
  cloud.position.set(spot.x, 16 + rand() * 8, spot.z);
  return cloud;
}

export function addClouds(scene: THREE.Scene): void {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf8fbff,
    roughness: 1,
    transparent: true,
    opacity: 0.92,
  });
  const rand = rng(3);
  for (let i = 0; i < 8; i += 1) scene.add(buildCloud(rand, mat));
}
