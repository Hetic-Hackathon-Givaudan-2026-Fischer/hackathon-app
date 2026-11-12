// Appels de nos routes v1 : chemins, paramètres et réponses vérifiés par `tsc`.
import { api, unwrap } from './client';
import {
  GROWTH_INDICATOR,
  PAGE_SIZE_MAX,
  type DataIssueCreate,
  type ShowroomLinkCreate,
  type TrendListQuery,
  type TrendListRead,
} from './types';

type Signal = AbortSignal;

export const fetchHealth = (signal: Signal) =>
  unwrap(api.GET('/api/v1/health', { signal }));

export const fetchSummary = (signal: Signal) =>
  unwrap(api.GET('/api/v1/dashboard/summary', { signal }));

export const fetchFamilies = (signal: Signal) =>
  unwrap(api.GET('/api/v1/families', { signal }));

export const fetchTrends = (query: TrendListQuery, signal: Signal) =>
  unwrap(api.GET('/api/v1/trends', { params: { query }, signal }));

export const fetchTrend = (trendId: string, signal: Signal) =>
  unwrap(
    api.GET('/api/v1/trends/{trend_id}', {
      params: { path: { trend_id: trendId } },
      signal,
    }),
  );

export const fetchDatasetReport = (signal: Signal) =>
  unwrap(api.GET('/api/v1/report', { signal }));

export const fetchTrendReport = (trendId: string, signal: Signal) =>
  unwrap(
    api.GET('/api/v1/report/trends/{trend_id}', {
      params: { path: { trend_id: trendId } },
      signal,
    }),
  );

export const reportIssue = (body: DataIssueCreate) =>
  unwrap(api.POST('/api/v1/report/issues', { body }));

/** Tous les arômes, page après page (102 arômes pour 100 par page au plus). */
export async function fetchAllTrends(signal: Signal): Promise<TrendListRead> {
  const query = (page: number): TrendListQuery => ({
    sort: GROWTH_INDICATOR,
    order: 'desc',
    page,
    page_size: PAGE_SIZE_MAX,
  });
  const first = await fetchTrends(query(1), signal);
  const remaining = Math.max(Math.ceil(first.total / PAGE_SIZE_MAX) - 1, 0);
  const rest = await Promise.all(
    Array.from({ length: remaining }, (_, i) =>
      fetchTrends(query(i + 2), signal),
    ),
  );
  return { ...first, items: [first, ...rest].flatMap((page) => page.items) };
}

export const fetchShowroom = (token: string, signal: Signal) =>
  unwrap(
    api.GET('/api/v1/showroom/{token}', {
      params: { path: { token } },
      signal,
    }),
  );

/** Le jeton et l'URL ne sont renvoyés qu'à la création (ADR 0010). */
export const createShowroomLink = (body: ShowroomLinkCreate) =>
  unwrap(api.POST('/api/v1/showroom/links', { body }));
