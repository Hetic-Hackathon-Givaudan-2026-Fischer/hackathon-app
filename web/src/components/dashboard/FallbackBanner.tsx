import type { Origin } from '../../api/types';
import { formatDate } from '../../lib/format';

interface FallbackBannerProps {
  origin: Origin | undefined;
  dataDate: string | null | undefined;
}

/** Mode dégradé (ADR 0008) : l'API sert le CSV, sans statut ni score. */
export function FallbackBanner({ origin, dataDate }: FallbackBannerProps) {
  if (origin !== 'csv_fallback') return null;
  return (
    <div
      role="status"
      className="rounded-[8px] border border-[#F5D9A8] bg-[#FFFBEB] px-4 py-3 text-[13px] text-[#92400E]"
    >
      <strong className="font-semibold">Mode dégradé :</strong> l'API Data/IA ne
      répond pas. Les données affichées sont les indicateurs bruts du CSV de
      repli{dataDate ? ` (${formatDate(dataDate)})` : ''}, sans modèle : statut
      et score ne sont pas calculés.
    </div>
  );
}
