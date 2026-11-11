import * as THREE from 'three';
import { TYPEFACE } from '../brand.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const CATEGORIES = [
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
];

const VARIANTS = {
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

const NAMES = {
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

const materials = new Map();

function std(color, extras = {}) {
  const mapId = extras.map ? extras.map.uuid : '';
  const key = [
    color,
    extras.roughness ?? 0.48,
    extras.metalness ?? 0.04,
    extras.transparent ? 1 : 0,
    extras.opacity ?? 1,
    mapId,
  ].join('|');
  let material = materials.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.48,
      metalness: 0.04,
      ...extras,
    });
    materials.set(key, material);
  }
  return material;
}

const labelMaterials = new Map();

function paintWords(ctx, width, height, name) {
  const words = name.split(' ');
  ctx.fillStyle = '#FFFDF8';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#0B1215';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxWidth = width * 0.9;
  const maxHeight = height * 0.84;
  let size = Math.floor(maxHeight / words.length);
  const widest = () => {
    ctx.font = `500 ${size}px ${TYPEFACE}`;
    return words.reduce(
      (max, word) => Math.max(max, ctx.measureText(word).width),
      0,
    );
  };
  while (size > 36 && widest() > maxWidth) size -= 2;
  const gap = Math.round(size * 0.16);
  while (
    size > 36 &&
    size * words.length + gap * (words.length - 1) > maxHeight
  )
    size -= 2;
  ctx.font = `500 ${size}px ${TYPEFACE}`;
  const block = size * words.length + gap * (words.length - 1);
  let y = (height - block) / 2 + size / 2;
  for (const word of words) {
    ctx.fillText(word, width / 2, y);
    y += size + gap;
  }
}

function faceLabel(name, width, height) {
  const key = `${name}|${width}|${height}`;
  let material = labelMaterials.get(key);
  if (!material) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = Math.max(256, Math.round(1024 * (height / width)));
    paintWords(canvas.getContext('2d'), canvas.width, canvas.height, name);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    labelMaterials.set(key, material);
  }
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    material,
  );
  label.userData.label = true;
  return label;
}

function yogurtCup(color, name) {
  const g = new THREE.Group();
  const sleeve = std(color);
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.036, 0.078, 20),
    sleeve,
  );
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.042, 0.003, 6, 18),
    std(0xf7f3ea),
  );
  const foil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.043, 0.043, 0.004, 20),
    std(0xc9cdd1, { metalness: 0.65, roughness: 0.22 }),
  );
  const tab = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.002, 0.02),
    std(0x78608d, { metalness: 0.45 }),
  );
  const lip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.042, 0.006, 20),
    std(0xf7f3ea),
  );
  const label = faceLabel(name, 0.064, 0.036);
  cup.position.y = 0.039;
  lip.position.y = 0.076;
  rim.position.y = 0.078;
  rim.rotation.x = Math.PI / 2;
  foil.position.y = 0.081;
  tab.position.set(0.03, 0.083, 0);
  label.position.set(0, 0.042, 0.043);
  g.add(cup, lip, rim, foil, tab, label);
  return g;
}

function milkCarton(color, name) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.128, 0.05),
    std(0xf6f3ec),
  );
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(0.074, 0.04, 0.052),
    std(color),
  );
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.012, 10),
    std(color, { roughness: 0.3 }),
  );
  const roofL = new THREE.Mesh(
    new THREE.BoxGeometry(0.074, 0.002, 0.036),
    std(0xf6f3ec),
  );
  const roofR = roofL.clone();
  const label = faceLabel(name, 0.064, 0.04);
  body.position.y = 0.064;
  band.position.y = 0.074;
  roofL.position.set(0, 0.142, 0.01);
  roofL.rotation.x = 0.85;
  roofR.position.set(0, 0.142, -0.01);
  roofR.rotation.x = -0.85;
  cap.position.set(0, 0.16, 0);
  label.position.set(0, 0.072, 0.027);
  g.add(body, band, roofL, roofR, cap, label);
  return g;
}

