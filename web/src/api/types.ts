// Alias lisibles sur les types générés depuis `openapi.yaml` (ADR 0012).
// Jamais de type d'API écrit à la main ici : `npm run gen:api` les produit.
import type { components, paths } from './schema';

type Schemas = components['schemas'];

export type Origin = Schemas['TrendListRead']['origin'];
export type DataAiState = Schemas['HealthRead']['data_ai'];
export type QualityStatus = Schemas['DatasetReportRead']['status'];

export type HealthRead = Schemas['HealthRead'];
export type TrendRead = Schemas['TrendRead'];
export type TrendListRead = Schemas['TrendListRead'];
export type TrendDetailRead = Schemas['TrendDetailRead'];
export type SeriesPointRead = Schemas['SeriesPointRead'];
export type EvidenceRead = Schemas['EvidenceRead'];
export type ProductShareRead = Schemas['ProductShareRead'];
export type TrendAnalysisRead = Schemas['TrendAnalysisRead'];
export type AnalysisStatus = TrendAnalysisRead['status'];
export type AnalysisConfidence = TrendAnalysisRead['confidence'];
export type ProductTypeRead = Schemas['ProductTypeRead'];
export type ProductTypeListRead = Schemas['ProductTypeListRead'];
export type SimulationCreate = Schemas['SimulationCreate'];
export type SimulationRead = Schemas['SimulationRead'];
export type FamilyRead = Schemas['FamilyRead'];
export type FamilyListRead = Schemas['FamilyListRead'];
export type DashboardSummaryRead = Schemas['DashboardSummaryRead'];
export type DatasetReportRead = Schemas['DatasetReportRead'];
export type TrendReportRead = Schemas['TrendReportRead'];
export type IndicatorSourceRead = Schemas['IndicatorSourceRead'];
export type QualityMetricRead = Schemas['QualityMetricRead'];
export type DataIssueCreate = Schemas['DataIssueCreate'];
export type DataIssueRead = Schemas['DataIssueRead'];
export type ShowroomRead = Schemas['ShowroomRead'];
export type ShowroomTrendRead = Schemas['ShowroomTrendRead'];
export type ShowroomLinkCreate = Schemas['ShowroomLinkCreate'];
export type ShowroomLinkCreatedRead = Schemas['ShowroomLinkCreatedRead'];

export type TrendListQuery = NonNullable<
  paths['/api/v1/trends']['get']['parameters']['query']
>;
export type TrendSortField = NonNullable<TrendListQuery['sort']>;
export type SortOrder = NonNullable<TrendListQuery['order']>;

/** Croissance mise en avant (tri par défaut, `top_growing`) : commune aux deux origines. */
export const GROWTH_INDICATOR: TrendSortField = 'wiki_croissance_12m_relative';
/** `page_size` maximal de GET /trends. */
export const PAGE_SIZE_MAX = 100;
/** `maxLength` du message de POST /report/issues (non porté par les types). */
export const ISSUE_MESSAGE_MAX_LENGTH = 2000;
