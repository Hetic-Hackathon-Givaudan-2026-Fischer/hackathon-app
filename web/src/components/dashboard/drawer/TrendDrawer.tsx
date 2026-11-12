import type { TrendDetailRead } from '../../../api/types';
import { useTrend, useTrendReport } from '../../../hooks/useTrendsApi';
import { ORIGIN_LABELS, familyLabel, formatDate } from '../../../lib/format';
import { Modal } from '../Modal';
import { ErrorState, LoadingState } from '../states';
import { StatusBadge } from '../StatusBadge';
import { BUTTON_SECONDARY, EYEBROW } from '../ui';
import { AnalysisSection } from './AnalysisSection';
import { IndicatorSources } from './IndicatorSources';
import { IssueForm } from './IssueForm';
import { ModelSection } from './ModelSection';
import { SignalsSection } from './SignalsSection';

interface TrendDrawerProps {
  trendId: string;
  /** Dashboard visible : sinon (3D ouverte), Échap ne ferme pas la fiche. */
  active: boolean;
  onClose: () => void;
  onEnter3D: () => void;
}

/** Fiche d'un arôme : `/trends/{id}` (modèle, série) + `/report/trends/{id}` (sources). */
export function TrendDrawer(props: TrendDrawerProps) {
  const { trendId, active, onClose, onEnter3D } = props;
  const trend = useTrend(trendId);
  const report = useTrendReport(trendId);
  const detail = trend.loading ? undefined : trend.data;

  return (
    <Modal
      placement="end"
      active={active}
      onDismiss={onClose}
      label={detail ? `Fiche ${detail.name}` : 'Fiche arôme'}
      className="flex h-full w-[680px] max-w-full flex-col overflow-hidden border-l border-[#E5E7EB] bg-white text-[#18181B]"
    >
      <DrawerHeader detail={detail} onClose={onClose} onEnter3D={onEnter3D} />
      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        {trend.error && (
          <ErrorState error={trend.error} onRetry={trend.reload} />
        )}
        {!detail && !trend.error && (
          <LoadingState label="Chargement de la fiche…" />
        )}
        {detail && (
          <>
            <p className="text-[12px] text-[#71717A]">
              Origine : {ORIGIN_LABELS[detail.origin]} · données du{' '}
              {formatDate(detail.data_date)}
            </p>
            <ModelSection trend={detail} />
            <AnalysisSection trend={detail} />
            <IndicatorSources report={report} />
            <SignalsSection trend={detail} />
            <IssueForm trendId={detail.id} trendName={detail.name} />
          </>
        )}
      </div>
    </Modal>
  );
}

interface DrawerHeaderProps {
  detail: TrendDetailRead | undefined;
  onClose: () => void;
  onEnter3D: () => void;
}

function DrawerHeader({ detail, onClose, onEnter3D }: DrawerHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] bg-[#FAFAFA] px-6 py-5">
      <div className="min-w-0">
        <span className={`${EYEBROW} text-[#008075]`}>Fiche arôme</span>
        <h2 className="mt-1 truncate text-[22px] font-semibold">
          {detail?.name ?? '…'}
        </h2>
        {detail && (
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#3F3F46]">
            {familyLabel(detail.family)} <StatusBadge status={detail.status} />
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onEnter3D} className={BUTTON_SECONDARY}>
          Voir en 3D
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fiche"
          className={BUTTON_SECONDARY}
        >
          ✕
        </button>
      </div>
    </header>
  );
}
