# @ciderjs/city-gas

[![README-ja](https://img.shields.io/badge/日本語-blue?logo=ReadMe)](README.ja.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/city-gas.svg)](https://www.npmjs.com/package/@ciderjs/city-gas)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/city-gas.svg)](https://github.com/luthpg/city-gas/issues)

**@ciderjs/city-gas** is a type-safe, file-based router for **React** and **Vue 3** that operates seamlessly in both **Google Apps Script (GAS)** and **modern browser** environments.

## ✨ Features

* 🚀 **Universal**: Works in both browser (`window.history`) and GAS (`google.script.history`) environments, automatically switching adapters.
* 📂 **File-based Routing**: Routes are automatically generated based on the structure of your `src/pages` directory. Internally, it uses the `?page=...` query parameter to simulate path routing, conforming to the constraints of the GAS environment.
* 🛡️ **Type Safety**: Use **Zod schemas** to define query parameters, providing strict type checking and runtime validation for both path and query parameters.
* 🤖 **Auto Generation**: A Vite plugin automatically generates route definitions and type declarations (`.d.ts`), enabling powerful autocomplete for `Maps` and `useParams`.
* 🧩 **Nested Layouts**: Flexible layout system using special files like `_layout` and `_root`.

---

## 📦 Installation

This package requires `react` / `vue`, `vite`, and `zod`.

```bash
# npm
npm install @ciderjs/city-gas zod

# pnpm
pnpm add @ciderjs/city-gas zod

# yarn
yarn add @ciderjs/city-gas zod
```

---

## 📖 General Routing Guide

### Directory Structure and Mapping

Files under `src/pages` (configurable) become your routes.

```text
src/pages/
├── index.tsx           -> "/"
├── about.tsx           -> "/about"
├── users/
│   ├── index.tsx       -> "/users"
│   └── show.tsx        -> "/users/show"
└── posts/
    └── [postId].tsx    -> "/posts/[postId]" (Dynamic Route)
```

> [!NOTE]
> **Priority between index and same-name files**
> If both `src/pages/users.tsx` and `src/pages/users/index.tsx` exist, the child directory's `index.tsx` (`/users`) takes priority and is registered as the route. The file in the parent directory is ignored.

### Dynamic Routes and Path Parameters

Use the naming convention `[paramName].tsx` to create dynamic routes and access path parameters.

> [!TIP]
> **Path Parameter Schema Definition**
> Path parameters (e.g., `[id]`) are treated as `z.string()` by default, even if you do not explicitly declare them in your schema.
> If you explicitly define them in the schema (e.g., `id: z.coerce.number()`), your custom definition takes priority.

### Nested Layouts

Special filenames are used to achieve hierarchical layouts.

* **`_root.tsx`**: The highest-level layout wrapping the entire application.
* **`_layout.tsx`**: A layout applied to all routes within the directory it is placed in.
* **`_404.tsx`**: The component displayed when an undefined route is accessed.
* **`_loading.tsx`**: The component displayed during page transitions or initialization.

---

## ⚛️ React Guide

### 1. Vite Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { cityGasRouter } from '@ciderjs/city-gas/plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    cityGasRouter(),
  ],
});
```

### 2. Application Entry Point (`src/main.tsx`)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRouter } from '@ciderjs/city-gas';
import { RouterProvider } from '@ciderjs/city-gas/react';
import { pages, specialPages, dynamicRoutes } from './generated/routes';

const router = createRouter(pages, { specialPages, dynamicRoutes });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

### 3. Page Component and Schema Definition

A page component must be defined as the `default export`.
By exporting a `schema` from your page component file, you can define the expected parameters.

```tsx
// src/pages/search/[categoryId].tsx
import { z } from 'zod';
import { useParams, useNavigate } from '@ciderjs/city-gas/react';

// Schema definition
export const schema = z.object({
  q: z.string(),
  pageIndex: z.coerce.number().optional(), // 'page' is reserved and cannot be used
});

export default function SearchPage() {
  // Path parameter (categoryId) and query parameters (q, pageIndex) are inferred
  const params = useParams('/search/[categoryId]');
  const navigate = useNavigate();

  return (
    <div>
      <h1>Category: {params.categoryId}</h1>
      <p>Search: {params.q}</p>
      <button onClick={() => navigate('/search/[categoryId]', { categoryId: '1', q: 'react' })}>
        Search
      </button>
    </div>
  );
}
```

---

## 💚 Vue Guide

### 1. Vite Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { cityGasRouter } from '@ciderjs/city-gas/plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue(),
    cityGasRouter(),
  ],
});
```

### 2. Application Entry Point (`src/main.ts`)

