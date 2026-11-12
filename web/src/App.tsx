import { useCallback, useState } from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { InternalImmersive } from './components/immersive/InternalImmersive';

/**
 * Interface interne : on arrive dans le magasin. Le dashboard reste monté
 * (filtres conservés) et se rouvre avec Tab ; le moteur 3D n'existe que
 * pendant la visite.
 */
export function App() {
  const [immersive, setImmersive] = useState(true);
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