function sodaCan(color, name) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.036, 0.112, 24),
    std(color, { roughness: 0.28, metalness: 0.35 }),
  );
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.036, 0.012, 20),
    std(0xd9dde1, { metalness: 0.7, roughness: 0.2 }),
  );
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.004, 20),
    std(0xcfd4d8, { metalness: 0.75, roughness: 0.18 }),
  );
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.03, 0.0025, 6, 20),
    std(0xe8eaed, { metalness: 0.8 }),
  );
  const tab = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.0015, 0.02),
    std(0xd0d5da, { metalness: 0.8 }),
  );
  const label = faceLabel(name, 0.056, 0.034);
  body.position.y = 0.056;
  neck.position.y = 0.118;
  top.position.y = 0.126;
  rim.position.y = 0.126;
  rim.rotation.x = Math.PI / 2;
  tab.position.set(0, 0.129, 0.004);
  label.position.set(0, 0.056, 0.037);
  g.add(body, neck, top, rim, tab, label);
  return g;
}

function iceCreamTub(color, name) {
  const g = new THREE.Group();
  const tub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.056, 0.078, 24),
    std(0xf8f4ea),
  );
  const wrap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.053, 0.057, 0.04, 24),
    std(color),
  );
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.058, 0.01, 24),
    std(color, { roughness: 0.35 }),
  );
  const knob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.014, 0.008, 10),
    std(0xf8f4ea),
  );
  const label = faceLabel(name, 0.072, 0.038);
  tub.position.y = 0.039;
  wrap.position.y = 0.042;
  lid.position.y = 0.083;
  knob.position.y = 0.092;
  label.position.set(0, 0.042, 0.058);
  g.add(tub, wrap, lid, knob, label);
  return g;
}

function candy(color, name) {
  const g = new THREE.Group();
  const film = std(color, { roughness: 0.4 });
  const pouch = new THREE.Mesh(
    new THREE.BoxGeometry(0.078, 0.096, 0.024),
    film,
  );
  const seal = new THREE.Mesh(
    new THREE.BoxGeometry(0.078, 0.008, 0.008),
    std(0xf7f4ee, { roughness: 0.5 }),
  );
  const label = faceLabel(name, 0.068, 0.04);
  pouch.position.y = 0.048;
  seal.position.y = 0.098;
  label.position.set(0, 0.046, 0.013);
  g.add(pouch, seal, label);
  return g;
}

function chocolateBar(color, name) {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.118, 0.016),
    std(color, { roughness: 0.34, metalness: 0.08 }),
  );
  const label = faceLabel(name, 0.072, 0.042);
  bar.position.y = 0.059;
  label.position.set(0, 0.06, 0.009);
  g.add(bar, label);
  return g;
}

function biscuitPack(color, name) {
  const g = new THREE.Group();
  const pack = new THREE.Mesh(
    new THREE.BoxGeometry(0.104, 0.056, 0.032),
    std(color),
  );
  const label = faceLabel(name, 0.092, 0.042);
  pack.position.y = 0.028;
  label.position.set(0, 0.028, 0.017);
  g.add(pack, label);
  return g;
}

const pastryMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.84,
  metalness: 0.02,
  vertexColors: true,
});

function hornHook(t) {
  const reach = 0.24;
  const fromEnd = Math.min(t, 1 - t);
  if (fromEnd >= reach) return 0;
  const u = 1 - fromEnd / reach;
  return u * u;
}

function crescentPoint(t, radius, arc) {
  const half = arc / 2;
  const ang = -half + arc * t;
  const hook = hornHook(t);
  const side = t < 0.5 ? -1 : 1;
  return new THREE.Vector3(
    Math.sin(ang) * radius - side * hook * radius * 0.28,
    -Math.cos(ang) * radius + hook * radius * 0.2,
    0,
  );
}

