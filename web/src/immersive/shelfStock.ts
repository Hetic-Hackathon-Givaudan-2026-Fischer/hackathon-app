// Quelles saveurs garnissent quel type de produit.
// Une saveur ne va que sur les rubriques dont la famille est prévue
// (voir aisleFamilies) : un snack n'affiche pas un agrume, une boisson non plus.
import type { ShelfStock } from '../engine/experience';
import { AISLE_FAMILIES } from './aisleFamilies';
import { compareTrends, type ScanTrend } from './scanCard';

const EMPTY: ShelfStock = {};

/** Arômes triés par pertinence, restreints au type de produit. */
export function shelfStock(trends: readonly ScanTrend[]): ShelfStock {
  if (trends.length === 0) return EMPTY;
  const ranked = [...trends].sort(compareTrends);
  const stock: Record<string, { id: string; name: string }[]> = {};
  for (const [categoryId, families] of Object.entries(AISLE_FAMILIES)) {
    stock[categoryId] = ranked
      .filter((trend) => families.includes(trend.family))
      .map((trend) => ({ id: trend.id, name: trend.name }));
  }
  return stock;
}
