// Maillages tenus en main : le scanner (main droite) et la tablette (gauche).
import * as THREE from 'three';

export interface Scanner {
  root: THREE.Group;
  /** Vitre rouge du laser, plus vive quand un tir est possible. */
  windowMat: THREE.MeshStandardMaterial;
  /** Témoin d'état : prêt, en tir ou au repos. */
  ledMat: THREE.MeshStandardMaterial;
  /** Gâchette (pivot sans maillage), basculée par le recul. */
  /** Sortie du faisceau. */
  muzzle: THREE.Object3D;
}

interface ScannerMaterials {
  shell: THREE.MeshStandardMaterial;
  copper: THREE.MeshStandardMaterial;
  windowMat: THREE.MeshStandardMaterial;
  ledMat: THREE.MeshStandardMaterial;
}

/** Pièce du scanner : forme, matériau, position et inclinaison en X. */
interface PartSpec {
  shape: () => THREE.BufferGeometry;
  material: keyof ScannerMaterials;
  at: readonly [number, number, number];
  tiltX?: number;
}

// Corps, vitre, liseré cuivre, poignée et témoin, dans cet ordre.
const SCANNER_PARTS: readonly PartSpec[] = [
  {
    shape: () => new THREE.BoxGeometry(0.028, 0.016, 0.052),
    material: 'shell',
    at: [0, 0.006, -0.004],
  },
  {
    shape: () => new THREE.CylinderGeometry(0.0065, 0.0065, 0.002, 20),
    material: 'windowMat',
    at: [0, 0.006, -0.031],
    tiltX: Math.PI / 2,
  },
  {
    shape: () => new THREE.BoxGeometry(0.016, 0.0014, 0.028),
    material: 'copper',
    at: [0, 0.0146, 0],
  },
  {
    shape: () => new THREE.CylinderGeometry(0.006, 0.0075, 0.03, 12),
    material: 'shell',
    at: [0, -0.01, 0.01],
    tiltX: 0.18,
  },
  {
    shape: () => new THREE.BoxGeometry(0.0035, 0.0016, 0.0025),
    material: 'ledMat',
    at: [0.008, 0.0148, 0.014],
  },
];

/** Matériau métallisé (coques et pièces cuivrées). */
function metal(
  color: number,
  roughness: number,
  metalness: number,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function scannerMaterials(): ScannerMaterials {
  return {
    shell: metal(0x1c2226, 0.62, 0.16),
    copper: metal(0xbe5800, 0.4, 0.22),
    windowMat: new THREE.MeshStandardMaterial({
      color: 0x140406,
      emissive: 0xff2a38,
      emissiveIntensity: 0.12,
      roughness: 0.18,
      metalness: 0.1,
    }),
    ledMat: new THREE.MeshStandardMaterial({
      color: 0x102016,
      emissive: 0x8dffc4,
      emissiveIntensity: 0.2,
      roughness: 0.3,
    }),
  };
}

function buildPart(spec: PartSpec, mats: ScannerMaterials): THREE.Mesh {
  const mesh = new THREE.Mesh(spec.shape(), mats[spec.material]);
  mesh.position.set(...spec.at);
  if (spec.tiltX !== undefined) mesh.rotation.x = spec.tiltX;
  return mesh;
}

export function createScanner(): Scanner {
  const root = new THREE.Group();
  const mats = scannerMaterials();
  const parts = SCANNER_PARTS.map((spec) => buildPart(spec, mats));
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.006, -0.034);
  root.add(...parts, muzzle);
  const { windowMat, ledMat } = mats;
  return { root, windowMat, ledMat, muzzle };
}

/** Tablette : coque, écran (texture du canvas) et lèvre cuivre. */
export function createTablet(screenMap: THREE.Texture): THREE.Group {
  const root = new THREE.Group();
  const bezel = metal(0x1c2226, 0.46, 0.4);
  const copper = metal(0xbe5800, 0.4, 0.28);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.186, 0.01), bezel);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.254, 0.156),
    new THREE.MeshBasicMaterial({ map: screenMap, toneMapped: false }),
  );
  screen.position.z = 0.006;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.006, 0.011), copper);
  lip.position.y = 0.09;
  root.add(body, screen, lip);
  return root;
}
