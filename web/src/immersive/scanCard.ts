// Fiche affichée sur la tablette après un scan : l'arôme du produit visé.
import type { ApiError } from '../api/client';
import {
  GROWTH_INDICATOR,
  type IndicatorSourceRead,
  type Origin,
  type ShowroomRead,
  type TrendListRead,
} from '../api/types';
import type { ScanCard, ScanRow, ScannedProduct } from '../engine/experience';
import {
  ORIGIN_LABELS,
  familyLabel,
  formatDate,
  formatIndicator,
} from '../lib/format';

/** Un arôme vu par la vue immersive, qu'il vienne de /trends ou du showroom. */
export interface ScanTrend {
  id: string;
  name: string;
  family: string;
  status: string | null;
  score: number | null;
  /** Absente du contrat showroom : `undefined`. */
  growth?: number | null;
  /** Absents du contrat showroom. */
  indicators?: Readonly<Record<string, number | null>>;
}

export interface ScanData {
  origin: Origin;
  dataDate: string | null;
  trends: ScanTrend[];
}

export interface ScanState {
  data?: ScanData;
  error?: ApiError;
}

export function fromTrendList(list: TrendListRead): ScanData {
  const trends = list.items.map((trend) => ({
    id: trend.id,
    name: trend.name,
    family: trend.family,
    status: trend.status,
    score: trend.score,
    growth: trend.indicators[GROWTH_INDICATOR] ?? null,
    indicators: trend.indicators,
  }));
  return { origin: list.origin, dataDate: list.data_date, trends };
}

export function fromShowroom(view: ShowroomRead): ScanData {
  return { origin: view.origin, dataDate: view.data_date, trends: view.trends };
}

/** Score V2 d'abord (absent : en dernier), puis croissance. */
export function compareTrends(a: ScanTrend, b: ScanTrend): number {
  const score = (b.score ?? -1) - (a.score ?? -1);
  return score || (b.growth ?? -Infinity) - (a.growth ?? -Infinity) || 0;
}

/** Même priorité que les colonnes du tableau, dans la limite de l'écran. */
const TABLET_INDICATORS = [
  'wiki_croissance_12m_relative',
  'recherche_croissance_52s_pct',
  'wiki_vues_30j',
  'produits_total',
  'mentions_presse_30j',
  'mentions_reseaux_30j',
] as const;

const MAX_ROWS = 6;

function indicatorRows(
  trend: ScanTrend,
  catalog: readonly IndicatorSourceRead[] | undefined,
): ScanRow[] {
  if (!trend.indicators || !catalog) return [];
  const rows: ScanRow[] = [];
  for (const key of TABLET_INDICATORS) {
    if (!(key in trend.indicators)) continue;
    const entry = catalog.find((item) => item.key === key);
    if (!entry) continue;
    rows.push({
      label: entry.label,
      value: formatIndicator(key, trend.indicators[key]),
      detail: `${entry.source_label} · ${entry.period}`,
    });
  }
  return rows;
}

function rowsOf(
  trend: ScanTrend,
  catalog: readonly IndicatorSourceRead[] | undefined,
): ScanRow[] {
  const rows: ScanRow[] = [
    {
      label: 'Statut',
      value: trend.status ?? 'Non calculé',
      detail: null,
    },
  ];
  if (trend.score !== null) {
    rows.push({
      label: 'Pérennité',
      value: `${Math.round(trend.score)}/100`,
      detail: 'Modèle V2',
    });
  }
  return [...rows, ...indicatorRows(trend, catalog)].slice(0, MAX_ROWS);
}

function footnoteOf({ origin, dataDate }: ScanData): string {
  if (origin === 'data_ai') {
    return `Source : ${ORIGIN_LABELS.data_ai} · score V2 de pérennité · données du ${formatDate(dataDate)}`;
  }
  return `Mode dégradé : ${ORIGIN_LABELS.csv_fallback} (croissance Wikipédia sur 12 mois)`;
}

function pending(title: string, subtitle: string): ScanCard {
  return { title, subtitle, rows: [], footnote: null };
}

/**
 * Fiche de l'arôme porté par le produit scanné.
 * `catalog` (GET /report) donne les libellés d'indicateurs ; absent côté showroom.
 */
export function buildScanCard(
  product: ScannedProduct,
  { data, error }: ScanState,
  catalog?: readonly IndicatorSourceRead[],
): ScanCard {
  const { category, trendId } = product;
  if (error)
    return pending(category.name, `Données indisponibles : ${error.message}`);
  if (!data) return pending(category.name, 'Chargement des données d’arômes…');
  const trend = data.trends.find((item) => item.id === trendId);
  if (!trend)
    return pending(category.name, 'Aucune donnée pour l’arôme de ce produit.');
  return {
    title: trend.name,
    subtitle: `${category.name} · ${familyLabel(trend.family)}`,
    rows: rowsOf(trend, catalog),
    footnote: footnoteOf(data),
  };
}
