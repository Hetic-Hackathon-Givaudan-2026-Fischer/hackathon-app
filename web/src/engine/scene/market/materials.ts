// Matériaux du magasin : partagés par module, ou créés une fois par magasin.
import * as THREE from 'three';
import { linenTexture } from './textures';

/** Matériau standard mat ou métallique, sans texture. */
export function standardMaterial(
  color: THREE.ColorRepresentation,
  roughness: number,
  metalness = 0,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

/** Vitre des portes réfrigérées. */
export const fridgeGlass = new THREE.MeshStandardMaterial({
  color: 0xe8f6ff,
  roughness: 0.08,
  metalness: 0.04,
  transparent: true,
  opacity: 0.2,
  depthWrite: false,
});

/** Vitre des fenêtres hautes, visible des deux côtés. */
export const windowGlass = fridgeGlass.clone();
windowGlass.side = THREE.DoubleSide;
windowGlass.opacity = 0.28;

/** Réglettes LED : chaudes sous les étagères, froides dans les frigos. */
export const ledWarm = new THREE.MeshStandardMaterial({
  color: 0xfaf6ee,
  emissive: 0xf0e2cc,
  emissiveIntensity: 0.85,
});
export const ledCold = new THREE.MeshStandardMaterial({
  color: 0xf4f7f8,
  emissive: 0xd5e4ea,
  emissiveIntensity: 0.55,
});

export interface MarketMaterials {
  metal: THREE.MeshStandardMaterial;
  metalDark: THREE.MeshStandardMaterial;
  whiteShelf: THREE.MeshStandardMaterial;
  mauve: THREE.MeshStandardMaterial;
  bumper: THREE.MeshStandardMaterial;
  pegboard: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
}

export function createMaterials(): MarketMaterials {
  const linen = linenTexture();
  return {
    metal: standardMaterial(0x2a3338, 0.46, 0.22),
    metalDark: standardMaterial(0x0b1215, 0.58, 0.18),
    whiteShelf: standardMaterial(0xfaf9f6, 0.42, 0.04),
    mauve: standardMaterial(0x78608d, 0.42, 0.2),
    bumper: standardMaterial(0x8c5a32, 0.38, 0.55),
    pegboard: new THREE.MeshStandardMaterial({
      map: linen,
      roughness: 0.86,
      metalness: 0.02,
    }),
    wall: standardMaterial(0xfaf9f6, 0.92),
  };
}
