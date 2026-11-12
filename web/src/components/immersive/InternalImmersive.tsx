import { useCallback, useMemo } from 'react';
import type { Category } from '../../engine/experience';
import { useAllTrends } from '../../hooks/useTrendsApi';
import { buildScanCard, fromTrendList } from '../../immersive/scanCard';
import { ImmersiveView } from './ImmersiveView';

/** Vue immersive interne, ouverte depuis le dashboard : tous les arômes. */
export function InternalImmersive({ onBack }: { onBack: () => void }) {
  const { data, error, reload } = useAllTrends();
  const scanData = useMemo(
    () => (data ? fromTrendList(data) : undefined),
    [data],
  );
  const describe = useCallback(
    (category: Category) => buildScanCard(category, { data: scanData, error }),
    [scanData, error],
  );
  return (
    <ImmersiveView describe={describe} onBack={onBack}>
      {error && (
        <p
          role="alert"
          className="fixed top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink/85 px-4 py-1.5 text-[12px] text-ivory"
        >
          Données d’arômes indisponibles : {error.message}
          <button
            type="button"
            onClick={reload}
            className="cursor-pointer underline"
          >
            Réessayer
          </button>
        </p>
      )}
    </ImmersiveView>
  );
}
