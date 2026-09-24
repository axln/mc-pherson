import { createRenderer } from './renderer.js';
import { createCamera, createControls } from './camera.js';
import { createScene } from './environment.js';
import { fitToCanvas } from './resize.js';

// Sets up everything needed to show a user-rotatable scene on the given canvas.
export function createViewer(canvas) {
  const renderer = createRenderer(canvas);
  const camera = createCamera();
  const controls = createControls(camera, canvas);
  const scene = createScene();

  fitToCanvas(canvas, renderer, camera);

  function start() {
    renderer.setAnimationLoop(() => renderer.render(scene, camera));
  }

  return { scene, camera, controls, renderer, start };
}
