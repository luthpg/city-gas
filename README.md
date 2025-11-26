# @ciderjs/city-gas

[![README-ja](https://img.shields.io/badge/日本語-blue?logo=ReadMe)](README.ja.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/city-gas.svg)](https://www.npmjs.com/package/@ciderjs/city-gas)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/city-gas.svg)](https://github.com/luthpg/city-gas/issues)

**@ciderjs/city-gas** is a type-safe, file-based router for **React** and **Vue 3** that operates seamlessly in both **Google Apps Script (GAS)** and **modern browser** environments.

## ✨ Features

* 🚀 **Universal**: Works in both browser (`window.history`) and GAS (`google.script.history`) environments, automatically switching adapters.
* 📂 **File-based Routing**: Routes are automatically generated based on the structure of your `src/pages` directory.
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

## 🚀 Quick Start

### 1. Vite Configuration

Add the plugin to your `vite.config.ts`. This handles file watching and type generation.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { cityGasRouter } from '@ciderjs/city-gas/plugin';
// Choose the plugin for your framework
import react from '@vitejs/plugin-react';
// import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    react(), // or vue()
    cityGasRouter({
      pagesDir: 'src/pages', // defaults to 'src/pages'
    }),
  ],
});
```

### 2. Application Entry Point Setup

#### For React (`src/main.tsx`)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRouter } from '@ciderjs/city-gas';
import { RouterProvider } from '@ciderjs/city-gas/react';
// Import the automatically generated route definitions
import { pages, specialPages, dynamicRoutes } from './generated/routes';

// Initialize the router
const router = createRouter(pages, { specialPages, dynamicRoutes });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

#### For Vue (`src/main.ts`)

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

---

## 📖 Routing Guide

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

### Dynamic Routes

Use the naming convention `[paramName].tsx` to create dynamic routes and access path parameters.

```tsx
// src/pages/users/[userId].tsx
import { useParams } from '@ciderjs/city-gas/react';

export default function UserPage() {
  // Type Safe: userId is inferred as string
  const { userId } = useParams('/users/[userId]');
  return <div>User ID: {userId}</div>;
}
```

### Nested Layouts

Special filenames are used to achieve hierarchical layouts.

* **`_root.tsx`**: The highest-level layout wrapping the entire application.
* **`_layout.tsx`**: A layout applied to all routes within the directory it is placed in.
* **`_404.tsx`**: The component displayed when an undefined route is accessed.
* **`_loading.tsx`**: The component displayed during page transitions or initialization.

**Example: `src/pages/settings/_layout.tsx`**
```tsx
// React Example
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="settings-wrapper">
      <aside>Settings Sidebar</aside>
      <main>{children}</main>
    </div>
  );
}
```

---

## 🛡️ Parameter Definition and Validation (Zod)

By exporting a `schema` from your page component file, you can define the expected query parameters. This schema is used for both runtime validation and static type generation.

### React Example

```tsx
// src/pages/search.tsx
import { z } from 'zod';
import { useParams } from '@ciderjs/city-gas/react';

// Schema definition
export const schema = z.object({
  q: z.string(),
  page: z.coerce.number().optional(), // Coerce URL string to a number
  sort: z.enum(['date', 'relevance']).optional(),
});

export default function SearchPage() {
  // params is inferred as { q: string; page?: number; sort?: "date" | "relevance" }
  const params = useParams('/search');

  return (
    <div>
      <h1>Search: {params.q}</h1>
      <p>Page: {params.page ?? 1}</p>
    </div>
  );
}
```

### Vue Example

> [!NOTE]
> **Note for Vue Users**
> Since `export` statements are not strictly supported within Vue's `<script setup>` syntax for this purpose, you must define and export the `schema` within a separate, standard `<script>` block.

```vue
<script setup lang="ts">
import { useParams } from '@ciderjs/city-gas/vue';

// Use params ref in setup
const params = useParams('/search');
</script>

<script lang="ts">
import { z } from 'zod';

export const schema = z.object({
  q: z.string(),
  page: z.coerce.number().optional(),
  sort: z.enum(['date', 'relevance']).optional(),
});
</script>

<template>
  <div>
    <h1>Search: {{ params.q }}</h1>
    <p>Page: {{ params.page ?? 1 }}</p>
  </div>
</template>
```

> [!CAUTION]
> **URL Length Limitations (GAS Environment)**
> Google Apps Script (GAS) environments have strict URL length limits (approximately 2KB).
> Since this library serializes object parameters into JSON strings within the URL, passing large data structures may cause errors.
> For large datasets, consider using `PropertiesService`, `CacheService`, or a global state management library instead of passing them as route parameters.

> [!WARNING]
> If validation fails, the router automatically redirects to the `_404` page.

---

## 🧭 Navigation

Use the `useNavigate` hook to perform type-safe page transitions.

### React

```tsx
import { useNavigate } from '@ciderjs/city-gas/react';

const Component = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    // 1st argument: Route name (with autocomplete)
    // 2nd argument: Parameters (type-checked based on schema)
    navigate('/search/[id]', { id: '1', q: 'city-gas', page: 1 });
    
    // Optional replace flag
    // navigate('/', {}, { replace: true });
  };

  return <button onClick={handleClick}>Search</button>;
};
```

### Vue

```vue
<script setup lang="ts">
import { useNavigate } from '@ciderjs/city-gas/vue';

const navigate = useNavigate();

const handleClick = () => {
  navigate('/search', { q: 'city-gas', page: 1 });
};
</script>
```

---

## ⚙️ API Reference

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
