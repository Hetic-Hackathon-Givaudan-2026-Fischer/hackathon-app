// Pupitre d'accueil incliné près de l'entrée, avec sa feuille d'information.
import * as THREE from 'three';
import type { RotatedCollider } from '../../types';
import { type BuildContext, box } from './context';
import { WELCOME_BOARD } from './layout';
import { standardMaterial } from './materials';
import type { Plan } from './plan';
import { initiativeTexture } from './initiative';

const BOARD_W = 2.75;
const BOARD_L = 1.55;
/** 80° par rapport au sol : 10° d'inclinaison depuis la verticale. */
const TILT = (10 * Math.PI) / 180;
const HALF = BOARD_L / 2;
/** Recul et hauteur du demi-plateau incliné. */
const REACH = HALF * Math.sin(TILT);
const LIFT = HALF * Math.cos(TILT);
const BOARD_Y = 0.18 + LIFT;
const TOP_Y = BOARD_Y + LIFT;
const TOP_Z = -REACH;

interface BoardSkin {
  edge: THREE.Material;
  back: THREE.Material;
  face: THREE.Material;
}

function boardSkin(plan: Plan): BoardSkin {
  return {
    edge: standardMaterial(0x3a4146, 0.55, 0.08),
    back: standardMaterial(0xf3f0e8, 0.9),
    face: new THREE.MeshStandardMaterial({
      map: initiativeTexture(plan),
      roughness: 0.62,
    }),
  };
}

/** Plateau incliné : chants sombres, dos clair, feuille sur le dessus. */
function createBoard({ edge, back, face }: BoardSkin): THREE.Mesh {
  const board = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W, BOARD_L, 0.04), [
    edge,
    edge,
    edge,
    edge,
    edge,
    back,
  ]);
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(BOARD_W - 0.08, BOARD_L - 0.08),
    face,
  );
  sheet.position.z = 0.024;
  board.add(sheet);
  board.position.set(0, BOARD_Y, 0);
  board.rotation.x = -TILT;
  return board;
}

/** Butée basse et deux pieds sous le bord haut. */
function addSupports(
  stand: THREE.Group,
  edge: THREE.Material,
  metalDark: THREE.Material,
): void {
  stand.add(box(edge, [BOARD_W, 0.05, 0.09], [0, 0.145, REACH]));
  [-1, 1].forEach((side) => {
    const x = side * (BOARD_W / 2 - 0.22);
    stand.add(
      box(
        metalDark,
        [0.05, TOP_Y - 0.12, 0.05],
        [x, (TOP_Y + 0.12) / 2, TOP_Z],
      ),
    );
  });
}

function welcomeCollider(): RotatedCollider {
  const { x, z, yaw } = WELCOME_BOARD;
  return {
    cx: x,
    cz: z,
    cos: Math.cos(yaw),
    sin: Math.sin(yaw),
    minLX: -BOARD_W / 2,
    maxLX: BOARD_W / 2,
    minLZ: TOP_Z - 0.06,
    maxLZ: REACH + 0.08,
  };
}

export function addWelcomeBoard(ctx: BuildContext): void {
  const skin = boardSkin(ctx.plan);
  const stand = new THREE.Group();
  stand.add(createBoard(skin));
  addSupports(stand, skin.edge, ctx.materials.metalDark);
  stand.position.set(WELCOME_BOARD.x, 0, WELCOME_BOARD.z);
  stand.rotation.y = WELCOME_BOARD.yaw;
  ctx.group.add(stand);
  ctx.colliders.push(welcomeCollider());
}
