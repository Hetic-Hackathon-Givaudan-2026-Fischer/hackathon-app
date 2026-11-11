import * as THREE from 'three';
import { TYPEFACE } from '../brand.js';

export const SCAN_RANGE = 3;

const FIRE_DURATION = 0.62;
const FORWARD = new THREE.Vector3(0, 0, -1);
const UP = new THREE.Vector3(0, 1, 0);

const rightRest = new THREE.Vector3(0.2, -0.128, -0.2);
const rightAway = new THREE.Vector3(0.2, -0.32, -0.16);
const leftRest = new THREE.Vector3(-0.18, -0.158, -0.2);
const leftRead = new THREE.Vector3(0.0, 0.0, -0.34);
const tabletRestScale = 0.28;
const tabletReadScale = 1.12;

const from = new THREE.Vector3();
const to = new THREE.Vector3();
const dir = new THREE.Vector3();
const punch = new THREE.Vector3();
const rightHold = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, 0.12, -0.04));
const lowQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.15, 0.15, -0.85));
const tabletRest = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.42, 0.55, 0.02));
const tabletRead = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.06, 0.04, 0));

function orient(mesh, start, end) {
  dir.subVectors(end, start);
  const length = dir.length();
  if (length < 0.02) {
    mesh.visible = false;
    return 0;
  }
  dir.multiplyScalar(1 / length);
  mesh.visible = true;
  mesh.position.copy(start);
  mesh.quaternion.setFromUnitVectors(UP, dir);
  mesh.scale.y = length;
  return length;
}

function wrapLines(ctx, text, maxWidth) {
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
  if (line) lines.push(line);
  return lines;
}

function makeScreen() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  function paint(name, blurb) {
    ctx.fillStyle = '#F7F4EE';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#BE5800';
    ctx.fillRect(0, 0, canvas.width, 16);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#677000';
    ctx.font = `500 28px ${TYPEFACE}`;
    ctx.fillText('SCAN', 56, 78);
    if (!name) {
      ctx.fillStyle = '#0B1215';
      ctx.font = `500 48px ${TYPEFACE}`;
      ctx.fillText('En attente', 56, 200);
      ctx.fillStyle = '#414141';
      ctx.font = `400 32px ${TYPEFACE}`;
      wrapLines(ctx, 'Scannez un produit à moins de 3 m.', 900).forEach((line, index) => {
        ctx.fillText(line, 56, 270 + index * 44);
      });
    } else {
      ctx.fillStyle = '#0B1215';
      ctx.font = `500 52px ${TYPEFACE}`;
      const titles = wrapLines(ctx, name, 900);
      titles.forEach((line, index) => ctx.fillText(line, 56, 168 + index * 62));
      const ruleY = 168 + titles.length * 62 + 8;
      ctx.fillStyle = '#BE5800';
      ctx.fillRect(56, ruleY, 84, 4);
      ctx.fillStyle = '#414141';
      ctx.font = `400 32px ${TYPEFACE}`;
      wrapLines(ctx, blurb, 900).forEach((line, index) => {
        ctx.fillText(line, 56, ruleY + 56 + index * 44);
      });
      ctx.fillStyle = '#677000';
      ctx.font = `500 24px ${TYPEFACE}`;
      ctx.fillText('CLIQUER POUR RANGER', 56, canvas.height - 48);
    }
    texture.needsUpdate = true;
  }

  paint('', '');
  return { texture, paint };
}

function makeScanner() {
  const root = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x1c2226, roughness: 0.62, metalness: 0.16 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xbe5800, roughness: 0.4, metalness: 0.22 });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x140406,
    emissive: 0xff2a38,
    emissiveIntensity: 0.12,
    roughness: 0.18,
    metalness: 0.1,
  });
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x102016,
    emissive: 0x8dffc4,
    emissiveIntensity: 0.2,
    roughness: 0.3,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.016, 0.052), shell);
  body.position.set(0, 0.006, -0.004);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.002, 20), windowMat);
  glass.rotation.x = Math.PI / 2;
  glass.position.set(0, 0.006, -0.031);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.0014, 0.028), copper);
  stripe.position.set(0, 0.0146, 0);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.0075, 0.03, 12), shell);
  grip.position.set(0, -0.01, 0.01);
  grip.rotation.x = 0.18;
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.0035, 0.0016, 0.0025), ledMat);
  led.position.set(0.008, 0.0148, 0.014);

  const trigger = new THREE.Object3D();
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.006, -0.034);

  root.add(body, glass, stripe, grip, led, trigger, muzzle);
  return { root, windowMat, ledMat, trigger, triggerRest: 0, muzzle };
}

function makeTablet(screenMap) {
  const root = new THREE.Group();
  const bezel = new THREE.MeshStandardMaterial({ color: 0x1c2226, roughness: 0.46, metalness: 0.4 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xbe5800, roughness: 0.4, metalness: 0.28 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.186, 0.01), bezel);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.254, 0.156),
    new THREE.MeshBasicMaterial({ map: screenMap, toneMapped: false }),
  );
  screen.position.z = 0.006;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.006, 0.011), copper);
  lip.position.y = 0.09;
  root.add(body, screen, lip);
  return root;
}

