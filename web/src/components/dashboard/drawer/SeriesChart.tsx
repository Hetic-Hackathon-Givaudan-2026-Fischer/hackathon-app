// Courbe SVG maison (pas de lib de graphiques sans ADR).
import type { SeriesPointRead } from '../../../api/types';
import { formatDate } from '../../../lib/format';

const WIDTH = 600;
const HEIGHT = 180;
const PAD = { top: 12, right: 12, bottom: 24, left: 32 };

function scale(points: SeriesPointRead[]) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (i / Math.max(points.length - 1, 1)) * plotW;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  return { x, y, max };
}

export function SeriesChart({ points }: { points: SeriesPointRead[] }) {
  const { x, y, max } = scale(points);
  const line = points
    .map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(' L ');
  const baseline = y(0).toFixed(1);
  const first = points[0];
  const last = points.at(-1);
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Recherches hebdomadaires, maximum ${max}`}
    >
      <line
        x1={PAD.left}
        x2={WIDTH - PAD.right}
        y1={baseline}
        y2={baseline}
        stroke="#E5E7EB"
      />
      <text
        x={PAD.left - 6}
        y={y(max) + 4}
        textAnchor="end"
        fontSize="10"
        fill="#71717A"
      >
        {max}
      </text>
      <path
        d={`M ${x(0)},${baseline} L ${line} L ${x(points.length - 1)},${baseline} Z`}
        fill="#008075"
        fillOpacity="0.1"
      />
      <path
        d={`M ${line}`}
        fill="none"
        stroke="#008075"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {first && (
        <text x={PAD.left} y={HEIGHT - 6} fontSize="10" fill="#71717A">
          {formatDate(first.period)}
        </text>
      )}
      {last && (
        <text
          x={WIDTH - PAD.right}
          y={HEIGHT - 6}
          textAnchor="end"
          fontSize="10"
          fill="#71717A"
        >
          {formatDate(last.period)}
        </text>
      )}
    </svg>
  );
}
