import * as THREE from 'three';
import { theme } from './theme.js';

// Scene with background, lighting and a floor grid; models are added on top.
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.background);
  scene.add(...createLights());
  scene.add(new THREE.GridHelper(10, 10, theme.gridCenterLine, theme.gridLine));
  return scene;
}

function createLights() {
  const ambient = new THREE.HemisphereLight(theme.skyLight, theme.groundLight, 1.5);

  const sun = new THREE.DirectionalLight(theme.sunLight, 2);
  sun.position.set(5, 8, 3);

  return [ambient, sun];
}
