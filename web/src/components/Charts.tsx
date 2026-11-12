import type { QuickStatCard, TimeSeriesPoint } from '../types';

/**
 * Courbe sparkline SVG alignée sur la Direction Artistique Givaudan
 * (#008075 Givaudan Teal & #C86D51 Terracotta).
 */
export function Sparkline({ card }: { card: QuickStatCard }) {
  const strokeColor = card.dotColor === 'pink' ? '#C86D51' : '#008075';
  const dotRing = card.dotColor === 'pink' ? '#F9E8E2' : '#E6F2F1';
  const gradId = `spark-grad-${card.id}`;

  return (
    <svg
      className="h-[72px] w-[156px] shrink-0 overflow-visible"
      viewBox="0 0 180 86"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d="M 8 54 C 20 56, 26 70, 38 69 C 52 68, 60 44, 72 44 C 84 44, 92 22, 102 22 C 112 22, 120 42, 132 42 C 144 42, 152 24, 160 28 C 168 32, 173 54, 176 68 L 176 82 L 8 82 Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M 8 54 C 20 56, 26 70, 38 69 C 52 68, 60 44, 72 44 C 84 44, 92 22, 102 22 C 112 22, 120 42, 132 42 C 144 42, 152 24, 160 28 C 168 32, 173 54, 176 68"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="102" cy="22" r="6" fill={dotRing} />
      <circle cx="102" cy="22" r="3.8" fill={strokeColor} />
    </svg>
  );
}

/**
 * Graphique SVG de Backtesting historique (Observé #111111 vs Prédit MiroFish #008075)
 * et Forecasting (+12 mois), conforme au Design System Givaudan.
 */
export function BacktestChart({ series }: { series: TimeSeriesPoint[] }) {
  const width = 560;
  const height = 210;
  const padLeft = 42;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 34;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const allValues = series.flatMap((pt) => [
    pt.upperBound,
    pt.lowerBound,
    pt.predicted,
    ...(pt.observed !== undefined ? [pt.observed] : []),
  ]);
  const maxVal = Math.max(...allValues, 5) * 1.12;
  const minVal = 0;

  const xForIndex = (i: number): number =>
    padLeft + (i / Math.max(series.length - 1, 1)) * plotW;
  const yForValue = (v: number): number =>
    padTop + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

  const upperPoints = series
    .map(
      (pt, i) =>
        `${xForIndex(i).toFixed(1)},${yForValue(pt.upperBound).toFixed(1)}`,
    )
    .join(' L ');
  const lowerPoints = [...series]
    .reverse()
    .map((pt, revIdx) => {
      const i = series.length - 1 - revIdx;
      return `${xForIndex(i).toFixed(1)},${yForValue(pt.lowerBound).toFixed(1)}`;
    })
    .join(' L ');
  const confidencePolygon = `M ${upperPoints} L ${lowerPoints} Z`;

  const predictedPath = series
    .map(
      (pt, i) =>
        `${i === 0 ? 'M' : 'L'} ${xForIndex(i).toFixed(1)} ${yForValue(pt.predicted).toFixed(1)}`,
    )
    .join(' ');

  const observedPoints = series
    .map((pt, i) =>
      pt.observed !== undefined
        ? { x: xForIndex(i), y: yForValue(pt.observed), val: pt.observed }
        : null,
    )
    .filter(
      (item): item is { x: number; y: number; val: number } => item !== null,
    );

  const observedPath = observedPoints
    .map(
      (pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
    )
    .join(' ');

  const lastObservedIdx = series.reduce(
    (acc, pt, idx) => (pt.observed !== undefined ? idx : acc),
    0,
  );
  const splitX = xForIndex(lastObservedIdx);

  return (
    <svg
      className="block h-auto w-full"
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {[0, 0.5, 1].map((ratio) => {
        const val = minVal + ratio * (maxVal - minVal);
        const y = yForValue(val);
        return (
          <g key={ratio}>
            <line
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke="#E5E7EB"
              strokeDasharray="3 3"
            />
            <text
              x={padLeft - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#71717A"
            >
              {val.toFixed(1)}%
            </text>
          </g>
        );
      })}

      {/* Intervalle de confiance en Givaudan Teal léger */}
      <path d={confidencePolygon} fill="#008075" fillOpacity="0.12" />

      <line
        x1={splitX}
        y1={padTop}
        x2={splitX}
        y2={height - padBottom}
        stroke="#D4D4D8"
        strokeDasharray="4 4"
      />
      <text
        x={splitX - 6}
        y={padTop + 10}
        textAnchor="end"
        fontSize="9"
        fontWeight="600"
        fill="#71717A"
      >
        ← Backtesting observé
      </text>
      <text
        x={splitX + 6}
        y={padTop + 10}
        textAnchor="start"
        fontSize="9"
        fontWeight="600"
        fill="#008075"
      >
        Forecasting MiroFish →
      </text>

      {/* Courbe prédite MiroFish (#008075) */}
      <path
        d={predictedPath}
        stroke="#008075"
        strokeWidth="2.2"
        strokeDasharray="5 3"
        strokeLinecap="round"
      />
      {/* Courbe observée historique (#C86D51 Terracotta) */}
      <path
        d={observedPath}
        stroke="#C86D51"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {series.map((pt, i) => (
        <circle
          key={`pred-${pt.period}`}
          cx={xForIndex(i)}
          cy={yForValue(pt.predicted)}
          r="3.5"
          fill="#008075"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      ))}

      {observedPoints.map((pt, idx) => (
        <circle
          key={`obs-${idx}`}
          cx={pt.x}
          cy={pt.y}
          r="4"
          fill="#C86D51"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      ))}

      {series.map((pt, i) => (
        <text
          key={`lbl-${pt.period}`}
          x={xForIndex(i)}
          y={height - 10}
          textAnchor="middle"
          fontSize="10"
          fill="#71717A"
        >
          {pt.period}
        </text>
      ))}
    </svg>
  );
}
