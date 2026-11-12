// Produit vedette : matériaux réchauffés, halo, reflet, étincelle et lumière,
// animés chaque image par `pulseSpotlights`.
import * as THREE from 'three';
import { canvasTexture, createSurface } from '../shared/canvas';

/** Repères posés dans `userData` (lus aussi par scene/market). */
type GlowFlag = 'halo' | 'shine' | 'spark';

/** Pose de repos d'une vedette, posée par scene/market dans `userData`. */
interface SpotlightPose {
  base: THREE.Vector3;
  baseRotY: number;
  phase: number;
}

/** Instant de l'animation partagé par les éléments d'une vedette. */
interface Beat {
  time: number;
  phase: number;
  pulse: number;
}

const GLOW_SIZE = 128;

let glowMap: THREE.CanvasTexture | undefined;

function paintGlow(): THREE.CanvasTexture {
  const { canvas, ctx } = createSurface(GLOW_SIZE, GLOW_SIZE);
  const mid = GLOW_SIZE / 2;
  const gradient = ctx.createRadialGradient(mid, mid, 6, mid, mid, mid);
  gradient.addColorStop(0, 'rgba(255,248,230,0.95)');
  gradient.addColorStop(0.28, 'rgba(255,196,90,0.55)');
  gradient.addColorStop(1, 'rgba(255,150,30,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
  return canvasTexture(canvas);
}

function glowTexture(): THREE.CanvasTexture {
  glowMap ??= paintGlow();
  return glowMap;
}

function flagged<T extends THREE.Object3D>(object: T, flag: GlowFlag): T {
  object.userData[flag] = true;
  object.userData.ownedMaterial = true;
  return object;
}

function hasFlag(object: THREE.Object3D, flag: GlowFlag): boolean {
  return object.userData[flag] === true;
}

/** Copie propre des matériaux, avec une lueur chaude sur les standards. */
function warmMaterials(item: THREE.Object3D): void {
  item.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (!(child.material instanceof THREE.Material)) return;
    const material = child.material.clone();
    if (material instanceof THREE.MeshStandardMaterial) {
      material.emissive = new THREE.Color(0xffe0a8);
      material.emissiveIntensity = 0.8;
    }
    child.material = material;
    child.userData.ownedMaterial = true;
  });
}

function createHalo(): THREE.Mesh {
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.105, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffc56a,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.007;
  halo.userData.ownedGeometry = true;
  return flagged(halo, 'halo');
}

function createShine(): THREE.Sprite {
  const shine = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color: 0xfff1cc,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  shine.position.y = 0.045;
  shine.scale.set(0.08, 0.1, 1);
  return flagged(shine, 'shine');
}

function createSpark(): THREE.Mesh {
  const spark = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.022, 0),
    new THREE.MeshBasicMaterial({ color: 0xffc14d, toneMapped: false }),
  );
  spark.position.y = 0.19;
  spark.userData.ownedGeometry = true;
  return flagged(spark, 'spark');
}

function createGlowLight(): THREE.PointLight {
  const light = new THREE.PointLight(0xffcc80, 0.55, 0.72, 2);
  light.position.set(0, 0.12, 0.08);
  return light;
}

/** Haut du modèle dans son repère, avant les effets de lueur. */
function productTop(item: THREE.Object3D): number {
  const corner = new THREE.Vector3();
  let top = 0;
  item.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
    const box = child.geometry.boundingBox;
    if (!box) return;
    child.updateMatrix();
    corner.set(0, box.max.y, 0).applyMatrix4(child.matrix);
    if (corner.y > top) top = corner.y;
  });
  return top;
}

/** Met le produit en vedette : lueur collée au volume, le rayon l'anime ensuite. */
export function markFeatured(item: THREE.Object3D): void {
  item.userData.spotlight = true;
  warmMaterials(item);
  const top = productTop(item);
  const halo = createHalo();
  halo.position.y = 0.004;
  const shine = createShine();
  shine.position.y = top * 0.62;
  const spark = createSpark();
  spark.position.y = top + 0.016;
  const light = createGlowLight();
  light.position.set(0, top * 0.5, 0.04);
  item.add(halo, shine, spark, light);
}

function poseOf(item: THREE.Object3D): SpotlightPose | undefined {
  const data: Record<string, unknown> = item.userData;
  const { base, baseRotY, phase } = data;
  if (!(base instanceof THREE.Vector3)) return undefined;
  if (typeof baseRotY !== 'number' || typeof phase !== 'number')
    return undefined;
  return { base, baseRotY, phase };
}

function materialOf(object: THREE.Object3D): THREE.Material | undefined {
  if (!(object instanceof THREE.Mesh || object instanceof THREE.Sprite)) {
    return undefined;
  }
  const material: unknown = object.material;
  return material instanceof THREE.Material ? material : undefined;
}

function setOpacity(object: THREE.Object3D, opacity: number): void {
  const material = materialOf(object);
  if (material) material.opacity = opacity;
}

function pulseHalo(halo: THREE.Object3D, pulse: number): void {
  setOpacity(halo, 0.45 + pulse * 0.5);
  halo.scale.setScalar(0.86 + pulse * 0.35);
}

function pulseShine(shine: THREE.Object3D, pulse: number): void {
  const scale = 1.05 + pulse * 0.4;
  setOpacity(shine, 0.5 + pulse * 0.4);
  shine.scale.set(0.11 * scale, 0.14 * scale, 1);
}

function spinSpark(spark: THREE.Object3D, { time, phase, pulse }: Beat): void {
  spark.scale.setScalar(0.42 + pulse * 0.28);
  spark.rotation.y = time * 2.4 + phase;
  spark.rotation.z = time * 1.6;
}

function pulseWarmth(object: THREE.Object3D, pulse: number): void {
  const material = materialOf(object);
  if (material instanceof THREE.MeshStandardMaterial) {
    material.emissiveIntensity = 0.2 + pulse * 0.85;
  }
}

function pulseChild(child: THREE.Object3D, beat: Beat): void {
  if (child instanceof THREE.PointLight) {
    child.intensity = 0.25 + beat.pulse * 0.85;
  } else if (hasFlag(child, 'halo')) {
    pulseHalo(child, beat.pulse);
  } else if (hasFlag(child, 'shine')) {
    pulseShine(child, beat.pulse);
  } else if (hasFlag(child, 'spark')) {
    spinSpark(child, beat);
  } else {
    pulseWarmth(child, beat.pulse);
  }
}

function pulseItem(item: THREE.Object3D, time: number): void {
  const pose = poseOf(item);
  if (!pose) return;
  const { base, baseRotY, phase } = pose;
  const buzz = Math.sin(time * 46 + phase);
  const pulse = 0.5 + 0.5 * Math.sin(time * 2.7 + phase);
  item.position.x = base.x + buzz * 0.03;
  item.position.y = base.y + pulse * 0.04;
  item.position.z = base.z + Math.cos(time * 38 + phase) * 0.012;
  item.rotation.y = baseRotY + Math.sin(time * 22 + phase) * 0.14;
  item.rotation.z = buzz * 0.16;
  const beat: Beat = { time, phase, pulse };
  item.traverse((child) => pulseChild(child, beat));
}

/** Fait vibrer et pulser les vedettes ; `time` en secondes. */
export function pulseSpotlights(
  spotlights: THREE.Object3D[],
  time: number,
): void {
  for (const item of spotlights) pulseItem(item, time);
}
