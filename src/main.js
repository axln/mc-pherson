import { createViewer } from './viewer/viewer.js';
import { createPlaceholderModel } from './models/placeholder.js';

const viewer = createViewer(document.querySelector('#scene'));
viewer.scene.add(createPlaceholderModel());
viewer.start();
