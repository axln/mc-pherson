# CLAUDE.md

An interactive MacPherson strut suspension simulation that explains how the suspension works. Instead of a CAD video, the user gets a working 3D model they can rotate, zoom and pan while it moves, and can explore each part to learn how the parts interact and work together.

The project is built in small steps that the user specifies one at a time. Don't plan or build ahead of the current step.

A single-page app built with Vite, three.js and Tailwind CSS v4, in plain JavaScript (ES modules, no TypeScript or framework).

## Commands

Use Yarn (1.x), not npm.

- `yarn dev`: dev server at http://localhost:5173
- `yarn build`: production build into `dist/`. The ">500 kB chunk" warning comes from three.js and is expected.
- `yarn preview`: serve the production build
- `yarn export:body`: rebuild `public/models/car-body.glb` from the body code. Run it after changing `src/models/car-body-geometry.js` or anything it uses (`body-*.js`, `geometry-helpers.js`, `car-dimensions.js`), and commit the new file: the app loads the file, not the code.

There are no tests or linter yet. Check changes with `yarn build`, and check rendering in a browser.

## Project structure

```
index.html                 Page markup: full-screen <canvas id="scene">
src/main.js                Entry point only: creates the viewer, adds models and panel, starts it
src/viewer/viewer.js       createViewer(canvas) → { scene, camera, controls, renderer, start }
src/viewer/renderer.js     WebGL renderer
src/viewer/camera.js       Perspective camera and OrbitControls
src/viewer/environment.js  Scene with background, lights and floor grid
src/viewer/resize.js       Keeps renderer and camera sized to the canvas
src/viewer/theme.js        All scene colours
src/viewer/depth-sort.js   drawBackToFront(mesh, camera, controls): depth-sorts a transparent mesh's triangles on camera moves
src/models/car-dimensions.js  Key car dimensions (metres, front +X, floor y = 0), front strut axis (top mount, lower ball joint), side lean, wheel arches
src/models/car-body-geometry.js  createCarBodyGeometry(): the unibody (body-in-white) as one CSG-joined solid; used only by the export script
src/models/car-body.js     loadCarBody(): loads car-body.glb and gives it the body material
src/models/body-sides.js   Body side pressings with door openings, roof panel and headers
src/models/body-floor.js   Floor with tunnel, seat crossmembers, rear floor, rear rails
src/models/body-front.js   Firewall and cowl, aprons with strut towers on the strut axis (closed to the engine bay, open to the wheel well; rod + bolt holes), rails above the driveshafts with subframe bosses, radiator support, bumper beam, dash crossmember
src/models/body-rear.js    Rear wheelhouses, parcel shelf, rear panel, rear bumper beam
src/models/body-wheelhouses.js  Rear wheelhouse tubs (the front has aprons instead, no tubs)
src/models/geometry-helpers.js  Rounded outlines, solid sheets, box/tube members, mirroring, CSG union (with cleanup) and subtraction (cutters joined first)
src/ui/parts-panel.js      lil-gui parts panel: tree of named scene objects with visibility and opacity
scripts/export-car-body.js Node script behind `yarn export:body`: builds the body geometry and writes the GLB
public/models/car-body.glb Exported car body model (generated, committed)
src/style.css              Tailwind entry (`@import "tailwindcss"`) and the light lil-gui theme; theme customizations go in @theme
vite.config.js             Vite config with the @tailwindcss/vite plugin
```

`src/viewer/` is the reusable scene setup. `src/models/` holds what is shown. Each model module exports a `create…()` function that returns a `THREE.Object3D`, or a `load…()` function that resolves to one when the model comes from a file in `public/models/`, and `main.js` adds it to `viewer.scene`. Set `.name` on every object that should appear in the parts panel; unnamed objects are left out of the list.

## Conventions

- **Keep `main.js` an entry point.** Put logic in modules as small named functions, not top-level script code.
- **No `index.js` files.** Give every module a descriptive name (e.g. `viewer/viewer.js`) and import it by full path, including the `.js` extension.
- **Controls use lil-gui** (`three/addons/libs/lil-gui.module.min.js`), which builds its own DOM; its look is set with CSS variables in `style.css`.
- **Static markup lives in `index.html`.** Don't build page structure with `innerHTML` or a JS mount div.
- **Style the page with Tailwind classes** in the HTML. Avoid custom CSS unless Tailwind can't express it.
- **Use local npm packages only**, never CDN script links. Import three.js add-ons from `three/addons/...`.
- **Body parts are closed solids** (sheets have thickness, members are capped) so `unionParts()` can join them with CSG (`three-bvh-csg`). Overlap parts slightly where they should weld; never let two faces lie flush or nearly tangent, which produces CSG slivers.
- **Light colour scheme.** Scene colours go in `src/viewer/theme.js`, not inline in setup code.
- **Orbit controls have no inertia** (damping stays off), so the render loop doesn't call `controls.update()`. Listen to the controls' `change` event for camera moves.
- Keep the README's project structure in sync when files are added, moved or renamed.
