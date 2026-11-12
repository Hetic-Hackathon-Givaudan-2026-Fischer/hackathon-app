// Un modèle de produit par rubrique.
import type { CategoryId } from '../catalog';
import { croissant } from './croissant';
import { iceCreamTub, milkCarton, sodaCan, yogurtCup } from './fridge';
import {
  chipsBag,
  mealTray,
  plantPack,
  proteinTub,
  sauceBottle,
} from './grocery';
import { biscuitPack, candy, cerealBox, chocolateBar } from './packs';
import type { ProductBuilder } from './parts';

export const BUILDERS: Record<CategoryId, ProductBuilder> = {
  'desserts-lactes': yogurtCup,
  'produits-laitiers': milkCarton,
  boissons: sodaCan,
  glaces: iceCreamTub,
  confiseries: candy,
  chocolats: chocolateBar,
  biscuits: biscuitPack,
  viennoiseries: croissant,
  cereales: cerealBox,
  snacks: chipsBag,
  sauces: sauceBottle,
  plats: mealTray,
  vegetal: plantPack,
  nutrition: proteinTub,
};
