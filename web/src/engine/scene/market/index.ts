// Le magasin : bâtiment, rayons stockés, signalétique et pupitre d'accueil.
import * as THREE from 'three';
import { pulseSpotlights } from '../products';
import type { Market } from '../../types';
import type { BuildContext } from './context';
import { addCeiling } from './ceiling';
import { slideDoors } from './doors';
import { addAisles, addColdWall } from './fixtures';
import { createMaterials } from './materials';
import { layoutPlan } from './plan';
import { addMural } from './posters';
import { addShell } from './shell';
import { addBlades, addSlogan } from './signage';
import { addWelcomeBoard } from './welcome';

function createContext(): BuildContext {
  return {
    plan: layoutPlan(),
    group: new THREE.Group(),
    productMeshes: [],
    colliders: [],
    materials: createMaterials(),
    doors: [],
    spotlights: [],
  };
}

/** Construit le magasin dans `scene` ; l'ordre d'ajout fixe l'ordre de rendu. */
export function createMarket(scene: THREE.Scene): Market {
  const ctx = createContext();
  addShell(ctx);
  addCeiling(ctx);
  addColdWall(ctx);
  addAisles(ctx);
  addBlades(ctx);
  addMural(ctx);
  addSlogan(ctx);
  addWelcomeBoard(ctx);
  scene.add(ctx.group);
  return {
    group: ctx.group,
    productMeshes: ctx.productMeshes,
    colliders: ctx.colliders,
    updateDoors: (position, dt) => slideDoors(ctx.doors, position, dt),
    updateSpotlights: (time) => pulseSpotlights(ctx.spotlights, time),
  };
}
