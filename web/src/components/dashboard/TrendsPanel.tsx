import type {
  DashboardSummaryRead,
  FamilyRead,
  ProductTypeRead,
} from '../../api/types';
import type { TrendFiltersState } from '../../hooks/useTrendFilters';
import { useDatasetReport, useTrendList } from '../../hooks/useTrendsApi';
import { indicatorColumns } from './columns';
import { Pagination } from './Pagination';
import { EmptyState, ErrorState, LoadingState } from './states';
import { TrendFilters } from './TrendFilters';
import { TrendTable } from './TrendTable';
import { BUTTON_SECONDARY, CARD } from './ui';

interface TrendsPanelProps {
  filters: TrendFiltersState;
  families: FamilyRead[];
  productTypes: ProductTypeRead[];
  summary: DashboardSummaryRead | undefined;
  onSelect: (trendId: string) => void;
}

/** Liste filtrable, triable et paginée côté API (GET /trends). */
export function TrendsPanel(props: TrendsPanelProps) {
  const { filters, families, productTypes, summary, onSelect } = props;
  const { filters: state, query, update, toggleSort, setPage } = filters;
  const catalog = useDatasetReport();
  const list = useTrendList(query);
  const items = list.data?.items ?? [];
  const columns = indicatorColumns(catalog.data?.indicators, items);

  return (
    <section aria-labelledby="trends-heading" className={CARD}>
      <div className="flex flex-col gap-4 border-b border-[#E5E7EB] p-5">
        <h2 id="trends-heading" className="text-[18px] font-medium">
          Arômes
        </h2>
        <TrendFilters
          family={state.family}
          status={state.status}
          productType={state.productType}
          families={families}
          productTypes={productTypes}
          summary={summary}
          onChange={update}
        />
      </div>
      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <LoadingState label="Chargement des arômes…" />
      ) : items.length === 0 ? (
        <EmptyResult total={list.data.total} onFirstPage={() => setPage(1)} />
      ) : (
        <div
          aria-busy={list.loading}
          className={list.loading ? 'opacity-60 transition-opacity' : ''}
        >
          <TrendTable
            items={items}
            columns={columns}
            sort={state.sort}
            order={state.order}
            onSort={toggleSort}
            onSelect={onSelect}
          />
          <Pagination
            page={state.page}
            pageSize={list.data.page_size}
            total={list.data.total}
            onPage={setPage}
          />
        </div>
      )}
    </section>
  );
}

interface EmptyResultProps {
  total: number;
  onFirstPage: () => void;
}

/** Aucun arôme : filtres trop stricts, ou page au-delà de la dernière. */
function EmptyResult({ total, onFirstPage }: EmptyResultProps) {
  if (total === 0) {
    return <EmptyState>Aucun arôme ne correspond à ces filtres.</EmptyState>;
  }
  return (
    <EmptyState>
      Cette page est vide.{' '}
      <button type="button" onClick={onFirstPage} className={BUTTON_SECONDARY}>
        Revenir à la page 1
      </button>
    </EmptyState>
  );
}
