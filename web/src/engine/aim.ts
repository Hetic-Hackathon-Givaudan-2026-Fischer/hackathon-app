// Visée au centre de l'écran : produit touché par le rayon, sinon le plus
// proche de l'axe de visée (tolérance pour les petits objets).
import * as THREE from 'three';
import { SCAN_RANGE } from './scene/scanner';
import type { Category } from './types';

/** Marge latérale autour d'un produit, en mètres. */
const AIM_SLACK = 0.22;
/** Ignore ce qui est collé à la caméra. */
const MIN_ALONG = 0.3;
const MIN_DISTANCE = 0.2;
/** Fenêtre (m) où chercher la surface visée par le faisceau. */
const SURFACE_NEAR = 0.2;
const SURFACE_FAR = 8;
const FALLBACK_DISTANCE = 3;

export interface AimHit {
  object: THREE.Object3D;
  distance: number;
}

export interface Aim {
  /** Produit visé, ou null. */
  target(): AimHit | null;
  /** Point d'impact du faisceau sur `root` (le magasin). */
  surfacePoint(root: THREE.Object3D): THREE.Vector3;
}

const center = new THREE.Vector3();
const toCenter = new THREE.Vector3();
const worldScale = new THREE.Vector3();

function boundingSphere(mesh: THREE.Mesh): THREE.Sphere | null {
  if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
  return mesh.geometry.boundingSphere;
}

/** Écart latéral (au carré) et distance d'un produit à l'axe, s'il est visable. */
function probe(mesh: THREE.Mesh, origin: THREE.Vector3, dir: THREE.Vector3) {
  const sphere = boundingSphere(mesh);
  if (!sphere) return null;
  center.copy(sphere.center).applyMatrix4(mesh.matrixWorld);
  toCenter.copy(center).sub(origin);
  const along = toCenter.dot(dir);
  const radius = sphere.radius * Math.abs(mesh.getWorldScale(worldScale).x);
  const front = along - radius;
  if (along < MIN_ALONG || front > SCAN_RANGE) return null;
  const lateralSq = Math.max(0, toCenter.lengthSq() - along * along);
  const reach = radius + AIM_SLACK;
  if (lateralSq > reach * reach) return null;
  return { lateralSq, distance: Math.max(front, MIN_DISTANCE) };
}

function nearestInFront(
  meshes: readonly THREE.Mesh[],
  origin: THREE.Vector3,
  dir: THREE.Vector3,
): AimHit | null {
  let best: AimHit | null = null;
  let bestLateral = Infinity;
  for (const mesh of meshes) {
    const candidate = probe(mesh, origin, dir);
    if (!candidate || candidate.lateralSq >= bestLateral) continue;
    bestLateral = candidate.lateralSq;
    best = { object: mesh, distance: candidate.distance };
  }
  return best;
}

export function createAim(
  camera: THREE.Camera,
  productMeshes: THREE.Mesh[],
): Aim {
  const raycaster = new THREE.Raycaster();
  const screenCenter = new THREE.Vector2(0, 0);
  const fallback = new THREE.Vector3();
  const target = (): AimHit | null => {
    if (!productMeshes.length) return null;
    raycaster.setFromCamera(screenCenter, camera);
    const [hit] = raycaster.intersectObjects(productMeshes, false);
    const { direction } = raycaster.ray;
    return hit ?? nearestInFront(productMeshes, camera.position, direction);
  };
  const surfacePoint = (root: THREE.Object3D) => {
    const surface = raycaster
      .intersectObject(root, true)
      .find(
        (item) => item.distance > SURFACE_NEAR && item.distance < SURFACE_FAR,
      );
    return surface
      ? surface.point
      : raycaster.ray.at(FALLBACK_DISTANCE, fallback);
  };
  return { target, surfacePoint };
}

function carried<T>(
  object: THREE.Object3D | null,
  read: (data: THREE.Object3D['userData']) => T | null,
): T | null {
  for (let node = object; node; node = node.parent) {
    const value = read(node.userData);
    if (value !== null) return value;
  }
  return null;
}

/** Rubrique portée par l'objet ou l'un de ses parents. */
export function categoryOf(object: THREE.Object3D | null): Category | null {
  return carried(object, (data) => {
    const category = data.category as Category | undefined;
    return category ?? null;
  });
}

/** Arôme porté par le produit visé, ou null. */
export function trendIdOf(object: THREE.Object3D | null): string | null {
  return carried(object, (data) =>
    typeof data.trendId === 'string' ? data.trendId : null,
  );
}

/** Vrai si quelque chose est visé à portée de scan. */
export function inRange(hit: AimHit | null): hit is AimHit {
  return hit !== null && hit.distance <= SCAN_RANGE;
}

/** Vrai si le coup touche un produit lié à un arôme, à portée de scan. */
export function scannable(hit: AimHit | null): boolean {
  return (
    inRange(hit) &&
    categoryOf(hit.object) !== null &&
    trendIdOf(hit.object) !== null
  );
}
