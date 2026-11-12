// Faisceau du scanner (dans le monde) : cœur, halo, balayage et impact.
import * as THREE from 'three';
import { canvasTexture, createSurface } from '../shared/canvas';

const UP = new THREE.Vector3(0, 1, 0);

/** Part du tir pendant laquelle le faisceau s'allonge jusqu'à la cible. */
const GROW_SHARE = 0.22;
/** Part du tir à partir de laquelle le faisceau s'estompe. */
const FADE_START = 0.62;

const dir = new THREE.Vector3();
const tip = new THREE.Vector3();
const sweepStart = new THREE.Vector3();
const sweepEnd = new THREE.Vector3();

export interface Beam {
  group: THREE.Group;
  core: THREE.Mesh;
  glow: THREE.Mesh;
  sweep: THREE.Mesh;
  impact: THREE.Sprite;
  coreMat: THREE.MeshBasicMaterial;
  glowMat: THREE.MeshBasicMaterial;
  sweepMat: THREE.MeshBasicMaterial;
}

function glowMaterial(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false,
  });
}

/** Tache lumineuse radiale (blanc au centre, rouge sur le pourtour). */
function impactSprite(): THREE.Sprite {
  const { canvas, ctx } = createSurface(64, 64);
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.25, 'rgba(255,50,70,0.95)');
  gradient.addColorStop(1, 'rgba(255,30,50,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const impact = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: canvasTexture(canvas, { srgb: false }),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  impact.scale.setScalar(0.09);
  return impact;
}

/** Crée le faisceau, masqué jusqu'au premier tir. */
export function createBeam(): Beam {
  const geometry = new THREE.CylinderGeometry(0.011, 0.011, 1, 10, 1, false);
  geometry.translate(0, 0.5, 0);
  const coreMat = glowMaterial(0xff2438, 0.92);
  const glowMat = glowMaterial(0xff6b78, 0.28);
  const core = new THREE.Mesh(geometry, coreMat);
  const glow = new THREE.Mesh(geometry, glowMat);
  glow.scale.set(2.4, 1, 2.4);
  const sweepMat = coreMat.clone();
  sweepMat.color.setHex(0xfff2f4);
  const sweep = new THREE.Mesh(geometry, sweepMat);
  const impact = impactSprite();
  const group = new THREE.Group();
  group.name = 'scan-beam';
  group.add(core, glow, sweep, impact);
  group.visible = false;
  return { group, core, glow, sweep, impact, coreMat, glowMat, sweepMat };
}

export function hideBeam(beam: Beam): void {
  beam.group.visible = false;
}

/** Étire un cylindre unitaire de `start` à `end` (masqué si trop court). */
function stretch(
  mesh: THREE.Object3D,
  start: THREE.Vector3,
  end: THREE.Vector3,
): void {
  dir.subVectors(end, start);
  const length = dir.length();
  if (length < 0.02) {
    mesh.visible = false;
    return;
  }
  dir.multiplyScalar(1 / length);
  mesh.visible = true;
  mesh.position.copy(start);
  mesh.quaternion.setFromUnitVectors(UP, dir);
  mesh.scale.y = length;
}

/** Cœur et halo de `from` à `to`, le halo calé sur le cœur. */
function stretchCore(beam: Beam, from: THREE.Vector3, to: THREE.Vector3): void {
  stretch(beam.core, from, to);
  beam.glow.position.copy(beam.core.position);
  beam.glow.quaternion.copy(beam.core.quaternion);
  beam.glow.scale.set(2.6, beam.core.scale.y, 2.6);
  beam.glow.visible = beam.core.visible;
}

function setOpacity(
  beam: Beam,
  to: THREE.Vector3,
  grow: number,
  fade: number,
): void {
  beam.coreMat.opacity = 0.9 * fade;
  beam.glowMat.opacity = 0.32 * fade;
  beam.sweepMat.opacity = 0.95 * fade;
  beam.impact.position.copy(to);
  beam.impact.material.opacity = grow * fade;
  beam.impact.visible = grow > 0.15;
}

/** Dessine le tir à l'avancement `progress` (0 → 1) de `from` vers `target`. */
export function drawShot(
  beam: Beam,
  from: THREE.Vector3,
  target: THREE.Vector3,
  progress: number,
): void {
  const grow = Math.min(1, progress / GROW_SHARE);
  const fade =
    progress < FADE_START ? 1 : 1 - (progress - FADE_START) / (1 - FADE_START);
  tip.copy(target).sub(from).multiplyScalar(grow).add(from);
  beam.group.visible = true;
  stretchCore(beam, from, tip);
  const tail = Math.max(0, grow - 0.08);
  sweepStart.copy(from).lerp(target, tail * 0.75);
  sweepEnd.copy(from).lerp(target, grow);
  stretch(beam.sweep, sweepStart, sweepEnd);
  setOpacity(beam, tip, grow, fade);
}
