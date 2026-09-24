import * as THREE from 'three';
import { car } from './car-dimensions.js';
import { boxMember, roundedOutline, sheet } from './geometry-helpers.js';
import { createWheelhouseGeometries } from './body-wheelhouses.js';

// Rear wheelhouses, parcel shelf behind the rear seat, and the panel and
// bumper beam closing off the back of the trunk.
export function createRearGeometries() {
  const parcelShelf = sheet((u, v) => [-1.25 - 0.47 * u, 1.0, (2 * v - 1) * 0.78], 4, 4);
  const rearPanel = new THREE.ExtrudeGeometry(
    roundedOutline(
      [
        [-0.84, 0.42],
        [0.84, 0.42],
        [0.84, 0.95],
        [-0.84, 0.95],
      ],
      0.06,
    ),
    { depth: 0.02, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 1, curveSegments: 6 },
  )
    .rotateY(Math.PI / 2)
    .translate(-2.3, 0, 0);
  const bumperBeam = boxMember(
    [
      [-2.33, 0.46, -0.78],
      [-2.37, 0.46, 0],
      [-2.33, 0.46, 0.78],
    ],
    0.08,
    0.12,
  );
  return [...createWheelhouseGeometries(car.rearAxleX), parcelShelf, rearPanel, bumperBeam];
}
