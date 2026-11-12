// Équipement tenu en main : pose des deux mains, recul, refus et tir.
import * as THREE from 'three';
import type { Gear } from '../../types';
import { createBeam, drawShot, hideBeam, type Beam } from './beam';
import { createScanner, createTablet, type Scanner } from './models';
import { createScreen } from './screen';

const FIRE_DURATION = 0.62;
const DENY_DURATION = 0.22;
const RECOIL_DURATION = 0.26;
/** Calque rendu par la passe « mains » (au-dessus du monde). */
const HANDS_LAYER = 1;

const FORWARD = new THREE.Vector3(0, 0, -1);
const UP = new THREE.Vector3(0, 1, 0);

// Poses : repos (focus 0) → lecture de la tablette (focus 1).
const rightRest = new THREE.Vector3(0.2, -0.128, -0.2);
const rightAway = new THREE.Vector3(0.2, -0.32, -0.16);
const leftRest = new THREE.Vector3(-0.18, -0.158, -0.2);
const leftRead = new THREE.Vector3(0.0, 0.0, -0.34);
const tabletRestScale = 0.28;
const tabletReadScale = 1.12;
const quat = (x: number, y: number, z: number): THREE.Quaternion =>
  new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
const rightHold = quat(0.22, 0.12, -0.04);
const lowQuat = quat(1.15, 0.15, -0.85);
const tabletRest = quat(0.42, 0.55, 0.02);
const tabletRead = quat(-0.06, 0.04, 0);

const muzzleWorld = new THREE.Vector3();
const punch = new THREE.Vector3();
const shake = new THREE.Quaternion();

interface Rig {
  root: THREE.Group;
  right: THREE.Group;
  aim: THREE.Group;
  tablet: THREE.Group;
  scanner: Scanner;
  beam: Beam;
}

/** Âges en secondes (-1 : inactif) et recul restant (1 → 0). */
interface GearState {
  fireAge: number;
  denyAge: number;
  recoil: number;
  target: THREE.Vector3;
}

interface Frame {
  dt: number;
  time: number;
  ready: boolean;
  moving: boolean;
  focus: number;
}

function assembleRig(screenMap: THREE.Texture): Rig {
  const root = new THREE.Group();
  root.name = 'gear';
  const scanner = createScanner();
  const tablet = createTablet(screenMap);
  const right = new THREE.Group();
  const aim = new THREE.Group();
  aim.scale.setScalar(0.82);
  aim.add(scanner.root);
  right.add(aim);
  root.add(right, tablet);
  root.traverse((child) => {
    child.layers.set(HANDS_LAYER);
    child.frustumCulled = false;
  });
  return { root, right, aim, tablet, scanner, beam: createBeam() };
}

/** Main droite : balancement de marche ; rend le hochement vertical. */
function poseRight(right: THREE.Group, { time, moving, focus }: Frame): number {
  const idle = 1 - focus;
  const bob =
    (moving ? Math.sin(time * 8.2) : Math.sin(time * 1.5) * 0.35) *
    0.014 *
    idle;
  const sway = (moving ? Math.cos(time * 4.1) : 0) * 0.008 * idle;
  right.position.lerpVectors(rightRest, rightAway, focus);
  right.position.x += sway;
  right.position.y += bob;
  return bob;
}

/** Orientation du scanner, plus un « non » de la tête pendant un refus. */
function poseAim(
  aim: THREE.Group,
  state: GearState,
  dt: number,
  focus: number,
): void {
  aim.quaternion.copy(rightHold).slerp(lowQuat, focus);
  if (state.denyAge < 0) return;
  state.denyAge += dt;
  const u = state.denyAge / DENY_DURATION;
  if (u >= 1) {
    state.denyAge = -1;
    return;
  }
  shake.setFromAxisAngle(UP, Math.sin(u * Math.PI * 3) * (1 - u) * 0.16);
  aim.quaternion.multiply(shake);
}

