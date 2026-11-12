// Feuille du pupitre d'accueil : présentation de l'initiative et plan du magasin.
import type * as THREE from 'three';
import { INK, PAPER, TYPEFACE, menuColor } from '../../../brand';
import { fillFrom, wrapWords } from '../shared/canvas';
import { DEPTH, MID_X, OPENINGS, STORE, WELCOME_BOARD, WIDTH } from './layout';
import { type Plan, bayPresent, categoryIndex } from './plan';
import { bakedTexture } from './textures';

type Ctx = CanvasRenderingContext2D;

const SHEET_W = 1600;
const SHEET_H = 900;
const MAP_BG = '#F3F0E8';
/** Cadre du plan sur la feuille (px). */
const MAP = { ox: 1008, oy: 118, pw: 520, ph: 640 } as const;
const SCALE_X = MAP.pw / WIDTH;
const SCALE_Z = MAP.ph / DEPTH;
const INTRO = [
  'Ce showroom rend visibles les goûts qui portent l’offre alimentaire. Chaque allée regroupe des produits du quotidien autour d’une famille d’arômes, du frais au fond du magasin jusqu’aux snacks et aux plats préparés.',
  'On y voit comment une signature aromatique compose le rayon, et comment s’y repérer. Le plan situe les allées, la traversée centrale et le mur frais.',
] as const;

/** Coordonnées du monde → pixels du plan. */
const mapX = (value: number): number => MAP.ox + (value - STORE.minX) * SCALE_X;
const mapZ = (value: number): number => MAP.oy + (value - STORE.minZ) * SCALE_Z;

const font = (weight: number, size: number): string =>
  `${weight} ${size}px ${TYPEFACE}`;

/** Paragraphe aligné à gauche ; rend l'ordonnée sous sa dernière ligne. */
function paragraph(ctx: Ctx, text: string, y: number): number {
  return fillFrom(ctx, wrapWords(ctx, text, 860), 72, y, 42);
}

/** Colonne de gauche : filet, titre, sous-titre, deux paragraphes. */
function drawIntro(ctx: Ctx): void {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  ctx.fillStyle = menuColor(0);
  ctx.fillRect(72, 78, 92, 6);
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(500, 28);
  ctx.fillText('INITIATIVE', 72, 100);
  ctx.font = font(500, 84);
  ctx.fillText('G.F.T.E.', 72, 148);
  ctx.fillStyle = menuColor(4);
  ctx.font = font(400, 32);
  ctx.fillText('Givaudan Flavor Trends Experience', 72, 252);
  ctx.fillStyle = INK;
  ctx.font = font(400, 30);
  const [first, second] = INTRO;
  paragraph(ctx, second, paragraph(ctx, first, 330) + 8);
}

/** Mur frais, puis les gondoles de chaque file, à la couleur de leur rubrique. */
function drawFixtures(ctx: Ctx, plan: Plan): void {
  plan.fridges.forEach((fridge) => {
    ctx.fillStyle = menuColor(categoryIndex(fridge.category));
    const w = 2.85 * SCALE_X;
    ctx.fillRect(
      mapX(fridge.x) - w / 2,
      mapZ(plan.fridgeZ - 0.41),
      w - 2,
      0.82 * SCALE_Z,
    );
  });
  plan.lines.forEach((line, lineIndex) => {
    ctx.fillStyle = menuColor(categoryIndex(line.category));
    const w = 0.68 * SCALE_X;
    const d = 2.55 * SCALE_Z;
    plan.runZ.forEach((z, index) => {
      if (!bayPresent(plan, lineIndex, index)) return;
      ctx.fillRect(mapX(line.x) - w / 2, mapZ(z - 1.28), w, d - 3);
    });
  });
}

/** Fond et titre du plan. */
function drawMapBase(ctx: Ctx): void {
  ctx.fillStyle = MAP_BG;
  ctx.fillRect(MAP.ox, MAP.oy, MAP.pw, MAP.ph);
  ctx.fillStyle = INK;
  ctx.font = font(500, 22);
  ctx.fillText('Plan du magasin', MAP.ox, 72);
}

/** Allée centrale, contour et ouvertures de la façade. */
function drawMapOutline(ctx: Ctx, plan: Plan): void {
  ctx.fillStyle = INK;
  ctx.font = font(500, 16);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Allée centrale', mapX(MID_X), mapZ(plan.crossZ));
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(MAP.ox + 2, MAP.oy + 2, MAP.pw - 4, MAP.ph - 4);
  ctx.strokeStyle = MAP_BG;
  ctx.lineWidth = 8;
  OPENINGS.forEach((opening) => {
    ctx.beginPath();
    ctx.moveTo(mapX(opening.x0) + 2, MAP.oy + MAP.ph - 2);
    ctx.lineTo(mapX(opening.x1) - 2, MAP.oy + MAP.ph - 2);
    ctx.stroke();
  });
}

/** Repère « Vous êtes ici » et mention du mur frais. */
function drawMarkers(ctx: Ctx): void {
  const hereX = mapX(WELCOME_BOARD.x);
  const hereZ = mapZ(WELCOME_BOARD.z);
  ctx.fillStyle = PAPER;
  ctx.fillRect(hereX - 78, hereZ - 34, 156, 26);
  ctx.fillStyle = menuColor(0);
  ctx.beginPath();
  ctx.arc(hereX, hereZ, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = font(500, 18);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Vous êtes ici', hereX, hereZ - 14);
  ctx.textBaseline = 'top';
  ctx.fillStyle = PAPER;
  ctx.fillText('Frais', mapX(MID_X), MAP.oy + 10);
}

function drawLegend(ctx: Ctx): void {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = font(400, 18);
  ctx.fillStyle = INK;
  ctx.fillText('Couleurs : allées et frais', MAP.ox, MAP.oy + MAP.ph + 36);
}

export function initiativeTexture(plan: Plan): THREE.CanvasTexture {
  const draw = (ctx: Ctx): void => {
    drawIntro(ctx);
    drawMapBase(ctx);
    drawFixtures(ctx, plan);
    drawMapOutline(ctx, plan);
    drawMarkers(ctx);
    drawLegend(ctx);
  };
  return bakedTexture('initiative', SHEET_W, SHEET_H, draw, 8);
}
