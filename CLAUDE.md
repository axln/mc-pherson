# CLAUDE.md

An interactive MacPherson strut suspension simulation that explains how the suspension works. Instead of a CAD video, the user gets a working 3D model they can rotate, zoom and pan while it moves, and can explore each part to learn how the parts interact and work together.

The project is built in small steps that the user specifies one at a time. Don't plan or build ahead of the current step.

A single-page app built with Vite, three.js and Tailwind CSS v4, in plain JavaScript (ES modules, no TypeScript or framework).

## Commands

Use Yarn (1.x), not npm.

- `yarn dev`: dev server at http://localhost:5173
- `yarn build`: production build into `dist/`. The ">500 kB chunk" warning comes from three.js and is expected.
- `yarn preview`: serve the production build

There are no tests or linter yet. Check changes with `yarn build`, and check rendering in a browser.

## Project structure

```
index.html                 Page markup: a full-screen <canvas id="scene">
src/main.js                Entry point only: creates the viewer, adds models, starts it
src/viewer/viewer.js       createViewer(canvas) → { scene, camera, controls, renderer, start }
src/viewer/renderer.js     WebGL renderer
src/viewer/camera.js       Perspective camera and OrbitControls
src/viewer/environment.js  Scene with background, lights and floor grid
src/viewer/resize.js       Keeps renderer and camera sized to the canvas
src/viewer/theme.js        All scene colours
src/models/                Models shown in the scene (placeholder.js is a stand-in cube)
src/style.css              Tailwind entry (`@import "tailwindcss"`); theme customizations go in @theme
vite.config.js             Vite config with the @tailwindcss/vite plugin
```

`src/viewer/` is the reusable scene setup. `src/models/` holds what is shown. Each model module exports a `create…()` function that returns a `THREE.Object3D`, and `main.js` adds it to `viewer.scene`.

## Conventions

- **Keep `main.js` an entry point.** Put logic in modules as small named functions, not top-level script code.
- **No `index.js` files.** Give every module a descriptive name (e.g. `viewer/viewer.js`) and import it by full path, including the `.js` extension.
- **Static markup lives in `index.html`.** Don't build page structure with `innerHTML` or a JS mount div.
- **Style the page with Tailwind classes** in the HTML. Avoid custom CSS unless Tailwind can't express it.
- **Use local npm packages only**, never CDN script links. Import three.js add-ons from `three/addons/...`.
- **Light colour scheme.** Scene colours go in `src/viewer/theme.js`, not inline in setup code.
- **Orbit controls have no inertia** (damping stays off), so the render loop doesn't call `controls.update()`.
- Keep the README's project structure in sync when files are added, moved or renamed.
