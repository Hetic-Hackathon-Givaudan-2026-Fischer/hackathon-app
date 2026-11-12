import { GROWTH_INDICATOR, type DashboardSummaryRead } from '../../api/types';
import { formatCount, formatIndicator, familyLabel } from '../../lib/format';
import { ErrorState, LoadingState } from './states';
import { CARD, EYEBROW } from './ui';
import type { Resource } from '../../hooks/useApiResource';

interface Kpi {
  label: string;
  value: string;
  detail: string;
  accent: string;
}

function sumOf(totals: Record<string, number>, keys: string[]): number {
  return keys.reduce((sum, key) => sum + (totals[key] ?? 0), 0);
}

/** KPI calculés par l'API (`/dashboard/summary`), quelle que soit l'origine. */
function kpisOf(summary: DashboardSummaryRead): Kpi[] {
  const { totals } = summary;
  const scored = summary.scored_count > 0;
  return [
    {
      label: 'Arômes suivis',
      value: formatCount(summary.trend_count),
      detail: `${summary.family_count} familles`,
      accent: '#008075',
    },
    {
      label: 'Arômes notés par le modèle',
      value: scored ? formatCount(summary.scored_count) : 'Non calculé',
      detail: scored
        ? `sur ${summary.trend_count} arômes`
        : 'Repli CSV : aucun modèle appliqué',
      accent: '#C29B38',
    },
    {
      label: 'Produits en rayon',
      value: formatCount(totals.produits_total ?? 0),
      detail: 'Open Food Facts, cumul',
      accent: '#C86D51',
    },
    {
      label: 'Mentions sur 30 jours',
      value: formatCount(
        sumOf(totals, ['mentions_presse_30j', 'mentions_reseaux_30j']),
      ),
      detail: 'Presse et réseaux sociaux',
      accent: '#78608D',
    },
  ];
}

export function KpiCards({
  summary,
}: {
  summary: Resource<DashboardSummaryRead>;
}) {
  if (summary.error)
    return (
      <section className={CARD}>
        <ErrorState error={summary.error} onRetry={summary.reload} />
      </section>
    );
  if (!summary.data)
    return (
      <section className={CARD}>
        <LoadingState label="Calcul des KPI…" />
      </section>
    );
  return (
    <section
      aria-label="Indicateurs clés"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {kpisOf(summary.data).map((kpi) => (
        <article
          key={kpi.label}
          style={{ borderTopColor: kpi.accent }}
          className={`${CARD} border-t-[3px] p-5`}
        >
          <span className={EYEBROW}>{kpi.label}</span>
          <div className="mt-2 text-[28px] leading-[1.2] font-semibold text-[#18181B]">
            {kpi.value}
          </div>
          <span className="mt-1 block text-[12px] text-[#3F3F46]">
            {kpi.detail}
          </span>
        </article>
      ))}
    </section>
  );
}

/** Les arômes à la plus forte croissance relative sur 12 mois. */
export function TopGrowing({
  summary,
  onSelect,
}: {
  summary: DashboardSummaryRead | undefined;
  onSelect: (id: string) => void;
}) {
  if (!summary || summary.top_growing.length === 0) return null;
  return (
    <section aria-labelledby="top-growing" className={`${CARD} p-5`}>
      <h2 id="top-growing" className={EYEBROW}>
        Plus fortes croissances (Wikipédia, 12 mois relative)
      </h2>
      <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {summary.top_growing.map((trend, index) => (
          <li key={trend.id}>
            <button
              type="button"
              onClick={() => onSelect(trend.id)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-[6px] border border-[#E5E7EB] bg-[#FAFAFA] p-3 text-left transition hover:border-[#008075]"
            >
              <span className="text-[18px] font-semibold text-[#A1A1AA]">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-[#18181B]">
                  {trend.name}
                </span>
                <span className="block truncate text-[11px] text-[#71717A]">
                  {familyLabel(trend.family)}
                </span>
              </span>
              <span className="text-[13px] font-semibold text-[#047857]">
                {formatIndicator(
                  GROWTH_INDICATOR,
                  trend.indicators[GROWTH_INDICATOR],
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
