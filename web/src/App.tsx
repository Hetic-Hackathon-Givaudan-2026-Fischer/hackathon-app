import { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair } from './components/Crosshair';
import { Dashboard } from './components/Dashboard';
import { Overlay } from './components/Overlay';
import { useExperience } from './hooks/useExperience';

export function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const { playing, reading, enter, exit } = useExperience(stageRef);
  const [initialLaunch, setInitialLaunch] = useState(true);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const handleStartGame = useCallback(() => {
    setInitialLaunch(false);
    setDashboardOpen(false);
    enter();
  }, [enter]);

  const handleOpenDashboard = useCallback(() => {
    setInitialLaunch(false);
    exit();
    setDashboardOpen(true);
  }, [exit]);

  // Raccourci clavier [Tab] pour passer directement du jeu 3D vers la vue Dashboard
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Tab' && event.key !== 'Tab') return;
      if (dashboardOpen) return;
      event.preventDefault();
      handleOpenDashboard();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dashboardOpen, handleOpenDashboard]);

  return (
    <>
      <div ref={stageRef} className="size-full" />
      <div
        className={`pointer-events-none fixed inset-0 z-10 ${
          dashboardOpen ? 'hidden' : ''
        }`}
      >
        <Overlay
          playing={playing}
          initialLaunch={initialLaunch}
          onStartGame={handleStartGame}
          onOpenDashboard={handleOpenDashboard}
        />
        <Crosshair visible={playing && !reading} />
      </div>
      <div className={dashboardOpen ? 'block' : 'hidden'}>
        <Dashboard onEnter3D={handleStartGame} />
      </div>
    </>
  );
}
