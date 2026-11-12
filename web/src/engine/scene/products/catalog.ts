// Données des rubriques : catalogue, teintes et noms des quatre variantes.
import type { Category } from '../../types';

const CATALOG = [
  {
    id: 'desserts-lactes',
    name: 'Desserts lactés',
    blurb: 'Yaourts, crèmes dessert et entremets aux arômes du moment.',
    type: 'fridge',
    accent: 0xf2c6cf,
  },
  {
    id: 'produits-laitiers',
    name: 'Produits laitiers',
    blurb:
      'Laits, fromages et crèmes dont le profil aromatique suit les tendances.',
    type: 'fridge',
    accent: 0x3a7ca5,
  },
  {
    id: 'boissons',
    name: 'Boissons',
    blurb: 'Eaux, sodas et boissons fruitées guidées par les notes d’arôme.',
    type: 'fridge',
    accent: 0xe63946,
  },
  {
    id: 'glaces',
    name: 'Glaces et desserts glacés',
    blurb: 'Pots et cornets aux parfums saisonniers.',
    type: 'fridge',
    accent: 0x90e0ef,
  },
  {
    id: 'confiseries',
    name: 'Confiseries',
    blurb: 'Bonbons et sucreries aux goûts tendance.',
    type: 'gondola',
    accent: 0xff4d6d,
  },
  {
    id: 'chocolats',
    name: 'Chocolats et produits chocolatés',
    blurb: 'Tablettes et enrobés aux inclusions aromatiques.',
    type: 'gondola',
    accent: 0x5c2a0a,
  },
  {
    id: 'biscuits',
    name: 'Biscuits et pâtisseries',
    blurb: 'Sablés et gâteaux dont la recette joue sur l’arôme.',
    type: 'gondola',
    accent: 0xc0843c,
  },
  {
    id: 'viennoiseries',
    name: 'Viennoiseries et produits de boulangerie',
    blurb: 'Croissants et pains sucrés aux notes gourmandes.',
    type: 'gondola',
    accent: 0xe0a45a,
  },
  {
    id: 'cereales',
    name: 'Céréales et produits du petit-déjeuner',
    blurb: 'Flocons et nappages aux parfums du matin.',
    type: 'gondola',
    accent: 0xef476f,
  },
  {
    id: 'snacks',
    name: 'Snacks et produits apéritifs',
    blurb: 'Sachet croustillant aux assaisonnements aromatiques.',
    type: 'gondola',
    accent: 0xf77f00,
  },
  {
    id: 'sauces',
    name: 'Sauces et condiments',
    blurb: 'Flacons et marinades aux profils épicés ou fruités.',
    type: 'gondola',
    accent: 0x9b2226,
  },
  {
    id: 'plats',
    name: 'Plats préparés et produits traiteur',
    blurb: 'Barquettes dont la signature passe par l’arôme.',
    type: 'gondola',
    accent: 0xd62828,
  },
  {
    id: 'vegetal',
    name: 'Produits végétaux et alternatives alimentaires',
    blurb: 'Blocs et alternatives dont le goût est travaillé par l’arôme.',
    type: 'gondola',
    accent: 0x2d6a4f,
  },
  {
    id: 'nutrition',
    name: 'Produits nutritionnels et sportifs',
    blurb: 'Shakers et barres aux goûts protéines du moment.',
    type: 'gondola',
    accent: 0x1d3557,
  },
] as const satisfies readonly Category[];

/** Identifiant d'une rubrique connue du catalogue. */
export type CategoryId = (typeof CATALOG)[number]['id'];

/** Rubriques du magasin, dans l'ordre des rayons. */
export const CATEGORIES: readonly Category[] = CATALOG;