function makeBeam() {
  const geometry = new THREE.CylinderGeometry(0.011, 0.011, 1, 10, 1, false);
  geometry.translate(0, 0.5, 0);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xff2438,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    toneMapped: false,
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff6b78,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    toneMapped: false,
  });
  const beam = new THREE.Mesh(geometry, beamMat);
  const glow = new THREE.Mesh(geometry, glowMat);
  glow.scale.set(2.4, 1, 2.4);
  const sweep = new THREE.Mesh(geometry, beamMat.clone());
  sweep.material.color.setHex(0xfff2f4);
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.25, 'rgba(255,50,70,0.95)');
  gradient.addColorStop(1, 'rgba(255,30,50,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const impact = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  }));
  impact.scale.setScalar(0.09);
  const group = new THREE.Group();
  group.name = 'scan-beam';
  group.add(beam, glow, sweep, impact);
  group.visible = false;
  return { group, beam, glow, sweep, impact, beamMat, glowMat, sweepMat: sweep.material };
}

export function createGear() {
  const root = new THREE.Group();
  root.name = 'gear';
  const screen = makeScreen();
  const scanner = makeScanner();
  const tablet = makeTablet(screen.texture);
  const right = new THREE.Group();
  const aim = new THREE.Group();
  aim.scale.setScalar(0.82);
  aim.add(scanner.root);
  right.add(aim);
  root.add(right, tablet);

  root.traverse((child) => {
    child.layers.set(1);
    child.frustumCulled = false;
  });

  const laser = makeBeam();
  let fireAge = -1;
  let recoil = 0;
  let denyT = -1;
  const target = new THREE.Vector3();

  function hideLaser() {
    laser.group.visible = false;
  }

  function fire(point) {
    target.copy(point);
    fireAge = 0;
    recoil = 1;
    laser.group.visible = true;
  }

  function deny() {
    if (fireAge >= 0) return;
    denyT = 0;
  }

  function show(name, blurb) {
    screen.paint(name, blurb);
  }

  function update(dt, time, ready, moving, focus) {
    if (!root.visible) {
      fireAge = -1;
      hideLaser();
      return;
    }
    const idle = 1 - focus;
    const bob = (moving ? Math.sin(time * 8.2) : Math.sin(time * 1.5) * 0.35) * 0.014 * idle;
    const sway = (moving ? Math.cos(time * 4.1) : 0) * 0.008 * idle;

    right.position.lerpVectors(rightRest, rightAway, focus);
    right.position.x += sway;
    right.position.y += bob;

    aim.quaternion.copy(rightHold).slerp(lowQuat, focus);
    if (denyT >= 0) {
      denyT += dt;
      const u = denyT / 0.22;
      if (u >= 1) denyT = -1;
      else {
        const shake = new THREE.Quaternion().setFromAxisAngle(
          UP,
          Math.sin(u * Math.PI * 3) * (1 - u) * 0.16,
        );
        aim.quaternion.multiply(shake);
      }
    }

    recoil = Math.max(0, recoil - dt / 0.26);
    const kick = Math.sin(Math.min(recoil, 1) * Math.PI) * 0.035;
    punch.copy(FORWARD).applyQuaternion(aim.quaternion);
    right.position.addScaledVector(punch, -kick);
    scanner.trigger.rotation.x = scanner.triggerRest + kick * 8;

    const live = ready && focus < 0.2;
    scanner.windowMat.emissiveIntensity = live ? 0.35 + Math.sin(time * 7) * 0.12 : 0.06 + focus * 0.2;
    scanner.ledMat.emissive.setHex(fireAge >= 0 ? 0xff4455 : (live ? 0x39f29a : 0x9ad7ff));
    scanner.ledMat.emissiveIntensity = fireAge >= 0 ? 1.4 : (live ? 0.9 : 0.15);

    tablet.position.lerpVectors(leftRest, leftRead, focus);
    tablet.position.y += bob * 0.65;
    tablet.quaternion.copy(tabletRest).slerp(tabletRead, focus);
    tablet.scale.setScalar(tabletRestScale + (tabletReadScale - tabletRestScale) * focus);

    if (fireAge < 0) {
      hideLaser();
      return;
    }
    fireAge += dt;
    const u = fireAge / FIRE_DURATION;
    if (u >= 1) {
      fireAge = -1;
      hideLaser();
      return;
    }
    root.updateWorldMatrix(true, true);
    scanner.muzzle.getWorldPosition(from);
    const grow = Math.min(1, u / 0.22);
    const fade = u < 0.62 ? 1 : 1 - (u - 0.62) / 0.38;
    to.copy(target).sub(from).multiplyScalar(grow).add(from);
    laser.group.visible = true;
    orient(laser.beam, from, to);
    laser.glow.position.copy(laser.beam.position);
    laser.glow.quaternion.copy(laser.beam.quaternion);
    laser.glow.scale.set(2.6, laser.beam.scale.y, 2.6);
    laser.glow.visible = laser.beam.visible;
    const tip = Math.max(0, grow - 0.08);
    const sweepStart = from.clone().lerp(target, tip * 0.75);
    const sweepEnd = from.clone().lerp(target, grow);
    orient(laser.sweep, sweepStart, sweepEnd);
    laser.beamMat.opacity = 0.9 * fade;
    laser.glowMat.opacity = 0.32 * fade;
    laser.sweepMat.opacity = 0.95 * fade;
    laser.impact.position.copy(to);
    laser.impact.material.opacity = grow * fade;
    laser.impact.visible = grow > 0.15;
  }

  return {
    object: root,
    beam: laser.group,
    fire,
    deny,
    show,
    update,
  };
}
