import * as THREE from 'three';
import {
  COPPER,
  FRAME,
  INK,
  IVORY,
  PAPER,
  TYPEFACE,
  menuColor,
} from '../brand.js';
import {
  CATEGORIES,
  commitProducts,
  fillShelf,
  pulseSpotlights,
} from './products.js';

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((item, index) =>
    ctx.fillText(item, x, startY + index * lineHeight),
  );
}

const textureCache = new Map();

function bake(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  textureCache.set(canvas.dataset.key, texture);
  return texture;
}

function fillPanel(ctx, width, height) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  const border = Math.max(8, Math.round(Math.min(width, height) * 0.055));
  ctx.strokeStyle = FRAME;
  ctx.lineWidth = border;
  ctx.strokeRect(border / 2, border / 2, width - border, height - border);
}

function aisleSignTexture(text, index) {
  const key = `aisle:${index}:${text}`;
  const cached = textureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.dataset.key = key;
  canvas.width = 512;
  canvas.height = 144;
  const ctx = canvas.getContext('2d');
  fillPanel(ctx, canvas.width, canvas.height);
  const accent = menuColor(index);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent;
  ctx.font = `500 28px ${TYPEFACE}`;
  ctx.fillText(String(index + 1).padStart(2, '0'), 52, 74);
  ctx.fillStyle = FRAME;
  ctx.fillRect(92, 36, 1, 72);
  ctx.fillStyle = INK;
  ctx.font = `500 26px ${TYPEFACE}`;
  wrapText(ctx, text, 292, 74, 380, 30);
  return bake(canvas);
}

function endCapTexture(text, index) {
  const key = `cap:${index}:${text}`;
  const cached = textureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.dataset.key = key;
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  fillPanel(ctx, canvas.width, canvas.height);
  const accent = menuColor(index);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent;
  ctx.font = `500 64px ${TYPEFACE}`;
  ctx.fillText(String(index + 1).padStart(2, '0'), 128, 128);
  ctx.fillRect(84, 176, 88, 3);
  ctx.fillStyle = INK;
  ctx.font = `500 22px ${TYPEFACE}`;
  wrapText(ctx, text, 128, 236, 200, 28);
  return bake(canvas);
}

function bladeTexture(index, label) {
  const key = `blade:${index}:${label}`;
  const cached = textureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.dataset.key = key;
  canvas.width = 640;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  fillPanel(ctx, canvas.width, canvas.height);
  const accent = index == null ? menuColor(4) : menuColor(index);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (index == null) {
    ctx.fillStyle = INK;
    ctx.font = `500 40px ${TYPEFACE}`;
    ctx.letterSpacing = '0.14em';
    ctx.fillText(label.toUpperCase(), 320, 72);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = accent;
    ctx.fillRect(250, 108, 140, 3);
  } else {
    ctx.fillStyle = accent;
    ctx.font = `500 36px ${TYPEFACE}`;
    ctx.fillText(String(index + 1).padStart(2, '0'), 58, 82);
    ctx.fillStyle = FRAME;
    ctx.fillRect(104, 40, 1, 80);
    ctx.fillStyle = INK;
    ctx.font = `500 26px ${TYPEFACE}`;
    wrapText(ctx, label, 364, 82, 470, 30);
  }
  return bake(canvas);
}

function linenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#E8E3D8';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(11, 18, 21, 0.05)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 256; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function repeatCanvas(canvas, repeatX, repeatY, srgb) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function stoneTexture(repeatX, repeatY) {
  const size = 512;
  const color = document.createElement('canvas');
  const rough = document.createElement('canvas');
  const bump = document.createElement('canvas');
  color.width = rough.width = bump.width = size;
  color.height = rough.height = bump.height = size;
  const c = color.getContext('2d');
  const r = rough.getContext('2d');
  const b = bump.getContext('2d');
  c.fillStyle = '#E4DFD4';
  c.fillRect(0, 0, size, size);
  r.fillStyle = '#a4a4a4';
  r.fillRect(0, 0, size, size);
  b.fillStyle = '#808080';
  b.fillRect(0, 0, size, size);

  for (let i = 0; i < 14; i += 1) {
    const x = 56 + ((i * 137) % (size - 112));
    const y = 56 + ((i * 89) % (size - 112));
    const rx = 16 + (i % 5) * 6;
    const ry = rx * (0.58 + (i % 4) * 0.08);
    const rot = (i % 7) * 0.38;
    const warm = i % 2 === 0;
    c.fillStyle = warm
      ? `rgba(132, 108, 82, ${0.12 + (i % 3) * 0.03})`
      : `rgba(255, 252, 246, ${0.14 + (i % 3) * 0.04})`;
    c.beginPath();
    c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    c.fill();
    r.fillStyle = warm ? 'rgba(30, 30, 30, 0.07)' : 'rgba(255, 255, 255, 0.05)';
    r.beginPath();
    r.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    r.fill();
  }

  for (let i = 0; i < 48; i += 1) {
    const x = 20 + ((i * 83) % (size - 40));
    const y = 20 + ((i * 61) % (size - 40));
    const rad = 10 + (i % 5) * 4;
    const dark = i % 3 !== 0;
    c.fillStyle = dark
      ? `rgba(124, 102, 78, ${0.08 + (i % 4) * 0.03})`
      : `rgba(255, 252, 246, ${0.1 + (i % 3) * 0.04})`;
    c.beginPath();
    c.ellipse(x, y, rad, rad * 0.7, (i % 5) * 0.45, 0, Math.PI * 2);
    c.fill();
  }

  for (let i = 0; i < 220; i += 1) {
    const x = 8 + ((i * 97) % (size - 16));
    const y = 8 + ((i * 57) % (size - 16));
    const light = i % 4 === 0;
    const w = 3 + (i % 5);
    const h = 2 + (i % 3);
    c.fillStyle = light ? 'rgba(255, 252, 246, 0.4)' : 'rgba(92, 74, 54, 0.18)';
    c.fillRect(x, y, w, h);
    b.fillStyle = light ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.22)';
    b.fillRect(x, y, w, h);
    r.fillStyle = light ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
    r.fillRect(x, y, w, h);
  }

  c.lineCap = 'round';
  b.lineCap = 'round';
  for (let i = 0; i < 5; i += 1) {
    const x = 64 + ((i * 71) % (size - 170));
    const y = 72 + ((i * 113) % (size - 170));
    const endY = y + (i % 2 ? 20 : -12);
    c.strokeStyle = `rgba(108, 94, 76, ${0.11 + (i % 3) * 0.03})`;
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + 34, y + 12 - i * 2, x + 76, endY);
    c.stroke();
    b.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    b.lineWidth = 1.2;
    b.beginPath();
    b.moveTo(x, y);
    b.quadraticCurveTo(x + 34, y + 12 - i * 2, x + 76, endY);
    b.stroke();
  }

  c.strokeStyle = 'rgba(11, 18, 21, 0.2)';
  c.lineWidth = 5;
  c.strokeRect(2.5, 2.5, size - 5, size - 5);
  r.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  r.lineWidth = 6;
  r.strokeRect(3, 3, size - 6, size - 6);
  b.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  b.lineWidth = 6;
  b.strokeRect(3, 3, size - 6, size - 6);

  return {
    map: repeatCanvas(color, repeatX, repeatY, true),
    roughnessMap: repeatCanvas(rough, repeatX, repeatY, false),
    bumpMap: repeatCanvas(bump, repeatX, repeatY, false),
  };
}

