// Affiches photo encadrées : murs latéraux, fond du magasin, entrée.
import * as THREE from 'three';
import type { BuildContext, Vec3 } from './context';
import { GONDOLA_LEN, STORE, at } from './layout';
import type { Plan } from './plan';
import { standardMaterial } from './materials';
import { cached } from '../shared/cache';

/** Affiche à poser : largeur, rapport hauteur / largeur, pose. */
interface PosterSpec {
  src: string;
  w: number;
  ratio: number;
  x: number;
  y: number;
  z: number;
  rotY: number;
}

/** Plan unité partagé (affiches, slogan), mis à l'échelle par maillage. */
export const unitPlane = new THREE.PlaneGeometry(1, 1);
const posterLoader = new THREE.TextureLoader();
const posterMaterials = new Map<string, THREE.MeshStandardMaterial>();
const posterFrame = standardMaterial(0x3a4146, 0.55, 0.08);

/** Colonnes utiles [début, fin] des images 1024 px recadrées en largeur. */
const POSTER_CROP: Readonly<Record<string, readonly [number, number]>> = {
  '/posters/herbs.webp': [94, 921],
  '/posters/fruits.webp': [88, 935],
  '/posters/citrus.webp': [92, 935],
  '/posters/vegetables.webp': [95, 1023],
  '/posters/rosemary.webp': [92, 943],
  '/posters/guarana.webp': [91, 932],
};

/** Rapport hauteur / largeur d'une affiche recadrée (396 px de haut). */
function croppedRatio(src: string): number {
  const crop = POSTER_CROP[src];
  if (!crop) throw new Error(`Affiche sans recadrage : ${src}`);
  return 396 / (crop[1] + 1 - crop[0]);
}

function posterMap(src: string): THREE.Texture {
  const map = posterLoader.load(src);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.generateMipmaps = true;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  const crop = POSTER_CROP[src];
  if (crop) {
    map.offset.set(crop[0] / 1024, 0);
    map.repeat.set((crop[1] + 1 - crop[0]) / 1024, 1);
  }
  return map;
}

function posterMaterial(src: string): THREE.MeshStandardMaterial {
  return cached(
    posterMaterials,
    src,
    () =>
      new THREE.MeshStandardMaterial({
        map: posterMap(src),
        roughness: 0.92,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -2,
      }),
  );
}

function addPoster(ctx: BuildContext, spec: PosterSpec): void {
  const height = spec.w * spec.ratio;
  const board = new THREE.Group();
  const frame = new THREE.Mesh(unitPlane, posterFrame);
  const pad = 0.05;
  frame.scale.set(spec.w + pad * 2, height + pad * 2, 1);
  const photo = new THREE.Mesh(unitPlane, posterMaterial(spec.src));
  photo.scale.set(spec.w, height, 1);
  photo.position.z = 0.012;
  board.add(frame, photo);
  board.position.set(spec.x, spec.y, spec.z);
  board.rotation.y = spec.rotY;
  ctx.group.add(board);
}

function poster(
  src: string,
  w: number,
  ratio: number,
  [x, y, z]: Vec3,
  rotY: number,
): PosterSpec {
  return { src, w, ratio, x, y, z, rotY };
}

/** Affiche recadrée, sa hauteur tirée de l'image. */
function cropped(
  src: string,
  w: number,
  position: Vec3,
  rotY: number,
): PosterSpec {
  return poster(src, w, croppedRatio(src), position, rotY);
}

/** Sas d'entrée, entre les dernières gondoles et la façade. */
function entranceSpan(plan: Plan): { z: number; span: number } {
  const south = plan.lastRunZ + GONDOLA_LEN / 2 + 0.45;
  const north = STORE.maxZ - 0.4;
  return { z: (south + north) / 2, span: north - south };
}

/** Visuel d'ambiance de l'entrée, en 1920 × 1280. */
const FEEL_RATIO = 1280 / 1920;

/** Grands visuels de part et d'autre du sas d'entrée. */
function entrancePosters(
  plan: Plan,
  left: number,
  right: number,
): PosterSpec[] {
  const { z, span } = entranceSpan(plan);
  const feelW = span - 0.2;
  const feelH = feelW * FEEL_RATIO;
  const square = Math.min(span - 0.7, 5.05);
  return [
    poster(
      '/posters/entrance-feel.webp',
      feelW,
      FEEL_RATIO,
      [left, 0.48 + feelH / 2, z],
      Math.PI / 2,
    ),
    poster(
      '/posters/entrance-natural.webp',
      square,
      1,
      [right, 0.48 + square / 2, z],
      -Math.PI / 2,
    ),
  ];
}

export function addMural(ctx: BuildContext): void {
  const { plan } = ctx;
  const left = STORE.minX + 0.06;
  const right = STORE.maxX - 0.06;
  const zOpen = (at(plan.runZ, at(plan.wallGaps, 0)) + plan.crossZ) / 2;
  const posters = [
    cropped('/posters/fruits.webp', 2.7, [left, 1.55, zOpen], Math.PI / 2),
    cropped(
      '/posters/vegetables.webp',
      2.7,
      [right, 1.55, zOpen],
      -Math.PI / 2,
    ),
    cropped('/posters/guarana.webp', 5.4, [0, 4.45, STORE.minZ + 0.06], 0),
    ...entrancePosters(plan, left, right),
  ];
  posters.forEach((spec) => addPoster(ctx, spec));
}
