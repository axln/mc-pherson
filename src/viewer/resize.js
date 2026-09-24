// Keeps the renderer and camera matched to the canvas's on-screen size.
export function fitToCanvas(canvas, renderer, camera) {
  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', resize);
  resize();
}
