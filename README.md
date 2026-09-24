# mc-pherson

A single-page app built with [Vite](https://vite.dev) and [Tailwind CSS](https://tailwindcss.com).

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

## Project structure

```
index.html       Page markup (styled with Tailwind classes)
src/main.js      Page scripts
src/style.css    Tailwind entry point; add @theme customizations here
public/          Static files served as-is
vite.config.js   Vite config with the Tailwind plugin
```
