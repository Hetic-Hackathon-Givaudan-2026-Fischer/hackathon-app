// Sachets en film, calés sur les paquets du rayon.
// Chips : coussin soudé en haut et en bas (type Lay's).
// Bonbons : doypack à fond plat et soudure haute (type Haribo).
import * as THREE from 'three';
import { cached } from '../../shared/cache';

const RADIAL = 22;
const STEPS = 32;
const CRIMP_TEETH = 9;
const CRIMP_DEPTH = 0.0032;

/** Points (t, valeur) le long de la hauteur, t = 0 en bas. */
type Keys = readonly (readonly [number, number])[];

interface Section {
  y: number;
  hx: number;
  hz: number;
  n: number;
  crimp: number;
}

interface PackProfile {
  height: number;
  halfW: number;
  halfD: number;
  width: Keys;
  depth: Keys;
  roundness: Keys;
  crimp: Keys;
}

function smooth(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
}

function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`Index hors bornes : ${index}`);
  return item;
}

/** Interpolation lisse entre les points de contrôle. */
function curve(keys: Keys, t: number): number {
  const first = at(keys, 0);
  const last = at(keys, keys.length - 1);
  if (t <= first[0]) return first[1];
  if (t >= last[0]) return last[1];
  for (let i = 1; i < keys.length; i += 1) {
    const next = at(keys, i);
    if (t > next[0]) continue;
    const prev = at(keys, i - 1);
    return (
      prev[1] +
      (next[1] - prev[1]) * smooth((t - prev[0]) / (next[0] - prev[0]))
    );
  }
  return last[1];
}

/** Section en superellipse : n = 2 ellipse, n plus grand face plus plate. */
function ringPoint(
  theta: number,
  hx: number,
  hz: number,
  n: number,
): [number, number] {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const e = 2 / n;
  return [
    Math.sign(c) * Math.abs(c) ** e * hx,
    Math.sign(s) * Math.abs(s) ** e * hz,
  ];
}

function sectionsOf(profile: PackProfile): Section[] {
  const sections: Section[] = [];
  const span = profile.height - CRIMP_DEPTH * 2;
  for (let i = 0; i <= STEPS; i += 1) {
    const t = i / STEPS;
    sections.push({
      y: CRIMP_DEPTH + span * t,
      hx: profile.halfW * curve(profile.width, t),
      hz: Math.max(0.0016, profile.halfD * curve(profile.depth, t)),
      n: curve(profile.roundness, t),
      crimp: curve(profile.crimp, t),
    });
  }
  return sections;
}

/** Extrude le profil et ferme les soudures. La dentelure suit la thermosoudure. */
function loft(sections: readonly Section[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const section of sections) {
    for (let j = 0; j < RADIAL; j += 1) {
      const theta = (j / RADIAL) * Math.PI * 2;
      const [x, z] = ringPoint(theta, section.hx, section.hz, section.n);
      const wave =
        Math.cos((x / section.hx) * Math.PI * CRIMP_TEETH) *
        CRIMP_DEPTH *
        section.crimp;
      positions.push(x, section.y + wave, z);
    }
  }
  const rows = sections.length;
  for (let i = 0; i < rows - 1; i += 1) {
    for (let j = 0; j < RADIAL; j += 1) {
      const a = i * RADIAL + j;
      const b = i * RADIAL + ((j + 1) % RADIAL);
      const c = a + RADIAL;
      const d = b + RADIAL;
      indices.push(a, c, b, b, c, d);
    }
  }
  const cap = (row: number, y: number, faceDown: boolean) => {
    const center = positions.length / 3;
    positions.push(0, y, 0);
    for (let j = 0; j < RADIAL; j += 1) {
      const a = row * RADIAL + j;
      const b = row * RADIAL + ((j + 1) % RADIAL);
      if (faceDown) indices.push(center, b, a);
      else indices.push(center, a, b);
    }
  };
  cap(0, at(sections, 0).y, true);
  cap(rows - 1, at(sections, rows - 1).y, false);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const geometries = new Map<string, THREE.BufferGeometry>();

/** Coussin gonflé, pincé aux deux soudures. Proportions d'un sachet individuel. */
const PILLOW: PackProfile = {
  height: 0.168,
  halfW: 0.046,
  halfD: 0.026,
  width: [
    [0, 0.97],
    [0.1, 0.98],
    [0.22, 1],
    [0.58, 1],
    [0.78, 0.97],
    [0.9, 0.94],
    [1, 0.92],
  ],
  depth: [
    [0, 0.05],
    [0.07, 0.1],
    [0.18, 0.72],
    [0.4, 1],
    [0.64, 0.78],
    [0.82, 0.22],
    [0.93, 0.07],
    [1, 0.05],
  ],
  roundness: [
    [0, 2],
    [0.16, 3.2],
    [0.72, 3.2],
    [1, 2],
  ],
  crimp: [
    [0, 1],
    [0.08, 0.55],
    [0.16, 0],
    [0.84, 0],
    [0.92, 0.55],
    [1, 1],
  ],
};

/** Fond plat pour tenir debout, épaules resserrées vers la soudure du haut. */
const DOYPACK: PackProfile = {
  height: 0.128,
  halfW: 0.05,
  halfD: 0.023,
  width: [
    [0, 0.98],
    [0.08, 1],
    [0.72, 0.99],
    [0.88, 0.96],
    [1, 0.94],
  ],
  depth: [
    [0, 1],
    [0.66, 0.96],
    [0.84, 0.4],
    [0.94, 0.08],
    [1, 0.05],
  ],
  roundness: [
    [0, 4.2],
    [0.8, 4.2],
    [1, 2.4],
  ],
  crimp: [
    [0, 0],
    [0.9, 0],
    [1, 1],
  ],
};

export function pillowBagGeometry(): THREE.BufferGeometry {
  return cached(geometries, 'pillow', () => loft(sectionsOf(PILLOW)));
}

export function doypackGeometry(): THREE.BufferGeometry {
  return cached(geometries, 'doypack', () => loft(sectionsOf(DOYPACK)));
}
