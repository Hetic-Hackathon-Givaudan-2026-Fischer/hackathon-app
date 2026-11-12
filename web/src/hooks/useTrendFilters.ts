import { useMemo, useState } from 'react';
import {
  GROWTH_INDICATOR,
  type SortOrder,
  type TrendListQuery,
  type TrendSortField,
} from '../api/types';
import { useDebouncedValue } from './useDebouncedValue';

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 250;

interface Filters {
  family: string;
  status: string;
  search: string;
  sort: TrendSortField;
  order: SortOrder;
  page: number;
}

const INITIAL: Filters = {
  family: '',
  status: '',
  search: '',
  sort: GROWTH_INDICATOR,
  order: 'desc',
  page: 1,
};

const flip = (order: SortOrder): SortOrder =>
  order === 'desc' ? 'asc' : 'desc';

/** Nom : A → Z d'abord ; indicateurs et score : les plus forts d'abord. */
const firstOrder = (field: TrendSortField): SortOrder =>
  field === 'name' ? 'asc' : 'desc';

/** Filtres, tri et page de la liste ; tout changement de filtre revient page 1. */
export function useTrendFilters() {
  const [filters, setFilters] = useState(INITIAL);
  const search = useDebouncedValue(filters.search.trim(), SEARCH_DELAY_MS);

  // Filtre vide = absent de la query string
  const query = useMemo<TrendListQuery>(
    () => ({
      ...filters,
      family: filters.family || undefined,
      status: filters.status || undefined,
      search: search || undefined,
      page_size: PAGE_SIZE,
    }),
    [filters, search],
  );

  const update = (patch: Partial<Omit<Filters, 'page'>>) =>
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));

  const toggleSort = (field: TrendSortField) =>
    setFilters((prev) => ({
      ...prev,
      sort: field,
      order: prev.sort === field ? flip(prev.order) : firstOrder(field),
      page: 1,
    }));

  const setPage = (page: number) => setFilters((prev) => ({ ...prev, page }));

  return { filters, query, update, toggleSort, setPage };
}

export type TrendFiltersState = ReturnType<typeof useTrendFilters>;
