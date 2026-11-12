// Touffes d'herbe instanciées autour du magasin.
// L'ordre des tirages de `rand()` fixe la disposition : ne pas le changer.
import * as THREE from 'three';
import { onMarket } from './placement';
import { jitter, ringSpot, rng, type Random, type Spot } from './random';

const BLADE_COUNT = 14000;
const MAX_CLUMPS = 9000;

/** Brin : trapèze effilé en trois triangles, plus clair vers la pointe. */
function bladeGeometry(): THREE.BufferGeometry {
  const w0 = 0.013;
  const w1 = 0.008;
  const h = 0.2;
  const geo = new THREE.BufferGeometry();
  const positions = [
    [-w0, 0, 0],
    [w0, 0, 0],
    [-w1, h * 0.46, 0.01],
    [w1, h * 0.46, 0.01],
    [0, h, 0.034],
  ].flat();
  const colors = [
    [0.55, 0.62, 0.42],
    [0.55, 0.62, 0.42],
    [0.82, 0.9, 0.62],
    [0.82, 0.9, 0.62],
    [1, 1, 0.78],
  ].flat();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3]);
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Ce qu'il faut pour planter des brins dans le maillage instancié. */
interface Planter {
  mesh: THREE.InstancedMesh;
  rand: Random;
  dummy: THREE.Object3D;
  color: THREE.Color;
}

function grassMesh(): THREE.InstancedMesh {
  const geometry = bladeGeometry();
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.92,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, BLADE_COUNT);
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  return mesh;
}

/** Centre de touffe : moitié devant l'entrée, moitié sur un anneau. */
function clumpCenter(rand: Random): Spot {
  if (rand() < 0.5) {
    return { x: (rand() * 2 - 1) * 36, z: 18.5 + rand() * 16 };
  }
  return ringSpot(rand, 28, 24);
}

/** Quelques brins jaunis, les autres autour de la teinte de la touffe. */
function bladeColor(
  rand: Random,
  hue: number,
  color: THREE.Color,
): THREE.Color {
  if (rand() < 0.04) return color.setHSL(0.18, 0.4, 0.28);
  return color.setHSL(
    hue + jitter(rand, 0.02),
    0.55 + rand() * 0.25,
    0.2 + rand() * 0.08,
  );
}

/** Pose le brin n° `slot` ; faux s'il tombe sur le magasin. */
function plantBlade(
  planter: Planter,
  center: Spot,
  hue: number,
  slot: number,
): boolean {
  const { mesh, rand, dummy, color } = planter;
  const x = center.x + jitter(rand, 0.42);
  const z = center.z + jitter(rand, 0.42);
  if (onMarket(x, z)) return false;
  dummy.position.set(x, 0, z);
  dummy.rotation.set(
    jitter(rand, 0.35),
    rand() * Math.PI * 2,
    jitter(rand, 0.28),
  );
  const tall = rand() < 0.04 ? 0.95 + rand() * 0.35 : 0.22 + rand() * 0.4;
  dummy.scale.set(0.75 + rand() * 0.55, tall, 1);
  dummy.updateMatrix();
  mesh.setMatrixAt(slot, dummy.matrix);
  mesh.setColorAt(slot, bladeColor(rand, hue, color));
  return true;
}

/** Plante une touffe de 7 à 14 brins ; rend le nouveau nombre de brins posés. */
function plantClump(planter: Planter, center: Spot, placed: number): number {
  const { rand } = planter;
  const clump = 7 + Math.floor(rand() * 8);
  const hue = 0.26 + rand() * 0.06;
  let count = placed;
  for (let k = 0; k < clump && count < BLADE_COUNT; k += 1) {
    if (plantBlade(planter, center, hue, count)) count += 1;
  }
  return count;
}

export function addGrass(scene: THREE.Scene): void {
  const mesh = grassMesh();
  const planter: Planter = {
    mesh,
    rand: rng(99),
    dummy: new THREE.Object3D(),
    color: new THREE.Color(),
  };
  let placed = 0;
  for (let guard = 0; placed < BLADE_COUNT && guard < MAX_CLUMPS; guard += 1) {
    const center = clumpCenter(planter.rand);
    if (onMarket(center.x, center.z)) continue;
    placed = plantClump(planter, center, placed);
  }
  mesh.count = placed;
  scene.add(mesh);
}
