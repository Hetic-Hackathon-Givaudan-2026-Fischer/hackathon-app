// Hasard reproductible et bruit : la disposition de la nature dépend de
// l'ordre exact des tirages, ne pas réordonner les appels à `rand()`.

/** Générateur pseudo-aléatoire : chaque appel rend un nombre dans [0, 1). */
export type Random = () => number;

/** Point au sol (plan XZ). */
export interface Spot {
  x: number;
  z: number;
}

/** Générateur mulberry32 : même graine, même suite de tirages. */
export function rng(seed: number): Random {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noise2(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** Bruit fractal à trois octaves, dans [0, 0.875). */
export function fbm(x: number, y: number): number {
  return (
    noise2(x, y) * 0.5 +
    noise2(x * 2.1, y * 2.1) * 0.25 +
    noise2(x * 4.2, y * 4.2) * 0.125
  );
}

/** Écart centré sur 0, d'amplitude totale `span` (un tirage). */
export function jitter(rand: Random, span: number): number {
  return (rand() - 0.5) * span;
}

/** Point sur un anneau : angle tiré d'abord, puis distance dans [min, min + spread). */
export function ringSpot(rand: Random, min: number, spread: number): Spot {
  const angle = rand() * Math.PI * 2;
  const dist = min + rand() * spread;
  return { x: Math.cos(angle) * dist, z: Math.sin(angle) * dist };
}

/** Élément d'une liste non vide, l'index bouclant sur sa longueur. */
export function pick<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length];
  if (item === undefined) throw new Error('pick : liste vide');
  return item;
}
