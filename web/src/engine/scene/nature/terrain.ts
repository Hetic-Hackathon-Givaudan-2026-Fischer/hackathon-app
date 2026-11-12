// Sol : terrain ondulé teinté sommet par sommet, et collines à l'horizon.
import * as THREE from 'three';
import { matte } from './materials';
import { underFloor } from './placement';
import { fbm, pick, rng } from './random';
import { grassTexture } from './texture';

/** Plat autour du magasin, puis relief croissant au-delà de 30 m. */
function terrainHeight(x: number, z: number): number {
  const dist = Math.hypot(x, z);
  const rise = dist > 30 ? Math.min(1, (dist - 30) / 16) : 0;
  return underFloor(x, z) ? -0.16 : fbm(x * 0.04, z * 0.04) * 1.7 * rise;
}

/** Variation douce de teinte, pour casser la répétition de la texture. */
function terrainTint(x: number, z: number, color: THREE.Color): THREE.Color {
  const n = fbm(x * 0.045, z * 0.045);
  const n2 = fbm(x * 0.12 + 8, z * 0.12);
  const lift = 0.88 + n * 0.14 + n2 * 0.04;
  return color.setRGB(lift * 0.93, lift, lift * 0.8);
}

function terrainGeometry(): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(160, 160, 80, 80);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute('position');
  const colors: number[] = [];
  const color = new THREE.Color();
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, terrainHeight(x, z));
    terrainTint(x, z, color);
    colors.push(color.r, color.g, color.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export function addTerrain(scene: THREE.Scene): void {
  const geo = terrainGeometry();
  const map = grassTexture();
  const material = new THREE.MeshStandardMaterial({
    map,
    vertexColors: true,
    roughness: 1,
  });
  scene.add(new THREE.Mesh(geo, material));
}

export function addHills(scene: THREE.Scene): void {
  const mats = [matte(0x3d6b36, 1), matte(0x4a7c3d, 1)];
  const rand = rng(11);
  for (let i = 0; i < 14; i += 1) {
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(1, 10, 8),
      pick(mats, i),
    );
    const angle = (i / 14) * Math.PI * 2 + rand() * 0.25;
    const dist = 40 + rand() * 18;
    hill.scale.set(9 + rand() * 11, 2.4 + rand() * 2.2, 8 + rand() * 8);
    hill.position.set(Math.cos(angle) * dist, 0.2, Math.sin(angle) * dist);
    hill.receiveShadow = true;
    scene.add(hill);
  }
}
