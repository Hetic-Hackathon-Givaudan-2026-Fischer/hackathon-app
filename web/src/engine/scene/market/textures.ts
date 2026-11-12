// Textures dessinées au canvas : panneaux de rayon, lames, toile perforée.
import type * as THREE from 'three';
import { FRAME, INK, PAPER, TYPEFACE, menuColor } from '../../../brand';
import {
  canvasTexture,
  createSurface,
  fillCentered,
  wrapWords,
} from '../shared/canvas';
import { cached } from '../shared/cache';

const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Texture de texte mise en cache par `key` (mipmaps, anisotropie) ;
 * `draw` ne sert qu'au premier appel.
 */
export function bakedTexture(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  anisotropy = 4,
): THREE.CanvasTexture {
  return cached(textureCache, key, () => {
    const { canvas, ctx } = createSurface(width, height);
    draw(ctx);
    return canvasTexture(canvas, { anisotropy, mipmaps: true });
  });
}

/** Fond papier encadré, bordure proportionnelle au panneau. */
function fillPanel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  const border = Math.max(8, Math.round(Math.min(width, height) * 0.055));
  ctx.strokeStyle = FRAME;
  ctx.lineWidth = border;
  ctx.strokeRect(border / 2, border / 2, width - border, height - border);
}

/** Numéro de rubrique sur deux chiffres (« 01 »). */
function sectionNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

function centerText(ctx: CanvasRenderingContext2D): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
}

/** Enseigne de rubrique posée sur les frigos. */
export function aisleSignTexture(
  text: string,
  index: number,
): THREE.CanvasTexture {
  return bakedTexture(`aisle:${index}:${text}`, 512, 144, (ctx) => {
    fillPanel(ctx, 512, 144);
    centerText(ctx);
    ctx.fillStyle = menuColor(index);
    ctx.font = `500 28px ${TYPEFACE}`;
    ctx.fillText(sectionNumber(index), 52, 74);
    ctx.fillStyle = FRAME;
    ctx.fillRect(92, 36, 1, 72);
    ctx.fillStyle = INK;
    ctx.font = `500 26px ${TYPEFACE}`;
    fillCentered(ctx, wrapWords(ctx, text, 380), 292, 74, 30);
  });
}

/** Tête de gondole : grand numéro, filet, nom de la rubrique. */
export function endCapTexture(
  text: string,
  index: number,
): THREE.CanvasTexture {
  return bakedTexture(`cap:${index}:${text}`, 256, 384, (ctx) => {
    fillPanel(ctx, 256, 384);
    centerText(ctx);
    ctx.fillStyle = menuColor(index);
    ctx.font = `500 64px ${TYPEFACE}`;
    ctx.fillText(sectionNumber(index), 128, 128);
    ctx.fillRect(84, 176, 88, 3);
    ctx.fillStyle = INK;
    ctx.font = `500 22px ${TYPEFACE}`;
    fillCentered(ctx, wrapWords(ctx, text, 200), 128, 236, 28);
  });
}

/** Lame sans numéro : titre espacé en capitales, souligné. */
function drawTitleBlade(ctx: CanvasRenderingContext2D, label: string): void {
  ctx.fillStyle = INK;
  ctx.font = `500 40px ${TYPEFACE}`;
  ctx.letterSpacing = '0.14em';
  ctx.fillText(label.toUpperCase(), 320, 72);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = menuColor(4);
  ctx.fillRect(250, 108, 140, 3);
}

/** Lame d'allée : numéro, séparateur, libellé. */
function drawAisleBlade(
  ctx: CanvasRenderingContext2D,
  index: number,
  label: string,
): void {
  ctx.fillStyle = menuColor(index);
  ctx.font = `500 36px ${TYPEFACE}`;
  ctx.fillText(sectionNumber(index), 58, 82);
  ctx.fillStyle = FRAME;
  ctx.fillRect(104, 40, 1, 80);
  ctx.fillStyle = INK;
  ctx.font = `500 26px ${TYPEFACE}`;
  fillCentered(ctx, wrapWords(ctx, label, 470), 364, 82, 30);
}

/** Lame suspendue ; `index` nul pour l'allée centrale. */
export function bladeTexture(
  index: number | null,
  label: string,
): THREE.CanvasTexture {
  return bakedTexture(`blade:${index}:${label}`, 640, 160, (ctx) => {
    fillPanel(ctx, 640, 160);
    centerText(ctx);
    if (index === null) drawTitleBlade(ctx, label);
    else drawAisleBlade(ctx, index, label);
  });
}

/** Toile lignée du fond des gondoles. */
export function linenTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createSurface(256, 256);
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
  return canvasTexture(canvas, { repeat: [2, 3] });
}
