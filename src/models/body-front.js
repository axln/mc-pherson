import * as THREE from 'three';
import { car } from './car-dimensions.js';
import {
  boxMember,
  onBothSides,
  roundedOutline,
  sampleByAxis,
  sheet,
  smoothCurve,
  subtractParts,
  tubeMember,
  unionParts,
} from './geometry-helpers.js';

// Toe board, firewall and cowl seen from the side, from the cabin floor up
// to the base of the windshield.
const firewallLine = smoothCurve([
  [0.62, 0.24, 0],
  [0.74, 0.3, 0],
  [0.8, 0.45, 0],
  [0.82, 0.8, 0],
  [0.85, 0.92, 0],
  [0.98, 0.95, 0],
]);
const firewallHalfWidth = 0.78;
const firewallAtHeight = sampleByAxis(firewallLine, 'y');

// Main rails: under the front of the floor, rising in front of the toe
// board to just above the wheel centre, then forward to the bumper. Over
// the wheels they are as low as the driveshafts and tie rods allow: those
// pass under them to the wheels, and rise with the wheel in bump. The
// front subframe, which carries the lower control arms and the steering
// rack, bolts to the bosses under them.
const lowerRail = [
  [-0.3, 0.175, 0.42],
  [0.1, 0.175, 0.42],
  [0.45, 0.175, 0.42],
  [0.62, 0.18, 0.42],
  [0.76, 0.25, 0.415],
  [0.9, 0.38, 0.41],
  [1.02, 0.47, 0.41],
  [1.15, 0.48, 0.41],
  [1.5, 0.48, 0.41],
  [1.65, 0.48, 0.41],
  [2.0, 0.47, 0.415],
  [2.23, 0.47, 0.42],
];
const lowerRailSection = 0.12;
const lowerRailAt = sampleByAxis(smoothCurve(lowerRail), 'x');
const subframeMountXs = [0.98, 1.78];

// Upper rails along the top edge of each apron: from the hinge pillar,
// along the outside of the strut tower, down to the radiator support.
const upperRail = [
  [0.86, 0.88, 0.8],
  [1.0, 0.875, 0.77],
  [1.3, 0.85, 0.76],
  [1.6, 0.81, 0.75],
  [2.05, 0.6, 0.62],
];
const upperRailAt = sampleByAxis(smoothCurve(upperRail), 'x');

// Inner fender apron: the wall of the engine bay on each side, welded along
// the outer face of the rail at the bottom and leaning outward up to the
// upper rail, its rear edge against the firewall. The front wheel sits
// outboard of it, with no wheel tub.
const apron = { rearBottomY: 0.36, topY: 0.87, frontX: 2.05, bottomZ: 0.465 };
const apronGrid = { u: 32, v: 12 };

function apronPoint(u, v) {
  const rearX = firewallAtHeight(apron.rearBottomY + v * (apron.topY - apron.rearBottomY)).x - 0.01;
  const x = rearX + u * (apron.frontX - rearX);
  const bottomY = lowerRailAt(x).y;
  const top = upperRailAt(x);
  const lean = THREE.MathUtils.smoothstep(v, 0.35, 1);
  return [x, bottomY + v * (top.y - bottomY), apron.bottomZ + (top.z - apron.bottomZ) * lean];
}

// Strut tower: a dome bulging from the apron into the engine bay, from the
// rail up to a flat top plate with the hole for the strut rod and three
// bolt holes for the top mount. It is built around the strut's axis, which
// leans in and back like the steering axis, so the plate sits square to the
// strut. The apron cuts it: on the engine-bay side it is a closed hump, on
// the wheel side it is gone, so from the wheel well it is an open pocket
// the strut reaches up into. The fender, a bolt-on part, is what covers it
// in a real car.
const tower = { height: 0.32, plateHoleRadius: 0.035 };
const strutTop = new THREE.Vector3(...car.frontStrutTop);
const strutAxis = strutTop.clone().sub(new THREE.Vector3(...car.frontLowerBallJoint)).normalize();
const towerBolts = { radius: 0.0065, circleRadius: 0.075, count: 3 };
// Radius and height above the base, around the outside of the dome.
const towerOutside = [
  [0, 0],
  [0.2, 0],
  [0.197, 0.08],
  [0.175, 0.18],
  [0.145, 0.255],
  [0.125, 0.295],
  [0.11, 0.315],
  [0.1, 0.32],
  [0, 0.32],
];
// The hollow inside the dome, one sheet thickness in from the outside, with
// the rod hole running up through the plate.
const towerInside = [
  [0, -0.01],
  [0.188, -0.01],
  [0.185, 0.08],
  [0.163, 0.18],
  [0.133, 0.25],
  [0.113, 0.29],
  [0.1, 0.308],
  [tower.plateHoleRadius, 0.308],
  [tower.plateHoleRadius, 0.35],
  [0, 0.35],
];
// The cells of the apron's grid around the tower, where the tower is cut
// off on the wheel side: along the apron, its footprint; up it, from a
// little below the apron's bottom edge, so the foot of the dome is cut
// too, to the upper rail.
const apronTrimCells = { u: [5, 19], v: [-3, apronGrid.v] };

