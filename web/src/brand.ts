// Charte graphique : utilisée par les textures dessinées au canvas (moteur 3D).
// Les mêmes valeurs existent en jetons Tailwind dans `index.css` (@theme) pour
// l'interface React : garder les deux alignés.

export const TYPEFACE =
  '"Jost", "Century Gothic", Futura, "Avenir Next", sans-serif';

export const INK = '#0B1215';
export const PAPER = '#FFFFFF';
export const FRAME = '#3A4146';
export const IVORY = '#FAF9F6';
export const COPPER = '#BE5800';
export const STONE = '#E4DFD4';
export const PLUM = '#4A2038';

/** Rubriques du menu givaudan.com, dans l’ordre du site. */
export const MENU = [
  '#BE5800',
  '#677000',
  '#78608D',
  '#238495',
  '#005882',
  '#C14E5B',
  '#3A5C24',
] as const;

export function menuColor(index: number): string {
  const count = MENU.length;
  return MENU[((index % count) + count) % count] ?? MENU[0];
}

/** Attend la police de la marque : les textures canvas en ont besoin. */
export async function ensureBrandFont(): Promise<void> {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load(`400 16px ${TYPEFACE}`),
    document.fonts.load(`400 32px ${TYPEFACE}`),
    document.fonts.load(`500 72px ${TYPEFACE}`),
  ]).catch(() => undefined);
}
