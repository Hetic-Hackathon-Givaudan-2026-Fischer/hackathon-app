// Enseigne de façade : sigle, filet cuivre et nom complet sur fond encre.
import type * as THREE from 'three';
import { COPPER, INK, IVORY, TYPEFACE } from '../../../brand';
import { FACADE_SIGN } from './layout';
import { bakedTexture } from './textures';

const WORDMARK = 'G.F.T.E.';
const SUBTITLE = 'Givaudan Flavor Trends Experience';
const SIGN_H = 640;
const SIGN_W = Math.round(SIGN_H * (FACADE_SIGN.width / FACADE_SIGN.height));

/** Ligne de texte mesurée : police, largeur, jambages haut et bas. */
interface Measured {
  text: string;
  font: string;
  width: number;
  up: number;
  down: number;
}

function fontOf(weight: number, size: number): string {
  return `${weight} ${size}px ${TYPEFACE}`;
}

/** Plus grande taille (pas de 2 px, au moins `min`) qui tient dans `maxWidth`. */
function fittedSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  size: number,
  maxWidth: number,
  min: number,
): number {
  let next = size;
  ctx.font = fontOf(weight, next);
  while (next > min && ctx.measureText(text).width > maxWidth) {
    next -= 2;
    ctx.font = fontOf(weight, next);
  }
  return next;
}

/** Mesure `text` ; les ratios remplacent les jambages si le navigateur les ignore. */
function measure(
  ctx: CanvasRenderingContext2D,
  text: string,
  [weight, size]: readonly [number, number],
  [upRatio, downRatio]: readonly [number, number],
): Measured {
  const font = fontOf(weight, size);
  ctx.font = font;
  const metrics = ctx.measureText(text);
  return {
    text,
    font,
    width: metrics.width,
    up: metrics.actualBoundingBoxAscent || size * upRatio,
    down: metrics.actualBoundingBoxDescent || size * downRatio,
  };
}

/** Sigle, filet et sous-titre, centrés verticalement comme un bloc. */
function drawLockup(
  ctx: CanvasRenderingContext2D,
  word: Measured,
  sub: Measured,
): void {
  const ruleH = Math.max(3, Math.round(SIGN_H * 0.008));
  const gapA = Math.round(SIGN_H * 0.05);
  const gapB = Math.round(SIGN_H * 0.048);
  const block = word.up + word.down + gapA + ruleH + gapB + sub.up + sub.down;
  let y = (SIGN_H - block) / 2 + word.up;
  ctx.fillStyle = IVORY;
  ctx.font = word.font;
  ctx.fillText(word.text, SIGN_W / 2, y);
  y += word.down + gapA;
  ctx.fillStyle = COPPER;
  const ruleW = Math.max(72, Math.round(word.width * 0.42));
  ctx.fillRect((SIGN_W - ruleW) / 2, y, ruleW, ruleH);
  y += ruleH + gapB + sub.up;
  ctx.fillStyle = IVORY;
  ctx.font = sub.font;
  ctx.fillText(sub.text, SIGN_W / 2, y);
}

function drawInset(ctx: CanvasRenderingContext2D): void {
  const inset = Math.round(SIGN_H * 0.04);
  ctx.strokeStyle = 'rgba(250, 249, 246, 0.3)';
  ctx.lineWidth = Math.max(2, Math.round(SIGN_H * 0.005));
  ctx.strokeRect(inset, inset, SIGN_W - inset * 2, SIGN_H - inset * 2);
}

/** Tailles du sigle et du sous-titre, réduites pour tenir avec les marges. */
function fitSizes(ctx: CanvasRenderingContext2D): readonly [number, number] {
  const maxText = SIGN_W - Math.round(SIGN_H * 0.36);
  return [
    fittedSize(ctx, WORDMARK, 500, Math.round(SIGN_H * 0.5), maxText, 80),
    fittedSize(ctx, SUBTITLE, 400, Math.round(SIGN_H * 0.15), maxText, 28),
  ];
}

function drawStoreSign(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, SIGN_W, SIGN_H);
  const [wordSize, subSize] = fitSizes(ctx);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const word = measure(ctx, WORDMARK, [500, wordSize], [0.72, 0.04]);
  const sub = measure(ctx, SUBTITLE, [400, subSize], [0.72, 0.2]);
  drawLockup(ctx, word, sub);
  drawInset(ctx);
}

export function storeSignTexture(): THREE.CanvasTexture {
  return bakedTexture('store', SIGN_W, SIGN_H, drawStoreSign, 8);
}
