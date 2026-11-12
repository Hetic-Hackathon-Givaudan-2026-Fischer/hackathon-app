// Dallage en pierre claire : couleur, rugosité et relief dessinés en miroir.
import type * as THREE from 'three';
import { canvasTexture, createSurface } from '../shared/canvas';

const SIZE = 512;
const FULL_TURN = Math.PI * 2;

/** Les trois calques d'une même dalle. */
interface StoneLayers {
  color: CanvasRenderingContext2D;
  rough: CanvasRenderingContext2D;
  bump: CanvasRenderingContext2D;
}

export interface StoneMaps {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

function fillLayer(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  [x, y, rx, ry, rot]: readonly [number, number, number, number, number],
): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, FULL_TURN);
  ctx.fill();
}

/** Grandes taches chaudes ou claires (couleur et rugosité). */
function drawBlotches({ color, rough }: StoneLayers): void {
  for (let i = 0; i < 14; i += 1) {
    const rx = 16 + (i % 5) * 6;
    const shape = [
      56 + ((i * 137) % (SIZE - 112)),
      56 + ((i * 89) % (SIZE - 112)),
      rx,
      rx * (0.58 + (i % 4) * 0.08),
      (i % 7) * 0.38,
    ] as const;
    const warm = i % 2 === 0;
    color.fillStyle = warm
      ? `rgba(132, 108, 82, ${0.12 + (i % 3) * 0.03})`
      : `rgba(255, 252, 246, ${0.14 + (i % 3) * 0.04})`;
    ellipse(color, shape);
    rough.fillStyle = warm
      ? 'rgba(30, 30, 30, 0.07)'
      : 'rgba(255, 255, 255, 0.05)';
    ellipse(rough, shape);
  }
}

/** Petites inclusions, couleur seule. */
function drawSpecks({ color }: StoneLayers): void {
  for (let i = 0; i < 48; i += 1) {
    const rad = 10 + (i % 5) * 4;
    const dark = i % 3 !== 0;
    color.fillStyle = dark
      ? `rgba(124, 102, 78, ${0.08 + (i % 4) * 0.03})`
      : `rgba(255, 252, 246, ${0.1 + (i % 3) * 0.04})`;
    ellipse(color, [
      20 + ((i * 83) % (SIZE - 40)),
      20 + ((i * 61) % (SIZE - 40)),
      rad,
      rad * 0.7,
      (i % 5) * 0.45,
    ]);
  }
}

/** Grain fin sur les trois calques. */
function drawGrit({ color, rough, bump }: StoneLayers): void {
  for (let i = 0; i < 220; i += 1) {
    const x = 8 + ((i * 97) % (SIZE - 16));
    const y = 8 + ((i * 57) % (SIZE - 16));
    const light = i % 4 === 0;
    const w = 3 + (i % 5);
    const h = 2 + (i % 3);
    color.fillStyle = light
      ? 'rgba(255, 252, 246, 0.4)'
      : 'rgba(92, 74, 54, 0.18)';
    color.fillRect(x, y, w, h);
    bump.fillStyle = light
      ? 'rgba(255, 255, 255, 0.45)'
      : 'rgba(0, 0, 0, 0.22)';
    bump.fillRect(x, y, w, h);
    rough.fillStyle = light
      ? 'rgba(0, 0, 0, 0.08)'
      : 'rgba(255, 255, 255, 0.1)';
    rough.fillRect(x, y, w, h);
  }
}

function curve(ctx: CanvasRenderingContext2D, i: number): void {
  const x = 64 + ((i * 71) % (SIZE - 170));
  const y = 72 + ((i * 113) % (SIZE - 170));
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 34, y + 12 - i * 2, x + 76, y + (i % 2 ? 20 : -12));
  ctx.stroke();
}

/** Veines fines, en couleur et en creux. */
function drawVeins({ color, bump }: StoneLayers): void {
  color.lineCap = 'round';
  bump.lineCap = 'round';
  for (let i = 0; i < 5; i += 1) {
    color.strokeStyle = `rgba(108, 94, 76, ${0.11 + (i % 3) * 0.03})`;
    color.lineWidth = 1.1;
    curve(color, i);
    bump.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    bump.lineWidth = 1.2;
    curve(bump, i);
  }
}

/** Joints au bord de la dalle (répétée, elle forme le calepinage). */
function drawJoints({ color, rough, bump }: StoneLayers): void {
  color.strokeStyle = 'rgba(11, 18, 21, 0.2)';
  color.lineWidth = 5;
  color.strokeRect(2.5, 2.5, SIZE - 5, SIZE - 5);
  rough.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  rough.lineWidth = 6;
  rough.strokeRect(3, 3, SIZE - 6, SIZE - 6);
  bump.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  bump.lineWidth = 6;
  bump.strokeRect(3, 3, SIZE - 6, SIZE - 6);
}

/** Dalle répétée `repeatX` × `repeatY` fois. */
export function stoneTexture(repeatX: number, repeatY: number): StoneMaps {
  const color = createSurface(SIZE, SIZE);
  const rough = createSurface(SIZE, SIZE);
  const bump = createSurface(SIZE, SIZE);
  const layers = { color: color.ctx, rough: rough.ctx, bump: bump.ctx };
  fillLayer(layers.color, '#E4DFD4');
  fillLayer(layers.rough, '#a4a4a4');
  fillLayer(layers.bump, '#808080');
  [drawBlotches, drawSpecks, drawGrit, drawVeins, drawJoints].forEach((draw) =>
    draw(layers),
  );
  const repeat = [repeatX, repeatY] as const;
  return {
    map: canvasTexture(color.canvas, { srgb: true, anisotropy: 8, repeat }),
    roughnessMap: canvasTexture(rough.canvas, {
      srgb: false,
      anisotropy: 8,
      repeat,
    }),
    bumpMap: canvasTexture(bump.canvas, { srgb: false, anisotropy: 8, repeat }),
  };
}
