// Plan des rayons : files de gondoles, allées, mur frais.
import type { Category } from '../../types';
import { CATEGORIES } from '../products';
import { GONDOLA_DEPTH, GONDOLA_LEN, STORE, at } from './layout';

/** File de gondoles dos à dos, tournée de `rot` autour de Y. */
export interface ShelfLine {
  x: number;
  rot: number;
  category: Category;
}

/** Allée entre deux files, avec le libellé de son enseigne. */
export interface Aisle {
  x: number;
  label: string;
}

export interface FridgeSlot {
  category: Category;
  x: number;
}

export interface Plan {
  lines: ShelfLine[];
  aisles: Aisle[];
  /** Centre en Z de chaque travée, du nord au sud. */
  runZ: number[];
  fridges: FridgeSlot[];
  fridgeZ: number;
  /** Travée laissée vide : la traversée centrale. */
  crossIndex: number;
  /** Travées absentes le long des murs. */
  wallGaps: readonly number[];
  crossZ: number;
  lastRunZ: number;
}

const NORTH_TIP = -14.7;
const RUN_PITCH = 3.08;
const RUN_COUNT = 6;
const CROSS_INDEX = 2;
const WALL_GAPS = [1, 4] as const;
const WALL_INSET = 0.51;
const FACING = 3.36;
const BACK_TO_BACK = 0.86;
const LINE_STEPS = [FACING, BACK_TO_BACK, FACING, BACK_TO_BACK] as const;
const LINE_IDS = [
  'confiseries',
  'chocolats',
  'snacks',
  'snacks',
  'sauces',
  'plats',
] as const;
const FRIDGE_IDS = [
  'desserts-lactes',
  'produits-laitiers',
  'boissons',
  'glaces',
] as const;
const SHORT_NAME: Readonly<Record<string, string>> = {
  confiseries: 'Confiseries',
  chocolats: 'Chocolats',
  biscuits: 'Biscuits',
  viennoiseries: 'Viennoiseries',
  cereales: 'Céréales',
  snacks: 'Snacks',
  sauces: 'Sauces',
  plats: 'Plats préparés',
  vegetal: 'Végétal',
  nutrition: 'Nutrition',
};

function categoryById(id: string): Category {
  const category = CATEGORIES.find((item) => item.id === id);
  if (!category) throw new Error(`Rubrique inconnue : ${id}`);
  return category;
}

/** Rang de la rubrique : il fixe sa couleur et son numéro. */
export function categoryIndex(category: Category): number {
  return CATEGORIES.indexOf(category);
}

function shortName(category: Category): string {
  return SHORT_NAME[category.id] ?? category.name;
}

/** Abscisses des files : cumul des pas depuis le mur ouest, puis mur est. */
function lineXs(): number[] {
  let x: number = STORE.minX + WALL_INSET;
  const xs = [x];
  for (const step of LINE_STEPS) {
    x += step;
    xs.push(x);
  }
  xs.push(STORE.maxX - (GONDOLA_DEPTH / 2 + 0.02));
  return xs;
}

function shelfLines(): ShelfLine[] {
  const xs = lineXs();
  return LINE_IDS.map((id, index) => ({
    x: at(xs, index),
    rot: index % 2 === 0 ? Math.PI / 2 : -Math.PI / 2,
    category: categoryById(id),
  }));
}

function aisleLabel(left: Category, right: Category): string {
  if (left.id === right.id) return shortName(left);
  return `${shortName(left)}  ·  ${shortName(right)}`;
}

function pairAisles(lines: readonly ShelfLine[]): Aisle[] {
  const aisles: Aisle[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const left = at(lines, i);
    const right = at(lines, i + 1);
    aisles.push({
      x: (left.x + right.x) / 2,
      label: aisleLabel(left.category, right.category),
    });
  }
  return aisles;
}

export function layoutPlan(): Plan {
  const lines = shelfLines();
  const runZ = Array.from(
    { length: RUN_COUNT },
    (_, index) => NORTH_TIP + GONDOLA_LEN / 2 + index * RUN_PITCH,
  );
  return {
    lines,
    aisles: pairAisles(lines),
    runZ,
    fridges: FRIDGE_IDS.map((id, index) => ({
      category: categoryById(id),
      x: STORE.minX + 1.825 + index * 3.17,
    })),
    fridgeZ: -17.52,
    crossIndex: CROSS_INDEX,
    wallGaps: WALL_GAPS,
    crossZ: at(runZ, CROSS_INDEX),
    lastRunZ: at(runZ, runZ.length - 1),
  };
}

/** Une gondole occupe-t-elle la travée `index` de la file `lineIndex` ? */
export function bayPresent(
  plan: Plan,
  lineIndex: number,
  index: number,
): boolean {
  if (index < 0 || index >= plan.runZ.length) return false;
  if (index === plan.crossIndex) return false;
  const onWall = lineIndex === 0 || lineIndex === plan.lines.length - 1;
  return !(onWall && plan.wallGaps.includes(index));
}
