import { useCallback, useRef, type ReactNode } from 'react';
import type { ShelfStock } from '../../engine/experience';
import { useExperience, type DescribeProduct } from '../../hooks/useExperience';
import { useWindowKey } from '../../hooks/useWindowKey';
import { Crosshair } from '../Crosshair';
import { Overlay } from '../Overlay';

interface ImmersiveViewProps {
  /** Fiche de l'arôme porté par le produit scanné. */
  describe: DescribeProduct;
  /** Arômes à imprimer, déjà filtrés par type de produit. */
  stock: ShelfStock;
  /** Retour au dashboard (touche Tab) ; absent côté showroom client. */
  onBack?: () => void;
  /** Bandeau au-dessus de la scène (ex. client du showroom). */
  children?: ReactNode;
}

/** Magasin 3D : monté à l'entrée dans la vue, libéré (`dispose`) en la quittant. */
export function ImmersiveView({
  describe,
  stock,
  onBack,
  children,
}: ImmersiveViewProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { playing, reading, exit } = useExperience(stageRef, describe, stock);

  const back = useCallback(() => {
    exit();
    onBack?.();
  }, [exit, onBack]);

  useWindowKey('Tab', onBack ? back : undefined, true);

  return (
    <div className="fixed inset-0 bg-ink">
      <div ref={stageRef} className="size-full" />
      <div className="pointer-events-none fixed inset-0 z-10">
        <Overlay playing={playing} onBack={onBack ? back : undefined} />
        <Crosshair visible={playing && !reading} />
      </div>
      {children}
    </div>
  );
}
