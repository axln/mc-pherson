import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
// The package's source, not its main entry: the main entry is a CommonJS
// build that would load a second copy of three in Node.
import { ADDITION, Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg/src/index.js';
import { MeshBVH } from 'three-mesh-bvh';

// Every part is a closed solid, so they can be joined with CSG into one
// body without faces left inside it.

// Thickness of sheet-metal panels. Thicker than real sheet so it reads.
export const sheetThickness = 0.012;

// Closed outline through [x, y] points, each corner rounded by its radius
// (one radius for all corners, or one per point; 0 keeps a corner sharp).
// Draws into `path`, a new Shape by default; pass a Path for a hole.
export function roundedOutline(points, radius, path = new THREE.Shape()) {
  points.forEach((point, i) => {
    const corner = new THREE.Vector2(...point);
    const r = Array.isArray(radius) ? radius[i] : radius;
    const toward = (other) => {
      const target = new THREE.Vector2(...other);
      const length = Math.min(r, corner.distanceTo(target) / 2);
      return target.sub(corner).setLength(length).add(corner);
    };
    const from = r > 0 ? toward(points.at(i - 1)) : corner;
    if (i === 0) path.moveTo(from.x, from.y);
    else path.lineTo(from.x, from.y);
    if (r > 0) {
      const to = toward(points[(i + 1) % points.length]);
      path.quadraticCurveTo(corner.x, corner.y, to.x, to.y);
    }
  });
  path.closePath();
  return path;
}

// Smooth curve through [x, y, z] points.
export function smoothCurve(points) {
  return new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    false,
    'centripetal',
  );
}

// Looks up points along a curve by one coordinate, for curves that only
// ever advance along that axis. Values off either end clamp to the ends.
export function sampleByAxis(curve, axis, samples = 64) {
  const points = curve.getPoints(samples);
  return (value) => {
    if (value <= points[0][axis]) return points[0];
    for (let i = 1; i < points.length; i++) {
      if (value <= points[i][axis]) {
        const t = (value - points[i - 1][axis]) / (points[i][axis] - points[i - 1][axis]);
        return points[i - 1].clone().lerp(points[i], t);
      }
    }
    return points.at(-1);
  };
}

// Sheet-metal panel: a solid of the given thickness around the surface
// (u, v) ↦ [x, y, z], u and v in 0..1. Both faces plus the four edges. The
// solid spans from `offset` to `offset + thickness` along the surface
// normal (du × dv), centred on the surface by default.
export function sheet(
  pointAt,
  uSegments,
  vSegments,
  thickness = sheetThickness,
  offset = -thickness / 2,
) {
  const at = (u, v) => new THREE.Vector3(...pointAt(u, v));
  const cols = uSegments + 1;
  const rows = vSegments + 1;
  const step = 1e-3;

  const top = [];
  const bottom = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const u = i / uSegments;
      const v = j / vSegments;
      const du = at(Math.min(u + step, 1), v).sub(at(Math.max(u - step, 0), v));
      const dv = at(u, Math.min(v + step, 1)).sub(at(u, Math.max(v - step, 0)));
      const normal = du.cross(dv).normalize();
      const point = at(u, v);
      top.push(...point.clone().addScaledVector(normal, offset + thickness));
      bottom.push(...point.addScaledVector(normal, offset));
    }
  }

  const topIndex = (i, j) => j * cols + i;
  const bottomIndex = (i, j) => cols * rows + j * cols + i;
  const index = [];
  for (let j = 0; j < vSegments; j++) {
    for (let i = 0; i < uSegments; i++) {
      const [a, b, c, d] = [topIndex(i, j), topIndex(i + 1, j), topIndex(i + 1, j + 1), topIndex(i, j + 1)];
      index.push(a, b, c, a, c, d);
      const [e, f, g, h] = [bottomIndex(i, j), bottomIndex(i + 1, j), bottomIndex(i + 1, j + 1), bottomIndex(i, j + 1)];
      index.push(e, g, f, e, h, g);
    }
  }
  // Edge walls, following the boundary counter-clockwise seen from the top.
  const boundary = [];
  for (let i = 0; i < uSegments; i++) boundary.push([i, 0]);
  for (let j = 0; j < vSegments; j++) boundary.push([uSegments, j]);
  for (let i = uSegments; i > 0; i--) boundary.push([i, vSegments]);
  for (let j = vSegments; j > 0; j--) boundary.push([0, j]);
  boundary.forEach(([i, j], k) => {
    const [ni, nj] = boundary[(k + 1) % boundary.length];
    const [p, q] = [topIndex(i, j), topIndex(ni, nj)];
    const [pb, qb] = [bottomIndex(i, j), bottomIndex(ni, nj)];
    index.push(p, pb, qb, p, qb, q);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([...top, ...bottom], 3));
  geometry.setIndex(index);
  return geometry;
}

// Box-section member: a rounded rectangle swept along a smooth path,
// capped at both ends.
export function boxMember(path, width, height, radius = 0.02) {
  const [u, v] = [width / 2, height / 2];
  const section = roundedOutline(
    [
      [-u, -v],
      [u, -v],
      [u, v],
      [-u, v],
    ],
    radius,
  );
  return sweep(section, path, 3);
}

// Round tube swept along a smooth path, capped at both ends.
export function tubeMember(path, radius) {
  const section = new THREE.Shape().absarc(0, 0, radius, 0, 2 * Math.PI, false);
  return sweep(section, path, 12);
}

