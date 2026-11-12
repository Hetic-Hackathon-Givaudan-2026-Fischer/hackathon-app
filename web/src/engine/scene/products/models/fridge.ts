// Produits des vitrines réfrigérées : pots, briques, canettes, glaces.
import * as THREE from 'three';
import { standard } from '../materials';
import { assemble, box, cylinder, labelAt, lyingRing, part } from './parts';

export function yogurtCup(color: number, name: string): THREE.Group {
  const cream = standard(0xf7f3ea);
  const foil = standard(0xc9cdd1, { metalness: 0.65, roughness: 0.22 });
  const tab = standard(0x78608d, { metalness: 0.45 });
  return assemble(
    part(cylinder(0.042, 0.036, 0.078, 20), standard(color), [0, 0.039, 0]),
    part(cylinder(0.044, 0.042, 0.006, 20), cream, [0, 0.076, 0]),
    lyingRing(new THREE.TorusGeometry(0.042, 0.003, 6, 18), cream, 0.078),
    part(cylinder(0.043, 0.043, 0.004, 20), foil, [0, 0.081, 0]),
    part(box(0.012, 0.002, 0.02), tab, [0.03, 0.083, 0]),
    labelAt(name, 0.064, 0.036, [0, 0.042, 0.043]),
  );
}

export function milkCarton(color: number, name: string): THREE.Group {
  const carton = standard(0xf6f3ec);
  const roofL = part(box(0.074, 0.002, 0.036), carton, [0, 0.142, 0.01]);
  const roofR = roofL.clone();
  roofR.position.z = -0.01;
  roofL.rotation.x = 0.85;
  roofR.rotation.x = -0.85;
  const cap = standard(color, { roughness: 0.3 });
  return assemble(
    part(box(0.072, 0.128, 0.05), carton, [0, 0.064, 0]),
    part(box(0.074, 0.04, 0.052), standard(color), [0, 0.074, 0]),
    roofL,
    roofR,
    part(cylinder(0.01, 0.01, 0.012, 10), cap, [0, 0.16, 0]),
    labelAt(name, 0.064, 0.04, [0, 0.072, 0.027]),
  );
}

export function sodaCan(color: number, name: string): THREE.Group {
  const body = standard(color, { roughness: 0.28, metalness: 0.35 });
  const neck = standard(0xd9dde1, { metalness: 0.7, roughness: 0.2 });
  const top = standard(0xcfd4d8, { metalness: 0.75, roughness: 0.18 });
  const rim = standard(0xe8eaed, { metalness: 0.8 });
  const tab = standard(0xd0d5da, { metalness: 0.8 });
  return assemble(
    part(cylinder(0.036, 0.036, 0.112, 24), body, [0, 0.056, 0]),
    part(cylinder(0.03, 0.036, 0.012, 20), neck, [0, 0.118, 0]),
    part(cylinder(0.03, 0.03, 0.004, 20), top, [0, 0.126, 0]),
    lyingRing(new THREE.TorusGeometry(0.03, 0.0025, 6, 20), rim, 0.126),
    part(box(0.012, 0.0015, 0.02), tab, [0, 0.129, 0.004]),
    labelAt(name, 0.056, 0.034, [0, 0.056, 0.037]),
  );
}

export function iceCreamTub(color: number, name: string): THREE.Group {
  const cream = standard(0xf8f4ea);
  const lid = standard(color, { roughness: 0.35 });
  return assemble(
    part(cylinder(0.052, 0.056, 0.078, 24), cream, [0, 0.039, 0]),
    part(cylinder(0.053, 0.057, 0.04, 24), standard(color), [0, 0.042, 0]),
    part(cylinder(0.058, 0.058, 0.01, 24), lid, [0, 0.083, 0]),
    part(cylinder(0.012, 0.014, 0.008, 10), cream, [0, 0.092, 0]),
    labelAt(name, 0.072, 0.038, [0, 0.042, 0.058]),
  );
}
