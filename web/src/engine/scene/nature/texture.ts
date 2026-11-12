// Texture de gazon peinte au canvas, répétable sans couture sur le terrain.
import type * as THREE from 'three';
import { canvasTexture, createSurface } from '../shared/canvas';
import { rng, type Random } from './random';

const SIZE = 512;

type Draw = (x: number, y: number) => void;

/** Dessine le motif et ses copies décalées quand il déborde d'un bord. */
function drawWrapped(x: number, y: number, radius: number, draw: Draw): void {
  const xs = [0];
  const ys = [0];
  if (x < radius) xs.push(SIZE);
  if (x > SIZE - radius) xs.push(-SIZE);
  if (y < radius) ys.push(SIZE);
  if (y > SIZE - radius) ys.push(-SIZE);
  for (const ox of xs) {
    for (const oy of ys) draw(x + ox, y + oy);
  }
}

/** Tache de verdure elliptique. */
function paintPatch(ctx: CanvasRenderingContext2D, rand: Random): void {
  const x = rand() * SIZE;
  const y = rand() * SIZE;
  const g = 78 + rand() * 55;
  const radius = 16 + rand() * 36;
  const ry = radius * (0.55 + rand() * 0.3);
  const rot = rand() * Math.PI;
  ctx.fillStyle = `rgba(${36 + rand() * 28}, ${g}, ${24 + rand() * 22}, ${0.16 + rand() * 0.22})`;
  drawWrapped(x, y, radius, (px, py) => {
    ctx.beginPath();
    ctx.ellipse(px, py, radius, ry, rot, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** Petit grain de terre. */
function paintGrit(ctx: CanvasRenderingContext2D, rand: Random): void {
  const x = rand() * SIZE;
  const y = rand() * SIZE;
  const w = 1.2 + rand() * 2;
  const h = 1 + rand();
  ctx.fillStyle = `rgba(${86 + rand() * 30}, ${64 + rand() * 18}, 34, ${0.12 + rand() * 0.18})`;
  drawWrapped(x, y, 4, (px, py) => {
    ctx.fillRect(px, py, w, h);
  });
}

/** Brin d'herbe courbé. */
function paintBlade(ctx: CanvasRenderingContext2D, rand: Random): void {
  const x = rand() * SIZE;
  const y = rand() * SIZE;
  const h = 4 + rand() * 11;
  const lean = (rand() - 0.5) * 5;
  const g = 82 + rand() * 70;
  ctx.strokeStyle = `rgba(${32 + rand() * 30}, ${g}, ${22 + rand() * 24}, ${0.35 + rand() * 0.4})`;
  ctx.lineWidth = 0.6 + rand() * 0.8;
  drawWrapped(x, y, h + 6, (px, py) => {
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + lean * 0.3, py - h * 0.55, px + lean, py - h);
    ctx.stroke();
  });
}

/** Texture de gazon répétée 64 × 64 fois sur le terrain. */
export function grassTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createSurface(SIZE, SIZE);
  const rand = rng(5);
  ctx.fillStyle = '#4a6a38';
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < 140; i += 1) paintPatch(ctx, rand);
  for (let i = 0; i < 700; i += 1) paintGrit(ctx, rand);
  for (let i = 0; i < 11000; i += 1) paintBlade(ctx, rand);
  return canvasTexture(canvas, { anisotropy: 8, repeat: [64, 64] });
}
