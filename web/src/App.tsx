import { useCallback, useState } from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { InternalImmersive } from './components/immersive/InternalImmersive';

/**
 * Interface interne : on arrive sur le dashboard ; la vue immersive ne
 * s'ouvre que depuis lui. Le dashboard reste monté (filtres conservés) ;
 * le moteur 3D, lui, n'existe que pendant la visite.
 */
export function App() {
  const [immersive, setImmersive] = useState(false);
  const openImmersive = useCallback(() => setImmersive(true), []);
  const closeImmersive = useCallback(() => setImmersive(false), []);

  return (
    <>
      <div hidden={immersive}>
        <Dashboard active={!immersive} onEnter3D={openImmersive} />
      </div>
      {immersive && <InternalImmersive onBack={closeImmersive} />}
    </>
  );
}