const glassMat = new THREE.MeshStandardMaterial({
  color: 0xe8f6ff,
  roughness: 0.08,
  metalness: 0.04,
  transparent: true,
  opacity: 0.2,
  depthWrite: false,
});
const windowGlass = glassMat.clone();
windowGlass.side = THREE.DoubleSide;
windowGlass.opacity = 0.28;
const ledWarm = new THREE.MeshStandardMaterial({
  color: 0xfaf6ee,
  emissive: 0xf0e2cc,
  emissiveIntensity: 0.85,
});
const ledCold = new THREE.MeshStandardMaterial({
  color: 0xf4f7f8,
  emissive: 0xd5e4ea,
  emissiveIntensity: 0.55,
});

const STORE = {
  minX: -6.5,
  maxX: 6.82,
  minZ: -18,
  maxZ: 11,
  wall: 0.28,
  height: 6.35,
};
const FACADE_SIGN = { width: 8.1, height: 1.72, y: 4.38 };
const PLAZA = 3.6;
const GONDOLA_LEN = 2.95;
const GONDOLA_DEPTH = 0.76;
const RUN_PITCH = 3.08;
const RUN_COUNT = 6;
const CROSS_INDEX = 2;
const WALL_GAPS = [1, 4];
const SIDE_WINDOWS = {
  sill: 3.12,
  head: 5.5,
  z0: -15.15,
  z1: 3.95,
  count: 5,
  width: 2.5,
};
const NORTH_TIP = -14.7;
const OPENINGS = [{ id: 'entree', x0: -3.24, x1: 3.56 }];
const WELCOME_BOARD = { x: -4.96, z: 7.15, yaw: Math.PI / 4 };
const SHORT_NAME = {
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

export function coversMarket(x, z, pad = 0) {
  return (
    x > STORE.minX - pad &&
    x < STORE.maxX + pad &&
    z > STORE.minZ - pad &&
    z < STORE.maxZ + PLAZA + pad
  );
}

const sectionSignGeo = new THREE.BoxGeometry(1.72, 0.46, 0.04);
const signMaterials = new Map();

function categorySignMaterial(category) {
  let material = signMaterials.get(category.id);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      map: aisleSignTexture(category.name, CATEGORIES.indexOf(category)),
      roughness: 0.5,
    });
    signMaterials.set(category.id, material);
  }
  return material;
}

function layoutPlan() {
  const byId = Object.fromEntries(
    CATEGORIES.map((category) => [category.id, category]),
  );
  const ids = [
    'confiseries',
    'chocolats',
    'snacks',
    'snacks',
    'sauces',
    'plats',
  ];
  const facing = 3.36;
  const back = 0.86;
  const wallInset = 0.51;
  let x = STORE.minX + wallInset;
  let rot = Math.PI / 2;
  const lines = [{ x, rot, category: byId[ids[0]] }];
  [facing, back, facing, back].forEach((step, index) => {
    x += step;
    rot = -rot;
    lines.push({ x, rot, category: byId[ids[index + 1]] });
  });
  rot = -rot;
  lines.push({
    x: STORE.maxX - (GONDOLA_DEPTH / 2 + 0.02),
    rot,
    category: byId[ids[lines.length]],
  });
  const aisles = [];
  for (let i = 0; i < lines.length; i += 2) {
    const left = lines[i].category;
    const right = lines[i + 1].category;
    const label =
      left.id === right.id
        ? SHORT_NAME[left.id]
        : `${SHORT_NAME[left.id]}  ·  ${SHORT_NAME[right.id]}`;
    aisles.push({ x: (lines[i].x + lines[i + 1].x) / 2, label });
  }
  const runZ = Array.from(
    { length: RUN_COUNT },
    (_, index) => NORTH_TIP + GONDOLA_LEN / 2 + index * RUN_PITCH,
  );
  const crossIndex = CROSS_INDEX;
  const wallGaps = WALL_GAPS;
  const fridgeIds = [
    'desserts-lactes',
    'produits-laitiers',
    'boissons',
    'glaces',
  ];
  const fridges = fridgeIds.map((id, index) => ({
    category: byId[id],
    x: STORE.minX + 1.825 + index * 3.17,
  }));
  return {
    lines,
    aisles,
    runZ,
    fridges,
    fridgeZ: -17.52,
    crossIndex,
    wallGaps,
  };
}

function bayPresent(lineIndex, index, plan) {
  if (index < 0 || index >= plan.runZ.length) return false;
  if (index === plan.crossIndex) return false;
  const onWall = lineIndex === 0 || lineIndex === plan.lines.length - 1;
  return !(onWall && plan.wallGaps.includes(index));
}

export function createMarket(scene) {
  const plan = layoutPlan();
  const group = new THREE.Group();
  const productMeshes = [];
  const colliders = [];
  const peg = linenTexture();

  const metal = new THREE.MeshStandardMaterial({
    color: 0x2a3338,
    roughness: 0.46,
    metalness: 0.22,
  });
  const metalDark = new THREE.MeshStandardMaterial({
    color: 0x0b1215,
    roughness: 0.58,
    metalness: 0.18,
  });
  const whiteShelf = new THREE.MeshStandardMaterial({
    color: 0xfaf9f6,
    roughness: 0.42,
    metalness: 0.04,
  });
  const mauve = new THREE.MeshStandardMaterial({
    color: 0x78608d,
    roughness: 0.42,
    metalness: 0.2,
  });
  const bumper = new THREE.MeshStandardMaterial({
    color: 0x8c5a32,
    roughness: 0.38,
    metalness: 0.55,
  });
  const pegMat = new THREE.MeshStandardMaterial({
    map: peg,
    roughness: 0.86,
    metalness: 0.02,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xfaf9f6,
    roughness: 0.92,
  });
  const gondolaCache = new Map();
  const fridgeCache = new Map();

  const doors = [];
  const spotlights = [];
  addShell(group, colliders, wallMat, metalDark, mauve, doors);
  addCeiling(group, plan);
  addColdWall(
    group,
    colliders,
    productMeshes,
    spotlights,
    plan,
    metalDark,
    bumper,
    whiteShelf,
    fridgeCache,
  );
  addAisles(
    group,
    colliders,
    productMeshes,
    spotlights,
    plan,
    metal,
    whiteShelf,
    metalDark,
    pegMat,
    gondolaCache,
  );
  addBlades(group, plan, metalDark);
  addMural(group, plan);
  addSlogan(group);
  addWelcomeBoard(group, colliders, plan, metalDark);

  scene.add(group);
  return {
    group,
    productMeshes,
    colliders,
    updateDoors: (position, dt) => slideDoors(doors, position, dt),
    updateSpotlights: (time) => pulseSpotlights(spotlights, time),
  };
}

