// Rayon du magasin 3D → familles d'arômes de l'API : seule source de ce lien.
// Choix métier (le CSV et Data/IA n'ont pas de rayon commun) : à valider avec
// l'équipe Data/IA. `tsc` impose qu'aucun rayon du catalogue 3D ne manque.
import type { CategoryId } from '../engine/experience';

export const AISLE_FAMILIES: Readonly<Record<CategoryId, readonly string[]>> = {
  'desserts-lactes': [
    'gourmand',
    'fruits_rouges',
    'fruits_noyau',
    'fruits_exotiques',
  ],
  'produits-laitiers': [
    'fermente',
    'fruits_rouges',
    'fruits_frais',
    'gourmand',
  ],
  boissons: [
    'agrumes',
    'fruits_exotiques',
    'cocktail',
    'the',
    'herbace',
    'floral',
  ],
  glaces: ['gourmand', 'fruits_rouges', 'fruits_exotiques', 'fruits_a_coque'],
  confiseries: ['gourmand', 'fruits_rouges', 'agrumes', 'floral'],
  chocolats: ['gourmand', 'fruits_a_coque', 'torrefie', 'epice'],
  biscuits: ['gourmand', 'fruits_a_coque', 'epice', 'torrefie'],
  viennoiseries: ['gourmand', 'fruits_a_coque', 'fruits_noyau'],
  cereales: ['fruits_rouges', 'fruits_a_coque', 'gourmand', 'fruits_frais'],
  snacks: ['epice', 'fume', 'umami', 'fermente'],
  sauces: ['epice', 'umami', 'fume', 'herbace', 'fermente'],
  plats: ['epice', 'herbace', 'umami', 'fume'],
  vegetal: ['vegetal', 'herbace', 'umami', 'fruits_a_coque', 'torrefie'],
  nutrition: ['gourmand', 'fruits_rouges', 'fruits_exotiques', 'torrefie'],
};

/** Familles d'un rayon ; rayon inconnu du catalogue : aucune. */
export function familiesOf(categoryId: string): readonly string[] {
  return (
    (AISLE_FAMILIES as Record<string, readonly string[]>)[categoryId] ?? []
  );
}
