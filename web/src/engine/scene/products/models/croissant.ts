// Croissant procédural : un tube en croissant de lune, strié et doré.
import * as THREE from 'three';
import { assemble, labelAt } from './parts';

/** Teintes de la pâte : croûte, creux beurrés, pointes grillées. */
interface CrustPalette {
  crust: THREE.Color;
  butter: THREE.Color;
  toast: THREE.Color;
}

interface CrescentSpec {
  radius: number;
  arc: number;
  tube: number;
  depth: number;
  tubular: number;
  radial: number;
  phase: number;
  grooves: number;
  taperPower: number;
  palette: CrustPalette;
}

/** Une section du tube : centre, normale extérieure et gonflement. */
interface Ring {
  point: THREE.Vector3;
  normal: THREE.Vector2;
  belly: number;
  taper: number;
  radius: number;
}

interface MeshBuffers {
  positions: number[];
  colors: number[];
  indices: number[];
}

const TILT = 0.34;

const pastryMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.84,
  metalness: 0.02,
  vertexColors: true,
});

const shade = new THREE.Color();

/** Recourbe les cornes : 0 au centre, jusqu'à 1 aux extrémités. */
function hornHook(t: number): number {
  const reach = 0.24;
  const fromEnd = Math.min(t, 1 - t);
  if (fromEnd >= reach) return 0;
  const u = 1 - fromEnd / reach;
  return u * u;
}

function crescentPoint(t: number, radius: number, arc: number): THREE.Vector3 {
  const half = arc / 2;
  const ang = -half + arc * t;
  const hook = hornHook(t);
  const side = t < 0.5 ? -1 : 1;
  return new THREE.Vector3(
    Math.sin(ang) * radius - side * hook * radius * 0.28,
    -Math.cos(ang) * radius + hook * radius * 0.2,
    0,
  );
}

/** Point n° `i` de la ligne médiane, indice borné aux extrémités. */
function spinePoint(spec: CrescentSpec, i: number): THREE.Vector3 {
  const index = Math.min(spec.tubular, Math.max(0, i));
  return crescentPoint(index / spec.tubular, spec.radius, spec.arc);
}

/** Normale dans le plan XY, tournée vers l'extérieur de la courbe. */
function outwardNormal(
  spec: CrescentSpec,
  i: number,
  point: THREE.Vector3,
): THREE.Vector2 {
  const tangent = spinePoint(spec, i + 1).sub(spinePoint(spec, i - 1));
  if (tangent.lengthSq() < 1e-8) tangent.set(1, 0, 0);
  tangent.normalize();
  const normal = new THREE.Vector2(-tangent.y, tangent.x);
  if (normal.x * point.x + normal.y * point.y < 0) normal.negate();
  return normal;
}

function ringAt(spec: CrescentSpec, i: number): Ring {
  const along = i / spec.tubular;
  const point = spinePoint(spec, i);
  const belly = Math.sin(Math.PI * along);
  const pinch = THREE.MathUtils.smoothstep(
    Math.min(along, 1 - along),
    0.015,
    0.11,
  );
  const taper = belly ** spec.taperPower * (0.55 + 0.45 * pinch);
  const radius = spec.tube * Math.max(0.04, taper);
  return { point, normal: outwardNormal(spec, i, point), belly, taper, radius };
}

function appendVertex(
  positions: number[],
  spec: CrescentSpec,
  ring: Ring,
  v: number,
): void {
  const stripe = Math.cos(v * spec.grooves);
  const outward = Math.cos(v);
  const ridge = 1 + ring.taper * Math.max(0, stripe) * 0.32;
  const n =
    outward * ring.radius * ridge * (0.88 + 0.22 * Math.max(0, outward));
  const b = Math.sin(v) * ring.radius * ridge * spec.depth;
  const { point, normal } = ring;
  positions.push(point.x + normal.x * n, point.y + normal.y * n, point.z + b);
}

function appendShade(
  colors: number[],
  spec: CrescentSpec,
  ring: Ring,
  v: number,
): void {
  const { crust, butter, toast } = spec.palette;
  const stripe = Math.cos(v * spec.grooves);
  const crease = THREE.MathUtils.smoothstep(-stripe, -0.2, 0.85);
  shade.copy(crust);
  shade.lerp(toast, (1 - ring.belly) * 0.5 + Math.max(0, Math.cos(v)) * 0.22);
  shade.lerp(butter, crease * 0.72);
  colors.push(shade.r, shade.g, shade.b);
}

function appendFaces(indices: number[], spec: CrescentSpec): void {
  const stride = spec.radial + 1;
  for (let i = 0; i < spec.tubular; i += 1) {
    for (let j = 0; j < spec.radial; j += 1) {
      const a = i * stride + j;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
}

function crescentBuffers(spec: CrescentSpec): MeshBuffers {
  const buffers: MeshBuffers = { positions: [], colors: [], indices: [] };
  for (let i = 0; i <= spec.tubular; i += 1) {
    const ring = ringAt(spec, i);
    for (let j = 0; j <= spec.radial; j += 1) {
      const v = (j / spec.radial) * Math.PI * 2 + spec.phase;
      appendVertex(buffers.positions, spec, ring, v);
      appendShade(buffers.colors, spec, ring, v);
    }
  }
  appendFaces(buffers.indices, spec);
  return buffers;
}

function crustPalette(tint: number): CrustPalette {
  const crust = new THREE.Color(0xc47a32).lerp(new THREE.Color(tint), 0.16);
  return {
    crust,
    butter: crust.clone().lerp(new THREE.Color(0xf3d7a0), 0.7),
    toast: crust.clone().lerp(new THREE.Color(0x3d1c0c), 0.5),
  };
}

function crescentSpec(tint: number): CrescentSpec {
  return {
    radius: 0.034,
    arc: Math.PI * 1.18,
    tube: 0.016,
    depth: 1.02,
    tubular: 80,
    radial: 18,
    phase: ((tint >>> 0) % 5) * 0.2,
    grooves: 2,
    taperPower: 0.9,
    palette: crustPalette(tint),
  };
}

/** Bascule le croissant vers l'avant (rotation autour de X). */
function tiltForward(position: THREE.BufferAttribute, tilt: number): void {
  const cosine = Math.cos(tilt);
  const sine = Math.sin(tilt);
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    const z = position.getZ(i);
    position.setY(i, y * cosine - z * sine);
    position.setZ(i, y * sine + z * cosine);
  }
}

/** Centre en X, pose sur y = 0 et recule légèrement en Z. */
function seatOnShelf(geometry: THREE.BufferGeometry): void {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;
  geometry.translate(
    -(box.min.x + box.max.x) * 0.5,
    -box.min.y,
    -(box.min.z + box.max.z) * 0.15,
  );
}

function croissantGeometry(tint: number): THREE.BufferGeometry {
  const { positions, colors, indices } = crescentBuffers(crescentSpec(tint));
  const position = new THREE.Float32BufferAttribute(positions, 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', position);
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  tiltForward(position, TILT);
  seatOnShelf(geometry);
  geometry.computeVertexNormals();
  return geometry;
}

export function croissant(tint: number, name: string): THREE.Group {
  return assemble(
    new THREE.Mesh(croissantGeometry(tint), pastryMaterial),
    labelAt(name, 0.062, 0.034, [0, 0.022, 0.03]),
  );
}
