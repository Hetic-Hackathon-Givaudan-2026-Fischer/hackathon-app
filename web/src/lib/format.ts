// Mise en forme des valeurs de l'API pour l'affichage (fr-FR), partagée par les vues.
import type { Origin } from '../api/types';

const LOCALE = 'fr-FR';
const compact = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const decimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });
const signed = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const percent = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 1,
});
const longDate = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' });

/** Origine des données servies (ADR 0008) : un seul libellé partout. */
export const ORIGIN_LABELS: Readonly<Record<Origin, string>> = {
  data_ai: 'API Data/IA',
  csv_fallback: 'CSV de repli, sans modèle',
};

/** Texte affiché à la place d'une valeur absente : jamais de cellule vide. */
export const MISSING = '—';

export function formatCount(value: number): string {
  return compact.format(value);
}

/** Selon l'unité que porte la clé : `_pct`, `_relative`, `part_`, compte… */
export function formatIndicator(key: string, value: number | null | undefined) {
  if (value === null || value === undefined) return MISSING;
  if (key.endsWith('_pct')) return `${signed.format(value)} %`;
  if (key.endsWith('_relative')) return `${signed.format(value)} pts`;
  if (key.startsWith('part_')) return percent.format(value);
  if (Number.isInteger(value)) return compact.format(value);
  return decimal.format(value);
}

/** Part de 0 à 1 (métriques de qualité). */
export function formatShare(value: number): string {
  return percent.format(value);
}

// Libellés des familles de l'API (identifiants sans accents)
const FAMILY_LABELS: Readonly<Record<string, string>> = {
  epice: 'Épice',
  fermente: 'Fermenté',
  fruits_a_coque: 'Fruits à coque',
  fruits_noyau: 'Fruits à noyau',
  fume: 'Fumé',
  herbace: 'Herbacé',
  the: 'Thé',
  torrefie: 'Torréfié',
  vegetal: 'Végétal',
};

/** `fruits_a_coque` → « Fruits à coque » ; famille inconnue : identifiant lisible. */
export function familyLabel(family: string): string {
  const known = FAMILY_LABELS[family];
  if (known) return known;
  const text = family.replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const DAY_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `2026-11-12` en date locale (`new Date` le lirait en UTC : la veille à l'ouest). */
function parseDate(iso: string): Date {
  const day = DAY_ONLY.exec(iso);
  if (!day) return new Date(iso);
  return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
}

/** Date ISO (`2026-11-12` ou date-heure) → « 12 nov. 2026 ». */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return MISSING;
  const date = parseDate(iso);
  return Number.isNaN(date.getTime()) ? iso : longDate.format(date);
}
