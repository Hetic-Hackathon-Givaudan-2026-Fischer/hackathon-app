import { useRef } from 'react';
import { Crosshair } from './components/Crosshair';
import { Overlay } from './components/Overlay';
import { useExperience } from './hooks/useExperience';

export function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const { playing, reading } = useExperience(stageRef);

  return (
    <>
      <div ref={stageRef} className="size-full" />
      <div className="pointer-events-none fixed inset-0 z-10">
        <Overlay hidden={playing} />
        <Crosshair visible={playing && !reading} />
      </div>
    </>
  );
}
