import { unionParts } from './geometry-helpers.js';
import { createBodySideGeometries, createRoofGeometries } from './body-sides.js';
import { createFloorGeometries } from './body-floor.js';
import { createFrontGeometries } from './body-front.js';
import { createRearGeometries } from './body-rear.js';

// Unibody of the car as one solid: the welded body-in-white, without the
// bolt-on hood, wings, doors and trunk lid. Each panel and member is a
// closed solid, joined with CSG so no faces are left inside the body.
// Building it takes about a second, so scripts/export-car-body.js runs this
// ahead of time and saves the result as the model file the app loads.
export function createCarBodyGeometry() {
  return unionParts([
    ...createBodySideGeometries(),
    ...createRoofGeometries(),
    ...createFloorGeometries(),
    ...createFrontGeometries(),
    ...createRearGeometries(),
  ]);
}
