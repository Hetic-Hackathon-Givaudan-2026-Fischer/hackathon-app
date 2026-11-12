// Moteur de rendu, scène, caméra et rendu en deux passes : le décor (calque
// 0), puis les objets tenus en main (calque 1) par-dessus, sans fond ni
// brouillard, pour qu'ils ne traversent jamais les rayons.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MAX_PIXEL_RATIO = 1.25;
export const HAND_LAYER = 1;

export interface Stage {
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  render(withHands: boolean): void;
  dispose(): void;
}

function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;
  return renderer;
}

function createScene(renderer: THREE.WebGLRenderer): THREE.Scene {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return scene;
}

function renderLayers(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  withHands: boolean,
) {
  renderer.clear(true, true, true);
  camera.layers.set(0);
  renderer.render(scene, camera);
  if (withHands) renderHands(renderer, scene, camera);
  camera.layers.enableAll();
}

function renderHands(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
) {
  const { background, fog } = scene;
  scene.background = null;
  scene.fog = null;
  renderer.clearDepth();
  camera.layers.set(HAND_LAYER);
  renderer.render(scene, camera);
  scene.background = background;
  scene.fog = fog;
}

function fitToWindow(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/** Crée un canvas plein écran dans `container` ; `dispose` le retire. */
export function createStage(container: HTMLElement): Stage {
  const canvas = document.createElement('canvas');
  canvas.className = 'block';
  container.append(canvas);
  const renderer = createRenderer(canvas);
  const scene = createScene(renderer);
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(70, aspect, 0.08, 80);
  const onResize = () => fitToWindow(renderer, camera);
  window.addEventListener('resize', onResize);
  const dispose = () => {
    window.removeEventListener('resize', onResize);
    scene.environment?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
  const render = (withHands: boolean) =>
    renderLayers(renderer, scene, camera, withHands);
  return { canvas, scene, camera, render, dispose };
}
