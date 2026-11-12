// Épicerie et traiteur : chips, sauces, barquettes, végétal, protéines.
import * as THREE from 'three';
import { standard } from '../materials';
import { assemble, box, cylinder, labelAt, part } from './parts';

/** Silhouette du sachet de chips, vue de face. */
function chipsOutline(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.016, 0.002);
  shape.lineTo(-0.036, 0.016);
  shape.bezierCurveTo(-0.046, 0.046, -0.044, 0.108, -0.032, 0.138);
  shape.lineTo(-0.018, 0.154);
  shape.lineTo(0.018, 0.154);
  shape.lineTo(0.032, 0.138);
  shape.bezierCurveTo(0.044, 0.108, 0.046, 0.046, 0.036, 0.016);
  shape.lineTo(0.016, 0.002);
  shape.closePath();
  return shape;
}

function chipsGeometry(): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(chipsOutline(), {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 1,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -0.008);
  return geometry;
}

export function chipsBag(color: number, name: string): THREE.Group {
  const film = standard(color, { roughness: 0.45 });
  return assemble(
    part(chipsGeometry(), film, [0, 0, 0]),
    labelAt(name, 0.064, 0.038, [0, 0.078, 0.014]),
  );
}

export function sauceBottle(color: number, name: string): THREE.Group {
  const glass = standard(color, { roughness: 0.2, metalness: 0.08 });
  const cap = standard(0xf4f1ea, { roughness: 0.32, metalness: 0.28 });
  const bodyR = 0.034;
  return assemble(
    part(cylinder(bodyR, bodyR, 0.082, 24), glass, [0, 0.041, 0]),
    part(cylinder(0.016, bodyR, 0.022, 24), glass, [0, 0.093, 0]),
    part(cylinder(0.011, 0.014, 0.03, 16), glass, [0, 0.119, 0]),
    part(cylinder(0.013, 0.013, 0.006, 16), glass, [0, 0.137, 0]),
    part(cylinder(0.014, 0.015, 0.012, 20), cap, [0, 0.146, 0]),
    labelAt(name, 0.052, 0.034, [0, 0.044, bodyR + 0.001]),
  );
}

export function mealTray(color: number, name: string): THREE.Group {
  const film = standard(0xdbeafe, {
    transparent: true,
    opacity: 0.32,
    roughness: 0.08,
  });
  return assemble(
    part(box(0.128, 0.016, 0.088), standard(0x1c1c1c), [0, 0.008, 0]),
    part(box(0.136, 0.006, 0.096), standard(0x2a2a2a), [0, 0.016, 0]),
    part(box(0.068, 0.008, 0.07), standard(color), [-0.022, 0.014, 0]),
    part(box(0.04, 0.008, 0.032), standard(0x588157), [0.036, 0.014, -0.016]),
    part(box(0.04, 0.008, 0.028), standard(0xe9c46a), [0.036, 0.014, 0.018]),
    part(box(0.124, 0.002, 0.084), film, [0, 0.021, 0]),
    labelAt(name, 0.1, 0.046, [0, 0.042, 0.05]),
  );
}

export function plantPack(color: number, name: string): THREE.Group {
  const tray = standard(0xd5e0da, {
    roughness: 0.28,
    transparent: true,
    opacity: 0.5,
  });
  return assemble(
    part(box(0.096, 0.032, 0.062), tray, [0, 0.016, 0]),
    part(box(0.076, 0.022, 0.046), standard(0xf7f4ec), [0, 0.017, 0]),
    part(box(0.096, 0.004, 0.062), standard(color), [0, 0.034, 0]),
    labelAt(name, 0.08, 0.04, [0, 0.048, 0.032]),
  );
}

export function proteinTub(color: number, name: string): THREE.Group {
  const tub = standard(color, { roughness: 0.4 });
  const lid = standard(0x13293d, { roughness: 0.34 });
  return assemble(
    part(cylinder(0.046, 0.05, 0.1, 24), tub, [0, 0.05, 0]),
    part(cylinder(0.0475, 0.0515, 0.046, 24), standard(0xf1faee), [0, 0.05, 0]),
    part(cylinder(0.054, 0.054, 0.016, 24), lid, [0, 0.108, 0]),
    labelAt(name, 0.068, 0.04, [0, 0.052, 0.053]),
  );
}
