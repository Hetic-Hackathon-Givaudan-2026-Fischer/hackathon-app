import * as THREE from 'three';
import { coversMarket } from './market.js';

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noise2(x, y) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function fbm(x, y) {
  return (
    noise2(x, y) * 0.5 +
    noise2(x * 2.1, y * 2.1) * 0.25 +
    noise2(x * 4.2, y * 4.2) * 0.125
  );
}

function onMarket(x, z) {
  return coversMarket(x, z, 2.8);
}

export function createNature(scene) {
  scene.background = new THREE.Color(0x8ec8ea);
  scene.fog = new THREE.FogExp2(0xc5d5df, 0.006);

  const hemi = new THREE.HemisphereLight(0xd8edff, 0x5d7a42, 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3d1, 1.35);
  sun.position.set(32, 48, 16);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xf0e6c8, 0.45));

  addTerrain(scene);
  addHills(scene);
  addTrees(scene);
  addPines(scene);
  addBushes(scene);
  addGrass(scene);
  addFlowers(scene);
  addRocks(scene);
  addClouds(scene);
}

function underFloor(x, z) {
  return coversMarket(x, z, 1.15);
}

function addTerrain(scene) {
  const geo = new THREE.PlaneGeometry(160, 160, 80, 80);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = [];
  const color = new THREE.Color();
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const dist = Math.hypot(x, z);
    const rise = dist > 30 ? Math.min(1, (dist - 30) / 16) : 0;
    pos.setY(i, underFloor(x, z) ? -0.16 : fbm(x * 0.04, z * 0.04) * 1.7 * rise);
    const n = fbm(x * 0.045, z * 0.045);
    const n2 = fbm(x * 0.12 + 8, z * 0.12);
    const lift = 0.88 + n * 0.14 + n2 * 0.04;
    color.setRGB(lift * 0.93, lift, lift * 0.8);
    colors.push(color.r, color.g, color.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const map = grassTexture();
  map.repeat.set(64, 64);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map,
      vertexColors: true,
      roughness: 1,
    }),
  );
  scene.add(mesh);
}

function addHills(scene) {
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x3d6b36, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x4a7c3d, roughness: 1 }),
  ];
  const rand = rng(11);
  for (let i = 0; i < 14; i += 1) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mats[i % 2]);
    const angle = (i / 14) * Math.PI * 2 + rand() * 0.25;
    const dist = 40 + rand() * 18;
    hill.scale.set(9 + rand() * 11, 2.4 + rand() * 2.2, 8 + rand() * 8);
    hill.position.set(Math.cos(angle) * dist, 0.2, Math.sin(angle) * dist);
    hill.receiveShadow = true;
    scene.add(hill);
  }
}

function addTrees(scene) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3b2a, roughness: 0.92 });
  const barkDark = new THREE.MeshStandardMaterial({ color: 0x3d2618, roughness: 0.9 });
  const foliageMats = [
    new THREE.MeshStandardMaterial({ color: 0x2f6a2c, roughness: 0.82 }),
    new THREE.MeshStandardMaterial({ color: 0x3f8a38, roughness: 0.82 }),
    new THREE.MeshStandardMaterial({ color: 0x1f4d1c, roughness: 0.82 }),
    new THREE.MeshStandardMaterial({ color: 0x4c9a40, roughness: 0.8 }),
  ];
  const rand = rng(42);

  for (let i = 0; i < 36; i += 1) {
    const tree = new THREE.Group();
    const h = 2.4 + rand() * 2.4;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 + rand() * 0.08, 0.22 + rand() * 0.1, h, 6), trunkMat);
    trunk.position.y = h / 2;
    tree.add(trunk);

    const branchCount = 2;
    for (let b = 0; b < branchCount; b += 1) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.055, 0.7 + rand() * 0.5, 5), barkDark);
      br.position.set((rand() - 0.5) * 0.2, h * (0.45 + rand() * 0.35), (rand() - 0.5) * 0.2);
      br.rotation.z = (rand() - 0.5) * 1.1;
      br.rotation.x = (rand() - 0.5) * 0.8;
      tree.add(br);
    }

    const blobs = 3;
    for (let f = 0; f < blobs; f += 1) {
      const foliage = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.85 + rand() * 0.45, 0),
        foliageMats[(i + f) % foliageMats.length],
      );
      foliage.position.set((rand() - 0.5) * 1.1, h + 0.15 + rand() * 0.9, (rand() - 0.5) * 1.1);
      foliage.scale.set(1 + rand() * 0.3, 0.9 + rand() * 0.4, 1 + rand() * 0.3);
      tree.add(foliage);
    }

    let x = 0;
    let z = 0;
    do {
      const angle = rand() * Math.PI * 2;
      const dist = 23 + rand() * 38;
      x = Math.cos(angle) * dist;
      z = Math.sin(angle) * dist;
    } while (onMarket(x, z) || Math.hypot(x, z) < 26);

    tree.position.set(x, 0, z);
    tree.rotation.y = rand() * Math.PI;
    tree.scale.setScalar(0.8 + rand() * 0.7);
    scene.add(tree);
  }
}

