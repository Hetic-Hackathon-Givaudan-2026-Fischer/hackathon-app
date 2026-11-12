import type { TrendDetailRead } from '../../../api/types';
import { formatDate } from '../../../lib/format';
import { SeriesChart } from './SeriesChart';

/** Lien externe Data/IA : http(s) seulement, sinon pas de lien. */
function safeUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:' ? url : undefined;
  } catch {
    return undefined;
  }
}

/** Série, points de vigilance et sources citées : fournis par Data/IA seulement. */
export function SignalsSection({ trend }: { trend: TrendDetailRead }) {
  if (trend.origin === 'csv_fallback') return null;
  return (
    <>
      {trend.series.length > 0 && (
        <section>
          <h3 className="mb-2 text-[15px] font-medium">
            Recherches Google mondiales (par semaine)
          </h3>
          <SeriesChart points={trend.series} />
        </section>
      )}
      {trend.watch_points.length > 0 && (
        <section className="rounded-[8px] bg-[#FFFBEB] p-4">
          <h3 className="mb-2 text-[12px] font-semibold tracking-[0.05em] text-[#B45309] uppercase">
            Points de vigilance
          </h3>
          <ul className="list-disc space-y-1 pl-4 text-[13px] text-[#3F3F46]">
            {trend.watch_points.map((point, index) => (
              <li key={`${index}-${point}`}>{point}</li>
            ))}
          </ul>
        </section>
      )}
      {trend.evidence.length > 0 && (
        <section>
          <h3 className="mb-2 text-[15px] font-medium">Sources citées</h3>
          <ul className="space-y-2 text-[13px]">
            {trend.evidence.map((item, index) => (
              <li key={`${index}-${item.url ?? item.title}`}>
                <a
                  href={safeUrl(item.url)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[#008075] hover:underline"
                >
                  {item.title ?? `Source ${item.source}`}
                </a>
                <span className="block text-[11px] text-[#71717A]">
                  {item.source} · {formatDate(item.published)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
