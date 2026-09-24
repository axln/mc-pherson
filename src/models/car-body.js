import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { theme } from "../viewer/theme.js";

// Made from car-body-geometry.js by `yarn export:body`.
const modelUrl = `${import.meta.env.BASE_URL}models/car-body.glb`;

// Loads the car body model. It is semi-transparent so the suspension
// mounted to it stays visible; its triangles are depth-sorted by the
// viewer, so it is drawn in one pass.
export async function loadCarBody() {
  const gltf = await new GLTFLoader().loadAsync(modelUrl);
  let geometry;
  gltf.scene.traverse((object) => {
    if (object.isMesh) geometry = object.geometry;
  });

  // The file shares vertices between triangles to stay small; depth
  // sorting needs every triangle to have its own.
  const body = new THREE.Mesh(geometry.toNonIndexed(), createBodyMaterial());
  body.name = "Car body";
  return body;
}

function createBodyMaterial() {
  return new THREE.MeshStandardMaterial({
    color: theme.carBody,
    // Primer, not paint: matte, with no metallic sheen.
    metalness: 0,
    roughness: 0.95,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    side: THREE.DoubleSide,
    forceSinglePass: true
  });
}