```ts
import { createApp } from 'vue';
import { createRouter } from '@ciderjs/city-gas';
import { createRouterPlugin, RouterOutlet } from '@ciderjs/city-gas/vue';
import { pages, specialPages, dynamicRoutes } from './generated/routes';

const router = createRouter(pages, { specialPages, dynamicRoutes });
const app = createApp(RouterOutlet);

app.use(createRouterPlugin(router));
app.mount('#app');
```

### 3. Page Component and Schema Definition

Since `export` statements are not strictly supported within Vue's `<script setup>` syntax for this purpose, you must define and export the `schema` within a separate, standard `<script>` block.

```vue
<script setup lang="ts">
import { useParams, useNavigate } from '@ciderjs/city-gas/vue';

const params = useParams('/search/[categoryId]');
const navigate = useNavigate();

const handleClick = () => {
  navigate('/search/[categoryId]', { categoryId: '1', q: 'vue' });
};
</script>

<script lang="ts">
import { z } from 'zod';

export const schema = z.object({
  q: z.string(),
  pageIndex: z.coerce.number().optional(), // 'page' is reserved and cannot be used
});
</script>

<template>
  <div>
    <h1>Category: {{ params.categoryId }}</h1>
    <p>Search: {{ params.q }}</p>
    <button @click="handleClick">Search</button>
  </div>
</template>
```

---

## ⚙️ API Reference (General)

### `createRouter(pages, options)`

Creates the router instance.

* `pages`: The page definitions imported from `.generated/routes.ts`.
* `options`:
    * `specialPages`: Definitions for special pages like `_root`, `_layout`, etc.
    * `dynamicRoutes`: Definitions used for dynamic route matching.
    * `defaultRouteName`: The default route (usually `'/'`).

### `router` Instance

* `router.navigate(name, params, options)`: Navigates to the specified route.
* `router.subscribe(listener)`: Subscribes to route changes.
* `router.getCurrentRoute()`: Gets the current route information.
* `router.beforeEach(guard)`: Registers a navigation guard.

#### Navigation Guard

```ts
router.beforeEach((to, from, next) => {
  if (to.name === '/admin' && !isAdmin) {
    // Redirect to login page
    next('/login');
  } else {
    // Allow transition
    next();
    // Alternatively, next(false) to cancel the transition
  }
});
```

### Hooks / Composables

* `useParams(routeName)`: Retrieves parameters for the current route. Passing a `routeName` narrows the type.
* `useNavigate()`: Returns the navigation function.
* `useRoute()`: Returns the entire current route object, including name and parameters.

---

## ⚠️ Known Limitations

### Schema Definition
The `schema` export for parameters must be defined **within the same file** as the page component.
Importing schemas from external files is not supported because the Vite plugin uses static AST analysis to generate types.

### The Reserved Word `page`
This library internally uses the `?page=...` query parameter in the URL to resolve file-based routes.
Therefore, you cannot use the key `page` as a parameter name in your schema definitions. If you need pagination, please use a different name such as `pageIndex`.

### URL Length Limitations in GAS
Google Apps Script (GAS) environments have strict URL length limits (approximately 2KB).
Since this library serializes object parameters into JSON strings within the URL, passing large data structures may cause errors.
For large datasets, consider using `PropertiesService`, `CacheService`, or a global state management library instead of passing them as route parameters.

### Global Side Effects and Cleanup
For static analysis and type generation, this library evaluates (imports) all page files at application startup. Please be aware of the following:

* **Avoid Top-Level Side Effects**: Do not write `console.log`, API calls, or event listener registrations outside of your component function (at the file's top level). These will execute immediately when the application starts, even if the user never navigates to that page. Always place initialization logic inside `useEffect` (React) or `onMounted` (Vue).
* **Always Clean Up**: Because it's a Single Page Application (SPA), JavaScript state persists across page transitions. If you register a `setInterval` or an event listener inside `useEffect` or `onMounted`, you must return a cleanup function to prevent memory leaks and unintended background execution on other pages.

---

## 🤝 Contribution Guide

Thank you for considering contributing to `city-gas`!

### Setting up the Development Environment

```bash
# Clone the repository
git clone https://github.com/luthpg/city-gas.git
cd city-gas

# Install dependencies (please use pnpm)
pnpm install

# Build the packages
pnpm build
```

### Running the Playground

The repository includes playgrounds for both React and Vue to test changes.

```bash
# Start the React playground
pnpm run dev:r

# Start the Vue playground
pnpm run dev:v
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run type checks
pnpm run check
```

### Pull Request Guidelines

1.  Create a branch for each feature or bug fix.
2.  Add tests corresponding to your changes.
3.  Write clear and concise commit messages.
4.  Ensure that `pnpm test` and `pnpm run check` pass before creating a PR.

---

## 📝 License

MIT License
