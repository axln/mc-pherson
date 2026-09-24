import * as THREE from 'three';

// Stand-in until the real model is built: a cube resting on the floor.
export function createPlaceholderModel() {
  const model = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6 }),
  );
  model.position.y = 0.5;
  return model;
}
