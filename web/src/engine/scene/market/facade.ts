// Façade sud : pans de mur, linteau et portes coulissantes vitrées.
import * as THREE from 'three';
import { type BuildContext, addBlock } from './context';
import type { DoorLeaf } from './doors';
import {
  FLOOR_TOP,
  OPENINGS,
  type Opening,
  RISE,
  STORE,
  WALL_CENTER,
} from './layout';
import { standardMaterial } from './materials';

const FACADE_Z = STORE.maxZ + STORE.wall / 2;
const LINTEL_H = STORE.height - 2.55;
const PANES = 8;
const LEFT_PANES = Math.floor(PANES / 2);
const JAMB = [0.045, 2.42, 0.06] as const;

/** Pans pleins entre les ouvertures, de l'ouest à l'est. */
function facadeSpans(): Array<readonly [number, number]> {
  const spans: Array<readonly [number, number]> = [];
  let cursor: number = STORE.minX;
  for (const opening of OPENINGS) {
    if (opening.x0 > cursor + 0.05) spans.push([cursor, opening.x0]);
    cursor = opening.x1;
  }
  if (STORE.maxX > cursor + 0.05) spans.push([cursor, STORE.maxX]);
  return spans;
}

/** Vitre et montant d'un vantail, dans un groupe qui coulisse en X. */
function leafGroup(
  ctx: BuildContext,
  slice: number,
  paneZ: number,
  glass: THREE.Material,
): THREE.Group {
  const leaf = new THREE.Group();
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(slice - 0.08, 2.22),
    glass,
  );
  pane.position.set(0, 1.18, paneZ);
  const jamb = new THREE.Mesh(
    new THREE.BoxGeometry(...JAMB),
    ctx.materials.metalDark,
  );
  jamb.position.set(-slice / 2, 1.2, paneZ + 0.015);
  leaf.add(pane, jamb);
  return leaf;
}

/** Vantail `i` : moitié gauche vers l'ouest, droite vers l'est, en gradins. */
function addLeaf(
  ctx: BuildContext,
  opening: Opening,
  glass: THREE.Material,
  i: number,
): DoorLeaf {
  const slice = (opening.x1 - opening.x0) / PANES;
  const side = i < LEFT_PANES ? -1 : 1;
  const local = side < 0 ? i : PANES - 1 - i;
  const closedX = opening.x0 + (i + 0.5) * slice;
  const leaf = leafGroup(ctx, slice, STORE.maxZ + 0.02 + local * 0.012, glass);
  leaf.position.x = closedX;
  ctx.group.add(leaf);
  const half = slice / 2;
  const block = {
    minX: closedX - half,
    maxX: closedX + half,
    minZ: STORE.maxZ - 0.02,
    maxZ: STORE.maxZ + STORE.wall,
  };
  ctx.colliders.push(block);
  return { leaf, closedX, travel: side * local * slice * 0.97, half, block };
}

/** Montant final, traverse haute et tapis d'entrée. */
function addDoorFrame(
  ctx: BuildContext,
  opening: Opening,
  w: number,
  cx: number,
): void {
  const { metalDark } = ctx.materials;
  addBlock(ctx, metalDark, JAMB, [opening.x1, 1.2, STORE.maxZ + 0.045]);
  addBlock(ctx, metalDark, [w, 0.05, 0.06], [cx, 2.48, STORE.maxZ + 0.045]);
  addBlock(
    ctx,
    standardMaterial(0x0b1215, 0.84),
    [w - 0.6, 0.012, 1.45],
    [cx, FLOOR_TOP + 0.014, STORE.maxZ - 1.2],
  );
}

function addOpening(
  ctx: BuildContext,
  opening: Opening,
  glass: THREE.Material,
): void {
  const w = opening.x1 - opening.x0;
  const cx = (opening.x0 + opening.x1) / 2;
  addBlock(
    ctx,
    ctx.materials.wall,
    [w, LINTEL_H, STORE.wall],
    [cx, 2.55 + LINTEL_H / 2, FACADE_Z],
  );
  const leaves = Array.from({ length: PANES }, (_, i) =>
    addLeaf(ctx, opening, glass, i),
  );
  addDoorFrame(ctx, opening, w, cx);
  ctx.doors.push({
    x0: opening.x0,
    x1: opening.x1,
    z: STORE.maxZ + 0.04,
    leaves,
    open: 0,
  });
}

export function addFacade(ctx: BuildContext): void {
  facadeSpans().forEach(([a, b]) =>
    addBlock(
      ctx,
      ctx.materials.wall,
      [b - a, RISE, STORE.wall],
      [(a + b) / 2, WALL_CENTER, FACADE_Z],
      true,
    ),
  );
  const doorGlass = new THREE.MeshStandardMaterial({
    color: 0xe7e2d8,
    transparent: true,
    opacity: 0.28,
    roughness: 0.08,
    metalness: 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  OPENINGS.forEach((opening) => addOpening(ctx, opening, doorGlass));
}
