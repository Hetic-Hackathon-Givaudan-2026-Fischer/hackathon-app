// Déplacement à la première personne : souris verrouillée, ZQSD / WASD /
// flèches, glissement le long des obstacles.
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { collides } from './collisions';
import type { Collider } from './types';

const SPEED = 4.4;
const PLAYER_HEIGHT = 1.65;
const RADIUS = 0.34;
const START = new THREE.Vector3(0.16, PLAYER_HEIGHT, 11.55);
const START_LOOK = new THREE.Vector3(0.16, 1.15, 0);

type Direction = 'forward' | 'back' | 'left' | 'right';
type Pressed = Record<Direction, boolean>;

/** Claviers AZERTY et QWERTY, plus les flèches. */
const KEY_BINDINGS: Readonly<Record<string, Direction>> = {
  KeyW: 'forward',
  KeyZ: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  KeyQ: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

export interface WalkControls {
  controls: PointerLockControls;
  update(dt: number): void;
  dispose(): void;
}

function trackKeys(): { pressed: Pressed; dispose(): void } {
  const pressed: Pressed = {
    forward: false,
    back: false,
    left: false,
    right: false,
  };
  const set = (code: string, down: boolean) => {
    const direction = KEY_BINDINGS[code];
    if (direction) pressed[direction] = down;
  };
  const onDown = (event: KeyboardEvent) => set(event.code, true);
  const onUp = (event: KeyboardEvent) => set(event.code, false);
  document.addEventListener('keydown', onDown);
  document.addEventListener('keyup', onUp);
  const dispose = () => {
    document.removeEventListener('keydown', onDown);
    document.removeEventListener('keyup', onUp);
  };
  return { pressed, dispose };
}

function stepInput(controls: PointerLockControls, keys: Pressed, d: number) {
  if (keys.forward) controls.moveForward(d);
  if (keys.back) controls.moveForward(-d);
  if (keys.right) controls.moveRight(d);
  if (keys.left) controls.moveRight(-d);
}

/** Avance, puis annule chaque axe qui entre dans un obstacle. */
function walk(
  controls: PointerLockControls,
  keys: Pressed,
  colliders: readonly Collider[],
  dt: number,
) {
  const { position } = controls.object;
  const prevX = position.x;
  const prevZ = position.z;
  stepInput(controls, keys, SPEED * dt);
  const nextX = position.x;
  const nextZ = position.z;
  position.x = collides(colliders, nextX, prevZ, RADIUS) ? prevX : nextX;
  position.z = collides(colliders, position.x, nextZ, RADIUS) ? prevZ : nextZ;
  position.y = PLAYER_HEIGHT;
}

export function createControls(
  camera: THREE.Camera,
  domElement: HTMLElement,
  colliders: readonly Collider[],
): WalkControls {
  const controls = new PointerLockControls(camera, domElement);
  camera.position.copy(START);
  camera.lookAt(START_LOOK);
  const keys = trackKeys();
  const update = (dt: number) => {
    if (controls.isLocked && controls.enabled) {
      walk(controls, keys.pressed, colliders, dt);
    }
  };
  const dispose = () => {
    keys.dispose();
    controls.dispose();
  };
  return { controls, update, dispose };
}
