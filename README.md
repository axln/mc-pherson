# mc-pherson

An interactive simulation of a MacPherson strut suspension that explains how it works. Mechanisms like this are usually explained with CAD videos, which are good for showing but not for understanding. Here the suspension is a working 3D model: you can rotate, zoom and pan around it while it moves, and look at each part to see how the parts interact and work together.

Built as a single-page app with [Vite](https://vite.dev), [three.js](https://threejs.org) and [Tailwind CSS](https://tailwindcss.com).

## Requirements

- Node.js 20.19+ or 22.12+
- Yarn 1.x

## Getting started

```sh
yarn install
yarn dev
```

The dev server runs at http://localhost:5173.

## Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `yarn dev`     | Start the dev server                 |
| `yarn build`   | Build for production into `dist/`    |
| `yarn preview` | Serve the production build locally   |
| `yarn export:body` | Rebuild `public/models/car-body.glb` from the body code |

## Project structure

```
index.html                 Page markup: full-screen canvas
src/main.js                Entry point: creates the viewer, adds the model and panel
src/viewer/viewer.js       createViewer(): wires the pieces below together
src/viewer/renderer.js     WebGL renderer
src/viewer/camera.js       Camera and orbit controls
src/viewer/environment.js  Scene with background, lights and floor grid
src/viewer/resize.js       Keeps renderer and camera sized to the canvas
src/viewer/theme.js        Scene colours
src/viewer/depth-sort.js   Draws the transparent body back to front
src/models/car-dimensions.js  Key car dimensions shared by the models
src/models/car-body-geometry.js  Builds the unibody car body as one solid mesh
src/models/car-body.js     Loads the exported car body model
src/models/body-*.js       Body geometry: sides and roof, floor, front, rear, wheelhouses
src/models/geometry-helpers.js  Helpers for building and joining the body geometry
src/ui/parts-panel.js      lil-gui panel for part visibility and opacity
src/style.css              Tailwind entry point; add @theme customizations here
public/                    Static files served as-is
public/models/car-body.glb Car body model, made by `yarn export:body`
scripts/export-car-body.js Exports the car body model
vite.config.js             Vite config with the Tailwind plugin
```