function placeBay(
  group,
  colliders,
  category,
  bay,
  x,
  z,
  rotation,
  fridge,
  withSign,
) {
  bay.position.set(x, 0.1, z);
  bay.rotation.y = rotation;
  if (withSign) {
    const sign = new THREE.Mesh(sectionSignGeo, categorySignMaterial(category));
    sign.position.set(0, fridge ? 2.52 : 2.42, 0.34);
    bay.add(sign);
  }
  group.add(bay);
  if (fridge) {
    colliders.push({
      minX: x - 1.52,
      maxX: x + 1.52,
      minZ: z - 0.45,
      maxZ: z + 0.47,
    });
  } else if (Math.abs(rotation) < 0.2) {
    colliders.push({
      minX: x - 1.52,
      maxX: x + 1.52,
      minZ: z - 0.45,
      maxZ: z + 0.45,
    });
  } else {
    colliders.push({
      minX: x - 0.45,
      maxX: x + 0.45,
      minZ: z - 1.52,
      maxZ: z + 1.52,
    });
  }
}

function stockedBay(cache, key, build, productMeshes, spotlights) {
  let template = cache.get(key);
  if (!template) {
    template = build();
    cache.set(key, template);
  }
  const bay = template.clone(true);
  bay.traverse((child) => {
    if (child.userData.spotlight) {
      child.traverse((node) => {
        if ((node.isMesh || node.isSprite) && node.material)
          node.material = node.material.clone();
      });
      child.userData.base = child.position.clone();
      child.userData.baseRotY = child.rotation.y;
      child.userData.phase = spotlights.length * 1.37;
      spotlights.push(child);
    }
    if (!child.isMesh || child.userData.halo) return;
    if (!child.userData.category && child.parent?.userData?.category) {
      child.userData.category = child.parent.userData.category;
    }
    if (child.userData.category) productMeshes.push(child);
  });
  return bay;
}

function addAisles(
  group,
  colliders,
  productMeshes,
  spotlights,
  plan,
  metal,
  whiteShelf,
  metalDark,
  pegMat,
  cache,
) {
  plan.lines.forEach((line, lineIndex) => {
    const sides =
      line.rot > 0 ? { north: 1, south: -1 } : { north: -1, south: 1 };
    plan.runZ.forEach((z, index) => {
      if (!bayPresent(lineIndex, index, plan)) return;
      const openNorth = index === 0 || !bayPresent(lineIndex, index - 1, plan);
      const openSouth =
        index === plan.runZ.length - 1 ||
        !bayPresent(lineIndex, index + 1, plan);
      const capNorth = openNorth ? sides.north : 0;
      const capSouth = openSouth ? sides.south : 0;
      const hero = index === plan.runZ.length - 1;
      const bay = stockedBay(
        cache,
        `${line.category.id}:${capNorth}:${capSouth}:${hero ? 1 : 0}`,
        () =>
          createGondola(
            line.category,
            metal,
            whiteShelf,
            metalDark,
            pegMat,
            [],
            capNorth,
            capSouth,
            hero,
          ),
        productMeshes,
        spotlights,
      );
      placeBay(
        group,
        colliders,
        line.category,
        bay,
        line.x,
        z,
        line.rot,
        false,
        false,
      );
    });
  });
}

function addColdWall(
  group,
  colliders,
  productMeshes,
  spotlights,
  plan,
  metalDark,
  bumper,
  whiteShelf,
  cache,
) {
  plan.fridges.forEach((fridge, index) => {
    const hero = index % 2 === 0;
    const bay = stockedBay(
      cache,
      `${fridge.category.id}:${hero ? 1 : 0}`,
      () =>
        createFridge(fridge.category, metalDark, bumper, whiteShelf, [], hero),
      productMeshes,
      spotlights,
    );
    placeBay(
      group,
      colliders,
      fridge.category,
      bay,
      fridge.x,
      plan.fridgeZ,
      0,
      true,
      true,
    );
    if (index === plan.fridges.length - 1) return;
    const mullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 2.14, 0.16),
      metalDark,
    );
    mullion.position.set(
      (fridge.x + plan.fridges[index + 1].x) / 2,
      1.17,
      plan.fridgeZ,
    );
    group.add(mullion);
  });
}

function addBlade(group, x, z, index, label, metalDark, rotY) {
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 0.58),
    new THREE.MeshStandardMaterial({
      map: bladeTexture(index, label),
      roughness: 0.48,
      side: THREE.DoubleSide,
    }),
  );
  const y = 3.55;
  plate.position.set(x, y, z);
  plate.rotation.y = rotY;
  const rodLen = STORE.height - 0.12 - (y + 0.26);
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, rodLen, 6),
    metalDark,
  );
  rod.position.set(x, y + 0.26 + rodLen / 2, z);
  group.add(plate, rod);
}

function addBlades(group, plan, metalDark) {
  const southZ = plan.runZ[plan.runZ.length - 1] + GONDOLA_LEN / 2 + 0.62;
  plan.aisles.forEach((aisle, index) => {
    addBlade(group, aisle.x, southZ, index, aisle.label, metalDark, 0);
  });
  const midX = (STORE.minX + STORE.maxX) / 2;
  addBlade(
    group,
    midX,
    plan.runZ[plan.crossIndex],
    null,
    'Allée centrale',
    metalDark,
    Math.PI / 2,
  );
}