const VARIANTS: Record<CategoryId, readonly number[]> = {
  'desserts-lactes': [0xf7cad0, 0xffe5a3, 0xc7f0db, 0xfde2e4],
  'produits-laitiers': [0x3a7ca5, 0x5fa8d3, 0xf4f1de, 0x2c6e49],
  boissons: [0xc1121f, 0x003049, 0xfcbf49, 0x2a9d8f],
  glaces: [0xf7c1d0, 0x8bd3c7, 0xffd166, 0xc77dff],
  confiseries: [0xe63946, 0xffd166, 0x9b5de5, 0x00bbf9],
  chocolats: [0x4a1c0a, 0x7f4f24, 0x2b1508, 0xc9a227],
  biscuits: [0xc0843c, 0xe9c46a, 0xbc6c25, 0xf4a261],
  viennoiseries: [0xe0a45a, 0xd4a373, 0xf3d5b5, 0xb08968],
  cereales: [0xef476f, 0xffd166, 0x06d6a0, 0x118ab2],
  snacks: [0xf77f00, 0xe9c46a, 0xd62828, 0x2a9d8f],
  sauces: [0x9b2226, 0xe85d04, 0x2d6a4f, 0x370617],
  plats: [0xd62828, 0x588157, 0xe9c46a, 0x457b9d],
  vegetal: [0x40916c, 0x95d5b2, 0x1b4332, 0xd8f3dc],
  nutrition: [0x1d3557, 0xe63946, 0x457b9d, 0xf1faee],
};

const NAMES: Record<CategoryId, readonly string[]> = {
  'desserts-lactes': [
    'Yaourt vanille',
    'Crème caramel',
    'Yaourt fraise',
    'Crème chocolat',
  ],
  'produits-laitiers': [
    'Lait entier',
    'Crème fraîche',
    'Beurre doux',
    'Fromage blanc',
  ],
  boissons: ['Soda cola', 'Eau gazeuse', 'Jus orange', 'Thé pêche'],
  glaces: ['Glace vanille', 'Glace menthe', 'Glace citron', 'Glace cassis'],
  confiseries: [
    'Bonbon fraise',
    'Bonbon citron',
    'Réglisse douce',
    'Dragée amande',
  ],
  chocolats: [
    'Chocolat noir',
    'Chocolat lait',
    'Chocolat noisette',
    'Chocolat blanc',
  ],
  biscuits: [
    'Sablé nature',
    'Cookie pépites',
    'Biscuit chocolat',
    'Gaufre vanille',
  ],
  viennoiseries: [
    'Croissant beurre',
    'Pain chocolat',
    'Chausson pomme',
    'Brioche sucrée',
  ],
  cereales: [
    'Flocons avoine',
    'Muesli fruits',
    'Céréales miel',
    'Pétales chocolat',
  ],
  snacks: ['Chips nature', 'Chips paprika', 'Chips barbecue', 'Tuiles fromage'],
  sauces: ['Sauce bbq', 'Sauce tomate', 'Ketchup nature', 'Sauce mayo'],
  plats: ['Poulet rôti', 'Lasagnes bœuf', 'Riz cantonais', 'Gratin légumes'],
  vegetal: ['Steak végétal', 'Tofu nature', 'Galette légumes', 'Lait avoine'],
  nutrition: ['Whey vanille', 'Barre cacao', 'Shaker fraise', 'Boisson cacao'],
};

/** Une variante de produit : clé de cache, teinte et nom imprimé. */
export interface ProductVariant {
  key: string;
  color: number;
  name: string;
}

const CATEGORY_IDS: ReadonlySet<string> = new Set(CATALOG.map(({ id }) => id));

function isCategoryId(id: string): id is CategoryId {
  return CATEGORY_IDS.has(id);
}

/** Identifiant typé d'une rubrique ; échoue si elle n'est pas au catalogue. */
export function categoryIdOf(category: Category): CategoryId {
  if (isCategoryId(category.id)) return category.id;
  throw new Error(`Rubrique inconnue : ${category.id}`);
}

/** Variante n° `variant` de la rubrique, les teintes tournant en boucle. */
export function variantOf(id: CategoryId, variant: number): ProductVariant {
  const colors = VARIANTS[id];
  const index = variant % colors.length;
  const color = colors[index];
  const name = NAMES[id][index];
  if (color === undefined || name === undefined) {
    throw new Error(`Variante absente : ${id}:${index}`);
  }
  return { key: `${id}:${index}`, color, name };
}
