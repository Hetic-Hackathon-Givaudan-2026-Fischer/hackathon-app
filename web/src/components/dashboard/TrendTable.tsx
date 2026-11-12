import type {
  SortOrder,
  TrendAnalysisRead,
  TrendRead,
  TrendSortField,
} from '../../api/types';
import type { IndicatorColumn } from './columns';
import { MISSING, familyLabel, formatIndicator } from '../../lib/format';
import { ScoreGauge } from './ScoreGauge';
import { StatusBadge } from './StatusBadge';

interface TrendTableProps {
  items: TrendRead[];
  columns: IndicatorColumn[];
  sort: TrendSortField;
  order: SortOrder;
  onSort: (field: TrendSortField) => void;
  onSelect: (trendId: string) => void;
}

type AnalysisScore = Extract<TrendSortField, keyof TrendAnalysisRead>;

interface AnalysisColumn {
  key: AnalysisScore;
  label: string;
  hint: string;
}

// Indicateurs métier Data/IA : montrés seulement si la page en contient
const ANALYSIS_COLUMNS: readonly AnalysisColumn[] = [
  {
    key: 'buzz_score',
    label: 'Buzz',
    hint: 'Bêta : attention médiatique, rang relatif de 0 à 100',
  },
  {
    key: 'trend_score',
    label: 'Dynamique',
    hint: 'Bêta : dynamique de recherche, rang relatif de 0 à 100',
  },
];

function analysisColumns(items: TrendRead[]): readonly AnalysisColumn[] {
  return items.some((trend) => trend.analysis) ? ANALYSIS_COLUMNS : [];
}

/** Tableau sur desktop, cartes empilées sur mobile. */
export function TrendTable(props: TrendTableProps) {
  const scores = analysisColumns(props.items);
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <TableHead {...props} scores={scores} />
          <tbody className="divide-y divide-[#E5E7EB] text-[14px]">
            {props.items.map((trend) => (
              <TrendRow
                key={trend.id}
                trend={trend}
                columns={props.columns}
                scores={scores}
                onSelect={props.onSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-[#E5E7EB] md:hidden">
        {props.items.map((trend) => (
          <TrendCard
            key={trend.id}
            trend={trend}
            columns={props.columns}
            onSelect={props.onSelect}
          />
        ))}
      </ul>
    </>
  );
}

interface TableHeadProps extends TrendTableProps {
  scores: readonly AnalysisColumn[];
}

function TableHead({ columns, scores, sort, order, onSort }: TableHeadProps) {
  const headers: Array<{
    key: TrendSortField | null;
    label: string;
    hint?: string;
  }> = [
    { key: 'name', label: 'Arôme' },
    { key: null, label: 'Famille' },
    {
      key: 'score',
      label: 'Score V2',
      hint: 'Pérennité selon le modèle V2, de 0 à 100',
    },
    ...scores,
    ...columns,
  ];
  return (
    <thead>
      <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA]">
        {headers.map(({ key, label, hint }) => (
          <th
            key={label}
            scope="col"
            title={hint}
            aria-sort={
              key === sort
                ? order === 'asc'
                  ? 'ascending'
                  : 'descending'
                : undefined
            }
            className="px-4 py-3 text-[11px] font-medium tracking-[0.05em] whitespace-nowrap text-[#71717A] uppercase"
          >
            {key ? (
              <button
                type="button"
                onClick={() => onSort(key)}
                className="flex cursor-pointer items-center gap-1 uppercase hover:text-[#18181B]"
              >
                {label}
                {key === sort && (
                  <span className="text-[#008075]">
                    {order === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ) : (
              label
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}

interface TrendItemProps {
  trend: TrendRead;
  columns: IndicatorColumn[];
  onSelect: (trendId: string) => void;
}

interface TrendRowProps extends TrendItemProps {
  scores: readonly AnalysisColumn[];
}

function TrendRow({ trend, columns, scores, onSelect }: TrendRowProps) {
  return (
    <tr
      onClick={() => onSelect(trend.id)}
      className="h-[56px] cursor-pointer transition hover:bg-[#F9F9FB]"
    >
      <td className="px-4 py-3">
        {/* Accès clavier : le clic (Entrée, Espace) remonte jusqu'à la ligne */}
        <button
          type="button"
          className="cursor-pointer text-left font-medium text-[#18181B] hover:text-[#008075]"
        >
          {trend.name}
        </button>
        <div className="mt-1">
          <StatusBadge status={trend.status} />
        </div>
      </td>
      <td className="px-4 py-3 text-[13px] text-[#3F3F46]">
        {familyLabel(trend.family)}
      </td>
      <td className="px-4 py-3">
        <ScoreGauge score={trend.score} />
      </td>
      {scores.map(({ key }) => (
        <td
          key={key}
          className="px-4 py-3 whitespace-nowrap text-[#3F3F46] tabular-nums"
        >
          {trend.analysis?.[key] ?? MISSING}
        </td>
      ))}
      {columns.map((column) => (
        <td
          key={column.key}
          className="px-4 py-3 whitespace-nowrap text-[#3F3F46] tabular-nums"
        >
          {formatIndicator(column.key, trend.indicators[column.key])}
        </td>
      ))}
    </tr>
  );
}

function TrendCard({ trend, columns, onSelect }: TrendItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(trend.id)}
        className="flex w-full cursor-pointer flex-col gap-2 p-4 text-left"
      >
        <span className="flex items-start justify-between gap-2">
          <span>
            <span className="block font-medium text-[#18181B]">
              {trend.name}
            </span>
            <span className="text-[12px] text-[#71717A]">
              {familyLabel(trend.family)}
            </span>
          </span>
          <ScoreGauge score={trend.score} />
        </span>
        <StatusBadge status={trend.status} />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
          {columns.slice(0, 4).map((column) => (
            <div key={column.key} className="flex justify-between gap-2">
              <dt className="truncate text-[#71717A]">{column.label}</dt>
              <dd className="font-medium text-[#18181B] tabular-nums">
                {formatIndicator(column.key, trend.indicators[column.key])}
              </dd>
            </div>
          ))}
        </dl>
      </button>
    </li>
  );
}
