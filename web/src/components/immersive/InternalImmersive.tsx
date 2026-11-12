import { useCallback, useMemo } from 'react';
import type { ScannedProduct } from '../../engine/experience';
import { useAllTrends, useDatasetReport } from '../../hooks/useTrendsApi';
import { buildScanCard, fromTrendList } from '../../immersive/scanCard';
import { shelfStock } from '../../immersive/shelfStock';
import { ImmersiveView } from './ImmersiveView';

/** Vue immersive interne, ouverte depuis le dashboard : tous les arômes. */
export function InternalImmersive({ onBack }: { onBack: () => void }) {
  const { data, error, reload } = useAllTrends();
  const report = useDatasetReport();
  const scanData = useMemo(
    () => (data ? fromTrendList(data) : undefined),
    [data],
  );
  const stock = useMemo(() => shelfStock(scanData?.trends ?? []), [scanData]);
  const describe = useCallback(
    (product: ScannedProduct) =>
      buildScanCard(
        product,
        { data: scanData, error },
        report.data?.indicators,
      ),
    [scanData, error, report.data],
  );
  return (
    <ImmersiveView describe={describe} stock={stock} onBack={onBack}>
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
