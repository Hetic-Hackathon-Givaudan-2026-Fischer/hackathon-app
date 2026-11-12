// Sol neutre et éclairage studio autour du magasin.
import * as THREE from 'three';

function addSkyAndLights(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0xf2f2f2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.05);
  sun.position.set(18, 32, 12);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
}

function addFloor(scene: THREE.Scene): void {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.96,
      metalness: 0,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.16;
  scene.add(floor);
}

/** Habille la scène d'un fond clair, sans végétation. */
export function createNature(scene: THREE.Scene): void {
  addSkyAndLights(scene);
  addFloor(scene);
}