function addPines(scene) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3426, roughness: 0.9 });
  const needleMat = new THREE.MeshStandardMaterial({ color: 0x1e4d32, roughness: 0.78 });
  const rand = rng(77);
  for (let i = 0; i < 16; i += 1) {
    const pine = new THREE.Group();
    const h = 3.2 + rand() * 2.2;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, h, 6), trunkMat);
    trunk.position.y = h / 2;
    pine.add(trunk);
    for (let l = 0; l < 4; l += 1) {
      const r = 1.15 - l * 0.2;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, 1.2, 6), needleMat);
      cone.position.y = 1.3 + l * 0.78;
      pine.add(cone);
    }
    const angle = rand() * Math.PI * 2;
    const dist = 28 + rand() * 32;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (onMarket(x, z)) continue;
    pine.position.set(x, 0, z);
    pine.scale.setScalar(0.85 + rand() * 0.5);
    scene.add(pine);
  }
}

function addBushes(scene) {
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x3a7d34, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x2d5e28, roughness: 0.85 }),
  ];
  const rand = rng(19);
  for (let i = 0; i < 24; i += 1) {
    const bush = new THREE.Group();
    const n = 3;
    for (let k = 0; k < n; k += 1) {
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4 + rand() * 0.22, 0), mats[k % 2]);
      blob.position.set((rand() - 0.5) * 0.5, 0.28 + rand() * 0.2, (rand() - 0.5) * 0.5);
      bush.add(blob);
    }
    const angle = rand() * Math.PI * 2;
    const dist = 27 + rand() * 20;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (onMarket(x, z)) continue;
    bush.position.set(x, 0, z);
    scene.add(bush);
  }
}

function grassTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const rand = rng(5);
  const wrap = (x, y, radius, draw) => {
    const xs = [0];
    const ys = [0];
    if (x < radius) xs.push(size);
    if (x > size - radius) xs.push(-size);
    if (y < radius) ys.push(size);
    if (y > size - radius) ys.push(-size);
    xs.forEach((ox) => {
      ys.forEach((oy) => draw(x + ox, y + oy));
    });
  };
  ctx.fillStyle = '#4a6a38';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 140; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const g = 78 + rand() * 55;
    const radius = 16 + rand() * 36;
    const ry = radius * (0.55 + rand() * 0.3);
    const rot = rand() * Math.PI;
    ctx.fillStyle = `rgba(${36 + rand() * 28}, ${g}, ${24 + rand() * 22}, ${0.16 + rand() * 0.22})`;
    wrap(x, y, radius, (px, py) => {
      ctx.beginPath();
      ctx.ellipse(px, py, radius, ry, rot, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  for (let i = 0; i < 700; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 1.2 + rand() * 2;
    const h = 1 + rand();
    ctx.fillStyle = `rgba(${86 + rand() * 30}, ${64 + rand() * 18}, ${34}, ${0.12 + rand() * 0.18})`;
    wrap(x, y, 4, (px, py) => {
      ctx.fillRect(px, py, w, h);
    });
  }
  for (let i = 0; i < 11000; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const h = 4 + rand() * 11;
    const lean = (rand() - 0.5) * 5;
    const g = 82 + rand() * 70;
    ctx.strokeStyle = `rgba(${32 + rand() * 30}, ${g}, ${22 + rand() * 24}, ${0.35 + rand() * 0.4})`;
    ctx.lineWidth = 0.6 + rand() * 0.8;
    wrap(x, y, h + 6, (px, py) => {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + lean * 0.3, py - h * 0.55, px + lean, py - h);
      ctx.stroke();
    });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function bladeGeometry() {
  const w0 = 0.013;
  const w1 = 0.008;
  const h = 0.2;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([
    -w0, 0, 0,
    w0, 0, 0,
    -w1, h * 0.46, 0.01,
    w1, h * 0.46, 0.01,
    0, h, 0.034,
  ], 3));
  geo.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3]);
  geo.setAttribute('color', new THREE.Float32BufferAttribute([
    0.55, 0.62, 0.42,
    0.55, 0.62, 0.42,
    0.82, 0.9, 0.62,
    0.82, 0.9, 0.62,
    1, 1, 0.78,
  ], 3));
  geo.computeVertexNormals();
  return geo;
}