function addShell(group, colliders, wallMat, metalDark, accent, doors) {
  const { minX, maxX, minZ, maxZ, wall, height } = STORE;
  const width = maxX - minX;
  const depth = maxZ - minZ;
  const floorTop = 0.1;
  const floorW = width + wall * 2 + 0.8;
  const floorD = depth + wall * 2 + 0.8;
  const stone = stoneTexture(floorW / 0.82, floorD / 0.82);
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(floorW, 0.24, floorD),
    new THREE.MeshStandardMaterial({
      map: stone.map,
      roughnessMap: stone.roughnessMap,
      bumpMap: stone.bumpMap,
      bumpScale: 0.02,
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  const floorZ = (minZ + maxZ) / 2;
  floor.position.set(0, floorTop - 0.12, floorZ);
  group.add(floor);

  const apronDepth = PLAZA - 0.35;
  const apronStart = floorZ + floorD / 2 - 0.05;
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(width + 2.4, 0.22, apronDepth),
    floor.material,
  );
  apron.position.set(0, floorTop - 0.03 - 0.11, apronStart + apronDepth / 2);
  group.add(apron);

  const wallBottom = floorTop - 0.08;
  const rise = height - wallBottom;
  const wallCenter = wallBottom + rise / 2;
  addWall(
    group,
    colliders,
    wallMat,
    width + wall * 2,
    rise,
    wall,
    0,
    wallCenter,
    minZ - wall / 2,
  );
  addSideWall(
    group,
    colliders,
    wallMat,
    metalDark,
    minX - wall / 2,
    wallBottom,
  );
  addSideWall(
    group,
    colliders,
    wallMat,
    metalDark,
    maxX + wall / 2,
    wallBottom,
  );
  addFacade(group, colliders, wallMat, metalDark, floorTop, doors);

  const cornice = height - 0.08;
  const inlay = height - 0.22;
  addWall(
    group,
    null,
    metalDark,
    width + wall * 2,
    0.16,
    wall + 0.02,
    0,
    cornice,
    minZ - wall / 2,
  );
  addWall(
    group,
    null,
    metalDark,
    wall + 0.02,
    0.16,
    depth,
    minX - wall / 2,
    cornice,
    (minZ + maxZ) / 2,
  );
  addWall(
    group,
    null,
    metalDark,
    wall + 0.02,
    0.16,
    depth,
    maxX + wall / 2,
    cornice,
    (minZ + maxZ) / 2,
  );
  addWall(
    group,
    null,
    metalDark,
    width + wall * 2,
    0.16,
    wall + 0.02,
    0,
    cornice,
    maxZ + wall / 2,
  );
  addWall(
    group,
    null,
    accent,
    width + wall * 2,
    0.02,
    wall + 0.05,
    0,
    inlay,
    minZ - wall / 2,
  );
  addWall(
    group,
    null,
    accent,
    wall + 0.05,
    0.02,
    depth,
    minX - wall / 2,
    inlay,
    (minZ + maxZ) / 2,
  );
  addWall(
    group,
    null,
    accent,
    wall + 0.05,
    0.02,
    depth,
    maxX + wall / 2,
    inlay,
    (minZ + maxZ) / 2,
  );
  addWall(
    group,
    null,
    accent,
    width + wall * 2,
    0.02,
    wall + 0.05,
    0,
    inlay,
    maxZ + wall / 2,
  );

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.8, 0.1, 2.7),
    metalDark,
  );
  canopy.position.set(0, height - 0.32, maxZ + 1.4);
  const canopyLip = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.84, 0.028, 0.08),
    accent,
  );
  canopyLip.position.set(0, height - 0.39, maxZ + 2.72);
  const signZ = maxZ + wall + 0.05;
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(
      FACADE_SIGN.width + 0.14,
      FACADE_SIGN.height + 0.14,
      0.05,
    ),
    metalDark,
  );
  plate.position.set(0, FACADE_SIGN.y, signZ - 0.035);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(FACADE_SIGN.width, FACADE_SIGN.height),
    new THREE.MeshStandardMaterial({
      map: storeSign(),
      roughness: 0.62,
      metalness: 0.02,
    }),
  );
  face.position.set(0, FACADE_SIGN.y, signZ);
  group.add(canopy, canopyLip, plate, face);
}

function addFacade(group, colliders, wallMat, metalDark, floorTop, doors) {
  const { minX, maxX, maxZ, wall, height } = STORE;
  const z = maxZ + wall / 2;
  const wallBottom = floorTop - 0.08;
  const rise = height - wallBottom;
  const wallCenter = wallBottom + rise / 2;
  const spans = [];
  let cursor = minX;
  OPENINGS.forEach((opening) => {
    if (opening.x0 > cursor + 0.05) spans.push([cursor, opening.x0]);
    cursor = opening.x1;
  });
  if (maxX > cursor + 0.05) spans.push([cursor, maxX]);
  spans.forEach(([a, b]) => {
    addWall(
      group,
      colliders,
      wallMat,
      b - a,
      rise,
      wall,
      (a + b) / 2,
      wallCenter,
      z,
    );
  });

  const lintelH = height - 2.55;
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0xe7e2d8,
    transparent: true,
    opacity: 0.28,
    roughness: 0.08,
    metalness: 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  OPENINGS.forEach((opening) => {
    const w = opening.x1 - opening.x0;
    const cx = (opening.x0 + opening.x1) / 2;
    addWall(group, null, wallMat, w, lintelH, wall, cx, 2.55 + lintelH / 2, z);
    const panes = 8;
    const slice = w / panes;
    const leftCount = Math.floor(panes / 2);
    const leaves = [];
    for (let i = 0; i < panes; i += 1) {
      const side = i < leftCount ? -1 : 1;
      const local = side < 0 ? i : panes - 1 - i;
      const closedX = opening.x0 + (i + 0.5) * slice;
      const leaf = new THREE.Group();
      const paneZ = maxZ + 0.02 + local * 0.012;
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(slice - 0.08, 2.22),
        doorMat,
      );
      pane.position.set(0, 1.18, paneZ);
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 2.42, 0.06),
        metalDark,
      );
      jamb.position.set(-slice / 2, 1.2, paneZ + 0.015);
      leaf.add(pane, jamb);
      leaf.position.x = closedX;
      group.add(leaf);
      const half = slice / 2;
      const block = {
        minX: closedX - half,
        maxX: closedX + half,
        minZ: maxZ - 0.02,
        maxZ: maxZ + wall,
      };
      colliders.push(block);
      leaves.push({
        leaf,
        closedX,
        travel: side * local * slice * 0.97,
        half,
        block,
      });
    }
    const endJamb = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 2.42, 0.06),
      metalDark,
    );
    endJamb.position.set(opening.x1, 1.2, maxZ + 0.045);
    const header = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.05, 0.06),
      metalDark,
    );
    header.position.set(cx, 2.48, maxZ + 0.045);
    const mat = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.6, 0.012, 1.45),
      new THREE.MeshStandardMaterial({ color: 0x0b1215, roughness: 0.84 }),
    );
    mat.position.set(cx, floorTop + 0.014, maxZ - 1.2);
    group.add(endJamb, header, mat);
    doors.push({
      x0: opening.x0,
      x1: opening.x1,
      z: maxZ + 0.04,
      leaves,
      open: 0,
    });
  });
}

