import { createViewer } from './viewer/viewer.js';
import { drawBackToFront } from './viewer/depth-sort.js';
import { loadCarBody } from './models/car-body.js';
import { createPartsPanel } from './ui/parts-panel.js';

const viewer = createViewer(document.querySelector('#scene'));
viewer.start();

const body = await loadCarBody();
viewer.scene.add(body);
drawBackToFront(body, viewer.camera, viewer.controls);
createPartsPanel(viewer.scene);
