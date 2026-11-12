// Point d'entrée du moteur 3D : assemble la scène, les contrôles, la visée et
// la boucle de rendu. React ne voit que `createExperience` et ses événements.
import * as THREE from 'three';
import { categoryOf, createAim, inRange, scannable, type Aim } from './aim';
import { createControls, type WalkControls } from './controls';
import { createFocus, type Focus } from './focus';
import { startLoop, type FrameFn } from './loop';
import { createMarket } from './scene/market';
import { createNature } from './scene/nature';
import { createGear } from './scene/scanner';
import { createStage, HAND_LAYER, type Stage } from './stage';
import type { Gear, Market } from './types';

/** Mélange de vue à partir duquel on considère la tablette « lue ». */
const READING_BLEND = 0.4;
const MOVE_EPSILON_SQ = 1e-7;

export interface ExperienceEvents {
  /** Souris verrouillée (visite en cours) ou non (écran d'accueil). */
  onPlayingChange(playing: boolean): void;
  /** Tablette levée devant les yeux : le viseur s'efface. */
  onReadingChange(reading: boolean): void;
}

export interface Experience {
  dispose(): void;
}

interface World {
  stage: Stage;
  market: Market;
  walk: WalkControls;
  gear: Gear;
  aim: Aim;
  focus: Focus;
}

/** Émet seulement quand la valeur change (évite un setState par image). */
function onChange(emit: (value: boolean) => void): (value: boolean) => void {
  let last: boolean | undefined;
  return (value) => {
    if (value === last) return;
    last = value;
    emit(value);
  };
}

/** Le scanner suit la caméra ; les lumières éclairent aussi le calque 1. */
function mountGear({ scene, camera }: Stage): Gear {
  const gear = createGear();
  scene.add(camera);
  camera.add(gear.object);
  scene.add(gear.beam);
  gear.object.visible = false;
  scene.traverse((object) => {
    if (object instanceof THREE.Light) object.layers.enable(HAND_LAYER);
  });
  return gear;
}

function buildWorld(container: HTMLElement): World {
  const stage = createStage(container);
  createNature(stage.scene);
  const market = createMarket(stage.scene);
  const walk = createControls(stage.camera, stage.canvas, market.colliders);
  const gear = mountGear(stage);
  const aim = createAim(stage.camera, market.productMeshes);
  const focus = createFocus(stage.camera, walk.controls);
  return { stage, market, walk, gear, aim, focus };
}

/** Clic en visite : range la tablette, ou scanne le produit visé. */
function scan({ aim, focus, gear, market }: World) {
  if (focus.engaged) {
    focus.release();
    return;
  }
  const hit = aim.target();
  if (!inRange(hit)) {
    gear.deny();
    return;
  }
  const category = categoryOf(hit.object);
  if (!category) return;
  focus.begin();
  gear.show(category.name, category.blurb);
  gear.fire(aim.surfacePoint(market.group));
}

function createFrame(world: World, setReading: (v: boolean) => void): FrameFn {
  const { stage, market, walk, gear, aim, focus } = world;
  const { camera } = stage;
  const lastPosition = camera.position.clone();
  return (dt, time) => {
    walk.update(dt);
    market.updateDoors(camera.position, dt);
    market.updateSpotlights(time);
    const moving =
      camera.position.distanceToSquared(lastPosition) > MOVE_EPSILON_SQ;
    lastPosition.copy(camera.position);
    const blend = focus.update(dt);
    setReading(blend > READING_BLEND);
    camera.updateMatrixWorld(true);
    const aiming = walk.controls.isLocked && focus.level === 0;
    const ready = aiming && scannable(aim.target());
    gear.update(dt, time, ready, moving, blend);
    stage.render(gear.object.visible);
  };
}

/** Entrée / sortie de visite (verrouillage de la souris). */
function sessionHandlers(
  world: World,
  events: ExperienceEvents,
  setReading: (v: boolean) => void,
) {
  const onLock = () => {
    events.onPlayingChange(true);
    world.gear.object.visible = true;
  };
  const onUnlock = () => {
    events.onPlayingChange(false);
    world.gear.object.visible = false;
    world.focus.reset();
    setReading(false);
  };
  return { onLock, onUnlock };
}

function bindInput(
  world: World,
  events: ExperienceEvents,
  setReading: (v: boolean) => void,
) {
  const { controls } = world.walk;
  const { canvas } = world.stage;
  const { onLock, onUnlock } = sessionHandlers(world, events, setReading);
  const lock = () => {
    if (!controls.isLocked) controls.lock();
  };
  const pick = (event: MouseEvent) => {
    if (event.button === 0 && controls.isLocked) scan(world);
  };
  controls.addEventListener('lock', onLock);
  controls.addEventListener('unlock', onUnlock);
  canvas.addEventListener('click', lock);
  document.addEventListener('mousedown', pick);
  return () => {
    controls.removeEventListener('lock', onLock);
    controls.removeEventListener('unlock', onUnlock);
    canvas.removeEventListener('click', lock);
    document.removeEventListener('mousedown', pick);
  };
}

/** Raccourci de debug (captures d'écran depuis la console), en dev seulement. */
function exposeForDebug({ camera, scene }: Stage) {
  if (import.meta.env.DEV)
    Object.assign(globalThis, { __shot: { camera, scene } });
}

export function createExperience(
  container: HTMLElement,
  events: ExperienceEvents,
): Experience {
  const world = buildWorld(container);
  const setReading = onChange(events.onReadingChange);
  const unbind = bindInput(world, events, setReading);
  const stopLoop = startLoop(createFrame(world, setReading));
  exposeForDebug(world.stage);
  const dispose = () => {
    stopLoop();
    unbind();
    world.walk.dispose();
    world.stage.dispose();
  };
  return { dispose };
}
