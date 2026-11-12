import type {
  ProductShareRead,
  TrendAnalysisRead,
  TrendDetailRead,
} from '../../../api/types';
import {
  ANALYSIS_STATUS_LABELS,
  CONFIDENCE_LABELS,
  MISSING,
  formatShare,
} from '../../../lib/format';
import { EYEBROW } from '../ui';

/** Indicateurs métier et types de produits : fournis par Data/IA seulement. */
export function AnalysisSection({ trend }: { trend: TrendDetailRead }) {
  if (!trend.analysis && trend.product_types.length === 0) return null;
  return (
    <section className="space-y-3 rounded-[8px] border border-[#E5E7EB] p-4">
      {trend.analysis && <AnalysisFacts analysis={trend.analysis} />}
      {trend.product_types.length > 0 && (
        <ProductTypes
          shares={trend.product_types}
          main={trend.main_product_type}
        />
      )}
    </section>
  );
}

function AnalysisFacts({ analysis }: { analysis: TrendAnalysisRead }) {
  const facts: Array<[string, string]> = [
    ['Buzz (bêta)', scoreText(analysis.buzz_score)],
    ['Dynamique (bêta)', scoreText(analysis.trend_score)],
    ['Confiance', CONFIDENCE_LABELS[analysis.confidence]],
  ];
  return (
    <div>
      <h3 className="text-[15px] font-medium">
        Analyse Data/IA : {ANALYSIS_STATUS_LABELS[analysis.status]}
      </h3>
      <p className="mt-1 text-[13px] text-[#3F3F46]">{analysis.reason}</p>
      <dl className="mt-3 grid grid-cols-3 gap-3">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded-[6px] bg-[#FAFAFA] p-2.5">
            <dt className={EYEBROW}>{label}</dt>
            <dd className="mt-1 text-[14px] font-semibold tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const scoreText = (score: number | null) =>
  score === null ? MISSING : `${score}/100`;

interface ProductTypesProps {
  shares: ProductShareRead[];
  main: string | null;
}

/** Part des produits par type ; « déduit » : aucun produit, type de la famille. */
function ProductTypes({ shares, main }: ProductTypesProps) {
  return (
    <div>
      <h3 className={EYEBROW}>Types de produits</h3>
      <ul className="mt-2 flex flex-wrap gap-2 text-[12px]">
        {shares.map((share) => (
          <li
            key={share.id}
            className={`rounded-full px-2.5 py-1 ${share.id === main ? 'bg-[#E6F2F1] font-medium text-[#008075]' : 'bg-[#F4F4F5] text-[#3F3F46]'}`}
          >
            {share.label} · {shareText(share)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function shareText(share: ProductShareRead): string {
  if (share.share === null) return 'déduit de la famille';
  return `${formatShare(share.share)} (${share.products} produits)`;
}
