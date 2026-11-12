import type {
  IndicatorSourceRead,
  QualityMetricRead,
  TrendReportRead,
} from '../../../api/types';
import type { Resource } from '../../../hooks/useApiResource';
import { formatIndicator, formatShare } from '../../../lib/format';
import { ErrorState, LoadingState } from '../states';

const QUALITY_TONES: Record<QualityMetricRead['status'], string> = {
  ok: 'text-[#047857]',
  warning: 'text-[#B45309]',
  error: 'text-[#B91C1C]',
};

function groupBySource(indicators: IndicatorSourceRead[]) {
  const groups = new Map<string, IndicatorSourceRead[]>();
  for (const indicator of indicators) {
    const group = groups.get(indicator.source_label) ?? [];
    groups.set(indicator.source_label, [...group, indicator]);
  }
  return [...groups.entries()];
}

/** Chaque indicateur rattaché à sa source, avec la qualité calculée par l'API. */
export function IndicatorSources({
  report,
}: {
  report: Resource<TrendReportRead>;
}) {
  if (report.error)
    return <ErrorState error={report.error} onRetry={report.reload} />;
  if (report.loading || !report.data)
    return <LoadingState label="Chargement des sources…" />;
  const { indicators, quality } = report.data;
  return (
    <section>
      <h3 className="mb-3 text-[15px] font-medium">Indicateurs par source</h3>
      <div className="space-y-3">
        {groupBySource(indicators).map(([source, items]) => (
          <SourceGroup key={source} source={source} items={items} />
        ))}
      </div>
      <QualityList quality={quality} />
    </section>
  );
}

function SourceGroup({
  source,
  items,
}: {
  source: string;
  items: IndicatorSourceRead[];
}) {
  return (
    <div className="rounded-[8px] border border-[#E5E7EB]">
      <div className="border-b border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-[12px] font-semibold">
        {source}
      </div>
      <dl className="divide-y divide-[#F4F4F5] text-[13px]">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex justify-between gap-3 px-3 py-1.5"
          >
            <dt className="text-[#3F3F46]">
              {item.label}{' '}
              <span className="text-[11px] text-[#A1A1AA]">
                · {item.period}
              </span>
            </dt>
            <dd className="font-medium tabular-nums">
              {formatIndicator(item.key, item.value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function QualityList({ quality }: { quality: QualityMetricRead[] }) {
  if (quality.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1 text-[12px]">
      {quality.map((metric) => (
        <li key={metric.key} className="flex justify-between gap-3">
          <span className="text-[#3F3F46]">{metric.label}</span>
          <span className={`font-medium ${QUALITY_TONES[metric.status]}`}>
            {formatShare(metric.value)} (seuil {formatShare(metric.threshold)})
          </span>
        </li>
      ))}
    </ul>
  );
}