function appendCrescent(positions, colors, indices, spec) {
  const {
    radius,
    arc,
    tube,
    depth,
    tubular,
    radial,
    t0,
    t1,
    phase,
    crust,
    butter,
    toast,
    grooves,
    taperPower = 1.35,
  } = spec;
  const base = positions.length / 3;
  const color = new THREE.Color();
  const samples = [];
  for (let i = 0; i <= tubular; i += 1) {
    const t = t0 + ((t1 - t0) * i) / tubular;
    samples.push(crescentPoint(t, radius, arc));
  }

  for (let i = 0; i <= tubular; i += 1) {
    const t = t0 + ((t1 - t0) * i) / tubular;
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(tubular, i + 1)];
    const tangent = next.clone().sub(prev);
    if (tangent.lengthSq() < 1e-8) tangent.set(1, 0, 0);
    tangent.normalize();
    let nx = -tangent.y;
    let ny = tangent.x;
    const point = samples[i];
    if (nx * point.x + ny * point.y < 0) {
      nx = -nx;
      ny = -ny;
    }
    const along = (t - t0) / (t1 - t0);
    const belly = Math.sin(Math.PI * along);
    const pinch = THREE.MathUtils.smoothstep(
      Math.min(along, 1 - along),
      0.015,
      0.11,
    );
    const taper = belly ** taperPower * (0.55 + 0.45 * pinch);
    const localTube = tube * Math.max(0.04, taper);

    for (let j = 0; j <= radial; j += 1) {
      const v = (j / radial) * Math.PI * 2 + phase;
      const stripe = Math.cos(v * grooves);
      const outward = Math.cos(v);
      const facing = Math.sin(v);
      const lip = taper * Math.max(0, stripe);
      const ridge = 1 + lip * 0.32;
      const n =
        outward * localTube * ridge * (0.88 + 0.22 * Math.max(0, outward));
      const b = facing * localTube * ridge * depth;
      positions.push(point.x + nx * n, point.y + ny * n, point.z + b);

      const crease = THREE.MathUtils.smoothstep(-stripe, -0.2, 0.85);
      color.copy(crust);
      color.lerp(toast, (1 - belly) * 0.5 + Math.max(0, outward) * 0.22);
      color.lerp(butter, crease * 0.72);
      colors.push(color.r, color.g, color.b);
    }
  }

  const stride = radial + 1;
  for (let i = 0; i < tubular; i += 1) {
    for (let j = 0; j < radial; j += 1) {
      const a = base + i * stride + j;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
}

function croissantGeometry(tint) {
  const crust = new THREE.Color(0xc47a32).lerp(new THREE.Color(tint), 0.16);
  const butter = crust.clone().lerp(new THREE.Color(0xf3d7a0), 0.7);
  const toast = crust.clone().lerp(new THREE.Color(0x3d1c0c), 0.5);
  const positions = [];
  const colors = [];
  const indices = [];
  const phase = ((tint >>> 0) % 5) * 0.2;
  const shared = { arc: Math.PI * 1.18, phase, crust, butter, toast };

  appendCrescent(positions, colors, indices, {
    ...shared,
    radius: 0.034,
    tube: 0.016,
    depth: 1.02,
    tubular: 80,
    radial: 18,
    t0: 0,
    t1: 1,
    grooves: 2,
    taperPower: 0.9,
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  const tilt = 0.34;
  const cosine = Math.cos(tilt);
  const sine = Math.sin(tilt);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const z = pos.getZ(i);
    pos.setY(i, y * cosine - z * sine);
    pos.setZ(i, y * sine + z * cosine);
  }
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  geo.translate(
    -(box.min.x + box.max.x) * 0.5,
    -box.min.y,
    -(box.min.z + box.max.z) * 0.15,
  );
  geo.computeVertexNormals();
  return geo;
}

function croissant(tint, name) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(croissantGeometry(tint), pastryMaterial));
  const label = faceLabel(name, 0.062, 0.034);
  label.position.set(0, 0.022, 0.03);
  g.add(label);
  return g;
}

function cerealBox(color, name) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.092, 0.152, 0.036),
    std(color),
  );
  const label = faceLabel(name, 0.082, 0.048);
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(0.092, 0.006, 0.036),
    std(color),
  );
  box.position.y = 0.076;
  lid.position.y = 0.155;
  label.position.set(0, 0.082, 0.019);
  g.add(box, lid, label);
  return g;
}

function chipsBag(color, name) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.016, 0.002);
  shape.lineTo(-0.036, 0.016);
  shape.bezierCurveTo(-0.046, 0.046, -0.044, 0.108, -0.032, 0.138);
  shape.lineTo(-0.018, 0.154);
  shape.lineTo(0.018, 0.154);
  shape.lineTo(0.032, 0.138);
  shape.bezierCurveTo(0.044, 0.108, 0.046, 0.046, 0.036, 0.016);
  shape.lineTo(0.016, 0.002);
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 1,
    curveSegments: 10,
  });
  geom.translate(0, 0, -0.008);
  const bag = new THREE.Mesh(geom, std(color, { roughness: 0.45 }));
  const label = faceLabel(name, 0.064, 0.038);
  label.position.set(0, 0.078, 0.014);
  g.add(bag, label);
  return g;
}