const DOOR_NEAR = 1.8;
const DOOR_FAR = 3.6;

function slideDoors(doors, position, dt) {
  const px = position.x;
  const pz = position.z;
  doors.forEach((door) => {
    const clampedX = Math.min(Math.max(px, door.x0), door.x1);
    const distance = Math.hypot(px - clampedX, pz - door.z);
    const span = DOOR_FAR - DOOR_NEAR;
    const t = Math.min(1, Math.max(0, (distance - DOOR_NEAR) / span));
    const eased = t * t * (3 - 2 * t);
    const inSlab =
      px > door.x0 - 0.3 && px < door.x1 + 0.3 && Math.abs(pz - door.z) < 0.7;
    const goal = inSlab ? 1 : 1 - eased;
    door.open += (goal - door.open) * (1 - Math.exp(-7 * dt));
    door.leaves.forEach((item) => {
      const x = item.closedX + item.travel * door.open;
      item.leaf.position.x = x;
      item.block.minX = x - item.half;
      item.block.maxX = x + item.half;
    });
  });
}

function addSideWall(group, colliders, wallMat, metalDark, x, wallBottom) {
  const { minZ, maxZ, wall, height } = STORE;
  const { sill, head, z0, z1, count, width } = SIDE_WINDOWS;
  const depth = maxZ - minZ;
  const zMid = (minZ + maxZ) / 2;
  const winH = head - sill;
  const midY = (sill + head) / 2;
  const bay = (z1 - z0) / count;

  addWall(
    group,
    colliders,
    wallMat,
    wall,
    sill - wallBottom,
    depth,
    x,
    wallBottom + (sill - wallBottom) / 2,
    zMid,
  );
  addWall(
    group,
    null,
    wallMat,
    wall,
    height - head,
    depth,
    x,
    head + (height - head) / 2,
    zMid,
  );

  let cursor = minZ;
  for (let i = 0; i < count; i += 1) {
    const center = z0 + bay * (i + 0.5);
    const a = center - width / 2;
    addWall(
      group,
      null,
      wallMat,
      wall,
      winH,
      a - cursor,
      x,
      midY,
      (cursor + a) / 2,
    );
    addHighWindow(group, metalDark, x, midY, center, width, winH);
    cursor = center + width / 2;
  }
  addWall(
    group,
    null,
    wallMat,
    wall,
    winH,
    maxZ - cursor,
    x,
    midY,
    (cursor + maxZ) / 2,
  );
}

function addHighWindow(group, metalDark, x, y, z, w, h) {
  const depth = STORE.wall + 0.06;
  const bar = 0.065;
  const win = new THREE.Group();
  const piece = (sx, sy, sz, px, py, pz) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), metalDark);
    mesh.position.set(px, py, pz);
    win.add(mesh);
  };
  piece(depth, bar, w + bar, 0, h / 2, 0);
  piece(depth, bar, w + bar, 0, -h / 2, 0);
  piece(depth, h + bar, bar, 0, 0, -w / 2);
  piece(depth, h + bar, bar, 0, 0, w / 2);
  piece(depth * 0.62, h - bar, 0.04, 0, 0, 0);
  piece(depth * 0.62, 0.04, w - bar, 0, 0, 0);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w - bar, h - bar),
    windowGlass,
  );
  glass.rotation.y = Math.PI / 2;
  win.add(glass);
  win.position.set(x, y, z);
  group.add(win);
}

function addWall(group, colliders, material, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  if (colliders && h > 1) {
    colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });
  }
}

function fittedSize(ctx, text, weight, size, maxWidth, min) {
  let next = size;
  ctx.font = `${weight} ${next}px ${TYPEFACE}`;
  while (next > min && ctx.measureText(text).width > maxWidth) {
    next -= 2;
    ctx.font = `${weight} ${next}px ${TYPEFACE}`;
  }
  return next;
}

