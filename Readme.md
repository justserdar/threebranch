# Nuxt Layer with Three.js and GSAP

This Nuxt 3 layer provides a `<WebGL />` component that takes props to setup your entire scene.

-[]

## Setup
Make sure to install the dependencies:
```bash
npm install --save @justserdar/threebranch
```
Then add the dependency to their `extends` in `nuxt.config`:
```ts
defineNuxtConfig({
  extends: '@justserdar/threebranch'
})
```
You can also download the repo and add it to a `layers` folder.
Then configure your `package.json` and to point to the local layer where you can extend the code. 
```ts
defineNuxtConfig({
    // Highly recommended to use a monorepo codebase structure in VSCODE when using layers and monorepo packages.
  extends: '../../layers/@justserdar/threebranch'
})
```
## Development Server
Start the development server on http://localhost:3000
```bash
pnpm dev
```
## Production
Build the application for production:
```bash
pnpm build
```