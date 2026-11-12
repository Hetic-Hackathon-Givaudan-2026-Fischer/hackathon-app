import type {
  DashboardSummaryRead,
  FamilyRead,
  ProductTypeRead,
} from '../../api/types';
import { familyLabel } from '../../lib/format';
import { EYEBROW, FIELD } from './ui';

interface FilterPatch {
  family?: string;
  status?: string;
  productType?: string;
}

interface TrendFiltersProps {
  family: string;
  status: string;
  productType: string;
  families: FamilyRead[];
  productTypes: ProductTypeRead[];
  summary: DashboardSummaryRead | undefined;
  onChange: (patch: FilterPatch) => void;
}

export function TrendFilters(props: TrendFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={props.family}
          onChange={(event) => props.onChange({ family: event.target.value })}
          aria-label="Filtrer par famille d'arômes"
          className={`${FIELD} w-full cursor-pointer sm:w-64`}
        >
          <option value="">Toutes les familles</option>
          {props.families.map((item) => (
            <option key={item.family} value={item.family}>
              {familyLabel(item.family)} ({item.trend_count})
            </option>
          ))}
        </select>
        <ProductTypeSelect {...props} />
      </div>
      <StatusPills {...props} />
    </div>
  );
}

/** Types de produits Data/IA ; masqué en repli CSV (aucun type connu). */
function ProductTypeSelect({
  productType,
  productTypes,
  onChange,
}: TrendFiltersProps) {
  if (productTypes.length === 0 && !productType) return null;
  return (
    <select
      value={productType}
      onChange={(event) => onChange({ productType: event.target.value })}
      aria-label="Filtrer par type de produit"
      className={`${FIELD} w-full cursor-pointer sm:w-72`}
    >
      <option value="">Tous les types de produits</option>
      {productTypes.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label} ({item.any_count})
        </option>
      ))}
    </select>
  );
}

/** Statuts réellement présents (`status_counts`) ; aucun en repli CSV. */
function StatusPills({ status, summary, onChange }: TrendFiltersProps) {
  const counts = Object.entries(summary?.status_counts ?? {});
  if (summary && counts.length === 0) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-[12px] text-[#71717A]">
        Filtre par statut indisponible : aucun modèle appliqué aux données.
        {status && (
          <button
            type="button"
            onClick={() => onChange({ status: '' })}
            className="cursor-pointer text-[#008075] underline"
          >
            Retirer le filtre « {status} »
          </button>
        )}
      </p>
    );
  }
  const options: Array<[string, string]> = [
    ['', 'Tous les statuts'],
    ...counts.map(([label, n]): [string, string] => [label, `${label} (${n})`]),
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`${EYEBROW} mr-1`}>Statut :</span>
      {options.map(([value, label]) => (
        <button
          key={value || 'all'}
          type="button"
          aria-pressed={status === value}
          onClick={() => onChange({ status: value })}
          className={`cursor-pointer rounded-full px-3 py-1 text-[12px] font-medium transition ${
            status === value
              ? 'bg-[#008075] text-white'
              : 'bg-[#F4F4F5] text-[#3F3F46] hover:bg-[#E4E4E7]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