function sauceBottle(color, name) {
  const g = new THREE.Group();
  const glass = std(color, { roughness: 0.2, metalness: 0.08 });
  const capMat = std(0xf4f1ea, { roughness: 0.32, metalness: 0.28 });
  const bodyR = 0.034;
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyR, bodyR, 0.082, 24),
    glass,
  );
  const shoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, bodyR, 0.022, 24),
    glass,
  );
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.014, 0.03, 16),
    glass,
  );
  const lip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 0.006, 16),
    glass,
  );
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.015, 0.012, 20),
    capMat,
  );
  const label = faceLabel(name, 0.052, 0.034);
  body.position.y = 0.041;
  shoulder.position.y = 0.093;
  neck.position.y = 0.119;
  lip.position.y = 0.137;
  cap.position.y = 0.146;
  label.position.set(0, 0.044, bodyR + 0.001);
  g.add(body, shoulder, neck, lip, cap, label);
  return g;
}

function mealTray(color, name) {
  const g = new THREE.Group();
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.128, 0.016, 0.088),
    std(0x1c1c1c),
  );
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(0.136, 0.006, 0.096),
    std(0x2a2a2a),
  );
  const main = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.008, 0.07),
    std(color),
  );
  const side = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.008, 0.032),
    std(0x588157),
  );
  const sideB = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.008, 0.028),
    std(0xe9c46a),
  );
  const film = new THREE.Mesh(
    new THREE.BoxGeometry(0.124, 0.002, 0.084),
    std(0xdbeafe, { transparent: true, opacity: 0.32, roughness: 0.08 }),
  );
  const label = faceLabel(name, 0.1, 0.046);
  tray.position.y = 0.008;
  rim.position.y = 0.016;
  main.position.set(-0.022, 0.014, 0);
  side.position.set(0.036, 0.014, -0.016);
  sideB.position.set(0.036, 0.014, 0.018);
  film.position.y = 0.021;
  label.position.set(0, 0.042, 0.05);
  g.add(tray, rim, main, side, sideB, film, label);
  return g;
}

function plantPack(color, name) {
  const g = new THREE.Group();
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.096, 0.032, 0.062),
    std(0xd5e0da, { roughness: 0.28, transparent: true, opacity: 0.5 }),
  );
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(0.076, 0.022, 0.046),
    std(0xf7f4ec),
  );
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(0.096, 0.004, 0.062),
    std(color),
  );
  const label = faceLabel(name, 0.08, 0.04);
  tray.position.y = 0.016;
  block.position.y = 0.017;
  lid.position.y = 0.034;
  label.position.set(0, 0.048, 0.032);
  g.add(tray, block, lid, label);
  return g;
}

function proteinTub(color, name) {
  const g = new THREE.Group();
  const tub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.046, 0.05, 0.1, 24),
    std(color, { roughness: 0.4 }),
  );
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0475, 0.0515, 0.046, 24),
    std(0xf1faee),
  );
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.054, 0.054, 0.016, 24),
    std(0x13293d, { roughness: 0.34 }),
  );
  const label = faceLabel(name, 0.068, 0.04);
  tub.position.y = 0.05;
  band.position.y = 0.05;
  lid.position.y = 0.108;
  label.position.set(0, 0.052, 0.053);
  g.add(tub, band, lid, label);
  return g;
}

