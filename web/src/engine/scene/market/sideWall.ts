// Murs latéraux : allège pleine, rangée de fenêtres hautes, retombée.
import * as THREE from 'three';
import { type BuildContext, type Vec3, addBlock, box } from './context';
import { DEPTH, MID_Z, SIDE_WINDOWS, STORE, WALL_BOTTOM } from './layout';
import { windowGlass } from './materials';

const WIN_H = SIDE_WINDOWS.head - SIDE_WINDOWS.sill;
const MID_Y = (SIDE_WINDOWS.sill + SIDE_WINDOWS.head) / 2;

const FRAME_DEPTH = STORE.wall + 0.06;
const BAR = 0.065;
const WIN_W = SIDE_WINDOWS.width;
/** Cadre et croisillon d'une fenêtre : [taille, position] en repère local. */
const WINDOW_BARS: ReadonlyArray<readonly [Vec3, Vec3]> = [
  [
    [FRAME_DEPTH, BAR, WIN_W + BAR],
    [0, WIN_H / 2, 0],
  ],
  [
    [FRAME_DEPTH, BAR, WIN_W + BAR],
    [0, -WIN_H / 2, 0],
  ],
  [
    [FRAME_DEPTH, WIN_H + BAR, BAR],
    [0, 0, -WIN_W / 2],
  ],
  [
    [FRAME_DEPTH, WIN_H + BAR, BAR],
    [0, 0, WIN_W / 2],
  ],
  [
    [FRAME_DEPTH * 0.62, WIN_H - BAR, 0.04],
    [0, 0, 0],
  ],
  [
    [FRAME_DEPTH * 0.62, 0.04, WIN_W - BAR],
    [0, 0, 0],
  ],
];

/** Fenêtre haute : cadre, croisillon et vitre, face à l'axe X. */
function addHighWindow(ctx: BuildContext, x: number, z: number): void {
  const win = new THREE.Group();
  WINDOW_BARS.forEach(([size, position]) =>
    win.add(box(ctx.materials.metalDark, size, position)),
  );
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(WIN_W - BAR, WIN_H - BAR),
    windowGlass,
  );
  glass.rotation.y = Math.PI / 2;
  win.add(glass);
  win.position.set(x, MID_Y, z);
  ctx.group.add(win);
}

/** Trumeau entre deux fenêtres, de `from` à `to` en Z. */
function addPier(ctx: BuildContext, x: number, from: number, to: number): void {
  addBlock(
    ctx,
    ctx.materials.wall,
    [STORE.wall, WIN_H, to - from],
    [x, MID_Y, (from + to) / 2],
  );
}

function addWindowRow(ctx: BuildContext, x: number): void {
  const { z0, z1, count, width } = SIDE_WINDOWS;
  const bay = (z1 - z0) / count;
  let cursor: number = STORE.minZ;
  for (let i = 0; i < count; i += 1) {
    const center = z0 + bay * (i + 0.5);
    addPier(ctx, x, cursor, center - width / 2);
    addHighWindow(ctx, x, center);
    cursor = center + width / 2;
  }
  addPier(ctx, x, cursor, STORE.maxZ);
}

/** Mur latéral centré en `x` ; seule l'allège arrête le joueur. */
export function addSideWall(ctx: BuildContext, x: number): void {
  const { sill, head } = SIDE_WINDOWS;
  const { wall, height } = STORE;
  const wallMat = ctx.materials.wall;
  const lowH = sill - WALL_BOTTOM;
  addBlock(
    ctx,
    wallMat,
    [wall, lowH, DEPTH],
    [x, WALL_BOTTOM + lowH / 2, MID_Z],
    true,
  );
  addBlock(
    ctx,
    wallMat,
    [wall, height - head, DEPTH],
    [x, head + (height - head) / 2, MID_Z],
  );
  addWindowRow(ctx, x);
}
