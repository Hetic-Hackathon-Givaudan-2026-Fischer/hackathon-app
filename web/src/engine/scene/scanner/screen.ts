// Écran de la tablette : fiche du dernier rayon scanné, dessinée au canvas.
import type * as THREE from 'three';
import { COPPER, INK, TYPEFACE, menuColor } from '../../../brand';
import type { ScanCard, ScanRow } from '../../types';
import {
  canvasTexture,
  createSurface,
  fillFrom,
  fitLine,
  wrapWords,
} from '../shared/canvas';
import { SCAN_RANGE } from './range';

const WIDTH = 1024;
const HEIGHT = 680;
const MARGIN = 56;
const TEXT_WIDTH = 900;
const TITLE_Y = 150;
const TITLE_LINE = 56;
const BODY_LINE = 44;
const ROW_HEIGHT = 62;
/** Ligne de détail, sous le nom de l'arôme. */
const DETAIL_OFFSET = 28;
/** Bas de la zone des lignes : la note et l'aide restent visibles. */
const ROWS_BOTTOM = HEIGHT - 104;
const VALUE_WIDTH = 260;
const BACKGROUND = '#F7F4EE';
const BODY = '#414141';
const MUTED = '#7A7A7A';
/** Vert olive de la charte (#677000). */
const OLIVE = menuColor(1);

export interface Screen {
  texture: THREE.CanvasTexture;
  /** Affiche une fiche ; `null` : écran d'attente. */
  paint(card: ScanCard | null): void;
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

/** Titre (deux lignes au plus), filet, sous-titre ; rend l'ordonnée suivante. */
function paintHeading(ctx: CanvasRenderingContext2D, card: ScanCard): number {
  pen(ctx, INK, 500, 48);
  const titles = wrapWords(ctx, card.title, TEXT_WIDTH).slice(0, 2);
  fillFrom(ctx, titles, MARGIN, TITLE_Y, TITLE_LINE);
  const ruleY = TITLE_Y + titles.length * TITLE_LINE - 30;
  ctx.fillStyle = COPPER;
  ctx.fillRect(MARGIN, ruleY, 84, 4);
  pen(ctx, BODY, 400, 28);
  ctx.fillText(fitLine(ctx, card.subtitle, TEXT_WIDTH), MARGIN, ruleY + 46);
  return ruleY + 104;
}

function paintRow(ctx: CanvasRenderingContext2D, row: ScanRow, y: number) {
  pen(ctx, INK, 500, 32);
  ctx.fillText(fitLine(ctx, row.label, TEXT_WIDTH - VALUE_WIDTH), MARGIN, y);
  pen(ctx, COPPER, 500, 30);
  ctx.textAlign = 'right';
  ctx.fillText(fitLine(ctx, row.value, VALUE_WIDTH), WIDTH - MARGIN, y);
  ctx.textAlign = 'left';
  if (!row.detail) return;
  pen(ctx, MUTED, 400, 22);
  ctx.fillText(fitLine(ctx, row.detail, TEXT_WIDTH), MARGIN, y + DETAIL_OFFSET);
}

function paintCard(ctx: CanvasRenderingContext2D, card: ScanCard): void {
  const rowsY = paintHeading(ctx, card);
  // Lignes entières seulement (nom + détail) au-dessus de la note
  const room = ROWS_BOTTOM - DETAIL_OFFSET - rowsY;
  const fitting = Math.max(0, Math.floor(room / ROW_HEIGHT) + 1);
  card.rows
    .slice(0, fitting)
    .forEach((row, index) => paintRow(ctx, row, rowsY + index * ROW_HEIGHT));
  if (card.footnote) {
    pen(ctx, MUTED, 400, 22);
    ctx.fillText(fitLine(ctx, card.footnote, TEXT_WIDTH), MARGIN, HEIGHT - 82);
  }
  pen(ctx, OLIVE, 500, 24);
  ctx.fillText('CLIQUER POUR RANGER', MARGIN, HEIGHT - 40);
}

/** Crée l'écran, affiché en attente. */
export function createScreen(): Screen {
  const { canvas, ctx } = createSurface(WIDTH, HEIGHT);
  const texture = canvasTexture(canvas, { anisotropy: 8 });
  const paint = (card: ScanCard | null): void => {
    paintFrame(ctx);
    if (card) paintCard(ctx, card);
    else paintIdle(ctx);
    texture.needsUpdate = true;
  };
  paint(null);
  return { texture, paint };
}