function storeSign() {
  const key = 'store';
  const cached = textureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.dataset.key = key;
  canvas.height = 640;
  canvas.width = Math.round(
    canvas.height * (FACADE_SIGN.width / FACADE_SIGN.height),
  );
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const wordmark = 'G.F.T.E.';
  const subtitle = 'Givaudan Flavor Trends Experience';
  const maxText = canvas.width - Math.round(canvas.height * 0.36);
  const wordSize = fittedSize(
    ctx,
    wordmark,
    500,
    Math.round(canvas.height * 0.5),
    maxText,
    80,
  );
  const subSize = fittedSize(
    ctx,
    subtitle,
    400,
    Math.round(canvas.height * 0.15),
    maxText,
    28,
  );

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 ${wordSize}px ${TYPEFACE}`;
  const word = ctx.measureText(wordmark);
  ctx.font = `400 ${subSize}px ${TYPEFACE}`;
  const sub = ctx.measureText(subtitle);
  const wordUp = word.actualBoundingBoxAscent || wordSize * 0.72;
  const wordDown = word.actualBoundingBoxDescent || wordSize * 0.04;
  const subUp = sub.actualBoundingBoxAscent || subSize * 0.72;
  const subDown = sub.actualBoundingBoxDescent || subSize * 0.2;
  const ruleH = Math.max(3, Math.round(canvas.height * 0.008));
  const gapA = Math.round(canvas.height * 0.05);
  const gapB = Math.round(canvas.height * 0.048);
  const block = wordUp + wordDown + gapA + ruleH + gapB + subUp + subDown;
  let y = (canvas.height - block) / 2 + wordUp;

  ctx.fillStyle = IVORY;
  ctx.font = `500 ${wordSize}px ${TYPEFACE}`;
  ctx.fillText(wordmark, canvas.width / 2, y);
  y += wordDown + gapA;
  ctx.fillStyle = COPPER;
  const ruleW = Math.max(72, Math.round(word.width * 0.42));
  ctx.fillRect((canvas.width - ruleW) / 2, y, ruleW, ruleH);
  y += ruleH + gapB + subUp;
  ctx.fillStyle = IVORY;
  ctx.font = `400 ${subSize}px ${TYPEFACE}`;
  ctx.fillText(subtitle, canvas.width / 2, y);

  const inset = Math.round(canvas.height * 0.04);
  ctx.strokeStyle = 'rgba(250, 249, 246, 0.3)';
  ctx.lineWidth = Math.max(2, Math.round(canvas.height * 0.005));
  ctx.strokeRect(
    inset,
    inset,
    canvas.width - inset * 2,
    canvas.height - inset * 2,
  );

  const texture = bake(canvas);
  texture.anisotropy = 8;
  return texture;
}

const posterPlane = new THREE.PlaneGeometry(1, 1);
const posterLoader = new THREE.TextureLoader();
const posterMaterials = new Map();
const posterFrame = new THREE.MeshStandardMaterial({
  color: 0x3a4146,
  roughness: 0.55,
  metalness: 0.08,
});
const POSTER_CROP = {
  '/posters/herbs.webp': [94, 921],
  '/posters/fruits.webp': [88, 935],
  '/posters/citrus.webp': [92, 935],
  '/posters/vegetables.webp': [95, 1023],
  '/posters/rosemary.webp': [92, 943],
  '/posters/guarana.webp': [91, 932],
};

function posterRatio(src, fallback) {
  const crop = POSTER_CROP[src];
  if (!crop) return fallback;
  return 396 / (crop[1] + 1 - crop[0]);
}

function posterMaterial(src) {
  let material = posterMaterials.get(src);
  if (!material) {
    const map = posterLoader.load(src);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    map.generateMipmaps = true;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    const crop = POSTER_CROP[src];
    if (crop) {
      const span = (crop[1] + 1 - crop[0]) / 1024;
      map.offset.set(crop[0] / 1024, 0);
      map.repeat.set(span, 1);
    }
    material = new THREE.MeshStandardMaterial({
      map,
      roughness: 0.92,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2,
    });
    posterMaterials.set(src, material);
  }
  return material;
}

function addPoster(group, spec) {
  const height = spec.w * spec.ratio;
  const board = new THREE.Group();
  const frame = new THREE.Mesh(posterPlane, posterFrame);
  const pad = 0.05;
  frame.scale.set(spec.w + pad * 2, height + pad * 2, 1);
  const photo = new THREE.Mesh(posterPlane, posterMaterial(spec.src));
  photo.scale.set(spec.w, height, 1);
  photo.position.z = 0.012;
  board.add(frame, photo);
  board.position.set(spec.x, spec.y, spec.z);
  board.rotation.y = spec.rotY;
  group.add(board);
}

function addMural(group, plan) {
  const left = STORE.minX + 0.06;
  const right = STORE.maxX - 0.06;
  const back = STORE.minZ + 0.06;
  const faceLeft = Math.PI / 2;
  const faceRight = -Math.PI / 2;
  const faceBack = 0;
  const zOpen = (plan.runZ[plan.wallGaps[0]] + plan.runZ[plan.crossIndex]) / 2;
  const entranceSouth =
    plan.runZ[plan.runZ.length - 1] + GONDOLA_LEN / 2 + 0.45;
  const entranceNorth = STORE.maxZ - 0.4;
  const entranceZ = (entranceSouth + entranceNorth) / 2;
  const entranceSpan = entranceNorth - entranceSouth;
  const feelRatio = 1280 / 1920;
  const feelW = entranceSpan - 0.2;
  const feelH = feelW * feelRatio;
  const square = Math.min(entranceSpan - 0.7, 5.05);
  const posters = [
    {
      src: '/posters/fruits.webp',
      w: 2.7,
      ratio: posterRatio('/posters/fruits.webp'),
      x: left,
      y: 1.55,
      z: zOpen,
      rotY: faceLeft,
    },
    {
      src: '/posters/vegetables.webp',
      w: 2.7,
      ratio: posterRatio('/posters/vegetables.webp'),
      x: right,
      y: 1.55,
      z: zOpen,
      rotY: faceRight,
    },
    {
      src: '/posters/guarana.webp',
      w: 5.4,
      ratio: posterRatio('/posters/guarana.webp'),
      x: 0,
      y: 4.45,
      z: back,
      rotY: faceBack,
    },
    {
      src: '/posters/entrance-feel.webp',
      w: feelW,
      ratio: feelRatio,
      x: left,
      y: 0.48 + feelH / 2,
      z: entranceZ,
      rotY: faceLeft,
    },
    {
      src: '/posters/entrance-natural.webp',
      w: square,
      ratio: 1,
      x: right,
      y: 0.48 + square / 2,
      z: entranceZ,
      rotY: faceRight,
    },
  ];
  posters.forEach((spec) => addPoster(group, spec));
}

const SLOGAN = 'Human by nature';

function sloganTexture() {
  const key = 'slogan';
  const cached = textureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.dataset.key = key;
  canvas.width = 2048;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 214px ${TYPEFACE}`;
  ctx.fillText(SLOGAN, canvas.width / 2, canvas.height / 2 + 10);
  return bake(canvas);
}

