// Enveloppe du bâtiment : dallage, parvis, murs, corniches, auvent, enseigne.
import * as THREE from 'three';
import { type BuildContext, type Vec3, addBlock } from './context';
import { addFacade } from './facade';
import {
  DEPTH,
  FACADE_SIGN,
  FLOOR_TOP,
  MID_Z,
  PLAZA,
  RISE,
  STORE,
  WALL_CENTER,
  WIDTH,
} from './layout';
import { addSideWall } from './sideWall';
import { stoneTexture } from './stone';
import { storeSignTexture } from './storeSign';

/** Largeur hors tout des murs nord et sud. */
const OUTER_WIDTH = WIDTH + STORE.wall * 2;
/** Dallage : déborde de 0,4 m sous les murs. */
const FLOOR_W = OUTER_WIDTH + 0.8;
const FLOOR_D = DEPTH + STORE.wall * 2 + 0.8;

/** Dallage intérieur en pierre. */
function addFloor(ctx: BuildContext): THREE.Mesh {
  const stone = stoneTexture(FLOOR_W / 0.82, FLOOR_D / 0.82);
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(FLOOR_W, 0.24, FLOOR_D),
    new THREE.MeshStandardMaterial({
      ...stone,
      bumpScale: 0.02,
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  floor.position.set(0, FLOOR_TOP - 0.12, MID_Z);
  ctx.group.add(floor);
  return floor;
}

/** Parvis devant la façade, dans la pierre du dallage. */
function addApron(ctx: BuildContext, floor: THREE.Mesh): void {
  const apronDepth = PLAZA - 0.35;
  const apronStart = MID_Z + FLOOR_D / 2 - 0.05;
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH + 2.4, 0.22, apronDepth),
    floor.material,
  );
  apron.position.set(0, FLOOR_TOP - 0.03 - 0.11, apronStart + apronDepth / 2);
  ctx.group.add(apron);
}

/** Bandeau de hauteur `h` à `y` sur les quatre murs (nord, ouest, est, sud). */
function addTrim(
  ctx: BuildContext,
  material: THREE.Material,
  [y, h, extra]: readonly [number, number, number],
): void {
  const { minX, maxX, minZ, maxZ, wall } = STORE;
  const across: Vec3 = [OUTER_WIDTH, h, wall + extra];
  const along: Vec3 = [wall + extra, h, DEPTH];
  const pieces: ReadonlyArray<readonly [Vec3, Vec3]> = [
    [across, [0, y, minZ - wall / 2]],
    [along, [minX - wall / 2, y, MID_Z]],
    [along, [maxX + wall / 2, y, MID_Z]],
    [across, [0, y, maxZ + wall / 2]],
  ];
  pieces.forEach(([size, position]) => addBlock(ctx, material, size, position));
}

/** Auvent au-dessus de l'entrée, souligné d'un liseré. */
function addCanopy(ctx: BuildContext): void {
  const { metalDark, mauve } = ctx.materials;
  const { height, maxZ } = STORE;
  addBlock(
    ctx,
    metalDark,
    [WIDTH + 0.8, 0.1, 2.7],
    [0, height - 0.32, maxZ + 1.4],
  );
  addBlock(
    ctx,
    mauve,
    [WIDTH + 0.84, 0.028, 0.08],
    [0, height - 0.39, maxZ + 2.72],
  );
}

/** Face imprimée de l'enseigne. */
function signFace(z: number): THREE.Mesh {
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(FACADE_SIGN.width, FACADE_SIGN.height),
    new THREE.MeshStandardMaterial({
      map: storeSignTexture(),
      roughness: 0.62,
      metalness: 0.02,
    }),
  );
  face.position.set(0, FACADE_SIGN.y, z);
  return face;
}

/** Enseigne de façade sur sa platine. */
function addFacadeSign(ctx: BuildContext): void {
  const signZ = STORE.maxZ + STORE.wall + 0.05;
  const plateSize: Vec3 = [
    FACADE_SIGN.width + 0.14,
    FACADE_SIGN.height + 0.14,
    0.05,
  ];
  addBlock(ctx, ctx.materials.metalDark, plateSize, [
    0,
    FACADE_SIGN.y,
    signZ - 0.035,
  ]);
  ctx.group.add(signFace(signZ));
}

export function addShell(ctx: BuildContext): void {
  const { minX, maxX, minZ, wall, height } = STORE;
  const { wall: wallMat, metalDark, mauve } = ctx.materials;
  addApron(ctx, addFloor(ctx));
  addBlock(
    ctx,
    wallMat,
    [OUTER_WIDTH, RISE, wall],
    [0, WALL_CENTER, minZ - wall / 2],
    true,
  );
  addSideWall(ctx, minX - wall / 2);
  addSideWall(ctx, maxX + wall / 2);
  addFacade(ctx);
  addTrim(ctx, metalDark, [height - 0.08, 0.16, 0.02]);
  addTrim(ctx, mauve, [height - 0.22, 0.02, 0.05]);
  addCanopy(ctx);
  addFacadeSign(ctx);
}