/** Recul après un tir : la main part en arrière. */
function applyRecoil(rig: Rig, state: GearState, dt: number): void {
  state.recoil = Math.max(0, state.recoil - dt / RECOIL_DURATION);
  const kick = Math.sin(Math.min(state.recoil, 1) * Math.PI) * 0.035;
  punch.copy(FORWARD).applyQuaternion(rig.aim.quaternion);
  rig.right.position.addScaledVector(punch, -kick);
}

/** Vitre et témoin : en tir (rouge), prêt (vert) ou au repos (bleu). */
function lightScanner(
  scanner: Scanner,
  firing: boolean,
  { time, ready, focus }: Frame,
): void {
  const live = ready && focus < 0.2;
  scanner.windowMat.emissiveIntensity = live
    ? 0.35 + Math.sin(time * 7) * 0.12
    : 0.06 + focus * 0.2;
  if (firing) {
    scanner.ledMat.emissive.setHex(0xff4455);
    scanner.ledMat.emissiveIntensity = 1.4;
  } else {
    scanner.ledMat.emissive.setHex(live ? 0x39f29a : 0x9ad7ff);
    scanner.ledMat.emissiveIntensity = live ? 0.9 : 0.15;
  }
}

/** Tablette : de la hanche (petite) jusque devant les yeux (grande). */
function poseTablet(tablet: THREE.Group, bob: number, focus: number): void {
  tablet.position.lerpVectors(leftRest, leftRead, focus);
  tablet.position.y += bob * 0.65;
  tablet.quaternion.copy(tabletRest).slerp(tabletRead, focus);
  tablet.scale.setScalar(
    tabletRestScale + (tabletReadScale - tabletRestScale) * focus,
  );
}

/** Avance le tir en cours et le dessine ; masque le faisceau sinon. */
function advanceShot(rig: Rig, state: GearState, dt: number): void {
  if (state.fireAge < 0) {
    hideBeam(rig.beam);
    return;
  }
  state.fireAge += dt;
  const progress = state.fireAge / FIRE_DURATION;
  if (progress >= 1) {
    state.fireAge = -1;
    hideBeam(rig.beam);
    return;
  }
  rig.root.updateWorldMatrix(true, true);
  rig.scanner.muzzle.getWorldPosition(muzzleWorld);
  drawShot(rig.beam, muzzleWorld, state.target, progress);
}

function updateGear(rig: Rig, state: GearState, frame: Frame): void {
  if (!rig.root.visible) {
    state.fireAge = -1;
    hideBeam(rig.beam);
    return;
  }
  const bob = poseRight(rig.right, frame);
  poseAim(rig.aim, state, frame.dt, frame.focus);
  applyRecoil(rig, state, frame.dt);
  lightScanner(rig.scanner, state.fireAge >= 0, frame);
  poseTablet(rig.tablet, bob, frame.focus);
  advanceShot(rig, state, frame.dt);
}

function fire(rig: Rig, state: GearState, point: THREE.Vector3): void {
  state.target.copy(point);
  state.fireAge = 0;
  state.recoil = 1;
  rig.beam.group.visible = true;
}

/** Scanner + tablette (calque des mains) et faisceau à ajouter au monde. */
export function createGear(): Gear {
  const screen = createScreen();
  const rig = assembleRig(screen.texture);
  const state: GearState = {
    fireAge: -1,
    denyAge: -1,
    recoil: 0,
    target: new THREE.Vector3(),
  };
  return {
    object: rig.root,
    beam: rig.beam.group,
    fire: (point) => fire(rig, state, point),
    deny: () => {
      // Pas de refus pendant un tir.
      if (state.fireAge < 0) state.denyAge = 0;
    },
    show: (card) => screen.paint(card),
    update: (dt, time, ready, moving, focus) =>
      updateGear(rig, state, { dt, time, ready, moving, focus }),
  };
}