function addSlogan(group) {
  const width = 7.2;
  const height = width * (360 / 2048);
  const plate = new THREE.Mesh(
    posterPlane,
    new THREE.MeshBasicMaterial({
      map: sloganTexture(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  plate.scale.set(width, height, 1);
  plate.position.set((STORE.minX + STORE.maxX) / 2, 4.4, STORE.maxZ - 0.04);
  plate.rotation.y = Math.PI;
  group.add(plate);
}

function leftLines(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let cursor = y;
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursor);
      line = word;
      cursor += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, cursor);
  return cursor + lineHeight;
}

function initiativeTexture(plan) {
  const key = 'initiative';
  const cached = textureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.dataset.key = key;
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = menuColor(0);
  ctx.fillRect(72, 78, 92, 6);
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `500 28px ${TYPEFACE}`;
  ctx.fillText('INITIATIVE', 72, 100);
  ctx.font = `500 84px ${TYPEFACE}`;
  ctx.fillText('G.F.T.E.', 72, 148);
  ctx.fillStyle = menuColor(4);
  ctx.font = `400 32px ${TYPEFACE}`;
  ctx.fillText('Givaudan Flavor Trends Experience', 72, 252);
  ctx.fillStyle = INK;
  ctx.font = `400 30px ${TYPEFACE}`;
  let y = 330;
  y = leftLines(
    ctx,
    'Ce showroom rend visibles les goûts qui portent l’offre alimentaire. Chaque allée regroupe des produits du quotidien autour d’une famille d’arômes, du frais au fond du magasin jusqu’aux snacks et aux plats préparés.',
    72,
    y,
    860,
    42,
  );
  leftLines(
    ctx,
    'On y voit comment une signature aromatique compose le rayon, et comment s’y repérer. Le plan situe les allées, la traversée centrale et le mur frais.',
    72,
    y + 8,
    860,
    42,
  );

  const ox = 1008;
  const oy = 118;
  const pw = 520;
  const ph = 640;
  const spanX = STORE.maxX - STORE.minX;
  const spanZ = STORE.maxZ - STORE.minZ;
  const sx = pw / spanX;
  const sz = ph / spanZ;
  const X = (value) => ox + (value - STORE.minX) * sx;
  const Z = (value) => oy + (value - STORE.minZ) * sz;

  ctx.fillStyle = '#F3F0E8';
  ctx.fillRect(ox, oy, pw, ph);
  ctx.fillStyle = INK;
  ctx.font = `500 22px ${TYPEFACE}`;
  ctx.fillText('Plan du magasin', ox, 72);

  plan.fridges.forEach((fridge) => {
    ctx.fillStyle = menuColor(CATEGORIES.indexOf(fridge.category));
    const w = 2.85 * sx;
    const d = 0.82 * sz;
    ctx.fillRect(X(fridge.x) - w / 2, Z(plan.fridgeZ - 0.41), w - 2, d);
  });
  plan.lines.forEach((line, lineIndex) => {
    ctx.fillStyle = menuColor(CATEGORIES.indexOf(line.category));
    const w = 0.68 * sx;
    const d = 2.55 * sz;
    plan.runZ.forEach((z, index) => {
      if (!bayPresent(lineIndex, index, plan)) return;
      ctx.fillRect(X(line.x) - w / 2, Z(z - 1.28), w, d - 3);
    });
  });
  ctx.fillStyle = INK;
  ctx.font = `500 16px ${TYPEFACE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const midX = (STORE.minX + STORE.maxX) / 2;
  ctx.fillText('Allée centrale', X(midX), Z(plan.runZ[plan.crossIndex]));

  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(ox + 2, oy + 2, pw - 4, ph - 4);
  ctx.strokeStyle = '#F3F0E8';
  ctx.lineWidth = 8;
  OPENINGS.forEach((opening) => {
    ctx.beginPath();
    ctx.moveTo(X(opening.x0) + 2, oy + ph - 2);
    ctx.lineTo(X(opening.x1) - 2, oy + ph - 2);
    ctx.stroke();
  });

  const hereX = X(WELCOME_BOARD.x);
  const hereZ = Z(WELCOME_BOARD.z);
  ctx.fillStyle = PAPER;
  ctx.fillRect(hereX - 78, hereZ - 34, 156, 26);
  ctx.fillStyle = menuColor(0);
  ctx.beginPath();
  ctx.arc(hereX, hereZ, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = `500 18px ${TYPEFACE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Vous êtes ici', hereX, hereZ - 14);
  ctx.textBaseline = 'top';
  ctx.fillStyle = PAPER;
  ctx.fillText('Frais', X((STORE.minX + STORE.maxX) / 2), oy + 10);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `400 18px ${TYPEFACE}`;
  ctx.fillStyle = INK;
  ctx.fillText('Couleurs : allées et frais', ox, oy + ph + 36);

  const texture = bake(canvas);
  texture.anisotropy = 8;
  return texture;
}

function addWelcomeBoard(group, colliders, plan, metalDark) {
  const width = 2.75;
  const length = 1.55;
  const angle = Math.PI / 6;
  const half = length / 2;
  const depth = half * Math.sin(angle);
  const lift = half * Math.cos(angle);
  const { x, z, yaw } = WELCOME_BOARD;
  const y = 0.18 + lift;
  const edge = new THREE.MeshStandardMaterial({
    color: 0x3a4146,
    roughness: 0.55,
    metalness: 0.08,
  });
  const backMat = new THREE.MeshStandardMaterial({
    color: 0xf3f0e8,
    roughness: 0.9,
  });
  const face = new THREE.MeshStandardMaterial({
    map: initiativeTexture(plan),
    roughness: 0.62,
  });
  const stand = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(width, length, 0.04), [
    edge,
    edge,
    edge,
    edge,
    edge,
    backMat,
  ]);
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.08, length - 0.08),
    face,
  );
  sheet.position.z = 0.024;
  board.add(sheet);
  board.position.set(0, y, 0);
  board.rotation.x = -angle;
  stand.add(board);

  const lip = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, 0.09), edge);
  lip.position.set(0, 0.145, depth);
  stand.add(lip);

  const topZ = -depth;
  const topY = y + lift;
  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, topY - 0.12, 0.05),
      metalDark,
    );
    post.position.set(side * (width / 2 - 0.22), (topY + 0.12) / 2, topZ);
    stand.add(post);
  });

  stand.position.set(x, 0, z);
  stand.rotation.y = yaw;
  group.add(stand);

  colliders.push({
    cx: x,
    cz: z,
    cos: Math.cos(yaw),
    sin: Math.sin(yaw),
    minLX: -width / 2,
    maxLX: width / 2,
    minLZ: topZ - 0.06,
    maxLZ: depth + 0.08,
  });
}

function addFluorescent(group, x, y, z, length, housing, glow, alongX) {
  const w = alongX ? length : 0.22;
  const d = alongX ? 0.22 : length;
  const shell = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), housing);
  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(
      Math.max(w * 0.9, 0.08),
      0.018,
      Math.max(d * 0.62, 0.08),
    ),
    glow,
  );
  shell.position.set(x, y, z);
  slot.position.set(x, y - 0.03, z);
  group.add(shell, slot);
}

function addCeiling(group, plan) {
  const { minX, maxX, minZ, maxZ, wall, height } = STORE;
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(maxX - minX + wall * 2, 0.12, maxZ - minZ + wall * 2),
    new THREE.MeshStandardMaterial({ color: 0xf3f0e8, roughness: 0.94 }),
  );
  slab.position.set(0, height + 0.06, (minZ + maxZ) / 2);
  group.add(slab);
  const housing = new THREE.MeshStandardMaterial({
    color: 0x0b1215,
    roughness: 0.6,
    metalness: 0.15,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: 0xfaf6ee,
    emissive: 0xf3e6d0,
    emissiveIntensity: 0.7,
  });
  const y = height - 0.4;
  plan.aisles.forEach((aisle) => {
    for (let i = 0; i < 5; i += 1) {
      addFluorescent(
        group,
        aisle.x,
        y,
        -12.15 + i * 3.55,
        3.15,
        housing,
        glow,
        false,
      );
    }
  });
  const span = STORE.maxX - STORE.minX;
  const across = [-0.36, 0, 0.36].map(
    (t) => (STORE.minX + STORE.maxX) / 2 + t * span,
  );
  across.forEach((x) => {
    addFluorescent(
      group,
      x,
      y,
      plan.runZ[plan.crossIndex],
      3.4,
      housing,
      glow,
      true,
    );
  });
  across.forEach((x) => {
    addFluorescent(group, x, y, -16.2, 2.5, housing, glow, true);
    addFluorescent(group, x, y, 5.35, 2.5, housing, glow, true);
    addFluorescent(group, x, y, 8.85, 2.3, housing, glow, true);
  });
}

