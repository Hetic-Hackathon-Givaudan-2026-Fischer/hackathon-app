// Signalétique suspendue : lames d'allée et slogan au-dessus de l'entrée.
import * as THREE from 'three';
import { INK, TYPEFACE } from '../../../brand';
import type { BuildContext } from './context';
import { GONDOLA_LEN, MID_X, STORE } from './layout';
import { unitPlane } from './posters';
import { bakedTexture, bladeTexture } from './textures';

/** Lame à poser ; `index` nul pour l'allée centrale. */
interface BladeSpec {
  x: number;
  z: number;
  index: number | null;
  label: string;
  rotY: number;
}

const BLADE_Y = 3.55;
const ROD_LEN = STORE.height - 0.12 - (BLADE_Y + 0.26);
const SLOGAN = 'Human by nature';
const SLOGAN_W = 2048;
const SLOGAN_H = 360;

/** Lame double face pendue au plafond par une tige. */
function addBlade(ctx: BuildContext, spec: BladeSpec): void {
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 0.58),
    new THREE.MeshStandardMaterial({
      map: bladeTexture(spec.index, spec.label),
      roughness: 0.48,
      side: THREE.DoubleSide,
    }),
  );
  plate.position.set(spec.x, BLADE_Y, spec.z);
  plate.rotation.y = spec.rotY;
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, ROD_LEN, 6),
    ctx.materials.metalDark,
  );
  rod.position.set(spec.x, BLADE_Y + 0.26 + ROD_LEN / 2, spec.z);
  ctx.group.add(plate, rod);
}

/** Une lame au sud de chaque allée, une sur la traversée centrale. */
export function addBlades(ctx: BuildContext): void {
  const { plan } = ctx;
  const southZ = plan.lastRunZ + GONDOLA_LEN / 2 + 0.62;
  plan.aisles.forEach((aisle, index) =>
    addBlade(ctx, {
      x: aisle.x,
      z: southZ,
      index,
      label: aisle.label,
      rotY: 0,
    }),
  );
  addBlade(ctx, {
    x: MID_X,
    z: plan.crossZ,
    index: null,
    label: 'Allée centrale',
    rotY: Math.PI / 2,
  });
}

function sloganTexture(): THREE.CanvasTexture {
  return bakedTexture('slogan', SLOGAN_W, SLOGAN_H, (ctx) => {
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 214px ${TYPEFACE}`;
    ctx.fillText(SLOGAN, SLOGAN_W / 2, SLOGAN_H / 2 + 10);
  });
}

/** Slogan peint côté intérieur, au-dessus des portes. */
export function addSlogan(ctx: BuildContext): void {
  const width = 7.2;
  const plate = new THREE.Mesh(
    unitPlane,
    new THREE.MeshBasicMaterial({
      map: sloganTexture(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  plate.scale.set(width, width * (SLOGAN_H / SLOGAN_W), 1);
  plate.position.set(MID_X, 4.4, STORE.maxZ - 0.04);
  plate.rotation.y = Math.PI;
  ctx.group.add(plate);
}
