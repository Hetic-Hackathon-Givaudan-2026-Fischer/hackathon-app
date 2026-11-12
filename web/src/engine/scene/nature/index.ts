// Paysage autour du magasin : ciel, lumières, terrain et végétation.
import * as THREE from 'three';
import { addClouds, addFlowers, addRocks } from './decor';
import { addGrass } from './grass';
import { addHills, addTerrain } from './terrain';
import { addBushes, addPines, addTrees } from './trees';

function addSkyAndLights(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x8ec8ea);
  scene.fog = new THREE.FogExp2(0xc5d5df, 0.006);
  scene.add(new THREE.HemisphereLight(0xd8edff, 0x5d7a42, 1));
  const sun = new THREE.DirectionalLight(0xfff3d1, 1.35);
  sun.position.set(32, 48, 16);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xf0e6c8, 0.45));
}

/** Habille la scène ; l'ordre d'ajout est celui du prototype. */
export function createNature(scene: THREE.Scene): void {
  addSkyAndLights(scene);
  addTerrain(scene);
  addHills(scene);
  addTrees(scene);
  addPines(scene);
  addBushes(scene);
  addGrass(scene);
  addFlowers(scene);
  addRocks(scene);
  addClouds(scene);
}
