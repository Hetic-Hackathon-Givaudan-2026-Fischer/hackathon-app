// Score de pérennité du modèle V2 (0 à 100), ou « non calculé ».

function scoreColor(score: number): string {
  if (score >= 70) return '#008075';
  if (score >= 40) return '#C29B38';
  return '#C86D51';
}

export function ScoreGauge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span
        title="Pas de score : modèle non appliqué"
        className="text-[12px] text-[#A1A1AA]"
      >
        Non calculé
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2" title={`Score V2 : ${score}/100`}>
      <span className="w-7 text-[13px] font-semibold text-[#18181B] tabular-nums">
        {Math.round(score)}
      </span>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-[#F4F4F5]">
        <span
          className="block h-full rounded-full"
          style={{
            width: `${Math.min(score, 100)}%`,
            backgroundColor: scoreColor(score),
          }}
        />
      </span>
    </span>
  );
}
