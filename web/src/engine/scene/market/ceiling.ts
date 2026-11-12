// Plafond : dalle et réglettes fluorescentes au-dessus des allées.
import * as THREE from 'three';
import type { BuildContext, Vec3 } from './context';
import { DEPTH, MID_X, MID_Z, STORE, WIDTH } from './layout';
import { standardMaterial } from './materials';

/** Ce qu'il faut pour poser une réglette. */
interface TubeKit {
  group: THREE.Group;
  housing: THREE.Material;
  glow: THREE.Material;
}

const TUBE_Y = STORE.height - 0.4;
/** Trois rangées de réglettes en travers du magasin. */
const ACROSS = [-0.36, 0, 0.36].map((t) => MID_X + t * WIDTH);

/** Boîtier sombre et fente lumineuse, dans l'axe X ou Z. */
function addTube(
  kit: TubeKit,
  [x, y, z]: Vec3,
  length: number,
  alongX: boolean,
): void {
  const w = alongX ? length : 0.22;
  const d = alongX ? 0.22 : length;
  const shell = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), kit.housing);
  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(
      Math.max(w * 0.9, 0.08),
      0.018,
      Math.max(d * 0.62, 0.08),
    ),
    kit.glow,
  );
  shell.position.set(x, y, z);
  slot.position.set(x, y - 0.03, z);
  kit.group.add(shell, slot);
}

function addSlab(ctx: BuildContext): void {
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH + STORE.wall * 2, 0.12, DEPTH + STORE.wall * 2),
    standardMaterial(0xf3f0e8, 0.94),
  );
  slab.position.set(0, STORE.height + 0.06, MID_Z);
  ctx.group.add(slab);
}

/** Cinq réglettes dans l'axe de chaque allée. */
function addAisleTubes(kit: TubeKit, ctx: BuildContext): void {
  ctx.plan.aisles.forEach((aisle) => {
    for (let i = 0; i < 5; i += 1) {
      addTube(kit, [aisle.x, TUBE_Y, -12.15 + i * 3.55], 3.15, false);
    }
  });
}

/** Réglettes transversales : allée centrale, mur frais, entrée. */
function addCrossTubes(kit: TubeKit, ctx: BuildContext): void {
  ACROSS.forEach((x) => addTube(kit, [x, TUBE_Y, ctx.plan.crossZ], 3.4, true));
  ACROSS.forEach((x) => {
    addTube(kit, [x, TUBE_Y, -16.2], 2.5, true);
    addTube(kit, [x, TUBE_Y, 5.35], 2.5, true);
    addTube(kit, [x, TUBE_Y, 8.85], 2.3, true);
  });
}

export function addCeiling(ctx: BuildContext): void {
  addSlab(ctx);
  const kit: TubeKit = {
    group: ctx.group,
    housing: standardMaterial(0x0b1215, 0.6, 0.15),
    glow: new THREE.MeshStandardMaterial({
      color: 0xfaf6ee,
      emissive: 0xf3e6d0,
      emissiveIntensity: 0.7,
    }),
  };
  addAisleTubes(kit, ctx);
  addCrossTubes(kit, ctx);
}
