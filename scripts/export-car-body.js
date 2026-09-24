// Builds the car body and saves it as public/models/car-body.glb, the model
// file the app loads. Run it with `yarn export:body` after changing the
// body code in src/models/, and commit the new file.
import { mkdir, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCarBodyGeometry } from '../src/models/car-body-geometry.js';

const outputDir = new URL('../public/models/', import.meta.url);
const outputFile = new URL('car-body.glb', outputDir);

installFileReader();
silenceWarning('"maxLeafSize" option has been deprecated');
const glb = await exportGlb(createCarBodyMesh());
await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, Buffer.from(glb));
console.log(`Wrote ${outputFile.pathname} (${(glb.byteLength / 1024).toFixed(0)} KB)`);

function createCarBodyMesh() {
  // Triangles share their vertices where position and normal match, which
  // makes the file several times smaller. Creases keep separate vertices.
  const geometry = mergeVertices(createCarBodyGeometry());
  geometry.normalizeNormals();
  const mesh = new THREE.Mesh(geometry);
  mesh.name = 'Car body';
  return mesh;
}

function exportGlb(object) {
  return new GLTFExporter().parseAsync(object, { binary: true });
}

// GLTFExporter reads its output through the browser's FileReader, which
// Node lacks. This covers the one method it uses for binary files.
function installFileReader() {
  globalThis.FileReader ??= class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((result) => {
        this.result = result;
        this.onloadend();
      });
    }
  };
}

// three-bvh-csg still passes an option three-mesh-bvh has renamed. The
// warning is harmless but repeats for every CSG step, burying the output.
function silenceWarning(text) {
  const warn = console.warn;
  console.warn = (...args) => {
    if (!String(args[0]).includes(text)) warn(...args);
  };
}