const BUILDERS = {
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

const templates = new Map();

function templateFor(category, variant) {
  const colors = VARIANTS[category.id];
  const names = NAMES[category.id];
  const colorIndex = variant % colors.length;
  const key = `${category.id}:${colorIndex}`;
  let template = templates.get(key);
  if (!template) {
    template = BUILDERS[category.id](colors[colorIndex], names[colorIndex]);
    template.userData.category = category;
    templates.set(key, template);
  }
  return template;
}

const FACINGS = 4;
const PRODUCT_SCALE = 1.85;
const FEATURE_SLOT = 1;
let glowMap;

function glowTexture() {
  if (glowMap) return glowMap;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,248,230,0.95)');
  gradient.addColorStop(0.28, 'rgba(255,196,90,0.55)');
  gradient.addColorStop(1, 'rgba(255,150,30,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  glowMap = new THREE.CanvasTexture(canvas);
  glowMap.colorSpace = THREE.SRGBColorSpace;
  return glowMap;
}

function markFeatured(item) {
  item.userData.spotlight = true;
  item.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const material = child.material.clone();
    material.emissive = new THREE.Color(0xffe0a8);
    material.emissiveIntensity = 0.8;
    child.material = material;
  });

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.105, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffc56a,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.007;
  halo.userData.halo = true;
  item.add(halo);

  const shine = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color: 0xfff1cc,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  shine.position.y = 0.045;
  shine.scale.set(0.08, 0.1, 1);
  shine.userData.shine = true;
  item.add(shine);

  const spark = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.022, 0),
    new THREE.MeshBasicMaterial({ color: 0xffc14d, toneMapped: false }),
  );
  spark.position.y = 0.19;
  spark.userData.spark = true;
  item.add(spark);

  const light = new THREE.PointLight(0xffcc80, 0.55, 0.72, 2);
  light.position.set(0, 0.12, 0.08);
  item.add(light);
}

export function fillShelf(bucket, category, y, width, depth, feature = false) {
  const featured = [];
  for (let i = 0; i < FACINGS; i += 1) {
    const spotlight = feature && i === FEATURE_SLOT;
    const item = templateFor(category, spotlight ? 0 : i).clone(true);
    const gap = (width - 0.42) / (FACINGS - 1);
    item.position.set(-width / 2 + 0.21 + i * gap, y, depth / 2 - 0.14);
    item.rotation.y = 0;
    item.scale.setScalar(PRODUCT_SCALE);
    item.userData.category = category;
    if (spotlight) {
      markFeatured(item);
      featured.push(item);
    } else {
      bucket.push(item);
    }
  }
  return featured;
}

export function pulseSpotlights(spotlights, time) {
  for (const item of spotlights) {
    const { base, baseRotY, phase } = item.userData;
    const buzz = Math.sin(time * 46 + phase);
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.7 + phase);
    item.position.x = base.x + buzz * 0.016;
    item.position.y = base.y + pulse * 0.022;
    item.position.z = base.z + Math.cos(time * 38 + phase) * 0.01;
    item.rotation.y = baseRotY + Math.sin(time * 22 + phase) * 0.07;
    item.rotation.z = buzz * 0.08;
    item.traverse((child) => {
      if (child.isPointLight) {
        child.intensity = 0.25 + pulse * 0.85;
      } else if (child.userData.halo) {
        child.material.opacity = 0.45 + pulse * 0.5;
        child.scale.setScalar(0.86 + pulse * 0.35);
      } else if (child.userData.shine) {
        const scale = 0.9 + pulse * 0.28;
        child.material.opacity = 0.28 + pulse * 0.28;
        child.scale.set(0.075 * scale, 0.1 * scale, 1);
      } else if (child.userData.spark) {
        child.scale.setScalar(0.75 + pulse * 0.55);
        child.rotation.y = time * 2.4 + phase;
        child.rotation.z = time * 1.6;
      } else if (child.isMesh && child.material?.emissive) {
        child.material.emissiveIntensity = 0.2 + pulse * 0.85;
      }
    });
  }
}

export function commitProducts(parent, category, groups, productMeshes) {
  const buckets = new Map();
  const matrix = new THREE.Matrix4();
  for (const group of groups) {
    group.updateMatrix();
    group.traverse((child) => {
      if (!child.isMesh || Array.isArray(child.material)) return;
      child.updateMatrix();
      const geom = child.geometry.clone();
      geom.applyMatrix4(matrix.multiplyMatrices(group.matrix, child.matrix));
      const key = child.material.uuid;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { material: child.material, geoms: [] };
        buckets.set(key, bucket);
      }
      bucket.geoms.push(geom);
    });
  }
  for (const { material, geoms } of buckets.values()) {
    const merged = mergeGeometries(geoms, false);
    for (const geom of geoms) geom.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, material);
    mesh.userData.category = category;
    parent.add(mesh);
    productMeshes.push(mesh);
  }
}
