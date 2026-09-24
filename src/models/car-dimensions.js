// Key dimensions of a compact front-wheel-drive sedan, in metres. Front is +X,
// the car is centred on the origin along X and Z, and the floor is y = 0.
// Parts are modelled on the right side (+Z) and mirrored to the left. The
// car is left-hand drive: the driver, and anything specific to their side
// (steering column, pedals), is on -Z.
export const car = {
  sillY: 0.2,
  frontAxleX: 1.3,
  rearAxleX: -1.41,
  wheelCentreY: 0.32,
  archRadius: 0.37,
  wheelhouseOuterZ: 0.84,
  wheelhouseInnerZ: 0.56,
  bodyHalfWidth: 0.86,
  roofHalfWidth: 0.72,
  beltY: 0.95,
  roofY: 1.43,
  // Front strut, right side: the centre of the strut tower's top plate,
  // where the top mount bolts on, and the lower ball joint the wheel steers
  // about, typical for a 205/55 R16 tyre on a 1.52 m front track. The line
  // through them is the steering axis: 12° kingpin inclination, 3.5°
  // caster, 10 mm scrub radius.
  frontStrutTop: [1.255, 0.88, 0.56],
  frontLowerBallJoint: [1.3, 0.14, 0.72],
};

// Half the body's width at height y. The sides are upright up to the belt
// line, then lean inward towards the roof.
export function sideHalfWidth(y) {
  if (y <= car.beltY) return car.bodyHalfWidth;
  const t = (y - car.beltY) / (car.roofY - car.beltY);
  return car.bodyHalfWidth + (car.roofHalfWidth - car.bodyHalfWidth) * t;
}

// Angles of a wheel arch around the wheel centre, from where it leaves the
// sill behind the axle, over the top, to the sill in front of it.
export function wheelArchAngles(radius = car.archRadius) {
  const drop = car.wheelCentreY - car.sillY;
  const sideAngle = Math.atan2(drop, Math.sqrt(radius ** 2 - drop ** 2));
  return { start: Math.PI + sideAngle, end: -sideAngle };
}

// Side-view point on a wheel arch, t = 0 behind the axle to t = 1 in front.
export function wheelArchPoint(axleX, t, radius = car.archRadius) {
  const { start, end } = wheelArchAngles(radius);
  const angle = start + (end - start) * t;
  return [axleX + radius * Math.cos(angle), car.wheelCentreY + radius * Math.sin(angle)];
}

export function wheelArchPoints(axleX, segments = 24, radius = car.archRadius) {
  return Array.from({ length: segments + 1 }, (_, i) => wheelArchPoint(axleX, i / segments, radius));
}
