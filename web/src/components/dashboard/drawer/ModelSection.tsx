import type { ReactNode } from 'react';
import type { TrendDetailRead } from '../../../api/types';
import { MISSING } from '../../../lib/format';
import { ScoreGauge } from '../ScoreGauge';
import { EYEBROW } from '../ui';

/** Résultat du modèle Data/IA ; en repli CSV, dit clairement qu'il n'y en a pas. */
export function ModelSection({ trend }: { trend: TrendDetailRead }) {
  if (trend.origin === 'csv_fallback') {
    return (
      <section className="rounded-[8px] border border-dashed border-[#D4D4D8] p-4 text-[13px] text-[#3F3F46]">
        <h3 className="font-medium text-[#18181B]">Modèle non appliqué</h3>
        <p className="mt-1">
          Les données viennent du CSV de repli : indicateurs bruts, sans statut,
          score, verdict ni niveau de confiance.
        </p>
      </section>
    );
  }
  const facts: Array<[string, ReactNode]> = [
    ['Score V2 (pérennité)', <ScoreGauge key="score" score={trend.score} />],
    ['Verdict règle V1', trend.v1_verdict ?? MISSING],
    ['Confiance', trend.confidence ?? MISSING],
    // Rayon selon Data/IA : le magasin 3D, lui, regroupe par familles
    ['Rayon (Data/IA)', trend.aisle ?? MISSING],
  ];
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {facts.map(([label, value]) => (
        <div
          key={label}
          className="rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA] p-3"
        >
          <div className={EYEBROW}>{label}</div>
          <div className="mt-1 text-[14px] font-semibold">{value}</div>
        </div>
      ))}
    </section>
  );
}
