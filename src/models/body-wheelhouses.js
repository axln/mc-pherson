import { car, wheelArchAngles } from './car-dimensions.js';
import { onBothSides, sheet } from './geometry-helpers.js';

// Radius of the curl along the wheelhouse's inboard edge.
const curlRadius = 0.1;

// Wheelhouses for one axle: a tub over each wheel that follows the arch and
// curls down around the tyre's inner side, leaving the space inboard open.
export function createWheelhouseGeometries(axleX) {
  const { start, end } = wheelArchAngles();
  const flatWidth = car.wheelhouseOuterZ - car.wheelhouseInnerZ - curlRadius;
  const curlLength = (curlRadius * Math.PI) / 2;

  const tub = sheet(
    (u, v) => {
      const angle = start + (end - start) * u;
      // Walk across the tub from its outer edge, flat at first, then round the curl.
      const distance = v * (flatWidth + curlLength);
      let radius = car.archRadius;
      let z = car.wheelhouseOuterZ - distance;
      if (distance > flatWidth) {
        const bend = (distance - flatWidth) / curlRadius;
        radius = car.archRadius - curlRadius + curlRadius * Math.cos(bend);
        z = car.wheelhouseInnerZ + curlRadius - curlRadius * Math.sin(bend);
      }
      return [
        axleX + radius * Math.cos(angle),
        car.wheelCentreY + radius * Math.sin(angle),
        z,
      ];
    },
    32,
    12,
  );
  return onBothSides(tub);
}
