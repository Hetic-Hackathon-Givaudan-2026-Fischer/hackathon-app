// Écran de la tablette : fiche du dernier produit scanné, dessinée au canvas.
import type * as THREE from 'three';
import { COPPER, INK, TYPEFACE, menuColor } from '../../../brand';
import {
  canvasTexture,
  createSurface,
  fillFrom,
  wrapWords,
} from '../shared/canvas';
import { SCAN_RANGE } from './range';

const WIDTH = 1024;
const HEIGHT = 680;
const MARGIN = 56;
const TEXT_WIDTH = 900;
const TITLE_Y = 168;
const TITLE_LINE = 62;
const BODY_LINE = 44;
const BACKGROUND = '#F7F4EE';
const BODY = '#414141';
/** Vert olive de la charte (#677000). */
const OLIVE = menuColor(1);

export interface Screen {
  texture: THREE.CanvasTexture;
  /** Affiche un produit ; nom vide : écran d'attente. */
  paint(name: string, blurb: string): void;
}

/** Couleur et police du prochain texte. */
function pen(
  ctx: CanvasRenderingContext2D,
  color: string,
  weight: number,
  size: number,
): void {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${TYPEFACE}`;
}

function paintFrame(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = COPPER;
  ctx.fillRect(0, 0, WIDTH, 16);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  pen(ctx, OLIVE, 500, 28);
  ctx.fillText('SCAN', MARGIN, 78);
}

function paintIdle(ctx: CanvasRenderingContext2D): void {
  pen(ctx, INK, 500, 48);
  ctx.fillText('En attente', MARGIN, 200);
  pen(ctx, BODY, 400, 32);
  const hint = `Scannez un produit à moins de ${SCAN_RANGE} m.`;
  fillFrom(ctx, wrapWords(ctx, hint, TEXT_WIDTH), MARGIN, 270, BODY_LINE);
}

function paintProduct(
  ctx: CanvasRenderingContext2D,
  name: string,
  blurb: string,
): void {
  pen(ctx, INK, 500, 52);
  const titles = wrapWords(ctx, name, TEXT_WIDTH);
  fillFrom(ctx, titles, MARGIN, TITLE_Y, TITLE_LINE);
  const ruleY = TITLE_Y + titles.length * TITLE_LINE + 8;
  ctx.fillStyle = COPPER;
  ctx.fillRect(MARGIN, ruleY, 84, 4);
  pen(ctx, BODY, 400, 32);
  fillFrom(
    ctx,
    wrapWords(ctx, blurb, TEXT_WIDTH),
    MARGIN,
    ruleY + 56,
    BODY_LINE,
  );
  pen(ctx, OLIVE, 500, 24);
  ctx.fillText('CLIQUER POUR RANGER', MARGIN, HEIGHT - 48);
}

/** Crée l'écran, affiché en attente. */
export function createScreen(): Screen {
  const { canvas, ctx } = createSurface(WIDTH, HEIGHT);
  const texture = canvasTexture(canvas, { anisotropy: 8 });
  const paint = (name: string, blurb: string): void => {
    paintFrame(ctx);
    if (name) paintProduct(ctx, name, blurb);
    else paintIdle(ctx);
    texture.needsUpdate = true;
  };
  paint('', '');
  return { texture, paint };
}