// Engine bay: firewall and cowl, aprons with strut towers, rails with
// subframe mounts, radiator support, bumper beam, and the dash crossmember
// behind the firewall that the steering column bolts to.
export function createFrontGeometries() {
  const firewall = sheet(
    (u, v) => {
      const { x, y } = firewallLine.getPoint(u);
      return [x, y, (2 * v - 1) * firewallHalfWidth];
    },
    32,
    1,
  );
  const dashCrossmember = tubeMember(
    [
      [0.8, 0.78, -firewallHalfWidth],
      [0.8, 0.78, firewallHalfWidth],
    ],
    0.03,
  );
  const bumperBeam = boxMember(
    [
      [2.18, 0.47, -0.8],
      [2.24, 0.47, -0.4],
      [2.25, 0.47, 0],
      [2.24, 0.47, 0.4],
      [2.18, 0.47, 0.8],
    ],
    0.08,
    0.12,
  );

  return [
    firewall,
    dashCrossmember,
    ...onBothSides(createApronWithTower()),
    ...onBothSides(boxMember(lowerRail, lowerRailSection, lowerRailSection, 0.03)),
    ...subframeMountXs.flatMap((x) => onBothSides(createSubframeMount(x))),
    ...onBothSides(boxMember(upperRail, 0.08, 0.08)),
    createRadiatorSupport(),
    bumperBeam,
  ];
}

// Right-hand apron with its strut tower welded on. The apron gets a
// tower-shaped hole, so the pocket is open all the way from the wheel well
// up to the plate.
function createApronWithTower() {
  const dome = revolve(towerOutside);
  const cavity = revolve(towerInside);
  const boltHoles = Array.from({ length: towerBolts.count }, (_, i) => {
    const angle = (2 * Math.PI * i) / towerBolts.count + Math.PI / 2;
    const hole = new THREE.CylinderGeometry(towerBolts.radius, towerBolts.radius, 0.08, 10);
    return placeOnStrutAxis(
      hole.translate(
        towerBolts.circleRadius * Math.cos(angle),
        tower.height,
        towerBolts.circleRadius * Math.sin(angle),
      ),
    );
  });
  const towerShell = subtractParts(dome, [cavity, createApronTrim(), ...boltHoles]);
  // The apron's hole runs through the middle of the tower's wall rather than
  // along its inside, so the hole's edge is buried in the wall instead of
  // lying on the same surface, which CSG handles badly.
  const apronHole = revolve(towerInside, 1.03);
  const apronSheet = subtractParts(sheet(apronPoint, apronGrid.u, apronGrid.v), [apronHole]);
  return unionParts([apronSheet, towerShell]);
}

// Slab from the apron's middle out into the wheel well, over the cells of
// the apron around the tower. It lies on the apron's own grid, so its inner
// face runs exactly through the middle of the apron sheet: the tower ends
// inside the sheet, flush with the wall, with no gap between them.
function createApronTrim() {
  const [u0, u1] = apronTrimCells.u;
  const [v0, v1] = apronTrimCells.v;
  return sheet(
    (u, v) =>
      apronPoint((u0 + u * (u1 - u0)) / apronGrid.u, (v0 + v * (v1 - v0)) / apronGrid.v),
    u1 - u0,
    v1 - v0,
    0.35,
    0,
  );
}

// Solid of revolution around the tower's axis, from a [radius, height]
// profile, optionally widened by a factor.
function revolve(profile, widen = 1) {
  const solid = new THREE.LatheGeometry(
    profile.map(([r, h]) => new THREE.Vector2(r * widen, h)),
    32,
  );
  return placeOnStrutAxis(solid);
}

// Moves a part modelled around the y axis, with the tower's base at y = 0,
// onto the strut's axis, with the centre of the top plate at the strut top.
function placeOnStrutAxis(geometry) {
  const tilt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), strutAxis);
  return geometry
    .translate(0, -tower.height, 0)
    .applyQuaternion(tilt)
    .translate(strutTop.x, strutTop.y, strutTop.z);
}

// Boss under the rail that a subframe bolt screws into. Its top is sunk
// into the rail, which may be sloping where it sits.
function createSubframeMount(x) {
  const rail = lowerRailAt(x);
  const height = 0.08;
  return new THREE.CylinderGeometry(0.03, 0.03, height, 16).translate(
    x,
    rail.y - lowerRailSection / 2 - height / 2 + 0.03,
    rail.z,
  );
}

// Frame across the front of the engine bay that holds the radiator. The
// rails run through its sides to the bumper beam; the upper rails and
// aprons end on them.
function createRadiatorSupport() {
  const frame = roundedOutline(
    [
      [-0.66, 0.26],
      [0.66, 0.26],
      [0.66, 0.76],
      [-0.66, 0.76],
    ],
    0.06,
  );
  frame.holes.push(
    roundedOutline(
      [
        [-0.34, 0.34],
        [0.34, 0.34],
        [0.34, 0.68],
        [-0.34, 0.68],
      ],
      0.05,
      new THREE.Path(),
    ),
  );
  return new THREE.ExtrudeGeometry(frame, {
    depth: 0.05,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    curveSegments: 6,
  })
    .rotateY(Math.PI / 2)
    .translate(2.02, 0, 0);
}
