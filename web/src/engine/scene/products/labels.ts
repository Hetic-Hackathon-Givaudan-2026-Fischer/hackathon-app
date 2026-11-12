// Étiquettes imprimées sur la face avant des produits.
import * as THREE from 'three';
import { INK, TYPEFACE } from '../../../brand';
import { canvasTexture, createSurface, fillCentered } from '../shared/canvas';
import { cached } from '../shared/cache';

const LABEL_PAPER = '#FFFDF8';
const CANVAS_WIDTH = 1024;
const MIN_CANVAS_HEIGHT = 256;
const MIN_FONT_SIZE = 36;

const labelMaterials = new Map<string, THREE.MeshBasicMaterial>();

interface WordFit {
  size: number;
  gap: number;
}

function fontOf(size: number): string {
  return `500 ${size}px ${TYPEFACE}`;
}

function widestWord(
  ctx: CanvasRenderingContext2D,
  words: readonly string[],
  size: number,
): number {
  ctx.font = fontOf(size);
  return words.reduce(
    (max, word) => Math.max(max, ctx.measureText(word).width),
    0,
  );
}

/** Taille de police (pas de 2 px) pour un mot par ligne dans la zone. */
function fitWords(
  ctx: CanvasRenderingContext2D,
  words: readonly string[],
  maxWidth: number,
  maxHeight: number,
): WordFit {
  const count = words.length;
  let size = Math.floor(maxHeight / count);
  while (size > MIN_FONT_SIZE && widestWord(ctx, words, size) > maxWidth)
    size -= 2;
  const gap = Math.round(size * 0.16);
  while (size > MIN_FONT_SIZE && size * count + gap * (count - 1) > maxHeight)
    size -= 2;
  return { size, gap };
}

/** Un mot par ligne, centré, encre sur papier. */
function paintWords(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  name: string,
): void {
  const words = name.split(' ');
  ctx.fillStyle = LABEL_PAPER;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const { size, gap } = fitWords(ctx, words, width * 0.9, height * 0.84);
  ctx.font = fontOf(size);
  fillCentered(ctx, words, width / 2, height / 2, size + gap);
}

function paintLabel(
  name: string,
  width: number,
  height: number,
): THREE.MeshBasicMaterial {
  const canvasHeight = Math.max(
    MIN_CANVAS_HEIGHT,
    Math.round(CANVAS_WIDTH * (height / width)),
  );
  const { canvas, ctx } = createSurface(CANVAS_WIDTH, canvasHeight);
  paintWords(ctx, canvas.width, canvas.height, name);
  const map = canvasTexture(canvas, { anisotropy: 8, mipmaps: true });
  return new THREE.MeshBasicMaterial({ map, toneMapped: false });
}

/** Plan portant le nom du produit, texture partagée par nom et format. */
export function faceLabel(
  name: string,
  width: number,
  height: number,
): THREE.Mesh {
  const material = cached(labelMaterials, `${name}|${width}|${height}`, () =>
    paintLabel(name, width, height),
  );
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}
