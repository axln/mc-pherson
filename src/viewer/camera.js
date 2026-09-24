import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(3, 2.5, 4);
  return camera;
}

// Drag to orbit, scroll/pinch to zoom, right-drag (or two fingers) to pan.
export function createControls(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.5, 0);
  controls.update();
  return controls;
}
