import * as THREE from 'three';
import { car, sideHalfWidth, wheelArchPoints } from './car-dimensions.js';
import { onBothSides, roundedOutline, sheet, tubeMember } from './geometry-helpers.js';

// The pressing's arch is cut smaller than the wheelhouse tub, so the tub's
// outer edge sits inside solid metal rather than flush with the cut.
const rearArch = wheelArchPoints(car.rearAxleX, 24, car.archRadius - 0.02);

// Body side pressing, seen from the side: hinge pillar, A-pillar, roof rail,
// C-pillar and rear quarter, down to the sill, with the rear arch cut out.
const sideOutline = [
  [0.92, 0.2],
  [0.92, 0.93],
  [0.12, 1.4],
  [-0.5, 1.44],
  [-1.11, 1.4],
  [-1.81, 1.06],
  [-2.21, 1.03],
  [-2.35, 0.9],
  [-2.35, 0.45],
  [-2.21, 0.22],
  ...rearArch,
];
const sideRadii = [0.03, 0.06, 0.14, 0.4, 0.16, 0.1, 0.08, 0.08, 0.1, 0.08, ...rearArch.map(() => 0)];

const frontDoorOpening = [
  [0.74, 0.42],
  [0.74, 0.93],
  [0.06, 1.33],
  [-0.38, 1.34],
  [-0.38, 0.42],
];
const rearDoorOpening = [
  [-0.54, 0.42],
  [-0.54, 1.34],
  [-0.94, 1.32],
  [-1.16, 1.08],
  [-1.16, 0.74],
  [-0.98, 0.42],
];

const pressingDepth = 0.1;
const edgeRadius = 0.015;

// Both body side pressings. The pillars and sill are the pressing's box
// section, so they are as deep as the pressing.
export function createBodySideGeometries() {
  const shape = roundedOutline(sideOutline, sideRadii);
  shape.holes.push(
    roundedOutline(frontDoorOpening, [0.04, 0.03, 0.08, 0.05, 0.05], new THREE.Path()),
    roundedOutline(rearDoorOpening, [0.05, 0.05, 0.1, 0.08, 0.06, 0.05], new THREE.Path()),
  );
  const pressing = new THREE.ExtrudeGeometry(shape, {
    depth: pressingDepth,
    bevelThickness: edgeRadius,
    bevelSize: edgeRadius,
    bevelSegments: 2,
    curveSegments: 10,
  });
  leanOntoBodySide(pressing);
  return onBothSides(pressing);
}

// Moves the flat pressing onto the right side of the body, its outer face
// following the side's lean above the belt line.
function leanOntoBodySide(geometry) {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const outerZ = sideHalfWidth(position.getY(i)) - edgeRadius;
    position.setZ(i, outerZ - position.getZ(i));
  }
}

// Roof seen from the side, along its centre line, from the windshield
// header to the rear one.
const roofLine = new THREE.SplineCurve(
  [
    [0.12, 1.425],
    [-0.5, 1.465],
    [-1.11, 1.425],
  ].map(([x, y]) => new THREE.Vector2(x, y)),
);
// The roof crowns up from its edges, which are sunk into the roof rails.
const roofCrown = 0.06;

// Point on the roof at u along its length and `across` from -1 to 1.
function roofPoint(u, across) {
  const { x, y } = roofLine.getPoint(u);
  const edgeY = y - roofCrown;
  return [x, edgeY + roofCrown * (1 - across ** 2), across * (sideHalfWidth(edgeY) - 0.03)];
}

// Roof panel with a slight crown, and the headers along its front and rear
// edges. The headers sit mostly under the roof but poke through its top by
// a few millimetres, so the two surfaces cross cleanly rather than touch.
export function createRoofGeometries() {
  const roof = sheet((u, v) => roofPoint(u, 2 * v - 1), 24, 16);
  const headers = [0, 1].map((u) =>
    tubeMember(
      [-1, -0.5, 0, 0.5, 1].map((across) => {
        const [x, y, z] = roofPoint(u, across);
        return [x, y - 0.02, z];
      }),
      0.03,
    ),
  );
  return [roof, ...headers];
}