function addGrass(scene) {
  const geometry = bladeGeometry();
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.92,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  const count = 14000;
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const rand = rng(99);
  let placed = 0;
  let guard = 0;
  while (placed < count && guard < 9000) {
    guard += 1;
    let cx;
    let cz;
    if (rand() < 0.5) {
      cx = (rand() * 2 - 1) * 36;
      cz = 18.5 + rand() * 16;
    } else {
      const angle = rand() * Math.PI * 2;
      const dist = 28 + rand() * 24;
      cx = Math.cos(angle) * dist;
      cz = Math.sin(angle) * dist;
    }
    if (onMarket(cx, cz)) continue;
    const clump = 7 + Math.floor(rand() * 8);
    const hue = 0.26 + rand() * 0.06;
    for (let k = 0; k < clump && placed < count; k += 1) {
      const x = cx + (rand() - 0.5) * 0.42;
      const z = cz + (rand() - 0.5) * 0.42;
      if (onMarket(x, z)) continue;
      dummy.position.set(x, 0, z);
      dummy.rotation.set((rand() - 0.5) * 0.35, rand() * Math.PI * 2, (rand() - 0.5) * 0.28);
      const tall = rand() < 0.04 ? 0.95 + rand() * 0.35 : 0.22 + rand() * 0.4;
      dummy.scale.set(0.75 + rand() * 0.55, tall, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      if (rand() < 0.04) color.setHSL(0.18, 0.4, 0.28);
      else color.setHSL(hue + (rand() - 0.5) * 0.02, 0.55 + rand() * 0.25, 0.2 + rand() * 0.08);
      mesh.setColorAt(placed, color);
      placed += 1;
    }
  }
  mesh.count = placed;
  scene.add(mesh);
}

function addFlowers(scene) {
  const petalColors = [0xff6b6b, 0xffd166, 0xf1faee, 0xc77dff, 0x4cc9f0, 0xf72585];
  const stemGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.22, 5);
  stemGeo.translate(0, 0.11, 0);
  const headGeo = new THREE.SphereGeometry(0.04, 7, 5);
  headGeo.translate(0, 0.24, 0);
  const count = 90;
  const stems = new THREE.InstancedMesh(
    stemGeo,
    new THREE.MeshStandardMaterial({ color: 0x2d6a4f }),
    count,
  );
  const heads = new THREE.InstancedMesh(
    headGeo,
    new THREE.MeshStandardMaterial({ roughness: 0.45 }),
    count,
  );
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const rand = rng(7);
  let placed = 0;
  while (placed < count) {
    const angle = rand() * Math.PI * 2;
    const dist = 27 + rand() * 22;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (onMarket(x, z)) continue;
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, rand() * Math.PI, 0);
    dummy.scale.setScalar(0.85 + rand() * 0.5);
    dummy.updateMatrix();
    stems.setMatrixAt(placed, dummy.matrix);
    heads.setMatrixAt(placed, dummy.matrix);
    heads.setColorAt(placed, color.setHex(petalColors[placed % petalColors.length]));
    placed += 1;
  }
  scene.add(stems, heads);
}

function addRocks(scene) {
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x8d93a0, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: 0x6d717a, roughness: 0.92 }),
  ];
  const rand = rng(21);
  for (let i = 0; i < 20; i += 1) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + rand() * 0.5, 0), mats[i % 2]);
    const angle = rand() * Math.PI * 2;
    const dist = 27 + rand() * 24;
    rock.position.set(Math.cos(angle) * dist, 0.1 + rand() * 0.08, Math.sin(angle) * dist);
    rock.rotation.set(rand() * 2, rand() * 2, rand() * 2);
    rock.scale.set(1 + rand(), 0.45 + rand() * 0.55, 0.75 + rand());
    if (onMarket(rock.position.x, rock.position.z)) continue;
    scene.add(rock);
  }
}

function addClouds(scene) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf8fbff,
    roughness: 1,
    transparent: true,
    opacity: 0.92,
  });
  const rand = rng(3);
  for (let i = 0; i < 8; i += 1) {
    const cloud = new THREE.Group();
    const n = 3;
    for (let k = 0; k < n; k += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.1 + rand() * 0.8, 8, 6), mat);
      puff.position.set((rand() - 0.5) * 3.2, rand() * 0.4, (rand() - 0.5) * 1.6);
      puff.scale.set(1.4, 0.55, 1);
      cloud.add(puff);
    }
    const angle = rand() * Math.PI * 2;
    const dist = 10 + rand() * 40;
    cloud.position.set(Math.cos(angle) * dist, 16 + rand() * 8, Math.sin(angle) * dist);
    scene.add(cloud);
  }
}
