// Fiche affichée sur la tablette après un scan : les arômes du rayon, avec
// les données reçues de l'API (statut et score Data/IA, sinon croissance brute).
import type { ApiError } from '../api/client';
import {
  GROWTH_INDICATOR,
  type Origin,
  type ShowroomRead,
  type TrendListRead,
} from '../api/types';
import type { Category, ScanCard, ScanRow } from '../engine/experience';
import {
  MISSING,
  ORIGIN_LABELS,
  familyLabel,
  formatDate,
  formatIndicator,
} from '../lib/format';
import { familiesOf } from './aisleFamilies';

/** Un arôme vu par la vue immersive, qu'il vienne de /trends ou du showroom. */
export interface ScanTrend {
  id: string;
  name: string;
  family: string;
  status: string | null;
  score: number | null;
  /** Absente du contrat showroom : `undefined`. */
  growth?: number | null;
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
    ...trend,
    growth: trend.indicators[GROWTH_INDICATOR] ?? null,
  }));
  return { origin: list.origin, dataDate: list.data_date, trends };
}

export function fromShowroom(view: ShowroomRead): ScanData {
  return { origin: view.origin, dataDate: view.data_date, trends: view.trends };
}

/** Score V2 d'abord (absent : en dernier), puis croissance. */
function byRelevance(a: ScanTrend, b: ScanTrend): number {
  const score = (b.score ?? -1) - (a.score ?? -1);
  return score || (b.growth ?? -Infinity) - (a.growth ?? -Infinity) || 0;
}

function valueOf(trend: ScanTrend): string {
  if (trend.score !== null) return `${Math.round(trend.score)}/100`;
  if (trend.growth !== undefined)
    return formatIndicator(GROWTH_INDICATOR, trend.growth);
  return MISSING;
}

function rowOf(trend: ScanTrend): ScanRow {
  const status = trend.status ?? 'statut non calculé';
  return {
    label: trend.name,
    value: valueOf(trend),
    detail: `${familyLabel(trend.family)} · ${status}`,
  };
}

function footnoteOf({ origin, dataDate }: ScanData): string {
  if (origin === 'data_ai') {
    return `Source : ${ORIGIN_LABELS.data_ai} · score V2 de pérennité · données du ${formatDate(dataDate)}`;
  }
  return `Mode dégradé : ${ORIGIN_LABELS.csv_fallback} (croissance Wikipédia sur 12 mois)`;
}

function pending(category: Category, subtitle: string): ScanCard {
  return { title: category.name, subtitle, rows: [], footnote: null };
}

/** Fiche d'un rayon scanné, quel que soit l'état des données (chargement, erreur…). */
export function buildScanCard(
  category: Category,
  { data, error }: ScanState,
): ScanCard {
  if (error)
    return pending(category, `Données indisponibles : ${error.message}`);
  if (!data) return pending(category, 'Chargement des données d’arômes…');
  const families = familiesOf(category.id);
  const trends = data.trends
    .filter((t) => families.includes(t.family))
    .sort(byRelevance);
  if (trends.length === 0)
    return {
      ...pending(category, category.blurb),
      footnote: 'Aucun arôme suivi pour ce rayon.',
    };
  return {
    title: category.name,
    subtitle: `${trends.length} arômes suivis · ${families.map(familyLabel).join(', ')}`,
    rows: trends.map(rowOf),
    footnote: footnoteOf(data),
  };
}