function sweep(section, path, curveSegments) {
  return new THREE.ExtrudeGeometry(section, {
    steps: 48,
    extrudePath: smoothCurve(path),
    curveSegments,
  });
}

// A part modelled on the right side of the car, and its mirror image on the left.
export function onBothSides(geometry) {
  return [geometry, geometry.clone().scale(1, 1, -1)];
}

// Joins the solids into one body with CSG, so nothing is left inside where
// they overlap. Normals are smoothed across each part but kept at creases.
export function unionParts(geometries) {
  const solids = geometries.map(prepareSolid);
  const evaluator = createEvaluator();

  let brushes = solids.map(createBrush);
  // Join in pairs, so each step works on similarly sized halves.
  while (brushes.length > 1) {
    const joined = [];
    for (let i = 0; i + 1 < brushes.length; i += 2) {
      joined.push(evaluator.evaluate(brushes[i], brushes[i + 1], ADDITION));
    }
    if (brushes.length % 2) joined.push(brushes.at(-1));
    brushes = joined;
  }
  return removeBuriedTriangles(brushes[0].geometry, solids);
}

// Cuts the cutters out of the solid, for holes and cavities. Cutting with
// one cutter after another leaves sliver faces from the earlier cuts that
// the later ones then fail to remove, so the cutters are joined first.
export function subtractParts(geometry, cutters) {
  const cutter = cutters.length === 1 ? cutters[0] : unionParts(cutters);
  const result = createEvaluator().evaluate(
    createBrush(prepareSolid(geometry)),
    createBrush(prepareSolid(cutter)),
    SUBTRACTION,
  );
  return result.geometry;
}

function createEvaluator() {
  const evaluator = new Evaluator();
  evaluator.attributes = ['position', 'normal'];
  evaluator.useGroups = false;
  return evaluator;
}

function createBrush(solid) {
  const brush = new Brush(solid);
  brush.updateMatrixWorld();
  return brush;
}

// The CSG library sometimes keeps faces that ended up inside another solid,
// which show as dark patches through a transparent body. This drops every
// triangle whose midpoint lies inside one of the original solids, along
// with zero-area slivers.
function removeBuriedTriangles(geometry, solids) {
  const testers = solids.map(createInsideTester);
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const [a, b, c] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const face = new THREE.Vector3();
  const kept = [];
  for (let i = 0; i < position.count; i += 3) {
    a.fromBufferAttribute(position, i);
    b.fromBufferAttribute(position, i + 1);
    c.fromBufferAttribute(position, i + 2);
    face.copy(b).sub(a).cross(c.clone().sub(a));
    if (face.lengthSq() < 1e-14) continue;
    // Nudge the midpoint outward, so a kept face isn't inside its own solid.
    const point = a.add(b).add(c).multiplyScalar(1 / 3).addScaledVector(face.normalize(), 5e-4);
    if (!testers.some((isInside) => isInside(point))) kept.push(i);
  }

  const copy = (attribute) => {
    const array = new Float32Array(kept.length * 9);
    kept.forEach((i, k) => {
      for (let j = 0; j < 9; j++) array[k * 9 + j] = attribute.array[i * 3 + j];
    });
    return new THREE.Float32BufferAttribute(array, 3);
  };
  const cleaned = new THREE.BufferGeometry();
  cleaned.setAttribute('position', copy(position));
  cleaned.setAttribute('normal', copy(normal));
  return cleaned;
}

// Point-in-solid test by ray parity: an odd number of surface crossings
// means inside. Three skewed rays vote, so a ray grazing an edge can't
// decide alone.
const probeDirections = [
  [0.53, 0.71, 0.46],
  [-0.62, 0.41, -0.67],
  [0.37, -0.83, 0.41],
].map((d) => new THREE.Vector3(...d).normalize());

function createInsideTester(solid) {
  const bvh = solid.boundsTree ?? new MeshBVH(solid);
  solid.computeBoundingBox();
  const box = solid.boundingBox.clone().expandByScalar(1e-3);
  const ray = new THREE.Ray();
  return (point) => {
    if (!box.containsPoint(point)) return false;
    let votes = 0;
    for (const direction of probeDirections) {
      ray.set(point, direction);
      if (bvh.raycast(ray, THREE.DoubleSide).length % 2 === 1) votes++;
    }
    return votes >= 2;
  };
}

// Non-indexed, facing outward, with only position and smoothed normals.
function prepareSolid(geometry) {
  const solid = geometry.index ? geometry.toNonIndexed() : geometry;
  for (const name of Object.keys(solid.attributes)) {
    if (name !== 'position') solid.deleteAttribute(name);
  }
  // Mirrored parts are inside out; CSG needs every solid facing outward.
  if (signedVolume(solid) < 0) flipWinding(solid);
  return toCreasedNormals(solid, Math.PI / 5);
}

function signedVolume(geometry) {
  const position = geometry.attributes.position;
  const [a, b, c] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  let volume = 0;
  for (let i = 0; i < position.count; i += 3) {
    a.fromBufferAttribute(position, i);
    b.fromBufferAttribute(position, i + 1);
    c.fromBufferAttribute(position, i + 2);
    volume += a.dot(b.cross(c));
  }
  return volume / 6;
}

function flipWinding(geometry) {
  const array = geometry.attributes.position.array;
  for (let i = 0; i < array.length; i += 9) {
    for (let k = 0; k < 3; k++) {
      [array[i + 3 + k], array[i + 6 + k]] = [array[i + 6 + k], array[i + 3 + k]];
    }
  }
}
