// Mise au point sur la tablette après un scan : la caméra s'incline vers le
// bas et les contrôles sont gelés, puis tout revient à l'état d'avant.
import * as THREE from 'three';
import type { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const FOCUS_SECONDS = 0.9;
const FOCUS_PITCH = 0.32;
const PITCH_LIMIT = Math.PI / 2 - 0.08;
/** En dessous, un clic range la tablette au lieu de scanner. */
const ENGAGED_LEVEL = 0.02;

export interface Focus {
  /** 0 : vue libre, 1 : tablette en lecture. */
  readonly level: number;
  /** Vrai si la tablette est sortie ou en train de sortir. */
  readonly engaged: boolean;
  begin(): void;
  release(): void;
  reset(): void;
  /** Avance l'animation ; rend le mélange de vue lissé (0 → 1). */
  update(dt: number): number;
}

function approach(value: number, target: number, step: number): number {
  if (value < target) return Math.min(target, value + step);
  return Math.max(target, value - step);
}

export function createFocus(
  camera: THREE.Camera,
  controls: PointerLockControls,
): Focus {
  const state = { level: 0, target: 0 };
  const saved = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const pitchDown = (amount: number) => {
    euler.setFromQuaternion(saved, 'YXZ');
    euler.x = THREE.MathUtils.clamp(
      euler.x + amount,
      -PITCH_LIMIT,
      PITCH_LIMIT,
    );
    camera.quaternion.setFromEuler(euler);
  };
  const restore = () => {
    camera.quaternion.copy(saved);
    controls.enabled = true;
  };
  return {
    get level() {
      return state.level;
    },
    get engaged() {
      return state.target > 0 || state.level > ENGAGED_LEVEL;
    },
    begin() {
      if (state.level === 0) saved.copy(camera.quaternion);
      state.target = 1;
    },
    release() {
      state.target = 0;
    },
    reset() {
      if (state.level > 0) camera.quaternion.copy(saved);
      state.level = 0;
      state.target = 0;
      controls.enabled = true;
    },
    update(dt) {
      state.level = approach(state.level, state.target, dt / FOCUS_SECONDS);
      const blend = THREE.MathUtils.smoothstep(state.level, 0.16, 1);
      if (state.level > 0) {
        controls.enabled = false;
        pitchDown(FOCUS_PITCH * blend);
      } else if (!controls.enabled) restore();
      return blend;
    },
  };
}
