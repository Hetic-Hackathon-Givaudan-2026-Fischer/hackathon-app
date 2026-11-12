// Gabarit du magasin : dimensions, ouvertures et emprise au sol (mètres).

/** Intérieur du bâtiment ; `wall` : épaisseur des murs. */
export const STORE = {
  minX: -6.5,
  maxX: 6.82,
  minZ: -18,
  maxZ: 11,
  wall: 0.28,
  height: 6.35,
} as const;

export const WIDTH = STORE.maxX - STORE.minX;
export const DEPTH = STORE.maxZ - STORE.minZ;
export const MID_X = (STORE.minX + STORE.maxX) / 2;
export const MID_Z = (STORE.minZ + STORE.maxZ) / 2;

/** Dessus du dallage, pied et hauteur des murs. */
export const FLOOR_TOP = 0.1;
export const WALL_BOTTOM = FLOOR_TOP - 0.08;
export const RISE = STORE.height - WALL_BOTTOM;
export const WALL_CENTER = WALL_BOTTOM + RISE / 2;

export const FACADE_SIGN = { width: 8.1, height: 1.72, y: 4.38 } as const;
/** Profondeur du parvis devant la façade. */
export const PLAZA = 3.6;
export const GONDOLA_LEN = 2.95;
export const GONDOLA_DEPTH = 0.76;

/** Fenêtres hautes des murs latéraux. */
export const SIDE_WINDOWS = {
  sill: 3.12,
  head: 5.5,
  z0: -15.15,
  z1: 3.95,
  count: 5,
  width: 2.5,
} as const;

/** Ouverture de la façade, entre deux abscisses. */
export interface Opening {
  id: string;
  x0: number;
  x1: number;
}

export const OPENINGS: readonly Opening[] = [
  { id: 'entree', x0: -3.24, x1: 3.56 },
];

/** Pupitre d'accueil, tourné vers l'entrée. */
export const WELCOME_BOARD = { x: -3.5, z: 8.15, yaw: Math.PI / 4 } as const;

/** Élément d'une table constante ; une erreur signale un index hors bornes. */
export function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`Index hors bornes : ${index}`);
  return item;
}
