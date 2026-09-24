import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// lil-gui panel listing the named objects under root as a tree. Groups become
// folders with their own visibility and opacity controls; single parts get a
// checkbox with an opacity slider under it. Unnamed objects are skipped, but
// their named descendants are still listed.
export function createPartsPanel(root) {
  giveMeshesOwnMaterials(root);
  const gui = new GUI({ title: 'Parts', width: 340 });
  addChildControls(gui, root);
  return gui;
}

// Parts often share a material; copying it lets each part's opacity be
// changed on its own.
function giveMeshesOwnMaterials(root) {
  root.traverse((object) => {
    if (object.isMesh) object.material = object.material.clone();
  });
}

function addChildControls(folder, object) {
  for (const child of object.children) {
    if (!child.name) {
      addChildControls(folder, child);
    } else if (hasNamedDescendants(child)) {
      const childFolder = folder.addFolder(child.name);
      addPartControls(childFolder, child, 'Visible', 'Opacity');
      addChildControls(childFolder, child);
    } else {
      addPartControls(folder, child, child.name, '');
    }
  }
}

function addPartControls(folder, object, visibleLabel, opacityLabel) {
  const part = {
    get visible() {
      return object.visible;
    },
    set visible(visible) {
      object.visible = visible;
    },
    get opacity() {
      return firstMeshOpacity(object);
    },
    set opacity(opacity) {
      setOpacity(object, opacity);
    },
  };
  folder.add(part, 'visible').name(visibleLabel);
  folder
    .add(part, 'opacity', 0, 1, 0.05)
    .name(opacityLabel)
    // A folder's slider changes the parts inside it, so refresh their sliders.
    .onChange(() => folder.controllersRecursive().forEach((c) => c.updateDisplay()));
}

function hasNamedDescendants(object) {
  return object.children.some((child) => child.name || hasNamedDescendants(child));
}

// Sets the opacity of every mesh in the object.
function setOpacity(object, opacity) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    const { material } = child;
    const transparent = opacity < 1;
    if (material.transparent !== transparent) material.needsUpdate = true;
    material.transparent = transparent;
    // Opaque parts write depth so they hide what is behind them.
    material.depthWrite = !transparent;
    material.opacity = opacity;
  });
}

function firstMeshOpacity(object) {
  let mesh;
  object.traverse((child) => {
    if (!mesh && child.isMesh) mesh = child;
  });
  return mesh ? mesh.material.opacity : 1;
}
