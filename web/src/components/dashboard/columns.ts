// Colonnes d'indicateurs du tableau. Les libellés et sources viennent de
// GET /report (`indicators`) : seule l'API connaît le catalogue.
import type {
  IndicatorSourceRead,
  TrendRead,
  TrendSortField,
} from '../../api/types';

export interface IndicatorColumn {
  key: TrendSortField;
  label: string;
  hint: string;
}

// Choix d'affichage, par ordre de priorité ; seules les clés fournies par
// l'origine courante sont montrées (pas de `recherche_*` en repli CSV)
const PREFERRED: readonly TrendSortField[] = [
  'wiki_croissance_12m_relative',
  'recherche_croissance_52s_pct',
  'wiki_vues_30j',
  'produits_total',
  'mentions_presse_30j',
  'mentions_reseaux_30j',
];

function fromCatalog(entry: IndicatorSourceRead): Omit<IndicatorColumn, 'key'> {
  return {
    label: entry.label,
    hint: `${entry.source_label} · ${entry.period}`,
  };
}

/** Sans catalogue (rapport indisponible) : clés présentes dans les arômes. */
function fromItems(key: string, items: TrendRead[]) {
  const present = items.some((item) => key in item.indicators);
  return present ? { label: key, hint: 'Libellé indisponible' } : null;
}

export function indicatorColumns(
  catalog: IndicatorSourceRead[] | undefined,
  items: TrendRead[],
): IndicatorColumn[] {
  return PREFERRED.flatMap((key) => {
    const entry = catalog?.find((indicator) => indicator.key === key);
    const column = entry
      ? fromCatalog(entry)
      : catalog
        ? null
        : fromItems(key, items);
    return column ? [{ key, ...column }] : [];
  });
}
