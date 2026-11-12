import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  useExperience,
  type DescribeCategory,
} from '../../hooks/useExperience';
import { useWindowKey } from '../../hooks/useWindowKey';
import { Crosshair } from '../Crosshair';
import { Overlay } from '../Overlay';

interface ImmersiveViewProps {
  /** Fiche d'un rayon scanné (données de l'API). */
  describe: DescribeCategory;
  /** Retour au dashboard (touche Tab) ; absent côté showroom client. */
  onBack?: () => void;
  /** Bandeau au-dessus de la scène (ex. client du showroom). */
  children?: ReactNode;
}

/** Magasin 3D : monté à l'entrée dans la vue, libéré (`dispose`) en la quittant. */
export function ImmersiveView({
  describe,
  onBack,
  children,
}: ImmersiveViewProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { playing, reading, enter, exit } = useExperience(stageRef, describe);
  const [started, setStarted] = useState(false);

  const start = useCallback(() => {
    setStarted(true);
    enter();
  }, [enter]);

  const back = useCallback(() => {
    exit();
    onBack?.();
  }, [exit, onBack]);

  // Tab ne quitte la 3D qu'une fois la visite commencée : sur l'accueil, il
  // garde son rôle (passer d'un bouton à l'autre)
  useWindowKey('Tab', onBack ? back : undefined, started);

  return (
    <div className="fixed inset-0 bg-ink">
      <div ref={stageRef} className="size-full" />
      <div className="pointer-events-none fixed inset-0 z-10">
        <Overlay
          playing={playing}
          started={started}
          onStart={start}
          onBack={onBack ? back : undefined}
        />
        <Crosshair visible={playing && !reading} />
      </div>
      {children}
    </div>
  );
}
