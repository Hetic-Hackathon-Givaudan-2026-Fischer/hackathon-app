// Emballages en carton ou en film : bonbons, tablettes, biscuits, céréales.
import type * as THREE from 'three';
import { standard } from '../materials';
import { assemble, box, labelAt, part } from './parts';

export function candy(color: number, name: string): THREE.Group {
  const film = standard(color, { roughness: 0.4 });
  const seal = standard(0xf7f4ee, { roughness: 0.5 });
  return assemble(
    part(box(0.078, 0.096, 0.024), film, [0, 0.048, 0]),
    part(box(0.078, 0.008, 0.008), seal, [0, 0.098, 0]),
    labelAt(name, 0.068, 0.04, [0, 0.046, 0.013]),
  );
}

export function chocolateBar(color: number, name: string): THREE.Group {
  const wrapper = standard(color, { roughness: 0.34, metalness: 0.08 });
  return assemble(
    part(box(0.08, 0.118, 0.016), wrapper, [0, 0.059, 0]),
    labelAt(name, 0.072, 0.042, [0, 0.06, 0.009]),
  );
}

export function biscuitPack(color: number, name: string): THREE.Group {
  return assemble(
    part(box(0.104, 0.056, 0.032), standard(color), [0, 0.028, 0]),
    labelAt(name, 0.092, 0.042, [0, 0.028, 0.017]),
  );
}

export function cerealBox(color: number, name: string): THREE.Group {
  const carton = standard(color);
  return assemble(
    part(box(0.092, 0.152, 0.036), carton, [0, 0.076, 0]),
    part(box(0.092, 0.006, 0.036), carton, [0, 0.155, 0]),
    labelAt(name, 0.082, 0.048, [0, 0.082, 0.019]),
  );
}
