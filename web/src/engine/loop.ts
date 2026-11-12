import * as THREE from 'three';

/** Pas de temps maximal : évite les sauts après un onglet en arrière-plan. */
const MAX_DT = 0.05;

export type FrameFn = (dt: number, time: number) => void;

/** Lance la boucle d'animation ; la fonction rendue l'arrête. */
export function startLoop(frame: FrameFn): () => void {
  const clock = new THREE.Clock();
  let handle = 0;
  const tick = () => {
    const dt = Math.min(clock.getDelta(), MAX_DT);
    frame(dt, clock.elapsedTime);
    handle = requestAnimationFrame(tick);
  };
  tick();
  return () => cancelAnimationFrame(handle);
}
