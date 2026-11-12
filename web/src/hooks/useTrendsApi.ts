// Ressources de l'API pour les vues : une par route, toutes via `useApiResource`.
import {
  fetchAllTrends,
  fetchDatasetReport,
  fetchFamilies,
  fetchHealth,
  fetchShowroom,
  fetchSummary,
  fetchTrend,
  fetchTrendReport,
  fetchTrends,
} from '../api/endpoints';
import type { TrendListQuery } from '../api/types';
import { useApiResource } from './useApiResource';

export const useHealth = () =>
  useApiResource({ key: 'health', load: fetchHealth });

export const useSummary = () =>
  useApiResource({ key: 'summary', load: fetchSummary });

export const useFamilies = () =>
  useApiResource({ key: 'families', load: fetchFamilies });

/** Rapport global : sert de catalogue des indicateurs (libellé, source). */
export const useDatasetReport = () =>
  useApiResource({ key: 'report', load: fetchDatasetReport });

export const useTrendList = (query: TrendListQuery) =>
  useApiResource({
    key: JSON.stringify(query),
    load: (signal) => fetchTrends(query, signal),
  });

export const useTrend = (trendId: string | null) =>
  useApiResource(
    trendId
      ? { key: trendId, load: (signal) => fetchTrend(trendId, signal) }
      : null,
  );

export const useTrendReport = (trendId: string | null) =>
  useApiResource(
    trendId
      ? { key: trendId, load: (signal) => fetchTrendReport(trendId, signal) }
      : null,
  );

/** Vue immersive interne : tous les arômes, pour les fiches de scan. */
export const useAllTrends = () =>
  useApiResource({ key: 'all-trends', load: fetchAllTrends });

/** Vue client d'un lien showroom : sa seule route, en lecture seule. */
export const useShowroom = (token: string) =>
  useApiResource({
    key: token,
    load: (signal) => fetchShowroom(token, signal),
  });