const endCapMaterials = new Map();

function endCap(name, index, side) {
  const map = endCapTexture(name, index);
  let material = endCapMaterials.get(index);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ map, roughness: 0.72 });
    endCapMaterials.set(index, material);
  }
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.28), material);
  plate.position.set(side * 1.52, 1.12, 0.02);
  plate.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
  return plate;
}

const accentMaterials = new Map();

function accentMaterial(hex) {
  let material = accentMaterials.get(hex);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color: hex,
      roughness: 0.46,
      metalness: 0.16,
    });
    accentMaterials.set(hex, material);
  }
  return material;
}

function createGondola(
  category,
  metal,
  whiteShelf,
  metalDark,
  pegMat,
  productMeshes,
  capNorth,
  capSouth,
  feature,
) {
  const bay = new THREE.Group();
  const w = GONDOLA_LEN;
  const d = GONDOLA_DEPTH;
  const h = 2.08;

  const back = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, h, 0.04), pegMat);
  back.position.set(0, h / 2, -d / 2 + 0.02);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, d - 0.05), metal);
  const right = left.clone();
  left.position.set(-w / 2 + 0.025, h / 2, 0.02);
  right.position.set(w / 2 - 0.025, h / 2, 0.02);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.03, 0.02),
    accentMaterial(menuColor(CATEGORIES.indexOf(category))),
  );
  stripe.position.set(0, 0.17, d / 2);
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.08, 0.04, d - 0.05),
    metal,
  );
  top.position.set(0, h, 0.015);
  bay.add(back, left, right, stripe, top);
  const capIndex = CATEGORIES.indexOf(category);
  if (capNorth) bay.add(endCap(category.name, capIndex, capNorth));
  if (capSouth) bay.add(endCap(category.name, capIndex, capSouth));

  const shelfYs = [0.26, 0.68, 1.1, 1.52, 1.9];
  const stock = [];
  shelfYs.forEach((y) => {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.08, 0.028, d - 0.06),
      whiteShelf,
    );
    board.position.set(0, y, 0.01);
    const lip = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.1, 0.022, 0.028),
      metal,
    );
    lip.position.set(0, y - 0.018, d / 2 - 0.03);
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.22, 0.008, 0.018),
      ledWarm,
    );
    led.position.set(0, y + 0.02, -0.05);
    bay.add(board, lip, led);
    const heroes = fillShelf(
      stock,
      category,
      y + 0.014,
      w - 0.12,
      d,
      feature && shelfYs.indexOf(y) === 3,
    );
    heroes.forEach((item) => bay.add(item));
  });
  commitProducts(bay, category, stock, productMeshes);

  return bay;
}

function createFridge(
  category,
  metalDark,
  bumper,
  whiteShelf,
  productMeshes,
  feature,
) {
  const bay = new THREE.Group();
  const w = 2.95;
  const d = 0.8;
  const h = 2.14;

  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), metalDark);
  back.position.set(0, h / 2, -d / 2);
  const sideL = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, h, d - 0.06),
    metalDark,
  );
  const sideR = sideL.clone();
  sideL.position.set(-w / 2 + 0.035, h / 2, 0.01);
  sideR.position.set(w / 2 - 0.035, h / 2, 0.01);
  const cabinetTop = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.04, 0.08, d - 0.06),
    metalDark,
  );
  cabinetTop.position.set(0, h - 0.04, 0.01);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.2, 0.12, d - 0.14),
    metalDark,
  );
  base.position.set(0, 0.09, 0.02);
  const interior = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.16, h - 0.3, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xf6f3ec, roughness: 0.62 }),
  );
  interior.position.set(0, h / 2, -d / 2 + 0.08);
  bay.add(back, sideL, sideR, cabinetTop, base, interior);

  const doorW = (w - 0.18) / 2;
  const doorH = h - 0.36;
  for (let i = 0; i < 2; i += 1) {
    const cx = i === 0 ? -doorW / 2 - 0.02 : doorW / 2 + 0.02;
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(doorW - 0.06, doorH - 0.06),
      glassMat,
    );
    door.position.set(cx, h / 2 + 0.02, d / 2 + 0.02);
    const frameV1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, doorH, 0.04),
      metalDark,
    );
    const frameV2 = frameV1.clone();
    frameV1.position.set(cx - doorW / 2 + 0.02, h / 2, d / 2 + 0.02);
    frameV2.position.set(cx + doorW / 2 - 0.02, h / 2, d / 2 + 0.02);
    const frameH1 = new THREE.Mesh(
      new THREE.BoxGeometry(doorW, 0.035, 0.04),
      metalDark,
    );
    const frameH2 = frameH1.clone();
    frameH1.position.set(cx, h / 2 + doorH / 2, d / 2 + 0.02);
    frameH2.position.set(cx, h / 2 - doorH / 2, d / 2 + 0.02);
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8),
      bumper,
    );
    handle.position.set(cx + (i === 0 ? 0.52 : -0.52), h / 2, d / 2 + 0.05);
    bay.add(door, frameV1, frameV2, frameH1, frameH2, handle);
  }

  const mid = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, h - 0.28, 0.05),
    metalDark,
  );
  mid.position.set(0, h / 2, d / 2 + 0.02);
  const rail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, w - 0.15, 12),
    bumper,
  );
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, 0.3, d / 2 + 0.07);
  bay.add(mid, rail);

  const shelfYs = [0.34, 0.78, 1.22, 1.66];
  const stock = [];
  shelfYs.forEach((y) => {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.22, 0.02, d - 0.18),
      whiteShelf,
    );
    board.position.set(0, y, 0);
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.3, 0.006, 0.016),
      ledCold,
    );
    led.position.set(0, y + 0.04, -d / 2 + 0.14);
    bay.add(board, led);
    const heroes = fillShelf(
      stock,
      category,
      y + 0.012,
      w - 0.3,
      d - 0.1,
      feature && shelfYs.indexOf(y) === 2,
    );
    heroes.forEach((item) => bay.add(item));
  });
  commitProducts(bay, category, stock, productMeshes);

  return bay;
}
