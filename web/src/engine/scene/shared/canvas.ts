// Outils de dessin 2D partagés par les textures procédurales de la scène
// (enseignes, étiquettes, écran de la tablette, herbe…).
import * as THREE from 'three';

export interface Surface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

/** Un canvas hors écran et son contexte 2D. */
export function createSurface(width: number, height: number): Surface {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Contexte 2D indisponible');
  return { canvas, ctx };
}

export interface TextureOptions {
  /** Couleurs sRGB (false : données brutes, ex. rugosité ou relief). */
  srgb?: boolean;
  anisotropy?: number;
  /** Répétition en X et Y ; active le mode RepeatWrapping. */
  repeat?: readonly [number, number];
  /** Mipmaps + filtrage trilinéaire (textes lus de loin). */
  mipmaps?: boolean;
}

/** Transforme un canvas en texture three.js, réglages communs inclus. */
export function canvasTexture(
  canvas: HTMLCanvasElement,
  { srgb = true, anisotropy, repeat, mipmaps = false }: TextureOptions = {},
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (anisotropy !== undefined) texture.anisotropy = anisotropy;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  if (mipmaps) {
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
  }
  return texture;
}

/** Coupe `text` en lignes qui tiennent dans `maxWidth` (police courante). */
export function wrapWords(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
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

/** Écrit les lignes centrées verticalement autour de `y`. */
export function fillCentered(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  x: number,
  y: number,
  lineHeight: number,
): void {
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) =>
    ctx.fillText(line, x, startY + index * lineHeight),
  );
}

/** Écrit les lignes depuis `y` ; rend l'ordonnée sous la dernière ligne. */
export function fillFrom(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  x: number,
  y: number,
  lineHeight: number,
): number {
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + Math.max(lines.length, 1) * lineHeight;
}

/** `text` sur une seule ligne de `maxWidth` au plus, tronqué par « … ». */
export function fitLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let end = text.length;
  while (end > 0 && ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth)
    end -= 1;
  return `${text.slice(0, end).trimEnd()}…`;
}
