import * as THREE from 'three';
import { car } from './car-dimensions.js';
import { boxMember, onBothSides, sheet } from './geometry-helpers.js';

const floorY = 0.24;
// The floor runs from inside the toe board back to the heel kick.
const floorFrontX = 0.7;
const floorRearX = -1.06;

// Cabin floor seen from the front: flat either side of the centre tunnel.
const floorSection = new THREE.SplineCurve(
  [
    [-0.78, 0.24],
    [-0.3, 0.23],
    [-0.17, 0.25],
    [-0.11, 0.39],
    [0, 0.42],
    [0.11, 0.39],
    [0.17, 0.25],
    [0.3, 0.23],
    [0.78, 0.24],
  ].map(([z, y]) => new THREE.Vector2(z, y)),
);

// How much of the tunnel's full height there is at v (0 at the front). It
// fades in behind the toe board and gets lower towards the rear seat.
function tunnelScale(v) {
  return Math.min(1, v / 0.1) * (1 - 0.35 * v);
}

// Height of the top of the tunnel above the flat floor at x.
export function tunnelHeightAt(x) {
  const v = (floorFrontX - x) / (floorFrontX - floorRearX);
  return (0.42 - floorY) * tunnelScale(v);
}

// Heel kick up to the rear seat pan, then the trunk floor, seen from the side.
const rearFloorLine = new THREE.SplineCurve(
  [
    [-1.06, 0.24],
    [-1.14, 0.32],
    [-1.21, 0.42],
    [-1.36, 0.46],
    [-2.26, 0.46],
    [-2.35, 0.5],
  ].map(([x, y]) => new THREE.Vector2(x, y)),
);

// Rails under the trunk floor, kicking up over the rear axle.
const rearRail = [
  [-0.6, 0.175, 0.5],
  [-0.9, 0.175, 0.5],
  [-1.11, 0.24, 0.5],
  [-1.26, 0.35, 0.5],
  [-1.46, 0.4, 0.5],
  [-2.35, 0.4, 0.5],
];

// Floor pan with its tunnel, seat crossmembers, rear floor and rear rails.
export function createFloorGeometries() {
  const floor = sheet(
    (u, v) => {
      const { x: z, y } = floorSection.getPoint(u);
      return [floorFrontX + (floorRearX - floorFrontX) * v, floorY + (y - floorY) * tunnelScale(v), z];
    },
    48,
    16,
  );
  const rearFloor = sheet(
    (u, v) => {
      const { x, y } = rearFloorLine.getPoint(u);
      return [x, y, (2 * v - 1) * car.wheelhouseInnerZ];
    },
    32,
    1,
  );
  // Seat crossmembers run from sill to sill, stepping over the tunnel.
  const crossmembers = [0.25, -0.55].map((x) => {
    const overTunnel = floorY + tunnelHeightAt(x) + 0.025;
    return boxMember(
      [
        [x, 0.27, -0.78],
        [x, 0.27, -0.24],
        [x, overTunnel, -0.1],
        [x, overTunnel, 0.1],
        [x, 0.27, 0.24],
        [x, 0.27, 0.78],
      ],
      0.08,
      0.06,
    );
  });
  return [floor, rearFloor, ...crossmembers, ...onBothSides(boxMember(rearRail, 0.1, 0.12))];
}
