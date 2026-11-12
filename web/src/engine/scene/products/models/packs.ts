// Emballages : sachet de bonbons, tablette de chocolat, biscuits, céréales.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { cached } from '../../shared/cache';
import { standard } from '../materials';
import { assemble, box, labelAt, part } from './parts';
import { doypackGeometry } from './pouch';

const TABLET = { width: 0.078, height: 0.148, depth: 0.012 } as const;
const tabletGeometries = new Map<string, THREE.BufferGeometry>();

function tabletGeometry(
  key: string,
  create: () => THREE.BufferGeometry,
): THREE.BufferGeometry {
  return cached(tabletGeometries, key, create);
}

/** Or pour une tablette sombre, aluminium clair si l'emballage est déjà pâle. */
function foilTone(color: number): number {
  const ink = new THREE.Color(color);
  const luma = ink.r * 0.3 + ink.g * 0.59 + ink.b * 0.11;
  return luma > 0.45 ? 0xf3efe6 : 0xd7b56a;
}

/** Sachet à fond plat : il tient debout, soudure seulement en haut. */
export function candy(color: number, name: string): THREE.Group {
  const film = standard(color, { roughness: 0.4, metalness: 0.06 });
  return assemble(
    part(doypackGeometry(), film, [0, 0, 0]),
    labelAt(name, 0.068, 0.04, [0, 0.052, 0.025]),
  );
}

/** Tablette : plaquette fine, liseré d'aluminium et rabats pliés au dos. */
export function chocolateBar(color: number, name: string): THREE.Group {
  const { width, height, depth } = TABLET;
  const foil = standard(foilTone(color), { roughness: 0.28, metalness: 0.46 });
  const wrap = standard(color, { roughness: 0.4, metalness: 0.08 });
  const y = height / 2;
  const front = depth / 2;
  const foldDepth = 0.006;
  const fold = tabletGeometry(
    'fold',
    () => new THREE.BoxGeometry(width - 0.004, 0.01, foldDepth),
  );
  const foldZ = -front - foldDepth / 2 + 0.001;
  return assemble(
    part(
      tabletGeometry(
        'slab',
        () => new RoundedBoxGeometry(width, height, depth, 2, 0.0028),
      ),
      foil,
      [0, y, 0],
    ),
    part(
      tabletGeometry(
        'panel',
        () =>
          new RoundedBoxGeometry(
            width - 0.012,
            height - 0.022,
            0.0022,
            2,
            0.0016,
          ),
      ),
      wrap,
      [0, y, front],
    ),
    part(fold, foil, [0, height - 0.002, foldZ]),
    part(fold, foil, [0, 0.005, foldZ]),
    labelAt(name, width - 0.02, 0.05, [0, y + 0.002, front + 0.0022]),
  );
}

export function biscuitPack(color: number, name: string): THREE.Group {
  return assemble(
    part(box(0.104, 0.056, 0.032), standard(color), [0, 0.028, 0]),
    labelAt(name, 0.092, 0.042, [0, 0.028, 0.017]),
  );
}

export function cerealBox(color: number, name: string): THREE.Group {
  const carton = standard(color);
  return assemble(
    part(box(0.092, 0.152, 0.036), carton, [0, 0.076, 0]),
    part(box(0.092, 0.006, 0.036), carton, [0, 0.155, 0]),
    labelAt(name, 0.082, 0.048, [0, 0.082, 0.019]),
  );
}
