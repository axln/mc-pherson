import * as THREE from 'three';

// Triangle index is packed into the low bits of each sort key, depth into
// the high bits, so one numeric sort of a Float64Array orders both.
const indexBits = 17;
const indexRange = 2 ** indexBits;
const depthLevels = 2 ** 20;

// Keeps a transparent mesh's triangles drawn back to front for the camera,
// so its inner surfaces blend correctly through its outer ones. Re-sorts
// whenever the controls move the camera, and returns the sort function for
// when the mesh itself is moved.
export function drawBackToFront(mesh, camera, controls) {
  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const count = position.count / 3;
  if (geometry.index || count > indexRange) {
    throw new Error('drawBackToFront needs a non-indexed mesh with under 131072 triangles');
  }

  const centroids = computeCentroids(position, count);
  const keys = new Float64Array(count);
  const index = new Uint32Array(count * 3);
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  const eye = new THREE.Vector3();

  function sort() {
    // Distances are measured in the mesh's own space, so a moved mesh sorts right.
    mesh.worldToLocal(eye.copy(camera.position));
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < count; i++) {
      const dx = centroids[i * 3] - eye.x;
      const dy = centroids[i * 3 + 1] - eye.y;
      const dz = centroids[i * 3 + 2] - eye.z;
      const distance = dx * dx + dy * dy + dz * dz;
      keys[i] = distance;
      if (distance < min) min = distance;
      if (distance > max) max = distance;
    }
    // Farthest triangles get the smallest keys, so they are drawn first.
    const scale = (depthLevels - 1) / (max - min || 1);
    for (let i = 0; i < count; i++) {
      const level = Math.round((keys[i] - min) * scale);
      keys[i] = (depthLevels - 1 - level) * indexRange + i;
    }
    keys.sort();
    for (let k = 0; k < count; k++) {
      const triangle = keys[k] % indexRange;
      index[k * 3] = triangle * 3;
      index[k * 3 + 1] = triangle * 3 + 1;
      index[k * 3 + 2] = triangle * 3 + 2;
    }
    geometry.index.needsUpdate = true;
  }

  controls.addEventListener('change', sort);
  sort();
  return sort;
}

function computeCentroids(position, count) {
  const centroids = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    for (let axis = 0; axis < 3; axis++) {
      const sum =
        position.array[i * 9 + axis] +
        position.array[i * 9 + 3 + axis] +
        position.array[i * 9 + 6 + axis];
      centroids[i * 3 + axis] = sum / 3;
    }
  }
  return centroids;
}
