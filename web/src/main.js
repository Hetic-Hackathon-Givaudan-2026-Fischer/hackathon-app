import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createNature } from './scene/nature.js';
import { createMarket } from './scene/market.js';
import { createGear, SCAN_RANGE } from './scene/scanner.js';
import { createControls } from './controls.js';
import { createUI } from './ui.js';
import { ensureBrandFont } from './brand.js';
import './style.css';

ensureBrandFont().then(start);

function start() {
const canvas = document.createElement('canvas');
document.body.prepend(canvas);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.autoClear = false;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.08, 80);

createNature(scene);
const ui = createUI();
const { group: market, productMeshes, colliders, updateDoors, updateSpotlights } = createMarket(scene);
const { controls, update } = createControls(camera, renderer.domElement, colliders);
const gear = createGear();
scene.add(camera);
camera.add(gear.object);
scene.add(gear.beam);
gear.object.visible = false;
globalThis.__shot = { camera, scene };
scene.traverse((obj) => {
  if (obj.isLight) obj.layers.enable(1);
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);
const aimCenter = new THREE.Vector3();
const aimTo = new THREE.Vector3();
const aimScale = new THREE.Vector3();
const aimPoint = new THREE.Vector3();
const savedQuat = new THREE.Quaternion();
const lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const lastPos = new THREE.Vector3().copy(camera.position);
const clock = new THREE.Clock();
let focus = 0;
let focusTarget = 0;

function pitchFrom(base, amount) {
  lookEuler.setFromQuaternion(base, 'YXZ');
  const limit = Math.PI / 2 - 0.08;
  lookEuler.x = Math.max(-limit, Math.min(limit, lookEuler.x + amount));
  camera.quaternion.setFromEuler(lookEuler);
}

function resetFocus() {
  if (focus > 0) camera.quaternion.copy(savedQuat);
  focus = 0;
  focusTarget = 0;
  controls.enabled = true;
  ui.setReading(false);
}

controls.addEventListener('lock', () => {
  ui.setPlaying(true);
  gear.object.visible = true;
});
controls.addEventListener('unlock', () => {
  ui.setPlaying(false);
  gear.object.visible = false;
  resetFocus();
});

canvas.addEventListener('click', () => {
  if (!controls.isLocked) {
    controls.lock();
  }
});

document.addEventListener('mousedown', (event) => {
  if (event.button !== 0) return;
  if (controls.isLocked) {
    pickCategory();
  }
});

function nearestInFront() {
  const origin = camera.position;
  const dir = raycaster.ray.direction;
  let best = null;
  let bestLateral = Infinity;
  for (let i = 0; i < productMeshes.length; i += 1) {
    const mesh = productMeshes[i];
    const { geometry } = mesh;
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    const sphere = geometry.boundingSphere;
    if (!sphere) continue;
    aimCenter.copy(sphere.center).applyMatrix4(mesh.matrixWorld);
    aimTo.copy(aimCenter).sub(origin);
    const along = aimTo.dot(dir);
    const scale = Math.abs(mesh.getWorldScale(aimScale).x);
    const radius = sphere.radius * scale;
    const front = along - radius;
    if (along < 0.3 || front > SCAN_RANGE) continue;
    const lateralSq = Math.max(0, aimTo.lengthSq() - along * along);
    const reach = radius + 0.22;
    if (lateralSq > reach * reach || lateralSq >= bestLateral) continue;
    bestLateral = lateralSq;
    best = { object: mesh, distance: Math.max(front, 0.2) };
  }
  return best;
}

function aimedHit() {
  if (!productMeshes.length) return null;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(productMeshes, false);
  if (hits.length) return hits[0];
  return nearestInFront();
}

function categoryOf(object) {
  let node = object;
  while (node && !node.userData.category) node = node.parent;
  return node?.userData.category ?? null;
}

function pickCategory() {
  if (focusTarget > 0 || focus > 0.02) {
    focusTarget = 0;
    return;
  }
  const hit = aimedHit();
  if (!hit) {
    gear.deny();
    return;
  }
  if (hit.distance > SCAN_RANGE) {
    gear.deny();
    return;
  }
  const category = categoryOf(hit.object);
  if (!category) return;
  if (focus === 0) savedQuat.copy(camera.quaternion);
  focusTarget = 1;
  gear.show(category.name, category.blurb);
  const surface = raycaster.intersectObject(market, true).find((item) => item.distance > 0.2 && item.distance < 8);
  const point = surface ? surface.point : raycaster.ray.at(3, aimPoint);
  gear.fire(point);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  update(dt);
  updateDoors(camera.position, dt);
  updateSpotlights(time);
  const moving = camera.position.distanceToSquared(lastPos) > 1e-7;
  lastPos.copy(camera.position);
  const step = dt / 0.9;
  if (focus < focusTarget) focus = Math.min(focusTarget, focus + step);
  else if (focus > focusTarget) focus = Math.max(focusTarget, focus - step);
  const viewBlend = THREE.MathUtils.smoothstep(focus, 0.16, 1);
  if (focus > 0) {
    controls.enabled = false;
    pitchFrom(savedQuat, 0.32 * viewBlend);
  } else if (controls.enabled === false) {
    camera.quaternion.copy(savedQuat);
    controls.enabled = true;
  }
  ui.setReading(viewBlend > 0.4);
  camera.updateMatrixWorld(true);
  const hit = controls.isLocked && focus === 0 ? aimedHit() : null;
  const ready = Boolean(hit && hit.distance <= SCAN_RANGE && categoryOf(hit.object));
  gear.update(dt, time, ready, moving, viewBlend);
  const backdrop = scene.background;
  const fog = scene.fog;
  renderer.clear(true, true, true);
  camera.layers.set(0);
  renderer.render(scene, camera);
  if (gear.object.visible) {
    scene.background = null;
    scene.fog = null;
    renderer.clearDepth();
    camera.layers.set(1);
    renderer.render(scene, camera);
    scene.background = backdrop;
    scene.fog = fog;
  }
  camera.layers.enableAll();
  requestAnimationFrame(loop);
}

loop();
}
